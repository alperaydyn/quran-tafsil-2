import type { ApiResponse, AuthUser } from './types';

/**
 * Auth API istemcisi (MOB-011).
 *
 * MOCK modda çalışıyor: Agent-02'nin `docs/agent-signals/agent-02.status.json`
 * dosyasında BE-001 + BE-010 `completed` listesine girene kadar gerçek ağ
 * isteği yapılmaz — sağlayıcı doğrulaması (Apple identityToken / Google
 * idToken) backend'e iletilmeden yerel olarak bir kullanıcı nesnesine
 * dönüştürülür. Kontrol: `cat docs/agent-signals/agent-02.status.json`
 *
 * Google girişi ayrıca native tarafta @react-native-google-signin/google-signin
 * (veya react-native-nitro-google-signin) ve bir Firebase/Google Cloud projesi
 * gerektirir — bu bilgiler henüz repo'da yok, bu yüzden Google akışı şimdilik
 * uçtan uca mock'tur (bkz. src/store/useAuthStore.ts `signInWithGoogle`).
 */

const USE_MOCK = {
  auth: true, // BE-001 + BE-010 hazır olduğunda false yapılacak
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface AppleAuthPayload {
  identityToken: string;
  authorizationCode?: string | null;
  fullName?: string | null;
  email?: string | null;
}

export interface GoogleAuthPayload {
  idToken: string;
  name?: string | null;
  email?: string | null;
}

export async function authenticateWithApple(
  payload: AppleAuthPayload
): Promise<ApiResponse<AuthUser>> {
  if (USE_MOCK.auth) {
    await delay(200);
    return {
      success: true,
      data: {
        id: `apple-mock-${payload.identityToken.slice(0, 12)}`,
        name: payload.fullName ?? null,
        email: payload.email ?? null,
        provider: 'apple',
      },
    };
  }
  throw new Error('authenticateWithApple: gerçek API henüz bağlanmadı');
}

export async function authenticateWithGoogle(
  payload: GoogleAuthPayload
): Promise<ApiResponse<AuthUser>> {
  if (USE_MOCK.auth) {
    await delay(200);
    return {
      success: true,
      data: {
        id: `google-mock-${payload.idToken.slice(0, 12)}`,
        name: payload.name ?? null,
        email: payload.email ?? null,
        provider: 'google',
      },
    };
  }
  throw new Error('authenticateWithGoogle: gerçek API henüz bağlanmadı');
}
