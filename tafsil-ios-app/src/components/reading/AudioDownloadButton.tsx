import React, { useEffect, useState } from 'react';
import { View, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { StyledText } from '../common/StyledText';
import { useTheme } from '../../theme';
import { useAudioCacheStore, formatFileSize } from '../../store/useAudioCacheStore';
import { audioCacheService } from '../../services/audioCacheService';

interface AudioDownloadButtonProps {
  surahId: number;
  surahName: string;
  totalVerses: number;
  variant?: 'header' | 'subhead';
}

export function AudioDownloadButton({
  surahId,
  surahName,
  totalVerses,
  variant = 'header',
}: AudioDownloadButtonProps) {
  const theme = useTheme();
  const {
    isSurahDownloaded,
    isSurahDownloading,
    getSurahProgress,
    checkSurahStatus,
    startDownload,
    cancelDownload,
    deleteDownload,
  } = useAudioCacheStore();

  const isDownloaded = isSurahDownloaded(surahId);
  const isDownloading = isSurahDownloading(surahId);
  const progress = getSurahProgress(surahId);

  const [cacheSizeText, setCacheSizeText] = useState<string>('');

  useEffect(() => {
    if (totalVerses > 0) {
      checkSurahStatus(surahId, totalVerses).then(() => {
        audioCacheService.getSurahCacheInfo(surahId, totalVerses).then((info) => {
          if (info.totalBytes > 0) {
            setCacheSizeText(formatFileSize(info.totalBytes));
          }
        });
      });
    }
  }, [surahId, totalVerses, isDownloaded]);

  const handlePress = () => {
    if (isDownloading) {
      Alert.alert(
        'İndirmeyi İptal Et',
        `${surahName} ses dosyalarının indirilmesi iptal edilsin mi?`,
        [
          { text: 'Devam Et', style: 'cancel' },
          {
            text: 'İptal Et',
            style: 'destructive',
            onPress: () => cancelDownload(surahId),
          },
        ]
      );
      return;
    }

    if (isDownloaded) {
      Alert.alert(
        `${surahName} Çevrimdışı Hazır`,
        `Bu surenin tüm ayet sesleri (${totalVerses} Ayet${cacheSizeText ? ` · ${cacheSizeText}` : ''}) cihazınızda kayıtlıdır. Çevrimdışıyken internet olmadan dinleyebilirsiniz.`,
        [
          { text: 'Tamam', style: 'default' },
          {
            text: 'İndirilenleri Sil',
            style: 'destructive',
            onPress: () => {
              deleteDownload(surahId);
              setCacheSizeText('');
            },
          },
        ]
      );
      return;
    }

    // İndirmeyi başlat
    startDownload(surahId, totalVerses);
  };

  const percentage = progress ? Math.round(progress.progress * 100) : 0;

  if (variant === 'subhead') {
    return (
      <Pressable
        onPress={handlePress}
        hitSlop={6}
        style={({ pressed }) => [
          styles.subheadContainer,
          {
            backgroundColor: isDownloaded
              ? theme.colors.accSoft
              : isDownloading
              ? theme.colors.band
              : theme.colors.surf,
            borderColor: isDownloaded ? theme.colors.acc : theme.colors.line,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        {isDownloading ? (
          <View style={styles.row}>
            <ActivityIndicator size="small" color={theme.colors.acc} style={styles.spinner} />
            <StyledText variant="caption" color="acc" style={styles.boldText}>
              %{percentage} ({progress?.current ?? 0}/{totalVerses})
            </StyledText>
          </View>
        ) : isDownloaded ? (
          <View style={styles.row}>
            <StyledText variant="caption" color="acc" style={styles.boldText}>
              ✓ Çevrimdışı Hazır
            </StyledText>
          </View>
        ) : (
          <View style={styles.row}>
            <StyledText variant="caption" color="mut" style={styles.buttonText}>
              ↓ Sureyi İndir
            </StyledText>
          </View>
        )}
      </Pressable>
    );
  }

  // Header Icon / Pill
  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityLabel={
        isDownloaded
          ? 'Sure çevrimdışı hazır'
          : isDownloading
          ? `Sure indiriliyor: %${percentage}`
          : 'Sureyi çevrimdışı dinlemek için indir'
      }
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.headerContainer,
        {
          backgroundColor: isDownloaded
            ? theme.colors.accSoft
            : isDownloading
            ? theme.colors.band
            : theme.colors.band,
          borderColor: isDownloaded ? theme.colors.acc : theme.colors.line,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {isDownloading ? (
        <View style={styles.row}>
          <ActivityIndicator size="small" color={theme.colors.acc} style={styles.spinnerSmall} />
          <StyledText variant="caption" color="acc" style={styles.percentageText}>
            %{percentage}
          </StyledText>
        </View>
      ) : isDownloaded ? (
        <View style={styles.row}>
          <StyledText style={{ color: theme.colors.acc, fontSize: 13, fontWeight: '700' }}>
            ✓
          </StyledText>
        </View>
      ) : (
        <View style={styles.row}>
          <StyledText style={{ color: theme.colors.ink, fontSize: 13, fontWeight: '600' }}>
            ↓
          </StyledText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 30,
    minWidth: 32,
    paddingHorizontal: 8,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subheadContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spinner: {
    transform: [{ scale: 0.7 }],
  },
  spinnerSmall: {
    transform: [{ scale: 0.6 }],
    marginRight: 2,
  },
  boldText: {
    fontWeight: '600',
    fontSize: 11,
  },
  buttonText: {
    fontSize: 11,
    fontWeight: '500',
  },
  percentageText: {
    fontWeight: '700',
    fontSize: 10.5,
  },
});
