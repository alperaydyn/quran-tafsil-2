import { mockSurahs } from '../api/mock/surahs.mock';
import ayetlerSnapshot from '../data/ayetler.snapshot.json';
import { CONCEPTS_DICTIONARY, type ConceptDetail } from '../data/concepts.seed';
import { CURATED_LEXICON, type WordLexiconDetail } from '../data/lexicon.seed';

export interface SurahSearchResult {
  id: number;
  nameTr: string;
  nameAr: string;
  revelationOrder: number;
  period: string;
  verseCount: number;
  summary: string;
  matchReason?: string;
}

export interface VerseSearchResult {
  id: number;
  surahId: number;
  ayahNo: number;
  surahNameTr: string;
  textAr: string;
  mealTr: string;
  transliterationTr?: string;
  specialName?: string;
  matchedField: 'special_name' | 'reference' | 'meal' | 'arabic' | 'translit';
}

export interface RootConceptSearchResult {
  id: string;
  type: 'concept' | 'root';
  title: string;
  slug?: string;
  rootAr: string;
  rootTr: string;
  meaning: string;
  detail?: string;
  usageInfo?: string;
  sampleSurahId?: number;
  sampleAyahNo?: number;
}

export interface SearchCategoryCounts {
  all: number;
  surahs: number;
  verses: number;
  rootsAndConcepts: number;
}

export interface SearchResults {
  query: string;
  counts: SearchCategoryCounts;
  surahs: SurahSearchResult[];
  verses: VerseSearchResult[];
  rootsAndConcepts: RootConceptSearchResult[];
}

/**
 * Türkçe karakterleri ve aksanları arama için standartlaştırır.
 */
export function normalizeTurkish(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[âäáà]/g, 'a')
    .replace(/[îíïì]/g, 'i')
    .replace(/[ûúüù]/g, 'u')
    .replace(/[ôóöò]/g, 'o')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[-_.,;:!?()[\]{}'"`’‘“”]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Arapça hareke ve işaretleri temizler (Tashkeel stripping)
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // Harekeler
    .replace(/[إأآا]/g, 'ا') // Elif türleri
    .replace(/ى/g, 'ي') // Elif maksura
    .replace(/ة/g, 'ه') // Te merbuta
    .replace(/[-_.,;:!?()[\]{}'"`’‘“”]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Özel Ayet İsimleri Sözlüğü (Geleneksel & Meşhur Ayet Adları)
interface SpecialVerseEntry {
  names: string[];
  surahId: number;
  ayahNo: number;
  displayName: string;
}

const SPECIAL_VERSES: SpecialVerseEntry[] = [
  {
    names: ['ayetel kursi', 'ayet el kursi', 'ayetulkursi', 'kursi ayeti'],
    surahId: 2,
    ayahNo: 255,
    displayName: "Âyetü'l-Kürsî (Bakara 255)",
  },
  {
    names: ['amenerrasulu', 'amene r resulu', 'amenerresulu', 'bakara son ayetler'],
    surahId: 2,
    ayahNo: 285,
    displayName: "Âmene'r-Resûlü (Bakara 285)",
  },
  {
    names: ['lev enzelna', 'lev enzelnahaze', 'hasr sonu'],
    surahId: 59,
    ayahNo: 21,
    displayName: "Lev Enzelnâ (Haşr 21)",
  },
  {
    names: ['inna fetahna', 'fetih basi'],
    surahId: 48,
    ayahNo: 1,
    displayName: "İnnâ Fetahnâ (Fetih 1)",
  },
  {
    names: ['vedduha', 'ved duha'],
    surahId: 93,
    ayahNo: 1,
    displayName: "Veddühâ (Duhâ 1)",
  },
  {
    names: ['elemnesrah', 'elem nesrah', 'insirah'],
    surahId: 94,
    ayahNo: 1,
    displayName: "Elem Neşrah (İnşirah 1)",
  },
  {
    names: ['elemtera', 'elem tera', 'fil suresi'],
    surahId: 105,
    ayahNo: 1,
    displayName: "Elem Tera (Fîl 1)",
  },
  {
    names: ['liilafi', 'li ilafi', 'kureys suresi'],
    surahId: 106,
    ayahNo: 1,
    displayName: "Li-Îlâfi (Kureyş 1)",
  },
  {
    names: ['kul huvellahu ehad', 'ihlas suresi'],
    surahId: 112,
    ayahNo: 1,
    displayName: "Kulhüvellâhü Ehad (İhlâs 1)",
  },
  {
    names: ['kul euzu birabbil felak', 'felak suresi'],
    surahId: 113,
    ayahNo: 1,
    displayName: "Felak Suresi (Felak 1)",
  },
  {
    names: ['kul euzu birabbin nas', 'nas suresi'],
    surahId: 114,
    ayahNo: 1,
    displayName: "Nâs Suresi (Nâs 1)",
  },
  {
    names: ['nur ayeti', 'nur kandil'],
    surahId: 24,
    ayahNo: 35,
    displayName: "Nur Ayeti (Nûr 35)",
  },
  {
    names: ['sahadet ayeti', 'sehiddellahu'],
    surahId: 3,
    ayahNo: 18,
    displayName: "Şehadet Ayeti (Âl-i İmrân 18)",
  },
];

// Sure ID ve isim eşleştirmesi için sözlük
const surahMap = new Map<number, (typeof mockSurahs)[0]>();
mockSurahs.forEach((s) => surahMap.set(s.id, s));

// Snapshot verisini normalize edip ram cache yapısı
interface NormalizedSnapshotItem {
  s: number;
  a: number;
  ar: string;
  arClean: string;
  tr: string;
  trClean: string;
  translit?: string;
  translitClean?: string;
}

let cachedSnapshot: NormalizedSnapshotItem[] | null = null;

function getNormalizedSnapshot(): NormalizedSnapshotItem[] {
  if (cachedSnapshot) return cachedSnapshot;
  cachedSnapshot = (ayetlerSnapshot as any[]).map((item) => ({
    s: item.s,
    a: item.a,
    ar: item.ar ?? '',
    arClean: normalizeArabic(item.ar ?? ''),
    tr: (item.tr ?? '').replace(/\[([^\|\]]+)\|([^\]]+)\]/g, '$1'), // [kelime|slug] etiketlerini temizle
    trClean: normalizeTurkish((item.tr ?? '').replace(/\[([^\|\]]+)\|([^\]]+)\]/g, '$1')),
    translit: item.translit,
    translitClean: item.translit ? normalizeTurkish(item.translit) : undefined,
  }));
  return cachedSnapshot;
}

