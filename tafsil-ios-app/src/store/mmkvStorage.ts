import type { StateStorage } from 'zustand/middleware';

/**
 * Zustand `persist` middleware için MMKV tabanlı depolama katmanı.
 * Expo Go veya Yeni Mimari (TurboModules) olmayan ortamlarda çalışma zamanı
 * çökmesini önlemek için güvenli bellek (fallback) deposu içerir.
 */
interface StorageInstance {
  set: (key: string, value: string | boolean | number) => void;
  getString: (key: string) => string | undefined;
  delete: (key: string) => void;
}

const memoryStore = new Map<string, string>();

let activeStorage: StorageInstance;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV } = require('react-native-mmkv');
  activeStorage = new MMKV({ id: 'tafsil-app-storage' });
} catch (err) {
  console.warn(
    '[Tafsil Storage] MMKV native modülü yüklenemedi (Expo Go veya Eski Mimari). Bellek deposuna geçiliyor:',
    (err as Error)?.message
  );
  activeStorage = {
    set: (name, value) => {
      memoryStore.set(name, String(value));
    },
    getString: (name) => {
      return memoryStore.get(name);
    },
    delete: (name) => {
      memoryStore.delete(name);
    },
  };
}

export const mmkv = activeStorage;

export const mmkvStorage: StateStorage = {
  setItem: (name, value) => {
    activeStorage.set(name, value);
  },
  getItem: (name) => {
    return activeStorage.getString(name) ?? null;
  },
  removeItem: (name) => {
    activeStorage.delete(name);
  },
};
