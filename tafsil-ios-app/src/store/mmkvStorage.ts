import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * Zustand `persist` middleware için MMKV tabanlı senkron depolama katmanı.
 * AsyncStorage'a kıyasla çok daha hızlıdır; offline-first mimari için
 * (bkz. AGENTS.md §3.3) tercih edilen kalıcı anahtar-değer deposu.
 */
export const mmkv = new MMKV({ id: 'tafsil-app-storage' });

export const mmkvStorage: StateStorage = {
  setItem: (name, value) => mmkv.set(name, value),
  getItem: (name) => mmkv.getString(name) ?? null,
  removeItem: (name) => mmkv.delete(name),
};
