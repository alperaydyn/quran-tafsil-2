import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';
import {
  ALL_LAYERS,
  LAYER_META,
  dataFlowMonitor,
  formatBytes,
  type DataFlowEvent,
  type MemoryLayer,
} from '../services/diagnostics/dataFlowMonitor';
import {
  checkApiHealth,
  getConnectivity,
  subscribeConnectivity,
  type ConnectivitySnapshot,
} from '../services/diagnostics/connectivityMonitor';
import { collectStorageInventory, type StorageInventory } from '../services/diagnostics/storageInspector';
import {
  fetchServerSyncStatus,
  shareDiagnosticReport,
  type ServerSyncStatus,
  type ShareOutcome,
} from '../services/diagnostics/diagnosticReport';
import { OfflineSyncService } from '../services/offlineSyncService';
import { SUPPORT_EMAIL, API_BASE } from '../api/config';

/**
 * Veri Akışı & Tanılama Ekranı (PBI-10.1 / PBI-10.2)
 *
 * Geliştirme ve test sürecinde veri hareketlerini yakından izlemek için:
 *  - Çevrimiçi/çevrimdışı + API sağlık durumu
 *  - Bellek katmanı haritası (L1–L5, API, CDN) ve canlı veri hareketi akışı
 *  - Cihazda saklanan veriler ve boyutları, yerel ↔ sunucu karşılaştırması
 *  - Tanılama verisini e-posta ile paylaşma
 */

const HEALTH_POLL_MS = 15000;
const MAX_VISIBLE_EVENTS = 150;

/** Katman renkleri: tema aksanından bağımsız, uyumlu ve birbirinden ayırt edilebilir tonlar. */
const LAYER_COLORS: Record<MemoryLayer, string> = {
  L1_ZUSTAND: '#8E6BBF',
  L2_KV: '#3F8F7A',
  L3_SQLITE: '#4A6FA5',
  L4_SNAPSHOT: '#B0874A',
  L5_FILE: '#B5654A',
  NET_API: '#3E86C6',
  NET_CDN: '#4E9DA8',
  NET_EXT: '#8A857A',
  SYS: '#7A7468',
};

const STATUS_META: Record<ConnectivitySnapshot['status'], { label: string; color: string; hint: string }> = {
  online: { label: 'Çevrimiçi', color: '#3F9B6B', hint: 'Cihaz bağlı ve API yanıt veriyor' },
  offline: { label: 'Çevrimdışı', color: '#C2553F', hint: 'Ağ bağlantısı yok — tüm okuma yerel katmanlardan' },
  api_unreachable: { label: 'API Erişilemiyor', color: '#C98A2E', hint: 'Cihaz bağlı fakat sunucuya ulaşılamıyor' },
  unknown: { label: 'Belirleniyor', color: '#8A857A', hint: 'Bağlantı durumu ölçülüyor…' },
};

const OP_LABEL: Record<DataFlowEvent['op'], string> = {
  read: 'OKU',
  write: 'YAZ',
  delete: 'SİL',
  hit: 'İSABET',
  miss: 'ISKA',
  fallback: 'YEDEK',
  request: 'İSTEK',
  push: 'PUSH',
  pull: 'PULL',
  download: 'İNDİR',
  state: 'DURUM',
};

function useMonitorVersion(): number {
  return useSyncExternalStore(
    useCallback((cb) => dataFlowMonitor.subscribe(cb), []),
    () => dataFlowMonitor.getVersion()
  );
}

