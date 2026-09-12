import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { Button } from '../components/common/Button';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Onboarding sonrası giriş adımı (MOB-011).
 * Giriş isteğe bağlıdır — "Şimdilik Atla" ile misafir olarak devam edilebilir;
 * hesap daha sonra Ayarlar > Hesap üzerinden bağlanabilir. Ekran, kök stack'te
 * her zaman kayıtlıdır (bkz. RootNavigator); `authStepCompleted` true olduğunda
 * geldiği yere (Ayarlar) döner, ilk akıştan (onboarding sonrası) geldiyse Main'e geçer.
 */
export function AuthScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const authStepCompleted = useAuthStore((s) => s.authStepCompleted);
  const signInWithApple = useAuthStore((s) => s.signInWithApple);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);

  useEffect(() => {
    if (!authStepCompleted) return;
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStepCompleted]);

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: 24 }}>
        <View style={{ flex: 1, justifyContent: 'center', gap: 14 }}>
          <StyledText variant="eyebrow" color="faint">
            HESAP
          </StyledText>
          <StyledText variant="display">İlerlemen seninle taşınsın</StyledText>
          <StyledText variant="body" color="mut">
            Okuma geçmişin, ezber ilerlemen ve favori kavramların cihazlar arasında
            senkronize kalsın. İstersen daha sonra Ayarlar'dan da giriş yapabilirsin.
          </StyledText>
        </View>

        <View style={{ gap: 10 }}>
          {error ? (
            <StyledText variant="footnote" color="acc" style={{ textAlign: 'center', marginBottom: 4 }}>
              {error}
            </StyledText>
          ) : null}

          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={
                theme.scheme === 'dark'
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={theme.radius.pill}
              style={{ height: theme.spacing.huge, width: '100%' }}
              onPress={signInWithApple}
            />
          )}

          <Button
            label="Google ile Devam Et"
            variant="secondary"
            disabled={isLoading}
            onPress={signInWithGoogle}
          />

          <Button
            label="Şimdilik Atla"
            variant="ghost"
            disabled={isLoading}
            onPress={continueAsGuest}
          />
        </View>
      </View>
    </Screen>
  );
}
