import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

/**
 * Cabeçalho de aba (especificação 12.2 + assinatura 7.1): título display.l,
 * fio vermelho de 3×24px 10px abaixo e subtítulo opcional.
 */
export function TabHeader({
  title,
  subtitle,
  right,
  onTitleLongPress,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  /** Gesto escondido (ex.: painel de demonstração na Home). */
  onTitleLongPress?: () => void;
}) {
  const { colors, layout } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: layout.gutter,
        paddingTop: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <View style={{ flex: 1 }}>
        <Pressable
          onLongPress={onTitleLongPress}
          delayLongPress={600}
          disabled={!onTitleLongPress}
          accessible={false}
        >
          <Text variant="displayL" accessibilityRole="header">
            {title}
          </Text>
        </Pressable>
        <View style={{ width: 24, height: 3, backgroundColor: colors.accent, marginTop: 10 }} />
        {subtitle && (
          <Text variant="bodyM" tone="secondary" style={{ marginTop: 12 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {right && <View style={{ minHeight: 44, justifyContent: 'center' }}>{right}</View>}
    </View>
  );
}

/** Título de seção (display.m) com link opcional à direita. */
export function SectionTitle({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  const { colors, layout } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: layout.gutter,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="displayM" accessibilityRole="header">
          {title}
        </Text>
        {subtitle && (
          <Text variant="bodyS" tone="secondary">
            {subtitle}
          </Text>
        )}
      </View>
      {action && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={`${action}: ${title}`}
          hitSlop={8}
          style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
        >
          <Text variant="labelM" style={{ color: colors.accentText }}>
            {action} →
          </Text>
        </Pressable>
      )}
    </View>
  );
}
