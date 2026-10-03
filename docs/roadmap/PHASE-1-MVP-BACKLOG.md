# Faz 1 — Temel Okuma Deneyimi (MVP) — Canlı Geliştirme Backlog'u

Bu belge, **tafsil.net** Faz 1 (MVP) kapsamındaki tüm teknik ve fonksiyonel gereksinimlerin atomik düzeyde takip edildiği **canlı operasyonel backlog (iş listesi)** belgesidir.

> **Ajanlar İçin Protokol:**
> 1. Kullanıcı *"Faz 1'e devam et"*, *"Sıradaki işi yap"* veya benzeri bir komut verdiğinde; ajan README'yi baştan taramak yerine doğrudan bu belgeyi açar.
> 2. Tamamlanmamış (`[ ]`) ilk görevi belirler, kullanıcıya *"Sıradaki görev: [PBI Adı], başlıyorum"* mesajı verir.
> 3. İşi tamamlayıp test ettikten sonra bu belgedeki ilgili kutuyu `[x]` olarak işaretler ve `DEVELOPMENT_LOG.md` dosyasına oturum özeti düşer.
> 4. Faz tamamlanırken **Bölüm 8'deki Pre-Release Kontrol Listesi** mutlaka işletilmelidir!

---

## 1. Kur'an Okuma Ekranı (Mushaf & Akış)
- [x] **PBI-1.1:** Mushaf sırası (1-114) ve ayet blokları gösterimi (`ReadingScreen.tsx`).
- [x] **PBI-1.2:** Varsayılan meal, transliterasyon ve Arapça Uthmani metin hiyerarşisi.
- [x] **PBI-1.3:** Uzun ayetler için lazy load / sanallaştırılmış liste optimizasyonu (`FlashList` / `FlatList`).
- [x] **PBI-1.4:** Ayet yer imleri (Bookmark) ve not ekleme arayüzü (`OfflineSyncService`).
- [x] **PBI-1.5:** Okuma ekranı tipografi ve görsel ayar çekmecesi (Font boyutu, satır aralığı, meal gizleme toggle'ı).

---

## 2. Kelime Senkron Sesli Okuma (Orijinal Tilavet)
- [x] **PBI-2.1:** 114 sure / 6236 ayetin orijinal Mişari Raşid el-Afasi ses dosyalarının Cloudflare R2'ye taşınması (`https://audio.tafsil.net`).
- [x] **PBI-2.2:** 6236 ayetin kelime başlangıç (`startMs`) ve bitiş (`endMs`) zaman damgalarının çıkarılması ve R2'ye yüklenmesi.
- [x] **PBI-2.3:** Mobil ses oynatma servisi (`audioPlayerService.ts` - `expo-audio`).
- [x] **PBI-2.4:** Ses çalarken aktif kelimenin karaoke tarzı belirginleştirilmesi (Word Highlight).
- [x] **PBI-2.5:** Oynatma hızı seçimi (1.0x, 1.25x, 1.5x) ve alt oynatıcı barı (`AudioPlaybackBar.tsx`).
- [x] **PBI-2.6:** Ayetler ve sureler arası otomatik kesintisiz geçiş ve stall recovery mekanizması.
- [x] **PBI-2.7 (Kelimeye Dokunarak Sarma):** Ses çalarken veya duraklatılmışken metindeki bir kelimeye dokunulduğunda sesin doğrudan o kelimenin `startMs` süresine atlaması (Seek-on-Word-Click).
- [x] **PBI-2.8 (iOS Arka Plan & Kilit Ekranı):** `MPNowPlayingInfoCenter` ve `MPRemoteCommandCenter` ile ekran kapalıyken kilit ekranında sure/ayet adının görünmesi, oynat/durdur/ileri/geri kontrollerinin çalışması.
- [x] **PBI-2.9 (Odak Modu Tilaveti):** Odak modunda görsel unsurların gizlenip sadece tilavet odaklı akışın sunulması (Audio-only deneyimi).
- [x] **PBI-2.10 (Çevrimdışı Ses Önbelleği):** Kullanıcının seçilen sureyi internetsiz dinlemek üzere tek tuşla cihaz belleğine indirebilmesi (`FileSystem` cache).

---

## 3. Kapsamlı Kelime Sözlüğü & Morfoloji
- [x] **PBI-3.1:** Kelimeye dokunulduğunda açılan alt özet çekmecesi (Word Bottom Sheet).
- [x] **PBI-3.2:** Kelime kök (root), lemma ve vezin bilgilerinin backend'den çekilmesi.
- [x] **PBI-3.3:** Corpus'ta eksik olan köklerin LLM pipeline ile tamamlanması ve DB'ye işlenmesi (DP-010..012).
- [x] **PBI-3.4:** Kelime detay sayfası rotası ve kökün Kur'an'daki diğer kullanımlarının listelenmesi.

---

## 4. Kullanıcı Kayıt ve Kimlik Doğrulama (Auth)
- [x] **PBI-4.1:** Apple Sign-In istemci arayüzü ve akışı.
- [x] **PBI-4.2:** Google Sign-In istemci arayüzü ve akışı.
- [x] **PBI-4.3:** Zustand tabanlı kimlik durum yönetimi (`useAuthStore.ts`).
- [x] **PBI-4.4 (Backend JWT Entegrasyonu):** Mobil istemciden gelen Apple/Google kimlik belirteçlerinin (Identity Token) Fastify backend'de doğrulanması ve oturum JWT'si üretimi.
- [x] **PBI-4.5 (Misafir / Anonim Mod):** Giriş yapmadan da okuma ve yerel kayıt imkanı, sonradan hesaba bağlama (Account Linking).
- [x] **PBI-4.6 (Büyük Güvenlik, DB Şeması & Kimlik Sertleştirmesi — Major Security & Architecture Hardening):**
  - [x] **PBI-4.6.1 (Sabit UUID & Yetki Açığı Temizliği):**
    - `backend/src/modules/admin/routes.ts` içindeki `DEFAULT_ADMIN_ID` (`ffffffff-...`) fallback'i kaldırıldı; tüm admin rotalarına Fastify JWT doğrulaması ve `role === 'admin'` RBAC denetimi (`authorizeAdmin`) zorunlu kılındı.
    - `community` ve `understanding` servislerindeki `00000000-0000-0000-0000-000000000001` sabit ID'si kaldırıldı; anonim işlemler ve beğeniler dinamik/izole kimliklere bağlandı.
  - [x] **PBI-4.6.2 (Kullanıcı Tablosu & Profil Alanları — `name` & `email`):**
    - `kullanicilar` tablosuna `name VARCHAR(128)`, `email VARCHAR(255)` ve `password_hash VARCHAR(255)` sütunlarını ekleyen `008_profile_subscriptions_security.sql` migration'ı Hostinger canlı DB'ye uygulandı.
    - Apple ve Google Sign-In başarılı olduğunda token/payload'dan gelen gerçek kullanıcı adı ve e-posta adresi DB'ye kaydedildi.
    - Mobil arayüzde (`HomeScreen`, `ProfileScreen`, `SettingsScreen`) hardcoded `'Alper'` ismi temizlendi; dinamik isim ve editoryal fallback'lere bağlandı.
  - [x] **PBI-4.6.3 (Abonelik & Premium Mimarisi Ayrımı):**
    - `kullanicilar.is_premium` doğrudan manipülasyonu yerine, App Store (StoreKit 2) ve Google Play aboneliklerini takip eden `abonelikler` (`subscriptions`) tablosu Hostinger DB'de modellendi.
    - `backend/src/modules/subscriptions/` servisi ve endpoint'leri (`/status`, `/verify`, `/sync`) ile `is_premium` değeri gerçek abonelik durumuna göre türetilen bir read-cache bayrağına dönüştürüldü.
  - [x] **PBI-4.6.4 (Şifre Sıfırlama & E-posta Yaşam Döngüsü Sözleşmesi):**
    - `sifre_sifirlama_talepleri` tablosu modellendi. Kriptografik SHA-256 token üretimi, 15 dakika TTL ve `POST /auth/forgot-password` ile `POST /auth/reset-password` uçları canlıya alındı.
- [x] **PBI-4.7 (Çoklu Hesap / Hesap Değişimi Oturum İzolasyonu & Senkronizasyon Veri Sızıntısı Koruması):**
  - Çıkış yapıldığında oturumun temiz sıfırlanması (`user: null`, `token: null`, `isAuthenticated: false`), `signInWithGoogle` ile `linkAccount` ayrımı.
  - Backend `getEffectiveUserId` içindeki `created_at DESC LIMIT 1` rastgele kullanıcıya bağlanma riskinin kaldırılması.
  - `/api/v1/auth/link` ve `linkGuestUser` içindeki UUID doğrulama hatası ve Postgres hatasının giderilmesi.
  - Mobil modal e-posta girişinde hardcoded e-postanın kaldırılarak doğrulama eklenmesi.

---

## 5. Onboarding ve Mod Seçimi (Keşif / Öğrenme / Odak)
- [x] **PBI-5.1:** Mod seçim tasarımı ve arayüz kartları (`Tafsil.dc.html` referansı).
- [x] **PBI-5.2:** `useReadingMode` hook'u ile mod dinamiklerinin tanımlanması.
- [x] **PBI-5.3 (İlk Açılış Onboarding Akışı):** Uygulama ilk kez yüklendiğinde kullanıcının niyetine göre mod seçtiren 3 adımlı onboarding ekranlarının bağlanması (`OnboardingScreen.tsx`, `useUserSettingsStore.ts`, `RootNavigator.tsx`, `SettingsScreen.tsx`).
- [x] **PBI-5.4 (Profil/Ayarlardan Mod Değiştirme):** Kullanıcının dilediği zaman ayarlar sayfasından modu değiştirebilmesi ve arayüzün anlık uyarlanması (`SettingsScreen.tsx`).
- [x] **PBI-5.5 (Açılış ve Yükleme Ekranı — Splash / Loading):** `tafsil.` editoryal logosu, nokta matrisi (dot matrix) zemin, "لِقَوْمٍ يَعْلَمُونَ" hat metni, katmanlı kök anlamları ("BİLEN BİR TOPLULUK İÇİN...", "TANIYAN", "KAVRAYAN") ve 3'lü kare durum indikatörüyle 1a (Açık) ve 1b (Koyu) açılış deneyimi (`LoadingScreen.tsx`).

---

## 6. Sure İlerleme Matrisi (Okuduklarım)
- [x] **PBI-6.1:** 114 surenin tamamını gösteren interaktif ızgara matrisi (`SurahGridMatrix.tsx`).
- [x] **PBI-6.2:** Son okunan sure/ayet konumunun yerel cihazda saklanması ve kaldığı yerden devam etme kısayolu.
- [x] **PBI-6.3:** Okuma geçmişi sayfası (`HistoryScreen.tsx`).
- [x] **PBI-6.4 (Okuma Tamamlama Mantığı):** Sure son ayetine ulaşıldığında surenin "Okundu" olarak işaretlenmesi ve yüzde hesaplaması (`useReadingProgressStore.ts`, `ReadingScreen.tsx`, `SurahGridMatrix.tsx`, `SurahListScreen.tsx`).
- [x] **PBI-6.5 (Çoklu Cihaz İstatistik Senkronizasyonu & Tutarlılığı):** Farklı cihazlardan aynı hesapla girişte `streak` deterministik hesaplaması, `forceFullSync` mimarisi, sahte `INITIAL_SESSIONS` arındırması ve `clearAllLocalUserData()` ile profil metriklerinin eşitlenmesi (`useReadingProgressStore.ts`, `useMemorizationStore.ts`, `offlineSyncService.ts`, `useAuthStore.ts`, Fastify sync rotaları).
- [x] **PBI-6.6 (Okuma & Kavram Geçmişi Tekilleştirme & Idempotent Senkronizasyon):** İstemcide çift tetikleme (`lastRecordedVerseRef`), ardışık dokunma throttling'i (30 sn), istemci UUID üretimi; sunucuda `ON CONFLICT` ile idempotent upsert ve PostgreSQL seviyesinde `uq_okuma_gecmisi_user_verse_date` / `uq_kavram_gecmisi_user_slug_date` unique index güvencesi (`ReadingScreen.tsx`, `offlineSyncService.ts`, `sync.ts`, `service.ts`, `dto.ts`, migration `009`).

---

## 7. Çevrimdışı Okuma Altyapısı (Offline-First)
- [x] **PBI-7.1:** Ayetler, sureler ve kelime zaman damgaları için yerel snapshot JSON desteği (`ayetlerSnapshot`, `word_timestamps.compact.json`).
- [x] **PBI-7.3 (Yerel SQLite / WatermelonDB):** Tam Kur'an metninin, meallerin ve sözlüğün yerel SQLite tablosuna taşınması; ağ yokken sıfır gecikmeli sorgulama (`localDbService.ts`, `client.ts`, `searchService.ts`, `expo-sqlite`).
- [x] **PBI-7.4 (Sistem Geneli Fallback Matrisi, Çevrimdışı Dayanıklılık Denetimi ve Dokümantasyonu):**
  - **Veri Katmanı Fallback Zinciri:** Ayet/Sure (API → SQLite → Snapshot JSON → Boş dizi), Sözlük (API → SQLite/MMKV → Küratörlü Tohum → Algoritmik Üretim), Kavram (API → MMKV → Tohum Sözlük), Ses/Zaman Damgası (Cloudflare R2 CDN → Yerel MP3 / Snapshot JSON).
  - **Kimlik & Ağ Çözümleme Fallback Zinciri:** `EXPO_PUBLIC_API_URL` → `extra.apiUrl` → Emülatör tespiti (Android `10.0.2.2`, iOS/Web `localhost`) → Fiziksel cihaz LAN IP (`hostUri`). Dev modunda tek parçalı token'ların sunucu geldiğinde otomatik 3 parçalı JWT'ye yükseltilmesi (Auto-Upgrade).
  - **Senkronizasyon & Tanılama Fallback Zinciri:** Sunucu yokken veya misafir modunda yerel SQLite/MMKV ilerlemesinin taranıp anında mağazaya (`useReadingProgressStore`) aktarılması (`reloadLocalProgressToStore`); tanılama raporlarında API → e-posta eki → sistem paylaşım sayfası köprüsü.

---

## 8. Faz 1 Pre-Release Kontrol & Arındırma (Release Gatekeeper)
*Bu bölüm, Faz 1 tamamlandı denilip mağazaya (App Store TestFlight) veya kullanıcı testine çıkmadan önce zorunlu olarak çalıştırılacak denetim PBI'larıdır.*

- [x] **PBI-8.1 (Mock / Dummy Veri Arındırması):**
  - `src/api/mock/surahs.mock.ts` → `src/data/surahs.seed.ts` olarak taşındı, `mockSurahs` → `SURAH_SEED_DATA` yeniden adlandırıldı.
  - `src/api/mock/verses.mock.ts` bağımlılıkları kaldırıldı, tüm fallback'ler SQLite → snapshot → `[]` zinciri olarak standardize edildi.
  - `useAuthStore` ve `auth.ts` içindeki sahte token fallback'leri `__DEV__` guard'ına alındı; prodüksiyonda `{ success: false }` döner.
- [x] **PBI-8.2 (Geçici Yerel Referans & URL Denetimi):**
  - `lexiconEnrichmentService.ts`, `lexiconCacheService.ts` ve `HomeScreen.tsx` içindeki hardcoded `localhost:3001` referansları merkezi `API_BASE` import'u ile değiştirildi.
- [x] **PBI-8.3 (Konfigürasyon & EAS Temizliği):**
  - `app.json` içine `apiUrl` (`https://api.tafsil.net/api/v1`) ve `NSMicrophoneUsageDescription` eklendi.
  - `REPLACE_WITH_EAS_PROJECT_ID` ve `eas.json` submit placeholder'ları Faz 2 backlog'una (`PBI-D.1`, `PBI-D.2`) aktarıldı (Apple Developer hesap bilgileri gerekli).
- [x] **PBI-8.4 (Kırık Bağlantı & Ucu Açık Bileşenler):**
  - Faz 1 ekranlarında boş `onPress` handler, "Coming Soon" kalıntısı ve TODO bulunamadı — temiz.
- [x] **PBI-8.5 (Sonraki Faza Aktarım / Deferral Protocol):**
  - Faz 1'den bilinçli olarak ertelenen maddeler (EAS Project ID, Apple submit bilgileri, mock dosya tam silimi, Türkçe meal seslendirmesi, Reveal-on-Recite STT, Web App Portal, Agentic RAG, DAG görselleştirme) `docs/roadmap/PHASE-2-BACKLOG.md` dosyasına aktarıldı.

---

## 9. TestFlight Friends & Family Release Gate
*2026-10-03 tarihli uçtan uca pre-release denetiminde (uygulama + backend + canlı altyapı) tespit edilen, TestFlight harici test gönderimini bloke eden maddeler. Kararlar: Google girişi F&F build'inde gizlenir (gerçek entegrasyon Faz 2), hesap silme App Store public sürümüne ertelenir.*

### 9A. Kod Düzeltmeleri (Ajan)
- [x] **PBI-9.1 (Sync IDOR Kapatma):** `/sync/*` uçları zorunlu JWT (`app.authenticate`) arkasına alınır; body/query `user_id` ve e-posta ile kullanıcı çözümleme kaldırılır, yalnızca `request.user.sub` kullanılır.
  - `sync/routes.ts` 5 uç `preHandler: authenticate`; `SyncService.getEffectiveUserId` yalnızca UUID doğrular. İstemci `user_id` göndermeyi bıraktı. Fastify inject smoke test 7/7 PASS.
- [x] **PBI-9.2 (Prod Auth Sertleştirme):** `google-dev-*`, `apple-dev-*`, `mock-*` token bypass'ları `NODE_ENV !== 'production'` ile sınırlanır; prodüksiyonda `JWT_SECRET` tanımsız/varsayılansa sunucu başlatılmaz.
  - `config.auth.allowDevTokens` bayrağı; `CHANGE_ME*`, varsayılan veya <32 karakter secret prod'da reddedilir. Yerel `backend/.env` `NODE_ENV=development` yapıldı.
- [x] **PBI-9.3 (Google Girişini Gizleme):** E-posta yazdırılan sahte Google modali prod build'de gizlenir (`__DEV__` guard); F&F sürümü Apple + Misafir ile çıkar.
  - `FEATURES.googleSignIn` (`config.ts`) — UI + store çift katmanlı guard. Gerçek entegrasyon Faz 2 `PBI-AUTH.1`.
- [x] **PBI-9.4 (app.json App Store Uyum Ayarları):** `usesNonExemptEncryption: false`, `privacyManifests` (Required Reason API), `supportsTablet: false`, kullanılmayan mikrofon izninin kaldırılması, şema dışı `newArchEnabled` anahtarının silinmesi, Expo patch sürüm güncellemeleri.
  - Revizyon: Mikrofon metni **korundu** ve `expo-audio` eklentisine taşındı — binary kayıt API'leri içerdiğinden kaldırılması ITMS-90683 reddine yol açar. `expo-doctor` 21/21.
- [x] **PBI-9.5 (API URL Öncelik Zinciri):** `EXPO_PUBLIC_API_URL` → (prod'da) `extra.apiUrl` → yerel IP sırası; `eas.json` env adlarının `EXPO_PUBLIC_*` olarak düzeltilmesi.
  - Staging DNS olmadığından `preview` profili geçici olarak prod API'ye yönlendirildi (Faz 2 `PBI-D.4`).
- [x] **PBI-9.6 (Oturum Süresi & 401 Yönetimi):** Beta için uzun ömürlü JWT ve istemcide 401 alındığında oturumun kontrollü sonlandırılması.
  - JWT varsayılanı 90gün; 401'de `sessionExpired` bayrağı (yerel veri silinmez) + Ayarlar'da yeniden giriş uyarısı; yerel/dev token'larla ağa çıkılmaz.
- [x] **PBI-9.7 (Orphan Mock Temizliği & Gizlilik Linki):** `src/api/mock/*` dosyalarının silinmesi (Faz 2 PBI-D.3 öne çekildi); Ayarlar ekranına Gizlilik Politikası bağlantısı.
  - Ayarlar > Hakkında: Gizlilik Politikası, Geri Bildirim (mailto, sürüm/build bilgili), sürüm etiketi. Önizleme (Onboarding/Loading) kısayolları `__DEV__`'e alındı.

- [x] **PBI-9.8 (Backend Canlı Dağıtım):** Backend VPS'e dağıtıldı, PM2 cluster modunda (2 worker) systemd servisi olarak ayağa kaldırıldı, Nginx reverse proxy ve rate-limiting yapılandırıldı, yerel ve dış ağ SSL health check (`{"postgres":true,"redis":true}`) ve sureler API'si doğrulandı (PASS). Cloudflare DNS A kaydı (`api.tafsil.net` → `76.13.60.86`) adımı tamamlandı.
- [ ] **PBI-9.9 (Veritabanı Güvenliği):** VPS firewall ile 5432/6379 portlarının dışarıya kapatılması, DB parolasının rotasyonu, `DEVELOPMENT_LOG.md` içindeki parola sızıntısının temizlenmesi.
  - ✅ Log'daki parola maskelendi (ajan). ⏳ Firewall + parola rotasyonu (kullanıcı) — parola git geçmişinde kalmaya devam ettiğinden rotasyon zorunlu.
- [ ] **PBI-9.10 (EAS & App Store Connect):** `eas init` (Faz 2 PBI-D.1), ASC'de `net.tafsil.app` uygulama kaydı ve `eas.json` submit bilgileri (Faz 2 PBI-D.2).
- [ ] **PBI-9.11 (ASC Test Bilgileri):** Gizlilik politikası sayfasının yayını (`tafsil.net/gizlilik`), Beta açıklaması, geri bildirim e-postası, inceleme notu (Misafir modu), App Privacy etiketleri.

---

## 10. Veri Akışı İzleme & Tanılama (Diagnostics)
*2026-10-03 — Geliştirme/test sürecinde veri hareketlerini katman bazında izlemek ve kullanıcıların sorun anında tanılama verisi paylaşabilmesi için eklendi.*

- [x] **PBI-10.1 (Veri Hareketi İzleyicisi & Tanılama Ekranı):** Katman etiketli halka tampon (`dataFlowMonitor`), global `fetch` gözlemcisi, `expo-network` + `/health` bağlantı izleyicisi, L1–L5 enstrümantasyonu; Ayarlar › "Veri Akışı & Tanılama" ekranı (`tafsil://tanilama`).
  - Bağlantı durumu, senkron sonucu + yerel↔sunucu karşılaştırması, katman haritası (isabet oranı), filtrelenebilir canlı olay akışı, yerel depolama envanteri (KV/SQLite/Snapshot/Ses + disk).
- [x] **PBI-10.2 (Tanılama Raporu & E-posta Paylaşımı):** Gizlilik filtreli JSON rapor; `expo-mail-composer` ile ekli e-posta (Mail yoksa paylaşım sayfası).
- [x] **PBI-10.3 (Sunucu Karşılığı):** `010_client_diagnostics.sql` (`istemci_tanilama_raporlari`, `istemci_veri_hareketleri`), `POST /api/v1/diagnostics/reports` (isteğe bağlı JWT, 6 istek/10 dk), kullanıcı listesi ve yönetici uçları. Canlı DB'ye uygulandı, inject smoke test PASS.
- [ ] **PBI-10.4 (Yeni Native Build — Kullanıcı):** `expo-network` ve `expo-mail-composer` native modül eklediğinden mevcut dev client / TestFlight build'i yeniden alınmalı (`eas build`). ASC App Privacy etiketine "Diagnostics › Other Diagnostic Data" eklenmeli (PBI-9.11 ile birlikte).

