import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { mmkvStorage } from './mmkvStorage';
import {
  authenticateWithApple,
  authenticateWithGoogle,
  authenticateAsGuest,
  linkGuestAccount,
  deleteAccountOnServer,
} from '../api/auth';
import type { AuthUser } from '../api/types';
import { OfflineSyncService } from '../services/offlineSyncService';
import { FEATURES } from '../api/config';

/**
 * Kimlik doğrulama durumu (MOB-011, PBI-4.4, PBI-4.5).
 * - Fastify JWT token ve kullanıcı profilini kalıcılaştırır.
 * - Giriş yapmadan okumak isteyenler için Misafir / Anonim Mod sunar.
 * - Misafir kullanıcının Apple/Google ile hesabını bağlamasını (Account Linking) ve
 *   çevrimdışı verilerin aktarımını sağlar.
 */
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  authStepCompleted: boolean;
  isLoading: boolean;
  error: string | null;
  /** Sunucu 401 döndüğünde true olur; yerel veri korunur, kullanıcıya yeniden giriş önerilir (PBI-9.6). */
  sessionExpired: boolean;

  signInWithApple: (options?: { email?: string; name?: string; hideEmail?: boolean }) => Promise<boolean>;
  signInWithGoogle: (options?: { email?: string; name?: string }) => Promise<boolean>;
  continueAsGuest: () => Promise<void>;
  linkAccount: (provider: 'apple' | 'google', details?: { email?: string; name?: string; hideEmail?: boolean }) => Promise<boolean>;
  signOut: () => void;
  deleteAccount: (options?: { appleAuthCode?: string }) => Promise<{ success: boolean; error?: string }>;
  resetAuthStep: () => void;
  markSessionExpired: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isGuest: false,
      authStepCompleted: false,
      isLoading: false,
      error: null,
      sessionExpired: false,

      resetAuthStep: () => set({ authStepCompleted: false }),

      markSessionExpired: () => {
        if (!get().sessionExpired) set({ sessionExpired: true });
      },

      signInWithApple: async (options?: { email?: string; name?: string; hideEmail?: boolean }) => {
        set({ isLoading: true, error: null });

        try {
          // Özel email veya geliştirici formuyla giriş (kullanıcının kendi gerçek Apple ID'si / adı)
          if (options?.email) {
            const chosenEmail = options.email.trim();
            const chosenName =
              options.name?.trim() ||
              (chosenEmail.includes('@') ? chosenEmail.split('@')[0] : 'Apple Kullanıcısı');
            const fakeDevToken = `apple-dev-${chosenEmail.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;

            const res = await authenticateWithApple({
              identityToken: fakeDevToken,
              fullName: chosenName,
              email: options.hideEmail
                ? `${chosenEmail.split('@')[0]}@privaterelay.appleid.com`
                : chosenEmail,
            });

            if (res.success && res.data) {
              set({
                user: res.data,
                token: res.data.token ?? null,
                isAuthenticated: true,
                isGuest: false,
                authStepCompleted: true,
                isLoading: false,
                error: null,
                sessionExpired: false,
              });
              OfflineSyncService.syncWithServer(undefined, undefined, undefined, { forceFullSync: true }).catch(() => {});
              return true;
            } else {
              set({ isLoading: false, error: res.error?.message ?? 'Giriş başarısız oldu.' });
              return false;
            }
          }

          if (Platform.OS !== 'ios') {
            set({ error: 'Apple ile giriş yalnızca iOS cihazlarda kullanılabilir.' });
            return false;
          }

          const available = await AppleAuthentication.isAvailableAsync();
          if (!available) {
            set({ isLoading: false, error: 'Bu cihazda Apple ile giriş kullanılamıyor.' });
            return false;
          }

          let credential;
          try {
            credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            });
          } catch (nativeErr: any) {
            set({ isLoading: false });
            throw nativeErr;
          }

          if (!credential.identityToken) {
            set({ isLoading: false, error: 'Apple kimlik doğrulaması jeton döndürmedi.' });
            return false;
          }

          const fullName = credential.fullName
            ? AppleAuthentication.formatFullName(credential.fullName) || null
            : null;

          // Standart doğrudan giriş
          const res = await authenticateWithApple({
            identityToken: credential.identityToken,
            authorizationCode: credential.authorizationCode,
            fullName,
            email: credential.email,
          });

          if (res.success && res.data) {
            set({
              user: res.data,
              token: res.data.token ?? null,
              isAuthenticated: true,
              isGuest: false,
              authStepCompleted: true,
              isLoading: false,
              error: null,
              sessionExpired: false,
            });

            OfflineSyncService.syncWithServer(undefined, undefined, undefined, { forceFullSync: true }).catch(() => {});
            return true;
          } else {
            set({ isLoading: false, error: res.error?.message ?? 'Giriş başarısız oldu.' });
            return false;
          }
        } catch (err: any) {
          if (err?.code === 'ERR_REQUEST_CANCELED') {
            set({ isLoading: false });
            return false;
          }
          set({ isLoading: false });
          throw err;
        }
      },

      signInWithGoogle: async (options?: { email?: string; name?: string }) => {
        // PBI-9.3: Native Google Sign-In (Faz 2) tamamlanana kadar yalnızca geliştirme build'lerinde çalışır.
        if (!FEATURES.googleSignIn) {
          set({ error: 'Google ile giriş bu sürümde henüz kullanılamıyor.' });
          return false;
        }
        set({ isLoading: true, error: null });
        try {
          const chosenEmail = options?.email?.trim();
          if (!chosenEmail) {
            set({ isLoading: false, error: 'Lütfen geçerli bir e-posta adresi girin.' });
            return false;
          }

          const chosenName =
            options?.name?.trim() ||
            (chosenEmail.includes('@') ? chosenEmail.split('@')[0] : 'Google Kullanıcısı');

          // Çoklu cihaz/emülatör senkronizasyonu için deterministik dev token
          const fakeDevToken = `google-dev-${chosenEmail.toLowerCase()}`;

          const res = await authenticateWithGoogle({
            idToken: fakeDevToken,
            email: chosenEmail,
            name: chosenName,
          });

          if (res.success && res.data) {
            set({
              user: res.data,
              token: res.data.token ?? null,
              isAuthenticated: true,
              isGuest: false,
              authStepCompleted: true,
              isLoading: false,
              error: null,
              sessionExpired: false,
            });

            OfflineSyncService.syncWithServer(undefined, undefined, undefined, { forceFullSync: true }).catch(() => {});
            return true;
          } else {
            set({ isLoading: false, error: res.error?.message ?? 'Giriş başarısız oldu.' });
            return false;
          }
        } catch {
          set({ isLoading: false, error: 'Google ile giriş sırasında bir sorun oluştu.' });
          return false;
        }
      },

      /**
       * Misafir / Anonim Mod Oturumu (PBI-4.5)
       * Kullanıcı hesap oluşturmadan okumaya başlayabilir.
       */
      continueAsGuest: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await authenticateAsGuest();
          if (res.success && res.data) {
            set({
              user: res.data,
              token: res.data.token ?? null,
              isAuthenticated: true,
              isGuest: true,
              authStepCompleted: true,
              isLoading: false,
              error: null,
              sessionExpired: false,
            });
            return;
          }
        } catch {
          // Graceful fallback
        }

        const fallbackGuestId = `guest-${Date.now()}`;
        set({
          user: {
            id: fallbackGuestId,
            name: 'Misafir Okuyucu',
            email: null,
            provider: 'guest',
            isGuest: true,
          },
          token: `local-guest-jwt-${fallbackGuestId}`,
          isAuthenticated: true,
          isGuest: true,
          authStepCompleted: true,
          isLoading: false,
          error: null,
        });
      },

      /**
       * Hesabı Bağlama (Account Linking - PBI-4.5)
       * Misafirin okuma geçmişini, yer imlerini ve ezberlerini yeni Apple/Google hesabına aktarır.
       */
      linkAccount: async (
        provider: 'apple' | 'google',
        details?: { email?: string; name?: string; hideEmail?: boolean }
      ) => {
        const currentUser = get().user;
        const currentToken = get().token;
        const isCurrentlyGuest = get().isGuest;

        if (provider === 'apple') {
          if (details?.email) {
            const chosenEmail = details.email.trim();
            const chosenName =
              details.name?.trim() ||
              (chosenEmail.includes('@') ? chosenEmail.split('@')[0] : 'Apple Kullanıcısı');
            const fakeDevToken = `apple-dev-${chosenEmail.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
            const effectiveEmail = details.hideEmail
              ? `${chosenEmail.split('@')[0]}@privaterelay.appleid.com`
              : chosenEmail;

            if (isCurrentlyGuest && currentUser?.id) {
              const linkRes = await linkGuestAccount({
                provider: 'apple',
                idToken: fakeDevToken,
                guestUserId: currentUser.id,
                guestToken: currentToken ?? undefined,
                fullName: chosenName,
                email: effectiveEmail,
              });

              if (linkRes.success && linkRes.data) {
                set({
                  user: linkRes.data,
                  token: linkRes.data.token ?? currentToken,
                  isAuthenticated: true,
                  isGuest: false,
                  authStepCompleted: true,
                  isLoading: false,
                  error: null,
                  sessionExpired: false,
                });
                OfflineSyncService.syncWithServer(undefined, undefined, undefined, { forceFullSync: true }).catch(() => {});
                return true;
              }
            }
            return await get().signInWithApple(details);
          }

          if (Platform.OS !== 'ios') return false;
          try {
            const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            });
            if (!credential.identityToken) return false;

            const fullName = credential.fullName
              ? AppleAuthentication.formatFullName(credential.fullName) || null
              : null;

            if (isCurrentlyGuest && currentUser?.id) {
              const linkRes = await linkGuestAccount({
                provider: 'apple',
                idToken: credential.identityToken,
                guestUserId: currentUser.id,
                guestToken: currentToken ?? undefined,
                fullName,
                email: credential.email,
              });

              if (linkRes.success && linkRes.data) {
                set({
                  user: linkRes.data,
                  token: linkRes.data.token ?? currentToken,
                  isAuthenticated: true,
                  isGuest: false,
                  authStepCompleted: true,
                  isLoading: false,
                  error: null,
                  sessionExpired: false,
                });
                OfflineSyncService.syncWithServer(undefined, undefined, undefined, { forceFullSync: true }).catch(() => {});
                return true;
              }
            }
            return await get().signInWithApple();
          } catch (nativeErr) {
            throw nativeErr;
          }
        } else {
          if (!FEATURES.googleSignIn) return false;
          const chosenEmail = details?.email?.trim();
          if (!chosenEmail) {
            set({ error: 'Lütfen geçerli bir e-posta adresi girin.' });
            return false;
          }
          const chosenName =
            details?.name?.trim() ||
            (chosenEmail.includes('@') ? chosenEmail.split('@')[0] : 'Google Kullanıcısı');
          const fakeDevToken = `google-dev-${chosenEmail.toLowerCase()}`;

          if (isCurrentlyGuest && currentUser?.id) {
            const linkRes = await linkGuestAccount({
              provider: 'google',
              idToken: fakeDevToken,
              guestUserId: currentUser.id,
              guestToken: currentToken ?? undefined,
              fullName: chosenName,
              email: chosenEmail,
            });

            if (linkRes.success && linkRes.data) {
              set({
                user: linkRes.data,
                token: linkRes.data.token ?? currentToken,
                isAuthenticated: true,
                isGuest: false,
                authStepCompleted: true,
                isLoading: false,
                error: null,
                sessionExpired: false,
              });
              OfflineSyncService.syncWithServer(undefined, undefined, undefined, { forceFullSync: true }).catch(() => {});
              return true;
            }
          }
          return await get().signInWithGoogle(details);
        }
      },

      signOut: () => {
        // Çıkış yapıldığında cihazdaki eski kullanıcı verilerini sıfırla
        OfflineSyncService.clearAllLocalUserData().catch(() => {});

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isGuest: false,
          authStepCompleted: false,
          isLoading: false,
          error: null,
          sessionExpired: false,
        });
      },

      deleteAccount: async (options?: { appleAuthCode?: string }) => {
        set({ isLoading: true, error: null });
        const currentToken = get().token;

        try {
          // Eğer sunucu token'ı varsa (misafir değilse veya geçerli bir JWT ise) sunucudan sil
          if (currentToken && !get().isGuest && !currentToken.startsWith('dev-jwt-')) {
            const res = await deleteAccountOnServer(currentToken, options?.appleAuthCode);
            if (!res.success) {
              set({ isLoading: false, error: res.error?.message ?? 'Hesap sunucudan silinemedi.' });
              return { success: false, error: res.error?.message };
            }
          }

          // Cihazdaki tüm yerel kullanıcı verilerini (SQLite, MMKV, okuma geçmişi, ezberler) sıfırla
          await OfflineSyncService.clearAllLocalUserData().catch(() => {});

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isGuest: false,
            authStepCompleted: false,
            isLoading: false,
            error: null,
            sessionExpired: false,
          });

          return { success: true };
        } catch (err: any) {
          set({ isLoading: false, error: 'Hesap silinirken beklenmeyen bir hata oluştu.' });
          return { success: false, error: err?.message || 'Beklenmeyen hata' };
        }
      },
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
        authStepCompleted: state.authStepCompleted,
        sessionExpired: state.sessionExpired,
      }),
    }
  )
);
