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
  bulkMergeSessions: (serverSessions: any[]) => void;
  resetSessions: () => void;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Sahte/örnek veri olmadan temiz başlangıç (PRD ve Release kuralları uyarınca)
const INITIAL_SESSIONS: LocalMemorizationSession[] = [];

export const useMemorizationStore = create<MemorizationState>()(
  persist(
    (set, get) => ({
      sessions: INITIAL_SESSIONS,
      activeSessionId: null,

      resetSessions: () => set({ sessions: [], activeSessionId: null }),

      addSession: (input) => {
        const newSession: LocalMemorizationSession = {
          id: generateUUID(),
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

      bulkMergeSessions: (serverSessions) =>
        set((state) => {
          if (!serverSessions || !Array.isArray(serverSessions) || serverSessions.length === 0) return state;

          const sessionMap = new Map<string, LocalMemorizationSession>();
          // Önce yerel oturumları koy
          state.sessions.forEach((s) => sessionMap.set(s.id, s));

          // Sunucu oturumlarını merge et
          for (const s of serverSessions) {
            const id = s.id || `session-${s.sure_id}-${s.baslangic_ayet}`;
            sessionMap.set(id, {
              id,
              surahId: Number(s.sure_id || s.surahId),
              surahNameTr: s.surahNameTr || `Sure ${s.sure_id || s.surahId}`,
              startAyah: Number(s.baslangic_ayet || s.startAyah),
              endAyah: Number(s.bitis_ayet || s.endAyah),
              theme: s.baslik || s.theme || '',
              status: s.durum || s.status || 'ogreniliyor',
              repetitionNumber: Number(s.repetition_number ?? s.repetitionNumber ?? 0),
              intervalDays: Number(s.interval_days ?? s.intervalDays ?? 1),
              easeFactor: Number(s.ease_factor ?? s.easeFactor ?? 2.5),
              nextReviewAt: s.next_review_at || s.nextReviewAt || new Date().toISOString(),
              createdAt: s.created_at || s.createdAt || new Date().toISOString(),
            });
          }

          return { sessions: Array.from(sessionMap.values()) };
        }),
    }),
    {
      name: 'memorization-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
