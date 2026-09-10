# tafsil.net — Data Pipeline & Lexicon Engine

Kur'an metninin açık kaynaklardan (Tanzil, Quran.com, Quranic Arabic Corpus) çekilmesi, normalleştirilmesi, morfolojik köklerin ayrıştırılması, kavram etiketlemesi ve ses zaman damgalarının üretilmesini sağlayan veri hazırlık katmanı.

---

## 1. Kur'an Kaynak Metni (`uthmani.txt`)

- **Kaynak Dosya:** `data-pipeline/uthmani.txt`
- **Biçim:** Pipe-separated (`id|sureno|ayetno|text`)
- **Kapsam:** 114 Sure, **6234 ayet**.
- **Kritik Editoryal Not:** Dosyada Tevbe Suresi 127 ayet içermektedir (Standart Mushaf 129'dur). Seeder, `uthmani.txt` içerisindeki orijinal imla ve hareke bütünlüğünü harfiyen koruyarak aktarır.

---

## 2. Meta Veri ve Koordinat Eşleştirmeleri

- **[surah-metadata.json](file:///Users/alperaydin/Projects/kuran-tafsil-net/data-pipeline/scripts/surah-metadata.json):** 114 surenin Türkçe adları, Arapça hat isimleri, nüzul sıraları, dönemleri (`erken_mekke`, `orta_mekke`, `gec_mekke`, `medine`), ayet sayıları ve özet açıklamaları.
- **[quran-pages-juz.json](file:///Users/alperaydin/Projects/kuran-tafsil-net/data-pipeline/scripts/quran-pages-juz.json):** Standart Medine Mushafı'ndaki 604 sayfa ve 30 cüzün tüm ayetlerle olan birebir koordinat eşleşmesi.
- **[seed/quran_seed.sql](file:///Users/alperaydin/Projects/kuran-tafsil-net/data-pipeline/seed/quran_seed.sql):** `uthmani.txt`, sure meta verileri ve sayfa/cüz koordinatlarının birleştirilmesiyle üretilen, doğrudan PostgreSQL'e aktarılabilir toplu SQL insert dosyası.

---

## 3. Komutlar ve Betikler

```bash
# Sure meta verilerini yeniden üret
npm run generate:metadata

# quran_seed.sql dosyasını yeniden üret
npm run generate:seed

# Veritabanına aktarım için backend dizininden:
cd ../backend && npm run db:seed
```

---

## 4. İlgili Dokümantasyon
- Veri Pipeline Şartnamesi: [docs/agents/01-DATA-PIPELINE-AGENT.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/01-DATA-PIPELINE-AGENT.md)
- Ana Blueprint: [docs/agents/00-MASTER-BLUEPRINT.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/00-MASTER-BLUEPRINT.md)
