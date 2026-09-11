import React from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { useTheme } from '../../theme';
import { StyledText } from './StyledText';
import { MIN_TOUCH_TARGET } from '../../theme/spacing';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

/** Birincil CTA / ikincil / metin buton varyantlarını destekleyen dokunma hedefi ≥44pt buton. */
export function Button({ label, variant = 'primary', style, disabled, ...rest }: ButtonProps) {
  const theme = useTheme();
  const { colors, radius } = theme;

  const palette = {
    primary: { bg: colors.ink, fg: colors.surf, border: 'transparent' },
    secondary: { bg: 'transparent', fg: colors.ink, border: colors.line },
    ghost: { bg: 'transparent', fg: colors.acc, border: 'transparent' },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderRadius: radius.pill,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}
    >
      <StyledText variant="callout" style={{ color: palette.fg }}>
        {label}
      </StyledText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
