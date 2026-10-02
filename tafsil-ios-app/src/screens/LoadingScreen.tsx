import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { DotMatrixBackground } from '../components/common/DotMatrixBackground';

export interface LoadingScreenProps {
  /** Yükleme tamamlandığında çağrılacak geriçağırım fonksiyonu */
  onFinish?: () => void;
  /** Ekranın görünür kalacağı minimum süre (ms) — varsayılan: 2200ms */
  minDurationMs?: number;
  /** Karanlık mod açık mı? Belirtilmezse etkin temadan okunur */
  isDark?: boolean;
}

/**
 * tafsil.net Açılış ve Yükleme Ekranı (Loading Screen)
 * Tasarım Referansı: 1a · Açık & 1b · Koyu
 *
 * Bileşenler:
 * - Nokta matrisi arka plan (DotMatrixBackground)
 * - "tafsil." editoryal serif logosu ve imza mavi kare noktası
 * - İnce merkez ayırıcı çizgi
 * - "لِقَوْمٍ يَعْلَمُونَ" hat metni (Amiri fontu)
 * - Katmanlı anlamsal kök çevirisi ("BİLEN BİR TOPLULUK İÇİN...", "TANIYAN", "KAVRAYAN")
 * - 3 adet animasyonlu kare durum/yükleme indikatörü
 */
export function LoadingScreen({
  onFinish,
  minDurationMs = 2200,
  isDark: propIsDark,
}: LoadingScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = propIsDark ?? theme.scheme === 'dark';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const [activeDot, setActiveDot] = useState(0);

  // 3'lü kare indikatör animasyon döngüsü (0 -> 1 -> 2 -> 0)
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 3);
    }, 460);
    return () => clearInterval(dotInterval);
  }, []);

  // Giriş ve opsiyonel çıkış animasyonları
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 560,
        useNativeDriver: true,
      }),
    ]).start();

    if (onFinish) {
      const exitTimer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      }, minDurationMs);

      return () => clearTimeout(exitTimer);
    }
  }, [fadeAnim, slideAnim, minDurationMs, onFinish]);

  // Renk tokenları (Açık ve Koyu mod tasarımlarıyla birebir eşleşme)
  const bgColor = isDark ? '#14130F' : '#F4F1EA';
  const logoColor = isDark ? '#F4F1EA' : '#171613';
  const accentColor = theme.colors.acc; // Açıkta #3F5F86, Koyu modda #7FA3CC
  const dividerColor = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(23, 22, 19, 0.15)';
  const arabicColor = isDark ? '#D8D5CD' : '#3C3833';
  const phraseMutedColor = isDark ? '#8E887E' : '#8A857A';
  const subLayer1Color = isDark ? 'rgba(163, 156, 140, 0.48)' : 'rgba(138, 133, 122, 0.50)';
  const subLayer2Color = isDark ? 'rgba(163, 156, 140, 0.24)' : 'rgba(138, 133, 122, 0.26)';

  return (
    <View style={[styles.root, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Arka plan nokta matrisi */}
      <DotMatrixBackground isDark={isDark} />

      {/* Merkez İçerik */}
      <Animated.View
        style={[
          styles.centerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo: "tafsil" + imza mavi kare nokta */}
        <View style={styles.logoRow}>
          <Text
            style={[
              styles.logoText,
              {
                color: logoColor,
                fontFamily: theme.font.serifSemiBold,
              },
            ]}
          >
            tafsil
          </Text>
          <View
            style={[
              styles.logoSquareDot,
              {
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>

        {/* İnce ayırıcı çizgi */}
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        {/* Kur'an ayeti parçası: "لِقَوْمٍ يَعْلَمُونَ" */}
        <Text
          style={[
            styles.arabicText,
            {
              color: arabicColor,
              fontFamily: theme.font.arabic,
            },
          ]}
        >
          لِقَوْمٍ يَعْلَمُونَ
        </Text>

        {/* Anlamsal derinlik ve kök anlam katmanları */}
        <View style={styles.semanticStack}>
          {/* 1. Satır: Vurgulu "BİLEN" + " BİR TOPLULUK İÇİN..." */}
          <View style={styles.primarySemanticRow}>
            <Text
              style={[
                styles.primaryKeyword,
                {
                  color: accentColor,
                  fontFamily: theme.font.sansSemiBold,
                },
              ]}
            >
              BİLEN
            </Text>
            <Text
              style={[
                styles.primaryRest,
                {
                  color: phraseMutedColor,
                  fontFamily: theme.font.sansMedium,
                },
              ]}
            >
              {' '}BİR TOPLULUK İÇİN...
            </Text>
          </View>

          {/* 2. Satır: "TANIYAN" (BİLEN'in hemen altında sol hizalı) */}
          <Text
            style={[
              styles.subKeyword,
              {
                color: subLayer1Color,
                fontFamily: theme.font.sansMedium,
              },
            ]}
          >
            TANIYAN
          </Text>

          {/* 3. Satır: "KAVRAYAN" (Daha soluk derinlik katmanı) */}
          <Text
            style={[
              styles.subKeyword,
              {
                color: subLayer2Color,
                fontFamily: theme.font.sansMedium,
              },
            ]}
          >
            KAVRAYAN
          </Text>
        </View>
      </Animated.View>

      {/* Alt 3'lü kare durum / yükleme göstergesi */}
      <View
        style={[
          styles.indicatorContainer,
          {
            bottom: Math.max(insets.bottom + 28, 44),
          },
        ]}
      >
        {[0, 1, 2].map((idx) => {
          const isActive = activeDot === idx;
          const inactiveColor = isDark
            ? idx === 1
              ? '#38352F'
              : '#262420'
            : idx === 1
              ? '#D4CFBF'
              : '#E2DDCF';

          return (
            <Animated.View
              key={idx}
              style={[
                styles.indicatorDot,
                {
                  backgroundColor: isActive ? accentColor : inactiveColor,
                  transform: [{ scale: isActive ? 1.15 : 0.92 }],
                  opacity: isActive ? 1 : 0.7,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    // Optik merkezleme için hafif yukarı kaydırma
    marginBottom: 44,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 50,
    lineHeight: 56,
    letterSpacing: -0.6,
  },
  logoSquareDot: {
    width: 8,
    height: 8,
    marginLeft: 3,
    marginBottom: 7,
    borderRadius: 0.8,
  },
  divider: {
    width: 38,
    height: 1,
    marginTop: 18,
    marginBottom: 18,
    borderRadius: 0.5,
  },
  arabicText: {
    fontSize: 34,
    lineHeight: 52,
    textAlign: 'center',
    marginBottom: 16,
  },
  semanticStack: {
    alignSelf: 'center',
    alignItems: 'flex-start',
  },
  primarySemanticRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryKeyword: {
    fontSize: 11,
    letterSpacing: 2.0,
    textTransform: 'uppercase',
  },
  primaryRest: {
    fontSize: 11,
    letterSpacing: 2.0,
    textTransform: 'uppercase',
  },
  subKeyword: {
    fontSize: 11,
    letterSpacing: 2.0,
    textTransform: 'uppercase',
    marginTop: 4.5,
  },
  indicatorContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  indicatorDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 0.6,
  },
});
