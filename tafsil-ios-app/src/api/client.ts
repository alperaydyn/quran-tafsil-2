import type { ApiResponse, Surah, Verse, Word, RootDerivatives, LexiconRoot } from './types';
import { mockSurahs } from './mock/surahs.mock';
import { mockVersesBySurah } from './mock/verses.mock';
import ayetlerSnapshot from '../data/ayetler.snapshot.json';
import { TimestampService } from '../services/timestampService';
import { localDbService } from '../services/localDbService';
import {
  API_BASE,
  USE_MOCK,
  CLOUDFLARE_R2_BASE_URL,
  getAyahAudioUrl,
  getAyahTimestampUrl,
  getSurahTimestampUrl,
} from './config';

export {
  API_BASE,
  USE_MOCK,
  CLOUDFLARE_R2_BASE_URL,
  getAyahAudioUrl,
  getAyahTimestampUrl,
  getSurahTimestampUrl,
};

function getVersesFromSnapshot(surahId: number): Verse[] {
  const list = (ayetlerSnapshot as any[]).filter((a) => a.s === surahId);
  return list.map((a, idx) => {
    const rawWords: Word[] = typeof a.ar === 'string'
      ? a.ar.split(' ').map((w: string, wIdx: number) => ({
          id: wIdx + 1,
          position: wIdx + 1,
          textAr: w,
          textTr: '',
          rootId: null,
          startMs: 0,
          endMs: 0,
        }))
      : [];

    const words = TimestampService.enrichWordsWithTimestamps(a.s, a.a, rawWords);

    return {
      id: surahId * 1000 + a.a,
      surahId: a.s,
      ayahNo: a.a,
      juzNo: Math.ceil(a.s / 4),
      pageNo: 1,
      textAr: a.ar,
      transliterationTr: a.translit ?? '',
      mealTr: a.tr ?? '',
      audioUrl: getAyahAudioUrl(a.s, a.a),
      words,
    };
  });
}

function mapSurahFromBackend(row: any): Surah {
  return {
    id: row.id,
    nameTr: row.ad_tr ?? row.nameTr ?? `Sure ${row.id}`,
    nameAr: row.ad_ar ?? row.nameAr ?? '',
    revelationOrder: row.nuzul_sirasi ?? row.revelationOrder ?? row.id,
    period: row.donem ?? row.period ?? 'erken_mekke',
    verseCount: row.ayet_sayisi ?? row.verseCount ?? 0,
    summary: row.aciklama ?? row.summary ?? '',
  };
}

function mapVerseFromBackend(row: any): Verse {
  const surahId = row.sure_id ?? row.surahId;
  const ayahNo = row.ayet_no ?? row.ayahNo;
  let words: Word[] = Array.isArray(row.kelimeler)
    ? row.kelimeler.map((k: any, idx: number) => ({
        id: k.id ?? idx + 1,
        position: k.kelime_no ?? k.sira ?? idx + 1,
        textAr: k.metin_ar ?? '',
        textTr: k.metin_tr ?? k.meal_tr ?? '',
        textEn: k.metin_en ?? '',
        rootId: k.kok_id ?? null,
        rootAr: k.kok_ar ?? null,
        rootTr: k.kok_tr ?? null,
        rootMeaning: k.kok_anlami ?? null,
        vezin: k.vezin ?? '',
        startMs: k.start_ms ?? 0,
        endMs: k.end_ms ?? 0,
      }))
    : [];

  // Eğer kelimelerin startMs değerleri 0 ise, offline zaman damgalarıyla zenginleştir
  if (words.length > 0 && words.every((w) => w.startMs === 0 && w.endMs === 0)) {
    words = TimestampService.enrichWordsWithTimestamps(surahId, ayahNo, words);
  }

  return {
    id: row.id,
    surahId,
    ayahNo,
    juzNo: row.cuz_no ?? row.juzNo ?? 1,
    pageNo: row.sayfa_no ?? row.pageNo ?? 1,
    textAr: row.metin_ar ?? row.textAr ?? '',
    transliterationTr: row.transliterasyon_tr ?? row.transliterationTr ?? '',
    mealTr: row.meal_tr ?? row.mealTr ?? '',
    audioUrl: row.ses_dosyasi_url ?? row.audioUrl ?? getAyahAudioUrl(surahId, ayahNo),
    words,
  };
}

