import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { View } from 'react-native';

import {
  Badge,
  EmptyState,
  ErrorState,
  IconButton,
  PressableScale,
  Screen,
  SegmentedControl,
  Skeleton,
  Text,
  TreatedImage,
  useTheme,
} from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { Product, ProductCategory } from '@/types/commerce';
import { formatCurrency } from '@/utils/format';

type Cat = 'todos' | ProductCategory;
const CATS: { key: Cat; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'camisas', label: 'Camisas' },
  { key: 'treino', label: 'Treino' },
  { key: 'casual', label: 'Casual' },
  { key: 'acessorios', label: 'Acessórios' },
  { key: 'infantil', label: 'Infantil' },
];

/** Produto (especificação 13.4): imagem 1:1 raio 16, nome, preço e preço de sócio em vermelho. */
export function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const { radius } = useTheme();
  const memberPrice = product.price * (1 - product.memberDiscountPct / 100);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`${product.name}, ${formatCurrency(product.price)}`}
      style={{ gap: 8 }}
    >
      <TreatedImage
        imageKey={product.imageKey}
        aspect="square"
        style={{ aspectRatio: 1, borderRadius: radius.l }}
      >
        {product.tag && (
          <Badge label={product.tag} tone="onMedia" style={{ position: 'absolute', top: 8, left: 8 }} />
        )}
      </TreatedImage>
      <Text variant="titleS" numberOfLines={2} style={{ minHeight: 44 }}>
        {product.name}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Text variant="numericTable">{formatCurrency(product.price)}</Text>
        {product.compareAtPrice && (
          <Text variant="bodyS" tone="tertiary" style={{ textDecorationLine: 'line-through' }}>
            {formatCurrency(product.compareAtPrice)}
          </Text>
        )}
      </View>
      <Text variant="labelM" tone="brand">
        Sócio {formatCurrency(memberPrice)}
      </Text>
    </PressableScale>
  );
}

export function StoreScreen({ route }: RootScreenProps<'Store'>) {
  const navigation = useNavigation();
  const { spacing, layout } = useTheme();
  const { cartCount } = useAppState();
  const [cat, setCat] = useState<Cat>(route.params?.category ?? 'todos');
  const q = useAsync(() => services.store.getProducts(cat === 'todos' ? undefined : cat), [cat]);

  return (
    <Screen
      title="Loja"
      headerRight={
        <IconButton
          icon="bag-handle-outline"
          accessibilityLabel="Carrinho"
          badgeCount={cartCount}
          onPress={() => navigation.navigate('Cart')}
        />
      }
      refreshing={q.refreshing}
      onRefresh={q.refresh}
    >
      <View style={{ paddingHorizontal: layout.gutter, paddingBottom: spacing.md }}>
        <Text variant="caption" tone="secondary">
          Produtos e preços demonstrativos · desconto de sócio aplicado no carrinho
        </Text>
      </View>
      <SegmentedControl segments={CATS} value={cat} onChange={setCat} accessibilityLabel="Categorias" />
      <View style={{ paddingHorizontal: layout.gutter, marginTop: spacing.lg }}>
        {q.loading ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width="47%" height={260} radius={20} />
            ))}
          </View>
        ) : q.error ? (
          <ErrorState compact onRetry={q.reload} />
        ) : q.data?.length === 0 ? (
          <EmptyState compact icon="shirt-outline" title="Nada nesta categoria" />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {q.data?.map((p) => (
              <View key={p.id} style={{ flexBasis: '47%', flexGrow: 1, maxWidth: '50%' }}>
                <ProductCard
                  product={p}
                  onPress={() => navigation.navigate('Product', { productId: p.id })}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
