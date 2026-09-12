import React, { useEffect, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { WordBottomSheet } from '../components/reading/WordBottomSheet';
import { useTheme } from '../theme';
import { getVerses } from '../api/client';
import type { Verse, Word } from '../api/types';
import type { RootStackParamList } from '../navigation/types';
import { useReadingMode } from '../hooks/useReadingMode';
import { useReadingProgressStore } from '../store/useReadingProgressStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Reading'>;

function VerseCard({
  verse,
  onWordPress,
}: {
  verse: Verse;
  onWordPress: (word: Word) => void;
}) {
  const theme = useTheme();
  const mode = useReadingMode();

  // Kelimeler varsa kelime bazlı, yoksa boşlukla ayrılmış kelimeler olarak render et
  const words: Word[] =
    verse.words && verse.words.length > 0
      ? verse.words
      : verse.textAr.split(' ').map((w, idx) => ({
          id: idx + 1,
          position: idx + 1,
          textAr: w,
          textTr: '',
          rootId: null,
          startMs: 0,
          endMs: 0,
        }));

  return (
    <View
      style={{
        backgroundColor: theme.colors.surf,
        borderWidth: 1,
        borderColor: theme.colors.line,
        borderRadius: theme.radius.xxl,
        padding: 16,
        marginBottom: 14,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 8,
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
            {verse.surahId}:{verse.ayahNo} · Cüz {verse.juzNo} · Sayfa {verse.pageNo}
          </StyledText>
        </View>
      </View>

      {mode.arabicEmphasis !== 'hidden' && (
        <View
          style={{
            flexDirection: 'row-reverse',
            flexWrap: 'wrap',
            gap: 6,
            justifyContent: 'flex-start',
            paddingVertical: 4,
          }}
        >
          {words.map((word, idx) => (
            <Pressable
              key={`${verse.id}-word-${idx}`}
              onPress={() => onWordPress(word)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? theme.colors.band : 'transparent',
                borderRadius: theme.radius.sm,
                paddingHorizontal: 3,
                paddingVertical: 2,
              })}
            >
              <StyledText
                variant={mode.arabicEmphasis === 'hero' ? 'arabicHero' : 'arabicReading'}
                style={{ writingDirection: 'rtl', textAlign: 'right' }}
              >
                {word.textAr}
              </StyledText>
            </Pressable>
          ))}
        </View>
      )}

      {mode.showTransliteration && verse.transliterationTr ? (
        <StyledText variant="footnote" color="mut" style={{ lineHeight: 20 }}>
          {verse.transliterationTr}
        </StyledText>
      ) : null}

      {mode.mealEmphasis !== 'minimal' && (
        <StyledText
          variant={mode.mealEmphasis === 'primary' ? 'bodyLarge' : 'body'}
          color="ink"
          style={{ lineHeight: 22 }}
        >
          {verse.mealTr || 'Bu ayet için meal çevirisi hazırlanıyor.'}
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
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

  const markVerseRead = useReadingProgressStore((s) => s.markVerseRead);
  const setLastRead = useReadingProgressStore((s) => s.setLastRead);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getVerses(surahId).then((res) => {
      if (mounted && res.success && res.data) {
        setVerses(res.data);
      }
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
  }, [verses, surahId, markVerseRead, setLastRead]);

  const handleWordPress = (word: Word) => {
    setSelectedWord(word);
    setBottomSheetVisible(true);
  };

  return (
    <Screen edges={['left', 'right']}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <StyledText variant="footnote" color="mut">
            Ayetler yükleniyor…
          </StyledText>
        </View>
      ) : verses.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <StyledText variant="body" color="mut" style={{ textAlign: 'center' }}>
            Ayet içeriği bulunamadı.
          </StyledText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 36, paddingHorizontal: theme.spacing.lg }}
          showsVerticalScrollIndicator={false}
        >
          {verses.map((v) => (
            <VerseCard key={v.id} verse={v} onWordPress={handleWordPress} />
          ))}
        </ScrollView>
      )}

      <WordBottomSheet
        word={selectedWord}
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
      />
    </Screen>
  );
}
