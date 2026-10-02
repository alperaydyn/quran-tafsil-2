import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { Button } from '../components/common/Button';
import { useTheme } from '../theme';
import {
  useUserSettingsStore,
  type ReadingMode,
  MODE_TO_ACCENT,
} from '../store/useUserSettingsStore';
import { useTranslation, type LanguagePreference } from '../i18n';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MODES: ReadingMode[] = ['kesif', 'ogrenme', 'odak'];
const TOTAL_STEPS = 3;

function Dots({ count, active }: { count: number; active: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 7, justifyContent: 'center', alignItems: 'center' }}>
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === active;
        return (
          <View
            key={i}
            style={{
              width: isActive ? 22 : 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: isActive ? theme.colors.acc : theme.colors.line,
            }}
          />
        );
      })}
    </View>
  );
}

export function OnboardingScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { t, language, setLanguage } = useTranslation();

  const currentSavedMode = useUserSettingsStore((s) => s.readingMode);
  const completeOnboarding = useUserSettingsStore((s) => s.completeOnboarding);
  const setAccentVariant = useUserSettingsStore((s) => s.setAccentVariant);

  const [step, setStep] = useState(0); // 0: Kavramsal Bağlam, 1: Akıcı Okuma & Ezber, 2: Niyet & Mod Seçimi
  const [selectedMode, setSelectedMode] = useState<ReadingMode>(currentSavedMode || 'ogrenme');

  const handleSelectMode = (mode: ReadingMode) => {
    setSelectedMode(mode);
    setAccentVariant(MODE_TO_ACCENT[mode]);
  };

  const handleFinish = (modeToSave: ReadingMode = selectedMode) => {
    completeOnboarding(modeToSave);
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

  const handleNextLanguage = () => {
    const langs: LanguagePreference[] = ['tr', 'en', 'ar'];
    const nextIdx = (langs.indexOf(language) + 1) % langs.length;
    setLanguage(langs[nextIdx]);
  };

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: 14 }}>
        {/* Üst Kısayol Barı */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 4,
            marginBottom: 12,
          }}
        >
          {navigation.canGoBack() ? (
            <Pressable
              hitSlop={12}
              onPress={() => navigation.goBack()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.band,
              }}
            >
              <StyledText variant="title" color="ink" style={{ fontSize: 22, marginTop: -2 }}>
                ‹
              </StyledText>
            </Pressable>
          ) : step > 0 ? (
            <Pressable
              hitSlop={12}
              onPress={() => setStep((s) => s - 1)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: theme.radius.pill,
                backgroundColor: theme.colors.band,
              }}
            >
              <StyledText variant="caption" color="ink" style={{ fontWeight: '600' }}>
                ‹ {t('onboarding.back')}
              </StyledText>
            </Pressable>
          ) : (
            <StyledText
              style={{
                fontFamily: theme.font.serifSemiBold,
                fontSize: 18,
                letterSpacing: -0.5,
                color: theme.colors.ink,
              }}
            >
              tafsil.
            </StyledText>
          )}

          {!isLastStep ? (
            <Pressable
              hitSlop={12}
              onPress={() => setStep(TOTAL_STEPS - 1)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 13,
                borderRadius: theme.radius.pill,
                backgroundColor: theme.colors.band,
              }}
            >
              <StyledText variant="caption" color="mut" style={{ fontWeight: '600' }}>
                {t('onboarding.skip')}
              </StyledText>
            </Pressable>
          ) : (
            <Pressable
              hitSlop={12}
              onPress={handleNextLanguage}
              style={{
                paddingVertical: 5,
                paddingHorizontal: 12,
                borderRadius: theme.radius.pill,
                borderWidth: 1,
                borderColor: theme.colors.line,
                backgroundColor: theme.colors.surf,
              }}
            >
              <StyledText
                variant="caption"
                color="mut"
                style={{ fontFamily: theme.font.serifMedium, textTransform: 'uppercase' }}
              >
                {language.toUpperCase()}
              </StyledText>
            </Pressable>
          )}
        </View>

        {/* Ana İçerik Alanı */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 4 }}
        >
          {step === 0 && (
            <View style={{ gap: 18 }}>
              <StyledText
                variant="eyebrow"
                color="faint"
                style={{ letterSpacing: 2, textTransform: 'uppercase' }}
              >
                {t('onboarding.slides.slide1Eyebrow')}
              </StyledText>
              <StyledText
                style={{
                  fontFamily: theme.font.serifSemiBold,
                  fontSize: 32,
                  lineHeight: 40,
                  color: theme.colors.ink,
                  letterSpacing: -0.5,
                }}
              >
                {t('onboarding.slides.slide1Title')}
              </StyledText>
              <StyledText
                style={{
                  fontFamily: theme.font.sans,
                  fontSize: 15,
                  lineHeight: 24,
                  color: theme.colors.mut,
                }}
              >
                {t('onboarding.slides.slide1Body')}
              </StyledText>

              {/* Görsel Vitrin Kartı: Morfoloji & Kök Matematiği */}
              <View
                style={{
                  marginTop: 10,
                  padding: 20,
                  borderRadius: 22,
                  backgroundColor: theme.colors.surf,
                  borderWidth: 1,
                  borderColor: theme.colors.line,
                  gap: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <StyledText
                    variant="caption"
                    color="acc"
                    style={{ fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}
                  >
                    KÖK MATEMATİĞİ · 3 HÂL
                  </StyledText>
                  <StyledText
                    style={{
                      fontFamily: theme.font.arabic,
                      fontSize: 26,
                      color: theme.colors.acc,
                      direction: 'rtl',
                    }}
                  >
                    ع - ل - م
                  </StyledText>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { word: 'عَلِمَ', tr: 'Bildi', desc: 'Fiil' },
                    { word: 'عِلْم', tr: 'İlim', desc: 'Kavram' },
                    { word: 'عَالِم', tr: 'Âlim', desc: 'Özne' },
                    { word: 'عَالَم', tr: 'Âlem', desc: 'Kavranan' },
                  ].map((item, idx) => (
                    <View
                      key={idx}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 14,
                        backgroundColor: theme.colors.band,
                        borderWidth: 1,
                        borderColor: theme.colors.line,
                      }}
                    >
                      <StyledText
                        style={{
                          fontFamily: theme.font.arabic,
                          fontSize: 17,
                          color: theme.colors.ink,
                          textAlign: 'center',
                        }}
                      >
                        {item.word}
                      </StyledText>
                      <StyledText
                        variant="caption"
                        color="mut"
                        style={{ textAlign: 'center', marginTop: 2, fontSize: 11 }}
                      >
                        {item.tr}
                      </StyledText>
                    </View>
                  ))}
                </View>

                <StyledText
                  variant="footnote"
                  color="faint"
                  style={{ fontStyle: 'italic', marginTop: 2 }}
                >
                  Kelimeler tecrit edilmeden, Kur'an'ın kendi iç bağlamında örülerek açıklanır.
                </StyledText>
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={{ gap: 18 }}>
              <StyledText
                variant="eyebrow"
                color="faint"
                style={{ letterSpacing: 2, textTransform: 'uppercase' }}
              >
                {t('onboarding.slides.slide2Eyebrow')}
              </StyledText>
              <StyledText
                style={{
                  fontFamily: theme.font.serifSemiBold,
                  fontSize: 32,
                  lineHeight: 40,
                  color: theme.colors.ink,
                  letterSpacing: -0.5,
                }}
              >
                {t('onboarding.slides.slide2Title')}
              </StyledText>
              <StyledText
                style={{
                  fontFamily: theme.font.sans,
                  fontSize: 15,
                  lineHeight: 24,
                  color: theme.colors.mut,
                }}
              >
                {t('onboarding.slides.slide2Body')}
              </StyledText>

              {/* Görsel Vitrin Kartı: Reveal-on-Recite & Ses Senkronizasyonu */}
              <View
                style={{
                  marginTop: 10,
                  padding: 20,
                  borderRadius: 22,
                  backgroundColor: theme.colors.surf,
                  borderWidth: 1,
                  borderColor: theme.colors.line,
                  gap: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                      borderRadius: theme.radius.pill,
                      backgroundColor: theme.colors.accSoft,
                    }}
                  >
                    <View
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 3.5,
                        backgroundColor: theme.colors.acc,
                      }}
                    />
                    <StyledText
                      variant="caption"
                      color="acc"
                      style={{ fontWeight: '700', fontSize: 11 }}
                    >
                      REVEAL-ON-RECITE
                    </StyledText>
                  </View>
                  <StyledText variant="caption" color="faint">
                    96:1
                  </StyledText>
                </View>

                {/* Dinamik kelime canlandırması */}
                <View
                  style={{
                    flexDirection: 'row-reverse',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 10,
                  }}
                >
                  <View
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 10,
                      backgroundColor: theme.colors.band,
                    }}
                  >
                    <StyledText
                      style={{
                        fontFamily: theme.font.arabic,
                        fontSize: 22,
                        color: theme.colors.ink,
                      }}
                    >
                      اقْرَأْ
                    </StyledText>
                  </View>
                  <View
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 10,
                      backgroundColor: theme.colors.band,
                    }}
                  >
                    <StyledText
                      style={{
                        fontFamily: theme.font.arabic,
                        fontSize: 22,
                        color: theme.colors.ink,
                      }}
                    >
                      بِاسْمِ
                    </StyledText>
                  </View>
                  <View
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 10,
                      backgroundColor: theme.colors.accSoft,
                      borderWidth: 1.5,
                      borderColor: theme.colors.acc,
                    }}
                  >
                    <StyledText
                      style={{
                        fontFamily: theme.font.arabic,
                        fontSize: 22,
                        color: theme.colors.acc,
                      }}
                    >
                      رَبِّكَ
                    </StyledText>
                  </View>
                  <StyledText
                    style={{
                      fontFamily: theme.font.arabic,
                      fontSize: 22,
                      color: theme.colors.faint,
                    }}
                  >
                    الَّذِي
                  </StyledText>
                  <StyledText
                    style={{
                      fontFamily: theme.font.arabic,
                      fontSize: 22,
                      color: theme.colors.faint,
                    }}
                  >
                    خَلَقَ
                  </StyledText>
                </View>

                <StyledText
                  variant="footnote"
                  color="faint"
                  style={{ fontStyle: 'italic', marginTop: 2 }}
                >
                  Sen sesli okudukça cihazındaki yapay zeka kelimeleri anlık açar ve telaffuzunu
                  destekler.
                </StyledText>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={{ gap: 14 }}>
              <StyledText
                variant="eyebrow"
                color="faint"
                style={{ letterSpacing: 2.2, textTransform: 'uppercase' }}
              >
                {t('onboarding.selectModeEyebrow')}
              </StyledText>
              <StyledText
                style={{
                  fontFamily: theme.font.serif,
                  fontSize: 32,
                  lineHeight: 38,
                  color: theme.colors.ink,
                  letterSpacing: -0.5,
                }}
              >
                {t('onboarding.selectModeTitle')}
              </StyledText>
              <StyledText
                style={{
                  fontFamily: theme.font.sans,
                  fontSize: 14,
                  lineHeight: 22,
                  color: theme.colors.mut,
                  fontStyle: 'italic',
                  marginBottom: 6,
                }}
              >
                {t('onboarding.selectModeSubtitle')}
              </StyledText>

              {/* Tafsil.dc.html 1a Niyet Kartları */}
              <View style={{ gap: 12 }}>
                {MODES.map((mode) => {
                  const selected = selectedMode === mode;
                  const modeTitle = t(`onboarding.modes.${mode}.title`);
                  const modeLabel = t(`onboarding.modes.${mode}.modeLabel`);
                  const modeDesc = t(`onboarding.modes.${mode}.description`);

                  return (
                    <Pressable
                      key={mode}
                      onPress={() => handleSelectMode(mode)}
                      style={({ pressed }) => ({
                        borderRadius: 18,
                        padding: 16,
                        borderWidth: 1.5,
                        borderColor: selected ? theme.colors.acc : theme.colors.line,
                        backgroundColor: selected ? theme.colors.accSoft : theme.colors.surf,
                        opacity: pressed ? 0.9 : 1,
                        ...(selected
                          ? {
                              shadowColor: theme.colors.acc,
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.18,
                              shadowRadius: 8,
                            }
                          : {}),
                      })}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <StyledText
                          style={{
                            fontFamily: theme.font.serifMedium,
                            fontSize: 18,
                            color: theme.colors.ink,
                          }}
                        >
                          {modeTitle}
                        </StyledText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View
                            style={{
                              paddingVertical: 3,
                              paddingHorizontal: 8,
                              borderRadius: theme.radius.pill,
                              backgroundColor: selected ? theme.colors.acc : theme.colors.band,
                            }}
                          >
                            <StyledText
                              variant="caption"
                              style={{
                                color: selected ? theme.colors.surf : theme.colors.mut,
                                fontWeight: '600',
                                fontSize: 10,
                              }}
                            >
                              {modeLabel}
                            </StyledText>
                          </View>
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              borderWidth: 1.5,
                              borderColor: selected ? theme.colors.acc : theme.colors.line,
                              backgroundColor: selected ? theme.colors.acc : 'transparent',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {selected && (
                              <StyledText
                                variant="caption"
                                style={{ color: theme.colors.surf, fontSize: 11, fontWeight: '700' }}
                              >
                                ✓
                              </StyledText>
                            )}
                          </View>
                        </View>
                      </View>
                      <StyledText
                        style={{
                          fontFamily: theme.font.sans,
                          fontSize: 13.5,
                          lineHeight: 20,
                          color: theme.colors.mut,
                        }}
                      >
                        {modeDesc}
                      </StyledText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Alt Kontroller & Geçiş Butonları */}
        <View style={{ gap: 16, marginTop: 14 }}>
          <Dots count={TOTAL_STEPS} active={step} />

          {step < TOTAL_STEPS - 1 ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {step > 0 && (
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('onboarding.back')}
                    variant="secondary"
                    onPress={() => setStep((s) => s - 1)}
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Button
                  label={t('onboarding.next')}
                  onPress={() => setStep((s) => s + 1)}
                />
              </View>
            </View>
          ) : (
            /* Tafsil.dc.html 1a Alt Bar: Okumaya Başla + Dil Seçici */
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('onboarding.startReading')}
                  onPress={() => handleFinish(selectedMode)}
                />
              </View>
              <Pressable
                onPress={handleNextLanguage}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  borderWidth: 1,
                  borderColor: theme.colors.line,
                  backgroundColor: pressed ? theme.colors.band : theme.colors.surf,
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <StyledText
                  style={{
                    fontFamily: theme.font.serifMedium,
                    fontSize: 16,
                    color: theme.colors.mut,
                    textTransform: 'uppercase',
                  }}
                >
                  {language.toUpperCase()}
                </StyledText>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}
