import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

/**
 * Selo "AO VIVO" com pulso (técnica do StreakFlame do Zuno: loop de
 * Animated com driver nativo). Estático sob "reduzir movimento".
 */
export function LiveIndicator({ minute, compact }: { minute?: string; compact?: boolean }) {
  const { colors, motion, radius } = useTheme();
  const reduceMotion = useReduceMotion();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: motion.duration.pulse,
        easing: motion.easing.decelerate,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, pulse, motion]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <View
      accessible
      accessibilityLabel={minute ? `Ao vivo, ${minute}` : 'Ao vivo'}
      style={[styles.row, !compact && { backgroundColor: colors.liveSubtle, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 }]}
    >
      <View style={styles.dotWrap}>
        <Animated.View
          style={[styles.dot, styles.ring, { backgroundColor: colors.live, opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
        />
        <View style={[styles.dot, { backgroundColor: colors.live }]} />
      </View>
      <Text variant="overline" tone="live" style={styles.label}>
        Ao vivo{minute ? ` · ${minute}` : ''}
      </Text>
    </View>
  );
}

const DOT = 8;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  dotWrap: { width: DOT, height: DOT, alignItems: 'center', justifyContent: 'center' },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  ring: { position: 'absolute' },
  label: { fontSize: 11 },
});
