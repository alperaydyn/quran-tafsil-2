import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  FlatList,
  Keyboard,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import {
  SearchService,
  type SearchResults,
  type SurahSearchResult,
  type VerseSearchResult,
  type RootConceptSearchResult,
} from '../services/searchService';
import { useAudioCacheStore } from '../store/useAudioCacheStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SearchScreenRouteProp = RouteProp<RootStackParamList, 'Search'>;

type SearchCategory = 'all' | 'surahs' | 'verses' | 'roots';

const POPULAR_SUGGESTIONS = [
  "Âyetü'l-Kürsî",
  'Bakara 255',
  'Rahmet',
  'İhlâs',
  'ح-م-د',
  'İlim',
  'Hikmet',
  'Alak 1',
];

export function SearchScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<SearchScreenRouteProp>();
  const inputRef = useRef<TextInput>(null);

  const initialQuery = route.params?.initialQuery ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [isSearching, setIsSearching] = useState(false);

  // Arama sonuçları
  const searchResults: SearchResults = useMemo(() => {
    return SearchService.search(query);
  }, [query]);

  // Otomatik odaklanma
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const handleSuggestionPress = (sug: string) => {
    setQuery(sug);
    Keyboard.dismiss();
  };

  // Navigasyon eylemleri
  const handleSurahPress = (surah: SurahSearchResult) => {
    navigation.navigate('Reading', {
      surahId: surah.id,
      ayahNo: 1,
    });
  };

  const handleVersePress = (verse: VerseSearchResult) => {
    navigation.navigate('Reading', {
      surahId: verse.surahId,
      ayahNo: verse.ayahNo,
    });
  };

  const handleConceptPress = (item: RootConceptSearchResult) => {
    if (item.slug) {
      navigation.navigate('Main', {
        screen: 'DagExplorer',
        params: { conceptSlug: item.slug, root: item.rootAr },
      });
    } else {
      // Eğer kavram slug'ı yoksa, kökün geçtiği örnek ayete veya kavram ekranına yönlendir
      navigation.navigate('Main', {
        screen: 'DagExplorer',
        params: { root: item.rootAr },
      });
    }
  };

  // Kategori Sekmeleri Verisi
  const categories: { key: SearchCategory; label: string; count: number }[] = [
    { key: 'all', label: 'Tümü', count: searchResults.counts.all },
    { key: 'surahs', label: 'Sureler', count: searchResults.counts.surahs },
    { key: 'verses', label: 'Ayetler', count: searchResults.counts.verses },
    { key: 'roots', label: 'Kök & Kavram', count: searchResults.counts.rootsAndConcepts },
  ];

  // Aktif kategoriye göre listelenecek veri öğeleri
  type ListItem =
    | { type: 'header'; title: string; count: number }
    | { type: 'surah'; data: SurahSearchResult }
    | { type: 'verse'; data: VerseSearchResult }
    | { type: 'root_concept'; data: RootConceptSearchResult };

  const listItems = useMemo<ListItem[]>(() => {
    if (!query.trim()) return [];

    const items: ListItem[] = [];

    if (activeCategory === 'all') {
      if (searchResults.surahs.length > 0) {
        items.push({ type: 'header', title: 'Sureler', count: searchResults.surahs.length });
        searchResults.surahs.slice(0, 5).forEach((s) => items.push({ type: 'surah', data: s }));
      }
      if (searchResults.rootsAndConcepts.length > 0) {
        items.push({
          type: 'header',
          title: 'Kökler ve Kavramlar',
          count: searchResults.rootsAndConcepts.length,
        });
        searchResults.rootsAndConcepts.slice(0, 5).forEach((rc) => items.push({ type: 'root_concept', data: rc }));
      }
      if (searchResults.verses.length > 0) {
        items.push({ type: 'header', title: 'Ayetler', count: searchResults.verses.length });
        searchResults.verses.forEach((v) => items.push({ type: 'verse', data: v }));
      }
    } else if (activeCategory === 'surahs') {
      searchResults.surahs.forEach((s) => items.push({ type: 'surah', data: s }));
    } else if (activeCategory === 'verses') {
      searchResults.verses.forEach((v) => items.push({ type: 'verse', data: v }));
    } else if (activeCategory === 'roots') {
      searchResults.rootsAndConcepts.forEach((rc) => items.push({ type: 'root_concept', data: rc }));
    }

    return items;
  }, [query, activeCategory, searchResults]);

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <StyledText variant="eyebrow" color="faint">
            {item.title.toUpperCase()} ({item.count})
          </StyledText>
        </View>
      );
    }

    if (item.type === 'surah') {
      const s = item.data;
      const isDownloaded = useAudioCacheStore.getState().downloadedSurahIds.includes(s.id);
      return (
        <Pressable
          onPress={() => handleSurahPress(s)}
          style={[styles.resultCard, { backgroundColor: theme.colors.surf, borderColor: theme.colors.line }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={[
                  styles.badgeNumber,
                  { backgroundColor: theme.colors.band, borderColor: theme.colors.line },
                ]}
              >
                <StyledText variant="caption" style={{ fontWeight: '700', color: theme.colors.acc }}>
                  {s.id}
                </StyledText>
              </View>
              <View>
                <StyledText variant="headline" style={{ color: theme.colors.ink }}>
                  {s.nameTr}
                </StyledText>
                <StyledText variant="caption" color="mut">
                  {s.period === 'medine' ? 'Medine' : 'Mekke'} · {s.verseCount} ayet{isDownloaded ? ' · ✓ Çevrimdışı' : ''} · Nüzul {s.revelationOrder}
                </StyledText>
              </View>
            </View>
            <StyledText style={{ fontFamily: 'Amiri', fontSize: 22, color: theme.colors.ink }}>
              {s.nameAr}
            </StyledText>
          </View>
          {s.summary ? (
            <StyledText variant="footnote" color="faint" numberOfLines={2} style={{ marginTop: 6 }}>
              {s.summary}
            </StyledText>
          ) : null}
        </Pressable>
      );
    }

    if (item.type === 'root_concept') {
      const rc = item.data;
      return (
        <Pressable
          onPress={() => handleConceptPress(rc)}
          style={[styles.resultCard, { backgroundColor: theme.colors.surf, borderColor: theme.colors.line }]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    backgroundColor: theme.colors.accSoft,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: theme.radius.sm,
                  }}
                >
                  <StyledText variant="caption" style={{ color: theme.colors.acc, fontWeight: '700' }}>
                    {rc.type === 'concept' ? 'KAVRAM' : 'KÖK'}
                  </StyledText>
                </View>
                <StyledText variant="headline" style={{ color: theme.colors.ink }}>
                  {rc.title}
                </StyledText>
              </View>
              <StyledText variant="footnote" color="mut" numberOfLines={2}>
                {rc.meaning}
              </StyledText>
              {rc.detail ? (
                <StyledText variant="caption" color="faint" numberOfLines={2} style={{ fontStyle: 'italic' }}>
                  {rc.detail}
                </StyledText>
              ) : null}
            </View>
            <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
              <StyledText style={{ fontFamily: 'Amiri', fontSize: 20, color: theme.colors.acc }}>
                {rc.rootAr}
              </StyledText>
              <StyledText variant="caption" color="faint">
                {rc.rootTr}
              </StyledText>
            </View>
          </View>
        </Pressable>
      );
    }

    if (item.type === 'verse') {
      const v = item.data;
      return (
        <Pressable
          onPress={() => handleVersePress(v)}
          style={[styles.resultCard, { backgroundColor: theme.colors.surf, borderColor: theme.colors.line }]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  backgroundColor: theme.colors.band,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: theme.radius.sm,
                }}
              >
                <StyledText variant="caption" style={{ color: theme.colors.ink, fontWeight: '600' }}>
                  {v.surahNameTr} · {v.ayahNo}. Ayet
                </StyledText>
              </View>
              {v.specialName ? (
                <View
                  style={{
                    backgroundColor: theme.colors.accSoft,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: theme.radius.sm,
                  }}
                >
                  <StyledText variant="caption" style={{ color: theme.colors.acc, fontWeight: '700' }}>
                    {v.specialName}
                  </StyledText>
                </View>
              ) : null}
            </View>
            <StyledText variant="caption" color="faint">
              {v.surahId}:{v.ayahNo} ›
            </StyledText>
          </View>

          <StyledText
            style={{
              fontFamily: 'Amiri',
              fontSize: 20,
              lineHeight: 34,
              textAlign: 'right',
              color: theme.colors.ink,
              marginBottom: 6,
            }}
          >
            {v.textAr}
          </StyledText>

          <StyledText variant="footnote" color="ink" style={{ lineHeight: 20 }}>
            {v.mealTr}
          </StyledText>
        </Pressable>
      );
    }

    return null;
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      {/* Üst Arama Başlık Çubuğu */}
      <View
        style={[
          styles.headerContainer,
          { backgroundColor: theme.colors.bg, borderBottomColor: theme.colors.line },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.backButton}
        >
          <StyledText variant="title" color="ink" style={{ fontSize: 24, lineHeight: 26 }}>
            ‹
          </StyledText>
        </Pressable>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.colors.surf, borderColor: theme.colors.line },
          ]}
        >
          <StyledText style={{ fontSize: 16, color: theme.colors.acc }}>🔍</StyledText>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Sure, ayet no, kök veya meal ara…"
            placeholderTextColor={theme.colors.faint}
            style={[styles.input, { color: theme.colors.ink }]}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="never"
          />
          {query.length > 0 && (
            <Pressable onPress={handleClear} hitSlop={10} style={styles.clearBtn}>
              <StyledText style={{ fontSize: 13, color: theme.colors.mut, fontWeight: '700' }}>✕</StyledText>
            </Pressable>
          )}
        </View>
      </View>

      {/* Kategori Filtre Çipleri (Sonuç Sayıları İle Birlikte) */}
      {query.trim().length > 0 && (
        <View style={[styles.categoriesContainer, { borderBottomColor: theme.colors.line }]}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: 8 }}
            renderItem={({ item }) => {
              const isActive = activeCategory === item.key;
              return (
                <Pressable
                  onPress={() => setActiveCategory(item.key)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isActive ? theme.colors.ink : theme.colors.surf,
                      borderColor: isActive ? theme.colors.ink : theme.colors.line,
                    },
                  ]}
                >
                  <StyledText
                    variant="footnote"
                    style={{
                      color: isActive ? theme.colors.surf : theme.colors.ink,
                      fontWeight: isActive ? '700' : '500',
                    }}
                  >
                    {item.label}
                  </StyledText>
                  <View
                    style={[
                      styles.categoryCountBadge,
                      {
                        backgroundColor: isActive
                          ? theme.scheme === 'dark'
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(255,255,255,0.25)'
                          : theme.colors.band,
                      },
                    ]}
                  >
                    <StyledText
                      variant="caption"
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: isActive ? theme.colors.surf : theme.colors.mut,
                      }}
                    >
                      {item.count}
                    </StyledText>
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      )}

      {/* Arama İçeriği veya Öneriler */}
      {!query.trim() ? (
        <View style={styles.emptyContainer}>
          <StyledText variant="eyebrow" color="faint" style={{ marginBottom: 12 }}>
            ÖNERİLEN ARAMALAR
          </StyledText>
          <View style={styles.suggestionWrap}>
            {POPULAR_SUGGESTIONS.map((sug, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleSuggestionPress(sug)}
                style={[
                  styles.suggestionChip,
                  { backgroundColor: theme.colors.surf, borderColor: theme.colors.line },
                ]}
              >
                <StyledText variant="footnote" color="ink">
                  {sug}
                </StyledText>
              </Pressable>
            ))}
          </View>
          <View style={{ marginTop: 32, padding: 16, backgroundColor: theme.colors.surf, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.line }}>
            <StyledText variant="headline" color="ink" style={{ fontSize: 15, marginBottom: 4 }}>
              Nasıl arayabilirsiniz?
            </StyledText>
            <StyledText variant="footnote" color="mut" style={{ lineHeight: 20 }}>
              • Sure adı: <StyledText variant="footnote" color="acc">Fatiha</StyledText> veya <StyledText variant="footnote" color="acc">الفاتحة</StyledText>{'\n'}
              • Ayet referansı: <StyledText variant="footnote" color="acc">2:255</StyledText> veya <StyledText variant="footnote" color="acc">Bakara 255</StyledText>{'\n'}
              • Özel ayet adı: <StyledText variant="footnote" color="acc">Âyetü'l-Kürsî</StyledText>, <StyledText variant="footnote" color="acc">Amenerrasulü</StyledText>{'\n'}
              • Türkçe meal: <StyledText variant="footnote" color="acc">Göklerin ve yerin Rabbi</StyledText>{'\n'}
              • Morfolojik kök & kavram: <StyledText variant="footnote" color="acc">ح-م-د</StyledText>, <StyledText variant="footnote" color="acc">hmd</StyledText>, <StyledText variant="footnote" color="acc">Rahmet</StyledText>
            </StyledText>
          </View>
        </View>
      ) : listItems.length === 0 ? (
        <View style={styles.noResultContainer}>
          <StyledText style={{ fontSize: 36, marginBottom: 10 }}>🔍</StyledText>
          <StyledText variant="headline" color="ink" style={{ textAlign: 'center', marginBottom: 6 }}>
            Sonuç Bulunamadı
          </StyledText>
          <StyledText variant="footnote" color="mut" style={{ textAlign: 'center', maxWidth: 280, lineHeight: 20 }}>
            "{query}" için bir eşleşme bulunamadı. Lütfen yazımı kontrol edin veya başka bir anahtar kelime deneyin.
          </StyledText>
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item, index) => {
            if (item.type === 'header') return `header-${item.title}-${index}`;
            if (item.type === 'surah') return `surah-${item.data.id}`;
            if (item.type === 'verse') return `verse-${item.data.id}`;
            return `rc-${item.data.id}`;
          }}
          renderItem={renderItem}
          contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48, gap: 10 }}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  categoriesContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 4,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  badgeNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
  },
  suggestionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  noResultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
