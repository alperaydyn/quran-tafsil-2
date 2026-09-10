# tafsil.net

## Kapsam:

Bu uygulama Kuran'ı okuyup detaylı şekilde anlama işini kolaylaştıran, kavramları Kuran ayetlerinden yola çıkarak anlamlandırmaya çalışan bir platformdur. Kullanıcıya kitap okur gibi Kuran okuma imkanı sunarken aynı zamanda kelime ve kavramları standart tefsir veya sözlük anlamlarına göre değil, Kuran'daki kullanım şekillerine göre anlamlandıran, kelimeler arasındaki ilişkileri kurarak Kuran'ın bütünsel bir anlayışını sunan bir platformdur.

Uygulamanın amacı kullanıcıya kolay ve akıcı bir okuma rahatlığı sunarken, kullanıcının detaylandırmak istediği konuları detaylar içerisinde kaybolmadan, detaydaki her bir bağlantıyı kişisel bir directed acyclic graph olarak takip edebileceği ve her bir detayı istediği zaman tekrar ziyaret edebilecek şekilde bookmark'layabileceği bir deneyim sunmaktır.

Akıcılık ve yapılandırılmış detay arasındaki denge/geçiş bu uygulamanın en önemli özelliğidir. Bu dengeyi sağlayabilmek için önyüz geliştirmesi kritik öneme sahiptir. Kullanıcı farklı cihazlar arasında geçiş yapabileceği gibi (telefon, tablet, bilgisayar) önyüz tasarımı hedef cihaz olan tablet/telefona göre optimize edilmelidir.

Uygulama kullanıcılar arası etkleşimi de desteklemektedir. Kullanıcılar oluşturdukları, geliştirdikleri kavramları diğer kullanıcılar ile isteğe bağlı paylaşabilirler, başkalarının paylaştığı kavramları like edip kendi kavram havuzlarına dahil edebilirler, başkalarının kavram ağlarını kendi kavram ağlarına dahil edebilirler. Yada kendi oluşturdukları kavram ağlarını başkalarının ziyaretine açabilirler. Kullanıcılar ayetleri ve/veya kavramları paylaşım için uygulamanın kendi iç paylaşım fonksiyonuna ilave olarak sosyal medyada da bu paylaşımlarını yayınlayabilir, uygulamanın kullanımını yaygınlaştırabilirler.


## Fonksiyonel Gereksinimler

### Veri Kaynağı:

Uygulamayı beslemek için Kuran belirli bir formatta sisteme beslenecektir. Bunlar Sure > Ayet Bloğu > Ayet > Cümle bloğu olarak beslenecektir. Sureler varsayılan olarak Kuran'daki nüzul sırasına göre yer alacaktır. Kullanıcı dilediği takdirde sureleri Kuran'daki mushaf sırasına göre de görüntüleyebilir. Buna karşılık ayetler kendi içerisinde anlam bağlılığı olacak şekilde gruplanacaktır. Her bir ayet de yine kendi içerisinde cümle ve/veya sub-sentence bloklarına ayrılacaktır. Her bir cümlede/sub-sentence'da kavramlar [<kavram>] şeklinde işaretlenecektir. 

### Kullanıcı Verisi:

Amaç kullanıcının tüm Kuran'ın tamamını anlayarak okumasını sağlamaktır. Bu süreçte kullanıcı dilediği zaman okumasını durdurup, anlamadım, detaylandır diyebilir veya sadece okumaya devam edebilir. Kullanıcının okuma logları, günlük okuma performansı, akıcı okuduğu, detayalndırdığı, merak ettiği kavramlar detaylı olarak loglanır, kullanıcının okuması sırasında bu kısımlar kullanıcıya hazır olarak sunulur. Burada amaç kullanıcının merakını ve ilgisini yüksek tutmak, bu sayede düzenli okuma alışkanlığı kazanmasını sağlamaktır. 

### Detay Sessionlar:

