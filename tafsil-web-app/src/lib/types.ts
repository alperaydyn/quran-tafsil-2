export interface Surah {
  id: number;
  nameTr: string;
  nameAr: string;
  revelationOrder: number;
  period: "erken_mekke" | "orta_mekke" | "gec_mekke" | "medine";
  verseCount: number;
  summary: string;
}

export interface Verse {
  sureId: number;
  ayetNo: number;
  sureNameTr: string;
  sureNameAr: string;
  metinAr: string;
  transliterasyon: string;
  mealTr: string;
}

export interface KavramRef {
  slug: string;
  baslikTr: string;
  tip: "es_anlam" | "zit_anlam" | "kapsama" | "sebep_sonuc" | "iliskili";
}

export interface Kavram {
  slug: string;
  baslikTr: string;
  baslikAr: string;
  tanim: string;
  kategori: string;
  ilkGectigiYer: { sureId: number; ayetNo: number; sureNameTr: string };
  iliskiler: KavramRef[];
}
