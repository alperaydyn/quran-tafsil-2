#!/usr/bin/env python3
"""
Kur'an Çeviri Scripti — OpenRouter API ile
============================================
uthmani.txt dosyasındaki tüm ayetleri, translation-prompt.txt promptunu
kullanarak OpenRouter API üzerinden çevirir ve JSON'a kaydeder.

Özellikler:
- Resume-capable: Kaldığı yerden devam eder
- Configurable concurrent workers ile paralel çalışır
- Retry mantığı: Başarısız ayetleri 3 kez dener
- Rate-limit aware: 429/529 hatalarında otomatik backoff
- Progress bar ile anlık durum takibi
- Partial save: Her N ayetten sonra dosyaya yazar
- Maliyet takibi: Tahmini token kullanımı ve maliyet hesabı
"""

import json
import os
import re
import sys
import time
import signal
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# ─── Yapılandırma ──────────────────────────────────────────────────────────────
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "google/gemini-2.5-flash-lite"
CONCURRENCY = 5          # OpenRouter rate limit'e göre ayarlanır
MAX_RETRIES = 3
RETRY_DELAY = 3           # saniye
SAVE_INTERVAL = 25        # Her N ayetten sonra diske yaz
REQUEST_TIMEOUT = 120     # 2 dakika timeout

# Maliyet bilgisi (USD per 1M tokens)
COST_PER_M_INPUT = 0.10
COST_PER_M_OUTPUT = 0.40

# ─── Dosya yolları ──────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR.parent
UTHMANI_PATH = DATA_DIR / "uthmani.txt"
PROMPT_PATH = DATA_DIR / "prompts" / "translation-prompt.txt"
SURAH_META_PATH = SCRIPT_DIR / "surah-metadata.json"
OUTPUT_PATH = DATA_DIR / "kuran-meal-gemma4-26B.json"

# API Key — backend/.env dosyasından veya environment variable'dan
BACKEND_ENV_PATH = DATA_DIR.parent / "backend" / ".env"

# ─── Global state ──────────────────────────────────────────────────────────────
results_lock = threading.Lock()
save_lock = threading.Lock()
shutdown_event = threading.Event()
translated_count = 0
failed_count = 0
skipped_count = 0
total_input_tokens = 0
total_output_tokens = 0


def get_api_key():
    """OpenRouter API Key'i çevre değişkeninden veya backend/.env'den al."""
    key = os.environ.get("OPENROUTER_API_KEY")
    if key and key != "sk-or-xxxx":
        return key

    # backend/.env dosyasından oku
    if BACKEND_ENV_PATH.exists():
        with open(BACKEND_ENV_PATH, "r") as f:
            for line in f:
                line = line.strip()
                if line.startswith("OPENROUTER_API_KEY="):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if val and val != "sk-or-xxxx":
                        return val

    print("❌ OpenRouter API Key bulunamadı!")
    print("   Lütfen aşağıdakilerden birini yapın:")
    print("   1. OPENROUTER_API_KEY environment variable'ı ayarlayın")
    print("   2. backend/.env dosyasına geçerli bir key ekleyin")
    sys.exit(1)


def load_prompt():
    """Translation promptunu oku."""
    with open(PROMPT_PATH, "r", encoding="utf-8") as f:
        return f.read().strip()


