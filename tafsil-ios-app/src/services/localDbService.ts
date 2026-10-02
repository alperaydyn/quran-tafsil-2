import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import type { Surah, Verse, Word, NuzulDonemi } from '../api/types';
import { mockSurahs } from '../api/mock/surahs.mock';
import ayetlerSnapshot from '../data/ayetler.snapshot.json';
import { CURATED_LEXICON, type WordLexiconDetail } from '../data/lexicon.seed';
import { CONCEPTS_DICTIONARY, type ConceptDetail } from '../data/concepts.seed';
import { TimestampService } from './timestampService';
import { getAyahAudioUrl } from '../api/config';

export interface LocalDbStats {
  isReady: boolean;
  isSqlite: boolean;
  totalSurahs: number;
  totalVerses: number;
  totalRoots: number;
  totalConcepts: number;
}

const DB_NAME = 'tafsil.db';
const SCHEMA_VERSION = '1.0.0';

class LocalDbServiceImpl {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private isSqliteSupported = true;

  constructor() {
    this.ensureInitialized();
  }

  /**
   * Yerel SQLite veritabanını senkron/asenkron olarak ilklendirir (PBI-7.3).
   * Web veya kısıtlı ortamlarda güvenli şekilde snapshot fallback'e geçer.
   */
  public ensureInitialized(): boolean {
    if (this.isInitialized) return true;

    if (Platform.OS === 'web') {
      this.isSqliteSupported = false;
      this.isInitialized = true;
      return true;
    }

    try {
      this.db = SQLite.openDatabaseSync(DB_NAME);

      // Performans PRAGMA ayarları (WAL modu, bellek önbelleği ve hızlı eşzamanlama)
      this.db.execSync(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA temp_store = MEMORY;
        PRAGMA cache_size = -32000;
      `);

      this.createTables();
      this.seedDataIfNeeded();

      this.isInitialized = true;
      this.isSqliteSupported = true;
      return true;
    } catch (err) {
      console.warn('[LocalDbService] SQLite başlatılamadı, snapshot fallback kullanılacak:', err);
      this.isSqliteSupported = false;
      this.isInitialized = true;
      return false;
    }
  }

  private createTables() {
    if (!this.db) return;

    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS surahs (
        id INTEGER PRIMARY KEY,
        name_tr TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        revelation_order INTEGER NOT NULL,
        period TEXT NOT NULL,
        verse_count INTEGER NOT NULL,
        summary TEXT
      );

      CREATE TABLE IF NOT EXISTS verses (
        id INTEGER PRIMARY KEY,
        surah_id INTEGER NOT NULL,
        ayah_no INTEGER NOT NULL,
        juz_no INTEGER,
        page_no INTEGER,
        text_ar TEXT NOT NULL,
        transliteration_tr TEXT,
        meal_tr TEXT NOT NULL,
        note TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_verses_surah ON verses (surah_id, ayah_no);
      CREATE INDEX IF NOT EXISTS idx_verses_juz ON verses (juz_no);

      CREATE TABLE IF NOT EXISTS lexicon_roots (
        root TEXT PRIMARY KEY,
        arabic_clean TEXT,
        translit TEXT,
        root_ar TEXT,
        root_tr TEXT,
        root_meaning TEXT,
        pos TEXT,
        derivative_count INTEGER DEFAULT 0,
        verse_meaning TEXT,
        verse_alternatives TEXT,
        concept_slug TEXT,
        tier TEXT,
        verified INTEGER DEFAULT 0,
        data_json TEXT
      );

      CREATE TABLE IF NOT EXISTS concepts (
        slug TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        root TEXT,
        root_tr TEXT,
        gloss TEXT,
        use TEXT,
        links_json TEXT
      );

      CREATE TABLE IF NOT EXISTS reading_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surah_id INTEGER NOT NULL,
        ayah_no INTEGER NOT NULL,
        duration_seconds INTEGER DEFAULT 0,
        user_id TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_reading_logs_user ON reading_logs (user_id, created_at DESC);
    `);
  }

  private seedDataIfNeeded() {
    if (!this.db) return;

    const row = this.db.getFirstSync<{ value: string }>(
      'SELECT value FROM meta WHERE key = ?',
      ['schema_version']
    );

    if (row && row.value === SCHEMA_VERSION) {
      // Zaten tohumlandı
      return;
    }

    try {
      this.db.withTransactionSync(() => {
        if (!this.db) return;

        // 1. Sureleri tohumla (114 sure)
        const surahStmt = this.db.prepareSync(`
          INSERT OR REPLACE INTO surahs (id, name_tr, name_ar, revelation_order, period, verse_count, summary)
          VALUES ($id, $name_tr, $name_ar, $revelation_order, $period, $verse_count, $summary)
        `);
        try {
          for (const s of mockSurahs) {
            surahStmt.executeSync({
              $id: s.id,
              $name_tr: s.nameTr,
              $name_ar: s.nameAr,
              $revelation_order: s.revelationOrder,
              $period: s.period,
              $verse_count: s.verseCount,
              $summary: s.summary,
            });
          }
        } finally {
          surahStmt.finalizeSync();
        }

        // 2. Ayetleri tohumla (6,236 ayet - ayetler.snapshot.json)
        const verseStmt = this.db.prepareSync(`
          INSERT OR REPLACE INTO verses (id, surah_id, ayah_no, juz_no, page_no, text_ar, transliteration_tr, meal_tr, note)
          VALUES ($id, $surah_id, $ayah_no, $juz_no, $page_no, $text_ar, $transliteration_tr, $meal_tr, $note)
        `);
        try {
          const snapshotList = ayetlerSnapshot as any[];
          for (const a of snapshotList) {
            const verseId = a.s * 1000 + a.a;
            verseStmt.executeSync({
              $id: verseId,
              $surah_id: a.s,
              $ayah_no: a.a,
              $juz_no: Math.ceil(a.s / 4),
              $page_no: 1,
              $text_ar: a.ar || '',
              $transliteration_tr: a.translit || '',
              $meal_tr: a.tr || '',
              $note: a.note || null,
            });
          }
        } finally {
          verseStmt.finalizeSync();
        }

        // 3. Klasik Sözlük Köklerini tohumla (lexicon.seed.ts)
        const rootStmt = this.db.prepareSync(`
          INSERT OR REPLACE INTO lexicon_roots (
            root, arabic_clean, translit, root_ar, root_tr, root_meaning, pos,
            derivative_count, verse_meaning, verse_alternatives, concept_slug, tier, verified, data_json
          )
          VALUES (
            $root, $arabic_clean, $translit, $root_ar, $root_tr, $root_meaning, $pos,
            $derivative_count, $verse_meaning, $verse_alternatives, $concept_slug, $tier, $verified, $data_json
          )
        `);
        try {
          for (const [key, item] of Object.entries(CURATED_LEXICON)) {
            rootStmt.executeSync({
              $root: key,
              $arabic_clean: item.arabicClean,
              $translit: item.translit,
              $root_ar: item.rootAr,
              $root_tr: item.rootTr,
              $root_meaning: item.rootMeaning,
              $pos: item.pos,
              $derivative_count: item.derivativeCount || 0,
              $verse_meaning: item.verseMeaning,
              $verse_alternatives: item.verseAlternatives || null,
              $concept_slug: item.conceptSlug || null,
              $tier: item.tier || 'curated',
              $verified: item.verified ? 1 : 0,
              $data_json: JSON.stringify(item),
            });
          }
        } finally {
          rootStmt.finalizeSync();
        }

        // 4. Çekirdek Kavramları tohumla (concepts.seed.ts)
        const conceptStmt = this.db.prepareSync(`
          INSERT OR REPLACE INTO concepts (slug, label, root, root_tr, gloss, use, links_json)
          VALUES ($slug, $label, $root, $root_tr, $gloss, $use, $links_json)
        `);
        try {
          for (const [slug, c] of Object.entries(CONCEPTS_DICTIONARY)) {
            conceptStmt.executeSync({
              $slug: slug,
              $label: c.label,
              $root: c.root,
              $root_tr: c.rootTr,
              $gloss: c.gloss,
              $use: c.use,
              $links_json: JSON.stringify(c.links || []),
            });
          }
        } finally {
          conceptStmt.finalizeSync();
        }

        // 5. Meta sürümünü kaydet
        this.db.runSync(
          'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
          ['schema_version', SCHEMA_VERSION]
        );
      });
    } catch (e) {
      console.warn('[LocalDbService] Tohumlama işlemi hatası:', e);
    }
  }

  /**
   * Tüm sureleri yerel SQLite tablosundan döndürür (0 ms gecikme).
   */
  public getSurahs(siralama: 'mushaf' | 'nuzul' = 'mushaf'): Surah[] {
    this.ensureInitialized();

    if (!this.isSqliteSupported || !this.db) {
      return [...mockSurahs].sort((a, b) =>
        siralama === 'nuzul' ? a.revelationOrder - b.revelationOrder : a.id - b.id
      );
    }

    try {
      const orderCol = siralama === 'nuzul' ? 'revelation_order ASC' : 'id ASC';
      const rows = this.db.getAllSync<any>(`SELECT * FROM surahs ORDER BY ${orderCol}`);

      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          nameTr: r.name_tr,
          nameAr: r.name_ar,
          revelationOrder: r.revelation_order,
          period: r.period as NuzulDonemi,
          verseCount: r.verse_count,
          summary: r.summary || '',
        }));
      }
    } catch (e) {
      console.warn('[LocalDbService.getSurahs] SQLite sorgu hatası, mock fallback:', e);
    }

    return [...mockSurahs].sort((a, b) =>
      siralama === 'nuzul' ? a.revelationOrder - b.revelationOrder : a.id - b.id
    );
  }

  /**
   * Tek bir sureyi ID ile çeker.
   */
  public getSurahById(surahId: number): Surah | null {
    this.ensureInitialized();

    if (!this.isSqliteSupported || !this.db) {
      return mockSurahs.find((s) => s.id === surahId) || null;
    }

    try {
      const r = this.db.getFirstSync<any>('SELECT * FROM surahs WHERE id = ?', [surahId]);
      if (r) {
        return {
          id: r.id,
          nameTr: r.name_tr,
          nameAr: r.name_ar,
          revelationOrder: r.revelation_order,
          period: r.period as NuzulDonemi,
          verseCount: r.verse_count,
          summary: r.summary || '',
        };
      }
    } catch (e) {
      console.warn('[LocalDbService.getSurahById] Hata:', e);
    }

    return mockSurahs.find((s) => s.id === surahId) || null;
  }

  /**
   * İlgili surenin ayetlerini yerel SQLite tablosundan kelime zaman damgalarıyla birlikte döndürür.
   */
  public getVerses(surahId: number): Verse[] {
    this.ensureInitialized();

    if (!this.isSqliteSupported || !this.db) {
      return this.getVersesFromMemorySnapshot(surahId);
    }

    try {
      const rows = this.db.getAllSync<any>(
        'SELECT * FROM verses WHERE surah_id = ? ORDER BY ayah_no ASC',
        [surahId]
      );

      if (rows && rows.length > 0) {
        return rows.map((r) => this.mapRowToVerse(r));
      }
    } catch (e) {
      console.warn(`[LocalDbService.getVerses] Sure ${surahId} SQLite hatası, snapshot kullanılıyor:`, e);
    }

    return this.getVersesFromMemorySnapshot(surahId);
  }

  /**
   * Tek bir ayeti yerel SQLite tablosundan döndürür.
   */
  public getVerse(surahId: number, ayahNo: number): Verse | null {
    this.ensureInitialized();

    if (!this.isSqliteSupported || !this.db) {
      const list = this.getVersesFromMemorySnapshot(surahId);
      return list.find((v) => v.ayahNo === ayahNo) || null;
    }

    try {
      const row = this.db.getFirstSync<any>(
        'SELECT * FROM verses WHERE surah_id = ? AND ayah_no = ?',
        [surahId, ayahNo]
      );
      if (row) {
        return this.mapRowToVerse(row);
      }
    } catch (e) {
      console.warn('[LocalDbService.getVerse] Hata:', e);
    }

    const list = this.getVersesFromMemorySnapshot(surahId);
    return list.find((v) => v.ayahNo === ayahNo) || null;
  }

  /**
   * Yerel SQLite üzerinden hızlı ayet araması (Arapça, Meal ve Transliterasyon).
   */
  public searchVerses(
    query: string,
    limit = 30
  ): Array<{ verse: Verse; matchedField: 'meal' | 'arabic' | 'translit' }> {
    this.ensureInitialized();
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    if (!this.isSqliteSupported || !this.db) {
      return this.searchVersesMemory(cleanQuery, limit);
    }

    try {
      const pattern = `%${cleanQuery}%`;
      const rows = this.db.getAllSync<any>(
        `SELECT * FROM verses 
         WHERE meal_tr LIKE ? OR text_ar LIKE ? OR transliteration_tr LIKE ?
         ORDER BY surah_id ASC, ayah_no ASC
         LIMIT ?`,
        [pattern, pattern, pattern, limit]
      );

      return rows.map((r) => {
        const verse = this.mapRowToVerse(r);
        let matchedField: 'meal' | 'arabic' | 'translit' = 'meal';
        if (r.text_ar && r.text_ar.includes(cleanQuery)) matchedField = 'arabic';
        else if (r.transliteration_tr && r.transliteration_tr.toLowerCase().includes(cleanQuery.toLowerCase())) {
          matchedField = 'translit';
        }
        return { verse, matchedField };
      });
    } catch (e) {
      console.warn('[LocalDbService.searchVerses] SQLite arama hatası, memory fallback:', e);
      return this.searchVersesMemory(cleanQuery, limit);
    }
  }

  /**
   * Klasik sözlük ve morfoloji detayını yerel SQLite tablosundan döndürür.
   */
  public getLexiconRoot(wordOrRoot: string): WordLexiconDetail | null {
    this.ensureInitialized();
    if (!wordOrRoot) return null;

    if (!this.isSqliteSupported || !this.db) {
      return CURATED_LEXICON[wordOrRoot] || null;
    }

    try {
      const row = this.db.getFirstSync<any>(
        'SELECT data_json FROM lexicon_roots WHERE root = ? OR arabic_clean = ? OR root_ar = ? OR root_tr = ?',
        [wordOrRoot, wordOrRoot, wordOrRoot, wordOrRoot]
      );
      if (row && row.data_json) {
        return JSON.parse(row.data_json);
      }
    } catch (e) {
      console.warn('[LocalDbService.getLexiconRoot] Hata:', e);
    }

    return CURATED_LEXICON[wordOrRoot] || null;
  }

  /**
   * Kavram detayını yerel SQLite tablosundan döndürür.
   */
  public getConcept(slug: string): ConceptDetail | null {
    this.ensureInitialized();
    if (!slug) return null;

    if (!this.isSqliteSupported || !this.db) {
      return CONCEPTS_DICTIONARY[slug] || null;
    }

    try {
      const row = this.db.getFirstSync<any>('SELECT * FROM concepts WHERE slug = ?', [slug]);
      if (row) {
        return {
          slug: row.slug,
          label: row.label,
          root: row.root || '',
          rootTr: row.root_tr || '',
          gloss: row.gloss || '',
          use: row.use || '',
          links: row.links_json ? JSON.parse(row.links_json) : [],
        };
      }
    } catch (e) {
      console.warn('[LocalDbService.getConcept] Hata:', e);
    }

    return CONCEPTS_DICTIONARY[slug] || null;
  }

  /**
   * Tüm kavramları SQLite tablosundan listeler.
   */
  public getAllConcepts(): ConceptDetail[] {
    this.ensureInitialized();

    if (!this.isSqliteSupported || !this.db) {
      return Object.values(CONCEPTS_DICTIONARY);
    }

    try {
      const rows = this.db.getAllSync<any>('SELECT * FROM concepts ORDER BY label ASC');
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          slug: r.slug,
          label: r.label,
          root: r.root || '',
          rootTr: r.root_tr || '',
          gloss: r.gloss || '',
          use: r.use || '',
          links: r.links_json ? JSON.parse(r.links_json) : [],
        }));
      }
    } catch (e) {
      console.warn('[LocalDbService.getAllConcepts] Hata:', e);
    }

    return Object.values(CONCEPTS_DICTIONARY);
  }

  /**
   * Canlı API'den yeni ayet veya notlar geldiğinde yerel SQLite'ı günceller.
   */
  public upsertVerses(verses: Verse[]) {
    if (!verses || verses.length === 0 || !this.db || !this.isSqliteSupported) return;

    try {
      this.db.withTransactionSync(() => {
        if (!this.db) return;
        const stmt = this.db.prepareSync(`
          INSERT OR REPLACE INTO verses (
            id, surah_id, ayah_no, juz_no, page_no, text_ar, transliteration_tr, meal_tr, note
          )
          VALUES ($id, $surah_id, $ayah_no, $juz_no, $page_no, $text_ar, $transliteration_tr, $meal_tr, $note)
        `);
        try {
          for (const v of verses) {
            stmt.executeSync({
              $id: v.id,
              $surah_id: v.surahId,
              $ayah_no: v.ayahNo,
              $juz_no: v.juzNo || 1,
              $page_no: v.pageNo || 1,
              $text_ar: v.textAr,
              $transliteration_tr: v.transliterationTr || '',
              $meal_tr: v.mealTr,
              $note: v.note || null,
            });
          }
        } finally {
          stmt.finalizeSync();
        }
      });
    } catch (e) {
      console.warn('[LocalDbService.upsertVerses] Hata:', e);
    }
  }

  /**
   * Veritabanı durum ve sağlık göstergeleri.
   */
  public getStats(): LocalDbStats {
    this.ensureInitialized();

    let totalSurahs = mockSurahs.length;
    let totalVerses = (ayetlerSnapshot as any[]).length;
    let totalRoots = Object.keys(CURATED_LEXICON).length;
    let totalConcepts = Object.keys(CONCEPTS_DICTIONARY).length;

    if (this.isSqliteSupported && this.db) {
      try {
        const sRow = this.db.getFirstSync<{ c: number }>('SELECT count(*) as c FROM surahs');
        const vRow = this.db.getFirstSync<{ c: number }>('SELECT count(*) as c FROM verses');
        const rRow = this.db.getFirstSync<{ c: number }>('SELECT count(*) as c FROM lexicon_roots');
        const cRow = this.db.getFirstSync<{ c: number }>('SELECT count(*) as c FROM concepts');

        if (sRow) totalSurahs = sRow.c;
        if (vRow) totalVerses = vRow.c;
        if (rRow) totalRoots = rRow.c;
        if (cRow) totalConcepts = cRow.c;
      } catch (e) {
        // Fallback to constants
      }
    }

    return {
      isReady: this.isInitialized,
      isSqlite: this.isSqliteSupported,
      totalSurahs,
      totalVerses,
      totalRoots,
      totalConcepts,
    };
  }

  // --- Yardımcı İç Dönüştürücüler ---

  private mapRowToVerse(row: any): Verse {
    const surahId = row.surah_id;
    const ayahNo = row.ayah_no;

    const rawWords: Word[] =
      typeof row.text_ar === 'string'
        ? row.text_ar.split(' ').map((w: string, idx: number) => ({
            id: idx + 1,
            position: idx + 1,
            textAr: w,
            textTr: '',
            rootId: null,
            startMs: 0,
            endMs: 0,
          }))
        : [];

    const words = TimestampService.enrichWordsWithTimestamps(surahId, ayahNo, rawWords);

    return {
      id: row.id || surahId * 1000 + ayahNo,
      surahId,
      ayahNo,
      juzNo: row.juz_no || 1,
      pageNo: row.page_no || 1,
      textAr: row.text_ar || '',
      transliterationTr: row.transliteration_tr || '',
      mealTr: row.meal_tr || '',
      audioUrl: getAyahAudioUrl(surahId, ayahNo),
      words,
      note: row.note || undefined,
    };
  }

  private getVersesFromMemorySnapshot(surahId: number): Verse[] {
    const list = (ayetlerSnapshot as any[]).filter((a) => a.s === surahId);
    return list.map((a) => {
      const rawWords: Word[] =
        typeof a.ar === 'string'
          ? a.ar.split(' ').map((w: string, idx: number) => ({
              id: idx + 1,
              position: idx + 1,
              textAr: w,
              textTr: '',
              rootId: null,
              startMs: 0,
              endMs: 0,
            }))
          : [];

      const words = TimestampService.enrichWordsWithTimestamps(a.s, a.a, rawWords);

      return {
        id: a.s * 1000 + a.a,
        surahId: a.s,
        ayahNo: a.a,
        juzNo: Math.ceil(a.s / 4),
        pageNo: 1,
        textAr: a.ar || '',
        transliterationTr: a.translit || '',
        mealTr: a.tr || '',
        audioUrl: getAyahAudioUrl(a.s, a.a),
        words,
        note: a.note || undefined,
      };
    });
  }

  private searchVersesMemory(
    query: string,
    limit: number
  ): Array<{ verse: Verse; matchedField: 'meal' | 'arabic' | 'translit' }> {
    const lower = query.toLowerCase();
    const results: Array<{ verse: Verse; matchedField: 'meal' | 'arabic' | 'translit' }> = [];

    for (const a of ayetlerSnapshot as any[]) {
      let matchedField: 'meal' | 'arabic' | 'translit' | null = null;
      if (a.ar && a.ar.includes(query)) {
        matchedField = 'arabic';
      } else if (a.tr && a.tr.toLowerCase().includes(lower)) {
        matchedField = 'meal';
      } else if (a.translit && a.translit.toLowerCase().includes(lower)) {
        matchedField = 'translit';
      }

      if (matchedField) {
        const verse: Verse = {
          id: a.s * 1000 + a.a,
          surahId: a.s,
          ayahNo: a.a,
          juzNo: Math.ceil(a.s / 4),
          pageNo: 1,
          textAr: a.ar,
          transliterationTr: a.translit || '',
          mealTr: a.tr,
          audioUrl: getAyahAudioUrl(a.s, a.a),
          words: [],
        };
        results.push({ verse, matchedField });
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  /**
   * Kullanıcının ayet okuma hareketini yerel SQLite log tablosuna kaydeder.
   */
  public logReading(surahId: number, ayahNo: number, durationSeconds: number = 0, userId?: string) {
    if (!this.db) return;
    try {
      this.db.runSync(
        `INSERT INTO reading_logs (surah_id, ayah_no, duration_seconds, user_id, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [surahId, ayahNo, durationSeconds, userId || 'guest', new Date().toISOString()]
      );
    } catch (err) {
      console.warn('[LocalDbService.logReading] Log yazma hatası:', err);
    }
  }

  /**
   * Yerel SQLite okuma loglarını çeker.
   */
  public getReadingLogs(userId?: string, limit: number = 50): any[] {
    if (!this.db) return [];
    try {
      if (userId) {
        return this.db.getAllSync(
          'SELECT * FROM reading_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
          [userId, limit]
        );
      }
      return this.db.getAllSync(
        'SELECT * FROM reading_logs ORDER BY created_at DESC LIMIT ?',
        [limit]
      );
    } catch {
      return [];
    }
  }
}

export const localDbService = new LocalDbServiceImpl();
