import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  DemoBadge,
  ErrorState,
  Screen,
  Skeleton,
  Text,
  useTheme,
} from '@/design-system';
import { DemoQRCode } from '@/features/shared/DemoQRCode';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import { formatCurrency, formatMatchDate } from '@/utils/format';

export function TicketDetailScreen({ route }: RootScreenProps<'TicketDetail'>) {
  const navigation = useNavigation();
  const { colors, spacing, layout } = useTheme();
  const face = useAsync(() => services.profile.getFaceEnrollment());
  // Atualiza o status ao voltar do cadastro facial.
  const refreshFace = face.refresh;
  useFocusEffect(useCallback(() => void refreshFace(), [refreshFace]));
  const q = useAsync(async () => {
    const ticket = await services.tickets.getTicket(route.params.ticketId);
    const match = await services.matches.getMatch(ticket.matchId);
    return { ticket, match };
  }, [route.params.ticketId]);

  if (q.loading)
    return (
      <Screen title="Ingresso">
        <View style={{ padding: layout.gutter }}>
          <Skeleton height={480} radius={24} />
        </View>
      </Screen>
    );
  if (q.error || !q.data)
    return (
      <Screen title="Ingresso" scroll={false}>
        <ErrorState onRetry={q.reload} />
      </Screen>
    );
  const { ticket: t, match: m } = q.data;

  return (
    <Screen title="Ingresso" headerRight={<DemoBadge />}>
      <View style={{ paddingHorizontal: layout.gutter, gap: spacing.lg }}>
        <Card variant="elevated" padding="lg">
          <View style={{ alignItems: 'center', gap: spacing.lg }}>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Text variant="h2" align="center">
                {m.homeTeam.shortName} × {m.awayTeam.shortName}
              </Text>
              <Text variant="caption" tone="secondary" align="center">
                {formatMatchDate(m.kickoff)} · {m.venue.name}
              </Text>
            </View>
            <DemoQRCode payload={t.qrPayload} size={240} />
            <Text variant="footnote" tone="demo" align="center">
              QR Code demonstrativo. Não é válido para entrada no estádio.
            </Text>
            <View style={{ flexDirection: 'row', alignSelf: 'stretch' }}>
              {[
                ['Setor', t.sectorName],
                ['Portão', t.gate],
                ['Lugar', t.seat],
              ].map(([k, v]) => (
                <View key={k} style={{ flex: 1, alignItems: 'center' }}>
                  <Text variant="overline" tone="tertiary">
                    {k}
                  </Text>
                  <Text variant="bodyStrong" align="center">
                    {v}
                  </Text>
                </View>
              ))}
            </View>
            <Text variant="caption" tone="secondary">
              {t.holderName} · {formatCurrency(t.price)} (simulado)
            </Text>
          </View>
        </Card>
        <Card variant={face.data?.status === 'enrolled' ? 'surface' : 'tinted'}>
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Ionicons
                name="scan"
                size={28}
                color={face.data?.status === 'enrolled' ? colors.success : colors.primaryText}
              />
              <View style={{ flex: 1 }}>
                <Text variant="title">Entrada por reconhecimento facial</Text>
                <Text variant="caption" tone="secondary">
                  {face.data?.status === 'enrolled'
                    ? 'Ativa: na catraca, seu rosto confirma este ingresso.'
                    : 'Cadastre seu rosto para entrar no estádio.'}
                </Text>
              </View>
              {face.data?.status === 'enrolled' && <Badge label="Ativa" tone="success" icon="checkmark" />}
            </View>
            {face.data?.status !== 'enrolled' ? (
              <Button
                label="Cadastrar meu rosto"
                icon="camera"
                onPress={() => navigation.navigate('FaceEnrollment')}
                fullWidth
              />
            ) : (
              <Button
                label="Refazer cadastro"
                variant="ghost"
                size="sm"
                onPress={() => navigation.navigate('FaceEnrollment')}
              />
            )}
          </View>
        </Card>
        <Button
          label="Ver meu setor no mapa do estádio"
          icon="map"
          variant="secondary"
          onPress={() => navigation.navigate('StadiumMode', { sectorId: t.sectorId })}
          fullWidth
        />
      </View>
    </Screen>
  );
}
