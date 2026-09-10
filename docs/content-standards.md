# İçerik Standartları (Content Standards)

Bu belge, `blog-contents/` altında yayımlanan tüm editoryal içeriklerin uyması gereken yapısal ve ilmi standartları tanımlar. Sahibi: **Agent-06 (Content & Editorial)**. Referans: [05-CONTENT-EDITORIAL-AGENT.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/05-CONTENT-EDITORIAL-AGENT.md).

---

## 1. YAML Frontmatter Zorunlu Alanları

`blog-contents/` altındaki her `.md` dosyası, içerik gövdesinden önce aşağıdaki alanları içeren bir YAML frontmatter bloğuyla başlamalıdır:

```yaml
---
title: "Makale Başlığı"
slug: "makale-slug"
author: "Yazar / Editör Adı"
date: "2026-09-10"
updated: "2026-09-11"
summary: "1-2 cümlelik vurucu editoryal özet."
primary_concepts: ["adalet", "sahitlik"]
related_surahs: [4, 5]
reading_time_minutes: 6
reference_score: 92
status: "published"
---
```

| Alan | Zorunlu | Açıklama |
|---|---|---|
| `title` | ✅ | Makalenin tam başlığı. |
| `slug` | ✅ | URL-uyumlu, kebab-case, Türkçe karakter içermez (örn. `kuran-ayet-siralamasi`). |
| `author` | ✅ | Yazar veya "Editöryal Ekip". |
| `date` | ✅ | İlk yayın tarihi, `YYYY-MM-DD`. |
| `updated` | İçerik revize edildiyse | Son güncelleme tarihi. |
| `summary` | ✅ | 1-2 cümlelik özet; liste/kart görünümlerinde kullanılır. |
| `primary_concepts` | ✅ | İlişkili kavram etiketleri (DAG kavram şemasıyla hizalı, bkz. `data-pipeline` kavram sözlüğü). |
| `related_surahs` | ✅ | Makalede doğrudan referans verilen sure numaraları. |
| `reading_time_minutes` | ✅ | Yaklaşık okuma süresi (dakika). |
| `reference_score` | ✅ | Bkz. [reference-scoring-algorithm.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/reference-scoring-algorithm.md); editör tarafından hesaplanıp girilir. |
| `status` | ✅ | `draft` \| `review` \| `published`. `reference_score < 60` olan içerik `draft`/`review` üzerinde kalır. |

---

## 2. İçerik Yapısı Kuralları

1. **Kaynak Gösterimi:** Her somut iddia, mümkünse doğrudan ayet referansı (sure:ayet) veya isimlendirilmiş bir kaynakla desteklenmelidir. Dipnot biçimi: `[n] (URL)` satır sonunda, ya da makale sonunda numaralı kaynakça listesi.
2. **Ayet Alıntıları:** Kur'an'dan yapılan alıntılar Türkçe meal ile birlikte verilir; mümkünse Arapça orijinal eklenir. Sure:ayet numarası her alıntının yanında bulunur (örn. *"...kolayınıza geleni okuyun." (Müzzemmil 73:20)*).
3. **Mekki/Medeni ve Tarihsel Bağlam:** Nüzul kronolojisiyle ilgili iddialarda, kaynağın güvenilirlik katmanı (bkz. §3) belirtilir; tek bir rivayete dayalı kesin hüküm ifadesinden kaçınılır.
4. **Nötr ve Mezhep Dışı Dil:** Belirli bir mezhep/ekolün görüşü sunulacaksa açıkça "X ekolüne göre" ifadesiyle belirtilir; genel-geçer hakikat gibi sunulmaz.
5. **Başlık Hiyerarşisi:** `#` sadece makale başlığı için (frontmatter `title` ile örtüşür); bölümler `##`, alt bölümler `###`.
6. **Zayıf/Uydurma Rivayet Yasağı:** Sahih olmayan veya senedi tartışmalı rivayetler ana argüman olarak kullanılamaz; kullanılıyorsa açıkça "zayıf rivayete göre" uyarısıyla ve alternatif görüşle birlikte sunulur.

---

## 3. Kaynak Güvenilirlik Katmanları

İçerikte kullanılan tarihsel/rivayet kaynakları üç katmanda değerlendirilir (detay: [kuran-ayet-siralamasi.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/blog-contents/kuran-ayet-siralamasi.md) "Kaynakların Güvenilirliği" bölümü):

1. **En Yüksek:** Sahih hadis kaynaklarının (Buhârî, Müslim) tefsir bölümlerindeki rivayetler.
2. **Orta-Yüksek:** Eleştirel/filtreleyici tefsirler (İbn Kesîr, Suyûtî).
3. **Dikkatli Yaklaşılması Gereken:** Geniş, elenmemiş ilk dönem derlemeleri (Taberî, Vâhidî) — tek başına delil değil, çapraz doğrulama ile kullanılır.

Bir makalede katman-1 dışı bir kaynağa dayalı iddia varsa, bu açıkça belirtilmeli ve mümkünse alternatif rivayetle dengelenmelidir.

---

## 4. ENHANCE, Don't Replace

Mevcut makaleler (`kuran-ezberi.md`, `kuran-ayet-siralamasi.md`) silinmez veya yeniden yazılmaz; yapısal olarak zenginleştirilir (frontmatter eklenir, başlık hiyerarşisi düzenlenir, eksik bölümler eklenir). Orijinal analiz ve kaynak referansları korunur.

---

## 5. Değişiklik Günlüğü

| Tarih | Değişiklik |
|---|---|
| 2026-09-11 | İlk sürüm (CONT-004). |
