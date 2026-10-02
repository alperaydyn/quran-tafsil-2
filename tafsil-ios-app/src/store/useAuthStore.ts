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
} from '../api/auth';
import type { AuthUser } from '../api/types';
import { OfflineSyncService } from '../services/offlineSyncService';

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

  signInWithApple: () => Promise<boolean>;
  signInWithGoogle: (options?: { email?: string; name?: string }) => Promise<boolean>;
  continueAsGuest: () => Promise<void>;
  linkAccount: (provider: 'apple' | 'google', googleDetails?: { email?: string; name?: string }) => Promise<boolean>;
  signOut: () => void;
  resetAuthStep: () => void;
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

      resetAuthStep: () => set({ authStepCompleted: false }),

      signInWithApple: async () => {
        if (Platform.OS !== 'ios') {
          set({ error: 'Apple ile giriş yalnızca iOS cihazlarda kullanılabilir.' });
          return false;
        }
        set({ isLoading: true, error: null });

        try {
          const available = await AppleAuthentication.isAvailableAsync();
          if (!available) {
            set({ isLoading: false, error: 'Bu cihazda Apple ile giriş kullanılamıyor.' });
            return false;
          }
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });
          if (!credential.identityToken) {
            set({ isLoading: false, error: 'Apple kimlik doğrulaması jeton döndürmedi.' });
            return false;
          }

          const fullName = credential.fullName
            ? AppleAuthentication.formatFullName(credential.fullName) || null
            : null;

          const currentUser = get().user;
          const currentToken = get().token;
          const isCurrentlyGuest = get().isGuest;

          // Eğer kullanıcı daha önce misafir olarak devam ettiyse, verilerini Apple hesabına bağla
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
              });

              // Yerel çevrimdışı verileri backend'e senkronize et
              OfflineSyncService.syncWithServer().catch(() => {});
              return true;
            }
          }

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
            });

            OfflineSyncService.syncWithServer().catch(() => {});
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
          set({ isLoading: false, error: 'Apple ile giriş sırasında bir sorun oluştu.' });
          return false;
        }
      },

      signInWithGoogle: async (options?: { email?: string; name?: string }) => {
        set({ isLoading: true, error: null });
        try {
          const currentUser = get().user;
          const currentToken = get().token;
          const isCurrentlyGuest = get().isGuest;

          const chosenEmail = options?.email?.trim() || 'alperaydyn@gmail.com';
          const chosenName =
            options?.name?.trim() ||
            (chosenEmail.includes('@') ? chosenEmail.split('@')[0] : 'Google Kullanıcısı');

          // Çoklu cihaz/emülatör senkronizasyonu için deterministik dev token
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
              });

              OfflineSyncService.syncWithServer().catch(() => {});
              return true;
            }
          }

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
            });

            OfflineSyncService.syncWithServer().catch(() => {});
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
       */
      linkAccount: async (provider: 'apple' | 'google', googleDetails?: { email?: string; name?: string }) => {
        if (provider === 'apple') {
          return await get().signInWithApple();
        } else {
          return await get().signInWithGoogle(googleDetails);
        }
      },

      signOut: () => {
        const guestId = `guest-${Date.now()}`;
        set({
          user: {
            id: guestId,
            name: 'Misafir Okuyucu',
            email: null,
            provider: 'guest',
            isGuest: true,
          },
          token: `local-guest-jwt-${guestId}`,
          isAuthenticated: true,
          isGuest: true,
          authStepCompleted: false, // <-- Tekrar Auth ekranı açıldığında hemen kapanmaması için
          isLoading: false,
          error: null,
        });
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
      }),
    }
  )
);
