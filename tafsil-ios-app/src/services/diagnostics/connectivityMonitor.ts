import * as Network from 'expo-network';
import { trackFlow } from './dataFlowMonitor';

/**
 * Bağlantı Durumu İzleyicisi (PBI-10.1)
 *
 * İki ayrı sinyali birleştirir — çünkü "cihaz çevrimiçi" ≠ "API erişilebilir":
 *  1. Cihaz ağ durumu (expo-network): Wi-Fi / Hücresel / Yok, internet erişimi
 *  2. API sağlığı (`GET /health`): sunucu, PostgreSQL ve Redis canlı mı, gecikme kaç ms
 *
 * Durum geçişleri (online → offline vb.) SYS katmanına olay olarak işlenir; böylece
 * paylaşılan tanılama raporunda kullanıcının hangi anda çevrimdışı kaldığı görülebilir.
 */

export type ConnectivityStatus = 'online' | 'offline' | 'api_unreachable' | 'unknown';

export interface ConnectivitySnapshot {
  status: ConnectivityStatus;
  networkType: string;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  api: {
    reachable: boolean | null;
    latencyMs: number | null;
    postgres: boolean | null;
    redis: boolean | null;
    checkedAt: number | null;
    error?: string;
  };
  lastChangeAt: number | null;
  /** Oturum boyunca kaydedilen çevrimdışı geçiş sayısı */
  offlineTransitions: number;
}

let snapshot: ConnectivitySnapshot = {
  status: 'unknown',
  networkType: 'UNKNOWN',
  isConnected: null,
  isInternetReachable: null,
  api: { reachable: null, latencyMs: null, postgres: null, redis: null, checkedAt: null },
  lastChangeAt: null,
  offlineTransitions: 0,
};

const listeners = new Set<(s: ConnectivitySnapshot) => void>();
let started = false;
let healthUrl = '';

function deriveStatus(s: ConnectivitySnapshot): ConnectivityStatus {
  if (s.isConnected === false) return 'offline';
  if (s.api.reachable === false) return s.isConnected ? 'api_unreachable' : 'offline';
  if (s.isConnected && s.api.reachable) return 'online';
  if (s.isConnected) return 'online';
  return 'unknown';
}

function update(patch: Partial<ConnectivitySnapshot>): void {
  const prevStatus = snapshot.status;
  const next: ConnectivitySnapshot = { ...snapshot, ...patch };
  next.status = deriveStatus(next);
  if (next.status !== prevStatus) {
    next.lastChangeAt = Date.now();
    if (next.status === 'offline' || next.status === 'api_unreachable') {
      next.offlineTransitions = snapshot.offlineTransitions + 1;
    }
    trackFlow('SYS', 'state', 'connectivity', {
      status: next.status === 'online' ? 'ok' : next.status === 'unknown' ? 'miss' : 'error',
      detail: `${prevStatus} → ${next.status} (${next.networkType})`,
    });
  }
  snapshot = next;
  listeners.forEach((l) => {
    try {
      l(snapshot);
    } catch {}
  });
}

function applyNetworkState(state: Network.NetworkState): void {
  update({
    networkType: String(state.type ?? 'UNKNOWN'),
    isConnected: state.isConnected ?? null,
    isInternetReachable: state.isInternetReachable ?? null,
  });
}

export function startConnectivityMonitor(apiBase: string): void {
  if (started) return;
  started = true;
  healthUrl = `${apiBase.replace(/\/api\/v1\/?$/, '')}/health`;

  try {
    Network.getNetworkStateAsync().then(applyNetworkState).catch(() => {});
    Network.addNetworkStateListener((state) => {
      applyNetworkState(state);
      // Ağ geri geldiğinde API erişimini hemen doğrula
      if (state.isConnected) checkApiHealth().catch(() => {});
    });
  } catch {
    // expo-network native modülü yoksa (eski dev client) sessizce devam et
  }
}

/** API sağlığını ölçer. Tanılama ekranı açıkken periyodik çağrılır. */
export async function checkApiHealth(timeoutMs = 4000): Promise<ConnectivitySnapshot> {
  if (!healthUrl) return snapshot;
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(healthUrl, { signal: controller.signal, headers: { Accept: 'application/json' } });
    clearTimeout(timer);
    const latency = Date.now() - started;
    let postgres: boolean | null = null;
    let redis: boolean | null = null;
    try {
      // 200 → { data: { checks } } · 503 → { error: { details: checks } }
      const json = await res.json();
      const checks = json?.data?.checks ?? json?.error?.details ?? null;
      postgres = typeof checks?.postgres === 'boolean' ? checks.postgres : null;
      redis = typeof checks?.redis === 'boolean' ? checks.redis : null;
    } catch {}
    update({
      api: {
        // Yanıt geldiyse sunucu erişilebilirdir; 503 bağımlılık (DB/Redis) sorununu gösterir
        reachable: true,
        latencyMs: latency,
        postgres,
        redis,
        checkedAt: Date.now(),
        error: res.ok ? undefined : `HTTP ${res.status} (bağımlılık hatası)`,
      },
    });
  } catch (err: any) {
    clearTimeout(timer);
    update({
      api: {
        reachable: false,
        latencyMs: null,
        postgres: null,
        redis: null,
        checkedAt: Date.now(),
        error: err?.name === 'AbortError' ? 'Zaman aşımı' : String(err?.message ?? err).slice(0, 80),
      },
    });
  }
  return snapshot;
}

export function getConnectivity(): ConnectivitySnapshot {
  return snapshot;
}

export function subscribeConnectivity(listener: (s: ConnectivitySnapshot) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getHealthUrl(): string {
  return healthUrl;
}
