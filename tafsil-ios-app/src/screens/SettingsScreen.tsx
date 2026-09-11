import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';
import type { AccentVariant } from '../theme/palette';
import {
  useUserSettingsStore,
  type ColorSchemePreference,
} from '../store/useUserSettingsStore';
import type { ReadingMode } from '../store/useUserSettingsStore';
import { READING_MODE_META } from '../hooks/useReadingMode';

const MODES: ReadingMode[] = ['kesif', 'ogrenme', 'odak'];
const SCHEMES: { key: ColorSchemePreference; label: string }[] = [
  { key: 'system', label: 'Sistem' },
  { key: 'light', label: 'Açık' },
  { key: 'dark', label: 'Koyu' },
];
const ACCENTS: { key: AccentVariant; label: string }[] = [
  { key: 'ceviz', label: 'Ceviz' },
  { key: 'lacivert', label: 'Lacivert' },
  { key: 'mor', label: 'Mor' },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <StyledText variant="eyebrow" color="faint" style={{ marginTop: 24, marginBottom: 10 }}>
      {children.toLocaleUpperCase('tr-TR')}
    </StyledText>
  );
}

function OptionRow({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        padding: 13,
        borderRadius: theme.radius.xxl,
        backgroundColor: selected ? theme.colors.accSoft : theme.colors.surf,
        borderWidth: 1,
        borderColor: selected ? theme.colors.acc : theme.colors.line,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 19,
          height: 19,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: selected ? theme.colors.acc : theme.colors.line,
          backgroundColor: selected ? theme.colors.acc : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <StyledText variant="caption" style={{ color: theme.colors.surf }}>
            ✓
          </StyledText>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <StyledText variant="callout">{label}</StyledText>
        {description ? (
          <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
            {description}
          </StyledText>
        ) : null}
      </View>
    </Pressable>
  );
}

export function SettingsScreen() {
  const theme = useTheme();
  const readingMode = useUserSettingsStore((s) => s.readingMode);
  const setReadingMode = useUserSettingsStore((s) => s.setReadingMode);
  const colorSchemePreference = useUserSettingsStore((s) => s.colorSchemePreference);
  const setColorSchemePreference = useUserSettingsStore((s) => s.setColorSchemePreference);
  const accentVariant = useUserSettingsStore((s) => s.accentVariant);
  const setAccentVariant = useUserSettingsStore((s) => s.setAccentVariant);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <StyledText variant="title" style={{ marginTop: 12 }}>
          Ayarlar
        </StyledText>

        <SectionLabel>Okuma Modu</SectionLabel>
        {MODES.map((mode) => (
          <OptionRow
            key={mode}
            label={READING_MODE_META[mode].title}
            description={READING_MODE_META[mode].description}
            selected={readingMode === mode}
            onPress={() => setReadingMode(mode)}
          />
        ))}

        <SectionLabel>Görünüm</SectionLabel>
        {SCHEMES.map((s) => (
          <OptionRow
            key={s.key}
            label={s.label}
            selected={colorSchemePreference === s.key}
            onPress={() => setColorSchemePreference(s.key)}
          />
        ))}

        <SectionLabel>Renk Teması</SectionLabel>
        {ACCENTS.map((a) => (
          <OptionRow
            key={a.key}
            label={a.label}
            selected={accentVariant === a.key}
            onPress={() => setAccentVariant(a.key)}
          />
        ))}

        <View style={{ height: theme.spacing.xxxl }} />
      </ScrollView>
    </Screen>
  );
}
