import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, PanResponder, Pressable, View } from 'react-native';

import { useTheme } from '@/design-system';

export type Snap = 'collapsed' | 'mid' | 'full';
const ORDER: Snap[] = ['collapsed', 'mid', 'full'];

/**
 * Folha inferior do mapa com três alturas. Arrasta-se pela parte de cima (alça e
 * cabeçalho); o conteúdo rola por dentro. Tocar na alça alterna entre as alturas.
 */
export function MapSheet({
  snap,
  onSnap,
  heights,
  header,
  children,
}: {
  snap: Snap;
  onSnap: (s: Snap) => void;
  heights: Record<Snap, number>;
  /** Parte fixa (sempre visível na altura recolhida). */
  header: ReactNode;
  children: ReactNode;
}) {
  const { colors, radius, motion, elevation } = useTheme();
  const [height] = useState(() => new Animated.Value(heights[snap]));
  /** Estado do gesto: lido e escrito só em eventos e efeitos, nunca no render. */
  const live = useRef({ start: 0, now: heights[snap], reduced: false, heights, snap, onSnap });
  useEffect(() => {
    Object.assign(live.current, { heights, snap, onSnap });
  });
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => (live.current.reduced = v))
      .catch(() => undefined);
    const id = height.addListener(({ value }) => (live.current.now = value));
    return () => height.removeListener(id);
  }, [height]);

  // Vai para a altura pedida (inclusive quando a tela muda de tamanho).
  useEffect(() => {
    const to = heights[snap];
    if (live.current.reduced) height.setValue(to);
    else
      Animated.timing(height, {
        toValue: to,
        duration: motion.duration.base,
        easing: motion.easing.standard,
        useNativeDriver: false,
      }).start();
  }, [snap, heights, height, motion]);

  // Os handlers só leem `live` durante o gesto, nunca no render.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        height.stopAnimation();
        live.current.start = live.current.now;
      },
      onPanResponderMove: (_, g) => {
        const { heights: h, start } = live.current;
        height.setValue(Math.max(h.collapsed - 24, Math.min(h.full, start - g.dy)));
      },
      onPanResponderRelease: (_, g) => {
        const { heights: h, onSnap: set, snap: was, start, reduced } = live.current;
        // Gesto rápido: vai para a próxima altura na direção do gesto.
        const at = start - g.dy;
        let next: Snap;
        if (Math.abs(g.vy) > 0.6) {
          const i = ORDER.indexOf(was);
          next = ORDER[Math.max(0, Math.min(2, i + (g.vy < 0 ? 1 : -1)))]!;
        } else next = ORDER.reduce((a, b) => (Math.abs(h[b] - at) < Math.abs(h[a] - at) ? b : a));
        set(next);
        // Volta animando mesmo se a altura escolhida não mudou.
        Animated.timing(height, {
          toValue: h[next],
          duration: reduced ? 0 : 160,
          useNativeDriver: false,
        }).start();
      },
    })
  );

  const cycle = () => onSnap(snap === 'collapsed' ? 'mid' : snap === 'mid' ? 'full' : 'collapsed');

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height,
          backgroundColor: colors.bgRaised,
          borderTopLeftRadius: radius.l,
          borderTopRightRadius: radius.l,
          overflow: 'hidden',
        },
        elevation.floating,
        { shadowOpacity: 0.18 },
      ]}
    >
      <View {...pan.panHandlers}>
        <Pressable
          onPress={cycle}
          accessibilityRole="adjustable"
          accessibilityLabel="Painel do mapa"
          accessibilityHint="Toque para mudar a altura do painel"
          hitSlop={8}
          style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 6 }}
        >
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.lineHairline }} />
        </Pressable>
        {header}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </Animated.View>
  );
}
