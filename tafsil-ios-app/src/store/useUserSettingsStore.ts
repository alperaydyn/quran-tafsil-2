import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage';
import type { AccentVariant, ColorScheme } from '../theme/palette';
import type { LanguagePreference } from '../i18n/types';

/**
 * Kullanıcının okuma tercih modu — bkz. docs/agents/03-MOBILE-APP-AGENT.md §2
 * ve [[MOB-007 mode engine]].
 */
export type ReadingMode = 'kesif' | 'ogrenme' | 'odak';

export const MODE_TO_ACCENT: Record<ReadingMode, AccentVariant> = {
  kesif: 'mor',      // Felsefi, mistik, derin keşif
  ogrenme: 'ceviz',  // Sıcak, editoryal, kağıt hissi
  odak: 'lacivert',  // Yalın, dikkat dağıtıcısız, Uthmani odaklı
};

export type ColorSchemePreference = ColorScheme | 'system';

interface UserSettingsState {
  onboardingCompleted: boolean;
  readingMode: ReadingMode;
  colorSchemePreference: ColorSchemePreference;
  accentVariant: AccentVariant;
  /** Çoklu dil desteği (MOB-029) — 'tr' | 'en' | 'ar' */
  language: LanguagePreference;

  setReadingMode: (mode: ReadingMode) => void;
  setColorSchemePreference: (pref: ColorSchemePreference) => void;
  setAccentVariant: (variant: AccentVariant) => void;
  setLanguage: (lang: LanguagePreference) => void;
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

      setReadingMode: (mode) => set({ readingMode: mode, accentVariant: MODE_TO_ACCENT[mode] }),
      setColorSchemePreference: (pref) => set({ colorSchemePreference: pref }),
      setAccentVariant: (variant) => set({ accentVariant: variant }),
      setLanguage: (lang) => set({ language: lang }),
      completeOnboarding: (mode) =>
        set({ readingMode: mode, accentVariant: MODE_TO_ACCENT[mode], onboardingCompleted: true }),
      resetOnboarding: () => set({ onboardingCompleted: false }),
    }),
    {
      name: 'user-settings',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

