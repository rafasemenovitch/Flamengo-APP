import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { useCountdown } from '@/hooks/useCountdown';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { pad2 } from '@/utils/format';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

/** Grupo de dígitos: ao mudar, o novo valor entra com deslize vertical de 10px + fade (160ms). */
function RollingNumber({ value, onMedia }: { value: string; onMedia?: boolean }) {
  const { motion } = useTheme();
  const reduceMotion = useReduceMotion();
  const anim = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    if (reduceMotion) return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: motion.duration.fast,
      easing: motion.easing.standard,
      useNativeDriver: true,
    }).start();
  }, [value, anim, reduceMotion, motion]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
      }}
    >
      <Text variant="displayHero" tone={onMedia ? 'onMedia' : 'primary'}>
        {value}
      </Text>
    </Animated.View>
  );
}

/**
 * Contagem regressiva (especificação 12.6): três grupos display.hero sem
 * caixas e sem dois-pontos, com rótulos overline embaixo.
 */
export function Countdown({ target, onMedia }: { target: string; onMedia?: boolean }) {
  const c = useCountdown(target);
  if (!c) return null;
  const groups: [number, string][] =
    c.days > 0
      ? [
          [c.days, 'dias'],
          [c.hours, 'horas'],
          [c.minutes, 'min'],
        ]
      : [
          [c.hours, 'horas'],
          [c.minutes, 'min'],
          [c.seconds, 'seg'],
        ];
  return (
    <View
      style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}
      accessible
      accessibilityLabel={`Faltam ${groups.map(([v, l]) => `${v} ${l}`).join(', ')}`}
    >
      {groups.map(([v, l]) => (
        <View key={l} style={{ alignItems: 'center' }}>
          <RollingNumber value={pad2(v)} onMedia={onMedia} />
          <Text
            variant="overline"
            tone={onMedia ? 'onMedia' : 'secondary'}
            style={{ opacity: onMedia ? 0.8 : 1 }}
          >
            {l}
          </Text>
        </View>
      ))}
    </View>
  );
}
