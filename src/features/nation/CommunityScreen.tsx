import { View } from 'react-native';

import { Badge, Button, Card, ErrorState, Screen, Skeleton, Text, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { formatMatchDate, formatNumber } from '@/utils/format';
import { useState } from 'react';
import type { CommunityGroup } from '@/types/gamification';

export function CommunityScreen() {
  const { spacing, layout } = useTheme();
  const q = useAsync(() => services.gamification.getCommunityGroups());
  const [overrides, setOverrides] = useState<Record<string, CommunityGroup>>({});
  const toggle = async (id: string) => {
    const g = await services.gamification.toggleGroup(id);
    setOverrides((o) => ({ ...o, [id]: g }));
  };
  const groups = q.data?.map((g) => overrides[g.id] ?? g);

  return (
    <Screen title="Comunidade" refreshing={q.refreshing} onRefresh={q.refresh}>
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.md }}>
        <Text variant="callout" tone="secondary">
          Encontre torcedores perto de você para ir ao estádio ou assistir aos jogos juntos. Grupos
          demonstrativos.
        </Text>
        {q.loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={140} radius={20} />)
        ) : q.error ? (
          <ErrorState compact onRetry={q.reload} />
        ) : (
          groups?.map((g) => (
            <Card key={g.id} variant={g.joined ? 'tinted' : 'surface'}>
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="h3" style={{ flex: 1 }}>
                    {g.name}
                  </Text>
                  {g.joined && <Badge label="Participando" tone="solidBrand" />}
                </View>
                <Text variant="caption" tone="secondary">
                  {g.region} · {formatNumber(g.members)} membros
                </Text>
                <Text variant="callout">{g.description}</Text>
                {g.nextMeetup && (
                  <Badge label={`Encontro: ${formatMatchDate(g.nextMeetup)}`} tone="info" icon="calendar" />
                )}
                <Button
                  label={g.joined ? 'Sair do grupo' : 'Participar'}
                  variant={g.joined ? 'ghost' : 'secondary'}
                  size="sm"
                  onPress={() => toggle(g.id)}
                />
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
