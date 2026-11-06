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
  const { colors, radius, spacing } = useTheme();
  const pad = { none: 0, sm: spacing.md, md: spacing.lg, lg: spacing.x20 }[padding];

  // Card SÓ para objetos (ingresso, palpite, produto, vídeo). Sem sombra.
  const variantStyle: ViewStyle = {
    surface: { backgroundColor: colors.bgRaised },
    elevated: { backgroundColor: colors.bgRaised },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.lineHairline },
    tinted: { backgroundColor: colors.accentTint },
  }[variant];

  const cardStyle = [
    { borderRadius: radius.l, padding: pad, overflow: 'hidden' as const },
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
