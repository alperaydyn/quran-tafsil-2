# TestFlight Friends & Family — Pre-Release Denetim Raporu

**Tarih:** 2026-10-03 · **Kapsam:** `tafsil-ios-app` + `backend` + canlı altyapı

> [!IMPORTANT]
> **Güncel durum:** Kod tarafı (PBI-9.1 – 9.7) ✅ tamamlandı ve doğrulandı. Gönderim için **yalnızca sizin yapmanız gereken 4 altyapı/hesap adımı** (PBI-9.8 – 9.11) kaldı — aşağıdaki runbook.

## ⏭️ Kalan Adımlar — Runbook (Sıralı)

### 1. Veritabanı güvenliği (PBI-9.9) — **önce bu**
```bash
# VPS'te: DB/Redis'i dış dünyaya kapat (Docker kullanıyorsanız port'ları 127.0.0.1'e bağlayın)
sudo ufw default deny incoming && sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp
sudo ufw enable
# docker-compose.yml: "5432:5432" → "127.0.0.1:5432:5432", "6379:6379" → "127.0.0.1:6379:6379"
# (Docker ufw'yu bypass eder — bu değişiklik şart)

# Parola rotasyonu (eski parola git geçmişinde)
psql -c "ALTER USER tafsil_user_001 WITH PASSWORD '$(openssl rand -base64 32)';"
# Redis'e requirepass ekleyin; backend/.env DATABASE_URL & REDIS_URL'i güncelleyin
```
> Yerel makineden DB'ye bağlanmanız gerekirse: `ssh -L 5432:localhost:5432 user@76.13.60.86`

### 2. Backend canlı dağıtım (PBI-9.8)
- [01-BACKEND-DEPLOY.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/01-BACKEND-DEPLOY.md) adımlarını izleyin
- Sunucu `.env`: `NODE_ENV=production`, `JWT_SECRET=$(openssl rand -base64 48)`, `JWT_EXPIRES_IN=90d`, `APPLE_CLIENT_ID=net.tafsil.app`
- Cloudflare DNS: `api` → `76.13.60.86` (A kaydı, proxied) · Nginx → `localhost:4000`
- Doğrulama: `curl https://api.tafsil.net/api/v1/health` → `200`

