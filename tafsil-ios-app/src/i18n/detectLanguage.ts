import { getLocales } from 'expo-localization';
import type { LanguagePreference } from './types';

const SUPPORTED: LanguagePreference[] = ['tr', 'ar', 'en'];

/**
 * Cihazın tercih edilen dil listesinden (kullanıcının öncelik sırasıyla) uygulamanın
 * desteklediği ilk dili seçer. Desteklenen dil yoksa İngilizce'ye düşer.
 *
 * Sonuç: TR > AR > EN (fallback). Örn. [de, tr] → tr, [fr, es] → en.
 */
export function detectDeviceLanguage(): LanguagePreference {
  try {
    for (const locale of getLocales()) {
      const code = (locale.languageCode ?? '').toLowerCase() as LanguagePreference;
      if (SUPPORTED.includes(code)) return code;
    }
  } catch {
    // Yerel modül yoksa (eski dev client) JS motorunun locale'ine düş
    try {
      const code = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0].toLowerCase() as LanguagePreference;
      if (SUPPORTED.includes(code)) return code;
    } catch {
      // yoksay
    }
  }
  return 'en';
}
