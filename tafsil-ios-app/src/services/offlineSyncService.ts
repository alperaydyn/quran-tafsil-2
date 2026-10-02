import { mmkvStorage } from '../store/mmkvStorage';
import { mockSurahs } from '../api/mock/surahs.mock';
import { localDbService } from './localDbService';
import { API_BASE } from '../api/config';

const BOOKMARKS_KEY = 'tafsil_offline_bookmarks';
const HISTORY_KEY = 'tafsil_offline_history';
const CONCEPT_HISTORY_KEY = 'tafsil_offline_concept_history';
const MEMORIZATION_HISTORY_KEY = 'tafsil_offline_memorization_history';
const LAST_SYNC_KEY = 'tafsil_last_sync_timestamp';
const DAILY_COUNTS_KEY = 'tafsil_daily_verse_counts';

export interface OfflineBookmark {
  sure_id: number;
  ayet_no: number;
  etiket?: string;
  notlar?: string;
  updated_at: string;
}

export interface OfflineHistoryItem {
  sure_id: number;
  ayet_no: number;
  okunma_suresi_sn: number;
  okundu_tarihi: string;
}

export interface OfflineConceptItem {
  kavram_slug: string;
  kavram_adi: string;
  incelenme_suresi_sn: number;
  created_at: string;
}

export interface OfflineMemorizationItem {
  id: string;
  sure_id: number;
  baslangic_ayet: number;
  bitis_ayet: number;
  durum: string;
  baslik?: string;
  created_at: string;
}

export interface TimelineSurahItem {
  type: 'surah_reading';
  sure_id: number;
  sure_adi: string;
  ayet_araliklari: string;
  etiket: string; // Örnek: "Fatiha (1-7)", "Bakara (12-25, 45-67)"
  toplam_ayet: number;
  toplam_sure_sn: number;
}

export interface TimelineConceptItem {
  type: 'concept';
  kavram_slug: string;
  kavram_adi: string;
  etiket: string; // Örnek: "Kavram: Rab"
  toplam_sure_sn: number;
  time: string;
}

export interface TimelineMemorizationItem {
  type: 'memorization';
  oturum_id: string;
  oturum_adi: string;
  etiket: string; // Örnek: "Ezber: Oturum Adı"
  sure_adi: string;
  aralik: string;
  durum: string;
  time: string;
}

export interface TimelineDayGroup {
  date: string;
  title: string;
  total_items: number;
  surah_readings: TimelineSurahItem[];
  concepts: TimelineConceptItem[];
  memorizations: TimelineMemorizationItem[];
}

export interface ReadingTimelineResult {
  days: TimelineDayGroup[];
  summary: {
    total_days: number;
    total_verses: number;
    total_concepts: number;
    total_memorizations: number;
  };
}

export function formatVerseRanges(ayahs: number[]): string {
  if (!ayahs || ayahs.length === 0) return '';
  const sorted = Array.from(new Set(ayahs)).sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = current;
      prev = current;
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(', ');
}

export class OfflineSyncService {
  static async getBookmarks(): Promise<OfflineBookmark[]> {
    try {
      const raw = await mmkvStorage.getItem(BOOKMARKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static async addBookmark(sureId: number, ayetNo: number, etiket: string = 'Genel', notlar?: string): Promise<void> {
    const list = await this.getBookmarks();
    const existingIndex = list.findIndex((b) => b.sure_id === sureId && b.ayet_no === ayetNo);
    const item: OfflineBookmark = {
      sure_id: sureId,
      ayet_no: ayetNo,
      etiket,
      notlar,
      updated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.push(item);
    }
    await mmkvStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
  }

  static async removeBookmark(sureId: number, ayetNo: number): Promise<void> {
    let list = await this.getBookmarks();
    list = list.filter((b) => !(b.sure_id === sureId && b.ayet_no === ayetNo));
    await mmkvStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
  }

  static async isBookmarked(sureId: number, ayetNo: number): Promise<boolean> {
    const list = await this.getBookmarks();
    return list.some((b) => b.sure_id === sureId && b.ayet_no === ayetNo);
  }

  static async recordReading(sureId: number, ayetNo: number, durationSeconds: number = 30): Promise<void> {
    try {
      const today = new Date().toISOString().slice(0, 10);

      // 1. Günlük ayet sayacı güncellemesi
      const rawDaily = await mmkvStorage.getItem(DAILY_COUNTS_KEY);
      const dailyMap: Record<string, number> = rawDaily ? JSON.parse(rawDaily) : {};
      dailyMap[today] = (dailyMap[today] ?? 0) + 1;
      await mmkvStorage.setItem(DAILY_COUNTS_KEY, JSON.stringify(dailyMap));

      // 2. Ayrıntılı geçmiş listesi
      const raw = await mmkvStorage.getItem(HISTORY_KEY);
      const list: OfflineHistoryItem[] = raw ? JSON.parse(raw) : [];
      list.push({
        sure_id: sureId,
        ayet_no: ayetNo,
        okunma_suresi_sn: durationSeconds,
        okundu_tarihi: new Date().toISOString(),
      });
      await mmkvStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(-500)));

      // 3. Yerel SQLite ilişkisel log tablosuna da kaydet
      localDbService.logReading(sureId, ayetNo, durationSeconds);

      // 4. Arka planda sunucuya debounced senkronizasyon gönder (kullanıcı oturumu için)
      this.triggerDebouncedSync();
    } catch {
      // ignore
    }
  }

  private static syncTimeout: any = null;

  /**
   * Kullanıcı okuma veya işlem yaptıkça arka planda sunucuya yığmadan (debounced) senkronize eder.
   */
  static triggerDebouncedSync(delayMs: number = 2500): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    this.syncTimeout = setTimeout(() => {
      this.syncWithServer().catch(() => {});
    }, delayMs);
  }

