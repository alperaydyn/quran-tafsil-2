/**
 * tafsil.net — Generate Compact Word Timestamps for Mobile App & Web
 * 
 * 114 surenin kelime zaman damgalarını mobil uygulama ve web için
 * ultra-kompakt tek bir JSON haritasına dönüştürür.
 * 
 * Format:
 *   {
 *     "1:1": [[0, 580], [580, 1409], [1409, 2502], [2502, 5840]],
 *     "1:2": [[0, 935], [935, 1795], [1795, 2425], [2425, 5460]],
 *     ...
 *   }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const SURAHS_DIR = path.join(ROOT_DIR, 'output', 'timestamps', 'surahs');
const MOBILE_TARGET_DIR = path.resolve(__dirname, '../../tafsil-ios-app/src/data');
const TARGET_FILE = path.join(MOBILE_TARGET_DIR, 'word_timestamps.compact.json');

console.log('🔄 Kompakt zaman damgası haritası üretiliyor...');

const compactMap = {};
let totalVerses = 0;
let totalWords = 0;

for (let s = 1; s <= 114; s++) {
  const filePath = path.join(SURAHS_DIR, `${s}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Sure ${s} bulunamadı: ${filePath}`);
    continue;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  for (const ayah of data.ayahs) {
    const key = `${ayah.surah}:${ayah.ayah}`;
    const wordIntervals = ayah.words.map(w => [w.startMs, w.endMs]);
    compactMap[key] = wordIntervals;
    totalVerses++;
    totalWords += wordIntervals.length;
  }
}

fs.mkdirSync(MOBILE_TARGET_DIR, { recursive: true });
fs.writeFileSync(TARGET_FILE, JSON.stringify(compactMap), 'utf8');

const sizeKb = (fs.statSync(TARGET_FILE).size / 1024).toFixed(1);

console.log(`✅ Başarıyla tamamlandı!`);
console.log(`   - Toplam Ayet:   ${totalVerses} / 6236`);
console.log(`   - Toplam Kelime: ${totalWords}`);
console.log(`   - Dosya Boyutu:  ${sizeKb} KB`);
console.log(`   - Hedef Yol:     ${TARGET_FILE}`);
