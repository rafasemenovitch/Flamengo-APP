import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import type { ThemeColors } from '../tokens/colors';
import { maxFontScale, type TypographyVariant } from '../tokens/typography';
import { useTheme } from '../theme/ThemeProvider';

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

export function Text({ variant = 'body', tone = 'primary', align, style, ...rest }: TextProps) {
  const { colors, typography } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={maxFontScale(variant)}
      {...rest}
      style={[
        typography[variant],
        { color: colors[TONE_TO_TOKEN[tone]] as string },
        align && { textAlign: align },
        style,
      ]}
    />
  );
}
