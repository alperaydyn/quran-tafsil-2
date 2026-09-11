import { useMemo } from 'react';
import { useUserSettingsStore, type ReadingMode } from '../store/useUserSettingsStore';

/**
 * 3-Kademeli Arayüz Modu Motoru (MOB-007)
 *
 * Kaynak: docs/agents/03-MOBILE-APP-AGENT.md §2
 *
 * | Özellik                | Keşif        | Öğrenme            | Odak            |
 * |-------------------------|--------------|--------------------|------------------|
 * | Arapça Mushaf Metni      | gizli (opt.) | açık + translit.   | merkezde, büyük  |
 * | Türkçe Meal & Tefsir     | birincil     | dengeli            | ikincil/minimal  |
 * | Oyunlaştırma & Streak    | kapalı       | açık               | kapalı           |
 * | Ezber Yönlendirmeleri    | gizli        | açık               | gizli            |
 * | Ses Önceliği             | TR meal      | çift dilli         | AR tilavet       |
 */
export interface ReadingModeFlags {
  mode: ReadingMode;
  showArabic: boolean;
  showTransliteration: boolean;
  arabicEmphasis: 'hidden' | 'normal' | 'hero';
  mealEmphasis: 'primary' | 'balanced' | 'minimal';
  gamificationEnabled: boolean;
  memorizationPromptsEnabled: boolean;
  defaultAudioLanguage: 'tr' | 'ar' | 'bilingual';
}

const MODE_FLAGS: Record<ReadingMode, Omit<ReadingModeFlags, 'mode'>> = {
  kesif: {
    showArabic: false,
    showTransliteration: false,
    arabicEmphasis: 'hidden',
    mealEmphasis: 'primary',
    gamificationEnabled: false,
    memorizationPromptsEnabled: false,
    defaultAudioLanguage: 'tr',
  },
  ogrenme: {
    showArabic: true,
    showTransliteration: true,
    arabicEmphasis: 'normal',
    mealEmphasis: 'balanced',
    gamificationEnabled: true,
    memorizationPromptsEnabled: true,
    defaultAudioLanguage: 'bilingual',
  },
  odak: {
    showArabic: true,
    showTransliteration: false,
    arabicEmphasis: 'hero',
    mealEmphasis: 'minimal',
    gamificationEnabled: false,
    memorizationPromptsEnabled: false,
    defaultAudioLanguage: 'ar',
  },
};

export const READING_MODE_META: Record<ReadingMode, { title: string; description: string }> = {
  kesif: {
    title: 'Keşif',
    description: 'Merak ve akış öncelikli, sade ve oyunlaştırmasız bir deneyim.',
  },
  ogrenme: {
    title: 'Öğrenme',
    description: 'Arapça ve mealin dengeli sunulduğu, rehberli bir öğrenme deneyimi.',
  },
  odak: {
    title: 'Odak',
    description: 'Dikkat dağıtıcısız, büyük Arapça hatla saf tilavet deneyimi.',
  },
};

/** Aktif okuma moduna göre türetilen özellik bayraklarını döndürür. */
export function useReadingMode(): ReadingModeFlags {
  const mode = useUserSettingsStore((s) => s.readingMode);
  return useMemo(() => ({ mode, ...MODE_FLAGS[mode] }), [mode]);
}
