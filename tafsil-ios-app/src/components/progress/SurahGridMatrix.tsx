import React, { useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyledText } from '../common/StyledText';
import { useTheme } from '../../theme';
import { mockSurahs } from '../../api/mock/surahs.mock';
import type { Surah } from '../../api/types';
import type { RootStackParamList } from '../../navigation/types';
import { useReadingProgressStore } from '../../store/useReadingProgressStore';
import { useMemorizationStore } from '../../store/useMemorizationStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  initialTab?: 'reading' | 'memorization';
  onStartMemorization?: (surah: Surah) => void;
}

export function SurahGridMatrix({ initialTab = 'reading', onStartMemorization }: Props) {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<'reading' | 'memorization'>(initialTab);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);

  const getReadingProgress = useReadingProgressStore((s) => s.getSurahProgress);
  const getMemorizedProgress = useMemorizationStore((s) => s.getMemorizedSurahProgress);

  return (
    <View style={styles.container}>
      {/* Sekmeler: Okuduklarım / Ezberlediklerim */}
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.band, borderColor: theme.colors.line }]}>
        <Pressable
          onPress={() => setActiveTab('reading')}
          style={[
            styles.tabButton,
            activeTab === 'reading' && { backgroundColor: theme.colors.surf, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
          ]}
        >
          <StyledText
            variant="callout"
            style={{
              fontWeight: activeTab === 'reading' ? '600' : '400',
              color: activeTab === 'reading' ? theme.colors.ink : theme.colors.mut,
            }}
          >
            Okuduklarım
          </StyledText>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('memorization')}
          style={[
            styles.tabButton,
            activeTab === 'memorization' && { backgroundColor: theme.colors.surf, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
          ]}
        >
          <StyledText
            variant="callout"
            style={{
              fontWeight: activeTab === 'memorization' ? '600' : '400',
              color: activeTab === 'memorization' ? theme.colors.ink : theme.colors.mut,
            }}
          >
            Ezberlediklerim
          </StyledText>
        </Pressable>
      </View>

      {/* Gösterge (Legend) */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.line }]} />
          <StyledText variant="caption" color="mut">Başlanmadı</StyledText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.accSoft, borderColor: theme.colors.acc, borderWidth: 1 }]} />
          <StyledText variant="caption" color="mut">Devam ediyor</StyledText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.acc }]} />
          <StyledText variant="caption" color="mut">Tamamlandı</StyledText>
        </View>
      </View>

      {/* 114 Sure 4-Sütunlu Grid */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContent}>
        <View style={styles.grid}>
          {mockSurahs.map((surah) => {
            const progress =
              activeTab === 'reading'
                ? getReadingProgress(surah.id, surah.verseCount)
                : getMemorizedProgress(surah.id, surah.verseCount);

            const isSelected = selectedSurah?.id === surah.id;
            const isDone = progress >= 1;
            const isInProgress = progress > 0 && progress < 1;

            let cellBg = theme.colors.surf;
            if (isDone) cellBg = theme.colors.accSoft;
            else if (isInProgress) cellBg = theme.colors.band;

            const handleCellPress = () => {
              if (isSelected) {
                if (activeTab === 'reading') {
                  navigation.navigate('Reading', { surahId: surah.id, ayahNo: 1 });
                } else {
                  if (onStartMemorization) {
                    onStartMemorization(surah);
                  } else {
                    navigation.navigate('MemorizationStudio', {
                      surahId: surah.id,
                      startAyah: 1,
                      endAyah: Math.min(5, surah.verseCount),
                    });
                  }
                }
              } else {
                setSelectedSurah(surah);
              }
            };

            return (
              <Pressable
                key={surah.id}
                onPress={handleCellPress}
                style={[
                  styles.cell,
                  {
                    backgroundColor: cellBg,
                    borderColor: isSelected ? theme.colors.acc : theme.colors.line,
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
              >
                <View style={styles.cellHeader}>
                  <StyledText
                    variant="caption"
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      color: isDone ? theme.colors.acc : theme.colors.ink,
                    }}
                    numberOfLines={1}
                  >
                    {surah.id}. {surah.nameTr}
                  </StyledText>
                </View>

                {/* Progress bar */}
                <View style={[styles.track, { backgroundColor: theme.colors.line }]}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.round(progress * 100)}%`,
                        backgroundColor: isDone ? theme.colors.ink : theme.colors.acc,
                      },
                    ]}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Seçili Sure Detay Kartı */}
      {selectedSurah && (
        <View
          style={[
            styles.pickCard,
            {
              backgroundColor: theme.colors.surf,
              borderColor: theme.colors.line,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 8,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <StyledText variant="headline" style={{ color: theme.colors.ink }}>
                {selectedSurah.id} · {selectedSurah.nameTr} ({selectedSurah.nameAr})
              </StyledText>
              <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
                {selectedSurah.verseCount} ayet · Nüzul Sırası: {selectedSurah.revelationOrder}
              </StyledText>
            </View>
            <Pressable onPress={() => setSelectedSurah(null)} hitSlop={10}>
              <StyledText variant="body" color="faint">✕</StyledText>
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              if (activeTab === 'reading') {
                navigation.navigate('Reading', { surahId: selectedSurah.id, ayahNo: 1 });
              } else {
                if (onStartMemorization) {
                  onStartMemorization(selectedSurah);
                } else {
                  navigation.navigate('MemorizationStudio', {
                    surahId: selectedSurah.id,
                    startAyah: 1,
                    endAyah: Math.min(5, selectedSurah.verseCount),
                  });
                }
              }
            }}
            style={[styles.actionBtn, { backgroundColor: theme.colors.ink }]}
          >
            <StyledText variant="callout" style={{ color: theme.colors.surf, fontWeight: '600' }}>
              {activeTab === 'reading' ? 'Okumaya Başla' : 'Ezber Oturumu Başlat'}
            </StyledText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  cell: {
    width: '23.5%',
    padding: 6,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'space-between',
  },
  cellHeader: {
    flex: 1,
  },
  track: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginTop: 4,
  },
  fill: {
    height: '100%',
    borderRadius: 1.5,
  },
  pickCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    elevation: 5,
  },
  actionBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
