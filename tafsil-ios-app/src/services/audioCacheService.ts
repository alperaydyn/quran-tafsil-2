import * as FileSystem from 'expo-file-system/legacy';
import { getAyahAudioUrl } from '../api/client';
import { trackFlow } from './diagnostics/dataFlowMonitor';

export interface SurahCacheInfo {
  isDownloaded: boolean;
  downloadedCount: number;
  totalVerses: number;
  totalBytes: number;
}

export interface DownloadProgressCallback {
  (progress: number, downloadedCount: number, totalVerses: number, totalBytes: number): void;
}

class AudioCacheService {
  private baseDir: string;
  private activeCancellations: Map<number, boolean> = new Map();

  constructor() {
    const root = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
    this.baseDir = `${root}tafsil_audio/`;
  }

  /**
   * Kök ses önbellek dizininin varlığını garantiye alır.
   */
  private async ensureBaseDir(): Promise<void> {
    try {
      const info = await FileSystem.getInfoAsync(this.baseDir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(this.baseDir, { intermediates: true });
      }
    } catch (e) {
      console.warn('[AudioCacheService] ensureBaseDir error:', e);
    }
  }

  /**
   * Belirtilen sure klasörünün varlığını garantiye alır.
   */
  private async ensureSurahDir(surahId: number): Promise<string> {
    await this.ensureBaseDir();
    const surahDir = `${this.baseDir}surah_${surahId}/`;
    try {
      const info = await FileSystem.getInfoAsync(surahDir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(surahDir, { intermediates: true });
      }
    } catch (e) {
      console.warn(`[AudioCacheService] ensureSurahDir(${surahId}) error:`, e);
    }
    return surahDir;
  }

  /**
   * Ayetin yerel dosya yolu (URI).
   */
  getLocalAyahUri(surahId: number, ayahNo: number): string {
    return `${this.baseDir}surah_${surahId}/${ayahNo}.mp3`;
  }

  /**
   * Ayetin yerelde indirilmiş olup olmadığını ve geçerli boyutunu kontrol eder.
   */
  async isAyahCached(surahId: number, ayahNo: number): Promise<boolean> {
    try {
      const uri = this.getLocalAyahUri(surahId, ayahNo);
      const info = await FileSystem.getInfoAsync(uri);
      return Boolean(info.exists && (info.size ?? 0) > 1000);
    } catch {
      return false;
    }
  }

  /**
   * Oynatıcı için en uygun URI'yi döner:
   * Eğer ayet yerel depoda varsa `file://...` URI'sini, yoksa uzak R2 CDN URL'sini döner.
   */
  async resolveAyahAudioUri(surahId: number, ayahNo: number, fallbackUrl?: string): Promise<string> {
    const isCached = await this.isAyahCached(surahId, ayahNo);
    if (isCached) {
      trackFlow('L5_FILE', 'hit', `audio:${surahId}:${ayahNo}`, { detail: 'yerel mp3' });
      return this.getLocalAyahUri(surahId, ayahNo);
    }
    trackFlow('L5_FILE', 'miss', `audio:${surahId}:${ayahNo}`, { detail: 'CDN stream' });
    return fallbackUrl || getAyahAudioUrl(surahId, ayahNo);
  }

