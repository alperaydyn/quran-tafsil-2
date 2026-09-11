import { create } from 'zustand';

export type PlaybackLanguage = 'ar' | 'tr';

interface ActiveReadingState {
  surahId: number | null;
  ayahNo: number | null;
  isPlaying: boolean;
  positionMs: number;
  /** Karaoke senkron vurgulaması için o anki kelime pozisyonu (ayet içi sıra). */
  currentWordIndex: number | null;
  playbackLanguage: PlaybackLanguage;
  playbackRate: number;

  openVerse: (surahId: number, ayahNo: number) => void;
  setPlaying: (playing: boolean) => void;
  setPosition: (positionMs: number, wordIndex?: number | null) => void;
  setPlaybackLanguage: (lang: PlaybackLanguage) => void;
  setPlaybackRate: (rate: number) => void;
  clear: () => void;
}

/**
 * Aktif okuma/dinleme oturumunun anlık (ephemeral) durumu — uygulama
 * yeniden başlatıldığında sıfırlanır. Kalıcı "kaldığım yerden devam et"
 * bilgisi [[useReadingProgressStore]] içinde tutulur.
 */
export const useActiveReadingStore = create<ActiveReadingState>()((set) => ({
  surahId: null,
  ayahNo: null,
  isPlaying: false,
  positionMs: 0,
  currentWordIndex: null,
  playbackLanguage: 'tr',
  playbackRate: 1.0,

  openVerse: (surahId, ayahNo) =>
    set({ surahId, ayahNo, positionMs: 0, currentWordIndex: null }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setPosition: (positionMs, wordIndex = null) =>
    set({ positionMs, currentWordIndex: wordIndex }),
  setPlaybackLanguage: (lang) => set({ playbackLanguage: lang }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  clear: () =>
    set({
      surahId: null,
      ayahNo: null,
      isPlaying: false,
      positionMs: 0,
      currentWordIndex: null,
    }),
}));
