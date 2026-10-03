/**
 * Veri Hareketi İzleyicisi (Data Flow Monitor) — PBI-10.1
 *
 * Uygulama içindeki her veri hareketini (okuma/yazma/isabet/ıska/ağ isteği) hangi bellek
 * katmanında gerçekleştiğiyle birlikte kayıt altına alan, bağımlılıksız, düşük maliyetli
 * halka tampon (ring buffer).
 *
 * Katman isimlendirmesi README.md > "Çok Katmanlı Önbellek Mimarisi" ile birebir uyumludur:
 *   L1 Zustand (reaktif bellek) · L2 MMKV / KV · L3 SQLite · L4 Snapshot · L5 Dosya/Ses
 *   NET_API (Fastify) · NET_CDN (Cloudflare R2) · NET_EXT (diğer) · SYS (bağlantı/senkron olayları)
 *
 * ÖNEMLİ: Bu modül hiçbir uygulama modülünü import etmez (mmkvStorage dâhil) — döngüsel
 * bağımlılık ve kendi kendini loglama (recursion) riskini ortadan kaldırır.
 */

export type MemoryLayer =
  | 'L1_ZUSTAND'
  | 'L2_KV'
  | 'L3_SQLITE'
  | 'L4_SNAPSHOT'
  | 'L5_FILE'
  | 'NET_API'
  | 'NET_CDN'
  | 'NET_EXT'
  | 'SYS';

export type FlowOp =
  | 'read'
  | 'write'
  | 'delete'
  | 'hit'
  | 'miss'
  | 'fallback'
  | 'request'
  | 'push'
  | 'pull'
  | 'download'
  | 'state';

export type FlowStatus = 'ok' | 'miss' | 'error';

export interface DataFlowEvent {
  id: number;
  /** Epoch ms */
  ts: number;
  layer: MemoryLayer;
  op: FlowOp;
  /** Anahtar, tablo, URL yolu veya store adı */
  key: string;
  status: FlowStatus;
  bytes?: number;
  durationMs?: number;
  /** Ardışık özdeş olaylar birleştirildiğinde tekrar sayısı */
  count: number;
  detail?: string;
}

export interface LayerCounters {
  reads: number;
  writes: number;
  hits: number;
  misses: number;
  errors: number;
  bytesIn: number;
  bytesOut: number;
  lastAt: number | null;
}

export interface SyncRunInfo {
  at: number;
  ok: boolean;
  phase: 'skipped' | 'push' | 'pull' | 'done';
  durationMs: number;
  pushed?: { bookmarks: number; history: number; concepts: number; memorization: number };
  pulled?: { bookmarks: number; history: number; concepts: number; memorization: number };
  error?: string;
}

export const LAYER_META: Record<MemoryLayer, { short: string; label: string; tech: string }> = {
  L1_ZUSTAND: { short: 'L1', label: 'Reaktif Bellek', tech: 'Zustand' },
  L2_KV: { short: 'L2', label: 'Anahtar-Değer', tech: 'MMKV / KV' },
  L3_SQLITE: { short: 'L3', label: 'İlişkisel DB', tech: 'SQLite WAL' },
  L4_SNAPSHOT: { short: 'L4', label: 'Paket Snapshot', tech: 'JSON' },
  L5_FILE: { short: 'L5', label: 'Dosya / Ses', tech: 'FileSystem' },
  NET_API: { short: 'API', label: 'Sunucu API', tech: 'Fastify' },
  NET_CDN: { short: 'CDN', label: 'Medya CDN', tech: 'Cloudflare R2' },
  NET_EXT: { short: 'EXT', label: 'Harici Ağ', tech: 'HTTP' },
  SYS: { short: 'SYS', label: 'Sistem', tech: 'Bağlantı & Senkron' },
};

export const ALL_LAYERS = Object.keys(LAYER_META) as MemoryLayer[];

const MAX_EVENTS = 600;
/** Ardışık özdeş olayların birleştirilme penceresi */
const COALESCE_WINDOW_MS = 1500;
const NOTIFY_THROTTLE_MS = 300;

const READ_OPS: FlowOp[] = ['read', 'hit', 'miss', 'fallback', 'pull', 'download'];
const WRITE_OPS: FlowOp[] = ['write', 'delete', 'push'];

function emptyCounters(): LayerCounters {
  return { reads: 0, writes: 0, hits: 0, misses: 0, errors: 0, bytesIn: 0, bytesOut: 0, lastAt: null };
}

