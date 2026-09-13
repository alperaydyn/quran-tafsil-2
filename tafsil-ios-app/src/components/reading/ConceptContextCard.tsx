import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { StyledText } from '../common/StyledText';
import { useTheme } from '../../theme';
import type { ConceptDetail } from '../../data/concepts.seed';
import { getConceptDetails } from '../../data/concepts.seed';

interface ConceptContextCardProps {
  concept: ConceptDetail;
  depth: number;
  isLastInChain: boolean;
  onSelectRelatedConcept: (slug: string) => void;
  onClose: () => void;
  onOpenDag?: (slug: string) => void;
}

export function ConceptContextCard({
  concept,
  depth,
  isLastInChain,
  onSelectRelatedConcept,
  onClose,
  onOpenDag,
}: ConceptContextCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.cardWrap,
        {
          marginLeft: Math.min(depth * 10, 24),
          borderLeftColor: isLastInChain ? theme.colors.acc : theme.colors.line,
          backgroundColor: theme.colors.surf,
          borderColor: theme.colors.line,
        },
      ]}
    >
      {/* Üst Başlık: Kavram Adı + Kök + Kapat Butonu */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <StyledText style={[styles.label, { color: theme.colors.ink }]}>
            {concept.label}
          </StyledText>
          {concept.root ? (
            <StyledText style={[styles.rootText, { color: theme.colors.mut }]}>
              {concept.root}
            </StyledText>
          ) : null}
        </View>

        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
          <StyledText style={[styles.closeIcon, { color: theme.colors.faint }]}>
            ×
          </StyledText>
        </Pressable>
      </View>

      {/* Morfolojik / Semantik Anlam (Newsreader Serif) */}
      <StyledText
        variant="body"
        style={[
          styles.glossText,
          {
            color: theme.colors.ink,
          },
        ]}
      >
        {concept.gloss}
      </StyledText>

      {/* Kur'an'daki Kullanım ve Bağlam Analizi */}
      {concept.use ? (
        <StyledText
          style={[
            styles.useText,
            {
              color: theme.colors.mut,
            },
          ]}
        >
          {concept.use}
        </StyledText>
      ) : null}

      {/* Alt Aksiyonlar: İlişkili Kavram Çipleri (İç içe açılan zincir) + DAG Graf Butonu */}
      <View style={styles.actionsRow}>
        {concept.links && concept.links.length > 0 ? (
          <View style={styles.chipsRow}>
            {concept.links.map((linkSlug) => {
              const rel = getConceptDetails(linkSlug);
              const chipLabel = rel?.label ?? linkSlug.toUpperCase();
              return (
                <Pressable
                  key={linkSlug}
                  onPress={() => onSelectRelatedConcept(linkSlug)}
                  hitSlop={4}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: theme.colors.accSoft,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <StyledText style={[styles.chipText, { color: theme.colors.acc }]}>
                    {chipLabel}
                  </StyledText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {onOpenDag ? (
          <Pressable
            onPress={() => onOpenDag(concept.slug)}
            hitSlop={4}
            style={({ pressed }) => [
              styles.dagBtn,
              {
                borderColor: theme.colors.line,
                backgroundColor: pressed ? theme.colors.band : 'transparent',
              },
            ]}
          >
            <StyledText style={[styles.dagBtnText, { color: theme.colors.mut }]}>
              Kavram grafında gör ›
            </StyledText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    borderLeftWidth: 2.5,
    borderWidth: 1,
    borderRadius: 14,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    padding: 13,
    marginTop: 8,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  rootText: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 14,
    writingDirection: 'rtl',
  },
  closeBtn: {
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '400',
  },
  glossText: {
    fontFamily: 'Newsreader_400Regular',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  useText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    paddingTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dagBtn: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  dagBtnText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
