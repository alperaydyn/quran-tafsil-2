# 00: Altyapı ve VPS Sunucu Yapılandırması

Bu belge, **tafsil.net** prodüksiyon ve staging ortamlarının çalıştığı Hostinger VPS sunucusunun temel yapılandırma, güvenlik sertleştirme ve sistem kurulum rehberidir.

---

## 1. Sunucu Spesifikasyonları

| Özellik | Değer |
|---|---|
| **Sağlayıcı** | Hostinger VPS |
| **CPU** | 4 vCPU |
| **RAM** | 8 GB |
| **İşletim Sistemi** | Ubuntu 22.04 LTS |
| **SSH Erişimi** | `ssh hostinger` (yerel SSH config alias) |
| **Aylık Bütçe Tavanı** | ~$100 (VPS + OpenRouter LLM) |

---

## 2. Domain ve DNS Yapılandırması

Mevcut `tafsil.net` alan adında hâlihazırda canlı bir versiyon çalışmaktadır. Yeni platform, mevcut site kesintiye uğratılmadan **`new.tafsil.net`** subdomaini altında geliştirilecek ve test edilecektir.

### DNS Kayıtları (Cloudflare)

```
# Prodüksiyon (yeni platform)
new.tafsil.net       A       <VPS_IP>       Proxied (Orange Cloud)

# API Servisi
api.tafsil.net       A       <VPS_IP>       Proxied (Orange Cloud)

# Mevcut site (dokunulmaz)
tafsil.net           A       <MEVCUT_IP>    (Mevcut DNS kaydı korunur)
www.tafsil.net       CNAME   tafsil.net     (Mevcut DNS kaydı korunur)
```

> **Geçiş Planı:** Yeni platform tamamen hazır ve test edildiğinde, `tafsil.net` A kaydı yeni VPS IP'sine yönlendirilir ve `new.tafsil.net` redirect olarak bırakılır.

---

## 3. Güvenlik Sertleştirme (İlk Kurulum)

### 3.1 SSH Güvenliği

```bash
# Şifre ile girişi devre dışı bırak (sadece SSH key)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Root login'i devre dışı bırak
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# SSH portunu değiştir (opsiyonel, bot saldırılarını azaltır)
# sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

sudo systemctl restart sshd
```

### 3.2 Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh          # veya 2222/tcp (port değiştirildiyse)
sudo ufw allow 80/tcp       # HTTP (Cloudflare → Nginx)
sudo ufw allow 443/tcp      # HTTPS (Cloudflare → Nginx)
sudo ufw enable
```

### 3.3 Fail2Ban (Brute-force Koruması)

```bash
sudo apt install fail2ban -y
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# SSH koruması
sudo tee -a /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
maxretry = 5
bantime = 3600
findtime = 600
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3.4 Otomatik Güvenlik Güncellemeleri

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 4. Docker ve Docker Compose Kurulumu

```bash
# Docker kurulumu (resmi script)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Docker Compose (v2 plugin)
sudo apt install docker-compose-plugin -y

# Kurulum doğrulama
docker --version
docker compose version
```

### 4.1 PostgreSQL ve `pgvector` Yapılandırması

VPS üzerinde halihazırda çalışan `postgres` adlı PostgreSQL 16 konteyneri bulunmaktadır (port `5432`). Tafsil veritabanı bu servis üzerinde barındırılır:

- **Veritabanı Adı:** `tafsil_net_db`
- **Kullanıcı:** `tafsil_user_001`
- **Şifre:** `tafsil_user_xxxx`
- **Port:** `5432`

> [!IMPORTANT]
> **`pgvector` Eklentisi:**  
> Standart PostgreSQL 16 konteynerinde semantik vektör aramaları için `pgvector` eklentisi kurulmalıdır:
> ```bash
> # Konteynere pgvector paketini kur
> docker exec postgres apt-get update -qq && docker exec postgres apt-get install -y postgresql-16-pgvector
> 
> # Tafsil veritabanında eklentiyi aktifleştir
> docker exec postgres psql -U admin@a3gents.com -d tafsil_net_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
> ```

