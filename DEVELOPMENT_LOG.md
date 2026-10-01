# tafsil.net — Geliştirme, Mimari Kararlar ve Değişiklik Günlüğü (DEVELOPMENT_LOG.md)

Bu dosya, projede gerçekleştirilen her geliştirme oturumunda **alınan mimari kararları, bunların gerekçelerini (neden yapıldığını), etkilenen bileşenleri ve commit özetlerini** kronolojik olarak kayıt altına alan **canlı proje hafızasıdır**.

> **Ajanlar ve Geliştiriciler İçin Kural:**
> Her yeni geliştirme adımına başlarken bu dosya mutlaka taranmalı; yeni bir özellik tasarlanırken **geçmiş kararlarla çelişki olup olmadığı** denetlenmelidir. Geliştirme tamamlandığında ise oturumun özeti ve gerekçeleri bu dosyaya yeni bir başlık olarak eklenmelidir.

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
* **ElevenLabs & Orijinal Tilavet Hibrit Stratejisi:**
  * *Karar:* Orijinal Arapça seslendirmeler yüksek kaliteli kârî kayıtlarından sağlanırken, Türkçe meal seslendirmeleri için stüdyo ortamında üretilen sesler R2'ye aktarıldı.
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
