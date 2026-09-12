import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage';

export interface LocalMemorizationSession {
  id: string;
  surahId: number;
  surahNameTr: string;
  startAyah: number;
  endAyah: number;
  theme?: string;
  status: 'ogreniliyor' | 'kor_okuma' | 'tekrar_bekliyor' | 'pekistirildi';
  repetitionNumber: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewAt: string; // ISO-8601
  createdAt: string;
  lastPracticedAt?: string;
  totalToursCompleted?: number;
}

interface MemorizationState {
  sessions: LocalMemorizationSession[];
  activeSessionId: string | null;

  addSession: (input: {
    surahId: number;
    surahNameTr: string;
    startAyah: number;
    endAyah: number;
    theme?: string;
  }) => LocalMemorizationSession;
  updateSessionReview: (
    sessionId: string,
    quality: number
  ) => { newInterval: number; nextReviewAt: string; status: LocalMemorizationSession['status'] };
  setActiveSessionId: (id: string | null) => void;
  getActiveSession: () => LocalMemorizationSession | undefined;
  getDueSessions: () => LocalMemorizationSession[];
  getSessionsForSurah: (surahId: number) => LocalMemorizationSession[];
  getMemorizedSurahProgress: (surahId: number, totalAyahs: number) => number;
}

// Tafsil.dc.html ekran #3a için başlangıç örnek oturumları
const INITIAL_SESSIONS: LocalMemorizationSession[] = [
  {
    id: 'alak-1-5',
    surahId: 96,
    surahNameTr: 'Alak',
    startAyah: 1,
    endAyah: 5,
    theme: 'İlk vahiy',
    status: 'tekrar_bekliyor',
    repetitionNumber: 3,
    intervalDays: 7,
    easeFactor: 2.6,
    nextReviewAt: new Date(Date.now() - 3600 * 1000).toISOString(), // Vadesi gelmiş / bugün
    createdAt: new Date(Date.now() - 12 * 86400 * 1000).toISOString(),
    totalToursCompleted: 11,
  },
  {
    id: 'mulk-1-5',
    surahId: 67,
    surahNameTr: 'Mülk',
    startAyah: 1,
    endAyah: 5,
    theme: 'Hükümranlık',
    status: 'tekrar_bekliyor',
    repetitionNumber: 2,
    intervalDays: 3,
    easeFactor: 2.5,
    nextReviewAt: new Date(Date.now() - 1800 * 1000).toISOString(), // Vadesi gelmiş / bugün
    createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    totalToursCompleted: 8,
  },
  {
    id: 'fatiha-1-7',
    surahId: 1,
    surahNameTr: 'Fâtiha',
    startAyah: 1,
    endAyah: 7,
    theme: 'Hamd ve dua',
    status: 'pekistirildi',
    repetitionNumber: 5,
    intervalDays: 30,
    easeFactor: 2.7,
    nextReviewAt: new Date(Date.now() + 18 * 86400 * 1000).toISOString(), // 18 gün sonra
    createdAt: new Date(Date.now() - 46 * 86400 * 1000).toISOString(),
    totalToursCompleted: 24,
  },
];

export const useMemorizationStore = create<MemorizationState>()(
  persist(
    (set, get) => ({
      sessions: INITIAL_SESSIONS,
      activeSessionId: null,

      addSession: (input) => {
        const newSession: LocalMemorizationSession = {
          id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          surahId: input.surahId,
          surahNameTr: input.surahNameTr,
          startAyah: input.startAyah,
          endAyah: input.endAyah,
          theme: input.theme || `${input.surahNameTr} ${input.startAyah}–${input.endAyah}`,
          status: 'ogreniliyor',
          repetitionNumber: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          nextReviewAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          totalToursCompleted: 0,
        };

        set((state) => ({ sessions: [newSession, ...state.sessions] }));
        return newSession;
      },

      updateSessionReview: (sessionId, quality) => {
        const state = get();
        const session = state.sessions.find((s) => s.id === sessionId);
        const q = Math.max(0, Math.min(5, Math.round(quality)));

        const currentEf = session?.easeFactor ?? 2.5;
        const currentRep = session?.repetitionNumber ?? 0;
        const currentInt = session?.intervalDays ?? 1;

        const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
        const newEf = Math.max(1.3, Number((currentEf + efDelta).toFixed(2)));

        let nextRep = currentRep;
        let nextInt = currentInt;
        let nextStatus: LocalMemorizationSession['status'];

        if (q < 3) {
          nextRep = 0;
          nextInt = 1;
          nextStatus = 'ogreniliyor';
        } else {
          if (nextRep === 0) {
            nextInt = 1;
            nextStatus = 'kor_okuma';
          } else if (nextRep === 1) {
            nextInt = 6;
            nextStatus = 'tekrar_bekliyor';
          } else {
            nextInt = Math.max(1, Math.round(currentInt * newEf));
            nextStatus = nextRep >= 3 ? 'pekistirildi' : 'tekrar_bekliyor';
          }
          nextRep += 1;
        }

        const nextReviewAt = new Date(Date.now() + nextInt * 86400 * 1000).toISOString();

        set((s) => ({
          sessions: s.sessions.map((item) =>
            item.id === sessionId
              ? {
                  ...item,
                  repetitionNumber: nextRep,
                  intervalDays: nextInt,
                  easeFactor: newEf,
                  status: nextStatus,
                  nextReviewAt,
                  lastPracticedAt: new Date().toISOString(),
                  totalToursCompleted: (item.totalToursCompleted ?? 0) + 1,
                }
              : item
          ),
        }));

        return { newInterval: nextInt, nextReviewAt, status: nextStatus };
      },

      setActiveSessionId: (id) => set({ activeSessionId: id }),

      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId);
      },

      getDueSessions: () => {
        const now = new Date().toISOString();
        return get().sessions.filter((s) => s.nextReviewAt <= now);
      },

      getSessionsForSurah: (surahId) => {
        return get().sessions.filter((s) => s.surahId === surahId);
      },

      getMemorizedSurahProgress: (surahId, totalAyahs) => {
        if (totalAyahs <= 0) return 0;
        const surahSessions = get().sessions.filter(
          (s) => s.surahId === surahId && (s.status === 'pekistirildi' || s.status === 'tekrar_bekliyor')
        );
        let memorizedAyahs = 0;
        for (const ses of surahSessions) {
          memorizedAyahs += ses.endAyah - ses.startAyah + 1;
        }
        return Math.min(1, memorizedAyahs / totalAyahs);
      },
    }),
    {
      name: 'memorization-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
