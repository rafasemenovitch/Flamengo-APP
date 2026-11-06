import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { View } from 'react-native';

import {
  EmptyState,
  ErrorState,
  Filters,
  Screen,
  Skeleton,
  TabHeader,
  Tabs,
  useTheme,
} from '@/design-system';
import { MatchList, StandingsTable } from '@/features/shared/MatchUI';
import { useAsync } from '@/hooks/useAsync';
import { useDemoScenario } from '@/hooks/useMatch';
import type { TabScreenProps } from '@/navigation/types';
import { services } from '@/services';
import type { CompetitionId } from '@/types/match';

type ViewKey = 'proximos' | 'resultados' | 'tabela';
type Filter = 'todas' | CompetitionId;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'brasileirao', label: 'Brasileirão' },
  { key: 'libertadores', label: 'Libertadores' },
  { key: 'copa-do-brasil', label: 'Copa do Brasil' },
];

/** Jogos (especificação 13.2): abas sublinhadas, filtros e linhas de calendário. */
export function MatchesScreen({ route }: TabScreenProps<'Jogos'>) {
  const navigation = useNavigation();
  const { layout } = useTheme();
  const [view, setView] = useState<ViewKey>(route.params?.initialTab === 'tabela' ? 'tabela' : 'proximos');
  const [filter, setFilter] = useState<Filter>('todas');
  const [scenario] = useDemoScenario();

  const competitionId = filter === 'todas' ? undefined : filter;
  const matches = useAsync(
    () =>
      services.matches.getMatches({ competitionId, when: view === 'resultados' ? 'results' : 'upcoming' }),
    [view, filter, scenario]
  );
  const table = useAsync(() => services.matches.getStandings('brasileirao'), [scenario]);

  return (
    <Screen
      reserveFab
      refreshing={view === 'tabela' ? table.refreshing : matches.refreshing}
      onRefresh={view === 'tabela' ? table.refresh : matches.refresh}
    >
      <TabHeader title="Jogos" subtitle="Temporada 2026 · dados demonstrativos" />

      <View style={{ marginTop: 24 }}>
        <Tabs
          accessibilityLabel="Visualização"
          segments={[
            { key: 'proximos', label: 'Próximos' },
            { key: 'resultados', label: 'Resultados' },
            { key: 'tabela', label: 'Tabela' },
          ]}
          value={view}
          onChange={setView}
        />
      </View>

      {view !== 'tabela' && (
        <View style={{ marginTop: 12 }}>
          <Filters accessibilityLabel="Competição" segments={FILTERS} value={filter} onChange={setFilter} />
        </View>
      )}

      <View style={{ marginTop: 16 }}>
        {view === 'tabela' ? (
          table.loading || !table.data ? (
            <View style={{ paddingHorizontal: layout.gutter }}>
              <Skeleton height={600} radius={8} />
            </View>
          ) : table.error ? (
            <ErrorState compact onRetry={table.reload} />
          ) : (
            <StandingsTable table={table.data} />
          )
        ) : matches.loading ? (
          <View style={{ paddingHorizontal: layout.gutter, gap: 16 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={80} radius={8} />
            ))}
          </View>
        ) : matches.error ? (
          <ErrorState compact onRetry={matches.reload} />
        ) : matches.data?.length === 0 ? (
          <EmptyState
            compact
            pose="fan-no-matches"
            title="Nada por aqui ainda."
            message="Nenhum jogo nesta competição."
          />
        ) : (
          <MatchList
            matches={matches.data ?? []}
            onPress={(m) => navigation.navigate('MatchDetail', { matchId: m.id })}
          />
        )}
      </View>
    </Screen>
  );
}
