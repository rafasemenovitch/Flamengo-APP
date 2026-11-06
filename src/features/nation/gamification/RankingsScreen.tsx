import { useState } from 'react';
import { View } from 'react-native';

import { Avatar, ErrorState, Screen, Tabs, Skeleton, Text, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import type { RankingScope } from '@/types/gamification';
import { formatNumber } from '@/utils/format';

export function RankingsScreen() {
  const { colors, spacing, layout, radius } = useTheme();
  const [scope, setScope] = useState<RankingScope>('geral');
  const q = useAsync(() => services.gamification.getRanking(scope), [scope]);
  const medal = (pos: number) =>
    pos === 1 ? colors.gold : pos === 2 ? colors.silver : pos === 3 ? colors.bronze : undefined;

  return (
    <Screen title="Rankings" refreshing={q.refreshing} onRefresh={q.refresh}>
      <Tabs<RankingScope>
        segments={[
          { key: 'geral', label: 'Geral' },
          { key: 'semanal', label: 'Semanal' },
          { key: 'estado', label: 'RJ' },
          { key: 'amigos', label: 'Amigos' },
        ]}
        value={scope}
        onChange={setScope}
      />
      <View style={{ marginTop: spacing.lg }}>
        {q.loading ? (
          [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={60} radius={radius.md} />)
        ) : q.error ? (
          <ErrorState compact onRetry={q.reload} />
        ) : (
          q.data?.map((r, i) => {
            const gap = i > 0 && r.position - q.data![i - 1]!.position > 1;
            return (
              <View key={`${r.position}-${r.fanName}`} style={{ gap: spacing.sm }}>
                {gap && (
                  <Text variant="caption" tone="tertiary" align="center">
                    • • •
                  </Text>
                )}
                <View
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: layout.gutter,
                    borderBottomWidth: 1,
                    borderColor: colors.lineHairline,
                  }}
                >
                  {r.isCurrentUser && (
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 10,
                        bottom: 10,
                        width: 3,
                        backgroundColor: colors.accent,
                      }}
                    />
                  )}
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
                    accessible
                    accessibilityLabel={`${r.position}º lugar, ${r.fanName}, ${r.points} pontos`}
                  >
                    <View style={{ width: 44, alignItems: 'center' }}>
                      {medal(r.position) ? (
                        <Text variant="displayS" style={{ color: medal(r.position) }}>
                          {r.position}
                        </Text>
                      ) : (
                        <Text variant="tabular" tone="secondary">
                          {formatNumber(r.position)}º
                        </Text>
                      )}
                    </View>
                    <Avatar name={r.fanName} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" tone={r.isCurrentUser ? 'brand' : 'primary'}>
                        {r.fanName}
                      </Text>
                      <Text variant="footnote" tone="tertiary">
                        {r.city}
                      </Text>
                    </View>
                    <Text variant="tabular">{formatNumber(r.points)}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    </Screen>
  );
}
