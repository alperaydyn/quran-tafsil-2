import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../backend/src/app.js";
import { getRedis } from "../../backend/src/db/redis.js";
import type { FastifyInstance } from "fastify";

describe("TEST-BE-007 & TEST-BE-008: Kavram Ağı & DAG API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    const redis = getRedis();
    await redis.quit();
    await app.close();
  });

  it("GET /api/v1/kavramlar returns concept list with pagination", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/kavramlar?limit=10",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.kavramlar)).toBe(true);
    expect(body.data.kavramlar.length).toBeGreaterThan(0);
    expect(body.data.toplam).toBeGreaterThanOrEqual(14);

    const first = body.data.kavramlar[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("slug");
    expect(first).toHaveProperty("baslik_tr");
    expect(first).toHaveProperty("tanim");
  });

  it("GET /api/v1/kavramlar/:slug returns single concept detail", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/kavramlar/ilim",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.slug).toBe("ilim");
    expect(body.data.baslik_tr).toBe("İlim");
    expect(body.data.baslik_ar).toBe("العلم");
    expect(body.data.tanim).toContain("Hakikatin");
  });

  it("GET /api/v1/kavramlar/:slug/dag returns recursive CTE directed acyclic graph", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/kavramlar/ilim/dag?depth=2&limit=15",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);

    const { root, nodes, edges, toplam_komsu } = body.data;
    expect(root.slug).toBe("ilim");
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBeGreaterThan(1);
    expect(Array.isArray(edges)).toBe(true);
    expect(edges.length).toBeGreaterThan(0);
    expect(toplam_komsu).toBeGreaterThan(0);

    // Düğümler ve kenar ilişkileri kontrolü
    const edgeTypes = edges.map((e: any) => e.iliski_tipi);
    expect(edgeTypes.some((t: string) => ["kapsama", "sebep_sonuc", "iliskili"].includes(t))).toBe(true);
  });

  it("GET /api/v1/kavramlar/:slug/nuzul-analizi returns chronological period distribution", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/kavramlar/ilim/nuzul-analizi",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.slug).toBe("ilim");
    expect(Array.isArray(body.data.dagilim)).toBe(true);
    expect(body.data.dagilim.length).toBe(4); // erken_mekke, orta_mekke, gec_mekke, medine

    const erkenMekke = body.data.dagilim.find((d: any) => d.donem === "erken_mekke");
    expect(erkenMekke).toBeDefined();
    expect(erkenMekke.oran).toBeGreaterThan(0);
  });

  it("GET /api/v1/kavramlar/non-existent returns 404", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/kavramlar/non-existent-kavram",
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
