import React from 'react';
import { View } from 'react-native';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';

/**
 * Kavram Ağı Gezgini (DAG Explorer) — P1 kapsamında. Şimdilik iskelet ekran;
 * viewport culling'li graf görünümü docs/agents/03-MOBILE-APP-AGENT.md §3.D'de
 * tanımlıdır.
 */
export function DagExplorerScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs }}>
        <StyledText variant="title">Kavram Ağı</StyledText>
        <StyledText variant="footnote" color="mut">
          Yakında — yönlü çevrimsiz kavram grafı burada olacak.
        </StyledText>
      </View>
    </Screen>
  );
}
