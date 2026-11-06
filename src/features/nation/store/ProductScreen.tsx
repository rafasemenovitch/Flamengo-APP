import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge, Button, ErrorState, IconButton, MediaImage, Screen, Skeleton, Text, useAlerts, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import { formatCurrency } from '@/utils/format';
import { haptic } from '@/utils/haptics';

export function ProductScreen({ route }: RootScreenProps<'Product'>) {
  const navigation = useNavigation();
  const { colors, spacing, layout, radius } = useTheme();
  const { setCart, cartCount } = useAppState();
  const { showAlert } = useAlerts();
  const q = useAsync(() => services.store.getProduct(route.params.productId), [route.params.productId]);
  const [size, setSize] = useState<string>();
  const [adding, setAdding] = useState(false);

  if (q.loading) return <Screen title="Produto"><View style={{ padding: layout.gutter, gap: spacing.lg }}><Skeleton height={340} radius={24} /><Skeleton height={120} /></View></Screen>;
  if (q.error || !q.data) return <Screen title="Produto" scroll={false}><ErrorState onRetry={q.reload} /></Screen>;
  const p = q.data;
  const needsSize = !!p.sizes?.length;
  const memberPrice = p.price * (1 - p.memberDiscountPct / 100);

  const add = async () => {
    setAdding(true);
    try {
      setCart(await services.store.addToCart(p.id, size));
      haptic.success();
      showAlert({
        id: `cart-${p.id}-${size}-${Date.now()}`,
        variant: 'info',
        title: 'Adicionado ao carrinho',
        message: `${p.name}${size ? ` · tamanho ${size}` : ''}`,
        primary: { label: 'Ver carrinho', onPress: () => navigation.navigate('Cart') },
        secondary: { label: 'Continuar comprando' },
        showMascot: false,
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Screen title="Produto" headerRight={<IconButton icon="bag-handle-outline" accessibilityLabel="Carrinho" badgeCount={cartCount} onPress={() => navigation.navigate('Cart')} />}>
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.lg }}>
        <MediaImage imageKey={p.imageKey} icon="shirt-outline" style={{ aspectRatio: 1, borderRadius: radius.xl }}>
          {p.tag && <Badge label={p.tag} tone="solidBrand" style={{ position: 'absolute', top: 12, left: 12 }} />}
        </MediaImage>
        <View style={{ gap: spacing.xs }}>
          <Text variant="h1">{p.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
            <Text variant="number">{formatCurrency(p.price)}</Text>
            {p.compareAtPrice && <Text variant="callout" tone="tertiary" style={{ textDecorationLine: 'line-through' }}>{formatCurrency(p.compareAtPrice)}</Text>}
          </View>
          <Text variant="callout" tone="brand">Sócio paga {formatCurrency(memberPrice)} ({p.memberDiscountPct}% off)</Text>
        </View>

        {needsSize && (
          <View style={{ gap: spacing.sm }}>
            <Text variant="title">Tamanho</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {p.sizes!.map((s) => {
                const sel = s === size;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setSize(s)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: sel }}
                    accessibilityLabel={`Tamanho ${s}`}
                    style={{ minWidth: 52, height: 44, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: sel ? colors.primary : colors.border, backgroundColor: sel ? colors.primarySubtle : colors.surface, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text variant="label" tone={sel ? 'brand' : 'primary'}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <Text variant="body" tone="secondary">{p.description}</Text>

        <Button label={needsSize && !size ? 'Escolha um tamanho' : 'Adicionar ao carrinho'} icon="bag-add" disabled={needsSize && !size} loading={adding} onPress={add} fullWidth />
      </View>
    </Screen>
  );
}
