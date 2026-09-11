/**
 * Boşluk ve köşe yarıçapı ölçeği — design/project/Tafsil.dc.html içindeki
 * kullanım sıklığından süzülmüştür (4pt tabanlı, ara değerlerle).
 */

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 10,
  md: 12,
  base: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 44,
} as const;

export const radius = {
  sm: 7,
  md: 9,
  lg: 12,
  xl: 14,
  xxl: 16,
  xxxl: 18,
  pill: 999,
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

/** iOS HIG minimum dokunma hedefi */
export const MIN_TOUCH_TARGET = 44;
