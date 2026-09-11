import type { Verse } from '../types';

/**
 * Statik mock veri — Alak Suresi 1-8. MOB-006 (okuma ekranı) geliştirme
 * amaçlı. Arapça metin data-pipeline/uthmani.txt (Tanzil Uthmani) anlık
 * görüntüsünden alınmıştır ve doğrudur.
 *
 * ⚠️ mealTr / transliterationTr alanları YAKLAŞIKTIR ve yalnızca arayüz
 * geliştirme amaçlıdır — resmi içerik değildir. Agent-01'in DP-006
 * (transliterasyon) ve DP-007 (Süleymaniye Vakfı Meali) hatları
 * tamamlandığında src/api/client.ts gerçek BE-007 ucuna geçecek ve bu
 * dosya kaldırılacaktır.
 */
export const mockVersesAlak: Verse[] = [
  {
    id: 6105,
    surahId: 96,
    ayahNo: 1,
    juzNo: 30,
    pageNo: 597,
    textAr: 'ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ',
    transliterationTr: 'İkra\' bismi rabbikellezî halak',
    mealTr: 'Yaratan Rabbinin adıyla oku!',
    audioUrl: null,
  },
  {
    id: 6106,
    surahId: 96,
    ayahNo: 2,
    juzNo: 30,
    pageNo: 597,
    textAr: 'خَلَقَ ٱلْإِنسَٰنَ مِنْ عَلَقٍ',
    transliterationTr: 'Halakal insâne min alak',
    mealTr: 'O, insanı bir "alak"tan yarattı.',
    audioUrl: null,
  },
  {
    id: 6107,
    surahId: 96,
    ayahNo: 3,
    juzNo: 30,
    pageNo: 597,
    textAr: 'ٱقْرَأْ وَرَبُّكَ ٱلْأَكْرَمُ',
    transliterationTr: 'İkra\' ve rabbukel ekrem',
    mealTr: 'Oku! Senin Rabbin en cömert olandır.',
    audioUrl: null,
  },
  {
    id: 6108,
    surahId: 96,
    ayahNo: 4,
    juzNo: 30,
    pageNo: 597,
    textAr: 'ٱلَّذِى عَلَّمَ بِٱلْقَلَمِ',
    transliterationTr: 'Ellezî alleme bil kalem',
    mealTr: 'O, kalemle yazmayı öğretendir.',
    audioUrl: null,
  },
  {
    id: 6109,
    surahId: 96,
    ayahNo: 5,
    juzNo: 30,
    pageNo: 597,
    textAr: 'عَلَّمَ ٱلْإِنسَٰنَ مَا لَمْ يَعْلَمْ',
    transliterationTr: 'Allemel insâne mâ lem ya\'lem',
    mealTr: 'İnsana bilmediğini öğretti.',
    audioUrl: null,
  },
  {
    id: 6110,
    surahId: 96,
    ayahNo: 6,
    juzNo: 30,
    pageNo: 597,
    textAr: 'كَلَّآ إِنَّ ٱلْإِنسَٰنَ لَيَطْغَىٰٓ',
    transliterationTr: 'Kellâ innel insâne le yatgâ',
    mealTr: 'Hayır! Gerçekten insan azgınlık eder,',
    audioUrl: null,
  },
  {
    id: 6111,
    surahId: 96,
    ayahNo: 7,
    juzNo: 30,
    pageNo: 597,
    textAr: 'أَن رَّءَاهُ ٱسْتَغْنَىٰٓ',
    transliterationTr: 'En raâhustagnâ',
    mealTr: 'Kendini ihtiyaçtan uzak (zengin) görmekle.',
    audioUrl: null,
  },
  {
    id: 6112,
    surahId: 96,
    ayahNo: 8,
    juzNo: 30,
    pageNo: 597,
    textAr: 'إِنَّ إِلَىٰ رَبِّكَ ٱلرُّجْعَىٰٓ',
    transliterationTr: 'İnne ilâ rabbiker ruc\'â',
    mealTr: 'Şüphesiz dönüş yalnız Rabbinedir.',
    audioUrl: null,
  },
];

export const mockVersesBySurah: Record<number, Verse[]> = {
  96: mockVersesAlak,
};
