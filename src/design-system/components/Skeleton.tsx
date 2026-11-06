import { useEffect, useState } from 'react';
import { Animated, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '../theme/ThemeProvider';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Bloco de carregamento com "respiração" suave (sem shimmer pesado). */
export function Skeleton({ width = '100%', height = 14, radius, style }: SkeletonProps) {
  const { colors, radius: r, motion } = useTheme();
  const reduceMotion = useReduceMotion();
  const value = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 700,
          easing: motion.easing.inOut,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 700,
          easing: motion.easing.inOut,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, value, motion]);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: radius ?? r.xs, backgroundColor: colors.skeleton, overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: colors.skeletonHighlight,
          opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0, 0.7] }),
        }}
      />
    </View>
  );
}

/** Esqueleto genérico de card com imagem + 2 linhas. */
export function SkeletonCard({
  width = 260,
  imageHeight = 140,
}: {
  width?: DimensionValue;
  imageHeight?: number;
}) {
  const { spacing, radius } = useTheme();
  return (
    <View style={{ width, gap: spacing.sm }} accessibilityLabel="Carregando" accessible>
      <Skeleton height={imageHeight} radius={radius.lg} />
      <Skeleton width="40%" height={10} />
      <Skeleton width="90%" height={14} />
    </View>
  );
}
