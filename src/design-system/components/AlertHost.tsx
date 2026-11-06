import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { haptic } from '@/utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mascot, type MascotPose } from '../mascot';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';
import { Text } from './Text';

export type AlertPriority = 'critical' | 'high' | 'normal' | 'low';
export type AlertVariant = 'goal' | 'matchStart' | 'matchEnd' | 'achievement' | 'info' | 'warning';

export interface AlertAction {
  label: string;
  onPress?: () => void;
}

export interface AlertRequest {
  /** Único por alerta — o mesmo id não entra duas vezes na fila. */
  id: string;
  variant: AlertVariant;
  title: string;
  message: string;
  primary: AlertAction;
  secondary?: AlertAction;
  priority?: AlertPriority;
  /** Mostra o mascote (quando `brandAssets.mascot` existir). Padrão: true. */
  showMascot?: boolean;
}

const PRIORITY_RANK: Record<AlertPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };

/** Pose do mascote (`fan-*`) por tipo de aviso. */
const VARIANT_POSE: Record<AlertVariant, MascotPose> = {
  goal: 'fan-goal',
  matchStart: 'fan-tense',
  matchEnd: 'fan-victory',
  achievement: 'fan-trophy',
  info: 'fan-confident',
  warning: 'fan-complain',
};

interface QueuedAlert extends AlertRequest {
  queuedAt: number;
}

interface AlertContextValue {
  showAlert: (request: AlertRequest) => void;
  /** Aviso curto no topo (3s). */
  showToast: (message: string) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

/**
 * Fila global de avisos in-app (gol, início/fim de jogo, conquistas).
 * Adaptado do PopupHost do Zuno: prioridade + deduplicação por id, um aviso
 * por vez. O mascote do app entra no slot `illustration` quando existir.
 */
export function AlertHost({ children }: { children: ReactNode }) {
  // A fila inteira é o estado; o aviso exibido é sempre o primeiro (sem efeitos).
  const [queue, setQueue] = useState<QueuedAlert[]>([]);
  const current = queue[0] ?? null;
  const seen = useRef(new Set<string>());

  const showAlert = useCallback((request: AlertRequest) => {
    if (seen.current.has(request.id)) return;
    seen.current.add(request.id);
    setQueue((q) => {
      // O aviso já na tela fica no topo; os pendentes são ordenados por prioridade.
      const [showing, ...pending] = q;
      const sorted = [...pending, { ...request, queuedAt: Date.now() }].sort(
        (a, b) =>
          PRIORITY_RANK[a.priority ?? 'normal'] - PRIORITY_RANK[b.priority ?? 'normal'] ||
          a.queuedAt - b.queuedAt
      );
      return showing ? [showing, ...sorted] : sorted;
    });
  }, []);

  const close = (action?: AlertAction) => {
    setQueue((q) => q.slice(1));
    action?.onPress?.();
  };

  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const showToast = useCallback((message: string) => setToast({ id: Date.now(), message }), []);
  const reduceMotion = useReduceMotion();

  const value = useMemo(() => ({ showAlert, showToast }), [showAlert, showToast]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      {current &&
        (current.variant === 'goal' ? (
          reduceMotion ? (
            <GoalToast key={current.id} alert={current} onDone={() => close()} />
          ) : (
            <GoalCelebration key={current.id} alert={current} onClose={close} />
          )
        ) : (
          <AlertModal key={current.id} alert={current} onClose={close} />
        ))}
      {toast && <Toast key={toast.id} message={toast.message} onDone={() => setToast(null)} />}
    </AlertContext.Provider>
  );
}

function AlertModal({ alert, onClose }: { alert: QueuedAlert; onClose: (action?: AlertAction) => void }) {
  const { colors, spacing, radius, motion } = useTheme();
  const reduceMotion = useReduceMotion();
  const opacity = useState(() => new Animated.Value(reduceMotion ? 1 : 0))[0];
  const translateY = useState(() => new Animated.Value(reduceMotion ? 0 : 24))[0];

  useEffect(() => {
    if (alert.variant === 'goal') haptic.goal();
    else if (alert.variant === 'achievement' || alert.variant === 'matchEnd') haptic.success();
  }, [alert.variant]);

  useEffect(() => {
    if (reduceMotion) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: motion.duration.base, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
    ]).start();
  }, [opacity, translateY, reduceMotion, motion]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => onClose()}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay, padding: spacing.xl }]}
        onPress={() => onClose()}
        accessible={false}
      >
        <Animated.View
          style={{ width: '100%', maxWidth: 380, opacity, transform: [{ translateY }] }}
          accessibilityViewIsModal
        >
          <Pressable onPress={() => undefined} accessible={false}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.bgRaised,
                  borderRadius: radius.l,
                  padding: spacing.xl,
                  gap: spacing.lg,
                  borderColor: colors.lineHairline,
                },
              ]}
            >
              {alert.showMascot !== false && (
                <View style={{ alignItems: 'center' }}>
                  <Mascot pose={VARIANT_POSE[alert.variant]} size={120} />
                </View>
              )}
              <View style={{ gap: spacing.xs }}>
                <Text variant="displayM" align="center" accessibilityRole="header">
                  {alert.title}
                </Text>
                <Text variant="body" tone="secondary" align="center">
                  {alert.message}
                </Text>
              </View>
              <View style={{ gap: spacing.sm }}>
                <Button label={alert.primary.label} onPress={() => onClose(alert.primary)} fullWidth />
                {alert.secondary && (
                  <Button
                    label={alert.secondary.label}
                    variant="ghost"
                    onPress={() => onClose(alert.secondary)}
                    fullWidth
                  />
                )}
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

