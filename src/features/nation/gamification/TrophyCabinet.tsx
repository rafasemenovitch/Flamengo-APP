import { View, useWindowDimensions } from 'react-native';

import { PressableScale, useTheme } from '@/design-system';
import type { TrophyAchievement } from '@/types/trophies';
import { arrangeTrophyCabinet } from '@/utils/trophyCabinet';
import { awardLabel } from '@/utils/trophies';
import { ShelfRail, TrophyArt } from './TrophyArt';

/** Perfil e sala usam as mesmas conquistas, incluindo as taças ainda bloqueadas. */
export function TrophyCabinet({
  achievements,
  onSelect,
}: {
  achievements: readonly TrophyAchievement[];
  onSelect: (id: string) => void;
}) {
  const { width } = useWindowDimensions();
  const { layout, spacing } = useTheme();
  const cabinet = arrangeTrophyCabinet(
    achievements,
    Math.min(width, layout.maxContentWidth) - layout.gutter * 2
  );
  return (
    <View
      testID="trophy-cabinet"
      style={{ marginHorizontal: layout.gutter, height: cabinet.height, marginTop: spacing.xs }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', top: cabinet.shelfTop, left: 0, right: 0 }}>
        <ShelfRail />
      </View>
      {cabinet.pieces.map((piece) => (
        <PressableScale
          key={piece.achievement.id}
          onPress={() => onSelect(piece.achievement.id)}
          accessibilityLabel={`${piece.achievement.name}. ${awardLabel(piece.award)}.${piece.achievement.earned ? '' : ' A conquistar.'}`}
          accessibilityHint="Ver objetivo e evolução do prêmio"
          style={{
            position: 'absolute',
            left: piece.touchX,
            top: piece.y,
            width: piece.touchWidth,
            height: piece.height,
          }}
        >
          <View pointerEvents="none" style={{ left: piece.x - piece.touchX, width: piece.size }}>
            <TrophyArt
              award={piece.award}
              locked={!piece.achievement.earned}
              size={piece.size}
              hanging={piece.hanging}
              ribbonLength={piece.ribbonLength}
            />
          </View>
        </PressableScale>
      ))}
    </View>
  );
}
