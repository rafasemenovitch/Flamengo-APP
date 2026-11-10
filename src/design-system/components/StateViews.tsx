import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Mascot, type MascotPose } from '../mascot';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';
import { Text } from './Text';

interface StateViewProps {
  title: string;
  message?: string;
  /** Pose do mascote: só em áreas interativas (Nação). Sem pose, sem ilustração. */
  pose?: MascotPose;
  illustration?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  /** @deprecated ícones não são mais usados em estados vazios (o mascote substitui). */
  icon?: string;
}

/** Estado vazio/erro (especificação 12.16): mascote, título, texto curto e botão secundário. */
function StateView({ title, message, pose, illustration, actionLabel, onAction, compact }: StateViewProps) {
  const { layout } = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: compact ? layout.gutter : 32,
        flex: compact ? undefined : 1,
      }}
    >
      {illustration ?? (pose ? <Mascot pose={pose} size={compact ? 96 : 160} /> : null)}
      <View style={{ gap: 8, alignItems: 'center' }}>
        <Text variant="titleM" align="center">
          {title}
        </Text>
        {message && (
          <Text variant="bodyM" tone="secondary" align="center" numberOfLines={2} style={{ maxWidth: 320 }}>
            {message}
          </Text>
        )}
      </View>
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="secondary" size={compact ? 'sm' : 'md'} />
      )}
    </View>
  );
}

export function EmptyState(props: StateViewProps) {
  return <StateView {...props} title={props.title || 'Nada por aqui ainda.'} />;
}

export function ErrorState({
  title = 'Perdemos o sinal.',
  message = 'Já estamos tentando de novo.',
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
      actionLabel={onRetry ? 'Tentar de novo' : undefined}
      onAction={onRetry}
      compact={compact}
    />
  );
}
