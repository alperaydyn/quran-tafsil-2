/**
 * tafsil.net — Klasik Sözlük ve Morfoloji Veri Tohumu (Offline-First Lexicon Seed)
 *
 * Tasarım Referansı: design/project/Tafsil.dc.html (satır 471-492: #1d Kelime detay sayfası /kelime/alak)
 * Her kelime için:
 * - Bu ayetteki birincil anlam ve alternatif nüanslar
 * - Klasik sözlük kayıtları (el-Müfredât · Râgıb el-İsfahânî, Lisânü'l-Arab · İbn Manzûr)
 * - Kök dağılımı (frekans barları ve türev formlar)
 * - Morfolojik vezin / gramer türü (isim · nekre, fiil, vb.)
 */

export type LexiconTier = 'curated' | 'auto' | 'llm';

export interface ClassicalLexiconEntry {
  source: string;
  author: string;
  quote: string;
}

export interface WordLexiconDetail {
  arabicClean: string;
  translit: string;
  rootAr: string;
  rootTr: string;
  rootMeaning: string;
  pos: string; // örn: "isim · nekre", "fiil · mazi", "harf · cer"
  derivativeCount: number;
  verseMeaning: string; // BU AYETTEKİ ANLAM
  verseAlternatives?: string; // Alternatifler & tarihî kök nüansı
  conceptSlug?: string; // Kavram ağındaki karşılığı
  classicalQuotes: ClassicalLexiconEntry[];
  distribution: Array<{
    metin_ar: string;
    count: number;
    vezin?: string;
  }>;
  /** Verinin kaynağı: curated (elle), auto (DB'den), llm (LLM üretimi) */
  tier?: LexiconTier;
  /** İçerik editoryal olarak doğrulandı mı? */
  verified?: boolean;
}

