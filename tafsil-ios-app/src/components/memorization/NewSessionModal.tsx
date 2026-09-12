import React, { useState } from 'react';
import {
  Modal,
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StyledText } from '../common/StyledText';
import { useTheme } from '../../theme';
import { mockSurahs } from '../../api/mock/surahs.mock';
import type { Surah } from '../../api/types';
import { useMemorizationStore } from '../../store/useMemorizationStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSessionCreated: (sessionId: string) => void;
  preselectedSurahId?: number;
}

export function NewSessionModal({
  visible,
  onClose,
  onSessionCreated,
  preselectedSurahId = 96,
}: Props) {
  const theme = useTheme();
  const addSession = useMemorizationStore((s) => s.addSession);

  const [selectedSurahId, setSelectedSurahId] = useState(preselectedSurahId);
  const [scope, setScope] = useState<'all' | 'blocks'>('blocks');
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(0);

  const surah = mockSurahs.find((s) => s.id === selectedSurahId) ?? mockSurahs[0];

  // 5'er ayetlik dinamik bloklar
  const blockSize = 5;
  const totalBlocks = Math.ceil(surah.verseCount / blockSize);
  const blocks = Array.from({ length: totalBlocks }, (_, i) => {
    const start = i * blockSize + 1;
    const end = Math.min((i + 1) * blockSize, surah.verseCount);
    return {
      index: i,
      start,
      end,
      title: `Ayet ${start}–${end}`,
      verseCount: end - start + 1,
    };
  });

  const activeBlock = blocks[selectedBlockIndex] ?? blocks[0];
  const startAyah = scope === 'all' ? 1 : activeBlock.start;
  const endAyah = scope === 'all' ? surah.verseCount : activeBlock.end;
  const totalSelectedAyahs = endAyah - startAyah + 1;

  const handleCreate = () => {
    const newSession = addSession({
      surahId: surah.id,
      surahNameTr: surah.nameTr,
      startAyah,
      endAyah,
      theme: `${surah.nameTr} ${startAyah}–${endAyah}`,
    });
    onClose();
    onSessionCreated(newSession.id);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.line }]}>
          <Pressable onPress={onClose} hitSlop={10}>
            <StyledText variant="body" color="mut">Vazgeç</StyledText>
          </Pressable>
          <StyledText variant="headline" style={{ color: theme.colors.ink }}>Yeni Ezber Oturumu</StyledText>
          <StyledText variant="caption" color="faint">1/2</StyledText>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* SURE SEÇİMİ */}
          <StyledText variant="eyebrow" color="faint" style={{ marginBottom: 8 }}>SURE</StyledText>
          <View
            style={[
              styles.surahBox,
              { backgroundColor: theme.colors.surf, borderColor: theme.colors.acc },
            ]}
          >
            <View style={{ flex: 1 }}>
              <StyledText variant="title" style={{ fontSize: 18, color: theme.colors.ink }}>
                {surah.id} · {surah.nameTr}
              </StyledText>
              <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
                {surah.verseCount} ayet · {surah.period === 'medine' ? 'Medine' : 'Mekke'} Dönemi
              </StyledText>
            </View>
          </View>

          {/* KAPSAM SEÇİMİ */}
          <StyledText variant="eyebrow" color="faint" style={{ marginTop: 22, marginBottom: 8 }}>KAPSAM</StyledText>
          <View style={[styles.scopeToggle, { backgroundColor: theme.colors.band }]}>
            <Pressable
              onPress={() => setScope('blocks')}
              style={[
                styles.scopeBtn,
                scope === 'blocks' && { backgroundColor: theme.colors.surf, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
              ]}
            >
              <StyledText
                variant="callout"
                style={{
                  fontWeight: scope === 'blocks' ? '600' : '400',
                  color: scope === 'blocks' ? theme.colors.ink : theme.colors.mut,
                }}
              >
                Seçtiğim ayetler
              </StyledText>
            </Pressable>

            <Pressable
              onPress={() => setScope('all')}
              style={[
                styles.scopeBtn,
                scope === 'all' && { backgroundColor: theme.colors.surf, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
              ]}
            >
              <StyledText
                variant="callout"
                style={{
                  fontWeight: scope === 'all' ? '600' : '400',
                  color: scope === 'all' ? theme.colors.ink : theme.colors.mut,
                }}
              >
                Surenin tamamı
              </StyledText>
            </Pressable>
          </View>

          {/* AYET BLOKLARI LİSTESİ */}
          {scope === 'blocks' && (
            <View style={{ gap: 8, marginTop: 14 }}>
              {blocks.map((b) => {
                const isChecked = selectedBlockIndex === b.index;
                return (
                  <Pressable
                    key={b.index}
                    onPress={() => setSelectedBlockIndex(b.index)}
                    style={[
                      styles.blockItem,
                      {
                        backgroundColor: theme.colors.surf,
                        borderColor: isChecked ? theme.colors.acc : theme.colors.line,
                        borderWidth: isChecked ? 1.5 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: isChecked ? theme.colors.acc : theme.colors.faint,
                          backgroundColor: isChecked ? theme.colors.acc : 'transparent',
                        },
                      ]}
                    >
                      {isChecked && <StyledText style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✓</StyledText>}
                    </View>

                    <View style={{ flex: 1 }}>
                      <StyledText variant="headline" style={{ fontSize: 15, color: theme.colors.ink }}>
                        {b.title}
                      </StyledText>
                      <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
                        {b.verseCount} ayetlik ezber bloğu
                      </StyledText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* TEKRAR PLANI KUTUSU */}
          <View
            style={[
              styles.planBox,
              {
                borderLeftColor: theme.colors.acc,
                backgroundColor: theme.colors.surf,
              },
            ]}
          >
            <StyledText variant="eyebrow" color="acc">TEKRAR PLANI (SM-2)</StyledText>
            <StyledText variant="footnote" color="mut" style={{ marginTop: 4, lineHeight: 18 }}>
              Her bölüm ezberlendikçe tekrar aralığı uzar: bugün → 1 gün → 3 gün → 7 gün → 21 gün → 60 gün. Takıldığın bölüm bir basamak geri döner.
            </StyledText>
          </View>
        </ScrollView>

        {/* ALT ÇUBUK & ONAR BUTONU */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surf, borderTopColor: theme.colors.line }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <StyledText variant="callout" style={{ fontWeight: '600', color: theme.colors.ink }}>
              {totalSelectedAyahs} ayet seçildi
            </StyledText>
            <StyledText variant="footnote" color="mut">
              Günde ~{Math.max(5, Math.round(totalSelectedAyahs * 1.5))} dk
            </StyledText>
          </View>

          <Pressable
            onPress={handleCreate}
            style={[styles.submitBtn, { backgroundColor: theme.colors.ink }]}
          >
            <StyledText variant="callout" style={{ color: theme.colors.surf, fontWeight: '600' }}>
              Oturumu Oluştur
            </StyledText>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  surahBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  scopeToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  blockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBox: {
    marginTop: 22,
    borderLeftWidth: 2.5,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  footer: {
    borderTopWidth: 1,
    padding: 16,
    paddingBottom: 24,
  },
  submitBtn: {
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
