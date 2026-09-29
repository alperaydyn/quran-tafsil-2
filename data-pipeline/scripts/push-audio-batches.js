/**
 * tafsil.net — Push Audio Files in Safe Batches
 * 
 * 1.6 GB'lık ayet ses dosyalarını (6236 MP3) GitHub'ın paket boyut sınırını aşmadan
 * kontrollü sure grupları halinde commit edip push eder.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIO_DIR = path.resolve(__dirname, '../output/audio');

// Sure grupları: Büyük sureler tek tek, küçük sureler toplu
function getBatches() {
  const batches = [];

  // Büyük sureler (Tek tek gönderilir)
  const largeSurahs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 17, 18, 20, 26, 37];
  
  let currentBatch = [];
  let currentAyahCount = 0;

  for (let s = 1; s <= 114; s++) {
    if (largeSurahs.includes(s)) {
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
        currentBatch = [];
        currentAyahCount = 0;
      }
      batches.push([s]);
    } else {
      currentBatch.push(s);
      if (currentBatch.length >= 8) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    }
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

async function main() {
  const batches = getBatches();
  console.log(`🚀 Toplam ${batches.length} paket halinde ses dosyaları gönderilecek.\n`);

  for (let i = 0; i < batches.length; i++) {
    const surahs = batches[i];
    const surahStr = surahs.length === 1 ? `Sure ${surahs[0]}` : `Sureler ${surahs[0]}-${surahs[surahs.length - 1]}`;

    console.log(`[${i + 1}/${batches.length}] ⏳ Ekleniyor: ${surahStr}...`);

    let fileCount = 0;
    for (const s of surahs) {
      try {
        execSync(`git add "data-pipeline/output/audio/${s}_*.mp3"`, { stdio: 'pipe' });
      } catch (e) {
        // Dosya yoksa veya hata verirse
      }
    }

    // Değişiklik var mı kontrol et
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    const hasStaged = status.split('\n').some(line => line.startsWith('A ') || line.startsWith('M '));

    if (!hasStaged) {
      console.log(`   ⏭️  Atlandı (zaten commit edilmiş)`);
      continue;
    }

    try {
      execSync(`git commit -m "feat(audio): Ayet sesleri (${surahStr})"`, { stdio: 'pipe' });
      console.log(`   📦 Commit yapıldı. GitHub'a push ediliyor...`);
      execSync('git push origin main', { stdio: 'pipe' });
      console.log(`   ✅ Başarıyla push edildi!\n`);
    } catch (err) {
      console.error(`   ❌ Hata: ${err.message}`);
      // Retry once after 3 seconds
      try {
        console.log(`   🔄 3 sn sonra tekrar deneniyor...`);
        execSync('sleep 3');
        execSync('git push origin main', { stdio: 'pipe' });
        console.log(`   ✅ Retry ile push edildi!\n`);
      } catch (retryErr) {
        console.error(`   ❌ Tekrar deneme de başarısız oldu. Duruluyor.`);
        process.exit(1);
      }
    }
  }

  console.log(`🎉 TÜM SES DOSYALARI BAŞARIYLA PUSH EDİLDİ!`);
}

main().catch(err => {
  console.error('Kritik Hata:', err);
  process.exit(1);
});
