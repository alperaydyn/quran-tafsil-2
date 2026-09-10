# 03: Mobil Uygulama Dağıtım Rehberi (iOS & Android)

React Native / Expo uygulamasının Expo Application Services (EAS) ile derlenmesi, Apple App Store ve Google Play Store'a dağıtımı ve OTA güncelleme stratejisi.

---

## 1. Mimari Özet

```
Geliştirici → git push → GitHub Actions → EAS Build (Cloud)
                                              ↓
                              ┌───────────────┴───────────────┐
                              │                               │
                        iOS (.ipa)                     Android (.aab)
                              │                               │
                    App Store Connect              Google Play Console
                              │                               │
                     TestFlight → App Store        Internal Test → Production
```

- **EAS Build:** Expo'nun bulut derleme servisi. Yerel macOS/Xcode gerektirmez (opsiyonel olarak yerel derleme de mümkün).
- **EAS Submit:** Derlenmiş binary'yi otomatik olarak App Store Connect ve Google Play Console'a yükler.
- **EAS Update (OTA):** JavaScript bundle değişiklikleri mağaza onayı beklemeden anında dağıtılır.

---

## 2. Ön Gereksinimler

### Hesaplar ve Araçlar

| Gereksinim | Durum | Notlar |
|---|---|---|
| Apple Developer Program | ✅ Mevcut | $99/yıl, Xcode yüklü |
| Google Play Developer | ❓ Kontrol et | Tek seferlik $25 kayıt |
| Expo Hesabı | Gerekli | [expo.dev](https://expo.dev) üzerinden ücretsiz |
| EAS CLI | Gerekli | `npm install -g eas-cli` |

### İlk Kurulum

```bash
# EAS CLI kurulumu
npm install -g eas-cli

# Expo hesabına giriş
eas login

# Proje dizinine geç
cd tafsil-ios-app

# EAS projesini bağla
eas init --id <expo-project-id>

# Credentials kurulumu (iOS)
eas credentials
```

---

## 3. EAS Build Profilleri

Yapılandırma: [tafsil-ios-app/eas.json](file:///Users/alperaydin/Projects/kuran-tafsil-net/tafsil-ios-app/eas.json)

### Profil Açıklamaları

| Profil | Platform | Kullanım | Dağıtım Kanalı |
|---|---|---|---|
| `development` | iOS + Android | Geliştirme (Expo Dev Client) | Yerel cihaz |
| `preview` | iOS + Android | Test (Ad Hoc / Internal) | TestFlight / Internal |
| `production` | iOS + Android | Canlı yayın | App Store / Play Store |

### Derleme Komutları

```bash
# Geliştirme derlemesi (simulator + gerçek cihaz)
eas build --profile development --platform ios

# Preview derlemesi (TestFlight / dahili test)
eas build --profile preview --platform all

# Prodüksiyon derlemesi (mağaza gönderimi)
eas build --profile production --platform all
```

---

## 4. iOS Dağıtım Akışı

### 4.1 App Store Connect Hazırlığı

1. [App Store Connect](https://appstoreconnect.apple.com) üzerinde yeni uygulama oluştur:
   - **Bundle ID:** `net.tafsil.app`
   - **SKU:** `tafsil-quran-app`
   - **Kategori:** Education / Reference
2. Provisioning profili ve sertifikaları EAS üzerinden yönet (otomatik).

### 4.2 Derleme ve Gönderim

```bash
# iOS prodüksiyon derlemesi
eas build --profile production --platform ios

# App Store Connect'e otomatik gönderim
eas submit --platform ios --latest
```

### 4.3 TestFlight Test Süreci

1. EAS Submit ile binary App Store Connect'e yüklenir.
2. Apple otomatik derleme işlemi (5-15 dakika).
3. TestFlight üzerinden dahili test grubu oluştur.
4. Testi tamamlandığında "App Store'a Gönder" butonu ile incelemeye sun.
5. Apple inceleme süresi: genellikle 24-48 saat.

---

## 5. Android Dağıtım Akışı

### 5.1 Google Play Console Hazırlığı

1. [Google Play Console](https://play.google.com/console) üzerinde yeni uygulama oluştur:
   - **Paket Adı:** `net.tafsil.app`
   - **Kategori:** Education
   - **İçerik Derecelendirmesi:** Everyone
2. İmzalama anahtarı: EAS tarafından yönetilen Google Play App Signing kullanılır.

### 5.2 Derleme ve Gönderim

```bash
# Android prodüksiyon derlemesi (AAB formatı)
eas build --profile production --platform android

# Google Play Console'a otomatik gönderim
eas submit --platform android --latest
```

### 5.3 Test Kanalları

| Kanal | Amaç | Erişim |
|---|---|---|
| **Internal Testing** | Ekip testi | Max 100 test kullanıcı |
| **Closed Testing** | Beta kullanıcılar | Davetli kullanıcılar |
| **Open Testing** | Genel beta | Herkes katılabilir |
| **Production** | Canlı yayın | Tüm kullanıcılar |

---

## 6. OTA (Over-The-Air) Güncelleme Stratejisi

EAS Update ile JavaScript bundle değişiklikleri mağaza onayı olmadan anında dağıtılır. Native kod değişiklikleri (yeni native modül, SDK güncellemesi) hâlâ mağaza güncellemesi gerektirir.

### OTA ile Güncellenebilir Değişiklikler
- ✅ UI düzeni ve stil değişiklikleri
- ✅ Yeni ekranlar ve navigasyon
- ✅ Metin ve çeviri güncellemeleri
- ✅ API endpoint değişiklikleri
- ✅ İş mantığı düzeltmeleri (bug fix)
- ❌ Yeni native modül ekleme (kamera, sensör vb.)
- ❌ `app.json` / `app.config.js` değişiklikleri
- ❌ Expo SDK sürüm yükseltmesi

### OTA Güncelleme Komutları

```bash
# Prodüksiyon kanalına güncelleme gönder
eas update --branch production --message "Ayet okuma ekranı performans iyileştirmesi"

# Preview kanalına güncelleme gönder
eas update --branch preview --message "Yeni ezber stüdyosu düzeni"
```

### Güncelleme Alma Stratejisi (İstemci Tarafı)

```javascript
// app.config.js
export default {
  updates: {
    url: "https://u.expo.dev/<project-id>",
    fallbackToCacheTimeout: 5000,  // 5 saniye içinde yeni güncelleme yoksa önbellekten aç
    checkAutomatically: "ON_LOAD", // Uygulama açılışında kontrol et
  },
};
```

---

## 7. Sürüm Yönetimi (Versioning)

### Semantic Versioning

```
MAJOR.MINOR.PATCH
  │      │     │
  │      │     └─ Hata düzeltmeleri, küçük iyileştirmeler (OTA ile dağıtılabilir)
  │      └────── Yeni özellikler (mağaza güncellemesi gerektirebilir)
  └───────────── Büyük değişiklikler, API kırılmaları (mağaza güncellemesi)
```

### app.json Sürüm Alanları

```json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1"
    },
    "android": {
      "versionCode": 1
    }
  }
}
```

- **`version`:** Kullanıcıya görünen sürüm (Semantic Versioning).
- **`buildNumber` (iOS):** Her App Store gönderiminde artırılır (EAS otomatik).
- **`versionCode` (Android):** Her Play Store gönderiminde artırılır (EAS otomatik).

---

## 8. App Store / Play Store Metadata

### Temel Bilgiler

| Alan | Değer |
|---|---|
| **Uygulama Adı** | Tafsil — Kur'an Okuma ve Anlama |
| **Alt Başlık (iOS)** | Kavramlarla Derinlemesine Kur'an |
| **Kısa Açıklama (Android)** | Kur'an'ı kavramlarıyla oku, anla, ezberle |
| **Kategori** | Education / Reference |
| **Yaş Derecelendirmesi** | 4+ (iOS) / Everyone (Android) |
| **Desteklenen Diller** | Türkçe, İngilizce |
| **Gizlilik Politikası URL** | `https://tafsil.net/privacy` |
| **Destek URL** | `https://tafsil.net/support` |

### Ekran Görüntüleri

Her mağaza için gereken ekran görüntüsü boyutları:

**iOS:**
- iPhone 6.7" (1290x2796) — zorunlu
- iPhone 6.5" (1242x2688)
- iPad Pro 12.9" (2048x2732) — opsiyonel

**Android:**
- Telefon (1080x1920 veya üzeri) — zorunlu
- 7" tablet (1200x1920) — opsiyonel
- 10" tablet (1600x2560) — opsiyonel

---

## 9. Yerel Derleme (Opsiyonel)

Xcode yüklü olduğundan, EAS Build yerine yerel derleme de yapılabilir:

```bash
# iOS yerel derleme (Xcode gerektirir)
eas build --profile production --platform ios --local

# Android yerel derleme (Android Studio / SDK gerektirir)
eas build --profile production --platform android --local
```

> **Not:** Yerel derleme, EAS bulut kotasını tüketmez. iOS derlemesi yalnızca macOS üzerinde çalışır.
