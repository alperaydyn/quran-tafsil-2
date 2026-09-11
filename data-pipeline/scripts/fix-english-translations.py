#!/usr/bin/env python3
"""
İngilizce Çevirileri Tespit ve Düzeltme Scripti
==================================================
kuran-meal-gemma4-26B.json içindeki İngilizce çevrilmiş ayetleri ve
anlam bloklarını tespit eder, OpenRouter API üzerinden Türkçe olarak
yeniden çevirir ve dosyayı yerinde günceller.
"""

import json
import os
import re
import sys
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# ─── Yapılandırma ──────────────────────────────────────────────────────────────
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "google/gemini-2.5-flash"
CONCURRENCY = 6
MAX_RETRIES = 3
RETRY_DELAY = 2
SAVE_INTERVAL = 10
REQUEST_TIMEOUT = 90

COST_PER_M_INPUT = 0.10
COST_PER_M_OUTPUT = 0.40

# ─── Dosya Yolları ─────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR.parent
JSON_PATH = DATA_DIR / "kuran-meal-gemma4-26B.json"
UTHMANI_PATH = DATA_DIR / "uthmani.txt"
PROMPT_PATH = DATA_DIR / "prompts" / "translation-prompt.txt"
SURAH_META_PATH = SCRIPT_DIR / "surah-metadata.json"
BACKEND_ENV_PATH = DATA_DIR.parent / "backend" / ".env"

# ─── Dil Tespiti ───────────────────────────────────────────────────────────────
COMMON_EN_WORDS = {
    'the', 'and', 'of', 'to', 'in', 'is', 'that', 'for', 'it', 'as', 'was', 'with', 'be', 'by', 
    'on', 'not', 'he', 'i', 'this', 'are', 'or', 'his', 'from', 'at', 'which', 'but', 'they', 
    'an', 'were', 'their', 'we', 'who', 'whoever', 'indeed', 'allah', 'lord', 'messengers', 
    'messenger', 'believers', 'disbelievers', 'punishment', 'guidance', 'righteous', 'day', 
    'resurrection', 'those', 'when', 'them', 'have', 'has', 'had', 'will', 'say', 'said', 
    'what', 'all', 'if', 'no', 'him', 'your', 'you', 'so', 'my', 'our', 'do', 'does', 'did',
    'their', 'then', 'there', 'people', 'heavens', 'earth', 'fear', 'except', 'upon', 'o',
    'about', 'after', 'against', 'before', 'between', 'come', 'down', 'give', 'good', 'know',
    'make', 'man', 'me', 'more', 'much', 'only', 'other', 'out', 'see', 'some', 'such', 'than',
    'up', 'us', 'very', 'way', 'well', 'where', 'would', 'shall', 'unto', 'lo', 'verily'
}

TURKISH_CHARS = set('çğıöşüÇĞİÖŞÜ')

def is_english_text(text: str) -> bool:
    """Metnin İngilizce olup olmadığını kontrol et."""
    if not text or not text.strip():
        return False
    words = re.findall(r'[a-zA-Z]+', text.lower())
    if not words:
        return False
    
    en_matches = sum(1 for w in words if w in COMMON_EN_WORDS)
    ratio = en_matches / len(words)
    has_tr_char = any(c in text for c in TURKISH_CHARS)

    # İngilizce stopword yoğunluğu
    if en_matches >= 3 and ratio >= 0.18 and not has_tr_char:
        return True
    if en_matches >= 5 and ratio >= 0.15:
        return True
    if len(words) <= 5 and en_matches >= 2 and not has_tr_char:
        return True
    if 'the' in words and 'and' in words and not has_tr_char:
        return True
    return False


def needs_fixing(item: dict) -> tuple[bool, str]:
    """Bir ayetin düzeltilmeye ihtiyacı var mı?"""
    trans = item.get("ayah_translation", "").strip()
    if not trans:
        return True, "Boş meal"
    
    if is_english_text(trans):
        return True, "İngilizce meal"
    
    blocks = item.get("sentence_blocks", [])
    if not blocks:
        return True, "Boş bloklar"
    
    for idx, b in enumerate(blocks):
        meaning = b.get("turkish_meaning", "").strip()
        if not meaning:
            return True, f"Blok {idx+1} boş"
        if is_english_text(meaning):
            return True, f"Blok {idx+1} İngilizce"
            
    return False, ""


# ─── Global State ──────────────────────────────────────────────────────────────
results_lock = threading.Lock()
save_lock = threading.Lock()
shutdown_event = threading.Event()
fixed_count = 0
failed_count = 0
total_input_tokens = 0
total_output_tokens = 0


