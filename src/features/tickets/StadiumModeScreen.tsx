import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Button, Card, DemoBadge, EmptyState, ErrorState, ListGroup, ListItem, Screen, SectionHeader, SegmentedControl, Skeleton, Text, useTheme } from '@/design-system';
import { useAsync } from '@/hooks/useAsync';
import { useDemoScenario } from '@/hooks/useMatch';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import type { FacilityType, TransportOption } from '@/types/stadium';
import { formatMatchDate, shiftTime } from '@/utils/format';
import { FACILITY_ICON, StadiumMap } from './StadiumMap';
import { TicketCard } from './TicketCard';

const TRANSPORT_ICON: Record<TransportOption['mode'], keyof typeof Ionicons.glyphMap> = {
  metro: 'subway',
  train: 'train',
  bus: 'bus',
  brt: 'bus',
  app: 'car',
  walk: 'walk',
};

const FACILITY_LABEL: Record<FacilityType, string> = {
  restroom: 'Banheiros',
  food: 'Bares',
  store: 'Loja',
  'first-aid': 'Posto médico',
  accessibility: 'Acessibilidade',
  atm: 'Caixa eletrônico',
};

export function StadiumModeScreen({ route }: RootScreenProps<'StadiumMode'>) {
  const navigation = useNavigation();
  const { colors, spacing, layout } = useTheme();
  const [scenario] = useDemoScenario();
  const [mapLayer, setMapLayer] = useState<'portoes' | 'servicos'>('portoes');

  const q = useAsync(async () => {
    const wallet = await services.tickets.getWallet();
    const ticket = route.params?.matchId ? wallet.find((t) => t.matchId === route.params?.matchId) : wallet.find((t) => t.status === 'valid');
    const matchId = route.params?.matchId ?? ticket?.matchId;
    if (!matchId) return { ticket: undefined };
    const [match, plan, stadium] = await Promise.all([services.matches.getMatch(matchId), services.stadium.getMatchDayPlan(matchId, ticket?.sectorId), services.stadium.getStadium()]);
    return { ticket, match, plan, stadium };
  }, [route.params?.matchId, scenario]);

  if (q.loading) return <Screen title="Modo Maracanã"><View style={{ padding: layout.gutter, gap: spacing.lg }}><Skeleton height={180} /><Skeleton height={300} /></View></Screen>;
  if (q.error) return <Screen title="Modo Maracanã" scroll={false}><ErrorState onRetry={q.reload} /></Screen>;
  const { ticket, match, plan, stadium } = q.data ?? {};
  if (!match || !plan || !stadium) {
    return (
      <Screen title="Modo Maracanã" scroll={false}>
        <EmptyState icon="ticket-outline" title="Você ainda não tem ingresso" message="Com um ingresso na carteira, o Modo Maracanã mostra seu portão, mapa, filas e horário ideal." actionLabel="Comprar ingresso" onAction={() => navigation.navigate('Tabs', { screen: 'Ingressos' })} />
      </Screen>
    );
  }

  const gate = stadium.gates.find((g) => g.id === plan.recommendedGateId);
  const arrival = shiftTime(match.kickoff, Number(plan.recommendedArrival));
  const gatesOpen = shiftTime(match.kickoff, Number(plan.gatesOpenAt));
  const nearby = stadium.facilities.filter((f) => ticket && f.nearSectorIds.includes(ticket.sectorId));

  return (
    <Screen title="Modo Maracanã" headerRight={<DemoBadge />} refreshing={q.refreshing} onRefresh={q.refresh}>
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.lg }}>
        <View style={{ gap: 2 }}>
          <Text variant="h1">{stadium.name}</Text>
          <Text variant="caption" tone="secondary">{match.homeTeam.shortName} × {match.awayTeam.shortName} · {formatMatchDate(match.kickoff)}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {[
            ['enter', 'Seu portão', gate?.id ?? '—', true],
            ['time', 'Chegue às', arrival, false],
            ['lock-open', 'Portões abrem', gatesOpen, false],
          ].map(([icon, label, value, hl]) => (
            <Card key={label as string} variant={hl ? 'tinted' : 'surface'} padding="sm" style={{ flex: 1 }}>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primaryText} />
                <Text variant="number">{value as string}</Text>
                <Text variant="footnote" tone="secondary" align="center">{label as string}</Text>
              </View>
            </Card>
          ))}
        </View>

        {ticket && <TicketCard ticket={ticket} match={match} onPress={() => navigation.navigate('TicketDetail', { ticketId: ticket.id })} />}
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Mapa" subtitle="Esquema ilustrativo, não é a planta oficial" />
        <SegmentedControl segments={[{ key: 'portoes', label: 'Setores e portões' }, { key: 'servicos', label: 'Serviços' }]} value={mapLayer} onChange={setMapLayer} />
        <View style={{ paddingHorizontal: layout.gutter, marginTop: spacing.md }}>
          <Card padding="md">
            <StadiumMap stadium={stadium} highlightSectorId={ticket?.sectorId} highlightGateId={plan.recommendedGateId} showFacilities={mapLayer === 'servicos'} height={300} />
            {mapLayer === 'servicos' && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md, justifyContent: 'center' }}>
                {(Object.keys(FACILITY_LABEL) as FacilityType[]).filter((t) => stadium.facilities.some((f) => f.type === t)).map((t) => (
                  <View key={t} style={[styles.row, { gap: 4 }]}>
                    <Ionicons name={FACILITY_ICON[t]} size={14} color={colors.textSecondary} />
                    <Text variant="footnote" tone="secondary">{FACILITY_LABEL[t]}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
          {nearby.length > 0 && (
            <Text variant="caption" tone="secondary" style={{ marginTop: spacing.sm }}>
              Perto do seu setor: {nearby.map((f) => f.label).join(' · ')}
            </Text>
          )}
        </View>
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Filas agora" subtitle="Tempo estimado por portão (simulado)" />
        <ListGroup>
          {plan.queues.map((qq) => (
            <ListItem
              key={qq.gateId}
              icon="people-outline"
              title={`Portão ${qq.gateId}${qq.gateId === plan.recommendedGateId ? ' · seu portão' : ''}`}
              subtitle={stadium.gates.find((g) => g.id === qq.gateId)?.sectorIds.map((id) => stadium.sectors.find((s) => s.id === id)?.name).join(', ')}
              trailing={<Badge label={`~${qq.waitMinutes} min`} tone={qq.level === 'low' ? 'success' : qq.level === 'medium' ? 'warning' : 'danger'} />}
            />
          ))}
        </ListGroup>
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Como chegar" />
        <ListGroup>
          {stadium.transport.map((t) => (
            <ListItem key={t.id} icon={TRANSPORT_ICON[t.mode]} title={t.title} subtitle={`${t.details}${t.walkMinutes ? ` · ${t.walkMinutes} min a pé` : ''}`} />
          ))}
        </ListGroup>
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title="Estacionamento" />
        <ListGroup>
          {stadium.parking.map((p) => (
            <ListItem key={p.id} icon="car-outline" title={p.name} subtitle={`${p.distance} · ${p.price}${p.note ? ` · ${p.note}` : ''}`} />
          ))}
        </ListGroup>
      </View>

      <View style={{ paddingHorizontal: layout.gutter, marginTop: spacing.xxl, gap: spacing.md }}>
        <Card>
          <Text variant="h3" style={{ marginBottom: spacing.sm }}>Avisos do dia</Text>
          {plan.notices.map((n) => (
            <View key={n} style={[styles.row, { gap: spacing.sm, alignItems: 'flex-start', paddingVertical: 4 }]}>
              <Ionicons name="information-circle" size={16} color={colors.info} style={{ marginTop: 2 }} />
              <Text variant="callout" tone="secondary" style={{ flex: 1 }}>{n}</Text>
            </View>
          ))}
        </Card>
        <Button label="Perguntar ao Assistente Fla" icon="chatbubble-ellipses" variant="secondary" onPress={() => navigation.navigate('Assistant', { initialQuestion: 'Qual portão do meu setor?' })} fullWidth />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' } });
