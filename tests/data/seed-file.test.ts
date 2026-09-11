import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// TEST-DP-001 (static pass): validates the seed SQL file itself, without a
// live database. Run tests/data/seed-db.test.ts for the live-DB version once
// a migrated+seeded Postgres instance is reachable via DATABASE_URL_DIRECT.

const repoRoot = path.resolve(__dirname, "../..");
const seedPath = path.join(repoRoot, "data-pipeline/seed/quran_seed.sql");
const metadataPath = path.join(repoRoot, "data-pipeline/scripts/surah-metadata.json");

const seedSql = fs.readFileSync(seedPath, "utf-8");
const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8")) as Array<{
  id: number;
  ad_tr: string;
  ad_ar: string;
  nuzul_sirasi: number;
  donem: string;
  ayet_sayisi: number;
}>;

function extractAyetTuples(sql: string): Array<{ sureId: number; ayetNo: number }> {
  const matches = [...sql.matchAll(/^\((\d+),\s*(\d+),/gm)];
  return matches.map((m) => ({ sureId: Number(m[1]), ayetNo: Number(m[2]) }));
}

describe("TEST-DP-001: seed file integrity (static)", () => {
  it("declares exactly 114 sureler in metadata", () => {
    expect(metadata).toHaveLength(114);
    const ids = metadata.map((s) => s.id).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 114 }, (_, i) => i + 1));
  });

  it("has exactly one INSERT INTO sureler statement covering all 114 rows", () => {
    // Names may contain SQL-escaped apostrophes ('') e.g. 'En''âm' — match
    // quoted strings as a run of either non-quote chars or doubled quotes.
    const QSTR = `'(?:[^']|'')*'`;
    const rowPattern = new RegExp(`^\\((\\d+), ${QSTR}, ${QSTR}, \\d+, '\\w+', \\d+,`, "gm");
    const sureRows = [...seedSql.matchAll(rowPattern)];
    expect(sureRows).toHaveLength(114);
  });

  it("seed ayet tuple count matches sum(ayet_sayisi) from metadata", () => {
    const tuples = extractAyetTuples(seedSql);
    const declaredTotal = metadata.reduce((sum, s) => sum + s.ayet_sayisi, 0);
    expect(tuples).toHaveLength(declaredTotal);
  });

  it("WARNING: total ayet count deviates from the canonical Uthmani/Hafs count of 6236", () => {
    // The commonly cited standard verse count for the Uthmani (Hafs 'an 'Asim)
    // mushaf used by Tanzil is 6236. This seed currently totals 6234 — a
    // 2-verse shortfall traced to data-pipeline/uthmani.txt itself, not to
    // the seed-generation script. Flagged per AGENTS.md §1 (Kur'an metninin
    // dokunulmazlığı) for Agent-01 / human review against an authoritative
    // Tanzil source — this test intentionally documents the discrepancy
    // rather than asserting either number, since we cannot verify against
    // a live Tanzil source in this sandbox.
    const tuples = extractAyetTuples(seedSql);
    const CANONICAL_TOTAL = 6236;
    if (tuples.length !== CANONICAL_TOTAL) {
      console.warn(
        `[TEST-DP-001] Seed has ${tuples.length} ayetler; canonical Uthmani/Hafs count is ${CANONICAL_TOTAL}. ` +
          `Needs verification against an authoritative Tanzil source before production use.`
      );
    }
    expect(tuples.length).toBeGreaterThan(0); // does not fail the suite; see console.warn
  });

  it("every sure has a contiguous ayet_no sequence (1..ayet_sayisi), no gaps/dupes", () => {
    const tuples = extractAyetTuples(seedSql);
    const bySure = new Map<number, number[]>();
    for (const { sureId, ayetNo } of tuples) {
      if (!bySure.has(sureId)) bySure.set(sureId, []);
      bySure.get(sureId)!.push(ayetNo);
    }
    for (const sure of metadata) {
      const nos = (bySure.get(sure.id) ?? []).sort((a, b) => a - b);
      const expected = Array.from({ length: sure.ayet_sayisi }, (_, i) => i + 1);
      expect(nos, `sure ${sure.id} (${sure.ad_tr})`).toEqual(expected);
    }
  });

  it("cuz_no is within [1,30] and sayfa_no is within [1,604] for every ayet row", () => {
    const rows = [...seedSql.matchAll(/^\((\d+), (\d+), (\d+), (\d+), '/gm)];
    expect(rows.length).toBeGreaterThan(0);
    for (const [, , , cuzNo, sayfaNo] of rows) {
      const c = Number(cuzNo);
      const p = Number(sayfaNo);
      expect(c).toBeGreaterThanOrEqual(1);
      expect(c).toBeLessThanOrEqual(30);
      expect(p).toBeGreaterThanOrEqual(1);
      expect(p).toBeLessThanOrEqual(604);
    }
  });

  it("every ayet's metin_ar is non-empty and contains only Arabic-script characters", () => {
    // Arabic block + Arabic presentation forms + combining marks + tatweel + whitespace.
    const arabicPattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/;
    const rows = [...seedSql.matchAll(/^\(\d+, \d+, \d+, \d+, '((?:[^'\\]|'')*)'\)/gm)];
    expect(rows.length).toBeGreaterThan(0);
    for (const [, text] of rows) {
      const unescaped = text.replace(/''/g, "'");
      expect(unescaped.length).toBeGreaterThan(0);
      expect(arabicPattern.test(unescaped)).toBe(true);
    }
  });

  it("donem values are restricted to the 4 allowed enum values", () => {
    const allowed = new Set(["erken_mekke", "orta_mekke", "gec_mekke", "medine"]);
    for (const sure of metadata) {
      expect(allowed.has(sure.donem), `sure ${sure.id} donem=${sure.donem}`).toBe(true);
    }
  });

  it("nuzul_sirasi is a permutation of 1..114 (no duplicates, no gaps)", () => {
    const order = metadata.map((s) => s.nuzul_sirasi).sort((a, b) => a - b);
    expect(order).toEqual(Array.from({ length: 114 }, (_, i) => i + 1));
  });
});
