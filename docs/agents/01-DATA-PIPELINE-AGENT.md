# 01: Data Pipeline & Lexicon Engine Agent Specification

Bu belge, Kur'an metninin çekilmesi, normalleştirilmesi, morfolojik köklerin ayrıştırılması, kavramların etiketlenmesi ve ses zaman damgalarının üretilmesinden sorumlu **Data Pipeline Ajanı** için görev talimatnamesidir.

---

## 1. Görev ve Kapsam

Data Pipeline Ajanı, `data-pipeline/` dizini altında çalışır ve aşağıdaki sorumlulukları üstlenir:
1. **Açık Veri Çekme (Ingestion):** Tanzil.net / Uthmani metin (`data-pipeline/uthmani.txt`), Quran.com (çeviri/meal), Quranic Arabic Corpus (morfoloji).
   - **`uthmani.txt` Kaynağı:** Pipe-separated (`id|sureno|ayetno|text`). Toplam 114 Sure, **6234 ayet**. (Tevbe Suresi 127 ayettir; seeder Uthmani imlasını birebir korur).
2. **Normalizasyon ve Hiyerarşik Yapılandırma:**
   - Sure: 114 sure meta verisi (`scripts/surah-metadata.json`: ad, nüzul sırası, dönem).
   - Ayet: 6234 ayet Uthmani metni + Medine Mushafı koordinatları (`scripts/quran-pages-juz.json`: 604 sayfa, 30 cüz).
   - Ayet Blokları (anlam bütünlüğü tematik grupları).
   - Cümle ve Alt Cümle Segmentasyonu (`cumle_index`).
3. **Kavram Etiketleme Motoru:** Cümle içindeki kavramların `[<kavram>]` sözdizimiyle etiketlenmesi.
4. **Morfolojik Kök ve Frekans Matrisi:** Üçlü/dörtlü kök harfleri, lemma, vezin/bâb kalıbı ve Kur'an frekanslarının indekslenmesi.
5. **Ses Zaman Damgaları (Word Timestamps):** Kâri tilavet ses kayıtları için kelime seviyesinde `start_ms` ve `end_ms` zaman damgalarının (Whisper forced alignment) üretilmesi.
6. **PostgreSQL Seeder:** Çıktıların `data-pipeline/seed/quran_seed.sql` formatında hazırlanması ve veritabanına aktarımı (`npm run db:seed`).

---

## 2. Standart JSON Veri Formatları

### A. Ayet ve Cümle Segmentasyonu (`ayahs_processed.json`)
```json
[
  {
    "sure_id": 96,
    "ayet_no": 1,
    "blok_id": "96-b1",
    "cuz_no": 30,
    "sayfa_no": 597,
    "metin_ar": "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",
    "transliterasyon_tr": "İkra' bismi rabbikellezî halak",
    "meal_tr": "Yaratan Rabbinin adıyla oku!",
    "cumleler": [
      {
        "cumle_index": 1,
        "metin_ar": "اقْرَأْ بِاسْمِ رَبِّكَ",
        "metin_tr": "Yaratan Rabbinin adıyla [<oku>]!",
        "kavramlar": ["oku", "rab", "yaratilis"]
      }
    ],
    "kelimeler": [
      {
        "kelime_no": 1,
        "metin_ar": "اقْرَأْ",
        "metin_tr": "Oku",
        "kok_ar": "ق-ر-أ",
        "start_ms": 0,
        "end_ms": 780
      },
      {
        "kelime_no": 2,
        "metin_ar": "بِاسْمِ",
        "metin_tr": "adıyla",
        "kok_ar": "س-م-و",
        "start_ms": 780,
        "end_ms": 1240
      }
    ]
  }
]
```

### B. Morfolojik Kök Sözlüğü (`lexicon_roots.json`)
```json
[
  {
    "kok_ar": "ع-ل-ق",
    "kok_tr": "a-l-k",
    "anlam_ozeti": "Asılmak, yapışmak, sevgi bağı kurmak, pıhtılaşmış kan/embriyo hücresi",
    "toplam_frekans": 7,
    "turev_kelimeler": [
      { "kelime_ar": "عَلَقٍ", "vezin": "fa'al", "gecis_sayisi": 5 },
      { "kelime_ar": "عَلَقَةً", "vezin": "fa'alah", "gecis_sayisi": 2 }
    ]
  }
]
```

### C. Kavram İlişkileri DAG (`concept_graph.json`)
```json
[
  {
    "kaynak_slug": "adalet",
    "hedef_slug": "sahitlik",
    "iliski_tipi": "iliskili",
    "agirlik": 0.95,
    "aciklama": "Nisa 135 ve Maide 8 ayetlerinde adaletin şahitlik üzerindeki belirleyiciliği"
  }
]
```

---

## 3. Veri Pipeline Çalıştırma Adımları

1. **İndirme ve Ayrıştırma (Extract):**
   ```bash
   node data-pipeline/scripts/fetch-quran-data.js
   ```
2. **Morfoloji ve Kök Eşleştirme (Transform Roots):**
   ```bash
   node data-pipeline/scripts/build-lexicon-matrix.js
   ```
3. **Kavram Etiketleme ve Doğrulama (Concept Tagger):**
   ```bash
   node data-pipeline/scripts/tag-concepts.js
   ```
4. **Ses Zaman Damgası Alignment (Whisper Timestamps):**
   ```bash
   python3 data-pipeline/scripts/align_audio_timestamps.py
   ```
5. **Veritabanına Aktarım (Postgres Seed):**
   ```bash
   node data-pipeline/scripts/seed-database.js
   ```

---

## 4. Değişmezlik ve Güvenlik Kuralları
- Arapça orijinal metin hiçbir koşulda algoritmik olarak değiştirilemez veya sadeleştirilemez. Yalnızca Uthmani Mushaf standart metni esastır.
- Otomatik çıkarılan kavramlar `onaylandi = false` olarak işaretlenir; editoryal doğrulama geçtikten sonra prodüksiyona yansıtılır.
