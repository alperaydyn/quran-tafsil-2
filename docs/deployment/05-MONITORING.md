# 05: İzleme, Loglama ve Alarm Stratejisi

Prodüksiyon ortamının sağlığını izlemek, hataları erken tespit etmek ve performans darboğazlarını belirlemek için izleme ve alarm altyapısı.

---

## 1. İzleme Katmanları

```
┌───────────────────────────────────────────────────────────────────┐
│                      Katman 1: Uygulama İzleme                   │
│  Sentry (Hata Takibi — React Native + Next.js + Fastify)         │
│  Performans İzleme (API yanıt süreleri, sayfa yükleme)           │
└───────────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────────┐
│                      Katman 2: Endpoint İzleme                   │
│  Uptime Robot (Health Check — 5 dk aralık)                       │
│  Cloudflare Analytics (Trafik, DDoS, Cache Hit Oranı)            │
└───────────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────────┐
│                      Katman 3: Sunucu İzleme                     │
│  Netdata (CPU, RAM, Disk, Network — gerçek zamanlı)              │
│  Docker Stats (Konteyner kaynak kullanımı)                       │
└───────────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────────┐
│                      Katman 4: Log Yönetimi                      │
│  PM2 Log Rotation (Uygulama logları)                             │
│  Nginx Access/Error Logs                                         │
│  Docker Container Logs (PostgreSQL, Redis)                       │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. Sentry — Uygulama Hata İzleme

### 2.1 Entegrasyon Noktaları

| Platform | SDK | Kapsam |
|---|---|---|
| **Fastify API** | `@sentry/node` | Unhandled exceptions, API hataları, LLM timeout'ları |
| **Next.js Web** | `@sentry/nextjs` | SSR hataları, client-side crashes, performans |
| **React Native** | `@sentry/react-native` | Native crashes, JS exceptions, ANR (Android) |

### 2.2 Sentry Kurulumu

```bash
# Backend
cd backend && npm install @sentry/node

# Web
cd tafsil-web-app && npm install @sentry/nextjs

# Mobile
cd tafsil-ios-app && npx expo install @sentry/react-native
```

### 2.3 Sentry Yapılandırması (Backend Örneği)

```typescript
// backend/src/plugins/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,  // 'production' | 'staging'
  tracesSampleRate: 0.1,              // %10 performans örnekleme (maliyet kontrolü)
  integrations: [
    Sentry.httpIntegration(),
    Sentry.postgresIntegration(),
  ],
});
```

### 2.4 Alarm Kuralları (Sentry Alerts)

| Kural | Koşul | Eylem |
|---|---|---|
| **Yüksek Hata Oranı** | 5 dk'da >10 hata | Slack bildirim + e-posta |
| **Yeni Hata Tipi** | İlk kez görülen exception | Slack bildirim |
| **Performans Düşüşü** | API p95 >1s (10 dk boyunca) | Slack bildirim |
| **Unhandled Rejection** | Yakalanmamış Promise hatası | Sentry issue oluştur |

---

## 3. Uptime Robot — Endpoint Sağlık Kontrolü

### İzlenen Endpoint'ler

| Monitör | URL | Aralık | Beklenen |
|---|---|---|---|
| **API Health** | `https://api.tafsil.net/health` | 5 dk | HTTP 200 |
| **Web App** | `https://new.tafsil.net` | 5 dk | HTTP 200 |
| **API Staging** | `https://api-staging.tafsil.net/health` | 15 dk | HTTP 200 |
| **Web Staging** | `https://staging.tafsil.net` | 15 dk | HTTP 200 |

### Bildirim Kanalları
- **Slack:** `#tafsil-alerts` kanalı
- **E-posta:** Geliştirici e-posta adresi
- **Uptime Robot Status Page:** Opsiyonel public durum sayfası

---

## 4. Sunucu Metrikleri — Netdata

VPS üzerinde çalışan Netdata agent'ı gerçek zamanlı sistem metriklerini toplar:

### İzlenen Metrikler

| Metrik | Alarm Eşiği | Eylem |
|---|---|---|
| **CPU Kullanımı** | >80% (5 dk sürekli) | Slack uyarı |
| **RAM Kullanımı** | >85% | Slack uyarı |
| **Disk Kullanımı** | >85% | Slack uyarı + eski log temizliği |
| **Disk I/O** | >90% utilization | Slack uyarı |
| **Network Bandwidth** | >80% kapasite | Bilgilendirme |

### Netdata Alarm Yapılandırması

