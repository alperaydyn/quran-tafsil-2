import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { StyledText } from '../common/StyledText';
import { Button } from '../common/Button';
import { useTheme } from '../../theme';
import type { Word } from '../../api/types';

interface WordDetailSheetProps {
  word: Word | null;
  visible: boolean;
  onClose: () => void;
  onOpenDag?: (slug?: string) => void;
}

export function WordDetailSheet({ word, visible, onClose, onOpenDag }: WordDetailSheetProps) {
  const theme = useTheme();

  if (!word) return null;

  // Örnek dağılım barları (Tafsil.dc.html #04 referansı)
  const freqBars = [
    { height: 42, label: 'عَلَقٍ', active: true },
    { height: 26, label: 'عَلَقَةً', active: false },
    { height: 16, label: 'تَعَلَّقَ', active: false },
    { height: 34, label: 'أَعْلَقَ', active: false },
    { height: 20, label: 'عَلِيق', active: false },
    { height: 12, label: 'عَلَائِق', active: false },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: theme.colors.surf,
            borderTopLeftRadius: theme.radius.xxl,
            borderTopRightRadius: theme.radius.xxl,
            borderWidth: 1,
            borderColor: theme.colors.line,
            maxHeight: '90%',
            paddingTop: theme.spacing.md,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Sürükleme / Tutamaç Çubuğu */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.faint,
              alignSelf: 'center',
              marginBottom: theme.spacing.sm,
            }}
          />

          {/* Başlık Çubuğu */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: theme.spacing.xl,
              paddingBottom: theme.spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.line,
            }}
          >
            <Pressable onPress={onClose} hitSlop={12}>
              <StyledText variant="title" color="mut">
                ‹
              </StyledText>
            </Pressable>
            <StyledText variant="caption" color="faint" style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
              KELİME DETAYI
            </StyledText>
            <StyledText variant="body" color="mut">
              ↗
            </StyledText>
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.xl,
              paddingTop: theme.spacing.lg,
              paddingBottom: 28,
              gap: theme.spacing.lg,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Büyük Arapça Kelime & Rozetler */}
            <View style={{ alignItems: 'center', gap: 6, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.line }}>
              <StyledText variant="arabicHero" color="ink" style={{ fontSize: 44, lineHeight: 60, writingDirection: 'rtl' }}>
                {word.textAr}
              </StyledText>
              <StyledText variant="footnote" color="mut">
                {word.textTr || 'alak'} · Ayet İçi
              </StyledText>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                <View style={{ backgroundColor: theme.colors.accSoft, borderRadius: theme.radius.md, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <StyledText variant="caption" color="acc" style={{ fontWeight: '600' }}>
                    kök ع-ل-ق
                  </StyledText>
                </View>
                <View style={{ backgroundColor: theme.colors.band, borderRadius: theme.radius.md, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <StyledText variant="caption" color="mut" style={{ fontWeight: '500' }}>
                    isim · nekre
                  </StyledText>
                </View>
                <View style={{ backgroundColor: theme.colors.band, borderRadius: theme.radius.md, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <StyledText variant="caption" color="mut" style={{ fontWeight: '500' }}>
                    6 türev
                  </StyledText>
                </View>
              </View>
            </View>

            {/* Bu Ayetteki Anlam */}
            <View style={{ gap: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.line }}>
              <StyledText variant="caption" color="faint" style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
                BU AYETTEKİ ANLAM
              </StyledText>
              <StyledText variant="bodyLarge" color="ink" style={{ fontFamily: theme.font.serif, fontSize: 18, lineHeight: 26 }}>
                Asılıp tutunan, ilişen şey.
              </StyledText>
              <StyledText variant="footnote" color="mut" style={{ lineHeight: 20 }}>
                Alternatifler: kan pıhtısı · sülük benzeri · yapışan damla. Kökün ilk anlamı “tutunma”dır; “pıhtı” sonraki dönem sözlüklerinde öne çıkar.
              </StyledText>
            </View>

            {/* Kökün Kur'an'daki Dağılımı */}
            <View style={{ gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.line }}>
              <StyledText variant="caption" color="faint" style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
                KÖKÜN KUR'AN'DAKİ DAĞILIMI
              </StyledText>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 56, gap: 8, marginTop: 4 }}>
                {freqBars.map((b, idx) => (
                  <View key={`freq-${idx}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <View
                      style={{
                        width: '100%',
                        height: b.height,
                        borderRadius: 3,
                        backgroundColor: b.active ? theme.colors.acc : theme.colors.line,
                      }}
                    />
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {freqBars.map((b, idx) => (
                  <StyledText
                    key={`label-${idx}`}
                    variant="caption"
                    color="mut"
                    style={{ flex: 1, textAlign: 'center', fontSize: 11, writingDirection: 'rtl' }}
                  >
                    {b.label}
                  </StyledText>
                ))}
              </View>
            </View>

            {/* Klasik Sözlük Kayıtları */}
            <View style={{ gap: 10 }}>
              <StyledText variant="caption" color="faint" style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
                KLASİK SÖZLÜK KAYITLARI
              </StyledText>
              <View style={{ borderLeftWidth: 2, borderLeftColor: theme.colors.faint, paddingLeft: 12, gap: 3 }}>
                <StyledText variant="caption" color="ink" style={{ fontWeight: '600' }}>
                  el-Müfredât · Râgıb el-İsfahânî
                </StyledText>
                <StyledText variant="footnote" color="mut" style={{ fontFamily: theme.font.serif, lineHeight: 19 }}>
                  “Bir şeye yapışıp asılı kalmak; kan da bu sebeple alak adını alır.”
                </StyledText>
              </View>
              <View style={{ borderLeftWidth: 2, borderLeftColor: theme.colors.faint, paddingLeft: 12, gap: 3 }}>
                <StyledText variant="caption" color="ink" style={{ fontWeight: '600' }}>
                  Lisânü'l-Arab · İbn Manzûr
                </StyledText>
                <StyledText variant="footnote" color="mut" style={{ fontFamily: theme.font.serif, lineHeight: 19 }}>
                  “Alâka: bağ, ilgi. Aynı kökten sevgi bağı da bu kelimeyle anılır.”
                </StyledText>
              </View>
            </View>

            {/* Alt Eylem Butonları */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Button
                label="Kavram ağında aç"
                variant="primary"
                onPress={() => {
                  onClose();
                  onOpenDag?.('ilim');
                }}
                style={{ flex: 1 }}
              />
              <Button
                label="Kapat"
                variant="secondary"
                onPress={onClose}
                style={{ width: 80 }}
              />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
