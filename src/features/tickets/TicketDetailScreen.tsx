import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';

import { Button, Card, DemoBadge, ErrorState, Screen, Skeleton, Text, useTheme } from '@/design-system';
import { DemoQRCode } from '@/features/shared/DemoQRCode';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import { formatCurrency, formatMatchDate } from '@/utils/format';

export function TicketDetailScreen({ route }: RootScreenProps<'TicketDetail'>) {
  const navigation = useNavigation();
  const { spacing, layout } = useTheme();
  const q = useAsync(async () => {
    const ticket = await services.tickets.getTicket(route.params.ticketId);
    const match = await services.matches.getMatch(ticket.matchId);
    return { ticket, match };
  }, [route.params.ticketId]);

  if (q.loading) return <Screen title="Ingresso"><View style={{ padding: layout.gutter }}><Skeleton height={480} radius={24} /></View></Screen>;
  if (q.error || !q.data) return <Screen title="Ingresso" scroll={false}><ErrorState onRetry={q.reload} /></Screen>;
  const { ticket: t, match: m } = q.data;

  return (
    <Screen title="Ingresso" headerRight={<DemoBadge />}>
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.lg }}>
        <Card variant="elevated" padding="lg">
          <View style={{ alignItems: 'center', gap: spacing.lg }}>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Text variant="h2" align="center">{m.homeTeam.shortName} × {m.awayTeam.shortName}</Text>
              <Text variant="caption" tone="secondary" align="center">{formatMatchDate(m.kickoff)} · {m.venue.name}</Text>
            </View>
            <DemoQRCode payload={t.qrPayload} size={240} />
            <Text variant="footnote" tone="demo" align="center">
              QR Code demonstrativo. Não é válido para entrada no estádio.
            </Text>
            <View style={{ flexDirection: 'row', alignSelf: 'stretch' }}>
              {[['Setor', t.sectorName], ['Portão', t.gate], ['Lugar', t.seat]].map(([k, v]) => (
                <View key={k} style={{ flex: 1, alignItems: 'center' }}>
                  <Text variant="overline" tone="tertiary">{k}</Text>
                  <Text variant="bodyStrong" align="center">{v}</Text>
                </View>
              ))}
            </View>
            <Text variant="caption" tone="secondary">{t.holderName} · {formatCurrency(t.price)} (simulado)</Text>
          </View>
        </Card>
        <Button label="Como chegar e portão" icon="navigate" onPress={() => navigation.navigate('StadiumMode', { matchId: t.matchId })} fullWidth />
      </View>
    </Screen>
  );
}
