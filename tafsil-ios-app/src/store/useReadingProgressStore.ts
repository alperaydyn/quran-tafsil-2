import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage';
import { mockSurahs } from '../api/mock/surahs.mock';

export interface LastReadPosition {
  surahId: number;
  ayahNo: number;
  updatedAt: string; // ISO-8601
}

export interface CompletedSurahRecord {
  completedAt: string; // ISO-8601
  timesCompleted: number;
}

interface StreakInfo {
  current: number;
  longest: number;
  lastActiveDate: string | null; // ISO date (YYYY-MM-DD)
}

export interface OverallReadingStats {
  completedSurahsCount: number;
  totalSurahs: number;
  totalReadVerses: number;
  totalQuranVerses: number;
  overallPercentage: number;
}

interface ReadingProgressState {
  lastRead: LastReadPosition | null;
  /** sureId -> okunan ayet numaralarının seti (114 sure ısı haritası matrisi için). */
  readVersesBySurah: Record<number, number[]>;
  /** Tamamlanan sureler: sureId -> { completedAt, timesCompleted } */
  completedSurahs: Record<number, CompletedSurahRecord>;
  streak: StreakInfo;

  markVerseRead: (surahId: number, ayahNo: number, today: string) => void;
  markSurahCompleted: (surahId: number, totalAyahs?: number, completedAt?: string) => void;
  unmarkSurahCompleted: (surahId: number) => void;
  isSurahCompleted: (surahId: number) => boolean;
  setLastRead: (surahId: number, ayahNo: number, updatedAt: string) => void;
  isSurahStarted: (surahId: number) => boolean;
  getSurahProgress: (surahId: number, totalAyahs: number) => number;
  getSurahReadVerseCount: (surahId: number, totalAyahs?: number) => number;
  getOverallStats: (allSurahs?: { id: number; verseCount: number }[]) => OverallReadingStats;
}

export const useReadingProgressStore = create<ReadingProgressState>()(
  persist(
    (set, get) => ({
      lastRead: null,
      readVersesBySurah: {},
      completedSurahs: {},
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

      markSurahCompleted: (surahId, totalAyahs, completedAt = new Date().toISOString()) =>
        set((state) => {
          const existing = state.completedSurahs[surahId];
          const timesCompleted = (existing?.timesCompleted ?? 0) + 1;

          let nextVerses = state.readVersesBySurah[surahId] ?? [];
          if (totalAyahs && totalAyahs > 0) {
            const allAyahs = Array.from({ length: totalAyahs }, (_, i) => i + 1);
            nextVerses = Array.from(new Set([...nextVerses, ...allAyahs]));
          }

          const today = completedAt.slice(0, 10);
          const { current, longest, lastActiveDate } = state.streak;
          let nextCurrent = current;
          if (lastActiveDate !== today) {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const wasYesterday = lastActiveDate === yesterday.toISOString().slice(0, 10);
            nextCurrent = wasYesterday ? current + 1 : 1;
          }

          return {
            completedSurahs: {
              ...state.completedSurahs,
              [surahId]: {
                completedAt,
                timesCompleted,
              },
            },
            readVersesBySurah: {
              ...state.readVersesBySurah,
              [surahId]: nextVerses,
            },
            streak: {
              current: nextCurrent,
              longest: Math.max(longest, nextCurrent),
              lastActiveDate: today,
            },
          };
        }),

      unmarkSurahCompleted: (surahId) =>
        set((state) => {
          const next = { ...state.completedSurahs };
          delete next[surahId];
          return { completedSurahs: next };
        }),

      isSurahCompleted: (surahId) => {
        return Boolean(get().completedSurahs[surahId]);
      },

      isSurahStarted: (surahId) => {
        const state = get();
        if (state.completedSurahs[surahId]) return true;
        return (state.readVersesBySurah[surahId]?.length ?? 0) > 0;
      },

      getSurahProgress: (surahId, totalAyahs) => {
        if (totalAyahs <= 0) return 0;
        if (get().completedSurahs[surahId]) return 1.0;
        const read = get().readVersesBySurah[surahId]?.length ?? 0;
        return Math.min(1.0, read / totalAyahs);
      },

      getSurahReadVerseCount: (surahId, totalAyahs) => {
        const state = get();
        if (state.completedSurahs[surahId] && totalAyahs && totalAyahs > 0) {
          return totalAyahs;
        }
        const count = state.readVersesBySurah[surahId]?.length ?? 0;
        return totalAyahs ? Math.min(totalAyahs, count) : count;
      },

      getOverallStats: (allSurahs = mockSurahs) => {
        const state = get();
        const totalQuranVerses = allSurahs.reduce((acc, s) => acc + s.verseCount, 0) || 6236;
        const completedSurahsCount = Object.keys(state.completedSurahs).length;
        let totalReadVerses = 0;

        for (const surah of allSurahs) {
          if (state.completedSurahs[surah.id]) {
            totalReadVerses += surah.verseCount;
          } else {
            const read = state.readVersesBySurah[surah.id]?.length ?? 0;
            totalReadVerses += Math.min(surah.verseCount, read);
          }
        }

        const overallPercentage =
          totalQuranVerses > 0 ? (totalReadVerses / totalQuranVerses) * 100 : 0;

        return {
          completedSurahsCount,
          totalSurahs: allSurahs.length || 114,
          totalReadVerses,
          totalQuranVerses,
          overallPercentage: Math.min(100, Math.round(overallPercentage * 10) / 10),
        };
      },
    }),
    {
      name: 'reading-progress',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
