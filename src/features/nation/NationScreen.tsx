import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { View } from 'react-native';

import {
  Button,
  Filters,
  ListGroup,
  ListItem,
  Screen,
  SectionTitle,
  Skeleton,
  TabHeader,
  Text,
  useTheme,
} from '@/design-system';
import { PollCard, QuizCard } from '@/features/shared/Engagement';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { PredictionPool } from '@/types/gamification';
import { formatNumber } from '@/utils/format';
import { MemberCard } from './MemberCard';
import { ProductCard } from './store/StoreScreen';

/** Bolões: o ranking que importa é entre amigos (substitui o ranking solto). */
function PoolsSection({ pools }: { pools: PredictionPool[] }) {
  const navigation = useNavigation();
  const { colors, layout, radius } = useTheme();
  const [poolId, setPoolId] = useState(pools[0]?.id ?? '');
  const pool = pools.find((p) => p.id === poolId) ?? pools[0];
  if (!pool) return null;
  return (
    <View style={{ gap: 16 }}>
      <Filters
        segments={pools.map((p) => ({ key: p.id, label: p.name }))}
        value={pool.id}
        onChange={setPoolId}
      />
      <View
        style={{
          marginHorizontal: layout.gutter,
          backgroundColor: colors.bgRaised,
          borderRadius: radius.l,
          padding: 20,
          gap: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text variant="displayXl">{pool.userPosition}º</Text>
            <Text variant="bodyS" tone="secondary">
              de {pool.members}
            </Text>
          </View>
          <Text variant="labelM" tone="brand">
            {pool.userPoints} pts
          </Text>
        </View>
        <View>
          {pool.leaderboard.map((e, i) => (
            <View
              key={e.name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                height: 44,
                borderTopWidth: i ? 1 : 0,
                borderColor: colors.lineHairline,
              }}
            >
              {e.isYou && (
                <View
                  style={{
                    position: 'absolute',
                    left: -20,
                    top: 10,
                    bottom: 10,
                    width: 3,
                    backgroundColor: colors.accent,
                  }}
                />
              )}
              <Text variant="numericTable" tone="secondary" style={{ width: 20 }}>
                {e.isYou ? pool.userPosition : i + 1}
              </Text>
              <Text
                variant="titleS"
                style={{ flex: 1, color: e.isYou ? colors.accentText : colors.inkPrimary }}
              >
                {e.name}
              </Text>
              <Text variant="bodyS" tone="tertiary">
                {e.exactScores} na mosca
              </Text>
              <Text variant="numericTable" style={{ width: 40, textAlign: 'right' }}>
                {e.points}
              </Text>
            </View>
          ))}
        </View>
        <Text variant="bodyS" tone="secondary">
          Próximo palpite: {pool.nextMatchLabel}. Placar exato vale mais.
        </Text>
        <Button
          label="Dar meu palpite"
          onPress={() => navigation.navigate('Tabs', { screen: 'Inicio' })}
          fullWidth
        />
      </View>
      <View style={{ paddingHorizontal: layout.gutter }}>
        <Button
          label="Ranking geral da Nação"
          variant="link"
          onPress={() => navigation.navigate('Rankings')}
        />
      </View>
    </View>
  );
}

/** Nação: o centro é a parte gamificada; sócio e loja vêm depois. */
export function NationScreen() {
  const navigation = useNavigation();
  const { colors, layout, radius } = useTheme();
  const { progress } = useAppState();
  const membership = useAsync(() => services.membership.getMembership());
  const plans = useAsync(() => services.membership.getPlans());
  const products = useAsync(() => services.store.getProducts());
  const pools = useAsync(() => services.gamification.getPools());
  const plan = plans.data?.find((p) => p.id === membership.data?.planId);
  const toNext = progress?.nextLevel
    ? (progress.points - progress.level.minPoints) / (progress.nextLevel.minPoints - progress.level.minPoints)
    : 1;
  const rival = progress?.luckyFriends.find((f) => f.streak > progress.luckyStreak);

  return (
    <Screen reserveFab>
      <TabHeader title="Nação" subtitle="A maior torcida do Brasil, num lugar só" />

      {/* Nível + pé quente: sem card, sem gradiente. */}
      <View style={{ paddingHorizontal: layout.gutter, marginTop: 48, gap: 12 }}>
        {!progress ? (
          <Skeleton height={160} radius={8} />
        ) : (
          <>
            <Text variant="overline" tone="secondary">
              Nível {progress.level.level}
            </Text>
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

            {/* Pé quente */}
            <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Ionicons name="flame-outline" size={32} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text variant="titleM">
                  Pé quente: {progress.luckyStreak} {progress.luckyStreak === 1 ? 'vitória' : 'vitórias'}{' '}
                  seguidas
                </Text>
                <Text variant="bodyS" tone="secondary">
                  {rival
                    ? `${rival.name} está com ${rival.streak}. Mais ${rival.streak - progress.luckyStreak} no estádio e você alcança.`
                    : 'Você é o mais pé quente entre os amigos.'}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Bolões" subtitle="Acerte o placar e suba no ranking dos amigos" />
        {pools.data ? (
          <PoolsSection pools={pools.data} />
        ) : (
          <View style={{ paddingHorizontal: layout.gutter }}>
            <Skeleton height={280} radius={radius.l} />
          </View>
        )}
      </View>

      <View style={{ marginTop: 48, paddingHorizontal: layout.gutter }}>
        <QuizCard />
      </View>

      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Enquetes da torcida" />
        <View style={{ paddingHorizontal: layout.gutter }}>
          <PollCard />
        </View>
      </View>

      <View style={{ marginTop: 48 }}>
        <ListGroup>
          <ListItem
            large
            title="Passaporte Rubro-Negro"
            subtitle={
              progress
                ? `Seus jogos no estádio · ${progress.luckyStreak} de pé quente`
                : 'Seus jogos no estádio'
            }
            onPress={() => navigation.navigate('Passport')}
          />
          <ListItem
            large
            title="Conquistas"
            subtitle="Suas medalhas"
            onPress={() => navigation.navigate('Gamification')}
          />
          <ListItem
            large
            title="Comunidade"
            subtitle="Grupos de torcedores por região"
            onPress={() => navigation.navigate('Community')}
          />
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
                compra
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
            : products.data?.slice(0, 2).map((p) => (
                <View key={p.id} style={{ width: '48%', flexGrow: 1 }}>
                  <ProductCard
                    product={p}
                    onPress={() => navigation.navigate('Product', { productId: p.id })}
                  />
                </View>
              ))}
        </View>
      </View>
    </Screen>
  );
}
