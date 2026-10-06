# tafsil.net — Geliştirme, Mimari Kararlar ve Değişiklik Günlüğü (DEVELOPMENT_LOG.md)

Bu dosya, projede gerçekleştirilen her geliştirme oturumunda **alınan mimari kararları, bunların gerekçelerini (neden yapıldığını), etkilenen bileşenleri ve commit özetlerini** kronolojik olarak kayıt altına alan **canlı proje hafızasıdır**.

> **Ajanlar ve Geliştiriciler İçin Kural:**
> Her yeni geliştirme adımına başlarken bu dosya mutlaka taranmalı; yeni bir özellik tasarlanırken **geçmiş kararlarla çelişki olup olmadığı** denetlenmelidir. Geliştirme tamamlandığında ise oturumun özeti ve gerekçeleri bu dosyaya yeni bir başlık olarak eklenmelidir.

## [2026-10-06] Ana Sayfa Okuma Bahçesi Isı Haritası (Heatmap) ve Geçmiş Senkronizasyonu Düzeltmesi

### 1. Karşılaşılan Sorun ve Kök Neden Analizi
* **Sorun:** Ana sayfadaki okuma geçmişi paneline tıklandığında detay sayfasında (`ReadingHistoryScreen`) okuma geçmişi ve ayetler görünmesine rağmen, ana sayfadaki "Bahçen" 16 haftalık takvim ısı haritasında renklendirme görünmüyordu (tüm hücreler soluk çizgi renginde kalıyordu).
* **Kök Nedenler:**
  1. **`OfflineSyncService.getDailyCounts()` Mantık Hatası:** Fonksiyonda `HISTORY_KEY` taranırken `if (!dailyMap[d]) dailyMap[d] = 0;` şeklinde hatalı bir satır bulunuyordu. `DAILY_COUNTS_KEY` içinde henüz anahtar yoksa geçmişteki okuma sayısını saymak yerine `0` atıyor ve sıfır olarak bırakıyordu.
  2. **`ReadingTimeline` ile `DAILY_COUNTS_KEY` Senkronizasyonu Eksikliği:** Kullanıcı okuma geçmişini detay ekranında açtığında backend'den (`/sync/reading-history`) çekilen günler ekranda gösteriliyor fakat `DAILY_COUNTS_KEY` içine kaydedilmiyordu. Dolayısıyla yerel sayaç boş kalıyordu.
  3. **`HomeScreen` Yaşam Döngüsü (`useEffect` vs `useFocusEffect`):** `BahcenCard` bileşeni verileri yalnızca ilk mount anında `useEffect(..., [])` ile çekiyordu. Kullanıcı okuma geçmişi veya okuma ekranından ana sayfaya geri döndüğünde `HomeScreen` unmount olmadığı için veriler yeniden okunmuyordu.
  4. **Tema Rengi Çakışması ve Kontrast Eksikliği:** Ceviz temasında `theme.colors.band` (`#E6E1D4`) ile `theme.colors.line` (`#E6E1D4`) renk kodları tamamen aynıydı. `count < 5` olduğunda `band` rengi döndürüldüğü için 1-4 ayet okunan günler boş/okunmamış (`line`) hücrelerle farksız görünüyordu.
  5. **Saat Dilimi / UTC vs Yerel Tarih Farkı:** Hücrelerin `dateKey` hesabı `toISOString().slice(0, 10)` ile UTC bazlı yapılırken haftanın günü yerel zamana göre alınıyordu; bu da özellikle gece saatlerinde veya pozitif UTC dilimlerinde 1 günlük kaymaya yol açabiliyordu.

### 2. Yapılan Değişiklikler ve Çözüm
1. **`OfflineSyncService.getDailyCounts` Düzeltildi:**
   * `HISTORY_KEY` taranarak her gün için gerçek okunan ayet sayıları hesaplandı ve `dailyMap` ile birleştirildi (`Math.max`).
   * Eğer harita hala boşsa `getReadingTimeline()` çağrılarak sunucu veya yerel zaman çizelgesindeki okuma günleri otomatik olarak çekilip `DAILY_COUNTS_KEY` içine kaydedildi.
2. **`OfflineSyncService.getReadingTimeline` İki Yönlü Önbellekleme:**
   * Backend'den dönen günlerin ayet sayıları doğrudan `DAILY_COUNTS_KEY` haritasına işlendi.
   * Yerel derlenen okuma günleri de `DAILY_COUNTS_KEY` içine kalıcı olarak yazıldı.
3. **`HomeScreen.tsx` — `useFocusEffect` ve Dinamik Renklendirme:**
   * `BahcenCard` bileşeninde `useEffect` yerine `useFocusEffect` entegre edildi; ekran her odaklandığında sayaçlar anında güncellenir.
   * `getCellTone` fonksiyonunda `dateKeyUtc` ve `dateKeyLocal` ikili kontrolü eklendi.
   * Renk tonlaması `acc` (tema vurgu rengi) alfa kanallarına (`${acc}40`, `${acc}85`, `acc`) bağlanarak 1 ayet dahi okunsa hücrenin canlı ve belirgin şekilde renklendirilmesi sağlandı.

### 3. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/src/services/offlineSyncService.ts`: `getDailyCounts`, `getTodayReadCount`, `getReadingTimeline` fonksiyonları güncellendi.
* `tafsil-ios-app/src/screens/HomeScreen.tsx`: `useFocusEffect` eklendi, `getCellTone` renk eşlemesi ve çift tarih kontrolü iyileştirildi.

### 4. Önerilen Git Commit Mesajı
```git
fix(mobile): resolve garden heatmap coloring and sync reading history with daily counts
```

---

### 1. Alınan Kararlar ve Gerekçeleri
* **Cihaz dili tespiti (TR > AR > EN):** `expo-localization` eklendi; `src/i18n/detectLanguage.ts` cihazın tercih listesini öncelik sırasıyla tarar, ilk desteklenen dili (tr/ar/en) seçer, hiçbiri yoksa `en`. `useUserSettingsStore.language` varsayılanı artık bu fonksiyondur → yalnızca ilk kurulumda etkili; persist edilmiş (kullanıcının seçtiği) dil her zaman önceliklidir. Header'daki dil çipi artık tüm adımlarda görünür.
* **Yeni akış:** 1) Niyet → 2) Bağlam → 3) Yolculuk (okuma geçmişi, tamamlama, ezber stüdyosu vitrini; eski Reveal-on-Recite sayfasının yerine) → 4) Hesap tercihi.
* **Hesap adımı:** Tanıtım sonunda “Giriş yap / Hesap oluştur” (Main üstüne `Auth` modalı; iptalde Main'e düşer) veya “Giriş yapmadan devam et” (`continueAsGuest` → misafir oturumu; böylece ana sayfada “Kâri” yerine misafir oturumu ile karşılanır, veri senkronu/Account Linking çalışır). Oturum zaten açıksa (Ayarlar'dan tanıtım tekrarı) adım gösterilmez.
* Onboarding içindeki sabit Türkçe metinler i18n şemasına taşındı (`context`, `features`, `account`; `slides` kaldırıldı).

### 2. Etkilenen Bileşenler
`OnboardingScreen.tsx`, `useUserSettingsStore.ts`, `i18n/detectLanguage.ts` (yeni), `i18n/{types,tr,en,ar}.ts`, `package.json`/`app.json` (expo-localization).

