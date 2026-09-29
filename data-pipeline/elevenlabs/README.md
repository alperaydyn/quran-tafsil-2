# ElevenLabs Ayet Seslendirme & Kelime Senkronizasyon Motoru

Bu modül, ElevenLabs API'sinin karakter seviyesi zaman damgası (`/v1/text-to-speech/{voice_id}/with-timestamps`) yeteneğini kullanarak Kur'an ayetlerini seslendirir, kelimelerin başlangıç/bitiş milisaniyelerini çıkarır ve interaktif bir stüdyo arayüzünde canlı karaoke eşliğinde deneme/finetune imkanı sunar.

---

## 1. Web Stüdyosu (Görsel Arayüz & Finetune)

Arayüzü başlatmak için:

```bash
# Proje kök dizininde veya data-pipeline altında:
node data-pipeline/elevenlabs/server.js
# veya
npm --prefix data-pipeline run studio
```

Tarayıcınızda açın:
👉 **`http://localhost:3030`**

### Özellikler:
- **Sure & Ayet Seçimi:** 114 sure ve ayet verisi (`uthmani.txt` ve meal dosyalarından otomatik beslenir).
- **Arapça Tilavet & Türkçe Meal:** İki dil seçeneği ve serbest metin düzenleme.
- **Canlı Finetune:** Stability, Similarity Boost, Style Exaggeration, Speaker Boost ayarları.
- **Canlı Karaoke Oynatıcı:** Ses çalarken okunan anlık kelime altın/zümrüt vurgu ile parlar.
- **Kelimeye Tıklayarak Atlama:** İstediğiniz kelimeye tıkladığınızda ses tam o kelimenin başladığı saniyeye atlar.
- **İndirme & JSON:** Ses dosyasını (.mp3) ve zaman damgalarını (.json) tek tıkla indirme.

---

## 2. Çekirdek Servis Fonksiyonu (`service.js`)

Node.js projelerinizde veya backend servislerinizde doğrudan fonksiyon olarak kullanabilirsiniz:

```javascript
import { synthesizeVerseWithTimestamps } from './data-pipeline/elevenlabs/service.js';

const result = await synthesizeVerseWithTimestamps({
  text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
  voiceId: "JBFqnCBsd6RMkjVDRZzb", // Örn: George, Daniel vb.
  modelId: "eleven_multilingual_v2",
  voiceSettings: {
    stability: 0.75,
    similarity_boost: 0.85,
    style: 0.0,
    use_speaker_boost: true
  },
  audioOutputPath: "output/audio/1_1.mp3",
  jsonOutputPath: "output/timestamps/1_1.json"
});

console.log("Kelime Sayısı:", result.wordCount);
console.log("Toplam Süre:", result.totalDuration);
console.log("Kelimeler:", result.words);
```

### Dönen Veri Yapısı:
```json
{
  "text": "قُلْ هُوَ اللَّهُ أَحَدٌ",
  "voiceId": "JBFqnCBsd6RMkjVDRZzb",
  "totalDuration": 1.486,
  "wordCount": 4,
  "words": [
    { "index": 0, "word": "قُلْ", "start": 0.000, "end": 0.255, "duration": 0.255 },
    { "index": 1, "word": "هُوَ", "start": 0.290, "end": 0.441, "duration": 0.151 },
    { "index": 2, "word": "اللَّهُ", "start": 0.464, "end": 0.801, "duration": 0.337 },
    { "index": 3, "word": "أَحَدٌ", "start": 0.848, "end": 1.486, "duration": 0.638 }
  ]
}
```

---

## 3. Toplu İşleme Döngüsü (Batch Automation)

Finetune ve denemeleriniz bittikten sonra tüm ayetleri bir döngüyle seslendirmek için:

```bash
# 1. Sadece belirli bir sure (Örn: Fatiha Suresi 1-7)
node data-pipeline/elevenlabs/batch.js --surah 1

# 2. İhlas Suresi (112. Sure) özel ses ayarlarıyla
node data-pipeline/elevenlabs/batch.js --surah 112 --voice JBFqnCBsd6RMkjVDRZzb --model eleven_multilingual_v2 --stability 0.75

# 3. Türkçe meal seslendirmesi için
node data-pipeline/elevenlabs/batch.js --surah 1 --mode turkish

# 4. Tüm Kur'an ayetleri için
node data-pipeline/elevenlabs/batch.js --all
```

### Parametreler:
| Parametre | Varsayılan | Açıklama |
|---|---|---|
| `--surah <no>` | `1` | İşlenecek sure numarası (1-114) |
| `--ayah <no>` | `hepsi` | Sadece belirli bir ayet |
| `--all` | `false` | Tüm Kur'an ayetlerini sırayla işler |
| `--mode` | `arabic` | `arabic` veya `turkish` |
| `--voice` | `JBFqnCBsd6RMkjVDRZzb` | ElevenLabs Voice ID |
| `--model` | `eleven_multilingual_v2` | `eleven_v4`, `eleven_v4_turbo`, `eleven_v3`, `eleven_multilingual_v2`, `eleven_turbo_v2_5` vb. |
| `--model` | `eleven_multilingual_v2` | Model adı |
| `--stability` | `0.75` | 0.00 - 1.00 arası kararlılık |
| `--similarity` | `0.85` | 0.00 - 1.00 arası benzerlik |
| `--delay` | `1500` | İstekler arası bekleme (ms) (Kota koruması) |
| `--force` | `false` | Daha önce üretilmiş dosyaların üzerine yazar |
