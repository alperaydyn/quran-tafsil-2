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

### 7.1 PostgreSQL Yedekleme (Günlük)

```bash
# /opt/tafsil/scripts/backup-postgres.sh
#!/bin/bash
BACKUP_DIR="/opt/tafsil/backups/postgres"
DATE=$(date +%Y-%m-%d_%H%M)
mkdir -p "$BACKUP_DIR"

# Docker konteyner içinden pg_dump
docker exec tafsil-postgres pg_dump -U tafsil -Fc tafsil_db > "$BACKUP_DIR/tafsil_$DATE.dump"

# 7 günden eski yedekleri sil
find "$BACKUP_DIR" -name "*.dump" -mtime +7 -delete

echo "PostgreSQL backup completed: tafsil_$DATE.dump"
```

```bash
# Cron job (her gün 03:00)
echo "0 3 * * * /opt/tafsil/scripts/backup-postgres.sh >> /var/log/tafsil-backup.log 2>&1" | sudo tee -a /etc/crontab
```

### 7.2 Redis Yedekleme

Redis RDB snapshot'ları `docker-compose.yml` içinde hacim bağlamasıyla otomatik yedeklenir. Ek olarak günlük yedekleme script'i RDB dosyasını backup dizinine kopyalar.

### 7.3 Off-site Yedekleme (Opsiyonel)

```bash
# Yedekleri uzak sunucuya veya S3-uyumlu depolamaya gönder (opsiyonel)
# rclone sync /opt/tafsil/backups remote:tafsil-backups
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
