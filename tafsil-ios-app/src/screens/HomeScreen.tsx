import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { useReadingProgressStore } from '../store/useReadingProgressStore';
import { useUserSettingsStore } from '../store/useUserSettingsStore';
import { READING_MODE_META } from '../hooks/useReadingMode';
import { mockSurahs } from '../api/mock/surahs.mock';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function ResumeCard() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const lastRead = useReadingProgressStore((s) => s.lastRead);

  const surah = lastRead ? mockSurahs.find((s) => s.id === lastRead.surahId) : undefined;

  return (
    <Pressable
      onPress={() =>
        lastRead && navigation.navigate('Reading', { surahId: lastRead.surahId, ayahNo: lastRead.ayahNo })
      }
      disabled={!lastRead}
      style={{
        backgroundColor: theme.colors.ink,
        borderRadius: theme.radius.xxxl,
        padding: 18,
        gap: 6,
      }}
    >
      <StyledText variant="eyebrow" style={{ color: theme.colors.faint }}>
        KALDIĞIM YERDEN DEVAM ET
      </StyledText>
      <StyledText variant="headline" style={{ color: theme.colors.surf }}>
        {lastRead ? `${surah?.nameTr ?? 'Sure'} · ${lastRead.ayahNo}. ayet` : 'Henüz okumaya başlamadın'}
      </StyledText>
      {!lastRead && (
        <StyledText variant="footnote" style={{ color: theme.colors.faint }}>
          Sureler sekmesinden bir sure seçerek başla.
        </StyledText>
      )}
    </Pressable>
  );
}

function ModeBadge() {
  const theme = useTheme();
  const readingMode = useUserSettingsStore((s) => s.readingMode);
  const meta = READING_MODE_META[readingMode];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.accSoft,
        borderRadius: theme.radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <StyledText variant="caption" color="acc">
        {meta.title.toLocaleUpperCase('tr-TR')} MODU
      </StyledText>
    </View>
  );
}

function HeatmapPlaceholder() {
  const theme = useTheme();
  const readVersesBySurah = useReadingProgressStore((s) => s.readVersesBySurah);
  const activeCount = Object.keys(readVersesBySurah).length;

  return (
    <View
      style={{
        backgroundColor: theme.colors.surf,
        borderWidth: 1,
        borderColor: theme.colors.line,
        borderRadius: theme.radius.xxxl,
        padding: 15,
        gap: 8,
      }}
    >
      <StyledText variant="eyebrow" color="faint">
        OKUMA VE TEFEKKÜR BAHÇESİ
      </StyledText>
      <StyledText variant="footnote" color="mut">
        {activeCount > 0
          ? `${activeCount} surede okuma kaydın var. 114 surelik ısı haritası MOB-016'da eklenecek.`
          : '114 surelik ısı haritası matrisi burada görünecek (MOB-016).'}
      </StyledText>
    </View>
  );
}

export function HomeScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ marginTop: 12, marginBottom: 16, gap: 8 }}>
          <ModeBadge />
          <StyledText variant="title">Selam.</StyledText>
        </View>

        <View style={{ gap: theme.spacing.lg }}>
          <ResumeCard />
          <HeatmapPlaceholder />
        </View>
      </ScrollView>
    </Screen>
  );
}
