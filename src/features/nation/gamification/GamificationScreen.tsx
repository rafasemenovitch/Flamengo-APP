import { useIsFocused } from '@react-navigation/native';
import { useState } from 'react';
import { View } from 'react-native';

import { ErrorState, Screen, SectionTitle, Skeleton, Tabs, Text, useTheme } from '@/design-system';
import { TROPHY_GROUPS } from '@/data/trophies';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import type { MedalGroup } from '@/types/gamification';
import { earnedTrophies } from '@/utils/trophies';
import { TrophyDetail } from './TrophyDetail';
import { TrophyShelf } from './TrophyShelf';

type CollectionFilter = 'all' | 'earned' | 'locked';

/** Uma peça por objetivo: prateleiras de medalhas evolutivas e troféus de momentos únicos. */
export function GamificationScreen({ route }: RootScreenProps<'Gamification'>) {
  const focused = useIsFocused();
  const { layout, spacing } = useTheme();
  const room = useAsync(() => services.gamification.getTrophyRoom(), [focused]);
  const [selectedId, setSelectedId] = useState<string | undefined>(route.params?.goalId);
  const [filter, setFilter] = useState<CollectionFilter>('all');
  const achievements = room.data ?? [];
  const earned = earnedTrophies(achievements);
  const visible = achievements.filter(
    (goal) => filter === 'all' || (filter === 'earned' ? goal.earned : !goal.earned)
  );
  const selected = achievements.find((goal) => goal.id === selectedId);

  return (
    <Screen title="Sala de Troféus" compactHeader refreshing={room.refreshing} onRefresh={room.refresh}>
      <View
        style={{
          paddingHorizontal: layout.gutter,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl,
          gap: spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
          <Text variant="displayXl">{room.data ? earned.length : '—'}</Text>
          <Text variant="displayS" tone="secondary">
            / {room.data ? achievements.length : '—'}
          </Text>
        </View>
        <Text variant="bodyM">objetivos conquistados</Text>
        <Text variant="bodyS" tone="secondary">
          Cada objetivo ocupa um lugar. Toque em uma peça para ver como ela evolui.
        </Text>
      </View>
      <Tabs<CollectionFilter>
        accessibilityLabel="Filtrar a Sala de Troféus"
        segments={[
          { key: 'all', label: 'Todos' },
          { key: 'earned', label: 'Conquistados' },
          { key: 'locked', label: 'A conquistar' },
        ]}
        value={filter}
        onChange={setFilter}
      />
      {room.loading ? (
        <View style={{ padding: layout.gutter }}>
          <Skeleton height={300} radius={8} />
        </View>
      ) : room.error ? (
        <ErrorState compact onRetry={room.reload} />
      ) : visible.length ? (
        (Object.keys(TROPHY_GROUPS) as MedalGroup[]).map((group) => {
          const list = visible.filter((goal) => goal.group === group);
          if (!list.length) return null;
          return (
            <View key={group} style={{ marginTop: spacing.xxl }}>
              <SectionTitle title={TROPHY_GROUPS[group]} />
              <TrophyShelf achievements={list} onSelect={setSelectedId} />
            </View>
          );
        })
      ) : (
        <View style={{ marginTop: spacing.xl }}>
          <TrophyShelf achievements={[]} onSelect={setSelectedId} />
        </View>
      )}
      {!!selected && <TrophyDetail achievement={selected} onClose={() => setSelectedId(undefined)} />}
    </Screen>
  );
}
