import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useUserSettingsStore } from '../store/useUserSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import type { RootStackParamList } from './types';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { ReadingScreen } from '../screens/ReadingScreen';
import { MemorizationStudioScreen } from '../screens/MemorizationStudioScreen';
import { ProgressMatrixScreen } from '../screens/ProgressMatrixScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useTheme();
  const onboardingCompleted = useUserSettingsStore((s) => s.onboardingCompleted);
  const authStepCompleted = useAuthStore((s) => s.authStepCompleted);

  const navTheme = {
    ...(theme.scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.bg,
      card: theme.colors.surf,
      text: theme.colors.ink,
      border: theme.colors.line,
      primary: theme.colors.acc,
    },
  };

  // İlk render'daki durumu yakalar (ör. kalıcı depodan yüklenen bayraklar);
  // Onboarding ekranının kaldırılmasıyla oluşan geçiş, aşağıdaki koşullu
  // Screen listesi üzerinden zaten kendiliğinden yönlendirilir.
  const initialRouteName = !onboardingCompleted ? 'Onboarding' : !authStepCompleted ? 'Auth' : 'Main';

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
        {!onboardingCompleted && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
        {/* Auth her zaman kayıtlıdır: onboarding sonrası zorunlu adım olarak VE
            "Şimdilik Atla" sonrası Ayarlar > Hesap'tan tekrar erişilebilsin diye. */}
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={BottomTabNavigator} />
        <Stack.Screen
          name="Reading"
          component={ReadingScreen}
          options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Geri' }}
        />
        <Stack.Screen
          name="MemorizationStudio"
          component={MemorizationStudioScreen}
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="ProgressMatrix"
          component={ProgressMatrixScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
