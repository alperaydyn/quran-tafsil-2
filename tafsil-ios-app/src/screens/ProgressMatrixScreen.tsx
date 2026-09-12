import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { SurahGridMatrix } from '../components/progress/SurahGridMatrix';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProgressMatrixScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();

  const initialTab = (route.params?.initialTab as 'reading' | 'memorization') ?? 'reading';

  return (
    <Screen>
      <View style={styles.container}>
        {/* Üst Çubuk */}
        <View style={styles.navBar}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <StyledText variant="title" color="mut" style={{ fontSize: 24 }}>‹</StyledText>
          </Pressable>
          <StyledText variant="headline" style={{ color: theme.colors.ink }}>
            Kur'an Haritası ve İlerlemem
          </StyledText>
          <StyledText variant="body" color="mut">⋯</StyledText>
        </View>

        <SurahGridMatrix
          initialTab={initialTab}
          onStartMemorization={(surah) => {
            navigation.navigate('MemorizationStudio', {
              surahId: surah.id,
              startAyah: 1,
              endAyah: Math.min(5, surah.verseCount),
            });
          }}
        />
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 4,
  },
});
