# tafsil.net

> **Proje Durumu:** 🚧 Tasarım Aşaması (PRD — Product Requirements Document)
>
> **Teknoloji Stack:** React Native (Expo) · Node.js / Fastify · PostgreSQL 16+ · pgvector · Redis · OpenRouter (LLM Gateway) · OAuth 2.0
>
> **Hedef Platform:** iOS Öncelikli Native Mobil Uygulama (App Store + Google Play)

---

## İçindekiler

1. [Kapsam](#kapsam)
2. [Fonksiyonel Gereksinimler](#fonksiyonel-gereksinimler)
   - [Veri Kaynağı ve Veri Pipeline](#veri-kaynağı-ve-veri-pipeline)
   - [Kullanıcı Verisi](#kullanıcı-verisi)
   - [Detay Oturumları (Sistem Tarafından Hazırlanan)](#detay-oturumları-sistem-tarafından-hazırlanan)
   - [Kavram Ağı ve İnteraktif Görselleştirici](#kavram-ağı-ve-i̇nteraktif-görselleştirici-dag-explorer)
   - [Anlama Çalışmaları (Kullanıcı Tarafından Başlatılan)](#anlama-çalışmaları-kullanıcı-tarafından-başlatılan-understanding-sessions--agentic-rag)
   - [Morfolojik Kök Analiz Motoru](#morfolojik-kök-analiz-motoru-root--lexicon-engine)
   - [Kronolojik Kavram Evrimi](#kronolojik-kavram-evrimi-nüzul-dönem-analizi)
   - [Kapsamlı Kelime Sözlüğü ve İnceleme Katmanı](#kapsamlı-kelime-sözlüğü-ve-i̇nceleme-katmanı-word-by-word--lexicon)
   - [Ezberleme Sistemi ve Aralıklı Tekrar Algoritması](#ezberleme-sistemi-ve-aralıklı-tekrar-algoritması)
   - [Artırılmış Etkileşim ve Dinamik Ana Ekran](#artırılmış-etkileşim-ve-dinamik-ana-ekran-dashboard--engagement)
   - [Kur'an Okuma ve Ezber İlerleme Haritası](#kuran-okuma-ve-ezber-i̇lerleme-haritası-114-sure-grid-matrisi)
   - [Ezber Oturumları Yönetim Sayfası ve Etkileşimli Ezber Stüdyosu](#ezber-oturumları-yönetim-sayfası-ve-etkileşimli-ezber-stüdyosu)
   - [Kelime Senkron Sesli Okuma](#kelime-senkron-sesli-okuma-synchronized-audio-recitation)
3. [Genel Tasarım İlkeleri](#genel-tasarım-i̇lkeleri)
4. [Kullanıcı Yolculuğu ve Onboarding](#kullanıcı-yolculuğu-ve-onboarding)
5. [Teknik Mimari ve Sistem Altyapısı](#teknik-mimari-ve-sistem-altyapısı)
   - [Frontend — React Native (Expo)](#frontend--react-native-expo)
   - [Backend — Node.js / Fastify (Hostinger VPS)](#backend--nodejs--fastify-hostinger-vps)
   - [Veritabanı Mimarisi](#veritabanı-mimarisi-postgresql-on-hostinger-vps)
   - [Yapay Zeka ve LLM Orkestrasyonu](#yapay-zeka-ve-llm-orkestrasyonu-openrouter-gateway)
   - [Ses ve Konuşma Altyapısı](#ses-ve-konuşma-altyapısı-audio--speech)
   - [Çevrimdışı Strateji ve Yerel Önbellekleme](#çevrimdışı-strateji-ve-yerel-önbellekleme)
   - [Kimlik Doğrulama ve Güvenlik](#kimlik-doğrulama-güvenlik-ve-gizlilik)
   - [Performans Gereksinimleri ve Ölçeklenebilirlik](#performans-gereksinimleri-ve-ölçeklenebilirlik)
6. [Sosyal Paylaşım ve Büyüme](#sosyal-paylaşım-ve-büyüme-social-sharing--virality)
7. [İş Modeli ve Abonelik Sistemi](#i̇ş-modeli-ve-abonelik-sistemi-monetization)
8. [Admin Paneli ve İçerik Yönetimi](#admin-paneli-ve-i̇çerik-yönetimi)
9. [Platform Analitiği](#platform-analitiği)
10. [Yol Haritası](#yol-haritası-roadmap)

---

## Kapsam

Bu uygulama Kuran'ı okuyup detaylı şekilde anlama işini kolaylaştıran, kavramları Kuran ayetlerinden yola çıkarak anlamlandırmaya çalışan bir platformdur. Kullanıcıya kitap okur gibi Kuran okuma imkanı sunarken aynı zamanda kelime ve kavramları standart tefsir veya sözlük anlamlarına göre değil, Kuran'daki kullanım şekillerine göre anlamlandıran, kelimeler arasındaki ilişkileri kurarak Kuran'ın bütünsel bir anlayışını sunan bir platformdur.

Uygulamanın amacı kullanıcıya kolay ve akıcı bir okuma rahatlığı sunarken, kullanıcının detaylandırmak istediği konuları detaylar içerisinde kaybolmadan, detaydaki her bir bağlantıyı kişisel bir yönlü çevrimsiz graf (Directed Acyclic Graph) olarak takip edebileceği ve her bir detayı istediği zaman tekrar ziyaret edebilecek şekilde yer imlerine (bookmark) ekleyebileceği bir deneyim sunmaktır.

Akıcılık ve yapılandırılmış detay arasındaki denge/geçiş bu uygulamanın en önemli özelliğidir. Bu dengeyi sağlayabilmek için önyüz geliştirmesi kritik öneme sahiptir. Önyüz tasarımı hedef cihaz olan telefon ve tablete göre optimize edilmeli, farklı cihazlar arasında (telefon, tablet, bilgisayar) tutarlı bir deneyim sunulmalıdır.

Uygulama kullanıcılar arası etkileşimi de desteklemektedir. Kullanıcılar oluşturdukları, geliştirdikleri kavramları diğer kullanıcılar ile isteğe bağlı paylaşabilirler, başkalarının paylaştığı kavramları beğenip (like) kendi kavram havuzlarına dahil edebilirler, başkalarının kavram ağlarını kendi kavram ağlarına dahil edebilirler. Ya da kendi oluşturdukları kavram ağlarını başkalarının ziyaretine açabilirler. Kullanıcılar ayetleri ve/veya kavramları paylaşım için uygulamanın kendi iç paylaşım fonksiyonuna ilave olarak sosyal medyada da bu paylaşımlarını yayınlayabilir, uygulamanın kullanımını yaygınlaştırabilirler.


## Fonksiyonel Gereksinimler


### Veri Kaynağı ve Veri Pipeline

Uygulamayı beslemek için Kuran belirli bir formatta sisteme beslenecektir. Bunlar Sure > Ayet Bloğu > Ayet > Cümle bloğu olarak beslenecektir. Sureler varsayılan olarak **mushaf sırasına** göre yer alacaktır. Kullanıcı dilediği takdirde sureleri nüzul sırasına göre de görüntüleyebilir (nüzul sırası ve dönem bilgileri editör tarafından sisteme sağlanır). Buna karşılık ayetler kendi içerisinde anlam bağlılığı olacak şekilde gruplanacaktır. Her bir ayet de yine kendi içerisinde cümle ve/veya sub-sentence bloklarına ayrılacaktır. Her bir cümlede/sub-sentence'da kavramlar [<kavram>] şeklinde işaretlenecektir.

* **Kaynak Veri Formatı:** Tüm Kur'an verisi normalleştirilmiş JSON dosyaları olarak hazırlanır ve PostgreSQL'e toplu aktarılır (seed). Her bir JSON kaydı `sure_id`, `ayet_no`, `blok_id`, `cumle_index`, `arapca_metin`, `transliterasyon`, `meal_tr` ve `kavramlar[]` alanlarını içerir.
* **Arapça Metin ve Meal Kaynağı:** Arapça orijinal metin Tanzil.net / Quran.com açık veri setlerinden alınır; Türkçe meal başlangıçta tek bir referans çeviri (ör. Diyanet meali) ile beslenir, ilerleyen süreçte farklı dillerdeki çeviriler eklenir.
* **Transliterasyon:** Her ayet için kullanıcının arayüz diline uygun fonetik transliterasyon LLM (büyük dil modeli) ile toplu üretilir, editör kontrolünden geçirilir ve veri tabanına eklenir.
* **Ayet Blokları ve Cümle Segmentasyonu:** Ayetler arası anlam bağlılığı grupları (ayet blokları) ve ayet içi cümle/sub-sentence segmentasyonu LLM destekli toplu işlem (batch pipeline) ile oluşturulur, ardından alan uzmanı editör tarafından doğrulanır.
* **Kavram İşaretleme:** Cümle içindeki kavramlar (`[<kavram>]`) LLM ile otomatik tespit edilir ve mevcut kavram sözlüğüyle eşleştirilir. Yeni kavramlar otomatik önerilir, editör onayından sonra sisteme eklenir.
* **Morfolojik Kök Verisi:** Quranic Arabic Corpus açık veri seti temel kaynak olarak kullanılır; kök-harf (root), lemma, vezin/bâb kalıbı ve gramatikal rol (i'rab) bilgileri kelime bazında eşleştirilir. Eksik veya tartışmalı kayıtlar LLM desteğiyle tamamlanır.
* **Kavram İlişkileri:** Kavramlar arası semantik ilişkiler (zıt anlam, kapsama, sebep-sonuç, benzerlik, atıf) LLM ile toplu çıkarılır ve yönlü çevrimsiz graf (DAG) yapısında PostgreSQL'de `adjacency list` modeliyle saklanır. Kavram grafi görselleştirme için ana unsur değildir ancak **Agentic RAG analiz süreçlerinde** kavramlar arası bağlantı keşfi için aktif olarak sorgulanır. Graf traversal işlemleri backend servisinde recursive CTE (Common Table Expression) sorguları ile gerçekleştirilir; ayrı bir graf veritabanı (Neo4j vb.) başlangıç aşamasında maliyet/karmaşıklık açısından tercih edilmez.
* **Nüzul Sırası ve Dönem Verisi:** Surelerin nüzul sırası ve dönem bilgileri (Erken Mekke, Orta Mekke, Geç Mekke, Medine) editör tarafından sisteme sağlanır ve `sureler` tablosunda `nuzul_sirasi` ve `donem` alanları olarak tutulur. Bu veri Kronolojik Kavram Evrimi özelliği ve RAG bağlam analizi tarafından kullanılır.
* **Yüksek Yük Optimizasyonu:** Tüm statik Kur'an içeriği (ayetler, mealler, transliterasyon, morfolojik veriler) değişmez (immutable) referans veri olarak işaretlenir ve Redis önbelleğinde TTL'siz tutulur; bu sayede veritabanı sorguları yalnızca kullanıcıya özgü dinamik veriler için gerçekleşir.

### Kullanıcı Verisi

Amaç kullanıcının tüm Kuran'ın tamamını anlayarak okumasını sağlamaktır. Bu süreçte kullanıcı dilediği zaman okumasını durdurup, anlamadım, detaylandır diyebilir veya sadece okumaya devam edebilir. Kullanıcının okuma logları, günlük okuma performansı, akıcı okuduğu, detaylandırdığı, merak ettiği kavramlar detaylı olarak loglanır, kullanıcının okuması sırasında bu kısımlar kullanıcıya hazır olarak sunulur. Burada amaç kullanıcının merakını ve ilgisini yüksek tutmak, bu sayede düzenli okuma alışkanlığı kazanmasını sağlamaktır.

### Detay Oturumları (Sistem Tarafından Hazırlanan)

Detay oturumları, **sistemin arka planda otomatik olarak hazırladığı** kişiselleştirilmiş analiz paketleridir. Kullanıcının bu oturumları başlatması gerekmez; sistem kullanıcının davranışını izleyerek proaktif olarak hazırlar ve uygun anları kollayarak önerir.

> **Not:** Bu bölüm, kullanıcının aktif olarak başlattığı *Anlama Çalışmaları*'ndan farklıdır. Detay Oturumları pasif ve proaktif olarak sistem tarafından sunulurken, Anlama Çalışmaları kullanıcının bir soru veya konuyla başlattığı aktif araştırma oturumlarıdır.

* **Otomatik Analiz Hazırlama:** Kullanıcının detaya indiği kavramlar, birden fazla kez ziyaret ettiği ayetler, kelime detayı görüntülediği noktalar gibi davranış işaretleri arka planda toplanır. Bu işaretlerin yoğunlaştığı kavramlar üzerinde kişiselleştirilmiş bir detay oturumu (ilgili ayetler, kavram ilişkileri, önerilen okuma listesi) önceden hazırlanır.
* **Proaktif Önerme:** Hazırlanan detay oturumları kullanıcının bir sonraki uygulama açılışında veya okuma seansı sırasında uygun bir anda önerilir (ana ekran kartı veya soft bildirim olarak).
* **Ücretsiz Katmanda Pasif Deneyim:** Kullanıcı detay oturumunu açtığında önceden hazırlanmış analiz özetini, ilgili ayet listesini ve kavram ilişki haritasını görüntüler. Bu içerik statiktir ve ücretsiz katmanda sunulur.
* **Pro'ya Yönlendirme (Etkileşimli Derinleşme):** Kullanıcı hazır analize soru sormak, detaylandırmak veya farklı bir açıdan incelenmesini istemek istediğinde, sistem kullanıcıyı *Anlama Çalışmaları* sayfasına yönlendirir. Bu etkileşimli agentik analiz Premium (Pro) abonelik gerektirir.
* **Kişisel Takip:** Kullanıcı geçmiş detay oturumlarını tekrar ziyaret edebilir, yer imlerine (bookmark) ekleyebilir. Her bir kavramın ne kadar detaylı incelendiği, ne kadar tekrar ziyaret edildiği gibi bilgiler kullanıcının ilgi profilini zenginleştirir ve gelecek detay oturumlarının kalitesini artırır.

### Kavram Ağı ve İnteraktif Görselleştirici (DAG Explorer)

Kavramlar Kuran içerisinde belirli bir konuyu veya olayı ifade eden kelimelerdir. Bu kavramların Kuran içerisinde nasıl kullanıldığı, hangi bağlamlarda kullanıldığı, hangi ayetlerde kullanıldığı, hangi ayetlerde farklı anlamlara geldiği gibi bilgiler ile detaylı olarak incelenir. Kavramlar Kuran içerisinden yapay zeka desteği ile çıkartılabileceği gibi zaman içerisinde kullanıcılar tarafından da geliştirilebilir. Kavramların oluşturulması ve geliştirilmesi sürecinde kullanıcıların katkısı teşvik edilir; kullanıcılar oluşturdukları kavramları diğer kullanıcılar ile isteğe bağlı paylaşabilir, başkalarının paylaştığı kavramları beğenip (like) kendi kavram havuzlarına dahil edebilirler. Kavramlar arası ilişkiler de (eş anlam, zıt anlam, kapsama, vb.) kavram ağının parçası olarak oluşturulabilir.

* **Görselleştirme Arayüzü:** Kullanıcının kavramlar ve ayetler arasındaki ilişkileri keşfettiği, Canvas / WebGL (veya mobil uyumlu SVG) tabanlı dinamik grafik arayüzüdür.
* **Düğüm (Node) Tipleri:** Merkezde kavramlar, kavramlara bağlı ayet/cümle blokları ve kullanıcının kişisel tefekkür notları yer alır.
* **Kenar (Edge) Semantiği:** Düğümler arasındaki bağlantılar anlamsal tiplerle etiketlenir (zıt anlam, kapsama/hiyerarşi, sebep-sonuç, benzerlik, atıf).
* **Etkileşim ve Performans:** Dokunmatik ekranlarda akıcı pan, zoom ve odaklama (pinch-to-zoom, node expansion) desteklenir. Düğüme tıklandığında ilgili ayet parçacıkları bağlamıyla genişler.
* **Katman Yönetimi:** Kullanıcı kendi kişisel grafiği, platformun global kavram ağı ve diğer kullanıcıların paylaştığı kavram ağları arasında filtreler aracılığıyla tek dokunuyla geçiş yapabilir.
* **Topluluk Kavram Havuzu:** Kullanıcılar kendi oluşturdukları kavram ağlarını veya doğrulanmış tefekkür notlarını platform içi topluluk havuzuna açabilir; diğer kullanıcılar bunları beğenip kendi çalışma alanlarına çatallayabilir (fork).

### Anlama Çalışmaları (Kullanıcı Tarafından Başlatılan — Understanding Sessions & Agentic RAG)

Kullanıcının Kur'an'daki belirli bir konuyu, kavramı ya da kafasına takılan derin soruları çok boyutlu ve odaklı biçimde araştırdığı bağımsız bir çalışma sayfasıdır (`/anlama-calismalari`). Bu sayfa bağımsız **Anlama Oturumları (Understanding Sessions)** şeklinde yönetilir:

* **Oturum Başlatma ve Canlı Agentik İlerleme (Live Agentic Workflow):**
  * Kullanıcı yeni bir anlama oturumu oluşturur ve ne üzerine çalışmak istediğini doğal dille belirtir (örn. *"Kur'an'da adalet ve şahitlik ilişkisi"*, *"Münafıkların psikolojik tasvirleri"*, vb.).
  * Arka planda çalışan yapay zeka araştırma agent'ı (Agentic RAG) devreye girer. İstekteki anahtar kavramları, kök bağıntılarını ve doğrudan ilişkili olabilecek sure ve ayet bloklarını çok adımlı (multi-step retrieval) sorgularla araştırır.
  * Bu araştırma süreci ve adımları ekranda estetik bir canlı ilerleme göstergesiyle (progress timeline: *Kavramlar ayrıştırılıyor → İlgili ayetler taranıyor → Anlamsal bağlar kuruluyor → Özet ve okuma rotası hazırlanıyor*) anlık olarak izlenebilir.

* **Sentez Özeti ve Çift Yönlü Navigasyonlu Okuma Sırası (Reading Path & Back-Navigation):**
  * İlgili ayetler toplandıktan sonra agent kapsamlı bir bağlamsal analiz özeti üretir.
  * Kullanıcının ayetleri bağlamında inceleyebilmesi için tıklanabilir bir **"Önerilen Okuma Sırası"** sunulur.
  * Kullanıcı listedeki bir ayete tıkladığında doğrudan ayet okuma ekranına yönlendirilir; arayüzde yer alan dinamik bir **"Anlama Oturumuna Geri Dön" (Floating Session Bar / Breadcrumb)** navigasyonu sayesinde okumasını tamamladığında tek dokunuşla kaldığı analize geri dönebilir.

* **Dinamik Soru-Cevap, Intent Yönetimi ve Oturum Dallanması (Session Branching):**
  * Kullanıcı aynı oturum içerisinde analize dair yeni sorular sormaya ve detaylandırmaya devam edebilir.
  * **Intent ve Kapsam Denetimi:** Sorulan yeni soru mevcut temanın dışına çıkıyorsa veya farklı bir analiz konusunu kapsıyorsa, sistem durumu tespit eder ve kullanıcıya proaktif bir öneri sunar: *"Bu soru mevcut 'X' analizinizden farklı bir tema ('Y') içeriyor. Bu araştırmayı yeni bir oturuma taşımak ister misiniz?"*
  * Kullanıcı onay verirse, yeni istek ve ilgili bağlam otomatik olarak yeni bir oturuma taşınır ve bağımsız bir akış olarak başlatılır.

* **Oturum Yönetimi, Sabitleme ve Paylaşım (Pin & Share):**
Kullanıcının Kur'an'daki belirli bir konuyu, kavramı ya da kafasına takılan derin soruları çok boyutlu ve odaklı biçimde araştırdığı bağımsız bir çalışma sayfasıdır.

* **Oturum Başlatma ve Canlı Agentik İlerleme:** Kullanıcı yeni bir anlama oturumu oluşturur ve ne üzerine çalışmak istediğini doğal dille belirtir. Arka planda çalışan yapay zeka araştırma agent'ı (Agentic RAG) devreye girer. Bu araştırma süreci ve adımları ekranda estetik bir canlı ilerleme göstergesiyle anlık olarak izlenebilir.
* **Sentez Özeti ve Çift Yönlü Navigasyon:** Agent kapsamlı bir bağlamsal analiz özeti üretir ve tıklanabilir bir **"Önerilen Okuma Sırası"** sunar. Kullanıcı, arayüzde yer alan dinamik bir **"Anlama Oturumuna Geri Dön"** navigasyonu sayesinde okumasını tamamladığında tek dokunuşla kaldığı analize geri dönebilir.
* **Dinamik Soru-Cevap ve Oturum Dallanması:** Kullanıcı aynı oturum içerisinde analize dair yeni sorular sormaya ve detaylandırmaya devam edebilir. Eğer yeni soru mevcut temanın dışına çıkıyorsa sistem bunu algılar ve kullanıcıyı yeni bir oturum başlatmaya davet eder.
* **Chat ve Oturum Yönetim Mimarisi:** Platform, **Agentic RAG & Graph Entegrasyonu**, **Bellek Mimarisi (Short & Long-Term Memory)** ve **Akıllı Bağlam Özetleme** tekniklerini kullanarak kullanıcıya kişiselleştirilmiş ve tutarlı bir çalışma alanı sunar.

### Morfolojik Kök Analiz Motoru (Root & Lexicon Engine)

Geliştirici ekibin veri tabanı modellemesi ve servis mimarisinde temel alacağı dilbilimsel altyapıdır.
* **Veri Modeli ve Şema:** Her kelime (token) veri tabanında üçlü/dörtlü Arapça kök harfleri, lemma (sözlük kök biçimi), bâb/vezin kalıbı, morfolojik türü ve gramatikal rolü ile modellenir.
* **Türev ve Frekans Matrisi:** Bir köke bağlı tüm türev kelimelerin Kur'an genelindeki dağılımı, hangi surelerde hangi formlarda kaçar kez yer aldığı ilişkisel olarak indekslenir.
* **Semantik Eşleme Servisi:** Kavramlar (`[<kavram>]`) bu kök ve kalıp bilgileriyle ilişkilendirilir; böylece aynı kökten gelen farklı kelimeler arasındaki anlam kaymaları ve nüanslar deterministik bir API üzerinden sorgulanabilir.

### Kronolojik Kavram Evrimi (Nüzul Dönem Analizi)

Kavramların nüzul sürecinde nasıl anlam kazandığını ve genişlediğini gösteren görsel analiz aracıdır. Nüzul sırası ve dönem bilgileri editör tarafından sağlanan veriye dayanır:
* **Görsel Tasarım & UI Düzeni:** Dikey veya yatay akış çizgisi üzerinde nüzul dönemleri (Erken Mekke, Orta Mekke, Geç Mekke, Medine) renk kodlu bantlarla ayrıştırılır.
* **Durak Kartları (Milestones):** Seçilen kavramın geçtiği her bir ayet bloğu çizgi üzerinde bir durak kartı olarak temsil edilir; kart üzerinde ayet numarası, dönem bilgisi ve tarihi bağlam özeti bulunur.
* **Anlam Genişlemesi Rozetleri:** Kavramın sonraki duraklarda kazandığı yeni anlam boyutları kart üzerinde vurgulu rozetler halinde gösterilir.

### Kapsamlı Kelime Sözlüğü ve İnceleme Katmanı (Word-by-Word & Lexicon)

Kur'an metninde geçen istisnasız **bütün kelimeler** için kademeli ve derinlemesine bir sözlük deneyimi sunulur:
* **Özel Kelime Sayfaları:** Kur'an'daki her kelimenin benzersiz bir detay sayfası bulunur.
* **1. Aşama - Hızlı Özet Paneli:** Okuma akışı sırasında herhangi bir kelimeye dokunulduğunda akışı kesmeyen hafif bir alt çekmece panel açılır.
* **2. Aşama - Derinlemesine Kelime Sayfası:** Kelimenin geçtiği diğer tüm ayetler, klasik sözlük kaynakları (Ragıb el-İsfahani, Lisanü'l-Arab vb.) ve nahiv/morfolojik analizi sunulur.

### Ezberleme Sistemi ve Aralıklı Tekrar Algoritması

Ezberleme sistemi, **SM-2 / Leitner** aralıklı tekrar algoritması temelinde çalışır. Sistemin ezberleme sürecine dair detaylar ve stüdyo deneyimi için bkz. *Ezber Oturumları Yönetim Sayfası ve Etkileşimli Ezber Stüdyosu*.

### Artırılmış Etkileşim ve Dinamik Ana Ekran (Dashboard & Engagement)

Kullanıcı platforma giriş yaptığında kişiselleştirilmiş bir motivasyon ve yönlendirme merkeziyle karşılanır:
* **Okuma & Tefekkür Bahçesi:** Günlük okunan ayet miktarı, incelenen kavram derinliği ve tamamlanan ezber oturumları ısı haritası mantığıyla görselleştirilir.
* **Akıllı Devam Kısayolları:** *"Kaldığım Yerden Devam Et"*, *"Ezberlemeye Devam Et"* ve *"En Son Anlama Oturumuna Dön"* butonları.
* **Günün İlham Kartları:** Günün Ayeti, Günün Kur'an Duası ve Günün Namaz/İbadet Ayeti.
* **Kur'an Referans Doğrulama Mekanizması:** Makalelerin ayet dayanaklılığını puanlayan ve doğrulanmış içerikleri etiketleyen sistem.

### Kur'an Okuma ve Ezber İlerleme Haritası (114 Sure Grid Matrisi)

Kullanıcının Kur'an yolculuğunu bütünsel olarak takip edebileceği matris haritasıdır:
* **Görsel Matris:** Kur'an'ın 114 suresi, kompakt ve şık 4x29'luk blok matris düzeninde sergilenir.
* **Dinamik Yüzde Gösterimi:** Her sure için okuma veya ezberleme yüzdesi renk skalasıyla görselleştirilir.
* **Çoklu Tur (Hatim) Mekanizması:** Turlar tamamlandıkça renk doygunluğu artan kümülatif bir görsel tatmin sunulur.

### Ezber Oturumları Yönetim Sayfası ve Etkileşimli Ezber Stüdyosu

Ezber süreçleri platformda bağımsız bir yönetim sayfası ve bu sayfaya bağlı çok aşamalı interaktif çalışma stüdyosu olarak konumlandırılır:

* **1. Ezber Oturumları Yönetim Sayfası (`/ezber`):**
  * **Oturum Bazlı Mimari:** Ezberleme süreci dağınık değil, "Oturumlar" (Sessions) halinde organize edilir ve takip edilir.
  * **Yeni Ezber Oturumu Ekleme:** Kullanıcı dilediği zaman yeni bir ezber oturumu başlatır; oturum kapsamı olarak bir surenin tamamını veya bir sureden seçeceği belirli ayet bloklarını belirler. Harita üzerindeki "Ezberlediklerim" sekmesinden veya sure içinden gelinmişse, ilgili sure oturum açılışında **otomatik seçili gelir**.
  * **Durum ve Zaman Çizelgesi Takibi:** Bu yönetim panelinde her ezber bloğunun/oturumunun:
    * **Anlık Ezber Durumu:** (Örn. *Öğreniliyor*, *Kör Okuma Aşamasında*, *Tekrar Bekliyor*, *Pekiştirildi / Hafızada*)
    * **Bir Sonraki Tekrar Zamanı:** Aralıklı öğrenme eğrisine göre hesaplanmış sonraki tekrar vakti (örn. *Bugün 17:30*, *Yarın*, *4 gün sonra*) açıkça listelenir ve vaktinde hatırlatılır.

* **2. Etkileşimli Ezber Stüdyosu (Eller Serbest Akordeon Akışı ve Kademeli Turlar):**
  Ezber çalışması, kullanıcının ekrana minimum temas ettiği, sistemin kullanıcının okuma ritmini öğrenerek akışı otomatik yönettiği adaptif bir stüdyo deneyimidir:
  * **Akordeon Mimarisi ve Otomatik Sıralı İlerleme:**
    * Seçilen ayetler ekranda dikey bir akordeon düzeninde yer alır.
    * Çalışılan aktif ayet/cümle bloğu otomatik açılır, tur tamamlandığında zarifçe kapanır ve bir sonraki ayet açılarak odak kaydırılır. Ekrana manuel tıklama ihtiyacı minimuma indirilir.
  * **3 Kademeli Tur İlerlemesi (Aşamalı Hafıza Kodlama):**
    * **1. Kademe (İlk 3-4 Tur - Bütüncül Düz Okuma):** Arapça orijinal metin, kullanıcının dilindeki transliterasyon (okunuş) ve Türkçe anlam (meal) bir arada açık olarak sunulur. Kullanıcı ritme ve anlama aşina olur.
    * **2. Kademe (Sonraki 3-4 Tur - Arapça İskelet & İpucu Desteği):** Transliterasyon ve anlam gizlenir; ekranda yalnızca Arapça kelimeler kalır. Hafıza, kavramsal çıpalar ve hafif görsel ipuçlarıyla desteklenir.
    * **3. Kademe (Sonraki 3-4 Tur - Sesli Okuma, Canlı STT ile Beliren Kelimeler):**
      * Ekrandaki tüm metin başlangıçta gizlenir. Kullanıcı ezberinden sesli okumaya başlar.
      * **Canlı STT ile Kelime Belirme (Reveal-on-Recite):** Konuşma tanıma (STT) motoru kullanıcının sesini dinler; kullanıcı doğru okudukça algılanan kelimeler ekranda anlık olarak görünür hale gelir.
      * **Zaman Ayarlı Akıllı Hatırlatma (Timeout Whisper):** Kullanıcı okurken belirli bir süre durakladığında veya tıkandığında, sıradaki kelime ekranda parlayarak/gösterilerek gecikmeksizin hatırlatılır. Telaffuz ve hareke hatalarında düzeltme önerisi sunulur.
  * **Adaptif Hız ve Öğrenen Geçiş Sistemi:** Sistem kullanıcının okuma hızını, duraksama eşiklerini ve anlama performansını zaman içinde öğrenir; turlar arası ve ayetler arası geçiş sürelerini kullanıcının bireysel ritmine göre dinamik olarak optimize eder.
  * **Oturum Bütünlüğünde Aralıklı Öğrenme (Session-Based Interval Learning):** Ezberlenen her ayet/ayet bloğu için uzayan aralıklarla (1 gün, 3 gün, 7 gün, 14 gün, 30 gün vb.) ezber tekrar okumaları istenir. Tekrar zamanı geldiğinde ayetler parçalanmadan, kullanıcının belirlediği **aynı oturum bütünlüğü içinde** sırayla gelir ve yine takılma anında akıllı fısıltı desteğiyle tekrarlanır.

### Kelime Senkron Sesli Okuma (Synchronized Audio Recitation)

Platformun tüm okuma ekranlarında geçerli olan, çift dilli ve kelime seviyesinde eş zamanlı (karaoke tarzı) sesli okuma özelliğidir. Ses altyapısının teknik detayları için bkz. *Ses ve Konuşma Altyapısı (Audio & Speech)*.

* **Ses Kaynağı ve Dil Seçenekleri:**
  * **Arapça Orijinal Tilavet:** Seçkin kârilerden yüksek kaliteli, duraklı ve tecvid kurallarına uygun orijinal tilavet.
  * **Kullanıcı Dili (Sesli Çeviri / Meal):** Kullanıcının kendi dilinde (örn. profesyonel stüdyo kaydı Türkçe meal) akıcı seslendirme.
  * Kullanıcı okuma ekranında tek bir dokunuşla Arapça tilavet veya kendi dilindeki seslendirme arasında geçiş yapabilir.
* **Kelime Seviyesinde Senkron Vurgulama (Word-by-Word Highlight):**
  * Ses kaydı çalarken, tam o anda okunan kelime ekrandaki seçili dilde anlık olarak belirginleştirilir/vurgulanır (highlight).
  * Arapça ses çalarken ekrandaki Arapça kelime; kullanıcı dili seslendirilirken çeviri metnindeki ilgili kelime zaman damgasıyla (word-alignment) senkronize olarak aydınlanır.
  * Kullanıcı metinde herhangi bir kelimeye dokunduğunda ses doğrudan o kelimenin/cümlenin saniyesine sararak oynatmayı oradan sürdürür.
* **Modlara Göre Farklılaşma:**
  * **Keşif Modu:** Kullanıcı dili (Türkçe sesli meal) önceliklidir; Arapça metin gizli olsa dahi meal kelime kelime senkron vurgulanarak dinlenebilir.
  * **Öğrenme Modu:** Hem Arapça tilavet hem kullanıcı dili seslendirme aktiftir; seçilen dilde okunan kelimeler ekranda eş zamanlı aydınlanır.
  * **Odak Modu:** Yüksek kaliteli Arapça tilavet önceliklidir; mushaf hattında okunan her Arapça kelime senkron highlight edilir. Ek olarak kilit ekranı ve arka plan oynatımıyla uyumlu *Sadece Dinleme Modu (Audio-Only)* sunulur.


## Genel Tasarım İlkeleri

* **Premium ve Elit Tasarım Hissiyatı:**
  * Alışılageldik, geleneksel ve klişe dini uygulama tasarımlarından (ağır tezhip desenleri, aşırı altın/yeşil varak süslemeleri, hantal çerçeveler) tamamen uzak.
  * Modern, minimalist, yüksek kaliteli editoryal tipografi (okunabilirliği yüksek serif/sans-serif font eşleşmeleri), ferah negatif alan (whitespace) kullanımı ve zarif mikro etkileşimler ile elit bir dijital yayın/çalışma platformu hissi.

* **Kullanıcının Niyetine Göre Farklılaştırılmış Önyüz Modları:**
  Platform, kullanıcının geliş amacına ve dünyasına göre arayüzü, etkileşim yoğunluğunu ve dilini 3 farklı modda dinamik olarak uyarlar. Mod seçimi **onboarding (ilk kayıt) sırasında** yapılır ve daha sonra **kullanıcı ayarlarından** her zaman değiştirilebilir:

  1. **Keşif Modu (Sadece Merak ve Anlama Odaklı):**
     * **Oyunlaştırma Yok:** Ezber yönlendirmeleri, motivasyon rozetleri, seriler (streak) ve dönemsel hatırlatıcılar tamamen devre dışıdır.
     * **Yalnızca Anlama ve Çeviri:** Arapça orijinal metinler arayüzü kalabalıklaştırmamak adına varsayılan olarak kapalıdır; modern dildeki akıcı çeviriye odaklanılır.
     * **Sesli Okuma:** Kullanıcı dili (Türkçe sesli meal) önceliklidir (detaylar için bkz. *Kelime Senkron Sesli Okuma*).
     * **Proaktif Bağlamsal Açıklamalar:** Tartışmalı, günümüz dünyasında sorgulanan veya yanlış anlaşılmaya müsait ayetlerde (tarihsel, sosyolojik veya linguistik arka plan) kullanıcı henüz talep etmeden satır içi/kenar notu şeklinde rasyonel açıklamalar sunulur.
     * Felsefi, edebi ve entelektüel bir okuma ortamı sağlar.

  2. **Öğrenme Modu (Eğitim ve Motivasyon Öncelikli):**
     * **Öğretme ve Sorgulama:** Kullanıcıyı kavramları derinlemesine keşfetmeye ve ayetler üzerinde düşünmeye yönlendiren rehberli deneyim.
     * **Sesli Okuma:** Hem Arapça tilavet hem kullanıcı dili aktiftir (detaylar için bkz. *Kelime Senkron Sesli Okuma*).
     * **Tutundurma ve Motivasyon:** Okuma alışkanlığı kazandırmaya yönelik hafif oyunlaştırma, ısı haritası, günün ilham kartları ve teşvik edici geri bildirimler aktiftir.
     * **Dengeli Katman:** Hem Türkçe meal hem transliterasyon hem de temel kelime seviyesi kavram kartları bir arada sunulur.

  3. **Odak Modu (Derinleşme ve Tilavet Odaklı):**
     * **Minimum Müdahale (Distraction-Free):** Düzenli tilavet ve okumayı amaçlayan, oyunlaştırma ve sürekli kesintilerden arındırılmış sakin arayüz.
     * **Arapça Metin Önceliği:** Yüksek kaliteli orijinal mushaf hattı/Arapça tipografi merkezdedir. Transliterasyon opsiyonel olarak tamamen kapatılabilir.
     * **Sesli Okuma:** Arapça tilavet öncelikli + Sadece Dinleme Modu (detaylar için bkz. *Kelime Senkron Sesli Okuma*).

* **Erişilebilirlik ve Çok Dil Desteği:**
  * **Çoklu Dil (i18n):** Uygulama arayüzü ve Kur'an mealleri çoklu dil desteğiyle tasarlanır. Başlangıçta Türkçe ve İngilizce desteklenir; farklı dillerdeki çeviriler ve transliterasyonlar zaman içerisinde modüler olarak sisteme eklenir. Dil paketleri bağımsız JSON dosyaları olarak yönetilir ve yeni dil eklemek kod değişikliği gerektirmez.
  * **Ekran Okuyucu Uyumluluğu:** VoiceOver (iOS) ve TalkBack (Android) ile tam uyum; tüm etkileşimli öğelerde anlamlı erişilebilirlik etiketleri (accessibility labels) kullanılır.
  * **Dinamik Metin Boyutu:** iOS Dynamic Type ve Android fontScale ayarlarına saygılı tipografi; kullanıcı sistem genelinde metin boyutunu büyüttüğünde uygulama düzeni bozulmadan uyum sağlar.
  * **Renk Kontrastı:** WCAG 2.1 AA seviyesinde minimum kontrast oranları sağlanır; koyu ve açık tema seçeneklerinin her ikisinde de okunabilirlik garanti edilir.


## Kullanıcı Yolculuğu ve Onboarding

Yeni bir kullanıcının uygulamayı ilk açtığında yaşayacağı deneyim akışı ve uygulamaya tutunma mekanizmaları:

* **1. Karşılama ve Kayıt:**
  * Uygulama ilk açıldığında kısa, görsel ve etkileyici bir tanıtım akışı (3-4 slayt) ile platformun temel değer önerisi sunulur.
  * Apple Sign-In veya Google Sign-In ile tek tıkla hesap oluşturma. Kayıt öncesinde uygulamayı keşfetme seçeneği de sunulur (misafir modu).

* **2. Mod Seçimi (Onboarding):**
  * Kullanıcıya 3 mod kısaca tanıtılır ve hangisinin kendisine uygun olduğunu seçmesi istenir:
    * **Keşif Modu** — *"Kur'an'ı merak ediyor, modern bir perspektifle okumak istiyorum"*
    * **Öğrenme Modu** — *"Kur'an'ı anlamak, kavramlarını öğrenmek ve düzenli okuma alışkanlığı kazanmak istiyorum"*
    * **Odak Modu** — *"Düzenli tilavet ediyorum, Arapça metin odaklı sakin bir okuma ortamı arıyorum"*
  * Mod seçimi kullanıcı ayarlarından her zaman değiştirilebilir.

* **3. Dil ve Tercihler:**
  * Arayüz dili ve meal dili seçimi (başlangıçta Türkçe / İngilizce).
  * Tercih edilen kâri sesi seçimi (sesli okuma için).

* **4. İlk Kullanım Deneyimi (Empty States):**
  * Ana ekranda henüz veri olmayan bölümler (okuma geçmişi, ezber oturumları, kavram ağı) motive edici ve yönlendirici boş durum (empty state) mesajlarıyla karşılanır:
    * *"İlk ayetini oku ve yolculuğuna başla"* → Fatiha suresi veya kullanıcının seçtiği sureye yönlendirme.
    * *"İlk ezber oturumunu oluştur"* → Ezber sayfasına yönlendirme.
  * Günün kartları (ayet, dua, namaz ayeti) ilk açılıştan itibaren sunularak boş ekran hissi önlenir.

* **5. Tutundurma (Retention) Mekanizmaları:**
  * Öğrenme Modu'nda hafif oyunlaştırma: okuma serileri (streak), ilerleme rozetleri ve ısı haritası.
  * Aralıklı tekrar hatırlatmaları (push notification) ile ezber disiplini.
  * Günün kartları ve kişiselleştirilmiş detay oturumu önerileri ile düzenli geri dönüş motivasyonu.
  * Keşif ve Odak modlarında oyunlaştırma olmadan, doğal merak ve içerik kalitesiyle tutundurma.


## Teknik Mimari ve Sistem Altyapısı

### Frontend — React Native (Expo)

* **Teknoloji Seçimi:** Uygulama **React Native + Expo (managed workflow)** ile geliştirilir. Bu seçim iOS ve Android için tek kod tabanından yerel (native) performans sunar, App Store ve Google Play'e doğrudan dağıtım sağlar ve Expo'nun OTA (Over-The-Air) güncelleme altyapısı sayesinde mağaza onay sürecini beklemeden hızlı düzeltme yayınlanabilir.
* **Neden React Native:** Capacitor/Ionic alternatifleri WebView tabanlı olduğundan, özellikle kavram ağı grafik renderı (Canvas/WebGL), kelime senkron ses vurgulama ve STT entegrasyonu gibi performans-kritik özellikler native bridge üzerinden çok daha verimli çalışır. React Native'in geniş ekosistemi, güçlü topluluk desteği ve uzun vadeli bakım kolaylığı da belirleyici faktörlerdir.
* **iOS Öncelikli Tasarım:** Apple Human Interface Guidelines'a tam uyum; iOS-native navigasyon desenleri (bottom-tab, modal sheets, haptic feedback), Dynamic Type, SF Symbols ve iOS güvenli alan (safe area) yönetimi birinci sınıf vatandaş olarak uygulanır.
* **Mobil Ergonomi:** Tek elle kullanım ergonomisi: Alt navigasyon (bottom-tab), kaydırılabilir alt çekmeceler (bottom-sheet), parmak dostu dokunma hedefleri (minimum 44pt) ve akıcı jestler (swipe ile ayet geçişi, pinch-to-zoom kavram grafiği).
* **Durum Yönetimi:** Zustand ile hafif ve performanslı global state; MMKV ile ultra hızlı yerel kalıcı depolama (AsyncStorage yerine).
* **Navigasyon:** React Navigation (native-stack) ile iOS ve Android'e özgü geçiş animasyonları ve deep linking desteği.

### Backend — Node.js / Fastify (Hostinger VPS)

* **Teknoloji Seçimi:** Backend **Node.js (v20 LTS) + Fastify** framework ile geliştirilir. Fastify'ın şema tabanlı doğrulama, yüksek throughput ve düşük bellek tüketimi profili VPS ortamında optimal performans sağlar.
* **API Mimarisi:** Tüm istemci-sunucu iletişimi **RESTful JSON API** üzerinden gerçekleşir. Endpoint'ler kaynak bazlı tasarlanır (`/api/v1/sureler`, `/api/v1/ayetler/:id`, `/api/v1/kavramlar`, `/api/v1/anlama-oturumlari` vb.).
* **Agent ve LLM Fonksiyonları:** Tüm yapay zeka işlemleri (Agentic RAG, semantik analiz, bağlam özetleme, kavram çıkarımı) VPS üzerinde çalışan backend servislerinden orkestre edilir; istemci hiçbir zaman doğrudan LLM API'ye erişmez.
* **Bildirim ve Hatırlatma Sistemi:**
  * **Ezber Tekrar Hatırlatmaları:** iOS için Apple Push Notification Service (APNs), Android için Firebase Cloud Messaging (FCM) üzerinden zamanlanmış push notification'lar gönderilir. Aralıklı tekrar algoritmasının hesapladığı sonraki tekrar zamanları sunucu tarafında bir cron/iş kuyruğu (BullMQ + Redis) ile takip edilir ve vakti geldiğinde bildirim tetiklenir.
  * **Cihaz Üzerinde Yerel Hatırlatıcılar (On-Device Fallback):** Kullanıcı çevrimdışıyken veya push alınamadığında, uygulama içinde `expo-notifications` ile yerel zamanlanmış bildirimler oluşturulur. Cihaz tekrar çevrimiçi olduğunda sunucu ile senkronize edilir.
  * **Günün Kartları ve Motivasyon Bildirimleri:** Günün ayeti, duası ve namaz ayeti bildirimleri kullanıcının tercih ettiği saatte gönderilir; bildirime tıklandığında doğrudan ilgili ayet sayfası açılır.

### Veritabanı Mimarisi (PostgreSQL on Hostinger VPS)

* **Veri Omurgası:** Hostinger VPS üzerinde barındırılan **PostgreSQL 16+** ilişkisel veritabanı.
* **İlişkisel Bütünlük:** Sure > Ayet > Cümle > Kelime > Morfolojik Kök katmanları güçlü ilişkisel tablolar ve foreign-key kurgusuyla tutulur.
* **Kavram Grafi Depolaması:** Kavram ilişkileri (DAG) PostgreSQL'de `adjacency list` modeli ile saklanır (`kavram_iliskileri` tablosu: `kaynak_kavram_id`, `hedef_kavram_id`, `iliski_tipi`, `agirlik`). Graf traversal işlemleri recursive CTE sorguları ile backend'de gerçekleştirilir. Başlangıç aşamasında ayrı bir graf veritabanı (Neo4j, Amazon Neptune vb.) aylık ~$100 bütçe sınırını aşacağından tercih edilmez; kullanıcı tabanı ve graf karmaşıklığı büyüdüğünde gerekirse değerlendirilir.
* **Vektör Arama Entegrasyonu (`pgvector`):** Ayet mealleri, kavram açıklamaları ve anlama oturumlarının semantik embedding vektörleri aynı PostgreSQL üzerinde `pgvector` eklentisiyle indekslenir. Hibrit arama stratejisi: tam metin arama (PostgreSQL `tsvector` + GIN index) ile semantik benzerlik araması (pgvector HNSW index, cosine similarity) birleştirilir; sonuçlar RRF (Reciprocal Rank Fusion) ile birleştirilir.
* **Önbellekleme Stratejisi:** Redis (Hostinger VPS üzerinde) iki katmanlı önbellek olarak kullanılır:
  * **L1 — Değişmez Referans Verisi (TTL'siz):** Kur'an ayetleri, mealler, transliterasyonlar, morfolojik kök verileri, kavram tanımları. Bu veriler hiç expire olmaz ve uygulama başlangıcında ısıtılır (cache warming).
  * **L2 — Kullanıcıya Özgü Dinamik Veri (TTL'li):** Günün kartları (24 saat TTL), popüler kavram ağı alt grafları (1 saat TTL), son görüntülenen anlama oturumu özetleri (30 dk TTL).
* **Bağlantı Havuzlama:** PgBouncer (transaction mode) ile eşzamanlı bağlantı sayısı sınırlandırılır; VPS bellek tüketimi optimize edilir.
* **Başlangıç Maliyet Tavanı:** Tüm altyapı bileşenleri (VPS, PostgreSQL, Redis, Nginx, Cloudflare Free) aylık **~$100** bütçeyi aşmayacak şekilde planlanır. Hostinger VPS (4 vCPU / 8 GB RAM) ~$25-35/ay; OpenRouter LLM maliyeti kullanım bazlı olup Pro abonelik geliriyle karşılanır.

### Yapay Zeka ve LLM Orkestrasyonu (OpenRouter Gateway)

* Yapay zeka servisleri (Agentic RAG, semantik analiz, bağlam özetleme) için **OpenRouter API** ağ geçidi kullanılır.
* **Model Agnostik Yapı:** Tek bir sağlayıcıya kilitlenmeden görevin niteliğine göre en uygun model seçilir:
  * Derin anlama çalışmaları ve çok adımlı akıl yürütme için gelişmiş akıl yürütme modelleri (Claude 3.5 Sonnet, GPT-4o vb.).
  * Anlık niyet sınıflandırma (intent detection), hızlı özetleme ve hatırlatma fısıltıları için düşük maliyetli ve ultra hızlı modeller (Gemini Flash, Llama 3 vb.).
* **Fallback & Hata Toleransı:** Bir yapay zeka modelinde kesinti veya gecikme yaşandığında OpenRouter üzerinden otomatik olarak alternatif sağlayıcıya geçiş yapılır.

### Ses ve Konuşma Altyapısı (Audio & Speech)

* **Arapça Tilavet Ses Dosyaları:**
  * Seçkin kârilerden (Minshawy, Husary, Afasy vb.) ayet bazlı yüksek kaliteli ses dosyaları temin edilir (EveryAyah.com / QuranicAudio.com açık kaynakları).
  * Ses dosyaları Opus/AAC formatında sıkıştırılarak VPS üzerinde statik dosya sunucusunda (Nginx) barındırılır.
* **Kelime Zamanlama Verisi (Word-Level Timestamps):**
  * Her ayet ses dosyası için kelime bazında başlangıç/bitiş zaman damgaları LLM/Whisper ile toplu olarak (offline batch) üretilir.
  * Zaman damgaları JSON formatında (`[{"word": "بِسْمِ", "start_ms": 0, "end_ms": 450}, ...]`) ayet kaydıyla ilişkilendirilerek veri tabanında saklanır.
  * Bu veriler istemcide karaoke tarzı kelime vurgulama (word-highlight sync) için kullanılır.
* **Kullanıcı Dilinde Meal Seslendirmesi (TTS):**
  * Türkçe meal seslendirmesi **ElevenLabs API** ile profesyonel kalitede üretilir (doğal, akıcı, stüdyo kaydı hissi).
  * Üretilen ses dosyaları VPS'te barındırılır; kelime zamanlama verileri aynı yöntemle çıkartılır.
  * Yeni dil çevirileri eklendiğinde aynı pipeline ile o dilin meal seslendirmesi üretilir.
* **Konuşma Tanıma (STT — Ezber Stüdyosu için):**
  * **Birincil:** Apple `SFSpeechRecognizer` ile cihaz üzerinde (on-device) tanıma kullanılır (`requiresOnDeviceRecognition = true`). Bu sayede internet bağlantısı gerekmez, gecikme sıfıra yakındır ve kullanıcı verileri cihazdan çıkmaz.
  * **Android Karşılığı:** Android cihazlarda Google ML Kit On-Device Speech Recognition kullanılır.
  * **Fallback:** Cihaz üzerinde tanıma desteklenmeyen veya düşük performanslı cihazlarda sunucu taraflı **Whisper API** (OpenAI) fallback olarak devreye girer.
  * STT sonuçları Arapça kelime dizisiyle gerçek zamanlı eşleştirilir; doğru okunan kelimeler ekranda belirginleşir (reveal-on-recite), takılma anında akıllı fısıltı hatırlatması tetiklenir.
* **Çevrimdışı Ses İndirme:** Kullanıcı tercih ettiği kârinin ses paketini (sure bazlı veya tam Kur'an) cihazına indirebilir. İndirme durumu uygulama içinde takip edilir; indirilen dosyalar internetsiz ortamda sesli okuma ve ezber çalışması için kullanılır.

### Çevrimdışı Strateji ve Yerel Önbellekleme

Uygulama, kullanıcının internetsiz ortamda temel okuma ve ezber deneyimini kesintisiz sürdürebilmesi için **offline-first** mimarisiyle tasarlanır:

* **Yerel Veritabanı (SQLite / WatermelonDB):**
  Aşağıdaki veriler ilk kurulumda veya ilk oturum açıldığında cihaza senkronize edilir ve yerel SQLite veritabanında saklanır. Tüm yerel verilerin bir kopyası sunucuda anonim olarak yedeklenir (cihaz kaybı/değişikliği durumunda kurtarma).

* **Çevrimdışı Tutulan Veriler (Yerel SQLite):**
  * ✅ Kur'an ayetleri (Arapça metin, bölüm/blok yapısı)
  * ✅ Mealler (tüm desteklenen dillerde)
  * ✅ Transliterasyonlar
  * ✅ Morfolojik kök verileri
  * ✅ Kavram tanımları ve kavram ağı ilişkileri *(öncelikli değil — olmasa da temel deneyimi bozmaz)*
  * ✅ Okuma logları ve ilerleme durumu
  * ✅ Yer imleri (bookmark)
  * ✅ Ezber oturumları ve ezber ilerleme verileri
  * ✅ Anlama çalışması (analiz) oturumlarının özet ve sonuçları
  * ✅ Anlama çalışması önerilen okuma listeleri ve analiz okuma sırası
  * ✅ Sonraki/önceki ayet navigasyon verileri
  * ✅ Günün kartları (önceden önbelleğe alınmış)
  * ✅ Ses dosyaları *(kullanıcı tercihine göre — sure bazlı veya tam Kur'an indirilebilir)*

* **Sunucu Senkronizasyonu:**
  * Tüm kullanıcı verisinin bir kopyası sunucuda anonim olarak tutulur (cihaz kaybı/değişikliği durumunda kurtarma).
  * Senkronizasyon pull-push modeli ile çalışır: uygulama açılışında ve periyodik olarak (arka plan fetch) delta değişiklikler alınır/gönderilir. Çakışma çözümü "son yazan kazanır" (last-write-wins) stratejisiyle, zaman damgası bazlı yönetilir.

* **Çevrimdışı Kullanılabilen Özellikler:**
  * ✅ Kur'an okuma (ayet, meal, transliterasyon, morfolojik bilgiler, bölüm navigasyonu)
  * ✅ Ezber stüdyosu (cihaz üzerinde STT ile — ses paketi indirilmişse sesli okuma dahil)
  * ✅ Okuma/ezber ilerleme takibi, yer imleri ve okuma logları
  * ✅ Geçmiş anlama oturumlarını ve okuma listelerini görüntüleme
  * ✅ Kavram ağı görüntüleme (yerel veri mevcutsa)
  * ✅ Günün kartları (önceden önbelleğe alınmış)
  * ❌ Yeni anlama çalışması başlatma (LLM gerektirir)
  * ❌ Detay oturumu oluşturma (sunucu tarafında hazırlanır)
  * ❌ Topluluk paylaşımları ve sosyal etkileşimler
  * ❌ Makale akışı (yeni içerik çekme)
  * ❌ Tüm yapay zeka destekli özellikler (Agentic RAG, kavram çıkarımı, bağlam analizi)

### Kimlik Doğrulama, Güvenlik ve Gizlilik

* **Sosyal Oturum Açma:**
  * Sürtünmesiz ve şifresiz kullanıcı deneyimi için **Apple Sign-In** (birincil, iOS zorunluluğu) ve **Google Sign-In** (OAuth 2.0 / OpenID Connect) entegrasyonu kullanılır.
  * Apple Human Interface yönergeleriyle tam uyum sağlanır; tek tıkla güvenli profil oluşturulur.
  * Oturum güvenliği JWT (JSON Web Tokens) ve güvenli HttpOnly çerezlerle yönetilir; kullanıcının cihazlar arası senkronizasyonu (telefon, tablet, bilgisayar) anında sağlanır.
* **Minimum Veri İlkesi:**
  * Uygulama yalnızca platformun çalışması için zorunlu olan minimum kullanıcı verisini toplar: oturum kimliği (anonim UUID), okuma/ezber ilerleme verileri, kavram etkileşim logları ve tercih ayarları.
  * Sunucuda kullanıcı verileri kimlik bilgisi içermeyen anonim UUID ile ilişkilendirilir; e-posta veya isim bilgisi yalnızca OAuth sağlayıcısı tarafından doğrulama amacıyla kullanılır ve sunucuda kalıcı olarak saklanmaz.
* **Kullanıcı Veri Kontrolü (Şeffaflık):**
  * Kullanıcı uygulama içi ayarlar sayfasından okuma loglarını, uzun dönem hafıza (long-term memory) verilerini ve kavram etkileşim geçmişini görüntüleyebilir, düzenleyebilir veya tamamen silebilir.
  * Hesap silme işlemi sunucu tarafında ilişkili tüm verilerin kalıcı olarak silinmesini tetikler (KVKK/GDPR uyumlu).
* **API Güvenliği ve Koruma:**
  * OpenRouter API anahtarları yalnızca sunucu tarafında environment variable olarak saklanır; istemci uygulamada hiçbir API anahtarı bulunmaz.
  * Tüm API endpoint'leri JWT doğrulaması ile korunur; hassas operasyonlar (hesap silme, veri dışa aktarma) ek doğrulama adımı gerektirir.
  * **Rate Limiting:** Fastify rate-limit eklentisi ile IP ve kullanıcı bazlı makul sınırlar uygulanır (ör. LLM endpoint'leri: dakikada 10 istek, genel API: dakikada 60 istek). Aşırı trafik durumunda HTTP 429 ile nazik geri bildirim verilir.
  * **DDoS Koruması:** Cloudflare Free tier DNS proxy ile temel DDoS koruması ve SSL/TLS terminasyonu sağlanır; VPS doğrudan erişime kapatılır.
  * Gereksiz şifreleme katmanlarından kaçınılır: HTTPS (TLS 1.3) aktarım güvenliği için yeterlidir; uygulama seviyesinde ek şifreleme yalnızca ödeme bilgileri gibi yüksek hassasiyetli veriler için uygulanır (bu veriler zaten Stripe/RevenueCat tarafında saklanır).

### Performans Gereksinimleri ve Ölçeklenebilirlik

* **Hedef Metrikler:**
  * Hedef kullanıcı tabanı: **1 milyon** kayıtlı kullanıcı.
  * Premium abonelik oranı: **~%5** (50.000 aktif Pro kullanıcı).
  * Ortalama eşzamanlı çevrimiçi kullanıcı: **200-250** (haftada 1-2 yoğun etkileşim seansı profiline göre).
  * Uygulama açılış süresi (cold start → interaktif ekran): **< 1.5 saniye** (önbellekten beslenen günün kartları ve son okuma pozisyonu ile).
  * API yanıt süresi (p95): Statik veri sorguları < 100ms, LLM gerektiren istekler < 5s (streaming ile ilk token < 1s).
* **Açılış Performansı (Zero-Wait Dashboard):**
  * Günün kartları (günün ayeti, duası, namaz ayeti) önceki oturumda önbelleğe alınır ve uygulama açılışında yerel veriden anında gösterilir; arka planda güncellik kontrolü yapılır.
  * Son okuma pozisyonu ve ezber durumu yerel veritabanından (MMKV/SQLite) okunur.
  * Sosyal etkileşimler (topluluk paylaşımları, makale akışı, beğeniler) asenkron olarak yüklenir; ana ekran bunları beklemeden render olur.
* **Kavram Ağı Grafik Performansı:**
  * Ekranda aynı anda gösterilen düğüm sayısı **seçilen node + 5 komşu düğüm** ile sınırlandırılır.
  * Kullanıcı graf üzerinde ilerledikçe (bir düğüme tıklayarak derinleşme), önceki uzak düğümler görünümden kaldırılır ve yeni komşular yüklenir (lazy expand / viewport culling).
  * Bu yaklaşım hem render performansını korur hem de büyük graf yapılarında mobil cihazlarda bellek taşmasını önler.
* **VPS Kaynak Yönetimi:**
  * 200-250 eşzamanlı kullanıcı profili için Hostinger VPS (4 vCPU, 8 GB RAM) yeterli kapasitedir.
  * Statik ses dosyaları Nginx ile doğrudan servis edilir; Node.js/Fastify yalnızca API trafiğini karşılar.
  * Kullanıcı tabanı büyüdükçe yatay ölçekleme stratejisi: Statik içerik CDN'e taşınır (Cloudflare R2/BunnyCDN), API sunucusu gerekirse ikinci VPS instance ile yük dengelenir.
* **Çevrimiçi Bağımlılığı Minimizasyonu:**
  * Okuma ve ezber deneyiminin %95'i çevrimdışı çalışır (bkz. Çevrimdışı Strateji).
  * Çevrimiçi bağlantı yalnızca şu durumlarda gereklidir: yeni anlama çalışması başlatma, topluluk etkileşimleri, makale akışı güncelleme, ezber ilerleme senkronizasyonu ve ses paketi indirme.
  * Bu profil sayesinde sunucu yükü önemli ölçüde düşük tutulur; 1 milyon kullanıcının büyük çoğunluğu çoğu zaman sunucuya istek göndermez.


## Sosyal Paylaşım ve Büyüme (Social Sharing & Virality)

Platformun doğal yollarla yaygınlaşmasını sağlayacak paylaşım araçları:
* **Dinamik Önizleme Kartları (Open Graph & Story Generator):**
  * Kullanıcı bir ayeti, kavram ağını veya anlama oturumu özetini paylaşmak istediğinde; sistem görsel olarak çarpıcı, minimalist ve tipografik kartlar üretir (Instagram Story dikey 9:16 formatı, Twitter/X ve WhatsApp 16:9 görsel önizlemeleri).
* **Derin Bağlantılar (Deep Linking):**
  * Paylaşılan her link alıcıyı doğrudan ilgili ayet bloğuna, kelime sayfasına veya kavramın interaktif grafiğine yönlendirir.
  * Henüz üye olmayan kullanıcılar içeriği kesintisiz önizleyebilir; sisteme dahil olmak istediklerinde Google/Apple login ile tek tıkla kaldıkları yerden devam edebilirler.
* **Topluluk Tefekkür ve Kavram Havuzu:**
  * Kullanıcılar kendi oluşturdukları kavram ağlarını veya doğrulanmış tefekkür notlarını platform içi topluluk havuzuna açabilir, diğer kullanıcılar bunları beğenip (like) kendi kişisel çalışma alanlarına çatallayabilir (fork).


## İş Modeli ve Abonelik Sistemi (Monetization)

Platform, sürdürülebilir bir operasyon ve yüksek yapay zeka maliyetlerini karşılamak üzere **Freemium & Abonelik (Subscription)** modeliyle kurgulanır:

* **1. Ücretsiz Katman (Free Tier - Herkese Açık):**
  * Kur'an'ı mushaf veya nüzul sırasıyla kitap gibi akıcı okuma.
  * Temel arama, standart kelime sözlüğü özetleri ve meal okuma.
  * Sesli okuma dinleme ve genel Kur'an okuma/ezber ilerleme matrisi.
  * Temel topluluk paylaşımlarını görüntüleme.

* **2. Premium Katman (Ücretli Pro / Plus Abonelik):**
  Yoğun LLM ve GPU maliyeti oluşturan ileri seviye agentik ve interaktif fonksiyonlar paywall arkasında sunulur:
  * **Sınırsız "Anlama Çalışmaları" (Agentic RAG):** Derinlemesine konu ve kavram analizi yapan, sure/ayetleri tarayan ve okuma sırası çıkaran yapay zeka asistanı oturumları.
  * **Etkileşimli Ezber Stüdyosu Koçluğu:** Canlı ses tanıma (STT), akıllı fısıltı ile takılma anında hatırlatma ve telaffuz düzeltmeleri.
  * **Kişiselleştirilmiş Detay Oturumları:** Kullanıcının ilgi ve zayıf noktalarına göre arka planda otomatik hazırlanan özel öğrenme seansları.
  * **Gelişmiş Morfolojik ve Semantik İndeks:** Klasik sözlüklerin (Lisanü'l-Arab vb.) tam metin karşılaştırmalı derin analitiği.

* **Ödeme Altyapısı Entegrasyonu:**
  * Mobil uygulamalar için Apple In-App Purchase (StoreKit) ve Google Play Billing entegrasyonu (RevenueCat altyapısı ile web ve mobil abonelik durumlarının tek noktadan senkronizasyonu).
  * Aylık ve yıllık indirimli abonelik paketleri, yeni kullanıcılara yönelik sınırlı süreli deneme (trial) hakları.


## Admin Paneli ve İçerik Yönetimi

> ⚠️ *Bu bölüm ilerleyen aşamalarda detaylandırılacaktır.*

Platformun içerik ve kullanıcı yönetimini sağlayan arka ofis (backoffice) paneli:

* **İçerik Yönetimi:**
  * Kur'an verisi yönetimi (ayet blokları, cümle segmentasyonu düzenleme/onaylama)
  * Kavram oluşturma, düzenleme ve doğrulama süreçleri
  * Günün kartları (ayet, dua, namaz ayeti) planlama ve yayınlama
  * Makale moderasyonu ve Kur'an Referans Doğrulama sonuçlarının gözden geçirilmesi
* **Kullanıcı Yönetimi:**
  * Kullanıcı listeleme, arama ve abonelik durum takibi
  * Topluluk içerik moderasyonu (raporlanan kavramlar, uygunsuz paylaşımlar)
* **Sistem Gözlemi:**
  * API ve LLM kullanım istatistikleri
  * Hata logları ve performans metrikleri


## Platform Analitiği

> ⚠️ *Bu bölüm ilerleyen aşamalarda detaylandırılacaktır.*

Platformun büyüme, kullanım ve gelir performansını izlemek için analitik altyapısı:

* **Kullanıcı Büyüme Metrikleri:** Kayıt, günlük/haftalık/aylık aktif kullanıcı (DAU/WAU/MAU), retention oranları
* **Abonelik Dönüşüm Oranları:** Free → Trial → Pro dönüşüm hunisi, churn oranı
* **Özellik Kullanım Analizi:** En çok kullanılan özellikler, en az kullanılan özellikler, oturum süresi dağılımı
* **İçerik Performansı:** En çok okunan sureler/ayetler, en popüler kavramlar, en paylaşılan içerikler
* **Teknik Performans:** API yanıt süreleri, hata oranları, LLM maliyet takibi
* **A/B Test Altyapısı:** Yeni özelliklerin etkisini ölçmek için kullanıcı segmentasyonu ve deney altyapısı *(ileri faz)*


## Yol Haritası (Roadmap)

Tüm özellikler aşağıdaki fazlarla önceliklendirilir. Her faz bir öncekinin tamamlanmasına bağlı değildir; paralel çalışma yapılabilir.

### Faz 1 — Temel Okuma Deneyimi (MVP)
* Kur'an okuma ekranı (mushaf sırası, ayet blokları, meal, transliterasyon)
* Kelime senkron sesli okuma (Arapça tilavet + Türkçe meal)
* Kapsamlı kelime sözlüğü (hızlı özet + detay sayfası)
* Kullanıcı kayıt (Apple/Google Sign-In)
* Mod seçimi ile onboarding
* Offline okuma altyapısı (yerel SQLite senkronizasyonu)
* 114 sure ilerleme matrisi (Okuduklarım)

### Faz 2 — Ezberleme ve Kişiselleştirme
* Ezber oturumları yönetim sayfası ve ezber stüdyosu (3 kademeli tur)
* Aralıklı tekrar algoritması (SM-2 / Leitner)
* Cihaz üzerinde STT (SFSpeechRecognizer) ile sesli ezber
* Ezber ilerleme matrisi (Ezberlediklerim)
* Dinamik ana ekran (günün kartları, akıllı devam kısayolları)
* Push notification ile ezber hatırlatmaları

### Faz 3 — Derin Analiz ve Yapay Zeka
* Kavram ağı ve interaktif DAG Explorer
* Morfolojik kök analiz motoru
* Kronolojik kavram evrimi (nüzul dönem analizi)
* Anlama çalışmaları (Agentic RAG oturumları) — *Pro*
* Detay oturumları (sistem tarafından hazırlanan) — *Free: statik, Pro: etkileşimli*
* Premium abonelik altyapısı (RevenueCat / StoreKit)

### Faz 4 — Topluluk, Sosyal ve Büyüme
* Topluluk kavram havuzu (paylaşım, beğenme, çatallama)
* Dinamik önizleme kartları (Open Graph, Story Generator)
* Derin bağlantılar (Deep Linking)
* Makale yayınlama ve Kur'an referans doğrulama
* Admin paneli ve içerik yönetimi
* Platform analitiği ve A/B test altyapısı
* Çoklu dil desteği genişletme (yeni çeviriler, TTS pipeline)
