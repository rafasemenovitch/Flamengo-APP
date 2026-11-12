import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text, useTheme } from '@/design-system';
import { haptic } from '@/utils/haptics';

/**
 * Seletor de nível em coluna, como o painel de um elevador: o mais alto em cima.
 * O primeiro botão volta à visão do estádio inteiro.
 */
export function LevelPanel({
  levels,
  active,
  onChange,
}: {
  /** Ids dos níveis públicos, do mais baixo ao mais alto. */
  levels: string[];
  active: string;
  onChange: (level: string) => void;
}) {
  const { colors, radius, layout } = useTheme();
  const items = ['all', ...[...levels].reverse()];
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Nível do estádio"
      style={{
        width: layout.minTouch + 4,
        borderRadius: radius.m,
        backgroundColor: colors.bgRaised,
        borderWidth: 1,
        borderColor: colors.lineHairline,
        overflow: 'hidden',
      }}
    >
      {items.map((id, i) => {
        const on = id === active;
        return (
          <Pressable
            key={id}
            onPress={() => {
              if (on) return;
              haptic.select();
              onChange(id);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={id === 'all' ? 'Estádio inteiro' : `Nível ${id}`}
            style={({ pressed }) => ({
              height: layout.minTouch + 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? colors.accent : pressed ? colors.bgRaised2 : 'transparent',
              borderTopWidth: i === 0 ? 0 : 1,
              borderColor: colors.lineHairline,
            })}
          >
            {id === 'all' ? (
              <Ionicons name="layers-outline" size={20} color={on ? colors.inkOnRed : colors.inkPrimary} />
            ) : (
              <Text variant="displayS" style={{ color: on ? colors.inkOnRed : colors.inkPrimary }}>
                {id}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
