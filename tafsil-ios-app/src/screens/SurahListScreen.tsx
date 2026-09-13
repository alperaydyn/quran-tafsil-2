import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';
import { useTranslation } from '../i18n';
import { getSurahs } from '../api/client';
import type { Surah } from '../api/types';
import type { RootStackParamList } from '../navigation/types';

function SurahRow({ surah, onPress }: { surah: Surah; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();

  const periodLabel = t(`periods.${surah.period}`);
  const verseCountLabel = t('common.verseCount', { count: surah.verseCount });

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.line,
      }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          backgroundColor: theme.colors.band,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <StyledText variant="caption" color="mut">
          {surah.id}
        </StyledText>
      </View>
      <View style={{ flex: 1 }}>
        <StyledText variant="headline">{surah.nameTr}</StyledText>
        <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
          {periodLabel} · {verseCountLabel}
        </StyledText>
      </View>
      <StyledText variant="arabicInline" color="ink">
        {surah.nameAr}
      </StyledText>
    </Pressable>
  );
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SurahListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getSurahs().then((res) => {
      if (mounted && res.success && res.data) {
        setSurahs(res.data);
      }
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Screen noPadding>
      <View style={{ paddingHorizontal: theme.spacing.xl }}>
        <StyledText variant="title" style={{ marginTop: 12, marginBottom: 8 }}>
          {t('surahList.title')}
        </StyledText>
      </View>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <StyledText variant="footnote" color="mut">
            {t('common.loading')}
          </StyledText>
        </View>
      ) : (
        <FlatList
          data={surahs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, paddingBottom: 24 }}
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

