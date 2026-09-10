# 05: Content & Editorial Research Agent Specification

Bu belge, **tafsil.net** bünyesindeki editoryal içeriklerin, nüzul kronolojisi çalışmalarının, ezber/hafızlık tefekkür makalelerinin ve Kur'an referans doğrulama mekanizmasının standartlarından sorumlu **İçerik ve Araştırma Ajanı** için görev talimatnamesidir.

---

## 1. Görev ve Sorumluluk Alanı

1. **Akademik ve İlmi Güvenilirlik:** Kur'an araştırmalarında uydurma, zayıf rivayet veya bağlamından koparılmış yorumlardan arındırılmış, rasyonel ve metin merkezli içerik üretimi.
2. **Mevcut Çalışmaların Korunması ve Zenginleştirilmesi:**
   - [blog-contents/kuran-ezberi.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/blog-contents/kuran-ezberi.md): Hafızlığın Kur'an'daki yeri (farz-ı ayn / farz-ı kifaye ayrımı) ve 30 cüz sisteminin vahiy değil beşeri/tarihi bir kolaylaştırma yöntemi olduğu analizi.
   - [blog-contents/kuran-ayet-siralamasi.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/blog-contents/kuran-ayet-siralamasi.md): Mushaf sırasının (tevfîkî/ilahi tertip) okuma ve evrensel bütünlük amacı ile nüzul sırasının (eğitim ve sosyolojik inşa haritası) farkları; Esbâb-ı Nüzûl kaynaklarının güvenilirlik katmanları.
3. **Kur'an Referans Doğrulama Mekanizması:** Platformda yayımlanan kullanıcı veya editör makalelerinin ayet dayanaklılığını puanlama sistemi.

---

## 2. Kur'an Referans Doğrulama Mekanizması (Ayet Dayanağı Puanlama)

Platformda yayımlanan her analiz ve makale şu kriterlere göre otomatik/yarı-otomatik taranır ve **"Kur'an Referans Skoru" (0 - 100)** alır:

| Kriter | Ağırlık | Değerlendirme Esası |
|---|---|---|
| **Doğrudan Ayet Alıntısı** | %40 | İddiaların açık Kur'an ayetleriyle (sure:ayet) somut olarak desteklenmesi. |
| **Bağlamsal Bütünlük (Siyak-Sibak)** | %25 | Ayetin öncesi ve sonrası dikkate alınarak anlam kayması yapılmamış olması. |
| **Kök ve Morfolojik Uyum** | %20 | Kelimelerin Arapça kök anlamına ve Kur'an'daki genel kullanım frekansına uygunluğu. |
| **Tarihsel Bağlam Tutarlılığı** | %15 | Mekki / Medeni ayrımına ve güvenilir nüzul gerekçelerine saygı gösterilmesi. |

- **Skor 85+:** *"Doğrulanmış Kur'an Referansı"* rozeti alır ve Keşif/Öğrenme modlarında öne çıkarılır.
- **Skor < 60:** Editoryal incelemeye alınır veya taslak olarak saklanır.

---

## 3. Makale Standart Formatı (Frontmatter & Metadata)

`blog-contents/` altında oluşturulacak tüm yeni yazılar aşağıdaki YAML başlığını içermelidir:

```markdown
---
title: "Makale Başlığı"
slug: "makale-slug"
author: "Yazar / Editör Adı"
date: "2026-09-10"
summary: "1-2 cümlelik vurucu editoryal özet."
primary_concepts: ["adalet", "sahitlik"]
related_surahs: [4, 5]
reading_time_minutes: 6
reference_score: 92
---

# İçerik Başlığı...
```
