/**
 * tafsil.net — Çekirdek Kavram Sözlüğü (Offline-First Seed & API Fallback)
 *
 * Tasarım Kaynağı: design/project/Tafsil.dc.html (satır 541-550)
 * Ayet meallerindeki [metin|slug] etiketleriyle eşleşen kavram tanımları,
 * Arapça kökleri, Kur'an'daki kullanım analizleri ve DAG komşuları.
 */

export interface ConceptDetail {
  slug: string;
  label: string;
  root: string;
  rootTr: string;
  gloss: string;
  use: string;
  links: string[]; // ilişkili kavram slug'ları (iç içe zincirleme açılabilen komşular)
}

export const CONCEPTS_DICTIONARY: Record<string, ConceptDetail> = {
  hamd: {
    slug: 'hamd',
    label: 'HAMD',
    root: 'ح-م-د',
    rootTr: 'hmd',
    gloss: 'Övgü ve şükrün ötesinde; bir varlığın kendi öz niteliğiyle ortaya koyduğu mükemmelliği ve lütfu takdir etmek.',
    use: "Kur'an'da 68 yerde geçer. Fatiha'nın ilk cümlesi evrendeki tüm nizam ve kemalatın övgüsünü yalnız Allah'a has kılar.",
    links: ['sukur', 'rahmet', 'rabb'],
  },
  rabb: {
    slug: 'rabb',
    label: 'RABB',
    root: 'ر-ب-ب',
    rootTr: 'rbb',
    gloss: 'Yarattığı varlığı kendi haline terk etmeyip tedricen (adım adım) terbiye eden, koruyan, besleyen ve kemale erdiren mutlak sahip.',
    use: "Kur'an'da 981 yerde zikredilir. Yaratıcı ile yaratılan arasındaki kesintisiz pedagojik ve rahmet bağını temsil eder.",
    links: ['rahmet', 'hamd', 'ibadet'],
  },
  rahmet: {
    slug: 'rahmet',
    label: 'RAHMET',
    root: 'ر-ح-م',
    rootTr: 'rhm',
    gloss: 'Kuşatıcı şefkat, lütuf ve esirgeme; varlığın yaratılış ve sürdürülüşündeki ilahi sevgi ve cömertlik.',
    use: "“Rahmân” tüm varlığı kuşatan karşılıksız rahmeti, “Rahîm” ise iradesini doğru kullanan müminlere yönelik özel merhameti ifade eder.",
    links: ['hamd', 'rabb', 'hidayet'],
  },
  ibadet: {
    slug: 'ibadet',
    label: 'İBADET',
    root: 'ع-ب-د',
    rootTr: 'abd',
    gloss: 'İnsanın yalnız yaratıcısına boyun eğerek dünyevi tüm bağımlılıklardan özgürleşmesi; varoluşsal kulluk bilinci.',
    use: "“Yalnız sana ibadet ederiz” ifadesi, kulluğun çoğul bir bilinçle (bütün müminler adına) ve tevhid ekseninde yapılmasını emreder.",
    links: ['iman', 'takva', 'rabb'],
  },
  'sirat-i-mustakim': {
    slug: 'sirat-i-mustakim',
    label: 'SIRAT-I MÜSTAKİM',
    root: 'ص-ر-ط',
    rootTr: 'srt',
    gloss: 'Her türlü aşırılıktan (ifrat ve tefrit) uzak, vahyin ve fıtratın rehberliğindeki dosdoğru cadde ve istikamet çizgisi.',
    use: "Kur'an'da 33 yerde geçer. Statik bir duruş değil, sürekli Allah'tan hidayet dilenerek üzerinde yürünmesi gereken dinamik bir yoldur.",
    links: ['hidayet', 'dalalet', 'nimet'],
  },
  nimet: {
    slug: 'nimet',
    label: 'NİMET',
    root: 'ن-ع-م',
    rootTr: 'nam',
    gloss: 'Kulun kendi gücüyle elde edemeyeceği, tamamen ilahi lütuf ve ihsan olarak bağışlanan maddi ve manevi güzellikler.',
    use: "Fatiha'da peygamberler, sıddıklar, şehitler ve salihlerin yürüdüğü istikamet “nimet verilenlerin yolu” olarak nitelendirilir.",
    links: ['sukur', 'sirat-i-mustakim', 'rahmet'],
  },
  hidayet: {
    slug: 'hidayet',
    label: 'HİDAYET',
    root: 'ه-د-ي',
    rootTr: 'hdy',
    gloss: 'İlahi rehberliğin kalbe ve akla yol göstermesi; insanın doğru istikameti bulup orada sebat etmesi.',
    use: "Dalaletin karşıt kutbudur. İnsanın fıtratıyla vahyin buluşmasıyla hidayet tamamlanır.",
    links: ['sirat-i-mustakim', 'dalalet', 'ilim'],
  },
  dalalet: {
    slug: 'dalalet',
    label: 'DALALET',
    root: 'ض-ل-ل',
    rootTr: 'dll',
    gloss: 'Hakikat çizgisinden ve istikametten sapma; gayeyi ve pusulayı kaybederek bocalamak.',
    use: "Hidayetin zıddıdır. Fatiha'nın sonunda bilinçli sapma ve gaflet haline karşı bir uyarı olarak yer alır.",
    links: ['hidayet', 'sirat-i-mustakim', 'zulum'],
  },
  sukur: {
    slug: 'sukur',
    label: 'ŞÜKÜR',
    root: 'ش-ك-ر',
    rootTr: 'skr',
    gloss: 'Nimetin kaynağını bilip gereğince amel ederek minnettarlığı hem dille hem eylemle ortaya koymak.',
    use: "Sabırla birlikte imanın iki kanadından biridir. Nimetin artmasına vesile kılınmıştır.",
    links: ['hamd', 'nimet', 'sabir'],
  },
  oku: {
    slug: 'oku',
    label: "OKU / İKRA'",
    root: 'ق-ر-أ',
    rootTr: 'qra',
    gloss: 'Toplamak, bir araya getirmek; parçaları birleştirerek anlamlandırmak.',
    use: "Kur'an'da 88 türev. İlk emir burada geldiği için kökün “bir araya getirme” anlamı, vahyin bütünsel okunması fikrini taşır.",
    links: ['kalem', 'ilim'],
  },
  insan: {
    slug: 'insan',
    label: 'İNSAN',
    root: 'أ-ن-س',
    rootTr: 'ans',
    gloss: 'Ünsiyet kuran, alışan, yakınlık duyan varlık.',
    use: "Alak suresinde üç kez geçer: yaratılışı, öğretilmesi ve azgınlaşması bağlamlarında.",
    links: ['alak', 'ilim'],
  },
  alak: {
    slug: 'alak',
    label: 'ALAK',
    root: 'ع-ل-ق',
    rootTr: 'alq',
    gloss: 'Asılıp tutunan, ilişen şey. Aynı kökten “alâka” = bağ, ilgi.',
    use: "Kur'an'da 6 türev. Klasik meallerdeki “kan pıhtısı” karşılığı kökün ikincil anlamıdır.",
    links: ['insan'],
  },
  ilim: {
    slug: 'ilim',
    label: 'İLİM',
    root: 'ع-ل-م',
    rootTr: 'ilm',
    gloss: 'Bilmek, bildirmek, iz bırakan işaretten hareketle kavramak.',
    use: "Kur'an'ın en yoğun köklerinden biri (854 türev). Bu surede “alleme” fiili iki kez arka arkaya gelir.",
    links: ['kalem', 'hidayet'],
  },
  kalem: {
    slug: 'kalem',
    label: 'KALEM',
    root: 'ق-ل-م',
    rootTr: 'qlm',
    gloss: 'Yazı aracı; kesip biçimlendirilmiş şey. Bilginin kayda geçmesi.',
    use: "Kur'an'da 4 kez. Okuma emrinin hemen ardından gelmesi, sözlü vahiy ile yazılı kayıt arasındaki bağı kurar.",
    links: ['ilim', 'oku'],
  },
};

/**
 * Kavram slug'ına göre detay getirir.
 */
export function getConceptDetails(slug: string): ConceptDetail | null {
  return CONCEPTS_DICTIONARY[slug] ?? null;
}
