import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../backend/src/app.js";
import { getRedis } from "../../backend/src/db/redis.js";
import { calculateSM2 } from "../../backend/src/modules/memorization/service.js";
import type { FastifyInstance } from "fastify";

describe("TEST-BE-005: SM-2 Algorithm & Memorization API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    const redis = getRedis();
    await redis.quit();
    await app.close();
  });

  describe("SM-2 Mathematical Algorithm", () => {
    it("First repetition with quality=5 (perfect) yields rep=1, interval=1, EF=2.60", () => {
      const res = calculateSM2(0, 1, 2.50, 5);
      expect(res.repetitionNumber).toBe(1);
      expect(res.intervalDays).toBe(1);
      expect(res.easeFactor).toBe(2.60);
      expect(res.durum).toBe("kor_okuma");
    });

    it("Second repetition with quality=4 yields rep=2, interval=6, EF unchanged", () => {
      const res = calculateSM2(1, 1, 2.60, 4);
      expect(res.repetitionNumber).toBe(2);
      expect(res.intervalDays).toBe(6);
      expect(res.easeFactor).toBe(2.60);
      expect(res.durum).toBe("tekrar_bekliyor");
    });

    it("Third repetition with quality=5 scales interval by EF", () => {
      const res = calculateSM2(2, 6, 2.60, 5);
      expect(res.repetitionNumber).toBe(3);
      // interval = 6 * 2.70 = 16.2 -> 16
      expect(res.intervalDays).toBe(16);
      expect(res.easeFactor).toBe(2.70);
    });

    it("Failed review (quality < 3) resets repetition to 0 and interval to 1", () => {
      const res = calculateSM2(3, 16, 2.70, 2);
      expect(res.repetitionNumber).toBe(0);
      expect(res.intervalDays).toBe(1);
      expect(res.durum).toBe("ogreniliyor");
    });

    it("Ease Factor has strict lower bound at 1.30", () => {
      let ef = 2.50;
      for (let i = 0; i < 15; i++) {
        const res = calculateSM2(0, 1, ef, 0);
        ef = res.easeFactor;
      }
      expect(ef).toBe(1.30);
    });
  });

  describe("API Endpoint Security and Validation", () => {
    it("GET /api/v1/ezber-oturumlari requires authentication", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/ezber-oturumlari",
      });
      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("POST /api/v1/ezber-oturumlari validates surah and ayah range", async () => {
      const token = app.jwt.sign({
        sub: "a0000000-0000-0000-0000-000000000001",
        authProvider: "apple",
      });

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/ezber-oturumlari",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          sureId: 115, // invalid (> 114)
          baslangicAyet: 5,
          bitisAyet: 3, // invalid (bitis < baslangic)
        },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("POST /api/v1/ezber-oturumlari/:id/degerlendir validates quality range (0..5)", async () => {
      const token = app.jwt.sign({
        sub: "a0000000-0000-0000-0000-000000000001",
        authProvider: "apple",
      });

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/ezber-oturumlari/some-id/degerlendir",
        headers: { authorization: `Bearer ${token}` },
        payload: { quality: 10 }, // out of range
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
