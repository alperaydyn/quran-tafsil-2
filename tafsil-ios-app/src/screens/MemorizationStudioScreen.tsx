import React from 'react';
import { View } from 'react-native';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';

/**
 * Ezber Stüdyosu (MOB-017+) — P1 kapsamında. Şimdilik iskelet ekran;
 * akordeon düzeni ve 3 kademeli STT akışı docs/agents/03-MOBILE-APP-AGENT.md
 * §3.C'de tanımlıdır.
 */
export function MemorizationStudioScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs }}>
        <StyledText variant="title">Ezber Stüdyosu</StyledText>
        <StyledText variant="footnote" color="mut">
          Yakında — akordeon akış ve sesli tekrar burada olacak.
        </StyledText>
      </View>
    </Screen>
  );
}