def get_api_key():
    key = os.environ.get("OPENROUTER_API_KEY")
    if key and key != "sk-or-xxxx":
        return key
    if BACKEND_ENV_PATH.exists():
        with open(BACKEND_ENV_PATH, "r") as f:
            for line in f:
                line = line.strip()
                if line.startswith("OPENROUTER_API_KEY="):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if val and val != "sk-or-xxxx":
                        return val
    print("❌ API key bulunamadı!")
    sys.exit(1)


def load_prompt():
    with open(PROMPT_PATH, "r", encoding="utf-8") as f:
        content = f.read().strip()
    
    header = (
        "SEN BİR TÜRKÇE KUR'AN MEALİ VE TEFSİR UZMANISIN.\n"
        "GÖREVİN: Arapça ayetleri SADECE VE SADECE TÜRKİYE TÜRKÇESİNE çevirmektir.\n"
        "ASLA İngilizce tek bir kelime dahi yazamazsın. İngilizce mealler kesinlikle yasaktır.\n\n"
    )
    extra_rule = (
        "\n\n══════════════════════════════════════════════════════════════════════\n"
        "KESİN VE TAVİZSİZ DİL KURALI:\n"
        "- Tüm çıktılar ('ayah_translation' ve tüm 'sentence_blocks[].turkish_meaning' alanları)\n"
        "  İSTİSNASIZ TÜRKİYE TÜRKÇESİ İLE YAZILACAKTIR.\n"
        "- ASLA İngilizce meal (Sahih International, Pickthall vb.) KULLANMA.\n"
        "- Tek bir İngilizce kelime dahi yazılması KESİNLİKLE YASAKTIR.\n"
        "══════════════════════════════════════════════════════════════════════\n"
    )
    return header + content + extra_rule


def load_surah_metadata():
    with open(SURAH_META_PATH, "r", encoding="utf-8") as f:
        return {item["id"]: item for item in json.load(f)}


def load_uthmani_verses():
    verses = {}
    with open(UTHMANI_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("id|"):
                continue
            parts = line.split("|", 3)
            if len(parts) == 4:
                s, a, text = int(parts[1]), int(parts[2]), parts[3].strip()
                verses[(s, a)] = text
    return verses


def extract_json(text):
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*\n?", "", text)
    text = re.sub(r"\n?```\s*$", "", text)
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    brace_start = text.find("{")
    if brace_start != -1:
        depth = 0
        in_string = False
        escape_next = False
        for i in range(brace_start, len(text)):
            c = text[i]
            if escape_next:
                escape_next = False
                continue
            if c == "\\":
                escape_next = True
                continue
            if c == '"' and not escape_next:
                in_string = not in_string
                continue
            if in_string:
                continue
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    cand = text[brace_start:i + 1]
                    try:
                        return json.loads(cand)
                    except json.JSONDecodeError:
                        cleaned = re.sub(r",\s*([}\]])", r"\1", cand)
                        try:
                            return json.loads(cleaned)
                        except json.JSONDecodeError:
                            pass
                    break
    return None


def call_openrouter(api_key, system_prompt, user_message):
    global total_input_tokens, total_output_tokens
    payload = json.dumps({
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.2,
        "top_p": 0.9,
        "max_tokens": 8192,
        "response_format": {"type": "json_object"},
    }).encode("utf-8")

    req = Request(
        OPENROUTER_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://tafsil.net",
            "X-Title": "Tafsil Translation Fixer",
        },
        method="POST"
    )

    with urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        usage = data.get("usage", {})
        with results_lock:
            total_input_tokens += usage.get("prompt_tokens", 0)
            total_output_tokens += usage.get("completion_tokens", 0)
        choices = data.get("choices", [])
        if choices:
            return choices[0].get("message", {}).get("content", "")
        return ""


def fix_verse(s_no, a_no, arabic, surah_name_tr, system_prompt, api_key):
    """Tek bir ayeti Türkçe olarak çevir ve doğrula."""
    key = f"{s_no}:{a_no}"
    user_message = (
        f"Sure: {s_no} ({surah_name_tr})\n"
        f"Ayet: {a_no}\n\n"
        f"Arapça Metin:\n{arabic}\n\n"
        f"ÖNEMLİ TALİMAT: Bu ayetin mealini ('ayah_translation') ve her bir anlam bloğunu ('turkish_meaning') "
        f"KESİNLİKLE TÜRKÇE yaz. Asla İngilizce çıktı verme."
    )

    for attempt in range(1, MAX_RETRIES + 1):
        if shutdown_event.is_set():
            return None
        try:
            raw = call_openrouter(api_key, system_prompt, user_message)
            parsed = extract_json(raw)
            if not parsed:
                time.sleep(RETRY_DELAY)
                continue

            trans = parsed.get("ayah_translation", "").strip()
            blocks = parsed.get("sentence_blocks", [])

            # Doğrulama: Türkçe mi?
            if is_english_text(trans):
                user_message += "\nUYARI: Önceki cevabın İngilizce oldu! Lütfen TÜRKÇE çevir!"
                time.sleep(RETRY_DELAY)
                continue

            has_en_block = any(is_english_text(b.get("turkish_meaning", "")) for b in blocks)
            if has_en_block or not blocks:
                user_message += "\nUYARI: Blok anlamları İngilizce olamaz! Lütfen hepsini TÜRKÇE yaz!"
                time.sleep(RETRY_DELAY)
                continue

            return {
                "surah_number": s_no,
                "ayah_number": a_no,
                "surah_name": parsed.get("surah_name", surah_name_tr),
                "ayah_translation": trans,
                "sentence_blocks": blocks,
                "model": MODEL_NAME,
            }
        except (HTTPError, URLError, TimeoutError) as e:
            time.sleep(RETRY_DELAY * attempt)
        except Exception as e:
            time.sleep(RETRY_DELAY)

    return None


