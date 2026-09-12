import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { config } from "../config/env.js";
import { fail } from "../utils/response.js";

export interface SessionTokenPayload {
  sub: string; // kullanici id (UUID)
  authProvider: "apple" | "google";
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: SessionTokenPayload;
    user: SessionTokenPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  await app.register(fastifyJwt, {
    secret: config.jwt.secret,
    sign: { expiresIn: config.jwt.expiresIn },
  });

  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send(fail("UNAUTHORIZED", "Geçersiz veya eksik oturum token'ı"));
    }
  });
});
