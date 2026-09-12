import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useUserSettingsStore } from '../store/useUserSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { ReadingScreen } from '../screens/ReadingScreen';
import { EnglishReadingScreen } from '../screens/EnglishReadingScreen';
import { MemorizationStudioScreen } from '../screens/MemorizationStudioScreen';
import { ProgressMatrixScreen } from '../screens/ProgressMatrixScreen';
import { UnderstandingListScreen } from '../screens/UnderstandingListScreen';
import { UnderstandingStudioScreen } from '../screens/UnderstandingStudioScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['tafsil://', 'https://tafsil.net', 'https://new.tafsil.net'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          SurahList: 'sureler',
          Memorization: 'ezber',
          DagExplorer: 'kavram',
          Settings: 'ayarlar',
        },
      },
      Reading: 'ayet/:surahId/:ayahNo',
      EnglishReading: 'en/reading/:surahId',
      UnderstandingStudio: 'oturum/:id',
      UnderstandingList: 'anlama',
      ProgressMatrix: 'matris',
      Onboarding: 'onboarding',
      Auth: 'auth',
      MemorizationStudio: 'ezber-studyo',
    },
  },
};

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
    <NavigationContainer theme={navTheme} linking={linking}>
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
          name="EnglishReading"
          component={EnglishReadingScreen}
          options={{ headerShown: false }}
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
        <Stack.Screen
          name="UnderstandingList"
          component={UnderstandingListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UnderstandingStudio"
          component={UnderstandingStudioScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
