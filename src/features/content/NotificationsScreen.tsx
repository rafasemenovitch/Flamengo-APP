import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Card, EmptyState, ErrorState, Screen, Skeleton, Text, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import type { AppNotification } from '@/types/fan';
import { formatRelative } from '@/utils/format';

const ICON: Record<AppNotification['kind'], keyof typeof Ionicons.glyphMap> = {
  match: 'football',
  news: 'newspaper',
  tickets: 'ticket',
  store: 'bag-handle',
  gamification: 'trophy',
};

export function NotificationsScreen() {
  const { colors, spacing, layout } = useTheme();
  const q = useAsync(() => services.profile.getNotifications());

  useEffect(() => {
    // Marca como lidas ao sair da tela (o badge da Home zera no próximo refresh).
    return () => {
      services.profile.markNotificationsRead();
    };
  }, []);

  return (
    <Screen title="Notificações" refreshing={q.refreshing} onRefresh={q.refresh}>
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.sm }}>
        {q.loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={80} radius={16} />)
        ) : q.error ? (
          <ErrorState compact onRetry={q.reload} />
        ) : q.data?.length === 0 ? (
          <EmptyState compact icon="notifications-off-outline" title="Nenhuma notificação" />
        ) : (
          q.data?.map((n) => (
            <Card key={n.id} variant={n.read ? 'surface' : 'tinted'} padding="sm">
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.surfaceMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={ICON[n.kind]} size={18} color={colors.primaryText} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{n.title}</Text>
                  <Text variant="callout" tone="secondary">
                    {n.body}
                  </Text>
                  <Text variant="footnote" tone="tertiary">
                    {formatRelative(n.createdAt)}
                  </Text>
                </View>
                {!n.read && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.primary,
                      marginTop: 6,
                    }}
                  />
                )}
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
