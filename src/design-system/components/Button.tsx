import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { ThemeColors } from '../tokens/colors';
import { useTheme } from '../theme/ThemeProvider';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'onMedia';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

function variantColors(variant: ButtonVariant, c: ThemeColors) {
  switch (variant) {
    case 'primary':
      return { bg: c.primary, fg: c.onPrimary, border: c.primary };
    case 'secondary':
      return { bg: c.surfaceMuted, fg: c.textPrimary, border: c.border };
    case 'ghost':
      return { bg: 'transparent', fg: c.primaryText, border: 'transparent' };
    case 'onMedia':
      return { bg: 'rgba(255,255,255,0.14)', fg: c.textOnMedia, border: 'rgba(255,255,255,0.28)' };
  }
}

/** Botão único do app (o Zuno tinha um estilo de botão por tela). Altura mínima 44px. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading,
  disabled,
  fullWidth,
  style,
  accessibilityHint,
}: ButtonProps) {
  const { colors, radius, spacing, layout } = useTheme();
  const { bg, fg, border } = variantColors(variant, colors);
  const isDisabled = disabled || loading;
  const height = size === 'md' ? 50 : layout.minTouch;

  const iconEl = icon ? <Ionicons name={icon} size={size === 'md' ? 18 : 16} color={fg} /> : null;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={[
        styles.base,
        {
          minHeight: height,
          paddingHorizontal: size === 'md' ? spacing.xl : spacing.lg,
          backgroundColor: bg,
          borderColor: border,
          borderRadius: radius.pill,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={[styles.content, { gap: spacing.sm }]}>
          {iconPosition === 'left' && iconEl}
          <Text variant="label" style={{ color: fg, fontSize: size === 'md' ? 15 : 13 }}>
            {label}
          </Text>
          {iconPosition === 'right' && iconEl}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center' },
});
