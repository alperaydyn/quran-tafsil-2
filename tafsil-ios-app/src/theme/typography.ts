/**
 * Tipografi ölçeği — Tasarım kaynağı: design/project/Tafsil.dc.html
 *
 * 3 yazı ailesi:
 * - Newsreader (serif): başlıklar, okuma/meal metni — editoryal ton
 * - Instrument Sans: arayüz metni (etiket, buton, meta)
 * - Amiri: Arapça Osmanlı hattı (mushaf metni, kelime tokenları)
 */

export const fontFamily = {
  serif: 'Newsreader_400Regular',
  serifMedium: 'Newsreader_500Medium',
  serifSemiBold: 'Newsreader_600SemiBold',
  sans: 'InstrumentSans_400Regular',
  sansMedium: 'InstrumentSans_500Medium',
  sansSemiBold: 'InstrumentSans_600SemiBold',
  arabic: 'Amiri_400Regular',
  arabicBold: 'Amiri_700Bold',
} as const;

export interface TextStyleToken {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
}

export const typeScale = {
  // Serif — başlıklar & okuma metni
  display: { fontFamily: fontFamily.serif, fontSize: 28, lineHeight: 36 } as TextStyleToken,
  title: { fontFamily: fontFamily.serif, fontSize: 20, lineHeight: 27 } as TextStyleToken,
  headline: { fontFamily: fontFamily.serif, fontSize: 17, lineHeight: 24 } as TextStyleToken,
  subhead: { fontFamily: fontFamily.serif, fontSize: 16, lineHeight: 23 } as TextStyleToken,
  body: { fontFamily: fontFamily.serif, fontSize: 15, lineHeight: 25 } as TextStyleToken,
  bodyLarge: { fontFamily: fontFamily.serif, fontSize: 16, lineHeight: 27 } as TextStyleToken,

  // Sans — arayüz metni
  callout: { fontFamily: fontFamily.sansMedium, fontSize: 13.5, lineHeight: 18 } as TextStyleToken,
  ui: { fontFamily: fontFamily.sansMedium, fontSize: 12.5, lineHeight: 18 } as TextStyleToken,
  footnote: { fontFamily: fontFamily.sans, fontSize: 11.5, lineHeight: 17 } as TextStyleToken,
  caption: { fontFamily: fontFamily.sansMedium, fontSize: 10.5, lineHeight: 14 } as TextStyleToken,
  eyebrow: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.6, // .16em @ 10px
  } as TextStyleToken,

  // Arapça
  arabicInline: { fontFamily: fontFamily.arabic, fontSize: 15, lineHeight: 24 } as TextStyleToken,
  arabicReading: { fontFamily: fontFamily.arabic, fontSize: 22, lineHeight: 42 } as TextStyleToken,
  arabicHero: { fontFamily: fontFamily.arabic, fontSize: 28, lineHeight: 52 } as TextStyleToken,
};

export type TypeScaleKey = keyof typeof typeScale;
