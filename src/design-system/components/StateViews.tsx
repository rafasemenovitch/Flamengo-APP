import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';
import { Text } from './Text';

interface StateViewProps {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Espaço reservado para ilustração/mascote no futuro (substitui o ícone). */
  illustration?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  /** Versão embutida numa seção (menor, sem preencher a tela). */
  compact?: boolean;
}

function StateView({
  title,
  message,
  icon,
  illustration,
  actionLabel,
  onAction,
  compact,
  tone,
}: StateViewProps & { tone: 'neutral' | 'danger' }) {
  const { colors, spacing, radius } = useTheme();
  const iconColor = tone === 'danger' ? colors.danger : colors.textTertiary;
  const iconBg = tone === 'danger' ? colors.dangerSubtle : colors.surfaceMuted;
  const size = compact ? 44 : 64;

  return (
    <View
      style={[
        styles.container,
        { gap: spacing.md, padding: compact ? spacing.lg : spacing.xxl },
        !compact && styles.full,
      ]}
    >
      {illustration ??
        (icon && (
          <View style={{ width: size, height: size, borderRadius: radius.pill, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={icon} size={compact ? 20 : 28} color={iconColor} />
          </View>
        ))}
      <View style={{ gap: spacing.xs, alignItems: 'center' }}>
        <Text variant={compact ? 'bodyStrong' : 'h3'} align="center">
          {title}
        </Text>
        {message && (
          <Text variant="callout" tone="secondary" align="center" style={{ maxWidth: 320 }}>
            {message}
          </Text>
        )}
      </View>
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant={compact ? 'secondary' : 'primary'} size="sm" />
      )}
    </View>
  );
}

/** Estado vazio (herdado do ZikoEmptyState, sem mascote). */
export function EmptyState(props: StateViewProps) {
  return <StateView icon="file-tray-outline" {...props} tone="neutral" />;
}

/** Estado de erro com "Tentar de novo". */
export function ErrorState({
  title = 'Não foi possível carregar',
  message = 'Verifique sua conexão e tente de novo.',
  onRetry,
  compact,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  return (
    <StateView
      title={title}
      message={message}
      icon="cloud-offline-outline"
      actionLabel={onRetry ? 'Tentar de novo' : undefined}
      onAction={onRetry}
      compact={compact}
      tone="danger"
    />
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  full: { flex: 1 },
});
