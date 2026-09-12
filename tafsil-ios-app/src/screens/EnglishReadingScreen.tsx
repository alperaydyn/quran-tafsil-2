import React, { useState } from 'react';
import { ScrollView, View, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EnglishReading'>;

interface EnglishVerseItem {
  number: number;
  textPrefix?: string;
  highlightWord?: string;
  textSuffix?: string;
  contextNote?: string;
}

const ALAQ_ENGLISH_VERSES: EnglishVerseItem[] = [
  {
    number: 1,
    highlightWord: 'Read',
    textSuffix: ', in the name of your Lord who created —',
  },
  {
    number: 2,
    textPrefix: 'created the human being from ',
    highlightWord: "'alaq",
    textSuffix: ', a thing that clings.',
    contextNote: "Often rendered “clot of blood”. The root's earliest sense is attachment — something suspended or clinging.",
  },
  {
    number: 3,
    textPrefix: 'Read, and your Lord is the most ',
    highlightWord: 'generous',
    textSuffix: ',',
  },
  {
    number: 4,
    textPrefix: 'who taught by the ',
    highlightWord: 'pen',
    textSuffix: ',',
  },
  {
    number: 5,
    textPrefix: 'taught the human what it did not ',
    highlightWord: 'know',
    textSuffix: '.',
  },
];

export function EnglishReadingScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const surahId = route.params?.surahId ?? 96;
  const [activeSegment, setActiveSegment] = useState<'Researcher' | 'Learner' | 'Recitation'>('Researcher');

  return (
    <Screen edges={['top', 'left', 'right']}>
      {/* 1. Header Bar (Tafsil.dc.html Ekran #06 satır 523) */}
      <View style={[styles.headerBar, { borderBottomColor: theme.colors.line }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <StyledText variant="headline" color="mut" style={{ fontSize: 22 }}>
            ‹
          </StyledText>
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <StyledText variant="headline" color="ink" style={{ fontSize: 17 }}>
            {surahId === 96 ? "96 · Al-'Alaq" : `${surahId} · Surah`}
          </StyledText>
          <StyledText
            variant="caption"
            color="faint"
            style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 1 }}
          >
            REVELATION 1 · EARLY MECCA
          </StyledText>
        </View>

        {/* TR / EN Switcher Pill */}
        <Pressable
          onPress={() => navigation.navigate('Reading', { surahId })}
          style={[styles.langPill, { backgroundColor: theme.colors.band }]}
        >
          <StyledText variant="caption" color="acc" style={{ fontWeight: '700', fontSize: 11 }}>
            TR
          </StyledText>
        </Pressable>
      </View>

      {/* 2. Mode Selector: Researcher / Learner / Recitation (Tafsil.dc.html satır 524) */}
      <View style={styles.modeContainer}>
        <View style={[styles.modeBar, { backgroundColor: theme.colors.band }]}>
          {(['Researcher', 'Learner', 'Recitation'] as const).map((seg) => (
            <Pressable
              key={seg}
              onPress={() => setActiveSegment(seg)}
              style={[
                styles.modeButton,
                activeSegment === seg && { backgroundColor: theme.colors.surf, shadowOpacity: 0.05 },
              ]}
            >
              <StyledText
                variant="caption"
                color={activeSegment === seg ? 'ink' : 'mut'}
                style={{ fontWeight: activeSegment === seg ? '600' : '400', fontSize: 12.5 }}
              >
                {seg}
              </StyledText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 3. Section Title: Reading and Teaching (Tafsil.dc.html satır 526) */}
      <View style={styles.sectionHeader}>
        <StyledText
          variant="caption"
          color="faint"
          style={{ letterSpacing: 1.6, textTransform: 'uppercase', fontSize: 10.5, fontWeight: '600' }}
        >
          Reading and teaching
        </StyledText>
        <View style={[styles.sectionDivider, { backgroundColor: theme.colors.line }]} />
      </View>

      {/* 4. Verses Stream (Tafsil.dc.html satır 527-532) */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {ALAQ_ENGLISH_VERSES.map((v) => (
          <View key={v.number} style={styles.verseContainer}>
            <View style={styles.verseRow}>
              <StyledText variant="caption" color="faint" style={styles.verseNumber}>
                {v.number}
              </StyledText>

              <View style={styles.verseTextWrapper}>
                <StyledText variant="bodyLarge" color="ink" style={styles.verseText}>
                  {v.textPrefix || ''}
                  {v.highlightWord ? (
                    <StyledText
                      variant="bodyLarge"
                      color="acc"
                      style={{ borderBottomWidth: 1.5, borderBottomColor: theme.colors.acc, fontWeight: '500' }}
                    >
                      {v.highlightWord}
                    </StyledText>
                  ) : null}
                  {v.textSuffix || ''}
                </StyledText>
              </View>
            </View>

            {/* CONTEXT Card (Tafsil.dc.html satır 529) */}
            {v.contextNote ? (
              <View style={[styles.contextBox, { borderLeftColor: theme.colors.acc, backgroundColor: theme.colors.surf }]}>
                <StyledText
                  variant="caption"
                  color="acc"
                  style={{ letterSpacing: 1.4, fontSize: 9.5, fontWeight: '700', marginBottom: 4 }}
                >
                  CONTEXT
                </StyledText>
                <StyledText variant="footnote" color="mut" style={{ lineHeight: 18 }}>
                  {v.contextNote}
                </StyledText>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modeContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  modeBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  verseContainer: {
    marginBottom: 16,
  },
  verseRow: {
    flexDirection: 'row',
    gap: 10,
  },
  verseNumber: {
    minWidth: 16,
    paddingTop: 4,
  },
  verseTextWrapper: {
    flex: 1,
  },
  verseText: {
    fontSize: 17.5,
    lineHeight: 28,
  },
  contextBox: {
    marginLeft: 26,
    marginTop: 8,
    borderLeftWidth: 2,
    paddingLeft: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
});
