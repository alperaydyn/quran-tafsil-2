import type { StateStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

/**
 * Zustand `persist` middleware ve uygulama geneli için kalıcı depolama katmanı.
 * 1. Öncelik: react-native-mmkv (Ultra hızlı C++ native modül)
 * 2. Fallback: expo-sqlite senkron KV tablosu (Expo Go ve tüm mobil cihazlarda %100 kalıcı)
 * 3. Fallback: window.localStorage (Web ortamı)
 * 4. Fallback: Bellek içi Map (Hafıza)
 */
interface StorageInstance {
  set: (key: string, value: string | boolean | number) => void;
  getString: (key: string) => string | undefined;
  delete: (key: string) => void;
}

const memoryStore = new Map<string, string>();
let activeStorage!: StorageInstance;

let mmkvAvailable = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV } = require('react-native-mmkv');
  const mmkvInstance = new MMKV({ id: 'tafsil-app-storage' });
  // Doğrulama denemesi (Expo Go'da require başarsa bile native binding çökebilir)
  mmkvInstance.getString('__probe__');
  activeStorage = mmkvInstance;
  mmkvAvailable = true;
} catch {
  mmkvAvailable = false;
}

if (!mmkvAvailable) {
  let sqliteDb: any = null;
  if (Platform.OS !== 'web') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const SQLite = require('expo-sqlite');
      sqliteDb = SQLite.openDatabaseSync('tafsil_kv.db');
      sqliteDb.execSync(`
        CREATE TABLE IF NOT EXISTS kv_store (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    } catch (e) {
      console.warn('[Tafsil Storage] SQLite kv tablosu açılamadı, memory deposuna geçiliyor:', e);
      sqliteDb = null;
    }
  }

  activeStorage = {
    set: (name, value) => {
      const valStr = String(value);
      memoryStore.set(name, valStr);

      if (sqliteDb) {
        try {
          sqliteDb.runSync(
            'INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)',
            [name, valStr]
          );
          return;
        } catch (err) {
          console.warn('[Tafsil Storage] SQLite yazma hatası:', err);
        }
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(`tafsil_${name}`, valStr);
        } catch {}
      }
    },

    getString: (name) => {
      if (sqliteDb) {
        try {
          const row = sqliteDb.getFirstSync(
            'SELECT value FROM kv_store WHERE key = ?',
            [name]
          ) as { value: string } | null;
          if (row && typeof row.value === 'string') {
            memoryStore.set(name, row.value);
            return row.value;
          }
          return undefined;
        } catch (err) {
          console.warn('[Tafsil Storage] SQLite okuma hatası:', err);
        }
      }

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

      if (sqliteDb) {
        try {
          sqliteDb.runSync('DELETE FROM kv_store WHERE key = ?', [name]);
        } catch (err) {
          console.warn('[Tafsil Storage] SQLite silme hatası:', err);
        }
      }

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

