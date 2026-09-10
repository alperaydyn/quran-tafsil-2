# 00: Master Architecture Blueprint & Shared Contracts

Bu belge, **tafsil.net** ekosisteminin veri modelleri, veritabanı şeması, API sözleşmeleri ve alt sistemler arası entegrasyon sınırlarını belirleyen **ana teknik şartnamedir**.

---

## 1. Domain Veri Hiyerarşisi

Kur'an metni sistemde 6 kademeli bir hiyerarşiyle temsil edilir:

```
[Sure (1..114)]
   │
   └── [Ayet Bloğu (Anlam Bütünlüğü Grubu)]
          │
          └── [Ayet (1..6236)]
                 │
                 └── [Cümle / Sub-Sentence (Kavram Etiketli)]
                        │
                        └── [Kelime / Token (Zaman Damgalı)]
                               │
                               └── [Morfolojik Kök & Lemma]
```

### Temel Varlıklar (Entities)
1. **Sure (`sureler`):** Mushaf sırası, nüzul sırası, dönem (Erken Mekke, Orta Mekke, Geç Mekke, Medine), ayet sayısı, isim (Arapça, Türkçe okunuş, Türkçe anlam).
2. **Ayet Bloğu (`ayet_bloklari`):** Sure içi tematik bağlam grubu. Başlangıç ve bitiş ayet numaraları, editoryal tema başlığı.
3. **Ayet (`ayetler`):** Sure ID, ayet no, mushaf sayfa no, cüz no, orijinal Arapça metin (Uthmani hattı), transliterasyon, varsayılan meal (Türkçe), ses dosyası URI.
4. **Cümle Bloğu (`cumle_bloklari`):** Ayet içi cümle/yan cümle. `cumle_index`, metin, `kavramlar[]` (örn: `"İnsanı bir [<alak>]'tan yarattı"`).
5. **Kelime / Token (`kelimeler`):** Pozisyon (ayet içi sıra), Arapça yalın metin, harekeli metin, kelime meali, transliterasyon, ses başlangıç ms (`start_ms`), bitiş ms (`end_ms`).
6. **Morfolojik Kök (`kokler`):** Üçlü/dörtlü Arapça kök (örn. *ع-ل-ق*), lemma, vezin/kalıp, gramatikal kategori (fiil, isim vb.).
7. **Kavram (`kavramlar`):** Kavram adı (Türkçe / Arapça), açıklama, Kur'an içi ilk geçtiği yer, kategori, semantik etiketler.
8. **Kavram İlişkisi (`kavram_iliskileri`):** Kaynak kavram, hedef kavram, ilişki türü (`synonym`, `antonym`, `hierarchical_parent`, `cause_effect`, `associative`), ağırlık.

---

## 2. PostgreSQL 16+ Veritabanı Şeması

