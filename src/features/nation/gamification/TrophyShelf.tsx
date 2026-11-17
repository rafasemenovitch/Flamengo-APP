import { View, useWindowDimensions } from 'react-native';

import { PressableScale, Text, useTheme } from '@/design-system';
import type { TrophyAchievement } from '@/types/trophies';
import { awardLabel, earnedTrophies, goalAwards, goalRequirement } from '@/utils/trophies';
import { ShelfRail, TrophyArt } from './TrophyArt';
import { TrophyCabinet } from './TrophyCabinet';

function ShelfPiece({
  achievement,
  compact,
  onSelect,
}: {
  achievement: TrophyAchievement;
  compact?: boolean;
  onSelect: (id: string) => void;
}) {
  const { spacing } = useTheme();
  const award = achievement.current ?? goalAwards(achievement)[0]!;
  const state = achievement.earned ? awardLabel(award) : 'A conquistar';
  return (
    <PressableScale
      onPress={() => onSelect(achievement.id)}
      accessibilityLabel={`${achievement.name}. ${state}.${achievement.next ? ` ${goalRequirement(achievement, achievement.next.target)}` : ' Objetivo concluído.'}`}
      accessibilityHint="Ver objetivo e evolução do prêmio"
      style={compact ? { width: 108 } : { flex: 1 }}
    >
      <View style={{ alignItems: 'center', paddingTop: spacing.sm }}>
        <TrophyArt award={award} locked={!achievement.earned} size={compact ? 84 : 88} />
      </View>
      <ShelfRail />
      <View style={{ paddingHorizontal: spacing.sm, paddingTop: spacing.md, gap: spacing.xs }}>
        <Text variant="labelM" align="center">
          {achievement.name}
        </Text>
        <Text variant="bodyS" tone="secondary" align="center">
          {state}
        </Text>
        {!compact && achievement.kind === 'evolving' && (
          <Text variant="bodyS" tone="secondary" align="center">
            {achievement.value.toLocaleString('pt-BR')}
            {achievement.next ? ` / ${achievement.next.target.toLocaleString('pt-BR')}` : ' · máximo'}
          </Text>
        )}
      </View>
    </PressableScale>
  );
}

export function TrophyShelf({
  achievements,
  earnedOnly = false,
  onSelect,
}: {
  achievements: readonly TrophyAchievement[];
  /** A vitrine do perfil nunca desenha vagas, cadeados ou prêmios ainda não obtidos. */
  earnedOnly?: boolean;
  onSelect: (id: string) => void;
}) {
  const { layout, spacing } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const list = earnedOnly ? earnedTrophies(achievements) : achievements;
  if (!list.length)
    return (
      <Text variant="bodyM" tone="secondary" style={{ paddingHorizontal: layout.gutter }}>
        {earnedOnly
          ? 'Seus prêmios aparecem aqui quando você conquistar o primeiro objetivo.'
          : 'Nenhum objetivo nesta seleção.'}
      </Text>
    );
  if (earnedOnly) return <TrophyCabinet achievements={list} onSelect={onSelect} />;
  const columns = width < 360 || fontScale > 1.15 ? 2 : 3;
  const rows = Array.from({ length: Math.ceil(list.length / columns) }, (_, i) =>
    list.slice(i * columns, (i + 1) * columns)
  );
  return (
    <View style={{ paddingHorizontal: layout.gutter, gap: spacing.xl }}>
      {rows.map((row) => (
        <View key={row[0]!.id} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          {row.map((achievement) => (
            <ShelfPiece key={achievement.id} achievement={achievement} onSelect={onSelect} />
          ))}
          {Array.from({ length: columns - row.length }, (_, i) => (
            <View
              key={`space-${i}`}
              aria-hidden
              style={{ flex: 1, paddingTop: spacing.sm + (88 * 128) / 112 }}
            >
              <ShelfRail />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
