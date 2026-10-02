import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage';
import { audioCacheService } from '../services/audioCacheService';

export interface SurahDownloadState {
  progress: number; // 0..1
  current: number;
  total: number;
  totalBytes: number;
}

interface AudioCacheState {
  downloadedSurahIds: number[];
  downloadProgress: Record<number, SurahDownloadState>;
  downloadingSurahIds: number[];

  // Actions
  isSurahDownloaded: (surahId: number) => boolean;
  isSurahDownloading: (surahId: number) => boolean;
  getSurahProgress: (surahId: number) => SurahDownloadState | undefined;
  checkSurahStatus: (surahId: number, totalVerses: number) => Promise<boolean>;
  startDownload: (surahId: number, totalVerses: number) => Promise<boolean>;
  cancelDownload: (surahId: number) => void;
  deleteDownload: (surahId: number) => Promise<void>;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const useAudioCacheStore = create<AudioCacheState>()(
  persist(
    (set, get) => ({
      downloadedSurahIds: [],
      downloadProgress: {},
      downloadingSurahIds: [],

      isSurahDownloaded: (surahId: number) => {
        return get().downloadedSurahIds.includes(surahId);
      },

      isSurahDownloading: (surahId: number) => {
        return get().downloadingSurahIds.includes(surahId);
      },

      getSurahProgress: (surahId: number) => {
        return get().downloadProgress[surahId];
      },

      checkSurahStatus: async (surahId: number, totalVerses: number) => {
        const info = await audioCacheService.getSurahCacheInfo(surahId, totalVerses);
        set((state) => {
          const isDownloaded = info.isDownloaded;
          const currentList = state.downloadedSurahIds;
          const existsInList = currentList.includes(surahId);

          if (isDownloaded && !existsInList) {
            return { downloadedSurahIds: [...currentList, surahId] };
          } else if (!isDownloaded && existsInList) {
            return { downloadedSurahIds: currentList.filter((id) => id !== surahId) };
          }
          return state;
        });
        return info.isDownloaded;
      },

      startDownload: async (surahId: number, totalVerses: number) => {
        if (get().downloadingSurahIds.includes(surahId)) {
          return false;
        }

        set((state) => ({
          downloadingSurahIds: [...state.downloadingSurahIds, surahId],
          downloadProgress: {
            ...state.downloadProgress,
            [surahId]: {
              progress: 0,
              current: 0,
              total: totalVerses,
              totalBytes: 0,
            },
          },
        }));

        try {
          const result = await audioCacheService.downloadSurahAudio(
            surahId,
            totalVerses,
            (progress, current, total, totalBytes) => {
              set((state) => ({
                downloadProgress: {
                  ...state.downloadProgress,
                  [surahId]: {
                    progress,
                    current,
                    total,
                    totalBytes,
                  },
                },
              }));
            }
          );

          if (result.success) {
            set((state) => ({
              downloadedSurahIds: Array.from(new Set([...state.downloadedSurahIds, surahId])),
              downloadingSurahIds: state.downloadingSurahIds.filter((id) => id !== surahId),
            }));
            return true;
          } else {
            set((state) => ({
              downloadingSurahIds: state.downloadingSurahIds.filter((id) => id !== surahId),
            }));
            return false;
          }
        } catch (e) {
          console.warn(`[useAudioCacheStore] startDownload(${surahId}) error:`, e);
          set((state) => ({
            downloadingSurahIds: state.downloadingSurahIds.filter((id) => id !== surahId),
          }));
          return false;
        }
      },

      cancelDownload: (surahId: number) => {
        audioCacheService.cancelDownload(surahId);
        set((state) => {
          const nextProgress = { ...state.downloadProgress };
          delete nextProgress[surahId];
          return {
            downloadingSurahIds: state.downloadingSurahIds.filter((id) => id !== surahId),
            downloadProgress: nextProgress,
          };
        });
      },

      deleteDownload: async (surahId: number) => {
        await audioCacheService.deleteSurahAudio(surahId);
        set((state) => {
          const nextProgress = { ...state.downloadProgress };
          delete nextProgress[surahId];
          return {
            downloadedSurahIds: state.downloadedSurahIds.filter((id) => id !== surahId),
            downloadingSurahIds: state.downloadingSurahIds.filter((id) => id !== surahId),
            downloadProgress: nextProgress,
          };
        });
      },
    }),
    {
      name: 'tafsil_audio_cache_store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        downloadedSurahIds: state.downloadedSurahIds,
      }),
    }
  )
);
