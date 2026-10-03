import { Platform, Share } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as MailComposer from 'expo-mail-composer';
import { API_BASE, SUPPORT_EMAIL } from '../../api/config';
import { mmkv, peekStorageValue } from '../../store/mmkvStorage';
import {
  dataFlowMonitor,
  formatBytes,
  type DataFlowEvent,
  type LayerCounters,
  type MemoryLayer,
  type SyncRunInfo,
} from './dataFlowMonitor';
import { checkApiHealth, getConnectivity, type ConnectivitySnapshot } from './connectivityMonitor';
import { collectStorageInventory, type StorageInventory } from './storageInspector';

/**
 * Tanılama Raporu (PBI-10.2)
 * Kullanıcı bir sorun yaşadığında tek dokunuşla:
 *  1. Cihaz/uygulama, bağlantı, katman sayaçları, depolama envanteri, son senkron sonucu ve
 *     son veri hareketlerini içeren JSON raporu üretir,
 *  2. (Çevrimiçiyse) raporu sunucuya kaydeder → kısa referans kodu alır (`istemci_tanilama_raporlari`),
 *  3. Raporu JSON eki olarak destek adresine e-posta ile gönderir (Mail yoksa paylaşım sayfası).
 *
 * Gizlilik: JWT token, e-posta adresi, yer imi notları ve okuma içeriği rapora EKLENMEZ.
 */

export const REPORT_VERSION = 1;
const INSTALL_ID_KEY = 'tafsil_diag_install_id';
const MAX_EVENTS_IN_REPORT = 400;

export interface ServerSyncStatus {
  bookmarks: number;
  readingHistory: number;
  distinctVerses: number;
  conceptHistory: number;
  memorization: number;
  fetchedAt: number;
}

export interface DiagnosticReport {
  report_version: number;
  generated_at: string;
  install_id: string;
  user_note?: string;
  app: {
    version: string;
    build: string;
    runtime: 'dev' | 'release';
    platform: string;
    os_version: string;
    device: string;
    api_base: string;
    session_uptime_sec: number;
  };
  auth: {
    user_id: string | null;
    is_guest: boolean;
    provider: string | null;
    has_server_token: boolean;
    session_expired: boolean;
  };
  connectivity: ConnectivitySnapshot;
  last_sync: SyncRunInfo | null;
  server_status: ServerSyncStatus | null;
  storage: StorageInventory;
  layer_counters: Record<MemoryLayer, LayerCounters>;
  events: DataFlowEvent[];
}

export function getInstallId(): string {
  let id = peekStorageValue(INSTALL_ID_KEY);
  if (!id) {
    id = 'ins-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    try {
      mmkv.set(INSTALL_ID_KEY, id);
    } catch {}
  }
  return id;
}

function getAuthSnapshot(): { auth: DiagnosticReport['auth']; token: string | null } {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useAuthStore } = require('../../store/useAuthStore');
    const s = useAuthStore.getState();
    const token: string | null = s.token ?? null;
    return {
      token,
      auth: {
        user_id: s.user?.id ?? null,
        is_guest: Boolean(s.isGuest || s.user?.isGuest),
        provider: s.user?.provider ?? null,
        has_server_token: typeof token === 'string' && token.split('.').length === 3,
        session_expired: Boolean(s.sessionExpired),
      },
    };
  } catch {
    return {
      token: null,
      auth: { user_id: null, is_guest: false, provider: null, has_server_token: false, session_expired: false },
    };
  }
}

