import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { PressableScale } from './PressableScale';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  variant?: 'surface' | 'elevated' | 'outline' | 'tinted';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  onPress,
  accessibilityLabel,
  variant = 'surface',
  padding = 'md',
  style,
}: CardProps) {
  const { colors, radius, spacing, elevation, scheme } = useTheme();
  const pad = { none: 0, sm: spacing.md, md: spacing.lg, lg: spacing.xl }[padding];

  const variantStyle: ViewStyle = {
    surface: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    elevated: {
      backgroundColor: colors.surfaceElevated,
      ...(scheme === 'light' ? elevation.card : { borderWidth: 1, borderColor: colors.border }),
    },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.borderStrong },
    tinted: { backgroundColor: colors.primarySubtle, borderWidth: 1, borderColor: colors.primarySubtle },
  }[variant];

  const cardStyle = [
    { borderRadius: radius.lg, padding: pad, overflow: 'hidden' as const },
    variantStyle,
    style,
  ];

  if (onPress) {
    return (
      <PressableScale onPress={onPress} accessibilityLabel={accessibilityLabel} style={cardStyle}>
        {children}
      </PressableScale>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}
