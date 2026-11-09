import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { Badge, Button, Screen, Text, useTheme, Mascot } from '@/design-system';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import type { RootScreenProps } from '@/navigation/types';
import { useAppState } from '@/state/AppStateProvider';
import { formatCurrency } from '@/utils/format';
import { haptic } from '@/utils/haptics';

/** Fim de qualquer fluxo de compra: SEMPRE "Compra simulada" (base: OrderConfirmation do Zuno). */
export function CheckoutResultScreen({ route }: RootScreenProps<'CheckoutResult'>) {
  const { orderId, total, kind } = route.params;
  const navigation = useNavigation();
  const { spacing, layout } = useTheme();
  const { refreshProgress } = useAppState();
  const reduceMotion = useReduceMotion();
  const scale = useState(() => new Animated.Value(reduceMotion ? 1 : 0.4))[0];

  useEffect(() => {
    refreshProgress();
    haptic.success();
  }, [refreshProgress]);

  useEffect(() => {
    if (!reduceMotion) Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [scale, reduceMotion]);

  return (
    <Screen showBack={false} title="Compra simulada">
      <View
        style={{ padding: layout.gutter, gap: spacing.xl, alignItems: 'center', paddingTop: spacing.xxxl }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Mascot pose="fan-ticket" size={160} />
        </Animated.View>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Badge label="Compra simulada" tone="demo" icon="flask-outline" />
          <Text variant="displayM" align="center">
            {kind === 'tickets' ? 'Ingressos na carteira!' : 'Pedido confirmado!'}
          </Text>
        </View>
        <Text variant="displayXl" align="center">
          {formatCurrency(total)}
        </Text>
        <Text variant="bodyS" tone="tertiary" align="center">
          Pedido {orderId} · nada foi cobrado
        </Text>
        <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
          {kind === 'tickets' ? (
            <Button
              label="Ver na carteira"
              icon="wallet"
              fullWidth
              onPress={() =>
                navigation.reset({
                  index: 1,
                  routes: [{ name: 'Tabs', params: { screen: 'Ingressos' } }, { name: 'TicketWallet' }],
                })
              }
            />
          ) : (
            <Button
              label="Continuar comprando"
              icon="bag-handle"
              fullWidth
              onPress={() =>
                navigation.reset({
                  index: 1,
                  routes: [{ name: 'Tabs', params: { screen: 'Nacao' } }, { name: 'Store' }],
                })
              }
            />
          )}
          <Button
            label="Voltar ao início"
            variant="ghost"
            fullWidth
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })}
          />
        </View>
      </View>
    </Screen>
  );
}
