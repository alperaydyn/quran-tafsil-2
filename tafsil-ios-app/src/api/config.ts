import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveApiHost(): string {
  // 1. Expo Go veya Expo development client üzerinde çalışırken hostUri bilgisayarın yerel IP'sini içerir (örn: 192.168.1.120:8081)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri && typeof hostUri === 'string') {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }

  // 2. Android Studio Emülatörü
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  // 3. iOS Simülatör veya Web
  return 'localhost';
}

const defaultHost = resolveApiHost();

/**
 * API taban adresi öncelik zinciri (PBI-9.5):
 * 1. `EXPO_PUBLIC_API_URL` — EAS build profili (eas.json `env`) veya yerel `.env` ile build-time'da gömülür.
 * 2. `app.json > extra.apiUrl` — yalnızca prodüksiyon (release) build'lerde; geliştirme sırasında
 *    yanlışlıkla canlı API'ye gidilmesini engeller.
 * 3. Yerel geliştirme sunucusu (`http://<metro-host-ip>:4000/api/v1`).
 */
export const API_BASE: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (!__DEV__ ? (Constants.expoConfig?.extra?.apiUrl as string | undefined) : undefined) ??
  `http://${defaultHost}:4000/api/v1`;

/**
 * Sürüm bazlı özellik bayrakları.
 * - googleSignIn: Native Google Sign-In entegrasyonu tamamlanana kadar (Faz 2) yalnızca
 *   geliştirme build'lerinde görünür. F&F / TestFlight sürümü Apple + Misafir ile çıkar (PBI-9.3).
 */
export const FEATURES = {
  googleSignIn: __DEV__,
} as const;

/** Gizlilik Politikası (App Store / TestFlight harici test zorunluluğu — PBI-9.7). */
export const PRIVACY_POLICY_URL: string =
  (Constants.expoConfig?.extra?.privacyPolicyUrl as string | undefined) ?? 'https://tafsil.net/gizlilik';

/** Geri bildirim / destek iletişim adresi. */
export const SUPPORT_EMAIL: string =
  (Constants.expoConfig?.extra?.supportEmail as string | undefined) ?? 'merhaba@tafsil.net';


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
