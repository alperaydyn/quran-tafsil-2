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
import { useTranslation } from '../i18n';
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
  const { t } = useTranslation();
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const authStepCompleted = useAuthStore((s) => s.authStepCompleted);
  const signInWithApple = useAuthStore((s) => s.signInWithApple);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const [appleAvailable, setAppleAvailable] = React.useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync()
        .then((available) => setAppleAvailable(available))
        .catch(() => setAppleAvailable(false));
    }
  }, []);

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
      <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: 20 }}>
        <View style={{ flex: 1, justifyContent: 'center', gap: 14 }}>
          <StyledText variant="eyebrow" color="faint">
            {t('auth.title').toUpperCase()}
          </StyledText>
          <StyledText variant="display">{t('auth.title')}</StyledText>
          <StyledText variant="body" color="mut">
            {t('auth.subtitle')}
          </StyledText>
        </View>

        <View style={{ gap: 10 }}>
          {error ? (
            <StyledText variant="footnote" color="acc" style={{ textAlign: 'center', marginBottom: 4 }}>
              {error}
            </StyledText>
          ) : null}

          {Platform.OS === 'ios' && appleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={
                theme.scheme === 'dark'
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={theme.radius.pill}
              style={{ height: 48, width: '100%' }}
              onPress={signInWithApple}
            />
          ) : (
            <Button
              label={` ${t('auth.appleSignIn')}`}
              variant="primary"
              disabled={isLoading}
              onPress={signInWithApple}
            />
          )}

          <Button
            label={t('auth.googleSignIn')}
            variant="secondary"
            disabled={isLoading}
            onPress={signInWithGoogle}
          />

          <Button
            label={t('common.cancel')}
            variant="ghost"
            disabled={isLoading}
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
          />
        </View>
      </View>
    </Screen>
  );
}

