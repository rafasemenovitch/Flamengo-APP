import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface Segment<K extends string> {
  key: K;
  label: string;
}

/** Abas internas/filtros em pílulas roláveis (Resumo / Escalações / ..., filtros de competição). */
export function SegmentedControl<K extends string>({
  segments,
  value,
  onChange,
  accessibilityLabel,
}: {
  segments: ReadonlyArray<Segment<K>>;
  value: K;
  onChange: (key: K) => void;
  accessibilityLabel?: string;
}) {
  const { colors, spacing, radius, layout } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: spacing.sm }}
      style={styles.flexGrow0}
    >
      {segments.map((s) => {
        const selected = s.key === value;
        return (
          <Pressable
            key={s.key}
            onPress={() => onChange(s.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.pill,
              {
                minHeight: 36,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.pill,
                backgroundColor: selected ? colors.textPrimary : colors.surfaceMuted,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            hitSlop={{ top: 4, bottom: 4 }}
          >
            <Text variant="label" style={{ color: selected ? colors.background : colors.textSecondary }}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flexGrow0: { flexGrow: 0 },
  pill: { alignItems: 'center', justifyContent: 'center' },
});
