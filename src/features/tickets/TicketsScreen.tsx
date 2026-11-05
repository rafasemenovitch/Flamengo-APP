import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';

import { Badge, Button, Card, EmptyState, ErrorState, Screen, SectionHeader, Skeleton, Text, useTheme } from '@/design-system';
import { MatchRow } from '@/features/shared/MatchUI';
import { useAsync } from '@/hooks/useAsync';
import { useDemoScenario } from '@/hooks/useMatch';
import { services } from '@/services';
import { TicketCard } from './TicketCard';

export function TicketsScreen() {
  const navigation = useNavigation();
  const { spacing, layout, colors } = useTheme();
  const [scenario] = useDemoScenario();
  const wallet = useAsync(() => services.tickets.getWallet());
  const sales = useAsync(async () => {
    const [s, matches] = await Promise.all([services.tickets.getSales(), services.matches.getMatches({ when: 'upcoming' })]);
    return matches.filter((m) => m.ticketsOnSale && s.some((x) => x.matchId === m.id));
  }, [scenario]);
  const allMatches = useAsync(() => services.matches.getMatches(), [scenario]);

  const nextTicket = wallet.data?.find((t) => t.status === 'valid');
  const nextTicketMatch = allMatches.data?.find((m) => m.id === nextTicket?.matchId);

  return (
    <Screen
      reserveFab
      refreshing={wallet.refreshing || sales.refreshing}
      onRefresh={() => {
        wallet.refresh();
        sales.refresh();
      }}
    >
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: spacing.xl, gap: spacing.xs }}>
        <Text variant="display" accessibilityRole="header">Ingressos</Text>
        <Text variant="caption" tone="secondary">Compra simulada · nenhum valor é cobrado</Text>
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <SectionHeader title="Meu próximo jogo" onAction={() => navigation.navigate('TicketWallet')} actionLabel="Carteira" />
        <View style={{ paddingHorizontal: layout.gutter, gap: spacing.md }}>
          {wallet.loading ? (
            <Skeleton height={190} radius={20} />
          ) : nextTicket ? (
            <>
              <TicketCard ticket={nextTicket} match={nextTicketMatch} onPress={() => navigation.navigate('TicketDetail', { ticketId: nextTicket.id })} />
              <Card variant="tinted" onPress={() => navigation.navigate('StadiumMode', { matchId: nextTicket.matchId })} accessibilityLabel="Abrir Modo Maracanã">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Ionicons name="navigate-circle" size={36} color={colors.primaryText} />
                  <View style={{ flex: 1 }}>
                    <Text variant="title">Modo Maracanã</Text>
                    <Text variant="caption" tone="secondary">Portão, mapa, filas, transporte e horário ideal de chegada</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.primaryText} />
                </View>
              </Card>
            </>
          ) : (
            <Card>
              <EmptyState compact icon="ticket-outline" title="Nenhum ingresso na carteira" message="Escolha um jogo abaixo para comprar." />
            </Card>
          )}
        </View>
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Venda aberta" subtitle="Sócios têm prioridade e desconto" />
        <View style={{ paddingHorizontal: layout.gutter, gap: spacing.md }}>
          {sales.loading ? (
            [0, 1].map((i) => <Skeleton key={i} height={150} radius={20} />)
          ) : sales.error ? (
            <ErrorState compact onRetry={sales.reload} />
          ) : sales.data?.length === 0 ? (
            <EmptyState compact icon="calendar-outline" title="Sem vendas abertas agora" />
          ) : (
            sales.data?.map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                onPress={() => navigation.navigate('TicketPurchase', { matchId: m.id })}
                trailing={<Badge label="Comprar" tone="solidBrand" icon="ticket" />}
              />
            ))
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: layout.gutter, marginTop: spacing.xxl }}>
        <Card>
          <View style={{ gap: spacing.md }}>
            <Text variant="h3">Ainda não é sócio?</Text>
            <Text variant="callout" tone="secondary">Sócios compram antes, pagam menos e acumulam pontos de prioridade.</Text>
            <Button label="Conhecer planos" variant="secondary" icon="card" onPress={() => navigation.navigate('Membership')} />
          </View>
        </Card>
      </View>
    </Screen>
  );
}
