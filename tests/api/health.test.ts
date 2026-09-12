import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../backend/src/app.js";
import type { FastifyInstance } from "fastify";

describe("TEST-BE-002: Health check endpoint", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns 200 with postgres and redis status ok", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
    expect(body.data.checks.postgres).toBe(true);
    expect(body.data.checks.redis).toBe(true);
  });
});
