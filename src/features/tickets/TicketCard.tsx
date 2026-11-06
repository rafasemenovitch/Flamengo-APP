import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';

import { Crest, DemoBadge, PressableScale, Text, useTheme } from '@/design-system';
import type { Match } from '@/types/match';
import type { Ticket } from '@/types/tickets';
import { formatMatchDate } from '@/utils/format';

const TYPE_LABEL = { full: 'Inteira', half: 'Meia', member: 'Sócio' } as const;
const NOTCH = 12;

/**
 * Ingresso (especificação 12.10): bgRaised, raio 16, sem borda; picote a 58%
 * da altura com recortes semicirculares e linha tracejada.
 */
export function TicketCard({
  ticket,
  match,
  onPress,
}: {
  ticket: Ticket;
  match?: Match;
  onPress?: () => void;
}) {
  const { colors, radius } = useTheme();
  // Recortes alinhados à linha do picote (fim do bloco superior, ~58% da altura).
  const [topHeight, setTopHeight] = useState(0);
  const notchTop = topHeight - NOTCH;

  const body = (
    <View style={{ backgroundColor: colors.bgRaised, borderRadius: radius.l, overflow: 'hidden' }}>
      <View
        onLayout={(e) => setTopHeight(e.nativeEvent.layout.height)}
        style={{ padding: 20, gap: 12, minHeight: 120 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {match && <Crest team={match.homeTeam} size={28} />}
            <Text variant="bodyS" tone="tertiary">
              ×
            </Text>
            {match && <Crest team={match.awayTeam} size={28} />}
          </View>
          <DemoBadge />
        </View>
        <View style={{ gap: 2 }}>
          <Text variant="titleM">
            {match ? `${match.homeTeam.shortName} × ${match.awayTeam.shortName}` : 'Partida'}
          </Text>
          {match && (
            <Text variant="bodyS" tone="secondary">
              {formatMatchDate(match.kickoff)} · {match.venue.name}
            </Text>
          )}
        </View>
      </View>
      <View
        style={{
          height: 1,
          marginHorizontal: NOTCH + 8,
          borderTopWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.lineHairline,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 }}>
        {(
          [
            ['Setor', ticket.sectorName, 2],
            ['Portão', ticket.gate, 1],
            ['Tipo', TYPE_LABEL[ticket.type], 1],
          ] as const
        ).map(([k, v, flex]) => (
          <View key={k} style={{ flex }}>
            <Text variant="overline" tone="tertiary">
              {k}
            </Text>
            <Text variant="titleM" numberOfLines={1}>
              {v}
            </Text>
          </View>
        ))}
        <Ionicons name="qr-code-outline" size={44} color={colors.accentText} />
      </View>
      {topHeight > 0 &&
        [-NOTCH, undefined].map((left, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: notchTop,
              left,
              right: left === undefined ? -NOTCH : undefined,
              width: NOTCH * 2,
              height: NOTCH * 2,
              borderRadius: NOTCH,
              backgroundColor: colors.bgCanvas,
            }}
          />
        ))}
    </View>
  );

  if (!onPress) return body;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`Ingresso ${ticket.sectorName}, portão ${ticket.gate}. Abrir QR Code`}
      scaleTo={0.98}
    >
      {body}
    </PressableScale>
  );
}
