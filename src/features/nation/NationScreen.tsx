import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Pressable, View } from 'react-native';

import { Button, Monogram, Screen, SectionTitle, Skeleton, TabHeader, Text, useTheme } from '@/design-system';
import { closesIn } from '@/features/bolao/BolaoParts';
import { PollCard, QuizCard } from '@/features/shared/Engagement';
import { StreakCount } from '@/features/shared/Flame';
import { CaravanRow, GroupRow } from './CommunityScreen';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import { formatNumber } from '@/utils/format';

/**
 * Entrada do Bolão da Nação: o próximo jogo para palpitar e as posições nos
 * bolões. Tudo o mais (palpites, grupos, convites, regras) fica no Bolão.
 */
function BolaoEntry() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { colors, layout, radius } = useTheme();
  const q = useAsync(async () => {
    const [summary, matches, pools] = await Promise.all([
      services.bolao.getSummary(),
      services.bolao.getMatches(),
      services.bolao.getMyPools(),
    ]);
    return {
      summary,
      next: matches.open.find((m) => !m.locked),
      pools: pools.filter((p) => p.status === 'member'),
    };
  }, [isFocused]);

  if (!q.data)
    return (
      <View style={{ paddingHorizontal: layout.gutter }}>
        <Skeleton height={280} radius={radius.l} />
      </View>
    );
  const { summary, next, pools } = q.data;
  return (
    <View style={{ marginHorizontal: layout.gutter, borderRadius: radius.l, overflow: 'hidden' }}>
      <Pressable
        onPress={() => navigation.navigate('Bolao')}
        accessibilityRole="button"
        accessibilityLabel="Abrir o Bolão da Nação"
        style={({ pressed }) => ({
          backgroundColor: colors.bgRed,
          padding: 20,
          gap: 16,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Monogram
          color="white"
          width={150}
          opacity={0.1}
          style={{ position: 'absolute', right: -30, top: -20 }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <Text variant="displayM" tone="onPrimary">
            Bolão da Nação
          </Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="displayM" tone="onPrimary">
              {summary.totalPoints}
            </Text>
            <Text variant="bodyS" tone="onPrimary" style={{ opacity: 0.8 }}>
              pontos
            </Text>
          </View>
        </View>
        {next && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text variant="titleS" tone="onPrimary">
                {next.match.homeTeam.shortName} × {next.match.awayTeam.shortName}
              </Text>
              <Text variant="bodyS" tone="onPrimary" style={{ opacity: 0.8 }}>
                {next.guess
                  ? `Seu palpite: ${next.guess.home} × ${next.guess.away}`
                  : closesIn(next.match.kickoff)}
              </Text>
            </View>
            <Button
              label={next.guess ? 'Mudar' : 'Palpitar'}
              variant="light"
              size="sm"
              onPress={() => navigation.navigate('BolaoGuess', { matchId: next.match.id })}
            />
          </View>
        )}
      </Pressable>
      <View style={{ backgroundColor: colors.bgRaised }}>
        {pools.slice(0, 3).map((p, i) => {
          const pos = p.members.findIndex((m) => m.isYou) + 1;
          return (
            <Pressable
              key={p.id}
              onPress={() => navigation.navigate('BolaoPool', { poolId: p.id })}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 20,
                minHeight: 56,
                borderTopWidth: i ? 1 : 0,
                borderColor: colors.lineHairline,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text variant="displayS" style={{ width: 44 }}>
                {pos}º
              </Text>
              <Text variant="titleS" numberOfLines={1} style={{ flex: 1 }}>
                {p.name}
              </Text>
              <Text variant="bodyS" tone="tertiary">
                {p.members.length} pessoas
              </Text>
            </Pressable>
          );
        })}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            padding: 16,
            borderTopWidth: 1,
            borderColor: colors.lineHairline,
          }}
        >
          <Button
            label="Criar bolão"
            variant="secondary"
            size="sm"
            onPress={() => navigation.navigate('BolaoCreate')}
            style={{ flex: 1 }}
          />
          <Button
            label="Entrar com código"
            variant="secondary"
            size="sm"
            onPress={() => navigation.navigate('BolaoJoin')}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </View>
  );
}

/** Nação: a comunidade (pontos, pé quente, bolões, grupos e caravanas, quiz, enquetes). */
export function NationScreen() {
  const navigation = useNavigation();
  const { colors, layout, radius } = useTheme();
  const { progress } = useAppState();
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
        <SectionTitle title="Bolão" action="Abrir" onAction={() => navigation.navigate('Bolao')} />
        <BolaoEntry />
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
