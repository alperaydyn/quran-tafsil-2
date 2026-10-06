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
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation, type LanguagePreference } from '../i18n';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MODES: ReadingMode[] = ['kesif', 'ogrenme', 'odak'];

/** Adım sırası: 0 niyet → 1 bağlam → 2 özellikler (geçmiş/tamamlama/ezber) → 3 hesap tercihi */
const STEP_INTENT = 0;
const STEP_CONTEXT = 1;
const STEP_FEATURES = 2;
const STEP_ACCOUNT = 3;

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  // Zaten oturum açıksa (ör. Ayarlar'dan tanıtım tekrarı) hesap adımı gösterilmez.
  const totalSteps = isAuthenticated ? 3 : 4;
  const lastStep = totalSteps - 1;
  const hasAccountStep = totalSteps === 4;

  const [step, setStep] = useState(STEP_INTENT);
  const [selectedMode, setSelectedMode] = useState<ReadingMode>(currentSavedMode || 'ogrenme');

  const handleSelectMode = (mode: ReadingMode) => {
    setSelectedMode(mode);
    setAccentVariant(MODE_TO_ACCENT[mode]);
  };

  const exitOnboarding = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  /** Girişsiz / zaten girişli bitiriş */
  const handleFinish = () => {
    completeOnboarding(selectedMode);
    exitOnboarding();
  };

  /** Giriş tercihi: Main'in üzerine Auth modalı açılır; iptal/başarı sonrası Main'e dönülür. */
  const handleSignIn = () => {
    completeOnboarding(selectedMode);
    navigation.reset({ index: 1, routes: [{ name: 'Main' }, { name: 'Auth' }] });
  };

  const handleGuest = async () => {
    completeOnboarding(selectedMode);
    await continueAsGuest();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const handleNextLanguage = () => {
    const langs: LanguagePreference[] = ['tr', 'en', 'ar'];
    const nextIdx = (langs.indexOf(language) + 1) % langs.length;
    setLanguage(langs[nextIdx]);
  };

  const isLastStep = step === lastStep;

  const Eyebrow = ({ text }: { text: string }) => (
    <StyledText
      variant="eyebrow"
      color="faint"
      style={{ letterSpacing: 2, textTransform: 'uppercase' }}
    >
      {text}
    </StyledText>
  );

  const Title = ({ text }: { text: string }) => (
    <StyledText
      style={{
        fontFamily: theme.font.serifSemiBold,
        fontSize: 32,
        lineHeight: 40,
        color: theme.colors.ink,
        letterSpacing: -0.5,
      }}
    >
      {text}
    </StyledText>
  );

  const Body = ({ text }: { text: string }) => (
    <StyledText
      style={{ fontFamily: theme.font.sans, fontSize: 15, lineHeight: 24, color: theme.colors.mut }}
    >
      {text}
    </StyledText>
  );

  const cardStyle = {
    padding: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.surf,
    borderWidth: 1,
    borderColor: theme.colors.line,
    gap: 10,
  } as const;

  const cardTitle = (text: string) => (
    <StyledText
      style={{ fontFamily: theme.font.serifMedium, fontSize: 17, color: theme.colors.ink }}
    >
      {text}
    </StyledText>
  );

  const cardDesc = (text: string) => (
    <StyledText style={{ fontFamily: theme.font.sans, fontSize: 13, lineHeight: 19, color: theme.colors.mut }}>
      {text}
    </StyledText>
  );

  // Haftalık okuma yoğunluğu (okuma geçmişi vitrini)
  const weekIntensity = [0.35, 0.6, 0.2, 0.85, 1, 0.7, 0.5];

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
          {step > 0 ? (
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
          ) : navigation.canGoBack() ? (
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

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {!isLastStep && (
              <Pressable
                hitSlop={12}
                onPress={() => setStep(lastStep)}
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
            )}
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
          </View>
        </View>

        {/* Ana İçerik Alanı */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 4 }}
        >
          {/* 1) Niyet */}
          {step === STEP_INTENT && (
            <View style={{ gap: 14 }}>
              <Eyebrow text={t('onboarding.selectModeEyebrow')} />
              <Title text={t('onboarding.selectModeTitle')} />
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

              <View style={{ gap: 12 }}>
                {MODES.map((mode) => {
                  const selected = selectedMode === mode;
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
                          {t(`onboarding.modes.${mode}.title`)}
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
                              {t(`onboarding.modes.${mode}.modeLabel`)}
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
                        {t(`onboarding.modes.${mode}.description`)}
                      </StyledText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* 2) Bağlam */}
          {step === STEP_CONTEXT && (
            <View style={{ gap: 18 }}>
              <Eyebrow text={t('onboarding.context.eyebrow')} />
              <Title text={t('onboarding.context.title')} />
              <Body text={t('onboarding.context.body')} />

              <View style={{ ...cardStyle, marginTop: 10, padding: 20, borderRadius: 22, gap: 14 }}>
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
                    {t('onboarding.context.cardLabel')}
                  </StyledText>
                  <StyledText
                    style={{ fontFamily: theme.font.arabic, fontSize: 26, color: theme.colors.acc, direction: 'rtl' }}
                  >
                    ع - ل - م
                  </StyledText>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { word: 'عَلِمَ', label: t('onboarding.context.forms.verb') },
                    { word: 'عِلْم', label: t('onboarding.context.forms.concept') },
                    { word: 'عَالِم', label: t('onboarding.context.forms.subject') },
                    { word: 'عَالَم', label: t('onboarding.context.forms.world') },
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
                        {item.label}
                      </StyledText>
                    </View>
                  ))}
                </View>

                <StyledText
                  variant="footnote"
                  color="faint"
                  style={{ fontStyle: 'italic', marginTop: 2 }}
                >
                  {t('onboarding.context.footnote')}
                </StyledText>
              </View>
            </View>
          )}

          {/* 3) Okuma geçmişi · Tamamlama · Ezber */}
          {step === STEP_FEATURES && (
            <View style={{ gap: 14 }}>
              <Eyebrow text={t('onboarding.features.eyebrow')} />
              <Title text={t('onboarding.features.title')} />
              <Body text={t('onboarding.features.body')} />

              <View style={{ gap: 10, marginTop: 4 }}>
                {/* Okuma Geçmişi */}
                <View style={cardStyle}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    {cardTitle(t('onboarding.features.history.title'))}
                    <View
                      style={{
                        paddingVertical: 3,
                        paddingHorizontal: 9,
                        borderRadius: theme.radius.pill,
                        backgroundColor: theme.colors.accSoft,
                      }}
                    >
                      <StyledText variant="caption" color="acc" style={{ fontWeight: '700', fontSize: 11 }}>
                        {t('onboarding.features.history.streak')}
                      </StyledText>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {weekIntensity.map((v, i) => (
                      <View
                        key={i}
                        style={{
                          flex: 1,
                          height: 26,
                          borderRadius: 7,
                          backgroundColor: theme.colors.acc,
                          opacity: 0.15 + v * 0.85,
                        }}
                      />
                    ))}
                  </View>
                  {cardDesc(t('onboarding.features.history.desc'))}
                </View>

                {/* Tamamlama */}
                <View style={cardStyle}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    {cardTitle(t('onboarding.features.completion.title'))}
                    <StyledText variant="caption" color="faint">
                      {t('onboarding.features.completion.progress')}
                    </StyledText>
                  </View>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.colors.band, overflow: 'hidden' }}>
                    <View style={{ width: '74%', height: 8, borderRadius: 4, backgroundColor: theme.colors.acc }} />
                  </View>
                  {cardDesc(t('onboarding.features.completion.desc'))}
                </View>

                {/* Ezber */}
                <View style={cardStyle}>
                  {cardTitle(t('onboarding.features.memorization.title'))}
                  <View
                    style={{
                      flexDirection: 'row-reverse',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {['اقْرَأْ', 'بِاسْمِ', 'رَبِّكَ'].map((w, i) => {
                      const revealed = i === 2;
                      return (
                        <View
                          key={w}
                          style={{
                            paddingVertical: 4,
                            paddingHorizontal: 9,
                            borderRadius: 10,
                            backgroundColor: revealed ? theme.colors.accSoft : theme.colors.band,
                            borderWidth: revealed ? 1.5 : 0,
                            borderColor: theme.colors.acc,
                          }}
                        >
                          <StyledText
                            style={{
                              fontFamily: theme.font.arabic,
                              fontSize: 20,
                              color: revealed ? theme.colors.acc : theme.colors.ink,
                            }}
                          >
                            {w}
                          </StyledText>
                        </View>
                      );
                    })}
                    <StyledText style={{ fontFamily: theme.font.arabic, fontSize: 20, color: theme.colors.faint }}>
                      ••• •••
                    </StyledText>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['hard', 'good', 'easy'] as const).map((k) => (
                      <View
                        key={k}
                        style={{
                          flex: 1,
                          paddingVertical: 6,
                          borderRadius: theme.radius.pill,
                          backgroundColor: theme.colors.band,
                          alignItems: 'center',
                        }}
                      >
                        <StyledText variant="caption" color="mut" style={{ fontWeight: '600' }}>
                          {t(`onboarding.features.memorization.${k}`)}
                        </StyledText>
                      </View>
                    ))}
                  </View>
                  {cardDesc(t('onboarding.features.memorization.desc'))}
                </View>
              </View>
            </View>
          )}

          {/* 4) Hesap tercihi */}
          {hasAccountStep && step === STEP_ACCOUNT && (
            <View style={{ gap: 18 }}>
              <Eyebrow text={t('onboarding.account.eyebrow')} />
              <Title text={t('onboarding.account.title')} />
              <Body text={t('onboarding.account.body')} />
              <StyledText variant="footnote" color="faint" style={{ fontStyle: 'italic' }}>
                {t('onboarding.account.note')}
              </StyledText>
            </View>
          )}
        </ScrollView>

        {/* Alt Kontroller & Geçiş Butonları */}
        <View style={{ gap: 16, marginTop: 14 }}>
          <Dots count={totalSteps} active={step} />

          {!isLastStep ? (
            <Button label={t('onboarding.next')} onPress={() => setStep((s) => s + 1)} />
          ) : hasAccountStep ? (
            <View style={{ gap: 8 }}>
              <Button label={t('onboarding.account.signIn')} disabled={isAuthLoading} onPress={handleSignIn} />
              <Button
                label={t('onboarding.account.guest')}
                variant="ghost"
                disabled={isAuthLoading}
                onPress={handleGuest}
              />
            </View>
          ) : (
            <Button label={t('onboarding.startReading')} onPress={handleFinish} />
          )}
        </View>
      </View>
    </Screen>
  );
}