def load_surah_metadata():
    """Sure metadata'sını yükle (sure adları için)."""
    with open(SURAH_META_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {item["id"]: item for item in data}


def load_verses():
    """uthmani.txt dosyasından ayetleri parse et."""
    verses = []
    with open(UTHMANI_PATH, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line or line.startswith("id|"):
                continue  # Header satırını atla
            parts = line.split("|", 3)
            if len(parts) != 4:
                print(f"⚠ Satır {line_num}: Geçersiz format, atlanıyor: {line[:60]}")
                continue
            verse_id, surah_no, ayah_no, text = parts
            verses.append({
                "id": int(verse_id),
                "surah_number": int(surah_no),
                "ayah_number": int(ayah_no),
                "arabic_text": text.strip()
            })
    return verses


def load_existing_results():
    """Daha önce çevrilmiş sonuçları yükle (resume için)."""
    if OUTPUT_PATH.exists():
        try:
            with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            existing = {}
            for item in data:
                key = f"{item['surah_number']}:{item['ayah_number']}"
                existing[key] = item
            print(f"✅ {len(existing)} mevcut çeviri yüklendi (resume modu)")
            return existing
        except (json.JSONDecodeError, KeyError) as e:
            print(f"⚠ Mevcut dosya okunamadı, sıfırdan başlanıyor: {e}")
    return {}


def save_results(results_dict):
    """Sonuçları sıralı JSON olarak diske yaz."""
    with save_lock:
        sorted_results = sorted(
            results_dict.values(),
            key=lambda x: (x["surah_number"], x["ayah_number"])
        )
        # Atomic write: önce temp dosyaya yaz, sonra rename
        tmp_path = OUTPUT_PATH.with_suffix(".tmp")
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(sorted_results, f, ensure_ascii=False, indent=2)
        tmp_path.replace(OUTPUT_PATH)


def extract_json_from_response(text):
    """LLM çıktısından JSON objesini çıkar — çeşitli formatları destekler."""
    text = text.strip()

    # 1) Markdown code fence temizle
    text = re.sub(r"^```(?:json)?\s*\n?", "", text)
    text = re.sub(r"\n?```\s*$", "", text)
    text = text.strip()

    # 2) <think>...</think> bloklarını temizle
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    text = text.strip()

    # 3) Doğrudan JSON parse dene
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 4) İlk { ... } bloğunu bul (derin eşleştirme)
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
                    candidate = text[brace_start:i + 1]
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        # Trailing comma temizle ve tekrar dene
                        cleaned = re.sub(r",\s*([}\]])", r"\1", candidate)
                        try:
                            return json.loads(cleaned)
                        except json.JSONDecodeError:
                            pass
                    break

    return None


def call_openrouter(api_key, system_prompt, user_message):
    """OpenRouter API'ye istek gönder."""
    global total_input_tokens, total_output_tokens

    payload = json.dumps({
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.3,
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
            "X-Title": "Tafsil Quran Translation Pipeline",
        },
        method="POST"
    )

    try:
        with urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            data = json.loads(resp.read().decode("utf-8"))

            # Token kullanımını takip et
            usage = data.get("usage", {})
            with results_lock:
                total_input_tokens += usage.get("prompt_tokens", 0)
                total_output_tokens += usage.get("completion_tokens", 0)

            choices = data.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "")
            return ""

    except HTTPError as e:
        if e.code == 429:
            raise RateLimitError(f"Rate limit aşıldı (429)")
        elif e.code == 529:
            raise RateLimitError(f"Sunucu yoğun (529)")
        elif e.code == 402:
            raise CreditError(f"Yetersiz kredi (402) — OpenRouter hesabınıza kredi yükleyin")
        else:
            body = e.read().decode("utf-8", errors="replace")[:200]
            raise ConnectionError(f"HTTP {e.code}: {body}")
    except (URLError, TimeoutError) as e:
        raise ConnectionError(f"Bağlantı hatası: {e}")


class RateLimitError(Exception):
    pass


class CreditError(Exception):
    pass


