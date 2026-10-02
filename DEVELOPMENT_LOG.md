# tafsil.net — Geliştirme, Mimari Kararlar ve Değişiklik Günlüğü (DEVELOPMENT_LOG.md)

Bu dosya, projede gerçekleştirilen her geliştirme oturumunda **alınan mimari kararları, bunların gerekçelerini (neden yapıldığını), etkilenen bileşenleri ve commit özetlerini** kronolojik olarak kayıt altına alan **canlı proje hafızasıdır**.

> **Ajanlar ve Geliştiriciler İçin Kural:**
> Her yeni geliştirme adımına başlarken bu dosya mutlaka taranmalı; yeni bir özellik tasarlanırken **geçmiş kararlarla çelişki olup olmadığı** denetlenmelidir. Geliştirme tamamlandığında ise oturumun özeti ve gerekçeleri bu dosyaya yeni bir başlık olarak eklenmelidir.

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
  * `backend/.env` ve `backend/src/config/env.ts` Hostinger bağlantı adresine (`postgres://tafsil_user_001:tafsil_user_x23@76.13.60.86:5432/tafsil_net_db`) geçirildi.
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