def atomic_save(data_list):
    with save_lock:
        data_list.sort(key=lambda x: (x["surah_number"], x["ayah_number"]))
        tmp_path = JSON_PATH.with_suffix(".tmp")
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data_list, f, ensure_ascii=False, indent=2)
        tmp_path.replace(JSON_PATH)


def main():
    global fixed_count, failed_count
    api_key = get_api_key()
    system_prompt = load_prompt()
    surah_meta = load_surah_metadata()
    uthmani_verses = load_uthmani_verses()

    print("📖 kuran-meal-gemma4-26B.json yükleniyor...")
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        all_data = json.load(f)

    # İndeks haritası oluştur
    data_map = {(item["surah_number"], item["ayah_number"]): item for item in all_data}

    # Düzeltilecek ayetleri tespit et
    targets = []
    for item in all_data:
        needed, reason = needs_fixing(item)
        if needed:
            s, a = item["surah_number"], item["ayah_number"]
            targets.append((s, a, reason))

    print(f"\n🔍 Toplam {len(targets)} ayette İngilizce veya eksiklik tespit edildi.", flush=True)
    if not targets:
        print("✅ Düzeltilecek ayet yok! Tüm ayetler Türkçe ve eksiksiz.", flush=True)
        return

    print(f"🚀 {len(targets)} ayet OpenRouter ({MODEL_NAME}, Concurrency={CONCURRENCY}) ile düzeltiliyor...\n", flush=True)

    start_time = time.time()
    last_save_time = time.time()
    processed_since_save = 0

    with ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        future_to_target = {}
        for s_no, a_no, reason in targets:
            arabic = uthmani_verses.get((s_no, a_no), "")
            meta = surah_meta.get(s_no, {})
            surah_name_tr = meta.get("ad_tr", f"Sure {s_no}")
            
            f = executor.submit(fix_verse, s_no, a_no, arabic, surah_name_tr, system_prompt, api_key)
            future_to_target[f] = (s_no, a_no, reason)

        for future in as_completed(future_to_target):
            s_no, a_no, reason = future_to_target[future]
            try:
                res = future.result()
                if res:
                    with results_lock:
                        data_map[(s_no, a_no)] = res
                        fixed_count += 1
                        processed_since_save += 1
                    
                    cost = (total_input_tokens / 1_000_000 * COST_PER_M_INPUT) + (total_output_tokens / 1_000_000 * COST_PER_M_OUTPUT)
                    done = fixed_count + failed_count
                    print(f"  ✓ [{done}/{len(targets)}] {s_no}:{a_no} düzeltildi ({reason}) | ${cost:.3f}", flush=True)
                else:
                    with results_lock:
                        failed_count += 1
                    print(f"  ❌ {s_no}:{a_no} düzeltilemedi!", flush=True)
            except Exception as e:
                with results_lock:
                    failed_count += 1
                print(f"  ❌ {s_no}:{a_no} hata: {e}", flush=True)

            # Periyodik kaydet
            if processed_since_save >= SAVE_INTERVAL or (time.time() - last_save_time > 30):
                with results_lock:
                    atomic_save(list(data_map.values()))
                    processed_since_save = 0
                    last_save_time = time.time()

    # Son kaydet
    atomic_save(list(data_map.values()))
    elapsed = time.time() - start_time
    cost = (total_input_tokens / 1_000_000 * COST_PER_M_INPUT) + (total_output_tokens / 1_000_000 * COST_PER_M_OUTPUT)

    print("\n" + "═" * 65)
    print("  Düzeltme Özeti")
    print("═" * 65)
    print(f"  ✅ Başarıyla Düzeltilen : {fixed_count}")
    print(f"  ❌ Başarısız            : {failed_count}")
    print(f"  ⏱ Süre                 : {int(elapsed//60)}dk {int(elapsed%60)}sn")
    print(f"  💰 Maliyet              : ${cost:.3f}")
    print(f"  📁 Çıktı                : {JSON_PATH}")
    print("═" * 65)


if __name__ == "__main__":
    main()
