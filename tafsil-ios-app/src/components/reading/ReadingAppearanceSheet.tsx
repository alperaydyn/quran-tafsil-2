import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyledText } from '../common/StyledText';
import { useTheme } from '../../theme';
import { fontFamily } from '../../theme/typography';
import {
  useReadingPreferencesStore,
  ARABIC_FONT_SCALES,
  MEAL_FONT_SCALES,
  TRANSLITERATION_FONT_SCALES,
  LINE_SPACING_SCALES,
  getArabicMetrics,
  getMealMetrics,
  getTransliterationMetrics,
  type ArabicFontSizeScale,
  type MealFontSizeScale,
  type TransliterationFontSizeScale,
  type TransliterationStyle,
  type LineSpacingScale,
} from '../../store/useReadingPreferencesStore';

interface ReadingAppearanceSheetProps {
  visible: boolean;
  onClose: () => void;
}

const ARABIC_SCALES: ArabicFontSizeScale[] = ['small', 'medium', 'large', 'huge'];
const TRANSLITERATION_SCALES: TransliterationFontSizeScale[] = ['small', 'medium', 'large', 'huge'];
const MEAL_SCALES: MealFontSizeScale[] = ['small', 'medium', 'large', 'huge'];
const LINE_SPACINGS: LineSpacingScale[] = ['compact', 'normal', 'relaxed'];

