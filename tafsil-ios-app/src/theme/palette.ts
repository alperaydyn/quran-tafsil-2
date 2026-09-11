/**
 * Renk paletleri — Tasarım kaynağı: design/project/Tafsil.dc.html
 *
 * Kaynak dosyada 3 tema varyantı (A/B/C) tanımlıdır; burada anlamlı isimlerle
 * yeniden adlandırıldı. "ceviz" (C) varsayılan/birincil temadır — sıcak,
 * editoryal, kağıt hissi veren palet AGENTS.md'deki "klişe dini motiflerden
 * kaçının, modern/ferah/editoryal olun" ilkesine en yakın olanıdır.
 *
 * Koyu tema varyantları kaynak dosyada tanımlı değildir (tasarım sadece açık
 * tema örnekleri içeriyor); burada her aksan rengi korunarak türetildi —
 * AGENTS.md "Dark mode from day 1" ilkesi gereği.
 */

export type AccentVariant = 'ceviz' | 'lacivert' | 'mor';
export type ColorScheme = 'light' | 'dark';

export interface SemanticPalette {
  /** Sayfa zemini (en dış arka plan) */
  bg: string;
  /** Kart / yüzey arka planı */
  surf: string;
  /** Birincil metin rengi */
  ink: string;
  /** İkincil / yardımcı metin rengi */
  mut: string;
  /** Üçüncül / soluk metin rengi (eyebrow, meta) */
  faint: string;
  /** Ayırıcı çizgi / kenarlık rengi */
  line: string;
  /** Vurgu rengi (aktif durum, bağlantı, CTA) */
  acc: string;
  /** Vurgu renginin yumuşak/arka plan hali */
  accSoft: string;
  /** Nötr bant / ikincil buton arka planı */
  band: string;
}

type PaletteSet = Record<AccentVariant, Record<ColorScheme, SemanticPalette>>;

export const palettes: PaletteSet = {
  ceviz: {
    light: {
      bg: '#F4F1EA',
      surf: '#FBF9F4',
      ink: '#171613',
      mut: '#8A857A',
      faint: '#BDB6A6',
      line: '#E6E1D4',
      acc: '#3F5F86',
      accSoft: '#E4E9F0',
      band: '#E6E1D4',
    },
    dark: {
      bg: '#14130F',
      surf: '#1C1A15',
      ink: '#F4F1EA',
      mut: '#A39C8C',
      faint: '#6B6558',
      line: '#33302A',
      acc: '#7FA3CC',
      accSoft: '#22344A',
      band: '#232019',
    },
  },
  lacivert: {
    light: {
      bg: '#FAFAF9',
      surf: '#FFFFFF',
      ink: '#14171C',
      mut: '#61697A',
      faint: '#A7ADB8',
      line: '#E2E4E8',
      acc: '#2F4A6E',
      accSoft: '#EAEEF4',
      band: '#F1F3F6',
    },
    dark: {
      bg: '#0B0D11',
      surf: '#14171C',
      ink: '#F5F6F8',
      mut: '#9AA3AF',
      faint: '#5A6472',
      line: '#262B33',
      acc: '#6C93C4',
      accSoft: '#1C2733',
      band: '#1A1E24',
    },
  },
  mor: {
    light: {
      bg: '#F6F5FC',
      surf: '#FFFFFF',
      ink: '#1A1826',
      mut: '#6B6785',
      faint: '#A8A3C0',
      line: '#E5E2F2',
      acc: '#5747C9',
      accSoft: '#EDEAFC',
      band: '#EBE8F8',
    },
    dark: {
      bg: '#120F1C',
      surf: '#1A1626',
      ink: '#F1EEFB',
      mut: '#A79FC4',
      faint: '#5F5878',
      line: '#2C2640',
      acc: '#9587F0',
      accSoft: '#241E3D',
      band: '#211B36',
    },
  },
};

export const DEFAULT_ACCENT_VARIANT: AccentVariant = 'ceviz';
