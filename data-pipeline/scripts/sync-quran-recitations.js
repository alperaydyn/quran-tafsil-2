#!/usr/bin/env node

/**
 * tafsil.net — Quran Audio & Word Timestamps ETL Pipeline
 * 
 * 114 surenin tamamını Quran.com API'sinden çeker:
 * - Orijinal Kâri (Mişari Raşid el-Afasi) stüdyo kayıtlarını indirir.
 * - ffmpeg ile deterministik ve kayıpsız (-c copy) olarak ayet parçacıklarına böler.
 * - Her ayet için bağımsız normalize edilmiş kelime zaman damgalarını (startMs, endMs) JSON olarak kaydeder.
 * 
 * İsimlendirme Formatı:
 *   Ses Dosyası:       output/audio/{surah}_{ayah}.mp3
 *   Timestamp Dosyası: output/timestamps/{surah}_{ayah}.json
 *   Sure Toplu JSON:   output/timestamps/surahs/{surah}.json
 * 
 * Kullanım Örnekleri:
 *   node scripts/sync-quran-recitations.js --surah 1             # Sadece Fatiha Suresi (Test)
 *   node scripts/sync-quran-recitations.js --from 112 --to 114   # İhlas, Felak, Nas
 *   node scripts/sync-quran-recitations.js --all                 # Tüm 114 Sure (Full Kur'an)
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dizinler
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'output');
const AUDIO_DIR = path.join(OUTPUT_DIR, 'audio');
const TIMESTAMPS_DIR = path.join(OUTPUT_DIR, 'timestamps');
const SURAH_TIMESTAMPS_DIR = path.join(TIMESTAMPS_DIR, 'surahs');
const CACHE_DIR = path.join(ROOT_DIR, 'cache', 'surah_audio');

// Varsayılan Kâri: 7 = Mishari Rashid Alafasy
const DEFAULT_RECITER_ID = 7;
const RECITER_NAME = "Mishari Rashid al-`Afasy";

// Parametreleri Parse Et
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    all: false,
    surah: null,
    from: null,
    to: null,
    reciterId: DEFAULT_RECITER_ID,
    skipExisting: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--all') options.all = true;
    else if (arg === '--surah' && args[i + 1]) options.surah = Number(args[++i]);
    else if (arg === '--from' && args[i + 1]) options.from = Number(args[++i]);
    else if (arg === '--to' && args[i + 1]) options.to = Number(args[++i]);
    else if (arg === '--reciter' && args[i + 1]) options.reciterId = Number(args[++i]);
    else if (arg === '--force') options.skipExisting = false;
  }

  return options;
}

// Dosya indirme (Streaming fetch)
async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`İndirme başarısız (${res.status}): ${url}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

// ffmpeg ile kayıpsız ses kesme (-c copy)
function splitAudioWithFfmpeg(inputPath, outputPath, startSec, endSec) {
  return new Promise((resolve, reject) => {
    // startSec ve endSec'i saniye cinsinden formatla (örn: 6.090)
    const ss = String(startSec);
    const to = String(endSec);

    const args = [
      '-y',               // Üzerine yaz
      '-ss', ss,          // Başlangıç zamanı
      '-to', to,          // Bitiş zamanı
      '-i', inputPath,    // Giriş dosyası
      '-c', 'copy',       // Kayıpsız kopyalama (re-encoding yok)
      outputPath
    ];

    const proc = spawn('ffmpeg', args);
    let stderr = '';

    proc.stderr.on('data', data => {
      stderr += data.toString();
    });

    proc.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg hatası (kod ${code}): ${stderr.slice(-200)}`));
      }
    });

    proc.on('error', err => {
      reject(err);
    });
  });
}

// Bir sureyi işle
async function processSurah(surahNumber, reciterId, skipExisting) {
  console.log(`\n------------------------------------------------------------`);
  console.log(`📖 Sure ${surahNumber} İşleniyor...`);
  console.log(`------------------------------------------------------------`);

  // 1. Quran.com API'sinden Segment & Timestamp Verisini Çek
  const apiUrl = `https://api.quran.com/api/v4/chapter_recitations/${reciterId}/${surahNumber}?segments=true`;
  const apiRes = await fetch(apiUrl);
  if (!apiRes.ok) {
    throw new Error(`Sure ${surahNumber} için API yanıt vermedi: ${apiRes.status}`);
  }

  const apiData = await apiRes.json();
  const audioFile = apiData.audio_file;
  if (!audioFile || !audioFile.timestamps || audioFile.timestamps.length === 0) {
    throw new Error(`Sure ${surahNumber} için audio_file veya timestamps bulunamadı.`);
  }

  // 2. Sure MP3 Ses Dosyasını İndir / Önbellekten Al
  const surahMp3Url = audioFile.audio_url;
  const cachedSurahMp3 = path.join(CACHE_DIR, `surah_${surahNumber}.mp3`);

  if (!fs.existsSync(cachedSurahMp3)) {
    console.log(`⏳ Sure MP3 indiriliyor: ${surahMp3Url}`);
    await downloadFile(surahMp3Url, cachedSurahMp3);
    console.log(`✅ Sure MP3 indirildi: surah_${surahNumber}.mp3 (${(fs.statSync(cachedSurahMp3).size / 1024 / 1024).toFixed(2)} MB)`);
  } else {
    console.log(`⚡ Sure MP3 önbellekten kullanılıyor: surah_${surahNumber}.mp3`);
  }

  const ayahTimestampsList = audioFile.timestamps;
  console.log(`📊 Toplam ayet sayısı: ${ayahTimestampsList.length}`);

  const surahAyahsNormalized = [];

  // 3. Her Ayeti ffmpeg ile Kes ve Zaman Damgalarını Normalize Et
  for (let idx = 0; idx < ayahTimestampsList.length; idx++) {
    const item = ayahTimestampsList[idx];
    const [sNo, aNo] = item.verse_key.split(':').map(Number);

    const baseName = `${sNo}_${aNo}`;
    const outputAudioPath = path.join(AUDIO_DIR, `${baseName}.mp3`);
    const outputJsonPath = path.join(TIMESTAMPS_DIR, `${baseName}.json`);

    const fromMs = item.timestamp_from;
    const toMs = item.timestamp_to;
    const durationMs = item.duration || (toMs - fromMs);

    // Ayet bazlı normalizasyon: Ayet başlangıcı 0 ms kabul edilir
    const normalizedWords = (item.segments || []).map(([wordIndex, startMs, endMs]) => {
      const relStart = Math.max(0, startMs - fromMs);
      const relEnd = Math.max(0, endMs - fromMs);
      return {
        position: wordIndex,
        startMs: relStart,
        endMs: relEnd,
        durationMs: relEnd - relStart
      };
    });

    const ayahMetadata = {
      surah: sNo,
      ayah: aNo,
      verseKey: item.verse_key,
      reciterId,
      reciterName: RECITER_NAME,
      timestampFromGlobalMs: fromMs,
      timestampToGlobalMs: toMs,
      durationMs,
      audioFile: `${baseName}.mp3`,
      wordCount: normalizedWords.length,
      words: normalizedWords,
      processedAt: new Date().toISOString()
    };

    surahAyahsNormalized.push(ayahMetadata);

    // Dosya kontrolü (Atla/Yeniden üret)
    const audioExists = fs.existsSync(outputAudioPath);
    const jsonExists = fs.existsSync(outputJsonPath);

    if (skipExisting && audioExists && jsonExists) {
      continue;
    }

    // ffmpeg kesimi (Kayıpsız)
    const startSec = (fromMs / 1000).toFixed(3);
    const endSec = (toMs / 1000).toFixed(3);

    try {
      await splitAudioWithFfmpeg(cachedSurahMp3, outputAudioPath, startSec, endSec);
    } catch (ffmpegErr) {
      console.error(`❌ ffmpeg kesim hatası (${baseName}):`, ffmpegErr.message);
    }

    // Ayet JSON'unu kaydet
    fs.writeFileSync(outputJsonPath, JSON.stringify(ayahMetadata, null, 2), 'utf8');
  }

  // 4. Sure Toplu JSON'unu Kaydet
  const surahCompositeJsonPath = path.join(SURAH_TIMESTAMPS_DIR, `${surahNumber}.json`);
  const surahComposite = {
    surah: surahNumber,
    ayahCount: ayahTimestampsList.length,
    reciterId,
    reciterName: RECITER_NAME,
    ayahs: surahAyahsNormalized,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(surahCompositeJsonPath, JSON.stringify(surahComposite, null, 2), 'utf8');

  console.log(`✅ Sure ${surahNumber} tamamlandı!`);
  console.log(`   - Ayet MP3'leri:     ${AUDIO_DIR}/${surahNumber}_*.mp3`);
  console.log(`   - Ayet JSON'ları:    ${TIMESTAMPS_DIR}/${surahNumber}_*.json`);
  console.log(`   - Sure Toplu JSON:   ${surahCompositeJsonPath}`);
}

// Ana Fonksiyon
async function main() {
  const opts = parseArgs();

  // Çıktı dizinlerini hazırla
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(TIMESTAMPS_DIR, { recursive: true });
  fs.mkdirSync(SURAH_TIMESTAMPS_DIR, { recursive: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  console.log(`============================================================`);
  console.log(`🕋 tafsil.net — Kur'an Ses & Kelime Senkronizasyon Pipeline`);
  console.log(`============================================================`);
  console.log(`Kâri:        ${RECITER_NAME} (ID: ${opts.reciterId})`);
  console.log(`Hedef Ses:   ${AUDIO_DIR}`);
  console.log(`Hedef Zaman: ${TIMESTAMPS_DIR}`);
  console.log(`Mevcut Atla: ${opts.skipExisting}`);
  console.log(`============================================================\n`);

  // Hangi sureler işlenecek?
  let surahsToProcess = [];

  if (opts.surah) {
    surahsToProcess = [opts.surah];
  } else if (opts.from && opts.to) {
    for (let s = opts.from; s <= opts.to; s++) {
      surahsToProcess.push(s);
    }
  } else if (opts.all) {
    for (let s = 1; s <= 114; s++) {
      surahsToProcess.push(s);
    }
  } else {
    // Parametre verilmediyse varsayılan Fatiha (1. Sure)
    console.log(`ℹ️  Parametre girilmedi. Test amaçlı Sure 1 (Fatiha) işlenecek.`);
    console.log(`   Tüm Kur'an için:  node scripts/sync-quran-recitations.js --all`);
    console.log(`   Aralık için:      node scripts/sync-quran-recitations.js --from 1 --to 10\n`);
    surahsToProcess = [1];
  }

  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < surahsToProcess.length; i++) {
    const sNo = surahsToProcess[i];
    console.log(`\n[${i + 1}/${surahsToProcess.length}] İşlem sırası: Sure ${sNo}`);
    try {
      await processSurah(sNo, opts.reciterId, opts.skipExisting);
      successCount++;
    } catch (err) {
      console.error(`❌ Sure ${sNo} işlenirken hata oluştu:`, err.message);
      failCount++;
    }
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n============================================================`);
  console.log(`🎉 TÜM İŞLEMLER TAMAMLANDI! (${elapsedSec} saniye)`);
  console.log(`   Başarılı Sureler: ${successCount}`);
  console.log(`   Hatalı Sureler:   ${failCount}`);
  console.log(`   Ses Formatı:      {surah}_{ayah}.mp3`);
  console.log(`   Timestamp:        {surah}_{ayah}.json`);
  console.log(`============================================================\n`);
}

main().catch(err => {
  console.error('Kritik Hata:', err);
  process.exit(1);
});
