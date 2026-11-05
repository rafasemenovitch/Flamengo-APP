import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  /** Mostra chevron à direita (padrão: true quando há onPress). */
  chevron?: boolean;
  destructive?: boolean;
}

export function ListItem({ title, subtitle, icon, leading, trailing, onPress, chevron, destructive }: ListItemProps) {
  const { colors, spacing, radius, layout } = useTheme();
  const showChevron = chevron ?? !!onPress;
  const fg = destructive ? colors.danger : colors.textPrimary;

  const content = (
    <View style={[styles.row, { minHeight: layout.minTouch + 12, gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
      {leading ??
        (icon && (
          <View style={[styles.iconWrap, { backgroundColor: destructive ? colors.dangerSubtle : colors.surfaceMuted, borderRadius: radius.sm }]}>
            <Ionicons name={icon} size={18} color={fg} />
          </View>
        ))}
      <View style={styles.flex}>
        <Text variant="bodyStrong" style={{ color: fg }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" tone="secondary" numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
      {showChevron && <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />}
    </View>
  );

  if (!onPress) return content;
  return (
    <PressableScale onPress={onPress} accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title} scaleTo={0.985}>
      {content}
    </PressableScale>
  );
}

/** Agrupa ListItems num card com divisórias. */
export function ListGroup({ children }: { children: ReactNode }) {
  const { colors, radius, layout } = useTheme();
  const items = Array.isArray(children) ? children.filter(Boolean) : [children];
  return (
    <View style={{ marginHorizontal: layout.gutter, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
      {items.map((child, i) => (
        <View key={i}>
          {i > 0 && <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 64 }} />}
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1, gap: 2 },
  iconWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
