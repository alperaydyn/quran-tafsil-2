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
    '[Tafsil Storage] MMKV native modülü yüklenemedi (Expo Go veya Web). Kalıcı web/bellek deposuna geçiliyor:',
    (err as Error)?.message
  );
  activeStorage = {
    set: (name, value) => {
      const valStr = String(value);
      memoryStore.set(name, valStr);
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(`tafsil_${name}`, valStr);
        } catch {}
      }
    },
    getString: (name) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const item = window.localStorage.getItem(`tafsil_${name}`);
          if (item !== null) return item;
        } catch {}
      }
      return memoryStore.get(name);
    },
    delete: (name) => {
      memoryStore.delete(name);
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.removeItem(`tafsil_${name}`);
        } catch {}
      }
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
