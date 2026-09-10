# tafsil.net — Çoklu Ajan Geliştirme ve Mimari Anayasası (AGENTS.md)

Bu belge, **tafsil.net** projesinde görev alan tüm bağımsız AI kodlama ajanları (Antigravity, Claude Code, Cursor, Windsurf, Copilot vb.) ve yazılımcılar için **temel kılavuz ve operasyonel protokol** niteliğindedir.

---

## 1. Proje Vizyonu ve Felsefesi

**tafsil.net**, Kur'an-ı Kerim'i standart kalıp tefsir ve sözlüklerin ötesinde; **kavramları Kur'an'ın kendi iç bağlamından, ayetler arası semantik bağlantılardan ve Arapça morfolojik kök matematiğinden yola çıkarak anlamlandıran** yeni nesil, elit bir dijital anlama platformudur.

### Temel Ayırt Edici Özellikler:
1. **Kitap Gibi Akıcı Okuma + Katmanlı Derinleşme:** Yüzeysel okumada akıcı ve kesintisiz; merak edilen noktada derin, yapılandırılmış ve yönlü çevrimsiz graf (DAG) ile takip edilebilir.
2. **Kişiselleştirilmiş İki Yönlü Analiz:**
   - *Sistem Tarafından Hazırlanan Detay Oturumları:* Kullanıcının okuma izlerine göre proaktif sunulan paketler.
   - *Kullanıcı Tarafından Başlatılan Anlama Çalışmaları (Agentic RAG):* Canlı araştırma, önerilen okuma rotası, intent denetimi ve oturum dallanması.
3. **Morfolojik Kök Analiz Motoru:** Kelimeleri üçlü/dörtlü kök, lemma, vezin/bâb ve i'rab seviyesinde ilişkilendiren deterministik altyapı.
4. **Etkileşimli Ezber Stüdyosu:** SM-2 / Leitner algoritması, akordeon akışı ve cihaz üzerinde konuşma tanıma (STT) ile sesli okurken beliren kelimeler (reveal-on-recite).
5. **Kelime Senkron Sesli Okuma:** Orijinal Arapça tilavet ve stüdyo kalitesinde Türkçe meal seslendirmesi üzerinde karaoke tarzı kelime vurgulama.
6. **3 Farklı Arayüz Modu:** Keşif (felsefi/merak, oyunlaştırmasız), Öğrenme (rehberli, dengeli), Odak (dikkat dağıtıcısız tilavet).

---

## 2. Ajan Rolleri ve Sorumluluk Matrisi

Proje, birbirini tamamlayan 6 uzmanlık ajanı tarafından geliştirilecek şekilde modülerleştirilmiştir:

```
                      ┌─────────────────────────────────────────┐
                      │    00: Master Orchestrator Agent        │
                      │  (Mimari Bütünlük, Şemalar, Protokoller)│
                      └────────────────────┬────────────────────┘
                                           │
         ┌──────────────────┬──────────────┴─────┬──────────────────┐
         │                  │                    │                  │
┌────────▼─────────┐ ┌──────▼──────────┐ ┌───────▼──────────┐ ┌─────▼────────────┐
│ 01: Data Pipeline│ │ 02: Backend API │ │ 03: Mobile App   │ │ 04: Web App      │
│     & Lexicon    │ │    & AI / RAG   │ │ (React Native/RN)│ │ (Next.js / Web)  │
│  (Tanzil, Corpus,│ │ (Fastify, PG,   │ │ (iOS First, Expo,│ │ (Deep Links,     │
│   Seed, Timestamps│ │  Redis, Vectors)│ │  Audio Sync, STT)│ │  OG Cards, Web) │
└──────────────────┘ └─────────────────┘ └──────────────────┘ └──────────────────┘
                                           │
                                 ┌─────────▼──────────────┐
                                 │ 05: Content & Editorial│
                                 │ (Tefsir, Nüzul, Blog)  │
                                 └────────────────────────┘
```

