import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../backend/src/app.js";
import { getRedis } from "../../backend/src/db/redis.js";
import type { FastifyInstance } from "fastify";

describe("TEST-BE-009 & TEST-BE-010: Anlama Çalışmaları & Agentic RAG API", () => {
  let app: FastifyInstance;
  let testUserId = "b0000000-0000-0000-0000-000000000001";
  let token: string;
  let createdSessionId: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({
      sub: testUserId,
      authProvider: "apple",
    });
  });

  afterAll(async () => {
    const redis = getRedis();
    await redis.quit();
    await app.close();
  });

  it("GET /api/v1/anlama-oturumlari returns curated and user sessions", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/anlama-oturumlari",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);

    const first = body.data[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("baslik");
    expect(first).toHaveProperty("odak_kavramlar");
    expect(first).toHaveProperty("sentez_ozeti");
    expect(first).toHaveProperty("okuma_kuyrugu");
    expect(first).toHaveProperty("timeline_adimlari");
  });

  it("POST /api/v1/anlama-oturumlari creates a new study session", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/anlama-oturumlari",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        soru: "İlmin cömertlikle ilişkisi nedir, Kur'an bunu nerede kuruyor?",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.baslik).toContain("İlim");
    expect(body.data.odak_kavramlar).toContain("ilim");
    expect(Array.isArray(body.data.okuma_kuyrugu)).toBe(true);
    expect(body.data.timeline_adimlari.length).toBe(3);

    createdSessionId = body.data.id;
  });

  it("GET /api/v1/anlama-oturumlari/:id returns full session detail", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/anlama-oturumlari/${createdSessionId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdSessionId);
    expect(body.data.sentez_ozeti).toBeTruthy();
    expect(Array.isArray(body.data.okuma_kuyrugu)).toBe(true);
  });

  it("POST /api/v1/anlama-oturumlari/:id/soru answers in-scope question", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/anlama-oturumlari/${createdSessionId}/soru`,
      headers: { authorization: `Bearer ${token}` },
      payload: {
        soru: "Kalemle öğretmek neden bu kadar öne çıkıyor?",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.is_branch_suggested).toBe(false);
    expect(body.data.cevap).toContain("mevcut çalışmanın içinde");
  });

  it("POST /api/v1/anlama-oturumlari/:id/soru detects topic shift and suggests intent branch", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/anlama-oturumlari/${createdSessionId}/soru`,
      headers: { authorization: `Bearer ${token}` },
      payload: {
        soru: "Peki sabır ayetleri hangi surelerde yoğunlaşıyor?",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.is_branch_suggested).toBe(true);
    expect(body.data.branch_title).toContain("Sabır");
    expect(body.data.branch_reason).toContain("kesişmiyor");
  });
});
