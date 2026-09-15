/**
 * API veri sözleşmeleri — docs/agents/00-MASTER-BLUEPRINT.md §1-4 ile eşleşir.
 * Agent-02 (Backend) BE-004/BE-007 uçlarını yayınladığında bu tipler gerçek
 * yanıt şekliyle doğrulanacak; alan adları DB şemasındaki (`sureler`,
 * `ayetler`, `kelimeler`) TR alan adlarının camelCase karşılıklarıdır.
 */

export type NuzulDonemi = 'erken_mekke' | 'orta_mekke' | 'gec_mekke' | 'medine';

export interface Surah {
  id: number;
  nameTr: string;
  nameAr: string;
  revelationOrder: number;
  period: NuzulDonemi;
  verseCount: number;
  summary: string;
}

export interface Word {
  id: number;
  position: number;
  textAr: string;
  textTr: string;
  textEn?: string;
  rootId: number | null;
  rootAr?: string;
  rootTr?: string;
  rootMeaning?: string;
  vezin?: string;
  startMs: number;
  endMs: number;
}

export interface LexiconRoot {
  id: number;
  kok_ar: string;
  kok_tr: string;
  kok_anlami: string;
}

export interface RootDerivativeItem {
  metin_ar: string;
  count: number;
  vezin?: string;
}

export interface RootVerseOccurrence {
  id: number;
  metin_ar: string;
  metin_tr?: string;
  vezin?: string;
  sure_id: number;
  ayet_no: number;
  kelime_no: number;
}

export interface RootDerivatives {
  kok: LexiconRoot;
  dagilim: RootDerivativeItem[];
  toplam: number;
  turevler: RootVerseOccurrence[];
}


export interface Verse {
  id: number;
  surahId: number;
  ayahNo: number;
  juzNo: number;
  pageNo: number;
  textAr: string;
  transliterationTr: string;
  mealTr: string;
  audioUrl: string | null;
  words?: Word[];
}

export type AuthProvider = 'apple' | 'google';

export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  provider: AuthProvider;
}

/** docs/agents/00-MASTER-BLUEPRINT.md §4 — ortak API yanıt sarmalayıcısı. */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    cached?: boolean;
  };
}