  /**
   * Bir surenin önbellek ve indirilme durumunu denetler.
   */
  async getSurahCacheInfo(surahId: number, totalVerses: number): Promise<SurahCacheInfo> {
    try {
      const surahDir = `${this.baseDir}surah_${surahId}/`;
      const dirInfo = await FileSystem.getInfoAsync(surahDir);

      if (!dirInfo.exists) {
        return { isDownloaded: false, downloadedCount: 0, totalVerses, totalBytes: 0 };
      }

      let downloadedCount = 0;
      let totalBytes = 0;

      for (let ayah = 1; ayah <= totalVerses; ayah++) {
        const fileUri = `${surahDir}${ayah}.mp3`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists && (fileInfo.size ?? 0) > 1000) {
          downloadedCount++;
          totalBytes += fileInfo.size ?? 0;
        }
      }

      const isDownloaded = downloadedCount === totalVerses && totalVerses > 0;
      return { isDownloaded, downloadedCount, totalVerses, totalBytes };
    } catch (e) {
      console.warn(`[AudioCacheService] getSurahCacheInfo(${surahId}) error:`, e);
      return { isDownloaded: false, downloadedCount: 0, totalVerses, totalBytes: 0 };
    }
  }

  /**
   * Seçilen sureyi internetsiz dinlemek üzere tek tuşla cihaz belleğine indirir (PBI-2.10).
   * 4 eşzamanlı iş parçacığıyla (concurrency) hızlı indirme ve anlık ilerleme sağlar.
   */
  async downloadSurahAudio(
    surahId: number,
    totalVerses: number,
    onProgress?: DownloadProgressCallback
  ): Promise<{ success: boolean; cancelled?: boolean; error?: string }> {
    this.activeCancellations.set(surahId, false);
    const surahDir = await this.ensureSurahDir(surahId);

    let downloadedCount = 0;
    let totalBytes = 0;

    // Önce mevcut dosyaları say
    for (let ayah = 1; ayah <= totalVerses; ayah++) {
      const fileUri = `${surahDir}${ayah}.mp3`;
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists && (info.size ?? 0) > 1000) {
        downloadedCount++;
        totalBytes += info.size ?? 0;
      }
    }

    if (downloadedCount === totalVerses && totalVerses > 0) {
      onProgress?.(1.0, totalVerses, totalVerses, totalBytes);
      return { success: true };
    }

    onProgress?.(downloadedCount / totalVerses, downloadedCount, totalVerses, totalBytes);

    // İndirilecek ayetlerin listesi
    const ayahsToDownload: number[] = [];
    for (let ayah = 1; ayah <= totalVerses; ayah++) {
      const fileUri = `${surahDir}${ayah}.mp3`;
      const info = await FileSystem.getInfoAsync(fileUri);
      if (!info.exists || (info.size ?? 0) <= 1000) {
        ayahsToDownload.push(ayah);
      }
    }

    // Eşzamanlı (concurrency: 3) indirme havuzu
    const CONCURRENCY = 3;
    let nextIndex = 0;
    let hasError: string | undefined;

    const worker = async () => {
      while (nextIndex < ayahsToDownload.length && !hasError) {
        if (this.activeCancellations.get(surahId)) {
          return;
        }

        const currentIndex = nextIndex++;
        const ayahNo = ayahsToDownload[currentIndex];
        const remoteUrl = getAyahAudioUrl(surahId, ayahNo);
        const targetUri = `${surahDir}${ayahNo}.mp3`;

        const started = Date.now();
        try {
          const result = await FileSystem.downloadAsync(remoteUrl, targetUri);
          if (result.status === 200) {
            const fileInfo = await FileSystem.getInfoAsync(targetUri);
            const size = fileInfo.exists ? fileInfo.size ?? 0 : 0;
            totalBytes += size;
            downloadedCount++;
            trackFlow('NET_CDN', 'download', `audio:${surahId}:${ayahNo}`, { bytes: size, durationMs: Date.now() - started });
            trackFlow('L5_FILE', 'write', `tafsil_audio/surah_${surahId}`, { bytes: size, detail: `${ayahNo}.mp3` });
            onProgress?.(downloadedCount / totalVerses, downloadedCount, totalVerses, totalBytes);
          } else {
            trackFlow('NET_CDN', 'download', `audio:${surahId}:${ayahNo}`, { status: 'error', detail: `HTTP ${result.status}` });
            console.warn(`[AudioCacheService] Ayah ${surahId}:${ayahNo} HTTP ${result.status}`);
          }
        } catch (err: any) {
          trackFlow('NET_CDN', 'download', `audio:${surahId}:${ayahNo}`, { status: 'error', detail: String(err?.message ?? err).slice(0, 100) });
          console.warn(`[AudioCacheService] Ayah ${surahId}:${ayahNo} indirme hatası:`, err);
          // Tekil ayet hatası tüm surenin indirilmesini tamamen kesmez, devam eder
        }
      }
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, ayahsToDownload.length) }, () => worker());
    await Promise.all(workers);

    if (this.activeCancellations.get(surahId)) {
      this.activeCancellations.delete(surahId);
      return { success: false, cancelled: true };
    }

    this.activeCancellations.delete(surahId);
    const finalInfo = await this.getSurahCacheInfo(surahId, totalVerses);
    return { success: finalInfo.isDownloaded, error: hasError };
  }

  /**
   * Devam eden sure indirme işlemini durdurur.
   */
  cancelDownload(surahId: number): void {
    this.activeCancellations.set(surahId, true);
  }

  /**
   * Bir surenin indirilmiş ses dosyalarını yerel bellekten siler.
   */
  async deleteSurahAudio(surahId: number): Promise<void> {
    try {
      this.cancelDownload(surahId);
      const surahDir = `${this.baseDir}surah_${surahId}/`;
      const info = await FileSystem.getInfoAsync(surahDir);
      if (info.exists) {
        await FileSystem.deleteAsync(surahDir, { idempotent: true });
        trackFlow('L5_FILE', 'delete', `tafsil_audio/surah_${surahId}`);
      }
    } catch (e) {
      console.warn(`[AudioCacheService] deleteSurahAudio(${surahId}) error:`, e);
    }
  }

  /**
   * Tüm ses önbelleğini temizler.
   */
  async clearAllCache(): Promise<void> {
    try {
      const info = await FileSystem.getInfoAsync(this.baseDir);
      if (info.exists) {
        await FileSystem.deleteAsync(this.baseDir, { idempotent: true });
        trackFlow('L5_FILE', 'delete', 'tafsil_audio/*');
      }
    } catch (e) {
      console.warn('[AudioCacheService] clearAllCache error:', e);
    }
  }

  /**
   * Tüm ses önbelleğinin sure bazında dosya sayısı ve boyutu (tanılama envanteri).
   */
  async getTotalCacheInfo(): Promise<{ totalBytes: number; fileCount: number; surahs: Array<{ surahId: number; files: number; bytes: number }> }> {
    const result = { totalBytes: 0, fileCount: 0, surahs: [] as Array<{ surahId: number; files: number; bytes: number }> };
    try {
      const info = await FileSystem.getInfoAsync(this.baseDir);
      if (!info.exists) return result;
      const dirs = await FileSystem.readDirectoryAsync(this.baseDir);
      for (const dir of dirs) {
        const m = dir.match(/^surah_(\d+)$/);
        if (!m) continue;
        const files = await FileSystem.readDirectoryAsync(`${this.baseDir}${dir}/`);
        let bytes = 0;
        for (const f of files) {
          const fi = await FileSystem.getInfoAsync(`${this.baseDir}${dir}/${f}`);
          if (fi.exists) bytes += fi.size ?? 0;
        }
        result.surahs.push({ surahId: Number(m[1]), files: files.length, bytes });
        result.totalBytes += bytes;
        result.fileCount += files.length;
      }
      result.surahs.sort((a, b) => b.bytes - a.bytes);
    } catch (e) {
      console.warn('[AudioCacheService] getTotalCacheInfo error:', e);
    }
    return result;
  }
}

export const audioCacheService = new AudioCacheService();
