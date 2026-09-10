# 02: Web Uygulaması Dağıtım Rehberi

Next.js web uygulamasının VPS üzerinde PM2, Nginx reverse proxy ve ISR önbellek stratejisiyle dağıtım rehberi. Yeni platform `new.tafsil.net` subdomaini altında servis edilir.

---

## 1. Mimari Özet

```
İstemci → Cloudflare (CDN + SSL) → Nginx (:443) → Next.js SSR (:3000)
                                                         ↓
                                                   Fastify API (:4000)
```

- **Next.js:** App Router, Server Components, Edge Runtime (OG kartları için).
- **PM2:** Cluster mode ile 2 worker, otomatik restart.
- **Nginx:** `new.tafsil.net` reverse proxy, statik varlık önbellekleme.
- **Cloudflare:** DDoS koruması, SSL terminasyonu, `/_next/static/*` agresif önbellekleme.

---

## 2. Prodüksiyon Derlemesi

```bash
cd /opt/tafsil/web

# Bağımlılıkları yükle
npm ci

# Prodüksiyon derlemesi
npm run build

# Derleme çıktısını doğrula
ls -la .next/
```

### Build Ortam Değişkenleri

```bash
# .env.production (web app için)
NEXT_PUBLIC_API_URL=https://api.tafsil.net
NEXT_PUBLIC_SITE_URL=https://new.tafsil.net
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX          # Google Analytics (opsiyonel)
SENTRY_DSN=https://xxx@sentry.io/xxx    # Sentry hata izleme
```

---

## 3. PM2 ile SSR Sunucusu

Yapılandırma: [tafsil-web-app/ecosystem.config.js](file:///Users/alperaydin/Projects/kuran-tafsil-net/tafsil-web-app/ecosystem.config.js)

```bash
cd /opt/tafsil/web

# PM2 ile başlat
pm2 start ecosystem.config.js --env production

# Sistem başlangıcına ekle
pm2 save
```

### PM2 Parametreleri

| Parametre | Değer |
|---|---|
| **İşlem Adı** | `tafsil-web` |
| **Port** | 3000 (prodüksiyon), 3100 (staging) |
| **Mod** | Cluster (2 worker) |
| **Max Memory** | 768 MB |
| **Log Rotation** | 10 MB / dosya, 7 gün |

---

## 4. Nginx Reverse Proxy

Yapılandırma: [tafsil-web-app/nginx/new.tafsil.net.conf](file:///Users/alperaydin/Projects/kuran-tafsil-net/tafsil-web-app/nginx/new.tafsil.net.conf)

### Kurulum

```bash
sudo cp /opt/tafsil/web/nginx/new.tafsil.net.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/new.tafsil.net.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Öne Çıkan Özellikler

- **Statik varlık önbellekleme:** `/_next/static/*` → `Cache-Control: public, max-age=31536000, immutable`
- **Next.js Image Optimization:** `/_next/image` proxy desteği
- **Gzip/Brotli:** JavaScript, CSS, JSON ve SVG sıkıştırma
- **Güvenlik başlıkları:** `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`

---

## 5. ISR (Incremental Static Regeneration) Önbellek Stratejisi

Ayet ve kavram sayfaları değişmez (immutable) içerik olduğundan agresif önbellekleme uygulanır:

| Sayfa Rotası | Revalidate Süresi | Strateji |
|---|---|---|
| `/ayet/:sureId/:ayetNo` | 86400 (24 saat) | Statik üretim + ISR |
| `/kavram/:slug` | 86400 (24 saat) | Statik üretim + ISR |
| `/oturum/:id` | 3600 (1 saat) | Dinamik SSR |
| `/topluluk` | 1800 (30 dk) | SSR + client fetch |
| `/` (Ana sayfa) | 3600 (1 saat) | SSR |
| `/api/og` | Yok (on-demand) | Edge Runtime |

### Cloudflare Cache Rules

```
# Statik varlıklar (immutable)
URL: new.tafsil.net/_next/static/*
Cache Level: Cache Everything
Edge TTL: 1 year

# ISR sayfaları
URL: new.tafsil.net/ayet/*
Cache Level: Cache Everything
Edge TTL: 1 hour
Browser TTL: Respect Existing Headers

# API ve dinamik rotalar
URL: new.tafsil.net/api/*
Cache Level: Bypass
```

---

## 6. Open Graph Kart Üretimi (Edge Runtime)

`/api/og` endpoint'i `@vercel/og` (Satori) ile sunucu taraflı SVG→PNG dönüşümü yapar. Next.js Edge Runtime üzerinde çalışır:

```typescript
// Kullanım örneği
// GET /api/og?type=ayet&sure=96&ayet=1&format=landscape
// GET /api/og?type=kavram&slug=adalet&format=story
```

- **Performans:** Edge Runtime ile ~200ms kart üretimi.
- **Önbellekleme:** Cloudflare seviyesinde aynı parametreler için 24 saat cache.

---

## 7. Dağıtım Akışı

```bash
# 1. VPS'e bağlan
ssh hostinger

# 2. Güncel kodu çek
cd /opt/tafsil/web
git pull origin main

# 3. Bağımlılıkları güncelle
npm ci

# 4. Prodüksiyon derlemesi
npm run build

# 5. PM2 ile sıfır kesinti yeniden yükleme
pm2 reload tafsil-web

# 6. Doğrulama
curl -s -o /dev/null -w "%{http_code}" https://new.tafsil.net
```

> **Not:** Bu adımlar CI/CD pipeline ile otomatikleştirilmiştir. Bkz: [04-CICD-PIPELINE.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/04-CICD-PIPELINE.md)

---

## 8. Staging Ortamı

| Parametre | Prodüksiyon | Staging |
|---|---|---|
| **URL** | `https://new.tafsil.net` | `https://staging.tafsil.net` |
| **Port** | 3000 | 3100 |
| **API** | `https://api.tafsil.net` | `https://api-staging.tafsil.net` |
| **PM2 İşlem** | `tafsil-web` | `tafsil-web-staging` |

```bash
# Staging derlemesi ve başlatma
cd /opt/tafsil/web
NEXT_PUBLIC_API_URL=https://api-staging.tafsil.net npm run build
pm2 start ecosystem.config.js --env staging
```

---

## 9. Geçiş Planı (new.tafsil.net → tafsil.net)

Yeni platform tam olarak hazır ve kullanıcı tarafından onaylandığında:

1. Cloudflare DNS'te `tafsil.net` A kaydını yeni VPS IP'sine yönlendir.
2. Nginx yapılandırmasında `server_name` alanına `tafsil.net www.tafsil.net` ekle.
3. `new.tafsil.net` → `tafsil.net` 301 redirect kuralı ekle.
4. `NEXT_PUBLIC_SITE_URL` environment variable'ını `https://tafsil.net` olarak güncelle.
5. Yeniden derleme ve PM2 reload.
