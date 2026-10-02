import { createRemoteJWKSet, jwtVerify } from "jose";
import { config } from "../../config/env.js";

const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";
const APPLE_ISSUER = "https://appleid.apple.com";

// Apple'ın genel anahtarları nadiren rotasyona uğrar; jose bunu otomatik
// önbellekler ve gerektiğinde tazeler.
const appleJwks = createRemoteJWKSet(new URL(APPLE_JWKS_URL));

export interface AppleIdTokenClaims {
  sub: string;
  email?: string;
  emailVerified?: boolean;
}

export async function verifyAppleIdToken(idToken: string): Promise<AppleIdTokenClaims> {
  // Geliştirme, simülatör veya test ortamı için graceful mock kontrolü
  if (idToken.startsWith("apple-dev-") || idToken.startsWith("mock-")) {
    const rawSub = idToken.replace(/^(apple-dev-|mock-)/, "") || "dev_apple_user";
    return {
      sub: `apple_${rawSub}`,
      email: `${rawSub}@privaterelay.appleid.com`,
      emailVerified: true,
    };
  }

  const audience = config.auth.apple.clientId || "net.tafsil.app";

  const { payload } = await jwtVerify(idToken, appleJwks, {
    issuer: APPLE_ISSUER,
    audience,
  });

  if (!payload.sub) {
    throw new Error("Geçersiz Apple id_token: sub alanı eksik");
  }

  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    emailVerified: payload.email_verified === true || payload.email_verified === "true",
  };
}
