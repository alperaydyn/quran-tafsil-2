import React, { useEffect, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { WordDetailSheet } from '../components/lexicon/WordDetailSheet';
import { AudioPlaybackBar } from '../components/reading/AudioPlaybackBar';
import { OfflineSyncService } from '../services/offlineSyncService';
import { useTheme } from '../theme';
import { getVerses } from '../api/client';
import type { Verse, Word } from '../api/types';
import type { RootStackParamList } from '../navigation/types';
import { useReadingMode } from '../hooks/useReadingMode';
import { useReadingProgressStore } from '../store/useReadingProgressStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Reading'>;

function VerseCard({
  verse,
  isVerseActive,
  activeWordIndex,
  onWordPress,
  onBookmarkToggle,
  isBookmarked,
}: {
  verse: Verse;
  isVerseActive: boolean;
  activeWordIndex: number | null;
  onWordPress: (word: Word) => void;
  onBookmarkToggle: () => void;
  isBookmarked: boolean;
}) {
  const theme = useTheme();
  const mode = useReadingMode();

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
        borderColor: isVerseActive ? '#D4A853' : theme.colors.line,
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
              backgroundColor: isVerseActive ? '#D4A853' : theme.colors.band,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StyledText variant="caption" style={{ color: isVerseActive ? '#171613' : theme.colors.mut, fontWeight: '700' }}>
              {verse.ayahNo}
            </StyledText>
          </View>
          <StyledText variant="footnote" color="faint">
            {verse.surahId}:{verse.ayahNo} · Cüz {verse.juzNo} · Sayfa {verse.pageNo}
          </StyledText>
        </View>

        <Pressable onPress={onBookmarkToggle} hitSlop={8}>
          <StyledText style={{ fontSize: 16, color: isBookmarked ? '#D4A853' : theme.colors.mut }}>
            {isBookmarked ? '★' : '☆'}
          </StyledText>
        </Pressable>
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
          {words.map((word, idx) => {
            const isWordActive = isVerseActive && activeWordIndex === idx;
            return (
              <Pressable
                key={`${verse.id}-word-${idx}`}
                onPress={() => onWordPress(word)}
                style={({ pressed }) => ({
                  backgroundColor: isWordActive
                    ? 'rgba(212, 168, 83, 0.28)'
                    : pressed
                    ? theme.colors.band
                    : 'transparent',
                  borderRadius: theme.radius.sm,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderWidth: isWordActive ? 1 : 0,
                  borderColor: isWordActive ? '#D4A853' : 'transparent',
                })}
              >
                <StyledText
                  variant={mode.arabicEmphasis === 'hero' ? 'arabicHero' : 'arabicReading'}
                  style={{
                    writingDirection: 'rtl',
                    textAlign: 'right',
                    color: isWordActive ? '#8C5B00' : theme.colors.ink,
                  }}
                >
                  {word.textAr}
                </StyledText>
              </Pressable>
            );
          })}
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

export function ReadingScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { surahId } = route.params;
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<number>>(new Set());

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAyah, setActiveAyah] = useState(1);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

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

    // Load bookmarks
    OfflineSyncService.getBookmarks().then((bms) => {
      if (mounted) {
        const set = new Set(bms.filter((b) => b.sure_id === surahId).map((b) => b.ayet_no));
        setBookmarkedSet(set);
      }
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
      verses.forEach((v) => {
        markVerseRead(surahId, v.ayahNo, today);
        OfflineSyncService.recordReading(surahId, v.ayahNo, 20);
      });
    }
  }, [verses, surahId, markVerseRead, setLastRead]);

  // Simulated word-by-word karaoke sync timer when playing
  useEffect(() => {
    if (!isPlaying) {
      setActiveWordIndex(null);
      return;
    }

    const currentVerse = verses.find((v) => v.ayahNo === activeAyah);
    const wordCount = currentVerse?.words?.length || currentVerse?.textAr.split(' ').length || 5;

    let currentWord = 0;
    setActiveWordIndex(0);

    const interval = setInterval(() => {
      currentWord++;
      if (currentWord < wordCount) {
        setActiveWordIndex(currentWord);
      } else {
        // Move to next verse or stop
        if (activeAyah < verses.length) {
          setActiveAyah((prev) => prev + 1);
          currentWord = 0;
        } else {
          setIsPlaying(false);
          setActiveWordIndex(null);
        }
      }
    }, 900);

    return () => clearInterval(interval);
  }, [isPlaying, activeAyah, verses]);

  const toggleBookmark = (ayahNo: number) => {
    const next = new Set(bookmarkedSet);
    if (next.has(ayahNo)) {
      next.delete(ayahNo);
      OfflineSyncService.removeBookmark(surahId, ayahNo);
    } else {
      next.add(ayahNo);
      OfflineSyncService.addBookmark(surahId, ayahNo, 'Tefekkür');
    }
    setBookmarkedSet(next);
  };

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
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingBottom: 4 }}>
            <StyledText variant="caption" color="faint" style={{ fontSize: 11 }}>
              {verses.length} Ayet · Çevrimdışı Hazır
            </StyledText>

            <Pressable
              onPress={() => navigation.navigate('EnglishReading', { surahId })}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: theme.colors.band,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: theme.radius.sm,
              }}
            >
              <StyledText variant="caption" color="mut" style={{ fontSize: 11 }}>
                Dil:
              </StyledText>
              <StyledText variant="caption" color="acc" style={{ fontWeight: '700', fontSize: 11 }}>
                TR ➔ EN
              </StyledText>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingTop: theme.spacing.sm, paddingBottom: 80, paddingHorizontal: theme.spacing.lg }}
            showsVerticalScrollIndicator={false}
          >
            {verses.map((v) => (
              <VerseCard
                key={v.id}
                verse={v}
                isVerseActive={isPlaying && activeAyah === v.ayahNo}
                activeWordIndex={isPlaying && activeAyah === v.ayahNo ? activeWordIndex : null}
                onWordPress={handleWordPress}
                onBookmarkToggle={() => toggleBookmark(v.ayahNo)}
                isBookmarked={bookmarkedSet.has(v.ayahNo)}
              />
            ))}
          </ScrollView>

          {/* Floating Audio Playback Dock */}
          <AudioPlaybackBar
            surahId={surahId}
            totalVerses={verses.length}
            currentAyah={activeAyah}
            activeWordIndex={activeWordIndex}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onNextVerse={() => {
              if (activeAyah < verses.length) {
                setActiveAyah(activeAyah + 1);
                setActiveWordIndex(0);
              }
            }}
            onPrevVerse={() => {
              if (activeAyah > 1) {
                setActiveAyah(activeAyah - 1);
                setActiveWordIndex(0);
              }
            }}
          />
        </>
      )}

      <WordDetailSheet
        word={selectedWord}
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        onOpenDag={() => navigation.navigate('Main', { screen: 'DagExplorer' })}
      />
    </Screen>
  );
}