export function ReadingAppearanceSheet({ visible, onClose }: ReadingAppearanceSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const {
    arabicFontSize,
    mealFontSize,
    transliterationFontSize,
    transliterationStyle,
    lineSpacing,
    showArabic,
    showMeal,
    showTransliteration,
    showConceptHighlights,
    setArabicFontSize,
    setMealFontSize,
    setTransliterationFontSize,
    setTransliterationStyle,
    setLineSpacing,
    toggleArabic,
    toggleMeal,
    toggleTransliteration,
    toggleConceptHighlights,
    resetToDefaults,
  } = useReadingPreferencesStore();

  const previewArabic = getArabicMetrics(arabicFontSize, lineSpacing);
  const previewMeal = getMealMetrics(mealFontSize, lineSpacing);
  const previewTransliteration = getTransliterationMetrics(transliterationFontSize, lineSpacing);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.colors.surf,
              borderColor: theme.colors.line,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}
        >
          {/* Sürükleme Tutacağı */}
          <View style={[styles.dragHandle, { backgroundColor: theme.colors.line }]} />

          {/* Başlık Alanı */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <StyledText variant="headline" color="ink" style={{ fontWeight: '700' }}>
                Okuma & Tipografi Ayarları
              </StyledText>
              <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
                Metin boyutları, satır aralıkları ve görünüm katmanları
              </StyledText>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: theme.colors.band,
                  borderColor: theme.colors.line,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              accessibilityLabel="Kapat"
            >
              <StyledText variant="body" color="mut" style={{ fontWeight: '600', fontSize: 13 }}>
                ✕
              </StyledText>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Canlı Önizleme Kartı */}
            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: theme.colors.bg,
                  borderColor: theme.colors.line,
                },
              ]}
            >
              <View style={styles.previewHeader}>
                <StyledText variant="eyebrow" color="faint">
                  CANLI ÖNİZLEME
                </StyledText>
                <StyledText variant="caption" color="acc">
                  Arapça {ARABIC_FONT_SCALES[arabicFontSize].scaleLabel}px{showTransliteration ? ` · Okunuş ${TRANSLITERATION_FONT_SCALES[transliterationFontSize].scaleLabel}px` : ''} · Meal {MEAL_FONT_SCALES[mealFontSize].scaleLabel}px
                </StyledText>
              </View>

              {showArabic && (
                <View style={{ marginTop: 8 }}>
                  <StyledText
                    style={{
                      fontFamily: fontFamily.arabic,
                      fontSize: previewArabic.fontSize,
                      lineHeight: previewArabic.lineHeight,
                      textAlign: 'right',
                      writingDirection: 'rtl',
                      color: theme.colors.ink,
                    }}
                  >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </StyledText>
                </View>
              )}

              {showTransliteration && (
                <StyledText
                  style={{
                    fontFamily: transliterationStyle === 'italic' ? fontFamily.serif : fontFamily.sans,
                    fontStyle: transliterationStyle === 'italic' ? 'italic' : 'normal',
                    fontSize: previewTransliteration.fontSize,
                    lineHeight: previewTransliteration.lineHeight,
                    color: theme.colors.mut,
                    marginTop: 6,
                  }}
                >
                  Bismi'llâhi'r-rahmâni'r-rahîm
                </StyledText>
              )}

              {showMeal && (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  <StyledText
                    style={{
                      fontFamily: fontFamily.serif,
                      fontSize: previewMeal.fontSize,
                      lineHeight: previewMeal.lineHeight,
                      color: theme.colors.ink,
                    }}
                  >
                    Rahmân ve Rahîm olan{' '}
                  </StyledText>

                  {showConceptHighlights ? (
                    <View
                      style={{
                        borderBottomWidth: 1.5,
                        borderBottomColor: theme.colors.acc,
                        marginHorizontal: 1,
                      }}
                    >
                      <StyledText
                        style={{
                          fontFamily: fontFamily.serifSemiBold,
                          fontSize: previewMeal.fontSize,
                          lineHeight: previewMeal.lineHeight,
                          color: theme.colors.acc,
                        }}
                      >
                        Allah'ın
                      </StyledText>
                    </View>
                  ) : (
                    <StyledText
                      style={{
                        fontFamily: fontFamily.serif,
                        fontSize: previewMeal.fontSize,
                        lineHeight: previewMeal.lineHeight,
                        color: theme.colors.ink,
                      }}
                    >
                      Allah'ın
                    </StyledText>
                  )}

                  <StyledText
                    style={{
                      fontFamily: fontFamily.serif,
                      fontSize: previewMeal.fontSize,
                      lineHeight: previewMeal.lineHeight,
                      color: theme.colors.ink,
                    }}
                  >
                    {' '}adıyla.
                  </StyledText>
                </View>
              )}
            </View>

            {/* Bölüm 1: Arapça Metin Boyutu */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <StyledText variant="subhead" color="ink" style={{ fontWeight: '600' }}>
                  Arapça Hat Boyutu
                </StyledText>
                <View
                  style={[
                    styles.tagBadge,
                    { backgroundColor: theme.colors.band, borderColor: theme.colors.line },
                  ]}
                >
                  <StyledText variant="caption" color="mut">
                    {ARABIC_FONT_SCALES[arabicFontSize].label} ({ARABIC_FONT_SCALES[arabicFontSize].scaleLabel}px)
                  </StyledText>
                </View>
              </View>

              <View style={[styles.segmentedRow, { backgroundColor: theme.colors.band }]}>
                {ARABIC_SCALES.map((scale) => {
                  const isSelected = arabicFontSize === scale;
                  const item = ARABIC_FONT_SCALES[scale];
                  return (
                    <Pressable
                      key={scale}
                      onPress={() => setArabicFontSize(scale)}
                      style={[
                        styles.segmentButton,
                        isSelected && {
                          backgroundColor: theme.colors.acc,
                          borderColor: theme.colors.acc,
                        },
                      ]}
                    >
                      <StyledText
                        style={{
                          fontFamily: fontFamily.sansSemiBold,
                          fontSize: 12,
                          color: isSelected
                            ? theme.scheme === 'dark' ? '#14130F' : '#FFFFFF'
                            : theme.colors.ink,
                        }}
                      >
                        {item.label}
                      </StyledText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Bölüm 2: Transkript (Okunuş) Boyutu ve Stili */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <StyledText variant="subhead" color="ink" style={{ fontWeight: '600' }}>
                  Transkript (Okunuş) Boyutu
                </StyledText>
                <View
                  style={[
                    styles.tagBadge,
                    { backgroundColor: theme.colors.band, borderColor: theme.colors.line },
                  ]}
                >
                  <StyledText variant="caption" color="mut">
                    {showTransliteration
                      ? `${TRANSLITERATION_FONT_SCALES[transliterationFontSize].label} (${TRANSLITERATION_FONT_SCALES[transliterationFontSize].scaleLabel}px)`
                      : 'Gizli'}
                  </StyledText>
                </View>
              </View>

              <View
                style={[
                  styles.segmentedRow,
                  {
                    backgroundColor: theme.colors.band,
                    opacity: showTransliteration ? 1 : 0.45,
                  },
                ]}
              >
                {TRANSLITERATION_SCALES.map((scale) => {
                  const isSelected = transliterationFontSize === scale;
                  const item = TRANSLITERATION_FONT_SCALES[scale];
                  return (
                    <Pressable
                      key={scale}
                      disabled={!showTransliteration}
                      onPress={() => setTransliterationFontSize(scale)}
                      style={[
                        styles.segmentButton,
                        isSelected && {
                          backgroundColor: theme.colors.acc,
                          borderColor: theme.colors.acc,
                        },
                      ]}
                    >
                      <StyledText
                        style={{
                          fontFamily: fontFamily.sansSemiBold,
                          fontSize: 12,
                          color: isSelected
                            ? theme.scheme === 'dark' ? '#14130F' : '#FFFFFF'
                            : theme.colors.ink,
                        }}
                      >
                        {item.label}
                      </StyledText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Transkript Yazı Karakteri (Eğik / Düz) */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 4,
                  paddingHorizontal: 2,
                }}
              >
                <StyledText variant="caption" color="mut" style={{ fontSize: 11 }}>
                  Transkript Yazı Karakteri
                </StyledText>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Pressable
                    disabled={!showTransliteration}
                    onPress={() => setTransliterationStyle('italic')}
                    style={({ pressed }) => ({
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: transliterationStyle === 'italic' ? theme.colors.acc : theme.colors.line,
                      backgroundColor: transliterationStyle === 'italic' ? theme.colors.accSoft : theme.colors.surf,
                      opacity: !showTransliteration ? 0.45 : pressed ? 0.75 : 1,
                    })}
                  >
                    <StyledText
                      style={{
                        fontFamily: fontFamily.serif,
                        fontStyle: 'italic',
                        fontSize: 12,
                        color: transliterationStyle === 'italic' ? theme.colors.acc : theme.colors.mut,
                        fontWeight: '600',
                      }}
                    >
                      Eğik (Serif)
                    </StyledText>
                  </Pressable>

                  <Pressable
                    disabled={!showTransliteration}
                    onPress={() => setTransliterationStyle('regular')}
                    style={({ pressed }) => ({
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: transliterationStyle === 'regular' ? theme.colors.acc : theme.colors.line,
                      backgroundColor: transliterationStyle === 'regular' ? theme.colors.accSoft : theme.colors.surf,
                      opacity: !showTransliteration ? 0.45 : pressed ? 0.75 : 1,
                    })}
                  >
                    <StyledText
                      style={{
                        fontFamily: fontFamily.sans,
                        fontSize: 12,
                        color: transliterationStyle === 'regular' ? theme.colors.acc : theme.colors.mut,
                        fontWeight: '600',
                      }}
                    >
                      Düz (Sans)
                    </StyledText>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Bölüm 3: Türkçe Çeviri Boyutu */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <StyledText variant="subhead" color="ink" style={{ fontWeight: '600' }}>
                  Türkçe Meal Boyutu
                </StyledText>
                <View
                  style={[
                    styles.tagBadge,
                    { backgroundColor: theme.colors.band, borderColor: theme.colors.line },
                  ]}
                >
                  <StyledText variant="caption" color="mut">
                    {MEAL_FONT_SCALES[mealFontSize].label} ({MEAL_FONT_SCALES[mealFontSize].scaleLabel}px)
                  </StyledText>
                </View>
              </View>

              <View style={[styles.segmentedRow, { backgroundColor: theme.colors.band }]}>
                {MEAL_SCALES.map((scale) => {
                  const isSelected = mealFontSize === scale;
                  const item = MEAL_FONT_SCALES[scale];
                  return (
                    <Pressable
                      key={scale}
                      onPress={() => setMealFontSize(scale)}
                      style={[
                        styles.segmentButton,
                        isSelected && {
                          backgroundColor: theme.colors.acc,
                          borderColor: theme.colors.acc,
                        },
                      ]}
                    >
                      <StyledText
                        style={{
                          fontFamily: fontFamily.sansSemiBold,
                          fontSize: 12,
                          color: isSelected
                            ? theme.scheme === 'dark' ? '#14130F' : '#FFFFFF'
                            : theme.colors.ink,
                        }}
                      >
                        {item.label}
                      </StyledText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Bölüm 3: Satır Aralığı (Line Spacing) */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <StyledText variant="subhead" color="ink" style={{ fontWeight: '600' }}>
                  Satır Aralığı
                </StyledText>
                <View
                  style={[
                    styles.tagBadge,
                    { backgroundColor: theme.colors.band, borderColor: theme.colors.line },
                  ]}
                >
                  <StyledText variant="caption" color="mut">
                    {LINE_SPACING_SCALES[lineSpacing].label}
                  </StyledText>
                </View>
              </View>

              <View style={[styles.segmentedRow, { backgroundColor: theme.colors.band }]}>
                {LINE_SPACINGS.map((sp) => {
                  const isSelected = lineSpacing === sp;
                  const item = LINE_SPACING_SCALES[sp];
                  return (
                    <Pressable
                      key={sp}
                      onPress={() => setLineSpacing(sp)}
                      style={[
                        styles.segmentButton,
                        isSelected && {
                          backgroundColor: theme.colors.acc,
                          borderColor: theme.colors.acc,
                        },
                      ]}
                    >
                      <StyledText
                        style={{
                          fontFamily: fontFamily.sansSemiBold,
                          fontSize: 12,
                          color: isSelected
                            ? theme.scheme === 'dark' ? '#14130F' : '#FFFFFF'
                            : theme.colors.ink,
                        }}
                      >
                        {item.label}
                      </StyledText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Bölüm 4: Görünüm Katmanları & Toggle'lar */}
            <View style={styles.sectionBlock}>
              <StyledText
                variant="subhead"
                color="ink"
                style={{ fontWeight: '600', marginBottom: 8 }}
              >
                Görünüm Katmanları
              </StyledText>

              <View
                style={[
                  styles.togglesCard,
                  {
                    backgroundColor: theme.colors.bg,
                    borderColor: theme.colors.line,
                  },
                ]}
              >
                {/* 1. Meal Gizleme Toggle'ı (PBI-1.5 ana gereksinimi) */}
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <StyledText variant="body" color="ink" style={{ fontWeight: '600' }}>
                      Türkçe Meali Göster
                    </StyledText>
                    <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
                      {showMeal
                        ? 'Türkçe meal çevirisi ayet altında görüntülenir.'
                        : 'Meal gizlendi; yalnızca Arapça tilavet ve hat akışı aktiftir.'}
                    </StyledText>
                  </View>
                  <Switch
                    value={showMeal}
                    onValueChange={toggleMeal}
                    trackColor={{ false: theme.colors.line, true: theme.colors.acc }}
                    thumbColor={showMeal ? (theme.scheme === 'dark' ? '#FFFFFF' : '#FFFFFF') : theme.colors.faint}
                  />
                </View>

                <View style={[styles.separator, { backgroundColor: theme.colors.line }]} />

                {/* 2. Arapça Metin Gösterimi Toggle'ı */}
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <StyledText variant="body" color="ink" style={{ fontWeight: '600' }}>
                      Arapça Mushaf Metnini Göster
                    </StyledText>
                    <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
                      Orijinal Uthmani Arapça kelime bloklarını listeler.
                    </StyledText>
                  </View>
                  <Switch
                    value={showArabic}
                    onValueChange={toggleArabic}
                    trackColor={{ false: theme.colors.line, true: theme.colors.acc }}
                    thumbColor={showArabic ? (theme.scheme === 'dark' ? '#FFFFFF' : '#FFFFFF') : theme.colors.faint}
                  />
                </View>

                <View style={[styles.separator, { backgroundColor: theme.colors.line }]} />

                {/* 3. Transliterasyon (Okunuş) Toggle'ı */}
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <StyledText variant="body" color="ink" style={{ fontWeight: '600' }}>
                      Transliterasyon (Okunuş)
                    </StyledText>
                    <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
                      Ayetin Latin harfleriyle telaffuz kılavuzunu ekler.
                    </StyledText>
                  </View>
                  <Switch
                    value={showTransliteration}
                    onValueChange={toggleTransliteration}
                    trackColor={{ false: theme.colors.line, true: theme.colors.acc }}
                    thumbColor={showTransliteration ? (theme.scheme === 'dark' ? '#FFFFFF' : '#FFFFFF') : theme.colors.faint}
                  />
                </View>

                <View style={[styles.separator, { backgroundColor: theme.colors.line }]} />

                {/* 4. Kavram Vurguları Toggle'ı */}
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <StyledText variant="body" color="ink" style={{ fontWeight: '600' }}>
                      Kavram Vurguları ([Kavram])
                    </StyledText>
                    <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
                      Ayetler arası semantik bağlantılı kavramların altını çizer.
                    </StyledText>
                  </View>
                  <Switch
                    value={showConceptHighlights}
                    onValueChange={toggleConceptHighlights}
                    trackColor={{ false: theme.colors.line, true: theme.colors.acc }}
                    thumbColor={showConceptHighlights ? (theme.scheme === 'dark' ? '#FFFFFF' : '#FFFFFF') : theme.colors.faint}
                  />
                </View>
              </View>
            </View>

            {/* Alt Butonlar */}
            <View style={styles.actionButtonsRow}>
              <Pressable
                onPress={resetToDefaults}
                style={({ pressed }) => [
                  styles.resetButton,
                  {
                    backgroundColor: theme.colors.band,
                    borderColor: theme.colors.line,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <StyledText variant="body" color="mut" style={{ fontWeight: '600' }}>
                  Varsayılana Sıfırla
                </StyledText>
              </Pressable>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.doneButton,
                  {
                    backgroundColor: theme.colors.acc,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <StyledText
                  variant="body"
                  style={{
                    color: theme.scheme === 'dark' ? '#14130F' : '#FFFFFF',
                    fontWeight: '700',
                  }}
                >
                  Tamam
                </StyledText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '88%',
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 18,
  },
  previewCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  segmentedRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  togglesCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
