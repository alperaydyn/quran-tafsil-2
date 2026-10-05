# 01: Backend API Dağıtım Rehberi

Fastify (Node.js) backend API'nin Hostinger VPS üzerinde Docker konteynerleri, PM2 süreç yönetimi ve Nginx reverse proxy ile dağıtım rehberi.

---

## 1. Mimari Özet

```
İstemci → Cloudflare → Nginx (:443) → Fastify API (:4000) → PostgreSQL / Redis
                                                            ↓
                                                       PgBouncer (:6432)
```

- **Fastify API:** PM2 ile cluster mode'da çalışır (2 worker).
- **PostgreSQL 16+:** Docker konteynerinde, pgvector eklentisiyle.
- **Redis 7:** Docker konteynerinde, L1/L2 önbellek stratejisiyle.
- **PgBouncer:** Docker konteynerinde, transaction mode ile bağlantı havuzlama.

---

## 2. Docker Compose Servisleri ve VPS PostgreSQL Konfigürasyonu

Tüm veritabanı ve altyapı servisleri projenin kendi izole Docker Compose projeleriyle yönetilir.

### Servis Haritası

| Servis | Proje Dizini | Konteyner Adı | Port (Host) | Açıklama |
|---|---|---|---|---|
| `postgres` | `/docker/tafsil-postgres` | `tafsil-postgres` | `127.0.0.1:5433:5432` | `pgvector/pgvector:pg16` (İzole PG + pgvector) |
| `redis` | `/docker/tafsil-redis` | `tafsil-redis-redis-1` | `127.0.0.1:6379:6379` | Redis 7 (AOF + RDB) |
| `api` | `/docker/tafsil-api` | `tafsil-api` | `4000` (Host Network) | Fastify API (`tafsil-backend:latest`) |
| `web` | `/docker/tafsil-web` | `tafsil-web` | `127.0.0.1:3002:3000` | Next.js Web App (`web-web`) |

> [!NOTE]
> **Müstakil `tafsil-postgres` Konteyneri:**
> Tafsil veritabanı (`tafsil_net_db`) ve kullanıcısı (`tafsil_user_001`), sunucudaki paylaşımlı `postgredb` (port 5432) konteynerinden ayrılarak projeye özel `/docker/tafsil-postgres` projesi altına taşınmıştır.
> Host üzerinde port çakışmasını önlemek ve güvenlik duvarı izolasyonunu korumak amacıyla `127.0.0.1:5433:5432` port eşlemesi kullanılmaktadır.

---

## 3. Geliştirici Ortamı: SSH Tüneli ile VPS Veritabanına Erişim

Geliştirici yerel Mac/PC ortamında çalışırken veritabanı portlarını dış internete açmak yerine güvenli SSH tüneli kullanır:

```bash
# Yerel 5432 portunu VPS'teki müstakil tafsil-postgres (5433) portuna yönlendirin:
ssh -N -L 5432:127.0.0.1:5433 hostinger

# Veya çakışma olmaması için yerel 5433 portuna bağlayın:
ssh -N -L 5433:127.0.0.1:5433 hostinger
```

---

## 4. Veritabanı Migration ve Seed Stratejisi

Sistemde iki bağlantı adresi tanımlıdır:
- `DATABASE_URL` (Port 6432): PgBouncer üzerinden çalışma zamanı sorguları.
- `DATABASE_URL_DIRECT` (Port 5432): Migration, DDL ve seeder için doğrudan PostgreSQL bağlantısı.

```bash
# Migration dosyalarını çalıştır (11 tablo, HNSW ve GIN indeksleri)
npm run db:migrate

# Seed verilerini yükle (114 sure ve uthmani.txt 6234 ayet)
npm run db:seed

# Veritabanı tablo durumunu ve pgvector eklentisini kontrol et
npm run db:status
```

### Migration Akışı
1. Geliştirici yeni migration dosyasını `src/db/migrations/` altında oluşturur (örn: `001_init_schema.sql`).
2. `npm run db:migrate` doğrudan `DATABASE_URL_DIRECT` portuna (5432) bağlanarak şemayı günceller.
3. `npm run db:seed` `data-pipeline/seed/quran_seed.sql` dosyasını transaction güvenliğiyle aktarır.

---

## 4. Node.js / Fastify Dağıtımı (Docker Compose & Hostinger Docker Manager)