Sistem arka planda kullanıcı özelinde kişiselleştirilmiş analizler yaparak analiz session'ları hazırlar. Örneğin, kullanıcının detaya indiği, kelime detayı görüntülediği, birden fazla kez ziyaret ettiği sayfalar gibi işaretler kullanılarak bu işaretlerin yoğunlaştığı kavramlar üzerinde kişiselleştirilmiş bir detay session hazırlanır. Bu detay session'lar kullanıcının bir sonraki okuma seansı için veya dilediği zaman ziyaret edebileceği bir şekilde sunulur. Bu detay session'lar kişiselleştirilmiş olacak şekilde hazırlanırken, detay session'lar içerisindeki kavramlar, ayetler, cümleler arasındaki ilişki ağları yine kişiselleştirilmiş olarak oluşturulur. Kullanıcı dilediği zaman bu detay session'ları tekrar ziyaret edebilir, kendi kişisel kavram ilişkileri ağını takip edebilir, detayları tekrar ziyaret edebilir,bookmark'layabilir. Her bir kavramın, ayetin, cümlenin ne kadar detaylı incelendiği, ne kadar tekrar ziyaret edildiği gibi bilgiler ile kullanıcının ilgi alanları ve okuma alışkanlıkları analiz edilir ve kullanıcının okuma deneyimini daha keyifli hale getirmek için kullanılır. 

### Kavram Ağı:

Kavram'lar Kuran içerisinde belirli bir konuyu veya olayı ifade eden kelimelerdir. Bu kavramların Kuran içerisinde nasıl kullanıldığı, hangi bağlamlarda kullanıldığı, hangi ayetlerde kullanıldığı, hangi ayetlerde farklı anlamlara geldiği gibi bilgiler ile detaylı olarak incelenir. Kavram'lar Kuran içerisinden yapay zeka desteği ile çıkartılabileceği gibi zaman içerisinde kullanıcılar tarafından da geliştirilebilir. Kavram'ların oluşturulması ve geliştirilmesi sürecinde kullanıcıların katkısı teşvik edilir, kullanıcılar oluşturdukları, geliştirdikleri kavramları diğer kullanıcılar ile isteğe bağlı paylaşabilirler, başkalarının paylaştığı kavramları like edip kendi kavram havuzlarına dahil edebilirler. Yine oluşturulabilecek diğer bir kavram da kavramlar arası ilişkilerdir. Örneğin bir kavramın birden fazla kelime anlamı varsa bu kelime anlamları kavram ile ilişkilendirilebilir.

### Chatbot:

Kullanıcı uygulama içerisinde belirli konularda bir chatbot ile sohbet edebilmekte, anlamadığı veya kafasına takılan konular için soru sorabilmekte ve chatbot'tan detaylı cevaplar alabilmektedir. Chatbot'un cevapları tamamen Kuran içerisinde alıntılar ve yine kavram ağları üzerinden oluşturulmakta, kullanıcıya kavram ağları ile birlikte sunulmaktadır. Her chat session'ının intenti kullanıcının profilinde tutularak a) kullanıcının merak alanları b) anlama gelişimi c) Kuran okuma motivasyonunu artıracak içerik hazırlanması amacıyla kullanılacaktır.

### Morfolojik Kök Analiz Motoru (Root & Lexicon Engine):

Geliştirici ekibin veri tabanı modellemesi ve servis mimarisinde temel alacağı dilbilimsel altyapıdır. Sistemin amacı kavramlar arası semantik bağı rastgele etiketlerle değil, Kur'an'ın kendi Arapça kök matematiğiyle doğrulamaktır:
* **Veri Modeli ve Şema:** Her kelime (token) veri tabanında üçlü/dörtlü Arapça kök harfleri (örn. *s-l-m*, *k-f-r*), lemma (sözlük kök biçimi), bâb/vezin kalıbı, morfolojik türü (fiil, isim, harf, sıfat) ve gramatikal rolü (özne, nesne, cer hali vb.) ile modellenir.
* **Türev ve Frekans Matrisi:** Bir köke bağlı tüm türev kelimelerin Kur'an genelindeki dağılımı, hangi surelerde hangi formlarda kaçar kez yer aldığı ilişkisel olarak indekslenir.
* **Semantik Eşleme Servisi:** Kavramlar (`[<kavram>]`) bu kök ve kalıp bilgileriyle ilişkilendirilir; böylece aynı kökten gelen farklı kelimeler arasındaki anlam kaymaları ve nüanslar deterministik bir API üzerinden sorgulanabilir.

