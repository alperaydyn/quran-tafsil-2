import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage';
import type { AccentVariant, ColorScheme } from '../theme/palette';

/**
 * Kullanıcının okuma tercih modu — bkz. docs/agents/03-MOBILE-APP-AGENT.md §2
 * ve [[MOB-007 mode engine]].
 */
export type ReadingMode = 'kesif' | 'ogrenme' | 'odak';

export type ColorSchemePreference = ColorScheme | 'system';

interface UserSettingsState {
  onboardingCompleted: boolean;
  readingMode: ReadingMode;
  colorSchemePreference: ColorSchemePreference;
  accentVariant: AccentVariant;
  /** Şu an için sadece 'tr' destekleniyor; ileride çoklu dil için hazır alan. */
  language: 'tr';

  setReadingMode: (mode: ReadingMode) => void;
  setColorSchemePreference: (pref: ColorSchemePreference) => void;
  setAccentVariant: (variant: AccentVariant) => void;
  completeOnboarding: (mode: ReadingMode) => void;
  resetOnboarding: () => void;
}

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set) => ({
      onboardingCompleted: false,
      readingMode: 'ogrenme',
      colorSchemePreference: 'system',
      accentVariant: 'ceviz',
      language: 'tr',

      setReadingMode: (mode) => set({ readingMode: mode }),
      setColorSchemePreference: (pref) => set({ colorSchemePreference: pref }),
      setAccentVariant: (variant) => set({ accentVariant: variant }),
      completeOnboarding: (mode) => set({ readingMode: mode, onboardingCompleted: true }),
      resetOnboarding: () => set({ onboardingCompleted: false }),
    }),
    {
      name: 'user-settings',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
