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
  bulkMergeReadingHistory: (historyItems: Array<{ sure_id: number; ayet_no: number; okundu_tarihi?: string }>) => void;
}

export const useReadingProgressStore = create<ReadingProgressState>()(
  persist(
    (set, get) => ({
      lastRead: null,
      readVersesBySurah: {},
      completedSurahs: {},
      streak: { current: 0, longest: 0, lastActiveDate: null },

      bulkMergeReadingHistory: (historyItems) =>
        set((state) => {
          if (!historyItems || historyItems.length === 0) return state;

          const updatedReadVerses: Record<number, number[]> = { ...state.readVersesBySurah };
          let latestItem: { surahId: number; ayahNo: number; date: string } | null = null;

          for (const item of historyItems) {
            const sid = Number(item.sure_id);
            const aid = Number(item.ayet_no);
            if (!sid || !aid) continue;

            const existing = updatedReadVerses[sid] ?? [];
            if (!existing.includes(aid)) {
              updatedReadVerses[sid] = [...existing, aid];
            }

            if (item.okundu_tarihi) {
              if (!latestItem || new Date(item.okundu_tarihi) > new Date(latestItem.date)) {
                latestItem = { surahId: sid, ayahNo: aid, date: item.okundu_tarihi };
              }
            }
          }

          let lastRead = state.lastRead;
          if (latestItem) {
            if (!lastRead || new Date(latestItem.date) > new Date(lastRead.updatedAt)) {
              lastRead = {
                surahId: latestItem.surahId,
                ayahNo: latestItem.ayahNo,
                updatedAt: latestItem.date,
              };
            }
          }

          return {
            readVersesBySurah: updatedReadVerses,
            lastRead,
          };
        }),

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
