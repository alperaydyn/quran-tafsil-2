import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { mmkvStorage } from './mmkvStorage';
import { authenticateWithApple, authenticateWithGoogle } from '../api/auth';
import type { AuthUser } from '../api/types';

/**
 * Kimlik doğrulama durumu (MOB-011).
 * `authStepCompleted`, kullanıcı giriş yapsın ya da "Şimdilik Atla" desin,
 * onboarding sonrası Auth ekranının bir daha her açılışta gösterilmemesi
 * için ayrı tutulur — bkz. [[RootNavigator]] akışı.
 */
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  authStepCompleted: boolean;
  isLoading: boolean;
  error: string | null;

  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: () => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      authStepCompleted: false,
      isLoading: false,
      error: null,

      signInWithApple: async () => {
        if (Platform.OS !== 'ios') {
          set({ error: 'Apple ile giriş yalnızca iOS cihazlarda kullanılabilir.' });
          return;
        }
        set({ isLoading: true, error: null });
        try {
          const available = await AppleAuthentication.isAvailableAsync();
          if (!available) {
            set({ isLoading: false, error: 'Bu cihazda Apple ile giriş kullanılamıyor.' });
            return;
          }
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });
          if (!credential.identityToken) {
            set({ isLoading: false, error: 'Apple kimlik doğrulaması jeton döndürmedi.' });
            return;
          }
          const fullName = credential.fullName
            ? AppleAuthentication.formatFullName(credential.fullName) || null
            : null;
          const res = await authenticateWithApple({
            identityToken: credential.identityToken,
            authorizationCode: credential.authorizationCode,
            fullName,
            email: credential.email,
          });
          if (res.success && res.data) {
            set({
              user: res.data,
              isAuthenticated: true,
              authStepCompleted: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false, error: res.error?.message ?? 'Giriş başarısız oldu.' });
          }
        } catch (err: any) {
          // Kullanıcı sistem modalını iptal ettiğinde ERR_REQUEST_CANCELED fırlatılır — hata değildir.
          if (err?.code === 'ERR_REQUEST_CANCELED') {
            set({ isLoading: false });
            return;
          }
          set({ isLoading: false, error: 'Apple ile giriş sırasında bir sorun oluştu.' });
        }
      },

      /**
       * TODO(MOB-011): Native Google girişi (@react-native-google-signin/google-signin)
       * bir Firebase/Google Cloud projesi ve custom dev client gerektirir — henüz
       * repo'da yapılandırılmadı. Şimdilik akış uçtan uca mock'tur; arayüz ve
       * store sözleşmesi sabit kalacak şekilde, gerçek SDK eklendiğinde yalnızca
       * bu fonksiyonun içi değişecektir.
       */
      signInWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await authenticateWithGoogle({ idToken: `mock-${Date.now()}` });
          if (res.success && res.data) {
            set({
              user: res.data,
              isAuthenticated: true,
              authStepCompleted: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false, error: res.error?.message ?? 'Giriş başarısız oldu.' });
          }
        } catch {
          set({ isLoading: false, error: 'Google ile giriş sırasında bir sorun oluştu.' });
        }
      },

      continueAsGuest: () => set({ authStepCompleted: true }),

      signOut: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        authStepCompleted: state.authStepCompleted,
      }),
    }
  )
);