/**
 * Comemoração de gol (especificação 11): tela vermelha inteira por 1,8s,
 * "GOL!" gigante, mascote `fan-goal` entrando com mola e vibração forte.
 * Fecha sozinha ou com um toque.
 */
function GoalCelebration({
  alert,
  onClose,
}: {
  alert: QueuedAlert;
  onClose: (action?: AlertAction) => void;
}) {
  const { colors, motion } = useTheme();
  const t = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    haptic.goal();
    Animated.spring(t, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
    const timer = setTimeout(() => onClose(), 1800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  void motion;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => onClose()}>
      <Pressable
        onPress={() => onClose(alert.primary)}
        accessibilityRole="button"
        accessibilityLabel={`${alert.title}. ${alert.message}. Toque para ver o lance.`}
        style={{
          flex: 1,
          backgroundColor: colors.bgRed,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 20,
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
            opacity: t,
          }}
        >
          <Mascot pose="fan-goal" size={180} />
        </Animated.View>
        <Animated.View
          style={{ transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1.3, 1] }) }] }}
        >
          <Text variant="displayGoal" tone="onPrimary" align="center">
            GOL!
          </Text>
        </Animated.View>
        <Text variant="titleL" tone="onPrimary" align="center">
          {alert.title}
        </Text>
        <Text variant="bodyM" tone="onPrimary" align="center" style={{ opacity: 0.85 }}>
          {alert.message}
        </Text>
      </Pressable>
    </Modal>
  );
}

/** Com "reduzir movimento": o gol vira um toast, sem tela animada. */
function GoalToast({ alert, onDone }: { alert: QueuedAlert; onDone: () => void }) {
  useEffect(() => {
    haptic.goal();
  }, []);
  return <Toast message={`${alert.title} ${alert.message}`} onDone={onDone} />;
}

/** Toast no topo (especificação 12.16): bgRaised2, raio 12, 3s. */
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  const { colors, radius, layout, motion } = useTheme();
  const insets = useSafeAreaInsets();
  const a = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: motion.duration.base, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(a, { toValue: 0, duration: motion.duration.fast, useNativeDriver: true }),
    ]).start(() => onDone());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: layout.gutter,
        right: layout.gutter,
        minHeight: 48,
        borderRadius: radius.m,
        backgroundColor: colors.bgRaised2,
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        opacity: a,
        transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
      }}
    >
      <Text variant="bodyM">{message}</Text>
    </Animated.View>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts precisa estar dentro de <AlertHost>.');
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { alignItems: 'stretch', borderWidth: 1, overflow: 'hidden' },
  stripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  mascot: { width: 120, height: 120, alignSelf: 'center' },
});