| Ajan No | Ajan Rolü | Detaylı Tarif Dosyası | Ana Sorumluluk Alanı |
|---|---|---|---|
| **00** | **Master Orchestrator** | [docs/agents/00-MASTER-BLUEPRINT.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/00-MASTER-BLUEPRINT.md) | Sistem mimarisi, veri sözleşmeleri, bağımlılıklar ve çapraz entegrasyon |
| **01** | **Data Pipeline & Lexicon** | [docs/agents/01-DATA-PIPELINE-AGENT.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/01-DATA-PIPELINE-AGENT.md) | Tanzil, Quranic Corpus, morfolojik analiz, `[<kavram>]` etiketleme, ses zaman damgası ETL |
| **02** | **Backend & AI/RAG** | [docs/agents/02-BACKEND-AGENT.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/02-BACKEND-AGENT.md) | Fastify API, PostgreSQL (`pgvector`), Redis önbellekleme, OpenRouter LLM Gateway, BullMQ kuyruk |
| **03** | **Mobile App (iOS/Android)** | [docs/agents/03-MOBILE-APP-AGENT.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/03-MOBILE-APP-AGENT.md) | Expo / React Native, WatermelonDB/SQLite offline-first, ses senkronizasyonu, Ezber Stüdyosu, DAG |
| **04** | **Web App & Portal** | [docs/agents/04-WEB-APP-AGENT.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/04-WEB-APP-AGENT.md) | Next.js / React web portalı, Open Graph dinamik kart üretimi, masaüstü okuma ve topluluk alanı |
| **05** | **Content & Editorial** | [docs/agents/05-CONTENT-EDITORIAL-AGENT.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/05-CONTENT-EDITORIAL-AGENT.md) | Nüzul kronolojisi araştırmaları, hafızlık/ezber analizleri, referans doğrulama kriterleri |

### Deployment Sorumluluk Matrisi

Dağıtım altyapısı ve DevOps süreçleri ajanlar arası paylaşımlı sorumluluk alanıdır. Kapsamlı rehber için bkz: [docs/deployment/](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/)

| Bileşen | Birincil Sorumlu | Deployment Rehberi |
|---|---|---|
| VPS Altyapı (Docker, Nginx, Güvenlik) | **00 Master** | [00-INFRASTRUCTURE.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/00-INFRASTRUCTURE.md) |
| Backend API Dağıtımı | **02 Backend** | [01-BACKEND-DEPLOY.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/01-BACKEND-DEPLOY.md) |
| Web App Dağıtımı | **04 Web App** | [02-WEB-DEPLOY.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/02-WEB-DEPLOY.md) |
| Mobil App Dağıtımı (App Store / Play Store) | **03 Mobile** | [03-MOBILE-DEPLOY.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/03-MOBILE-DEPLOY.md) |
| CI/CD Pipeline (GitHub Actions) | **00 Master** | [04-CICD-PIPELINE.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/04-CICD-PIPELINE.md) |
| İzleme ve Alarm | **02 Backend** | [05-MONITORING.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/05-MONITORING.md) |

---

## 3. Çalışma Kuralları ve Standartlar

Her ajan aşağıdaki değişmez ilkeleri gözetmekle yükümlüdür:

