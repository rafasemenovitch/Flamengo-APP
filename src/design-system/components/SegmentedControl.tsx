import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { haptic } from '@/utils/haptics';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface Segment<K extends string> {
  key: K;
  label: string;
}

interface Props<K extends string> {
  segments: readonly Segment<K>[];
  value: K;
  onChange: (key: K) => void;
  accessibilityLabel?: string;
}

/** Abas internas (especificação 12.4): texto com sublinhado vermelho, sem pílulas. */
export function Tabs<K extends string>({ segments, value, onChange, accessibilityLabel }: Props<K>) {
  const { colors, layout } = useTheme();
  return (
    <View style={{ borderBottomWidth: StyleSheet.hairlineWidth * 2, borderColor: colors.lineHairline }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        accessibilityLabel={accessibilityLabel}
        contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 24 }}
      >
        {segments.map((s) => {
          const selected = s.key === value;
          return (
            <Pressable
              key={s.key}
              onPress={() => {
                if (!selected) haptic.select();
                onChange(s.key);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={{ minHeight: layout.minTouch, justifyContent: 'center' }}
            >
              <Text variant="titleS" style={{ color: selected ? colors.inkPrimary : colors.inkTertiary }}>
                {s.label}
              </Text>
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 3,
                  backgroundColor: selected ? colors.accent : 'transparent',
                }}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Filtros (especificação 12.5): 32px, raio 8; selecionado em branco. */
export function Filters<K extends string>({ segments, value, onChange, accessibilityLabel }: Props<K>) {
  const { colors, layout, radius } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={accessibilityLabel}
      contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 8 }}
      style={styles.flexGrow0}
    >
      {segments.map((s) => {
        const selected = s.key === value;
        return (
          <Pressable
            key={s.key}
            onPress={() => {
              if (!selected) haptic.select();
              onChange(s.key);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            hitSlop={{ top: 6, bottom: 6 }}
            style={({ pressed }) => ({
              height: 32,
              paddingHorizontal: 12,
              borderRadius: radius.s,
              justifyContent: 'center',
              borderWidth: selected ? 0 : 1,
              borderColor: colors.lineHairline,
              backgroundColor: selected ? colors.inkPrimary : 'transparent',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text variant="labelM" style={{ color: selected ? colors.bgCanvas : colors.inkSecondary }}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** @deprecated use Tabs (navegação entre vistas) ou Filters (filtros). */
export const SegmentedControl = Filters;

const styles = StyleSheet.create({ flexGrow0: { flexGrow: 0 } });
