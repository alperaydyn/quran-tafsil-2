import { API_BASE } from './config';
import type { ApiResponse, AuthUser } from './types';

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

export interface LinkAccountPayload {
  provider: 'apple' | 'google';
  idToken: string;
  guestUserId?: string;
  guestToken?: string;
  fullName?: string | null;
  email?: string | null;
}

export async function authenticateWithApple(
  payload: AppleAuthPayload
): Promise<ApiResponse<AuthUser & { token?: string }>> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'apple',
        idToken: payload.identityToken,
        email: payload.email,
        name: payload.fullName,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          success: true,
          data: {
            id: json.data.user.id,
            name: json.data.user.name ?? payload.fullName ?? (json.data.user.email ? json.data.user.email.split('@')[0] : null),
            email: json.data.user.email ?? payload.email ?? null,
            provider: 'apple',
            token: json.data.token,
            isGuest: false,
          },
        };
      }
    }
  } catch (err) {
    console.warn('[authenticateWithApple] Canlı auth başarısız:', err);
  }

  // Geliştirme ortamında graceful fallback (prodüksiyonda devre dışı)
  if (__DEV__) {
    return {
      success: true,
      data: {
        id: `apple-dev-${payload.identityToken.slice(0, 12)}`,
        name: payload.fullName ?? 'Apple Kullanıcısı',
        email: payload.email ?? 'apple.user@privaterelay.appleid.com',
        provider: 'apple',
        token: `dev-jwt-apple-${Date.now()}`,
        isGuest: false,
      },
    };
  }

  return { success: false, error: { code: 'AUTH_FAILED', message: 'Apple kimlik doğrulama başarısız' } };
}

export async function authenticateWithGoogle(
  payload: GoogleAuthPayload
): Promise<ApiResponse<AuthUser & { token?: string }>> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        idToken: payload.idToken,
        email: payload.email,
        name: payload.name,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          success: true,
          data: {
            id: json.data.user.id,
            name: json.data.user.name ?? payload.name ?? json.data.user.email?.split('@')[0] ?? null,
            email: payload.email ?? json.data.user.email ?? null,
            provider: 'google',
            token: json.data.token,
            isGuest: false,
          },
        };
      }
    }
  } catch (err) {
    console.warn('[authenticateWithGoogle] Canlı auth başarısız:', err);
  }

  // Geliştirme ortamında graceful fallback (prodüksiyonda devre dışı)
  if (__DEV__) {
    const fallbackEmail = payload.email ?? 'kullanici@gmail.com';
    const fallbackName = payload.name ?? fallbackEmail.split('@')[0] ?? 'Google Kullanıcısı';
    return {
      success: true,
      data: {
        id: `google-${fallbackEmail.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`,
        name: fallbackName,
        email: fallbackEmail,
        provider: 'google',
        token: `dev-jwt-google-${fallbackEmail.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`,
        isGuest: false,
      },
    };
  }

  return { success: false, error: { code: 'AUTH_FAILED', message: 'Google kimlik doğrulama başarısız' } };
}

/**
 * Misafir / Anonim Mod Oturumu (PBI-4.5)
 * Cihaz yerelinde veya backend'de geçici bir misafir hesabı oluşturup JWT alır.
 */
export async function authenticateAsGuest(): Promise<ApiResponse<AuthUser & { token?: string }>> {
  try {
    const res = await fetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          success: true,
          data: {
            id: json.data.user.id,
            name: 'Misafir Okuyucu',
            email: null,
            provider: 'guest',
            token: json.data.token,
            isGuest: true,
          },
        };
      }
    }
  } catch (err) {
    console.warn('[authenticateAsGuest] Canlı misafir auth başarısız:', err);
  }

  // Geliştirme ortamında yerel misafir fallback (prodüksiyonda devre dışı)
  if (__DEV__) {
    const guestId = `guest-${Date.now()}`;
    return {
      success: true,
      data: {
        id: guestId,
        name: 'Misafir Okuyucu',
        email: null,
        provider: 'guest',
        token: `dev-jwt-guest-${guestId}`,
        isGuest: true,
      },
    };
  }

  return { success: false, error: { code: 'AUTH_FAILED', message: 'Misafir oturumu oluşturulamadı' } };
}

/**
 * Misafir Hesabını Apple / Google Hesabına Bağlama (PBI-4.5 Account Linking)
 * Misafirin okuma geçmişini, yer imlerini ve ezberlerini yeni Apple/Google hesabına aktarır.
 */
export async function linkGuestAccount(
  payload: LinkAccountPayload
): Promise<ApiResponse<AuthUser & { token?: string; linked?: boolean }>> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (payload.guestToken) {
      headers['Authorization'] = `Bearer ${payload.guestToken}`;
    }

    const res = await fetch(`${API_BASE}/auth/link`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        provider: payload.provider,
        idToken: payload.idToken,
        guestUserId: payload.guestUserId,
        email: payload.email,
        name: payload.fullName,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          success: true,
          data: {
            id: json.data.user.id,
            name: json.data.user.name ?? payload.fullName ?? json.data.user.email?.split('@')[0] ?? 'Kâri',
            email: json.data.user.email ?? payload.email ?? null,
            provider: payload.provider,
            token: json.data.token,
            isGuest: false,
            linked: true,
          },
        };
      }
    }
  } catch (err) {
    console.warn('[linkGuestAccount] Canlı account linking hatası, yerel hesaba dönüştürülüyor:', err);
  }

  // Graceful fallback: Eğer hesap bağlama canlıda bir nedenle tamamlanamazsa, kullanıcıyı mağdur etmeyip doğrudan gerçek sağlayıcı girişine yönlendir
  if (payload.provider === 'google') {
    return await authenticateWithGoogle({
      idToken: payload.idToken,
      email: payload.email,
      name: payload.fullName,
    });
  } else {
    return await authenticateWithApple({
      identityToken: payload.idToken,
      fullName: payload.fullName,
      email: payload.email,
    });
  }
}

/**
 * Aktif oturumu doğrular ve güncel kullanıcı profilini çeker.
 */
export async function fetchMe(token: string): Promise<ApiResponse<AuthUser>> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          success: true,
          data: {
            id: json.data.id,
            name: json.data.authProvider === 'apple' ? 'Apple Kullanıcısı' : 'Kullanıcı',
            email: null,
            provider: json.data.authProvider,
            token,
            isGuest: json.data.isGuest,
          },
        };
      }
    }
  } catch (err) {
    console.warn('[fetchMe] Profil doğrulama hatası:', err);
  }

  return { success: false, error: { code: 'UNAUTHORIZED', message: 'Oturum doğrulanamadı' } };
}

/**
 * Kullanıcı hesabını ve tüm bağlı verilerini sunucudan kalıcı olarak siler (PBI-AUTH.2 / Guideline 5.1.1(v)).
 */
export async function deleteAccountOnServer(
  token: string,
  appleAuthCode?: string
): Promise<ApiResponse<{ deleted: boolean; message: string }>> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        appleAuthCode,
      }),
    });

    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      return {
        success: true,
        data: json.data,
      };
    }

    return {
      success: false,
      error: {
        code: json?.error?.code || 'DELETE_FAILED',
        message: json?.error?.message || 'Hesap silme işlemi başarısız oldu.',
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Sunucuya ulaşılamadı. Lütfen internet bağlantınızı kontrol edin.',
      },
    };
  }
}

