import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../backend/src/app.js";
import { getRedis } from "../../backend/src/db/redis.js";
import type { FastifyInstance } from "fastify";

describe("TEST-BE-001 & TEST-BE-003 & TEST-E2E-001: Quran API endpoints", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    const redis = getRedis();
    await redis.quit();
    await app.close();
  });

  it("GET /api/v1/sureler returns 114 surahs in mushaf order", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/sureler?siralama=mushaf",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(114);
    expect(body.data[0].id).toBe(1);
    expect(body.data[0].ad_tr).toBe("Fâtiha");
    expect(body.data[113].id).toBe(114);
    expect(body.data[113].ad_tr).toBe("Nâs");
  });

  it("GET /api/v1/sureler returns 114 surahs in nuzul order", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/sureler?siralama=nuzul",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(114);
    expect(body.data[0].ad_tr).toBe("Alak"); // Nuzul 1
  });

  it("GET /api/v1/sureler/1/detay returns Surah Fatiha details", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/sureler/1/detay",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(1);
    expect(body.data.ad_tr).toBe("Fâtiha");
    expect(body.data.ayet_sayisi).toBe(7);
  });

  it("GET /api/v1/sureler/999/detay returns 404", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/sureler/999/detay",
    });

    expect(res.statusCode).toBe(400); // validation error max 114
  });

  it("GET /api/v1/sureler/1/ayetler returns 7 verses of Fatiha", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/sureler/1/ayetler",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(7);
    expect(body.data[0].ayet_no).toBe(1);
    expect(body.data[0].metin_ar).toBe("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ");
  });

  it("GET /api/v1/ayetler/1/1 returns first verse with Uthmani text", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/ayetler/1/1",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.sure_id).toBe(1);
    expect(body.data.ayet_no).toBe(1);
    expect(body.data.metin_ar).toBe("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ");
  });

  it("GET /api/v1/ayetler/1/99 returns 404 AYET_NOT_FOUND", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/ayetler/1/99",
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("AYET_NOT_FOUND");
  });
});
