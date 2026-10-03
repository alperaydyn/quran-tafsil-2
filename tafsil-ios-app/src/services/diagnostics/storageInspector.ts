import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import ayetlerSnapshot from '../../data/ayetler.snapshot.json';
import { SURAH_SEED_DATA } from '../../data/surahs.seed';
import {
  listStorageEntries,
  getStorageBackend,
  getKvPhysicalSize,
  peekStorageValue,
  type KvEntry,
  type KvBackend,
} from '../../store/mmkvStorage';
import { localDbService, type LocalTableInventory } from '../localDbService';
import { audioCacheService } from '../audioCacheService';

/**
 * Yerel Depolama Envanteri (PBI-10.1)
 * Cihazda katman bazında saklanan verileri ve boyutlarını toplar. Okumalar izleyiciyi
 * tetiklemez (peek / doğrudan sorgu) — tanılama ekranı kendi ölçümüyle olay akışını kirletmez.
 */

export interface KvGroup {
  id: string;
  label: string;
  keys: number;
  bytes: number;
}

export interface UserDataSummary {
  bookmarks: number;
  readingHistory: number;
  conceptHistory: number;
  memorizationHistory: number;
  dailyCountDays: number;
  lastSyncAt: string | null;
  readVersesTotal: number;
  completedSurahs: number;
  memorizationSessions: number;
}

export interface StorageInventory {
  collectedAt: number;
  totalBytes: number;
  disk: { freeBytes: number | null; totalBytes: number | null };
  l2: {
    backend: KvBackend;
    physicalBytes: number | null;
    logicalBytes: number;
    keyCount: number;
    groups: KvGroup[];
    topKeys: KvEntry[];
  };
  l3: {
    files: Array<{ name: string; bytes: number }>;
    totalBytes: number;
    pageBytes: number | null;
    journalMode: string | null;
    tables: LocalTableInventory[];
  };
  l4: { surahs: number; verses: number; approxBytes: number };
  l5: { totalBytes: number; fileCount: number; surahs: Array<{ surahId: number; files: number; bytes: number }> };
  userData: UserDataSummary;
}

const GROUP_RULES: Array<{ id: string; label: string; test: (k: string) => boolean }> = [
  { id: 'offline_user', label: 'Çevrimdışı kullanıcı verisi (senkron kuyruğu)', test: (k) => k.startsWith('tafsil_offline_') || k === 'tafsil_daily_verse_counts' || k === 'tafsil_last_sync_timestamp' },
  { id: 'lexicon', label: 'Sözlük önbelleği (lex_v1)', test: (k) => k.startsWith('lex_') },
  { id: 'stores', label: 'Kalıcı Zustand store’ları', test: () => true },
];

let snapshotBytesCache: number | null = null;

function parseArrayLength(key: string): number {
  try {
    const raw = peekStorageValue(key);
    if (!raw) return 0;
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0;
  } catch {
    return 0;
  }
}

function sqliteDir(): string {
  return `${FileSystem.documentDirectory ?? ''}SQLite/`;
}

async function fileSize(uri: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? (info as any).size ?? 0 : 0;
  } catch {
    return 0;
  }
}

function collectUserData(): UserDataSummary {
  let readVersesTotal = 0;
  let completedSurahs = 0;
  let memorizationSessions = 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useReadingProgressStore } = require('../../store/useReadingProgressStore');
    const s = useReadingProgressStore.getState();
    readVersesTotal = Object.values(s.readVersesBySurah ?? {}).reduce(
      (acc: number, list: any) => acc + (Array.isArray(list) ? list.length : 0),
      0
    );
    completedSurahs = Object.keys(s.completedSurahs ?? {}).length;
  } catch {}
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useMemorizationStore } = require('../../store/useMemorizationStore');
    memorizationSessions = useMemorizationStore.getState().sessions?.length ?? 0;
  } catch {}

  return {
    bookmarks: parseArrayLength('tafsil_offline_bookmarks'),
    readingHistory: parseArrayLength('tafsil_offline_history'),
    conceptHistory: parseArrayLength('tafsil_offline_concept_history'),
    memorizationHistory: parseArrayLength('tafsil_offline_memorization_history'),
    dailyCountDays: parseArrayLength('tafsil_daily_verse_counts'),
    lastSyncAt: peekStorageValue('tafsil_last_sync_timestamp'),
    readVersesTotal,
    completedSurahs,
    memorizationSessions,
  };
}

export async function collectStorageInventory(): Promise<StorageInventory> {
  // ── L2: KV ──
  const entries = listStorageEntries();
  const groups: KvGroup[] = GROUP_RULES.map((g) => ({ id: g.id, label: g.label, keys: 0, bytes: 0 }));
  for (const e of entries) {
    const idx = GROUP_RULES.findIndex((g) => g.test(e.key));
    groups[idx].keys++;
    groups[idx].bytes += e.bytes;
  }
  const logicalBytes = entries.reduce((a, e) => a + e.bytes, 0);
  const physicalBytes = getKvPhysicalSize();
  const topKeys = [...entries].sort((a, b) => b.bytes - a.bytes).slice(0, 12);

  // ── L3: SQLite dosyaları + tablolar ──
  const l3Files: Array<{ name: string; bytes: number }> = [];
  if (Platform.OS !== 'web') {
    for (const name of ['tafsil.db', 'tafsil.db-wal', 'tafsil.db-shm', 'tafsil_kv.db', 'tafsil_kv.db-wal']) {
      const bytes = await fileSize(`${sqliteDir()}${name}`);
      if (bytes > 0) l3Files.push({ name, bytes });
    }
  }
  const l3Total = l3Files.reduce((a, f) => a + f.bytes, 0);
  const { tables, pageBytes, journalMode } = localDbService.getTableInventory();

  // ── L4: Paket snapshot (bir kez ölçülür) ──
  if (snapshotBytesCache === null) {
    try {
      snapshotBytesCache = JSON.stringify(ayetlerSnapshot).length;
    } catch {
      snapshotBytesCache = 0;
    }
  }

  // ── L5: Ses önbelleği ──
  const l5 = Platform.OS !== 'web' ? await audioCacheService.getTotalCacheInfo() : { totalBytes: 0, fileCount: 0, surahs: [] };

  // ── Disk ──
  let freeBytes: number | null = null;
  let totalDisk: number | null = null;
  try {
    freeBytes = await FileSystem.getFreeDiskStorageAsync();
    totalDisk = await FileSystem.getTotalDiskCapacityAsync();
  } catch {}

  // Kullanıcıya ait cihaz üstü toplam (snapshot uygulama paketinin parçası olduğundan hariç)
  const kvOnDisk = physicalBytes ?? (getStorageBackend() === 'sqlite-kv' ? 0 : logicalBytes);
  const totalBytes = kvOnDisk + l3Total + l5.totalBytes;

  return {
    collectedAt: Date.now(),
    totalBytes,
    disk: { freeBytes, totalBytes: totalDisk },
    l2: { backend: getStorageBackend(), physicalBytes, logicalBytes, keyCount: entries.length, groups, topKeys },
    l3: { files: l3Files, totalBytes: l3Total, pageBytes, journalMode, tables },
    l4: { surahs: SURAH_SEED_DATA.length, verses: (ayetlerSnapshot as any[]).length, approxBytes: snapshotBytesCache ?? 0 },
    l5,
    userData: collectUserData(),
  };
}
