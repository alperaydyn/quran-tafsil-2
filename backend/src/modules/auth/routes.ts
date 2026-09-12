import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { verifyAppleIdToken } from "./apple.js";
import { verifyGoogleIdToken } from "./google.js";
import { findOrCreateUser } from "../users/service.js";
import { toPublicUser } from "../users/dto.js";
import { ok, fail } from "../../utils/response.js";

const loginSchema = z.object({
  provider: z.enum(["apple", "google"]),
  idToken: z.string().min(10),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(fail("VALIDATION_ERROR", "Geçersiz istek gövdesi", parsed.error.flatten()));
    }
    const { provider, idToken } = parsed.data;

    let claims: { sub: string };
    try {
      claims = provider === "apple" ? await verifyAppleIdToken(idToken) : await verifyGoogleIdToken(idToken);
    } catch (err) {
      request.log.warn({ err, provider }, "OAuth id_token doğrulaması başarısız");
      return reply.status(401).send(fail("AUTH_FAILED", "Kimlik doğrulama başarısız oldu"));
    }

    const user = await findOrCreateUser(provider, claims.sub);
    const token = await reply.jwtSign({ sub: user.id, authProvider: provider });

    return reply.send(ok({ token, user: toPublicUser(user) }));
  });
}
