import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { Button } from '../components/common/Button';
import { useTheme } from '../theme';
import type { AccentVariant } from '../theme/palette';
import {
  useUserSettingsStore,
  type ColorSchemePreference,
} from '../store/useUserSettingsStore';
import type { ReadingMode } from '../store/useUserSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation, SUPPORTED_LANGUAGES, type LanguagePreference } from '../i18n';
import type { RootStackParamList } from '../navigation/types';

const PROVIDER_LABEL: Record<'apple' | 'google', string> = {
  apple: 'Apple',
  google: 'Google',
};

const MODES: ReadingMode[] = ['kesif', 'ogrenme', 'odak'];

function SectionLabel({ children }: { children: string }) {
  return (
    <StyledText variant="eyebrow" color="faint" style={{ marginTop: 24, marginBottom: 10 }}>
      {children.toUpperCase()}
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

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { t, language, setLanguage } = useTranslation();

  const readingMode = useUserSettingsStore((s) => s.readingMode);
  const setReadingMode = useUserSettingsStore((s) => s.setReadingMode);
  const colorSchemePreference = useUserSettingsStore((s) => s.colorSchemePreference);
  const setColorSchemePreference = useUserSettingsStore((s) => s.setColorSchemePreference);
  const accentVariant = useUserSettingsStore((s) => s.accentVariant);
  const setAccentVariant = useUserSettingsStore((s) => s.setAccentVariant);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signOut = useAuthStore((s) => s.signOut);

  const schemes: { key: ColorSchemePreference; label: string }[] = [
    { key: 'system', label: t('settings.schemes.system') },
    { key: 'light', label: t('settings.schemes.light') },
    { key: 'dark', label: t('settings.schemes.dark') },
  ];

  const accents: { key: AccentVariant; label: string }[] = [
    { key: 'ceviz', label: t('settings.accents.ceviz') },
    { key: 'lacivert', label: t('settings.accents.lacivert') },
    { key: 'mor', label: t('settings.accents.mor') },
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <StyledText variant="title" style={{ marginTop: 12 }}>
          {t('settings.title')}
        </StyledText>

        <SectionLabel>{t('settings.account')}</SectionLabel>
        {isAuthenticated && user ? (
          <View
            style={{
              padding: 13,
              borderRadius: theme.radius.xxl,
              backgroundColor: theme.colors.surf,
              borderWidth: 1,
              borderColor: theme.colors.line,
              marginBottom: 8,
              gap: 10,
            }}
          >
            <View>
              <StyledText variant="callout">{user.name ?? user.email ?? t('settings.myAccount')}</StyledText>
              <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
                {t('settings.connectedWith', { provider: PROVIDER_LABEL[user.provider] })}
              </StyledText>
            </View>
            <Button label={t('settings.signOut')} variant="secondary" onPress={signOut} />
          </View>
        ) : (
          <Button label={t('settings.signIn')} variant="secondary" onPress={() => navigation.navigate('Auth')} />
        )}

        <SectionLabel>{t('settings.readingMode')}</SectionLabel>
        {MODES.map((mode) => (
          <OptionRow
            key={mode}
            label={t(`readingModes.${mode}.title`)}
            description={t(`readingModes.${mode}.description`)}
            selected={readingMode === mode}
            onPress={() => setReadingMode(mode)}
          />
        ))}

        <SectionLabel>{t('settings.appearance')}</SectionLabel>
        {schemes.map((s) => (
          <OptionRow
            key={s.key}
            label={s.label}
            selected={colorSchemePreference === s.key}
            onPress={() => setColorSchemePreference(s.key)}
          />
        ))}

        <SectionLabel>{t('settings.colorTheme')}</SectionLabel>
        {accents.map((a) => (
          <OptionRow
            key={a.key}
            label={a.label}
            selected={accentVariant === a.key}
            onPress={() => setAccentVariant(a.key)}
          />
        ))}

        <SectionLabel>{t('settings.language')}</SectionLabel>
        {SUPPORTED_LANGUAGES.map((langOpt) => (
          <OptionRow
            key={langOpt.code}
            label={`${langOpt.nativeLabel} (${langOpt.label})`}
            description={langOpt.description}
            selected={language === langOpt.code}
            onPress={() => setLanguage(langOpt.code)}
          />
        ))}

        <View style={{ height: theme.spacing.xxxl }} />
      </ScrollView>
    </Screen>
  );
}

