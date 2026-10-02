import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage';

export type ArabicFontSizeScale = 'small' | 'medium' | 'large' | 'huge';
export type MealFontSizeScale = 'small' | 'medium' | 'large' | 'huge';
export type TransliterationFontSizeScale = 'small' | 'medium' | 'large' | 'huge';
export type TransliterationStyle = 'italic' | 'regular';
export type LineSpacingScale = 'compact' | 'normal' | 'relaxed';

export interface FontScaleDetail {
  fontSize: number;
  baseLineHeight: number;
  label: string;
  scaleLabel: string;
}

export const ARABIC_FONT_SCALES: Record<ArabicFontSizeScale, FontScaleDetail> = {
  small: { fontSize: 19, baseLineHeight: 36, label: 'Küçük', scaleLabel: '19' },
  medium: { fontSize: 23, baseLineHeight: 44, label: 'Standart', scaleLabel: '23' },
  large: { fontSize: 28, baseLineHeight: 52, label: 'Büyük', scaleLabel: '28' },
  huge: { fontSize: 34, baseLineHeight: 62, label: 'Ekstra', scaleLabel: '34' },
};

export const MEAL_FONT_SCALES: Record<MealFontSizeScale, FontScaleDetail> = {
  small: { fontSize: 14, baseLineHeight: 22, label: 'Küçük', scaleLabel: '14' },
  medium: { fontSize: 16, baseLineHeight: 26, label: 'Standart', scaleLabel: '16' },
  large: { fontSize: 18, baseLineHeight: 30, label: 'Büyük', scaleLabel: '18' },
  huge: { fontSize: 21, baseLineHeight: 35, label: 'Ekstra', scaleLabel: '21' },
};

export const TRANSLITERATION_FONT_SCALES: Record<TransliterationFontSizeScale, FontScaleDetail> = {
  small: { fontSize: 11.5, baseLineHeight: 17, label: 'Küçük', scaleLabel: '11.5' },
  medium: { fontSize: 13.5, baseLineHeight: 20, label: 'Standart', scaleLabel: '13.5' },
  large: { fontSize: 15.5, baseLineHeight: 23, label: 'Büyük', scaleLabel: '15.5' },
  huge: { fontSize: 18, baseLineHeight: 27, label: 'Ekstra', scaleLabel: '18' },
};

export interface LineSpacingDetail {
  multiplier: number;
  label: string;
  description: string;
}

export const LINE_SPACING_SCALES: Record<LineSpacingScale, LineSpacingDetail> = {
  compact: { multiplier: 0.88, label: 'Sıkı', description: 'Kompakt ve yoğun satırlar' },
  normal: { multiplier: 1.0, label: 'Dengeli', description: 'Standart editoryal oran' },
  relaxed: { multiplier: 1.25, label: 'Ferah', description: 'Geniş ve rahat satırlar' },
};

export function getArabicMetrics(fontSize: ArabicFontSizeScale, lineSpacing: LineSpacingScale) {
  const base = ARABIC_FONT_SCALES[fontSize] || ARABIC_FONT_SCALES.medium;
  const factor = (LINE_SPACING_SCALES[lineSpacing] || LINE_SPACING_SCALES.normal).multiplier;
  return {
    fontSize: base.fontSize,
    lineHeight: Math.round(base.baseLineHeight * factor),
  };
}

export function getMealMetrics(fontSize: MealFontSizeScale, lineSpacing: LineSpacingScale) {
  const base = MEAL_FONT_SCALES[fontSize] || MEAL_FONT_SCALES.medium;
  const factor = (LINE_SPACING_SCALES[lineSpacing] || LINE_SPACING_SCALES.normal).multiplier;
  return {
    fontSize: base.fontSize,
    lineHeight: Math.round(base.baseLineHeight * factor),
  };
}

