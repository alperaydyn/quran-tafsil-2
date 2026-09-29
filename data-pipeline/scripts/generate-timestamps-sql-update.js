/**
 * tafsil.net — Generate SQL Update Migration for PostgreSQL kelimeler table
 * 
 * 114 surenin kelime zaman damgalarını (start_ms, end_ms) 
 * PostgreSQL veritabanını güncellemek için hazır bir SQL dosyasına dönüştürür.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const SURAHS_DIR = path.join(ROOT_DIR, 'output', 'timestamps', 'surahs');
const OUTPUT_SQL = path.join(ROOT_DIR, 'output', 'update_word_timestamps.sql');

console.log('🔄 PostgreSQL için SQL Update dosyası üretiliyor...');

const writeStream = fs.createWriteStream(OUTPUT_SQL, { encoding: 'utf8' });

writeStream.write(`-- tafsil.net — Kelime Zaman Damgaları (start_ms, end_ms) Güncelleme\n`);
writeStream.write(`-- Toplam 114 Sure, 6236 Ayet, ~80.000 Kelime\n\n`);
writeStream.write(`BEGIN;\n\n`);

let updatedAyahs = 0;
let updatedWords = 0;

for (let s = 1; s <= 114; s++) {
  const filePath = path.join(SURAHS_DIR, `${s}.json`);
  if (!fs.existsSync(filePath)) continue;

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const ayah of data.ayahs) {
    updatedAyahs++;
    for (const w of ayah.words) {
      updatedWords++;
      // PostgreSQL UPDATE sorgusu
      writeStream.write(
        `UPDATE kelimeler SET start_ms = ${w.startMs}, end_ms = ${w.endMs} ` +
        `WHERE ayet_id = (SELECT id FROM ayetler WHERE sure_id = ${ayah.surah} AND ayet_no = ${ayah.ayah}) ` +
        `AND kelime_no = ${w.position};\n`
      );
    }
  }
}

writeStream.write(`\nCOMMIT;\n`);
writeStream.end();

writeStream.on('finish', () => {
  const sizeMb = (fs.statSync(OUTPUT_SQL).size / 1024 / 1024).toFixed(2);
  console.log(`✅ SQL dosyası oluşturuldu!`);
  console.log(`   - Ayet Sayısı:  ${updatedAyahs}`);
  console.log(`   - Kelime Sayısı: ${updatedWords}`);
  console.log(`   - SQL Boyutu:   ${sizeMb} MB`);
  console.log(`   - Dosya Yolu:   ${OUTPUT_SQL}`);
});
