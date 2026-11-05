import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Elemento à direita do título (ex.: DemoBadge). */
  accessory?: ReactNode;
}

export function SectionHeader({ title, subtitle, actionLabel = 'Ver tudo', onAction, accessory }: SectionHeaderProps) {
  const { colors, spacing, layout } = useTheme();
  return (
    <View style={[styles.row, { paddingHorizontal: layout.gutter, marginBottom: spacing.md }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={[styles.titleRow, { gap: spacing.sm }]}>
          <Text variant="h2" accessibilityRole="header">
            {title}
          </Text>
          {accessory}
        </View>
        {subtitle && (
          <Text variant="caption" tone="secondary">
            {subtitle}
          </Text>
        )}
      </View>
      {onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}: ${title}`}
          style={({ pressed }) => [styles.action, { minHeight: layout.minTouch, opacity: pressed ? 0.6 : 1 }]}
        >
          <Text variant="label" tone="brand">
            {actionLabel}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primaryText} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 12, justifyContent: 'flex-end' },
});
