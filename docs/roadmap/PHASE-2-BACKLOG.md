# Faz 2 — İleri Özellikler & Platform Genişleme — Canlı Geliştirme Backlog'u

Bu belge, **tafsil.net** Faz 1 (MVP) tamamlandıktan sonra Faz 2 kapsamında geliştirilecek özelliklerin takip edildiği **canlı operasyonel backlog (iş listesi)** belgesidir.

> **Ajanlar İçin Protokol:**
> 1. Kullanıcı *"Faz 2'ye devam et"*, *"Sıradaki işi yap"* veya benzeri bir komut verdiğinde; ajan doğrudan bu belgeyi açar.
> 2. Tamamlanmamış (`[ ]`) ilk görevi belirler, kullanıcıya *"Sıradaki görev: [PBI Adı], başlıyorum"* mesajı verir.
> 3. İşi tamamlayıp test ettikten sonra bu belgedeki ilgili kutuyu `[x]` olarak işaretler ve `DEVELOPMENT_LOG.md` dosyasına oturum özeti düşer.

---

## Faz 1'den Ertelenen Maddeler (Deferral from Phase 1)

### Konfigürasyon & Dağıtım
- [ ] **PBI-D.1 (EAS Project ID):** `app.json` içindeki `REPLACE_WITH_EAS_PROJECT_ID` placeholder'ının `eas init` çalıştırılarak gerçek Expo Project ID ile doldurulması. *(TestFlight F&F için zorunlu — Faz 1 `PBI-9.10` kapsamında ele alınıyor.)*
- [ ] **PBI-D.2 (App Store Submit Konfigürasyonu):** `eas.json` içindeki `APPLE_ID_EMAIL`, `APP_STORE_CONNECT_APP_ID` ve `APPLE_TEAM_ID` placeholder'larının gerçek Apple Developer hesap bilgileriyle güncellenmesi. *(Faz 1 `PBI-9.10` kapsamında.)*
- [x] **PBI-D.3 (Mock Dosya Temizliği):** `src/api/mock/surahs.mock.ts` ve `src/api/mock/verses.mock.ts` dosyalarının tamamen silinmesi. *(Faz 1 `PBI-9.7` ile öne çekilip tamamlandı.)*
- [ ] **PBI-D.4 (Staging Ortamı):** `api-staging.tafsil.net` DNS + ayrı veritabanı; `eas.json` `preview` profilinin geçici prod API yönlendirmesinden staging'e alınması.

### App Store Public Sürüm Ön Koşulları (TestFlight F&F'ten ertelendi)
- [ ] **PBI-AUTH.1 (Native Google Sign-In):** `@react-native-google-signin/google-signin` veya eşdeğeri ile gerçek id_token akışı (iOS OAuth Client ID + URL scheme), sahte e-posta modalinin kaldırılması ve `FEATURES.googleSignIn` bayrağının açılması.
- [x] **PBI-AUTH.2 (Hesap Silme — Guideline 5.1.1(v)) — PUBLIC SÜRÜM İÇİN ZORUNLU:** Backend `DELETE /auth/me` (tüm kullanıcı verilerinin cascade silinmesi), Apple REST API ile Sign in with Apple token revoke, Ayarlar'da onaylı "Hesabımı Sil" akışı ve `clearAllLocalUserData` yerel temizliği.
- [ ] **PBI-OBS.1 (Crash Raporlama):** Sentry (veya eşdeğeri) entegrasyonu; F&F süresince TestFlight crash log'ları yeterli kabul edildi.
- [ ] **PBI-OBS.2 (Tanılama Raporu Yönetim Paneli & Saklama):** Web admin panelinde `GET /api/v1/diagnostics/admin/reports` listesi, kısa kodla rapor/olay akışı görüntüleme ve durum yönetimi; 90 günden eski raporlar için BullMQ/cron saklama işi (Faz 1 PBI-10.3'ten ertelendi).

### KVKK / GDPR & Veri Uyumluluğu (Data Privacy & Compliance)
- [ ] **PBI-COMPL.1 (Veri Taşınabilirliği / Right to Data Portability):** Kullanıcının tüm okuma geçmişini, yer imlerini, ayet notlarını ve ezber verilerini standart JSON formatında tek tıkla cihazına indirebilmesi (`GET /api/v1/auth/export-data` ve Ayarlar › "Verilerimi İndir").
- [ ] **PBI-COMPL.2 (Hesap Silme Grace Period & Kalıcı Tasfiye — Opsiyonel 30 Gün Askı):** Kullanıcı hesabını sildiğinde 30 günlük geri alma süresi (grace period) tanınması; 30 gün içinde giriş yapılmazsa BullMQ cron ile veritabanından ve loglardan kalıcı fiziksel tasfiye (`deleted_at` + otomatik purge worker'ı).
- [ ] **PBI-COMPL.3 (Açık Rıza & Telemetri Tercihleri):** Tanılama raporu gönderimi ve hata takibi için kullanıcıya Ayarlar ekranında açık rıza (opt-in / opt-out) denetimi sunulması; KVKK aydınlatma metni ile entegrasyon.

### Mobil Uygulama — İleri Özellikler
- [ ] **PBI-2.11 (Türkçe Meal Seslendirmesi):** Stüdyo kalitesinde Türkçe meal seslendirmesi (TTS veya profesyonel kayıt) ve kelime senkronlu karaoke.
- [ ] **PBI-2.12 (Reveal-on-Recite Ezber Stüdyosu — Cihaz Üstü STT):** Gerçek cihaz üzerinde konuşma tanıma (Speech-to-Text) entegrasyonu ile sesli okurken kelimelerin belirmesi.

### Web Platformu
- [ ] **PBI-W.1 (Web App Portal):** Next.js tabanlı web okuma, paylaşım ve topluluk portalının geliştirilmesi (ayrıntılar için `docs/agents/04-WEB-APP-AGENT.md`).
- [ ] **PBI-W.2 (Open Graph Dinamik Kart Üretimi):** Paylaşılan ayet bağlantılarına dinamik OG resim üretimi.

### Agentic RAG & Derinleşme
- [ ] **PBI-A.1 (Kullanıcı Tarafından Başlatılan Anlama Çalışmaları):** Canlı araştırma, önerilen okuma rotası, intent denetimi ve oturum dallanması (Agentic RAG).
- [ ] **PBI-A.2 (Sistem Tarafından Hazırlanan Detay Oturumları):** Kullanıcının okuma izlerine göre proaktif olarak sunulan derinleşme paketleri.

### DAG & Kavram Ağı
- [ ] **PBI-G.1 (DAG Kavram Grafiği Görselleştirmesi):** Kavramlar arası yönlü çevrimsiz graf ilişkilerinin interaktif görselleştirilmesi (lazy expansion, seçilen + 5 komşu).

---

## Yeni Faz 2 Özellikleri

*(Faz 2 planlaması sırasında burada detaylandırılacak)*

---