export function getTransliterationMetrics(fontSize: TransliterationFontSizeScale, lineSpacing: LineSpacingScale) {
  const base = TRANSLITERATION_FONT_SCALES[fontSize] || TRANSLITERATION_FONT_SCALES.medium;
  const factor = (LINE_SPACING_SCALES[lineSpacing] || LINE_SPACING_SCALES.normal).multiplier;
  return {
    fontSize: base.fontSize,
    lineHeight: Math.round(base.baseLineHeight * factor),
  };
}

export interface ReadingPreferencesState {
  arabicFontSize: ArabicFontSizeScale;
  mealFontSize: MealFontSizeScale;
  transliterationFontSize: TransliterationFontSizeScale;
  transliterationStyle: TransliterationStyle;
  lineSpacing: LineSpacingScale;
  showArabic: boolean;
  showMeal: boolean;
  showTransliteration: boolean;
  showConceptHighlights: boolean;

  setArabicFontSize: (scale: ArabicFontSizeScale) => void;
  setMealFontSize: (scale: MealFontSizeScale) => void;
  setTransliterationFontSize: (scale: TransliterationFontSizeScale) => void;
  setTransliterationStyle: (style: TransliterationStyle) => void;
  toggleTransliterationStyle: () => void;
  setLineSpacing: (scale: LineSpacingScale) => void;
  setShowArabic: (show: boolean) => void;
  setShowMeal: (show: boolean) => void;
  setShowTransliteration: (show: boolean) => void;
  setShowConceptHighlights: (show: boolean) => void;
  toggleArabic: () => void;
  toggleMeal: () => void;
  toggleTransliteration: () => void;
  toggleConceptHighlights: () => void;
  resetToDefaults: () => void;
}

const DEFAULT_PREFERENCES = {
  arabicFontSize: 'medium' as ArabicFontSizeScale,
  mealFontSize: 'medium' as MealFontSizeScale,
  transliterationFontSize: 'medium' as TransliterationFontSizeScale,
  transliterationStyle: 'italic' as TransliterationStyle,
  lineSpacing: 'normal' as LineSpacingScale,
  showArabic: true,
  showMeal: true,
  showTransliteration: true,
  showConceptHighlights: true,
};

export const useReadingPreferencesStore = create<ReadingPreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,

      setArabicFontSize: (arabicFontSize) => set({ arabicFontSize }),
      setMealFontSize: (mealFontSize) => set({ mealFontSize }),
      setTransliterationFontSize: (transliterationFontSize) => set({ transliterationFontSize }),
      setTransliterationStyle: (transliterationStyle) => set({ transliterationStyle }),
      toggleTransliterationStyle: () =>
        set((state) => ({
          transliterationStyle: state.transliterationStyle === 'italic' ? 'regular' : 'italic',
        })),
      setLineSpacing: (lineSpacing) => set({ lineSpacing }),
      setShowArabic: (showArabic) => set({ showArabic }),
      setShowMeal: (showMeal) => set({ showMeal }),
      setShowTransliteration: (showTransliteration) => set({ showTransliteration }),
      setShowConceptHighlights: (showConceptHighlights) => set({ showConceptHighlights }),

      toggleArabic: () =>
        set((state) => {
          // Her iki metin de (Arapça ve Meal) aynı anda kapalı olmasın
          if (state.showArabic && !state.showMeal) return state;
          return { showArabic: !state.showArabic };
        }),

      toggleMeal: () =>
        set((state) => {
          // Her iki metin de aynı anda kapalı olmasın
          if (state.showMeal && !state.showArabic) return state;
          return { showMeal: !state.showMeal };
        }),

      toggleTransliteration: () =>
        set((state) => ({ showTransliteration: !state.showTransliteration })),

      toggleConceptHighlights: () =>
        set((state) => ({ showConceptHighlights: !state.showConceptHighlights })),

      resetToDefaults: () => set(DEFAULT_PREFERENCES),
    }),
    {
      name: 'reading-display-preferences',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