---

## 5. Nginx Kurulumu (Host Reverse Proxy)

Nginx, Docker dışında host makinede çalışır ve tüm alt domainler için reverse proxy görevi görür:

```bash
sudo apt install nginx -y
sudo systemctl enable nginx

# SSL sertifikası (Cloudflare Origin Certificate veya Let's Encrypt)
# Cloudflare Proxied modda Cloudflare Origin CA sertifikası tercih edilir
# Let's Encrypt kullanılacaksa:
sudo apt install certbot python3-certbot-nginx -y
```

### Nginx Dizin Yapısı

```
/etc/nginx/
├── nginx.conf
├── sites-available/
│   ├── api.tafsil.net.conf      # Backend API reverse proxy
│   └── new.tafsil.net.conf      # Web App reverse proxy
└── sites-enabled/
    ├── api.tafsil.net.conf -> ../sites-available/api.tafsil.net.conf
    └── new.tafsil.net.conf -> ../sites-available/new.tafsil.net.conf
```

---

## 6. Ortam İzolasyonu (Prodüksiyon & Staging)

Aynı VPS üzerinde Docker izolasyonu ile staging ve prodüksiyon ortamları yan yana çalışır:

```
┌──────────────── VPS (4 vCPU / 8 GB RAM) ─────────────────────────┐
│                                                                   │
│   ┌─── Prodüksiyon Docker Network (tafsil-prod) ───┐             │
│   │  api (Fastify :4000)                           │             │
│   │  postgres (PostgreSQL :5432)                   │             │
│   │  redis (Redis :6379)                           │             │
│   │  pgbouncer (PgBouncer :6432)                   │             │
│   └────────────────────────────────────────────────┘             │
│                                                                   │
│   ┌─── Staging Docker Network (tafsil-staging) ────┐             │
│   │  api-staging (Fastify :4100)                   │             │
│   │  postgres-staging (PostgreSQL :5433)            │             │
│   │  redis-staging (Redis :6380)                   │             │
│   └────────────────────────────────────────────────┘             │
│                                                                   │
│   Nginx (Host — Port 80/443)                                     │
│   PM2 (Host — Next.js prod :3000, staging :3100)                 │
└───────────────────────────────────────────────────────────────────┘
```

### Kaynak Tahsisi

| Ortam | CPU Payı | RAM Payı | Notlar |
|---|---|---|---|
| **Prodüksiyon** | 3 vCPU | 6 GB | Birincil trafik |
| **Staging** | 1 vCPU | 2 GB | Docker `--cpus` ve `--memory` limitleri ile |

---

## 7. Yedekleme Stratejisi

### 7.1 PostgreSQL Yedekleme ve Dayanıklılık (WAL Arşivleme & R2)

Tek bir VPS üzerinde çalışıldığında yedekleme stratejisi hayati önem taşır:
1. **Sürekli WAL Arşivleme (Point-in-Time Recovery - PITR):**
   - Sadece günlük `pg_dump` almak yetersizdir; ani çökme veya veri bozulmasında son güne ait veriler kaybedilebilir.
   - **WAL-G** veya **pgBackRest** kullanılarak PostgreSQL Write-Ahead Log (WAL) segmentleri anlık olarak **Cloudflare R2** bucket'ına arşivlenir.
   - Belirli bir dakikaya geri dönme (PITR) imkanı sağlanır.
   - Yılda en az 1 kez staging ortamında restore tatbikatı yapılmalıdır.
2. **Hostinger Snapshot:** Haftalık/aylık VPS seviyesinde snapshot tamamlayıcı bir güvencedir, ancak tek başına bağımsız bir yedek sayılmaz.

