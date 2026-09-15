import React, { useEffect, useState, useMemo } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';
import { useTranslation } from '../i18n';
import { getSurahs } from '../api/client';
import type { Surah, NuzulDonemi } from '../api/types';
import type { RootStackParamList } from '../navigation/types';

function SurahRow({ surah, onPress }: { surah: Surah; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();

  const periodLabel = t(`periods.${surah.period}`);
  const verseCountLabel = t('common.verseCount', { count: surah.verseCount });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingVertical: 13,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.radius.lg,
        backgroundColor: pressed ? theme.colors.band : 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.line,
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: theme.colors.band,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.colors.line,
        }}
      >
        <StyledText variant="caption" color="mut" style={{ fontWeight: '700' }}>
          {surah.id}
        </StyledText>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <StyledText variant="headline">{surah.nameTr}</StyledText>
          <StyledText variant="caption" color="faint" style={{ fontSize: 11 }}>
            (Nüzul: {surah.revelationOrder})
          </StyledText>
        </View>
        <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
          {periodLabel} · {verseCountLabel}
        </StyledText>
      </View>

      <StyledText variant="arabicInline" color="ink" style={{ fontSize: 20 }}>
        {surah.nameAr}
      </StyledText>
    </Pressable>
  );
}

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterPeriod = 'all' | 'mekke' | 'medine';
type SortOrder = 'mushaf' | 'nuzul';

