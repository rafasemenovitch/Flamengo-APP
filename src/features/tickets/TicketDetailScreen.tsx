import { FirstUseGuide } from '@/features/guidance/FirstUseGuide';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { Button, DemoBadge, ErrorState, Screen, Skeleton, Text, useTheme } from '@/design-system';
import { DemoQRCode } from '@/features/shared/DemoQRCode';
import { useAsync } from '@/hooks/useAsync';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import { formatMatchDate } from '@/utils/format';

/** Ingresso aberto: QR demonstrativo, setor/portão/lugar e acesso pelo rosto. */
export function TicketDetailScreen({ route }: RootScreenProps<'TicketDetail'>) {
  const navigation = useNavigation();
  const { colors, layout } = useTheme();
  const face = useAsync(() => services.profile.getFaceEnrollment());
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
          <Skeleton height={480} radius={16} />
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
  const enrolled = face.data?.status === 'enrolled';

  return (
    <Screen title="Ingresso" headerRight={<DemoBadge />}>
      <FirstUseGuide resource="tickets" />
      <View style={{ paddingHorizontal: layout.gutter, gap: 4 }}>
        <Text variant="displayM">
          {m.homeTeam.shortName} × {m.awayTeam.shortName}
        </Text>
        <Text variant="bodyS" tone="secondary">
          {formatMatchDate(m.kickoff)} · {m.venue.name}
        </Text>
      </View>

      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <DemoQRCode payload={t.qrPayload} size={260} />
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: layout.gutter, marginTop: 24 }}>
        {[
          ['Setor', t.sectorName],
          ['Portão', t.gate],
          ['Lugar', t.seat.replace('Fila ', '').replace(' · Cadeira ', '-')],
        ].map(([k, v]) => (
          <View key={k} style={{ flex: k === 'Setor' ? 1.6 : 1 }}>
            <Text variant="overline" tone="tertiary">
              {k}
            </Text>
            <Text variant="titleM" numberOfLines={1}>
              {v}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => navigation.navigate('FaceEnrollment')}
        accessibilityRole="button"
        accessibilityLabel={
          enrolled ? 'Entrada pelo rosto ativa. Refazer cadastro' : 'Cadastrar rosto para entrar no estádio'
        }
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          minHeight: 64,
          marginTop: 32,
          paddingHorizontal: layout.gutter,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.lineHairline,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="scan-outline" size={24} color={enrolled ? colors.success : colors.accentText} />
        <Text variant="titleS" style={{ flex: 1 }}>
          {enrolled ? 'Entrada pelo rosto ativa' : 'Cadastrar meu rosto'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.inkTertiary} />
      </Pressable>

      <View style={{ paddingHorizontal: layout.gutter, marginTop: 24 }}>
        <Button
          label="Ver meu setor no mapa"
          variant="secondary"
          icon="map-outline"
          onPress={() => navigation.navigate('StadiumMode', { sectorId: t.sectorId })}
          fullWidth
        />
      </View>
    </Screen>
  );
}
