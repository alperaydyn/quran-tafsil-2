# 04: Web Application & Sharing Portal Agent Specification

Bu belge, **tafsil.net** web uygulamasının (Next.js / React), derin bağlantı (Deep Link) karşılama sayfalarının, dinamik sosyal paylaşım kartı (Open Graph / Story) üretiminin ve masaüstü okuma deneyiminin geliştirilmesinden sorumlu **Web Ajanı** için teknik şartnamedir.

---

## 1. Görev ve Amaçlar

Web uygulaması, mobil deneyimi tamamlayan ve platformun organik yayılımını (virality) sağlayan iki temel fonksiyona sahiptir:
1. **Ziyaretçi ve Derin Bağlantı Karşılama:** Sosyal medyada paylaşılan bir ayet, kavram veya anlama oturumu linkine tıklayan kullanıcıya engelsiz, ultra hızlı bir okuma önizlemesi sunmak.
2. **Masaüstü Araştırma ve Tefekkür Deneyimi:** Geniş ekranda çok sütunlu Kur'an okuma, yan yana mealler, genişletilmiş DAG grafiği ve çalışma alanı yönetimi.
3. **Dinamik Kart Üreticisi:** Instagram Story (9:16 dikey) ve Twitter/WhatsApp (16:9 yatay) uyumlu tipografik görsel kart oluşturucu.

---

## 2. Teknoloji Tercihleri

- **Framework:** Next.js (App Router, Server Components & Edge Rendering).
- **Stil & Tasarım:** Vanilla CSS / Modern CSS Modules (mobil tasarım dili ve tipografiyle %100 uyumlu).
- **Görsel Üretim:** `@vercel/og` (Satori tabanlı sunucu taraflı SVG/PNG kart derleyici).
- **Veri Erişimi:** Fastify Backend REST API (`/api/v1/*`).

---

## 3. Temel Fonksiyonlar ve Rotalar

### A. Dinamik Derin Bağlantılar (Deep Links)
- `/ayet/:sureId/:ayetNo`: İlgili ayetin meali, orijinal metni ve kavram etiketleriyle doğrudan açılış sayfası.
- `/kavram/:slug`: Kavramın tanımı, Kur'an içi frekansı, geçtiği ilk ayet ve etkileşimli kavram ağı haritası.
- `/oturum/:id`: Paylaşıma açılmış bir Anlama Çalışması oturumunun sentez özeti ve önerilen okuma rotası.

### B. Dinamik Önizleme ve Paylaşım Kartı Üreticisi (`/api/og`)
Kullanıcı "Paylaş" butonuna bastığında istemci veya harici platformlar için anlık dinamik kart üretimi:
- **Formatlar:**
  - `format=story`: 1080x1920 (Instagram / TikTok Story).
  - `format=landscape`: 1200x630 (X / Twitter Card, WhatsApp önizleme).
- **Tasarım Standartları:** Koyu/açık editoryal arka plan, zarif altın/bronz çerçeve vurgusu, Uthmani hattıyla Arapça alıntı, meal metni ve "tafsil.net" filigranı.

### C. Topluluk Kavram Havuzu (`/topluluk`)
- Kullanıcıların paylaşıma açtığı kavram ağlarının ve doğrulanmış tefekkür notlarının listelendiği keşif sayfası.
- "Kendi Havuzuma Çatalla" (Fork) ve "Beğen" butonları (oturum açmış kullanıcılar için).

---

## 4. Dizin Yapısı (`tafsil-web-app/src/`)

```
tafsil-web-app/
├── package.json
├── next.config.mjs
├── ecosystem.config.js         # PM2 süreç yönetimi (Next.js SSR)
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx            # Web Karşılama ve Tanıtım
    │   ├── ayet/
    │   │   └── [sureId]/
    │   │       └── [ayetNo]/
    │   │           └── page.tsx # Ayet Derin Bağlantı Karşılama
    │   ├── kavram/
    │   │   └── [slug]/
    │   │       └── page.tsx    # Kavram DAG ve Detay Sayfası
    │   ├── topluluk/
    │   │   └── page.tsx        # Topluluk Havuzu
    │   └── api/
    │       └── og/
    │           └── route.tsx   # Dinamik Open Graph Kart Üretici
    ├── components/
    │   ├── reader/             # Geniş ekran okuma düzeni
    │   ├── dag-web/            # D3 / Canvas tabanlı web graf motoru
    │   └── share-card/         # Sosyal medya görsel dışa aktarma modülü
├── nginx/
│   └── new.tafsil.net.conf     # Nginx reverse proxy yapılandırması
└── styles/
    └── globals.css             # Tipografi ve editoryal tasarım token'ları
```

---

## 5. Prodüksiyon Dağıtımı

Web uygulaması VPS üzerinde PM2 ve Nginx ile `new.tafsil.net` subdomaini altında servis edilir. Mevcut `tafsil.net` sitesi kesintiye uğratılmaz; geçiş hazır olduğunda DNS yönlendirmesiyle tamamlanır.

### Temel Bileşenler
- **PM2:** Next.js SSR cluster mode (2 worker) → `ecosystem.config.js`
- **Nginx:** `new.tafsil.net` reverse proxy, statik varlık önbellekleme → `nginx/new.tafsil.net.conf`
- **ISR:** Ayet ve kavram sayfaları 24 saat `revalidate`, topluluk ve ana sayfa 30 dk-1 saat

### Hızlı Dağıtım

```bash
# Prodüksiyon derlemesi
npm run build

# PM2 ile başlat
pm2 start ecosystem.config.js --env production
```

> Kapsamlı dağıtım, ISR önbellek stratejisi ve geçiş planı için bkz:
> - [docs/deployment/02-WEB-DEPLOY.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/02-WEB-DEPLOY.md)
> - [docs/deployment/04-CICD-PIPELINE.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/04-CICD-PIPELINE.md)
