import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { View } from 'react-native';

import {
  EmptyState,
  ErrorState,
  FilterBar,
  Filters,
  Screen,
  Skeleton,
  TabHeader,
  Tabs,
  Text,
  useTheme,
} from '@/design-system';
import { KnockoutBracket, MatchList, StandingsTable } from '@/features/shared/MatchUI';
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
  { key: 'carioca', label: 'Carioca' },
];

const TABLE_COMPETITIONS: { key: CompetitionId; label: string }[] = [
  { key: 'brasileirao', label: 'Brasileirão' },
  { key: 'libertadores', label: 'Libertadores' },
  { key: 'copa-do-brasil', label: 'Copa do Brasil' },
  { key: 'carioca', label: 'Carioca' },
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
  const [tableComp, setTableComp] = useState<CompetitionId>('brasileirao');
  const [phaseKey, setPhaseKey] = useState<string>();
  const table = useAsync(() => services.matches.getCompetitionOverview(tableComp), [tableComp, scenario]);
  const phases = table.data?.phases ?? [];
  // Copas abrem na fase mais avançada (mata-mata), onde o torcedor quer olhar.
  const phase = phases.find((p) => p.key === phaseKey) ?? phases[phases.length - 1];

  return (
    <Screen
      reserveFab
      refreshing={view === 'tabela' ? table.refreshing : matches.refreshing}
      onRefresh={view === 'tabela' ? table.refresh : matches.refresh}
    >
      <TabHeader title="Jogos" />

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

      <View style={{ marginTop: 12 }}>
        {view === 'tabela' ? (
          <Filters
            accessibilityLabel="Competição"
            segments={TABLE_COMPETITIONS}
            value={tableComp}
            onChange={(c) => {
              setTableComp(c);
              setPhaseKey(undefined);
            }}
          />
        ) : (
          <FilterBar
            groups={[{ key: 'competition', title: 'Competição', options: FILTERS }]}
            value={{ competition: filter }}
            defaults={{ competition: 'todas' }}
            onApply={(v) => setFilter(v.competition as Filter)}
          />
        )}
      </View>

      <View style={{ marginTop: 16 }}>
        {view === 'tabela' ? (
          table.loading || !table.data ? (
            <View style={{ paddingHorizontal: layout.gutter }}>
              <Skeleton height={600} radius={8} />
            </View>
          ) : table.error ? (
            <ErrorState compact onRetry={table.reload} />
          ) : (
            <View style={{ gap: 24 }}>
              {phases.length > 1 && (
                <Tabs
                  accessibilityLabel="Fase"
                  segments={phases.map((p) => ({ key: p.key, label: p.label }))}
                  value={phase?.key ?? ''}
                  onChange={setPhaseKey}
                />
              )}
              {phase?.kind === 'knockout' && phase.rounds ? (
                <KnockoutBracket rounds={phase.rounds} />
              ) : (
                phase?.tables?.map((t) => (
                  <View key={t.title} style={{ gap: 8 }}>
                    {(phase.tables?.length ?? 0) > 1 && (
                      <Text variant="overline" tone="secondary" style={{ paddingHorizontal: layout.gutter }}>
                        {t.title}
                      </Text>
                    )}
                    <StandingsTable table={t} legend={phase.legend} />
                  </View>
                ))
              )}
              {table.data.note && (
                <Text variant="bodyS" tone="tertiary" style={{ paddingHorizontal: layout.gutter }}>
                  {table.data.note}
                </Text>
              )}
            </View>
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
          <EmptyState compact title="Nada por aqui ainda." message="Nenhum jogo nesta competição." />
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
