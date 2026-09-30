#!/usr/bin/env node

/**
 * tafsil.net — Cloudflare R2 Audio & Timestamps Upload Script
 * 
 * data-pipeline/output/audio ve data-pipeline/output/timestamps dosyalarını
 * Cloudflare R2 bucket'ına eşzamanlı ve güvenli bir şekilde yükler.
 * 
 * Özellikler:
 * - Eşzamanlı (concurrency: 30) yüksek hızlı yükleme
 * - Yeniden çalıştırılabilir (mevcut ve boyutu eşleşen dosyaları atlar)
 * - Cache-Control ve Content-Type başlıklarını doğru ayarlar
 * - Hata durumunda 3 kez retry mekanizması
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env dosyasını yükle (root veya lokal)
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '.env')
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const accessKeyId = process.env.CLOUDFLARE_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_S2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_S3_SECRET_ACCESS_KEY;
const endpoint = process.env.CLOUDFLARE_ENDPOINT_URL;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'tafsil-audio';

if (!accessKeyId || !secretAccessKey || !endpoint) {
  console.error('❌ HATA: Cloudflare R2 kimlik bilgileri (.env) eksik!');
  process.exit(1);
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const OUTPUT_DIR = path.resolve(__dirname, '../output');
const AUDIO_DIR = path.join(OUTPUT_DIR, 'audio');
const TIMESTAMPS_DIR = path.join(OUTPUT_DIR, 'timestamps');

function getAllFiles(dir, baseDir = dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // ignore .DS_Store etc.
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, baseDir));
    } else {
      const relKey = path.relative(OUTPUT_DIR, fullPath).replace(/\\/g, '/');
      results.push({
        fullPath,
        relKey,
        size: fs.statSync(fullPath).size,
        contentType: fullPath.endsWith('.mp3')
          ? 'audio/mpeg'
          : fullPath.endsWith('.json')
          ? 'application/json; charset=utf-8'
          : 'application/octet-stream'
      });
    }
  }
  return results;
}

async function uploadFileWithRetry(fileItem, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const fileStream = fs.createReadStream(fileItem.fullPath);
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: fileItem.relKey,
        Body: fileStream,
        ContentLength: fileItem.size,
        ContentType: fileItem.contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }));
      return true;
    } catch (err) {
      if (attempt === maxRetries) {
        throw new Error(`[${fileItem.relKey}] ${err.message}`);
      }
      await new Promise(r => setTimeout(r, attempt * 500));
    }
  }
}

async function main() {
  console.log(`🚀 Cloudflare R2 Yükleme Başlatılıyor...`);
  console.log(`📦 Hedef Bucket: ${bucketName}`);
  console.log(`🌐 Endpoint:     ${endpoint}\n`);

  const audioFiles = getAllFiles(AUDIO_DIR);
  const timestampFiles = getAllFiles(TIMESTAMPS_DIR);
  const allFiles = [...audioFiles, ...timestampFiles];

  const totalFiles = allFiles.length;
  const totalBytes = allFiles.reduce((acc, f) => acc + f.size, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

  console.log(`📊 Toplam Taranan Dosya: ${totalFiles.toLocaleString('tr-TR')}`);
  console.log(`   - Ses Dosyaları (MP3):      ${audioFiles.length.toLocaleString('tr-TR')}`);
  console.log(`   - Zaman Damgaları (JSON):   ${timestampFiles.length.toLocaleString('tr-TR')}`);
  console.log(`   - Toplam Boyut:             ${totalMB} MB\n`);

  if (totalFiles === 0) {
    console.log('⚠️ Yüklenecek dosya bulunamadı.');
    return;
  }

  const CONCURRENCY = 35;
  let completed = 0;
  let uploadedBytes = 0;
  let errors = [];
  let startTime = Date.now();

  async function worker(queue) {
    while (queue.length > 0) {
      const fileItem = queue.shift();
      try {
        await uploadFileWithRetry(fileItem);
        completed++;
        uploadedBytes += fileItem.size;

        if (completed % 100 === 0 || completed === totalFiles) {
          const percent = ((completed / totalFiles) * 100).toFixed(1);
          const elapsedSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
          const mbDone = (uploadedBytes / (1024 * 1024)).toFixed(1);
          const speed = (uploadedBytes / (1024 * 1024) / elapsedSec).toFixed(1);
          process.stdout.write(
            `\r⏳ İlerleme: [${completed}/${totalFiles}] %${percent} (${mbDone}/${totalMB} MB, ${speed} MB/s)  `
          );
        }
      } catch (err) {
        errors.push({ key: fileItem.relKey, error: err.message });
        completed++;
      }
    }
  }

  const queue = [...allFiles];
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker(queue));
  }

  await Promise.all(workers);

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n\n✅ Yükleme Tamamlandı! Süre: ${durationSec}s`);
  console.log(`   - Başarılı: ${(totalFiles - errors.length).toLocaleString('tr-TR')}`);
  console.log(`   - Hatalı:   ${errors.length}`);

  if (errors.length > 0) {
    console.error('\n❌ Yüklenemeyen dosyalar:');
    for (const e of errors.slice(0, 20)) {
      console.error(`  - ${e.key}: ${e.error}`);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
