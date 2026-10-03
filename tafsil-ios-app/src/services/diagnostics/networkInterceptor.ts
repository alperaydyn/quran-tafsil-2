import { trackFlow, type MemoryLayer } from './dataFlowMonitor';

/**
 * Global `fetch` gözlemcisi (PBI-10.1).
 * Uygulamadaki TÜM HTTP isteklerini (client.ts, senkronizasyon, sözlük, zaman damgaları)
 * tek noktadan yakalar ve NET_API / NET_CDN / NET_EXT katmanına işler.
 *
 * Gizlilik: Yalnızca yöntem, yol, durum kodu, süre ve Content-Length kaydedilir.
 * Authorization başlığı, istek/yanıt gövdesi ve sorgu parametresi değerleri ASLA loglanmaz.
 */

let installed = false;

interface InterceptorConfig {
  apiBase: string;
  cdnBase: string;
}

function classify(url: string, cfg: InterceptorConfig): MemoryLayer {
  if (cfg.apiBase && url.startsWith(cfg.apiBase.replace(/\/api\/v1\/?$/, ''))) return 'NET_API';
  if (cfg.cdnBase && url.startsWith(cfg.cdnBase)) return 'NET_CDN';
  return 'NET_EXT';
}

/** `https://api.tafsil.net/api/v1/sync/pull?x=1` → `/api/v1/sync/pull?x` (değerler maskelenir) */
function toSafePath(url: string): string {
  try {
    const match = url.match(/^https?:\/\/[^/]+(\/[^?#]*)?(\?[^#]*)?/i);
    if (!match) return url.slice(0, 120);
    const path = match[1] || '/';
    const queryKeys = match[2]
      ? match[2]
          .slice(1)
          .split('&')
          .map((p) => p.split('=')[0])
          .filter(Boolean)
          .join('&')
      : '';
    return queryKeys ? `${path}?${queryKeys}` : path;
  } catch {
    return url.slice(0, 120);
  }
}

export function installNetworkInterceptor(cfg: InterceptorConfig): void {
  if (installed || typeof globalThis.fetch !== 'function') return;
  installed = true;

  const originalFetch = globalThis.fetch.bind(globalThis);

  const instrumentedFetch: typeof fetch = async (input: any, init?: any) => {
    const url: string =
      typeof input === 'string' ? input : input?.url ?? (input?.href as string | undefined) ?? String(input);
    const method: string = (init?.method || input?.method || 'GET').toUpperCase();
    const layer = classify(url, cfg);
    const path = toSafePath(url);
    const started = Date.now();
    const bodyBytes = typeof init?.body === 'string' ? init.body.length : undefined;

    try {
      const res = await originalFetch(input, init);
      const len = Number(res.headers?.get?.('content-length') ?? 0) || undefined;
      trackFlow(layer, 'request', `${method} ${path}`, {
        status: res.ok ? 'ok' : 'error',
        durationMs: Date.now() - started,
        bytes: len ?? bodyBytes,
        detail: `HTTP ${res.status}${bodyBytes ? ` · ↑${bodyBytes}B` : ''}`,
      });
      return res;
    } catch (err: any) {
      const aborted = err?.name === 'AbortError';
      trackFlow(layer, 'request', `${method} ${path}`, {
        status: 'error',
        durationMs: Date.now() - started,
        detail: aborted ? 'Zaman aşımı / iptal' : String(err?.message ?? err).slice(0, 120),
      });
      throw err;
    }
  };

  globalThis.fetch = instrumentedFetch;
}