### 3. EAS & App Store Connect (PBI-9.10)
```bash
cd tafsil-ios-app
npm i -g eas-cli && eas login
eas init                       # app.json projectId'yi doldurur
```
- ASC → Apps → **+** → Bundle ID `net.tafsil.app`, isim "Tafsil", birincil dil Türkçe
- `eas.json > submit.production.ios`: `appleId`, `ascAppId` (ASC'deki Apple ID numarası), `appleTeamId`
```bash
eas build -p ios --profile production
eas submit -p ios --latest
```

### 4. TestFlight test bilgileri (PBI-9.11)
- `https://tafsil.net/gizlilik` sayfasını yayınlayın (toplanan veri: Apple e-posta/ad, kullanıcı ID, okuma geçmişi, yer imleri, ezber oturumları; takip yok; 3. tarafa satış yok)
- ASC → App Information → Privacy Policy URL
- ASC → App Privacy → *Contact Info (Email)*, *Identifiers (User ID)*, *Usage Data (Product Interaction)* — hepsi "App Functionality", kimliğe bağlı, **takip yok**
- TestFlight → Test Information: Beta açıklaması, geri bildirim e-postası (`destek@tafsil.net`), inceleme notu: *"Giriş gerekmez — 'Misafir Olarak Devam Et' ile tüm özellikler test edilebilir."*
- External Group oluştur → testçi e-postaları ekle → build'i Beta App Review'a gönder

---

**İlk denetim sonucu (düzeltmeler öncesi):** ❌ 6 blocker, 6 TestFlight gereksinimi, 8 kalite maddesi tespit edildi.

---

## 🔴 BLOCKER — Gönderimden önce mutlaka çözülmeli

| # | Bulgu | Kanıt | Etki |
|---|---|---|---|
| **B1** | **Backend canlıda yok** | `dig api.tafsil.net` → boş (NXDOMAIN); VPS `:4000` kapalı | Prod build'de `__DEV__=false` → Apple girişi, sync, lexicon zenginleştirme, günün kartları **tamamen başarısız**. Sadece offline okuma çalışır. |
| **B2** | **Sahte Google girişi + hesap ele geçirme açığı** | [useAuthStore.ts:129](file:///Users/alperaydin/Projects/kuran-tafsil-net/tafsil-ios-app/src/store/useAuthStore.ts#L115-L158) kullanıcıya e-posta yazdırıp `google-dev-<email>` token üretiyor; [google.ts:14](file:///Users/alperaydin/Projects/kuran-tafsil-net/backend/src/modules/auth/google.ts#L12-L24) bunu **her ortamda** kabul ediyor | Herkes başkasının e-postasını yazarak o hesaba girebilir. Apple incelemesi de bunu "çalışmayan/yanıltıcı giriş" olarak reddeder. |
| **B3** | **Sync IDOR açığı** | [sync/routes.ts](file:///Users/alperaydin/Projects/kuran-tafsil-net/backend/src/modules/sync/routes.ts#L8-L105) JWT yoksa body/query'deki `user_id`'ye düşüyor; [service.ts:27](file:///Users/alperaydin/Projects/kuran-tafsil-net/backend/src/modules/sync/service.ts#L26-L33) e-posta ile kullanıcı arıyor; `/timeline` ve `/reading-history` hiç auth kontrol etmiyor | Kimlik doğrulaması olmadan herhangi bir kullanıcının okuma geçmişi okunabilir/yazılabilir. |
| **B4** | **PostgreSQL & Redis internete açık + şifre GitHub'da** | `76.13.60.86:5432` ve `:6379` **OPEN**; DB parolası [DEVELOPMENT_LOG.md:257](file:///Users/alperaydin/Projects/kuran-tafsil-net/DEVELOPMENT_LOG.md#L254-L257) içinde commit'li | Veritabanı doğrudan saldırıya açık. |
| **B5** | **Dev token bypass'ları prod'da aktif** | [apple.ts:19](file:///Users/alperaydin/Projects/kuran-tafsil-net/backend/src/modules/auth/apple.ts#L18-L26) `apple-dev-*`/`mock-*`; [env.ts:30](file:///Users/alperaydin/Projects/kuran-tafsil-net/backend/src/config/env.ts#L29-L32) `JWT_SECRET` için güvensiz varsayılan | Sahte token ile giriş; secret unutulursa tüm JWT'ler taklit edilebilir. |
| **B6** | **EAS/App Store Connect yapılandırması eksik** | [app.json:61](file:///Users/alperaydin/Projects/kuran-tafsil-net/tafsil-ios-app/app.json#L57-L63) `REPLACE_WITH_EAS_PROJECT_ID`; [eas.json:56-58](file:///Users/alperaydin/Projects/kuran-tafsil-net/tafsil-ios-app/eas.json#L53-L59) placeholder'lar | `eas build` / `eas submit` çalışmaz. |

---

## 🟠 External TestFlight (Beta App Review) Gereksinimleri

| # | Madde | Durum | Not |
|---|---|---|---|
| **R1** | Gizlilik Politikası URL'i | ❌ | External test için ASC zorunlu tutuyor. `tafsil.net/gizlilik` sayfası + uygulama içi Ayarlar linki. |
| **R2** | Test Bilgileri (açıklama, geri bildirim e-postası, inceleme notu) | ❌ | Reviewer için "Misafir olarak devam et" yolu not edilmeli (demo hesap gerekmez). |
| **R3** | Export Compliance (`ITSAppUsesNonExemptEncryption=false`) | ❌ | Eklenmezse her build'de manuel soru çıkar. |
| **R4** | Hesap Silme (Guideline 5.1.1(v)) | ❌ | Hesap oluşturma var → App Store'da **zorunlu**. Beta'da da işaretlenebilir. Backend `DELETE /auth/me` + Ayarlar butonu. |
| **R5** | Privacy Manifest (`PrivacyInfo.xcprivacy`) | ⚠️ | MMKV/SQLite/FileSystem için Required Reason API beyanı (`ios.privacyManifests`). Eksikse ITMS-91053 uyarısı. |
| **R6** | App Privacy (veri toplama etiketi) | ❌ | ASC'de doldurulmalı: e-posta, kullanıcı ID, okuma geçmişi (uygulama işlevselliği, takip yok). |

---

## 🟡 Kalite / Stabilite Düzeltmeleri

| # | Bulgu | Öneri |
|---|---|---|
| **Q1** | [config.ts:29-32](file:///Users/alperaydin/Projects/kuran-tafsil-net/tafsil-ios-app/src/api/config.ts#L29-L32) `extra.apiUrl` (prod) **en önce** okunuyor → yerel geliştirme de prod'a gidiyor (şu an kırık). `eas.json`'daki `API_URL` kod tarafından hiç okunmuyor (`EXPO_PUBLIC_` öneki ve `/api/v1` yok). | Öncelik: `EXPO_PUBLIC_API_URL` → (`!__DEV__` ise `extra.apiUrl`) → yerel IP. `eas.json` env adlarını düzelt. |
| **Q2** | JWT süresi 7 gün, refresh yok, istemcide 401 yakalama yok | Testçiler 7 gün sonra fark etmeden senkronizasyonu kaybeder. Beta için `JWT_EXPIRES_IN=90d` + 401'de sessiz yeniden giriş/uyarı. |
| **Q3** | `supportsTablet: true` + yalnızca portrait | iPad düzeni test edilmemiş; F&F için `false` önerilir. |
| **Q4** | `expo-doctor`: `newArchEnabled` şema hatası + 4 paket patch sürüm farkı | Anahtarı kaldır (SDK 57'de varsayılan), `npx expo install --check`. |
| **Q5** | `src/api/mock/surahs.mock.ts` & `verses.mock.ts` hâlâ diskte (referanssız) | PBI-8.1 ile kayma — silinmeli. |
| **Q6** | Mikrofon izni tanımlı ama STT Faz 2'ye ertelendi | Kullanılmayan izin metni inceleme sorusu doğurabilir; şimdilik kaldırılması önerilir. |
| **Q7** | Prod'da `local-guest-jwt-*` offline misafir fallback'i | Kabul edilebilir (offline-first), ancak sunucu bu token'ı reddeder → sync sessizce durur. Bilinçli karar olarak kayda alınmalı. |
| **Q8** | Crash raporlama yok | TestFlight crash log'ları yeterli; Sentry Faz 2'ye bırakılabilir. |

---

## ✅ Geçen Kontroller

- TypeScript: `tsc --noEmit` → **0 hata**
- Uygulama ikonu: 1024×1024, alpha yok ✓
- Sign in with Apple mevcut (Guideline 4.8) ✓ · `usesAppleSignIn` ✓
- Arka plan ses modu tanımlı ve gerçekten kullanılıyor ✓
- `audio.tafsil.net` (R2) canlı → ses & timestamp **200** ✓
- `src/` içinde `localhost` / `USE_MOCK` kalıntısı yok ✓
- Admin uçları `authorizeAdmin` ile korunuyor ✓
- `appVersionSource: remote` + `autoIncrement` ✓

---

## Önerilen Uygulama Planı (PBI-9: TestFlight F&F Release Gate)

### Faz A — Kodla çözebileceklerim (onayınızla hemen başlarım)
1. **B3** Sync uçlarını `app.authenticate` arkasına al, sadece `request.user.sub` kullan
2. **B5** Dev token'larını `NODE_ENV !== 'production'` ile sınırla; prod'da `JWT_SECRET` yoksa başlatmayı durdur
3. **B2** Google girişi (aşağıdaki karara göre)
4. **R4** Hesap silme: `DELETE /auth/me` (cascade) + Ayarlar'da onaylı buton
5. **R3/R5/Q3/Q4/Q6** `app.json` düzenlemeleri (encryption, privacy manifest, tablet, mikrofon, newArch)
6. **Q1** API URL öncelik zinciri + `eas.json` env adları
7. **Q2** JWT süresi + istemcide 401 yakalama
8. **Q5** Orphan mock dosyalarını sil; Ayarlar'a Gizlilik Politikası linki

### Faz B — Sizin yapmanız gerekenler (rehberlik ederim)
1. **B1** Backend'i VPS'e dağıt ([01-BACKEND-DEPLOY.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/deployment/01-BACKEND-DEPLOY.md)) + Cloudflare'de `api` A kaydı
2. **B4** Firewall (`ufw`) ile 5432/6379'u kapat, DB parolasını **değiştir**, log'daki parolayı temizle
3. **B6** `eas init`, App Store Connect'te `net.tafsil.app` kaydı, Team ID / ASC App ID
4. **R1/R2/R6** Gizlilik sayfası yayını + ASC test bilgileri ve gizlilik etiketleri
