import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useAppFonts, useTheme } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LoadingScreen } from './src/screens/LoadingScreen';

import { OfflineSyncService } from './src/services/offlineSyncService';
import { installDiagnostics } from './src/services/diagnostics';

// Veri hareketi izleyicisi (PBI-10.1): ilk fetch'ten önce kurulmalı
installDiagnostics();

SplashScreen.preventAutoHideAsync().catch(() => {
  /* zaten gizliyse yut */
});

function AppShell() {
  const theme = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Uygulama açılışında diğer cihazlardan gelen verileri sessizce eşitle
    OfflineSyncService.syncWithServer().catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
      {showSplash && (
        <View style={StyleSheet.absoluteFill}>
          <LoadingScreen
            minDurationMs={2200}
            onFinish={() => setShowSplash(false)}
          />
        </View>
      )}
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useAppFonts();

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutReady();
  }, [onLayoutReady]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
