import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';

import {
  Button,
  ListGroup,
  ListItem,
  Screen,
  SectionTitle,
  Skeleton,
  TabHeader,
  Text,
  useTheme,
} from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import type { RootStackParamList } from '@/navigation/types';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import { formatNumber } from '@/utils/format';
import { MemberCard } from './MemberCard';
import { ProductCard } from './store/StoreScreen';

const ROWS: { route: keyof RootStackParamList; title: string; subtitle: string }[] = [
  { route: 'Passport', title: 'Passaporte Rubro-Negro', subtitle: 'Seus jogos no estádio' },
  { route: 'Rankings', title: 'Rankings', subtitle: 'Geral, semanal, amigos' },
  { route: 'Community', title: 'Comunidade', subtitle: 'Grupos por região' },
  { route: 'Gamification', title: 'Conquistas', subtitle: 'Medalhas e bolões' },
];

/** Nação (especificação 13.4). */
export function NationScreen() {
  const navigation = useNavigation();
  const { colors, layout, radius } = useTheme();
  const { progress } = useAppState();
  const membership = useAsync(() => services.membership.getMembership());
  const plans = useAsync(() => services.membership.getPlans());
  const products = useAsync(() => services.store.getProducts());
  const plan = plans.data?.find((p) => p.id === membership.data?.planId);
  const toNext = progress?.nextLevel
    ? (progress.points - progress.level.minPoints) / (progress.nextLevel.minPoints - progress.level.minPoints)
    : 1;

  return (
    <Screen reserveFab>
      <TabHeader title="Nação" subtitle="A maior torcida do Brasil, num lugar só" />

      {/* Bloco de nível: sem card, sem gradiente. */}
      <View style={{ paddingHorizontal: layout.gutter, marginTop: 48, gap: 12 }}>
        {!progress ? (
          <Skeleton height={120} radius={8} />
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="overline" tone="secondary">
                Nível {progress.level.level}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="flame-outline" size={16} color={colors.warning} />
                <Text variant="labelM" tone="secondary">
                  {progress.attendanceStreak} jogos seguidos
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Text variant="displayL">{progress.level.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text variant="displayXl">{formatNumber(progress.points)}</Text>
                <Text variant="bodyS" tone="secondary">
                  pts
                </Text>
              </View>
            </View>
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(toNext * 100) }}
              style={{
                height: 4,
                borderRadius: radius.full,
                backgroundColor: colors.bgRaised2,
                overflow: 'hidden',
              }}
            >
              <View style={{ width: `${toNext * 100}%`, height: '100%', backgroundColor: colors.accent }} />
            </View>
            <Text variant="bodyS" tone="secondary">
              {progress.nextLevel
                ? `${formatNumber(progress.nextLevel.minPoints - progress.points)} pts para ${progress.nextLevel.name}`
                : 'Nível máximo'}
            </Text>
          </>
        )}
      </View>

      <View style={{ marginTop: 48 }}>
        <ListGroup>
          {ROWS.map((r) => (
            <ListItem
              key={r.route}
              large
              title={r.title}
              subtitle={r.subtitle}
              onPress={() => navigation.navigate(r.route as never)}
            />
          ))}
        </ListGroup>
      </View>

      <View style={{ marginTop: 48 }}>
        <SectionTitle
          title="Sócio-Torcedor"
          action="Ver planos"
          onAction={() => navigation.navigate('Membership')}
        />
        <View style={{ paddingHorizontal: layout.gutter, gap: 12 }}>
          {membership.data && plan ? (
            <>
              <MemberCard membership={membership.data} plan={plan} />
              <Text variant="bodyS" tone="secondary">
                {plan.ticketDiscountPct}% sobre a inteira no Maracanã · prioridade {plan.ticketPriority} na
                compra · {plan.guests}
              </Text>
            </>
          ) : (
            <Skeleton height={200} radius={radius.l} />
          )}
        </View>
      </View>

      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Loja" action="Ver loja" onAction={() => navigation.navigate('Store')} />
        <View style={{ paddingHorizontal: layout.gutter, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {products.loading
            ? [0, 1].map((i) => <Skeleton key={i} width="48%" height={240} radius={radius.l} />)
            : products.data?.slice(0, 4).map((p) => (
                <View key={p.id} style={{ width: '48%', flexGrow: 1 }}>
                  <ProductCard
                    product={p}
                    onPress={() => navigation.navigate('Product', { productId: p.id })}
                  />
                </View>
              ))}
        </View>
        <View style={{ paddingHorizontal: layout.gutter, marginTop: 8 }}>
          <Button label="Ver todos os produtos" variant="link" onPress={() => navigation.navigate('Store')} />
        </View>
      </View>
    </Screen>
  );
}
