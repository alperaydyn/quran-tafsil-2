import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { getTestClient } from "../support/db.js";

// TEST-DP-002: schema validation against a live, migrated database.
// Requires DATABASE_URL_DIRECT pointed at a Postgres instance that has
// already run backend/src/db/migrations/001_init_schema.sql.
const hasDb = !!process.env.DATABASE_URL_DIRECT;
const d = hasDb ? describe : describe.skip;

let client: Client;

d("TEST-DP-002: schema integrity (live DB)", () => {
  beforeAll(async () => {
    client = getTestClient();
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it("all expected tables exist", async () => {
    const expected = [
      "sureler",
      "ayetler",
      "kokler",
      "kelimeler",
      "kavramlar",
      "kavram_iliskileri",
      "ayet_bloklari",
      "cumle_bloklari",
      "kullanicilar",
      "ezber_oturumlari",
      "anlama_oturumlari",
    ];
    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const found = new Set(rows.map((r) => r.table_name));
    for (const table of expected) {
      expect(found.has(table), `missing table: ${table}`).toBe(true);
    }
  });

  it("ayetler.sure_id has a FK REFERENCES sureler", async () => {
    const { rows } = await client.query(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'ayetler'
        AND kcu.column_name = 'sure_id'
        AND ccu.table_name = 'sureler'
    `);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("kelimeler.ayet_id has a FK REFERENCES ayetler", async () => {
    const { rows } = await client.query(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'kelimeler'
        AND kcu.column_name = 'ayet_id'
        AND ccu.table_name = 'ayetler'
    `);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("sureler(id, ayet_no) equivalent uniqueness: ayetler has UNIQUE(sure_id, ayet_no)", async () => {
    const { rows } = await client.query(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      WHERE tc.table_name = 'ayetler' AND tc.constraint_type = 'UNIQUE'
    `);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("sureler.donem has a CHECK constraint restricting to the 4 dönem values", async () => {
    const { rows } = await client.query(`
      SELECT pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid = 'sureler'::regclass AND contype = 'c'
    `);
    const defs = rows.map((r) => r.def as string);
    expect(defs.some((d) => d.includes("donem"))).toBe(true);
    for (const val of ["erken_mekke", "orta_mekke", "gec_mekke", "medine"]) {
      expect(defs.some((d) => d.includes(val))).toBe(true);
    }
  });

  it("kavram_iliskileri.iliski_tipi has a CHECK constraint with the 5 relation types", async () => {
    const { rows } = await client.query(`
      SELECT pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid = 'kavram_iliskileri'::regclass AND contype = 'c'
    `);
    const defs = rows.map((r) => r.def as string);
    for (const val of ["es_anlam", "zit_anlam", "kapsama", "sebep_sonuc", "iliskili"]) {
      expect(defs.some((d) => d.includes(val))).toBe(true);
    }
  });

  it("expected performance indexes exist on ayetler and kelimeler", async () => {
    const { rows } = await client.query(`
      SELECT indexname FROM pg_indexes WHERE tablename IN ('ayetler', 'kelimeler', 'kavramlar')
    `);
    const names = new Set(rows.map((r) => r.indexname));
    for (const idx of [
      "idx_ayetler_sure_ayet",
      "idx_ayetler_sayfa",
      "idx_ayetler_cuz",
      "idx_kelimeler_ayet",
    ]) {
      expect(names.has(idx), `missing index: ${idx}`).toBe(true);
    }
  });

  it("pgvector extension is installed", async () => {
    const { rows } = await client.query(`SELECT extname FROM pg_extension WHERE extname = 'vector'`);
    expect(rows).toHaveLength(1);
  });

  it("ON DELETE CASCADE is set for kelimeler.ayet_id -> ayetler.id", async () => {
    const { rows } = await client.query(`
      SELECT confdeltype
      FROM pg_constraint
      WHERE conrelid = 'kelimeler'::regclass AND contype = 'f'
        AND confrelid = 'ayetler'::regclass
    `);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].confdeltype).toBe("c"); // 'c' = CASCADE
  });
});
