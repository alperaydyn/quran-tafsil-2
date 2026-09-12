import React, { useState, useEffect } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { mockSurahs } from '../api/mock/surahs.mock';
import { getVerses } from '../api/client';
import type { Verse } from '../api/types';
import { useMemorizationStore } from '../store/useMemorizationStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Phase = 'birlikte' | 'kelime' | 'sesli' | 'sonuc';

export function MemorizationStudioScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();

  const sessionId = route.params?.sessionId as string | undefined;
  const surahId = (route.params?.surahId as number | undefined) ?? 96;
  const startAyah = (route.params?.startAyah as number | undefined) ?? 1;
  const endAyah = (route.params?.endAyah as number | undefined) ?? 5;

  const surah = mockSurahs.find((s) => s.id === surahId) ?? mockSurahs[0];
  const updateSessionReview = useMemorizationStore((s) => s.updateSessionReview);

  const [loading, setLoading] = useState(true);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [phase, setPhase] = useState<Phase>('birlikte');
  const [activeAyahIndex, setActiveAyahIndex] = useState(0);

  // Aşama 2 ve 3 durumları
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [revealedWordCount, setRevealedWordCount] = useState<Record<number, number>>({});
  const [turnCounts, setTurnCounts] = useState({ birlikte: 1, kelime: 0, sesli: 0 });

  // Sonuç ve SM-2 değerlendirme seçimi (0: Tekrar et, 1: Zorlandı, 2: İyi, 3: Mükemmel)
  const [evalScore, setEvalScore] = useState<number>(2);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getVerses(surahId)
      .then((res) => {
        if (!isMounted) return;
        const list: Verse[] = res.data ?? [];
        const filtered = list.filter((v: Verse) => v.ayahNo >= startAyah && v.ayahNo <= endAyah);
        setVerses(filtered);
      })
      .catch(() => {
        // Fallback: Yerel mock üret
        if (!isMounted) return;
        const mockList: Verse[] = Array.from({ length: endAyah - startAyah + 1 }, (_, i) => ({
          id: i + 1,
          surahId,
          ayahNo: startAyah + i,
          juzNo: 30,
          pageNo: 597,
          textAr: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ',
          transliterationTr: "Ikr'a bismi rabbikellezî halak",
          mealTr: 'Yaratan Rabbinin adıyla oku!',
          audioUrl: null,
          words: [],
        }));
        setVerses(mockList);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [surahId, startAyah, endAyah]);

  const activeVerse = verses[activeAyahIndex];

  const handleNextAyah = () => {
    if (activeAyahIndex < verses.length - 1) {
      setActiveAyahIndex(activeAyahIndex + 1);
    } else {
      // Tur tamamlandı
      if (phase === 'birlikte') {
        setTurnCounts((c) => ({ ...c, birlikte: c.birlikte + 1 }));
        setPhase('kelime');
        setActiveAyahIndex(0);
      } else if (phase === 'kelime') {
        setTurnCounts((c) => ({ ...c, kelime: c.kelime + 1 }));
        setPhase('sesli');
        setActiveAyahIndex(0);
      } else if (phase === 'sesli') {
        setTurnCounts((c) => ({ ...c, sesli: c.sesli + 1 }));
        setPhase('sonuc');
      }
    }
  };

  const handleSaveEvaluation = () => {
    // SM-2 kalite puanları: 0 -> q=1, 1 -> q=3, 2 -> q=4, 3 -> q=5
    const qualityMap: Record<number, number> = { 0: 1, 1: 3, 2: 4, 3: 5 };
    const q = qualityMap[evalScore] ?? 4;

    if (sessionId) {
      updateSessionReview(sessionId, q);
    }
    navigation.goBack();
  };

  const evalOptions = [
    { label: 'Tekrar et', desc: 'Zorlandın, bugün veya yarın tekrar çalışılacak.', next: 'Yarın' },
    { label: 'Zorlandı', desc: 'Birkaç duraksamayla hatırlandı.', next: '1 gün sonra' },
    { label: 'İyi', desc: 'Rahat ve akıcı okundu.', next: '6 gün sonra' },
    { label: 'Mükemmel', desc: 'Eksiksiz ve pürüzsüz hafızada.', next: '16 gün sonra' },
  ];

  return (
    <Screen>
      <View style={styles.container}>
        {/* Üst Çubuk */}
        <View style={styles.navBar}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <StyledText variant="title" color="mut" style={{ fontSize: 24 }}>‹</StyledText>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <StyledText variant="headline" style={{ color: theme.colors.ink }}>
              {surah.nameTr} · {startAyah}–{endAyah}
            </StyledText>
            <StyledText variant="eyebrow" color="acc" style={{ fontSize: 9.5, marginTop: 1 }}>
              EZBER OTURUMU · {verses.length} AYET
            </StyledText>
          </View>
          <StyledText variant="body" color="mut">⋯</StyledText>
        </View>

        {/* 4 Kademeli Tur Seçici (Chips) */}
        <View style={[styles.chipsContainer, { backgroundColor: theme.colors.band }]}>
          {(['birlikte', 'kelime', 'sesli', 'sonuc'] as Phase[]).map((p, idx) => {
            const labels = ['1 · Birlikte', '2 · Kelime', '3 · Sesli', 'Sonuç'];
            const isActive = phase === p;
            return (
              <Pressable
                key={p}
                onPress={() => setPhase(p)}
                style={[
                  styles.chipBtn,
                  isActive && { backgroundColor: theme.colors.surf, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3 },
                ]}
              >
                <StyledText
                  variant="caption"
                  style={{
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? theme.colors.ink : theme.colors.mut,
                    fontSize: 11,
                  }}
                >
                  {labels[idx]}
                </StyledText>
              </Pressable>
            );
          })}
        </View>

        {/* Aşama Açıklaması */}
        {phase !== 'sonuc' && (
          <View style={styles.phaseInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <StyledText variant="callout" style={{ fontWeight: '600', color: theme.colors.ink }}>
                {phase === 'birlikte' ? 'Birlikte Okuma' : phase === 'kelime' ? 'Kelime Turu' : 'Sesli Okuma'}
              </StyledText>
              <StyledText variant="caption" color="acc" style={{ fontWeight: '600' }}>
                {phase === 'birlikte' ? `${turnCounts.birlikte}. Tur` : phase === 'kelime' ? `${turnCounts.kelime + 1}. Tur` : `${turnCounts.sesli + 1}. Tur`}
              </StyledText>
            </View>
            <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
              {phase === 'birlikte'
                ? 'Arapça Uthmani metin, transliterasyon ve meal bir arada. Bütüncül dinle ve aşinalık kazan.'
                : phase === 'kelime'
                ? 'Transliterasyon ve meal gizlendi. Yalnızca Arapça iskelet ve görsel ipuçlarıyla hafızayı yokla.'
                : 'Metin başlangıçta gizlidir. Sesli oku; durakladığında kelimeler hafifçe parlayarak belirir.'}
            </StyledText>
          </View>
        )}

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.acc} />
          </View>
        ) : phase === 'sonuc' ? (
          /* SONUÇ VE SM-2 DEĞERLENDİRME EKRANI */
          <ScrollView contentContainerStyle={styles.evalContent}>
            <View
              style={[
                styles.evalSummaryCard,
                { backgroundColor: theme.colors.surf, borderColor: theme.colors.line },
              ]}
            >
              <StyledText variant="title" style={{ fontSize: 18, color: theme.colors.ink }}>
                {verses.length} ayet, bir bütün olarak çalışıldı
              </StyledText>
              <StyledText variant="footnote" color="mut" style={{ marginTop: 3 }}>
                Toplam 3 kademe tamamlandı · ekrana minimum temas
              </StyledText>

              <View style={{ gap: 8, marginTop: 14 }}>
                <View style={styles.evalRow}>
                  <View style={[styles.bullet, { backgroundColor: theme.colors.acc }]} />
                  <StyledText variant="footnote" style={{ flex: 1, color: theme.colors.ink }}>
                    Birlikte okuma
                  </StyledText>
                  <StyledText variant="caption" color="mut">Akıcı</StyledText>
                </View>
                <View style={styles.evalRow}>
                  <View style={[styles.bullet, { backgroundColor: theme.colors.acc }]} />
                  <StyledText variant="footnote" style={{ flex: 1, color: theme.colors.ink }}>
                    Kelime turu
                  </StyledText>
                  <StyledText variant="caption" color="mut">Arapça hafıza testi</StyledText>
                </View>
                <View style={styles.evalRow}>
                  <View style={[styles.bullet, { backgroundColor: theme.colors.acc }]} />
                  <StyledText variant="footnote" style={{ flex: 1, color: theme.colors.ink }}>
                    Sesli okuma
                  </StyledText>
                  <StyledText variant="caption" color="mut">Fısıltı desteğiyle</StyledText>
                </View>
              </View>
            </View>

            {/* BU OTURUM NASIL GEÇTİ? (SM-2 Slider/Seçici) */}
            <View style={{ marginTop: 24 }}>
              <StyledText variant="eyebrow" color="mut">BU OTURUM NASIL GEÇTİ?</StyledText>
              <StyledText variant="footnote" color="mut" style={{ marginTop: 4 }}>
                Cevabın, bu ayetlerin bir bütün olarak ne zaman tekrar geleceğini belirler.
              </StyledText>

              <View style={[styles.evalOptionsRow, { backgroundColor: theme.colors.band }]}>
                {evalOptions.map((opt, i) => {
                  const isSelected = evalScore === i;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => setEvalScore(i)}
                      style={[
                        styles.evalOptionBtn,
                        isSelected && {
                          backgroundColor: theme.colors.surf,
                          borderColor: theme.colors.acc,
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <StyledText
                        variant="caption"
                        style={{
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? theme.colors.acc : theme.colors.ink,
                          fontSize: 11,
                        }}
                      >
                        {opt.label}
                      </StyledText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Seçili Plan Detayı */}
              <View
                style={[
                  styles.evalPlanDetail,
                  { backgroundColor: theme.colors.accSoft, borderColor: theme.colors.acc },
                ]}
              >
                <StyledText variant="footnote" style={{ flex: 1, color: theme.colors.ink }}>
                  {evalOptions[evalScore].desc}
                </StyledText>
                <StyledText variant="callout" color="acc" style={{ fontWeight: '700' }}>
                  {evalOptions[evalScore].next}
                </StyledText>
              </View>

              {/* Oturumu Kaydet Butonu */}
              <Pressable
                onPress={handleSaveEvaluation}
                style={[styles.saveBtn, { backgroundColor: theme.colors.ink }]}
              >
                <StyledText variant="callout" style={{ color: theme.colors.surf, fontWeight: '600' }}>
                  Oturumu Kaydet
                </StyledText>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          /* AKORDEON AYET LİSTESİ (Aşama 1, 2, 3) */
          <ScrollView contentContainerStyle={styles.accordionContent}>
            {verses.map((v, idx) => {
              const isActive = idx === activeAyahIndex;
              const isHintOpen = revealedHints[v.ayahNo];

              return (
                <Pressable
                  key={v.id}
                  onPress={() => setActiveAyahIndex(idx)}
                  style={[
                    styles.accordionCard,
                    {
                      backgroundColor: theme.colors.surf,
                      borderColor: isActive ? theme.colors.acc : theme.colors.line,
                      borderWidth: isActive ? 1.5 : 1,
                    },
                  ]}
                >
                  {/* Başlık Satırı */}
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.ayahBadge,
                        { backgroundColor: isActive ? theme.colors.accSoft : theme.colors.band },
                      ]}
                    >
                      <StyledText
                        variant="caption"
                        style={{
                          fontWeight: '700',
                          color: isActive ? theme.colors.acc : theme.colors.ink,
                        }}
                      >
                        {v.ayahNo}
                      </StyledText>
                    </View>

                    {isActive ? (
                      <StyledText variant="eyebrow" color="acc">ŞİMDİ OKUNUYOR</StyledText>
                    ) : (
                      <StyledText
                        variant="body"
                        numberOfLines={1}
                        style={{
                          flex: 1,
                          textAlign: 'right',
                          fontFamily: 'Amiri',
                          color: theme.colors.mut,
                          fontSize: 18,
                        }}
                      >
                        {v.textAr}
                      </StyledText>
                    )}
                  </View>

                  {/* Genişleyen Aktif Ayet Gövdesi */}
                  {isActive && (
                    <View style={{ marginTop: 12 }}>
                      {/* 1. KADEME: BİRLİKTE */}
                      {phase === 'birlikte' && (
                        <View style={{ gap: 10 }}>
                          <StyledText
                            style={{
                              fontFamily: 'Amiri',
                              fontSize: 26,
                              lineHeight: 46,
                              textAlign: 'right',
                              color: theme.colors.ink,
                            }}
                          >
                            {v.textAr}
                          </StyledText>
                          <StyledText
                            variant="callout"
                            style={{ fontStyle: 'italic', color: theme.colors.mut }}
                          >
                            {v.transliterationTr}
                          </StyledText>
                          <StyledText
                            variant="body"
                            style={{ color: theme.colors.ink, lineHeight: 22 }}
                          >
                            {v.mealTr}
                          </StyledText>
                        </View>
                      )}

                      {/* 2. KADEME: KELİME (Arapça iskelet + İpucu) */}
                      {phase === 'kelime' && (
                        <View style={{ gap: 12 }}>
                          <StyledText
                            style={{
                              fontFamily: 'Amiri',
                              fontSize: 27,
                              lineHeight: 48,
                              textAlign: 'right',
                              color: theme.colors.ink,
                            }}
                          >
                            {v.textAr}
                          </StyledText>

                          {!isHintOpen ? (
                            <Pressable
                              onPress={() =>
                                setRevealedHints((h) => ({ ...h, [v.ayahNo]: true }))
                              }
                              style={[styles.hintBtn, { borderColor: theme.colors.acc }]}
                            >
                              <StyledText variant="caption" color="acc" style={{ fontWeight: '600' }}>
                                💡 İpucu Göster (Meal & Okunuş)
                              </StyledText>
                            </Pressable>
                          ) : (
                            <View
                              style={[
                                styles.revealedHintBox,
                                {
                                  backgroundColor: theme.colors.band,
                                  borderLeftColor: theme.colors.acc,
                                },
                              ]}
                            >
                              <StyledText variant="eyebrow" color="acc">HATIRLATMA AÇILDI</StyledText>
                              <StyledText
                                variant="footnote"
                                style={{ fontStyle: 'italic', color: theme.colors.mut, marginTop: 3 }}
                              >
                                {v.transliterationTr}
                              </StyledText>
                              <StyledText variant="footnote" color="ink" style={{ marginTop: 2 }}>
                                {v.mealTr}
                              </StyledText>
                            </View>
                          )}
                        </View>
                      )}

                      {/* 3. KADEME: SESLİ OKUMA & REVEAL ON RECITE */}
                      {phase === 'sesli' && (
                        <View style={{ gap: 12 }}>
                          <StyledText
                            style={{
                              fontFamily: 'Amiri',
                              fontSize: 27,
                              lineHeight: 48,
                              textAlign: 'right',
                              color: theme.colors.ink,
                            }}
                          >
                            {v.textAr}
                          </StyledText>

                          <View
                            style={[
                              styles.whisperBox,
                              { backgroundColor: theme.colors.accSoft, borderColor: theme.colors.acc },
                            ]}
                          >
                            <StyledText variant="eyebrow" color="acc">CANLI SES & FISILTI</StyledText>
                            <StyledText variant="footnote" color="ink" style={{ marginTop: 3 }}>
                              Ezberden oku. Takıldığında 2 saniye içinde kelime parlayarak gösterilir.
                            </StyledText>
                          </View>
                        </View>
                      )}

                      {/* İlerleme Butonu */}
                      <Pressable
                        onPress={handleNextAyah}
                        style={[styles.nextBtn, { backgroundColor: theme.colors.ink }]}
                      >
                        <StyledText variant="callout" style={{ color: theme.colors.surf, fontWeight: '600' }}>
                          {idx < verses.length - 1 ? 'Sıradaki Ayet ›' : 'Turu Tamamla ✓'}
                        </StyledText>
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            })}
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  chipBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  phaseInfo: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  accordionContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 10,
  },
  accordionCard: {
    borderRadius: 16,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  ayahBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  revealedHintBox: {
    borderLeftWidth: 3,
    padding: 10,
    borderRadius: 8,
  },
  whisperBox: {
    borderWidth: 0.5,
    padding: 12,
    borderRadius: 12,
  },
  nextBtn: {
    marginTop: 14,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evalContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  evalSummaryCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  evalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  evalOptionsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginTop: 12,
  },
  evalOptionBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  evalPlanDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  saveBtn: {
    marginTop: 16,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
