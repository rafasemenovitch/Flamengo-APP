import { View } from 'react-native';

import { ErrorState, Screen, Skeleton, Text, useTheme } from '@/design-system';
import { StandingsTable } from '@/features/shared/MatchUI';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import { formatRelative } from '@/utils/format';

export function StandingsScreen({ route }: RootScreenProps<'Standings'>) {
  const { spacing, layout } = useTheme();
  const competitionId = route.params?.competitionId ?? 'brasileirao';
  const q = useAsync(() => services.matches.getStandings(competitionId), [competitionId]);
  return (
    <Screen title="Classificação" refreshing={q.refreshing} onRefresh={q.refresh}>
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.md }}>
        {q.loading || !q.data ? (
          <Skeleton height={640} radius={20} />
        ) : q.error ? (
          <ErrorState compact onRetry={q.reload} />
        ) : (
          <>
            <Text variant="caption" tone="secondary">
              Atualizado {formatRelative(q.data.updatedAt)} · dados demonstrativos
            </Text>
            <View style={{ marginHorizontal: -20 }}>
              <StandingsTable table={q.data} />
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}
