import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { Button } from '../components/common/Button';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { useReadingProgressStore } from '../store/useReadingProgressStore';
import { useMemorizationStore } from '../store/useMemorizationStore';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { PrecisionSettingsIcon } from '../components/common/PrecisionSettingsIcon';
import { OfflineSyncService } from '../services/offlineSyncService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PROVIDER_LABEL: Record<'apple' | 'google' | 'guest', string> = {
  apple: 'Apple',
  google: 'Google',
  guest: 'Misafir',
};

function ProfileStatCard({
  value,
  label,
  sublabel,
  icon,
}: {
  value: string | number;
  label: string;
  sublabel: string;
  icon: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: theme.colors.surf,
          borderColor: theme.colors.line,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <StyledText style={{ fontSize: 16 }}>{icon}</StyledText>
        <StyledText variant="title" color="ink" style={{ fontSize: 20 }}>
          {value}
        </StyledText>
      </View>
      <View style={{ marginTop: 8 }}>
        <StyledText variant="callout" color="ink" style={{ fontWeight: '600', fontSize: 13 }}>
          {label}
        </StyledText>
        <StyledText variant="caption" color="faint" style={{ marginTop: 2, fontSize: 10.5 }}>
          {sublabel}
        </StyledText>
      </View>
    </View>
  );
}

function ProfileNavRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navRow,
        {
          backgroundColor: pressed ? theme.colors.band : theme.colors.surf,
          borderColor: theme.colors.line,
        },
      ]}
    >
      <View
        style={[
          styles.rowIconBox,
          {
            backgroundColor: theme.colors.band,
          },
        ]}
      >
        <StyledText style={{ fontSize: 16 }}>{icon}</StyledText>
      </View>

      <View style={{ flex: 1 }}>
        <StyledText variant="callout" color="ink" style={{ fontWeight: '600' }}>
          {title}
        </StyledText>
        <StyledText variant="caption" color="mut" style={{ marginTop: 2 }}>
          {subtitle}
        </StyledText>
      </View>

      <StyledText variant="title" color="faint" style={{ fontSize: 18 }}>
        ›
      </StyledText>
    </Pressable>
  );
}

/**
 * tafsil.net Profil ve Okuma Yolculuğum Ekranı (ProfileScreen)
 *
 * Sorumluluk Alanı:
 * - Kullanıcı kimliği ve oturum yönetimi (Apple / Google Auth)
 * - Manevi okuma serisi, okunan toplam ayet ve ezber kazanım metrikleri
 * - Okuma Geçmişi, Sure Matrisi ve Anlama Oturumlarına doğrudan erişim
 * - Ayarlar sayfasına pürüzsüz geçiş köprüsü
 */
