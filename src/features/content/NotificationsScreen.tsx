import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View } from 'react-native';

import { EmptyState, ErrorState, Screen, Skeleton, Text, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { AppNotification } from '@/types/fan';
import { formatRelative } from '@/utils/format';

const ICON: Record<AppNotification['kind'], keyof typeof Ionicons.glyphMap> = {
  match: 'football-outline',
  news: 'newspaper-outline',
  tickets: 'ticket-outline',
  store: 'bag-handle-outline',
  gamification: 'trophy-outline',
};

/** Notificações em linhas abertas; não lidas com ponto vermelho. */
export function NotificationsScreen() {
  const { colors, layout } = useTheme();
  const q = useAsync(() => services.profile.getNotifications());
  const { refreshNotifications } = useAppState();

  useEffect(() => {
    // Marca como lidas ao sair da tela (o ponto do sino some ao voltar para a Home).
    return () => {
      services.profile.markNotificationsRead().then(refreshNotifications);
    };
  }, [refreshNotifications]);

  return (
    <Screen title="Notificações" refreshing={q.refreshing} onRefresh={q.refresh}>
      {q.loading ? (
        <View style={{ paddingHorizontal: layout.gutter, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={64} radius={8} />
          ))}
        </View>
      ) : q.error ? (
        <ErrorState compact onRetry={q.reload} />
      ) : q.data?.length === 0 ? (
        <EmptyState
          compact
          pose="fan-notifications"
          title="Nada por aqui ainda."
          message="Não perca nenhum gol. Ative as notificações."
        />
      ) : (
        <View style={{ borderTopWidth: 1, borderColor: colors.lineHairline }}>
          {q.data?.map((n) => (
            <View
              key={n.id}
              style={{
                flexDirection: 'row',
                gap: 16,
                paddingHorizontal: layout.gutter,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderColor: colors.lineHairline,
              }}
            >
              <Ionicons
                name={ICON[n.kind]}
                size={20}
                color={n.read ? colors.inkTertiary : colors.inkPrimary}
                style={{ marginTop: 2 }}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="titleS">{n.title}</Text>
                <Text variant="bodyM" tone="secondary">
                  {n.body}
                </Text>
                <Text variant="bodyS" tone="tertiary">
                  {formatRelative(n.createdAt)}
                </Text>
              </View>
              {!n.read && (
                <View
                  accessibilityLabel="Não lida"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.accent,
                    marginTop: 8,
                  }}
                />
              )}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
