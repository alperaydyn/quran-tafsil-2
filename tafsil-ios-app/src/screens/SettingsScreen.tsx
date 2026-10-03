import React from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import Constants from 'expo-constants';
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
import { ReadingAppearanceSheet } from '../components/reading/ReadingAppearanceSheet';
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from '../api/config';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const BUILD_NUMBER =
  (Constants.expoConfig?.ios?.buildNumber as string | undefined) ??
  (Constants as any).nativeBuildVersion ??
  '';

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
  const [appearanceSheetVisible, setAppearanceSheetVisible] = React.useState(false);

  const readingMode = useUserSettingsStore((s) => s.readingMode);
  const setReadingMode = useUserSettingsStore((s) => s.setReadingMode);
  const colorSchemePreference = useUserSettingsStore((s) => s.colorSchemePreference);
  const setColorSchemePreference = useUserSettingsStore((s) => s.setColorSchemePreference);
  const accentVariant = useUserSettingsStore((s) => s.accentVariant);
  const setAccentVariant = useUserSettingsStore((s) => s.setAccentVariant);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signOut = useAuthStore((s) => s.signOut);
  const sessionExpired = useAuthStore((s) => s.sessionExpired);

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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 4 }}>
          {navigation.canGoBack() && (
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={{
                marginRight: 12,
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.band,
              }}
            >
              <StyledText variant="title" color="ink" style={{ fontSize: 22, marginTop: -2 }}>
                ‹
              </StyledText>
            </Pressable>
          )}
          <StyledText variant="title">
            {t('settings.title')}
          </StyledText>
        </View>

        {/* Profil ve Okuma Karnesi Kısayolu */}
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            padding: 13,
            borderRadius: theme.radius.xxl,
            backgroundColor: pressed ? theme.colors.band : theme.colors.surf,
            borderWidth: 1,
            borderColor: theme.colors.line,
            marginTop: 10,
            marginBottom: 6,
            gap: 12,
          })}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 13,
              backgroundColor: theme.colors.accSoft,
              borderWidth: 1,
              borderColor: theme.colors.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StyledText
              style={{
                fontFamily: theme.font.serifSemiBold,
                fontSize: 18,
                color: theme.colors.acc,
              }}
            >
              {user?.name
                ? user.name.charAt(0).toUpperCase()
                : user?.isGuest
                ? 'M'
                : 'O'}
            </StyledText>
          </View>
          <View style={{ flex: 1 }}>
            <StyledText variant="callout" color="ink" style={{ fontWeight: '600' }}>
              {user?.name ?? (user?.isGuest ? 'Misafir Okuyucu' : 'Okuyucu')}
            </StyledText>
            <StyledText variant="caption" color="mut" style={{ marginTop: 2 }}>
              Profil, manevi karne ve hesap yönetimi
            </StyledText>
          </View>
          <StyledText variant="title" color="faint" style={{ fontSize: 18 }}>
            ›
          </StyledText>
        </Pressable>

        {/* Oturum süresi doldu uyarısı (PBI-9.6) — yerel veriler korunur */}
        {sessionExpired && (
          <Pressable
            onPress={() => navigation.navigate('Auth')}
            style={({ pressed }) => ({
              padding: 13,
              borderRadius: theme.radius.xxl,
              backgroundColor: pressed ? theme.colors.band : theme.colors.accSoft,
              borderWidth: 1,
              borderColor: theme.colors.acc,
              marginBottom: 6,
            })}
          >
            <StyledText variant="callout" color="acc" style={{ fontWeight: '600' }}>
              Oturumunuzun süresi doldu
            </StyledText>
            <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
              Okuma geçmişiniz bu cihazda güvende. Senkronizasyona devam etmek için yeniden giriş yapın.
            </StyledText>
          </Pressable>
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

        <SectionLabel>OKUMA & TİPOGRAFİ</SectionLabel>
        <OptionRow
          label="Metin & Görünüm Ayarları"
          description="Arapça ve meal yazı boyutları, satır aralıkları ve görünüm katmanları"
          selected={false}
          onPress={() => setAppearanceSheetVisible(true)}
        />

        {__DEV__ && (
          <>
            <SectionLabel>ÖNİZLEME</SectionLabel>
            <OptionRow
              label="Tanıtım & Niyet Seçimi (Onboarding)"
              description="İlk açılış deneyimini ve niyet seçimini önizle"
              selected={false}
              onPress={() => navigation.navigate('Onboarding')}
            />
            <OptionRow
              label="Açılış Ekranı (Loading)"
              description="Başlangıç animasyonunu ve ayet tefekkürünü önizle"
              selected={false}
              onPress={() => navigation.navigate('Loading')}
            />
          </>
        )}

        <SectionLabel>HAKKINDA</SectionLabel>
        <OptionRow
          label="Gizlilik Politikası"
          description="Hangi verilerin neden ve nasıl işlendiği"
          selected={false}
          onPress={() => {
            Linking.openURL(PRIVACY_POLICY_URL).catch(() => {});
          }}
        />
        <OptionRow
          label="Geri Bildirim Gönder"
          description={SUPPORT_EMAIL}
          selected={false}
          onPress={() => {
            const subject = encodeURIComponent(
              `Tafsil geri bildirim (v${APP_VERSION}${BUILD_NUMBER ? ` / ${BUILD_NUMBER}` : ''})`
            );
            Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`).catch(() => {});
          }}
        />
        <StyledText variant="caption" color="faint" style={{ textAlign: 'center', marginTop: 12 }}>
          {`Tafsil v${APP_VERSION}${BUILD_NUMBER ? ` (${BUILD_NUMBER})` : ''}`}
        </StyledText>

        <View style={{ height: theme.spacing.xxxl }} />
      </ScrollView>

      <ReadingAppearanceSheet
        visible={appearanceSheetVisible}
        onClose={() => setAppearanceSheetVisible(false)}
      />
    </Screen>
  );
}