export async function getSurahs(siralama: 'mushaf' | 'nuzul' = 'mushaf'): Promise<ApiResponse<Surah[]>> {
  if (USE_MOCK.surahs) {
    return { success: true, data: mockSurahs, meta: { total: mockSurahs.length, cached: false } };
  }

  // 1. Sıfır Gecikmeli Yerel SQLite / Snapshot Sorgusu (PBI-7.3)
  const localList = localDbService.getSurahs(siralama);
  if (localList && localList.length >= 114) {
    return {
      success: true,
      data: localList,
      meta: { total: localList.length, cached: true },
    };
  }

  try {
    const res = await fetch(`${API_BASE}/sureler?siralama=${siralama}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return {
        success: true,
        data: json.data.map(mapSurahFromBackend),
        meta: json.meta,
      };
    }
    return json;
  } catch (err) {
    console.warn('[getSurahs] Ağ çağrısı başarısız, yerel veriye dönülüyor:', err);
    return { success: true, data: localList.length > 0 ? localList : mockSurahs, meta: { total: mockSurahs.length, cached: false } };
  }
}

export async function getVerses(surahId: number, page = 1, limit = 300): Promise<ApiResponse<Verse[]>> {
  if (USE_MOCK.verses) {
    const localVerses = localDbService.getVerses(surahId);
    if (localVerses.length > 0) {
      return { success: true, data: localVerses, meta: { total: localVerses.length, cached: true } };
    }
    const data = mockVersesBySurah[surahId] ?? [];
    return { success: true, data, meta: { total: data.length, cached: false } };
  }

  // 1. Sıfır Gecikmeli Yerel SQLite / Snapshot Sorgusu (PBI-7.3)
  const localVerses = localDbService.getVerses(surahId);
  if (localVerses && localVerses.length > 0) {
    // Çevrimiçi ise arka planda sessizce API'den güncelleme denetimi yap
    fetch(`${API_BASE}/sureler/${surahId}/ayetler?page=${page}&limit=${limit}`, {
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const mapped = json.data.map(mapVerseFromBackend);
            localDbService.upsertVerses(mapped);
          }
        }
      })
      .catch(() => {
        // Sessizce yut, çevrimdışı kullanımda kullanıcı deneyimini etkilemez
      });

    return {
      success: true,
      data: localVerses,
      meta: { total: localVerses.length, cached: true },
    };
  }

  // 2. Yerel veritabanında henüz yoksa ağ üzerinden çek
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${API_BASE}/sureler/${surahId}/ayetler?page=${page}&limit=${limit}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      const verses = json.data.map(mapVerseFromBackend);
      localDbService.upsertVerses(verses);
      return {
        success: true,
        data: verses,
        meta: json.meta,
      };
    }
    throw new Error('Boş API verisi');
  } catch (err) {
    console.warn(`[getVerses] Sure ${surahId} ayetleri API'den çekilemedi (${err}), yerel Kur'an anlık görüntüsüne dönülüyor.`);
    const snapshotData = getVersesFromSnapshot(surahId);
    if (snapshotData.length > 0) {
      return { success: true, data: snapshotData, meta: { total: snapshotData.length, cached: true } };
    }
    const data = mockVersesBySurah[surahId] ?? [];
    return { success: true, data, meta: { total: data.length, cached: false } };
  }
}

export async function getSingleVerse(surahId: number, ayetNo: number): Promise<ApiResponse<Verse>> {
  // 1. Doğrudan yerel SQLite sorgusu (0 ms)
  const localVerse = localDbService.getVerse(surahId, ayetNo);
  if (localVerse) {
    return { success: true, data: localVerse, meta: { total: 1, cached: true } };
  }

  try {
    const res = await fetch(`${API_BASE}/ayetler/${surahId}/${ayetNo}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && json.data) {
      const verse = mapVerseFromBackend(json.data);
      localDbService.upsertVerses([verse]);
      return {
        success: true,
        data: verse,
        meta: json.meta,
      };
    }
    throw new Error('API ayet bulunamadı');
  } catch (err) {
    console.warn(`[getSingleVerse] ${surahId}:${ayetNo} API'den çekilemedi, yerel anlık görüntüye bakılıyor:`, err);
    const snapshotData = getVersesFromSnapshot(surahId);
    const v = snapshotData.find((item) => item.ayahNo === ayetNo);
    if (v) {
      return { success: true, data: v, meta: { total: 1, cached: true } };
    }
    return { success: false, error: { code: 'NETWORK_ERROR', message: 'Ayet yüklenemedi' } };
  }
}

export async function getRootDerivatives(rootId: number): Promise<ApiResponse<RootDerivatives>> {
  try {
    const res = await fetch(`${API_BASE}/kokler/${rootId}/turevler`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && json.data) {
      return { success: true, data: json.data, meta: json.meta };
    }
    throw new Error('Kök türev verisi bulunamadı');
  } catch (err) {
    console.warn(`[getRootDerivatives] Kök ${rootId} türevleri API'den çekilemedi:`, err);
    return { success: false, error: { code: 'NETWORK_ERROR', message: 'Kök verisi yüklenemedi' } };
  }
}

export async function searchRoots(queryText: string): Promise<ApiResponse<LexiconRoot[]>> {
  // Önce yerel SQLite sözlük tablosunda ara
  const localLex = localDbService.getLexiconRoot(queryText);
  if (localLex) {
    const rootItem: LexiconRoot = {
      id: 1,
      kok_ar: localLex.rootAr,
      kok_tr: localLex.rootTr,
      kok_anlami: localLex.rootMeaning,
    };
    return { success: true, data: [rootItem], meta: { total: 1, cached: true } };
  }

  try {
    const res = await fetch(`${API_BASE}/kokler?q=${encodeURIComponent(queryText)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && json.data) {
      return { success: true, data: json.data, meta: json.meta };
    }
    return { success: true, data: [] };
  } catch (err) {
    console.warn(`[searchRoots] '${queryText}' kök araması başarısız:`, err);
    return { success: false, data: [], error: { code: 'NETWORK_ERROR', message: 'Kök araması yapılamadı' } };
  }
}

