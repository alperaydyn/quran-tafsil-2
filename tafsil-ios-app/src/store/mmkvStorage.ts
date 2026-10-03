import type { StateStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import { trackFlow, approxBytes } from '../services/diagnostics/dataFlowMonitor';

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
let kvSqliteDb: any = null;

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
  kvSqliteDb = sqliteDb;

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

// ─── Tanılama (PBI-10.1): L2 katmanındaki her okuma/yazma/silme hareketini izle ───

export type KvBackend = 'mmkv' | 'sqlite-kv' | 'localStorage' | 'memory';

export function getStorageBackend(): KvBackend {
  if (mmkvAvailable) return 'mmkv';
  if (kvSqliteDb) return 'sqlite-kv';
  if (typeof window !== 'undefined' && (window as any).localStorage) return 'localStorage';
  return 'memory';
}

/**
 * Gürültülü (kelime başına) anahtarları tek bir mantıksal anahtarda toplar; böylece
 * ardışık okumalar izleyicide birleştirilir ve olay tamponu sözlük okumalarıyla dolmaz.
 */
function flowKeyFor(name: string): { key: string; detail?: string } {
  if (name.startsWith('lex_meta_v1_')) return { key: 'lex_meta_v1_* (sözlük meta)', detail: name.slice(12) };
  if (name.startsWith('lex_v1_')) return { key: 'lex_v1_* (sözlük önbelleği)', detail: name.slice(7) };
  return { key: name };
}

const rawStorage = activeStorage;
const backendLabel = getStorageBackend();

activeStorage = {
  set: (name, value) => {
    const started = Date.now();
    try {
      rawStorage.set(name, value);
      const { key, detail } = flowKeyFor(name);
      trackFlow('L2_KV', 'write', key, {
        bytes: approxBytes(String(value)),
        durationMs: Date.now() - started,
        detail: detail ?? backendLabel,
      });
    } catch (err: any) {
      trackFlow('L2_KV', 'write', name, { status: 'error', detail: String(err?.message ?? err) });
      throw err;
    }
  },
  getString: (name) => {
    const value = rawStorage.getString(name);
    const { key, detail } = flowKeyFor(name);
    trackFlow('L2_KV', value === undefined ? 'miss' : 'hit', key, {
      bytes: value ? approxBytes(value) : undefined,
      detail: detail ?? backendLabel,
    });
    return value;
  },
  delete: (name) => {
    rawStorage.delete(name);
    const { key, detail } = flowKeyFor(name);
    trackFlow('L2_KV', 'delete', key, { detail: detail ?? backendLabel });
  },
};

export interface KvEntry {
  key: string;
  bytes: number;
}

/**
 * L2 katmanındaki tüm anahtarları ve yaklaşık boyutlarını listeler (izleyiciyi tetiklemeden).
 */
export function listStorageEntries(): KvEntry[] {
  try {
    if (mmkvAvailable) {
      const inst = rawStorage as any;
      const keys: string[] = typeof inst.getAllKeys === 'function' ? inst.getAllKeys() : [];
      return keys.map((k) => ({ key: k, bytes: approxBytes(inst.getString(k)) + approxBytes(k) }));
    }
    if (kvSqliteDb) {
      const rows = kvSqliteDb.getAllSync(
        'SELECT key, length(CAST(value AS BLOB)) + length(CAST(key AS BLOB)) AS bytes FROM kv_store'
      ) as Array<{ key: string; bytes: number }>;
      return rows.map((r) => ({ key: r.key, bytes: Number(r.bytes) || 0 }));
    }
    return Array.from(memoryStore.entries()).map(([k, v]) => ({ key: k, bytes: approxBytes(v) + approxBytes(k) }));
  } catch {
    return [];
  }
}

/** İzleyiciyi tetiklemeden değer okur (tanılama ekranının kendi okumaları olay akışını kirletmesin). */
export function peekStorageValue(key: string): string | null {
  try {
    return rawStorage.getString(key) ?? null;
  } catch {
    return null;
  }
}

/** MMKV dosyasının fiziksel boyutu (yalnızca native MMKV'de mevcut). */
export function getKvPhysicalSize(): number | null {
  try {
    if (mmkvAvailable) {
      const size = (rawStorage as any).size;
      return typeof size === 'number' ? size : null;
    }
  } catch {}
  return null;
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
