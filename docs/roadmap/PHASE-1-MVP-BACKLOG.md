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

---

## 7. Çevrimdışı Okuma Altyapısı (Offline-First)
- [x] **PBI-7.1:** Ayetler, sureler ve kelime zaman damgaları için yerel snapshot JSON desteği (`ayetlerSnapshot`, `word_timestamps.compact.json`).
- [x] **PBI-7.3 (Yerel SQLite / WatermelonDB):** Tam Kur'an metninin, meallerin ve sözlüğün yerel SQLite tablosuna taşınması; ağ yokken sıfır gecikmeli sorgulama (`localDbService.ts`, `client.ts`, `searchService.ts`, `expo-sqlite`).

---

## 8. Faz 1 Pre-Release Kontrol & Arındırma (Release Gatekeeper)
*Bu bölüm, Faz 1 tamamlandı denilip mağazaya (App Store TestFlight) veya kullanıcı testine çıkmadan önce zorunlu olarak çalıştırılacak denetim PBI'larıdır.*

- [ ] **PBI-8.1 (Mock / Dummy Veri Arındırması):**
  - `src/api/mock/verses.mock.ts` ve `surahs.mock.ts` bağımlılıklarının canlı API / yerel SQLite veritabanına bağlanması.
  - `useAuthStore` veya `auth.ts` içindeki sahte token (`mock_jwt_token_123`) ve test kullanıcılarının prodüksiyon kodundan temizlenmesi veya sadece `__DEV__` guard'ına alınması.
- [ ] **PBI-8.2 (Geçici Yerel Referans & URL Denetimi):**
  - Kod genelinde `localhost`, `127.0.0.1`, `http://10.0.2.2` veya geçici IP referanslarının taranması; tüm ağ isteklerinin `.env` ve `app.json` üzerindeki `EXPO_PUBLIC_API_URL` ve `https://audio.tafsil.net` standartlarına bağlanması.
- [ ] **PBI-8.3 (Konfigürasyon & EAS Temizliği):**
  - `app.json` ve `eas.json` içindeki `REPLACE_WITH_EAS_PROJECT_ID` placeholder'ının gerçek Expo Project ID ile güncellenmesi.
  - Bundle ID (`net.tafsil.app`), App Store Category ve kamera/mikrofon izin metinlerinin (`Info.plist` strings) App Store standartlarına getirilmesi.
- [ ] **PBI-8.4 (Kırık Bağlantı & Ucu Açık Bileşenler):**
  - Faz 1 ekranlarında (Ana Sayfa, Okuma, Sure Listesi, Arama, Ayarlar) tıklanıp hiçbir şey yapmayan veya çöken "dummy" butonların taranması (ör. Henüz hazır olmayan Faz 2/3 özellikleri için zarif "Çok Yakında" bilgilendirmesi eklenmesi).
- [ ] **PBI-8.5 (Sonraki Faza Aktarım / Deferral Protocol):**
  - Faz 1 için planlanıp bilinçli olarak Faz 2'ye ertelenen herhangi bir mock veya özellik varsa; bunların gerekçesiyle birlikte `docs/roadmap/PHASE-2-BACKLOG.md` (veya `DEVELOPMENT_LOG.md`) kontrol listesine **yeni PBI olarak eklenmesi** ve Faz 1 listesinden düşülmesi.