1. **Kur'an Metninin Dokunulmazlığı (Immutability):**
   - Arapça orijinal metin, hareke ve harf bütünlüğü asla bozulamaz.
   - Değişmez referans verileri veritabanında immutable işaretlenir ve Redis L1 önbelleğinde süresiz (TTL'siz) tutulur.
2. **Tasarım Mükemmeliyeti (Design Aesthetics):**
   - Klişe dini sembolizmden (aşırı varak, ağır tezhip) kesinlikle kaçınılmalıdır.
   - `tafsil-ios-app/design/project/Tafsil.dc.html` dosyasındaki editoryal tipografi, modern renk paletleri ve akıcı mikro animasyonlar referans alınmalıdır.
3. **Offline-First Yaklaşımı:**
   - Temel okuma, sure listeleri, mealler ve ezber stüdyosu çevrimdışı eksiksiz çalışmalıdır. Mobil ajan, yerel SQLite / WatermelonDB senkronizasyonunu buna göre kurgulamalıdır.
4. **Maliyet ve Kaynak Bilinci:**
   - Hostinger VPS (4 vCPU / 8 GB RAM) bütçe tavanı (~$100/ay) gözetilmelidir.
   - LLM çağrıları istemciden değil, Fastify backend üzerinden OpenRouter ile modele göre optimize edilerek (hızlı işler için Flash/Llama, akıl yürütme için Sonnet) çalıştırılmalıdır.
5. **DAG (Yönlü Çevrimsiz Graf) Mantığı:**
   - Kavram ilişkileri PostgreSQL'de `adjacency list` ve recursive CTE ile çözülür. Mobil ve web tarafında ise lazy expansion (seçilen + 5 komşu) uygulanır.

---

## 4. Dizin Yapısı (Repository Map)

```
kuran-tafsil-net/
├── README.md                      # Kapsamlı PRD dokümanı
├── AGENTS.md                      # Bu dosya: Tüm ajanlar için ana anayasa
├── CLAUDE.md                      # Claude uyumlu ajan talimat köprüsü
├── .cursorrules                   # Cursor uyumlu ajan kural köprüsü
├── .gitignore                     # Git yoksayma kuralları
│
├── docs/
│   ├── agents/                    # Her uzmanlık ajanı için müstakil tarifler
│   │   ├── 00-MASTER-BLUEPRINT.md
│   │   ├── 01-DATA-PIPELINE-AGENT.md
│   │   ├── 02-BACKEND-AGENT.md
│   │   ├── 03-MOBILE-APP-AGENT.md
│   │   ├── 04-WEB-APP-AGENT.md
│   │   └── 05-CONTENT-EDITORIAL-AGENT.md
│   └── deployment/                # Dağıtım ve altyapı dokümantasyonu
│       ├── 00-INFRASTRUCTURE.md   # VPS yapılandırması, güvenlik, Docker
│       ├── 01-BACKEND-DEPLOY.md   # Backend dağıtım rehberi
│       ├── 02-WEB-DEPLOY.md       # Web uygulama dağıtım rehberi
│       ├── 03-MOBILE-DEPLOY.md    # Mobil uygulama dağıtım rehberi
│       ├── 04-CICD-PIPELINE.md    # GitHub Actions CI/CD pipeline
│       └── 05-MONITORING.md       # İzleme ve alarm stratejisi
│
├── .github/
│   └── workflows/                 # CI/CD otomatik dağıtım pipeline'ları
│       ├── backend-deploy.yml     # Backend: lint → test → SSH deploy
│       ├── web-deploy.yml         # Web: lint → test → build → SSH deploy
│       └── mobile-build.yml       # Mobile: lint → test → EAS Build → Submit
│
├── data-pipeline/                 # [01 Data Pipeline Agent]
│   ├── README.md
│   ├── scripts/                   # Ayet, kök, kelime parser ve seed scriptleri
│   └── schema/                    # JSON şemaları ve tip tanımları
│
├── backend/                       # [02 Backend Agent]
│   ├── README.md
│   ├── src/                       # Fastify API, servisler, OpenRouter LLM orkestrasyonu
│   ├── db/                        # PostgreSQL migration'ları, pgvector ve Redis tanımları
│   ├── docker-compose.yml         # Docker servisleri (PostgreSQL, Redis, PgBouncer)
│   ├── docker-compose.staging.yml # Staging override
│   ├── Dockerfile                 # Multi-stage prodüksiyon imajı
│   ├── ecosystem.config.js        # PM2 süreç yönetimi
│   ├── .env.example               # Ortam değişkenleri şablonu
│   └── nginx/                     # Nginx reverse proxy yapılandırması
│
├── tafsil-ios-app/                # [03 Mobile App Agent]
│   ├── README.md
│   ├── design/                    # Claude Design prototip bundle'ı (Tafsil.dc.html)
│   ├── eas.json                   # EAS Build profilleri (dev, preview, production)
│   └── src/                       # Expo / React Native uygulama kodu
│
├── tafsil-web-app/                # [04 Web App Agent]
│   ├── README.md
│   ├── ecosystem.config.js        # PM2 süreç yönetimi (Next.js SSR)
│   ├── nginx/                     # Nginx reverse proxy yapılandırması
│   └── src/                       # Next.js / Web okuma ve paylaşım uygulaması
│
└── blog-contents/                 # [05 Content & Editorial Agent]
    ├── kuran-ezberi.md            # Hafızlık, cüz ayrımı fıkhî ve tarihî analizi
    └── kuran-ayet-siralamasi.md   # Nüzul vs Mushaf sırası analitiği
```

---

## 5. Ajanlar İçin Adım Adım İş Akışı

Bir ajan çalışmaya başladığında şu adımları izlemelidir:
1. **İlgili Tarif Dosyasını Oku:** Kendi alanına ait `docs/agents/XX-*.md` tarifini baştan sona oku.
2. **Sözleşmeyi Doğrula:** Değişiklik yapacağın bileşenin diğer ajanların alanını (veri şeması, API sözleşmesi, dizin yapısı) bozmadığından emin ol.
3. **Tasarım Referansını Kontrol Et:** UI bileşeni üretiyorsan `tafsil-ios-app/design/project/Tafsil.dc.html` dosyasındaki stillerle eşleştir.
4. **Doğrula ve Test Et:** Kod sentaksını, tipleri ve olası yan etkileri kontrol et.
