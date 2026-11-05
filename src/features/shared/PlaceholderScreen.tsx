import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Badge, Card, Screen, Text, useTheme } from '@/design-system';

/**
 * Tela-esqueleto da Fase 1: rota real, cabeçalho e descrição do que virá.
 * Substituída pelas telas completas nas Fases 2 e 3.
 */
export function PlaceholderScreen({
  title,
  icon,
  description,
  phase,
  isTab,
  details,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  phase: 2 | 3;
  isTab?: boolean;
  details?: Array<[string, string]>;
  children?: ReactNode;
}) {
  const { colors, spacing, layout, radius } = useTheme();
  return (
    <Screen title={isTab ? undefined : title} reserveFab={isTab}>
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: isTab ? spacing.xl : spacing.md, gap: spacing.lg }}>
        {isTab && (
          <Text variant="display" accessibilityRole="header">
            {title}
          </Text>
        )}
        <Card variant="elevated" padding="lg">
          <View style={{ gap: spacing.md }}>
            <View style={{ width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.primarySubtle, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={icon} size={26} color={colors.primaryText} />
            </View>
            <Text variant="body" tone="secondary">
              {description}
            </Text>
            <Badge label={`Chega na Fase ${phase}`} tone="neutral" icon="construct-outline" />
          </View>
        </Card>
        {details && details.length > 0 && (
          <Card padding="md">
            {details.map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
                <Text variant="caption" tone="secondary">
                  {k}
                </Text>
                <Text variant="caption">{v}</Text>
              </View>
            ))}
          </Card>
        )}
        {children}
      </View>
    </Screen>
  );
}