### İnteraktif Kavram Ağı Görselleştiricisi (DAG Explorer):

Kullanıcının kavramlar ve ayetler arasındaki ilişkileri keşfettiği, Canvas / WebGL (veya mobil uyumlu SVG) tabanlı dinamik grafik arayüzüdür:
* **Düğüm (Node) Tipleri:** Merkezde kavramlar, kavramlara bağlı ayet/cümle blokları ve kullanıcının kişisel tefekkür notları yer alır.
* **Kenar (Edge) Semantiği:** Düğümler arasındaki bağlantılar anlamsal tiplerle etiketlenir (zıt anlam, kapsama/hiyerarşi, sebep-sonuç, benzerlik, atıf).
* **Etkileşim ve Performans:** Dokunmatik ekranlarda akıcı pan, zoom ve odaklama (pinch-to-zoom, node expansion) desteklenir. Düğüme tıklandığında ilgili ayet parçacıkları bağlamıyla genişler.
* **Katman Yönetimi:** Kullanıcı kendi kişisel grafiği, platformun global kavram ağı ve diğer kullanıcıların paylaştığı kavram ağları arasında filtreler aracılığıyla tek dokunuşla geçiş yapabilir.

### Kronolojik Kavram Evrimi (Nüzul Zaman Tüneli):

Surelerin iniş sırası mantığını kavramların tarihsel anlam genişlemesine uyarlayan görsel analiz aracıdır:
* **Görsel Tasarım & UI Düzeni:**
  * **Eksen ve Akış:** Mobil ve tablette dikey (vertical timeline), geniş ekranlarda yatay kaydırılabilir (stepper/timeline) akış çizgisi. Çizgi üzerinde ilerlemeyi gösteren interaktif bir scrubber/slider yer alır.
  * **Dönemsel Şeritler (Zaman Dilimleri):** Arka planda nüzul dönemleri renk kodlu bantlarla ayrıştırılır: Erken Mekke, Orta Mekke, Geç Mekke ve Medine Dönemi.
  * **Durak Kartları (Milestones):** Seçilen kavramın geçtiği her bir ayet bloğu çizgi üzerinde bir durak kartı olarak temsil edilir; kart üzerinde ayet numarası, nüzul sırası ve tarihi bağlam özeti bulunur.
  * **Anlam Genişlemesi Rozetleri (Semantic Badges):** Kavramın sonraki duraklarda kazandığı yeni anlam boyutları kart üzerinde vurgulu rozetler/chipler halinde (örn. *"Mekke: Bireysel İbadet"* → *"Medine: Toplumsal Hüküm/Cemaat"*) gösterilir.

### Kapsamlı Kelime Sözlüğü ve İnceleme Katmanı (Word-by-Word & Lexicon):

Kur'an metninde geçen istisnasız **bütün kelimeler** için kademeli ve derinlemesine bir sözlük deneyimi sunulur:
* **Özel Kelime Sayfaları (`/kelime/:id`):** Kur'an'daki her kelimenin benzersiz bir detay sayfası bulunur.
* **1. Aşama - Hızlı Özet Paneli (İlk Tıklama):**
  * Okuma akışı sırasında herhangi bir kelimeye dokunulduğunda akışı kesmeyen hafif bir alt panel (bottom-sheet / pop-up) açılır.
  * Bu panelde kelimenin o ayetteki **en yakın bağlamsal anlamı** ve en yaygın **alternatif mealleri/anlamları** özet olarak listelenir.
* **2. Aşama - Derinlemesine Kelime Sayfası ("Detay" Butonu ile Geçiş):**
  * Özet panelindeki "Detay" butonuna basıldığında kelimenin kendi sayfasına gidilir.
  * **Kur'an İçi Örnek Kullanımlar:** Kelimenin geçtiği diğer tüm ayetler ve farklı bağlamlardaki karşılıkları.
  * **Klasik Sözlük Kaynakları:** Kelimenin nüzul dönemindeki kök anlamlarını açıklayan eski dönem klasik sözlük kayıtları (Ragıb el-İsfahani - el-Müfredat, Lisanü'l-Arab, Tacü'l-Arus vb.).
  * **Gramer & İ'rab:** Kelimenin cümle içindeki nahiv/morfolojik analizi.

