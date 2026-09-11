import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { palettes, type ColorScheme, type SemanticPalette } from './palette';
import { typeScale, fontFamily } from './typography';
import { spacing, radius } from './spacing';
import { useUserSettingsStore } from '../store/useUserSettingsStore';

export interface Theme {
  scheme: ColorScheme;
  colors: SemanticPalette;
  type: typeof typeScale;
  font: typeof fontFamily;
  spacing: typeof spacing;
  radius: typeof radius;
}

const ThemeContext = createContext<Theme | null>(null);

function buildTheme(scheme: ColorScheme, accentVariant: keyof typeof palettes): Theme {
  return {
    scheme,
    colors: palettes[accentVariant][scheme],
    type: typeScale,
    font: fontFamily,
    spacing,
    radius,
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const colorSchemePreference = useUserSettingsStore((s) => s.colorSchemePreference);
  const accentVariant = useUserSettingsStore((s) => s.accentVariant);

  const resolvedScheme: ColorScheme =
    colorSchemePreference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : colorSchemePreference;

  const theme = useMemo(
    () => buildTheme(resolvedScheme, accentVariant),
    [resolvedScheme, accentVariant]
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme, ThemeProvider içinden çağrılmalıdır.');
  }
  return ctx;
}
