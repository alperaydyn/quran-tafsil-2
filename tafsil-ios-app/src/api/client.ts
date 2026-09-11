import Constants from 'expo-constants';
import type { ApiResponse, Surah, Verse } from './types';
import { mockSurahs } from './mock/surahs.mock';
import { mockVersesBySurah } from './mock/verses.mock';

/**
 * Backend REST istemcisi (MOB-004).
 *
 * Şu an MOCK modda çalışıyor: Agent-02'nin `docs/agent-signals/agent-02.status.json`
 * dosyasında BE-001 + BE-010 (temel API + auth) `completed` listesine girene kadar
 * gerçek ağ isteği yapılmaz. BE-004 (sure listesi) ve BE-007 (okuma ucu) ayrı ayrı
 * kontrol edilir — her biri hazır olduğunda ilgili fonksiyon gerçek `fetch`'e geçirilir.
 *
 * Kontrol: `cat docs/agent-signals/agent-02.status.json`
 */

const API_URL = Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

const USE_MOCK = {
  surahs: true, // BE-004 hazır olduğunda false yapılacak
  verses: true, // BE-007 hazır olduğunda false yapılacak
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getSurahs(): Promise<ApiResponse<Surah[]>> {
  if (USE_MOCK.surahs) {
    await delay(150);
    return { success: true, data: mockSurahs, meta: { total: mockSurahs.length, cached: false } };
  }
  const res = await fetch(`${API_URL}/surahs`);
  return res.json();
}

export async function getVerses(surahId: number): Promise<ApiResponse<Verse[]>> {
  if (USE_MOCK.verses) {
    await delay(150);
    const data = mockVersesBySurah[surahId] ?? [];
    return { success: true, data, meta: { total: data.length, cached: false } };
  }
  const res = await fetch(`${API_URL}/surahs/${surahId}/verses`);
  return res.json();
}
