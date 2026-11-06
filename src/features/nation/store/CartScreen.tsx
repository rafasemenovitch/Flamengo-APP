import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, DemoBadge, EmptyState, MediaImage, Screen, Text, useTheme } from '@/design-system';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import { formatCurrency } from '@/utils/format';

/** Carrinho (base: CartScreen do Zuno) com desconto de sócio, frete e checkout SIMULADO. */
export function CartScreen() {
  const navigation = useNavigation();
  const { colors, spacing, layout, radius } = useTheme();
  const { cart, setCart } = useAppState();
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    services.store.getCart().then(setCart);
  }, [setCart]);

  const update = async (productId: string, size: string | undefined, qty: number) =>
    setCart(await services.store.updateQuantity(productId, size, qty));

  const checkout = async () => {
    setPaying(true);
    try {
      const order = await services.store.checkout();
      setCart(await services.store.getCart());
      navigation.navigate('CheckoutResult', { orderId: order.orderId, total: order.total, kind: 'store' });
    } finally {
      setPaying(false);
    }
  };

  if (cart && cart.items.length === 0) {
    return (
      <Screen title="Carrinho" scroll={false}>
        <EmptyState
          icon="bag-outline"
          title="Seu carrinho está vazio"
          message="Que tal o novo Manto?"
          actionLabel="Ir para a loja"
          onAction={() => navigation.navigate('Store')}
        />
      </Screen>
    );
  }

  return (
    <Screen title="Carrinho" headerRight={<DemoBadge />}>
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.md }}>
        {cart?.items.map((i) => (
          <Card key={`${i.productId}-${i.size}`} padding="sm">
            <View style={[styles.row, { gap: spacing.md }]}>
              <MediaImage
                imageKey={i.product.imageKey}
                icon="shirt-outline"
                style={{ width: 72, height: 72, borderRadius: radius.md }}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" numberOfLines={2}>
                  {i.product.name}
                </Text>
                {i.size && (
                  <Text variant="caption" tone="secondary">
                    Tamanho {i.size}
                  </Text>
                )}
                <Text variant="callout">{formatCurrency(i.lineTotal)}</Text>
              </View>
              <View style={[styles.row, { gap: 4 }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={i.quantity === 1 ? 'Remover item' : 'Diminuir quantidade'}
                  onPress={() => update(i.productId, i.size, i.quantity - 1)}
                  style={styles.qty}
                  hitSlop={4}
                >
                  <Ionicons
                    name={i.quantity === 1 ? 'trash-outline' : 'remove-circle-outline'}
                    size={24}
                    color={colors.primaryText}
                  />
                </Pressable>
                <Text variant="tabular" style={{ minWidth: 16, textAlign: 'center' }}>
                  {i.quantity}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Aumentar quantidade"
                  onPress={() => update(i.productId, i.size, i.quantity + 1)}
                  style={styles.qty}
                  hitSlop={4}
                >
                  <Ionicons name="add-circle-outline" size={24} color={colors.primaryText} />
                </Pressable>
              </View>
            </View>
          </Card>
        ))}

        {cart && (
          <Card>
            <View style={{ gap: spacing.sm }}>
              {[
                ['Subtotal', formatCurrency(cart.subtotal), 'primary'],
                ['Desconto de sócio', `− ${formatCurrency(cart.memberDiscount)}`, 'success'],
                ['Frete', cart.shipping === 0 ? 'Grátis' : formatCurrency(cart.shipping), 'primary'],
              ].map(([k, v, tone]) => (
                <View key={k} style={styles.between}>
                  <Text variant="callout" tone="secondary">
                    {k}
                  </Text>
                  <Text variant="callout" tone={tone as 'primary' | 'success'}>
                    {v}
                  </Text>
                </View>
              ))}
              <View
                style={[
                  styles.between,
                  {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                    paddingTop: spacing.sm,
                  },
                ]}
              >
                <Text variant="title">Total</Text>
                <Text variant="number">{formatCurrency(cart.total)}</Text>
              </View>
            </View>
          </Card>
        )}

        <Card variant="outline">
          <View style={[styles.row, { gap: spacing.sm, alignItems: 'flex-start' }]}>
            <Ionicons name="shield-checkmark" size={18} color={colors.demo} />
            <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
              Checkout demonstrativo: nenhum dado de cartão é solicitado e nada é cobrado.
            </Text>
          </View>
        </Card>
        <Button
          label="Finalizar compra simulada"
          icon="checkmark-circle"
          onPress={checkout}
          loading={paying}
          disabled={!cart?.items.length}
          fullWidth
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qty: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
});
