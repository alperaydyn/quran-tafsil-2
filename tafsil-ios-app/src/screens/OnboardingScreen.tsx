import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { Button } from '../components/common/Button';
import { useTheme } from '../theme';
import { useUserSettingsStore, type ReadingMode, MODE_TO_ACCENT } from '../store/useUserSettingsStore';
import { READING_MODE_META } from '../hooks/useReadingMode';

interface Slide {
  eyebrow: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    eyebrow: 'TAFSIL',
    title: 'Kur\'an\'ı kendi bağlamından anla',
    body:
      'Kavramları kalıp tefsirlerin ötesinde; ayetler arası anlam bağlantılarından ve Arapça kök matematiğinden yola çıkarak keşfet.',
  },
  {
    eyebrow: 'AKIŞ',
    title: 'Kitap gibi oku, merak ettiğinde derinleş',
    body:
      'Yüzeysel okuma akıcı ve kesintisizdir. Bir kavram ilgini çektiğinde, yönlü bir ağ ile istediğin kadar derine inebilirsin.',
  },
  {
    eyebrow: 'EZBER',
    title: 'Sesini dinleyen bir ezber stüdyosu',
    body:
      'Cihaz üzerinde konuşma tanıma ile sesli okurken kelimeler ekranda beliriyor — Reveal-on-Recite.',
  },
];

const MODES: ReadingMode[] = ['kesif', 'ogrenme', 'odak'];

function Dots({ count, active }: { count: number; active: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 18 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === active ? theme.colors.acc : theme.colors.line,
          }}
        />
      ))}
    </View>
  );
}

export function OnboardingScreen() {
  const theme = useTheme();
  const completeOnboarding = useUserSettingsStore((s) => s.completeOnboarding);
  const setAccentVariant = useUserSettingsStore((s) => s.setAccentVariant);
  const [step, setStep] = useState(0); // 0..SLIDES.length-1 = tanıtım, SLIDES.length = mod seçimi
  const [selectedMode, setSelectedMode] = useState<ReadingMode>('ogrenme');

  const totalSteps = SLIDES.length + 1;
  const isModeStep = step === SLIDES.length;

  const handleSelectMode = (mode: ReadingMode) => {
    setSelectedMode(mode);
    setAccentVariant(MODE_TO_ACCENT[mode]);
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: 16 }}>
        {/* Üst Kısayol Barı: Tanıtımı Geç */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Pressable
            hitSlop={12}
            onPress={() => completeOnboarding(selectedMode)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.band,
            }}
          >
            <StyledText variant="caption" color="mut" style={{ fontWeight: '600' }}>
              Tanıtımı Geç
            </StyledText>
          </Pressable>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', gap: 14 }}>
          {isModeStep ? (
            <>
              <StyledText variant="eyebrow" color="faint">
                BAŞLANGIÇ MODU
              </StyledText>
              <StyledText variant="title">Nasıl okumak istersin?</StyledText>
              <StyledText variant="footnote" color="mut" style={{ marginBottom: 6 }}>
                İstediğin zaman ayarlardan değiştirebilirsin.
              </StyledText>
              <View style={{ gap: 10 }}>
                {MODES.map((mode) => {
                  const meta = READING_MODE_META[mode];
                  const selected = selectedMode === mode;
                  return (
                    <Pressable
                      key={mode}
                      onPress={() => handleSelectMode(mode)}
                      style={{
                        borderRadius: theme.radius.xxxl,
                        padding: 16,
                        borderWidth: 1.5,
                        borderColor: selected ? theme.colors.acc : theme.colors.line,
                        backgroundColor: selected ? theme.colors.accSoft : theme.colors.surf,
                        ...(selected
                          ? { shadowColor: theme.colors.acc, shadowOpacity: 0.15, shadowRadius: 6 }
                          : {}),
                      }}
                    >
                      <StyledText
                        variant="headline"
                        style={{ color: selected ? theme.colors.acc : theme.colors.ink }}
                      >
                        {meta.title}
                      </StyledText>
                      <StyledText variant="footnote" color="mut" style={{ marginTop: 4 }}>
                        {meta.description}
                      </StyledText>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <StyledText variant="eyebrow" color="faint">
                {SLIDES[step].eyebrow}
              </StyledText>
              <StyledText variant="display">{SLIDES[step].title}</StyledText>
              <StyledText variant="body" color="mut">
                {SLIDES[step].body}
              </StyledText>
            </>
          )}
        </View>

        <View style={{ gap: 18 }}>
          <Dots count={totalSteps} active={step} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {step > 0 && (
              <View style={{ flex: 1 }}>
                <Button label="Geri" variant="secondary" onPress={() => setStep((s) => s - 1)} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Button
                label={isModeStep ? 'Başla' : 'İleri'}
                onPress={() =>
                  isModeStep ? completeOnboarding(selectedMode) : setStep((s) => s + 1)
                }
              />
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}
