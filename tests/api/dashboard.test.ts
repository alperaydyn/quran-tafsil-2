import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../backend/src/app.js";
import { getRedis } from "../../backend/src/db/redis.js";
import type { FastifyInstance } from "fastify";

describe("TEST-BE-006: Dashboard & Daily Cards API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    const redis = getRedis();
    await redis.quit();
    await app.close();
  });

  it("GET /api/v1/dashboard/gunun-kartlari returns daily inspiration cards", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/dashboard/gunun-kartlari",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);

    const firstCard = body.data[0];
    expect(firstCard).toHaveProperty("tip");
    expect(firstCard).toHaveProperty("baslik");
    expect(firstCard).toHaveProperty("sureId");
    expect(firstCard).toHaveProperty("ayetNo");
    expect(firstCard).toHaveProperty("mealTr");
    expect(firstCard).toHaveProperty("tefekkurNotu");
  });

  it("GET /api/v1/dashboard/istatistikler requires authentication", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/dashboard/istatistikler",
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/v1/dashboard/istatistikler with valid JWT returns user stats", async () => {
    const token = app.jwt.sign({
      sub: "a0000000-0000-0000-0000-000000000001",
      authProvider: "apple",
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/dashboard/istatistikler",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("toplamEzberOturumu");
    expect(body.data).toHaveProperty("bekleyenTekrarSayisi");
    expect(body.data).toHaveProperty("pekistirilenEzberSayisi");
    expect(body.data).toHaveProperty("streakDays");
  });
});