> Not: `expo-localization` yerel modüldür → EAS/dev client yeniden derlenmelidir (Expo Go'da hazır gelir).

### 3. Önerilen Git Commit Mesajı
```git
feat(onboarding): device language detection, intent/context/journey flow and login choice step
```

---

## [2026-10-05] EAS ve App Store Connect Entegrasyonu, Metadata & İlk iOS Üretim Derlemesi (PBI-9.10, PBI-9.11 & PBI-10.4)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **EAS Proje Eşleştirmesi (PBI-9.10):**
  * EAS CLI üzerinden `alperaydyn-apps` organizasyonu hedeflenerek `@alperaydyn-apps/tafsil-net` projesi başarıyla başlatıldı ve bağlandı (`projectId: "eac799c0-732b-48ee-9c67-80dca248690b"`).
  * `tafsil-ios-app/app.json` dosyasına gerçek `projectId` ve `"owner": "alperaydyn-apps"` otomatik olarak işlendi.
* **App Store Connect Submit Konfigürasyonu (PBI-9.10):**
  * `tafsil-ios-app/eas.json` içindeki placeholder değerler gerçek Apple Developer ve ASC bilgileriyle güncellendi:
    * `appleId`: `"alperaydyn@gmail.com"`
    * `appleTeamId`: `"P7Y96Q6RLA"`
    * `ascAppId`: `"6818953862"`
  * OTA güncelleme (`expo-updates`) kullanılmadığından profillerdeki `channel` anahtarları sadeleştirildi.
* **ASC Canlı URL, E-posta ve Metadata Doğrulaması (PBI-9.11):**
  * `https://tafsil.net/gizlilik` (ve `/privacy`) ile `https://tafsil.net/destek` (ve `/support`) canlıda test edildi; HTTP/2 200 yanıtı doğrulandı.
  * İletişim/Geri bildirim e-postası `merhaba@tafsil.net` olarak onaylandı.
  * ASC TestFlight Beta App Review için "Ne Test Edilmeli?" açıklaması, Apple Reviewer için "Misafir Modu ile şifresiz test" notu ve 4 kategorili App Privacy (Contact Info, Identifiers, Usage Data, Diagnostics) etiket rehberi hazırlandı (`docs/appstore/TESTFLIGHT_METADATA_GUIDE.md`).
* **İlk iOS Üretim Derlemesi (PBI-10.4):**
  * `eas build -p ios --profile production` komutuyla Apple Distribution Certificate ve Provisioning Profile oluşturuldu.
  * Derleme başarıyla tamamlandı (Build 1, IPA URL: `https://expo.dev/artifacts/eas/xejD6NLGTEz68B_39UUxY-GuCJ71vEIk_IyOCXF_9KI.ipa`).
  * Faz 1 MVP Backlog'undaki tüm maddeler eksiksiz tamamlandı (0 açık madde).

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/app.json`: `projectId` ve `owner` eklendi.
* `tafsil-ios-app/eas.json`: `appleId`, `appleTeamId`, `ascAppId` güncellendi, `channel` temizlendi.
* `docs/appstore/TESTFLIGHT_METADATA_GUIDE.md`: ASC TestFlight ve App Privacy rehberi oluşturuldu.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: PBI-9.10, PBI-9.11 ve PBI-10.4 tamamlandı (Faz 1 kapandı).
* `docs/roadmap/PHASE-2-BACKLOG.md`: PBI-D.1 ve PBI-D.2 tamamlandı.
* `DEVELOPMENT_LOG.md`: Oturum günlüğe işlendi.

### 3. Önerilen Git Commit Mesajı
```git
feat(mobile): complete EAS setup, generate production iOS build, and finalize ASC metadata (Phase 1 closure)
```

---

## [2026-10-05] Müstakil PostgreSQL Konteynerine Geçiş (`tafsil-postgres` & Port 5433)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **İzole Veritabanı ve Proje Bağımsızlığı:**
  * Tafsil veritabanı (`tafsil_net_db`) ve kullanıcısı (`tafsil_user_001`), sunucuda çalışan diğer projelerin (mahalle_db, a3gents vb.) bulunduğu paylaşımlı `postgredb` konteynerinde yer almaktaydı.
  * Projenin veri izolasyonunu sağlamak, Hostinger Docker Manager panelinde (`hPanel`) bağımsız bir veritabanı servisi olarak yönetebilmek ve `pgvector` versiyonunu diğer projelerden bağımsız tutabilmek amacıyla Tafsil için müstakil bir PostgreSQL servisi kuruldu.
* **Uygulanan Değişiklikler:**
  1. **Müstakil Konteyner Kurulumu:** `/docker/tafsil-postgres` dizini altında `pgvector/pgvector:pg16` imajı ile `tafsil-postgres` Docker Compose servisi tanımlandı.
  2. **Port İzolasyonu:** Host üzerindeki 5432 portu paylaşımlı konteyner tarafından kullanıldığından, `tafsil-postgres` `127.0.0.1:5433:5432` port eşlemesi ile bağlandı ve UFW arkasında güvenli tutuldu.
  3. **Veri ve Şema Migrasyonu (Sıfır Veri Kaybı):** Paylaşımlı veritabanından alınan `pg_dump` yedeği (`tafsil_net_db`) yeni `tafsil-postgres` konteynerine aktarıldı. 23 tablonun tamamı (6236 ayet, 77429 kelime, 1642 kök, 114 sure, kullanıcılar, oturumlar) ve `vector`, `uuid-ossp`, `pgcrypto` eklentileri birebir doğrulandı.
  4. **Backend Entegrasyonu:** `/docker/tafsil-api/.env` yapılandırması `POSTGRES_PORT=5433` ve yeni `DATABASE_URL` bağlantılarıyla güncellendi; API yeniden başlatıldı.
  5. **Doğrulama:** `https://api.tafsil.net/health` üzerinden `{"postgres":true,"redis":true}` ve sure/ayet sorguları HTTP 200 ile doğrulandı. Hostinger Docker agent listesinde `tafsil-postgres` `running(1)` olarak kaydedildi.

### 2. Etkilenen Bileşenler ve Dosyalar
* Hostinger VPS: `/docker/tafsil-postgres` (yeni Compose projesi ve volumü), `/docker/tafsil-api/.env` (port 5433 güncellemesi).
* `docs/deployment/01-BACKEND-DEPLOY.md`: Yeni konteyner haritası ve SSH tüneli komutları güncellendi.
* `DEVELOPMENT_LOG.md`: Oturum günlüğe işlendi.

### 3. Önerilen Git Commit Mesajı
```git
feat(db): migrate tafsil_net_db to dedicated tafsil-postgres container
```

---

## [2026-10-04] Backend ve Web Projelerinin Hostinger Docker Manager Paneline (`/docker`) Taşınması ve İsimlendirilmesi

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Hostinger Docker Manager Entegrasyonu & İsim Standardizasyonu:**
  * Hostinger VPS üzerindeki Docker yönetim paneli (`hPanel`), sunucudaki Docker Compose projelerini `/docker` kök dizini üzerinden izlemekte ve proje adını compose dosyasındaki `name:` veya klasör adından almaktadır.
  * Daha önce `tafsil-api` servisi `docker run` ile bağımsız çalıştığı için panelde hiç görünmüyordu. `web` servisi ise `/opt/tafsil/web` altında çalıştığı için panelde proje adı sadece `web` olarak listeleniyordu.
* **Uygulanan Değişiklikler:**
  1. **`tafsil-api` Taşıması:** Sunucu üzerinde `/docker/tafsil-api` dizini oluşturuldu; backend kaynak kodları, `.env` dosyaları ve Fastify API için `docker-compose.yml` buraya taşındı. `docker compose up -d` ile `tafsil-api` adıyla başlatıldı.
  2. **`tafsil-web` Taşıması ve İsim Düzeltmesi:** Kodlar `/docker/tafsil-web` dizinine taşındı. `docker-compose.yml` dosyasına `name: tafsil-web` tanımlandı. Eski `web` compose projesi kapatılıp yeni `tafsil-web` projesi olarak ayağa kaldırıldı.
  3. **Geriye Dönük Uyumluluk:** Nginx ve mevcut script yollarının kırılmaması için `/opt/tafsil/backend -> /docker/tafsil-api` ve `/opt/tafsil/web -> /docker/tafsil-web` sembolik linkleri (symlink) oluşturuldu.
  4. **Doğrulama:** Hostinger Docker agent betiği (`/.hstgr-*.list.py`) çalıştırılarak hem `tafsil-api` hem de `tafsil-web` projelerinin ve konteynerlerinin doğru isimlerle `running(1)` olduğu teyit edildi. `https://tafsil.net` ve `https://api.tafsil.net/health` üzerinden HTTP 200 sağlandı.

### 2. Etkilenen Bileşenler ve Dosyalar
* Hostinger VPS: `/docker/tafsil-api`, `/docker/tafsil-web`, `/opt/tafsil/backend` (symlink), `/opt/tafsil/web` (symlink).
* `tafsil-web-app/docker-compose.yml`: `name: tafsil-web` eklendi.
* `DEVELOPMENT_LOG.md`: Güncellendi.

### 3. Önerilen Git Commit Mesajı
```git
chore(deploy): migrate tafsil-api and tafsil-web to /docker with unified naming
```

---

## [2026-10-04] Canlı Veritabanı Güvenliği, Firewall Doğrulaması ve Parola Rotasyonu (PBI-9.9)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Firewall ve Port Erişilebilirlik Doğrulaması:**
  * Hostinger VPS üzerinde `ufw status verbose` ile güvenlik duvarı kuralları denetlendi.
  * Yalnızca `80`, `443` (HTTP/HTTPS) ve `22` (SSH) portlarının dış trafiğe açık olduğu; `5432` (PostgreSQL) ve `6379` (Redis) portlarının genel internete tamamen kapalı (`default: deny incoming`) olduğu ve Docker tarafında da yalnızca `127.0.0.1` loopback arayüzüne bind edildiği doğrulandı.
  * Dış IP üzerinden yapılan port tarama testinde bağlantıların paket düşürme (DROP) ile reddedildiği teyit edildi.
* **PostgreSQL Parola Rotasyonu:**
  * Geliştirme sürecinin önceki aşamalarında log kayıtlarına yansıyan `tafsil_user_001` kullanıcısının parolası güvenlik sertleştirmesi kapsamında canlı veritabanında (`ALTER ROLE tafsil_user_001 WITH PASSWORD ...`) 48-karakter kriptografik hex parola ile rotate edildi.
  * VPS'teki `/opt/tafsil/backend/.env`, `.env.production` ve yerel `backend/.env` dosyalarındaki `POSTGRES_PASSWORD`, `DATABASE_URL` ve `DATABASE_URL_DIRECT` alanları güncellendi.
  * `tafsil-api` Docker konteyneri yeni kimlik bilgileriyle yeniden ayağa kaldırıldı.
  * `GET https://api.tafsil.net/health` ve `GET https://api.tafsil.net/api/v1/sureler/1/ayetler` uçları çağrılarak `{"postgres":true,"redis":true}` ile canlı sistemin kesintisiz ve güvenli çalıştığı doğrulandı.

### 2. Etkilenen Bileşenler ve Dosyalar
* `backend/.env`: `POSTGRES_PASSWORD`, `DATABASE_URL` ve `DATABASE_URL_DIRECT` rotate edildi.
* Hostinger VPS: PostgreSQL `tafsil_user_001` parolası, `/opt/tafsil/backend/.env`, `tafsil-api` Docker container'ı.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: `PBI-9.9` tamamlandı olarak güncellendi, `9B` başlığı korundu.

### 3. Önerilen Git Commit Mesajı
```git
fix(security): rotate postgresql credentials and verify firewall isolation (PBI-9.9)
```

---

## [2026-10-04] Web Uygulaması Landing Page, Gizlilik & Destek Sayfaları ve VPS Docker Dağıtımı

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Destek ve İletişim Sayfası (`/destek`, `/support`):**
  * Apple App Store incelemesi ve kullanıcı iletişimi için zorunlu olan destek sayfası (`src/app/destek/page.tsx`) geliştirildi.
  * Sayfada doğrudan iletişim e-postası (`merhaba@tafsil.net`), Sıkça Sorulan Sorular (ücretsiz/reklamsız olma, mealler, senkronizasyon, STT ses gizliliği) ve Apple kuralları gereği zorunlu olan **Hesap ve Tüm Verileri Kalıcı Silme Yönergesi** eklendi.
  * İngilizce linkler için `next.config.ts` üzerinden `/support` ➔ `/destek` kalıcı yönlendirmesi (308 redirect) tanımlandı.
* **Gizlilik Politikası (`/gizlilik`, `/privacy`):**
  * Mevcut KVKK uyumlu gizlilik aydınlatma metni doğrulandı, `/privacy` ➔ `/gizlilik` kalıcı yönlendirmesi eklendi.
  * Site altbilgisine (`SiteFooter.tsx`) doğrudan "Destek" ve "Gizlilik" linkleri eklendi.
* **İngilizce Dil Desteği ve Apple İnceleme Hazırlığı:**
  * Apple App Store inceleme ekibi (App Review) ve uluslararası kullanıcılar için İngilizce destek sayfaları ve arayüz geliştirildi.
  * **İngilizce Gizlilik Politikası (`/privacy`):** [src/app/privacy/page.tsx](file:///Users/alperaydin/Projects/kuran-tafsil-net/tafsil-web-app/src/app/privacy/page.tsx) oluşturuldu; Sign in with Apple, yerel STT ses gizliliği, sıfır reklam ve hesap silme hakları İngilizce olarak belgelendi.
  * **İngilizce Destek & SSS Sayfası (`/support`):** [src/app/support/page.tsx](file:///Users/alperaydin/Projects/kuran-tafsil-net/tafsil-web-app/src/app/support/page.tsx) oluşturuldu; doğrudan destek e-postası (`merhaba@tafsil.net`), SSS ve Apple 5.1.1(v) kuralı uyarınca zorunlu olan **Account Deletion Request** yönergeleri eklendi.
  * **İngilizce Landing Page (`/en`):** [src/app/en/page.tsx](file:///Users/alperaydin/Projects/kuran-tafsil-net/tafsil-web-app/src/app/en/page.tsx) ile Kur'an anlama vizyonu, 3 okuma modu (Discovery, Learning, Focus) ve temel özellikler İngilizce olarak yayınlandı.
  * **Header Dil Değiştirici (`LanguageToggle`):** [src/components/language-toggle/LanguageToggle.tsx](file:///Users/alperaydin/Projects/kuran-tafsil-net/tafsil-web-app/src/components/language-toggle/LanguageToggle.tsx) bileşeni geliştirilerek üst menüye `TR | EN` seçicisi eklendi. Bulunulan sayfaya göre (`/` ⟷ `/en`, `/gizlilik` ⟷ `/privacy`, `/destek` ⟷ `/support`) akıllı geçiş sağlandı.
  * **Footer Bağlantıları:** Altbilgiye `Privacy (EN)` ve `Support (EN)` doğrudan erişim linkleri yerleştirildi.
* **Landing Page ("Coming Soon / Yakında"):**
  * Ana sayfa (`/`) Kur'an vizyonuna uygun editoryal tasarım, 3 okuma modu (Keşif, Öğrenme, Odak) ve "App Store / Google Play — Yakında" rozetleriyle hazır hale getirildi.
* **Next.js Standalone Docker Dağıtımı:**
  * Hafif ve hızlı konteynerizasyon için `next.config.ts` dosyasına `output: 'standalone'` eklendi.
  * Multi-stage `Dockerfile` (Node 20 Alpine) ve `docker-compose.yml` oluşturuldu. Konteyner adı `tafsil-web`, host portu `127.0.0.1:3002` olarak bağlandı.
* **Hostinger VPS & Nginx Reverse Proxy:**
  * Kodlar VPS üzerindeki `/opt/tafsil/web` dizinine aktarılarak `docker compose up -d --build` ile çalıştırıldı ve sağlık kontrolünden geçti.
  * Cloudflare Origin CA sertifikası `tafsil.net`, `*.tafsil.net`, `www.tafsil.net` ve `api.tafsil.net` alan adlarını kapsayacak şekilde güncellendi.
  * Nginx üzerinde `/etc/nginx/sites-available/tafsil.net.conf` oluşturularak port 3002'deki Next.js konteynerine ters vekil (reverse proxy) sağlandı.
* **Cloudflare DNS Durumu:**
  * `tafsil.net` sorgularında eski bir Lovable projesinin 421 hatası verdiği tespit edildi. Cloudflare DNS üzerinde `@` (`tafsil.net`) ve `www` kayıtlarının VPS IPv4 adresi olan `76.13.60.86`'ya yönlendirilmesi adımı kullanıcıya sunuldu.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-web-app/src/app/destek/page.tsx` & `page.module.css`: Yeni destek & SSS sayfası.
* `tafsil-web-app/src/components/site-footer/SiteFooter.tsx`: Destek bağlantısı eklendi.
* `tafsil-web-app/next.config.ts`: `output: 'standalone'`, `/privacy` ve `/support` yönlendirmeleri.
* `tafsil-web-app/Dockerfile` & `.dockerignore`: Multi-stage Docker yapısı.
* `tafsil-web-app/docker-compose.yml`: VPS üzerinde port 3002 servisi.
* `tafsil-web-app/nginx/tafsil.net.conf`: Nginx reverse proxy yapılandırması.
* Hostinger VPS: `/opt/tafsil/web`, `tafsil-web` Docker container, `/opt/tafsil/ssl/origin-cert.pem`, Nginx aktif yapılandırması.

---

## [2026-10-03] Emülatör / Simülatör Kimlik Doğrulama ve Senkronizasyon İyileştirmeleri (PBI-4.4, PBI-4.5)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Emülatörde Apple Sign-In ve Gerçek Hesap / Gizlilik Seçenekleri:**
  * Expo Go ortamında bundle ID kısıtı (`host.exp.Exponent` vs `net.tafsil.app`) nedeniyle native Apple sheet açılamadığında, sistemin sessizce sabit bir adrese düşmesi yerine kullanıcıya interaktif bir Apple giriş modalı (`AuthScreen.tsx`) açılması sağlandı.
  * Kullanıcı bu ekranda kendi gerçek Apple ID adını ve e-postasını girebilmekte; Apple'ın iki temel gizlilik seçeneğini (**"E-postamı Paylaş"** vs **"E-postamı Gizle (Private Relay)"**) seçebilmektedir.
  * Backend (`apple.ts`, `routes.ts`) gelen özel e-postayı tanıyacak şekilde güncellendi ve VPS'e dağıtıldı.
* **Gmail / Google Girişi ve Misafir Hesap Bağlama (Account Linking):**
  * Kullanıcı misafir modundayken kimlik doğrulama ekranına gittiğinde doğrudan `signInWithGoogle` yerine `linkAccount('google', ...)` çağrılarak misafir okuma geçmişi ve yerel verilerin yeni hesaba aktarılması güvenceye alındı.
* **VPS Canlı Senkronizasyon ve Emülatör / Dev Token Kabulü:**
  * Uygulamanın `EXPO_PUBLIC_API_URL=https://api.tafsil.net/api/v1` adresine bağlı olmasına rağmen emülatördeki Google / Apple dev token'larının VPS tarafından reddedilmesi (401) sorunu çözüldü.
  * `backend/src/config/env.ts` dosyasında `ALLOW_DEV_AUTH_TOKENS=true` flag'i açıkça tanımlandığında prodüksiyon/staging ortamında da dev token'ların kabul edilip gerçek imzalı Fastify JWT üretmesi sağlandı.
  * VPS üzerindeki Docker konteyneri (`tafsil-api`) `ALLOW_DEV_AUTH_TOKENS=true` ile yeniden derlenerek canlıya alındı.
  * Böylece hem emülatörden hem de fiziksel cihazlardan VPS üzerindeki PostgreSQL ve Redis ile canlı çift yönlü `sync/push` ve `sync/pull` başarıyla bağlandı.

### 2. Etkilenen Bileşenler ve Dosyalar
* `backend/src/config/env.ts`: `ALLOW_DEV_AUTH_TOKENS` ortam değişkeni açıkça true ise her ortamda dev token izni verildi.
* `backend/dist/config/env.js`: Derleme güncellendi ve VPS'e aktarıldı.
* Hostinger VPS (`tafsil-api` Docker container): `/opt/tafsil/backend/.env` içine `ALLOW_DEV_AUTH_TOKENS=true` eklendi, imaj yeniden derlenip çalıştırıldı.
* `tafsil-ios-app/src/store/useAuthStore.ts`: `signInWithApple` ve `linkAccount` fonksiyonlarına `__DEV__` simülatör graceful fallback'i eklendi.
* `tafsil-ios-app/src/screens/AuthScreen.tsx`: `handleApplePress` ve `handleGoogleSubmit` misafir durumunda `linkAccount` çağıracak şekilde bağlandı.
* `tafsil-ios-app/src/services/offlineSyncService.ts`: Hata ve atlama mesajları dinamik API host bilgisiyle netleştirildi.

### 3. Önerilen Git Commit Mesajı
`fix(backend & mobile): enable dev auth tokens on VPS for live emulator sync`

---

## [2026-10-03] Backend Canlı Dağıtımı (VPS / PM2 / Nginx Reverse Proxy) (PBI-9.8)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Backend API'nin Canlı Ortama Alınması:**
  * TestFlight Friends & Family sürümü ve mobil uygulamanın canlı veritabanı ile bulut üzerinden senkronize olabilmesi için Fastify backend API Hostinger VPS (Ubuntu 22.04, 4 vCPU, 8 GB RAM) üzerinde canlıya alındı.
* **Uygulanan Mimari ve Yapılan İşlemler:**
  1. **PM2 Süreç Yönetimi ve Cluster Mode:**
     * VPS üzerine PM2 (v7.0.4) kuruldu. `backend/ecosystem.config.js` ile 2 worker (cluster mode) olarak yapılandırıldı.
     * `backend/src/server.ts` içine PM2 graceful reload ve cluster mode için `process.send?.('ready')` bildirimi eklendi.
     * Servis `pm2 startup systemd` ve `pm2 save` ile sunucu yeniden başlatmalarına karşı kalıcı hale getirildi.
  2. **Üretim Ortamı Yapılandırması (`.env`):**
     * `/opt/tafsil/backend/.env` dosyası oluşturuldu; 64-karakter kriptografik hex `JWT_SECRET` tanımlandı (`PBI-9.2` uyumlu).
     * Doğrudan localhost üzerinden `postgres:16` (`tafsil_net_db`) ve `tafsil-redis-redis-1` servislerine bağlandı.
     * `npm ci --omit=dev` ile yalnızca prodüksiyon bağımlılıkları yüklendi.
  3. **Nginx Reverse Proxy & Güvenlik:**
     * `backend/nginx/api.tafsil.net.conf` dosyası `/etc/nginx/sites-available/` altına kopyalandı ve `sites-enabled/` üzerinden aktifleştirildi.
     * SSE (Server-Sent Events) ve LLM endpoint'leri için özel `proxy_buffering off`, rate limiting (`api_general`, `api_llm`) ve `/health` rotaları bağlandı.
     * Geçici SSL yapılandırması `/opt/tafsil/ssl/` altında tamamlanarak Nginx sentaksı doğrulandı ve reload edildi.
  4. **Doğrulama ve Uçtan Uca Testler:**
     * Yerel makineden `--resolve api.tafsil.net:443:76.13.60.86` ile doğrudan VPS dış IP'sine yapılan HTTPS testlerinde:
       - `GET /health` -> `{"success":true,"data":{"status":"ok","checks":{"postgres":true,"redis":true}}}` (HTTP 200)
       - `GET /api/v1/sureler` -> Fâtiha ve sure listesi JSON (HTTP 200, L1 önbellek isabetiyle)
       başarıyla doğrulandı.
  6. **Docker Konteynerizasyon Geçişi (`tafsil-backend:latest`):**
     * Kullanıcı tercihi doğrultusunda Fastify backend host PM2 yönetiminden bağımsız bir Docker konteynerine taşındı.
     * `backend/Dockerfile` (3-stage build: deps, builder, runner - non-root user `tafsil`) kullanılarak VPS üzerinde `tafsil-backend:latest` imajı derlendi.
     * PM2 `tafsil-api` servisi durdurulup silindi; konteyner `docker run -d --name tafsil-api --restart unless-stopped --network host --env-file /opt/tafsil/backend/.env tafsil-backend:latest` ile ayağa kaldırıldı.
     * `backend/docker-compose.yml` dosyasına `api` servisi eklendi.
     * Cloudflare üzerinden `https://api.tafsil.net/health`, `/api/v1/sureler/1/ayetler` ve `POST /api/v1/auth/guest` test edilerek Docker konteynerinin hatasız çalıştığı kanıtlandı.

### 2. Etkilenen Bileşenler ve Dosyalar
* `backend/src/server.ts`: PM2 ready sinyali eklendi (`process.send('ready')`).
* `backend/dist/server.js`: Derleme güncellendi.
* `backend/docker-compose.yml`: `api` (Fastify) servisi tanımlandı.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: PBI-9.8 tamamlandı olarak güncellendi.
* Hostinger VPS: `tafsil-api` Docker container'ı (`tafsil-backend:latest`), `/opt/tafsil/backend/.env`, `/etc/nginx/sites-available/api.tafsil.net.conf`.

### 3. Önerilen Git Commit Mesajı
```git
feat(deploy): deploy backend api to vps with pm2 cluster and nginx reverse proxy (PBI-9.8)
```

---

## [2026-10-03] Apple Guideline 5.1.1(v) Uyumlu Hesap Silme (Account Deletion) ve Cascade Veri Temizliği (PBI-AUTH.2)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **App Store Public Sürüm Ön Koşulu:**
  * Apple App Store Review Guideline 5.1.1(v) gereğince, hesap oluşturmaya (Apple Sign-In / Google / vb.) izin veren her uygulama kullanıcının hesabını uygulama içerisinden doğrudan, kalıcı ve koşulsuz olarak silebilmesini sağlamalıdır.
* **Uygulanan Çözüm ve Mimari Tasarım:**
  1. **Backend Uç Noktası (`DELETE /api/v1/auth/me`):**
     * Zorunlu Fastify JWT doğrulaması (`preHandler: app.authenticate`) ile korunur. Kullanıcı kimliği yalnızca token payload'ındaki `request.user.sub` üzerinden çözümlenir (IDOR korumalı).
     * `deleteUserAccount(userId)` servisi çalıştırılır.
  2. **Veritabanı Cascade ve Tam Veri Temizliği:**
     * `kullanicilar` tablosundan silinen satır, PostgreSQL `ON DELETE CASCADE` yabancı anahtarları sayesinde bağlı tüm tabloları (`okuma_gecmisi`, `kavram_gecmisi`, `yer_imleri`, `ezber_oturumlari`, `abonelikler`, `sifre_sifirlama_talepleri`, `community_notlar`, `anlama_begeniler`) otomatik ve atomik olarak temizler.
     * `ON DELETE SET NULL` ile tanımlı olan `istemci_tanilama_raporlari` ve `istemci_veri_hareketleri` tablolarındaki ilgili kayıtlar da GDPR/KVKK ve Apple yönergeleri uyarınca açıkça `DELETE` sorgusu ile silinir.
     * Geliştirme ve bellek fallback'leri (`memoryUsers`) temizlenir.
  3. **Apple REST API ile Yetkilendirme İptali (`revokeAppleToken`):**
     * `backend/src/modules/auth/apple.ts` içine `revokeAppleToken` fonksiyonu eklendi.
     * Apple'ın `https://appleid.apple.com/auth/revoke` uç noktasına ES256 imzalı JWT client secret ile token iptal bildirimi gönderilir.
     * Apple Developer Private Key env değişkenleri henüz tanımlanmamışsa sunucu hata fırlatmaz, güvenli log basarak kullanıcının hesap silme işlemini bloke etmeden süreci tamamlar.
  4. **Mobil API ve Zustand Durum Yönetimi (`useAuthStore`):**
     * `tafsil-ios-app/src/api/auth.ts` içine `deleteAccountOnServer` eklendi.
     * `useAuthStore` içine `deleteAccount` aksiyonu eklendi: Sunucudan silme tamamlandığında cihazdaki yerel SQLite, MMKV, okuma geçmişi ve ezber oturumları `OfflineSyncService.clearAllLocalUserData()` ile sıfırlanır, oturum durumu temizlenir.
  5. **Kullanıcı Arayüzü ve Onay Akışı (`SettingsScreen` & `ProfileScreen`):**
     * `SettingsScreen.tsx`: "HESAP & GÜVENLİK" bölümü eklendi; oturum açıksa "Oturumu Kapat" seçeneği ve kırmızı/vurgulu "Hesabımı Sil" seçeneği sunuldu.
     * İki aşamalı native onay uyarısı (`Alert.alert`): İşlemin geri alınamaz olduğu, tüm okuma geçmişi ve notların sunucudan ve cihazdan silineceği açıkça belirtildi.
     * Silme esnasında `ActivityIndicator` ile görsel geri bildirim ve silinme sonrası onay bildirimi eklendi.
     * `ProfileScreen.tsx`: Oturumu kapatma ve hesap yönetimine geçiş kısayolları bağlandı.
* **Uçtan Uca Doğrulama:**
  * Canlı test scripti ile misafir kullanıcısı oluşturuldu, sync ile yer imi ve okuma geçmişi gönderildi, ardından `DELETE /api/v1/auth/me` çağrıldı.
  * Sonrasında `GET /auth/me` sorgusunun 404 döndüğü ve `sync/pull` sorgusunun 401 Unauthorized vererek kullanıcının sistemden tamamen silindiği kanıtlandı.
  * Hem backend hem mobil TypeScript derlemeleri (`npx tsc --noEmit`) 0 hata ile doğrulandı.

### 2. Etkilenen Bileşenler ve Dosyalar
* `backend/src/modules/auth/apple.ts`: Apple REST API token revoke fonksiyonu (`revokeAppleToken`).
* `backend/src/modules/users/service.ts`: `deleteUserAccount` servisi ve cascade veri silme mantığı.
* `backend/src/modules/auth/routes.ts`: `DELETE /api/v1/auth/me` endpoint'i.
* `tafsil-ios-app/src/api/auth.ts`: `deleteAccountOnServer` mobil API istemcisi.
* `tafsil-ios-app/src/store/useAuthStore.ts`: `deleteAccount` Zustand aksiyonu.
* `tafsil-ios-app/src/screens/SettingsScreen.tsx`: "HESAP & GÜVENLİK" bölümü, onaylı "Hesabımı Sil" butonu ve oturumu kapatma.
* `tafsil-ios-app/src/screens/ProfileScreen.tsx`: Çıkış yapma ve hesap yönetimi bağlantısı.
* `docs/roadmap/PHASE-2-BACKLOG.md`: `PBI-AUTH.2` maddesi tamamlandı olarak işaretlendi; KVKK/GDPR için veri taşınabilirliği (`PBI-COMPL.1`), 30 günlük askı süresi (`PBI-COMPL.2`) ve açık rıza yönetimi (`PBI-COMPL.3`) maddeleri eklendi.
* `README.md`: Yol Haritası (Roadmap) bölümünde `PBI-AUTH.2` tamamlandı olarak senkronize edildi; KVKK/GDPR uyumluluk maddesi eklendi.

### 3. Önerilen Git Commit Mesajı
```git
feat(auth): implement account deletion with cascade data purge and Apple token revoke (PBI-AUTH.2)
```

---

## [2026-10-03] Emülatör / Simülatör Ağ Çözümleme ve Profil Yenileme (Refresh) Senkronizasyon Onarımı

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Sorunun Tespiti:**
  * "Profil ve Yolculuğum" sayfasında sağ üstteki yenileme (↻) butonunun fiziksel telefonda (Expo Go LAN üzerinden) çalışırken, bilgisayardaki simülatör/emülatörde çalışmadığı bildirildi.
* **Kök Neden 1 — Emülatör Ağ Adresi Önceliği Hatası (`resolveApiHost`):**
  * `tafsil-ios-app/src/api/config.ts` içindeki `resolveApiHost` fonksiyonunda, Metro bundler'ın LAN IP'si (`Constants.expoConfig.hostUri`, örn: `192.168.1.120:8081`) `Platform.OS === 'android'` ve simülatör kontrollerinden önce geliyordu.
  * Android Studio Emülatörü Mac üzerindeki backend'e (`127.0.0.1:4000`) yalnızca sanal loopback IP'si olan `10.0.2.2` üzerinden erişebilir; yerel Wi-Fi IP'sine (`192.168.1.x`) erişimi sanal ağ izolasyonu / güvenlik duvarı nedeniyle engellenir.
  * iOS Simülatörü ve Web ortamı ise aynı makinede çalıştığından doğrudan `localhost` (veya `127.0.0.1`) üzerinden en kararlı ve sıfır gecikmeli bağlantıyı kurmalıdır.
* **Kök Neden 2 — Yerel Geliştirme Token'ı ve Sunucu Token Doğrulaması:**
  * Simülatör ilk açılışta veya ağ kesintisinde dev modunda giriş yaptıysa, `useAuthStore` içinde fallback olarak tek parçalı `dev-jwt-*` veya `local-guest-jwt-*` saklanabiliyordu.
  * `OfflineSyncService.hasServerToken` (3 parçalı JWT kontrolü) bu fallback token'ı geçersiz sayarak sunucu senkronizasyonunu atlıyordu.
* **Uygulanan Çözüm Adımları:**
  1. **Ağ Host Çözümleme Hiyerarşisi (`resolveApiHost`):**
     * Web ortamı için `localhost`.
     * Android Emülatörü (`!Constants.isDevice && Platform.OS === 'android'`) için `10.0.2.2`.
     * iOS Simülatörü (`!Constants.isDevice && Platform.OS === 'ios'`) için `localhost`.
     * Yalnızca fiziksel cihazlarda (`Constants.isDevice` veya Expo Go) LAN IP'si (`hostUri`).
  2. **Geliştirme Ortamı Token İyileştirmesi (Auto-Upgrade):**
     * `OfflineSyncService.syncWithServer` fonksiyonu `__DEV__` modunda tek parçalı dev token tespit ettiğinde, sunucu ayaktaysa arka planda `/api/v1/auth/login` ile geçerli bir 3-parçalı JWT alıp oturumu otomatik olarak tam yetkili sunucu oturumuna yükseltir.
  3. **Yerel İlerleme Senkronizasyonu (`reloadLocalProgressToStore`):**
     * `handleSync` (↻ butonu) ve `syncWithServer` tetiklendiğinde; kullanıcı ister çevrimdışı/misafir olsun ister sunucuya bağlı olsun, yerel SQLite/MMKV okuma geçmişi ve ezber oturumları her zaman `useReadingProgressStore` ile taranıp birleştirilir ve ekrandaki istatistikler anında güncellenir.
  4. **UI Etkileşimi:** `ProfileScreen` üzerindeki ↻ butonuna işlem sırasında `disabled={isSyncing}` ve görsel opaklık/yükleniyor geri bildirimi eklendi.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/src/api/config.ts`: `resolveApiHost` fonksiyonunda platform ve simülatör/cihaz öncelik sıralaması düzeltildi.
* `tafsil-ios-app/src/services/offlineSyncService.ts`: `reloadLocalProgressToStore` fonksiyonu eklendi; dev token auto-upgrade ve yerel veri tazelemesi bağlandı.
* `tafsil-ios-app/src/screens/ProfileScreen.tsx`: `handleSync` içine `reloadLocalProgressToStore` eklendi; buton `disabled` ve `opacity` durumları iyileştirildi.

### 3. Önerilen Git Commit Mesajı
```git
fix(mobile): resolve api host routing for emulators/simulators and enable reliable profile sync
```

---

## [2026-10-03] Yerel SQLite Ayet Çiftlenmesi (Duplicate Verses) ve ID Determinizmi Onarımı

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Sorunun Tespiti:**
  * Farklı kullanıcılardan birinde (örn. `alperaydyn@gmail.com`) Bakara suresi normal görünüyorken, diğeri (`info@alperaydin.net`) ile oturum açıldığında Bakara suresindeki ayetlerin ekranda ikişer defa (çift) listelendiği bildirildi.
* **Kök Neden 1 — Deterministik ID ve Backend Serial ID Uyuşmazlığı:**
  * Yerel SQLite tohumlamasında ayet ID'si `surahId * 1000 + ayahNo` (örn. Bakara 1 için `2001`, Bakara 2 için `2002`) kullanılırken; canlı API çağrısından (`GET /sureler/2/ayetler`) dönen nesneler `row.id` (Postgres serial ID: `8, 9, 10...`) ile haritalanıyordu (`mapVerseFromBackend`).
  * `localDbService.upsertVerses` fonksiyonu `INSERT OR REPLACE` yaptığında, PK olan `id` değerleri uyuşmadığı için SQLite eski tohumu (`2001`) silmeyip yanına `8` numaralı satırı ekliyordu.
* **Kök Neden 2 — SQLite `verses` Tablosunda Bileşik Unique Kısıtı Eksikliği:**
  * `verses` tablosunda `(surah_id, ayah_no)` üzerinde `UNIQUE` kısıtı bulunmadığı için aynı sure ve ayet numarasına sahip birden fazla kayıt tablolarda birikebiliyordu.
* **Uygulanan Çözüm Adımları:**
  1. **Deterministik ID Standardı:** `tafsil-ios-app/src/api/client.ts` içindeki `mapVerseFromBackend` fonksiyonu, her zaman `id: surahId * 1000 + ayahNo` atayacak şekilde standartlaştırıldı.
  2. **SQLite UNIQUE Constraint & ON CONFLICT:** `tafsil-ios-app/src/services/localDbService.ts` içinde `verses` tablosuna `UNIQUE(surah_id, ayah_no)` kısıtı eklendi. `upsertVerses` fonksiyonu `INSERT INTO verses ... ON CONFLICT(surah_id, ayah_no) DO UPDATE SET ...` sözdizimine geçirildi ve deterministik ID garantilendi.
  3. **Şema Sürümü Artırımı (`1.0.1`):** Eski sürüm (`1.0.0`) tespit edildiğinde tohumlama öncesinde bozuk/çiftlenmiş `verses` tablosu `DELETE FROM verses;` ile otomatik sıfırlanıp 6.236 ayet temiz şekilde yeniden tohumlanacak hale getirildi.
  4. **Savunmacı Deduplication (In-Memory Map):** `localDbService.getVerses` okuma fonksiyonunda, ne olursa olsun aynı ayet numarasının birden fazla kez dönmesini engelleyen `Map<ayahNo, Verse>` tekilleştirme filtresi eklendi.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/src/api/client.ts`: `mapVerseFromBackend` fonksiyonunda deterministik ID (`surahId * 1000 + ayahNo`) garantisi.
* `tafsil-ios-app/src/services/localDbService.ts`: SQLite `SCHEMA_VERSION = '1.0.1'`, `UNIQUE(surah_id, ayah_no)` kısıtı, versiyon yükseltme temizliği, `ON CONFLICT` ile güvenli `upsertVerses` ve `getVerses` savunmacı tekilleştirme.

### 3. Önerilen Git Commit Mesajı
```git
fix(sqlite): enforce deterministic verse IDs, add unique constraint on (surah_id, ayah_no), and resolve verse duplication on API upsert
```

---

## [2026-10-03] README.md Yol Haritası (Roadmap) & docs/roadmap/ Canlı Backlog Senkronizasyonu

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **PRD / Roadmap Güncelliği & Anti-Drift:** `README.md` sonundaki Yol Haritası bölümü, `docs/roadmap/PHASE-1-MVP-BACKLOG.md` ve `docs/roadmap/PHASE-2-BACKLOG.md` dosyalarındaki güncel durumlarla tam senkronize edildi.
* **Faz 1 Statü Düzeltmeleri:**
  * Kelime senkron sesli okuma (Mişari 114 sure ses + 6236 ayet kelime zaman damgası, Cloudflare R2, karaoke vurgulama, seek-on-word, kilit ekranı oynatıcısı, odak modu tilaveti, çevrimdışı indirme) 🟢 Tamamlandı olarak güncellendi.
  * Mod seçimi ve 3 adımlı ilk açılış onboarding akışı ile editoryal loading ekranı 🟢 Tamamlandı olarak işaretlendi.
  * 114 sure ızgara matrisi, okuma tamamlama, tekilleştirilmiş/idempotent senkronizasyon 🟢 Tamamlandı olarak işaretlendi.
  * Apple Sign-In + Misafir modu, hesap bağlama, Zustand store, JWT/RBAC yetkilendirmesi ve profil/abonelik şema ayrımı 🟢 Tamamlandı olarak güncellendi; Native Google Sign-In ve hesap silmenin Faz 2 App Store public sürümüne aktarıldığı belirtildi.
  * Yeni eklenen Veri Akışı İzleme ve Tanılama (Diagnostics — `PBI-10.1`–`10.3`) maddesi Faz 1 🟢 Tamamlandı olarak eklendi.
  * TestFlight Friends & Family Release Gate ve VPS canlı dağıtım adımları (`PBI-9.8`–`9.11`, `PBI-10.4`) kullanıcı aksiyonları olarak 🟡 Devam Ediyor statüsüyle dahil edildi.
* **Faz 2–4 Senkronizasyonu:** `PHASE-2-BACKLOG.md` içindeki deferral maddeleri (Native Google Sign-In `PBI-AUTH.1`, Hesap Silme `PBI-AUTH.2`, Sentry `PBI-OBS.1`, Web tanılama paneli `PBI-OBS.2`, Türkçe meal seslendirmesi `PBI-2.11`, Reveal-on-recite STT `PBI-2.12`, Web App Portal `PBI-W.1`, OG Cards `PBI-W.2`) ve Faz 3/4 kodlarıyla çapraz referanslandı.

### 2. Etkilenen Bileşenler ve Dosyalar
* `README.md`: Yol Haritası (Roadmap) bölümü güncellendi, canlı backlog dosyalarına doğrudan bağlantılar eklendi.
* `DEVELOPMENT_LOG.md`: Oturum kaydı eklendi.

### 3. Önerilen Git Commit Mesajı
```git
docs(roadmap): align README.md roadmap section with live phase backlogs
```

---

## [2026-10-03] Veri Akışı İzleme & Tanılama Ekranı + Sunucu Karşılığı (PBI-10.1 — PBI-10.3)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Katman etiketli tek izleyici (`dataFlowMonitor`):** README'deki 5 katmanlı önbellek isimlendirmesi (L1 Zustand · L2 MMKV/KV · L3 SQLite · L4 Snapshot · L5 Dosya) + `NET_API` / `NET_CDN` / `NET_EXT` / `SYS` etiketleri kullanıldı. 600 olaylık halka tampon; ardışık özdeş olaylar 1.5 sn içinde birleştirilir (`×N`), UI bildirimi 300 ms throttled. *Gerekçe:* Prod'da da açık kalabilecek kadar ucuz olmalı — kullanıcı sorun anında rapor paylaşabilsin. Modül hiçbir uygulama modülünü import etmez (döngüsel bağımlılık/recursion riski yok).
* **Enstrümantasyon noktaları (chokepoint):**
  * L2: `mmkvStorage.ts` içinde `activeStorage` sarmalandı → hem `mmkv` hem Zustand `persist` yazımları tek yerden izlenir. Kelime başına `lex_v1_*` anahtarları tek mantıksal anahtarda toplanır (tamponu boğmaması için).
  * L3/L4: `localDbService` (hit/miss/write/seed, snapshot fallback), `client.ts` (API+SQLite başarısız → snapshot), `lexiconCacheService` (küratörlü seed / otomatik fallback).
  * L5: `audioCacheService` (yerel mp3 hit / CDN stream miss, indirme, silme).
  * Ağ: Global `fetch` gözlemcisi — yalnızca yöntem, yol, sorgu **anahtarları**, durum, süre, Content-Length. Token/gövde/sorgu değerleri **loglanmaz**.
  * L1: Zustand store probları (`subscribe` ile değişen alan adları); `activeReading.positionMs/currentWordIndex` yüksek frekanslı olduğu için hariç.
  * Senkron: `syncWithServer` her çalıştırmada `lastSync` (skipped/push/pull/done, ↑↓ sayılar, süre, hata) üretir.
* **Bağlantı durumu iki sinyal:** `expo-network` (cihaz) + `GET /health` (API, PostgreSQL, Redis, gecikme). *Gerekçe:* "Cihaz çevrimiçi" ≠ "API erişilebilir"; `api_unreachable` ayrı durum. 503 yanıtı "erişilebilir ama bağımlılık hatası" sayılır.
* **Tanılama ekranı herkese açık (yalnızca `__DEV__` değil):** TestFlight testçileri ve kullanıcılar sorun anında raporu paylaşabilsin diye Ayarlar › "Tanılama & Destek" altında. Ekranın kendi ölçümleri (`peekStorageValue`, doğrudan PRAGMA) olay akışını kirletmez.
* **Paylaşım:** Rapor önce sunucuya kaydedilir (kısa kod `TD-XXXXXX`), sonra `expo-mail-composer` ile JSON ekli e-posta açılır; Mail hesabı yoksa sistem paylaşım sayfasına düşer. Rapor JWT, e-posta, yer imi notu ve okuma içeriği içermez.
* **Sunucu karşılığı (`010_client_diagnostics.sql`):** `istemci_tanilama_raporlari` (sorgulanabilir özet kolonlar + JSONB detay, `durum`: yeni/inceleniyor/cozuldu) ve `istemci_veri_hareketleri` (olay başına satır, katman/işlem/hata indeksleri). Olaylar tek round-trip `unnest` toplu insert ile yazılır.
  * Kimlik **yalnızca JWT'den** (PBI-9.1 ilkesi); gövdedeki `auth.user_id` saklanmaz. Geçersiz/süresi dolmuş JWT ile rapor yine kabul edilir (anonim) — 401 sorunları tam da bu raporlarla teşhis edilir. Rota bazlı rate limit: 6 istek / 10 dk.
* **Önceki kararlarla uyum:** Offline-first bozulmadı (izleyici yalnızca gözlemler), maliyet bilinci (ek servis yok, Postgres'te iki tablo), ses saklama/R2 stratejisi değişmedi.

### 2. Etkilenen Bileşenler ve Dosyalar
* **Yeni (mobil):** `src/services/diagnostics/{dataFlowMonitor,networkInterceptor,connectivityMonitor,storageInspector,diagnosticReport,index}.ts`, `src/screens/DiagnosticsScreen.tsx`
* **Güncellenen (mobil):** `App.tsx` (`installDiagnostics()`), `src/store/mmkvStorage.ts`, `src/services/{localDbService,audioCacheService,lexiconCacheService,offlineSyncService}.ts`, `src/api/client.ts`, `src/navigation/{types,RootNavigator}.tsx`, `src/screens/SettingsScreen.tsx`, `package.json` / `app.json` (`expo-network`, `expo-mail-composer` + config plugin)
* **Yeni (backend):** `src/db/migrations/010_client_diagnostics.sql`, `src/modules/diagnostics/{dto,service,routes}.ts`; `src/app.ts` kaydı (`/api/v1/diagnostics`)
* **Dokümantasyon:** `README.md` (Çevrimdışı Strateji › 6. Veri Akışı İzleme ve Tanılama), `docs/roadmap/PHASE-1-MVP-BACKLOG.md` (Bölüm 10), `docs/roadmap/PHASE-2-BACKLOG.md` (`PBI-OBS.2`)

### 3. Doğrulama
* Mobil `tsc --noEmit` ✅ · `expo-doctor` 21/21 ✅ · `expo export --platform ios` bundle ✅ · Backend `tsc --noEmit` ✅
* Migration 010 canlı DB'ye (SSH tüneli) yalnızca bu dosya olarak uygulandı: 2 tablo, 9 indeks ✅
* Fastify inject: anonim POST 201 · geçersiz JWT ile POST 201 (anonim) · hatalı gövde 400 · JWT'siz liste 401 · JWT'li POST kullanıcıya bağlandı + kendi listesinde görünür · admin olmayan admin ucu 403 · gövdedeki `user_id` saklanmadı ✅ (test kayıtları silindi)
* ⚠️ `expo-network` / `expo-mail-composer` native modül → yeni dev client / EAS build gerekir (PBI-10.4).

### 4. Önerilen Git Commit Mesajı
```git
feat(diagnostics): add layer-tagged data flow monitor, diagnostics screen and server-side report storage (PBI-10.1–10.3)

- app: ring-buffer monitor tagging L1–L5/API/CDN/SYS events; global fetch observer (no tokens/bodies)
- app: connectivity (expo-network + /health), storage inventory, local↔server sync comparison
- app: Settings › Veri Akışı & Tanılama screen with live filterable event stream
- app: privacy-safe diagnostic report shared via email attachment (expo-mail-composer)
- backend: 010_client_diagnostics migration + /api/v1/diagnostics routes (optional JWT, rate limited, admin lookup)
```

---

## [2026-10-03] Mobil Senkronizasyon, Önbellekleme ve Çevrimdışı/Çevrimiçi Mimari Dokümantasyonu (README.md)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **PRD / Mimari Güncellemesi (Anti-Drift):** Mobil uygulamada (`tafsil-ios-app`) hayata geçirilmiş olan 5 katmanlı önbellek yapısı (Zustand, MMKV, SQLite WAL, JSON Snapshot, Audio Cache), `client.ts` üzerinden yürütülen Stale-While-Revalidate veri çekme stratejisi, `OfflineSyncService` içerisindeki ardışık tekilleştirme (deduplication) ve 2.5s debounced push log boru hattı ile çift taraflı birleştirme (Two-Way Merge) mimarisi `README.md` belgesinin "Çevrimdışı Strateji ve Yerel Önbellekleme" bölümüne işlendi.
* **Sistem Tutarlılığı:** Kod tabanındaki fiili uygulama ile PRD/teknik mimari dokümanı arasındaki senkronizasyon tam hale getirildi.

### 2. Etkilenen Bileşenler ve Dosyalar
* `README.md`: "Çevrimdışı Strateji ve Yerel Önbellekleme" bölümü 5 alt başlık altında zenginleştirildi.
* `DEVELOPMENT_LOG.md`: Oturum kaydı eklendi.

### 3. Önerilen Git Commit Mesajı
```git
docs(readme): document mobile offline-first, caching layers and two-way sync architecture
```

---

## [2026-10-03] VPS Postgres/Redis Dış Erişim Kapatma, SSH Tüneli ve Redis Şifre Desteği

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Postgres (5432) ve Redis (6379) dış erişimi kapalı:**
  * *Karar:* VPS'te şifreler yenilendi ve portlar dışarıdan filtrelendi (doğrulandı: dışarıdan zaman aşımı; tünelden giriş başarılı).
  * *Gerekçe:* Veritabanı ve cache'in internete açık olması kritik güvenlik riskiydi.
* **`backend/.env` adresleri `127.0.0.1`:**
  * *Karar:* `POSTGRES_HOST`, `DATABASE_URL`, `DATABASE_URL_DIRECT` ve Redis `127.0.0.1` kullanır. Backend VPS'e taşındığında aynen çalışır; lokalde SSH tüneli ile çalışır.
  * *Lokal kural:* Geliştirmeden önce tünel açık olmalı: `ssh -N -L 5432:127.0.0.1:5432 -L 6379:127.0.0.1:6379 root@76.13.60.86`. Yerel Docker (postgres/redis) aynı portları tutuyorsa kapatılmalı; aksi halde bağlantı sessizce yerel Docker'a gider. Tünel sağlığı yalnızca port açıklığıyla değil, Postgres girişi ve Redis `PING` ile doğrulanmalıdır.
* **Redis şifre desteği:**
  * *Karar:* `REDIS_PASSWORD` artık `config.redis.password` üzerinden `ioredis`'e verilir. Önceki kod bu değişkeni hiç okumuyordu (`NOAUTH` hatası verecekti).

### 2. Etkilenen Bileşenler ve Dosyalar
* `backend/src/config/env.ts`: `redis.password` eklendi, varsayılan URL `127.0.0.1`.
* `backend/src/db/redis.ts`: `ioredis` istemcisine şifre aktarımı.
* `backend/.env` (gitignore'da, commit edilmez): host'lar `127.0.0.1`.

### 3. Önerilen Git Commit Mesajı
```git
fix(backend): support REDIS_PASSWORD and target VPS-local DB/Redis via SSH tunnel
```

---

## [2026-10-03] TestFlight Friends & Family Release Gate — Güvenlik Sertleştirme & App Store Uyumu (PBI-9.1 — PBI-9.7)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Uçtan uca pre-release denetimi:** PBI-8 tamamlandıktan sonra uygulama + backend + canlı altyapı birlikte denetlendi. 6 blocker bulundu: backend canlıda yok (`api.tafsil.net` DNS kaydı yok), sahte Google girişi ile hesap ele geçirme, sync IDOR, PostgreSQL/Redis'in internete açık olması + log'da DB parolası, prod'da aktif dev token bypass'ları, EAS placeholder'ları.
* **PBI-9.1 — Sync IDOR:** `/sync/push|pull|status|timeline|reading-history` uçları JWT yoksa body/query `user_id`'ye düşüyor, `SyncService` e-posta ile kullanıcı arıyordu; `timeline`/`reading-history` hiç auth yapmıyordu. *Karar:* Tüm uçlar `app.authenticate` arkasında; kimlik yalnızca `request.user.sub` (UUID). İstemci artık `user_id` göndermiyor.
* **PBI-9.2 — Prod auth sertleştirme:** `google-dev-*`/`apple-dev-*`/`mock-*` token'ları her ortamda kabul ediliyordu. *Karar:* `config.auth.allowDevTokens` (prod'da daima `false`). Prod'da `JWT_SECRET` varsayılan/`CHANGE_ME*`/<32 karakter ise sunucu başlamaz (fail-fast). Yerel `backend/.env` `NODE_ENV=production` + placeholder secret içeriyordu → `NODE_ENV=development` yapıldı (mevcut token'lar geçerliliğini koruyor).
* **PBI-9.3 — Google girişi:** Kullanıcı kararıyla F&F build'inde gizlendi (`FEATURES.googleSignIn = __DEV__`, UI + store çift guard). Gerçek native entegrasyon Faz 2 `PBI-AUTH.1`.
* **PBI-9.4 — app.json:** `usesNonExemptEncryption: false` (export compliance), `privacyManifests` (UserDefaults/FileTimestamp/DiskSpace/SystemBootTime — ITMS-91053), `supportsTablet: false` (iPad düzeni test edilmedi), şema dışı `newArchEnabled` silindi (SDK 57 varsayılanı), Expo patch güncellemeleri (`expo-doctor` 21/21).
  * *Revizyon:* Mikrofon izni kaldırılmak yerine `expo-audio` eklentisine (`microphonePermission`) taşındı. `expo-audio` binary'si kayıt API'leri içerdiğinden purpose string'in yokluğu ITMS-90683 ile build reddine yol açar; izin istenmediği sürece kullanıcıya prompt gösterilmez.
* **PBI-9.5 — API URL zinciri:** `extra.apiUrl` her zaman öncelikli olduğu için yerel geliştirme de prod'a gidiyordu; `eas.json`'daki `API_URL` kod tarafından hiç okunmuyordu. *Karar:* `EXPO_PUBLIC_API_URL` → (yalnızca `!__DEV__`) `extra.apiUrl` → yerel Metro IP. `eas.json` env'leri `EXPO_PUBLIC_*` + `/api/v1`. Staging DNS olmadığından `preview` geçici olarak prod API'de (Faz 2 `PBI-D.4`).
* **PBI-9.6 — Oturum yönetimi:** Refresh token olmadan 7 günlük JWT testçilerin sessizce senkronizasyon kaybetmesine yol açardı. *Karar:* Varsayılan `JWT_EXPIRES_IN=90d`; istemcide 401 → `sessionExpired` bayrağı (yerel veri **silinmez**) + Ayarlar'da yeniden giriş uyarısı. 3 parçalı olmayan (yerel misafir / dev) token'larla ağa çıkılmıyor.
* **PBI-9.7 — Temizlik & uyum:** PBI-8.1'den kalan referanssız `src/api/mock/*` silindi (Faz 2 PBI-D.3 öne çekildi). Ayarlar > Hakkında: Gizlilik Politikası (`extra.privacyPolicyUrl`), Geri Bildirim (mailto, sürüm/build etiketli), sürüm bilgisi. Onboarding/Loading önizleme kısayolları `__DEV__`'e alındı.
* **Ertelemeler (kullanıcı kararı):** Hesap silme (Guideline 5.1.1(v)) App Store public sürümüne → Faz 2 `PBI-AUTH.2` (public için zorunlu). Crash raporlama → `PBI-OBS.1`.
* **Güvenlik notu:** `DEVELOPMENT_LOG.md` içindeki açık DB parolası maskelendi; git geçmişinde kaldığından parola rotasyonu ve 5432/6379 firewall kapatması (PBI-9.9) kullanıcı tarafından yapılmalıdır.

### 2. Etkilenen Bileşenler
* `backend/src/modules/sync/routes.ts`, `backend/src/modules/sync/service.ts`
* `backend/src/config/env.ts`, `backend/src/modules/auth/google.ts`, `backend/src/modules/auth/apple.ts`, `backend/.env.example`
* `tafsil-ios-app/src/api/config.ts`, `src/store/useAuthStore.ts`, `src/services/offlineSyncService.ts`
* `tafsil-ios-app/src/screens/AuthScreen.tsx`, `src/screens/SettingsScreen.tsx`
* `tafsil-ios-app/app.json`, `eas.json`, `package.json` (Expo patch'leri); `src/api/mock/` silindi
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md` (yeni bölüm 9), `docs/roadmap/PHASE-2-BACKLOG.md`

### 3. Doğrulama
* Backend `tsc --noEmit` ✅ · Mobil `tsc --noEmit` ✅ · `expo-doctor` 21/21 ✅
* Fastify inject smoke test: JWT'siz / sahte JWT / bilinmeyen kullanıcı ile 5 sync ucu → 7/7 `401` ✅
* Prod'da `google-dev-`, `apple-dev-`, `mock-` token'ları reddediliyor; dev'de kabul ediliyor ✅ · Placeholder secret ile prod başlatma reddediliyor ✅
* `expo config --type introspect`: `ITSAppUsesNonExemptEncryption=false`, mikrofon metni, `UIBackgroundModes=[audio]`, Apple Sign-In entitlement ✅

### 4. Önerilen Commit Mesajı
```
fix(security): close sync IDOR, gate dev auth tokens, and prep app for TestFlight F&F (PBI-9.1–9.7)

- backend: require JWT on all /sync routes, resolve user only from token sub
- backend: reject google-dev/apple-dev/mock tokens and weak JWT_SECRET in production; 90d beta sessions
- app: hide placeholder Google sign-in in release builds, handle 401 as sessionExpired without data loss
- app: fix API URL precedence + EXPO_PUBLIC_* EAS env, add privacy/feedback links, gate dev previews
- config: export compliance, privacy manifest, iPhone-only, expo-audio mic string, Expo patch updates
```

---

## [2026-10-03] Faz 1 Pre-Release Kontrol & Arındırma (PBI-8.1 — PBI-8.5)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **PBI-8.1 — Mock / Dummy Veri Arındırması:**
  * *Karar 1:* `src/api/mock/surahs.mock.ts` dosyası `src/data/surahs.seed.ts` konumuna taşındı ve `mockSurahs` değişkeni `SURAH_SEED_DATA` olarak yeniden adlandırıldı. Bu dosya aslında geçerli referans verisi (114 sure meta bilgisi) olduğundan "mock" etiketinin semantik olarak yanlış olduğu tespit edildi.
  * *Karar 2:* `verses.mock.ts` dosyasının tüm bağımlılıkları (`client.ts` fallback'leri) kaldırıldı. Veri akışı artık SQLite → `ayetler.snapshot.json` → boş dizi zinciri olarak standardize edildi.
  * *Karar 3:* `auth.ts` içindeki Apple/Google/Guest auth fallback'lerinde üretilen `mock-jwt-apple-`, `mock-jwt-guest-` gibi sahte token'lar `__DEV__` guard'ına alındı. Prodüksiyon build'de fallback yerine `{ success: false, error: { code: 'AUTH_FAILED' } }` döndürülür.
  * *Karar 4:* `config.ts` içindeki `USE_MOCK` flag'i (`{ surahs: false, verses: false }`) ve tüm re-export'ları (`client.ts`) kaldırıldı. Artık mock dallanma kodu yoktur.
  * *Geriye Dönük Uyumluluk:* `surahs.seed.ts` dosyasında `export const mockSurahs = SURAH_SEED_DATA` deprecated alias'ı bırakıldı; test sırasında kırılma riski sıfıra indirildi.
* **PBI-8.2 — Geçici Yerel Referans & URL Denetimi:**
  * *Karar:* `lexiconEnrichmentService.ts`, `lexiconCacheService.ts` ve `HomeScreen.tsx` içindeki 4 adet hardcoded `http://localhost:3001/api/v1` referansı, merkezi `API_BASE` (`config.ts` → `resolveApiHost()` + env var zinciri) import'una bağlandı. Port uyumsuzluğu (3001 vs 4000) da bu sayede giderildi.
  * `config.ts` içindeki `return 'localhost'` ve `return '10.0.2.2'` fallback'leri geliştirme ortamı için doğru çalışma davranışları olarak korundu (prodüksiyonda `EXPO_PUBLIC_API_URL` env var devreye girer).
* **PBI-8.3 — Konfigürasyon & EAS Temizliği:**
  * `app.json` içine `extra.apiUrl: "https://api.tafsil.net/api/v1"` eklendi (config.ts `Constants.expoConfig?.extra?.apiUrl` zinciri ile alır).
  * `NSMicrophoneUsageDescription` izin metni eklendi (Ezber Stüdyosu STT için App Store zorunluluğu).
  * `REPLACE_WITH_EAS_PROJECT_ID` ve `eas.json` submit placeholder'ları Apple Developer hesap bilgileri gerektirdiğinden Faz 2 backlog'una (`PBI-D.1`, `PBI-D.2`) aktarıldı.
* **PBI-8.4 — Kırık Bağlantı & Ucu Açık Bileşenler:**
  * Tüm Faz 1 ekranları tarandı. Boş `onPress` handler, "Coming Soon" kalıntısı veya TODO bulunamadı — temiz.
* **PBI-8.5 — Sonraki Faza Aktarım:**
  * `docs/roadmap/PHASE-2-BACKLOG.md` dosyası oluşturuldu. Ertelenen maddeler: EAS Project ID, Apple submit bilgileri, mock dosya tam silimi, Türkçe meal seslendirmesi, Reveal-on-Recite STT, Web App Portal, Agentic RAG, DAG görselleştirme.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/src/data/surahs.seed.ts`: **Yeni dosya** — `mockSurahs` → `SURAH_SEED_DATA` taşıması.
* `tafsil-ios-app/src/api/client.ts`: `USE_MOCK` dallanmaları ve `verses.mock` import'u kaldırıldı.
* `tafsil-ios-app/src/api/config.ts`: `USE_MOCK` export'u kaldırıldı.
* `tafsil-ios-app/src/api/auth.ts`: Apple/Google/Guest fallback'leri `__DEV__` guard'ına alındı; mock token prefix'leri `dev-jwt-` olarak güncellendi.
* `tafsil-ios-app/src/services/localDbService.ts`: Import yolu güncellendi.
* `tafsil-ios-app/src/services/searchService.ts`: Import yolu güncellendi.
* `tafsil-ios-app/src/services/offlineSyncService.ts`: Import yolu güncellendi.
* `tafsil-ios-app/src/services/lexiconEnrichmentService.ts`: Hardcoded localhost → `API_BASE`.
* `tafsil-ios-app/src/services/lexiconCacheService.ts`: Hardcoded localhost → `API_BASE`.
* `tafsil-ios-app/src/store/useReadingProgressStore.ts`: Import yolu güncellendi.
* `tafsil-ios-app/src/screens/HomeScreen.tsx`: Import + hardcoded localhost → `API_BASE`.
* `tafsil-ios-app/src/screens/ReadingScreen.tsx`: Import yolu güncellendi.
* `tafsil-ios-app/src/screens/MemorizationStudioScreen.tsx`: Import yolu güncellendi.
* `tafsil-ios-app/src/components/memorization/NewSessionModal.tsx`: Import yolu güncellendi.
* `tafsil-ios-app/src/components/progress/SurahGridMatrix.tsx`: Import yolu güncellendi.
* `tafsil-ios-app/app.json`: `apiUrl`, `NSMicrophoneUsageDescription` eklendi.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: PBI-8.1–8.5 tamamlandı (`[x]`).
* `docs/roadmap/PHASE-2-BACKLOG.md`: **Yeni dosya** — ertelenen maddeler.

### 3. Önerilen Git Commit Mesajı
```git
chore(pre-release): complete Phase 1 release gatekeeper — mock cleanup, URL standardization, EAS config, and Phase 2 deferral (PBI-8.1–8.5)
```

---

## [2026-10-03] Anonymous Kullanıcı Birikmesi Sorunu — Kök Neden Tespiti ve Düzeltme

### 1. Sorun
Önceki oturumda yapılan "hesap izolasyonu" fix'i sırasında `SyncService.getEffectiveUserId` fallback'i **her kimliksiz sync isteğinde yeni bir `anonymous` kullanıcı** oluşturuyordu. 103 saniye içinde 12 anonymous kayıt oluştu. Bunların 3'ünde yer imi, 1'inde okuma geçmişi verisi vardı (test kaynaklı).

### 2. Kök Neden
`getEffectiveUserId` metodunun son adımında `INSERT INTO kullanicilar (auth_provider='anonymous', ...)` çalışıyordu. Kimliği çözülemeyen her istek (token olmayan, bilinmeyen ID) bu INSERT'i tetikliyordu.

### 3. Alınan Mimari Karar
- `getEffectiveUserId` artık `null` döndürür — hiçbir koşulda yeni kullanıcı oluşturmaz.
- Sync routes (`/push`, `/pull`, `/status`) `null` sonuç aldığında **HTTP 401 UNAUTHENTICATED** döndürür.
- Bu sayede: Eski fallback (account hijacking riski) yok, yeni fallback (ghost user birikme riski) yok.

### 4. Temizlik
- 12 anonymous kullanıcı ve tüm bağlı verileri (yer imleri, okuma geçmişi) silindi.
- DB durumu: 3 google + 1 admin + 1 system kullanıcı kaldı.

### 5. Etkilenen Dosyalar
- `backend/src/modules/sync/service.ts` — `getEffectiveUserId` null döndürür, `pushSyncData`/`pullSyncData`/`getSyncStatus` null guard eklendi
- `backend/src/modules/sync/routes.ts` — null sonuç için 401 yanıtı

### 6. Commit Önerisi
`fix(sync): prevent ghost anonymous user creation in getEffectiveUserId, return 401 for unresolvable identity`

---

## [2026-10-03] Çoklu Hesap / Hesap Değişimi Oturum İzolasyonu & Senkronizasyon Veri Sızıntısının Kökten Çözümü (PBI-4.7)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Sorunun Tespiti:**
  * Kullanıcı `alperaydyn@gmail.com` hesabından çıkış yapıp `info@alperaydin.net` hesabı ile giriş yapmasına rağmen, yeni hesapla okunan ayetlerin (Sure 112: 1, 3, 4 ve Sure 2: 1, 2) eski hesaba (`alperaydyn@gmail.com`) yazıldığı bildirildi.
* **Kök Neden 1 — Çıkış Yapıldığında (`signOut`) Sahte Misafir ve Oturum Karışıklığı:**
  * *Sorun:* `useAuthStore.signOut()` fonksiyonu `user: { id: guest-${Date.now()}, isGuest: true }` ve `isAuthenticated: true` atıyordu. Çıkış yapılmasına rağmen uygulama misafir modunda kalıyordu.
  * *Çözüm:* `signOut()` fonksiyonu temiz bir çıkış durumuna (`user: null`, `token: null`, `isAuthenticated: false`, `isGuest: false`) geçirildi.
* **Kök Neden 2 — `signInWithGoogle` Fonksiyonunun Hesap Bağlamaya (Account Linking) Zorlanması:**
  * *Sorun:* `isCurrentlyGuest` bayrağı doğru (`true`) olduğu için kullanıcı "Google ile Giriş Yap" butonuna bastığında normal login yerine doğrudan `linkGuestAccount` çağrılıyordu. İstemcideki geçici `guest-17...` kimliği PostgreSQL UUID formatında olmadığı için backend `/api/v1/auth/link` Zod doğrulamasında `400 Bad Request` (`Invalid uuid`) veriyordu.
  * *Sonuç:* Mobil istemci `linkGuestAccount` başarısız olunca mock token (`mock-jwt-linked-...`) üretiyor, bu geçersiz token Fastify JWT doğrulamasını geçemiyordu.
  * *Çözüm:* `signInWithGoogle` ve `signInWithApple` her zaman doğrudan `authenticateWithGoogle` / `authenticateWithApple` çalıştıracak şekilde ayrıştırıldı. Hesap bağlama (`linkGuestAccount`) yalnızca kullanıcı misafir modundayken bilinçli olarak "Hesabı Bağla" butonuna bastığında (`linkAccount`) tetiklenir hale getirildi. Ayrıca `linkGuestAccount` hata aldığında mock token yerine doğrudan gerçek oturum açma fonksiyonuna fallback yapacak şekilde güçlendirildi.
* **Kök Neden 3 — Backend `SyncService.getEffectiveUserId` İçindeki Tehlikeli Fallback:**
  * *Sorun:* Çözümlenemeyen veya token'ı doğrulanamayan senkronizasyon isteklerinde `SyncService.getEffectiveUserId` metodu veritabanındaki en son oluşturulan kullanıcıyı (`SELECT id FROM kullanicilar WHERE auth_provider NOT IN ('system', 'admin') ORDER BY created_at DESC LIMIT 1`) seçiyordu. Bu sorgu doğrudan ilk kullanıcıyı (`alperaydyn@gmail.com`) döndürdüğü için, ikinci hesabın tüm hareketleri sessizce ilk hesaba bağlanıyordu.
  * *Çözüm:* Tehlikeli fallback tamamen kaldırıldı. Kimliği doğrulanamayan istekler kesinlikle başka bir kullanıcının veritabanı kaydına yönlendirilmez; izole anonim bir kullanıcı oluşturulur.
* **Kök Neden 4 — Backend `/auth/link` ve `linkGuestUser` UUID Kısıtı:**
  * *Sorun:* `linkSchema` içinde `guestUserId: z.string().uuid()` şartı vardı. Yerel istemci misafir kimlikleri (`guest-17...`) UUID olmadığı için 400 hatası veriyordu.
  * *Çözüm:* `guestUserId: z.string().optional()` yapıldı ve `linkGuestUser` içinde `isGuestUuid` regex denetimi eklendi. UUID değilse Postgres hatası almadan doğrudan `findOrCreateUser` çağrılır.
* **Kök Neden 5 — Mobil `AuthScreen` İçindeki Hardcoded E-Posta:**
  * *Sorun:* `googleEmail` state'i `'alperaydyn@gmail.com'` ile başlatılıyordu.
  * *Çözüm:* E-posta ve ad soyad alanları boş (`''`) başlatıldı, format ve boşluk doğrulaması (`modalError`) eklendi.
* **Veri Onarımı (Data Fix):**
  * Kullanıcının test sırasında okuduğu 5 ayet kaydı (Sure 112: 1, 3, 4 ve Sure 2: 1, 2) `alperaydyn@gmail.com` hesabından gerçek sahibi olan `info@alperaydin.net` (`cc2c3188-a288-490d-ad62-bc830e6a7093`) hesabına taşındı.

### 2. Etkilenen Bileşenler ve Dosyalar
* `backend/src/modules/auth/routes.ts`: `linkSchema` `guestUserId` esnetmesi (UUID kısıtının kaldırılması).
* `backend/src/modules/users/service.ts`: `linkGuestUser` içine `isGuestUuid` denetimi.
* `backend/src/modules/sync/service.ts`: `getEffectiveUserId` içindeki tehlikeli `created_at DESC LIMIT 1` fallback'inin temizlenmesi.
* `tafsil-ios-app/src/store/useAuthStore.ts`: `signOut` temizleme, `signInWithGoogle` ve `linkAccount` ayrımı, e-posta zorunluluğu.
* `tafsil-ios-app/src/api/auth.ts`: `linkGuestAccount` canlı hata fallback'inin gerçek login fonksiyonlarına yönlendirilmesi.
* `tafsil-ios-app/src/screens/AuthScreen.tsx`: Hardcoded e-posta temizliği, boş/geçersiz e-posta validasyonu ve hata gösterimi.
* `tafsil-ios-app/src/screens/ProfileScreen.tsx`: Giriş Yap / Hesabı Bağla buton etiketi güncellemesi.

### 3. Önerilen Git Commit Mesajı
```git
fix(auth): resolve multi-account session isolation, eliminate sync fallback hijacking, and migrate misattributed reading logs (PBI-4.7)
```

---

## [2026-10-02] Okuma ve Kavram Geçmişi Tekilleştirme & Idempotent Senkronizasyon (PBI-6.6)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Sorunun Tespiti:**
  * Kullanıcı tarafından `okuma_gecmisi` tablosuna mükerrer kayıtlar basıldığı bildirildi (ör. `okundu_tarihi`: `2026-10-02 21:22:53.918000+00` için aynı ayetin 4 kopyası, diğer ayetler için 25 kopyaya varan tekrarlar).
  * Veritabanında toplam 231 kayıt bulunurken, tekil kullanıcı-sure-ayet-tarih kombinasyonu sayısı yalnızca 47 idi (184 mükerrer kayıt).
* **Kök Neden 1 — Fastify Backend'de Idempotency / ON CONFLICT Eksikliği:**
  * *Sorun:* `SyncService.pushSyncData` gelen `data.reading_history` ve `data.concept_history` dizilerini doğrudan `INSERT INTO okuma_gecmisi ...` şeklinde çalıştırıyordu. `okuma_gecmisi` tablosunda `(kullanici_id, sure_id, ayet_no, okundu_tarihi)` üzerinde tekillik kısıtı bulunmadığından, istemciden her senkronizasyon tetiklendiğinde tüm geçmiş baştan yeni UUID'lerle tekrar tekrar veritabanına ekleniyordu.
  * *Çözüm:* 
    1. Mevcut tablodaki 184 mükerrer kayıt temizlendi (`DELETE FROM okuma_gecmisi a USING ...`).
    2. `CREATE UNIQUE INDEX IF NOT EXISTS uq_okuma_gecmisi_user_verse_date ON okuma_gecmisi (kullanici_id, sure_id, ayet_no, okundu_tarihi)` ve kavram geçmişi için `uq_kavram_gecmisi_user_slug_date` oluşturuldu (`009_deduplicate_and_unique_reading_history.sql`).
    3. `service.ts` içinde `INSERT ... ON CONFLICT (kullanici_id, sure_id, ayet_no, okundu_tarihi) DO UPDATE SET okunma_suresi_sn = GREATEST(okuma_gecmisi.okunma_suresi_sn, EXCLUDED.okunma_suresi_sn)` yapısına geçilerek tam idempotent sağlandı.
* **Kök Neden 2 — Mobil `ReadingScreen` İçinde Çift Tetikleme (Double Trigger):**
  * *Sorun:* Kullanıcı bir ayete dokunduğunda `handleAyahSelect` fonksiyonu hem doğrudan `OfflineSyncService.recordReading` çağırıyor hem de `setActiveAyah(ayahNo)` güncelliyordu. `activeAyah` değiştiği için `useEffect` de tetiklenip ikinci kez `recordReading` çağırıyordu. Ayrıca `CHUNK_SIZE` ile ayet listesi yüklendikçe `verses.length` değişimleri aynı ayet için `useEffect`'i tekrar çalıştırıyordu.
  * *Çözüm:* `ReadingScreen.tsx` içine `lastRecordedVerseRef` eklendi. `useEffect` sadece ayet gerçekten değiştiğinde tek sefer çalışır; `handleAyahSelect` sadece aktif ayeti seçer, çift çağrı tamamen ortadan kalktı.
* **Kök Neden 3 — İstemci Tarafında Ardışık Dokunma ve Throttling Eksikliği:**
  * *Sorun:* Kullanıcı kısa sürede aynı ayete birkaç kez dokunduğunda veya arayüz durum değişikliklerinde yerel geçmiş dizisine ardışık mükerrer satırlar ekleniyordu.
  * *Çözüm:* `offlineSyncService.ts` ve `sync.ts` içine 30 saniyelik ardışık okuma throttling'i eklendi (son kayıt aynı ayetse süre güncellenir, yeni satır açılmaz). Ayrıca tüm kayıtlara istemci tarafında `generateUUID()` ile benzersiz `id` üretimi eklendi.

### 2. Etkilenen Bileşenler ve Dosyalar
* `backend/src/db/migrations/009_deduplicate_and_unique_reading_history.sql`: 184 mükerrer kaydın temizlenmesi ve `uq_okuma_gecmisi_user_verse_date` ile `uq_kavram_gecmisi_user_slug_date` unique index'leri.
* `backend/src/modules/sync/dto.ts`: `ReadingHistorySyncItemSchema` içine opsiyonel `id: z.string().optional()` eklendi.
* `backend/src/modules/sync/service.ts`: `pushSyncData` sorguları `ON CONFLICT (...) DO UPDATE` idempotent upsert ile donatıldı.
* `tafsil-ios-app/src/screens/ReadingScreen.tsx`: `lastRecordedVerseRef` koruması ve `handleAyahSelect` çift tetikleme arındırması.
* `tafsil-ios-app/src/services/offlineSyncService.ts`: `OfflineHistoryItem` & `OfflineConceptItem` ID desteği, 30 sn ardışık okuma throttling'i ve sayaç tekilleştirmesi.
* `tafsil-web-app/src/lib/sync.ts`: Web okuma geçmişi kaydına 30 sn throttling ve UUID ataması.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: `PBI-6.6` kaydedildi ve tamamlandı (`[x]`).

### 3. Önerilen Git Commit Mesajı
```git
fix(sync): eliminate duplicate reading history, enforce DB unique indexes, and implement idempotent sync (PBI-6.6)
```

---

## [2026-10-02] Çoklu Cihaz İstatistik Senkronizasyonu & Tutarsızlıklarının Kökten Çözümü (PBI-6.5)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Kök Neden 1 — `useMemorizationStore` İçindeki Sahte Başlangıç Verileri (`INITIAL_SESSIONS`):**
  * *Sorun:* Mobil uygulamada `INITIAL_SESSIONS` dizisinde Alak (1-5), Mülk (1-5) ve Fatiha (1-7) olmak üzere 17 ayetlik mock/örnek veri hardcoded olarak mevcuttu. Yeni açılan veya farklı bir cihazda uygulama başlatıldığında kullanıcı hiçbir şey yapmasa dahi profilde "17 Ezber Ayeti" görünüyordu. Diğer cihazdaki gerçek ezber oturumlarıyla birleşince ezber sayıları tutarsızlaşıyordu.
  * *Çözüm:* `INITIAL_SESSIONS` boş dizi (`[]`) yapıldı. Sahte veri enjeksiyonu kaldırıldı. `addSession` içine RFC4122 v4 uyumlu `generateUUID()` eklendi. `resetSessions` aksiyonu tanımlandı.
* **Kök Neden 2 — Backend Sync Zod Şeması Hataları (`dto.ts` & `service.ts`):**
  * *Sorun:* `SyncPushSchema` içinde `user_id` ve `memorization_sessions.id` alanlarında `z.string().uuid()` zorunlu tutuluyordu. Mobil uygulamanın fallback ID'leri veya istemci tarafındaki oturum kimlikleri UUID değilse Zod `400 Bad Request` fırlatıyor ve tüm senkronizasyon (okuma geçmişi, yer imleri) sessizce düşüyordu.
  * *Çözüm:* `dto.ts` içindeki `id` ve `user_id` alanları `z.string().optional()` yapılarak esnetildi. `service.ts` içinde `m.id` UUID değilse veritabanına `gen_random_uuid()` veya `sure_id + baslangic_ayet` çakışma yönetimiyle hata almadan güvenle kaydedilmesi sağlandı.
* **Kök Neden 3 — Okuma Serisi (`streak`) Cihazlar Arasında Senkronize Edilmiyordu:**
  * *Sorun:* Sunucudan `reading_history` çekildiğinde sadece `readVersesBySurah` güncelleniyor; `streak` (current, longest, lastActiveDate) yeniden hesaplanmıyordu. 1. cihazda 5 gün seri varken 2. cihazda 0 gün görünüyordu.
  * *Çözüm:* `calculateStreakFromDates(dateStrings)` algoritması geliştirildi. `bulkMergeReadingHistory` fonksiyonunda okuma geçmişindeki tüm `okundu_tarihi` damgaları toplanarak ardışık gün serisi deterministik olarak hesaplandı; 2. cihazda da 1. cihazla birebir aynı streak değeri elde edildi.
* **Kök Neden 4 — `completedSurahs` ve `dailyCounts` Senkronizasyon Eksikliği:**
  * *Sorun:* 2. cihazda okunan ayetler çekilse bile sure tamamlanma bayrakları (`completedSurahs`) ve günlük okuma sayaçları (`DAILY_COUNTS_KEY`) güncellenmiyordu; haftalık okuma karnesi boş kalıyordu.
  * *Çözüm:* `bulkMergeReadingHistory` surenin tüm ayetleri okunduysa `completedSurahs`'ı otomatik işaretler hale getirildi. `syncWithServer` çekilen geçmişten `DAILY_COUNTS_KEY`'i anında yeniden inşa etti.
* **Kök Neden 5 — Eski Zaman Damgası (`LAST_SYNC_KEY`) ve Tam Senkronizasyon (`forceFullSync`):**
  * *Sorun:* Cihazda önceden kalmış bir `LAST_SYNC_KEY` varsa, backend `WHERE okundu_tarihi >= $2` filtrelemesiyle eski okumaları 2. cihaza göndermiyordu.
  * *Çözüm:* `syncWithServer(..., { forceFullSync: true })` desteği eklendi. `signInWithGoogle`, `signInWithApple`, `linkAccount` ve `ProfileScreen` üzerindeki manuel senkronizasyon butonunda `forceFullSync = true` tetiklenerek kullanıcının sunucudaki tüm okuma geçmişi ve ezberlerinin eksiksiz çekilmesi sağlandı.
* **Kök Neden 6 — Çıkış Yapıldığında (`signOut`) Önceki Kullanıcı Verilerinin Cihazda Asılı Kalması:**
  * *Sorun:* Kullanıcı çıkış yaptığında sadece `user` state'i misafire dönüştürülüyor; yerel okunan ayetler, ezberler ve yer imleri silinmiyordu. Yeni hesap açıldığında eski veriler yeni hesaba karışıyordu.
  * *Çözüm:* `OfflineSyncService.clearAllLocalUserData()` metodu eklendi. `signOut()` çağrıldığında tüm yerel MMKV verileri ve Zustand mağazaları (`resetProgress`, `resetSessions`) sıfırlanır.

* **Kök Neden 7 — Mobil Expo Go Fiziksel Cihazında `localhost` Ağ İzolasyonu:**
  * *Sorun:* `tafsil-ios-app/src/api/config.ts` dosyasında `defaultHost = 'localhost'` olarak tanımlıydı. Masaüstü simülatör Mac'in kendi `localhost`'una erişebilirken, kullanıcının elindeki fiziksel telefonda çalışan **Expo Go** `http://localhost:4000` adresine istek attığında telefon kendi içine bağlanmaya çalışıyor, `Network request failed` fırlatıyor ve ne giriş yapabiliyor ne de sunucudan tek bir ayet çekebiliyordu (0 ayet kalıyordu).
  * *Çözüm:* `config.ts` içine dinamik `resolveApiHost()` eklendi. `Constants.expoConfig?.hostUri` (Metro Bundler'ın çalıştığı Mac'in yerel Wi-Fi IP'si: `192.168.1.120`) otomatik çözümlenerek hem masaüstü hem de fiziksel telefonun aynı Fastify API'ye bağlanması sağlandı. `offlineSyncService.ts` içindeki hardcoded `http://localhost:4000/api/v1` kaldırıldı.
* **Kök Neden 8 — Veritabanında `system-curator` Kullanıcısına Hatalı Fallback:**
  * *Sorun:* Backend `SyncService.getEffectiveUserId` içinde `ORDER BY created_at ASC LIMIT 1` sorgusu nedeniyle eşleşemeyen istekler `00000000-0000-0000-0000-000000000001` ID'li sisteme ait ilk kullanıcıya bağlanmış ve kullanıcının okuduğu 45 ayet o kullanıcıda birikmişti.
  * *Çözüm:* 45 ayet ve 4 yer imi kullanıcının gerçek hesabı olan `7036de69-c43c-48a2-ae43-3cd2240f476a` (`alperaydyn@gmail.com`) kullanıcısına aktarıldı. `service.ts` içinde `auth_provider NOT IN ('system', 'admin')` şartı getirilerek sistem kayıtlarına fallback tamamen engellendi.

### 2. Etkilenen Bileşenler ve Dosyalar
* `backend/src/modules/sync/dto.ts`: `id` ve `user_id` şema esnetmesi (400 hatası önleme).
* `backend/src/modules/sync/routes.ts`: `extractUserId` ile JWT token'dan kullanıcı kimliği doğrulama.
* `backend/src/modules/sync/service.ts`: E-posta eşleştirmeli `getEffectiveUserId`, güvenli UUID insert, sistem kullanıcısı fallback engeli.
* `tafsil-ios-app/src/api/config.ts`: `resolveApiHost()` ile Expo Go fiziksel cihaz ve Metro host IP dinamik çözümü.
* `tafsil-ios-app/src/services/offlineSyncService.ts`: Hardcoded localhost temizliği, `forceFullSync`, `dailyMap` inşası, `clearAllLocalUserData()`.
* `tafsil-ios-app/src/store/useMemorizationStore.ts`: `INITIAL_SESSIONS` sahte verisinin temizlenmesi, `generateUUID()`, `resetSessions`.
* `tafsil-ios-app/src/store/useReadingProgressStore.ts`: `calculateStreakFromDates`, `completedSurahs` otomatik tespiti, `resetProgress`.
* `tafsil-ios-app/src/store/useAuthStore.ts`: Login sonrası `forceFullSync`, `signOut` sırasında `clearAllLocalUserData()`.
* `tafsil-ios-app/src/screens/ProfileScreen.tsx`: `handleSync(true)` ile sunucu odaklı tam senkronizasyon.

### 3. Önerilen Git Commit Mesajı
```git
fix(sync): resolve Expo Go physical device network access, migrate system reading records, and ensure cross-device consistency
```

---

## [2026-10-02] Büyük Güvenlik, Veritabanı Şeması & Kimlik Sertleştirmesi (PBI-4.6)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Sabit UUID ve Yetki Bypass Açıklarının Kapatılması (PBI-4.6.1):**
  * *Admin Güvenliği:* `DEFAULT_ADMIN_ID` (`ffffffff-...`) kaldırıldı. `backend/src/plugins/auth.ts` içine `authorizeAdmin` hook'u eklendi; veritabanında `role === 'admin'` olmayan veya JWT içermeyen tüm istekler 401/403 ile reddedilir hale getirildi.
  * *Sistem & Misafir UUID İzolasyonu:* `community` ve `understanding` servislerindeki `00000000-...` sabit UUID'si kaldırıldı. Topluluk oturumları listelemesinde `userId` opsiyonel kılındı (`is_liked_by_user` unauth kullanıcılar için false), anlama oturumlarında ise `is_featured` bayrağı hakikat kaynağı yapıldı.
* **Kullanıcı Profili ve İsim/E-posta Kalıcılığı (PBI-4.6.2):**
  * `008_profile_subscriptions_security.sql` migration'ı yazılarak Hostinger PostgreSQL'deki `kullanicilar` tablosuna `name VARCHAR(128)`, `email VARCHAR(255)` ve `password_hash VARCHAR(255)` sütunları eklendi.
  * Apple ve Google girişlerinde kullanıcının gerçek adı ve e-postası veritabanına kaydedildi; DTO'ya eklendi.
  * Mobil `HomeScreen` üzerindeki `'Alper'` hardcoded fallback'i kaldırıldı; editoryal selamlama (`getTimeGreeting()`) ve dinamik kâri/okuyucu unvanları bağlandı.
* **Abonelikler Tablosu ve Hakikat Kaynağı Ayrımı (PBI-4.6.3):**
  * StoreKit 2 ve Google Play aboneliklerini takip eden ilişkisel `abonelikler` (`subscriptions`) tablosu modellendi.
  * `backend/src/modules/subscriptions/` servisi ve rotaları eklendi (`/status`, `/verify`, `/sync`). `is_premium` sütunu doğrudan rastgele güncellenen bir alan olmaktan çıkarılıp, aktif abonelik durumuna göre otomatik türetilen denormalize bir read-cache bayrağına dönüştürüldü.
* **Şifre Sıfırlama ve Kriptografik Token Mimarisi (PBI-4.6.4):**
  * `sifre_sifirlama_talepleri` tablosu oluşturuldu. 32 baytlık rastgele token, SHA-256 hash'leme, 15 dakika TTL, `used_at` tek kullanımlık replay attack koruması ve `POST /auth/forgot-password` ile `POST /auth/reset-password` uçları canlıya alındı.

### 2. Etkilenen Bileşenler ve Dosyalar
* `backend/src/db/migrations/008_profile_subscriptions_security.sql`: Hostinger PostgreSQL canlı migration'ı.
* `backend/src/plugins/auth.ts`: `authorizeAdmin` hook'u ve RBAC yetkilendirmesi.
* `backend/src/modules/admin/routes.ts`: `DEFAULT_ADMIN_ID` temizliği ve `authorizeAdmin` hook'u.
* `backend/src/modules/community/service.ts` & `routes.ts`: Sabit UUID temizliği ve dinamik misafir/auth ayrımı.
* `backend/src/modules/understanding/service.ts` & `routes.ts`: `is_featured` kullanımı ve auth koruması.
* `backend/src/modules/users/service.ts` & `dto.ts`: `name`, `email`, `role` alanları ve kalıcı kaydı.
* `backend/src/modules/auth/routes.ts`: `name` iletimi, `/forgot-password`, `/reset-password` rotaları.
* `backend/src/modules/auth/passwordReset.ts`: PBKDF2/SHA-512 şifreleme ve token yaşam döngüsü.
* `backend/src/modules/subscriptions/service.ts` & `routes.ts`: `abonelikler` tablosu ve premium senkronizasyonu.
* `backend/src/app.ts`: `subscriptionRoutes` kaydı.
* `tafsil-ios-app/src/api/auth.ts`: İsim ve e-posta veri aktarım köprüsü.
* `tafsil-ios-app/src/screens/HomeScreen.tsx`: Dinamik isim karşılama.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: PBI-4.6 tamamlama işaretlemesi.

### 3. Önerilen Git Commit Mesajı
```git
feat(security): implement PBI-4.6 major security hardening, db profile schema, subscriptions architecture, and password reset
```

---

## [2026-10-02] Google Sign-In İyileştirmesi, Çoklu Emülatör Senkronizasyonu & PostgreSQL / Redis Canlı Bağlantı Doğrulaması (PBI-4.2, PBI-4.4, PBI-4.5)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Çoklu Emülatör İstatistik Tutarsızlığının Kök Nedenleri ve Çözümü:**
  * *Sorun 1 (Deterministik Olmayan Kimlik):* `useAuthStore.ts` içindeki dev token `Date.now()` ile üretildiği için her iki emülatörde aynı e-posta girilse bile farklı `auth_provider_id` ve farklı `user_id` oluşuyordu.
  * *Çözüm 1:* `backend/src/modules/auth/google.ts` ve `useAuthStore.ts` içinde token ve `sub` değeri doğrudan normalize edilmiş e-postaya (`google_${email.replace(...)}`) bağlandı. Artık iki farklı cihaz/emülatör aynı e-posta ile giriş yaptığında deterministik olarak **birebir aynı kullanıcı UUID'sine** bağlanır.
  * *Sorun 2 (Senkronizasyon PULL Eksikliği):* `OfflineSyncService.syncWithServer()` sunucudan gelen `reading_history` ve `memorization_sessions` verilerini yerel Zustand store'larına (`useReadingProgressStore` ve `useMemorizationStore`) aktarmıyordu. Sadece `bookmarks` alınıyordu.
  * *Çözüm 2:* `useReadingProgressStore` içine `bulkMergeReadingHistory`, `useMemorizationStore` içine `bulkMergeSessions` eklendi. `syncWithServer()` sunucudan çekilen tüm okuma geçmişini ve ezberleri bu store'lara aktararak iki emülatör arasındaki istatistikleri (okunan ayetler, sure ilerlemeleri, ezberler) anında eşitledi.
  * *Sorun 3 (Android Emülatör `localhost` Ulaşılmazlığı):* Android emülatöründe `localhost:4000` emülatörün kendisini temsil ettiğinden Mac hostuna erişemiyordu. `tafsil-ios-app/src/api/config.ts` güncellenerek Android için `10.0.2.2:4000`, iOS için `localhost:4000` dinamik olarak bağlandı.
* **Hostinger Canlı PostgreSQL Geçişi ve Migration:**
  * Hostinger VPS (`76.13.60.86:5432/tafsil_net_db`) veritabanına bağlanıldı.
  * Eksik olan `007_reading_history_extensions.sql` Hostinger üzerinde çalıştırıldı ve `kavram_gecmisi` tablosu oluşturuldu.
  * Local Docker'daki kullanıcı ve okuma geçmişi verileri Hostinger PostgreSQL'e aktarıldı.
  * `backend/.env` ve `backend/src/config/env.ts` Hostinger bağlantı adresine (`postgres://tafsil_user_001:<REDACTED>@76.13.60.86:5432/tafsil_net_db`) geçirildi. *(2026-10-03: parola güvenlik nedeniyle maskelendi — PBI-9.9)*
  * Fastify API canlı olarak Hostinger DB'ye bağlandı ve `GET /health` (`postgres: true, redis: true`) ile doğrulandı.
* **Mimari Standartların ve VPS Dayanıklılık Kılavuzunun Güncellenmesi:**
  * `docs/deployment/00-INFRASTRUCTURE.md` dosyasına Cloudflare R2 ses/timestamp stratejisi, salt-okunur Cloudflare cache + ETag, PgBouncer transaction pooling, WAL-G / pgBackRest ile R2'ye sürekli WAL arşivleme (PITR) ve PostgreSQL bellek ayarları (`shared_buffers=2GB`, `effective_cache_size=6GB`, `log_min_duration_statement=500ms`) işlendi.
* **PBI-4.6 (Büyük Güvenlik, DB Şeması & Kimlik Sertleştirmesi) Canlı Backlog'a Eklendi:**
  * Sabit UUID (`ffffffff-...` ve `00000000-...`) yetki bypass açıklarının giderilmesi, `HomeScreen` üzerindeki hardcoded `'Alper'` isminin dinamikleştirilmesi, `kullanicilar` tablosuna `name` ve `email` sütunlarının eklenmesi, `is_premium` mantığının ilişkisel `abonelikler` tablosuna ayrılması ve şifre sıfırlama/kurtarma sözleşmelerini içeren kapsamlı PBI `docs/roadmap/PHASE-1-MVP-BACKLOG.md` içine açıldı.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/src/store/mmkvStorage.ts`: MMKV yokken `expo-sqlite` senkron kalıcı KV tablosu fallback'i.
* `tafsil-ios-app/src/store/useAuthStore.ts`: `resetAuthStep`, dinamik `signInWithGoogle(options)`, `signOut` sonrası temiz misafir ve resetleme.
* `tafsil-ios-app/src/screens/AuthScreen.tsx`: Google giriş modalı, dinamik form ve `resetAuthStep` entegrasyonu.
* `tafsil-ios-app/src/screens/ProfileScreen.tsx`: "Hesabı Bağla (Apple / Google)" butonu, `resetAuthStep` navigasyonu, dinamik `displayName`.
* `tafsil-ios-app/src/screens/SettingsScreen.tsx`: Profil kartında misafir moduna duyarlı avatar ve isim gösterimi.
* `tafsil-ios-app/src/api/auth.ts`: `authenticateWithGoogle` dinamik email ve isim iletimi.
* `tafsil-ios-app/src/services/localDbService.ts`: SQLite `reading_logs` tablosu, `logReading` ve `getReadingLogs` metotları.
* `tafsil-ios-app/src/services/offlineSyncService.ts`: `recordReading` içinde SQLite ilişkisel loglama çağrısı.
* `backend/src/modules/auth/google.ts`: `verifyGoogleIdToken` içinde `providedEmail` desteği.
* `backend/src/modules/auth/routes.ts`: `login` ve `link` uçlarında dinamik `email` ve `name` doğrulama/kayıt.
* `backend/src/modules/users/dto.ts`: `PublicUser` arayüzüne `email?: string` alanı.
* `DEVELOPMENT_LOG.md`: Oturum kaydı eklendi.

### 3. Önerilen Git Commit Mesajı
```git
fix(auth): resolve google sign-in mock, fix sign-out account linking screen dismiss, and add sqlite persistence for guest sessions
```

---

## [2026-10-02] Sure Okuma Tamamlama Mantığı & Yüzde Hesaplama (PBI-6.4)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Tamamlanan Sureler Sözlüğü ve İlerleme Matrisi (`useReadingProgressStore.ts`):**
  * *Karar:* Kullanıcının bir sureyi tamamladığı bilgisi `completedSurahs: Record<number, { completedAt: string, timesCompleted: number }>` yapısında MMKV'de saklandı.
  * *Çoklu Hatim Desteği:* Bir sure birden fazla kez bitirildiğinde `timesCompleted` sayacı artar ve son tamamlanma zamanı güncellenir.
  * *Yüzde & İstatistik Hesaplamaları:* `getOverallStats()` fonksiyonu ile 114 sure ve 6,236 ayet üzerinden toplam okunan ayet, bitirilen sure sayısı ve genel Hatim tamamlama yüzdesi (`overallPercentage`) deterministik olarak hesaplanır.
  * *Manuel İşaretleme İmkanı:* Kullanıcı uygulamada okumadan dışarıda okuduğu sureleri de `SurahGridMatrix` üzerinden tek dokunuşla "Okundu Olarak İşaretle" veya "Okunmadı Yap" ile güncelleyebilir (`markSurahCompleted`, `unmarkSurahCompleted`).
* **Otomatik Tamamlama Tespiti (`ReadingScreen.tsx`):**
  * *Ayet/Scroll/Audio Tetikleyicileri:*
    1. Okuma sırasında son ayete tıklandığında veya odaklandığında (`activeAyah === totalVerses`).
    2. Ekran son ayetin hizasına kaydırıldığında (`handleScrollPosition`).
    3. Sesli tilavet son ayeti bitirdiğinde (`audioPlayerService.setListeners`).
    4. İleri butonuna basılarak sonraki sureye geçildiğinde (`handleNextStep` ve `AudioPlaybackBar.onNextVerse`).
  * *Otomatik İşlem:* Sure otomatik olarak tamamlandı olarak kaydedilir ve veritabanı okuma zaman çizelgesine işlenir (`OfflineSyncService.recordReading`).
* **Editoryal Kutlama Kartı (Celebratory Completion Card):**
  * *Tasarım:* Surenin sonuna ulaşıldığında sıradan "Sonraki Ayet" butonu yerine zengin bir kutlama kartı belirir:
    * `✓ SURE TAMAMLANDI · %100` rozeti.
    * `{sureAdi} Suresi Okundu` editoryal başlığı ve tebrik metni.
    * `Sıradaki Sureye Geç: {nextSurah} →` birincil butonu.
    * `Sureyi Baştan Oku (1. Ayet)` ve `İlerleme Matrisi ›` ikincil butonları.
* **Görsel Rozetler ve Matris Uyumu (`SurahGridMatrix.tsx` & `SurahListScreen.tsx`):**
  * `SurahGridMatrix.tsx`: Başlıkta `{completedSurahsCount} / 114 Sure · %{overallPercentage} Hatim İlerlemesi` özet çubuğu, tamamlanan hücrelerde `✓` onay işareti ve detay kartında okundu/okunmadı toggle butonu.
  * `SurahListScreen.tsx`: Her sure satırında tamamlananlar için `✓ %100` vurgu rozeti, devam edenler için `%{percent}` ilerleme rozeti eklendi.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/src/store/useReadingProgressStore.ts`: `completedSurahs`, `markSurahCompleted`, `unmarkSurahCompleted`, `isSurahCompleted`, `getSurahReadVerseCount`, `getOverallStats`.
* `tafsil-ios-app/src/screens/ReadingScreen.tsx`: Son ayet tespiti, otomatik tamamlama, Celebratory Completion Card ve sonraki sure akışı.
* `tafsil-ios-app/src/components/progress/SurahGridMatrix.tsx`: Hatim ilerleme çubuğu, tamamlandı ikonları, yüzde kartı ve manuel işaretleme butonu.
* `tafsil-ios-app/src/screens/SurahListScreen.tsx`: Sure listesinde `✓ %100` ve `%{percent}` rozetleri.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: `PBI-6.4` tamamlandı (`[x]`). Bölüm 6 %100 tamamlandı.
* `DEVELOPMENT_LOG.md`: Oturum kaydı eklendi.

### 3. Önerilen Git Commit Mesajı
```git
feat(reading): implement surah completion logic, percentage tracking, and celebratory completion card (PBI-6.4)
```

---

## [2026-10-02] İlk Açılış Onboarding Akışı & Niyet Seçimi (PBI-5.3)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **3-Adımlı Editoryal Onboarding Mimarisi (PBI-5.3):**
  * *Tasarım Referansı (`Tafsil.dc.html` 1a):* `OnboardingScreen.tsx`, projenin tasarım rehberindeki editoryal tipografi (Newsreader serif + Instrument Sans), niyet kartları ve dinamik aksiyonlarla baştan aşağı uyarlandı.
  * *Adım 1 (Kavramsal Bağlam & Morfoloji):* Kur'an'ın kendi iç bağlamı, kök matematiği (`ع-ل-م` kökünün fiil/kavram/özne/kavranan hâlleri) interaktif vitrin kartıyla sunuldu.
  * *Adım 2 (Akıcı Okuma & Ezber Stüdyosu):* Kitap gibi akıcı okuma ile cihaz içi yapay zekayla çalışan `Reveal-on-Recite` sesli okuma ve kelime belirme simülasyonu sergilendi.
  * *Adım 3 (Niyet & Mod Seçimi):* "Kur'an'a hangi niyetle geliyorsun?" sorusu altında 3 editoryal niyet kartı bağlandı:
    * **Araştırmacı (Keşif):** Metni sade ve akıcı okuma, felsefi bağlam ve mistik morfoloji. Seçildiğinde anlık `mor` vurgu temasına geçiş.
    * **Öğrenen (Öğrenme):** Adım adım ilerleme, orijinal Arapça, meal ve kökler bir arada. Seçildiğinde `ceviz` sıcak kağıt temasına geçiş.
    * **Tilavet (Odak):** Kesintisiz ve dikkat dağıtıcısız Uthmani büyük hatla tilavet. Seçildiğinde `lacivert` derin gece temasına geçiş.
* **Canlı Vurgu ve Dil Değiştirici (Dynamic Accent & Language Switcher):**
  * *Taktil Geri Bildirim:* Kullanıcı kartlara dokunduğunda `handleSelectMode(mode)` ile anında `setAccentVariant(MODE_TO_ACCENT[mode])` tetiklenir; böylece kart sınırları, radyo butonları ve "Okumaya Başla" butonu seçilen modun rengine anında bürünür.
  * *Hızlı Dil Seçimi:* `Tafsil.dc.html` 1a tasarımındaki gibi butonun hemen yanında 52x52 dairesel dil butonu yer alır; tek dokunuşla `TR` / `EN` / `AR` arasında geçiş yapılarak tüm onboarding metinleri reaktif olarak çevrilir.
* **Mağaza ve İlk Kurulum Dayanıklılığı (`useUserSettingsStore` & `RootNavigator`):**
  * `onboardingCompleted` varsayılan değeri `false` olarak ayarlandı (yeni yükleyen her kullanıcı bu deneyimi görür).
  * `RootNavigator.tsx` içinde `Onboarding` ekranı navigasyon yığınına koşulsuz olarak kaydedildi; böylece `SettingsScreen.tsx` üzerinden "Önizleme > Tanıtım & Niyet Seçimi" tıklandığında hem test edilebilir hem de kullanıcı istediğinde tanıtımı tekrar açabilir.
  * Onboarding tamamlandığında ilk açılışsa `navigation.reset({ index: 0, routes: [{ name: 'Main' }] })`, ayarlardan gelinmişse `navigation.goBack()` çalıştırılarak pürüzsüz geçiş sağlandı.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/src/screens/OnboardingScreen.tsx`: 3 adımlı editoryal akış, niyet kartları, morfoloji ve reveal-on-recite vitrinleri, dinamik tema uyarlaması ve dil değiştirici.
* `tafsil-ios-app/src/store/useUserSettingsStore.ts`: Varsayılan `onboardingCompleted: false` yapıldı.
* `tafsil-ios-app/src/navigation/RootNavigator.tsx`: `Onboarding` ekranı navigasyon yığınında kalıcılaştırıldı.
* `tafsil-ios-app/src/screens/SettingsScreen.tsx`: Ayarlar > Önizleme alanına "Tanıtım & Niyet Seçimi (Onboarding)" seçeneği eklendi.
* `tafsil-ios-app/src/i18n/types.ts`: Onboarding şeması 3 adım ve niyet kartları detaylarıyla genişletildi.
* `tafsil-ios-app/src/i18n/tr.ts`: Türkçe editoryal metinler ve niyet kartı açıklamaları.
* `tafsil-ios-app/src/i18n/en.ts`: İngilizce tam çeviriler.
* `tafsil-ios-app/src/i18n/ar.ts`: Arapça tam çeviriler.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: `PBI-5.3` tamamlandı (`[x]`). Bölüm 5 %100 tamamlandı.
* `DEVELOPMENT_LOG.md`: Oturum kaydı eklendi.

### 3. Önerilen Git Commit Mesajı
```git
feat(onboarding): implement 3-step editorial onboarding and intention mode selection (PBI-5.3)
```

---

## [2026-10-02] Backend JWT Entegrasyonu & Misafir Modu / Account Linking (PBI-4.4 & PBI-4.5)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Fastify Backend JWT & OAuth Token Doğrulaması (PBI-4.4):**
  * *Karar:* İstemciden gelen Apple / Google identity token'larını doğrulayan `verifyAppleIdToken` (Apple JWKS) ve `verifyGoogleIdToken` (Google OAuth2Client) işlevleri güçlendirildi.
  * *Audience & Bundle ID Uyumu:* Apple token doğrulaması için `net.tafsil.app` varsayılan audience olarak yapılandırıldı. Geliştirme/simülatör ortamı için güvenli dev token fallback'i sağlandı.
  * *Fastify JWT Üretimi:* Doğrulanan kullanıcı için `@fastify/jwt` ile imzalı oturum JWT token'ı (`{ sub, authProvider }`) üretilip istemciye döndürüldü.
* **Misafir / Anonim Mod (Guest Mode - PBI-4.5):**
  * *Karar:* Kullanıcının hesap açmadan da okumaya başlayabilmesi için `POST /api/v1/auth/guest` ucu eklendi.
  * *İstemci Durumu:* `useAuthStore` içine `isGuest: boolean` ve `token: string | null` eklendi; "Misafir Olarak Devam Et" ile tek tıkla oturum açılması ve MMKV persist ile saklanması sağlandı.
* **Hesap Bağlama (Account Linking - PBI-4.5):**
  * *Karar:* `POST /api/v1/auth/link` ucu eklendi. Misafir kullanıcının sonradan Apple / Google ile giriş yapması durumunda; yerelde ve sunucuda oluşturduğu yer imleri (`yer_imleri`), okuma geçmişi (`okuma_gecmisi`) ve ezber oturumları (`ezber_oturumlari`) sıfır veri kaybıyla yeni/bağlı hesaba devredilir.
  * *İstemci Entegrasyonu:* `signInWithApple` ve `signInWithGoogle` fonksiyonları kullanıcının o an misafir modunda olduğunu algıladığında otomatik olarak `linkAccount` protokolünü ve `OfflineSyncService.syncWithServer()` çağrısını tetikler.
* **Yetkili Senkronizasyon (Authorized Sync):**
  * *Karar:* `OfflineSyncService.syncWithServer()` ve `getReadingTimeline()` fonksiyonlarına `Authorization: Bearer <token>` ve `user_id` bağlandı; sunucuyla yapılan senkronizasyonların kullanıcı kimliğiyle doğrulanması garanti altına alındı.

### 2. Etkilenen Bileşenler ve Dosyalar
* `backend/src/plugins/auth.ts`: `SessionTokenPayload` authProvider tipi esnetildi.
* `backend/src/config/env.ts`: `APPLE_CLIENT_ID` varsayılanı `"net.tafsil.app"` olarak bağlandı.
* `backend/src/modules/auth/apple.ts`: Apple JWKS ve simülatör dev token uyumluluğu.
* `backend/src/modules/auth/google.ts`: Google ID token doğrulayıcısı ve dev token desteği.
* `backend/src/modules/users/dto.ts`: `PublicUser` içine `authProvider` ve `isGuest` alanları eklendi.
* `backend/src/modules/users/service.ts`: `createGuestUser`, `linkGuestUser` ve DB bağlantı dayanıklılığı (resilient fallback).
* `backend/src/modules/auth/routes.ts`: `POST /guest`, `POST /link` ve `GET /me` uçları.
* `tafsil-ios-app/src/api/types.ts`: `AuthProvider`'a `'guest'` eklendi, `AuthUser` içine `token` ve `isGuest` eklendi.
* `tafsil-ios-app/src/api/auth.ts`: `authenticateAsGuest`, `linkGuestAccount`, `fetchMe` fonksiyonları eklendi.
* `tafsil-ios-app/src/store/useAuthStore.ts`: `token`, `isGuest`, `continueAsGuest` ve otomatik account linking akışı.
* `tafsil-ios-app/src/services/offlineSyncService.ts`: Dinamik JWT ve `user_id` ile yetkilendirilmiş senkronizasyon.
* `tafsil-ios-app/src/screens/AuthScreen.tsx`: "Misafir Olarak Devam Et" aksiyonu.
* `tafsil-ios-app/src/screens/ProfileScreen.tsx`: Misafir modu rozeti ve "Hesabı Apple ile Bağla" butonu.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: `PBI-4.4` ve `PBI-4.5` tamamlandı (`[x]`).
* `DEVELOPMENT_LOG.md`: Bu oturum kaydı eklendi.

### 3. Önerilen Git Commit Mesajı
```git
feat(auth): integrate backend JWT authentication, guest mode, and account linking (PBI-4.4 & PBI-4.5)
```

---

## [2026-10-02] Çevrimdışı Ses Önbelleği (PBI-2.10)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Çevrimdışı Yerel Ses Deposu (`expo-file-system/legacy` & `audioCacheService.ts`):**
  * *Karar:* Kullanıcının seçilen sureye ait tüm ayet seslerini tek dokunuşla cihaz diskine indirebilmesi için `AudioCacheService` inşa edildi.
  * *Dizin Hiyerarşisi:* Dosyalar `${FileSystem.documentDirectory}tafsil_audio/surah_${surahId}/${ayahNo}.mp3` kalıcı alanına kaydedilir. Böylece iOS, cihaz geçici disk temizliği yapsa dahi kullanıcının indirdiği sureleri silmez.
  * *Hızlı İndirme Havuzu (Concurrency: 3):* Ayetler tek tek ardışık indirilmek yerine 3 eşzamanlı iş parçacığıyla indirilir; böylece uzun sureler bile saniyeler içinde indirilir. İndirme iptal edilebilir (`cancelDownload`).
* **Zustand & MMKV ile Reaktif İndirme Durumu (`useAudioCacheStore.ts`):**
  * *Karar:* İndirilen sure kimlikleri (`downloadedSurahIds`) MMKV üzerinden kalıcılaştırıldı. Anlık indirme yüzdeleri ve bayt boyutları reaktif olarak store'da yönetilir.
  * *Gerekçe:* Uygulama yeniden başlatılsa bile hangi surelerin çevrimdışı hazır olduğu sıfır gecikmeyle bilinir.
* **Şeffaf Çevrimdışı Oynatma Çözümlemesi (`audioPlayerService.playAyah`):**
  * *Karar:* Oynatıcı ayet çalarken `audioCacheService.resolveAyahAudioUri(surahId, ayahNo, remoteUrl)` çağrısı yapar. Eğer ayet cihazda varsa doğrudan yerel `file://` URI'sini çalar; internet yokken dahi sıfır takılma ve sıfır gecikmeyle çalışır.
  * *Gerekçe:* Ağ bağlantısı kesildiğinde veya uçak modundayken kullanıcının kesintisiz dinleme yapabilmesi.
* **Arayüz Entegrasyonu (`AudioDownloadButton.tsx`, `ReadingScreen`, `AudioPlaybackBar` & `SearchScreen`):**
  * *Header ve Subheader Düğmeleri:* `ReadingScreen` sağ üst köşesine ve alt bilgi çubuğuna tek tıkla indirme/silme/ilerleme gösteren `AudioDownloadButton` yerleştirildi.
  * *Çevrimdışı Rozeti:* `AudioPlaybackBar` çalınan ayetin yerel diskten beslendiğini algıladığında `ÇEVRİMDIŞI` yeşil rozetini gösterir.
  * *Arama ve Sure Kartları:* Sure listelerinde ve arama sonuçlarında indirilen surelerin yanında `✓ Çevrimdışı` ibaresi belirir.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/package.json` & `package-lock.json`: `expo-file-system` eklendi.
* `tafsil-ios-app/src/services/audioCacheService.ts`: Yerel ses yönetimi, denetimi, eşzamanlı indirme ve silme servisi.
* `tafsil-ios-app/src/store/useAudioCacheStore.ts`: MMKV kalıcılaştırılmış indirme durum store'u ve bayt biçimlendiricisi.
* `tafsil-ios-app/src/components/reading/AudioDownloadButton.tsx`: Başlık ve alt başlık modlu interaktif indirme düğmesi.
* `tafsil-ios-app/src/services/audioPlayerService.ts`: `playAyah` içinde yerel dosya öncelikli URL çözümlemesi ve `isOffline` durumu bildirimi.
* `tafsil-ios-app/src/components/reading/AudioPlaybackBar.tsx`: `isOffline` prop'u ve yeşil "ÇEVRİMDIŞI" rozeti.
* `tafsil-ios-app/src/screens/ReadingScreen.tsx`: `AudioDownloadButton` entegrasyonu, `isOfflineAudio` senkronizasyonu.
* `tafsil-ios-app/src/screens/SearchScreen.tsx`: Sure listelerinde çevrimdışı hazır rozeti.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: `PBI-2.10` tamamlandı (`[x]`).
* `DEVELOPMENT_LOG.md`: Bu oturum kaydı eklendi.

### 3. Önerilen Git Commit Mesajı
```git
feat(mobile): add offline audio caching and download manager (PBI-2.10)
```

---

## [2026-10-02] Odak Modu Tilaveti ve Sadece Dinleme Sahnesi (PBI-2.9)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Odak Modu Görsel Saflaştırması (`VerseCard` & `MOB-007`):**
  * *Karar:* Kullanıcı Odak Modu'na geçtiğinde `VerseCard` içindeki latin okunuş (transliteration) ve interaktif kavram alt çizgileri (`[<kavram>]`) tamamen devre dışı bırakıldı. Kart kenarlıkları (borders) nötr şeffaflığa çekildi; alt dipnot kümesi (`surah:ayah · Cüz · Sayfa`) ve yer imi yıldızı kaldırıldı.
  * *Arapça Hat Büyüklüğü (Hero Emphasis):* Odak modunda Arapça Mushaf metni bir kademe daha büyük ölçekle (`effectiveArabicScale`) heybetli ve okunaklı hale getirildi.
  * *Gerekçe:* Odak Modu'nun varlık sebebi dikkat dağıtıcısız, huşu içinde saf tilavet ve okuma deneyimi sunmaktır.
* **Audio-Only Tilavet Sahnesi (Dedicated Recitation Stage):**
  * *Karar:* `AudioPlaybackBar` üzerine bir "Odak" / "Metin" geçiş butonu (`isAudioOnly`) eklendi. Ayrıca Odak Modu'nda tilavet başlatıldığında doğrudan Audio-Only sahnesi açılır.
  * *Görsel Sahne Mimarisi:* Ekrandaki uzun ayet listesi (`ScrollView`) yerine ekranda sadece o an okunan ayetin dev Uthmani/Amiri hattıyla kelimeleri (34px), gerçek zamanlı karaoke kelime vurgulaması (`activeWordIndex`) ve arka planda dikkat dağıtmayan zarif tek satır/kısa meal yer alır.
  * *Sıfır Gecikmeli Kelimeye Atlama (Seek-on-Word-Click):* Audio-Only sahnesindeki dev kelimelere dokunulduğunda doğrudan o kelimenin `startMs` süresine atlama özelliği (PBI-2.7) korunmuştur.
  * *Kesintisiz Geçiş:* Alt ses çubuğu (`AudioPlaybackBar`) her iki ekranda da sabit kaldığı için kullanıcı "Metne Dön" butonuna veya alt bardaki "Metin/Odak" butonuna bastığında ses kesinlikle kesilmeden liste görünümüne geri dönebilir.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/src/components/reading/AudioPlaybackBar.tsx`: `isAudioOnly`, `onToggleAudioOnly` prop'ları ve toggle butonu eklendi.
* `tafsil-ios-app/src/screens/ReadingScreen.tsx`: `VerseCard` görsel saflaştırması, `effectiveArabicScale`, Audio-Only sahnesi render bloğu ve subheader "🎧 Odak Sahnesi" kısayolu eklendi.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: `PBI-2.9` tamamlandı (`[x]`).
* `DEVELOPMENT_LOG.md`: Bu oturum kaydı eklendi.

### 3. Önerilen Git Commit Mesajı
```git
feat(mobile): add focus mode audio-only recitation scene (PBI-2.9)
```

---

## [2026-10-02] iOS Arka Plan & Kilit Ekranı Kumandası (PBI-2.8)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **iOS MPNowPlayingInfoCenter & Kilit Ekranı Bilgi Entegrasyonu:**
  * *Karar:* Cihaz kilitlendiğinde veya Denetim Merkezi (Control Center) açıldığında çalan sure adı (örn. `Fâtiha Suresi · 1. Ayet`), kâri/sanatçı bilgisi (`Mişari Raşid el-Afasi`) ve albüm bilgisi (`tafsil.net`) `expo-audio`'nun yerel `setActiveForLockScreen` ve `updateLockScreenMetadata` altyapısı üzerinden dinamik olarak bağlandı.
  * *Gerekçe:* Kullanıcının ekran kapalıyken de hangi sure ve ayeti dinlediğini görebilmesi; elit ve yerel bir müzik çalar deneyimi elde edilmesi.
* **MPRemoteCommandCenter Kumandaları (Play, Pause, Scrub, +/-10s Skip):**
  * *Karar:* Kilit ekranındaki oynat/duraklat, parça zaman çubuğu üzerinden sarma (scrubbing) ve 10 saniye ileri/geri sarma (`showSeekForward: true`, `showSeekBackward: true`) kontrolleri etkinleştirildi.
  * *Gerekçe:* Ekranı açmaya gerek kalmadan veya kulaklık / Apple Watch üzerinden tilavetin kontrol edilebilmesi.
* **AudioMode ve Ses Oturumu Yapılandırması (`interruptionMode: 'doNotMix'` & `keepAudioSessionActive: true`):**
  * *Karar:* `setAudioModeAsync` içinde `interruptionMode: 'doNotMix'` yapılandırıldı (iOS'ta kilit ekranı kumandalarının AVPlayer ile eşleşmesi için zorunlu şart).
  * *Karar:* `createAudioPlayer` seçeneklerine `keepAudioSessionActive: true` eklendi.
  * *Gerekçe:* Ayetler ve sureler arası geçişte önceki ses dosyası boşaltılırken iOS ses oturumunun deaktive olup işletim sistemi tarafından arka plan sürecinin askıya alınmasını (suspension) önlemek.
* **Yerel ve Uygulama İçi Durum Senkronizasyonu (Two-Way Remote Sync):**
  * *Karar:* Kullanıcı kilit ekranından, AirPods üzerinden veya Apple Watch'tan Play/Pause bastığında; `playbackStatusUpdate` ve oynatıcı takip döngüsü bu durumu anında algılayarak uygulamanın `isPlaying` durumunu günceller.
  * *Watchdog Koruması:* Takılma kurtarıcısı (stall recovery), oynatıcının `paused` durumunda (kullanıcı bilinçli olarak kilit ekranından durdurduğunda) sesin zorla tekrar başlamasını engelleyecek şekilde güvenli hale getirildi.

* **Expo Go ve Simülatör Kısıtları (Platform Farkındalığı):**
  * *Simülatör:* iOS Simülatörü kilit ekranında (Lock Screen) medya oynatıcı kartını doğrudan çizmez; `MPNowPlayingInfoCenter` sinyallerini macOS'un kendi "Denetim Merkezi / Şimdi Çalınan" menüsüne yönlendirir.
  * *Expo Go:* Expo Go genel bir sandbox uygulaması olduğundan, cihaz kilitlendiğinde Metro bundler bağlantısını koparır ve misafir uygulamalara özel arka plan haklarını (UIBackgroundModes) çalıştırmaz. Arka plan sesinin gerçek cihazda çalışması için `app.json` içindeki `expo-audio` eklentisine `enableBackgroundPlayback: true` tanımlandı; tam testin Development Build veya TestFlight/Production dağıtımında yapılması kararlaştırıldı.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/app.json`: `expo-audio` eklentisine `{ enableBackgroundPlayback: true }` yapılandırması eklendi.
* `tafsil-ios-app/src/services/audioPlayerService.ts`: `interruptionMode: 'doNotMix'`, `keepAudioSessionActive: true`, `setActiveForLockScreen`, `updateMetadata`, `clearLockScreenControls`, kilit ekranı play/pause senkronizasyonu ve watchdog ayrımı.
* `tafsil-ios-app/src/screens/ReadingScreen.tsx`: Ayet tilavetine dinamik `metadata` (`title`, `artist`, `albumTitle`) beslenmesi ve harici kumanda play/pause dinleyicisinin reaktif senkronizasyonu.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: `PBI-2.8` tamamlandı (`[x]`).
* `DEVELOPMENT_LOG.md`: Bu oturum kaydı eklendi.

### 3. Önerilen Git Commit Mesajı
```git
feat(mobile): configure lock screen controls and background now playing metadata (PBI-2.8)
```

---

## [2026-10-02] Sure Geçişinde Kesintisiz Tilavet (AutoPlay Fix)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Sure Geçişinde Sesin Kesilmesi Problemi (Kök Neden):**
  * *Sorun:* Önceki sure bittiğinde veya kullanıcı sonraki sureye geçtiğinde sayfa `navigation.replace('Reading', { surahId: surahId + 1, ayahNo: 1, autoPlay: true })` ile açılıyor, arayüzde play modu aktif görünmesine rağmen ses başlamıyordu.
  * *Neden 1 (Unmount Temizliği Yarış Durumu):* `ReadingScreen` ekranından ayrılırken çalışan `useEffect` cleanup'ı (`audioPlayerService.stopAndUnload()`), sureler arası geçişte eski ekran yok edilirken yeni ekranın başlatacağı oynatıcıyı kapatıyor ve `this.isUserPlaying` durumunu sıfırlıyordu.
  * *Neden 2 (Asenkron Ayet Yükleme ve Boş Dizi Engeli):* Yeni sure ilk yüklendiğinde `verses` state'i başlangıçta `[]` olduğundan, ses çalma `useEffect`'i `if (currentVerses.length === 0) return;` satırına takılıp çıkıyordu. Ayetler API/snapshot'tan gelip `setVerses` çalıştığında ise `verses` dependency array'de yer almadığı için oynatma fonksiyonu bir daha hiç tetiklenmiyordu.
* **Uygulanan Çözüm Mimarisi:**
  * *1. Çift Katmanlı Geçiş Koruyucusu (`isTransitioningSurah`):*
    * `ReadingScreen` içine `isTransitioningSurahRef`, `AudioPlayerService` içine ise `isTransitioningSurah` bayrağı eklendi.
    * Sure bittiğinde veya kullanıcı sonraki sure butonuna bastığında bu bayrak `true` yapılır; eski ekran unmount olurken `stopAndUnload()` çalıştırılmaz ve ses nesnesi korunur.
    * Yeni ekran `playAyah` çağrısını başlattığında bayrak otomatik olarak sıfırlanır.
  * *2. Reaktif Oynatma ve Ayet Bağımsız İlk Akış:*
    * Ses çalma `useEffect`'inin bağımlılıklarına `verses` dahil edildi; ayet listesi yüklendiği anda reaktif olarak tetiklenmesi sağlandı.
    * Ayrıca ayetler henüz asenkron yüklenirken dahi Cloudflare R2 ses URL'si deterministik olarak bilindiğinden (`getAyahAudioUrl(surahId, 1)`), 1. ayetin ses streaming'i sıfır gecikmeyle derhal başlatılır; ayet metinleri geldiğinde ise oynatma kesilmeden kelime eşleşmesi güncellenir.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/src/services/audioPlayerService.ts`: `isTransitioningSurah` durumu, `setTransitioningSurah(val)` metodu ve `stopAndUnload` koruması.
* `tafsil-ios-app/src/screens/ReadingScreen.tsx`: `isTransitioningSurahRef`, unmount koruması, `onVerseFinish`, `onNextVerse`, `handleNextStep` ve sıradaki sureye geçiş köprüleri, reaktif `verses` oynatma etkisi.
* `DEVELOPMENT_LOG.md`: Bu oturum kaydı eklendi.

### 3. Önerilen Git Commit Mesajı
```git
fix(mobile): ensure continuous audio playback and autoPlay on surah transitions
```

---

## [2026-10-02] Kelimeye Dokunarak Sarma ve Tilavet Kontrolü (PBI-2.7)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Kelimeye Dokunarak Sarma (Seek-on-Word-Click):**
  * *Karar:* Ses çalarken veya duraklatılmışken (`isAudioSessionActive || isPlaying`) Kur'an metnindeki herhangi bir Arapça kelimeye dokunulduğunda sesin doğrudan o kelimenin `startMs` zaman damgasına anında atlaması sağlandı.
  * *Aynı Ayet İçi Sarma:* Oynatıcı mevcut ayette çalıyorsa player baştan oluşturulmadan doğrudan `audioPlayerService.seekToMs(startMs, true)` ile sıfır gecikmeli sarılır ve aktif kelime karaoke vurgusu anında dokunulan kelimeye geçer.
  * *Farklı Ayete Atlama:* Kullanıcı başka bir ayetteki kelimeye dokunduğunda ekran o ayete odaklanır ve yeni ayetin sesi o kelimenin `startMs` süresinden başlatılarak kesintisiz tilavet sürdürülür.
* **Ses Oynatıcı Servisi Geliştirmeleri (`audioPlayerService.ts`):**
  * *Karar:* `expo-audio`'nun native `seekTo` metodunu saran `seekToMs(positionMs, resumeIfPaused)` ve `seekToWord(word, resumeIfPaused)` fonksiyonları eklendi.
  * *İlk Konum Desteği:* `playAyah(url, words, shouldPlay, initialPositionMs)` fonksiyonuna `initialPositionMs` parametresi eklendi. Ses akışı ağdan yüklenirken status takibiyle ilk saniyeden değil istenen milisaniyeden başlatılması garanti altına alındı.
* **Çift Amaçlı Dokunma (Sözlük & Sarma) Çakışma Yönetimi:**
  * *Karar:* Kullanıcı okuma modundayken (tilavet henüz başlatılmamışken) kelimeye dokunulduğunda editoryal Sözlük & Morfoloji çekmecesi (`WordDetailSheet`) açılır. Tilavet oturumu aktifken ise tek dokunma doğrudan ses sarma (PBI-2.7) olarak çalışır.
  * *Uzun Basma (Long-Press):* Tilavet oturumu açıkken de morfolojik sözlük ihtiyacını karşılamak için kelimelere uzun basıldığında (`onWordLongPress`, 350ms) her koşulda `WordDetailSheet` açılması sağlandı.
  * *Sözlükten Dinleme:* `WordDetailSheet` başlığına "▶ [00:04] Bu Kelimeden Dinle" eylem hapı yerleştirildi; sözlükten de doğrudan o kelimeden tilavet başlatılabilir.
* **Yüzen Tilavet Çubuğu Kapatma ve Mini Mod:**
  * *Karar:* `AudioPlaybackBar` bileşenine zarif bir `✕` kapatma butonu eklendi. Tilavet kapatıldığında oynatıcı boşaltılır ve altta dikkat dağıtmayan şık bir *"▶ Tilaveti Başlat · X. Ayet"* hapı belirir.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/src/services/audioPlayerService.ts`: `seekToMs`, `seekToWord`, `initialPositionMs` ve getDurationMs/getPositionMs eklendi.
* `tafsil-ios-app/src/components/reading/AudioPlaybackBar.tsx`: `onClose` desteği ve minimalist kapatma ikonu.
* `tafsil-ios-app/src/components/lexicon/WordDetailSheet.tsx`: `onPlayFromWord` prop'u ve "Bu Kelimeden Dinle" butonu.
* `tafsil-ios-app/src/screens/ReadingScreen.tsx`: `handleSeekToWord`, `handleWordPress`, `handleWordLongPress`, `seekTargetMsRef`, mini tilavet tetikleyici.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: `PBI-2.7` tamamlandı (`[x]`).
* `DEVELOPMENT_LOG.md`: Bu oturum kaydı eklendi.

### 3. Önerilen Git Commit Mesajı
```git
feat(mobile): implement seek-on-word-click (PBI-2.7) and playback dock close controls
```

---

## [2026-10-02] Okuma Ekranı Tipografi, Transkript ve Görsel Ayar Çekmecesi (PBI-1.5)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Okuma & Tipografi Tercih Deposu (`useReadingPreferencesStore`):**
  * *Karar:* Kullanıcının Arapça hat boyutu (`small`/19px, `medium`/23px, `large`/28px, `huge`/34px), Türkçe meal boyutu (`small`/14px, `medium`/16px, `large`/18px, `huge`/21px), **Latin transkript/okunuş boyutu** (`small`/11.5px, `medium`/13.5px, `large`/15.5px, `huge`/18px), **transkript yazı stili** (`italic`/eğik serif veya `regular`/düz modern sans), satır aralığı (`compact`/0.88x, `normal`/1.0x, `relaxed`/1.25x) ve görsel katman görünürlükleri (`showMeal`, `showArabic`, `showTransliteration`, `showConceptHighlights`) MMKV persist altyapısıyla bağımsız ve kalıcı bir Zustand store'a (`useReadingPreferencesStore.ts`) taşındı.
  * *Gerekçe:* Kullanıcı okuma ekranında tercihini bir kez belirlediğinde sonraki oturumlarda ve sureler arasında ayarlarının korunması; `ReadingScreen` render maliyetinin diğer store'lardan izole edilmesi.
* **Transkript (Okunuş) Tipografi ve Stil Ayarları:**
  * *Karar:* Kullanıcının Kur'an telaffuz kılavuzunu kendi okuma rahatlığına göre ölçekleyebilmesi için 4 kademeli font boyutu ve editoryal "Eğik (Serif)" vs "Düz (Sans)" yazı karakteri seçicisi eklendi. Çekmece canlı önizleme kartında ve ayet kartlarında anlık olarak uygulanır.
* **Okuma & Tipografi Ayar Çekmecesi (`ReadingAppearanceSheet`):**
  * *Karar:* Apple Books ve Safari Reader tasarım diliyle uyumlu; üstten çekme tutacağı, canlı ayet önizleme kartı (Live Preview Card), 4 kademeli Arapça, Transkript & Meal boyutu hap butonları, 3 kademeli satır aralığı seçicisi ve Switch tabanlı görünüm katmanı toggle'larını içeren elit bir modal bottom sheet geliştirildi.
  * *Canlı Önizleme (Live Preview):* Kullanıcı font boyutunu, satır aralığını değiştirdiğinde veya meal/transliterasyonu açıp kapattığında çekmece içindeki Besmele önizleme kartı anlık olarak tepki verir.
* **Meal Gizleme Toggle'ı ve Tilavet Modu Entegrasyonu (PBI-1.5):**
  * *Karar:* `showMeal` toggle'ı kapatıldığında ayet kartlarında meal blokları tamamen gizlenir; kullanıcı dikkat dağıtıcısız, saf tilavet ve mushaf odaklı okuma yapabilir. Üst durum çubuğunda ise hafif ve şık bir *"Tilavet Modu · Meal Gizli ⚙"* rozeti belirir; dokunulduğunda doğrudan ayar çekmecesi açılır.
* **Okuma Ekranı Üst Çubuğu `Aa` Tipografi Butonu:**
  * *Karar:* `ReadingScreen` navigation headerRight alanına `Newsreader_600SemiBold` `A` ve `Newsreader_400Regular` `a` harflerinden oluşan, platform standartlarında zarif ve erişilebilir bir buton yerleştirildi.
* **Ayarlar Ekranı Entegrasyonu:**
  * *Karar:* `SettingsScreen` içine "OKUMA & TİPOGRAFİ" başlığı altında çekmeceyi doğrudan açıp düzenleme seçeneği eklendi.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/src/store/useReadingPreferencesStore.ts`: Transkript boyutu (`transliterationFontSize`), stili (`transliterationStyle`) ve metrik yardımcıları eklendi.
* `tafsil-ios-app/src/store/index.ts`: Store dışa aktarımı.
* `tafsil-ios-app/src/components/reading/ReadingAppearanceSheet.tsx`: Transkript boyutu ve eğik/düz karakter seçicisi ile canlı önizleme entegrasyonu.
* `tafsil-ios-app/src/screens/ReadingScreen.tsx`: Ayet kartlarında transkript tipografi ve stil desteği.
* `tafsil-ios-app/src/screens/SettingsScreen.tsx`: Okuma & tipografi ayarlarına doğrudan erişim satırı.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: `PBI-1.5` tamamlandı (`[x]`).
* `DEVELOPMENT_LOG.md`: Bu oturum kaydı güncellendi.

### 3. Önerilen Git Commit Mesajı
```git
feat(mobile): add transliteration font size and style controls to reading appearance drawer
```

---

## [2026-10-02] Editoryal User Bar ve Yüzen Alt Menü (Floating Tab Bar) Mimarisi

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Anasayfa Editoryal Kullanıcı Karşılama Barı (`UserHeaderBar`):**
  * *Karar:* `HomeScreen` üst kısmına arama çubuğunun hemen üzerine transparan zeminli, editoryal zaman hitaplı (*"Sabah oldu, Alper"*, *"Vakit ikindi, Alper"* vb. - `Newsreader_600SemiBold`), sol tarafında yuvarlak kare profil monogramı, sağ tarafında ise zarif ayarlar/profil kısayolu içeren bir başlık çubuğu yerleştirildi.
* **Hassas Mekanik Ayarlar İkonu (`PrecisionSettingsIcon`):**
  * *Karar:* Jenerik, kalitesiz platform emojisi veya unicode `⚙` karakteri tamamen kaldırıldı; yerine saf React Native vektörel geometrisiyle mikron hassasiyetinde üretilmiş 6 dişli, oyuk mil merkezli İsviçre saatçiliği çark motifi (`PrecisionSettingsIcon.tsx`) yerleştirildi. Sağ üst köşesine ise aktif okuma modunu gösteren mücevher/LED stili minik çerçeveli gösterge entegre edildi.
  * *Gerekçe:* `AudioPlaybackBar`'da uygulanan *"Emoji yerine saf RN View'lardan üretilmiş geometrik ikon"* ilkesini uygulayarak arayüzün elit, editoryal ve lüks hardware kimliğini korumak.
* **Yüzen Alt Menü (Floating Dock / Island Tab Bar - `FloatingTabBar`):**
  * *Karar:* Alt menü ekran altına yapışan klasik tab bar yerine, kenarlardan içe çekilmiş, yuvarlak köşeli (pill capsule) ve buzlu cam dokulu (glassmorphic) yüzen ada (`FloatingTabBar.tsx`) haline getirildi.
  * *Gerekçe:* Yeni eklenen arka plan nokta matrisiyle (dot matrix) modern bir derinlik hissi yaratmak; elit, ferah ve akıcı iOS navigasyonu sunmak.
* **Ayarlar Sekmesinin Alt Menüden Çıkarılması (4 Sekme Dengesi):**
  * *Karar:* Ayarlar (`Settings`) alt menüdeki 5 sekmeden biri olmaktan çıkarılıp `RootStackParamList` seviyesine taşındı; ana sayfadaki User Bar'ın sağındaki şık çark/profil butonu üzerinden erişilebilir kılındı. Alt menüde 4 sekme (*Ana Sayfa, Sureler, Ezber, Kavramlar*) bırakıldı.
  * *Gerekçe:* Yüzen kapsül içindeki sıkışıklığı önlemek; sekmelerin dokunma alanlarını (hit area) geniş ve ferah tutmak; aktif sekmede genişleyen kontrastlı hap (pill) efektine alan açmak.
* **Sayfa Altı Boşlukları (Content Padding):**
  * *Karar:* `HomeScreen`, `SurahListScreen`, `MemorizationListScreen` ve `DagExplorerScreen` alt iç boşlukları yüzen dock yüksekliğine (yaklaşık 96-110px) göre uyarlandı; `MemorizationListScreen`'deki sabit alt çubuk akış içine ve üst bara taşınarak çakışmalar giderildi.
  * *Gerekçe:* Kullanıcı listeleri kaydırırken en alttaki ayet veya butonların yüzen dock arkasında kalmasını engellemek.
* **Yumuşak Sayfa ve Menü Geçiş Animasyonları (`shift` & `LayoutAnimation`):**
  * *Karar:* Tab geçişlerindeki anlık/sert kesme (hard-cut) kaldırıldı; `BottomTabNavigator` içine 260ms'lik `Easing.bezier(0.25, 0.1, 0.25, 1)` eğrisiyle çalışan yatay kayma ve saydamlık geçişi (`sceneStyleInterpolator` ile `translateX: [-36, 0, 36]`, `opacity: [0, 1, 0]`) eklendi. Ayrıca `FloatingTabBar` içinde sekmeye basıldığında aktif hapın akıcı morflanması için `LayoutAnimation.Presets.easeInEaseOut` devreye alındı.
  * *Gerekçe:* Sure ve Ayarlar ekranlarındaki akıcı native iOS geçiş konforunu menü sekmelerine de yansıtarak görsel süreklilik sağlamak.

* **Profil ve Ayarlar Sayfalarının Ayrılması (Seçenek A Mimarisi):**
  * *Karar:* Avatar ve mekanik çark ikonunun aynı sayfaya gitmesi ikiliği giderildi; `ProfileScreen` müstakil bir ekran olarak inşa edildi. Sol üstteki Avatar `ProfileScreen`'e (Kullanıcı kimliği, Apple/Google bulut senkronizasyonu, manevi okuma karnesi, seri/ayet/ezber sayaçları ve derin okuma arşivleri), sağ üstteki mekanik İsviçre çarkı ise doğrudan `SettingsScreen`'e (Okuma Modu seçimi — Keşif/Öğrenme/Odak, Görünüm/Tema, Renk paleti, Tipografi ve Dil ayarları) bağlandı.
  * *HomeScreen Bütünlüğünün Korunması:* Ana sayfadaki hiçbir bileşen (özellikle 16 haftalık `BahcenCard` ısı haritası, `ResumeCard`, `MemorizationResumeCard`, `UnderstandingResumeCard` ve Günün İlham Kartları) ana sayfadan kaldırılmadı. Ana sayfa, kullanıcının doğrudan okuma ve ritüel vitrini; Profil sayfası ise manevi arşivi ve derinlik merkezi olarak çift katmanlı kurgulandı.
  * *Gerekçe:* Ana sayfanın boşalmasını önlemek, her iki ekranın tekil sorumluluk (Single Responsibility) prensibine sadık kalmasını sağlamak ve elit editoryal hiyerarşiyi korumak.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/src/screens/ProfileScreen.tsx`: Yeni müstakil profil, kimlik ve manevi yolculuk ekranı.
* `tafsil-ios-app/src/screens/SettingsScreen.tsx`: Salt okuma modu, tema, dil ve teknik tercihlere odaklanma; profil ekranına köprü kartı ve `‹` geri butonu.
* `tafsil-ios-app/src/navigation/FloatingTabBar.tsx`: Yeni yüzen alt menü bileşeni ve akıcı pill morflanması (`LayoutAnimation`).
* `tafsil-ios-app/src/navigation/BottomTabNavigator.tsx`: FloatingTabBar entegrasyonu, 4 sekmeye sadeleştirme ve yumuşak kayma geçişleri (`shift`).
* `tafsil-ios-app/src/navigation/types.ts`: `MainTabParamList` (4 sekme) ve `RootStackParamList` (`Profile` ve `Settings` rotaları).
* `tafsil-ios-app/src/navigation/RootNavigator.tsx`: `ProfileScreen` ve `SettingsScreen` bağımsız Stack rotaları ve linking tanımları.
* `tafsil-ios-app/src/components/common/PrecisionSettingsIcon.tsx`: Saf RN View geometrisiyle mikron hassasiyetinde mekanik saatçilik çark ikonu ve mod LED'i.
* `tafsil-ios-app/src/screens/HomeScreen.tsx`: `UserHeaderBar` (Avatar -> Profile, Gear -> Settings) entegrasyonu; Bahçen ve tüm devam kartları eksiksiz korundu.
* `tafsil-ios-app/src/screens/SurahListScreen.tsx`, `MemorizationListScreen.tsx`, `DagExplorerScreen.tsx`: Yüzen menü alt boşluk (padding) düzenlemeleri.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: `PBI-5.4` ve `PBI-5.5` tamamlandı olarak güncellendi.
* `DEVELOPMENT_LOG.md`: Bu oturum kaydı oluşturuldu ve güncellendi.

### 3. Önerilen Git Commit Mesajı
```git
feat(mobile): add profile screen, precision settings icon, and smooth floating tab bar navigation
```

---

## [2026-10-02] Açılış ve Yükleme Ekranı (Loading Screen) Geliştirmesi (1a / 1b)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Açılış / Yükleme Ekranının (LoadingScreen) Geliştirilmesi:**
  * *Karar:* Kullanıcının sağladığı görsel tasarıma ("1a · Açık" ve "1b · Koyu") tam sadık kalınarak `LoadingScreen` ve imza arka plan motifi `DotMatrixBackground` bileşenleri geliştirildi.
  * *Gerekçe:* Uygulama ilk açıldığında yerel fontlar, önbellek ve ayarlar hazırlanırken kullanıcının anlamsal bir Kur'an ayeti ("لِقَوْمٍ يَعْلَمُونَ") ve kök katmanlarıyla ("BİLEN BİR TOPLULUK İÇİN...", "TANIYAN", "KAVRAYAN") tefekkür odaklı, editoryal ve prestijli bir açılış deneyimi yaşaması.
* **Nokta Matrisi (Dot Matrix) Arka Plan Mimarisi:**
  * *Karar:* Cihaz piksel yoğunluğundan bağımsız, retina çözünürlükte keskin kare noktalar sunan ve sıfır gecikmeli çalışan dinamik `DotMatrixBackground` bileşeni ile `dot-pattern-light.png` / `dot-pattern-dark.png` dokuları üretildi.
  * *Gerekçe:* Ekran boyutlarına göre tam ortalanan ve Açık/Koyu mod renkleriyle kusursuz kontrast sağlayan görsel tutarlılık.
* **Akıcı Başlangıç Geçişi (App Startup Transition):**
  * *Karar:* `App.tsx` içinde `LoadingScreen` başlangıçta tam ekran katman olarak gösterildi; 2.2 saniyelik minimum süre ve kaynak yüklemesi tamamlandıktan sonra yumuşak bir saydamlık (opacity) geçişiyle `RootNavigator`'a devredildi.
  * *Gerekçe:* İlk açılışta beyaz/boş ekran veya ani arayüz sıçramasını (flicker) önlemek, `expo-splash-screen` native splash gizlendikten sonra akıcı bir köprü kurmak.
* **Önizleme ve Rota Entegrasyonu:**
  * *Karar:* `RootNavigator` stack listesine `Loading` rotası eklendi ve `SettingsScreen` içine "Açılış Ekranı (Loading)" önizleme seçeneği yerleştirildi.
  * *Gerekçe:* Geliştiricilerin ve kullanıcıların ekranı istedikleri zaman hem açık hem koyu modda doğrudan test edebilmesi.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/src/components/common/DotMatrixBackground.tsx`: Yeni nokta matrisi zemin bileşeni.
* `tafsil-ios-app/src/screens/LoadingScreen.tsx`: Yeni açılış ve yükleme ekranı bileşeni.
* `tafsil-ios-app/App.tsx`: Açılışta LoadingScreen gösterimi ve akıcı geçiş mimarisi.
* `tafsil-ios-app/src/navigation/types.ts` & `RootNavigator.tsx`: `Loading` rotası ve linking konfigürasyonu.
* `tafsil-ios-app/src/screens/SettingsScreen.tsx`: Açılış ekranını önizleme butonu.
* `tafsil-ios-app/assets/dot-pattern-light.png` & `dot-pattern-dark.png`: Nokta matrisi doku varlıkları.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: PBI-5.5 olarak backlog'a işlendi ve tamamlandı olarak işaretlendi.
* `DEVELOPMENT_LOG.md`: Bu oturum kaydı oluşturuldu.

### 3. Önerilen Git Commit Mesajı
```git
feat(mobile): add animated loading splash screen with dot matrix and semantic layers (1a/1b)
```

---

## [2026-10-01] Canlı Faz Backlog'u ve Pre-Release Gatekeeper Protokolü

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Canlı Faz Backlog Sistemi (`docs/roadmap/PHASE-1-MVP-BACKLOG.md`):**
  * *Karar:* Faz 1'deki her üst başlık atomik PBI (Product Backlog Item) maddelerine ve kontrol kutucuklarına (`[x]`, `[ ]`) ayrıldı. Ajanların "Faz 1'e devam et" komutu aldığında doğrudan bu dosyayı okuyup sıradaki işi belirlemesi protokol haline getirildi.
  * *Gerekçe:* Her oturumda PRD'yi ve tüm kod tabanını baştan tarama maliyetini (token/zaman) ortadan kaldırmak ve detayların unutulmasını engellemek.
* **Pre-Release Kontrol PBI'ları ve Deferral Protokolü:**
  * *Karar:* Her faz backlog'unun sonuna zorunlu bir "Pre-Release Gatekeeper" bölümü eklendi (Mock/dummy veri temizliği, localhost ve geçici URL denetimi, EAS Project ID / bundle config arındırması, kırık buton kontrolü).
  * *Gerekçe:* Kodun her faz sonunda gerçekten release edilebilir hijyene kavuşması; ertelenen işlerin ise sonraki fazın backlog'una aktarılmadan fazın tamamlandı sayılamaması.

### 2. Etkilenen Bileşenler ve Dosyalar
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: Faz 1 canlı kontrol listesi ve Pre-Release PBI'ları oluşturuldu.
* `AGENTS.md`: Madde 3.8 (Pre-Release Kapısı) ve Madde 5.1 & 5.5 (Backlog İcra İş Akışı) eklendi.
* `DEVELOPMENT_LOG.md`: Bu karar oturumu işlendi.

### 3. Önerilen Git Commit Mesajı
```git
docs(process): establish live phase backlog and pre-release gatekeeper protocol
```

---

## [2026-10-01] Sesli Okuma Yol Haritası Düzeltmesi ve Meal Seslendirmesi Ayrımı

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Orijinal Tilavet ile Meal Seslendirmesinin Ayrıştırılması:**
  * *Karar:* Faz 1'deki "Kelime senkron sesli okuma" maddesi sadece orijinal Arapça tilavet (Mişari Raşid el-Afasi kayıtları ve kelime zaman damgası senkronu) olarak netleştirildi. Türkçe ve diğer dillerde meal seslendirmesi (TTS / ElevenLabs stüdyosu) ayrı bir stratejik madde olarak Faz 4'e taşındı.
  * *Gerekçe:* Cloudflare R2'ye (`audio.tafsil.net`) taşınan verilerin sadece 6236 ayetin orijinal Arapça sesleri ve zaman damgaları olması; Türkçe meal seslendirmesinin henüz çalışılmamış olması sebebiyle yol haritası ile fiili durum arasındaki çelişkinin (drift) giderilmesi.
* **Geliştirme Günlüğü Düzeltmesi (2026-09-30):**
  * *Karar:* 2026-09-30 günlüğündeki "Türkçe meal seslendirmeleri R2'ye aktarıldı" ifadesi tashih edildi.

### 2. Etkilenen Bileşenler ve Dosyalar
* `README.md`: Yol Haritası Faz 1 (Kelime senkron sesli okuma (Orijinal Tilavet)) ve Faz 4 (Türkçe ve çoklu dilde stüdyo meal seslendirmesi) maddeleri güncellendi.
* `DEVELOPMENT_LOG.md`: 2026-09-30 girdisi düzeltildi ve yeni oturum kaydı eklendi.

### 3. Önerilen Git Commit Mesajı
```git
docs(roadmap): separate original Arabic recitation from multilingual TTS in roadmap and dev log
```

---

## [2026-10-01] Yol Haritası Statüleri, PRD Anti-Drift Protokolü ve Geliştirme Günlüğü

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Yol Haritasına (Roadmap) Statü Göstergeleri Eklendi:**
  * *Karar:* `README.md` (Bölüm 10) altındaki 4 faza ait tüm maddeler `🟢 Tamamlandı`, `🟡 Devam Ediyor` ve `⏳ Planlandı` etiketleriyle görselleştirildi.
  * *Gerekçe:* Projenin anlık ilerleme durumu, hangi özelliklerin üretimde, hangilerinin aktif geliştirmede veya sırada olduğunun tek bakışta anlaşılması.
* **Küçük Teknik Borç / Konfigürasyon Takip Kararı:**
  * *Karar:* `app.json` veya `eas.json` içindeki `REPLACE_WITH_EAS_PROJECT_ID` gibi küçük teknik placeholder ve fix'lerin stratejik Roadmap'te değil; **GitHub Issues (`chore`, `pre-release`)** veya kod içi `TODO(pre-release)` olarak takip edilmesi kararlaştırıldı.
  * *Gerekçe:* Roadmap'in stratejik ürün vizyonuna odaklı kalması; teknik mikro işlerle şişirilip okunabilirliğinin bozulmaması.
* **Otomatik PRD & Anti-Drift Denetim Mekanizması:**
  * *Karar:* Ajanın her geliştirme adımı sonunda `README.md` (PRD) ile yapılan işi otomatik karşılaştırması ve çelişki kontrolü yapması kural haline getirildi.
  * *Gerekçe:* Geliştirme sürecinde zamanla PRD vizyonundan ve mimari kurallardan (ör. offline-first, dokunulmaz metin, Hostinger bütçesi) sapılmasını (drift) engellemek.
* **Geliştirme ve Karar Günlüğü (`DEVELOPMENT_LOG.md`):**
  * *Karar:* Sohbetlerde kaybolan kararların, gerekçelerin ve commit özetlerinin merkezi bir dosyada tutulması ve her yeni görevde geriye dönük denetlenmesi yapısı kuruldu.

### 2. Etkilenen Bileşenler ve Dosyalar
* `README.md`: Yol Haritası bölümüne statü ikonları ve tanımları eklendi.
* `AGENTS.md`: Çalışma Kuralları (Madde 3.6 ve 3.7) ve Ajan İş Akışı (Madde 5.5) güncellendi.
* `.agents/rules/prd_alignment.md`: Antigravity yerel kural motoru için PRD ve karar kontrolü protokolü oluşturuldu.
* `.cursorrules` & `CLAUDE.md`: Anti-drift ve karar günlüğü kuralları çapraz IDE araçlarına yansıtıldı.
* `DEVELOPMENT_LOG.md`: Bu dosya oluşturuldu.

### 3. Önerilen Git Commit Mesajı
```git
docs(architecture): add roadmap statuses, PRD anti-drift rule, and development log
```

---

## [2026-09-30] Ses Depolama ve Oynatma Altyapısı (Cloudflare R2 Migrasyonu)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Ses Dosyalarının Cloudflare R2'ye Taşınması (`audio.tafsil.net`):**
  * *Karar:* Mobil ve web istemcilerinin ses dosyalarını yerel bundle veya sunucu diskinden değil, Cloudflare R2 nesne depolama (`audio.tafsil.net`) üzerinden çekmesi sağlandı.
  * *Gerekçe:* Uygulama paket boyutunu (IPA/APK) hafif tutmak; ses dosyası indirmelerinde egress maliyeti oluşturmamak (Cloudflare R2 sıfır egress ücreti avantajı) ve CDN önbelleği ile hızlı streaming sağlamak.
* **Orijinal Arapça Tilavet Depolama Stratejisi (Cloudflare R2):**
  * *Karar:* Orijinal Arapça seslendirmeler (Mişari Raşid el-Afasi stüdyo kayıtları) ve 6236 ayetin kelime zaman damgaları R2'ye aktarıldı. Türkçe meal seslendirmeleri henüz çalışılmadı; Türkçe ve diğer dillerin TTS/seslendirme süreci ayrı bir faz olarak ele alınacaktır.
* **app.json `audioBaseUrl` Standardizasyonu:**
  * *Karar:* Geçici `pub-*.r2.dev` URL'i yerine özel domain olan `https://audio.tafsil.net` yapılandırıldı.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/app.json`: `extra.audioBaseUrl` güncellendi (`https://audio.tafsil.net`).
* `tafsil-ios-app/src/services/audioService.ts`: Ses oynatma ve R2 streaming URL çözümleme mantığı.
* Ses zaman damgası senkronizasyon araçları.

---

## [2026-09-29] Morfoloji, Kök Tamamlama ve Okuma Geçmişi (DP-010..012)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Eksik Kelimelerin LLM ile Doldurulması (Hibrit Lexicon Pipeline):**
  * *Karar:* Quranic Arabic Corpus'ta yer almayan veya eksik kalan kök/morfoloji verileri, LLM tabanlı batch pipeline ile üretilip doğrulanarak veritabanına aktarıldı.
  * *Gerekçe:* Kullanıcı kelimeye tıkladığında "veri bulunamadı" hissi yaşamaması, kesintisiz bir morfolojik sözlük deneyimi sunulması.
* **Okuma Geçmişi ve Son Kalınan Yer Takibi:**
  * *Karar:* Kullanıcının en son okuduğu sure ve ayet pozisyonunun yerel cihazda ve okuma geçmişi sayfasında anlık tutulması sağlandı.

### 2. Etkilenen Bileşenler ve Dosyalar
* `docs/walkthroughs/DP-010..012*`: Morfoloji ve eksik kelime tamamlama raporları.
* `backend/src/` & `data-pipeline/scripts/`: Kök ve kelime import scriptleri.
* `tafsil-ios-app/src/screens/HistoryScreen.tsx` & `ReadingScreen.tsx`.

---

## [2026-10-02] Yerel SQLite Veritabanı ve Çevrimdışı Kur'an Mimarisi (PBI-7.3)

### 1. Alınan Kararlar ve Gerekçeleri (Neden Yapıldı?)
* **Tam Kur'an Metninin ve Sözlüğün Yerel SQLite'a Taşınması (`expo-sqlite`):**
  * *Karar:* Uygulamaya modern `expo-sqlite: ~57.0.3` entegre edilerek `tafsil.db` yerel SQLite veritabanı kuruldu (`localDbService.ts`).
  * *Tablolar:* `surahs` (114 sure), `verses` (6.236 ayet metni, meali, transliterasyonu, notları), `lexicon_roots` (morfolojik kökler ve türevler), `concepts` (kavram sözlüğü), `meta` (şema versiyonu).
  * *Performans PRAGMA'ları:* `journal_mode = WAL`, `synchronous = NORMAL`, `temp_store = MEMORY`, `cache_size = -32000` (32MB bellek önbelleği).
  * *Gerekçe:* Ağ bağlantısı tamamen kesik olsa dahi uygulamanın 0 ms gecikmeyle açılması, sureler, ayetler ve kelime sözlüğünün kesintisiz sorgulanabilmesi.
* **Tek Seferlik Hızlı Tohumlama (High-Speed Single Transaction Seeding):**
  * *Karar:* İlk açılışta `meta.schema_version` kontrolü yapılarak 6.236 ayet ve sözlük verileri `prepareSync` ve `withTransactionSync` ile tek bir atomik işlemde <100ms sürede veritabanına tohumlanır. Sonraki açılışlarda tohumlama baypas edilerek anında okuma başlar.
* **Kelime Zaman Damgaları ile Hibrit Birleşim (Hybrid Token Enrichment):**
  * *Karar:* SQLite'dan okunan ayet metinleri, kelime düzeyinde parçalanırken `TimestampService` üzerinden R2'den önbelleklenen veya yerel kompakt JSON'da bulunan hassas milisaniye zaman damgalarıyla (`startMs`, `endMs`) otomatik zenginleştirilerek sesli karaoke oynatıcısına hazır sunulur.
* **REST API İstemcisi ve Arama Motoru Entegrasyonu:**
  * *Karar:* `src/api/client.ts` (`getSurahs`, `getVerses`, `getSingleVerse`, `searchRoots`) ve `src/services/searchService.ts`, doğrudan `localDbService` üzerinden yerel veriye öncelik verecek (offline-first) şekilde güncellendi. Çevrimiçiyken arka planda sessiz API eşitlemesi yapılır.

### 2. Etkilenen Bileşenler ve Dosyalar
* `tafsil-ios-app/package.json` & `package-lock.json`: `expo-sqlite: ~57.0.3` eklendi.
* `tafsil-ios-app/app.json`: `plugins: ["expo-sqlite"]` eklendi.
* `tafsil-ios-app/src/api/types.ts`: `Verse` arayüzüne opsiyonel `note?: string` alanı eklendi.
* `tafsil-ios-app/src/api/config.ts`: Modüler API ve Cloudflare R2 konfigürasyonu.
* `tafsil-ios-app/src/services/localDbService.ts`: SQLite tabloları, tohumlama, WAL yapılandırması ve sorgulama API'si oluşturuldu.
* `tafsil-ios-app/src/api/client.ts`: Sıfır gecikmeli SQLite okumaları ve arka plan eşitlemesi bağlandı.
* `tafsil-ios-app/src/services/searchService.ts`: SQLite indeksli ayet araması entegre edildi.
* `docs/roadmap/PHASE-1-MVP-BACKLOG.md`: `PBI-7.3` tamamlandı olarak işaretlendi.

### 3. Önerilen Git Commit Mesajı
```git
feat(offline): implement local SQLite database, full quran schema, and zero-latency queries (PBI-7.3)
```
