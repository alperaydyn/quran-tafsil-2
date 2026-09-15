import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, View, Pressable, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { WordDetailSheet } from '../components/lexicon/WordDetailSheet';
import { AudioPlaybackBar } from '../components/reading/AudioPlaybackBar';
import { ConceptContextCard } from '../components/reading/ConceptContextCard';
import { OfflineSyncService } from '../services/offlineSyncService';
import { useTheme } from '../theme';
import { getVerses } from '../api/client';
import type { Verse, Word } from '../api/types';
import type { RootStackParamList } from '../navigation/types';
import { useReadingMode } from '../hooks/useReadingMode';
import { useReadingProgressStore } from '../store/useReadingProgressStore';
import { getConceptDetails } from '../data/concepts.seed';

type Props = NativeStackScreenProps<RootStackParamList, 'Reading'>;

/**
 * Ayet mealindeki [görünen_kelime|kavram_slug] etiketlerini ayrıştırır.
 * Kaynak: Tafsil.dc.html satır 561 (segsOf)
 */
function segsOf(text: string): { text: string; conceptSlug: string | null }[] {
  if (!text) return [];
  const out: { text: string; conceptSlug: string | null }[] = [];
  const re = /\[([^\|\]]+)\|([^\]]+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) {
      out.push({ text: text.slice(last, m.index), conceptSlug: null });
    }
    out.push({ text: m[1], conceptSlug: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push({ text: text.slice(last), conceptSlug: null });
  }
  return out;
}

