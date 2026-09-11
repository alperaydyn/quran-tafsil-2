import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useUserSettingsStore } from '../store/useUserSettingsStore';
import type { RootStackParamList } from './types';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { ReadingScreen } from '../screens/ReadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useTheme();
  const onboardingCompleted = useUserSettingsStore((s) => s.onboardingCompleted);

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

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingCompleted && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
        <Stack.Screen name="Main" component={BottomTabNavigator} />
        <Stack.Screen
          name="Reading"
          component={ReadingScreen}
          options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Geri' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
