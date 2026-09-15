import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Modal, Pressable, ScrollView, View, ActivityIndicator, Animated } from 'react-native';
import { StyledText } from '../common/StyledText';
import { useTheme } from '../../theme';
import type { Word, Verse, RootDerivatives } from '../../api/types';
import { getRootDerivatives } from '../../api/client';
import type { WordLexiconDetail } from '../../data/lexicon.seed';
import { getLexiconSync, refreshLexiconAsync } from '../../services/lexiconCacheService';
import { needsEnrichment, enrichWordOnDemand } from '../../services/lexiconEnrichmentService';

export interface WordDetailSheetProps {
  word: Word | null;
  verse?: Verse | null;
  visible: boolean;
  onClose: () => void;
  onOpenDag?: (slug?: string) => void;
}

export function WordDetailSheet({ word, verse, visible, onClose, onOpenDag }: WordDetailSheetProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'kelime' | 'kok'>('kelime');
  const [rootData, setRootData] = useState<RootDerivatives | null>(null);
  const [loadingRoot, setLoadingRoot] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [lexiconData, setLexiconData] = useState<WordLexiconDetail | null>(null);
  const [lexiconSource, setLexiconSource] = useState<'seed' | 'cache' | 'api' | 'fallback'>('fallback');
  const [isEnriching, setIsEnriching] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Animasyon döngüsü (Güncelleniyor... mikro animasyonu)
  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (isEnriching) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.35,
            duration: 650,
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [isEnriching, pulseAnim]);

  // Manuel yenileme işlevi
  const handleManualRefresh = useCallback(() => {
    if (!word) return;
    setIsEnriching(true);
    enrichWordOnDemand(word, verse ?? undefined)
      .then((enriched) => {
        setLexiconData(enriched);
        setLexiconSource('cache');
      })
      .finally(() => {
        setIsEnriching(false);
      });
  }, [word, verse]);

  // Çekmece her açıldığında varsayılan olarak kelime sekmesine dön
  useEffect(() => {
    if (visible) {
      setActiveTab('kelime');
    }
  }, [visible, word?.id]);

  // Hibrit lexicon: seed → cache → on-demand enrichment / API
  useEffect(() => {
    if (!visible || !word) return;

    // 1. Senkron: seed veya cache'den anında göster
    const sync = getLexiconSync(word.textAr, {
      rootAr: word.rootAr,
      rootTr: word.rootTr,
      rootMeaning: word.rootMeaning,
      vezin: word.vezin,
    });
    setLexiconData(sync.data);
    setLexiconSource(sync.source);

    // 2. Eksik veri denetimi: eğer zenginleştirmeye ihtiyacı varsa işi başlat
    if (needsEnrichment(sync.data)) {
      setIsEnriching(true);
      enrichWordOnDemand(word, verse ?? undefined)
        .then((enriched) => {
          setLexiconData(enriched);
          setLexiconSource('cache');
        })
        .finally(() => {
          setIsEnriching(false);
        });
    } else {
      setIsEnriching(false);
      // Stale ise arka planda API'den güncelle
      refreshLexiconAsync(word.textAr).then((updated) => {
        if (updated) {
          setLexiconData(updated);
          setLexiconSource('api');
        }
      });
    }
  }, [visible, word?.textAr, word?.id, verse]);

  // Kelimeye ait kök veritabanından dinamik olarak çekilir
  useEffect(() => {
    if (!visible || !word) return;

    if (word.rootId) {
      setLoadingRoot(true);
      getRootDerivatives(word.rootId)
        .then((res) => {
          if (res.success && res.data) {
            setRootData(res.data);
          } else {
            setRootData(null);
          }
        })
        .finally(() => setLoadingRoot(false));
    } else {
      setRootData(null);
    }
  }, [visible, word?.rootId]);

  if (!word) return null;

  // Hibrit veri ile harmanla (lexiconData seed/cache/api'den gelebilir)
  const curated = lexiconData;

  // 2. Canlı API verisi veya tohum verisi ile harmanla
  const rootAr = curated?.rootAr || rootData?.kok.kok_ar || word.rootAr || null;
  const rootTr = curated?.rootTr || rootData?.kok.kok_tr || word.rootTr || '';
  const rootMeaning = curated?.rootMeaning || rootData?.kok.kok_anlami || word.rootMeaning || '';
  const pos = curated?.pos || word.vezin || (rootAr ? 'isim' : 'harf / edat');
  const totalDerivatives = curated?.derivativeCount || rootData?.toplam || 0;
  const currentTier = curated?.tier ?? 'auto';

  // Başlık referansı: "alak · 96:2" (Tafsil.dc.html #1d)
  const translitLabel = curated?.translit || word.textTr || word.textEn || '';
  const verseRef = verse ? `${verse.surahId}:${verse.ayahNo}` : '';
  const subtitle = translitLabel && verseRef
    ? `${translitLabel} · ${verseRef}`
    : translitLabel || verseRef || '';

  // Dağılım barları (Kökün Kur'an'daki dağılımı)
  const distribution = (curated?.distribution && curated.distribution.length > 0)
    ? curated.distribution
    : (rootData?.dagilim && rootData.dagilim.length > 0)
      ? rootData.dagilim.slice(0, 7)
      : [];

  const maxCount = distribution.length > 0 ? Math.max(...distribution.map((d) => d.count), 1) : 1;

  // Klasik Sözlük Kayıtları (el-Müfredât & Lisânü'l-Arab)
  const classicalQuotes = (curated?.classicalQuotes && curated.classicalQuotes.length > 0)
    ? curated.classicalQuotes
    : (rootMeaning ? [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"${rootMeaning}"`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"${rootAr || word.textAr} kökü: ${rootMeaning}"`
      }
    ] : []);

  // Kavram slug'ı
  const conceptSlug = curated?.conceptSlug || undefined;

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
            maxHeight: '92%',
            paddingTop: theme.spacing.sm,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Sürükleme Tutamacı */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.faint,
              alignSelf: 'center',
              marginBottom: theme.spacing.xs,
            }}
          />

          {/* Üst Bar: Geri / KELİME Sekmesi / Kapat (Tafsil.dc.html #1d) */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.line,
            }}
          >
            {/* Sol: Geri Butonu veya KELİME etiketi */}
            {activeTab === 'kok' ? (
              <Pressable
                onPress={() => setActiveTab('kelime')}
                hitSlop={10}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: theme.colors.band,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: theme.radius.pill,
                }}
              >
                <StyledText variant="caption" color="acc" style={{ fontWeight: '600' }}>
                  ‹ Kelime
                </StyledText>
              </Pressable>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Pressable
                  onPress={() => setActiveTab('kelime')}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.colors.accSoft,
                  }}
                >
                  <StyledText
                    variant="caption"
                    color="acc"
                    style={{ fontWeight: '600', letterSpacing: 1 }}
                  >
                    KELİME
                  </StyledText>
                </Pressable>

                {rootAr && (
                  <Pressable
                    onPress={() => setActiveTab('kok')}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: theme.radius.pill,
                      backgroundColor: 'transparent',
                    }}
                  >
                    <StyledText
                      variant="caption"
                      color="mut"
                      style={{ fontWeight: '600', letterSpacing: 1 }}
                    >
                      KÖK DETAYI
                    </StyledText>
                  </Pressable>
                )}
              </View>
            )}

            {/* Sağ Üst Kapat Butonu */}
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: theme.colors.band,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityLabel="Kapat"
            >
              <StyledText variant="caption" color="mut" style={{ fontSize: 13, fontWeight: '700' }}>
                ✕
              </StyledText>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.md,
              paddingBottom: 24,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* ══════════════════════════════════════════════════════════ */}
            {/* 1. KELİME DETAY GÖRÜNÜMÜ (Tafsil.dc.html #1d)             */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'kelime' && (
              <>
                {/* A. MERKEZ KELİME ALANI (Amiri 44px, alak · 96:2, Rozetler) */}
                <View
                  style={{
                    alignItems: 'center',
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.line,
                  }}
                >
                  <StyledText
                    style={{
                      fontFamily: 'Amiri',
                      fontSize: 44,
                      color: theme.colors.ink,
                      textAlign: 'center',
                      lineHeight: 62,
                      writingDirection: 'rtl',
                    }}
                  >
                    {word.textAr}
                  </StyledText>

                  {subtitle ? (
                    <StyledText
                      variant="body"
                      color="mut"
                      style={{ marginTop: 4, fontSize: 14, fontWeight: '500' }}
                    >
                      {subtitle}
                    </StyledText>
                  ) : null}

                  {/* 3 Temel Rozet: kök ع-ل-ق · isim · nekre · 6 türev */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 7,
                      marginTop: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    {rootAr ? (
                      <Pressable
                        onPress={() => setActiveTab('kok')}
                        style={{
                          backgroundColor: theme.colors.accSoft,
                          borderRadius: 9,
                          paddingVertical: 5,
                          paddingHorizontal: 10,
                        }}
                      >
                        <StyledText
                          variant="caption"
                          color="acc"
                          style={{ fontWeight: '600', fontSize: 11 }}
                        >
                          kök {rootAr}
                        </StyledText>
                      </Pressable>
                    ) : null}

                    <View
                      style={{
                        backgroundColor: theme.colors.band,
                        borderRadius: 9,
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                      }}
                    >
                      <StyledText
                        variant="caption"
                        color="mut"
                        style={{ fontWeight: '500', fontSize: 11 }}
                      >
                        {pos}
                      </StyledText>
                    </View>

                    {totalDerivatives > 0 && (
                      <View
                        style={{
                          backgroundColor: theme.colors.band,
                          borderRadius: 9,
                          paddingVertical: 5,
                          paddingHorizontal: 10,
                        }}
                      >
                        <StyledText
                          variant="caption"
                          color="mut"
                          style={{ fontWeight: '500', fontSize: 11 }}
                        >
                          {totalDerivatives} türev
                        </StyledText>
                      </View>
                    )}
                  </View>

                  {/* Güncelleniyor... mikro animasyonu / Durum Göstergesi */}
                  {isEnriching ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        paddingVertical: 7,
                        paddingHorizontal: 14,
                        backgroundColor: theme.scheme === 'dark' ? 'rgba(212, 163, 89, 0.12)' : 'rgba(184, 134, 11, 0.08)',
                        borderRadius: 14,
                        marginTop: 12,
                        borderWidth: 1,
                        borderColor: theme.scheme === 'dark' ? 'rgba(212, 163, 89, 0.25)' : 'rgba(184, 134, 11, 0.2)',
                      }}
                    >
                      <Animated.View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.colors.acc,
                          opacity: pulseAnim,
                        }}
                      />
                      <StyledText variant="caption" color="acc" style={{ fontWeight: '600', fontSize: 12 }}>
                        Güncelleniyor… Sözlük verisi derleniyor
                      </StyledText>
                    </View>
                  ) : curated?.tier === 'auto' ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        marginTop: 10,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: theme.colors.band,
                          borderRadius: 8,
                          paddingVertical: 4,
                          paddingHorizontal: 10,
                        }}
                      >
                        <StyledText variant="caption" color="mut" style={{ fontSize: 11, fontWeight: '500' }}>
                          ⚡ Otomatik Analiz
                        </StyledText>
                      </View>
                      <Pressable
                        onPress={handleManualRefresh}
                        hitSlop={8}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: theme.colors.band,
                          borderRadius: 8,
                          paddingVertical: 4,
                          paddingHorizontal: 10,
                        }}
                      >
                        <StyledText variant="caption" color="faint" style={{ fontSize: 11, fontWeight: '600' }}>
                          🔄 Yenile
                        </StyledText>
                      </Pressable>
                    </View>
                  ) : null}
                </View>

                {/* B. BU AYETTEKİ ANLAM (Tafsil.dc.html #1d) */}
                <View
                  style={{
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.line,
                  }}
                >
                  <StyledText
                    variant="caption"
                    color="faint"
                    style={{
                      fontSize: 10,
                      letterSpacing: 1.6,
                      fontWeight: '600',
                      textTransform: 'uppercase',
                    }}
                  >
                    BU AYETTEKİ ANLAM
                  </StyledText>

                  {isEnriching && !curated?.verseMeaning ? (
                    <Animated.View style={{ opacity: pulseAnim, marginTop: 10, gap: 8 }}>
                      <View style={{ height: 16, width: '85%', borderRadius: 4, backgroundColor: theme.colors.band }} />
                      <View style={{ height: 16, width: '60%', borderRadius: 4, backgroundColor: theme.colors.band }} />
                    </Animated.View>
                  ) : (
                    <>
                      <StyledText
                        style={{
                          fontFamily: 'Newsreader',
                          fontSize: 18,
                          lineHeight: 27,
                          color: theme.colors.ink,
                          marginTop: 8,
                        }}
                      >
                        {curated?.verseMeaning || word.textTr || verse?.mealTr || 'Bu ayetteki anlam analizi yükleniyor…'}
                      </StyledText>

                      {(curated?.verseAlternatives || rootMeaning) ? (
                        <StyledText
                          variant="footnote"
                          color="mut"
                          style={{ marginTop: 8, lineHeight: 21 }}
                        >
                          {curated?.verseAlternatives || `Kökün temel anlamı: “${rootMeaning}”.`}
                        </StyledText>
                      ) : null}
                    </>
                  )}
                </View>

                {/* C. KÖKÜN KUR'AN'DAKİ DAĞILIMI (Tafsil.dc.html #1d Bar Chart) */}
                {(distribution.length > 0 || isEnriching) && (
                  <View
                    style={{
                      paddingVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.line,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <StyledText
                        variant="caption"
                        color="faint"
                        style={{
                          fontSize: 10,
                          letterSpacing: 1.6,
                          fontWeight: '600',
                          textTransform: 'uppercase',
                        }}
                      >
                        KÖKÜN KUR'AN'DAKİ DAĞILIMI
                      </StyledText>
                      {totalDerivatives > 0 && (
                        <StyledText variant="caption" color="mut" style={{ fontSize: 11, fontWeight: '500' }}>
                          Toplam {totalDerivatives} geçiş
                        </StyledText>
                      )}
                    </View>

                    {isEnriching && distribution.length === 0 ? (
                      <Animated.View
                        style={{
                          opacity: pulseAnim,
                          flexDirection: 'row',
                          alignItems: 'flex-end',
                          gap: 8,
                          height: 48,
                          marginTop: 14,
                        }}
                      >
                        {[40, 24, 32, 16, 28, 20].map((h, i) => (
                          <View
                            key={i}
                            style={{
                              flex: 1,
                              height: h,
                              borderRadius: 4,
                              backgroundColor: theme.colors.band,
                            }}
                          />
                        ))}
                      </Animated.View>
                    ) : (
                      <>
                        {/* Çubuklar (Adet etiketli ve aktif kelime vurgulu) */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'flex-end',
                            gap: 6,
                            height: 64,
                            marginTop: 14,
                          }}
                        >
                          {distribution.map((b, idx) => {
                            const cleanWord = word.textAr.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
                            const cleanB = b.metin_ar.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
                            const isCurrentWord = cleanWord.includes(cleanB) || cleanB.includes(cleanWord);
                            const barHeight = Math.max(12, Math.round((b.count / maxCount) * 44));

                            return (
                              <Pressable
                                key={idx}
                                onPress={() => setActiveTab('kok')}
                                style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}
                              >
                                <StyledText
                                  variant="caption"
                                  style={{
                                    fontSize: 9,
                                    fontWeight: '700',
                                    color: isCurrentWord ? theme.colors.acc : theme.colors.mut,
                                  }}
                                >
                                  {b.count}x
                                </StyledText>
                                <View
                                  style={{
                                    width: '100%',
                                    height: barHeight,
                                    backgroundColor: isCurrentWord
                                      ? theme.colors.acc
                                      : theme.colors.band,
                                    borderTopLeftRadius: 3,
                                    borderTopRightRadius: 3,
                                    borderWidth: isCurrentWord ? 1 : 0,
                                    borderColor: theme.colors.acc,
                                  }}
                                />
                              </Pressable>
                            );
                          })}
                        </View>

                        {/* Çubukların altındaki Arapça kelime isimleri */}
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 7 }}>
                          {distribution.map((b, idx) => (
                            <View key={idx} style={{ flex: 1 }}>
                              <StyledText
                                style={{
                                  fontFamily: 'Amiri',
                                  fontSize: 12,
                                  color: theme.colors.mut,
                                  textAlign: 'center',
                                  writingDirection: 'rtl',
                                }}
                                numberOfLines={1}
                              >
                                {b.metin_ar}
                              </StyledText>
                            </View>
                          ))}
                        </View>
                      </>
                    )}
                  </View>
                )}

                {/* D. KLASİK SÖZLÜK KAYITLARI (Tafsil.dc.html #1d) */}
                {(classicalQuotes.length > 0 || isEnriching) && (
                  <View style={{ paddingVertical: 16 }}>
                    <StyledText
                      variant="caption"
                      color="faint"
                      style={{
                        fontSize: 10,
                        letterSpacing: 1.6,
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        marginBottom: 12,
                      }}
                    >
                      KLASİK SÖZLÜK KAYITLARI
                    </StyledText>

                    {isEnriching && classicalQuotes.length === 0 ? (
                      <Animated.View
                        style={{
                          opacity: pulseAnim,
                          padding: 14,
                          borderRadius: theme.radius.lg,
                          backgroundColor: theme.colors.band,
                          gap: 8,
                        }}
                      >
                        <View style={{ height: 12, width: '35%', borderRadius: 3, backgroundColor: theme.colors.line }} />
                        <View style={{ height: 14, width: '90%', borderRadius: 3, backgroundColor: theme.colors.line }} />
                        <View style={{ height: 14, width: '70%', borderRadius: 3, backgroundColor: theme.colors.line }} />
                      </Animated.View>
                    ) : (

                    <View style={{ gap: 12 }}>
                      {classicalQuotes.map((entry, idx) => (
                        <View
                          key={idx}
                          style={{
                            borderLeftWidth: 2,
                            borderLeftColor: theme.colors.line,
                            paddingLeft: 12,
                          }}
                        >
                          <StyledText
                            variant="footnote"
                            color="ink"
                            style={{ fontWeight: '600', fontSize: 12.5 }}
                          >
                            {entry.source} · {entry.author}
                          </StyledText>
                          <StyledText
                            style={{
                              fontFamily: 'Newsreader',
                              fontSize: 13.5,
                              lineHeight: 21,
                              color: theme.colors.mut,
                              marginTop: 4,
                            }}
                          >
                            {entry.quote}
                          </StyledText>
                        </View>
                      ))}
                    </View>
                    )}
                  </View>
                )}
              </>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* 2. KÖK DETAYI GÖRÜNÜMÜ                                    */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'kok' && (
              <View style={{ gap: 14 }}>
                {/* Kök Başlık Kartı */}
                <View
                  style={{
                    backgroundColor: theme.colors.accSoft,
                    borderRadius: theme.radius.xl,
                    borderWidth: 1,
                    borderColor: theme.colors.acc,
                    padding: 18,
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <StyledText
                    style={{
                      fontFamily: 'Amiri',
                      fontSize: 36,
                      color: theme.colors.ink,
                      writingDirection: 'rtl',
                    }}
                  >
                    {rootAr || 'Kök'}
                  </StyledText>

                  {rootTr ? (
                    <StyledText variant="headline" color="acc">
                      [ {rootTr} ]
                    </StyledText>
                  ) : null}

                  {rootMeaning ? (
                    <StyledText
                      variant="body"
                      color="ink"
                      style={{ textAlign: 'center', marginTop: 4, lineHeight: 22 }}
                    >
                      {rootMeaning}
                    </StyledText>
                  ) : null}

                  {totalDerivatives > 0 && (
                    <View
                      style={{
                        marginTop: 8,
                        backgroundColor: theme.colors.surf,
                        borderRadius: theme.radius.pill,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderWidth: 1,
                        borderColor: theme.colors.line,
                      }}
                    >
                      <StyledText variant="caption" color="mut" style={{ fontWeight: '600' }}>
                        Kur'an'da toplam {totalDerivatives} geçiş
                      </StyledText>
                    </View>
                  )}
                </View>

                {/* Türev Kelimeler Listesi */}
                <View style={{ gap: 8, marginTop: 6 }}>
                  <StyledText variant="eyebrow" color="faint">
                    TÜM TÜREV KELİMELER
                  </StyledText>

                  {distribution.length > 0 ? (
                    distribution.map((item, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: theme.colors.surf,
                          borderWidth: 1,
                          borderColor: theme.colors.line,
                          borderRadius: theme.radius.lg,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                        }}
                      >
                        <StyledText
                          style={{
                            fontFamily: 'Amiri',
                            fontSize: 18,
                            color: theme.colors.ink,
                            writingDirection: 'rtl',
                          }}
                        >
                          {item.metin_ar}
                        </StyledText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {item.vezin ? (
                            <StyledText variant="caption" color="mut">
                              {item.vezin}
                            </StyledText>
                          ) : null}
                          <View
                            style={{
                              backgroundColor: theme.colors.band,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: theme.radius.sm,
                            }}
                          >
                            <StyledText variant="caption" color="acc" style={{ fontWeight: '700' }}>
                              {item.count} kez
                            </StyledText>
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <StyledText variant="footnote" color="mut">
                      Türev listesi yükleniyor…
                    </StyledText>
                  )}
                </View>

                {/* Geri Dönüş Aksiyonu */}
                <Pressable
                  onPress={() => setActiveTab('kelime')}
                  style={{
                    alignSelf: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.colors.band,
                    marginTop: 8,
                  }}
                >
                  <StyledText variant="footnote" color="acc" style={{ fontWeight: '600' }}>
                    ‹ Kelime Analizine Geri Dön
                  </StyledText>
                </Pressable>
              </View>
            )}
          </ScrollView>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* ALT SABİT AKSİYON BARI (Tafsil.dc.html #1d)                */}
          {/* [ Kavram ağında aç ] + [ ☆ ]                              */}
          {/* ══════════════════════════════════════════════════════════ */}
          <View
            style={{
              height: 66,
              borderTopWidth: 1,
              borderTopColor: theme.colors.line,
              backgroundColor: theme.colors.surf,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: theme.spacing.lg,
            }}
          >
            <Pressable
              onPress={() => {
                onClose();
                if (onOpenDag) {
                  onOpenDag(conceptSlug);
                }
              }}
              style={({ pressed }) => ({
                flex: 1,
                height: 44,
                borderRadius: 22,
                backgroundColor: pressed ? theme.colors.acc : theme.colors.ink,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <StyledText
                style={{
                  color: theme.colors.surf,
                  fontSize: 13.5,
                  fontWeight: '600',
                  letterSpacing: 0.3,
                }}
              >
                Kavram ağında aç
              </StyledText>
            </Pressable>

            <Pressable
              onPress={() => setIsBookmarked(!isBookmarked)}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: theme.colors.line,
                backgroundColor: pressed ? theme.colors.band : theme.colors.surf,
                alignItems: 'center',
                justifyContent: 'center',
              })}
              accessibilityLabel="Kelimelerime ekle"
            >
              <StyledText
                style={{
                  fontSize: 18,
                  color: isBookmarked ? theme.colors.acc : theme.colors.mut,
                }}
              >
                {isBookmarked ? '★' : '☆'}
              </StyledText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