```sql
-- 1. Eklentiler
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Sureler Tablosu
CREATE TABLE sureler (
    id SMALLINT PRIMARY KEY,
    ad_tr VARCHAR(64) NOT NULL,
    ad_ar VARCHAR(64) NOT NULL,
    nuzul_sirasi SMALLINT NOT NULL,
    donem VARCHAR(32) NOT NULL CHECK (donem IN ('erken_mekke', 'orta_mekke', 'gec_mekke', 'medine')),
    ayet_sayisi SMALLINT NOT NULL,
    aciklama TEXT
);

-- 3. Ayetler Tablosu
CREATE TABLE ayetler (
    id SERIAL PRIMARY KEY,
    sure_id SMALLINT NOT NULL REFERENCES sureler(id),
    ayet_no SMALLINT NOT NULL,
    cuz_no SMALLINT NOT NULL,
    sayfa_no SMALLINT NOT NULL,
    metin_ar TEXT NOT NULL,
    transliterasyon_tr TEXT NOT NULL,
    meal_tr TEXT NOT NULL,
    ses_dosyasi_url VARCHAR(255),
    embedding vector(1536), -- pgvector OpenAI/Cohere embedding
    UNIQUE (sure_id, ayet_no)
);

-- 4. Kelimeler ve Morfoloji Tablosu
CREATE TABLE kokler (
    id SERIAL PRIMARY KEY,
    kok_ar VARCHAR(16) NOT NULL UNIQUE,
    kok_tr VARCHAR(32) NOT NULL,
    kok_anlami TEXT
);

CREATE TABLE kelimeler (
    id SERIAL PRIMARY KEY,
    ayet_id INT NOT NULL REFERENCES ayetler(id),
    kelime_no SMALLINT NOT NULL,
    metin_ar VARCHAR(64) NOT NULL,
    metin_tr VARCHAR(64) NOT NULL,
    kok_id INT REFERENCES kokler(id),
    vezin VARCHAR(32),
    start_ms INT NOT NULL DEFAULT 0,
    end_ms INT NOT NULL DEFAULT 0,
    UNIQUE (ayet_id, kelime_no)
);

-- 5. Kavramlar ve Yönlü Çevrimsiz Graf (DAG)
CREATE TABLE kavramlar (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(64) UNIQUE NOT NULL,
    baslik_tr VARCHAR(128) NOT NULL,
    baslik_ar VARCHAR(128),
    tanim TEXT NOT NULL,
    onaylandi BOOLEAN DEFAULT FALSE,
    olusturan_id UUID,
    embedding vector(1536)
);

CREATE TABLE kavram_iliskileri (
    id SERIAL PRIMARY KEY,
    kaynak_kavram_id INT NOT NULL REFERENCES kavramlar(id) ON DELETE CASCADE,
    hedef_kavram_id INT NOT NULL REFERENCES kavramlar(id) ON DELETE CASCADE,
    iliski_tipi VARCHAR(32) NOT NULL CHECK (iliski_tipi IN ('es_anlam', 'zit_anlam', 'kapsama', 'sebep_sonuc', 'iliskili')),
    agirlik NUMERIC(3,2) DEFAULT 1.0,
    UNIQUE(kaynak_kavram_id, hedef_kavram_id, iliski_tipi)
);

-- 6. Kullanıcılar ve İlerleme
CREATE TABLE kullanicilar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_provider VARCHAR(32) NOT NULL, -- apple, google
    auth_provider_id VARCHAR(128) NOT NULL UNIQUE,
    tercih_modu VARCHAR(16) DEFAULT 'ogrenme' CHECK (tercih_modu IN ('kesif', 'ogrenme', 'odak')),
    dil VARCHAR(8) DEFAULT 'tr',
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Ezber Oturumları (SM-2 Algoritması)
CREATE TABLE ezber_oturumlari (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kullanici_id UUID NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    sure_id SMALLINT NOT NULL REFERENCES sureler(id),
    baslangic_ayet SMALLINT NOT NULL,
    bitis_ayet SMALLINT NOT NULL,
    durum VARCHAR(32) DEFAULT 'ogreniliyor', -- ogreniliyor, kor_okuma, tekrar_bekliyor, pekistirildi
    repetition_number INT DEFAULT 0,
    interval_days INT DEFAULT 1,
    ease_factor NUMERIC(4,2) DEFAULT 2.5,
    next_review_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Anlama Çalışmaları (Agentic RAG Sessions)
CREATE TABLE anlama_oturumlari (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kullanici_id UUID NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    baslik VARCHAR(255) NOT NULL,
    odak_kavramlar TEXT[],
    sentez_ozeti TEXT,
    onerilen_okuma_sirasi INT[], -- ayet_id listesi
    durum VARCHAR(32) DEFAULT 'tamamlandi',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Önbellekleme Stratejisi (Redis)

- **L1 (TTL'siz Immutable Veri):**
  - Kur'an metni, mealler, kök sözlüğü ve transliterasyon verisi.
  - Anahtar Formatı: `quran:sure:{id}`, `quran:ayet:{sure}:{no}`, `lexicon:word:{id}`
- **L2 (TTL'li Dinamik / Kişisel Veri):**
  - Günün Kartları: `daily:cards:{date}` (TTL: 86400s)
  - Kavram Grafı Komşulukları: `dag:node:{id}:neighbors` (TTL: 3600s)
  - Anlama Oturumu Geçici Belleği: `rag:session:{sessionId}:context` (TTL: 1800s)

---

## 4. Ortak API Yanıt Sözleşmesi (Standard Response Format)

Tüm REST API yanıtları standart bir JSON sarmalayıcı (wrapper) kullanır:

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    cached?: boolean;
  };
}
```

---

## 5. Güvenlik ve Kimlik Doğrulama

1. **OAuth 2.0 / OpenID Connect:** Mobil ve web istemciler Apple Sign-In ve Google Sign-In ile doğrulama yapar; sunucu gelen id_token'ı doğrulayarak bir **JWT (HS256 veya RS256)** oturum token'ı üretir.
2. **Minimal PII Politikası:** Kullanıcı adı veya e-posta kalıcı olarak profilde depolanmaz; yalnızca kullanıcı UUID ve tercih ayarları saklanır.
3. **OpenRouter Entegrasyonu:** Tüm LLM istekleri sunucu tarafındaki Fastify servisi üzerinden OpenRouter API ile yürütülür. API anahtarları asla istemciye iletilmez.

---

## 6. Deployment Mimarisi Referansları

Tüm dağıtım, altyapı ve DevOps dokümantasyonu `docs/deployment/` dizininde yer alır:

| Doküman | Kapsam |
|---|---|
| [00-INFRASTRUCTURE.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/00-INFRASTRUCTURE.md) | VPS yapılandırması, güvenlik sertleştirme, Docker/Nginx kurulumu, staging izolasyonu, yedekleme |
| [01-BACKEND-DEPLOY.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/01-BACKEND-DEPLOY.md) | Fastify API dağıtımı (Docker, PM2, Nginx, migration, health check) |
| [02-WEB-DEPLOY.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/02-WEB-DEPLOY.md) | Next.js SSR dağıtımı (`new.tafsil.net`), ISR önbellek, OG kart üretimi |
| [03-MOBILE-DEPLOY.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/03-MOBILE-DEPLOY.md) | EAS Build, App Store / Play Store gönderimi, OTA güncellemeler |
| [04-CICD-PIPELINE.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/04-CICD-PIPELINE.md) | GitHub Actions CI/CD workflow'ları, branch stratejisi, otomatik dağıtım |
| [05-MONITORING.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/05-MONITORING.md) | Sentry, Uptime Robot, Netdata, log yönetimi, alarm politikası |

### Domain Yapısı

| Subdomain | Hizmet |
|---|---|
| `new.tafsil.net` | Yeni web platformu (Next.js SSR) — geçiş sonrası `tafsil.net` olacak |
| `api.tafsil.net` | Backend REST API (Fastify) |
| `staging.tafsil.net` | Web staging ortamı |
| `api-staging.tafsil.net` | API staging ortamı |
| `tafsil.net` | Mevcut site (geçiş tamamlanana kadar korunur) |
