import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';

import type { ThemeColors } from '../tokens/colors';
import { maxFontScale, typography, type TypographyVariant } from '../tokens/typography';
import { useTheme } from '../theme/ThemeProvider';
import { isAnybody, withCapCorrection } from './capHeight';

export type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'brand'
  | 'onPrimary'
  | 'onMedia'
  | 'success'
  | 'warning'
  | 'danger'
  | 'live'
  | 'demo';

const TONE_TO_TOKEN: Record<TextTone, keyof ThemeColors> = {
  primary: 'inkPrimary',
  secondary: 'inkSecondary',
  tertiary: 'inkTertiary',
  brand: 'accentText',
  onPrimary: 'inkOnRed',
  onMedia: 'inkOnRed',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  live: 'live',
  demo: 'warning',
};

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
}

export function Text({ variant = 'body', tone = 'primary', align, style, children, ...rest }: TextProps) {
  const { colors } = useTheme();
  const styles = [
    typography[variant],
    { color: colors[TONE_TO_TOKEN[tone]] as string },
    align && { textAlign: align },
    style,
  ];
  // Anybody: maiúsculas corrigidas sempre (ver capHeight.tsx e CLAUDE.md).
  const final = StyleSheet.flatten(styles) ?? {};
  const content =
    isAnybody(final.fontFamily) && typeof final.fontSize === 'number'
      ? withCapCorrection(children, final.fontSize)
      : children;
  return (
    <RNText maxFontSizeMultiplier={maxFontScale(variant)} {...rest} style={styles}>
      {content}
    </RNText>
  );
}
