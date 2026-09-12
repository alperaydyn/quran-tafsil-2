import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../backend/src/app.js";
import { getRedis } from "../../backend/src/db/redis.js";
import type { FastifyInstance } from "fastify";

describe("TEST-BE-012: Makaleler ve Kur'an Referans Doğrulama Motoru API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    const redis = getRedis();
    await redis.quit();
    await app.close();
  });

  it("GET /api/v1/makaleler returns published articles", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/makaleler",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2);

    const article = body.data[0];
    expect(article).toHaveProperty("slug");
    expect(article).toHaveProperty("title");
    expect(article).toHaveProperty("reference_score");
    expect(article).toHaveProperty("is_verified");
  });

  it("GET /api/v1/makaleler/:slug returns article markdown content and metadata", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/makaleler/kuran-ezberi",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.slug).toBe("kuran-ezberi");
    expect(body.data).toHaveProperty("content_md");
    expect(body.data.content_md).toContain("Müzzemmil 73:20");
    expect(body.data.reference_score).toBeGreaterThanOrEqual(85);
    expect(body.data.is_verified).toBe(true);
  });

  it("POST /api/v1/makaleler/dogrula evaluates Quran reference score (0-100)", async () => {
    const sampleText = `
      Kur'an'da adalet ve ihsan ilkeleri bir arada zikredilir.
      Nahl 16:90 ayetinde "Şüphesiz Allah adaleti ve ihsanı emreder" buyrulur.
      Ayrıca Bakara 2:255 ayeti tevhidi, Alak 96:1-5 ayetleri ise ilmin başlangıç bağlamını gösterir.
      Bu ayetlerin Mekki ve Medeni iniş dönemi tarihsel kronolojisi ve kelime kök morfolojisi
      siyak-sibak bütünlüğü içinde incelendiğinde kavramlar arasındaki gaye açıkça belirir.
    `;

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/makaleler/dogrula",
      payload: {
        content_md: sampleText,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.total_score).toBeGreaterThanOrEqual(85);
    expect(body.data.is_verified).toBe(true);
    expect(body.data.badge).toBe("verified");
    expect(body.data.citations.length).toBeGreaterThan(0);
    expect(body.data.breakdown.direct_citations.score).toBeGreaterThan(0);
  });
});
