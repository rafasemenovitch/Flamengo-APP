import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

import { Badge, Button, Card, Screen, Text, useTheme } from '@/design-system';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import type { RootScreenProps } from '@/navigation/types';
import { useAppState } from '@/state/AppStateProvider';
import { formatCurrency } from '@/utils/format';
import { haptic } from '@/utils/haptics';

/** Fim de qualquer fluxo de compra: SEMPRE "Compra simulada" (base: OrderConfirmation do Zuno). */
export function CheckoutResultScreen({ route }: RootScreenProps<'CheckoutResult'>) {
  const { orderId, total, kind } = route.params;
  const navigation = useNavigation();
  const { colors, spacing, layout } = useTheme();
  const { refreshProgress } = useAppState();
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(reduceMotion ? 1 : 0.4)).current;

  useEffect(() => {
    refreshProgress();
    haptic.success();
  }, [refreshProgress]);

  useEffect(() => {
    if (!reduceMotion) Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [scale, reduceMotion]);

  return (
    <Screen showBack={false} title="Compra simulada">
      <View style={{ padding: layout.gutter, gap: spacing.xl, alignItems: 'center', paddingTop: spacing.xxxl }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.successSubtle, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={52} color={colors.success} />
          </View>
        </Animated.View>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Badge label="Compra simulada" tone="demo" icon="flask-outline" />
          <Text variant="h1" align="center">{kind === 'tickets' ? 'Ingressos na carteira!' : 'Pedido confirmado!'}</Text>
          <Text variant="body" tone="secondary" align="center">
            Esta é uma demonstração: nenhum pagamento foi feito e nada será entregue.
          </Text>
        </View>
        <Card style={{ alignSelf: 'stretch' }}>
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="callout" tone="secondary">Pedido</Text>
              <Text variant="callout">{orderId}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="callout" tone="secondary">Total simulado</Text>
              <Text variant="bodyStrong">{formatCurrency(total)}</Text>
            </View>
          </View>
        </Card>
        <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
          {kind === 'tickets' ? (
            <Button label="Ver na carteira" icon="wallet" fullWidth onPress={() => navigation.reset({ index: 1, routes: [{ name: 'Tabs', params: { screen: 'Ingressos' } }, { name: 'TicketWallet' }] })} />
          ) : (
            <Button label="Continuar comprando" icon="bag-handle" fullWidth onPress={() => navigation.reset({ index: 1, routes: [{ name: 'Tabs', params: { screen: 'Nacao' } }, { name: 'Store' }] })} />
          )}
          <Button label="Voltar ao início" variant="ghost" fullWidth onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })} />
        </View>
      </View>
    </Screen>
  );
}
