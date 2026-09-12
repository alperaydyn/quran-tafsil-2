import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../backend/src/app.js";
import { getRedis } from "../../backend/src/db/redis.js";
import type { FastifyInstance } from "fastify";

describe("TEST-BE-016: Çift Yönlü Çevrimdışı Senkronizasyon API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    const redis = getRedis();
    await redis.quit();
    await app.close();
  });

  it("POST /api/v1/sync/push successfully synchronizes bookmarks and reading history", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/sync/push",
      payload: {
        client_timestamp: new Date().toISOString(),
        bookmarks: [
          {
            sure_id: 1,
            ayet_no: 3,
            etiket: "Tefekkür",
            notlar: "Rahman ve Rahim üzerine not",
          },
          {
            sure_id: 96,
            ayet_no: 2,
            etiket: "Yaratılış",
          },
        ],
        reading_history: [
          {
            sure_id: 1,
            ayet_no: 3,
            okunma_suresi_sn: 40,
          },
        ],
        memorization_sessions: [],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("synced_at");
    expect(body.data).toHaveProperty("counts");
    expect(body.data.counts.bookmarks).toBe(2);
    expect(body.data.counts.reading_history).toBe(1);
  });

  it("POST /api/v1/sync/pull returns updated bookmarks and reading history", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/sync/pull",
      payload: {
        last_synced_at: new Date(Date.now() - 3600000).toISOString(),
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("bookmarks");
    expect(body.data).toHaveProperty("reading_history");
    expect(Array.isArray(body.data.bookmarks)).toBe(true);
    expect(body.data.bookmarks.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/v1/sync/status returns sync status and record counts", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/sync/status",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("bookmarks");
    expect(body.data).toHaveProperty("reading_history");
    expect(body.data.bookmarks.count).toBeGreaterThanOrEqual(1);
  });
});