Fastify API, çok aşamalı [backend/Dockerfile](file:///Users/alperaydin/Projects/kuran-tafsil-net/backend/Dockerfile) ile derlenen `tafsil-backend:latest` Docker konteyneri içinde, non-root `tafsil` kullanıcısı ile izole olarak çalışır.

Hostinger VPS üzerindeki Docker Manager panelinin (`hPanel`) projeyi tanıması için servis `/docker/tafsil-api` dizini altında Docker Compose ile yönetilir (ayrıca `/opt/tafsil/backend` sembolik linki ile geriye dönük uyumluluk sağlanmıştır).

### Docker Compose ile Başlatma

```bash
cd /docker/tafsil-api

# İmajı derle ve konteyneri başlat
docker compose up -d --build

# Konteyner durumunu ve sağlık kontrolünü incele
docker compose ps
docker compose logs -f api
```

---

## 5. Nginx Reverse Proxy

Yapılandırma dosyası: [backend/nginx/api.tafsil.net.conf](file:///Users/alperaydin/Projects/kuran-tafsil-net/backend/nginx/api.tafsil.net.conf)

### Kurulum

```bash
# Yapılandırmayı kopyala
sudo cp /opt/tafsil/backend/nginx/api.tafsil.net.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/api.tafsil.net.conf /etc/nginx/sites-enabled/

# Sentaks kontrolü ve yeniden yükleme
sudo nginx -t
sudo systemctl reload nginx
```

### Öne Çıkan Özellikler
- SSL/TLS terminasyonu (Cloudflare Origin CA veya Let's Encrypt)
- Gzip/Brotli sıkıştırma
- Rate limiting (API istekleri)
- Proxy headers (`X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`)
- SSE (Server-Sent Events) için `proxy_buffering off` desteği
- Statik ses dosyaları için `/audio/` yolu (Nginx doğrudan servis)

---

## 6. Health Check ve İzleme

### Health Check Endpoint

```
GET /health
```

Yanıt:
```json
{
  "status": "ok",
  "timestamp": "2026-09-10T18:00:00.000Z",
  "uptime": 86400,
  "services": {
    "postgres": "connected",
    "redis": "connected"
  }
}
```

### Uptime Robot Yapılandırması
- **URL:** `https://api.tafsil.net/health`
- **Kontrol Aralığı:** 5 dakika
- **Uyarı:** HTTP 200 dışı yanıt → Slack/e-posta bildirimi

---

## 7. Environment Variables

Tüm hassas bilgiler `.env.production` dosyasında saklanır (Git'e dahil edilmez). Şablon: [backend/.env.example](file:///Users/alperaydin/Projects/kuran-tafsil-net/backend/.env.example)

```bash
# .env.production dosyasını oluştur (VPS üzerinde)
cp .env.example .env.production
nano .env.production  # Gerçek değerleri gir
```

---

## 8. Dağıtım Akışı (Manuel)

```bash
# 1. VPS'e bağlan
ssh hostinger

# 2. Güncel kodu çek
cd /opt/tafsil/backend
git pull origin main

# 3. Bağımlılıkları güncelle
npm ci --production

# 4. Migration'ları çalıştır
npm run db:migrate

# 5. PM2 ile sıfır kesinti yeniden yükleme
pm2 reload tafsil-api

# 6. Sağlık kontrolü
curl -s https://api.tafsil.net/health | jq .
```

> **Not:** Bu adımlar CI/CD pipeline ile otomatikleştirilmiştir. Manuel dağıtım yalnızca acil durumlarda kullanılır. Bkz: [04-CICD-PIPELINE.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/04-CICD-PIPELINE.md)

---

## 9. Geri Alma (Rollback)

```bash
# Son çalışan commit'e geri dön
cd /opt/tafsil/backend
git log --oneline -5          # Son 5 commit'i listele
git checkout <commit-hash>    # Önceki sürüme geç
npm ci --production
npm run db:rollback           # Migration geri al (gerekiyorsa)
pm2 reload tafsil-api
```

---

## 10. Staging Ortamı

Staging ortamı aynı VPS üzerinde farklı portlar ve Docker network'ü ile izole çalışır:

```bash
# Staging Docker servislerini başlat
cd /opt/tafsil/backend
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d

# Staging API'yi PM2 ile başlat
pm2 start ecosystem.config.js --env staging
```

| Servis | Staging Port | Staging URL |
|---|---|---|
| Fastify API | 4100 | `https://api-staging.tafsil.net` |
| PostgreSQL | 5433 | (yalnızca Docker internal) |
| Redis | 6380 | (yalnızca Docker internal) |
