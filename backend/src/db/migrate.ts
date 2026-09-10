import fs from "fs";
import path from "path";
import { getDirectClient } from "./client.js";

async function runMigrations() {
  const client = getDirectClient();
  console.log("Migration başlatılıyor (Doğrudan PostgreSQL bağlantısı: DATABASE_URL_DIRECT)...");

  try {
    await client.connect();
    console.log("✓ Veritabanı bağlantısı kuruldu.");

    const migrationFile = path.resolve(process.cwd(), "src/db/migrations/001_init_schema.sql");
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration dosyası bulunamadı: ${migrationFile}`);
    }

    const sql = fs.readFileSync(migrationFile, "utf-8");
    console.log(`✓ ${path.basename(migrationFile)} dosyası okunuyor ve çalıştırılıyor...`);

    await client.query(sql);
    console.log("✓ Şema ve indeksler başarıyla oluşturuldu/güncellendi.");
  } catch (error) {
    console.error("✕ Migration hatası:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
