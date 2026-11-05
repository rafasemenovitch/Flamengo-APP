import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Image, Modal, Pressable, StyleSheet, View } from 'react-native';

import { brandAssets } from '@assets/brand';
import { useReduceMotion } from '@/hooks/useReduceMotion';
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

const VARIANT_ICON: Record<AlertVariant, keyof typeof Ionicons.glyphMap> = {
  goal: 'football',
  matchStart: 'play-circle',
  matchEnd: 'flag',
  achievement: 'trophy',
  info: 'information-circle',
  warning: 'alert-circle',
};

interface QueuedAlert extends AlertRequest {
  queuedAt: number;
}

interface AlertContextValue {
  showAlert: (request: AlertRequest) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

/**
 * Fila global de avisos in-app (gol, início/fim de jogo, conquistas).
 * Adaptado do PopupHost do Zuno: prioridade + deduplicação por id, um aviso
 * por vez. O mascote do app entra no slot `illustration` quando existir.
 */
export function AlertHost({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueuedAlert[]>([]);
  const [current, setCurrent] = useState<QueuedAlert | null>(null);
  const seen = useRef(new Set<string>());

  const showAlert = useCallback((request: AlertRequest) => {
    if (seen.current.has(request.id)) return;
    seen.current.add(request.id);
    setQueue((q) =>
      [...q, { ...request, queuedAt: Date.now() }].sort(
        (a, b) => PRIORITY_RANK[a.priority ?? 'normal'] - PRIORITY_RANK[b.priority ?? 'normal'] || a.queuedAt - b.queuedAt
      )
    );
  }, []);

  useEffect(() => {
    if (current || queue.length === 0) return;
    const [next, ...rest] = queue;
    setCurrent(next ?? null);
    setQueue(rest);
  }, [current, queue]);

  const close = (action?: AlertAction) => {
    setCurrent(null);
    action?.onPress?.();
  };

  const value = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      {current && <AlertModal alert={current} onClose={close} />}
    </AlertContext.Provider>
  );
}

function AlertModal({ alert, onClose }: { alert: QueuedAlert; onClose: (action?: AlertAction) => void }) {
  const { colors, spacing, radius, motion } = useTheme();
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : 24)).current;

  useEffect(() => {
    if (reduceMotion) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: motion.duration.base, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
    ]).start();
  }, [opacity, translateY, reduceMotion, motion]);

  const accent = alert.variant === 'warning' ? colors.warning : alert.variant === 'achievement' ? colors.gold : colors.primary;
  const mascot = alert.showMascot !== false ? brandAssets.mascot : null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => onClose()}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay, padding: spacing.xl }]} onPress={() => onClose()} accessible={false}>
        <Animated.View style={{ width: '100%', maxWidth: 380, opacity, transform: [{ translateY }] }} accessibilityViewIsModal>
          <Pressable onPress={() => undefined} accessible={false}>
            <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg, borderColor: colors.border }]}>
              <View style={[styles.stripe, { backgroundColor: accent }]} />
              {mascot ? (
                <Image source={mascot} style={styles.mascot} resizeMode="contain" accessibilityIgnoresInvertColors />
              ) : (
                <View style={[styles.iconCircle, { backgroundColor: colors.primarySubtle }]}>
                  <Ionicons name={VARIANT_ICON[alert.variant]} size={30} color={alert.variant === 'achievement' ? colors.gold : colors.primaryText} />
                </View>
              )}
              <View style={{ gap: spacing.xs }}>
                <Text variant="h2" align="center" accessibilityRole="header">
                  {alert.title}
                </Text>
                <Text variant="body" tone="secondary" align="center">
                  {alert.message}
                </Text>
              </View>
              <View style={{ gap: spacing.sm }}>
                <Button label={alert.primary.label} onPress={() => onClose(alert.primary)} fullWidth />
                {alert.secondary && (
                  <Button label={alert.secondary.label} variant="ghost" onPress={() => onClose(alert.secondary)} fullWidth />
                )}
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
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
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  mascot: { width: 120, height: 120, alignSelf: 'center' },
});
