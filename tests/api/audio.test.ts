import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../backend/src/app.js";
import { getRedis } from "../../backend/src/db/redis.js";
import type { FastifyInstance } from "fastify";

describe("TEST-BE-017: Ses Senkronizasyon ve Kâri API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    const redis = getRedis();
    await redis.quit();
    await app.close();
  });

  it("GET /api/v1/audio/reciters returns reciter list with languages and features", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/audio/reciters",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);

    const alafasy = body.data.find((r: any) => r.id === "mishary_alafasy");
    expect(alafasy).toBeDefined();
    expect(alafasy.language).toBe("ar");
  });

  it("GET /api/v1/audio/sure/1 returns Fatiha audio playlist with verse URLs and word timestamps", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/audio/sure/1?reciter=mishary_alafasy",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("sure_id", 1);
    expect(body.data).toHaveProperty("verses");
    expect(body.data.verses.length).toBe(7);

    // Verify verse 1 has audio url and words with timestamps
    const v1 = body.data.verses[0];
    expect(v1.ayet_no).toBe(1);
    expect(v1.ses_url).toBeDefined();
    expect(Array.isArray(v1.words)).toBe(true);
  });

  it("GET /api/v1/audio/sure/999 returns 400 for invalid surah id", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/audio/sure/999",
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_SURAH_ID");
  });
});
