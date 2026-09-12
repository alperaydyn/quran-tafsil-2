import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../backend/src/app.js";
import { getRedis } from "../../backend/src/db/redis.js";
import type { FastifyInstance } from "fastify";

describe("TEST-BE-011: Topluluk Havuzu, Beğeni ve Çatallama (Fork) API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    const redis = getRedis();
    await redis.quit();
    await app.close();
  });

  it("GET /api/v1/topluluk/oturumlari returns public community sessions", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/topluluk/oturumlari?limit=10",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    const session = body.data[0];
    expect(session).toHaveProperty("id");
    expect(session).toHaveProperty("baslik");
    expect(session).toHaveProperty("odak_kavramlar");
    expect(session).toHaveProperty("sentez_ozeti");
    expect(session).toHaveProperty("like_count");
    expect(session).toHaveProperty("fork_count");
    expect(session.is_public).toBe(true);
  });

  it("GET /api/v1/topluluk/oturumlari?kavram=ilim filters sessions by concept", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/topluluk/oturumlari?kavram=ilim",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    for (const item of body.data) {
      expect(item.odak_kavramlar).toContain("ilim");
    }
  });

  it("POST /api/v1/topluluk/oturumlari/:id/begen toggles like status", async () => {
    const targetSessionId = "11111111-1111-1111-1111-111111111111";

    // First toggle: like
    const res1 = await app.inject({
      method: "POST",
      url: `/api/v1/topluluk/oturumlari/${targetSessionId}/begen`,
    });

    expect(res1.statusCode).toBe(200);
    const body1 = res1.json();
    expect(body1.success).toBe(true);
    expect(typeof body1.data.liked).toBe("boolean");
    expect(typeof body1.data.like_count).toBe("number");

    // Second toggle: unlike
    const res2 = await app.inject({
      method: "POST",
      url: `/api/v1/topluluk/oturumlari/${targetSessionId}/begen`,
    });

    expect(res2.statusCode).toBe(200);
    const body2 = res2.json();
    expect(body2.success).toBe(true);
    expect(body2.data.liked).toBe(!body1.data.liked);
  });

  it("POST /api/v1/topluluk/oturumlari/:id/catalla creates a fork copy", async () => {
    const targetSessionId = "11111111-1111-1111-1111-111111111111";

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/topluluk/oturumlari/${targetSessionId}/catalla`,
      payload: {
        target_title: "Benim İlim ve Cömertlik Çalışmam",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.baslik).toBe("Benim İlim ve Cömertlik Çalışmam");
    expect(body.data.source_session_id).toBe(targetSessionId);
    expect(body.data.is_public).toBe(false);
    expect(body.data.odak_kavramlar).toContain("ilim");
  });

  it("GET /api/v1/topluluk/kavramlar returns popular community concepts", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/topluluk/kavramlar",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    const first = body.data[0];
    expect(first).toHaveProperty("slug");
    expect(first).toHaveProperty("baslik_tr");
    expect(first).toHaveProperty("session_count");
    expect(first.session_count).toBeGreaterThan(0);
  });
});
