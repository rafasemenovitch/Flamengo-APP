import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { PressableScale, useTheme } from '@/design-system';
import { AssistantAvatar } from '@/features/assistant/ChatParts';
import { useReduceMotion } from '@/hooks/useReduceMotion';

/**
 * FAB do Assistente Fla (especificação 12.15): 56px, 20px da direita, 16px
 * acima da tab bar. Some ao rolar para baixo e volta ao rolar para cima.
 * As telas com FAB reservam 96px no fim do scroll.
 */
export function AssistantFab({
  bottom,
  visible,
  onPress,
}: {
  bottom: number;
  visible: boolean;
  onPress: () => void;
}) {
  const { colors, layout, elevation, motion } = useTheme();
  const reduceMotion = useReduceMotion();
  const anim = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: reduceMotion ? motion.duration.reduced : motion.duration.fast,
      useNativeDriver: true,
    }).start();
  }, [visible, anim, reduceMotion, motion]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.wrap,
        {
          bottom,
          right: layout.gutter,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        },
      ]}
    >
      <PressableScale
        onPress={onPress}
        accessibilityLabel="Abrir Assistente Fla"
        accessibilityHint="Tire dúvidas sobre jogos, ingressos, estádio e sócio"
        scaleTo={0.92}
        style={[
          styles.fab,
          elevation.floating,
          {
            width: layout.fabSize,
            height: layout.fabSize,
            borderRadius: layout.fabSize / 2,
            backgroundColor: colors.accent,
          },
        ]}
      >
        <AssistantAvatar expression="neutral" size={50} />
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
  fab: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