export function SurahListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('mushaf');

  useEffect(() => {
    let mounted = true;
    getSurahs(sortOrder).then((res) => {
      if (mounted && res.success && res.data) {
        setSurahs(res.data);
      }
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [sortOrder]);

  // Canlı arama ve filtreleme
  const filteredSurahs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return surahs.filter((s) => {
      // Dönem filtresi
      if (filterPeriod === 'mekke' && s.period === 'medine') return false;
      if (filterPeriod === 'medine' && s.period !== 'medine') return false;

      // Arama filtresi
      if (!q) return true;

      // Numara araması (örn: "96" veya "1")
      if (String(s.id) === q || String(s.revelationOrder) === q) return true;

      // Türkçe isim araması (örn: "alak", "fatiha")
      if (s.nameTr.toLowerCase().includes(q)) return true;

      // Arapça isim araması
      if (s.nameAr.includes(q)) return true;

      return false;
    });
  }, [surahs, searchQuery, filterPeriod]);

  return (
    <Screen noPadding>
      {/* Üst Başlık & Arama Alanı */}
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: 10, paddingBottom: 6 }}>
        <StyledText variant="title" style={{ marginBottom: 10 }}>
          {t('surahList.title')}
        </StyledText>

        {/* Belirgin, Modern Arama Çubuğu */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surf,
            borderWidth: 1.5,
            borderColor: searchQuery ? theme.colors.acc : theme.colors.line,
            borderRadius: theme.radius.xl,
            paddingHorizontal: 14,
            height: 48,
            gap: 10,
          }}
        >
          <StyledText style={{ fontSize: 16, color: theme.colors.mut }}>🔍</StyledText>
          <TextInput
            placeholder="Sure adı, numarası (1-114) veya kök ara…"
            placeholderTextColor={theme.colors.faint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              color: theme.colors.ink,
              fontSize: 15,
              paddingVertical: 0,
            }}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={10}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: theme.colors.band,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StyledText style={{ fontSize: 11, color: theme.colors.mut, fontWeight: '700' }}>✕</StyledText>
            </Pressable>
          )}
        </View>

        {/* Filtreleme ve Sıralama Çipleri (Tafsil.dc.html #02 referansı) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {/* Tümü */}
          <Pressable
            onPress={() => setFilterPeriod('all')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: theme.radius.pill,
              backgroundColor: filterPeriod === 'all' ? theme.colors.ink : theme.colors.band,
            }}
          >
            <StyledText
              variant="caption"
              style={{
                color: filterPeriod === 'all' ? theme.colors.surf : theme.colors.mut,
                fontWeight: filterPeriod === 'all' ? '600' : '400',
              }}
            >
              Tümü ({surahs.length})
            </StyledText>
          </Pressable>

          {/* Mekkî */}
          <Pressable
            onPress={() => setFilterPeriod('mekke')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: theme.radius.pill,
              backgroundColor: filterPeriod === 'mekke' ? theme.colors.ink : theme.colors.band,
            }}
          >
            <StyledText
              variant="caption"
              style={{
                color: filterPeriod === 'mekke' ? theme.colors.surf : theme.colors.mut,
                fontWeight: filterPeriod === 'mekke' ? '600' : '400',
              }}
            >
              Mekkî
            </StyledText>
          </Pressable>

          {/* Medenî */}
          <Pressable
            onPress={() => setFilterPeriod('medine')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: theme.radius.pill,
              backgroundColor: filterPeriod === 'medine' ? theme.colors.ink : theme.colors.band,
            }}
          >
            <StyledText
              variant="caption"
              style={{
                color: filterPeriod === 'medine' ? theme.colors.surf : theme.colors.mut,
                fontWeight: filterPeriod === 'medine' ? '600' : '400',
              }}
            >
              Medenî
            </StyledText>
          </Pressable>

          {/* Nüzul Sırası Toggle */}
          <Pressable
            onPress={() => setSortOrder(sortOrder === 'mushaf' ? 'nuzul' : 'mushaf')}
            style={{
              marginLeft: 'auto',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: theme.radius.pill,
              borderWidth: 1,
              borderColor: sortOrder === 'nuzul' ? theme.colors.acc : theme.colors.line,
              backgroundColor: sortOrder === 'nuzul' ? theme.colors.accSoft : 'transparent',
            }}
          >
            <StyledText
              variant="caption"
              style={{
                color: sortOrder === 'nuzul' ? theme.colors.acc : theme.colors.mut,
                fontWeight: '600',
                fontSize: 11,
              }}
            >
              {sortOrder === 'nuzul' ? '⚡ Nüzul Sıralı' : 'Mushaf Sırası'}
            </StyledText>
          </Pressable>
        </View>

        {/* Arama Sonuç Özeti Bilgisi */}
        {searchQuery.length > 0 && (
          <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <StyledText variant="caption" color="faint">
              "{searchQuery}" için {filteredSurahs.length} sure listeleniyor
            </StyledText>
            <Pressable onPress={() => setSearchQuery('')}>
              <StyledText variant="caption" color="acc" style={{ fontWeight: '600' }}>
                Temizle
              </StyledText>
            </Pressable>
          </View>
        )}
      </View>

      {/* Liste Gövdesi */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <StyledText variant="footnote" color="mut">
            {t('common.loading')}
          </StyledText>
        </View>
      ) : filteredSurahs.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 }}>
          <StyledText style={{ fontSize: 32 }}>🔍</StyledText>
          <StyledText variant="headline" color="ink" style={{ textAlign: 'center' }}>
            Sure Bulunamadı
          </StyledText>
          <StyledText variant="footnote" color="mut" style={{ textAlign: 'center', lineHeight: 20 }}>
            "{searchQuery}" kriterine uyan sure bulunamadı. Sure adı, numarası veya dönem filtrelerini kontrol edin.
          </StyledText>
          <Pressable
            onPress={() => {
              setSearchQuery('');
              setFilterPeriod('all');
            }}
            style={{
              marginTop: 12,
              backgroundColor: theme.colors.accSoft,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: theme.radius.pill,
            }}
          >
            <StyledText variant="caption" color="acc" style={{ fontWeight: '600' }}>
              Filtreleri Sıfırla
            </StyledText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredSurahs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SurahRow
              surah={item}
              onPress={() => navigation.navigate('Reading', { surahId: item.id })}
            />
          )}
        />
      )}
    </Screen>
  );
}
