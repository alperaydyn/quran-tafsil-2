import React, { useEffect, useState } from 'react';
import {
  Platform,
  View,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
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
import { FEATURES } from '../api/config';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Onboarding sonrası veya Ayarlar/Profil üzerinden erişilen kimlik doğrulama ekranı (MOB-011).
 * Apple ve Google ile giriş imkanı sunar; misafir modu desteği içerir.
 * Not: Google girişi `FEATURES.googleSignIn` bayrağına bağlıdır (prod'da Faz 2'ye kadar kapalı).
 */
export function AuthScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const authStepCompleted = useAuthStore((s) => s.authStepCompleted);
  const resetAuthStep = useAuthStore((s) => s.resetAuthStep);
  const signInWithApple = useAuthStore((s) => s.signInWithApple);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const isGuest = useAuthStore((s) => s.isGuest);

  const [appleAvailable, setAppleAvailable] = useState<boolean>(false);
  const [googleModalVisible, setGoogleModalVisible] = useState<boolean>(false);
  const [googleEmail, setGoogleEmail] = useState<string>('');
  const [googleName, setGoogleName] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    // Ekran açıldığında önceki oturumlardan kalan kapanma bayrağını sıfırla
    resetAuthStep();

    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync()
        .then((available) => setAppleAvailable(available))
        .catch(() => setAppleAvailable(false));
    }
  }, [resetAuthStep]);

  useEffect(() => {
    if (!authStepCompleted) return;
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  }, [authStepCompleted, navigation]);

  const handleGoogleSubmit = async () => {
    const emailToUse = googleEmail.trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      setModalError('Lütfen geçerli bir Google e-posta adresi girin.');
      return;
    }
    setModalError(null);
    const nameToUse = googleName.trim() || emailToUse.split('@')[0];

    const success = await signInWithGoogle({
      email: emailToUse,
      name: nameToUse,
    });

    if (success) {
      setGoogleModalVisible(false);
      setGoogleEmail('');
      setGoogleName('');
    }
  };

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

          {FEATURES.googleSignIn && (
            <Button
              label={t('auth.googleSignIn')}
              variant="secondary"
              disabled={isLoading}
              onPress={() => setGoogleModalVisible(true)}
            />
          )}

          {!isGuest && (
            <Button
              label="Misafir Olarak Devam Et"
              variant="ghost"
              disabled={isLoading}
              onPress={async () => {
                await continueAsGuest();
              }}
            />
          )}

          {navigation.canGoBack() && (
            <Button
              label={t('common.cancel')}
              variant="ghost"
              disabled={isLoading}
              onPress={() => {
                navigation.goBack();
              }}
            />
          )}
        </View>
      </View>

      {/* Google ile Giriş / Hesap Bağlama Modalı */}
      <Modal
        visible={googleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGoogleModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.65)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 24,
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{
                width: '100%',
                maxWidth: 380,
                backgroundColor: theme.colors.surf,
                borderRadius: theme.radius.xl,
                borderWidth: 1,
                borderColor: theme.colors.line,
                padding: 24,
                gap: 16,
              }}
            >
              <View style={{ gap: 4 }}>
                <StyledText variant="title" color="ink" style={{ fontSize: 20 }}>
                  Google ile Giriş Yap
                </StyledText>
                <StyledText variant="footnote" color="mut">
                  Bağlanacak Google hesabınızın bilgilerini onaylayın veya düzenleyin.
                </StyledText>
              </View>

              <View style={{ gap: 10, marginTop: 4 }}>
                <View>
                  <StyledText variant="caption" color="faint" style={{ marginBottom: 4 }}>
                    AD SOYAD
                  </StyledText>
                  <TextInput
                    value={googleName}
                    onChangeText={setGoogleName}
                    placeholder="Adınız Soyadınız"
                    placeholderTextColor={theme.colors.faint}
                    style={{
                      height: 44,
                      borderWidth: 1,
                      borderColor: theme.colors.line,
                      borderRadius: theme.radius.md,
                      paddingHorizontal: 12,
                      color: theme.colors.ink,
                      backgroundColor: theme.colors.bg,
                      fontSize: 15,
                    }}
                  />
                </View>

                <View>
                  <StyledText variant="caption" color="faint" style={{ marginBottom: 4 }}>
                    GMAIL / E-POSTA ADRESİ
                  </StyledText>
                  <TextInput
                    value={googleEmail}
                    onChangeText={setGoogleEmail}
                    placeholder="ornek@gmail.com"
                    placeholderTextColor={theme.colors.faint}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{
                      height: 44,
                      borderWidth: 1,
                      borderColor: theme.colors.line,
                      borderRadius: theme.radius.md,
                      paddingHorizontal: 12,
                      color: theme.colors.ink,
                      backgroundColor: theme.colors.bg,
                      fontSize: 15,
                    }}
                  />
                </View>
              </View>

              {modalError ? (
                <StyledText variant="footnote" color="acc" style={{ textAlign: 'center', marginTop: 2 }}>
                  {modalError}
                </StyledText>
              ) : null}

              <View style={{ gap: 8, marginTop: 10 }}>
                <Button
                  label={isLoading ? 'Bağlanıyor...' : 'Google ile Devam Et'}
                  variant="primary"
                  disabled={isLoading}
                  onPress={handleGoogleSubmit}
                  style={{ height: 46 }}
                />
                <Button
                  label="Vazgeç"
                  variant="ghost"
                  disabled={isLoading}
                  onPress={() => {
                    setGoogleModalVisible(false);
                    setModalError(null);
                  }}
                  style={{ height: 38 }}
                />
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Screen>
  );
}

