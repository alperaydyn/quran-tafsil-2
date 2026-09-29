/**
 * tafsil.net — Word Timestamp Alignment Service for Mobile App
 * 
 * 6236 ayetin tamamı için Alafasy stüdyo kayıtlarındaki
 * kesin kelime başlangıç (startMs) ve bitiş (endMs) damgalarını yönetir.
 */

import compactTimestamps from '../data/word_timestamps.compact.json';
import type { Word } from '../api/types';

const timestampMap = (compactTimestamps as unknown) as Record<string, [number, number][]>;

export const TimestampService = {
  /**
   * Belirli bir ayetin kelime zaman aralıklarını getirir.
   * @param surahId Sure numarası (1-114)
   * @param ayahNo Ayet numarası
   * @returns [startMs, endMs][] dizisi
   */
  getAyahTimestamps(surahId: number, ayahNo: number): [number, number][] | null {
    const key = `${surahId}:${ayahNo}`;
    return timestampMap[key] || null;
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