/** Sunucudaki kullanıcı verisi sayıları — yerel ile karşılaştırma için (`GET /sync/status`). */
export async function fetchServerSyncStatus(): Promise<ServerSyncStatus | null> {
  const { auth, token } = getAuthSnapshot();
  if (!auth.has_server_token || !token) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_BASE}/sync/status`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    const d = json?.data;
    if (!d) return null;
    return {
      bookmarks: d.bookmarks?.count ?? 0,
      readingHistory: d.reading_history?.count ?? 0,
      distinctVerses: d.reading_history?.distinct_verses ?? 0,
      conceptHistory: d.concept_history?.count ?? 0,
      memorization: d.memorization?.count ?? 0,
      fetchedAt: Date.now(),
    };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

function deviceLabel(): string {
  const c: any = (Platform as any).constants ?? {};
  if (Platform.OS === 'ios') return `${c.systemName ?? 'iOS'} · ${c.interfaceIdiom ?? 'phone'}`;
  if (Platform.OS === 'android') return `${c.Manufacturer ?? ''} ${c.Model ?? ''}`.trim() || 'Android';
  return Platform.OS;
}

export async function buildDiagnosticReport(note?: string): Promise<DiagnosticReport> {
  const { auth } = getAuthSnapshot();
  const [, storage, serverStatus] = await Promise.all([
    checkApiHealth().catch(() => null),
    collectStorageInventory(),
    fetchServerSyncStatus(),
  ]);

  const events = dataFlowMonitor.getEvents().slice(-MAX_EVENTS_IN_REPORT);

  return {
    report_version: REPORT_VERSION,
    generated_at: new Date().toISOString(),
    install_id: getInstallId(),
    user_note: note?.trim() ? note.trim().slice(0, 1000) : undefined,
    app: {
      version: Constants.expoConfig?.version ?? '0.0.0',
      build:
        (Constants.expoConfig?.ios?.buildNumber as string | undefined) ??
        String((Constants as any).nativeBuildVersion ?? ''),
      runtime: __DEV__ ? 'dev' : 'release',
      platform: Platform.OS,
      os_version: String(Platform.Version),
      device: deviceLabel(),
      api_base: API_BASE,
      session_uptime_sec: Math.round((Date.now() - dataFlowMonitor.startedAt) / 1000),
    },
    auth,
    connectivity: getConnectivity(),
    last_sync: dataFlowMonitor.lastSync,
    server_status: serverStatus,
    storage,
    layer_counters: dataFlowMonitor.getCounters(),
    events,
  };
}

/** Raporu sunucuya kaydeder (yalnızca çevrimiçiyken; JWT varsa kullanıcıya bağlanır). */
export async function uploadDiagnosticReport(report: DiagnosticReport): Promise<{ id: string; code: string } | null> {
  const { token, auth } = getAuthSnapshot();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth.has_server_token && token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/diagnostics/reports`, {
      method: 'POST',
      headers,
      body: JSON.stringify(report),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.id ? { id: json.data.id, code: json.data.code } : null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

function buildMailBody(report: DiagnosticReport, code: string | null): string {
  const s = report.storage;
  const lines = [
    'Merhaba Tafsil ekibi,',
    '',
    report.user_note ? `Sorun açıklaması: ${report.user_note}` : 'Sorun açıklaması: (lütfen buraya yaşadığınız sorunu yazın)',
    '',
    '— Tanılama özeti —',
    code ? `Rapor kodu: ${code}` : 'Rapor kodu: (sunucuya iletilemedi — ek dosyayı inceleyin)',
    `Sürüm: v${report.app.version}${report.app.build ? ` (${report.app.build})` : ''} · ${report.app.platform} ${report.app.os_version} · ${report.app.runtime}`,
    `Bağlantı: ${report.connectivity.status} · ağ ${report.connectivity.networkType} · API ${report.connectivity.api.reachable ? `${report.connectivity.api.latencyMs} ms` : 'erişilemiyor'}`,
    `Oturum: ${report.auth.has_server_token ? 'sunucu oturumu var' : report.auth.is_guest ? 'misafir' : 'giriş yok'}${report.auth.session_expired ? ' · süresi dolmuş' : ''}`,
    `Son senkron: ${report.last_sync ? `${new Date(report.last_sync.at).toLocaleString('tr-TR')} · ${report.last_sync.ok ? 'başarılı' : `başarısız (${report.last_sync.error ?? report.last_sync.phase})`}` : 'bu oturumda yok'}`,
    `Yerel veri: ${formatBytes(s.totalBytes)} (KV ${s.l2.keyCount} anahtar · SQLite ${formatBytes(s.l3.totalBytes)} · Ses ${formatBytes(s.l5.totalBytes)})`,
    `Kullanıcı verisi: ${s.userData.readingHistory} okuma · ${s.userData.bookmarks} yer imi · ${s.userData.conceptHistory} kavram · ${s.userData.memorizationSessions} ezber`,
    report.server_status
      ? `Sunucu: ${report.server_status.readingHistory} okuma · ${report.server_status.bookmarks} yer imi · ${report.server_status.conceptHistory} kavram · ${report.server_status.memorization} ezber`
      : 'Sunucu: karşılaştırma yapılamadı',
    `Kayıtlı veri hareketi: ${report.events.length}`,
    '',
    'Ayrıntılı rapor ekteki JSON dosyasındadır. Rapor; oturum anahtarı, e-posta adresi ve okuma içeriği içermez.',
  ];
  return lines.join('\n');
}

export type ShareOutcome = {
  channel: 'mail' | 'share' | 'none';
  status: string;
  code: string | null;
  fileUri: string | null;
};

/**
 * Tanılama raporunu üretir, sunucuya kaydeder ve e-posta ile paylaşır.
 */
export async function shareDiagnosticReport(note?: string): Promise<ShareOutcome> {
  const report = await buildDiagnosticReport(note);
  const uploaded = await uploadDiagnosticReport(report);
  const code = uploaded?.code ?? null;

  const json = JSON.stringify({ ...report, server_report_code: code }, null, 2);
  const fileName = `tafsil-tanilama-${code ?? new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  let fileUri: string | null = null;
  try {
    fileUri = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, json);
  } catch {
    fileUri = null;
  }

  const subject = `Tafsil tanılama raporu${code ? ` #${code}` : ''} (v${report.app.version}${report.app.build ? `/${report.app.build}` : ''})`;
  const body = buildMailBody(report, code);

  try {
    if (await MailComposer.isAvailableAsync()) {
      const result = await MailComposer.composeAsync({
        recipients: [SUPPORT_EMAIL],
        subject,
        body,
        attachments: fileUri ? [fileUri] : undefined,
      });
      return { channel: 'mail', status: result.status, code, fileUri };
    }
  } catch {
    // Mail uygulaması yoksa paylaşım sayfasına düş
  }

  // Fallback: Sistem paylaşım sayfası (Gmail/Outlook/Notlar vb.). iOS dosya eki destekler.
  try {
    const result = await Share.share(
      Platform.OS === 'ios' && fileUri
        ? { url: fileUri, message: `${subject}\n\n${body}` }
        : { title: subject, message: `${subject}\nAlıcı: ${SUPPORT_EMAIL}\n\n${body}\n\n${json.slice(0, 60000)}` },
      { subject }
    );
    return { channel: 'share', status: result.action, code, fileUri };
  } catch {
    return { channel: 'none', status: 'failed', code, fileUri };
  }
}
