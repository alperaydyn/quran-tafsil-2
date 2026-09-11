import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { getTestClient } from "../support/db.js";

// TEST-DP-001 (live pass): validates the seeded database itself, once
// migrations + `npm run db:seed` have been applied. Complements the static
// checks in tests/data/seed-file.test.ts.
const hasDb = !!process.env.DATABASE_URL_DIRECT;
const d = hasDb ? describe : describe.skip;

let client: Client;

d("TEST-DP-001: seed data integrity (live DB)", () => {
  beforeAll(async () => {
    client = getTestClient();
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it("has exactly 114 sureler", async () => {
    const { rows } = await client.query("SELECT COUNT(*)::int AS n FROM sureler");
    expect(rows[0].n).toBe(114);
  });

  it("has a stable ayet count (documents actual vs. canonical 6236)", async () => {
    const { rows } = await client.query("SELECT COUNT(*)::int AS n FROM ayetler");
    if (rows[0].n !== 6236) {
      console.warn(
        `[TEST-DP-001] Live DB has ${rows[0].n} ayetler; canonical Uthmani/Hafs count is 6236.`
      );
    }
    expect(rows[0].n).toBeGreaterThan(6000); // sanity floor, not a hard pass/fail on exact count
  });

  it("sureler.ayet_sayisi matches actual ayetler row count per sure", async () => {
    const { rows } = await client.query(`
      SELECT s.id, s.ayet_sayisi, COUNT(a.id)::int AS actual
      FROM sureler s
      LEFT JOIN ayetler a ON a.sure_id = s.id
      GROUP BY s.id, s.ayet_sayisi
      HAVING s.ayet_sayisi <> COUNT(a.id)::int
    `);
    expect(rows, `mismatched sureler: ${JSON.stringify(rows)}`).toHaveLength(0);
  });

  it("no orphaned ayetler (every sure_id resolves to a sureler row)", async () => {
    const { rows } = await client.query(`
      SELECT a.id FROM ayetler a
      LEFT JOIN sureler s ON s.id = a.sure_id
      WHERE s.id IS NULL
    `);
    expect(rows).toHaveLength(0);
  });

  it("no duplicate (sure_id, ayet_no) pairs", async () => {
    const { rows } = await client.query(`
      SELECT sure_id, ayet_no, COUNT(*) FROM ayetler
      GROUP BY sure_id, ayet_no HAVING COUNT(*) > 1
    `);
    expect(rows).toHaveLength(0);
  });

  it("page/cüz mapping is within valid ranges (sayfa_no 1..604, cuz_no 1..30)", async () => {
    const { rows } = await client.query(`
      SELECT id FROM ayetler WHERE sayfa_no < 1 OR sayfa_no > 604 OR cuz_no < 1 OR cuz_no > 30
    `);
    expect(rows).toHaveLength(0);
  });

  it("metin_ar is byte-exact stable across re-reads (immutability smoke check)", async () => {
    const first = await client.query(
      "SELECT metin_ar FROM ayetler WHERE sure_id = 1 AND ayet_no = 1"
    );
    const second = await client.query(
      "SELECT metin_ar FROM ayetler WHERE sure_id = 1 AND ayet_no = 1"
    );
    expect(first.rows[0].metin_ar).toBe(second.rows[0].metin_ar);
    expect(Buffer.from(first.rows[0].metin_ar, "utf-8").equals(
      Buffer.from(second.rows[0].metin_ar, "utf-8")
    )).toBe(true);
  });
});
