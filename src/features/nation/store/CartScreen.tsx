import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, DemoBadge, EmptyState, Screen, Text, TreatedImage, useTheme } from '@/design-system';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import { formatCurrency } from '@/utils/format';

/** Carrinho: itens em linhas, resumo curto e checkout SIMULADO (sem dados de cartão). */
export function CartScreen() {
  const navigation = useNavigation();
  const { colors, layout, radius } = useTheme();
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
          pose="fan-empty-cart"
          title="Seu carrinho está vazio."
          message="O manto novo está te esperando."
          actionLabel="Ir para a loja"
          onAction={() => navigation.navigate('Store')}
        />
      </Screen>
    );
  }

  const step = (icon: 'remove' | 'add' | 'trash-outline', label: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 36,
        height: 36,
        borderRadius: radius.s,
        backgroundColor: colors.bgRaised2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      hitSlop={4}
    >
      <Ionicons name={icon} size={16} color={colors.inkPrimary} />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <Screen title="Carrinho" headerRight={<DemoBadge />}>
        <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
          {cart?.items.map((i) => (
            <View
              key={`${i.productId}-${i.size}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                padding: layout.gutter,
                borderBottomWidth: 1,
                borderColor: colors.lineHairline,
              }}
            >
              <TreatedImage
                imageKey={i.product.imageKey}
                aspect="square"
                style={{ width: 72, height: 72, borderRadius: radius.s }}
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="titleS" numberOfLines={2}>
                  {i.product.name}
                </Text>
                <Text variant="numericTable" tone="secondary">
                  {i.size ? `${i.size} · ` : ''}
                  {formatCurrency(i.lineTotal)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {step(
                  i.quantity === 1 ? 'trash-outline' : 'remove',
                  i.quantity === 1 ? 'Remover item' : 'Diminuir',
                  () => update(i.productId, i.size, i.quantity - 1)
                )}
                <Text variant="displayS" style={{ minWidth: 18, textAlign: 'center' }}>
                  {i.quantity}
                </Text>
                {step('add', 'Aumentar', () => update(i.productId, i.size, i.quantity + 1))}
              </View>
            </View>
          ))}
        </View>

        {cart && (
          <View style={{ padding: layout.gutter, gap: 8 }}>
            {[
              ['Subtotal', formatCurrency(cart.subtotal)],
              ['Desconto de sócio', `− ${formatCurrency(cart.memberDiscount)}`],
              ['Frete', cart.shipping === 0 ? 'Grátis' : formatCurrency(cart.shipping)],
            ].map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="bodyM" tone="secondary">
                  {k}
                </Text>
                <Text variant="numericTable">{v}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 120 }} />
      </Screen>

      <SafeAreaView
        edges={['bottom']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.bgCanvas,
          borderTopWidth: 1,
          borderColor: colors.lineHairline,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: layout.gutter, gap: 16 }}>
          <Text variant="displayM" style={{ flex: 1 }}>
            {formatCurrency(cart?.total ?? 0)}
          </Text>
          <Button label="Finalizar" onPress={checkout} loading={paying} disabled={!cart?.items.length} />
        </View>
      </SafeAreaView>
    </View>
  );
}
