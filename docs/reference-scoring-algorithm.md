# Kur'an Referans Doğrulama Mekanizması (Reference Scoring Algorithm)

**Sahibi:** Agent-06 (Content & Editorial) · **İlgili PBI:** CONT-003 · **Kaynak:** [05-CONTENT-EDITORIAL-AGENT.md §2](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/05-CONTENT-EDITORIAL-AGENT.md)

Bu belge, platformda yayımlanan her analiz/makale için hesaplanan **"Kur'an Referans Skoru" (0-100)**'nun hesaplama yöntemini, editoryal karar eşiklerini ve yarı-otomatik değerlendirme sürecini tanımlar. Skor, `blog-contents/` frontmatter'ındaki `reference_score` alanına yazılır (bkz. [content-standards.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/content-standards.md)).

---

## 1. Amaç

Platformun temel felsefesi, kavramların "Kur'an'ın kendi iç bağlamından" anlamlandırılmasıdır (bkz. [AGENTS.md §1](file:///Users/alperaydin/Projects/kuran-tafsil-net/AGENTS.md)). Bu skorlama mekanizması, yayımlanan içeriğin bu felsefeye ne ölçüde sadık kaldığını — spekülasyon veya zayıf rivayete değil, doğrudan metne ve sağlam tarihsel bağlama dayandığını — ölçülebilir kılar.

---

## 2. Ağırlıklı Kriterler

| Kriter | Ağırlık | Değerlendirme Esası |
|---|---|---|
| **Doğrudan Ayet Alıntısı** | %40 | İddiaların açık Kur'an ayetleriyle (sure:ayet) somut olarak desteklenmesi. |
| **Bağlamsal Bütünlük (Siyak-Sibak)** | %25 | Ayetin öncesi ve sonrası dikkate alınarak anlam kayması yapılmamış olması. |
| **Kök ve Morfolojik Uyum** | %20 | Kelimelerin Arapça kök anlamına ve Kur'an'daki genel kullanım frekansına uygunluğu. |
| **Tarihsel Bağlam Tutarlılığı** | %15 | Mekki/Medeni ayrımına ve güvenilir nüzul gerekçelerine (bkz. [content-standards.md §3](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/content-standards.md)) saygı gösterilmesi. |

**Toplam skor** = `0.40×A + 0.25×B + 0.20×C + 0.15×D`, her alt kriter kendi içinde 0-100 aralığında puanlanır.

---

## 3. Alt Kriter Rubrikleri (0-100)

Her alt kriter, aşağıdaki 4 seviyeli rubrikle puanlanır (editör veya LLM-destekli ön değerlendirme bu bantlardan birini seçer, ardından bant içinde ince ayar yapar):

### A. Doğrudan Ayet Alıntısı (%40)
| Puan Bandı | Tanım |
|---|---|
| 90-100 | Her ana iddia, açık sure:ayet referansıyla desteklenir; alıntılar orijinal Arapça + güncel meal ile verilir. |
| 60-89 | Ana iddiaların çoğu ayet referanslıdır; bazı ikincil iddialar referanssız kalmıştır. |
| 30-59 | Yalnızca birkaç iddia ayetle desteklenir; çoğu genel/dolaylı ifadeye dayanır. |
| 0-29 | Ayet ataması ya yok ya da iddialarla zayıf/dolaylı ilişkilidir. |

### B. Bağlamsal Bütünlük — Siyak-Sibak (%25)
| Puan Bandı | Tanım |
|---|---|
| 90-100 | Alıntılanan her ayet, öncesi/sonrasıyla birlikte okunmuş; anlam kayması yok. |
| 60-89 | Genel bağlam korunmuş, ancak bir-iki alıntıda çevresel ayetler değerlendirilmemiş. |
| 30-59 | Ayetler kısmen bağlamından koparılmış (cımbızlama riski). |
| 0-29 | Ayet(ler) bağlamından açıkça koparılarak farklı bir anlam için kullanılmış. |

### C. Kök ve Morfolojik Uyum (%20)
| Puan Bandı | Tanım |
|---|---|
| 90-100 | Kelime kökü analizi, `data-pipeline` kök/lemma veritabanıyla ve Kur'an genelindeki kullanım frekansıyla tutarlı. |
| 60-89 | Kök anlamı doğru ancak frekans/genel kullanım karşılaştırması eksik. |
| 30-59 | Kök anlamına kısmen dayanır; bazı iddialar zayıf etimolojik varsayıma dayanır. |
| 0-29 | Kök/morfoloji iddiası yanlış veya doğrulanamaz. |

### D. Tarihsel Bağlam Tutarlılığı (%15)
| Puan Bandı | Tanım |
|---|---|
| 90-100 | Mekki/Medeni ayrımına saygılı; kullanılan nüzul gerekçeleri "En Yüksek" veya "Orta-Yüksek" güvenilirlik katmanından. |
| 60-89 | Genel tarihsel çerçeve doğru; bir-iki noktada "Dikkatli Yaklaşılması Gereken" katman kaynağı, uyarı etiketi olmadan kullanılmış. |
| 30-59 | Tarihsel bağlam iddiaları büyük ölçüde tek, doğrulanmamış rivayete dayanır. |
| 0-29 | Mekki/Medeni ayrımı ihlal edilmiş veya tarihsel iddia kaynaksız/çelişkili. |

---

## 4. Editoryal Karar Eşikleri

| Skor Aralığı | Durum | Aksiyon |
|---|---|---|
| **85-100** | *"Doğrulanmış Kur'an Referansı"* rozeti | Keşif/Öğrenme modlarında öne çıkarılır; `status: published`. |
| **60-84** | Yayımlanabilir, rozetsiz | `status: published`, ancak rozet gösterilmez. |
| **< 60** | Editoryal incelemeye alınır | `status: review` veya `draft`; yayımlanmadan önce eksik alt kriterler notla belirtilir. |

---

## 5. Değerlendirme Süreci (Yarı-Otomatik)

1. **Otomatik Ön-Tarama (gelecek: Agent-02 sorumluluğunda, backend içi):** Metindeki sure:ayet referansları regex/NLP ile tespit edilir, `kavram_iliskileri` ve kök tablolarıyla çapraz kontrol edilir. Bu adım yalnızca A ve C kriterleri için bir *başlangıç puanı* üretir — nihai puan değildir.
2. **Editoryal İnceleme (Agent-06 sorumluluğu):** Otomatik ön-tarama sonrası, editör (insan veya bu ajan) B ve D kriterlerini — bağlamsal bütünlük ve tarihsel tutarlılık — manuel olarak değerlendirir, çünkü bunlar anlam yorumuna dayanır ve otomatikleştirilemez.
3. **Nihai Skor Kaydı:** Editör, 4 alt kriter puanını ağırlıklı ortalamayla birleştirir ve `reference_score` alanına yazar. Alt kriter puanları (opsiyonel) makale sonunda "Editoryal Not" olarak saklanabilir.
4. **Periyodik Yeniden Değerlendirme:** İçerik güncellendiğinde (`updated` alanı değiştiğinde) skor yeniden hesaplanır.

> **Not:** Otomatik ön-tarama şu an backend'de mevcut değildir; bu, Agent-02'ye yönelik bir entegrasyon önerisidir (bkz. §6). O zamana kadar tüm 4 kriter editör tarafından manuel değerlendirilir.

---

## 6. Backend Entegrasyonu İçin Notlar (Agent-02'ye Öneri)

Bu ajan `backend/` dizinine yazma yetkisine sahip değildir; aşağıdaki notlar yalnızca gelecekteki entegrasyon için referans amaçlıdır:

- `reference_score` ve alt kriter puanları, makale meta verisiyle birlikte DB'de saklanmalı (örn. `makaleler` tablosu, `reference_score numeric`, `reference_subscores jsonb`).
- Ayet referans tespiti (§5 madde 1), `ayet_bloklari`/`kavram_iliskileri` tablolarına karşı bir doğrulama sorgusu olarak modellenebilir.
- 85+ skorlu içerikler için "Doğrulanmış Kur'an Referansı" rozeti, API yanıtında bir `verified_badge: boolean` alanı olarak sunulabilir.

---

## 7. Değişiklik Günlüğü

| Tarih | Değişiklik |
|---|---|
| 2026-09-11 | İlk sürüm (CONT-003). |
