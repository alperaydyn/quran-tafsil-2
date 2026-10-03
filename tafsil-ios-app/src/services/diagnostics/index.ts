import { API_BASE, CLOUDFLARE_R2_BASE_URL } from '../../api/config';
import { trackFlow } from './dataFlowMonitor';
import { installNetworkInterceptor } from './networkInterceptor';
import { startConnectivityMonitor } from './connectivityMonitor';

/**
 * Tanılama altyapısını başlatır (PBI-10.1). App.tsx modül kapsamında, ilk fetch'ten önce çağrılır.
 *  - Global fetch gözlemcisi (NET_API / NET_CDN / NET_EXT)
 *  - Bağlantı durumu izleyicisi (expo-network + /health)
 *  - L1 Zustand store probları (hangi store'da hangi alanlar değişti)
 *
 * L2 (MMKV/KV), L3 (SQLite), L4 (Snapshot), L5 (Dosya) katmanları ilgili servislerde
 * doğrudan `trackFlow` ile işaretlenir.
 */

let installed = false;

/** Yüksek frekanslı (oynatma pozisyonu vb.) alanlar L1 olay akışını boğmasın diye dışlanır. */
const IGNORED_FIELDS: Record<string, string[]> = {
  activeReading: ['positionMs', 'currentWordIndex'],
};

type AnyStore = {
  subscribe: (listener: (state: any, prev: any) => void) => () => void;
};

function probeStore(name: string, store: AnyStore): void {
  const ignored = IGNORED_FIELDS[name] ?? [];
  store.subscribe((state, prev) => {
    try {
      const changed: string[] = [];
      for (const k of Object.keys(state)) {
        if (typeof state[k] === 'function' || ignored.includes(k)) continue;
        if (state[k] !== prev?.[k]) changed.push(k);
      }
      if (changed.length === 0) return;
      trackFlow('L1_ZUSTAND', 'write', name, { detail: changed.slice(0, 6).join(', ') });
    } catch {}
  });
}

function installStoreProbes(): void {
  // Store modülleri döngüsel import riskine karşı tembel (lazy) yüklenir
  const probes: Array<[string, () => AnyStore]> = [
    ['auth', () => require('../../store/useAuthStore').useAuthStore],
    ['readingProgress', () => require('../../store/useReadingProgressStore').useReadingProgressStore],
    ['memorization', () => require('../../store/useMemorizationStore').useMemorizationStore],
    ['userSettings', () => require('../../store/useUserSettingsStore').useUserSettingsStore],
    ['readingPreferences', () => require('../../store/useReadingPreferencesStore').useReadingPreferencesStore],
    ['audioCache', () => require('../../store/useAudioCacheStore').useAudioCacheStore],
    ['activeReading', () => require('../../store/useActiveReadingStore').useActiveReadingStore],
  ];
  for (const [name, load] of probes) {
    try {
      const store = load();
      if (typeof store?.subscribe === 'function') probeStore(name, store);
    } catch {}
  }
}

export function installDiagnostics(): void {
  if (installed) return;
  installed = true;
  installNetworkInterceptor({ apiBase: API_BASE, cdnBase: CLOUDFLARE_R2_BASE_URL });
  startConnectivityMonitor(API_BASE);
  installStoreProbes();
  trackFlow('SYS', 'state', 'app', { detail: 'Uygulama başlatıldı · tanılama aktif' });
}

export * from './dataFlowMonitor';
export * from './connectivityMonitor';