export const CURATED_LEXICON: Record<string, WordLexiconDetail> = {
  // 96:2 — عَلَقٍ (Alak prototype in Tafsil.dc.html #1d)
  'عَلَقٍ': {
    arabicClean: 'علق',
    translit: 'alak',
    rootAr: 'ع-ل-ق',
    rootTr: 'alq',
    rootMeaning: `Tutunmak, asılmak, bağlanmak; ilişen ve yapışan şey.`,
    pos: 'isim · nekre',
    derivativeCount: 6,
    verseMeaning: `Asılıp tutunan, ilişen şey.`,
    verseAlternatives: `Alternatifler: kan pıhtısı · sülük benzeri · yapışan damla. Kökün ilk anlamı "tutunma"dır; "pıhtı" sonraki dönem sözlüklerinde öne çıkar.`,
    conceptSlug: 'alak',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Bir şeye yapışıp asılı kalmak; kan da bu sebeple alak adını alır."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Alâka: bağ, ilgi. Aynı kökten sevgi bağı da bu kelimeyle anılır."`
      }
    ],
    distribution: [
      { metin_ar: 'عَلَق', count: 2, vezin: "fa'al" },
      { metin_ar: 'عَلَقَة', count: 3, vezin: "fa'alah" },
      { metin_ar: 'عَلِقَ', count: 1, vezin: 'fa\'ila' },
      { metin_ar: 'تَعْلِيق', count: 1, vezin: "tef'îl" },
      { metin_ar: 'عَلاقة', count: 1, vezin: "fi'âlah" },
      { metin_ar: 'مُعَلَّقة', count: 1, vezin: "muf'alah" },
    ]
  },
  'عَلَق': {
    arabicClean: 'علق',
    translit: 'alak',
    rootAr: 'ع-ل-ق',
    rootTr: 'alq',
    rootMeaning: `Tutunmak, asılmak, bağlanmak; ilişen ve yapışan şey.`,
    pos: 'isim · cins',
    derivativeCount: 6,
    verseMeaning: `Asılıp tutunan, ilişen şey.`,
    verseAlternatives: `Alternatifler: kan pıhtısı · sülük benzeri · yapışan damla. Kökün ilk anlamı "tutunma"dır; "pıhtı" sonraki dönem sözlüklerinde öne çıkar.`,
    conceptSlug: 'alak',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Bir şeye yapışıp asılı kalmak; kan da bu sebeple alak adını alır."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Alâka: bağ, ilgi. Aynı kökten sevgi bağı da bu kelimeyle anılır."`
      }
    ],
    distribution: [
      { metin_ar: 'عَلَق', count: 2, vezin: "fa'al" },
      { metin_ar: 'عَلَقَة', count: 3, vezin: "fa'alah" },
      { metin_ar: 'عَلِقَ', count: 1, vezin: 'fa\'ila' },
      { metin_ar: 'تَعْلِيق', count: 1, vezin: "tef'îl" },
      { metin_ar: 'عَلاقة', count: 1, vezin: "fi'âlah" },
      { metin_ar: 'مُعَلَّقة', count: 1, vezin: "muf'alah" },
    ]
  },

  // 96:1 & 96:3 — ٱقْرَأْ (İkra')
  'ٱقْرَأْ': {
    arabicClean: 'اقرا',
    translit: "ikra'",
    rootAr: 'ق-ر-أ',
    rootTr: 'qra',
    rootMeaning: `Toplamak, bir araya getirmek; parçaları birleştirerek anlamlandırmak.`,
    pos: 'fiil · emir',
    derivativeCount: 88,
    verseMeaning: `Parçaları bir araya getirerek, idrak ederek toplayıp oku.`,
    verseAlternatives: `Kökün nüzul dönemindeki ilk anlamı "toplamak ve bir araya getirmek"tir. Harflerin, kelimelerin ve kâinattaki ayetlerin zihinde birleştirilmesi kastedilir.`,
    conceptSlug: 'oku',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Kırâat: harfleri ve kelimeleri birbirine katarak telaffuz etmek ve anlamları bir araya getirmektir."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Kare'e: topladı ve derledi. Okumaya bu adın verilmesi, kelimeleri birbiri peşi sıra dizmesindendir."`
      }
    ],
    distribution: [
      { metin_ar: 'قُرْءَان', count: 68, vezin: "fu'lân" },
      { metin_ar: 'قَرَأَ', count: 14, vezin: 'fa\'ala' },
      { metin_ar: 'ٱقْرَأْ', count: 3, vezin: "if'al" },
      { metin_ar: 'قُرُوء', count: 1, vezin: "fu'ûl" },
      { metin_ar: 'قَارِئ', count: 2, vezin: "fâ'il" },
    ]
  },
  'اقْرَأْ': {
    arabicClean: 'اقرا',
    translit: "ikra'",
    rootAr: 'ق-ر-أ',
    rootTr: 'qra',
    rootMeaning: `Toplamak, bir araya getirmek; parçaları birleştirerek anlamlandırmak.`,
    pos: 'fiil · emir',
    derivativeCount: 88,
    verseMeaning: `Parçaları bir araya getirerek, idrak ederek toplayıp oku.`,
    verseAlternatives: `Kökün nüzul dönemindeki ilk anlamı "toplamak ve bir araya getirmek"tir. Harflerin ve manaların zihinde birleştirilmesi kastedilir.`,
    conceptSlug: 'oku',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Kırâat: harfleri ve kelimeleri birbirine katarak telaffuz etmek ve anlamları bir araya getirmektir."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Kare'e: topladı ve derledi. Okumaya bu adın verilmesi, kelimeleri birbiri peşi sıra dizmesindendir."`
      }
    ],
    distribution: [
      { metin_ar: 'قُرْءَان', count: 68, vezin: "fu'lân" },
      { metin_ar: 'قَرَأَ', count: 14, vezin: 'fa\'ala' },
      { metin_ar: 'ٱقْرَأْ', count: 3, vezin: "if'al" },
      { metin_ar: 'قُرُوء', count: 1, vezin: "fu'ûl" },
      { metin_ar: 'قَارِئ', count: 2, vezin: "fâ'il" },
    ]
  },

  // 96:2 — ٱلْإِنسَٰنَ (İnsan)
  'ٱلْإِنسَٰنَ': {
    arabicClean: 'الانسان',
    translit: 'el-insân',
    rootAr: 'أ-ن-س',
    rootTr: 'ans',
    rootMeaning: `Ünsiyet kuran, alışan, yakınlık duyan ve unutan varlık.`,
    pos: 'isim · marife',
    derivativeCount: 65,
    verseMeaning: `Ünsiyet kurabilen, öğrenmeye ve unutmaya açık insan varlığı.`,
    verseAlternatives: `Kökün iki temel yorumu vardır: Vahşetin zıddı olan "ünsiyet/yakınlık" ve "nisyan/unutma". İnsan hem hemcinsleriyle bağ kurabilen hem de yaratıcısını unutmaya meyilli olandır.`,
    conceptSlug: 'insan',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"İnsan: diğer varlıklarla ünsiyet kurabilen, toplumsal ve tefekkür sahibi varlık."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"İns ve insan: Vahşetin zıddı olan ünsiyetten türetilmiştir; çünkü insan diğerleriyle bir arada bulunmaktan huzur duyar."`
      }
    ],
    distribution: [
      { metin_ar: 'ٱلْإِنسَٰن', count: 65, vezin: "if'âl" },
      { metin_ar: 'إِنس', count: 18, vezin: "fi'l" },
      { metin_ar: 'ءَانَسَ', count: 5, vezin: "af'ala" },
      { metin_ar: 'إِنسِيّ', count: 1, vezin: "fi'liyy" },
    ]
  },
  'الْإِنسَانَ': {
    arabicClean: 'الانسان',
    translit: 'el-insân',
    rootAr: 'أ-ن-س',
    rootTr: 'ans',
    rootMeaning: `Ünsiyet kuran, alışan, yakınlık duyan ve unutan varlık.`,
    pos: 'isim · marife',
    derivativeCount: 65,
    verseMeaning: `Ünsiyet kurabilen, öğrenmeye ve unutmaya açık insan varlığı.`,
    verseAlternatives: `Kökün iki temel yorumu vardır: Vahşetin zıddı olan "ünsiyet/yakınlık" ve "nisyan/unutma". İnsan hem bağ kurabilen hem de yaratıcısını unutmaya meyilli olandır.`,
    conceptSlug: 'insan',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"İnsan: diğer varlıklarla ünsiyet kurabilen, toplumsal ve tefekkür sahibi varlık."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"İns ve insan: Vahşetin zıddı olan ünsiyetten türetilmiştir; çünkü insan diğerleriyle bir arada bulunmaktan huzur duyar."`
      }
    ],
    distribution: [
      { metin_ar: 'ٱلْإِنسَٰن', count: 65, vezin: "if'âl" },
      { metin_ar: 'إِنس', count: 18, vezin: "fi'l" },
      { metin_ar: 'ءَانَسَ', count: 5, vezin: "af'ala" },
      { metin_ar: 'إِنسِيّ', count: 1, vezin: "fi'liyy" },
    ]
  },

  // 96:1 & 96:2 — خَلَقَ (Halaka)
  'خَلَقَ': {
    arabicClean: 'خلق',
    translit: 'halaka',
    rootAr: 'خ-ل-ق',
    rootTr: 'hlq',
    rootMeaning: `Yoktan var etmek, takdir etmek, ölçüp biçerek şekil vermek.`,
    pos: 'fiil · mazi',
    derivativeCount: 261,
    verseMeaning: `Yoktan var eden, yaratılış nizamını ölçü ve hikmetle kuran.`,
    verseAlternatives: `Kökün asıl manası "takdir etmek"tir; yani bir şeyi hikmetli bir ölçü ve maksada göre varlığa çıkarmak.`,
    conceptSlug: 'halk',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Halk: bir şeyi bir örneği olmaksızın ölçüp biçerek varlık alanına çıkarmaktır."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Halaka: takdir etti, pürüzsüzce şekillendirdi ve uyumlu kıldı."`
      }
    ],
    distribution: [
      { metin_ar: 'خَلَقَ', count: 172, vezin: 'fa\'ala' },
      { metin_ar: 'خَلْق', count: 52, vezin: "fa'l" },
      { metin_ar: 'خَٰلِق', count: 11, vezin: "fâ'il" },
      { metin_ar: 'خَلَّٰق', count: 2, vezin: "fa''âl" },
    ]
  },

  // 96:3 — ٱلْأَكْرَمُ (el-Ekrem)
  'ٱلْأَكْرَمُ': {
    arabicClean: 'الاكرم',
    translit: 'el-ekrem',
    rootAr: 'ك-ر-م',
    rootTr: 'krm',
    rootMeaning: `Karşılıksız cömertlik; bir şeye değer atfetme ve şerefli kılma.`,
    pos: 'ism-i tafdîl',
    derivativeCount: 47,
    verseMeaning: `Karşılıksız lütufta bulunan, sonsuz kerem sahibi.`,
    verseAlternatives: `"el-Ekram" ismi Kur'an'da yalnız burada geçer — öğretmenin kendisi ilahi bir kerem ve ikram eylemi olarak sunulur.`,
    conceptSlug: 'kerem',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Kerem: bir varlığın kendi öz niteliğinde taşıdığı şeref ve karşılıksız lütufkârlık."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Kerîm: verdiğinin karşılığını beklemeyen, bağışı bol olan demektir."`
      }
    ],
    distribution: [
      { metin_ar: 'كَرِيم', count: 27, vezin: "fa'îl" },
      { metin_ar: 'أَكْرَم', count: 5, vezin: "af'al" },
      { metin_ar: 'إِكْرَام', count: 2, vezin: "if'âl" },
      { metin_ar: 'كَرَم', count: 3, vezin: "fa'al" },
    ]
  },

  // 96:4 — عَلَّمَ (Alleme)
  'عَلَّمَ': {
    arabicClean: 'علم',
    translit: 'alleme',
    rootAr: 'ع-ل-م',
    rootTr: 'ilm',
    rootMeaning: `Bilmek, bildirmek, iz bırakan alâmetten hareketle kavramak.`,
    pos: 'fiil · tef\'îl',
    derivativeCount: 854,
    verseMeaning: `İz bırakarak, işaret ve vasıtalarla öğretti.`,
    verseAlternatives: `İlim, alâmet (iz/belirti) kökünden gelir. Öğretmek, zihinde silinmez izler ve idrak işaretleri bırakmaktır.`,
    conceptSlug: 'ilim',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"İlim: bir şeyin hakikatini delille kavramak; alâmet (iz/işaret) kökünden gelir."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Âlem ve ilim: Varlığın yaratıcısına işaret eden birer alâmet oluşundan adlandırılmıştır."`
      }
    ],
    distribution: [
      { metin_ar: 'عَلِمَ', count: 382, vezin: 'fa\'ila' },
      { metin_ar: 'عَلِيم', count: 162, vezin: "fa'îl" },
      { metin_ar: 'عَلَّمَ', count: 42, vezin: "fa''ala" },
      { metin_ar: 'عِلْم', count: 105, vezin: "fi'l" },
      { metin_ar: 'عَٰلَمِين', count: 73, vezin: "fâ'ilîn" },
    ]
  },

  // 96:4 — بِٱلْقَلَمِ (bi'l-Kalem)
  'بِٱلْقَلَمِ': {
    arabicClean: 'بالقلم',
    translit: "bi'l-kalem",
    rootAr: 'ق-ل-م',
    rootTr: 'qlm',
    rootMeaning: `Yazı aracı; kesip biçimlendirilmiş şey. Bilginin kayda geçmesi.`,
    pos: 'harf + isim',
    derivativeCount: 4,
    verseMeaning: `Yazı aracı ve kayıt vasıtası olan kalem ile.`,
    verseAlternatives: `Okuma emrinin hemen ardından kalemin zikredilmesi, sözlü vahiy ile yazılı kayıt arasındaki ebedi bağı kurar.`,
    conceptSlug: 'kalem',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Kalem: kesilerek yontulmuş ve yazıya hazır hale getirilmiş kamış; ilmin hafızası."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Kalem: kesmek (kalm) fiilinden türemiştir; kâtiplerin ucunu açtığı yazı aleti."`
      }
    ],
    distribution: [
      { metin_ar: 'ٱلْقَلَم', count: 2, vezin: "fa'al" },
      { metin_ar: 'أَقْلَٰم', count: 2, vezin: "af'âl" },
    ]
  },

  // 1:1 — ٱلرَّحْمَٰنِ (er-Rahmân)
  'ٱلرَّحْمَٰنِ': {
    arabicClean: 'الرحمن',
    translit: 'er-Rahmân',
    rootAr: 'ر-ح-م',
    rootTr: 'rhm',
    rootMeaning: `Kuşatıcı şefkat, lütuf ve esirgeme; varlığın temelindeki ilahi sevgi.`,
    pos: 'sıfat (fa\'lân)',
    derivativeCount: 339,
    verseMeaning: `Varlığı ayrım gözetmeksizin kuşatan, karşılıksız rahmet sahibi.`,
    verseAlternatives: `"Rahmân" vezni (fa'lân) taşan, coşan ve sınır tanımayan bir doluluğu ifade eder. Evrendeki tüm canlıların rızkı ve korunması bu rahmetin tecellisidir.`,
    conceptSlug: 'rahmet',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Rahmet: iyilik yapılan kimseye lütuf ve ihsanda bulunmayı gerektiren kalbî incelik ve şefkattir."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Rahim (ana rahmi) kelimesi de aynı köktendir; akrabalık bağları bu sevgi ve rahmetten beslenir."`
      }
    ],
    distribution: [
      { metin_ar: 'ٱلرَّحْمَٰن', count: 57, vezin: "fa'lân" },
      { metin_ar: 'ٱلرَّحِيم', count: 115, vezin: "fa'îl" },
      { metin_ar: 'رَحْمَة', count: 79, vezin: "fa'lah" },
      { metin_ar: 'يَرْحَمُ', count: 48, vezin: "yaf'alu" },
    ]
  },

  // 1:1 — ٱلرَّحِيمِ (er-Rahîm)
  'ٱلرَّحِيمِ': {
    arabicClean: 'الرحيم',
    translit: 'er-Rahîm',
    rootAr: 'ر-ح-م',
    rootTr: 'rhm',
    rootMeaning: `Sürekli ve kesintisiz merhamet eden, iradesini doğru kullananı ödüllendiren.`,
    pos: 'sıfat (fa\'îl)',
    derivativeCount: 339,
    verseMeaning: `Merhameti kesintisiz süren ve lütfa dönüştüren.`,
    verseAlternatives: `"Rahîm" vezni (fa'îl) süreklilik ve sebat bildirir. Rahmân genel yaratılış rahmeti iken, Rahîm bilinçli yönelen kullara özel hidayet ve ahiret merhametidir.`,
    conceptSlug: 'rahmet',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Rahîm: rahmetini sürekli kılan ve hak edenlere ulaştıran anlamındadır."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Rahmân yalnız Allah için kullanılırken, Rahîm sıfatı şefkatli kullar için de mecazen kullanılabilir."`
      }
    ],
    distribution: [
      { metin_ar: 'ٱلرَّحِيم', count: 115, vezin: "fa'îl" },
      { metin_ar: 'ٱلرَّحْمَٰن', count: 57, vezin: "fa'lân" },
      { metin_ar: 'رَحْمَة', count: 79, vezin: "fa'lah" },
    ]
  },

  // 1:2 — ٱلْحَمْدُ (el-Hamd)
  'ٱلْحَمْدُ': {
    arabicClean: 'الحمد',
    translit: 'el-hamd',
    rootAr: 'ح-م-د',
    rootTr: 'hmd',
    rootMeaning: `Övgü ve rıza; bir varlığın kendi öz niteliğindeki kemalatı takdir etmek.`,
    pos: 'masdar · marife',
    derivativeCount: 68,
    verseMeaning: `Tüm nizam, lütuf ve kemalatın övgüsünü yalnız Allah'a has kılmak.`,
    verseAlternatives: `Hamd, şükürden daha geniştir. Şükür sadece gelen bir nimete karşılık yapılırken, hamd O'nun zatındaki tüm mükemmellik ve güzelliklere karşı duyulan hayranlık ve rızadır.`,
    conceptSlug: 'hamd',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Hamd: bir varlığı kendi iradesiyle ortaya koyduğu iyilik ve güzellik sebebiyle medhetmektir; şükürden daha kapsamlıdır."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Hamd: zıddı zemm (kınama) olan mutlak övgü ve rızadır."`
      }
    ],
    distribution: [
      { metin_ar: 'ٱلْحَمْد', count: 43, vezin: "fa'l" },
      { metin_ar: 'حَمِيد', count: 17, vezin: "fa'îl" },
      { metin_ar: 'مُحَمَّد', count: 4, vezin: "mufa''al" },
      { metin_ar: 'أَحْمَد', count: 1, vezin: "af'al" },
    ]
  },

  // 1:2 — رَبِّ (Rabb)
  'رَبِّ': {
    arabicClean: 'رب',
    translit: 'rabb',
    rootAr: 'ر-ب-ب',
    rootTr: 'rbb',
    rootMeaning: `Adım adım terbiye eden, gözeten, besleyen ve kemale erdiren mutlak sahip.`,
    pos: 'isim',
    derivativeCount: 981,
    verseMeaning: `Varlığı kendi haline terk etmeyip adım adım terbiye eden ve kemale erdiren.`,
    verseAlternatives: `Yaratıcı ile yaratılan arasındaki kesintisiz pedagojik bağı kurar. Anne-babanın çocuğunu yetiştirmesine "terbiye" denmesi de bu köktendir.`,
    conceptSlug: 'rabb',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Rabb: bir şeyi adım adım, derece derece kemal noktasına ulaştıran terbiyeci ve malik."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Rabb: efendi, terbiye eden, gözeten ve ıslah eden anlamındadır."`
      }
    ],
    distribution: [
      { metin_ar: 'رَبّ', count: 975, vezin: "fa'l" },
      { metin_ar: 'رَبَّٰنِيِّين', count: 3, vezin: "fa'lâniyyîn" },
      { metin_ar: 'رِبِّيُّون', count: 1, vezin: "fi'liyyûn" },
    ]
  },
  'رَبِّكَ': {
    arabicClean: 'ربك',
    translit: 'rabbike',
    rootAr: 'ر-ب-ب',
    rootTr: 'rbb',
    rootMeaning: `Adım adım terbiye eden, gözeten, besleyen ve kemale erdiren mutlak sahip.`,
    pos: 'isim + zamir',
    derivativeCount: 981,
    verseMeaning: `Seni adım adım terbiye edip yetiştiren Rabbinin.`,
    verseAlternatives: `Muhatap zamiri (-ke) ile doğrudan hitap: seni koruyan, yetiştiren ve peygamberlikle şereflendiren Rabbin.`,
    conceptSlug: 'rabb',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Rabb: bir şeyi adım adım, derece derece kemal noktasına ulaştıran terbiyeci ve malik."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Rabb: efendi, terbiye eden, gözeten ve ıslah eden anlamındadır."`
      }
    ],
    distribution: [
      { metin_ar: 'رَبّ', count: 975, vezin: "fa'l" },
      { metin_ar: 'رَبَّٰنِيِّين', count: 3, vezin: "fa'lâniyyîn" },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // FATİHA SURESİ (1) — EKSİK KELİMELER
  // ═══════════════════════════════════════════════════════════════════

  // 1:1 — بِسْمِ (bi'smi)
  'بِسْمِ': {
    arabicClean: 'بسم',
    translit: "bi'smi",
    rootAr: 'س-م-و',
    rootTr: 'smw',
    rootMeaning: `Yükselmek, yücelik; isim bir şeyin yükselen ve belirgin kılınan alâmetidir.`,
    pos: 'harf + isim',
    derivativeCount: 22,
    verseMeaning: `İsmiyle başlayarak; O'nun adını anarak ve O'ndan bereket dileyerek.`,
    verseAlternatives: `"İsim" kelimesinin köküne dair iki görüş vardır: "s-m-w" (yücelmek) veya "w-s-m" (alâmet). İsim, bir varlığın özünü işaret eden ve onu tanınır kılan yüce bir alâmettir.`,
    conceptSlug: 'besmele',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"İsim: bir şeye delâlet eden alâmet olup, o şeyi tanıtır ve diğerlerinden ayırt eder."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Semâ: yüceldi, yükseldi. İsim de sahibini yücelten ve belirginleştiren bir alâmettir."`
      }
    ],
    distribution: [
      { metin_ar: 'ٱسْم', count: 14, vezin: "if'l" },
      { metin_ar: 'أَسْمَآء', count: 8, vezin: "af'âl" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 1:1 — ٱللَّهِ (Allah)
  'ٱللَّهِ': {
    arabicClean: 'الله',
    translit: 'Allâh',
    rootAr: 'أ-ل-ه',
    rootTr: 'ilh',
    rootMeaning: `Yönelmek, sığınmak, kulluk etmek; tüm ibadetlerin yöneldiği yegâne Zat.`,
    pos: 'özel isim (ism-i hâss)',
    derivativeCount: 2699,
    verseMeaning: `Her türlü kulluk ve hayranlığın kendisine yöneldiği, tüm kemâl sıfatlarını bünyesinde toplayan yegâne İlah.`,
    verseAlternatives: `İlah kökünden; "veliḥe" (şaşkınlık, hayranlık) ve "elehe" (sığındı, kulluk etti) mastarlarıyla ilişkilidir. "Allah" ismi tüm esmâ-i hüsnânın üst kümesidir.`,
    conceptSlug: 'allah',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Allah: ibadet edilmeye layık olan tek Zat. Bu isim başka hiçbir varlığa verilemez."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"İlah: kendisine sığınılan ve kulluk edilen. Allah lafzı, başındaki 'elif-lam' ile yalnız O'na mahsustur."`
      }
    ],
    distribution: [
      { metin_ar: 'ٱللَّه', count: 2699, vezin: "ism-i hâss" },
      { metin_ar: 'إِلَٰه', count: 147, vezin: "fi'âl" },
      { metin_ar: 'ءَالِهَة', count: 26, vezin: "fâ'ilah" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 1:2 — ٱلْعَٰلَمِينَ (âlemîn)
  'ٱلْعَٰلَمِينَ': {
    arabicClean: 'العالمين',
    translit: 'el-âlemîn',
    rootAr: 'ع-ل-م',
    rootTr: 'ilm',
    rootMeaning: `Bilmek, işaret ve iz bırakmak; âlem, Yaratıcı'nın varlığına işaret eden her şey.`,
    pos: 'isim · cem\' (çoğul)',
    derivativeCount: 854,
    verseMeaning: `Tüm varlık âlemleri: insanlar, cinler, melekler ve kâinattaki her şey.`,
    verseAlternatives: `"Âlem" kelimesi "alâmet" (işaret) kökünden gelir. Her âlem, Yaratıcı'sının varlığına ve sıfatlarına dair bir işarettir.`,
    conceptSlug: 'alem',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Âlem: Yaratıcı'yı tanımaya vesile olan her şeye denir; çünkü her varlık O'nun bir alâmetidir."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Âlem: bir dönemin canlıları ve varlıklarının tamamı; çoğulu 'âlemîn' ile gelir."`
      }
    ],
    distribution: [
      { metin_ar: 'عَٰلَمِين', count: 73, vezin: "fâ'ilîn" },
      { metin_ar: 'عِلْم', count: 105, vezin: "fi'l" },
      { metin_ar: 'عَلَّمَ', count: 42, vezin: "fa''ala" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 1:4 — مَٰلِكِ (mâlik)
  'مَٰلِكِ': {
    arabicClean: 'مالك',
    translit: 'mâlik',
    rootAr: 'م-ل-ك',
    rootTr: 'mlk',
    rootMeaning: `Sahip olmak, hükmetmek, tasarruf etmek; mülkün ve egemenliğin sahibi.`,
    pos: 'ism-i fâil',
    derivativeCount: 206,
    verseMeaning: `Hesap gününün yegâne sahibi ve hâkimi.`,
    verseAlternatives: `"Mâlik" (sahip) ve "Melik" (hükümdar) iki kıraattir. Her ikisi de m-l-k kökünden gelir; biri mülkiyeti, diğeri yönetim otoritesini vurgular.`,
    conceptSlug: 'mulk',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Mülk: bir şey üzerinde mutlak tasarruf ve yönetim hakkı. Mâlik, bu hakkı elinde bulundurandır."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Meleke: sahip oldu, eline aldı. Melik: insanlara hükmeden; Mâlik: bir şeyin sahip ve tasarrufu elinde olan."`
      }
    ],
    distribution: [
      { metin_ar: 'مَٰلِك', count: 2, vezin: "fâ'il" },
      { metin_ar: 'مَلِك', count: 5, vezin: "fa'il" },
      { metin_ar: 'مُلْك', count: 48, vezin: "fu'l" },
      { metin_ar: 'مَلَكُوت', count: 4, vezin: "fa'alût" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 1:4 — يَوْمِ (yevm)
  'يَوْمِ': {
    arabicClean: 'يوم',
    translit: 'yevm',
    rootAr: 'ي-و-م',
    rootTr: 'ywm',
    rootMeaning: `Gün, zaman dilimi; belirli bir dönem veya çağ.`,
    pos: 'isim',
    derivativeCount: 475,
    verseMeaning: `Hesap ve karşılık günü; tüm amellerin tartıya konduğu gün.`,
    verseAlternatives: `"Yevm" Kur'an'da bazen 24 saatlik gün, bazen de "bin yıl" veya "elli bin yıl" sürecek bir dönem anlamında kullanılır.`,
    conceptSlug: 'yevm',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Yevm: güneşin doğuşundan batışına kadarki süre; bazen mutlak bir zaman dilimi olarak da kullanılır."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Yevm: gündüz; çoğulu eyyâm gelir. Bir hadise veya dönemin adı olarak da kullanılır."`
      }
    ],
    distribution: [
      { metin_ar: 'يَوْم', count: 365, vezin: "fa'l" },
      { metin_ar: 'أَيَّام', count: 56, vezin: "af'âl" },
      { metin_ar: 'يَوْمَئِذ', count: 54, vezin: "fa'la-iḏ" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 1:4 — ٱلدِّينِ (ed-dîn)
  'ٱلدِّينِ': {
    arabicClean: 'الدين',
    translit: 'ed-dîn',
    rootAr: 'د-ي-ن',
    rootTr: 'dyn',
    rootMeaning: `Borç, hesap, karşılık; boyun eğme ve itaat; yaşam biçimi ve yol.`,
    pos: 'isim · marife',
    derivativeCount: 101,
    verseMeaning: `Hesap ve karşılık; amellerin tartıya konduğu ve herkesin hak ettiğini aldığı gün.`,
    verseAlternatives: `"Dîn" kelimesi Kur'an'da üç temel anlamda kullanılır: (1) hesap/karşılık, (2) din/yaşam biçimi, (3) boyun eğme/itaat. Bu ayette "hesap günü" anlamındadır.`,
    conceptSlug: 'din',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Dîn: itaat ve boyun eğme; bundan dolayı hesap ve cezaya da dîn denir, çünkü boyun eğilecek bir karşılıktır."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Dâne: boyun eğdi, itaat etti. Dîn: hesap, karşılık ve ceza anlamlarını taşır."`
      }
    ],
    distribution: [
      { metin_ar: 'دِين', count: 92, vezin: "fi'l" },
      { metin_ar: 'دَيْن', count: 5, vezin: "fa'l" },
      { metin_ar: 'مَدِين', count: 3, vezin: "maf'il" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 1:5 — إِيَّاكَ (iyyâke)
  'إِيَّاكَ': {
    arabicClean: 'اياك',
    translit: 'iyyâke',
    rootAr: '—',
    rootTr: '—',
    rootMeaning: `Zamir; yalnız sana / seni vurgulayan bağımsız zamir.`,
    pos: 'zamir · munfasıl',
    derivativeCount: 0,
    verseMeaning: `Yalnız sana (tahsis ve hasr ifadesi).`,
    verseAlternatives: `"İyyâke" zamirinin öne alınması (takdîm), ibadetin yalnız Allah'a ait olduğunu vurgulayan güçlü bir hasr (sınırlandırma) yapısıdır.`,
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"İyyâ: ayrık (munfasıl) zamir olup, fiilin nesnesini vurgulu biçimde öne çıkarır."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"İyyâke: 'yalnız seni' anlamında hasr bildiren bir yapıdır; fiilden önce gelerek tahsisi pekiştirir."`
      }
    ],
    distribution: [],
    tier: 'curated',
    verified: true,
  },

  // 1:5 — نَعْبُدُ (na'budu)
  'نَعْبُدُ': {
    arabicClean: 'نعبد',
    translit: "na'budu",
    rootAr: 'ع-ب-د',
    rootTr: 'abd',
    rootMeaning: `Kulluk etmek, boyun eğmek; en yüce sevgi ve tazimle itaat etmek.`,
    pos: 'fiil · muzâri',
    derivativeCount: 275,
    verseMeaning: `Yalnız sana kulluk ederiz; en yüce sevgi ve itaatle yalnız sana yöneliriz.`,
    verseAlternatives: `"Ubûdiyyet" salt korku değil, sevgi ve tazimin birleşimidir. Kulluk; itaat, huşû ve muhabbetin zirvesidir.`,
    conceptSlug: 'ibadet',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"İbadet: kulluğun en yüce derecesi; sevgi ve tazimle boyun eğmek."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Abede: kulluk etti, itaat etti. Abd: köle ve kul; ibadetin aslı alçakgönüllülük ve teslimiyettir."`
      }
    ],
    distribution: [
      { metin_ar: 'عَبَدَ', count: 143, vezin: "fa'ala" },
      { metin_ar: 'عَبْد', count: 96, vezin: "fa'l" },
      { metin_ar: 'عِبَادَة', count: 5, vezin: "fi'âlah" },
      { metin_ar: 'عِبَاد', count: 96, vezin: "fi'âl" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 1:5 — نَسْتَعِينُ (nesta'în)
  'نَسْتَعِينُ': {
    arabicClean: 'نستعين',
    translit: "nesta'în",
    rootAr: 'ع-و-ن',
    rootTr: 'awn',
    rootMeaning: `Yardım etmek, destek olmak; güç ve kudret kaynağından yardım dilemek.`,
    pos: 'fiil · istif\'âl',
    derivativeCount: 11,
    verseMeaning: `Yalnız senden yardım dileriz; tüm işlerimizde gücümüzü senden alırız.`,
    verseAlternatives: `"İstif'âl" vezni (istiâne) yardım talebinin en güçlü biçimidir. Kulun tüm kudret kaynaklarını bırakıp yalnız Allah'tan güç dilemesidir.`,
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"İstiâne: yardım talep etmek; bir işte aciz kalındığında güç sahibine sığınmak."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Avene: yardım etti. Muâvenet: karşılıklı yardımlaşma; istiâne: yardım dilemek."`
      }
    ],
    distribution: [
      { metin_ar: 'أَعَانَ', count: 3, vezin: "af'ala" },
      { metin_ar: 'ٱسْتَعَانَ', count: 4, vezin: "istaf'ala" },
      { metin_ar: 'عَوْن', count: 2, vezin: "fa'l" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 1:6 — ٱهْدِنَا (ihdinâ)
  'ٱهْدِنَا': {
    arabicClean: 'اهدنا',
    translit: 'ihdinâ',
    rootAr: 'ه-د-ي',
    rootTr: 'hdy',
    rootMeaning: `Doğru yola iletmek, rehberlik etmek; hediye de bu köktendir (kalbi yönlendiren bağ).`,
    pos: 'fiil · emir',
    derivativeCount: 316,
    verseMeaning: `Bizi doğru yola ilet; bize rehberlik et ve yolumuzu aydınlat.`,
    verseAlternatives: `"Hidayet" beş aşamada gerçekleşir: (1) fıtri tanıma, (2) duyu yoluyla anlama, (3) akıl yoluyla kavrama, (4) peygamberler aracılığıyla yönlenme, (5) ahirette cennete ulaştırma.`,
    conceptSlug: 'hidayet',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Hidayet: hedefe ulaştıran yolun nazikçe gösterilmesi; zorlama olmaksızın doğruya yönlendirme."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Hedâ: yol gösterdi, doğruya iletti. Hediye de aynı köktendir: kalbi bir yöne çeken bağ."`
      }
    ],
    distribution: [
      { metin_ar: 'هُدًى', count: 79, vezin: "fu'lan" },
      { metin_ar: 'ٱهْتَدَىٰ', count: 38, vezin: "ifta'alâ" },
      { metin_ar: 'هَدَىٰ', count: 62, vezin: "fa'alâ" },
      { metin_ar: 'هَادِي', count: 4, vezin: "fâ'il" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 1:6 — ٱلصِّرَٰطَ / صِرَٰطَ (sırât)
  'ٱلصِّرَٰطَ': {
    arabicClean: 'الصراط',
    translit: 'eṣ-ṣırâṭ',
    rootAr: 'ص-ر-ط',
    rootTr: 'srt',
    rootMeaning: `Geniş ve açık yol; dosdoğru giden ana cadde.`,
    pos: 'isim · marife',
    derivativeCount: 45,
    verseMeaning: `Dosdoğru yol; sapma ve eğriliği olmayan ana cadde.`,
    verseAlternatives: `"Sırât" kelimesi Farsça "est-râh" (geniş yol) ile de ilişkilendirilir. Kur'an'da hem fiziksel hem de manevî doğru yol anlamında kullanılır.`,
    conceptSlug: 'sirat-i-mustakim',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Sırât: geniş ve engelsiz yol; düz ve sapması olmayan ana tarîk."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Sırât: cadde, açık yol. Es-sırâtu'l-müstakîm: sapması olmayan dosdoğru yol."`
      }
    ],
    distribution: [
      { metin_ar: 'صِرَٰط', count: 45, vezin: "fi'âl" },
    ],
    tier: 'curated',
    verified: true,
  },
  'صِرَٰطَ': {
    arabicClean: 'صراط',
    translit: 'ṣırâṭ',
    rootAr: 'ص-ر-ط',
    rootTr: 'srt',
    rootMeaning: `Geniş ve açık yol; dosdoğru giden ana cadde.`,
    pos: 'isim · izâfe',
    derivativeCount: 45,
    verseMeaning: `(Nimet verilenlerin) yoluna — onların takip ettiği doğru güzergâh.`,
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Sırât: geniş ve engelsiz yol; düz ve sapması olmayan ana tarîk."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Sırât: cadde, açık yol. Es-sırâtu'l-müstakîm: sapması olmayan dosdoğru yol."`
      }
    ],
    distribution: [
      { metin_ar: 'صِرَٰط', count: 45, vezin: "fi'âl" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 1:6 — ٱلْمُسْتَقِيمَ (müstakîm)
  'ٱلْمُسْتَقِيمَ': {
    arabicClean: 'المستقيم',
    translit: 'el-müstakîm',
    rootAr: 'ق-و-م',
    rootTr: 'qwm',
    rootMeaning: `Kalkmak, dikilmek, dosdoğru olmak; doğruluk ve istikamet.`,
    pos: 'ism-i fâil (istif\'âl)',
    derivativeCount: 659,
    verseMeaning: `Dosdoğru olan; eğriliği ve sapması bulunmayan.`,
    verseAlternatives: `"Kıyâm" kökünden: namaz (salât), kıyamet (son kalkış), kavim (bir arada kalkıp duran topluluk) hep bu köktendir.`,
    conceptSlug: 'sirat-i-mustakim',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"İstikâmet: bir hat üzerinde sapma olmaksızın dosdoğru gitmek."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Kâme: kalktı, dikildi, doğruldu. Müstakîm: istikamet üzere olan, eğrilmesi olmayan."`
      }
    ],
    distribution: [
      { metin_ar: 'مُسْتَقِيم', count: 37, vezin: "mustaf'il" },
      { metin_ar: 'قَامَ', count: 52, vezin: "fâ'ala" },
      { metin_ar: 'أَقَامَ', count: 67, vezin: "af'ala" },
      { metin_ar: 'قِيَامَة', count: 70, vezin: "fi'âlah" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 1:7 — ٱلْمَغْضُوبِ (mağdûb)
  'ٱلْمَغْضُوبِ': {
    arabicClean: 'المغضوب',
    translit: 'el-mağdûb',
    rootAr: 'غ-ض-ب',
    rootTr: 'ğdb',
    rootMeaning: `Öfkelenmek, kızmak; hak edilen cezanın ilahi iradeyle tezahürü.`,
    pos: 'ism-i mef\'ûl',
    derivativeCount: 24,
    verseMeaning: `Gazaba uğrayan; ilahi cezayı hak eden.`,
    verseAlternatives: `"Gadab" salt öfke değil; hakikati bildiği halde bilinçli olarak ona sırt dönenlere yöneltilen ilahi tutumdur.`,
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Gadab: razı olmanın (rıza) zıddı; hak edilmiş cezanın irâdesi."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Gadibe: öfkelendi. İlahi gadab: hakikati reddedenlerin cezayı hak etmesidir."`
      }
    ],
    distribution: [
      { metin_ar: 'غَضِبَ', count: 14, vezin: "fa'ila" },
      { metin_ar: 'غَضَب', count: 7, vezin: "fa'al" },
      { metin_ar: 'مَغْضُوب', count: 1, vezin: "maf'ûl" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 1:7 — ٱلضَّآلِّينَ (dâllîn)
  'ٱلضَّآلِّينَ': {
    arabicClean: 'الضالين',
    translit: 'eḍ-ḍâllîn',
    rootAr: 'ض-ل-ل',
    rootTr: 'dll',
    rootMeaning: `Yolunu kaybetmek, sapmak; doğru yoldan uzaklaşmak.`,
    pos: 'ism-i fâil · cem\'',
    derivativeCount: 191,
    verseMeaning: `Doğru yoldan sapanlar; hakikati gördüğü halde veya bilmediği için yolunu kaybedenler.`,
    verseAlternatives: `"Dalâlet" iki türdür: (1) bile bile sapma (inad), (2) bilmeden yolunu kaybetme (cehalet). Fatiha'da her iki türe de sığınılır.`,
    conceptSlug: 'dalalet',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Dalâlet: doğru yoldan ayrılmak; kasıtlı veya kasıtsız olabilir."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Dalle: yolunu kaybetti, saptı. Dalâl: hidayetin zıddıdır."`
      }
    ],
    distribution: [
      { metin_ar: 'ضَلَّ', count: 86, vezin: "fa'la" },
      { metin_ar: 'ضَلَٰلَة', count: 32, vezin: "fa'âlah" },
      { metin_ar: 'ضَالّ', count: 14, vezin: "fâ'll" },
      { metin_ar: 'أَضَلَّ', count: 39, vezin: "af'alla" },
    ],
    tier: 'curated',
    verified: true,
  },

  // ═══════════════════════════════════════════════════════════════════
  // ALAK SURESİ (96) — EKSİK ANAHTAR KELİMELER
  // ═══════════════════════════════════════════════════════════════════

  // 96:1 — بِٱسْمِ (bi-smi)
  'بِٱسْمِ': {
    arabicClean: 'باسم',
    translit: "bi'smi",
    rootAr: 'س-م-و',
    rootTr: 'smw',
    rootMeaning: `Yükselmek, yücelik; isim bir şeyin yükselen ve belirgin kılınan alâmetidir.`,
    pos: 'harf + isim',
    derivativeCount: 22,
    verseMeaning: `Rabbinin ismiyle oku; O'nun adını anarak başla.`,
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"İsim: bir şeye delâlet eden alâmet olup, o şeyi tanıtır ve diğerlerinden ayırt eder."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Semâ: yüceldi. İsim sahibini belirginleştiren ve yücelten bir alâmettir."`
      }
    ],
    distribution: [
      { metin_ar: 'ٱسْم', count: 14, vezin: "if'l" },
      { metin_ar: 'أَسْمَآء', count: 8, vezin: "af'âl" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 96:5 — مَا لَمْ يَعْلَمْ → عَلَّمَ zaten var, لَمْ/مَا harfler

  // 96:6 — كَلَّا (kellâ)
  'كَلَّا': {
    arabicClean: 'كلا',
    translit: 'kellâ',
    rootAr: '—',
    rootTr: '—',
    rootMeaning: `Kesinlikle hayır! Sert reddetme ve uyarı edatı.`,
    pos: 'harf · red ve zecr',
    derivativeCount: 0,
    verseMeaning: `Hayır, kesinlikle öyle değil! (Daha önceki yanlış tutumu şiddetle reddeder.)`,
    verseAlternatives: `"Kellâ" Kur'an'da yalnız Mekkî surelerde geçer (33 kez). Hem önceki ifadeyi reddeder hem de sonraki uyarıyı başlatır.`,
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Kellâ: reddiye ve zecr (uyarı) edatıdır; bir söze 'asla öyle değil!' diye karşılık verir."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Kellâ: men etme ve kınama harfi; ardından gelen cümleyi 'dikkat edin!' diye açar."`
      }
    ],
    distribution: [],
    tier: 'curated',
    verified: true,
  },
  'كَلَّآ': {
    arabicClean: 'كلا',
    translit: 'kellâ',
    rootAr: '—',
    rootTr: '—',
    rootMeaning: `Kesinlikle hayır! Sert reddetme ve uyarı edatı.`,
    pos: 'harf · red ve zecr',
    derivativeCount: 0,
    verseMeaning: `Hayır, kesinlikle öyle değil!`,
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Kellâ: reddiye ve zecr edatıdır; 'asla öyle değil!' diye karşılık verir."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Kellâ: men etme ve kınama harfi; ardından gelen cümleyi açar."`
      }
    ],
    distribution: [],
    tier: 'curated',
    verified: true,
  },

  // 96:6 — لَيَطْغَىٰٓ / 96:7 — ٱسْتَغْنَىٰٓ (tuğyân / istiğnâ)
  'لَيَطْغَىٰٓ': {
    arabicClean: 'ليطغى',
    translit: 'le-yetğâ',
    rootAr: 'ط-غ-ي',
    rootTr: 'tğy',
    rootMeaning: `Haddi aşmak, taşkınlık yapmak, azgınlık.`,
    pos: 'fiil · muzâri (te\'kîd lâm)',
    derivativeCount: 39,
    verseMeaning: `İnsan muhakkak azgınlık eder; haddini aşar ve sınırlarını tanımaz.`,
    verseAlternatives: `"Tuğyân" suyun taşması kökünden gelir. Maddi-manevî sınırın aşılması: güç, servet veya kibir sarhoşluğuyla hakikati reddetme.`,
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Tuğyân: her şeyde haddini aşmak; suyun taşması gibi kontrolsüz taşkınlık."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Tağâ: haddini aştı, azdı. Tâğût: azgınlıkta en ileri giden."`
      }
    ],
    distribution: [
      { metin_ar: 'طَغَىٰ', count: 12, vezin: "fa'alâ" },
      { metin_ar: 'طُغْيَٰن', count: 9, vezin: "fu'lân" },
      { metin_ar: 'طَٰغُوت', count: 8, vezin: "fâ'ûl" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 96:7 — ٱسْتَغْنَىٰٓ (istağnâ)
  'ٱسْتَغْنَىٰٓ': {
    arabicClean: 'استغنى',
    translit: 'istağnâ',
    rootAr: 'غ-ن-ي',
    rootTr: 'ğny',
    rootMeaning: `Zengin olmak, ihtiyaçsız görmek; kendini muhtaç hissetmemek.`,
    pos: 'fiil · istif\'âl',
    derivativeCount: 73,
    verseMeaning: `Kendini yeterli ve zengin gördüğü için (azgınlık eder).`,
    verseAlternatives: `"İstiğnâ" Allah'tan bağımsız olduğunu sanma yanılgısıdır. Gerçek Ganî (zengin) yalnız Allah'tır.`,
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Gınâ: başkasına muhtaç olmama hali. İnsanın gerçek zenginliği gönül tokluğudur."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Ganiye: zenginleşti, ihtiyacı kalmadı. Ganiyy: muhtaç olmayan, kendi kendine yeten."`
      }
    ],
    distribution: [
      { metin_ar: 'غَنِيّ', count: 18, vezin: "fa'iyy" },
      { metin_ar: 'ٱسْتَغْنَىٰ', count: 7, vezin: "istaf'alâ" },
      { metin_ar: 'أَغْنَىٰ', count: 8, vezin: "af'alâ" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 96:8 — ٱلرُّجْعَىٰٓ (ruc'â)
  'ٱلرُّجْعَىٰٓ': {
    arabicClean: 'الرجعى',
    translit: 'er-ruc\'â',
    rootAr: 'ر-ج-ع',
    rootTr: 'rj\'',
    rootMeaning: `Geri dönmek, dönüş; başlangıç noktasına geri gelmek.`,
    pos: 'masdar · marife',
    derivativeCount: 104,
    verseMeaning: `Dönüş muhakkak Rabbinedir; son varış noktası O'dur.`,
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Rücû: başlangıç noktasına dönmek; her şeyin nihai dönüşü Allah'adır."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Race'a: geri döndü. er-Rüc'â: dönüş yeri ve dönüş eylemi."`
      }
    ],
    distribution: [
      { metin_ar: 'رَجَعَ', count: 46, vezin: "fa'ala" },
      { metin_ar: 'يُرْجَعُ', count: 28, vezin: "yuf'alu" },
      { metin_ar: 'مَرْجِع', count: 9, vezin: "maf'il" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 96:10 — عَبْدًا (abden)
  'عَبْدًا': {
    arabicClean: 'عبدا',
    translit: 'abden',
    rootAr: 'ع-ب-د',
    rootTr: 'abd',
    rootMeaning: `Kulluk etmek, boyun eğmek; en yüce sevgi ve tazimle itaat etmek.`,
    pos: 'isim · nekre',
    derivativeCount: 275,
    verseMeaning: `Namaz kılan (kulluk eden) bir kulu engellemeye çalışan azgına uyarı.`,
    conceptSlug: 'ibadet',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Abd: kulluk eden, boyun eğen kişi. Kulluğun en yüce makamı peygamberlerin sıfatıdır."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Abede: kulluk etti, itaat etti. Abd: köle ve kul."`
      }
    ],
    distribution: [
      { metin_ar: 'عَبَدَ', count: 143, vezin: "fa'ala" },
      { metin_ar: 'عَبْد', count: 96, vezin: "fa'l" },
      { metin_ar: 'عِبَاد', count: 96, vezin: "fi'âl" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 96:11 — صَلَّىٰٓ (sallâ)
  'صَلَّىٰٓ': {
    arabicClean: 'صلى',
    translit: 'ṣallâ',
    rootAr: 'ص-ل-و',
    rootTr: 'slw',
    rootMeaning: `Dua etmek, namaz kılmak, bağ kurmak; ateş ve ışık kökünden yönelme.`,
    pos: 'fiil · mazi',
    derivativeCount: 99,
    verseMeaning: `Namaz kıldığında; Allah'a yönelip dua ettiğinde.`,
    conceptSlug: 'salat',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Salât: dua ve tazim; kulun Rabbi ile arasındaki en güçlü bağ."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Sallâ: dua etti, namaz kıldı. Salât: Allah'tan rahmet, meleklerden istiğfar, insanlardan duadır."`
      }
    ],
    distribution: [
      { metin_ar: 'صَلَوٰة', count: 67, vezin: "fa'alâh" },
      { metin_ar: 'صَلَّىٰ', count: 3, vezin: "fa''alâ" },
      { metin_ar: 'مُصَلِّين', count: 3, vezin: "mufa''ilîn" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 96:15 — نَاصِيَةٍ (nâsiye)
  'نَاصِيَةٍ': {
    arabicClean: 'ناصية',
    translit: 'nâṣiye',
    rootAr: 'ن-ص-و',
    rootTr: 'nsw',
    rootMeaning: `Alın, perçem; bir şeyin en üst ve en belirgin kısmı.`,
    pos: 'isim · nekre',
    derivativeCount: 4,
    verseMeaning: `Alın, perçem — yalancı ve günahkâr bir alın.`,
    verseAlternatives: `Araplar'da alından tutup çekmek, tam hakimiyet ve zelil kılma ifadesidir. "Yalancı, günahkâr bir alın" denmesi, o kişinin tüm kimliğinin yalanla damgalandığını gösterir.`,
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Nâsiye: alnın üst kısmı, perçem. Birini nâsiyesinden tutmak: onu tamamen kontrol altına almak."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Nasâ: öne çıktı, belirgin oldu. Nâsiye: alnın en belirgin yeri."`
      }
    ],
    distribution: [
      { metin_ar: 'نَاصِيَة', count: 2, vezin: "fâ'ilah" },
      { metin_ar: 'نَوَاصِي', count: 2, vezin: "favâ'il" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 96:19 — ٱسْجُدْ (üscüd)
  'ٱسْجُدْ': {
    arabicClean: 'اسجد',
    translit: 'uscud',
    rootAr: 'س-ج-د',
    rootTr: 'sjd',
    rootMeaning: `Secde etmek, boyun eğmek; alnı yere koyarak teslimiyetini ilan etmek.`,
    pos: 'fiil · emir',
    derivativeCount: 92,
    verseMeaning: `Secde et! Alnını yere koy ve O'na yaklaş.`,
    verseAlternatives: `"Secde" Kur'an'ın son emridir (96. sure). Tüm surenin mesajını özetler: İkra (oku) ile başlayan insan, uscud (secde et) ile Rabbine teslim olur.`,
    conceptSlug: 'secde',
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Sücûd: boyun eğme ve alçakgönüllülüğün en üst derecesi; alnı yere koymak."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Secede: yere eğildi, alnını koydu. Mescid: secde edilen yer."`
      }
    ],
    distribution: [
      { metin_ar: 'سَجَدَ', count: 34, vezin: "fa'ala" },
      { metin_ar: 'سُجُود', count: 12, vezin: "fu'ûl" },
      { metin_ar: 'مَسْجِد', count: 28, vezin: "maf'il" },
      { metin_ar: 'سَٰجِدِين', count: 11, vezin: "fâ'ilîn" },
    ],
    tier: 'curated',
    verified: true,
  },

  // 96:19 — وَٱقْتَرِبْ (akterib)
  'وَٱقْتَرِبْ': {
    arabicClean: 'واقترب',
    translit: 've-kterib',
    rootAr: 'ق-ر-ب',
    rootTr: 'qrb',
    rootMeaning: `Yaklaşmak, yakınlık; mekânda veya maneviyatta mesafenin azalması.`,
    pos: 'fiil · emir (iftial)',
    derivativeCount: 96,
    verseMeaning: `(Allah'a) yaklaş! Secde ile O'na en yakın hale gel.`,
    verseAlternatives: `Hadis: "Kulun Rabbine en yakın olduğu an, secde halidir." Bu emir, surenin son kelimesidir ve tüm Kur'an'ın ilk inen suresinin zirvesidir.`,
    classicalQuotes: [
      {
        source: "el-Müfredât",
        author: "Râgıb el-İsfahânî",
        quote: `"Kurb: yakınlık; Allah'a yaklaşmak mekân ile değil, ibadet ve taatle gerçekleşir."`
      },
      {
        source: "Lisânü'l-Arab",
        author: "İbn Manzûr",
        quote: `"Karube: yaklaştı. Kurbân: Allah'a yaklaşma vesilesi olan şey; kurban da buradan gelir."`
      }
    ],
    distribution: [
      { metin_ar: 'قَرُبَ', count: 18, vezin: "fa'ula" },
      { metin_ar: 'قُرْبَان', count: 3, vezin: "fu'lân" },
      { metin_ar: 'أَقْرَب', count: 26, vezin: "af'al" },
      { metin_ar: 'قَرِيب', count: 12, vezin: "fa'îl" },
    ],
    tier: 'curated',
    verified: true,
  },
  // 96:1:4 — ٱلَّذِى (alladhî / ellezî)
  'ٱلَّذِى': {
    arabicClean: 'الذي',
    translit: 'ellezî',
    rootAr: 'ل-ذ-ي',
    rootTr: 'lzy',
    rootMeaning: `İlgi kurmak, vasfetmek, bir önceki ismi sonraki sıla cümlesine bağlamak.`,
    pos: 'ism-i mevsûl (ilgi adılı)',
    derivativeCount: 1442,
    verseMeaning: `O ki, o yaratan zat. Önceki "Rabbin" ismini sıla cümlesi olan "yarattı" fiiline bağlayan ilgi zamiri.`,
    verseAlternatives: `Alternatifler: O kimse ki · O zat ki. Kur'an'da tekil eril varlıkları veya ilâhî zâtı nitelemek için kullanılır.`,
    classicalQuotes: [
      {
        source: 'Lisânü’l-Arab',
        author: 'İbn Manzûr',
        quote: `Ellezi: marife (belirli) kılınmış ism-i mevsûldür; sıla cümlesi olmadan anlamı tamamlanmaz.`,
      },
      {
        source: 'el-Müfredât',
        author: 'Râgıb el-İsfahânî',
        quote: `İlâhî sıfatları zata bağlarken tekit ve ihtisas bildirir.`,
      },
    ],
    distribution: [
      { metin_ar: 'ٱلَّذِى', count: 320, vezin: 'mevsûl' },
      { metin_ar: 'ٱلَّذِينَ', count: 1080, vezin: 'mevsûl (çoğul)' },
      { metin_ar: 'ٱلَّتِى', count: 42, vezin: 'mevsûl (dişil)' },
    ],
    tier: 'curated',
    verified: true,
  },
  // 1:7 & genel — ٱلَّذِينَ (alladhîna / ellezîne)
  'ٱلَّذِينَ': {
    arabicClean: 'الذين',
    translit: 'ellezîne',
    rootAr: 'ل-ذ-ي',
    rootTr: 'lzy',
    rootMeaning: `Çoğul ilgi adılı; önceki topluluğu sonraki fiil/sıla cümlesine bağlar.`,
    pos: 'ism-i mevsûl (çoğul)',
    derivativeCount: 1080,
    verseMeaning: `O kimseler ki, onlar ki.`,
    verseAlternatives: `Alternatifler: O kimseler · O topluluk.`,
    classicalQuotes: [
      {
        source: 'Lisânü’l-Arab',
        author: 'İbn Manzûr',
        quote: `Ellezi çoğuludur; akıl sahipleri topluluğu için kullanılır.`,
      },
    ],
    distribution: [
      { metin_ar: 'ٱلَّذِينَ', count: 1080, vezin: 'çoğul mevsûl' },
      { metin_ar: 'ٱلَّذِى', count: 320, vezin: 'tekil mevsûl' },
    ],
    tier: 'curated',
    verified: true,
  },
  // 96:6 & 96:15 & 96:19 — كَلَّآ / كَلَّا (kellâ)
  'كَلَّآ': {
    arabicClean: 'كلا',
    translit: 'kellâ',
    rootAr: 'ك-ل-ل',
    rootTr: 'kll',
    rootMeaning: `Reddiye, caydırma, azarlama ve uyarı edatı.`,
    pos: 'harf · zecr ve red',
    derivativeCount: 33,
    verseMeaning: `Hayır, asla! Kesinlikle öyle değil. İnsanın nankörce azgınlaşmasını şiddetle meneden uyarı ünlemi.`,
    verseAlternatives: `Alternatifler: Sakın ha! · Asla böyle olmamalı · Gerçek şu ki.`,
    classicalQuotes: [
      {
        source: 'Lisânü’l-Arab',
        author: 'İbn Manzûr',
        quote: `Kellâ: kendisinden önce geçen yanlış bir kanaati iptal etmek ve muhatabı caydırmak için konulmuş harftir.`,
      },
      {
        source: 'el-Müfredât',
        author: 'Râgıb el-İsfahânî',
        quote: `İnsanın haddi aşmasını men eden en kuvvetli zecr lafzıdır.`,
      },
    ],
    distribution: [
      { metin_ar: 'كَلَّآ', count: 33, vezin: 'harf' },
    ],
    tier: 'curated',
    verified: true,
  },
  // 96:6 — إِنَّ (inne)
  'إِنَّ': {
    arabicClean: 'إن',
    translit: 'inne',
    rootAr: 'أ-ن-ن',
    rootTr: 'ann',
    rootMeaning: `Tekit, pekiştirme ve şüpheyi giderme edatı.`,
    pos: 'harf · tekit ve nasb',
    derivativeCount: 1530,
    verseMeaning: `Şüphesiz ki, muhakkak ki, gerçek şu ki. Haberin kesinliğini pekiştirir.`,
    verseAlternatives: `Alternatifler: Muhakkak ki · Doğrusu · Hiç kuşkusuz.`,
    classicalQuotes: [
      {
        source: 'Lisânü’l-Arab',
        author: 'İbn Manzûr',
        quote: `İnne: cümleyi kuvvetlendiren, hükmü zihinlerde sabitleyen tahkik harfidir.`,
      },
    ],
    distribution: [
      { metin_ar: 'إِنَّ', count: 1530, vezin: 'tekit harfi' },
    ],
    tier: 'curated',
    verified: true,
  },
  // 96:2 — مِنْ (min)
  'مِنْ': {
    arabicClean: 'من',
    translit: 'min',
    rootAr: 'م-ن-ن',
    rootTr: 'mnn',
    rootMeaning: `Başlangıç, menşe ve cins/öz bildirme edatı.`,
    pos: 'harf · cer',
    derivativeCount: 2410,
    verseMeaning: `-den, -dan; bir şeyin özünü/menşeini açıklar (alak'tan yarattı).`,
    verseAlternatives: `Alternatifler: -den / ibtidaye veya tebyin ifade eder.`,
    classicalQuotes: [
      {
        source: 'Lisânü’l-Arab',
        author: 'İbn Manzûr',
        quote: `Min: harf-i cerlerin anasıdır; gaye, tebyin, teb'iz ve cins bildirmede kullanılır.`,
      },
    ],
    distribution: [
      { metin_ar: 'مِنْ', count: 2410, vezin: 'harf-i cer' },
    ],
    tier: 'curated',
    verified: true,
  }
};

/**
 * Verilen kelime metnine göre en uygun sözlük kaydını döndürür.
 */
export function getCuratedLexicon(textAr: string): WordLexiconDetail | null {
  if (!textAr) return null;
  // 1. Doğrudan tam eşleşme
  if (CURATED_LEXICON[textAr]) {
    return CURATED_LEXICON[textAr];
  }
  // 2. Harekesiz normalize edilmiş eşleşme
  const clean = textAr.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
  for (const key of Object.keys(CURATED_LEXICON)) {
    const keyClean = key.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
    if (keyClean === clean) {
      return CURATED_LEXICON[key];
    }
  }
  return null;
}
