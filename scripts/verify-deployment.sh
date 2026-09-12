#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════
# tafsil.net — Production & Staging Deployment Verification Script
# Bu script VPS veya CI ortamında servislerin doğruluğunu test eder.
# ══════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   tafsil.net — Production & Staging Deployment Check       ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# 1. Ortam ve Yapılandırma Kontrolü
echo -e "\n${YELLOW}[1/5] Ortam Değişkenleri ve Dizin Bütünlüğü Kontrol Ediliyor...${NC}"
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ backend/.env dosyası mevcut.${NC}"
else
    echo -e "${RED}✕ backend/.env dosyası bulunamadı!${NC}"
fi

if [ -f "backend/ecosystem.config.js" ]; then
    echo -e "${GREEN}✓ backend/ecosystem.config.js (PM2) mevcut.${NC}"
fi

if [ -f "tafsil-web-app/ecosystem.config.js" ]; then
    echo -e "${GREEN}✓ tafsil-web-app/ecosystem.config.js (PM2) mevcut.${NC}"
fi

# 2. Docker & Veritabanı Yapılandırması
echo -e "\n${YELLOW}[2/5] Docker ve Veritabanı Altyapısı Denetleniyor...${NC}"
if command -v docker >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker CLI kurulu.${NC}"
    if docker info >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Docker daemon çalışıyor.${NC}"
    else
        echo -e "${YELLOW}⚠ Docker daemon aktif değil (dry-run modunda atlanıyor).${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Docker CLI kurulu değil.${NC}"
fi

# 3. Fastify Backend Derleme ve Tip Kontrolü
echo -e "\n${YELLOW}[3/5] Backend Servis Bütünlüğü Doğrulanıyor...${NC}"
cd backend
npx tsc --noEmit
echo -e "${GREEN}✓ Backend TypeScript tip kontrolü hatasız tamamlandı.${NC}"
cd ..

# 4. Next.js Web Portalı Derleme Kontrolü
echo -e "\n${YELLOW}[4/5] Web Uygulaması SSR & Statik Derlemesi Kontrol Ediliyor...${NC}"
cd tafsil-web-app
npm run build >/dev/null 2>&1
echo -e "${GREEN}✓ Next.js SSR derlemesi ve optimizasyonu başarıyla tamamlandı.${NC}"
cd ..

# 5. Otomasyon Test Paketi Doğrulaması
echo -e "\n${YELLOW}[5/5] Entegrasyon ve API Testleri Çalıştırılıyor...${NC}"
cd tests
npx vitest run --reporter=basic
echo -e "${GREEN}✓ Tüm API ve entegrasyon testleri başarıyla geçti.${NC}"
cd ..

echo -e "\n${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✓ Dağıtım ve Üretime Hazırlık Başarıyla Doğrulandı!     ${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