  static async recordConceptStudy(slug: string, name: string, durationSeconds: number = 60): Promise<void> {
    try {
      const raw = await mmkvStorage.getItem(CONCEPT_HISTORY_KEY);
      const list: OfflineConceptItem[] = raw ? JSON.parse(raw) : [];
      list.push({
        kavram_slug: slug,
        kavram_adi: name,
        incelenme_suresi_sn: durationSeconds,
        created_at: new Date().toISOString(),
      });
      await mmkvStorage.setItem(CONCEPT_HISTORY_KEY, JSON.stringify(list.slice(-200)));
    } catch {
      // ignore
    }
  }

  static async recordMemorizationSession(item: OfflineMemorizationItem): Promise<void> {
    try {
      const raw = await mmkvStorage.getItem(MEMORIZATION_HISTORY_KEY);
      const list: OfflineMemorizationItem[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((m) => m.id === item.id);
      if (idx >= 0) {
        list[idx] = item;
      } else {
        list.push(item);
      }
      await mmkvStorage.setItem(MEMORIZATION_HISTORY_KEY, JSON.stringify(list.slice(-100)));
    } catch {
      // ignore
    }
  }

  static async getDailyCounts(): Promise<Record<string, number>> {
    try {
      const rawDaily = await mmkvStorage.getItem(DAILY_COUNTS_KEY);
      const dailyMap: Record<string, number> = rawDaily ? JSON.parse(rawDaily) : {};

      // HISTORY_KEY ile birleştir
      const raw = await mmkvStorage.getItem(HISTORY_KEY);
      const list: OfflineHistoryItem[] = raw ? JSON.parse(raw) : [];
      list.forEach((item) => {
        if (item.okundu_tarihi) {
          const d = item.okundu_tarihi.slice(0, 10);
          if (!dailyMap[d]) dailyMap[d] = 0;
        }
      });
      return dailyMap;
    } catch {
      return {};
    }
  }

  static async getWateredWeeksCount(): Promise<number> {
    try {
      const dailyCounts = await this.getDailyCounts();
      const weeksSet = new Set<string>();
      Object.entries(dailyCounts).forEach(([dateStr, count]) => {
        if (count > 0) {
          const date = new Date(dateStr);
          const oneJan = new Date(date.getFullYear(), 0, 1);
          const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
          const weekNo = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
          weeksSet.add(`${date.getFullYear()}-W${weekNo}`);
        }
      });
      return weeksSet.size;
    } catch {
      return 0;
    }
  }

  static async getTodayReadCount(): Promise<number> {
    try {
      const dailyCounts = await this.getDailyCounts();
      const todayPrefix = new Date().toISOString().slice(0, 10);
      return dailyCounts[todayPrefix] ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Hem çevrimiçi backend hem de çevrimdışı yerel MMKV verilerini harmanlayarak
   * gün gün gruplanmış kusursuz okuma geçmişi döner.
   */
  static async getReadingTimeline(
    apiBaseUrl: string = API_BASE,
    token?: string,
    userId?: string
  ): Promise<ReadingTimelineResult> {
    let effectiveToken = token;
    let effectiveUserId = userId;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useAuthStore } = require('../store/useAuthStore');
      const auth = useAuthStore.getState();
      effectiveToken = effectiveToken || auth.token;
      effectiveUserId = effectiveUserId || auth.user?.id;
    } catch {}

    // 1. Backend'den çekmeyi dene
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const url = effectiveUserId
        ? `${apiBaseUrl}/sync/reading-history?user_id=${encodeURIComponent(effectiveUserId)}`
        : `${apiBaseUrl}/sync/reading-history`;
      const headers: Record<string, string> = {};
      if (effectiveToken) {
        headers['Authorization'] = `Bearer ${effectiveToken}`;
      }
      const res = await fetch(url, {
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json?.data?.days && json.data.days.length > 0) {
          return json.data;
        }
      }
    } catch {
      // Backend kapalı veya erişilemezse yerel hesaplamaya devam
    }

    // 2. Yerel MMKV verilerini derle
    try {
      const rawHistory = await mmkvStorage.getItem(HISTORY_KEY);
      const historyList: OfflineHistoryItem[] = rawHistory ? JSON.parse(rawHistory) : [];

      const rawConcepts = await mmkvStorage.getItem(CONCEPT_HISTORY_KEY);
      const conceptList: OfflineConceptItem[] = rawConcepts ? JSON.parse(rawConcepts) : [];

      const rawMemorization = await mmkvStorage.getItem(MEMORIZATION_HISTORY_KEY);
      const memorizationList: OfflineMemorizationItem[] = rawMemorization ? JSON.parse(rawMemorization) : [];

      // Eğer cihazda henüz hiç okuma yoksa boş timeline dön (asla sahte/örnek veri gösterme)
      if (historyList.length === 0 && conceptList.length === 0 && memorizationList.length === 0) {
        return {
          days: [],
          summary: {
            total_days: 0,
            total_verses: 0,
            total_concepts: 0,
            total_memorizations: 0,
          },
        };
      }

      // Tarih gruplaması
      const dayGroups: Record<
        string,
        {
          date: string;
          versesBySurah: Record<number, { sure_adi: string; ayahs: number[]; duration: number }>;
          concepts: Array<{ slug: string; name: string; duration: number; time: string }>;
          memorizations: Array<{ id: string; title: string; surah: string; range: string; status: string; time: string }>;
        }
      > = {};

      const getDayBucket = (dateStr: string) => {
        const d = new Date(dateStr).toISOString().slice(0, 10);
        if (!dayGroups[d]) {
          dayGroups[d] = {
            date: d,
            versesBySurah: {},
            concepts: [],
            memorizations: [],
          };
        }
        return dayGroups[d];
      };

      // Ayetleri grupla
      for (const h of historyList) {
        const bucket = getDayBucket(h.okundu_tarihi);
        if (!bucket.versesBySurah[h.sure_id]) {
          const surahObj = mockSurahs.find((s) => s.id === h.sure_id);
          bucket.versesBySurah[h.sure_id] = {
            sure_adi: surahObj?.nameTr || `${h.sure_id}. Sure`,
            ayahs: [],
            duration: 0,
          };
        }
        bucket.versesBySurah[h.sure_id].ayahs.push(h.ayet_no);
        bucket.versesBySurah[h.sure_id].duration += h.okunma_suresi_sn || 0;
      }

      // Kavramları grupla
      for (const c of conceptList) {
        const bucket = getDayBucket(c.created_at);
        const timeStr = new Date(c.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        bucket.concepts.push({
          slug: c.kavram_slug,
          name: c.kavram_adi,
          duration: c.incelenme_suresi_sn,
          time: timeStr,
        });
      }

      // Ezberleri grupla
      for (const m of memorizationList) {
        const bucket = getDayBucket(m.created_at);
        const timeStr = new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const surahObj = mockSurahs.find((s) => s.id === m.sure_id);
        const surahName = surahObj?.nameTr || `${m.sure_id}. Sure`;
        const sessionTitle = m.baslik || `${surahName} (${m.baslangic_ayet}-${m.bitis_ayet}) Ezber Oturumu`;
        bucket.memorizations.push({
          id: m.id,
          title: sessionTitle,
          surah: surahName,
          range: `${m.baslangic_ayet}-${m.bitis_ayet}`,
          status: m.durum,
          time: timeStr,
        });
      }

      const sortedDays = Object.keys(dayGroups).sort((a, b) => b.localeCompare(a));
      const todayStr = new Date().toISOString().slice(0, 10);
      const yesterdayDate = new Date(Date.now() - 86400000);
      const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

      const timeline: TimelineDayGroup[] = sortedDays.map((d) => {
        const group = dayGroups[d];
        let dayTitle = d;
        if (d === todayStr) {
          dayTitle = 'Bugün';
        } else if (d === yesterdayStr) {
          dayTitle = 'Dün';
        } else {
          const parsed = new Date(d);
          dayTitle = parsed.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
        }

        const surahItems: TimelineSurahItem[] = Object.entries(group.versesBySurah).map(([sureIdStr, s]) => {
          const rangeText = formatVerseRanges(s.ayahs);
          return {
            type: 'surah_reading',
            sure_id: Number(sureIdStr),
            sure_adi: s.sure_adi,
            ayet_araliklari: rangeText,
            etiket: `${s.sure_adi} (${rangeText})`,
            toplam_ayet: Array.from(new Set(s.ayahs)).length,
            toplam_sure_sn: s.duration,
          };
        });

        const conceptItems: TimelineConceptItem[] = group.concepts.map((c) => ({
          type: 'concept',
          kavram_slug: c.slug,
          kavram_adi: c.name,
          etiket: `Kavram: ${c.name}`,
          toplam_sure_sn: c.duration,
          time: c.time,
        }));

        const memorizationItems: TimelineMemorizationItem[] = group.memorizations.map((m) => ({
          type: 'memorization',
          oturum_id: m.id,
          oturum_adi: m.title,
          etiket: `Ezber: ${m.title}`,
          sure_adi: m.surah,
          aralik: m.range,
          durum: m.status,
          time: m.time,
        }));

        return {
          date: d,
          title: dayTitle,
          total_items: surahItems.length + conceptItems.length + memorizationItems.length,
          surah_readings: surahItems,
          concepts: conceptItems,
          memorizations: memorizationItems,
        };
      });

      const totalVersesInDays = timeline.reduce(
        (acc, day) => acc + day.surah_readings.reduce((sAcc, s) => sAcc + s.toplam_ayet, 0),
        0
      );

      return {
        days: timeline,
        summary: {
          total_days: sortedDays.length,
          total_verses: totalVersesInDays,
          total_concepts: conceptList.length,
          total_memorizations: memorizationList.length,
        },
      };
    } catch {
      return {
        days: [],
        summary: {
          total_days: 0,
          total_verses: 0,
          total_concepts: 0,
          total_memorizations: 0,
        },
      };
    }
  }

  static async clearHistory(): Promise<void> {
    try {
      await mmkvStorage.removeItem(HISTORY_KEY);
      await mmkvStorage.removeItem(CONCEPT_HISTORY_KEY);
      await mmkvStorage.removeItem(MEMORIZATION_HISTORY_KEY);
      await mmkvStorage.removeItem(DAILY_COUNTS_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Kullanıcı çıkış yaptığında veya oturum değiştiğinde tüm yerel kullanıcı verilerini ve
   * mağazalarını temizler.
   */
  static async clearAllLocalUserData(): Promise<void> {
    try {
      await mmkvStorage.removeItem(BOOKMARKS_KEY);
      await mmkvStorage.removeItem(HISTORY_KEY);
      await mmkvStorage.removeItem(CONCEPT_HISTORY_KEY);
      await mmkvStorage.removeItem(MEMORIZATION_HISTORY_KEY);
      await mmkvStorage.removeItem(DAILY_COUNTS_KEY);
      await mmkvStorage.removeItem(LAST_SYNC_KEY);

      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useReadingProgressStore } = require('../store/useReadingProgressStore');
        useReadingProgressStore.getState().resetProgress?.();
      } catch {}

      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useMemorizationStore } = require('../store/useMemorizationStore');
        useMemorizationStore.getState().resetSessions?.();
      } catch {}
    } catch {
      // ignore
    }
  }

