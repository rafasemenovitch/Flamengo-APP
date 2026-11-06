import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

/** Ponto ao vivo de 8px com pulso (assinatura 7.4) + minuto em label.m. Estático sob reduzir movimento. */
export function LiveIndicator({
  minute,
  compact,
  size = 8,
}: {
  minute?: string;
  compact?: boolean;
  size?: number;
}) {
  const { colors, motion } = useTheme();
  const reduceMotion = useReduceMotion();
  const pulse = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: motion.duration.live,
        easing: motion.easing.inOut,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, pulse, motion]);

  const dot = (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          styles.abs,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.live },
          {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
          },
        ]}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.live }} />
    </View>
  );

  if (compact && !minute)
    return (
      <View accessible accessibilityLabel="Ao vivo">
        {dot}
      </View>
    );
  return (
    <View accessible accessibilityLabel={minute ? `Ao vivo, ${minute}` : 'Ao vivo'} style={styles.row}>
      {dot}
      <Text variant="labelM" style={{ color: colors.live }}>
        {minute ?? 'Ao vivo'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  abs: { position: 'absolute' },
});
