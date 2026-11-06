import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { View } from 'react-native';

import {
  Card,
  EmptyState,
  ErrorState,
  Screen,
  SegmentedControl,
  Skeleton,
  Text,
  useTheme,
} from '@/design-system';
import { MatchRow, StandingsTable } from '@/features/shared/MatchUI';
import { useAsync } from '@/hooks/useAsync';
import { useDemoScenario } from '@/hooks/useMatch';
import type { TabScreenProps } from '@/navigation/types';
import { services } from '@/services';
import type { CompetitionId } from '@/types/match';

type View_ = 'proximos' | 'resultados' | 'tabela';
type Filter = 'todas' | CompetitionId;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'brasileirao', label: 'Brasileirão' },
  { key: 'libertadores', label: 'Libertadores' },
  { key: 'copa-do-brasil', label: 'Copa do Brasil' },
];

export function MatchesScreen({ route }: TabScreenProps<'Jogos'>) {
  const navigation = useNavigation();
  const { spacing, layout } = useTheme();
  const [view, setView] = useState<View_>(route.params?.initialTab === 'tabela' ? 'tabela' : 'proximos');
  const [filter, setFilter] = useState<Filter>('todas');
  const [scenario] = useDemoScenario();

  const competitionId = filter === 'todas' ? undefined : filter;
  const matches = useAsync(
    () =>
      services.matches.getMatches({ competitionId, when: view === 'resultados' ? 'results' : 'upcoming' }),
    [view, filter, scenario]
  );
  const table = useAsync(() => services.matches.getStandings('brasileirao'), [scenario]);

  const refreshing = view === 'tabela' ? table.refreshing : matches.refreshing;
  const onRefresh = view === 'tabela' ? table.refresh : matches.refresh;

  return (
    <Screen reserveFab refreshing={refreshing} onRefresh={onRefresh}>
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: spacing.xl, paddingBottom: spacing.lg }}>
        <Text variant="display" accessibilityRole="header">
          Jogos
        </Text>
        <Text variant="caption" tone="secondary">
          Temporada 2026 · dados demonstrativos
        </Text>
      </View>

      <SegmentedControl
        accessibilityLabel="Visualização"
        segments={[
          { key: 'proximos', label: 'Próximos' },
          { key: 'resultados', label: 'Resultados' },
          { key: 'tabela', label: 'Tabela' },
        ]}
        value={view}
        onChange={setView}
      />

      {view !== 'tabela' && (
        <View style={{ marginTop: spacing.md }}>
          <SegmentedControl
            accessibilityLabel="Competição"
            segments={FILTERS}
            value={filter}
            onChange={setFilter}
          />
        </View>
      )}

      <View style={{ paddingHorizontal: layout.gutter, marginTop: spacing.lg, gap: spacing.md }}>
        {view === 'tabela' ? (
          table.loading || !table.data ? (
            <Skeleton height={600} radius={20} />
          ) : table.error ? (
            <ErrorState compact onRetry={table.reload} />
          ) : (
            <Card padding="sm">
              <Text variant="h3" style={{ padding: spacing.md }}>
                {table.data.title}
              </Text>
              <StandingsTable table={table.data} />
            </Card>
          )
        ) : matches.loading ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} height={128} radius={20} />)
        ) : matches.error ? (
          <ErrorState compact onRetry={matches.reload} />
        ) : matches.data?.length === 0 ? (
          <EmptyState
            compact
            icon="calendar-outline"
            title="Nenhum jogo encontrado"
            message="Tente outra competição."
          />
        ) : (
          matches.data?.map((m) => (
            <MatchRow
              key={m.id}
              match={m}
              onPress={() => navigation.navigate('MatchDetail', { matchId: m.id })}
            />
          ))
        )}
      </View>
    </Screen>
  );
}
