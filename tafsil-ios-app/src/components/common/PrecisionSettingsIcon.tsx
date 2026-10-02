import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface PrecisionSettingsIconProps {
  /** İkon boyutu (piksel) — varsayılan: 20 */
  size?: number;
  /** İkon rengi — varsayılan: theme.colors.ink */
  color?: string;
  /** Merkez deliğin arkasındaki yüzey rengi — varsayılan: theme.colors.surf */
  bgColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * tafsil.net Elit Mekanik Ayarlar İkonu (Precision Architectural Gear)
 *
 * Jenerik emoji veya unicode karakterler yerine, saf React Native geometrisiyle
 * mikron hassasiyetinde üretilmiş 6 dişli ve merkez boşluklu İsviçre saatçiliği
 * çark motifi. Retina ve tüm ekranlarda kusursuz keskinlikte render edilir.
 */
export function PrecisionSettingsIcon({
  size = 20,
  color: propColor,
  bgColor: propBgColor,
  style,
}: PrecisionSettingsIconProps) {
  const theme = useTheme();
  const color = propColor ?? (theme.scheme === 'dark' ? '#D6D3CB' : '#3C3833');
  const bgColor = propBgColor ?? theme.colors.surf;

  // İsviçre mekanik saat çarkı oranları
  const toothWidth = size;
  const toothThickness = Math.round(size * 0.22);
  const toothRadius = Math.max(1, Math.round(size * 0.08));
  const bodySize = Math.round(size * 0.68);
  const holeSize = Math.round(size * 0.28);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
        style,
      ]}
    >
      {/* Dişli 1 (0 derece yatay eksen) */}
      <View
        style={[
          styles.toothBar,
          {
            width: toothWidth,
            height: toothThickness,
            borderRadius: toothRadius,
            backgroundColor: color,
          },
        ]}
      />

      {/* Dişli 2 (60 derece) */}
      <View
        style={[
          styles.toothBar,
          {
            width: toothWidth,
            height: toothThickness,
            borderRadius: toothRadius,
            backgroundColor: color,
            transform: [{ rotate: '60deg' }],
          },
        ]}
      />

      {/* Dişli 3 (120 derece) */}
      <View
        style={[
          styles.toothBar,
          {
            width: toothWidth,
            height: toothThickness,
            borderRadius: toothRadius,
            backgroundColor: color,
            transform: [{ rotate: '120deg' }],
          },
        ]}
      />

      {/* Ana gövde dairesi (dişlerin tabanını birleştirir) */}
      <View
        style={[
          styles.bodyCircle,
          {
            width: bodySize,
            height: bodySize,
            borderRadius: bodySize / 2,
            backgroundColor: color,
          },
        ]}
      />

      {/* Merkez mil deliği (arka plan renginde oyuk) */}
      <View
        style={[
          styles.holeCircle,
          {
            width: holeSize,
            height: holeSize,
            borderRadius: holeSize / 2,
            backgroundColor: bgColor,
          },
        ]}
      />
    </View>
  );
}

/**
 * Alternatif: İki Kanallı Tipografik Tercih / Sürgü İkonu (Editorial Tuners)
 * Kitap, okuma ve tipografi ayarları için minimalist çift sürgü
 */
export function PrecisionSlidersIcon({
  size = 18,
  color: propColor,
  style,
}: {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const color = propColor ?? (theme.scheme === 'dark' ? '#D6D3CB' : '#3C3833');
  const trackHeight = 1.6;
  const knobSize = 5;

  return (
    <View
      style={[
        {
          width: size,
          height: size * 0.75,
          justifyContent: 'space-between',
        },
        style,
      ]}
    >
      {/* Üst Ray: Sağda Düğüm */}
      <View style={{ height: knobSize, justifyContent: 'center' }}>
        <View
          style={{
            height: trackHeight,
            backgroundColor: color,
            opacity: 0.35,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 2,
            width: knobSize,
            height: knobSize,
            borderRadius: knobSize / 2,
            backgroundColor: color,
          }}
        />
      </View>

      {/* Alt Ray: Solda Düğüm */}
      <View style={{ height: knobSize, justifyContent: 'center' }}>
        <View
          style={{
            height: trackHeight,
            backgroundColor: color,
            opacity: 0.35,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 2,
            width: knobSize,
            height: knobSize,
            borderRadius: knobSize / 2,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  toothBar: {
    position: 'absolute',
  },
  bodyCircle: {
    position: 'absolute',
  },
  holeCircle: {
    position: 'absolute',
  },
});
