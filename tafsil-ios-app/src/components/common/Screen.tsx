import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

interface ScreenProps extends ViewProps {
  edges?: Edge[];
  /** Yatay iç boşluğu kapat (örn. tam genişlik kartlar için) */
  noPadding?: boolean;
}

/** Tema zeminini ve güvenli alan (safe area) kenarlarını uygulayan ekran sarmalayıcısı. */
export function Screen({ children, style, edges, noPadding, ...rest }: ScreenProps) {
  const theme = useTheme();
  return (
    <SafeAreaView
      edges={edges ?? ['top', 'left', 'right']}
      style={[styles.flex, { backgroundColor: theme.colors.bg }]}
    >
      <View
        style={[
          styles.flex,
          !noPadding && { paddingHorizontal: theme.spacing.xl },
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
