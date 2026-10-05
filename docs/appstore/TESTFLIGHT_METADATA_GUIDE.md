# App Store Connect — TestFlight & App Privacy Tanımlama Rehberi

Bu belge, **PBI-9.11** kapsamında App Store Connect (ASC) paneline girilecek tüm bilgileri, TestFlight Beta App Review notlarını ve App Privacy (Veri Gizliliği) anket yanıtlarını içermektedir.

---

## 1. Uygulama Bilgileri (App Information)

* **Uygulama Adı:** Tafsil — Kur'an Okuma ve Anlama
* **Alt Başlık (Subtitle - Max 30 Karakter):** Kavramlarla Derinlemesine Kur'an
* **Birincil Dil:** Türkçe
* **Paket Kimliği (Bundle ID):** `net.tafsil.app`
* **Birincil Kategori:** Referans (Reference)
* **İkincil Kategori:** Eğitim (Education)
* **Gizlilik Politikası URL (Privacy Policy URL):**  
  `https://tafsil.net/gizlilik` *(İngilizce incelemeler için `https://tafsil.net/privacy` de aktiftir)*
* **Destek URL (Support URL):**  
  `https://tafsil.net/destek` *(İngilizce: `https://tafsil.net/support`)*

---

## 2. TestFlight — Test Bilgileri (Test Information)

*(ASC ➔ TestFlight ➔ Sol menüden Test Bilgileri / Test Information)*

* **Geri Bildirim E-postası (Feedback Email):**  
  `merhaba@tafsil.net`
* **Gizlilik Politikası URL:**  
  `https://tafsil.net/gizlilik`

### A. Ne Test Edilmeli? (What to Test — Türkçe):
```text
Tafsil iOS beta sürümüne hoş geldiniz. Bu sürümde:
• Kitap gibi akıcı Kur'an okuma deneyimi ve editoryal tipografi
• Ayet ve kelime bazlı morfolojik kök ve lemma analizi
• Keşif, Öğrenme ve Odak modları arası anlık geçiş
• Sure ilerleme matrisi ve okuma geçmişi
• Çevrimdışı (offline-first) SQLite tabanlı sure/meal erişimi
• Ayarlar üzerinden anonim tanılama raporu paylaşımı

Geri bildirimlerinizi TestFlight üzerinden ekran görüntüsüyle veya merhaba@tafsil.net adresine iletebilirsiniz.
```

### B. Ne Test Edilmeli? (What to Test — İngilizce / Fallback):
```text
Welcome to the Tafsil iOS beta. In this build:
• Seamless editorial Quran reading experience
• Morphological root & lemma analysis per word
• 3 reading modes: Discovery, Learning, and Focus
• Surah progress matrix and reading history
• Offline-first reading powered by local SQLite
• Diagnostic reporting in Settings

Please share feedback directly via TestFlight or at merhaba@tafsil.net.
```

### C. Beta İnceleme Bilgileri / Notlar (Review Notes for Apple Reviewer):
*(Apple onay ekibinin oturum açmadan uygulamayı tam olarak inceleyebilmesi için zorunlu alandır)*
```text
Giriş için özel bir demo hesabı gerekmemektedir. Uygulama açılışında veya Giriş ekranında "Misafir Olarak Devam Et" seçeneğine dokunarak tüm özelliklere (Kur'an okuma, arama, kök analizi, ezber stüdyosu ve çevrimdışı kullanım) kısıtlamasız erişebilirsiniz. İsteğe bağlı olarak "Sign in with Apple" ile de oturum açılabilir.

No demo account credentials are required. Apple reviewers can simply tap "Misafir Olarak Devam Et" (Continue as Guest) on the onboarding/login screen to access all features without restriction. Sign in with Apple is also available.
```

---

## 3. App Privacy — Veri Gizliliği Anketi (Data Privacy Declarations)

*(ASC ➔ Sol menüden Uygulama Gizliliği / App Privacy ➔ "Başlayın" veya "Düzenle")*

### Temel Soru: Uygulamadan veya üçüncü taraf ortaklardan veri topluyor musunuz?
👉 **Evet, bu uygulamadan veri topluyoruz (Yes, we collect data from this app)**

Aşağıdaki 4 veri tipini seçin:

---

### 1. İletişim Bilgileri (Contact Info) ➔ E-posta Adresi (Email Address)
* **Kullanım Amacı:** 
  * ✅ **Uygulama İşlevselliği (App Functionality):** Apple Sign-In ile hesap oluşturan kullanıcıların senkronizasyonu ve kullanıcının rızasıyla tanılama/destek e-postası göndermesi için.
* **Kullanıcı Kimliğiyle İlişkilendirme:**  
  * ✅ **Evet, kullanıcı kimliğiyle ilişkilendirilir (Linked to User)** *(Hesap girişi yapıldığında)*
* **Takip Amacıyla Kullanım:**  
  * ❌ **Hayır, takip amacıyla kullanılmaz (Not used for tracking)**

---

### 2. Kimlik Tanımlayıcılar (Identifiers) ➔ Kullanıcı Kimliği (User ID)
* **Kullanım Amacı:** 
  * ✅ **Uygulama İşlevselliği (App Functionality):** Okuma ilerlemesi, sure geçmişi ve ezber durumunun çoklu cihazlar arasında senkronize edilmesi.
* **Kullanıcı Kimliğiyle İlişkilendirme:**  
  * ✅ **Evet, kullanıcı kimliğiyle ilişkilendirilir (Linked to User)**
* **Takip Amacıyla Kullanım:**  
  * ❌ **Hayır, takip amacıyla kullanılmaz (Not used for tracking)**

---

### 3. Kullanım Verileri (Usage Data) ➔ Ürün Etkileşimi (Product Interaction)
* **Kullanım Amacı:** 
  * ✅ **Uygulama İşlevselliği (App Functionality):** Son okunan ayet, okunan sureler ve ezber tekrarlarının cihaz içi/sunucu senkronizasyonu.
* **Kullanıcı Kimliğiyle İlişkilendirme:**  
  * ✅ **Evet, kullanıcı kimliğiyle ilişkilendirilir (Linked to User)**
* **Takip Amacıyla Kullanım:**  
  * ❌ **Hayır, takip amacıyla kullanılmaz (Not used for tracking)**

---

### 4. Tanılama (Diagnostics) ➔ Diğer Tanılama Verileri (Other Diagnostic Data)
*(PBI-10 Tanılama Sistemi ve PBI-10.4 uyarınca)*
* **Kullanım Amacı:** 
  * ✅ **Uygulama İşlevselliği / Tanılama (App Functionality / Diagnostics):** Kullanıcının Ayarlar ekranından "Tanılama Raporu Gönder" butonuna bilerek basması durumunda iletilen ağ gecikmesi ve yerel veri önbellek durumu.
* **Kullanıcı Kimliğiyle İlişkilendirme:**  
  * ❌ **Hayır, kullanıcı kimliğiyle ilişkilendirilmez (Not linked to User)**
* **Takip Amacıyla Kullanım:**  
  * ❌ **Hayır, takip amacıyla kullanılmaz (Not used for tracking)**

---

### Takip İzni Özeti:
* Uygulama kullanıcıları hiçbir şekilde üçüncü taraf uygulamalarda veya sitelerde **TAKİP ETMEZ** (`NSPrivacyTracking: false`).
* Reklam ağı veya üçüncü taraf pazarlama SDK'sı **BULUNMAZ**.
