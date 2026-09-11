import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';
import { getVerses } from '../api/client';
import type { Verse } from '../api/types';
import type { RootStackParamList } from '../navigation/types';
import { useReadingMode } from '../hooks/useReadingMode';
import { useReadingProgressStore } from '../store/useReadingProgressStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Reading'>;

function VerseCard({ verse }: { verse: Verse }) {
  const theme = useTheme();
  const mode = useReadingMode();

  return (
    <View
      style={{
        backgroundColor: theme.colors.surf,
        borderWidth: 1,
        borderColor: theme.colors.line,
        borderRadius: theme.radius.xxl,
        padding: 15,
        marginBottom: 12,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 21,
            height: 21,
            borderRadius: 7,
            backgroundColor: theme.colors.band,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StyledText variant="caption" color="mut">
            {verse.ayahNo}
          </StyledText>
        </View>
        <StyledText variant="footnote" color="faint">
          {verse.surahId}:{verse.ayahNo}
        </StyledText>
      </View>

      {mode.arabicEmphasis !== 'hidden' && (
        <StyledText
          variant={mode.arabicEmphasis === 'hero' ? 'arabicHero' : 'arabicReading'}
          style={{ writingDirection: 'rtl', textAlign: 'right' }}
        >
          {verse.textAr}
        </StyledText>
      )}

      {mode.showTransliteration && (
        <StyledText variant="footnote" color="mut">
          {verse.transliterationTr}
        </StyledText>
      )}

      {mode.mealEmphasis !== 'minimal' && (
        <StyledText variant={mode.mealEmphasis === 'primary' ? 'bodyLarge' : 'body'} color="ink">
          {verse.mealTr}
        </StyledText>
      )}
    </View>
  );
}

export function ReadingScreen({ route }: Props) {
  const theme = useTheme();
  const { surahId } = route.params;
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const markVerseRead = useReadingProgressStore((s) => s.markVerseRead);
  const setLastRead = useReadingProgressStore((s) => s.setLastRead);

  useEffect(() => {
    let mounted = true;
    getVerses(surahId).then((res) => {
      if (mounted && res.success && res.data) setVerses(res.data);
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [surahId]);

  useEffect(() => {
    if (verses.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const last = verses[verses.length - 1];
      setLastRead(surahId, last.ayahNo, new Date().toISOString());
      verses.forEach((v) => markVerseRead(surahId, v.ayahNo, today));
    }
    // Not: Bu basit mock akışında ekran açıldığında tüm ayetler "okundu"
    // sayılır. Gerçek ilerleme takibi (görünürlük bazlı) MOB-015'te
    // scroll/viewport ile hassaslaştırılacak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verses]);

  return (
    <Screen edges={['left', 'right']}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <StyledText variant="footnote" color="mut">
            Yükleniyor…
          </StyledText>
        </View>
      ) : verses.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <StyledText variant="body" color="mut" style={{ textAlign: 'center' }}>
            Bu sure için mock içerik henüz eklenmedi. Şimdilik yalnızca Alak (96) suresi
            örnek veriyle geliyor.
          </StyledText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingTop: theme.spacing.lg, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {verses.map((v) => (
            <VerseCard key={v.id} verse={v} />
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
