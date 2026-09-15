#!/usr/bin/env python3
"""
tafsil.net — DP-012: Morphology SQL Seed Generator
Generates data-pipeline/seed/morphology_seed.sql from lexicon_roots.json
and quran_words_morphology.json for idempotent PostgreSQL loading.
"""

import os
import json

def sql_escape(val):
    if val is None:
        return "NULL"
    return "'" + str(val).replace("'", "''") + "'"

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(base_dir, "output")
    seed_dir = os.path.join(base_dir, "seed")
    os.makedirs(seed_dir, exist_ok=True)

    lexicon_file = os.path.join(output_dir, "lexicon_roots.json")
    words_file = os.path.join(output_dir, "quran_words_morphology.json")
    seed_sql_file = os.path.join(seed_dir, "morphology_seed.sql")

    print(f"Loading lexicon roots from {lexicon_file}...")
    with open(lexicon_file, 'r', encoding='utf-8') as f:
        roots = json.load(f)

    print(f"Loading morphology words from {words_file}...")
    with open(words_file, 'r', encoding='utf-8') as f:
        words = json.load(f)

    print(f"Generating {seed_sql_file} for {len(roots)} roots and {len(words)} words...")

    lines = []
    lines.append("-- ══════════════════════════════════════════════════════════════════════")
    lines.append("-- tafsil.net — DP-012: Morfolojik Kökler ve Kelimeler Tohumu")
    lines.append("-- Kaynak: Quranic Arabic Corpus (v0.4) & Tanzil Uthmani Metni")
    lines.append(f"-- Toplam: {len(roots)} Kök, {len(words)} Kelime (114 Sure, 6236 Ayet)")
    lines.append("-- ══════════════════════════════════════════════════════════════════════\n")
    lines.append("BEGIN;\n")

    # 1. Insert kokler
    lines.append("-- 1. Morfolojik Kökler Sözlüğü (1642 Kök)")
    lines.append("INSERT INTO kokler (kok_ar, kok_tr, kok_anlami) VALUES")

    root_rows = []
    for r in roots:
        kok_ar = sql_escape(r['kok_ar'])
        kok_tr = sql_escape(r['kok_tr'][:32])
        kok_anlami = sql_escape(r['anlam_ozeti'])
        root_rows.append(f"({kok_ar}, {kok_tr}, {kok_anlami})")

    lines.append(",\n".join(root_rows))
    lines.append("ON CONFLICT (kok_ar) DO UPDATE SET")
    lines.append("    kok_tr = EXCLUDED.kok_tr,")
    lines.append("    kok_anlami = CASE")
    lines.append("        WHEN kokler.kok_anlami IS NOT NULL AND length(kokler.kok_anlami) > 0 THEN kokler.kok_anlami")
    lines.append("        ELSE EXCLUDED.kok_anlami")
    lines.append("    END;\n")
    lines.append("SELECT setval('kokler_id_seq', (SELECT COALESCE(MAX(id), 1) FROM kokler));\n")

    # 2. Insert kelimeler in batches of 1000
    lines.append("-- 2. Kelimeler Tablosu (77.429 Kelime, Ayet ve Kök Eşleştirmesi)")
    batch_size = 1000
    total_batches = (len(words) + batch_size - 1) // batch_size

    for b_idx in range(total_batches):
        batch = words[b_idx * batch_size : (b_idx + 1) * batch_size]
        lines.append(f"-- Batch {b_idx + 1}/{total_batches} ({len(batch)} kelime)")
        lines.append("INSERT INTO kelimeler (ayet_id, kelime_no, metin_ar, metin_tr, kok_id, vezin, metin_en)")
        lines.append("SELECT a.id, v.kelime_no, v.metin_ar, v.metin_tr, k.id, v.vezin, v.metin_en")
        lines.append("FROM (VALUES")

        val_rows = []
        for i, w in enumerate(batch):
            s_id = w['sure_id']
            a_no = w['ayet_no']
            k_no = w['kelime_no']
            m_ar = sql_escape(w['metin_ar'])
            m_tr = "''"
            k_ar = sql_escape(w['kok_ar'])
            vez = sql_escape(w['vezin'][:32] if w['vezin'] else None)
            m_en = "NULL"

            # Cast first row in batch to ensure strict PostgreSQL column typing
            if i == 0:
                row_str = (
                    f"  ({s_id}::smallint, {a_no}::smallint, {k_no}::smallint, "
                    f"{m_ar}::varchar, {m_tr}::varchar, {k_ar}::varchar, "
                    f"{vez}::varchar, {m_en}::varchar)"
                )
            else:
                row_str = f"  ({s_id}, {a_no}, {k_no}, {m_ar}, {m_tr}, {k_ar}, {vez}, {m_en})"
            val_rows.append(row_str)

        lines.append(",\n".join(val_rows))
        lines.append(") AS v(sure_id, ayet_no, kelime_no, metin_ar, metin_tr, kok_ar, vezin, metin_en)")
        lines.append("JOIN ayetler a ON a.sure_id = v.sure_id AND a.ayet_no = v.ayet_no")
        lines.append("LEFT JOIN kokler k ON k.kok_ar = v.kok_ar")
        lines.append("ON CONFLICT (ayet_id, kelime_no) DO UPDATE SET")
        lines.append("    metin_ar = EXCLUDED.metin_ar,")
        lines.append("    kok_id = COALESCE(kelimeler.kok_id, EXCLUDED.kok_id),")
        lines.append("    vezin = CASE WHEN kelimeler.vezin IS NOT NULL AND kelimeler.vezin <> '' THEN kelimeler.vezin ELSE EXCLUDED.vezin END,")
        lines.append("    metin_tr = CASE WHEN kelimeler.metin_tr IS NOT NULL AND kelimeler.metin_tr <> '' THEN kelimeler.metin_tr ELSE EXCLUDED.metin_tr END,")
        lines.append("    metin_en = COALESCE(kelimeler.metin_en, EXCLUDED.metin_en);\n")

    lines.append("SELECT setval('kelimeler_id_seq', (SELECT COALESCE(MAX(id), 1) FROM kelimeler));\n")
    lines.append("COMMIT;\n")

    with open(seed_sql_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))

    file_size_mb = os.path.getsize(seed_sql_file) / (1024 * 1024)
    print(f"✓ Successfully generated {seed_sql_file} ({file_size_mb:.2f} MB, {total_batches} batches)")

if __name__ == "__main__":
    main()