### Aralıklı Tekrar ile Ezberleme Sistemi (Spaced Repetition Memorization):

Uygulamanın aralıklı tekrar altyapısı (SM-2 / Leitner algoritması), kullanıcının Kur'an ayet ve cümlelerini kalıcı olarak ezberlemesi amacıyla çalışır:
* **Ezber Kartları:** Ayetler anlamlı cümle/sub-sentence parçalarına ayrılarak ezber kartlarına dönüştürülür.
* **Sesli ve Yazılı Destek Katmanları:**
  * **Arapça Orijinal Ses:** Seçkin kârilerden her ayet/cümle parçacığı için yüksek kaliteli, duraklamalı sesli tilavet desteği.
  * **Kullanıcının Dilinde Transliterasyon:** Kullanıcının seçtiği arayüz diline uygun doğru okunuş transkripsiyonu (örn. Türkçe için: *"Kul hüvellâhu ehad"*), Arapça bilmeyen veya telaffuzunu pekiştirmek isteyen kullanıcılar için anlık olarak gösterilir.
* **Akıllı Tekrar Algoritması:** Kullanıcının hatırlama geri bildirimine göre ("Kolay", "İyi", "Zor", "Tekrar") sonraki tekrar zamanı optimize edilir; günlük mikro ezber oturumları ve hafıza pekiştirme seansları oluşturulur.

### Artırılmış Etkileşim ve Dinamik Ana Ekran (Dashboard & Engagement):
Kullanıcı platforma giriş yaptığında kişiselleştirilmiş bir motivasyon ve yönlendirme merkeziyle karşılanır. Amaç kullanıcının günlük tefekkür ve okuma disiplinini diri tutmaktır:
* **Görselleştirilmiş Okuma İstatistikleri (Daha Az Teknik Aktivite Grafiği):**
  * GitHub benzeri kareli ısı haritası (activity heatmap) mantığıyla çalışan fakat teknik olmayan, kullanıcı dostu ve estetik bir "Okuma & Tefekkür Bahçesi".
  * Günlük okunan ayet miktarı, incelenen kavram derinliği ve tamamlanan ezber oturumları renk tonları ve seviye rozetleriyle görselleştirilir.
* **Akıllı Devam Kısayolları (Smart Resume):**
  * Ana ekranın en görünür alanında doğrudan aksiyona geçiren 3 temel buton:
    1. *"Kaldığım Yerden Devam Et"* (Son okunan ayet/cümle bloğuna tek tıkla dönüş)
    2. *"Ezberlemeye Devam Et"* (Günün aralıklı tekrar kartlarını anında başlatma)
    3. *"En Son Detay Oturumuna Devam Et"* (Yarım bırakılan kavram ağı ve DAG analiz oturumuna odaklanma)
* **Günün İlham Kartları (Daily Micro-Cards):**
  * Kullanıcıyı güne başlarken veya gün içinde karşılayan 3 dinamik kart:
    * **Günün Ayeti:** Evrensel hikmet ve farkındalık barındıran seçkin ayet bloğu.
    * **Günün Kur'an Duası:** Kur'an içerisinde doğrudan peygamberlerin ve salihlerin ettiği dualar (*"Rabbena..."*, *"Rabbi..."*).
    * **Günün Namaz / İbadet Ayeti:** Huşu, namaz ve tefekkür bilincini besleyen odak ayet.
  * Kartlara tıklandığında doğrudan ilgili ayetin kavram ağına ve detay sayfasına geçiş yapılabilir.
* **Günlük Makaleler & Referans İçerik Akışı (Curated Articles):**
  * Adminler, kullanıcılar ve davetli referans araştırmacılar platformda kavramsal analiz ve tefekkür makaleleri yayımlayabilir.
  * Makaleler kullanıcının son incelediği kavramlar ve ilgi alanlarına göre ana ekranda önerilir.
