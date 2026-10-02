import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { verifyAppleIdToken } from "./apple.js";
import { verifyGoogleIdToken } from "./google.js";
import { findOrCreateUser, createGuestUser, linkGuestUser, getUserById } from "../users/service.js";
import { toPublicUser } from "../users/dto.js";
import { ok, fail } from "../../utils/response.js";

const loginSchema = z.object({
  provider: z.enum(["apple", "google"]),
  idToken: z.string().min(10),
});

const linkSchema = z.object({
  provider: z.enum(["apple", "google"]),
  idToken: z.string().min(10),
  guestUserId: z.string().uuid().optional(),
});

export async function authRoutes(app: FastifyInstance) {
  /**
   * Apple / Google OAuth Giriş Ucu (PBI-4.4)
   * Client'tan gelen idToken doğrulanır, kullanıcı bulunur veya yaratılır, Fastify JWT üretilir.
   */
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

  /**
   * Misafir / Anonim Mod Oturumu (PBI-4.5)
   * Hesap açmadan okumak isteyen kullanıcılar için geçici misafir oturumu ve JWT üretir.
   */
  app.post("/guest", async (_request, reply) => {
    const user = await createGuestUser();
    const token = await reply.jwtSign({ sub: user.id, authProvider: "guest" });

    return reply.send(ok({ token, user: toPublicUser(user) }));
  });

  /**
   * Misafir Hesabını Apple / Google Hesabına Bağlama (Account Linking - PBI-4.5)
   * Misafir modunda oluşturulan yer imleri, okuma geçmişi ve ezber oturumlarını kalıcı hesaba aktarır.
   */
  app.post("/link", async (request, reply) => {
    const parsed = linkSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(fail("VALIDATION_ERROR", "Geçersiz istek gövdesi", parsed.error.flatten()));
    }
    const { provider, idToken, guestUserId } = parsed.data;

    // Header token'ından veya body'den misafir ID'sini belirle
    let effectiveGuestId = guestUserId;
    if (!effectiveGuestId && request.headers.authorization) {
      try {
        const decoded = await request.jwtVerify<{ sub: string; authProvider: string }>();
        effectiveGuestId = decoded.sub;
      } catch {
        // Token çözülemediyse devam et
      }
    }

    if (!effectiveGuestId) {
      return reply.status(400).send(fail("VALIDATION_ERROR", "Bağlanacak misafir kullanıcı ID'si bulunamadı"));
    }

    let claims: { sub: string };
    try {
      claims = provider === "apple" ? await verifyAppleIdToken(idToken) : await verifyGoogleIdToken(idToken);
    } catch (err) {
      request.log.warn({ err, provider }, "Account linking id_token doğrulaması başarısız");
      return reply.status(401).send(fail("AUTH_FAILED", "Kimlik doğrulama başarısız oldu"));
    }

    const user = await linkGuestUser(effectiveGuestId, provider, claims.sub);
    const token = await reply.jwtSign({ sub: user.id, authProvider: provider });

    return reply.send(ok({ token, user: toPublicUser(user), linked: true }));
  });

  /**
   * Aktif Oturum ve Kullanıcı Doğrulama (PBI-4.4)
   */
  app.get("/me", { preHandler: app.authenticate }, async (request, reply) => {
    const user = await getUserById(request.user.sub);
    if (!user) {
      return reply.status(404).send(fail("USER_NOT_FOUND", "Kullanıcı bulunamadı"));
    }
    return reply.send(ok(toPublicUser(user)));
  });
}
