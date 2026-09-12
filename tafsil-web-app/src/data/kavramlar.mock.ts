import type { Kavram } from "@/lib/types";

/**
 * PLACEHOLDER içerik — Agent-01'in `kavramlar` / `kavram_iliskileri` tabloları
 * ve Agent-05'in editoryal doğrulaması henüz mevcut değil. Yalnızca WEB-004
 * (kavram derin bağlantı) sayfa düzenini geliştirmek için kullanılır; burada
 * yer alan tanımlar yayına alınmadan önce Agent-05 tarafından doğrulanmalıdır.
 */
export const mockKavramlar: Kavram[] = [
  {
    slug: "ilim",
    baslikTr: "İlim",
    baslikAr: "علم",
    tanim:
      "Kur'an'da bilginin kaynağı olarak Allah'a atfedilir; öğretme fiili bir cömertlik eylemi olarak kurulur (Alak 96:4-5).",
    kategori: "epistemoloji",
    ilkGectigiYer: { sureId: 96, ayetNo: 4, sureNameTr: "Alak" },
    iliskiler: [
      { slug: "hikmet", baslikTr: "Hikmet", tip: "iliskili" },
      { slug: "cehalet", baslikTr: "Cehalet", tip: "zit_anlam" },
    ],
  },
  {
    slug: "sabir",
    baslikTr: "Sabır",
    baslikAr: "صبر",
    tanim:
      "Zorluk karşısında direnç gösterme ve ilahi takdire teslimiyet; birçok peygamber kıssasında merkezi bir tema olarak işlenir.",
    kategori: "ahlak",
    ilkGectigiYer: { sureId: 2, ayetNo: 45, sureNameTr: "Bakara" },
    iliskiler: [
      { slug: "tevekkul", baslikTr: "Tevekkül", tip: "iliskili" },
      { slug: "sukur", baslikTr: "Şükür", tip: "iliskili" },
    ],
  },
  {
    slug: "rahmet",
    baslikTr: "Rahmet",
    baslikAr: "رحمة",
    tanim:
      "Allah'ın isimlerinden er-Rahman ve er-Rahim ile doğrudan bağlantılı; Kur'an'ın açılışında konumlandırılan temel nitelik.",
    kategori: "ilahi_sifat",
    ilkGectigiYer: { sureId: 1, ayetNo: 1, sureNameTr: "Fâtiha" },
    iliskiler: [
      { slug: "magfiret", baslikTr: "Mağfiret", tip: "iliskili" },
      { slug: "azap", baslikTr: "Azap", tip: "zit_anlam" },
    ],
  },
];
