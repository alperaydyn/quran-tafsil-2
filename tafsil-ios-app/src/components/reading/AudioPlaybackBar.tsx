import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { StyledText } from '../common/StyledText';
import { useTheme } from '../../theme';

interface AudioPlaybackBarProps {
  surahId: number;
  totalVerses: number;
  currentAyah: number;
  activeWordIndex: number | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextVerse: () => void;
  onPrevVerse: () => void;
}

export function AudioPlaybackBar({
  surahId,
  totalVerses,
  currentAyah,
  isPlaying,
  onTogglePlay,
  onNextVerse,
  onPrevVerse,
}: AudioPlaybackBarProps) {
  const theme = useTheme();
  const [speed, setSpeed] = useState<'1.0x' | '1.25x' | '1.5x'>('1.0x');

  const cycleSpeed = () => {
    if (speed === '1.0x') setSpeed('1.25x');
    else if (speed === '1.25x') setSpeed('1.5x');
    else setSpeed('1.0x');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.ink,
          borderColor: 'rgba(212, 168, 83, 0.35)',
        },
      ]}
    >
      <View style={styles.leftSection}>
        <View style={styles.badge}>
          <StyledText variant="caption" style={{ color: '#D4A853', fontWeight: '700', fontSize: 10 }}>
            TİLAVET
          </StyledText>
        </View>
        <StyledText variant="footnote" style={{ color: '#F4F1EA', fontWeight: '500' }}>
          Ayet {currentAyah} / {totalVerses}
        </StyledText>
      </View>

      <View style={styles.centerControls}>
        <Pressable
          onPress={onPrevVerse}
          disabled={currentAyah <= 1}
          style={({ pressed }) => [styles.navBtn, { opacity: currentAyah <= 1 ? 0.3 : pressed ? 0.7 : 1 }]}
        >
          <StyledText style={{ color: '#A39E93', fontSize: 16 }}>⏮</StyledText>
        </Pressable>

        <Pressable
          onPress={onTogglePlay}
          style={({ pressed }) => [
            styles.playBtn,
            { backgroundColor: '#D4A853', transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <StyledText style={{ color: '#171613', fontSize: 16, fontWeight: '700' }}>
            {isPlaying ? '⏸' : '▶'}
          </StyledText>
        </Pressable>

        <Pressable
          onPress={onNextVerse}
          disabled={currentAyah >= totalVerses}
          style={({ pressed }) => [
            styles.navBtn,
            { opacity: currentAyah >= totalVerses ? 0.3 : pressed ? 0.7 : 1 },
          ]}
        >
          <StyledText style={{ color: '#A39E93', fontSize: 16 }}>⏭</StyledText>
        </Pressable>
      </View>

      <Pressable onPress={cycleSpeed} style={styles.speedBtn}>
        <StyledText variant="caption" style={{ color: '#D4A853', fontWeight: '600', fontSize: 11 }}>
          {speed}
        </StyledText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(212, 168, 83, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navBtn: {
    padding: 6,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