function VerseCard({
  verse,
  isVerseActive,
  activeWordIndex,
  onWordPress,
  onBookmarkToggle,
  isBookmarked,
  onLayout,
  activeChain,
  onConceptPress,
  onSelectRelatedConcept,
  onCloseConcept,
  onOpenDag,
}: {
  verse: Verse;
  isVerseActive: boolean;
  activeWordIndex: number | null;
  onWordPress: (word: Word, verse: Verse) => void;
  onBookmarkToggle: () => void;
  isBookmarked: boolean;
  onLayout?: (e: LayoutChangeEvent) => void;
  activeChain?: string[];
  onConceptPress: (slug: string) => void;
  onSelectRelatedConcept: (slug: string, depth: number) => void;
  onCloseConcept: (depth: number) => void;
  onOpenDag?: (slug: string) => void;
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

  const activeTint = theme.scheme === 'dark' ? 'rgba(127, 163, 204, 0.07)' : 'rgba(63, 95, 134, 0.04)';
  const segments = segsOf(verse.mealTr || 'Bu ayet için meal çevirisi hazırlanıyor.');

  return (
    <View
      onLayout={onLayout}
      style={{
        backgroundColor: isVerseActive ? activeTint : theme.colors.surf,
        borderWidth: 1.5,
        borderColor: isVerseActive ? theme.colors.acc : theme.colors.line,
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
              backgroundColor: isVerseActive ? theme.colors.acc : theme.colors.band,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StyledText
              variant="caption"
              style={{
                color: isVerseActive ? (theme.scheme === 'dark' ? '#14130F' : '#FFFFFF') : theme.colors.mut,
                fontWeight: '700',
              }}
            >
              {verse.ayahNo}
            </StyledText>
          </View>
          <StyledText variant="footnote" color="faint">
            {verse.surahId}:{verse.ayahNo} · Cüz {verse.juzNo} · Sayfa {verse.pageNo}
          </StyledText>
        </View>

        <Pressable onPress={onBookmarkToggle} hitSlop={8}>
          <StyledText style={{ fontSize: 16, color: isBookmarked ? theme.colors.acc : theme.colors.mut }}>
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
                onPress={() => onWordPress(word, verse)}
                style={({ pressed }) => ({
                  backgroundColor: isWordActive
                    ? theme.colors.accSoft
                    : pressed
                      ? theme.colors.band
                      : 'transparent',
                  borderRadius: theme.radius.sm,
                  paddingHorizontal: 5,
                  paddingVertical: 2,
                  borderWidth: isWordActive ? 1 : 0,
                  borderColor: isWordActive ? theme.colors.acc : 'transparent',
                })}
              >
                <StyledText
                  variant={mode.arabicEmphasis === 'hero' ? 'arabicHero' : 'arabicReading'}
                  style={{
                    writingDirection: 'rtl',
                    textAlign: 'right',
                    color: isWordActive ? theme.colors.acc : theme.colors.ink,
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
          {segments.map((seg, sIdx) => {
            if (seg.conceptSlug) {
              return (
                <Pressable
                  key={`seg-${sIdx}`}
                  onPress={() => onConceptPress(seg.conceptSlug!)}
                  hitSlop={6}
                  style={({ pressed }) => ({
                    borderBottomWidth: 1.5,
                    borderBottomColor: theme.colors.acc,
                    backgroundColor: pressed ? theme.colors.accSoft : 'transparent',
                    borderRadius: 3,
                    marginHorizontal: 1,
                  })}
                >
                  <StyledText
                    variant={mode.mealEmphasis === 'primary' ? 'bodyLarge' : 'body'}
                    style={{
                      color: theme.colors.acc,
                      fontWeight: '600',
                      lineHeight: 24,
                    }}
                  >
                    {seg.text}
                  </StyledText>
                </Pressable>
              );
            }
            return (
              <StyledText
                key={`seg-${sIdx}`}
                variant={mode.mealEmphasis === 'primary' ? 'bodyLarge' : 'body'}
                color="ink"
                style={{ lineHeight: 24 }}
              >
                {seg.text}
              </StyledText>
            );
          })}
        </View>
      )}

      {/* İç İçe Açılan Zincirleme Bağlam Blokları (Nested Context Cards) */}
      {activeChain && activeChain.length > 0 && (
        <View style={{ marginTop: 6 }}>
          {activeChain.map((slug, depth) => {
            const concept = getConceptDetails(slug);
            if (!concept) return null;
            return (
              <ConceptContextCard
                key={`${verse.id}-${slug}-${depth}`}
                concept={concept}
                depth={depth}
                isLastInChain={depth === activeChain.length - 1}
                onSelectRelatedConcept={(relSlug) => onSelectRelatedConcept(relSlug, depth)}
                onClose={() => onCloseConcept(depth)}
                onOpenDag={onOpenDag}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

export function ReadingScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { surahId, ayahNo: initialAyahNo, autoPlay } = route.params;
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<number>>(new Set());

  // Audio state
  const [isPlaying, setIsPlaying] = useState(Boolean(autoPlay));
  const [activeAyah, setActiveAyah] = useState(initialAyahNo ?? 1);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

  // Aktif açık olan kavram zinciri ve hangi ayete ait olduğu
  const [activeChain, setActiveChain] = useState<string[]>([]);
  const [chainAyah, setChainAyah] = useState<number | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const verseLayouts = useRef<{ [ayahNo: number]: { y: number; height: number } }>({});

  const markVerseRead = useReadingProgressStore((s) => s.markVerseRead);
  const setLastRead = useReadingProgressStore((s) => s.setLastRead);

  // Yeni sureye autoPlay parametresiyle geçildiğinde oynatmayı başlat
  useEffect(() => {
    if (autoPlay) {
      setIsPlaying(true);
      setActiveWordIndex(0);
    }
  }, [autoPlay, surahId]);

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

  // Aktif okunan ayet değiştiğinde otomatik scroll (ekran odağı)
  useEffect(() => {
    const layout = verseLayouts.current[activeAyah];
    if (layout && scrollViewRef.current) {
      const targetY = Math.max(0, layout.y - 70);
      scrollViewRef.current.scrollTo({ y: targetY, animated: true });
    }
  }, [activeAyah]);

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
        // Move to next verse or next surah
        if (activeAyah < verses.length) {
          setActiveAyah((prev) => prev + 1);
          currentWord = 0;
        } else {
          // Okunan sure bitti! Son sure değilse (surahId < 114) otomatik sonrakine geç ve otomatik çalmaya başla
          if (surahId < 114) {
            navigation.replace('Reading', { surahId: surahId + 1, ayahNo: 1, autoPlay: true });
          } else {
            setIsPlaying(false);
            setActiveWordIndex(null);
          }
        }
      }
    }, 900);

    return () => clearInterval(interval);
  }, [isPlaying, activeAyah, verses, surahId, navigation]);

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

  const handleWordPress = (word: Word, verse: Verse) => {
    setSelectedWord(word);
    setSelectedVerse(verse);
    setBottomSheetVisible(true);
  };

  const handleConceptPress = (ayahNo: number, slug: string) => {
    if (chainAyah === ayahNo && activeChain[0] === slug) {
      setActiveChain([]);
      setChainAyah(null);
    } else {
      setChainAyah(ayahNo);
      setActiveChain([slug]);
    }
  };

  const handleSelectRelatedConcept = (slug: string, depth: number) => {
    setActiveChain((prev) => [...prev.slice(0, depth + 1), slug]);
  };

  const handleCloseConcept = (depth: number) => {
    if (depth === 0) {
      setActiveChain([]);
      setChainAyah(null);
    } else {
      setActiveChain((prev) => prev.slice(0, depth));
    }
  };

  const handleOpenDag = (_slug: string) => {
    navigation.navigate('Main', { screen: 'DagExplorer' });
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingBottom: 6 }}>
            <StyledText variant="caption" color="faint" style={{ fontSize: 11 }}>
              {verses.length} Ayet · Çevrimdışı Hazır
            </StyledText>
          </View>

          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{
              paddingTop: theme.spacing.sm,
              paddingBottom: (insets.bottom || 14) + 85,
              paddingHorizontal: theme.spacing.lg,
            }}
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
                onLayout={(e) => {
                  verseLayouts.current[v.ayahNo] = {
                    y: e.nativeEvent.layout.y,
                    height: e.nativeEvent.layout.height,
                  };
                }}
                activeChain={chainAyah === v.ayahNo ? activeChain : []}
                onConceptPress={(slug) => handleConceptPress(v.ayahNo, slug)}
                onSelectRelatedConcept={handleSelectRelatedConcept}
                onCloseConcept={handleCloseConcept}
                onOpenDag={handleOpenDag}
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
              } else if (surahId < 114) {
                // Sure bittiğinde sonraki butonuyla da sıradaki sureye geç ve çalmaya devam et
                navigation.replace('Reading', { surahId: surahId + 1, ayahNo: 1, autoPlay: isPlaying });
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
        verse={selectedVerse}
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        onOpenDag={() => navigation.navigate('Main', { screen: 'DagExplorer' })}
      />
    </Screen>
  );
}