export class SearchService {
  /**
   * Genel Arama Motoru
   * @param rawQuery Kullanıcının arama çubuğuna yazdığı metin
   */
  static search(rawQuery: string): SearchResults {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      return {
        query: '',
        counts: { all: 0, surahs: 0, verses: 0, rootsAndConcepts: 0 },
        surahs: [],
        verses: [],
        rootsAndConcepts: [],
      };
    }

    const normTr = normalizeTurkish(trimmed);
    const normAr = normalizeArabic(trimmed);
    const isPureDigits = /^\d+$/.test(trimmed);

    const surahs: SurahSearchResult[] = [];
    const verses: VerseSearchResult[] = [];
    const rootsAndConcepts: RootConceptSearchResult[] = [];

    // ========================================================
    // 1. KONTROL: Format Eşleşmesi (Sure:Ayet örn: "2:255" veya "Bakara 255")
    // ========================================================
    let directRefMatched = false;
    const refMatch = trimmed.match(/^(\d+)[:./\-\s]+(\d+)$/);
    if (refMatch) {
      const sId = parseInt(refMatch[1], 10);
      const aNo = parseInt(refMatch[2], 10);
      if (sId >= 1 && sId <= 114) {
        const surah = surahMap.get(sId);
        const snapshot = getNormalizedSnapshot();
        const foundVerse = snapshot.find((v) => v.s === sId && v.a === aNo);
        if (foundVerse && surah) {
          verses.push({
            id: sId * 1000 + aNo,
            surahId: sId,
            ayahNo: aNo,
            surahNameTr: surah.nameTr,
            textAr: foundVerse.ar,
            mealTr: foundVerse.tr,
            transliterationTr: foundVerse.translit,
            matchedField: 'reference',
          });
          directRefMatched = true;
        }
      }
    }

