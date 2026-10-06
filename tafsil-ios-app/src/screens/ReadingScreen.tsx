import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { ScrollView, View, Pressable, Dimensions, ActivityIndicator, type LayoutChangeEvent, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { WordDetailSheet } from '../components/lexicon/WordDetailSheet';
import { AudioPlaybackBar } from '../components/reading/AudioPlaybackBar';
import { AudioDownloadButton } from '../components/reading/AudioDownloadButton';
import { ConceptContextCard } from '../components/reading/ConceptContextCard';
import { ReadingAppearanceSheet } from '../components/reading/ReadingAppearanceSheet';
import { OfflineSyncService } from '../services/offlineSyncService';
import { audioPlayerService, type AudioMetadata } from '../services/audioPlayerService';
import { TimestampService } from '../services/timestampService';
import { useTheme } from '../theme';
import { fontFamily } from '../theme/typography';
import { getVerses, getAyahAudioUrl } from '../api/client';
import { SURAH_SEED_DATA } from '../data/surahs.seed';
import type { Verse, Word } from '../api/types';
import type { RootStackParamList } from '../navigation/types';
import { useReadingMode } from '../hooks/useReadingMode';
import { useReadingProgressStore } from '../store/useReadingProgressStore';
import {
  useReadingPreferencesStore,
  getArabicMetrics,
  getMealMetrics,
  getTransliterationMetrics,
  type ArabicFontSizeScale,
  LINE_SPACING_SCALES,
} from '../store/useReadingPreferencesStore';
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

interface VerseCardProps {
  verse: Verse;
  isVerseActive: boolean;
  activeWordIndex: number | null;
  onWordPress: (word: Word, verse: Verse, wordIndex: number) => void;
  onWordLongPress?: (word: Word, verse: Verse, wordIndex: number) => void;
  onBookmarkToggle: () => void;
  isBookmarked: boolean;
  onLayout?: (e: LayoutChangeEvent) => void;
  activeChain?: string[];
  onConceptPress: (slug: string) => void;
  onSelectRelatedConcept: (slug: string, depth: number) => void;
  onCloseConcept: (depth: number) => void;
  onOpenDag?: (slug: string) => void;
  onCardPress?: () => void;
}

const VerseCard = React.memo(function VerseCard({
  verse,
  isVerseActive,
  activeWordIndex,
  onWordPress,
  onWordLongPress,
  onBookmarkToggle,
  isBookmarked,
  onLayout,
  activeChain,
  onConceptPress,
  onSelectRelatedConcept,
  onCloseConcept,
  onOpenDag,
  onCardPress,
}: VerseCardProps) {
  const theme = useTheme();
  const mode = useReadingMode();
  const isOdakMode = mode.mode === 'odak';
  const isKesifMode = mode.mode === 'kesif';

  const {
    arabicFontSize,
    mealFontSize,
    transliterationFontSize,
    transliterationStyle,
    lineSpacing,
    showArabic: userShowArabic,
    showMeal: userShowMeal,
    showTransliteration: userShowTransliteration,
    showConceptHighlights: userShowConceptHighlights,
  } = useReadingPreferencesStore();

  // Modlara göre akıllı görünürlük kuralları (PBI-2.9 & MOB-007)
  const showArabic = isKesifMode ? false : userShowArabic;
  const showTransliteration = isOdakMode ? false : userShowTransliteration;
  const showConceptHighlights = isOdakMode ? false : userShowConceptHighlights;
  const showMeal = userShowMeal;

  // Odak modunda Arapça hat heybetli ve büyüktür (Hero emphasis)
  const effectiveArabicScale: ArabicFontSizeScale = isOdakMode
    ? (arabicFontSize === 'small' ? 'medium' : arabicFontSize === 'medium' ? 'large' : 'huge')
    : arabicFontSize;

  const arabicMetrics = useMemo(
    () => getArabicMetrics(effectiveArabicScale, lineSpacing),
    [effectiveArabicScale, lineSpacing]
  );
  const mealMetrics = useMemo(
    () => getMealMetrics(mealFontSize, lineSpacing),
    [mealFontSize, lineSpacing]
  );
  const transliterationMetrics = useMemo(
    () => getTransliterationMetrics(transliterationFontSize, lineSpacing),
    [transliterationFontSize, lineSpacing]
  );

  const words: Word[] = useMemo(() => {
    const list: Word[] = verse.words && verse.words.length > 0
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

    return TimestampService.enrichWordsWithTimestamps(verse.surahId, verse.ayahNo, list);
  }, [verse.words, verse.textAr, verse.surahId, verse.ayahNo]);

  const activeTint = theme.scheme === 'dark' ? 'rgba(127, 163, 204, 0.07)' : 'rgba(63, 95, 134, 0.04)';
  const segments = useMemo(() => {
    return segsOf(verse.mealTr || 'Bu ayet için meal çevirisi hazırlanıyor.');
  }, [verse.mealTr]);

  return (
    <Pressable
      onLayout={onLayout}
      onPress={onCardPress}
      style={({ pressed }) => ({
        backgroundColor: isVerseActive ? activeTint : theme.colors.surf,
        borderWidth: isOdakMode ? (isVerseActive ? 1.5 : 0.5) : 1.5,
        borderColor: isVerseActive ? theme.colors.acc : isOdakMode ? 'transparent' : theme.colors.line,
        borderRadius: theme.radius.xxl,
        padding: isOdakMode ? 18 : 16,
        marginBottom: isOdakMode ? 16 : 14,
        gap: 12,
        opacity: pressed ? 0.96 : 1,
      })}
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
          {!isOdakMode && (
            <StyledText variant="footnote" color="faint">
              {verse.surahId}:{verse.ayahNo} · Cüz {verse.juzNo} · Sayfa {verse.pageNo}
            </StyledText>
          )}
        </View>

        {!isOdakMode && (
          <Pressable onPress={onBookmarkToggle} hitSlop={8}>
            <StyledText style={{ fontSize: 16, color: isBookmarked ? theme.colors.acc : theme.colors.mut }}>
              {isBookmarked ? '★' : '☆'}
            </StyledText>
          </Pressable>
        )}
      </View>

      {/* Arapça Mushaf Metni */}
      {showArabic && (
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
                onPress={() => onWordPress(word, verse, idx)}
                onLongPress={() => onWordLongPress?.(word, verse, idx)}
                delayLongPress={350}
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
                  style={{
                    fontFamily: fontFamily.arabic,
                    fontSize: arabicMetrics.fontSize,
                    lineHeight: arabicMetrics.lineHeight,
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

      {/* Transliterasyon (Okunuş) */}
      {showTransliteration && verse.transliterationTr ? (
        <StyledText
          style={{
            fontFamily: transliterationStyle === 'italic' ? fontFamily.serif : fontFamily.sans,
            fontStyle: transliterationStyle === 'italic' ? 'italic' : 'normal',
            fontSize: transliterationMetrics.fontSize,
            lineHeight: transliterationMetrics.lineHeight,
            color: theme.colors.mut,
          }}
        >
          {verse.transliterationTr}
        </StyledText>
      ) : null}

      {/* Türkçe Meal (PBI-1.5: showMeal ile dinamik gizlenebilir) */}
      {showMeal && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
          {segments.map((seg, sIdx) => {
            if (seg.conceptSlug && showConceptHighlights) {
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
                    style={{
                      fontFamily: fontFamily.serifSemiBold,
                      fontSize: mealMetrics.fontSize,
                      lineHeight: mealMetrics.lineHeight,
                      color: theme.colors.acc,
                    }}
                  >
                    {seg.text}
                  </StyledText>
                </Pressable>
              );
            }
            if (seg.conceptSlug && !showConceptHighlights) {
              return (
                <Pressable
                  key={`seg-${sIdx}`}
                  onPress={() => onConceptPress(seg.conceptSlug!)}
                  hitSlop={6}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? theme.colors.band : 'transparent',
                    borderRadius: 3,
                    marginHorizontal: 1,
                  })}
                >
                  <StyledText
                    style={{
                      fontFamily: fontFamily.serif,
                      fontSize: mealMetrics.fontSize,
                      lineHeight: mealMetrics.lineHeight,
                      color: theme.colors.ink,
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
                style={{
                  fontFamily: fontFamily.serif,
                  fontSize: mealMetrics.fontSize,
                  lineHeight: mealMetrics.lineHeight,
                  color: theme.colors.ink,
                }}
              >
                {seg.text}
              </StyledText>
            );
          })}
        </View>
      )}

      {/* Her iki katman da gizlenmişse rehber metin */}
      {!showArabic && !showMeal && (
        <StyledText variant="footnote" color="mut" style={{ fontStyle: 'italic', paddingVertical: 4 }}>
          Arapça ve meal gizlendi. Görünüm ayarlarından birini etkinleştirebilirsiniz.
        </StyledText>
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
    </Pressable>
  );
});

export function ReadingScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { surahId, ayahNo: initialAyahNo, autoPlay } = route.params;
  const CHUNK_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState<number>(() => {
    return initialAyahNo ? Math.max(CHUNK_SIZE, initialAyahNo + 5) : CHUNK_SIZE;
  });

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [appearanceSheetVisible, setAppearanceSheetVisible] = useState(false);
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<number>>(new Set());
  const { showMeal } = useReadingPreferencesStore();

  // Audio state
  const mode = useReadingMode();
  const isOdakMode = mode.mode === 'odak';
  const [isPlaying, setIsPlaying] = useState(Boolean(autoPlay));
  const [isAudioSessionActive, setIsAudioSessionActive] = useState(Boolean(autoPlay));
  const [isAudioOnly, setIsAudioOnly] = useState(Boolean(autoPlay && isOdakMode));
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [activeAyah, setActiveAyah] = useState(initialAyahNo ?? 1);
  const [selectedAyahNo, setSelectedAyahNo] = useState<number | null>(initialAyahNo ?? null);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [isOfflineAudio, setIsOfflineAudio] = useState(false);

  // PBI-2.9: Audio-Only Odak Tilaveti için aktif ayet ve kelime verileri
  const currentVerse = useMemo(() => {
    return verses.find((v) => v.ayahNo === activeAyah);
  }, [verses, activeAyah]);

  const currentVerseWords: Word[] = useMemo(() => {
    if (!currentVerse) return [];
    const list: Word[] = currentVerse.words && currentVerse.words.length > 0
      ? currentVerse.words
      : currentVerse.textAr.split(' ').map((w, idx) => ({
          id: idx + 1,
          position: idx + 1,
          textAr: w,
          textTr: '',
          rootId: null,
          startMs: 0,
          endMs: 0,
        }));
    return TimestampService.enrichWordsWithTimestamps(surahId, activeAyah, list);
  }, [currentVerse, surahId, activeAyah]);

  const seekTargetMsRef = useRef<number | null>(null);
  const isTransitioningSurahRef = useRef(false);

  const activeAyahRef = useRef(activeAyah);
  activeAyahRef.current = activeAyah;

  const versesRef = useRef(verses);
  versesRef.current = verses;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // Aktif açık olan kavram zinciri ve hangi ayete ait olduğu
  const [activeChain, setActiveChain] = useState<string[]>([]);
  const [chainAyah, setChainAyah] = useState<number | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const verseLayouts = useRef<{ [ayahNo: number]: { y: number; height: number } }>({});
  const hasScrolledToInitialRef = useRef(false);
  const isUserScrollingRef = useRef(false);
  const scrollSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRecordedVerseRef = useRef<string | null>(null);

  useEffect(() => {
    lastRecordedVerseRef.current = null;
    const initialTarget = initialAyahNo ? Math.max(CHUNK_SIZE, initialAyahNo + 5) : CHUNK_SIZE;
    setVisibleCount(initialTarget);
    if (initialAyahNo) {
      setSelectedAyahNo(initialAyahNo);
      setActiveAyah(initialAyahNo);
      hasScrolledToInitialRef.current = false;
    }
  }, [initialAyahNo, surahId]);

  const loadMoreVerses = useCallback(() => {
    setVisibleCount((prev) => {
      if (prev >= verses.length) return prev;
      return Math.min(verses.length, prev + CHUNK_SIZE);
    });
  }, [verses.length]);

  // Ses çalarken aktif okunan ayet listenin sonuna yaklaştığında sonraki ayetleri önden otomatik aç
  useEffect(() => {
    if (isPlaying && activeAyah >= visibleCount - 3 && visibleCount < verses.length) {
      loadMoreVerses();
    }
  }, [isPlaying, activeAyah, visibleCount, verses.length, loadMoreVerses]);

  const markVerseRead = useReadingProgressStore((s) => s.markVerseRead);
  const setLastRead = useReadingProgressStore((s) => s.setLastRead);
  const markSurahCompleted = useReadingProgressStore((s) => s.markSurahCompleted);
  const isSurahCompleted = useReadingProgressStore((s) => s.isSurahCompleted);

  // Yeni sureye autoPlay parametresiyle geçildiğinde oynatmayı başlat
  useEffect(() => {
    if (autoPlay) {
      setIsAudioSessionActive(true);
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
      if (scrollSettleTimerRef.current) {
        clearTimeout(scrollSettleTimerRef.current);
      }
    };
  }, [surahId]);

  // Ayet aktif olduğunda veya odaklandığında okuma kaydını oluştur
  useEffect(() => {
    if (activeAyah && verses.length > 0) {
      const verseKey = `${surahId}:${activeAyah}`;
      if (lastRecordedVerseRef.current !== verseKey) {
        lastRecordedVerseRef.current = verseKey;
        const today = new Date().toISOString().slice(0, 10);
        setLastRead(surahId, activeAyah, new Date().toISOString());
        markVerseRead(surahId, activeAyah, today);
        OfflineSyncService.recordReading(surahId, activeAyah, 20);

        // Surenin son ayetine ulaşıldığında surenin Okundu olarak işaretlenmesi (PBI-6.4)
        if (activeAyah === verses.length) {
          markSurahCompleted(surahId, verses.length);
        }
      }
    }
  }, [activeAyah, surahId, verses.length, markVerseRead, setLastRead, markSurahCompleted]);

  // Aktif okunan ayet değiştiğinde otomatik scroll (ekran odağı)
  // Sadece ses çalarken veya elle kaydırma modunda değilken scrollTo yapılır
  useEffect(() => {
    if (isPlaying && !isUserScrollingRef.current) {
      const layout = verseLayouts.current[activeAyah];
      if (layout && scrollViewRef.current) {
        const targetY = Math.max(0, layout.y - 70);
        scrollViewRef.current.scrollTo({ y: targetY, animated: true });
      }
    }
  }, [activeAyah, isPlaying]);

  const nextSurah = SURAH_SEED_DATA.find((s) => s.id === surahId + 1);
  const currentSurah = SURAH_SEED_DATA.find((s) => s.id === surahId);
  const totalVerses = currentSurah?.verseCount || verses.length;

  // Header'da surenin ismini ve toplam ayet sayısını göster
  useEffect(() => {
    const surahTitle = currentSurah ? currentSurah.nameTr : `Sure ${surahId}`;
    const verseCountText = totalVerses > 0 ? `${totalVerses} Ayet` : '';

    navigation.setOptions({
      headerTitle: () => (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <StyledText variant="subhead" color="ink" style={{ fontWeight: '700', fontSize: 16 }}>
            {surahTitle}
          </StyledText>
          {verseCountText ? (
            <StyledText variant="caption" color="mut" style={{ fontSize: 11, marginTop: 1 }}>
              {verseCountText}
              {currentSurah?.nameAr ? ` · ${currentSurah.nameAr}` : ''}
            </StyledText>
          ) : null}
        </View>
      ),
      headerTitleAlign: 'center',
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AudioDownloadButton
            surahId={surahId}
            surahName={surahTitle}
            totalVerses={totalVerses}
            variant="header"
          />
          <Pressable
            onPress={() => setAppearanceSheetVisible(true)}
            hitSlop={10}
            accessibilityLabel="Okuma ve Tipografi Ayarları"
            accessibilityRole="button"
            style={({ pressed }) => ({
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 14,
              backgroundColor: theme.colors.band,
              borderWidth: 1,
              borderColor: theme.colors.line,
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: 2,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <StyledText
              style={{
                fontFamily: fontFamily.serifSemiBold,
                fontSize: 14,
                color: theme.colors.ink,
                lineHeight: 16,
              }}
            >
              A
            </StyledText>
            <StyledText
              style={{
                fontFamily: fontFamily.serif,
                fontSize: 11,
                color: theme.colors.mut,
                lineHeight: 14,
              }}
            >
              a
            </StyledText>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, currentSurah, totalVerses, surahId, theme]);

  // Ayet seçimi/tıklanması veya odaklanmasında state güncellemesi
  const handleAyahSelect = (ayahNo: number) => {
    setActiveAyah(ayahNo);
    setSelectedAyahNo(ayahNo);
  };

  const visibleVerses = useMemo(() => {
    return verses.slice(0, visibleCount);
  }, [verses, visibleCount]);

  const handleNextStep = () => {
    if (activeAyah < verses.length) {
      const nextAyah = activeAyah + 1;
      if (nextAyah > visibleCount) {
        setVisibleCount((prev) => Math.min(verses.length, Math.max(prev + CHUNK_SIZE, nextAyah + 5)));
      }
      isUserScrollingRef.current = false;
      handleAyahSelect(nextAyah);
      const layout = verseLayouts.current[nextAyah];
      if (layout && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: Math.max(0, layout.y - 70), animated: true });
      }
    } else if (surahId < 114) {
      isTransitioningSurahRef.current = isPlaying;
      audioPlayerService.setTransitioningSurah(isPlaying);
      navigation.replace('Reading', { surahId: surahId + 1, ayahNo: 1, autoPlay: isPlaying });
    }
  };

  // Elle scroll yapıldığında sayfada belirli süre durulan ayeti tespit etme ve odaklama (auto-focus)
  const handleScrollPosition = (scrollY: number) => {
    if (isPlaying) return; // Ses çalarken karaoke odağı geçerlidir

    if (scrollSettleTimerRef.current) {
      clearTimeout(scrollSettleTimerRef.current);
    }

    // Scroll durduktan 400ms sonra kullanıcının göz hizasındaki ayeti odakla
    scrollSettleTimerRef.current = setTimeout(() => {
      const focusTargetY = scrollY + 110;
      let closestAyah = activeAyah;
      let minDistance = Infinity;

      const lastVerse = verses[verses.length - 1];
      const lastAyahNo = lastVerse?.ayahNo;
      const lastLayout = lastAyahNo ? verseLayouts.current[lastAyahNo] : undefined;

      // Eğer son ayetin hizasına gelinmişse veya geçilmişse doğrudan son ayeti odakla
      if (lastLayout && focusTargetY >= lastLayout.y - 50) {
        closestAyah = lastAyahNo;
      } else {
        const entries = Object.entries(verseLayouts.current);
        for (const [ayahStr, layout] of entries) {
          const ayahNo = Number(ayahStr);
          if (focusTargetY >= layout.y && focusTargetY <= layout.y + layout.height) {
            closestAyah = ayahNo;
          }
          const dist = Math.abs(layout.y - focusTargetY);
          if (dist < minDistance) {
            minDistance = dist;
            closestAyah = ayahNo;
          }
        }
      }

      if (closestAyah && closestAyah !== activeAyah) {
        isUserScrollingRef.current = true;
        handleAyahSelect(closestAyah);
      }

      setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 300);
    }, 400);
  };

  // Scroll olaylarında hem lazy load tetikleme hem de ayet odaklama
  const handleScrollEvent = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    // Listenin sonuna 700px kala sonraki 20 ayeti lazy load ile ekle
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 700) {
      loadMoreVerses();
    }
    handleScrollPosition(contentOffset.y);
  };

  // Sure açıldığında Cloudflare R2'den taze zaman damgalarını arka planda önbelleğe al
  useEffect(() => {
    TimestampService.fetchSurahTimestampsFromR2(surahId);
  }, [surahId]);

  // Audio player listener ve unmount temizliği
  useEffect(() => {
    isTransitioningSurahRef.current = false;
    audioPlayerService.setTransitioningSurah(false);

    audioPlayerService.setListeners(
      (state) => {
        setIsBuffering(state.isBuffering);
        if (state.isOffline !== undefined) {
          setIsOfflineAudio(state.isOffline);
        }
        if (state.activeWordIndex !== undefined) {
          setActiveWordIndex(state.activeWordIndex);
        }
        if (state.isPlaying !== undefined && state.isPlaying !== isPlayingRef.current) {
          setIsPlaying(state.isPlaying);
        }
      },
      () => {
        // Kullanıcı duraklatmışsa ayet geçişi yapma
        if (!isPlayingRef.current) return;

        // Ayet tilaveti tamamlandığında: sonraki ayete veya sureye geç
        const currentAyahVal = activeAyahRef.current;
        const versesVal = versesRef.current;
        if (currentAyahVal < versesVal.length) {
          const nextAyah = currentAyahVal + 1;
          handleAyahSelect(nextAyah);
          setActiveWordIndex(0);
        } else if (surahId < 114) {
          isTransitioningSurahRef.current = true;
          audioPlayerService.setTransitioningSurah(true);
          navigation.replace('Reading', { surahId: surahId + 1, ayahNo: 1, autoPlay: true });
        } else {
          setIsPlaying(false);
          setActiveWordIndex(null);
        }
      }
    );

    return () => {
      if (!isTransitioningSurahRef.current) {
        audioPlayerService.stopAndUnload();
      }
    };
  }, [surahId, navigation]);

  // isPlaying, activeAyah, surahId veya verses değiştiğinde gerçek ses dosyasını çal/duraklat
  useEffect(() => {
    if (!isPlaying) {
      audioPlayerService.pause();
      return;
    }

    const currentVerse = verses.find((v) => v.ayahNo === activeAyah);
    const audioUrl = currentVerse?.audioUrl || getAyahAudioUrl(surahId, activeAyah);
    const wordsWithTimestamps = currentVerse
      ? TimestampService.enrichWordsWithTimestamps(surahId, activeAyah, currentVerse.words || [])
      : TimestampService.enrichWordsWithTimestamps(surahId, activeAyah, []);

    const initialSeek = seekTargetMsRef.current ?? 0;
    seekTargetMsRef.current = null;

    const surahName = currentSurah ? `${currentSurah.nameTr} Suresi` : `Sure ${surahId}`;
    const metadata: AudioMetadata = {
      title: `${surahName} · ${activeAyah}. Ayet`,
      artist: 'Mişari Raşid el-Afasi',
      albumTitle: 'tafsil.net',
    };

    audioPlayerService.playAyah(
      audioUrl,
      wordsWithTimestamps,
      true,
      initialSeek,
      metadata,
      surahId,
      activeAyah
    );
  }, [isPlaying, activeAyah, surahId, verses, currentSurah]);

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

  /**
   * PBI-2.7: Kelimeye Dokunarak Sarma (Seek-on-Word-Click)
   * Metindeki bir kelimeye dokunulduğunda sesin doğrudan o kelimenin startMs süresine atlaması.
   */
  const handleSeekToWord = async (word: Word, verse: Verse, wordIndex: number) => {
    const isDifferentAyah = verse.ayahNo !== activeAyah;

    // Kelimenin başlangıç zaman damgası (startMs) tespiti
    const wordsWithTimestamps = TimestampService.enrichWordsWithTimestamps(
      surahId,
      verse.ayahNo,
      verse.words && verse.words.length > 0 ? verse.words : []
    );

    let targetMs = word.startMs ?? 0;
    if (targetMs === 0 && wordsWithTimestamps.length > 0) {
      const enriched = wordsWithTimestamps[wordIndex];
      if (enriched && enriched.startMs > 0) {
        targetMs = enriched.startMs;
      }
    }

    setActiveWordIndex(wordIndex);
    setIsAudioSessionActive(true);

    if (isDifferentAyah) {
      seekTargetMsRef.current = targetMs;
      handleAyahSelect(verse.ayahNo);
      setIsPlaying(true);
    } else if (!isPlaying) {
      // Aynı ayet ama duraklatılmışsa: sar ve oynatmayı başlat
      seekTargetMsRef.current = targetMs;
      setIsPlaying(true);
    } else {
      // Aynı ayet ve zaten çalıyor: doğrudan oynatıcı içinde sıfır gecikmeyle sar
      await audioPlayerService.seekToMs(targetMs, true);
    }
  };

  const handleWordPress = (word: Word, verse: Verse, wordIndex: number) => {
    // Ses aktifken veya çalıyorken dokunma doğrudan ses sarma olarak çalışır (PBI-2.7)
    if (isAudioSessionActive || isPlaying) {
      handleSeekToWord(word, verse, wordIndex);
      return;
    }

    // Ses kapalı/boşta iken dokunma kelime sözlük çekmecesini açar (PBI-3.1)
    handleAyahSelect(verse.ayahNo);
    setSelectedWord(word);
    setSelectedVerse(verse);
    setBottomSheetVisible(true);
  };

  const handleWordLongPress = (word: Word, verse: Verse, _wordIndex: number) => {
    // Uzun basma her koşulda kelime sözlük ve morfoloji çekmecesini açar
    handleAyahSelect(verse.ayahNo);
    setSelectedWord(word);
    setSelectedVerse(verse);
    setBottomSheetVisible(true);
  };

  const handleConceptPress = (ayahNo: number, slug: string) => {
    handleAyahSelect(ayahNo);
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
          {isAudioOnly && isAudioSessionActive ? (
            <View style={{ flex: 1 }}>
              {/* Odak Modu: Audio-Only Tilavet Sahnesi Başlığı */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: theme.spacing.lg,
                  paddingTop: theme.spacing.xs,
                  paddingBottom: theme.spacing.md,
                }}
              >
                <View>
                  <StyledText variant="subhead" color="ink" style={{ fontWeight: '700' }}>
                    {currentSurah ? currentSurah.nameTr : `Sure ${surahId}`}
                  </StyledText>
                  <StyledText variant="caption" color="mut" style={{ fontSize: 11 }}>
                    {activeAyah}. Ayet / {verses.length} Ayet · Odak Tilaveti
                  </StyledText>
                </View>
                <Pressable
                  onPress={() => setIsAudioOnly(false)}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 14,
                    backgroundColor: theme.colors.surf,
                    borderWidth: 1,
                    borderColor: theme.colors.line,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <StyledText variant="caption" color="ink" style={{ fontWeight: '600', fontSize: 11 }}>
                    Metne Dön ✕
                  </StyledText>
                </Pressable>
              </View>

              {/* Sadeleştirilmiş Hero Tilavet Sahnesi */}
              <ScrollView
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: theme.spacing.xl,
                  paddingBottom: (insets.bottom || 14) + 95,
                }}
                showsVerticalScrollIndicator={false}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: theme.colors.accSoft,
                    borderWidth: 1,
                    borderColor: theme.colors.acc,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                  }}
                >
                  <StyledText variant="caption" color="acc" style={{ fontWeight: '700', fontSize: 13 }}>
                    {activeAyah}
                  </StyledText>
                </View>

                {/* Büyük Uthmani / Amiri Hat ile Kelime Kelime Tilavet */}
                <View
                  style={{
                    flexDirection: 'row-reverse',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                    maxWidth: 360,
                  }}
                >
                  {currentVerseWords.map((word, idx) => {
                    const isWordActive = activeWordIndex === idx;
                    return (
                      <Pressable
                        key={word.id || idx}
                        onPress={() => currentVerse && handleSeekToWord(word, currentVerse, idx)}
                        style={({ pressed }) => ({
                          backgroundColor: isWordActive ? theme.colors.accSoft : 'transparent',
                          borderRadius: 8,
                          paddingHorizontal: 6,
                          paddingVertical: 4,
                          borderBottomWidth: isWordActive ? 2 : 0,
                          borderBottomColor: theme.colors.acc,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <StyledText
                          style={{
                            fontFamily: fontFamily.arabic,
                            fontSize: 34,
                            lineHeight: 58,
                            color: isWordActive ? theme.colors.acc : theme.colors.ink,
                            textAlign: 'center',
                          }}
                        >
                          {word.textAr}
                        </StyledText>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Arka planda dikkat dağıtmayan zarif tek satır/kısa meal */}
                {currentVerse?.mealTr ? (
                  <View style={{ marginTop: 32, maxWidth: 330, paddingHorizontal: 8 }}>
                    <StyledText
                      style={{
                        fontFamily: fontFamily.serif,
                        fontSize: 16,
                        lineHeight: 27,
                        color: theme.colors.mut,
                        textAlign: 'center',
                      }}
                    >
                      {currentVerse.mealTr.replace(/\[<[^>]+>\]/g, '')}
                    </StyledText>
                  </View>
                ) : null}
              </ScrollView>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingBottom: 6 }}>
                <StyledText variant="caption" color="faint" style={{ fontSize: 11 }}>
                  {visibleCount < verses.length
                    ? `${visibleCount} / ${verses.length} Ayet Hazır · Kademeli Yükleme`
                    : `${verses.length} Ayet · Çevrimdışı Hazır`}
                </StyledText>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AudioDownloadButton
                    surahId={surahId}
                    surahName={currentSurah ? currentSurah.nameTr : `Sure ${surahId}`}
                    totalVerses={totalVerses}
                    variant="subhead"
                  />

                  {isOdakMode && isAudioSessionActive && !isAudioOnly && (
                    <Pressable
                      onPress={() => setIsAudioOnly(true)}
                      hitSlop={6}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: theme.colors.accSoft,
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <StyledText variant="caption" color="acc" style={{ fontWeight: '600', fontSize: 10 }}>
                        🎧 Odak Sahnesi
                      </StyledText>
                    </Pressable>
                  )}

                  {!showMeal && (
                    <Pressable
                      onPress={() => setAppearanceSheetVisible(true)}
                      hitSlop={6}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: theme.colors.accSoft,
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <StyledText variant="caption" color="acc" style={{ fontWeight: '600', fontSize: 10 }}>
                        Tilavet Modu · Meal Gizli ⚙
                      </StyledText>
                    </Pressable>
                  )}
                </View>
              </View>

          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{
              paddingTop: theme.spacing.sm,
              paddingBottom: (insets.bottom || 14) + 85,
              paddingHorizontal: theme.spacing.lg,
            }}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={32}
            onScrollBeginDrag={() => {
              isUserScrollingRef.current = true;
              if (scrollSettleTimerRef.current) {
                clearTimeout(scrollSettleTimerRef.current);
              }
            }}
            onScroll={handleScrollEvent}
            onScrollEndDrag={handleScrollEvent}
            onMomentumScrollEnd={handleScrollEvent}
          >
            {visibleVerses.map((v) => (
              <VerseCard
                key={v.id}
                verse={v}
                isVerseActive={activeAyah === v.ayahNo || selectedAyahNo === v.ayahNo}
                activeWordIndex={
                  (isPlaying || isAudioSessionActive) && activeAyah === v.ayahNo
                    ? activeWordIndex
                    : null
                }
                onCardPress={() => {
                  handleAyahSelect(v.ayahNo);
                }}
                onWordPress={handleWordPress}
                onWordLongPress={handleWordLongPress}
                onBookmarkToggle={() => toggleBookmark(v.ayahNo)}
                isBookmarked={bookmarkedSet.has(v.ayahNo)}
                onLayout={(e) => {
                  const y = e.nativeEvent.layout.y;
                  verseLayouts.current[v.ayahNo] = {
                    y,
                    height: e.nativeEvent.layout.height,
                  };
                  if (initialAyahNo && v.ayahNo === initialAyahNo && !hasScrolledToInitialRef.current) {
                    hasScrolledToInitialRef.current = true;
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({
                        y: Math.max(0, y - 70),
                        animated: true,
                      });
                    }, 120);
                  }
                }}
                activeChain={chainAyah === v.ayahNo ? activeChain : []}
                onConceptPress={(slug) => handleConceptPress(v.ayahNo, slug)}
                onSelectRelatedConcept={handleSelectRelatedConcept}
                onCloseConcept={handleCloseConcept}
                onOpenDag={handleOpenDag}
              />
            ))}

            {/* Kademeli (Lazy Load) Bilgi Kartı */}
            {visibleCount < verses.length && (
              <View
                style={{
                  padding: 16,
                  marginVertical: 14,
                  borderRadius: theme.radius.xl,
                  backgroundColor: theme.colors.band,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: theme.colors.line,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color={theme.colors.acc} />
                  <StyledText variant="subhead" color="ink" style={{ fontWeight: '600' }}>
                    {visibleCount} / {verses.length} Ayet Görüntüleniyor
                  </StyledText>
                </View>
                <StyledText variant="caption" color="faint" style={{ textAlign: 'center' }}>
                  Aşağı kaydırmaya devam ettikçe sonraki ayetler akıcı şekilde eklenir
                </StyledText>
                <Pressable
                  onPress={() => setVisibleCount(verses.length)}
                  hitSlop={6}
                  style={({ pressed }) => ({
                    marginTop: 4,
                    paddingVertical: 7,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    backgroundColor: theme.colors.surf,
                    borderWidth: 1,
                    borderColor: theme.colors.line,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <StyledText variant="caption" color="acc" style={{ fontWeight: '600' }}>
                    Tüm Ayetleri Yükle ({verses.length - visibleCount} Ayet Kaldı)
                  </StyledText>
                </Pressable>
              </View>
            )}

            {/* Alt Boşluk ve Sonraki Ayete/Sureye Geç Butonu */}
            <View
              style={{
                marginTop: theme.spacing.xl,
                marginBottom: Math.max(380, Dimensions.get('window').height * 0.55),
                paddingHorizontal: theme.spacing.xs,
                alignItems: 'stretch',
                gap: 10,
              }}
            >
              {isSurahCompleted(surahId) || (totalVerses > 0 && activeAyah === totalVerses) ? (
                <View
                  style={{
                    padding: 20,
                    borderRadius: 22,
                    backgroundColor: theme.colors.surf,
                    borderWidth: 1.5,
                    borderColor: theme.colors.acc,
                    gap: 14,
                    shadowColor: theme.colors.acc,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.12,
                    shadowRadius: 10,
                    elevation: 3,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 4,
                        paddingHorizontal: 10,
                        borderRadius: theme.radius.pill,
                        backgroundColor: theme.colors.accSoft,
                      }}
                    >
                      <StyledText
                        variant="caption"
                        color="acc"
                        style={{ fontWeight: '700', fontSize: 11 }}
                      >
                        ✓ SURE TAMAMLANDI · %100
                      </StyledText>
                    </View>
                    <StyledText variant="caption" color="faint">
                      {totalVerses} / {totalVerses} Ayet
                    </StyledText>
                  </View>

                  <View style={{ gap: 4 }}>
                    <StyledText
                      style={{
                        fontFamily: theme.font.serifSemiBold,
                        fontSize: 22,
                        color: theme.colors.ink,
                      }}
                    >
                      {currentSurah ? currentSurah.nameTr : `Sure ${surahId}`} Suresi Okundu
                    </StyledText>
                    <StyledText variant="footnote" color="mut" style={{ lineHeight: 20 }}>
                      Tebrikler! Sureyi başarıyla tamamladın. Okuma karnende ve Sure İlerleme Matrisinde "Tamamlandı" olarak işaretlendi.
                    </StyledText>
                  </View>

                  {nextSurah ? (
                    <Pressable
                      onPress={() => {
                        markSurahCompleted(surahId, totalVerses);
                        isTransitioningSurahRef.current = isPlaying;
                        audioPlayerService.setTransitioningSurah(isPlaying);
                        navigation.replace('Reading', {
                          surahId: surahId + 1,
                          ayahNo: 1,
                          autoPlay: isPlaying,
                        });
                      }}
                      style={({ pressed }) => ({
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: theme.colors.ink,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <StyledText
                        variant="callout"
                        style={{ color: theme.colors.surf, fontWeight: '600' }}
                      >
                        Sıradaki Sureye Geç: {nextSurah.nameTr} ({nextSurah.nameAr}) →
                      </StyledText>
                    </Pressable>
                  ) : (
                    <View
                      style={{
                        paddingVertical: 12,
                        borderRadius: 14,
                        backgroundColor: theme.colors.accSoft,
                        alignItems: 'center',
                      }}
                    >
                      <StyledText variant="callout" color="acc" style={{ fontWeight: '700' }}>
                        Kur'an-ı Kerim Hatmini Tamamladınız! 🤲
                      </StyledText>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable
                      onPress={() => {
                        handleAyahSelect(1);
                        if (scrollViewRef.current) {
                          scrollViewRef.current.scrollTo({ y: 0, animated: true });
                        }
                      }}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 14,
                        backgroundColor: theme.colors.band,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <StyledText variant="caption" color="ink" style={{ fontWeight: '600' }}>
                        Baştan Oku (1. Ayet)
                      </StyledText>
                    </Pressable>

                    <Pressable
                      onPress={() => navigation.navigate('ProgressMatrix')}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 14,
                        backgroundColor: theme.colors.band,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <StyledText variant="caption" color="acc" style={{ fontWeight: '600' }}>
                        İlerleme Matrisi ›
                      </StyledText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <Pressable
                    onPress={handleNextStep}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: theme.radius.xl,
                      backgroundColor: theme.colors.surf,
                      borderWidth: 1.5,
                      borderColor: pressed ? theme.colors.acc : theme.colors.line,
                      opacity: pressed ? 0.85 : 1,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 6,
                      elevation: 2,
                    })}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <StyledText
                        variant="body"
                        color="ink"
                        style={{ fontWeight: '600', fontSize: 15 }}
                      >
                        Sonraki Ayete Geç
                      </StyledText>
                      <StyledText
                        variant="caption"
                        color="faint"
                        style={{ fontSize: 12, marginTop: 2 }}
                      >
                        {activeAyah + 1}. Ayete odaklan ({activeAyah + 1} / {verses.length})
                      </StyledText>
                    </View>

                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: theme.colors.accSoft,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <StyledText
                        variant="body"
                        color="acc"
                        style={{ fontSize: 16, fontWeight: '700' }}
                      >
                        ↓
                      </StyledText>
                    </View>
                  </Pressable>

                  {nextSurah && (
                    <Pressable
                      onPress={() => {
                        isTransitioningSurahRef.current = isPlaying;
                        audioPlayerService.setTransitioningSurah(isPlaying);
                        navigation.replace('Reading', {
                          surahId: surahId + 1,
                          ayahNo: 1,
                          autoPlay: isPlaying,
                        });
                      }}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 8,
                        opacity: pressed ? 0.6 : 0.85,
                      })}
                    >
                      <StyledText variant="caption" color="mut" style={{ fontSize: 12 }}>
                        Sıradaki Sureye Atla: {nextSurah.nameTr} →
                      </StyledText>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </>
      )}

          {/* Floating Audio Playback Dock & Mini Mode Switch */}
          {isAudioSessionActive ? (
            <AudioPlaybackBar
              surahId={surahId}
              totalVerses={verses.length}
              currentAyah={activeAyah}
              activeWordIndex={activeWordIndex}
              isPlaying={isPlaying}
              isBuffering={isBuffering}
              playbackRate={playbackRate}
              isAudioOnly={isAudioOnly}
              isOffline={isOfflineAudio}
              onToggleAudioOnly={() => setIsAudioOnly((prev) => !prev)}
              onRateChange={(rate) => {
                setPlaybackRate(rate);
                audioPlayerService.setRate(rate);
              }}
              onTogglePlay={() => {
                setIsPlaying((prev) => {
                  const next = !prev;
                  if (!next) {
                    audioPlayerService.pause();
                  }
                  return next;
                });
              }}
              onNextVerse={() => {
                if (activeAyah < verses.length) {
                  const next = activeAyah + 1;
                  handleAyahSelect(next);
                  setActiveWordIndex(0);
                } else if (surahId < 114) {
                  // Sure bittiğinde sonraki butonuyla da sıradaki sureye geç ve çalmaya devam et
                  isTransitioningSurahRef.current = isPlaying;
                  audioPlayerService.setTransitioningSurah(isPlaying);
                  navigation.replace('Reading', { surahId: surahId + 1, ayahNo: 1, autoPlay: isPlaying });
                }
              }}
              onPrevVerse={() => {
                if (activeAyah > 1) {
                  const prev = activeAyah - 1;
                  handleAyahSelect(prev);
                  setActiveWordIndex(0);
                }
              }}
              onClose={() => {
                audioPlayerService.stopAndUnload();
                setIsPlaying(false);
                setIsAudioSessionActive(false);
                setIsAudioOnly(false);
                setActiveWordIndex(null);
              }}
            />
          ) : (
            <Pressable
              onPress={() => {
                setIsAudioSessionActive(true);
                setIsPlaying(true);
                if (isOdakMode) {
                  setIsAudioOnly(true);
                }
              }}
              style={({ pressed }) => ({
                position: 'absolute',
                bottom: insets.bottom > 0 ? insets.bottom + 6 : 14,
                alignSelf: 'center',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: theme.scheme === 'dark' ? '#27241F' : '#171613',
                borderColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderRadius: 22,
                paddingHorizontal: 16,
                paddingVertical: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: theme.scheme === 'dark' ? 0.45 : 0.28,
                shadowRadius: 14,
                elevation: 8,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: theme.colors.acc,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: 0,
                    height: 0,
                    marginLeft: 2,
                    borderLeftWidth: 6,
                    borderTopWidth: 3.5,
                    borderBottomWidth: 3.5,
                    borderLeftColor: theme.scheme === 'dark' ? '#14130F' : '#FFFFFF',
                    borderTopColor: 'transparent',
                    borderBottomColor: 'transparent',
                  }}
                />
              </View>
              <StyledText style={{ color: '#F4F1EA', fontSize: 12.5, fontWeight: '600', letterSpacing: 0.4 }}>
                {isOdakMode ? 'Odak Tilavetini Başlat' : `Tilaveti Başlat · ${activeAyah}. Ayet`}
              </StyledText>
            </Pressable>
          )}
        </>
      )}

      <ReadingAppearanceSheet
        visible={appearanceSheetVisible}
        onClose={() => setAppearanceSheetVisible(false)}
      />

      <WordDetailSheet
        word={selectedWord}
        verse={selectedVerse}
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        onOpenDag={() => navigation.navigate('Main', { screen: 'DagExplorer' })}
        onPlayFromWord={(w, v) => {
          const targetVerse = v || selectedVerse;
          if (targetVerse) {
            const list = targetVerse.words || [];
            const idx = list.findIndex((item) => item.id === w.id);
            handleSeekToWord(w, targetVerse, Math.max(0, idx));
          }
        }}
      />
    </Screen>
  );
}
