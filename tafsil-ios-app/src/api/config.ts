import Constants from 'expo-constants';
import { Platform } from 'react-native';

const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  `http://${defaultHost}:4000/api/v1`;

// USE_MOCK: false olarak ayarlandı (Canlı API aktif, ağ yoksa SQLite / snapshot devrede).
export const USE_MOCK = {
  surahs: false,
  verses: false,
};

export const CLOUDFLARE_R2_BASE_URL =
  Constants.expoConfig?.extra?.audioBaseUrl ??
  process.env.EXPO_PUBLIC_AUDIO_BASE_URL ??
  'https://audio.tafsil.net';

export function getAyahAudioUrl(surahId: number, ayahNo: number): string {
  // Cloudflare R2: audio/{surah}_{ayah}.mp3
  return `${CLOUDFLARE_R2_BASE_URL}/audio/${surahId}_${ayahNo}.mp3`;
}

export function getAyahTimestampUrl(surahId: number, ayahNo: number): string {
  // Cloudflare R2: timestamps/{surah}_{ayah}.json
  return `${CLOUDFLARE_R2_BASE_URL}/timestamps/${surahId}_${ayahNo}.json`;
}

export function getSurahTimestampUrl(surahId: number): string {
  // Cloudflare R2: timestamps/surahs/{surah}.json
  return `${CLOUDFLARE_R2_BASE_URL}/timestamps/surahs/${surahId}.json`;
}
