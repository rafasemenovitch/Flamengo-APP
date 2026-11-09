import { useNavigation } from '@react-navigation/native';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { EmptyState, ErrorState, Screen, Skeleton, Text, useTheme } from '@/design-system';
import { Flame } from '@/features/shared/Flame';
import { isFla } from '@/features/shared/MatchUI';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import { formatDayLabel } from '@/utils/format';
import { NextStamp, Stamp } from './Stamp';

/**
 * Passaporte Rubro-Negro: o pé quente no topo e as páginas de carimbos,
 * um por jogo no estádio, do mais recente para o mais antigo.
 */
export function PassportScreen() {
  const navigation = useNavigation();
  const { layout } = useTheme();
  const { width } = useWindowDimensions();
  const { progress } = useAppState();
  const q = useAsync(() => services.gamification.getPassport());
  const next = useAsync(() => services.matches.getFeaturedMatch());
  const stamps = [...(q.data ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const count = (r: string) => stamps.filter((s) => s.result === r).length;
  const size = Math.floor((width - layout.gutter * 2 - 8) / 2);
  const upcoming = next.data && next.data.status !== 'finished' ? next.data : undefined;
  const opponent = upcoming && (isFla(upcoming.homeTeam) ? upcoming.awayTeam : upcoming.homeTeam);
  const streak = progress?.luckyStreak ?? 0;

  return (
    <Screen title="Passaporte" refreshing={q.refreshing} onRefresh={q.refresh}>
      <View style={{ paddingHorizontal: layout.gutter, gap: 24 }}>
        <View style={{ gap: 4 }}>
          <Text variant="bodyM" tone="secondary">
            Pé quente
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
            <Flame size={44} off={streak === 0} />
            <Text variant="displayHero">{progress ? streak : '—'}</Text>
          </View>
          <Text variant="bodyL">
            {streak === 1 ? 'vitória seguida' : 'vitórias seguidas'} com você no estádio
          </Text>
          {progress && (
            <Text variant="bodyM" tone="secondary">
              Sua melhor sequência: {progress.bestLuckyStreak}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {[
            [stamps.length, 'jogos'],
            [count('Vitória'), 'vitórias'],
            [count('Empate'), 'empates'],
            [count('Derrota'), 'derrotas'],
          ].map(([v, l]) => (
            <View key={l} style={{ flex: 1 }}>
              <Text variant="displayM">{v}</Text>
              <Text variant="bodyS" tone="secondary">
                {l}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 48, paddingHorizontal: layout.gutter }}>
        {q.loading ? (
          <Skeleton height={size * 2} radius={size / 2} />
        ) : q.error ? (
          <ErrorState compact onRetry={q.reload} />
        ) : stamps.length === 0 ? (
          <EmptyState compact pose="fan-passport" title="Nenhum carimbo ainda." />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {upcoming && opponent && (
              <Pressable
                onPress={() => navigation.navigate('MatchDetail', { matchId: upcoming.id })}
                accessibilityRole="button"
                accessibilityLabel={`Próximo carimbo: ${opponent.shortName}`}
                style={{ marginBottom: 8 }}
              >
                <NextStamp
                  size={size}
                  label={`× ${opponent.shortName}`}
                  date={formatDayLabel(upcoming.kickoff)}
                />
              </Pressable>
            )}
            {stamps.map((s, i) => {
              // Coluna da direita um pouco mais baixa: parece carimbado à mão, não uma grade.
              const col = (i + (upcoming ? 1 : 0)) % 2;
              return (
                <View key={s.id} style={{ marginTop: col ? 28 : 0, marginBottom: col ? -20 : 8 }}>
                  <Stamp stamp={s} size={size} />
                </View>
              );
            })}
          </View>
        )}
      </View>
      <View style={{ height: 48 }} />
    </Screen>
  );
}