```bash
# /opt/tafsil/scripts/backup-postgres.sh
#!/bin/bash
BACKUP_DIR="/opt/tafsil/backups/postgres"
DATE=$(date +%Y-%m-%d_%H%M)
mkdir -p "$BACKUP_DIR"

# Docker konteyner içinden pg_dump
docker exec tafsil-postgres pg_dump -U tafsil -Fc tafsil_net_db > "$BACKUP_DIR/tafsil_$DATE.dump"

# 7 günden eski yedekleri sil
find "$BACKUP_DIR" -name "*.dump" -mtime +7 -delete

# Cloudflare R2 off-site kopyalama (rclone ile)
rclone copy "$BACKUP_DIR/tafsil_$DATE.dump" r2:tafsil-db-backups/daily/

echo "PostgreSQL backup completed and pushed to R2: tafsil_$DATE.dump"
```

```bash
# Cron job (her gün 03:00)
echo "0 3 * * * /opt/tafsil/scripts/backup-postgres.sh >> /var/log/tafsil-backup.log 2>&1" | sudo tee -a /etc/crontab
```

### 7.2 Veritabanı Performans Ayarları (8 GB RAM VPS)

PostgreSQL parametreleri 8 GB RAM ve 4 vCPU donanıma göre optimize edilmelidir:

| Parametre | Tavsiye Edilen Değer | Açıklama |
|---|---|---|
| `shared_buffers` | `2GB` | RAM'in yaklaşık %25'i |
| `effective_cache_size` | `6GB` | RAM'in yaklaşık %75'i (OS + DB disk cache) |
| `work_mem` | `16MB` | Sıralama ve hash işlemleri için işlem başına RAM |
| `maintenance_work_mem` | `512MB` | VACUUM ve index oluşturma işlemleri için |
| `log_min_duration_statement` | `500` | 500 ms'den uzun süren yavaş sorguların tespiti |

### 7.3 PgBouncer (Bağlantı Havuzlama)

Mobil uygulamaların dalgalı bağlantı talepleri doğrudan PostgreSQL bağlantı limitini tüketmemesi için Fastify ile PostgreSQL arasına `PgBouncer` (transaction pooling) eklenir:
- **Port:** `6432`
- **Pool Modu:** `transaction`
- **Max Client Connections:** `500`
- **Default Pool Size:** `25`

### 7.4 Güvenlik Duvarı & Port 5432 İzolasyonu

- `5432` ve `6432` portları dış internete kesinlikle kapalı tutulmalıdır.
- Sadece Docker iç ağı (`tafsil-prod`) ve VPS üzerindeki yerel Fastify API (`127.0.0.1`) erişebilmelidir.
- UFW kuralı:
  ```bash
  sudo ufw deny 5432/tcp
  sudo ufw deny 6432/tcp
  ```

---

## 8. Sistem İzleme Araçları

```bash
# Temel izleme
sudo apt install htop iotop -y

# Netdata (gerçek zamanlı dashboard — localhost:19999)
bash <(curl -Ss https://my-netdata.io/kickstart.sh) --stable-channel
```

> **Not:** Netdata dashboard'a dışarıdan erişim Nginx reverse proxy ile `/monitoring` path'inde basic auth korumasıyla sağlanabilir.

---

## 9. Dizin Yapısı (VPS Üzerinde)

```
/opt/tafsil/
├── backend/                    # Backend repo klonu (git pull ile güncellenir)
├── web/                        # Web app repo klonu
├── audio/                      # Ses dosyaları (tilavet, meal seslendirmesi)
│   ├── recitations/            # Kâri ses dosyaları (ayet bazlı)
│   └── translations/           # Türkçe meal seslendirmeleri
├── backups/
│   ├── postgres/               # Günlük pg_dump yedekleri
│   └── redis/                  # RDB snapshot'ları
├── scripts/
│   ├── backup-postgres.sh
│   ├── deploy-backend.sh       # Backend dağıtım script'i
│   └── deploy-web.sh           # Web dağıtım script'i
├── ssl/                        # Cloudflare Origin CA sertifikaları
└── logs/                       # Uygulama ve Nginx logları
```
