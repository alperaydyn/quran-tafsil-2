import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage';

export interface LastReadPosition {
  surahId: number;
  ayahNo: number;
  updatedAt: string; // ISO-8601
}

interface StreakInfo {
  current: number;
  longest: number;
  lastActiveDate: string | null; // ISO date (YYYY-MM-DD)
}

interface ReadingProgressState {
  lastRead: LastReadPosition | null;
  /** sureId -> okunan ayet numaralarının seti (114 sure ısı haritası matrisi için). */
  readVersesBySurah: Record<number, number[]>;
  streak: StreakInfo;

  markVerseRead: (surahId: number, ayahNo: number, today: string) => void;
  setLastRead: (surahId: number, ayahNo: number, updatedAt: string) => void;
  isSurahStarted: (surahId: number) => boolean;
  getSurahProgress: (surahId: number, totalAyahs: number) => number;
}

export const useReadingProgressStore = create<ReadingProgressState>()(
  persist(
    (set, get) => ({
      lastRead: null,
      readVersesBySurah: {},
      streak: { current: 0, longest: 0, lastActiveDate: null },

      setLastRead: (surahId, ayahNo, updatedAt) =>
        set({ lastRead: { surahId, ayahNo, updatedAt } }),

      markVerseRead: (surahId, ayahNo, today) =>
        set((state) => {
          const existing = state.readVersesBySurah[surahId] ?? [];
          const nextSet = existing.includes(ayahNo) ? existing : [...existing, ayahNo];

          const { current, longest, lastActiveDate } = state.streak;
          let nextCurrent = current;
          if (lastActiveDate !== today) {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const wasYesterday = lastActiveDate === yesterday.toISOString().slice(0, 10);
            nextCurrent = wasYesterday ? current + 1 : 1;
          }

          return {
            readVersesBySurah: { ...state.readVersesBySurah, [surahId]: nextSet },
            streak: {
              current: nextCurrent,
              longest: Math.max(longest, nextCurrent),
              lastActiveDate: today,
            },
          };
        }),

      isSurahStarted: (surahId) => (get().readVersesBySurah[surahId]?.length ?? 0) > 0,

      getSurahProgress: (surahId, totalAyahs) => {
        if (totalAyahs <= 0) return 0;
        const read = get().readVersesBySurah[surahId]?.length ?? 0;
        return Math.min(1, read / totalAyahs);
      },
    }),
    {
      name: 'reading-progress',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
