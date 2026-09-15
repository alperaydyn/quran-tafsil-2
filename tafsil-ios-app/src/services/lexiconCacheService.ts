import { mmkv } from '../store/mmkvStorage';
import type { WordLexiconDetail } from '../data/lexicon.seed';
import { getCuratedLexicon } from '../data/lexicon.seed';

/**
 * Hibrit Lexicon Önbellek Servisi
 *
 * Strateji: Offline-First + Stale-While-Revalidate
 *
 * 1. Önce lokal seed verisi (curated / elle küratörlü) kontrol edilir
 * 2. Yoksa MMKV'deki offline önbellek kontrol edilir
 * 3. Önbellek stale ise (> STALE_DAYS gün), arka planda API'den güncelleme çekilir
 * 4. API'den çekilen veri MMKV'ye yazılır ve anında gösterilir
 *
 * Kullanıcı okudukça kelime verisi locale iner; tekrar girdiğinde indirme tarihi
 * üzerinden parametrik olarak t gün geçtiyse güncelini indirir.
 */

const LEXICON_CACHE_PREFIX = 'lex_v1_';
const LEXICON_META_PREFIX = 'lex_meta_v1_';
/** Varsayılan stale süresi (gün). Ayarlardan değiştirilebilir. */
const DEFAULT_STALE_DAYS = 7;

interface CachedLexiconMeta {
  downloadedAt: string; // ISO tarih
  tier: 'auto' | 'llm';
}

/**
 * Harekeli Arapça metni normalize eder (hareke, med, secavend işaretlerini siler).
 */
function stripDiacritics(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '');
}

/**
 * MMKV'den önbelleklenmiş kelime kaydını oku.
 */
function getCachedLexicon(textAr: string): WordLexiconDetail | null {
  try {
    const key = LEXICON_CACHE_PREFIX + stripDiacritics(textAr);
    const raw = mmkv.getString(key);
    if (raw) {
      return JSON.parse(raw) as WordLexiconDetail;
    }
  } catch {
    // Sessizce devam et
  }
  return null;
}

/**
 * MMKV'ye kelime kaydını yaz.
 */
function setCachedLexicon(textAr: string, data: WordLexiconDetail): void {
  try {
    const cleanKey = stripDiacritics(textAr);
    mmkv.set(LEXICON_CACHE_PREFIX + cleanKey, JSON.stringify(data));
    const meta: CachedLexiconMeta = {
      downloadedAt: new Date().toISOString(),
      tier: data.tier === 'llm' ? 'llm' : 'auto',
    };
    mmkv.set(LEXICON_META_PREFIX + cleanKey, JSON.stringify(meta));
  } catch {
    // Sessizce devam et
  }
}

/**
 * Önbellekteki verinin stale olup olmadığını kontrol eder.
 */
function isCacheStale(textAr: string, staleDays: number = DEFAULT_STALE_DAYS): boolean {
  try {
    const key = LEXICON_META_PREFIX + stripDiacritics(textAr);
    const raw = mmkv.getString(key);
    if (!raw) return true;
    const meta = JSON.parse(raw) as CachedLexiconMeta;
    const downloadedAt = new Date(meta.downloadedAt).getTime();
    const now = Date.now();
    const diffDays = (now - downloadedAt) / (1000 * 60 * 60 * 24);
    return diffDays > staleDays;
  } catch {
    return true;
  }
}

/**
 * API'den kelime verisi çeker (Backend BE-XXX: kelime detay endpoint'i).
 */
