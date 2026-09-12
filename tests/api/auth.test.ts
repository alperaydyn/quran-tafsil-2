import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../backend/src/app.js";
import { getRedis } from "../../backend/src/db/redis.js";
import type { FastifyInstance } from "fastify";

describe("TEST-BE-004: Auth & JWT validation", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    const redis = getRedis();
    await redis.quit();
    await app.close();
  });

  it("GET /api/v1/users/me without token returns 401 UNAUTHORIZED", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/v1/users/me with malformed token returns 401 UNAUTHORIZED", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
      headers: {
        authorization: "Bearer invalid.jwt.token",
      },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/v1/users/me with valid JWT token format triggers user lookup", async () => {
    // Generate valid signed JWT using fastify instance
    const token = app.jwt.sign({
      sub: "a0000000-0000-0000-0000-000000000001",
      authProvider: "apple",
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    // Valid JWT passes authPlugin and queries DB (user doesn't exist yet -> 404 USER_NOT_FOUND)
    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("USER_NOT_FOUND");
  });
});