    // İsme göre format: "Bakara 255"
    if (!directRefMatched) {
      const nameRefMatch = trimmed.match(/^([a-zA-ZçğıöşüÇĞİÖŞÜâîûÂÎÛ\s'-]+?)\s+(\d+)$/);
      if (nameRefMatch) {
        const namePart = normalizeTurkish(nameRefMatch[1]);
        const ayahNoPart = parseInt(nameRefMatch[2], 10);
        const matchedSurah = mockSurahs.find((s) => normalizeTurkish(s.nameTr) === namePart);
        if (matchedSurah) {
          const snapshot = getNormalizedSnapshot();
          const foundVerse = snapshot.find((v) => v.s === matchedSurah.id && v.a === ayahNoPart);
          if (foundVerse) {
            verses.push({
              id: matchedSurah.id * 1000 + ayahNoPart,
              surahId: matchedSurah.id,
              ayahNo: ayahNoPart,
              surahNameTr: matchedSurah.nameTr,
              textAr: foundVerse.ar,
              mealTr: foundVerse.tr,
              transliterationTr: foundVerse.translit,
              matchedField: 'reference',
            });
            directRefMatched = true;
          }
        }
      }
    }

    // ========================================================
    // 2. KONTROL: Özel Ayet İsimleri (Ayetel Kürsi vb.)
    // ========================================================
    for (const spec of SPECIAL_VERSES) {
      if (spec.names.some((n) => normTr.includes(n) || n.includes(normTr))) {
        const surah = surahMap.get(spec.surahId);
        const snapshot = getNormalizedSnapshot();
        const found = snapshot.find((v) => v.s === spec.surahId && v.a === spec.ayahNo);
        if (found && surah && !verses.some((v) => v.surahId === spec.surahId && v.ayahNo === spec.ayahNo)) {
          verses.push({
            id: spec.surahId * 1000 + spec.ayahNo,
            surahId: spec.surahId,
            ayahNo: spec.ayahNo,
            surahNameTr: surah.nameTr,
            textAr: found.ar,
            mealTr: found.tr,
            transliterationTr: found.translit,
            specialName: spec.displayName,
            matchedField: 'special_name',
          });
        }
      }
    }

    // ========================================================
    // 3. SURELER İÇERİSİNDE ARAMA
    // ========================================================
    for (const s of mockSurahs) {
      const sNameNorm = normalizeTurkish(s.nameTr);
      const sArNorm = normalizeArabic(s.nameAr);
      const sSummaryNorm = normalizeTurkish(s.summary);

      let matched = false;
      let matchReason = '';

      if (isPureDigits && s.id === parseInt(trimmed, 10)) {
        matched = true;
        matchReason = `${s.id}. Sure`;
      } else if (sNameNorm.includes(normTr)) {
        matched = true;
        matchReason = 'Sure adı';
      } else if (normAr.length > 1 && sArNorm.includes(normAr)) {
        matched = true;
        matchReason = 'Arapça sure adı';
      } else if (normTr.length >= 3 && sSummaryNorm.includes(normTr)) {
        matched = true;
        matchReason = 'Sure konusu';
      }

      if (matched) {
        surahs.push({
          id: s.id,
          nameTr: s.nameTr,
          nameAr: s.nameAr,
          revelationOrder: s.revelationOrder,
          period: s.period,
          verseCount: s.verseCount,
          summary: s.summary,
          matchReason,
        });
      }
    }

    // ========================================================
    // 4. KÖKLER & KAVRAMLAR İÇERİSİNDE ARAMA
    // ========================================================
    // 4a. Kavram Sözlüğü (CONCEPTS_DICTIONARY)
    Object.values(CONCEPTS_DICTIONARY).forEach((concept: ConceptDetail) => {
      const labelNorm = normalizeTurkish(concept.label);
      const slugNorm = normalizeTurkish(concept.slug);
      const rootTrNorm = normalizeTurkish(concept.rootTr);
      const rootTrCleanNorm = normalizeTurkish(concept.rootTr.replace(/[-_]/g, ''));
      const rootArNorm = normalizeArabic(concept.root);
      const rootArCleanNorm = normalizeArabic(concept.root.replace(/[-_]/g, ''));
      const glossNorm = normalizeTurkish(concept.gloss);

      let match = false;
      if (
        labelNorm.includes(normTr) ||
        slugNorm.includes(normTr) ||
        rootTrNorm.includes(normTr) ||
        rootTrCleanNorm.includes(normTr) ||
        (normAr.length >= 1 && (rootArNorm.includes(normAr) || rootArCleanNorm.includes(normAr))) ||
        (normTr.length >= 3 && glossNorm.includes(normTr))
      ) {
        match = true;
      }

      if (match) {
        rootsAndConcepts.push({
          id: `concept-${concept.slug}`,
          type: 'concept',
          title: concept.label,
          slug: concept.slug,
          rootAr: concept.root,
          rootTr: concept.rootTr,
          meaning: concept.gloss,
          detail: concept.use,
        });
      }
    });

    // 4b. Morfolojik Kökler (CURATED_LEXICON)
    Object.entries(CURATED_LEXICON).forEach(([wordAr, lex]: [string, WordLexiconDetail]) => {
      const rootTrNorm = normalizeTurkish(lex.rootTr);
      const rootTrCleanNorm = normalizeTurkish(lex.rootTr.replace(/[-_]/g, ''));
      const translitNorm = normalizeTurkish(lex.translit);
      const rootArNorm = normalizeArabic(lex.rootAr);
      const rootArCleanNorm = normalizeArabic(lex.rootAr.replace(/[-_]/g, ''));
      const arabicCleanNorm = normalizeArabic(lex.arabicClean);
      const meaningNorm = normalizeTurkish(lex.rootMeaning);
      const verseMeaningNorm = normalizeTurkish(lex.verseMeaning);

      let match = false;
      if (
        rootTrNorm.includes(normTr) ||
        rootTrCleanNorm.includes(normTr) ||
        translitNorm.includes(normTr) ||
        (normAr.length >= 1 && (rootArNorm.includes(normAr) || rootArCleanNorm.includes(normAr) || arabicCleanNorm.includes(normAr))) ||
        (normTr.length >= 3 && (meaningNorm.includes(normTr) || verseMeaningNorm.includes(normTr)))
      ) {
        match = true;
      }

      if (match && !rootsAndConcepts.some((r) => r.rootTr === lex.rootTr && r.rootAr === lex.rootAr)) {
        rootsAndConcepts.push({
          id: `root-${lex.rootTr}-${lex.arabicClean}`,
          type: 'root',
          title: `${lex.rootAr} (${lex.rootTr})`,
          slug: lex.conceptSlug,
          rootAr: lex.rootAr,
          rootTr: lex.rootTr,
          meaning: lex.rootMeaning,
          detail: `${lex.pos} · ${lex.verseMeaning}`,
          usageInfo: `${lex.derivativeCount} türev form`,
        });
      }
    });

    // ========================================================
    // 5. AYETLER (MEAL, ARAPÇA METİN, OKUNUŞ) İÇERİSİNDE ARAMA
    // ========================================================
    // Sadece en az 2 karakter girildiğinde ayet taraması yapılır (performans ve doğruluk için)
    if (trimmed.length >= 2) {
      const snapshot = getNormalizedSnapshot();
      const MAX_VERSE_RESULTS = 150; // Performans tavanı

      for (const item of snapshot) {
        if (verses.length >= MAX_VERSE_RESULTS) break;

        // Zaten doğrudan eşleşen veya özel ayet olarak eklenmişse atla
        if (verses.some((v) => v.surahId === item.s && v.ayahNo === item.a)) {
          continue;
        }

        let matched = false;
        let matchedField: VerseSearchResult['matchedField'] = 'meal';

        // 1. Türkçe Mealde arama
        if (item.trClean.includes(normTr)) {
          matched = true;
          matchedField = 'meal';
        }
        // 2. Arapça Orijinal Metinde arama
        else if (normAr.length >= 2 && item.arClean.includes(normAr)) {
          matched = true;
          matchedField = 'arabic';
        }
        // 3. Transliterasyonda arama
        else if (item.translitClean && item.translitClean.includes(normTr)) {
          matched = true;
          matchedField = 'translit';
        }

        if (matched) {
          const surah = surahMap.get(item.s);
          verses.push({
            id: item.s * 1000 + item.a,
            surahId: item.s,
            ayahNo: item.a,
            surahNameTr: surah?.nameTr ?? `${item.s}. Sure`,
            textAr: item.ar,
            mealTr: item.tr,
            transliterationTr: item.translit,
            matchedField,
          });
        }
      }
    }

    const counts: SearchCategoryCounts = {
      all: surahs.length + verses.length + rootsAndConcepts.length,
      surahs: surahs.length,
      verses: verses.length,
      rootsAndConcepts: rootsAndConcepts.length,
    };

    return {
      query: trimmed,
      counts,
      surahs,
      verses,
      rootsAndConcepts,
    };
  }
}
