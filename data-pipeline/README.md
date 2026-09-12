# tafsil.net — Data Pipeline & Lexicon Engine

Kur'an metninin açık kaynaklardan (Tanzil, Quran.com, Quranic Arabic Corpus) çekilmesi, normalleştirilmesi, morfolojik köklerin ayrıştırılması, kavram etiketlemesi ve ses zaman damgalarının üretilmesini sağlayan veri hazırlık katmanı.

---

## 1. Kur'an Kaynak Metni (`uthmani.txt`)

- **Kaynak Dosya:** `data-pipeline/uthmani.txt`
- **Biçim:** Pipe-separated (`id|sureno|ayetno|text`)
- **Kapsam:** 114 Sure, **6236 ayet** (standart Hafs/Uthmani mushaf toplamı).
- **Düzeltme Notu (2026-09-11):** Dosyada Tevbe Suresi 128-129. ayetler eksikti (127 ayetle bitiyordu). `alquran.cloud` `quran-uthmani` baskısına karşı doğrulanıp aynı imla/harekeleme kurallarıyla eklendi; `scripts/quran-pages-juz.json` zaten bu iki ayet için doğru sayfa/cüz (207/11) içeriyordu. Yeni satırlar dosyanın sonundaki `id` numaralarını (6235, 6236) kullanır — `id` alanı hiçbir script tarafından işlevsel olarak kullanılmadığı için ~4900 satırı yeniden numaralandırmak yerine bu şekilde eklendi.

---

## 2. Meta Veri ve Koordinat Eşleştirmeleri

- **[surah-metadata.json](file:///Users/alperaydin/Projects/kuran-tafsil-net/data-pipeline/scripts/surah-metadata.json):** 114 surenin Türkçe adları, Arapça hat isimleri, nüzul sıraları, dönemleri (`erken_mekke`, `orta_mekke`, `gec_mekke`, `medine`), ayet sayıları ve özet açıklamaları.
- **[quran-pages-juz.json](file:///Users/alperaydin/Projects/kuran-tafsil-net/data-pipeline/scripts/quran-pages-juz.json):** Standart Medine Mushafı'ndaki 604 sayfa ve 30 cüzün tüm ayetlerle olan birebir koordinat eşleşmesi.
- **[kuran-meal-llm.json](file:///Users/alperaydin/Projects/kuran-tafsil-net/data-pipeline/kuran-meal-llm.json):** 6234 ayetin tamamı için meal (`ayah_translation`) ve cümle-bazlı Latin transliterasyon (`sentence_blocks[].display_text`) verisi. **Kaynak: `google/gemini-2.5-flash-lite` ile üretilmiş LLM çevirisi** — Süleymaniye Vakfı/Diyanet gibi resmi bir meal kaynağı değildir. Editoryal doğrulama yapılana kadar taslak (draft) kabul edilmelidir; bkz. `docs/agent-signals/agent-01.status.json` → Agent-05'e mesaj.
- **[seed/quran_seed.sql](file:///Users/alperaydin/Projects/kuran-tafsil-net/data-pipeline/seed/quran_seed.sql):** `uthmani.txt`, sure meta verileri, sayfa/cüz koordinatları ve `kuran-meal-llm.json`'dan üretilen `meal_tr`/`transliterasyon_tr` alanlarının birleştirilmesiyle üretilen, doğrudan PostgreSQL'e aktarılabilir toplu SQL insert dosyası. Docker (`pgvector/pgvector:pg16`) üzerinde migration + seed birlikte doğrulandı (114 sure, 6234 ayet, 0 boş meal/transliterasyon).

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
