import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../backend/src/app.js";
import { getRedis } from "../../backend/src/db/redis.js";
import type { FastifyInstance } from "fastify";

describe("TEST-BE-015: Çoklu Dil (Multilingual) ve İngilizce Okuma API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    const redis = getRedis();
    await redis.quit();
    await app.close();
  });

  it("GET /api/v1/sureler/1/ayetler?lang=en returns Fatiha verses with English translations", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/sureler/1/ayetler?lang=en&limit=7",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBe(7);

    const firstAyah = body.data[0];
    expect(firstAyah.meal).toContain("In the name of Allah");
  });

  it("GET /api/v1/ayetler/96/2?lang=en returns English meal and baglam_en context", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/ayetler/96/2?lang=en",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);

    const ayah = body.data;
    expect(ayah.meal).toContain("'alaq");
    expect(ayah.baglam_en).toBeDefined();
    expect(ayah.baglam_en).toContain("Often rendered");
  });

  it("GET /api/v1/ayetler/1/1 without lang defaults to Turkish translation", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/ayetler/1/1",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.meal).toContain("Rahmân");
  });
});
