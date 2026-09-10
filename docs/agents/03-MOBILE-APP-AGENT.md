# 03: Mobile App Development Agent Specification (iOS / Android)

Bu belge, **tafsil.net** mobil uygulamasının (React Native / Expo) tasarım doğruluğu, arayüz modları, çevrimdışı veri senkronizasyonu, senkron sesli okuma ve etkileşimli ezber stüdyosundan sorumlu **Mobil Ajan** için teknik şartnamedir.

---

## 1. Temel Teknoloji Yığını ve Tasarım Doğruluğu

- **Çerçeve:** React Native + Expo (Managed Workflow, Prebuild uyumlu).
- **Hedef Platform:** iOS Öncelikli (App Store standartları, HIG uyumu), ikincil Android (Google Play).
- **Tasarım Kaynağı (Source of Truth):**
  - Tüm renkler, editoryal tipografi, boşluklar (spacing) ve bileşen hiyerarşisi için [tafsil-ios-app/design/project/Tafsil.dc.html](file:///Users/alperaydin/Projects/kuran-tafsil-net/tafsil-ios-app/design/project/Tafsil.dc.html) dosyasını kaynak alınız.
  - Tasarımda klişe dini motifler yerine modern, ferah, minimalist ve editoryal bir estetik esastır.
- **Durum Yönetimi ve Depolama:**
  - Zustand (hafif ve modüler UI state).
  - react-native-mmkv (hızlı kalıcı anahtar-değer depolama).
  - WatermelonDB veya yerel SQLite (tam Kur'an metni ve çevrimdışı veri tabanı).

---

## 2. 3 Dinamik Arayüz Modu

Kullanıcının onboarding sırasında seçtiği ve ayarlardan değiştirebildiği 3 mod:

| Özellik | Keşif Modu | Öğrenme Modu | Odak Modu |
|---|---|---|---|
| **Arapça Mushaf Metni** | İsteğe bağlı / Varsayılan gizli | Açık (Transliterasyon ile) | Merkezde (Büyük Uthmani hattı) |
| **Türkçe Meal & Tefsir** | Birincil odak | Dengeli | İkincil / Minimal |
| **Oyunlaştırma & Streak** | Tamamen kapalı | Açık (Isı haritası, rozetler) | Tamamen kapalı |
| **Ezber Yönlendirmeleri** | Gizli | Açık (Aralıklı tekrar uyarıları)| Gizli |
| **Ses Önceliği** | Türkçe sesli meal | Çift dilli (Arapça + Türkçe) | Arapça tilavet (Audio-only modu) |

---

## 3. Temel Ekranlar ve Bileşen Mimarisi

### A. Dinamik Dashboard (`/screens/HomeScreen.tsx`)
- **Okuma ve Tefekkür Bahçesi:** Kullanıcının okuma sıklığını gösteren modern ısı haritası matrisi.
- **Akıllı Devam Kısayolları (Smart Resume):**
  - "Kaldığım Yerden Devam Et" (son okunan ayete doğrudan geçiş)
  - "Ezberlemeye Devam Et" (günün tekrar kartlarını başlatma)
  - "En Son Anlama Oturumuna Dön" (yüzen buton / breadcrumb desteğiyle)
- **Günün İlham Kartları:** Günün Ayeti, Günün Kur'an Duası, Günün Namaz Ayeti.

### B. Okuma Akışı ve Senkron Sesli Okuma (`/screens/ReadingScreen.tsx`)
- **Kelime Seviyesinde Senkron Vurgulama (Karaoke Highlight):**
  - `expo-av` veya `react-native-track-player` ile ses çalarken o anki milisaniye (`position_ms`) izlenir.
  - `start_ms <= position_ms <= end_ms` aralığındaki kelime anlık olarak belirginleştirilir (accent background / color shift).
  - Kelimeye tıklandığında ses akışı ilgili kelimenin `start_ms` konumuna atlar.
- **Kelime Özet Çekmecesi (Word Bottom Sheet):** Kelimeye uzun basıldığında veya tıklandığında akışı kesmeyen hafif alt panel açılır; kök, sözlük meali ve "Detay Sayfasına Git" butonu sunulur.

### C. Etkileşimli Ezber Stüdyosu (`/screens/MemorizationStudioScreen.tsx`)
- **Dikey Akordeon Düzeni:** Çalışılan ayet bloğu genişler, önceki ve sonraki ayetler kompaktlaşır. Kullanıcı ritmine göre otomatik geçiş yapılır.
- **3 Kademeli Hafıza Turu:**
  1. *1. Kademe:* Arapça + Transliterasyon + Meal açık. Bütüncül dinleme ve okuma.
  2. *2. Kademe:* Transliterasyon ve meal gizlenir; sadece Arapça iskelet ve ipucu rozetleri kalır.
  3. *3. Kademe (Sesli Okuma & Canlı STT):*
     - Ekrandaki metin tamamen görünmezdir.
     - iOS `SFSpeechRecognizer` (`requiresOnDeviceRecognition = true`) ile kullanıcının sesi yerel olarak dinlenir.
     - Doğru okunan kelimeler ekranda eş zamanlı belirir (**Reveal-on-Recite**).
     - Kullanıcı takıldığında (3 saniye sessizlik) sıradaki kelime hafifçe parlayarak hatırlatılır (**Timeout Whisper**).

### D. İnteraktif Kavram Ağı (DAG Explorer — `/screens/DagExplorerScreen.tsx`)
- Canvas / WebGL veya `react-native-svg` tabanlı yönlü graf arayüzü.
- Akıcı dokunmatik pan ve pinch-to-zoom desteği.
- **Viewport Culling:** Bellek taşmasını önlemek için aynı anda ekranda yalnızca seçilen düğüm ve 5 doğrudan bağlı komşusu tutulur.

---

## 4. Dizin Yapısı (`tafsil-ios-app/src/`)

```
tafsil-ios-app/
├── app.json                    # Expo config
├── package.json
├── design/                     # Claude Design kaynakları (Tafsil.dc.html)
└── src/
    ├── api/                    # Backend REST istemcisi (fetch / ky)
    ├── components/
    │   ├── reading/            # Ayet kartı, kelime token'ı, senkron highlight
    │   ├── memorization/       # Akordeon blokları, fısıltı ipucu paneli
    │   ├── dag/                # Graf düğümleri ve kenar (edge) SVG renderı
    │   └── common/             # Butonlar, modalleri, bottom sheet'ler
    ├── hooks/
    │   ├── useAudioSync.ts     # Ses konumu ve kelime eşleştirme hook'u
    │   ├── useSpeechToText.ts  # On-device STT yönetim hook'u
    │   └── useOfflineData.ts   # WatermelonDB/SQLite veri erişim hook'u
    ├── navigation/             # BottomTab, RootNavigator, FloatingSessionBar
    ├── screens/                # Home, Reading, Memorization, DAG, Settings
    ├── store/                  # Zustand store'ları (userSettings, activeSession)
    └── theme/                  # Renk paletleri, tipografi, fontlar
```
