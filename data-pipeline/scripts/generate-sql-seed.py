import json
import os

def escape_sql_string(val):
    if val is None:
        return "NULL"
    return "'" + str(val).replace("'", "''") + "'"

def main():
    os.makedirs("data-pipeline/seed", exist_ok=True)

    # 1. Load surah metadata
    with open("data-pipeline/scripts/surah-metadata.json", "r", encoding="utf-8") as f:
        surahs = json.load(f)

    # 2. Load page/juz mapping
    with open("data-pipeline/scripts/quran-pages-juz.json", "r", encoding="utf-8") as f:
        page_juz_map = json.load(f)

    # 3. Read uthmani.txt
    with open("data-pipeline/uthmani.txt", "r", encoding="utf-8") as f:
        lines = [l.strip() for l in f if l.strip()]

    header = lines[0].split("|")
    rows = [l.split("|") for l in lines[1:]]

    sql_statements = []
    sql_statements.append("-- ══════════════════════════════════════════════════════════════════════")
    sql_statements.append("-- tafsil.net — Kur'an Metni ve Sureler Seed Scripti")
    sql_statements.append("-- Kaynak: data-pipeline/uthmani.txt & Tanzil Medina Mushaf Page/Juz Map")
    sql_statements.append("-- ══════════════════════════════════════════════════════════════════════\n")
    sql_statements.append("BEGIN;\n")

    # Insert Sureler
    sql_statements.append("-- 1. Sureler (114 Sure)")
    sql_statements.append("INSERT INTO sureler (id, ad_tr, ad_ar, nuzul_sirasi, donem, ayet_sayisi, aciklama) VALUES")
    surah_values = []
    for s in surahs:
        val = f"({s['id']}, {escape_sql_string(s['ad_tr'])}, {escape_sql_string(s['ad_ar'])}, {s['nuzul_sirasi']}, {escape_sql_string(s['donem'])}, {s['ayet_sayisi']}, {escape_sql_string(s['aciklama'])})"
        surah_values.append(val)
    sql_statements.append(",\n".join(surah_values))
    sql_statements.append("ON CONFLICT (id) DO UPDATE SET")
    sql_statements.append("    ad_tr = EXCLUDED.ad_tr,")
    sql_statements.append("    ad_ar = EXCLUDED.ad_ar,")
    sql_statements.append("    nuzul_sirasi = EXCLUDED.nuzul_sirasi,")
    sql_statements.append("    donem = EXCLUDED.donem,")
    sql_statements.append("    ayet_sayisi = EXCLUDED.ayet_sayisi,")
    sql_statements.append("    aciklama = EXCLUDED.aciklama;\n")

    # Insert Ayetler in batches
    sql_statements.append("-- 2. Ayetler (uthmani.txt)")
    batch_size = 500
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        sql_statements.append("INSERT INTO ayetler (sure_id, ayet_no, cuz_no, sayfa_no, metin_ar) VALUES")
        ayah_values = []
        for r in batch:
            sure_id = int(r[1])
            ayet_no = int(r[2])
            text = r[3]
            coords = page_juz_map.get(f"{sure_id}:{ayet_no}", {"page": 1, "juz": 1})
            sayfa_no = coords["page"]
            cuz_no = coords["juz"]
            ayah_values.append(f"({sure_id}, {ayet_no}, {cuz_no}, {sayfa_no}, {escape_sql_string(text)})")
        sql_statements.append(",\n".join(ayah_values))
        sql_statements.append("ON CONFLICT (sure_id, ayet_no) DO UPDATE SET")
        sql_statements.append("    cuz_no = EXCLUDED.cuz_no,")
        sql_statements.append("    sayfa_no = EXCLUDED.sayfa_no,")
        sql_statements.append("    metin_ar = EXCLUDED.metin_ar;\n")

    sql_statements.append("COMMIT;\n")

    output_path = "data-pipeline/seed/quran_seed.sql"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_statements))

    print(f"Başarıyla SQL seed oluşturuldu: {output_path}")
    print(f"Toplam Sure: {len(surahs)}, Toplam Ayet: {len(rows)}")

if __name__ == "__main__":
    main()
