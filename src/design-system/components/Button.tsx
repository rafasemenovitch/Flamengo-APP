import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { ThemeColors } from '../tokens/colors';
import { useTheme } from '../theme/ThemeProvider';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

/**
 * primary: vermelho (um por tela) · secondary: contorno branco ·
 * ghost: fundo bgRaised2 · onMedia: contorno branco sobre foto/vermelho ·
 * light: fundo branco (sobre bloco vermelho) · link: texto vermelho com seta.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'onMedia' | 'light' | 'link';
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

function variantColors(variant: ButtonVariant, c: ThemeColors, pressed: boolean) {
  switch (variant) {
    case 'primary':
      return { bg: pressed ? c.accentPressed : c.accent, fg: c.inkOnRed, border: 'transparent' };
    case 'secondary':
      return { bg: 'transparent', fg: c.inkPrimary, border: c.lineStrong };
    case 'ghost':
      return { bg: c.bgRaised2, fg: c.inkPrimary, border: 'transparent' };
    case 'onMedia':
      return { bg: 'transparent', fg: c.inkOnRed, border: c.inkOnRed };
    case 'light':
      return { bg: c.inkOnRed, fg: c.bgCanvas, border: 'transparent' };
    case 'link':
      return { bg: 'transparent', fg: c.accentText, border: 'transparent' };
  }
}

/** Botão único do app (especificação 12.3). Raio 12; altura 52 (36 no pequeno). */
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
  const { colors, radius, layout } = useTheme();
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;

  if (variant === 'link') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={8}
        style={({ pressed: p }) => [
          styles.row,
          { minHeight: layout.minTouch, gap: 4, opacity: p ? 0.6 : 1 },
          style,
        ]}
      >
        <Text variant="labelM" style={{ color: colors.accentText }}>
          {label}
        </Text>
        <Ionicons name={icon ?? 'arrow-forward'} size={16} color={colors.accentText} />
      </Pressable>
    );
  }

  const { bg, fg, border } = isDisabled
    ? { bg: colors.bgRaised2, fg: colors.inkTertiary, border: 'transparent' }
    : variantColors(variant, colors, pressed);
  const md = size === 'md';
  const iconEl = icon ? <Ionicons name={icon} size={md ? 20 : 16} color={fg} /> : null;

  return (
    <PressableScale
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isDisabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={[
        styles.base,
        {
          minHeight: md ? 52 : 36,
          paddingHorizontal: md ? 20 : 12,
          backgroundColor: bg,
          borderColor: border,
          borderWidth: border === 'transparent' ? 0 : 1.5,
          borderRadius: md ? radius.m : radius.s,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={[styles.row, { gap: 8 }]}>
          {iconPosition === 'left' && iconEl}
          <Text variant={md ? 'labelButton' : 'labelM'} style={{ color: fg }} numberOfLines={1}>
            {label}
          </Text>
          {iconPosition === 'right' && iconEl}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
