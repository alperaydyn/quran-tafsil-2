#!/usr/bin/env node

/**
 * tafsil.net — ElevenLabs Kur'an Toplu Ayet Seslendirme & Timestamp Üretim Döngüsü (Batch Script)
 * 
 * Örnek Kullanımlar:
 * 1. Sadece Fatiha suresi:
 *    node data-pipeline/elevenlabs/batch.js --surah 1
 * 
 * 2. Belirli bir ses ve model ile:
 *    node data-pipeline/elevenlabs/batch.js --surah 112 --voice JBFqnCBsd6RMkjVDRZzb --model eleven_multilingual_v2
 * 
 * 3. Türkçe mealleri seslendirmek için:
 *    node data-pipeline/elevenlabs/batch.js --surah 1 --mode turkish
 * 
 * 4. Tüm Kur'an için (Tavsiye: önce 1-2 sure ile test ediniz):
 *    node data-pipeline/elevenlabs/batch.js --all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { synthesizeVerseWithTimestamps, getAyahData } from './service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parametreleri Parse Et
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    surah: null,
    ayah: null,
    all: false,
    mode: 'arabic', // 'arabic' | 'turkish'
    voice: 'JBFqnCBsd6RMkjVDRZzb', // George
    model: 'eleven_multilingual_v2',
    stability: 0.75,
    similarity: 0.85,
    style: 0.0,
    speakerBoost: true,
    delayMs: 1500, // İstekler arası bekleme (Rate limit koruması)
    skipExisting: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--surah' && args[i + 1]) options.surah = Number(args[++i]);
    else if (arg === '--ayah' && args[i + 1]) options.ayah = Number(args[++i]);
    else if (arg === '--all') options.all = true;
    else if (arg === '--mode' && args[i + 1]) options.mode = args[++i];
    else if (arg === '--voice' && args[i + 1]) options.voice = args[++i];
    else if (arg === '--model' && args[i + 1]) options.model = args[++i];
    else if (arg === '--stability' && args[i + 1]) options.stability = parseFloat(args[++i]);
    else if (arg === '--similarity' && args[i + 1]) options.similarity = parseFloat(args[++i]);
    else if (arg === '--style' && args[i + 1]) options.style = parseFloat(args[++i]);
    else if (arg === '--delay' && args[i + 1]) options.delayMs = Number(args[++i]);
    else if (arg === '--force') options.skipExisting = false;
  }

  return options;
}

// Uthmani dosyasından ayet listesini topla
function loadAllVerseKeys() {
  const uthmaniPath = path.resolve(__dirname, '../uthmani.txt');
  if (!fs.existsSync(uthmaniPath)) {
    throw new Error(`uthmani.txt bulunamadı: ${uthmaniPath}`);
  }

  const lines = fs.readFileSync(uthmaniPath, 'utf8').split('\n');
  const verses = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split('|');
    if (parts.length >= 4) {
      verses.push({
        surah: Number(parts[1]),
        ayah: Number(parts[2]),
        arabicText: parts[3]
      });
    }
  }

  return verses;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runBatch() {
  const opts = parseArgs();
  console.log(`\n========================================================`);
  console.log(`🚀 tafsil.net — ElevenLabs Toplu Ayet Seslendirme Döngüsü`);
  console.log(`========================================================`);
  console.log(`Mode:         ${opts.mode.toUpperCase()}`);
  console.log(`Voice ID:     ${opts.voice}`);
  console.log(`Model ID:     ${opts.model}`);
  console.log(`Settings:     Stability=${opts.stability}, Similarity=${opts.similarity}, Style=${opts.style}`);
  console.log(`İstek Aralığı: ${opts.delayMs}ms`);
  console.log(`Mevcutları Atla: ${opts.skipExisting}`);
  console.log(`========================================================\n`);

  const allVerses = loadAllVerseKeys();
  let targetVerses = allVerses;

  if (opts.surah) {
    targetVerses = targetVerses.filter(v => v.surah === opts.surah);
    if (opts.ayah) {
      targetVerses = targetVerses.filter(v => v.ayah === opts.ayah);
    }
  } else if (!opts.all) {
    console.log(`⚠️  Hedef belirtilmedi. Varsayılan olarak Fatiha Suresi (1. Sure) seçildi.`);
    console.log(`   (Tüm ayetler için '--all' parametresini kullanabilirsiniz)\n`);
    targetVerses = targetVerses.filter(v => v.surah === 1);
  }

  console.log(`Toplam işlenecek ayet sayısı: ${targetVerses.length}\n`);

  const outputDir = path.resolve(__dirname, 'output');
  const audioDir = path.join(outputDir, opts.mode === 'turkish' ? 'audio_tr' : 'audio');
  const timestampDir = path.join(outputDir, opts.mode === 'turkish' ? 'timestamps_tr' : 'timestamps');

  fs.mkdirSync(audioDir, { recursive: true });
  fs.mkdirSync(timestampDir, { recursive: true });

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < targetVerses.length; i++) {
    const item = targetVerses[i];
    const prefix = `${item.surah}_${item.ayah}`;
    const audioPath = path.join(audioDir, `${prefix}.mp3`);
    const jsonPath = path.join(timestampDir, `${prefix}.json`);

    // Mevcut dosya kontrolü
    if (opts.skipExisting && fs.existsSync(audioPath) && fs.existsSync(jsonPath)) {
      console.log(`[${i + 1}/${targetVerses.length}] ⏭️  Atlandı (zaten mevcut): Sure ${item.surah}, Ayet ${item.ayah}`);
      skipCount++;
      continue;
    }

    // Metni belirle
    let textToSynthesize = item.arabicText;
    if (opts.mode === 'turkish') {
      const vData = getAyahData(item.surah, item.ayah);
      textToSynthesize = vData.turkishTranslation;
      if (!textToSynthesize) {
        console.warn(`[${i + 1}/${targetVerses.length}] ⚠️  Türkçe meal bulunamadı: Sure ${item.surah}, Ayet ${item.ayah}`);
        failCount++;
        continue;
      }
    }

    console.log(`[${i + 1}/${targetVerses.length}] ⏳ Seslendiriliyor: Sure ${item.surah}, Ayet ${item.ayah} ("${textToSynthesize.substring(0, 35)}...")`);

    // Retry mantığı (en fazla 3 deneme)
    let attempts = 0;
    let success = false;

    while (attempts < 3 && !success) {
      attempts++;
      try {
        const result = await synthesizeVerseWithTimestamps({
          text: textToSynthesize,
          voiceId: opts.voice,
          modelId: opts.model,
          voiceSettings: {
            stability: opts.stability,
            similarity_boost: opts.similarity,
            style: opts.style,
            use_speaker_boost: opts.speakerBoost
          },
          audioOutputPath: audioPath,
          jsonOutputPath: jsonPath
        });

        console.log(`      ✅ Tamamlandı (${result.totalDuration.toFixed(2)}s, ${result.wordCount} kelime) -> ${path.basename(audioPath)}`);
        success = true;
        successCount++;
      } catch (err) {
        console.error(`      ❌ Deneme ${attempts} başarısız: ${err.message}`);
        if (attempts < 3) {
          console.log(`         5 saniye beklenip tekrar denenecek...`);
          await sleep(5000);
        } else {
          failCount++;
        }
      }
    }

    // İstekler arası bekleme
    if (i < targetVerses.length - 1) {
      await sleep(opts.delayMs);
    }
  }

  console.log(`\n========================================================`);
  console.log(`🎉 Batch İşlemi Bitti!`);
  console.log(`   Başarılı: ${successCount}`);
  console.log(`   Atlanan:  ${skipCount}`);
  console.log(`   Hatalı:   ${failCount}`);
  console.log(`   Sesler:   ${audioDir}`);
  console.log(`   Zamanlar: ${timestampDir}`);
  console.log(`========================================================\n`);
}

runBatch().catch(err => {
  console.error('Kritik Hata:', err);
  process.exit(1);
});