class DataFlowMonitorImpl {
  private events: DataFlowEvent[] = [];
  private seq = 0;
  private counters: Record<MemoryLayer, LayerCounters> = ALL_LAYERS.reduce(
    (acc, l) => ({ ...acc, [l]: emptyCounters() }),
    {} as Record<MemoryLayer, LayerCounters>
  );
  private listeners = new Set<() => void>();
  private notifyTimer: ReturnType<typeof setTimeout> | null = null;
  private paused = false;
  private version = 0;
  readonly startedAt = Date.now();
  lastSync: SyncRunInfo | null = null;

  record(input: {
    layer: MemoryLayer;
    op: FlowOp;
    key: string;
    status?: FlowStatus;
    bytes?: number;
    durationMs?: number;
    detail?: string;
  }): void {
    try {
      const now = Date.now();
      const status: FlowStatus = input.status ?? (input.op === 'miss' ? 'miss' : 'ok');

      // 1. Katman sayaçları (duraklatılsa bile sayaçlar doğru kalsın)
      const c = this.counters[input.layer];
      if (READ_OPS.includes(input.op) || input.op === 'request') c.reads++;
      if (WRITE_OPS.includes(input.op)) c.writes++;
      if (input.op === 'hit') c.hits++;
      if (input.op === 'miss' || input.op === 'fallback') c.misses++;
      if (status === 'error') c.errors++;
      if (input.bytes && input.bytes > 0) {
        if (WRITE_OPS.includes(input.op)) c.bytesOut += input.bytes;
        else c.bytesIn += input.bytes;
      }
      c.lastAt = now;

      if (this.paused) return;

      // 2. Ardışık özdeş olay birleştirme (ör. ayet başına tekrar eden sözlük okuması)
      const last = this.events[this.events.length - 1];
      if (
        last &&
        last.layer === input.layer &&
        last.op === input.op &&
        last.key === input.key &&
        last.status === status &&
        now - last.ts < COALESCE_WINDOW_MS
      ) {
        last.count++;
        last.ts = now;
        if (input.bytes) last.bytes = (last.bytes ?? 0) + input.bytes;
        if (input.durationMs !== undefined) last.durationMs = input.durationMs;
        if (input.detail) last.detail = input.detail;
      } else {
        this.events.push({
          id: ++this.seq,
          ts: now,
          layer: input.layer,
          op: input.op,
          key: input.key.length > 160 ? `${input.key.slice(0, 157)}…` : input.key,
          status,
          bytes: input.bytes,
          durationMs: input.durationMs,
          count: 1,
          detail: input.detail,
        });
        if (this.events.length > MAX_EVENTS) {
          this.events.splice(0, this.events.length - MAX_EVENTS);
        }
      }
      this.scheduleNotify();
    } catch {
      // İzleyici asla uygulama akışını bozmamalı
    }
  }

  setLastSync(info: SyncRunInfo): void {
    this.lastSync = info;
    this.scheduleNotify();
  }

  getEvents(): DataFlowEvent[] {
    return this.events;
  }

  getCounters(): Record<MemoryLayer, LayerCounters> {
    return this.counters;
  }

  /** useSyncExternalStore için değişim sürümü */
  getVersion(): number {
    return this.version;
  }

  isPaused(): boolean {
    return this.paused;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.scheduleNotify();
  }

  clear(): void {
    this.events = [];
    ALL_LAYERS.forEach((l) => {
      this.counters[l] = emptyCounters();
    });
    this.scheduleNotify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private scheduleNotify(): void {
    if (this.notifyTimer || this.listeners.size === 0) {
      if (this.listeners.size === 0) this.version++;
      return;
    }
    this.notifyTimer = setTimeout(() => {
      this.notifyTimer = null;
      this.version++;
      this.listeners.forEach((l) => {
        try {
          l();
        } catch {}
      });
    }, NOTIFY_THROTTLE_MS);
  }
}

export const dataFlowMonitor = new DataFlowMonitorImpl();

/** Kısa yol: `trackFlow('L3_SQLITE', 'hit', 'verses:2')` */
export function trackFlow(
  layer: MemoryLayer,
  op: FlowOp,
  key: string,
  extra?: { status?: FlowStatus; bytes?: number; durationMs?: number; detail?: string }
): void {
  dataFlowMonitor.record({ layer, op, key, ...extra });
}

/** UTF-16 JS string'in yaklaşık UTF-8 bayt boyutu (hızlı tahmin, kopyasız). */
export function approxBytes(value: string | null | undefined): number {
  if (!value) return 0;
  let bytes = 0;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4;
      i++;
    } else bytes += 3;
  }
  return bytes;
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const v = bytes / Math.pow(1024, i);
  return `${v >= 100 || i === 0 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}
