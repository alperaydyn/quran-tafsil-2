# tafsil.net — Geliştirme, Mimari Kararlar ve Değişiklik Günlüğü (DEVELOPMENT_LOG.md)

Bu dosya, projede gerçekleştirilen her geliştirme oturumunda **alınan mimari kararları, bunların gerekçelerini (neden yapıldığını), etkilenen bileşenleri ve commit özetlerini** kronolojik olarak kayıt altına alan **canlı proje hafızasıdır**.

> **Ajanlar ve Geliştiriciler İçin Kural:**
> Her yeni geliştirme adımına başlarken bu dosya mutlaka taranmalı; yeni bir özellik tasarlanırken **geçmiş kararlarla çelişki olup olmadığı** denetlenmelidir. Geliştirme tamamlandığında ise oturumun özeti ve gerekçeleri bu dosyaya yeni bir başlık olarak eklenmelidir.

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