* **Kur'an Referans Doğrulama Mekanizması (Quran-Reference Verification):**
  * Platformun temel vizyonunu korumak adına (Kur'an merkezli analiz ilkesi), sisteme eklenen makaleler için akıllı bir doğrulama katmanı kurgulanacaktır:
    * **Ayet Referans Ayrıştırma:** Makale içerisindeki ayet atıfları (`[Sure:Ayet]`, mealler veya Arapça metinler) otomatik ayrıştırılır.
    * **Kur'an Uyumluluk & Dayanak Skoru:** Yapay zeka ve kural tabanlı analiz ile makalenin iddialarını gerçekten Kur'an metnine dayandırıp dayandırmadığı, harici spekülasyon veya bağlam dışı yorum içerip içermediği puanlanır.
    * **Onay ve Etiketleme:** Yeterli Kur'an dayanağına sahip olan ve editör süzgecinden geçen makaleler *"Kur'an Referanslı Doğrulanmış İçerik"* rozetiyle öne çıkarılır.


## Genel Tasarım İlkeleri

* **Premium ve Elit Tasarım Hissiyatı:**
  * Alışılageldik, geleneksel ve klişe dini uygulama tasarımlarından (ağır tezhip desenleri, aşırı altın/yeşil varak süslemeleri, hantal çerçeveler) tamamen uzak.
  * Modern, minimalist, yüksek kaliteli editoryal tipografi (okunabilirliği yüksek serif/sans-serif font eşleşmeleri), ferah negatif alan (whitespace) kullanımı ve zarif mikro etkileşimler ile elit bir dijital yayın/çalışma platformu hissi.

* **Kullanıcının Niyetine Göre Farklılaştırılmış Önyüz Modları (Intent-Driven Adaptive UI):**
  Platform, kullanıcının geliş amacına ve dünyasına göre arayüzü, etkileşim yoğunluğunu ve dilini 3 farklı modda dinamik olarak uyarlar:

  1. **Mod A: Araştırmacı / Seküler (Sadece Merak ve Anlama Odaklı):**
     * **Oyunlaştırma Yok:** Ezber yönlendirmeleri, motivasyon rozetleri, streak'ler ve dini hatırlatıcılar tamamen devre dışıdır.
     * **Yalnızca Anlama ve Çeviri:** Arapça orijinal metinler arayüzü kalabalıklaştırmamak adına varsayılan olarak kapalıdır; modern dildeki akıcı çeviriye odaklanılır.
     * **Proaktif Bağlamsal Açıklamalar:** Tartışmalı, günümüz dünyasında sorgulanan veya yanlış anlaşılmaya müsait ayetlerde (tarihsel, sosyolojik veya linguistik arka plan) kullanıcı henüz talep etmeden satır içi/kenar notu (inline/margin callout) şeklinde rasyonel açıklamalar sunulur.
     * Felsefi, edebi ve entelektüel bir okuma ortamı sağlar.

  2. **Mod B: Öğrenen / Giriş Seviye Dindar (Eğitim ve Motivasyon Öncelikli):**
     * **Öğretme ve Sorgulama:** Kullanıcıyı kavramları derinlemesine keşfetmeye ve ayetler üzerinde düşünmeye yönlendiren rehberli deneyim.
     * **Tutundurma ve Motivasyon:** Okuma alışkanlığı kazandırmaya yönelik hafif oyunlaştırma, ısı haritası, günün ilham kartları ve teşvik edici geri bildirimler aktiftir.
     * **Dengeli Katman:** Hem Türkçe meal hem transliterasyon hem de temel kelime seviyesi kavram kartları bir arada sunulur.

  3. **Mod C: İleri Seviye / Odaklı Okuyucu (Derinleşme ve Tilavet Odaklı):**
     * **Minimum Müdahale (Distraction-Free):** Düzenli tilavet ve okumayı amaçlayan, oyunlaştırma ve sürekli kesintilerden (interruptions) arındırılmış sakin arayüz.
     * **Arapça Metin Önceliği:** Yüksek kaliteli orijinal mushaf hattı/Arapça tipografi merkezdedir. Transliterasyon opsiyonel olarak tamamen kapatılabilir.
     * **Sadece Dinleme Modu (Audio-Only Mode):** Ekranı takip etmek yerine sadece dinlemek isteyenler için kilit ekranı ve arka plan oynatımıyla uyumlu, minimal ses çalar ve ayet takibi deneyimi.