  static async syncWithServer(
    apiBaseUrl: string = API_BASE,
    token?: string,
    userId?: string,
    options?: { forceFullSync?: boolean }
  ): Promise<boolean> {
    let effectiveToken = token;
    let effectiveUserId = userId;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useAuthStore } = require('../store/useAuthStore');
      const auth = useAuthStore.getState();
      effectiveToken = effectiveToken || auth.token;
      effectiveUserId = effectiveUserId || auth.user?.id;
    } catch {}

    try {
      const bookmarks = await this.getBookmarks();
      const rawHistory = await mmkvStorage.getItem(HISTORY_KEY);
      const history: OfflineHistoryItem[] = rawHistory ? JSON.parse(rawHistory) : [];

      const rawConcepts = await mmkvStorage.getItem(CONCEPT_HISTORY_KEY);
      const concepts = rawConcepts ? JSON.parse(rawConcepts) : [];

      const rawMemorization = await mmkvStorage.getItem(MEMORIZATION_HISTORY_KEY);
      const memorization = rawMemorization ? JSON.parse(rawMemorization) : [];

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (effectiveToken) {
        headers['Authorization'] = `Bearer ${effectiveToken}`;
      }

      // 1. Yerel verileri sunucuya PUSH et
      if (bookmarks.length > 0 || history.length > 0 || concepts.length > 0 || memorization.length > 0) {
        await fetch(`${apiBaseUrl}/sync/push`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            user_id: effectiveUserId || undefined,
            bookmarks,
            reading_history: history,
            concept_history: concepts,
            memorization_sessions: memorization,
          }),
        });
      }

      // 2. Sunucudaki güncel kullanıcı verilerini PULL et
      const lastSync = options?.forceFullSync ? null : await mmkvStorage.getItem(LAST_SYNC_KEY);
      const pullRes = await fetch(`${apiBaseUrl}/sync/pull`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: effectiveUserId || undefined,
          last_synced_at: lastSync || undefined,
        }),
      });

      if (pullRes.ok) {
        const pulled = await pullRes.json();
        const data = pulled?.data;

        // Yer İmleri Birleştirme
        if (data?.bookmarks && Array.isArray(data.bookmarks)) {
          const map = new Map<string, OfflineBookmark>();
          bookmarks.forEach((b) => map.set(`${b.sure_id}:${b.ayet_no}`, b));
          data.bookmarks.forEach((b: OfflineBookmark) => map.set(`${b.sure_id}:${b.ayet_no}`, b));
          await mmkvStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(map.values())));
        }

        // Okuma Geçmişi ve İstatistik Birleştirme
        if (data?.reading_history && Array.isArray(data.reading_history)) {
          const historyMap = new Map<string, OfflineHistoryItem>();
          history.forEach((h: OfflineHistoryItem) => historyMap.set(`${h.sure_id}:${h.ayet_no}`, h));
          data.reading_history.forEach((h: any) => historyMap.set(`${h.sure_id}:${h.ayet_no}`, h));
          const mergedHistory = Array.from(historyMap.values());
          await mmkvStorage.setItem(HISTORY_KEY, JSON.stringify(mergedHistory.slice(-500)));

          // Günlük sayaç haritasını (DAILY_COUNTS_KEY) güncel geçmişe göre yeniden oluştur
          const dailyMap: Record<string, number> = {};
          mergedHistory.forEach((item) => {
            if (item.okundu_tarihi) {
              const d = item.okundu_tarihi.slice(0, 10);
              dailyMap[d] = (dailyMap[d] ?? 0) + 1;
            }
          });
          await mmkvStorage.setItem(DAILY_COUNTS_KEY, JSON.stringify(dailyMap));

          // useReadingProgressStore içine aktar (Diğer emülatörde okunan ayetleri ve istatistikleri senkronize et)
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { useReadingProgressStore } = require('../store/useReadingProgressStore');
            useReadingProgressStore.getState().bulkMergeReadingHistory(mergedHistory);
          } catch (e) {
            console.warn('[OfflineSync] reading store merge hatası:', e);
          }
        }

        // Ezber Oturumları Birleştirme
        if (data?.memorization_sessions && Array.isArray(data.memorization_sessions)) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { useMemorizationStore } = require('../store/useMemorizationStore');
            useMemorizationStore.getState().bulkMergeSessions(data.memorization_sessions);
          } catch (e) {
            console.warn('[OfflineSync] memorization store merge hatası:', e);
          }
        }

        // Kavram Geçmişi Birleştirme
        if (data?.concept_history && Array.isArray(data.concept_history)) {
          const conceptMap = new Map<string, OfflineConceptItem>();
          concepts.forEach((c: OfflineConceptItem) => conceptMap.set(c.kavram_slug, c));
          data.concept_history.forEach((c: any) => conceptMap.set(c.kavram_slug, c));
          await mmkvStorage.setItem(CONCEPT_HISTORY_KEY, JSON.stringify(Array.from(conceptMap.values()).slice(-200)));
        }
      }

      await mmkvStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      return true;
    } catch (err) {
      console.warn('[OfflineSyncService.syncWithServer] Senkronizasyon hatası:', err);
      return false;
    }
  }
}

