import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Filters, Screen, SectionTitle, Skeleton, TabHeader, Text, useTheme } from '@/design-system';
import { PollCard, QuizCard } from '@/features/shared/Engagement';
import { StreakCount } from '@/features/shared/Flame';
import { CaravanRow, GroupRow } from './CommunityScreen';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { PredictionPool } from '@/types/gamification';
import { formatNumber } from '@/utils/format';

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
        <Button
          label="Dar meu palpite"
          onPress={() => navigation.navigate('Tabs', { screen: 'Inicio' })}
          fullWidth
        />
      </View>
    </View>
  );
}

/** Nação: a comunidade (pontos, pé quente, bolões, grupos e caravanas, quiz, enquetes). */
export function NationScreen() {
  const navigation = useNavigation();
  const { colors, layout, radius } = useTheme();
  const { progress } = useAppState();
  const pools = useAsync(() => services.gamification.getPools());
  const groups = useAsync(() => services.gamification.getCommunityGroups());
  const myGroups = groups.data?.filter((g) => g.joined) ?? [];
  const caravan = groups.data?.find((g) => g.caravan && !g.joined);
  const toNext = progress?.nextLevel
    ? (progress.points - progress.level.minPoints) / (progress.nextLevel.minPoints - progress.level.minPoints)
    : 1;

  return (
    <Screen reserveFab>
      <TabHeader
        title="Nação"
        right={
          <Button
            label="Ver ranking geral"
            variant="secondary"
            size="sm"
            onPress={() => navigation.navigate('Rankings')}
          />
        }
      />

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

            {/* Pé quente: vitórias seguidas nos jogos em que você foi */}
            <View style={{ marginTop: 40, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <StreakCount value={progress.luckyStreak} />
              <View style={{ flex: 1, paddingBottom: 6 }}>
                <Text variant="titleM">Pé quente</Text>
                <Text variant="bodyM" tone="secondary">
                  {progress.luckyStreak === 1 ? 'vitória seguida' : 'vitórias seguidas'} com você no estádio
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Bolões" />
        {pools.data ? (
          <PoolsSection pools={pools.data} />
        ) : (
          <View style={{ paddingHorizontal: layout.gutter }}>
            <Skeleton height={280} radius={radius.l} />
          </View>
        )}
      </View>

      {/* Comunidade: logo depois dos bolões, é o coração da Nação. */}
      <View style={{ marginTop: 48 }}>
        <SectionTitle
          title="Grupos da torcida"
          action="Ver todos"
          onAction={() => navigation.navigate('Community')}
        />
        {groups.loading ? (
          <View style={{ paddingHorizontal: layout.gutter }}>
            <Skeleton height={160} radius={8} />
          </View>
        ) : (
          <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
            {myGroups.map((g) => (
              <GroupRow key={g.id} group={g} onPress={() => navigation.navigate('Community')} />
            ))}
            {caravan && <CaravanRow group={caravan} />}
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
    </Screen>
  );
}
