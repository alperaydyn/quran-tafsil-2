import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import {
  OfflineSyncService,
  type ReadingTimelineResult,
  type TimelineDayGroup,
  type TimelineSurahItem,
  type TimelineConceptItem,
  type TimelineMemorizationItem,
} from '../services/offlineSyncService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type FilterType = 'all' | 'surah' | 'concept' | 'memorization';

export function ReadingHistoryScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [data, setData] = useState<ReadingTimelineResult | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await OfflineSyncService.getReadingTimeline();
      setData(res);
    } catch {
      setData({
        days: [],
        summary: { total_days: 0, total_verses: 0, total_concepts: 0, total_memorizations: 0 },
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleClearHistory = () => {
    Alert.alert(
      'Geçmişi Sıfırla',
      'Tüm yerel okuma geçmişinizi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await OfflineSyncService.clearHistory();
            loadData();
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSurahPress = (item: TimelineSurahItem) => {
    // İlk okunan ayeti ayıkla veya 1. ayetten aç
    const firstAyahMatch = item.ayet_araliklari.match(/\d+/);
    const startAyah = firstAyahMatch ? parseInt(firstAyahMatch[0], 10) : 1;
    navigation.navigate('Reading', {
      surahId: item.sure_id,
      ayahNo: startAyah,
    });
  };

  const handleConceptPress = (item: TimelineConceptItem) => {
    navigation.navigate('Main', {
      screen: 'DagExplorer',
      params: { conceptSlug: item.kavram_slug },
    });
  };

  const handleMemorizationPress = (item: TimelineMemorizationItem) => {
    navigation.navigate('MemorizationStudio', {
      sessionId: item.oturum_id,
    });
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Üst Navigasyon Çubuğu */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={[styles.backButton, { backgroundColor: theme.colors.surf, borderColor: theme.colors.line }]}
          >
            <StyledText variant="title" color="ink" style={{ fontSize: 20, lineHeight: 22 }}>
              ‹
            </StyledText>
          </Pressable>

          <View style={{ alignItems: 'center' }}>
            <StyledText variant="eyebrow" color="mut" style={{ fontSize: 10, letterSpacing: 1.2 }}>
              KİŞİSEL GÜNLÜK
            </StyledText>
            <StyledText variant="headline" style={{ color: theme.colors.ink, fontSize: 17, fontWeight: '700' }}>
              Okuma Geçmişi
            </StyledText>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {data?.days && data.days.length > 0 && (
              <Pressable
                onPress={handleClearHistory}
                hitSlop={8}
                style={[styles.matrixButton, { backgroundColor: theme.colors.surf, borderColor: theme.colors.line }]}
              >
                <StyledText variant="caption" color="mut" style={{ fontSize: 11 }}>
                  Sıfırla
                </StyledText>
              </Pressable>
            )}
            <Pressable
              onPress={() => navigation.navigate('ProgressMatrix')}
              hitSlop={8}
              style={[styles.matrixButton, { backgroundColor: theme.colors.surf, borderColor: theme.colors.line }]}
            >
              <StyledText variant="caption" style={{ color: theme.colors.acc, fontSize: 11, fontWeight: '600' }}>
                Harita ⤢
              </StyledText>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={theme.colors.acc} />
            <StyledText variant="footnote" color="mut" style={{ marginTop: 12 }}>
              Okuma geçmişiniz yükleniyor...
            </StyledText>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.acc} />
            }
          >
            {/* Özet Metrikler Kartı */}
            {data?.summary && (
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: theme.colors.surf,
                    borderColor: theme.colors.line,
                  },
                ]}
              >
                <View style={styles.metricItem}>
                  <StyledText variant="caption" color="mut" numberOfLines={1} style={styles.metricLabel}>
                    Aktif Gün
                  </StyledText>
                  <StyledText variant="title" style={[styles.metricValue, { color: theme.colors.ink }]}>
                    {data.summary.total_days}
                  </StyledText>
                </View>

                <View style={[styles.dividerVertical, { backgroundColor: theme.colors.line }]} />

                <View style={styles.metricItem}>
                  <StyledText variant="caption" color="mut" numberOfLines={1} style={styles.metricLabel}>
                    Ayet
                  </StyledText>
                  <StyledText variant="title" style={[styles.metricValue, { color: theme.colors.acc }]}>
                    {data.summary.total_verses}
                  </StyledText>
                </View>

                <View style={[styles.dividerVertical, { backgroundColor: theme.colors.line }]} />

                <View style={styles.metricItem}>
                  <StyledText variant="caption" color="mut" numberOfLines={1} style={styles.metricLabel}>
                    Kavram
                  </StyledText>
                  <StyledText variant="title" style={[styles.metricValue, { color: '#B08836' }]}>
                    {data.summary.total_concepts}
                  </StyledText>
                </View>

                <View style={[styles.dividerVertical, { backgroundColor: theme.colors.line }]} />

                <View style={styles.metricItem}>
                  <StyledText variant="caption" color="mut" numberOfLines={1} style={styles.metricLabel}>
                    Ezber
                  </StyledText>
                  <StyledText variant="title" style={[styles.metricValue, { color: '#4A8256' }]}>
                    {data.summary.total_memorizations}
                  </StyledText>
                </View>
              </View>
            )}

            {/* Filtre Segmentleri */}
            <View style={styles.filterRow}>
              {(
                [
                  { id: 'all', label: 'Tümü' },
                  { id: 'surah', label: 'Sureler' },
                  { id: 'concept', label: 'Kavramlar' },
                  { id: 'memorization', label: 'Ezber' },
                ] as const
              ).map((f) => {
                const isSelected = activeFilter === f.id;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setActiveFilter(f.id)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected ? theme.colors.acc : theme.colors.surf,
                        borderColor: isSelected ? theme.colors.acc : theme.colors.line,
                      },
                    ]}
                  >
                    <StyledText
                      variant="caption"
                      style={{
                        color: isSelected ? '#FFFFFF' : theme.colors.mut,
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: 12,
                      }}
                    >
                      {f.label}
                    </StyledText>
                  </Pressable>
                );
              })}
            </View>

            {/* Gün Gün Kronolojik Akış */}
            {data?.days && data.days.length > 0 ? (
              <View style={styles.timelineList}>
                {data.days.map((dayGroup: TimelineDayGroup, dayIndex: number) => {
                  const showSurahs = activeFilter === 'all' || activeFilter === 'surah';
                  const showConcepts = activeFilter === 'all' || activeFilter === 'concept';
                  const showMemorizations = activeFilter === 'all' || activeFilter === 'memorization';

                  const filteredSurahs = showSurahs ? dayGroup.surah_readings : [];
                  const filteredConcepts = showConcepts ? dayGroup.concepts : [];
                  const filteredMems = showMemorizations ? dayGroup.memorizations : [];

                  const hasItems =
                    filteredSurahs.length > 0 || filteredConcepts.length > 0 || filteredMems.length > 0;

                  if (!hasItems) return null;

                  return (
                    <View key={dayGroup.date} style={styles.daySection}>
                      {/* Gün Başlığı */}
                      <View style={styles.dayHeaderRow}>
                        <View style={[styles.dayBullet, { backgroundColor: theme.colors.acc }]} />
                        <StyledText
                          variant="eyebrow"
                          style={{
                            color: theme.colors.ink,
                            fontSize: 13,
                            fontWeight: '700',
                            letterSpacing: 0.5,
                          }}
                        >
                          {dayGroup.title.toUpperCase()}
                        </StyledText>
                        <StyledText variant="caption" color="mut" style={{ fontSize: 11, marginLeft: 8 }}>
                          {dayGroup.date}
                        </StyledText>
                      </View>

                      {/* Gün İçi Kartlar */}
                      <View style={[styles.dayCardContainer, { borderColor: theme.colors.line }]}>
                        {/* 1. Sure Okumaları: Örn: Fatiha (1-7), Bakara (12-25, 45-67) */}
                        {filteredSurahs.map((surahItem: TimelineSurahItem, idx: number) => (
                          <Pressable
                            key={`surah-${idx}`}
                            onPress={() => handleSurahPress(surahItem)}
                            style={({ pressed }) => [
                              styles.itemRow,
                              {
                                backgroundColor: pressed ? theme.colors.band : theme.colors.surf,
                                borderBottomColor: theme.colors.line,
                              },
                            ]}
                          >
                            <View style={[styles.iconBox, { backgroundColor: theme.colors.accSoft }]}>
                              <StyledText style={{ fontSize: 14 }}>📖</StyledText>
                            </View>

                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <StyledText
                                variant="headline"
                                style={{
                                  color: theme.colors.ink,
                                  fontSize: 15,
                                  fontWeight: '700',
                                }}
                              >
                                {surahItem.etiket}
                              </StyledText>
                              <StyledText variant="caption" color="mut" style={{ fontSize: 11, marginTop: 2 }}>
                                {`Okunan: ${surahItem.ayet_araliklari} (${surahItem.toplam_ayet} ayet)`}
                                {surahItem.toplam_sure_sn > 0
                                  ? ` · ~${Math.max(1, Math.round(surahItem.toplam_sure_sn / 60))} dk`
                                  : ''}
                              </StyledText>
                            </View>

                            <StyledText variant="title" color="mut" style={{ fontSize: 16 }}>
                              ›
                            </StyledText>
                          </Pressable>
                        ))}

                        {/* 2. Kavramlar: Örn: Kavram: Rab */}
                        {filteredConcepts.map((conceptItem: TimelineConceptItem, idx: number) => (
                          <Pressable
                            key={`concept-${idx}`}
                            onPress={() => handleConceptPress(conceptItem)}
                            style={({ pressed }) => [
                              styles.itemRow,
                              {
                                backgroundColor: pressed ? theme.colors.band : theme.colors.surf,
                                borderBottomColor: theme.colors.line,
                              },
                            ]}
                          >
                            <View style={[styles.iconBox, { backgroundColor: '#F9F5EB' }]}>
                              <StyledText style={{ fontSize: 13, color: '#B08836', fontWeight: '800' }}>
                                ◎
                              </StyledText>
                            </View>

                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <StyledText
                                variant="headline"
                                style={{
                                  color: theme.colors.ink,
                                  fontSize: 15,
                                  fontWeight: '700',
                                }}
                              >
                                {conceptItem.etiket}
                              </StyledText>
                              <StyledText variant="caption" color="mut" style={{ fontSize: 11, marginTop: 2 }}>
                                Semantik kavram ağı ve kök analizi incelendi
                                {conceptItem.time ? ` · ${conceptItem.time}` : ''}
                              </StyledText>
                            </View>

                            <StyledText variant="title" color="mut" style={{ fontSize: 16 }}>
                              ›
                            </StyledText>
                          </Pressable>
                        ))}

                        {/* 3. Ezber Oturumları: Örn: Ezber: Fatiha (1-7) Ezber Oturumu */}
                        {filteredMems.map((memItem: TimelineMemorizationItem, idx: number) => (
                          <Pressable
                            key={`mem-${idx}`}
                            onPress={() => handleMemorizationPress(memItem)}
                            style={({ pressed }) => [
                              styles.itemRow,
                              {
                                backgroundColor: pressed ? theme.colors.band : theme.colors.surf,
                                borderBottomColor: theme.colors.line,
                              },
                            ]}
                          >
                            <View style={[styles.iconBox, { backgroundColor: '#EBF4ED' }]}>
                              <StyledText style={{ fontSize: 13, color: '#4A8256', fontWeight: '800' }}>
                                ✦
                              </StyledText>
                            </View>

                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <StyledText
                                variant="headline"
                                style={{
                                  color: theme.colors.ink,
                                  fontSize: 15,
                                  fontWeight: '700',
                                }}
                              >
                                {memItem.etiket}
                              </StyledText>
                              <StyledText variant="caption" color="mut" style={{ fontSize: 11, marginTop: 2 }}>
                                {memItem.durum === 'pekistirildi' ? 'Pekiştirildi' : 'Öğreniliyor'} · SM-2 Aralıklı
                                Tekrar
                                {memItem.time ? ` · ${memItem.time}` : ''}
                              </StyledText>
                            </View>

                            <StyledText variant="title" color="mut" style={{ fontSize: 16 }}>
                              ›
                            </StyledText>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <StyledText style={{ fontSize: 40, marginBottom: 12 }}>🌱</StyledText>
                <StyledText variant="title" style={{ color: theme.colors.ink, fontWeight: '700', marginBottom: 6 }}>
                  Henüz Okuma Kaydı Yok
                </StyledText>
                <StyledText variant="body" color="mut" style={{ textAlign: 'center', lineHeight: 20 }}>
                  Ayetleri okudukça, kavramları derinlemesine inceledikçe ve ezber yaptıkça günlüğünüz burada
                  çiçeklenecek.
                </StyledText>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matrixButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  dividerVertical: {
    width: 1,
    height: 24,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  timelineList: {
    flexDirection: 'column',
    gap: 20,
  },
  daySection: {
    flexDirection: 'column',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 4,
  },
  dayBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  dayCardContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
