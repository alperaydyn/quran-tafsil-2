import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../backend/src/app.js";
import { getRedis } from "../../backend/src/db/redis.js";
import type { FastifyInstance } from "fastify";

describe("TEST-BE-018: Canlı SSE Ajan Araştırma Akışı ve Semantik Arama", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    const redis = getRedis();
    await redis.quit();
    await app.close();
  });

  it("POST /api/v1/anlama-oturumlari/ara performs semantic verse search", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/anlama-oturumlari/ara",
      payload: {
        q: "Rahman",
        limit: 5,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);

    const match = body.data[0];
    expect(match).toHaveProperty("sure_id");
    expect(match).toHaveProperty("ayet_no");
    expect(match).toHaveProperty("similarity_score");
  });

  it("GET /api/v1/anlama-oturumlari/:id/stream sends server-sent events for understanding session", async () => {
    // 1. Create a session first
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/anlama-oturumlari",
      payload: {
        soru: "Kur'an'da cömertlik ve ilim ilişkisi nedir?",
      },
    });

    expect(createRes.statusCode).toBe(201);
    const session = createRes.json().data;
    expect(session).toHaveProperty("id");

    // 2. Stream the session
    const streamRes = await app.inject({
      method: "GET",
      url: `/api/v1/anlama-oturumlari/${session.id}/stream`,
    });

    expect(streamRes.statusCode).toBe(200);
    expect(streamRes.headers["content-type"]).toContain("text/event-stream");
    expect(streamRes.payload).toContain("event: step_progress");
    expect(streamRes.payload).toContain("event: complete");
  });
});
