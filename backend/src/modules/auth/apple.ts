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
  if (!config.auth.apple.clientId) {
    throw new Error("APPLE_CLIENT_ID yapılandırılmamış");
  }

  const { payload } = await jwtVerify(idToken, appleJwks, {
    issuer: APPLE_ISSUER,
    audience: config.auth.apple.clientId,
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
