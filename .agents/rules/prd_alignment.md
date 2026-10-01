# PRD, Karar Günlüğü & Anti-Drift Denetim Kuralı

Bu kural, tafsil.net projesinde yapılan her geliştirme adımında ajanın otomatik olarak uygulaması gereken temel protokoldür.

## Protokol Adımları

1. **Geliştirme Öncesi (Hafıza & Karar Kontrolü):**
   - `DEVELOPMENT_LOG.md` dosyasındaki son kararları ve `README.md` (PRD) dokümanını tara.
   - Yapılacak işin önceki oturumlarda alınan mimari kararlarla (örn. R2 ses depolaması, veritabanı kuralları, immutable Kur'an metni) veya PRD vizyonuyla çelişip çelişmediğini teyit et. Çelişki varsa derhal kullanıcıya bildir.

2. **Geliştirme Sonrası (Post-step Verification):**
   - Her kod yazma ve geliştirme aşamasının ardından, yapılan işi `README.md` dokümanı ile karşılaştır.
   - Şu soruların yanıtını yanıtında özetle:
     - Yapılan iş `README.md`'deki hangi fonksiyonel madde veya faza denk geliyor?
     - PRD'deki herhangi bir prensiple (maliyet, offline-first, ses/zaman damgası, güvenlik) çelişki var mı?
     - Bu geliştirme bir Yol Haritası (Roadmap) maddesinin statüsünü değiştirdi mi (örn: `⏳ Planlandı` → `🟡 Devam Ediyor` veya `🟡 Devam Ediyor` → `🟢 Tamamlandı`)? Gerekirse `README.md`'yi güncelle.

3. **Geliştirme Günlüğü & Commit Önerisi (DEVELOPMENT_LOG.md):**
   - Her geliştirme oturumu tamamlandığında, oturumda neyin neden yapıldığını, mimari gerekçeleri, etkilenen dosyaları ve doğrudan kullanılabilecek Git Commit mesajını `DEVELOPMENT_LOG.md` dosyasına yeni bir oturum başlığı olarak işle.