export function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signOut = useAuthStore((s) => s.signOut);

  const streak = useReadingProgressStore((s) => s.streak);
  const readVersesBySurah = useReadingProgressStore((s) => s.readVersesBySurah);
  const memorizationSessions = useMemorizationStore((s) => s.sessions);

  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = React.useCallback(async (forceFullSync: boolean = false) => {
    setIsSyncing(true);
    try {
      await OfflineSyncService.syncWithServer(undefined, undefined, undefined, { forceFullSync });
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      handleSync(true); // Profil ekranına gelindiğinde sunucudan güncel verileri çek
    }, [handleSync])
  );

  // İstatistik hesaplamaları
  const totalReadVersesCount = Object.values(readVersesBySurah).reduce(
    (acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0),
    0
  );

  const memorizedVersesCount = memorizationSessions.reduce(
    (acc, s) => acc + (s.endAyah - s.startAyah + 1),
    0
  );

  const displayName = user?.name ?? (user?.isGuest ? 'Misafir Okuyucu' : 'Okuyucu');
  const initialLetter = displayName.charAt(0).toUpperCase();

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Üst Gezinti Çubuğu */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={[styles.backBtn, { backgroundColor: theme.colors.band }]}
          >
            <StyledText variant="title" color="ink" style={{ fontSize: 22, marginTop: -2 }}>
              ‹
            </StyledText>
          </Pressable>

          <StyledText variant="headline" color="ink" style={{ fontSize: 17, fontWeight: '600' }}>
            Profil ve Yolculuğum
          </StyledText>

          {/* Senkronizasyon ve Ayarlar Kısayolları */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => handleSync(true)}
              hitSlop={12}
              style={[styles.settingsBtn, { backgroundColor: theme.colors.surf, borderColor: theme.colors.line }]}
            >
              <StyledText style={{ fontSize: 15, color: isSyncing ? theme.colors.acc : theme.colors.mut }}>
                {isSyncing ? '…' : '↻'}
              </StyledText>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('Settings')}
              hitSlop={12}
              style={[styles.settingsBtn, { backgroundColor: theme.colors.surf, borderColor: theme.colors.line }]}
            >
              <PrecisionSettingsIcon size={17} color={theme.colors.mut} bgColor={theme.colors.surf} />
            </Pressable>
          </View>
        </View>

        {/* Kimlik Kartı */}
        <View
          style={[
            styles.identityCard,
            {
              backgroundColor: theme.colors.surf,
              borderColor: theme.colors.line,
            },
          ]}
        >
          <View style={styles.identityRow}>
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: theme.colors.accSoft,
                  borderColor: theme.colors.line,
                },
              ]}
            >
              <StyledText
                style={{
                  fontFamily: theme.font.serifSemiBold,
                  fontSize: 26,
                  color: theme.colors.acc,
                }}
              >
                {initialLetter}
              </StyledText>
            </View>

            <View style={{ flex: 1 }}>
              <StyledText variant="title" color="ink" style={{ fontSize: 20 }}>
                {displayName}
              </StyledText>
              <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
                {user?.email ?? 'Misafir Okuyucu'}
              </StyledText>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: isAuthenticated && !user?.isGuest ? '#22C55E' : theme.colors.acc,
                  }}
                />
                <StyledText variant="caption" color="faint" style={{ fontSize: 11 }}>
                  {isAuthenticated && user && !user.isGuest
                    ? `${PROVIDER_LABEL[user.provider]} ile bağlandı`
                    : 'Misafir modu (Yerel cihaz · Senkronize değil)'}
                </StyledText>
              </View>
            </View>
          </View>

          {/* Giriş Yap / Çıkış Yap Aksiyonu */}
          <View style={{ marginTop: 14, gap: 8 }}>
            {isAuthenticated && user && !user.isGuest ? (
              <Button
                label={t('settings.signOut')}
                variant="secondary"
                onPress={signOut}
                style={{ height: 40 }}
              />
            ) : (
              <>
                <Button
                  label="Hesabı Bağla (Apple / Google)"
                  variant="primary"
                  onPress={() => {
                    useAuthStore.getState().resetAuthStep();
                    navigation.navigate('Auth');
                  }}
                  style={{ height: 42 }}
                />
                {user?.isGuest && (
                  <Button
                    label="Misafir Oturumunu Sıfırla"
                    variant="ghost"
                    onPress={signOut}
                    style={{ height: 36 }}
                  />
                )}
              </>
            )}
          </View>
        </View>

        {/* İstatistik Metrikleri */}
        <StyledText variant="eyebrow" color="faint" style={{ marginTop: 24, marginBottom: 12 }}>
          MANEVİ OKUMA KARNESİ
        </StyledText>

        <View style={styles.statsGrid}>
          <ProfileStatCard
            icon="🌿"
            value={`${streak.current} gün`}
            label="Okuma Serisi"
            sublabel={`En uzun: ${streak.longest} gün`}
          />
          <ProfileStatCard
            icon="📖"
            value={totalReadVersesCount}
            label="Okunan Ayet"
            sublabel="Mushaf takibi"
          />
          <ProfileStatCard
            icon="◈"
            value={memorizedVersesCount}
            label="Ezber Ayeti"
            sublabel={`${memorizationSessions.length} aktif bölüm`}
          />
        </View>

        {/* Kişisel Kütüphane ve Arşiv Kısayolları */}
        <StyledText variant="eyebrow" color="faint" style={{ marginTop: 26, marginBottom: 12 }}>
          KİŞİSEL ARŞİV VE KAYITLAR
        </StyledText>

        <View style={{ gap: 8 }}>
          <ProfileNavRow
            icon="⏱"
            title="Okuma Geçmişi"
            subtitle="Tarih sırasıyla okuduğun sure ve ayet seansları"
            onPress={() => navigation.navigate('ReadingHistory')}
          />
          <ProfileNavRow
            icon="▦"
            title="Sure İlerleme Matrisi"
            subtitle="114 surenin tamamındaki okuma ve ezber ısı haritası"
            onPress={() => navigation.navigate('ProgressMatrix')}
          />
          <ProfileNavRow
            icon="💡"
            title="Anlama Çalışmaları"
            subtitle="Kavramsal derinleşme ve soru oturumların"
            onPress={() => navigation.navigate('UnderstandingList')}
          />
        </View>

        {/* Ayarlar Köprüsü */}
        <StyledText variant="eyebrow" color="faint" style={{ marginTop: 26, marginBottom: 12 }}>
          UYGULAMA
        </StyledText>

        <ProfileNavRow
          icon="⚙"
          title="Uygulama Ayarları"
          subtitle="Okuma modu, açık/koyu tema, renk paleti ve dil"
          onPress={() => navigation.navigate('Settings')}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  rowIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
