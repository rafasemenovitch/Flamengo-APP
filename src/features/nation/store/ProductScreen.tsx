import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  Button,
  ErrorState,
  IconButton,
  Screen,
  Skeleton,
  Text,
  TreatedImage,
  useAlerts,
  useTheme,
} from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import { formatCurrency } from '@/utils/format';
import { haptic } from '@/utils/haptics';

/** Produto: foto, nome, preço e preço de sócio, tamanhos e adicionar. */
export function ProductScreen({ route }: RootScreenProps<'Product'>) {
  const navigation = useNavigation();
  const { colors, layout, radius } = useTheme();
  const { setCart, cartCount } = useAppState();
  const { showToast } = useAlerts();
  const q = useAsync(() => services.store.getProduct(route.params.productId), [route.params.productId]);
  const [size, setSize] = useState<string>();
  const [adding, setAdding] = useState(false);

  if (q.loading)
    return (
      <Screen title="Produto">
        <Skeleton height={390} radius={0} />
      </Screen>
    );
  if (q.error || !q.data)
    return (
      <Screen title="Produto" scroll={false}>
        <ErrorState onRetry={q.reload} />
      </Screen>
    );
  const p = q.data;
  const needsSize = !!p.sizes?.length;
  const memberPrice = p.price * (1 - p.memberDiscountPct / 100);

  const add = async () => {
    setAdding(true);
    try {
      setCart(await services.store.addToCart(p.id, size));
      haptic.success();
      showToast('Adicionado ao carrinho.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Screen
      title="Loja"
      headerRight={
        <IconButton
          icon="bag-handle-outline"
          variant="plain"
          accessibilityLabel="Carrinho"
          badgeCount={cartCount}
          onPress={() => navigation.navigate('Cart')}
        />
      }
    >
      <TreatedImage imageKey={p.imageKey} aspect="square" style={{ aspectRatio: 1 }} />
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: 24, gap: 24 }}>
        <View style={{ gap: 8 }}>
          {p.tag && (
            <Text variant="overline" tone="brand">
              {p.tag}
            </Text>
          )}
          <Text variant="displayM">{p.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
            <Text variant="displayS">{formatCurrency(p.price)}</Text>
            <Text variant="labelM" tone="brand">
              Sócio {formatCurrency(memberPrice)}
            </Text>
          </View>
        </View>

        {needsSize && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {p.sizes!.map((s) => {
              const sel = s === size;
              return (
                <Pressable
                  key={s}
                  onPress={() => setSize(s)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sel }}
                  accessibilityLabel={`Tamanho ${s}`}
                  style={{
                    minWidth: 52,
                    height: 44,
                    paddingHorizontal: 12,
                    borderRadius: radius.s,
                    borderWidth: sel ? 0 : 1,
                    borderColor: colors.lineHairline,
                    backgroundColor: sel ? colors.inkPrimary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text variant="labelM" style={{ color: sel ? colors.bgCanvas : colors.inkPrimary }}>
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Button
          label={needsSize && !size ? 'Escolha o tamanho' : 'Adicionar ao carrinho'}
          disabled={needsSize && !size}
          loading={adding}
          onPress={add}
          fullWidth
        />
      </View>
    </Screen>
  );
}
