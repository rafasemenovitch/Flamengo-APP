import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';

import { Button, EmptyState, ErrorState, Screen, Skeleton, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import { TicketCard } from './TicketCard';

export function TicketWalletScreen() {
  const navigation = useNavigation();
  const { spacing, layout } = useTheme();
  const q = useAsync(async () => {
    const [tickets, matches] = await Promise.all([services.tickets.getWallet(), services.matches.getMatches()]);
    return tickets.map((t) => ({ ticket: t, match: matches.find((m) => m.id === t.matchId) }));
  });
  return (
    <Screen title="Carteira" refreshing={q.refreshing} onRefresh={q.refresh}>
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.md }}>
        {q.loading ? (
          [0, 1].map((i) => <Skeleton key={i} height={190} radius={20} />)
        ) : q.error ? (
          <ErrorState compact onRetry={q.reload} />
        ) : q.data?.length === 0 ? (
          <EmptyState compact icon="wallet-outline" title="Sua carteira está vazia" message="Ingressos comprados aparecem aqui." actionLabel="Ver jogos à venda" onAction={() => navigation.navigate('Tabs', { screen: 'Ingressos' })} />
        ) : (
          q.data?.map(({ ticket, match }) => (
            <TicketCard key={ticket.id} ticket={ticket} match={match} onPress={() => navigation.navigate('TicketDetail', { ticketId: ticket.id })} />
          ))
        )}
        {!!q.data?.length && <Button label="Abrir Modo Maracanã" icon="navigate" variant="secondary" onPress={() => navigation.navigate('StadiumMode')} fullWidth />}
      </View>
    </Screen>
  );
}
