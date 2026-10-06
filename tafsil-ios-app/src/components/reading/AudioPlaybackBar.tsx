import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyledText } from '../common/StyledText';
import { useTheme } from '../../theme';

/* ───────────────────────────────────────────────
 *  Geometrik Minimal İkonlar (View-tabanlı)
 *  Emoji yerine saf RN View'lardan üretilir —
 *  her temada, her cihazda tutarlı görünür.
 * ─────────────────────────────────────────────── */

/** ▶ Play üçgeni — CSS border trick ile */
function PlayIcon({ size = 12, color = '#FFF' }: { size?: number; color?: string }) {
  return (
    <View
      style={{
        width: 0,
        height: 0,
        marginLeft: size * 0.15,          // optik merkeze almak için
        borderLeftWidth: size,
        borderTopWidth: size * 0.6,
        borderBottomWidth: size * 0.6,
        borderLeftColor: color,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
      }}
    />
  );
}

/** ⏸ Pause — iki ince dikdörtgen */
function PauseIcon({ size = 12, color = '#FFF' }: { size?: number; color?: string }) {
  const barW = Math.max(2.5, size * 0.22);
  const barH = size;
  const gap = Math.max(3, size * 0.3);
  return (
    <View style={{ flexDirection: 'row', gap, alignItems: 'center' }}>
      <View style={{ width: barW, height: barH, borderRadius: barW * 0.4, backgroundColor: color }} />
      <View style={{ width: barW, height: barH, borderRadius: barW * 0.4, backgroundColor: color }} />
    </View>
  );
}

/** ⏭ / ⏮ Skip — küçük üçgen + ince dikey çizgi */
function SkipIcon({
  direction,
  size = 9,
  color = 'rgba(255,255,255,0.55)',
}: {
  direction: 'next' | 'prev';
  size?: number;
  color?: string;
}) {
  const triangle = (
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: direction === 'next' ? size : 0,
        borderRightWidth: direction === 'prev' ? size : 0,
        borderTopWidth: size * 0.6,
        borderBottomWidth: size * 0.6,
        borderLeftColor: direction === 'next' ? color : 'transparent',
        borderRightColor: direction === 'prev' ? color : 'transparent',
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
      }}
    />
  );
  const line = (
    <View
      style={{
        width: 1.5,
        height: size * 1.1,
        backgroundColor: color,
        borderRadius: 1,
      }}
    />
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
      {direction === 'prev' ? (
        <>
          {line}
          {triangle}
        </>
      ) : (
        <>
          {triangle}
          {line}
        </>
      )}
    </View>
  );
}

