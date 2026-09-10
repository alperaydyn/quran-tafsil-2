# 02: Backend API & AI/RAG Orchestration Agent Specification

Bu belge, **Node.js (v20 LTS) + Fastify**, **PostgreSQL 16+ (pgvector)**, **Redis** ve **OpenRouter LLM Gateway** katmanlarından sorumlu **Backend Ajanı** için teknik şartnamedir.

---

## 1. Mimari Prensipler ve VPS Profili

- **Çalışma Ortamı:** Hostinger VPS (4 vCPU, 8 GB RAM, Ubuntu 22.04 LTS / Docker).
- **Framework:** Fastify v4/v5 (yüksek throughput, JSON şema doğrulama, düşük bellek).
- **Performans Hedefi:**
  - Statik Kur'an sorguları (L1 Redis / PgBouncer): **p95 < 50ms**.
  - Hibrit semantik arama (pgvector HNSW + FTS): **p95 < 200ms**.
  - Agentic RAG yanıtları: İlk token streaming **< 1.2s**.

---

## 2. Dizin Yapısı (`backend/`)

```
backend/
├── package.json
├── tsconfig.json
├── docker-compose.yml
├── .env.example
├── src/
│   ├── app.ts                  # Fastify app bootstrap & plugin register
│   ├── server.ts               # Sunucu port dinleyicisi
│   ├── config/                 # Ortam değişkenleri, veritabanı, Redis ayarları
│   ├── plugins/                # Auth, Rate-Limit, CORS, Swagger
│   ├── db/
│   │   ├── client.ts           # PostgreSQL pg-pool / Kysely / Drizzle client
│   │   ├── redis.ts            # ioredis client (L1 & L2 cache)
│   │   └── migrations/         # SQL migration dosyaları
│   ├── modules/
│   │   ├── quran/              # Sure, ayet, kelime endpoint'leri
│   │   ├── lexicon/            # Kökler, lisan sözlükleri, morfoloji
│   │   ├── concepts/           # DAG graf traversal, komşuluk sorguları
│   │   ├── understanding/      # Agentic RAG, chat oturumları, intent branching
│   │   ├── memorization/       # SM-2 algoritması, oturum yönetimi, BullMQ kuyruğu
│   │   ├── dashboard/          # Günün kartları, ısı haritası
│   │   └── auth/               # Apple / Google OAuth doğrulama ve JWT
│   └── services/
│       ├── openrouter.ts       # LLM Gateway istemcisi (model fallback & streaming)
│       ├── rag-orchestrator.ts # Çok adımlı araştırma ve anlamsal bağ kurucu
│       └── push-notifier.ts    # APNs (iOS) ve FCM (Android) bildirim motoru
```

---

## 3. Temel API Endpoint Sözleşmesi

### A. Kur'an Okuma Modülü
- `GET /api/v1/sureler`: 114 surenin tam listesi (mushaf veya nüzul sırasıyla).
- `GET /api/v1/sureler/:id/detay`: Sure meta bilgisi, nüzul dönemi ve ayet blokları.
- `GET /api/v1/ayetler/:id`: Ayet metni, meali, transliterasyonu, kelime dizisi ve zaman damgaları.
- `GET /api/v1/kelimeler/:id`: Kelime morfolojisi, kök türevleri, klasik sözlük notları.

### B. Kavram Ağı ve DAG Modülü
- `GET /api/v1/kavramlar/:slug/dag`: Seçilen kavramın doğrudan bağlı olduğu komşu düğümler (`node + 5 neighbors` lazy expansion).
  ```sql
  -- Recursive CTE ile 2. derece komşuluk sorgusu
  WITH RECURSIVE kavram_agi AS (
      SELECT kaynak_kavram_id, hedef_kavram_id, iliski_tipi, 1 as derinlik
      FROM kavram_iliskileri
      WHERE kaynak_kavram_id = $1
      UNION
      SELECT ki.kaynak_kavram_id, ki.hedef_kavram_id, ki.iliski_tipi, ka.derinlik + 1
      FROM kavram_iliskileri ki
      INNER JOIN kavram_agi ka ON ki.kaynak_kavram_id = ka.hedef_kavram_id
      WHERE ka.derinlik < 2
  )
  SELECT * FROM kavram_agi LIMIT 15;
  ```

### C. Anlama Çalışmaları (Agentic RAG — Server-Sent Events / Streaming)
- `POST /api/v1/anlama-oturumlari`: Yeni oturum başlatma.
- `POST /api/v1/anlama-oturumlari/:id/soru`: Soru ekleme ve LLM yanıtı (SSE akışı).
  - **Canlı Timeline Aşamaları:**
    1. `event: timeline_update` -> `{"step": "Kavramlar ayrıştırılıyor"}`
    2. `event: timeline_update` -> `{"step": "İlgili ayetler taranıyor (pgvector RRF)"}`
    3. `event: timeline_update` -> `{"step": "Özet ve okuma rotası oluşturuluyor"}`
    4. `event: token` -> `{"delta": "..."}`
  - **Intent & Kapsam Kontrolü:** Sorulan soru mevcut temayı aşıyorsa `event: intent_branch_prompt` ile kullanıcıya dallanma önerisi gönderilir.

### D. Ezber Oturumları ve SM-2 Kuyruğu
- `POST /api/v1/ezber-oturumlari`: Sure veya ayet aralığı için yeni ezber oturumu.
- `POST /api/v1/ezber-oturumlari/:id/degerlendir`: SM-2 skor geri bildirimi (`quality: 0..5`).
  - Formül:
    $$EF' = EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))$$
  - Sonraki tekrar zamanı `next_review_at` güncellenir ve BullMQ'ya gecikmeli iş (delayed job) eklenir.

---

## 4. OpenRouter Gateway ve Model Dağılımı

1. **Gelişmiş Akıl Yürütme (Deep RAG Sentezi):**
   - Birincil Model: `anthropic/claude-3.5-sonnet`
   - Fallback Model: `openai/gpt-4o`
2. **Hızlı Intent Sınıflandırma ve Kelime Hatırlatma (Fısıltı):**
   - Model: `google/gemini-flash-1.5` veya `meta-llama/llama-3.1-8b-instruct`
3. **Maliyet Güvenliği:**
   - İstemci başına günlük ücretsiz LLM sorgu kotası: 0 (Free tier yalnız statik detay oturumlarını okur).
   - Pro kullanıcılar için: 50 derin araştırma / gün.
   - Redis tabanlı Token Bucket rate limiting uygulanır.
