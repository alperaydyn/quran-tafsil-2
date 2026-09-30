/**
 * tafsil.net — Word Timestamp Alignment Service for Mobile App
 * 
 * 6236 ayetin tamamı için Alafasy stüdyo kayıtlarındaki
 * kesin kelime başlangıç (startMs) ve bitiş (endMs) damgalarını yönetir.
 */

import compactTimestamps from '../data/word_timestamps.compact.json';
import type { Word } from '../api/types';
import { getSurahTimestampUrl, getAyahTimestampUrl } from '../api/client';

const timestampMap = (compactTimestamps as unknown) as Record<string, [number, number][]>;

// Cloudflare R2'den dinamik olarak çekilen ve önbelleğe alınan zaman damgaları
const remoteTimestampsCache = new Map<string, [number, number][]>();
const pendingSurahFetches = new Map<number, Promise<boolean>>();

export const TimestampService = {
  /**
   * Belirli bir ayetin kelime zaman aralıklarını getirir.
   * Öncelik: 1. Cloudflare R2 önbelleği -> 2. Yerel compact snapshot (offline-first)
   * @param surahId Sure numarası (1-114)
   * @param ayahNo Ayet numarası
   * @returns [startMs, endMs][] dizisi
   */
  getAyahTimestamps(surahId: number, ayahNo: number): [number, number][] | null {
    const key = `${surahId}:${ayahNo}`;
    if (remoteTimestampsCache.has(key)) {
      return remoteTimestampsCache.get(key)!;
    }
    return timestampMap[key] || null;
  },

  /**
   * Bir sureye ait tüm ayetlerin kelime zaman damgalarını Cloudflare R2'den çeker ve önbelleğe alır.
   * @param surahId Sure no (1-114)
   */
  async fetchSurahTimestampsFromR2(surahId: number): Promise<boolean> {
    if (pendingSurahFetches.has(surahId)) {
      return pendingSurahFetches.get(surahId)!;
    }

    const fetchPromise = (async () => {
      try {
        const url = getSurahTimestampUrl(surahId);
        const res = await fetch(url);
        if (!res.ok) return false;

        const data = await res.json();
        if (Array.isArray(data.ayahs)) {
          for (const a of data.ayahs) {
            if (Array.isArray(a.words)) {
              const intervals: [number, number][] = a.words.map((w: any) => [w.startMs, w.endMs]);
              remoteTimestampsCache.set(`${surahId}:${a.ayah}`, intervals);
            }
          }
          return true;
        }
        return false;
      } catch (e) {
        // Ağ kesintisi veya R2 erişim hatasında yerel snapshot devrede kalır
        return false;
      } finally {
        pendingSurahFetches.delete(surahId);
      }
    })();

    pendingSurahFetches.set(surahId, fetchPromise);
    return fetchPromise;
  },

  /**
   * Tek bir ayetin zaman damgasını Cloudflare R2'den çeker.
   */
  async fetchAyahTimestampsFromR2(surahId: number, ayahNo: number): Promise<boolean> {
    const key = `${surahId}:${ayahNo}`;
    if (remoteTimestampsCache.has(key)) return true;

    try {
      const url = getAyahTimestampUrl(surahId, ayahNo);
      const res = await fetch(url);
      if (!res.ok) return false;

      const data = await res.json();
      if (Array.isArray(data.words)) {
        const intervals: [number, number][] = data.words.map((w: any) => [w.startMs, w.endMs]);
        remoteTimestampsCache.set(key, intervals);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Bir ayetin Word dizisini gerçek zaman damgalarıyla zenginleştirir.
   * @param surahId Sure no
   * @param ayahNo Ayet no
   * @param words Mevcut Word dizisi
   */
  enrichWordsWithTimestamps(surahId: number, ayahNo: number, words: Word[]): Word[] {
    const intervals = this.getAyahTimestamps(surahId, ayahNo);
    if (!intervals || intervals.length === 0) {
      return words;
    }

    return words.map((w, idx) => {
      // Eğer kelimenin zaten geçerli bir zaman damgası varsa koru
      if (w.startMs > 0 || (w.endMs > 0 && w.endMs > w.startMs)) {
        return w;
      }

      // İndekse göre zaman aralığını eşleştir
      const interval = intervals[idx];
      if (interval) {
        return {
          ...w,
          startMs: interval[0],
          endMs: interval[1],
        };
      }

      return w;
    });
  }
};
