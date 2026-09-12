import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../backend/src/app.js";
import { getRedis } from "../../backend/src/db/redis.js";
import type { FastifyInstance } from "fastify";

describe("TEST-BE-013: Platform Analitiği ve Metrik Özeti API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    const redis = getRedis();
    await redis.quit();
    await app.close();
  });

  it("GET /api/v1/analitik/ozet returns system metrics and usage statistics", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/analitik/ozet",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("metrics");
    expect(body.data.metrics.total_understanding_sessions).toBeGreaterThanOrEqual(1);
    expect(body.data.metrics.total_public_sessions).toBeGreaterThanOrEqual(1);
    expect(body.data.metrics.total_concepts).toBeGreaterThanOrEqual(14);
    expect(Array.isArray(body.data.popular_concepts)).toBe(true);
    expect(Array.isArray(body.data.popular_surahs)).toBe(true);
    expect(Array.isArray(body.data.top_shared_sessions)).toBe(true);
  });
});
