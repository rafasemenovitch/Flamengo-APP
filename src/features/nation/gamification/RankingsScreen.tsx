import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar, ErrorState, Screen, Skeleton, Tabs, Text, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { RankingScope } from '@/types/gamification';
import { formatNumber } from '@/utils/format';

/** Prêmios de fim de temporada de cada ranking (a trilha é individual). */
const PRIZE: Record<RankingScope, string> = {
  brasil:
    '1º do Brasil no fim da temporada: camisa autografada pelo elenco e 2 ingressos para um jogo no Maracanã.',
  estado: '1º de cada estado no fim da temporada: a camisa oficial da próxima temporada.',
  amigos: 'Entre amigos não tem prêmio: vale a resenha.',
};

/** Ranking da temporada (mesma pontuação da trilha) no Brasil, no seu estado e entre amigos. */
export function RankingsScreen() {
  const { colors, layout, radius } = useTheme();
  const { profile } = useAppState();
  const [scope, setScope] = useState<RankingScope>('brasil');
  const q = useAsync(() => services.gamification.getRanking(scope), [scope]);
  const medal = (pos: number) =>
    pos === 1 ? colors.gold : pos === 2 ? colors.silver : pos === 3 ? colors.bronze : undefined;

  return (
    <Screen title="Ranking" refreshing={q.refreshing} onRefresh={q.refresh}>
      <Tabs<RankingScope>
        segments={[
          { key: 'brasil', label: 'Brasil' },
          { key: 'estado', label: profile?.state ?? 'Estado' },
          { key: 'amigos', label: 'Amigos' },
        ]}
        value={scope}
        onChange={setScope}
      />
      <View
        style={{
          margin: layout.gutter,
          padding: 16,
          borderRadius: radius.l,
          backgroundColor: colors.bgRaised,
          flexDirection: 'row',
          gap: 12,
        }}
      >
        <Ionicons name="trophy" size={20} color={scope === 'amigos' ? colors.inkTertiary : colors.gold} />
        <Text variant="bodyM" tone="secondary" style={{ flex: 1 }}>
          {PRIZE[scope]}
        </Text>
      </View>
      {q.loading ? (
        <View style={{ paddingHorizontal: layout.gutter, gap: 8 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={56} radius={8} />
          ))}
        </View>
      ) : q.error ? (
        <ErrorState compact onRetry={q.reload} />
      ) : (
        <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
          {q.data?.map((r, i) => {
            const gap = i > 0 && r.position - q.data![i - 1]!.position > 1;
            return (
              <View key={`${r.position}-${r.fanName}`}>
                {gap && (
                  <Text variant="bodyS" tone="tertiary" align="center" style={{ paddingVertical: 8 }}>
                    • • •
                  </Text>
                )}
                <View
                  accessible
                  accessibilityLabel={`${r.position}º lugar, ${r.fanName}, ${r.points} pontos`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 64,
                    paddingHorizontal: layout.gutter,
                    borderBottomWidth: 1,
                    borderColor: colors.lineHairline,
                    backgroundColor: r.isCurrentUser ? colors.bgRaised : 'transparent',
                  }}
                >
                  {r.isCurrentUser && (
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        backgroundColor: colors.accent,
                      }}
                    />
                  )}
                  <Text
                    variant={medal(r.position) ? 'displayS' : 'numericTable'}
                    tone="secondary"
                    style={{ width: 64, color: medal(r.position) }}
                  >
                    {formatNumber(r.position)}º
                  </Text>
                  <Avatar name={r.fanName} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text variant="titleS" tone={r.isCurrentUser ? 'brand' : 'primary'}>
                      {r.fanName}
                    </Text>
                    <Text variant="bodyS" tone="tertiary">
                      {r.city}
                    </Text>
                  </View>
                  <Text variant="numericTable">{formatNumber(r.points)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
