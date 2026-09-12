import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../backend/src/app.js";
import { getRedis } from "../../backend/src/db/redis.js";
import type { FastifyInstance } from "fastify";

describe("TEST-BE-014: Admin Portalı ve Moderasyon API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    const redis = getRedis();
    await redis.quit();
    await app.close();
  });

  it("GET /api/v1/admin/dashboard returns operational metrics and system health", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/admin/dashboard",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("metrics");
    expect(body.data).toHaveProperty("system");

    const { metrics, system } = body.data;
    expect(metrics.totalUsers).toBeGreaterThanOrEqual(1);
    expect(metrics.modeDistribution).toHaveProperty("kesif");
    expect(metrics.modeDistribution).toHaveProperty("ogrenme");
    expect(metrics.modeDistribution).toHaveProperty("odak");
    expect(system.dbConnected).toBe(true);
    expect(system.redisConnected).toBe(true);
  });

  it("GET /api/v1/admin/topluluk returns moderation list", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/admin/topluluk?limit=10",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("POST /api/v1/admin/makaleler creates article and computes reference score", async () => {
    const testSlug = `test-admin-makale-${Date.now()}`;
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/admin/makaleler",
      payload: {
        title: "Tevhid ve İlim Arasındaki Vahiy Dengesi",
        slug: testSlug,
        author: "Tafsil Araştırma Heyeti",
        summary: "Kur'an'da bilgiye ulaşmanın tevhid ilkesiyle ayrılmaz bağı.",
        content_md: "Kur'an'ın ilk vahyinde (96:1) 'Yaratan Rabbinin adıyla oku' buyrulmuştur. Bilgi tek başına değil (96:2), yaratılış şuuruyla anlam kazanır.",
        primary_concepts: ["ilim", "tevhid"],
        related_surahs: [96],
        reading_time_minutes: 4,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.slug).toBe(testSlug);
    expect(body.data.reference_score).toBeGreaterThan(0);

    // Update article
    const updateRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/makaleler/${testSlug}`,
      payload: {
        summary: "Güncellenmiş editoryal özet ve derin tefekkür.",
      },
    });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.json().data.summary).toBe("Güncellenmiş editoryal özet ve derin tefekkür.");
  });

  it("POST /api/v1/admin/kavramlar creates a concept and links relation", async () => {
    const testConceptSlug = `hikmet-${Date.now()}`;
    const conceptRes = await app.inject({
      method: "POST",
      url: "/api/v1/admin/kavramlar",
      payload: {
        slug: testConceptSlug,
        baslik_tr: "Hikmet",
        baslik_ar: "حِكْمَة",
        tanim: "Eşyanın hakikatini kavrayıp doğru hüküm verme ve yerli yerine koyma yetisi.",
        onaylandi: true,
      },
    });

    expect(conceptRes.statusCode).toBe(201);
    const concept = conceptRes.json().data;
    expect(concept.slug).toBe(testConceptSlug);

    // Link relation to concept id 1 (Alak)
    const relRes = await app.inject({
      method: "POST",
      url: "/api/v1/admin/kavramlar/iliskiler",
      payload: {
        kaynak_kavram_id: concept.id,
        hedef_kavram_id: 1,
        iliski_tipi: "iliskili",
        agirlik: 0.9,
      },
    });

    expect(relRes.statusCode).toBe(201);
    expect(relRes.json().data.iliski_tipi).toBe("iliskili");
  });
});
