import { useState } from 'react';
import { View } from 'react-native';

import { Button, ErrorState, Screen, Skeleton, Text, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import type { CommunityGroup } from '@/types/gamification';
import { formatCompact, formatMatchDate } from '@/utils/format';

/** Comunidade: grupos por região em linhas simples. */
export function CommunityScreen() {
  const { colors, layout } = useTheme();
  const q = useAsync(() => services.gamification.getCommunityGroups());
  const [overrides, setOverrides] = useState<Record<string, CommunityGroup>>({});
  const toggle = async (id: string) => {
    const g = await services.gamification.toggleGroup(id);
    setOverrides((o) => ({ ...o, [id]: g }));
  };
  const groups = (q.data ?? [])
    .map((g) => overrides[g.id] ?? g)
    .sort((a, b) => Number(b.joined) - Number(a.joined));

  return (
    <Screen title="Comunidade" refreshing={q.refreshing} onRefresh={q.refresh}>
      {q.loading ? (
        <View style={{ paddingHorizontal: layout.gutter, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={64} radius={8} />
          ))}
        </View>
      ) : q.error ? (
        <ErrorState compact onRetry={q.reload} />
      ) : (
        <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
          {groups.map((g) => (
            <View
              key={g.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: layout.gutter,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderColor: colors.lineHairline,
              }}
            >
              {g.joined && (
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 14,
                    bottom: 14,
                    width: 3,
                    backgroundColor: colors.accent,
                  }}
                />
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="titleM">{g.name}</Text>
                <Text variant="bodyS" tone="secondary">
                  {g.region.split(' — ')[0]} · {formatCompact(g.members)} membros
                </Text>
                {g.joined && g.nextMeetup && (
                  <Text variant="labelM" tone="brand">
                    Encontro {formatMatchDate(g.nextMeetup)}
                  </Text>
                )}
              </View>
              <Button
                label={g.joined ? 'Sair' : 'Entrar'}
                size="sm"
                variant={g.joined ? 'ghost' : 'secondary'}
                onPress={() => toggle(g.id)}
              />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
