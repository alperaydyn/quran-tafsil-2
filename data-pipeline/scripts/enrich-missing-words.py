#!/usr/bin/env python3
"""
tafsil.net — Eksik Kelimeleri Tespit ve Zenginleştirme Aracı (Batch Lexicon Enrichment)

Bu script:
1. `ayetler.snapshot.json` içerisindeki tüm ayetleri okur ve benzersiz kelimeleri çıkarır.
2. `tafsil-ios-app/src/data/lexicon.seed.ts` dosyasındaki mevcut tohum kayıtlarıyla karşılaştırır.
3. Eksik kelimeleri ve Kur'an frekanslarını raporlar.
4. İsteğe bağlı olarak JSON formatında otomatik zenginleştirilmiş sözlük çıktısı üretir.
"""

import json
import re
import sys
from pathlib import Path
from collections import Counter

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
SNAPSHOT_FILE = ROOT_DIR / "tafsil-ios-app" / "src" / "data" / "ayetler.snapshot.json"
SEED_FILE = ROOT_DIR / "tafsil-ios-app" / "src" / "data" / "lexicon.seed.ts"
OUTPUT_FILE = ROOT_DIR / "data-pipeline" / "scripts" / "missing-words-report.json"

def clean_arabic(text: str) -> str:
    """Arapça hareke ve işaretleri siler."""
    return re.sub(r"[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]", "", text)

def load_seed_keys() -> set:
    """lexicon.seed.ts içindeki tüm anahtarları toplar."""
    if not SEED_FILE.exists():
        print(f"Hata: Tohum dosyası bulunamadı: {SEED_FILE}", file=sys.stderr)
        return set()
    
    content = SEED_FILE.read_text(encoding="utf-8")
    keys = re.findall(r"^\s*'([^']+?)':\s*\{", content, re.MULTILINE)
    clean_keys = {clean_arabic(k) for k in keys}
    print(f"Tohum dosyasında {len(keys)} anahtar ({len(clean_keys)} benzersiz harekesiz) bulundu.")
    return clean_keys

def analyze_corpus():
    """Snapshot ayetlerini tarar ve eksik kelimeleri tespit eder."""
    if not SNAPSHOT_FILE.exists():
        print(f"Hata: Snapshot dosyası bulunamadı: {SNAPSHOT_FILE}", file=sys.stderr)
        sys.exit(1)

    print(f"Snapshot yükleniyor: {SNAPSHOT_FILE}")
    with open(SNAPSHOT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    seed_keys = load_seed_keys()
    
    word_counter = Counter()
    verse_samples = {}
    
    for item in data:
        ar_text = item.get("ar", "")
        s = item.get("s", 0)
        a = item.get("a", 0)
        
        words = ar_text.split()
        for w in words:
            clean = clean_arabic(w)
            if not clean:
                continue
            word_counter[clean] += 1
            if clean not in verse_samples:
                verse_samples[clean] = {"s": s, "a": a, "raw": w, "tr": item.get("tr", "")}

    total_tokens = sum(word_counter.values())
    unique_words = len(word_counter)
    
    missing_words = []
    covered_tokens = 0
    missing_tokens = 0
    
    for clean_word, count in word_counter.most_common():
        if clean_word in seed_keys:
            covered_tokens += count
        else:
            missing_tokens += count
            sample = verse_samples.get(clean_word, {})
            missing_words.append({
                "clean": clean_word,
                "raw": sample.get("raw", clean_word),
                "count": count,
                "first_seen": f"{sample.get('s')}:{sample.get('a')}",
                "verse_tr": sample.get("tr", ""),
            })

    print("\n--- ANALİZ SONUÇLARI ---")
    print(f"Toplam Kelime Geçişi (Token): {total_tokens}")
    print(f"Benzersiz Kelime Formu: {unique_words}")
    print(f"Tohumda Mevcut Token: {covered_tokens} (%{covered_tokens / total_tokens * 100:.2f})")
    print(f"Eksik Token: {missing_tokens} (%{missing_tokens / total_tokens * 100:.2f})")
    print(f"Eksik Benzersiz Kelime: {len(missing_words)}")
    
    print("\nEn Sık Geçen Eksik 10 Kelime:")
    for w in missing_words[:10]:
        print(f"  - {w['raw']} ({w['clean']}): {w['count']} kez (İlk: {w['first_seen']})")

    report = {
        "summary": {
            "total_tokens": total_tokens,
            "unique_words": unique_words,
            "covered_tokens": covered_tokens,
            "missing_tokens": missing_tokens,
            "missing_unique": len(missing_words),
        },
        "top_missing": missing_words[:100],
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"\nRapor kaydedildi: {OUTPUT_FILE}")

if __name__ == "__main__":
    analyze_corpus()
