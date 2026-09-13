export type LanguagePreference = 'tr' | 'en' | 'ar';

export interface LanguageOption {
  code: LanguagePreference;
  label: string;
  nativeLabel: string;
  description: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'tr',
    label: 'Türkçe',
    nativeLabel: 'Türkçe',
    description: 'Varsayılan dil ve editoryal bağlam',
    dir: 'ltr',
  },
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    description: 'Full interface & English translations',
    dir: 'ltr',
  },
  {
    code: 'ar',
    label: 'Arabic',
    nativeLabel: 'العربية',
    description: 'النص القرآني والمصطلحات التفسيرية',
    dir: 'rtl',
  },
];

export interface TranslationSchema {
  common: {
    back: string;
    cancel: string;
    save: string;
    close: string;
    done: string;
    loading: string;
    retry: string;
    error: string;
    soon: string;
    ayah: string;
    ayahs: string;
    surah: string;
    surahs: string;
    page: string;
    juz: string;
    verseCount: string;
    unknown: string;
  };
  tabs: {
    home: string;
    surahs: string;
    memorization: string;
    concepts: string;
    settings: string;
  };
  settings: {
    title: string;
    account: string;
    myAccount: string;
    connectedWith: string;
    signIn: string;
    signOut: string;
    readingMode: string;
    appearance: string;
    colorTheme: string;
    language: string;
    languageDescription: string;
    schemes: {
      system: string;
      light: string;
      dark: string;
    };
    accents: {
      ceviz: string;
      lacivert: string;
      mor: string;
    };
  };
  readingModes: {
    kesif: {
      title: string;
      description: string;
      badge: string;
    };
    ogrenme: {
      title: string;
      description: string;
      badge: string;
    };
    odak: {
      title: string;
      description: string;
      badge: string;
    };
  };
  periods: {
    erken_mekke: string;
    orta_mekke: string;
    gec_mekke: string;
    medine: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    continueReading: string;
    gardenTitle: string;
    gardenWateredWeeks: string;
    gardenWaiting: string;
    readingStreak: string;
    todayRead: string;
    dailyVerse: string;
    dailyPrayer: string;
    activeMode: string;
    change: string;
    exploreMatrix: string;
    daysCount: string;
    versesCount: string;
    startReading: string;
  };
  surahList: {
    title: string;
    searchPlaceholder: string;
    mushafOrder: string;
    nuzulOrder: string;
    emptyResults: string;
  };
  reading: {
    rootAnalysis: string;
    editorialContext: string;
    relatedConcepts: string;
    openInDag: string;
    listen: string;
    pause: string;
    bookmark: string;
    share: string;
    copy: string;
    copied: string;
    translationFallback: string;
    playFullSurah: string;
  };
  memorization: {
    title: string;
    revealOnRecite: string;
    startSession: string;
    memorized: string;
    review: string;
    hard: string;
    good: string;
    easy: string;
    sessionComplete: string;
    accuracy: string;
  };
  understanding: {
    title: string;
    newStudy: string;
    featured: string;
    sessions: string;
    conceptDag: string;
    deepen: string;
  };
  onboarding: {
    skip: string;
    next: string;
    getStarted: string;
    selectModeEyebrow: string;
    selectModeTitle: string;
    selectModeSubtitle: string;
    slides: {
      slide1Title: string;
      slide1Body: string;
      slide2Title: string;
      slide2Body: string;
      slide3Title: string;
      slide3Body: string;
    };
  };
  auth: {
    title: string;
    subtitle: string;
    appleSignIn: string;
    googleSignIn: string;
    guestContinue: string;
  };
}
