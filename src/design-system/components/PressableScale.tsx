import { useRef, type ReactNode } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { motion } from '../tokens/layout';

export interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Escala ao pressionar (padrão 0.97). */
  scaleTo?: number;
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
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

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

  return (
    <Pressable
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
      <Animated.View style={[style, { transform: [{ scale }], opacity }]}>{children}</Animated.View>
    </Pressable>
  );
}
