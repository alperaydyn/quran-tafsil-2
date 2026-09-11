import React from 'react';
import { Text, type TextProps } from 'react-native';
import { useTheme } from '../../theme';
import type { TypeScaleKey } from '../../theme/typography';

interface StyledTextProps extends TextProps {
  variant?: TypeScaleKey;
  color?: keyof ReturnType<typeof useTheme>['colors'];
}

/** Tema tipografi ölçeğini ve renk tokenlarını uygulayan temel metin bileşeni. */
export function StyledText({
  variant = 'body',
  color = 'ink',
  style,
  ...rest
}: StyledTextProps) {
  const theme = useTheme();
  const token = theme.type[variant];
  return (
    <Text
      style={[
        {
          fontFamily: token.fontFamily,
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          letterSpacing: token.letterSpacing,
          color: theme.colors[color],
        },
        style,
      ]}
      {...rest}
    />
  );
}
