import { type ReactNode, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { motion } from '../tokens/layout';

export interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Escala ao pressionar (padrão 0.97). */
  scaleTo?: number;
}

/** Propriedades que posicionam o elemento no pai: vão para o Pressable (o filho animado só desenha). */
const OUTER_KEYS = [
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'width',
  'minWidth',
  'maxWidth',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'position',
  'top',
  'bottom',
  'left',
  'right',
  'zIndex',
] as const;

function splitStyle(style: StyleProp<ViewStyle>) {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flat))
    ((OUTER_KEYS as readonly string[]).includes(k) ? outer : inner)[k] = v;
  // O filho preenche o espaço que o Pressable recebeu.
  if (
    outer.flex !== undefined ||
    outer.flexGrow !== undefined ||
    outer.flexBasis !== undefined ||
    outer.width !== undefined
  )
    inner.flexGrow = 1;
  if (outer.position === 'absolute') inner.flexGrow = 1;
  return { outer: outer as ViewStyle, inner: inner as ViewStyle };
}

/**
 * Micro-interação padrão de tudo que é tocável: leve "afundar" com mola ao
 * pressionar. Sob "reduzir movimento", vira apenas troca de opacidade.
 */
export function PressableScale({
  style,
  children,
  scaleTo = motion.pressScale,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReduceMotion();
  const scale = useState(() => new Animated.Value(1))[0];
  const opacity = useState(() => new Animated.Value(1))[0];

  const animateTo = (pressed: boolean) => {
    if (reduceMotion) {
      Animated.timing(opacity, {
        toValue: pressed ? 0.7 : 1,
        duration: motion.duration.instant,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.spring(scale, {
      toValue: pressed ? scaleTo : 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: pressed ? 0 : 6,
    }).start();
  };

  const { outer, inner } = splitStyle(style);

  return (
    <Pressable
      style={outer}
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled }}
      onPressIn={(e) => {
        animateTo(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animateTo(false);
        onPressOut?.(e);
      }}
      {...rest}
    >
      <Animated.View style={[inner, { transform: [{ scale }], opacity }]}>{children}</Animated.View>
    </Pressable>
  );
}
