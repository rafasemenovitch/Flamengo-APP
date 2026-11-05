import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Card, ClubCrest, DemoBadge, TeamCrest, Text, useTheme } from '@/design-system';
import type { Match } from '@/types/match';
import type { Ticket } from '@/types/tickets';
import { formatMatchDate } from '@/utils/format';

const TYPE_LABEL = { full: 'Inteira', half: 'Meia-entrada', member: 'Sócio' } as const;

/** Ingresso em formato de "bilhete" (picote lateral), inspirado no cartão de emergência do Zuno. */
export function TicketCard({ ticket, match, onPress }: { ticket: Ticket; match?: Match; onPress?: () => void }) {
  const { colors, spacing } = useTheme();
  const opponent = match ? (match.homeTeam.id === 'fla' ? match.awayTeam : match.homeTeam) : undefined;
  return (
    <Card variant="elevated" padding="none" onPress={onPress} accessibilityLabel={`Ingresso ${ticket.sectorName}, portão ${ticket.gate}`}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={styles.between}>
          <View style={[styles.row, { gap: spacing.sm }]}>
            <ClubCrest size={28} />
            <Text variant="h3">×</Text>
            {opponent && <TeamCrest shortName={opponent.code} color={opponent.color} size={28} />}
          </View>
          <DemoBadge />
        </View>
        <View>
          <Text variant="title">{match ? `${match.homeTeam.shortName} × ${match.awayTeam.shortName}` : 'Partida'}</Text>
          {match && <Text variant="caption" tone="secondary">{formatMatchDate(match.kickoff)} · {match.venue.name}</Text>}
        </View>
      </View>
      <View style={[styles.row, { marginHorizontal: -10 }]}>
        <View style={[styles.notch, { backgroundColor: colors.background }]} />
        <View style={{ flex: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong }} />
        <View style={[styles.notch, { backgroundColor: colors.background }]} />
      </View>
      <View style={[styles.row, { padding: spacing.lg, gap: spacing.lg }]}>
        {[
          ['Setor', ticket.sectorName],
          ['Portão', ticket.gate],
          ['Tipo', TYPE_LABEL[ticket.type]],
        ].map(([k, v]) => (
          <View key={k} style={{ flex: k === 'Setor' ? 2 : 1 }}>
            <Text variant="overline" tone="tertiary">{k}</Text>
            <Text variant="bodyStrong" numberOfLines={1}>{v}</Text>
          </View>
        ))}
        {onPress && <Ionicons name="qr-code" size={28} color={colors.primaryText} />}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notch: { width: 20, height: 20, borderRadius: 10 },
});