async function fetchLexiconFromAPI(
  textAr: string,
  apiBase: string,
): Promise<WordLexiconDetail | null> {
  try {
    const encoded = encodeURIComponent(textAr);
    const res = await fetch(`${apiBase}/kelimeler/lexicon?q=${encoded}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      const detail: WordLexiconDetail = {
        arabicClean: json.data.arabic_clean ?? stripDiacritics(textAr),
        translit: json.data.translit ?? '',
        rootAr: json.data.kok_ar ?? '',
        rootTr: json.data.kok_tr ?? '',
        rootMeaning: json.data.kok_anlami ?? '',
        pos: json.data.pos ?? json.data.vezin ?? 'isim',
        derivativeCount: json.data.turev_sayisi ?? 0,
        verseMeaning: json.data.bu_ayet_anlam ?? '',
        verseAlternatives: json.data.alternatifler ?? undefined,
        conceptSlug: json.data.kavram_slug ?? undefined,
        classicalQuotes: Array.isArray(json.data.sozluk_alintilari)
          ? json.data.sozluk_alintilari.map((q: any) => ({
              source: q.kaynak ?? q.source ?? '',
              author: q.yazar ?? q.author ?? '',
              quote: q.alinti ?? q.quote ?? '',
            }))
          : [],
        distribution: Array.isArray(json.data.dagilim)
          ? json.data.dagilim.map((d: any) => ({
              metin_ar: d.metin_ar ?? '',
              count: d.adet ?? d.count ?? 0,
              vezin: d.vezin ?? undefined,
            }))
          : [],
        tier: json.data.tier ?? 'auto',
        verified: json.data.verified ?? false,
      };
      return detail;
    }
  } catch (err) {
    console.warn(`[LexiconCache] API'den kelime verisi çekilemedi (${textAr}):`, err);
  }
  return null;
}

/**
 * Bir kelime için kök bilgisinden minimal otomatik veri üretir.
 * API ulaşılmazsa ve seed yoksa bu fallback kullanılır.
 */
function buildAutoFallback(textAr: string, rootAr?: string | null, rootTr?: string | null, rootMeaning?: string | null, vezin?: string | null): WordLexiconDetail {
  return {
    arabicClean: stripDiacritics(textAr),
    translit: '',
    rootAr: rootAr ?? '',
    rootTr: rootTr ?? '',
    rootMeaning: rootMeaning ?? '',
    pos: vezin ?? 'isim',
    derivativeCount: 0,
    verseMeaning: '',
    classicalQuotes: [],
    distribution: [],
    tier: 'auto',
    verified: false,
  };
}

// ═══════════════════════════════════════════════════════════════════
// ANA EXPORT: Hibrit Lexicon Servisi
// ═══════════════════════════════════════════════════════════════════

export interface LexiconResult {
  data: WordLexiconDetail;
  source: 'seed' | 'cache' | 'api' | 'fallback';
}

/**
 * Hibrit kelime sözlük verisi döndürür.
 *
 * Öncelik sırası:
 * 1. Curated seed (elle küratörlü, her zaman güncel)
 * 2. MMKV cache (çevrimdışı, stale kontrolü)
 * 3. API fetch (canlı veri)
 * 4. Auto fallback (asgari kök bilgisi)
 *
 * @param staleDays - Önbellek kaç gün sonra yenilensin (varsayılan: 7)
 */
export function getLexiconSync(
  textAr: string,
  wordMeta?: { rootAr?: string | null; rootTr?: string | null; rootMeaning?: string | null; vezin?: string | null },
): LexiconResult {
  // 1. Curated seed — her zaman öncelikli
  const curated = getCuratedLexicon(textAr);
  if (curated) {
    return { data: { ...curated, tier: curated.tier ?? 'curated', verified: curated.verified ?? true }, source: 'seed' };
  }

  // 2. MMKV cache
  const cached = getCachedLexicon(textAr);
  if (cached) {
    return { data: cached, source: 'cache' };
  }

  // 3. Fallback (kök meta bilgisinden minimal)
  if (wordMeta?.rootAr) {
    return {
      data: buildAutoFallback(textAr, wordMeta.rootAr, wordMeta.rootTr, wordMeta.rootMeaning, wordMeta.vezin),
      source: 'fallback',
    };
  }

  // 4. Hiç veri yok
  return {
    data: buildAutoFallback(textAr),
    source: 'fallback',
  };
}

/**
 * Asenkron API çağrısı ile kelime verisini günceller ve cache'e yazar.
 * Stale kontrolü dahildir.
 *
 * @returns Güncellenen veri (varsa), yoksa null
 */
export async function refreshLexiconAsync(
  textAr: string,
  staleDays: number = DEFAULT_STALE_DAYS,
  apiBase?: string,
): Promise<WordLexiconDetail | null> {
  // Curated zaten var ise API'ye gitme
  const curated = getCuratedLexicon(textAr);
  if (curated) return null;

  // Cache stale değilse yenileme yapma
  if (!isCacheStale(textAr, staleDays)) return null;

  const base = apiBase ?? (
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'
  );

  const fromApi = await fetchLexiconFromAPI(textAr, base);
  if (fromApi) {
    setCachedLexicon(textAr, fromApi);
    return fromApi;
  }

  return null;
}

/**
 * Toplu önbellek yenileme: bir ayet içindeki tüm kelimeleri tek seferde günceller.
 * ReadingScreen'de surenin açılışında çağrılabilir.
 */
export async function prefetchLexiconForVerse(
  words: Array<{ textAr: string; rootAr?: string | null; rootTr?: string | null }>,
  staleDays: number = DEFAULT_STALE_DAYS,
  apiBase?: string,
): Promise<void> {
  // Sadece stale olan kelimeleri filtrele
  const staleWords = words.filter((w) => {
    const curated = getCuratedLexicon(w.textAr);
    if (curated) return false;
    return isCacheStale(w.textAr, staleDays);
  });

  if (staleWords.length === 0) return;

  // Arka planda API'den çek (hata sessizce yutulur)
  const base = apiBase ?? (
    process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'
  );

  await Promise.allSettled(
    staleWords.map((w) => fetchLexiconFromAPI(w.textAr, base).then((data) => {
      if (data) setCachedLexicon(w.textAr, data);
    }))
  );
}