```yaml
# /etc/netdata/health.d/tafsil-custom.conf
alarm: tafsil_cpu_high
on: system.cpu
lookup: average -5m percentage
warn: $this > 80
crit: $this > 95
info: CPU usage is above 80% for 5 minutes

alarm: tafsil_ram_high
on: system.ram
lookup: average -5m percentage
warn: $this > 85
crit: $this > 95
info: RAM usage is above 85%

alarm: tafsil_disk_full
on: disk.space
lookup: average -1m percentage
warn: $this > 85
crit: $this > 95
info: Disk space usage above 85%
```

---

## 5. Log Yönetimi

### 5.1 PM2 Log Rotation

```bash
# PM2 log rotation modülü
pm2 install pm2-logrotate

# Yapılandırma
pm2 set pm2-logrotate:max_size 10M     # Dosya başına max boyut
pm2 set pm2-logrotate:retain 7         # 7 dosya sakla
pm2 set pm2-logrotate:compress true    # Gzip ile sıkıştır
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm
```

### 5.2 Nginx Log Yapılandırması

```nginx
# /etc/nginx/nginx.conf
http {
    log_format tafsil '$remote_addr - $remote_user [$time_local] '
                      '"$request" $status $body_bytes_sent '
                      '"$http_referer" "$http_user_agent" '
                      '$request_time $upstream_response_time';

    access_log /var/log/nginx/access.log tafsil;
    error_log /var/log/nginx/error.log warn;
}
```

### 5.3 Nginx Log Rotation

```bash
# /etc/logrotate.d/nginx-tafsil
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### 5.4 Docker Container Logları

```bash
# PostgreSQL logları
docker logs tafsil-postgres --tail=100 -f

# Redis logları
docker logs tafsil-redis --tail=100 -f

# Docker log boyutu sınırlama (daemon.json)
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

---

## 6. Cloudflare Analytics

Cloudflare Free tier ile gelen yerleşik analitik:

- **Trafik Analizi:** Toplam istek sayısı, benzersiz ziyaretçi, bant genişliği kullanımı
- **Cache Performansı:** Cache hit oranı, önbelleğe alınan vs doğrudan sunulan istekler
- **Güvenlik Olayları:** Engellenen tehdit sayısı, DDoS saldırı girişimleri
- **Web Analytics (opsiyonel):** Cloudflare Web Analytics ile JavaScript gerektirmeyen sayfa görüntüleme izleme

---

## 7. Özelleştirilmiş Dashboard (İleri Aşama)

Başlangıç aşamasında Sentry + Uptime Robot + Netdata + Cloudflare Analytics yeterlidir. Kullanıcı tabanı büyüdükçe merkezi bir dashboard değerlendirilebilir:

### Opsiyonel İleri Adımlar
- **Grafana + Loki:** PM2 ve Nginx loglarının merkezi toplanması ve görselleştirilmesi
- **BetterStack (Logtail):** Bulut tabanlı log toplama ve arama (ücretsiz katman: 1 GB/ay)
- **Custom Admin Dashboard:** Backend'deki `/api/v1/admin/metrics` endpoint'i ile uygulama seviyesi metrikler (aktif kullanıcı, LLM kullanım istatistikleri)

---

## 8. Olay Müdahale (Incident Response) Kılavuzu

### Hızlı Kontrol Listesi

```bash
# 1. Servis durumunu kontrol et
ssh hostinger
pm2 status
docker compose ps

# 2. Son logları incele
pm2 logs tafsil-api --lines 50
pm2 logs tafsil-web --lines 50
sudo tail -50 /var/log/nginx/error.log

# 3. Kaynak kullanımını kontrol et
htop
df -h
docker stats --no-stream

# 4. Veritabanı bağlantısını test et
docker exec tafsil-postgres pg_isready -U tafsil

# 5. Redis durumunu kontrol et
docker exec tafsil-redis redis-cli ping

# 6. Gerekirse servisi yeniden başlat
pm2 reload tafsil-api
pm2 reload tafsil-web
docker compose restart postgres redis
```

### Eskalasyon Zinciri

1. **Otomatik Algılama:** Uptime Robot veya Sentry alarm tetikler
2. **İlk Müdahale:** Geliştirici Slack bildirimini alır, yukarıdaki kontrol listesini uygular
3. **Geri Alma:** Sorun devam ederse son çalışan sürüme rollback (bkz: [01-BACKEND-DEPLOY.md#geri-alma](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/01-BACKEND-DEPLOY.md))
4. **Kök Neden Analizi:** Olay çözüldükten sonra Sentry hata izleri ve PM2 logları incelenir
