import { useMemo, useCallback } from 'react';
import { useUserSettingsStore } from '../store/useUserSettingsStore';
import type { LanguagePreference, TranslationSchema } from './types';
import { tr } from './tr';
import { en } from './en';
import { ar } from './ar';

export * from './types';

export const dictionaries: Record<LanguagePreference, TranslationSchema> = {
  tr,
  en,
  ar,
};

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationSchema>;

/**
 * Nested key'e göre sözlükten değeri çeker ve {param} yer tutucularını doldurur.
 */
export function translate(
  lang: LanguagePreference,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = dictionaries[lang] || dictionaries.tr;
  const parts = key.split('.');
  let current: any = dict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to Turkish if key missing in chosen language
      let fallback: any = dictionaries.tr;
      for (const fPart of parts) {
        if (fallback && typeof fallback === 'object' && fPart in fallback) {
          fallback = fallback[fPart];
        } else {
          return key;
        }
      }
      current = fallback;
      break;
    }
  }

  if (typeof current !== 'string') {
    return key;
  }

  if (!params) {
    return current;
  }

  return Object.entries(params).reduce((str, [pKey, pVal]) => {
    return str.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
  }, current);
}

/**
 * React Component'leri içinde aktif dile göre reaktif çeviri sağlayan hook.
 */
export function useTranslation() {
  const language = useUserSettingsStore((s) => s.language);
  const setLanguage = useUserSettingsStore((s) => s.setLanguage);

  const t = useCallback(
    (key: TranslationKey | string, params?: Record<string, string | number>) => {
      return translate(language, key, params);
    },
    [language]
  );

  const dict = useMemo(() => dictionaries[language] || dictionaries.tr, [language]);

  return {
    t,
    language,
    setLanguage,
    dict,
    isRTL: language === 'ar',
  };
}