/** 🛜⃥ Wifi Off — Saf React Native View geometrisiyle çizilmiş minimalist offline ikonu */
function WifiOffIcon({
  size = 14,
  color = 'rgba(244, 241, 234, 0.65)',
  maskColor = 'rgba(255, 255, 255, 0.08)',
}: {
  size?: number;
  color?: string;
  maskColor?: string;
}) {
  return (
    <View
      style={{
        width: size + 4,
        height: size + 4,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Dış WiFi dalgası */}
      <View
        style={{
          position: 'absolute',
          top: 1,
          width: 14,
          height: 14,
          borderRadius: 7,
          borderTopWidth: 1.5,
          borderRightWidth: 1.5,
          borderTopColor: color,
          borderRightColor: color,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          transform: [{ rotate: '-45deg' }],
        }}
      />
      {/* İç WiFi dalgası */}
      <View
        style={{
          position: 'absolute',
          top: 5,
          width: 7.5,
          height: 7.5,
          borderRadius: 4,
          borderTopWidth: 1.5,
          borderRightWidth: 1.5,
          borderTopColor: color,
          borderRightColor: color,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          transform: [{ rotate: '-45deg' }],
        }}
      />
      {/* Merkez Nokta */}
      <View
        style={{
          position: 'absolute',
          bottom: 1.5,
          width: 2.2,
          height: 2.2,
          borderRadius: 1.1,
          backgroundColor: color,
        }}
      />
      {/* Kesme Çizgisinin Arkasındaki Maske (arkasındaki dalgaları keskin böler) */}
      <View
        style={{
          position: 'absolute',
          width: 2.8,
          height: 18,
          backgroundColor: maskColor,
          transform: [{ rotate: '-45deg' }],
        }}
      />
      {/* Çapraz Kesme Çizgisi (Disabled slash) */}
      <View
        style={{
          position: 'absolute',
          width: 1.4,
          height: 18,
          borderRadius: 0.7,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
}

/* ─────────────────────────────────────────────── */

interface AudioPlaybackBarProps {
  surahId: number;
  totalVerses: number;
  currentAyah: number;
  activeWordIndex: number | null;
  isPlaying: boolean;
  isBuffering?: boolean;
  playbackRate?: number;
  isAudioOnly?: boolean;
  isOffline?: boolean;
  onToggleAudioOnly?: () => void;
  onRateChange?: (rate: number) => void;
  onTogglePlay: () => void;
  onNextVerse: () => void;
  onPrevVerse: () => void;
  onClose?: () => void;
}

export function AudioPlaybackBar({
  surahId,
  totalVerses,
  currentAyah,
  isPlaying,
  isBuffering = false,
  playbackRate = 1.0,
  isAudioOnly = false,
  isOffline = false,
  onToggleAudioOnly,
  onRateChange,
  onTogglePlay,
  onNextVerse,
  onPrevVerse,
  onClose,
}: AudioPlaybackBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme.scheme === 'dark';
  const [speed, setSpeed] = useState<'1.0x' | '1.25x' | '1.5x'>(
    playbackRate === 1.25 ? '1.25x' : playbackRate === 1.5 ? '1.5x' : '1.0x'
  );

  const cycleSpeed = () => {
    let nextSpeed: '1.0x' | '1.25x' | '1.5x' = '1.0x';
    let nextRate = 1.0;
    if (speed === '1.0x') {
      nextSpeed = '1.25x';
      nextRate = 1.25;
    } else if (speed === '1.25x') {
      nextSpeed = '1.5x';
      nextRate = 1.5;
    } else {
      nextSpeed = '1.0x';
      nextRate = 1.0;
    }
    setSpeed(nextSpeed);
    onRateChange?.(nextRate);
  };

  const progressPercent =
    totalVerses > 0 ? Math.min(100, Math.max(0, (currentAyah / totalVerses) * 100)) : 0;

  // Kontrastlı koyu zemin üzerindeki renkler — Koyu temada ayrışmayı artıran elevated ton
  const dockBg = isDark ? '#27241F' : '#171613';
  const dockBorder = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.08)';
  const textPrimary = '#F4F1EA';
  const textSecondary = 'rgba(244, 241, 234, 0.6)';
  const controlSurface = isDark ? 'rgba(255, 255, 255, 0.11)' : 'rgba(255, 255, 255, 0.08)';

  return (
    <View
      style={[
        styles.floatingWrapper,
        { bottom: insets.bottom > 0 ? insets.bottom + 6 : 14 },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: dockBg,
            borderColor: dockBorder,
            shadowOpacity: isDark ? 0.45 : 0.35,
          },
        ]}
      >
        {/* İnce ilerleme şeridi — panelin üst kenarında */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progressPercent}%`,
                backgroundColor: theme.colors.acc,
              },
            ]}
          />
        </View>

        <View style={styles.contentRow}>
          {/* Sol Kanat: Odak Butonu + (Sadece Offline ise) Disabled Wifi Butonu */}
          <View style={styles.sideGroupLeft}>
            {onToggleAudioOnly && (
              <Pressable
                onPress={onToggleAudioOnly}
                hitSlop={6}
                accessibilityLabel={isAudioOnly ? 'Metin Akışına Dön' : 'Odak Tilavet Sahnesi'}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.focusToggleBtn,
                  {
                    backgroundColor: isAudioOnly ? theme.colors.acc : controlSurface,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <StyledText
                  style={[
                    styles.buttonLabelText,
                    {
                      color: isAudioOnly ? '#FFFFFF' : textPrimary,
                      fontWeight: isAudioOnly ? '700' : '500',
                    },
                  ]}
                >
                  {isAudioOnly ? 'Metin' : 'Odak'}
                </StyledText>
              </Pressable>
            )}

            {isOffline && (
              <View
                accessibilityLabel="Çevrimdışı Tilavet Modu"
                accessibilityRole="image"
                style={[styles.offlineBtn, { backgroundColor: controlSurface }]}
              >
                <WifiOffIcon
                  size={14}
                  color={textSecondary}
                  maskColor={controlSurface}
                />
              </View>
            )}
          </View>

          {/* Orta Kanat: Oynatma kontrolleri (Prev, Play/Pause, Next) */}
          <View style={styles.centerControls}>
            <Pressable
              onPress={onPrevVerse}
              disabled={currentAyah <= 1}
              hitSlop={10}
              accessibilityLabel="Önceki Ayet"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.navBtn,
                {
                  backgroundColor: controlSurface,
                  opacity: currentAyah <= 1 ? 0.3 : pressed ? 0.6 : 1,
                },
              ]}
            >
              <SkipIcon direction="prev" size={8} color={textPrimary} />
            </Pressable>

            <Pressable
              onPress={onTogglePlay}
              hitSlop={6}
              accessibilityLabel={isPlaying ? 'Duraklat' : 'Oynat'}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.playBtn,
                {
                  backgroundColor: textPrimary,
                  transform: [{ scale: pressed ? 0.93 : 1 }],
                },
              ]}
            >
              {isPlaying ? (
                <PauseIcon size={13} color={dockBg} />
              ) : (
                <PlayIcon size={11} color={dockBg} />
              )}
            </Pressable>

            <Pressable
              onPress={onNextVerse}
              disabled={currentAyah >= totalVerses}
              hitSlop={10}
              accessibilityLabel="Sonraki Ayet"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.navBtn,
                {
                  backgroundColor: controlSurface,
                  opacity: currentAyah >= totalVerses ? 0.3 : pressed ? 0.6 : 1,
                },
              ]}
            >
              <SkipIcon direction="next" size={8} color={textPrimary} />
            </Pressable>
          </View>

          {/* Sağ Kanat: Hız seçici ve Kapatma butonu */}
          <View style={styles.sideGroupRight}>
            <Pressable
              onPress={cycleSpeed}
              hitSlop={6}
              accessibilityLabel={`Çalma Hızı: ${speed}`}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.speedBtn,
                {
                  backgroundColor: controlSurface,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <StyledText style={[styles.buttonLabelText, { color: textPrimary }]}>
                {speed}
              </StyledText>
            </Pressable>

            {onClose && (
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityLabel="Tilaveti Kapat"
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.closeBtn,
                  {
                    backgroundColor: controlSurface,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <StyledText style={{ color: textSecondary, fontSize: 13, fontWeight: '700' }}>
                  ✕
                </StyledText>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 99,
  },
  container: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 12,
  },
  progressTrack: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  progressBar: {
    height: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sideGroupLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sideGroupRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusToggleBtn: {
    width: 44,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBtn: {
    width: 32,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedBtn: {
    width: 44,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabelText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  closeBtn: {
    width: 32,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
