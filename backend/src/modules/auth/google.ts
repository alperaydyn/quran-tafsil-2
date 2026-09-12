import { OAuth2Client } from "google-auth-library";
import { config } from "../../config/env.js";

const client = new OAuth2Client(config.auth.google.clientId);

export interface GoogleIdTokenClaims {
  sub: string;
  email?: string;
  emailVerified?: boolean;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdTokenClaims> {
  if (!config.auth.google.clientId) {
    throw new Error("GOOGLE_CLIENT_ID yapılandırılmamış");
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.auth.google.clientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub) {
    throw new Error("Geçersiz Google id_token: payload boş");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified,
  };
}
