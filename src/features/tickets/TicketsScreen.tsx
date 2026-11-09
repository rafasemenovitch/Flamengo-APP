import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Pressable, View } from 'react-native';

import {
  Button,
  EmptyState,
  ErrorState,
  Screen,
  SectionTitle,
  Skeleton,
  TabHeader,
  Text,
  useTheme,
} from '@/design-system';
import { MatchList } from '@/features/shared/MatchUI';
import { useAsync } from '@/hooks/useAsync';
import { useDemoScenario } from '@/hooks/useMatch';
import { services } from '@/services';
import { TicketCard } from './TicketCard';

/** Ingressos (especificação 13.3). */
export function TicketsScreen() {
  const navigation = useNavigation();
  const { colors, layout, radius } = useTheme();
  const [scenario] = useDemoScenario();
  const wallet = useAsync(() => services.tickets.getWallet());
  const sales = useAsync(async () => {
    const [s, matches] = await Promise.all([
      services.tickets.getSales(),
      services.matches.getMatches({ when: 'upcoming' }),
    ]);
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
      <TabHeader title="Ingressos" subtitle="Compra simulada" />

      <View style={{ marginTop: 48 }}>
        <SectionTitle
          title="Meu próximo jogo"
          action="Carteira"
          onAction={() => navigation.navigate('TicketWallet')}
        />
        <View style={{ paddingHorizontal: layout.gutter, gap: 16 }}>
          {wallet.loading ? (
            <Skeleton height={220} radius={radius.l} />
          ) : nextTicket ? (
            <TicketCard
              ticket={nextTicket}
              match={nextTicketMatch}
              onPress={() => navigation.navigate('TicketDetail', { ticketId: nextTicket.id })}
            />
          ) : (
            <EmptyState
              compact
              pose="fan-ticket"
              title="Nenhum ingresso na carteira."
              message="Escolha um jogo abaixo."
            />
          )}

          <Pressable
            onPress={() =>
              navigation.navigate('StadiumMode', nextTicket ? { sectorId: nextTicket.sectorId } : undefined)
            }
            accessibilityRole="button"
            accessibilityLabel="Modo Maracanã: mapa do estádio, filas e como chegar"
            style={({ pressed }) => ({
              minHeight: 80,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              paddingHorizontal: 20,
              borderRadius: radius.l,
              backgroundColor: colors.bgRaised,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Ionicons name="navigate-outline" size={28} color={colors.accentText} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="titleM">Modo Maracanã</Text>
              <Text variant="bodyS" tone="secondary">
                Mapa do estádio, filas e como chegar
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.inkTertiary} />
          </Pressable>
        </View>
      </View>

      <View style={{ marginTop: 48 }}>
        <SectionTitle title="Venda aberta" />
        {sales.loading ? (
          <View style={{ paddingHorizontal: layout.gutter, gap: 16 }}>
            <Skeleton height={80} radius={8} />
            <Skeleton height={80} radius={8} />
          </View>
        ) : sales.error ? (
          <ErrorState compact onRetry={sales.reload} />
        ) : sales.data?.length === 0 ? (
          <EmptyState compact pose="fan-no-matches" title="Sem vendas abertas agora." />
        ) : (
          <MatchList
            matches={sales.data ?? []}
            onPress={(m) => navigation.navigate('TicketPurchase', { matchId: m.id })}
            trailing={(m) => (
              <Button
                label="Comprar"
                size="sm"
                onPress={() => navigation.navigate('TicketPurchase', { matchId: m.id })}
              />
            )}
          />
        )}
      </View>
    </Screen>
  );
}