function useConnectivity(): ConnectivitySnapshot {
  const [state, setState] = useState(getConnectivity());
  useEffect(() => subscribeConnectivity(setState), []);
  return state;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

function formatAgo(ts: number | null | undefined): string {
  if (!ts) return '—';
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s} sn önce`;
  if (s < 3600) return `${Math.round(s / 60)} dk önce`;
  if (s < 86400) return `${Math.round(s / 3600)} sa önce`;
  return new Date(ts).toLocaleDateString('tr-TR');
}

// ─────────────────────────────────────────────────────────────────────────────
// Yapı taşları
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ eyebrow, title, right }: { eyebrow: string; title: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 28, marginBottom: 12 }}>
      <View style={{ flex: 1 }}>
        <StyledText variant="eyebrow" color="faint">
          {eyebrow.toUpperCase()}
        </StyledText>
        <StyledText variant="headline" style={{ marginTop: 2 }}>
          {title}
        </StyledText>
      </View>
      {right}
    </View>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surf,
          borderRadius: theme.radius.xxl,
          borderWidth: 1,
          borderColor: theme.colors.line,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function Chip({
  label,
  active,
  color,
  onPress,
  testID,
}: {
  label: string;
  active?: boolean;
  color?: string;
  onPress?: () => void;
  testID?: string;
}) {
  const theme = useTheme();
  const c = color ?? theme.colors.acc;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 11,
        paddingVertical: 6,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: active ? c : theme.colors.line,
        backgroundColor: active ? `${c}22` : pressed ? theme.colors.band : 'transparent',
        marginRight: 6,
        marginBottom: 6,
      })}
    >
      <StyledText variant="caption" style={{ color: active ? c : theme.colors.mut }}>
        {label}
      </StyledText>
    </Pressable>
  );
}

function ActionButton({
  label,
  onPress,
  variant = 'secondary',
  loading,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  testID?: string;
}) {
  const theme = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: 18,
        borderRadius: theme.radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        backgroundColor: primary ? theme.colors.ink : 'transparent',
        borderWidth: primary ? 0 : 1,
        borderColor: theme.colors.line,
        opacity: loading ? 0.6 : pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {loading && <ActivityIndicator size="small" color={primary ? theme.colors.surf : theme.colors.ink} />}
      <StyledText variant="callout" style={{ color: primary ? theme.colors.surf : theme.colors.ink }}>
        {label}
      </StyledText>
    </Pressable>
  );
}

function PulseDot({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: color,
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.6] }) }],
        }}
      />
      <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: color }} />
    </View>
  );
}

function KeyValue({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
      <StyledText variant="footnote" color="mut">
        {label}
      </StyledText>
      <StyledText variant="ui" style={{ color: valueColor ?? theme.colors.ink, maxWidth: '62%', textAlign: 'right' }} numberOfLines={1}>
        {value}
      </StyledText>
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={{ height: 1, backgroundColor: theme.colors.line, marginVertical: 10 }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ekran
// ─────────────────────────────────────────────────────────────────────────────

export function DiagnosticsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const version = useMonitorVersion();
  const connectivity = useConnectivity();

  const [inventory, setInventory] = useState<StorageInventory | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerSyncStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareOutcome, setShareOutcome] = useState<ShareOutcome | null>(null);
  const [note, setNote] = useState('');
  const [layerFilter, setLayerFilter] = useState<MemoryLayer | 'ALL'>('ALL');
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [, forceTick] = useState(0);

  const loadInventory = useCallback(async () => {
    const [inv, srv] = await Promise.all([collectStorageInventory(), fetchServerSyncStatus()]);
    setInventory(inv);
    setServerStatus(srv);
  }, []);

  const runHealthCheck = useCallback(async () => {
    setChecking(true);
    await checkApiHealth().catch(() => {});
    setChecking(false);
  }, []);

  useEffect(() => {
    runHealthCheck();
    loadInventory();
    const poll = setInterval(() => {
      checkApiHealth().catch(() => {});
      forceTick((n) => n + 1); // "x sn önce" etiketlerini tazele
    }, HEALTH_POLL_MS);
    return () => clearInterval(poll);
  }, [runHealthCheck, loadInventory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([runHealthCheck(), loadInventory()]);
    setRefreshing(false);
  }, [runHealthCheck, loadInventory]);

  const onSyncNow = useCallback(async () => {
    setSyncing(true);
    await OfflineSyncService.syncWithServer().catch(() => false);
    await loadInventory();
    setSyncing(false);
  }, [loadInventory]);

  const onShare = useCallback(async () => {
    setSharing(true);
    try {
      const outcome = await shareDiagnosticReport(note);
      setShareOutcome(outcome);
      if (outcome.channel === 'none') {
        Alert.alert('Paylaşılamadı', `Lütfen ${SUPPORT_EMAIL} adresine e-posta gönderin.`);
      }
    } catch (e: any) {
      Alert.alert('Rapor oluşturulamadı', String(e?.message ?? e));
    } finally {
      setSharing(false);
    }
  }, [note]);

  const counters = dataFlowMonitor.getCounters();
  const paused = dataFlowMonitor.isPaused();
  const lastSync = dataFlowMonitor.lastSync;

  const visibleEvents = useMemo(() => {
    const all = dataFlowMonitor.getEvents();
    const out: DataFlowEvent[] = [];
    for (let i = all.length - 1; i >= 0 && out.length < MAX_VISIBLE_EVENTS; i--) {
      const e = all[i];
      if (layerFilter !== 'ALL' && e.layer !== layerFilter) continue;
      if (errorsOnly && e.status !== 'error') continue;
      out.push(e);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, layerFilter, errorsOnly]);

  const totalEvents = dataFlowMonitor.getEvents().length;
  const statusMeta = STATUS_META[connectivity.status];

  // Yerel ↔ sunucu karşılaştırma satırları
  const compareRows = inventory
    ? [
        { label: 'Okuma geçmişi', local: inventory.userData.readingHistory, server: serverStatus?.readingHistory },
        { label: 'Yer imleri', local: inventory.userData.bookmarks, server: serverStatus?.bookmarks },
        { label: 'Kavram geçmişi', local: inventory.userData.conceptHistory, server: serverStatus?.conceptHistory },
        { label: 'Ezber oturumları', local: inventory.userData.memorizationSessions, server: serverStatus?.memorization },
      ]
    : [];

  const storageBars = inventory
    ? [
        { layer: 'L2_KV' as MemoryLayer, bytes: inventory.l2.physicalBytes ?? inventory.l2.logicalBytes },
        { layer: 'L3_SQLITE' as MemoryLayer, bytes: inventory.l3.totalBytes },
        { layer: 'L5_FILE' as MemoryLayer, bytes: inventory.l5.totalBytes },
      ]
    : [];
  const storageBarTotal = storageBars.reduce((a, b) => a + b.bytes, 0) || 1;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.mut} />}
      >
        {/* ── Başlık ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
          <Pressable
            testID="diagnostics-back"
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={{
              marginRight: 12,
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.band,
            }}
          >
            <StyledText variant="title" style={{ fontSize: 22, marginTop: -2 }}>
              ‹
            </StyledText>
          </Pressable>
          <View style={{ flex: 1 }}>
            <StyledText variant="eyebrow" color="faint">
              GELİŞTİRME · TEST · DESTEK
            </StyledText>
            <StyledText variant="title">Veri Akışı & Tanılama</StyledText>
          </View>
        </View>

        {/* ── Bağlantı durumu ── */}
        <Card style={{ marginTop: 18, borderColor: `${statusMeta.color}55` }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <PulseDot color={statusMeta.color} />
            <View style={{ flex: 1 }}>
              <StyledText variant="display" style={{ fontSize: 24, lineHeight: 30, color: statusMeta.color }}>
                {statusMeta.label}
              </StyledText>
              <StyledText variant="footnote" color="mut">
                {statusMeta.hint}
              </StyledText>
            </View>
          </View>
          <Divider />
          <KeyValue label="Ağ tipi" value={connectivity.networkType} />
          <KeyValue
            label="Cihaz bağlantısı"
            value={connectivity.isConnected === null ? '—' : connectivity.isConnected ? 'Bağlı' : 'Bağlı değil'}
          />
          <KeyValue
            label="API gecikmesi"
            value={
              connectivity.api.reachable
                ? `${connectivity.api.latencyMs} ms`
                : connectivity.api.reachable === false
                ? connectivity.api.error ?? 'Erişilemiyor'
                : '—'
            }
            valueColor={connectivity.api.reachable === false ? STATUS_META.offline.color : undefined}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
            {(['postgres', 'redis'] as const).map((svc) => {
              const v = connectivity.api[svc];
              const c = v === null ? theme.colors.faint : v ? STATUS_META.online.color : STATUS_META.offline.color;
              return <Chip key={svc} label={`${svc === 'postgres' ? 'PostgreSQL' : 'Redis'} ${v === null ? '·' : v ? '✓' : '✕'}`} active color={c} />;
            })}
            <Chip label={`Kopma: ${connectivity.offlineTransitions}`} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <StyledText variant="caption" color="faint" numberOfLines={1} style={{ flex: 1, marginRight: 10 }}>
              {API_BASE} · {formatAgo(connectivity.api.checkedAt)}
            </StyledText>
            <ActionButton testID="diagnostics-health-check" label="Yeniden Ölç" onPress={runHealthCheck} loading={checking} />
          </View>
        </Card>

        {/* ── Senkronizasyon ── */}
        <SectionHeader
          eyebrow="Two-Way Merge"
          title="Senkronizasyon"
          right={<ActionButton testID="diagnostics-sync-now" label="Şimdi Eşitle" onPress={onSyncNow} loading={syncing} />}
        />
        <Card>
          {lastSync ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: lastSync.ok ? STATUS_META.online.color : lastSync.phase === 'skipped' ? STATUS_META.unknown.color : STATUS_META.offline.color,
                  }}
                />
                <StyledText variant="callout">
                  {lastSync.ok ? 'Başarılı' : lastSync.phase === 'skipped' ? 'Atlandı' : `Başarısız · ${lastSync.phase}`}
                </StyledText>
                <StyledText variant="caption" color="faint">
                  {formatAgo(lastSync.at)} · {lastSync.durationMs} ms
                </StyledText>
              </View>
              {lastSync.error ? (
                <StyledText variant="footnote" color="mut" style={{ marginTop: 6 }}>
                  {lastSync.error}
                </StyledText>
              ) : null}
              {lastSync.pushed || lastSync.pulled ? (
                <StyledText variant="footnote" color="mut" style={{ marginTop: 6 }}>
                  ↑ {lastSync.pushed ? `${lastSync.pushed.history} okuma · ${lastSync.pushed.bookmarks} yer imi · ${lastSync.pushed.concepts} kavram · ${lastSync.pushed.memorization} ezber` : '—'}
                  {'\n'}↓ {lastSync.pulled ? `${lastSync.pulled.history} okuma · ${lastSync.pulled.bookmarks} yer imi · ${lastSync.pulled.concepts} kavram · ${lastSync.pulled.memorization} ezber` : '—'}
                </StyledText>
              ) : null}
            </>
          ) : (
            <StyledText variant="footnote" color="mut">
              Bu oturumda henüz senkronizasyon çalışmadı.
            </StyledText>
          )}
          <KeyValue
            label="Son başarılı senkron (kalıcı)"
            value={inventory?.userData.lastSyncAt ? new Date(inventory.userData.lastSyncAt).toLocaleString('tr-TR') : '—'}
          />
          <Divider />
          <View style={{ flexDirection: 'row', paddingBottom: 6 }}>
            <StyledText variant="eyebrow" color="faint" style={{ flex: 1 }}>
              VERİ
            </StyledText>
            <StyledText variant="eyebrow" color="faint" style={{ width: 70, textAlign: 'right' }}>
              CİHAZ
            </StyledText>
            <StyledText variant="eyebrow" color="faint" style={{ width: 70, textAlign: 'right' }}>
              SUNUCU
            </StyledText>
          </View>
          {compareRows.map((r) => {
            const diff = r.server !== undefined && r.server !== r.local;
            return (
              <View key={r.label} style={{ flexDirection: 'row', paddingVertical: 5 }}>
                <StyledText variant="footnote" color="mut" style={{ flex: 1 }}>
                  {r.label}
                </StyledText>
                <StyledText variant="ui" style={{ width: 70, textAlign: 'right' }}>
                  {r.local}
                </StyledText>
                <StyledText
                  variant="ui"
                  style={{ width: 70, textAlign: 'right', color: diff ? STATUS_META.api_unreachable.color : theme.colors.ink }}
                >
                  {r.server === undefined ? '—' : r.server}
                  {diff ? ' ≠' : ''}
                </StyledText>
              </View>
            );
          })}
          <StyledText variant="caption" color="faint" style={{ marginTop: 6 }}>
            {serverStatus
              ? `Sunucu verisi ${formatAgo(serverStatus.fetchedAt)} alındı. Cihaz son 500 okumayı tutar; farklılık beklenebilir.`
              : 'Sunucu karşılaştırması için giriş yapılmış ve çevrimiçi olunmalı.'}
          </StyledText>
        </Card>

        {/* ── Bellek katmanı haritası ── */}
        <SectionHeader eyebrow="Bellek Katmanları" title="Katman Haritası" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {ALL_LAYERS.filter((l) => l !== 'SYS').map((layer) => {
            const c = counters[layer];
            const color = LAYER_COLORS[layer];
            const lookups = c.hits + c.misses;
            const hitRatio = lookups > 0 ? c.hits / lookups : null;
            const selected = layerFilter === layer;
            return (
              <Pressable
                key={layer}
                testID={`diagnostics-layer-${layer}`}
                onPress={() => setLayerFilter(selected ? 'ALL' : layer)}
                style={({ pressed }) => ({
                  width: '48.5%',
                  marginBottom: 10,
                  padding: 13,
                  borderRadius: theme.radius.xxl,
                  borderWidth: 1,
                  borderColor: selected ? color : theme.colors.line,
                  backgroundColor: selected ? `${color}14` : theme.colors.surf,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: `${color}22` }}>
                    <StyledText variant="caption" style={{ color, fontFamily: theme.font.sansSemiBold }}>
                      {LAYER_META[layer].short}
                    </StyledText>
                  </View>
                  {c.errors > 0 && (
                    <StyledText variant="caption" style={{ color: STATUS_META.offline.color }}>
                      {c.errors} hata
                    </StyledText>
                  )}
                </View>
                <StyledText variant="callout" style={{ marginTop: 8 }}>
                  {LAYER_META[layer].label}
                </StyledText>
                <StyledText variant="caption" color="faint">
                  {LAYER_META[layer].tech}
                </StyledText>
                <StyledText variant="footnote" color="mut" style={{ marginTop: 6 }}>
                  ↓ {c.reads} · ↑ {c.writes}
                  {c.bytesIn + c.bytesOut > 0 ? ` · ${formatBytes(c.bytesIn + c.bytesOut)}` : ''}
                </StyledText>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: theme.colors.band, marginTop: 8, overflow: 'hidden' }}>
                  <View style={{ height: 4, width: `${Math.round((hitRatio ?? 0) * 100)}%`, backgroundColor: color }} />
                </View>
                <StyledText variant="caption" color="faint" style={{ marginTop: 4 }}>
                  {hitRatio === null ? 'isabet oranı —' : `isabet %${Math.round(hitRatio * 100)} (${c.hits}/${lookups})`}
                </StyledText>
              </Pressable>
            );
          })}
        </View>

        {/* ── Canlı veri hareketleri ── */}
        <SectionHeader
          eyebrow={`${totalEvents} kayıt · oturum ${formatAgo(dataFlowMonitor.startedAt).replace(' önce', '')}`}
          title="Canlı Veri Hareketleri"
          right={
            <View style={{ flexDirection: 'row' }}>
              <Chip
                testID="diagnostics-pause"
                label={paused ? '▶ Devam' : '❚❚ Duraklat'}
                active={paused}
                onPress={() => dataFlowMonitor.setPaused(!paused)}
              />
              <Chip testID="diagnostics-clear" label="Temizle" onPress={() => dataFlowMonitor.clear()} />
            </View>
          }
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
          <Chip label="Tümü" active={layerFilter === 'ALL'} onPress={() => setLayerFilter('ALL')} />
          {ALL_LAYERS.map((l) => (
            <Chip
              key={l}
              label={LAYER_META[l].short}
              active={layerFilter === l}
              color={LAYER_COLORS[l]}
              onPress={() => setLayerFilter(layerFilter === l ? 'ALL' : l)}
            />
          ))}
          <Chip label="Yalnız hatalar" active={errorsOnly} color={STATUS_META.offline.color} onPress={() => setErrorsOnly(!errorsOnly)} />
        </ScrollView>
        <Card style={{ paddingVertical: 6, paddingHorizontal: 0 }}>
          {visibleEvents.length === 0 ? (
            <StyledText variant="footnote" color="mut" style={{ padding: 14 }}>
              Henüz kayıt yok. Uygulamada gezinin — her okuma, yazma ve ağ isteği burada belirecek.
            </StyledText>
          ) : (
            visibleEvents.map((e, idx) => {
              const color = LAYER_COLORS[e.layer];
              const statusColor =
                e.status === 'error' ? STATUS_META.offline.color : e.status === 'miss' ? STATUS_META.api_unreachable.color : theme.colors.mut;
              return (
                <View
                  key={e.id}
                  style={{
                    flexDirection: 'row',
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: theme.colors.line,
                    backgroundColor: e.status === 'error' ? `${STATUS_META.offline.color}0D` : 'transparent',
                  }}
                >
                  <View style={{ width: 3, borderRadius: 2, backgroundColor: color, marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <StyledText variant="caption" style={{ color, fontFamily: theme.font.sansSemiBold }}>
                        {LAYER_META[e.layer].short}
                      </StyledText>
                      <StyledText variant="caption" style={{ color: statusColor }}>
                        {OP_LABEL[e.op]}
                      </StyledText>
                      {e.count > 1 && (
                        <StyledText variant="caption" color="faint">
                          ×{e.count}
                        </StyledText>
                      )}
                      <View style={{ flex: 1 }} />
                      <StyledText variant="caption" color="faint">
                        {formatTime(e.ts)}
                      </StyledText>
                    </View>
                    <StyledText variant="footnote" numberOfLines={1} style={{ marginTop: 1 }}>
                      {e.key}
                    </StyledText>
                    {(e.detail || e.durationMs !== undefined || e.bytes) && (
                      <StyledText variant="caption" color="mut" numberOfLines={2} style={{ marginTop: 1 }}>
                        {[
                          e.detail,
                          e.durationMs !== undefined ? `${e.durationMs} ms` : null,
                          e.bytes ? formatBytes(e.bytes) : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </StyledText>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </Card>

        {/* ── Yerel depolama ── */}
        <SectionHeader
          eyebrow="Cihazda Saklanan Veriler"
          title={inventory ? `Yerel Depolama · ${formatBytes(inventory.totalBytes)}` : 'Yerel Depolama'}
          right={<ActionButton testID="diagnostics-rescan" label="Tara" onPress={loadInventory} />}
        />
        {!inventory ? (
          <Card>
            <ActivityIndicator color={theme.colors.mut} />
          </Card>
        ) : (
          <Card>
            {/* Katman dağılım çubuğu */}
            <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: theme.colors.band }}>
              {storageBars.map((b) =>
                b.bytes > 0 ? (
                  <View key={b.layer} style={{ width: `${(b.bytes / storageBarTotal) * 100}%`, backgroundColor: LAYER_COLORS[b.layer] }} />
                ) : null
              )}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 12 }}>
              {storageBars.map((b) => (
                <View key={b.layer} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: LAYER_COLORS[b.layer] }} />
                  <StyledText variant="caption" color="mut">
                    {LAYER_META[b.layer].short} {formatBytes(b.bytes)}
                  </StyledText>
                </View>
              ))}
            </View>
            {inventory.disk.freeBytes !== null && (
              <StyledText variant="caption" color="faint" style={{ marginTop: 8 }}>
                Cihaz boş alanı: {formatBytes(inventory.disk.freeBytes)} / {formatBytes(inventory.disk.totalBytes)}
              </StyledText>
            )}

            <Divider />
            <StyledText variant="eyebrow" style={{ color: LAYER_COLORS.L2_KV }}>
              L2 · ANAHTAR-DEĞER ({inventory.l2.backend.toUpperCase()})
            </StyledText>
            <KeyValue
              label={`${inventory.l2.keyCount} anahtar`}
              value={`${formatBytes(inventory.l2.logicalBytes)}${inventory.l2.physicalBytes ? ` · dosya ${formatBytes(inventory.l2.physicalBytes)}` : ''}`}
            />
            {inventory.l2.groups.map((g) => (
              <KeyValue key={g.id} label={`${g.label}`} value={`${g.keys} · ${formatBytes(g.bytes)}`} />
            ))}
            <StyledText variant="caption" color="faint" style={{ marginTop: 6, marginBottom: 2 }}>
              EN BÜYÜK ANAHTARLAR
            </StyledText>
            {inventory.l2.topKeys.slice(0, 8).map((k) => (
              <KeyValue key={k.key} label={k.key} value={formatBytes(k.bytes)} />
            ))}

            <Divider />
            <StyledText variant="eyebrow" style={{ color: LAYER_COLORS.L3_SQLITE }}>
              L3 · SQLITE ({(inventory.l3.journalMode ?? '—').toUpperCase()})
            </StyledText>
            {inventory.l3.files.map((f) => (
              <KeyValue key={f.name} label={f.name} value={formatBytes(f.bytes)} />
            ))}
            {inventory.l3.tables.map((t) => (
              <KeyValue key={t.table} label={`tablo: ${t.table}`} value={t.rows < 0 ? 'hata' : `${t.rows.toLocaleString('tr-TR')} satır`} />
            ))}

            <Divider />
            <StyledText variant="eyebrow" style={{ color: LAYER_COLORS.L4_SNAPSHOT }}>
              L4 · PAKET SNAPSHOT (UYGULAMA İÇİNDE)
            </StyledText>
            <KeyValue
              label="ayetler.snapshot.json"
              value={`${inventory.l4.verses.toLocaleString('tr-TR')} ayet · ~${formatBytes(inventory.l4.approxBytes)}`}
            />
            <KeyValue label="surahs.seed" value={`${inventory.l4.surahs} sure`} />

            <Divider />
            <StyledText variant="eyebrow" style={{ color: LAYER_COLORS.L5_FILE }}>
              L5 · SES ÖNBELLEĞİ
            </StyledText>
            <KeyValue label={`${inventory.l5.fileCount} dosya`} value={formatBytes(inventory.l5.totalBytes)} />
            {inventory.l5.surahs.slice(0, 6).map((s) => (
              <KeyValue key={s.surahId} label={`Sure ${s.surahId}`} value={`${s.files} ayet · ${formatBytes(s.bytes)}`} />
            ))}

            <Divider />
            <StyledText variant="eyebrow" color="faint">
              KULLANICI VERİSİ (L1 + L2)
            </StyledText>
            <KeyValue label="Okunan ayet (ilerleme)" value={`${inventory.userData.readVersesTotal}`} />
            <KeyValue label="Tamamlanan sure" value={`${inventory.userData.completedSurahs}`} />
            <KeyValue label="Senkron kuyruğu · okuma" value={`${inventory.userData.readingHistory}`} />
            <KeyValue label="Senkron kuyruğu · yer imi" value={`${inventory.userData.bookmarks}`} />
            <KeyValue label="Senkron kuyruğu · kavram" value={`${inventory.userData.conceptHistory}`} />
            <KeyValue label="Senkron kuyruğu · ezber" value={`${inventory.userData.memorizationHistory}`} />
            <KeyValue label="Günlük sayaç (gün)" value={`${inventory.userData.dailyCountDays}`} />
          </Card>
        )}

        {/* ── Paylaşım ── */}
        <SectionHeader eyebrow="Destek" title="Tanılama Verilerini Paylaş" />
        <Card style={{ borderColor: theme.colors.acc }}>
          <StyledText variant="footnote" color="mut">
            Bir sorun yaşıyorsanız raporu bize iletin. Rapor; bağlantı durumu, katman sayaçları, depolama özeti ve son
            veri hareketlerini içerir. Oturum anahtarı, e-posta adresiniz ve okuma içeriğiniz eklenmez.
          </StyledText>
          <TextInput
            testID="diagnostics-note"
            value={note}
            onChangeText={setNote}
            placeholder="Sorunu kısaca anlatın (isteğe bağlı)"
            placeholderTextColor={theme.colors.faint}
            multiline
            maxLength={1000}
            style={{
              marginTop: 12,
              minHeight: 72,
              padding: 12,
              borderRadius: theme.radius.xl ?? 14,
              borderWidth: 1,
              borderColor: theme.colors.line,
              backgroundColor: theme.colors.bg,
              color: theme.colors.ink,
              fontFamily: theme.font.sans,
              fontSize: 13.5,
              textAlignVertical: 'top',
            }}
          />
          <View style={{ marginTop: 12 }}>
            <ActionButton
              testID="diagnostics-share"
              variant="primary"
              label={sharing ? 'Rapor hazırlanıyor…' : 'E-posta ile Paylaş'}
              onPress={onShare}
              loading={sharing}
            />
          </View>
          {shareOutcome && (
            <StyledText variant="caption" color="mut" style={{ marginTop: 10, textAlign: 'center' }}>
              {shareOutcome.code ? `Rapor kodu: ${shareOutcome.code} · ` : 'Sunucuya iletilemedi (ek dosya gönderildi) · '}
              {shareOutcome.channel === 'mail' ? `e-posta: ${shareOutcome.status}` : `paylaşım: ${shareOutcome.status}`}
            </StyledText>
          )}
          <StyledText variant="caption" color="faint" style={{ marginTop: 8, textAlign: 'center' }}>
            Alıcı: {SUPPORT_EMAIL}
          </StyledText>
        </Card>

        <View style={{ height: theme.spacing.xxxl }} />
      </ScrollView>
    </Screen>
  );
}