def translate_verse(verse, system_prompt, surah_meta, api_key):
    """Tek bir ayeti çevir — retry mantığı ile."""
    surah_no = verse["surah_number"]
    ayah_no = verse["ayah_number"]
    arabic = verse["arabic_text"]
    key = f"{surah_no}:{ayah_no}"

    meta = surah_meta.get(surah_no, {})
    surah_name_tr = meta.get("ad_tr", f"Sure {surah_no}")

    user_message = (
        f"Sure numarası: {surah_no} ({surah_name_tr})\n"
        f"Ayet numarası: {ayah_no}\n\n"
        f"Arapça ayet:\n{arabic}\n\n"
        f"DİKKAT: 'ayah_translation' ve 'turkish_meaning' alanları İSTİSNASIZ TÜRKÇE olmalıdır. Asla İngilizce çeviri yazma."
    )

    for attempt in range(1, MAX_RETRIES + 1):
        if shutdown_event.is_set():
            return None

        try:
            raw_response = call_openrouter(api_key, system_prompt, user_message)
            parsed = extract_json_from_response(raw_response)

            if parsed is None:
                print(f"\n  ⚠ [{key}] Deneme {attempt}/{MAX_RETRIES}: JSON parse edilemedi")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY)
                continue

            # Zorunlu alanları kontrol et ve düzelt
            result = {
                "surah_number": surah_no,
                "ayah_number": ayah_no,
                "surah_name": parsed.get("surah_name", surah_name_tr),
                "ayah_translation": parsed.get("ayah_translation", ""),
                "sentence_blocks": parsed.get("sentence_blocks", []),
                "model": MODEL_NAME,
            }

            # sentence_blocks doğrulama
            if not isinstance(result["sentence_blocks"], list) or len(result["sentence_blocks"]) == 0:
                print(f"\n  ⚠ [{key}] Deneme {attempt}/{MAX_RETRIES}: Boş sentence_blocks")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY)
                continue

            return result

        except RateLimitError as e:
            wait = RETRY_DELAY * (2 ** attempt)  # Exponential backoff: 6, 12, 24 sn
            print(f"\n  ⏳ [{key}] {e} — {wait}s bekleniyor...")
            time.sleep(wait)

        except CreditError as e:
            print(f"\n  ❌ {e}")
            shutdown_event.set()
            return None

        except ConnectionError as e:
            print(f"\n  ⚠ [{key}] Deneme {attempt}/{MAX_RETRIES}: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY * attempt)

        except Exception as e:
            print(f"\n  ❌ [{key}] Beklenmeyen hata: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY)

    return None  # Tüm denemeler başarısız


def progress_bar(current, total, bar_len=40, prefix="", suffix=""):
    """Terminal progress bar."""
    pct = current / total if total > 0 else 0
    filled = int(bar_len * pct)
    bar = "█" * filled + "░" * (bar_len - filled)
    sys.stdout.write(f"\r{prefix} [{bar}] {current}/{total} ({pct*100:.1f}%) {suffix}  ")
    sys.stdout.flush()


def format_cost():
    """Mevcut maliyet tahmini."""
    cost = (total_input_tokens / 1_000_000 * COST_PER_M_INPUT +
            total_output_tokens / 1_000_000 * COST_PER_M_OUTPUT)
    return f"${cost:.3f}"


def main():
    global translated_count, failed_count, skipped_count

    print("═" * 70)
    print("  Kur'an Çeviri Pipeline — OpenRouter API")
    print(f"  Model: {MODEL_NAME} | Concurrency: {CONCURRENCY}")
    print("═" * 70)

    # Graceful shutdown handler
    def signal_handler(sig, frame):
        print("\n\n⏹ Durdurma sinyali alındı, mevcut işler bitiriliyor...")
        shutdown_event.set()

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # API key
    api_key = get_api_key()
    print(f"\n🔑 API Key: ...{api_key[-6:]}")

    # Dosyaları yükle
    print("📖 Dosyalar yükleniyor...")
    system_prompt = load_prompt()
    surah_meta = load_surah_metadata()
    verses = load_verses()
    existing = load_existing_results()

    total = len(verses)
    print(f"   Toplam ayet: {total}")
    print(f"   Mevcut çeviri: {len(existing)}")

    # Çevrilecek ayetleri filtrele
    pending = []
    for v in verses:
        key = f"{v['surah_number']}:{v['ayah_number']}"
        if key not in existing:
            pending.append(v)
        else:
            skipped_count += 1

    print(f"   Çevrilecek: {len(pending)}")
    print(f"   Atlanan (mevcut): {skipped_count}")

    if not pending:
        print("\n✅ Tüm ayetler zaten çevrilmiş!")
        return

    # Maliyet tahmini
    est_input_tokens = len(pending) * 900  # ~900 token/ayet (system + user)
    est_output_tokens = len(pending) * 350  # ~350 token/ayet
    est_cost = (est_input_tokens / 1_000_000 * COST_PER_M_INPUT +
                est_output_tokens / 1_000_000 * COST_PER_M_OUTPUT)
    print(f"\n💰 Tahmini maliyet: ~${est_cost:.2f}")
    print(f"   (~{est_input_tokens/1_000_000:.1f}M input + ~{est_output_tokens/1_000_000:.1f}M output tokens)")

    # Bağlantı testi
    print("\n🔗 OpenRouter bağlantısı test ediliyor...")
    try:
        test_msg = "Sure numarası: 1\nAyet numarası: 1\n\nArapça ayet:\nبِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
        test_resp = call_openrouter(api_key, system_prompt, test_msg)
        test_parsed = extract_json_from_response(test_resp)
        if test_parsed:
            print("   ✅ Bağlantı başarılı, JSON çıktısı doğrulandı")
            # Test sonucunu kaydet
            key = "1:1"
            if key not in existing:
                existing[key] = {
                    "surah_number": 1,
                    "ayah_number": 1,
                    "surah_name": test_parsed.get("surah_name", "Fâtiha"),
                    "ayah_translation": test_parsed.get("ayah_translation", ""),
                    "sentence_blocks": test_parsed.get("sentence_blocks", []),
                    "model": MODEL_NAME,
                }
                pending = [v for v in pending if f"{v['surah_number']}:{v['ayah_number']}" != "1:1"]
                translated_count += 1
        else:
            print("   ⚠ Yanıt geldi ama JSON parse edilemedi. Devam ediliyor...")
            print(f"   Ham yanıt (ilk 300): {test_resp[:300]}")
    except CreditError as e:
        print(f"   ❌ {e}")
        sys.exit(1)
    except Exception as e:
        print(f"   ❌ Bağlantı hatası: {e}")
        sys.exit(1)

    # Çeviri başlat
    start_time = time.time()
    save_counter = 0
    completed_in_session = 0

    print(f"\n🚀 Çeviri başlıyor... ({len(pending)} ayet)")
    print("   Durdurmak için Ctrl+C basın (ilerleme kaydedilir)\n")

    with ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = {}
        for verse in pending:
            if shutdown_event.is_set():
                break
            future = executor.submit(translate_verse, verse, system_prompt, surah_meta, api_key)
            futures[future] = verse

        for future in as_completed(futures):
            if shutdown_event.is_set():
                for f in futures:
                    f.cancel()
                break

            verse = futures[future]
            key = f"{verse['surah_number']}:{verse['ayah_number']}"

            try:
                result = future.result()
                if result:
                    with results_lock:
                        existing[key] = result
                        translated_count += 1
                        completed_in_session += 1
                        save_counter += 1
                else:
                    failed_count += 1
                    print(f"\n  ❌ [{key}] Çeviri başarısız (tüm denemeler tükendi)")

            except Exception as e:
                failed_count += 1
                print(f"\n  ❌ [{key}] İş parçacığı hatası: {e}")

            # Periyodik kaydetme
            if save_counter >= SAVE_INTERVAL:
                save_results(existing)
                save_counter = 0

            # İlerleme göster
            done = translated_count + failed_count
            elapsed = time.time() - start_time
            if completed_in_session > 0:
                rate = completed_in_session / elapsed * 60  # ayet/dk
                eta_min = (len(pending) - completed_in_session) / (completed_in_session / elapsed) / 60
                suffix = f"| {rate:.0f} ayet/dk | ETA: {eta_min:.0f}dk | {format_cost()}"
            else:
                suffix = ""

            progress_bar(
                done, len(pending),
                prefix=f"  ✓{translated_count} ✗{failed_count}",
                suffix=suffix
            )

    # Son kayıt
    save_results(existing)

    # Özet
    elapsed = time.time() - start_time
    hours = int(elapsed // 3600)
    minutes = int((elapsed % 3600) // 60)
    seconds = int(elapsed % 60)
    final_cost = format_cost()

    print("\n\n" + "═" * 70)
    print("  Çeviri Özeti")
    print("═" * 70)
    print(f"  ✅ Başarılı   : {translated_count}")
    print(f"  ❌ Başarısız  : {failed_count}")
    print(f"  ⏭ Atlanan    : {skipped_count}")
    print(f"  📊 Toplam    : {total}")
    print(f"  ⏱ Süre       : {hours}s {minutes}dk {seconds}sn")
    print(f"  💰 Maliyet   : {final_cost}")
    print(f"  📊 Tokenlar  : {total_input_tokens:,} input + {total_output_tokens:,} output")
    print(f"  📁 Çıktı     : {OUTPUT_PATH}")

    if completed_in_session > 0:
        avg_time = elapsed / completed_in_session
        remaining = len(pending) - completed_in_session
        if remaining > 0:
            est_min = (remaining * avg_time) / 60
            print(f"  ⏳ Kalan tahm.: ~{est_min:.0f} dakika ({remaining} ayet)")

    if failed_count > 0:
        print(f"\n  ⚠ {failed_count} ayet çevrilemedi. Script'i tekrar çalıştırarak")
        print("    sadece başarısız olanlar yeniden denenecektir.")
    print("═" * 70)


if __name__ == "__main__":
    main()
