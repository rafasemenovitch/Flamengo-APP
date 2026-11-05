import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Button, DemoBadge, LiveIndicator, MediaImage, palette, Skeleton, Text, useTheme, withAlpha } from '@/design-system';
import { ScoreBoard, competitionName } from '@/features/shared/MatchUI';
import { useCountdown } from '@/hooks/useCountdown';
import type { MatchDetail } from '@/types/match';
import { formatMatchDate, pad2 } from '@/utils/format';

function CountdownBlock({ kickoff }: { kickoff: string }) {
  const c = useCountdown(kickoff);
  const { spacing, radius } = useTheme();
  if (!c) return null;
  const parts = c.days > 0 ? [[c.days, 'dias'], [c.hours, 'horas'], [c.minutes, 'min']] : [[c.hours, 'horas'], [c.minutes, 'min'], [c.seconds, 'seg']];
  return (
    <View
      style={[styles.row, { gap: spacing.sm, justifyContent: 'center' }]}
      accessible
      accessibilityLabel={`Faltam ${parts.map(([v, l]) => `${v} ${l}`).join(', ')}`}
    >
      {parts.map(([v, l]) => (
        <View key={l as string} style={{ alignItems: 'center', minWidth: 64, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: withAlpha(palette.white, 0.08) }}>
          <Text variant="number" tone="onMedia">{pad2(v as number)}</Text>
          <Text variant="overline" tone="onMedia" style={{ opacity: 0.7, fontSize: 10 }}>{l as string}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Card principal da Home. Um único card que muda de estado:
 * pré-jogo (contagem + comprar ingresso) → AO VIVO (placar, minuto, gols,
 * atalho para o lance a lance) → pós-jogo (resultado, melhores momentos,
 * craque do jogo).
 */
export function HeroMatchCard({ match, loading }: { match?: MatchDetail; loading: boolean }) {
  const navigation = useNavigation();
  const { colors, spacing, radius, layout } = useTheme();

  if (loading || !match) {
    return (
      <View style={{ paddingHorizontal: layout.gutter }}>
        <Skeleton height={300} radius={radius.xl} />
      </View>
    );
  }

  const live = match.status === 'live' || match.status === 'halftime';
  const finished = match.status === 'finished';
  const goals = match.events.filter((e) => e.type === 'goal' || e.type === 'penalty-goal' || e.type === 'own-goal');
  const openMatch = () => navigation.navigate('MatchDetail', { matchId: match.id });

  return (
    <View style={{ paddingHorizontal: layout.gutter }}>
      <Pressable onPress={openMatch} accessibilityRole="button" accessibilityLabel={`Abrir partida ${match.homeTeam.shortName} contra ${match.awayTeam.shortName}`}>
        <LinearGradient
          colors={colors.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg, overflow: 'hidden' }}
        >
          {/* Linhas diagonais decorativas (listras rubro-negras sutis) */}
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: 0.07 }]}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ position: 'absolute', top: -40 + i * 70, left: -60, right: -60, height: 26, backgroundColor: palette.white, transform: [{ rotate: '-12deg' }] }} />
            ))}
          </View>

          <View style={styles.between}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="overline" tone="onMedia" style={{ opacity: 0.8 }}>
                {competitionName(match.competitionId)} · {match.stage}
              </Text>
              <Text variant="caption" tone="onMedia" style={{ opacity: 0.8 }}>
                {live ? match.venue.name : finished ? `Encerrado · ${match.venue.name}` : `${formatMatchDate(match.kickoff)} · ${match.venue.name}`}
              </Text>
            </View>
            {live ? <LiveIndicator minute={match.status === 'halftime' ? 'Intervalo' : match.liveMinute} /> : finished ? <Badge label="Fim de jogo" tone="onMedia" /> : <DemoBadge />}
          </View>

          <ScoreBoard match={match} onMedia />

          {!live && !finished && <CountdownBlock kickoff={match.kickoff} />}

          {(live || finished) && goals.length > 0 && (
            <View style={{ gap: 4 }}>
              {[...goals].reverse().map((g) => (
                <View key={g.id} style={[styles.row, { gap: 6, justifyContent: g.side === 'home' ? 'flex-start' : 'flex-end' }]}>
                  <Ionicons name="football" size={12} color={colors.textOnMedia} />
                  <Text variant="caption" tone="onMedia">
                    {g.playerName} {g.minute}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {!live && !finished && (
            <View style={[styles.row, { gap: spacing.sm }]}>
              {match.ticketsOnSale && (
                <Button label="Comprar ingresso" icon="ticket" onPress={() => navigation.navigate('TicketPurchase', { matchId: match.id })} style={{ flex: 1 }} />
              )}
              <Button label="Detalhes" variant="onMedia" onPress={openMatch} style={{ flex: match.ticketsOnSale ? 0 : 1 }} />
            </View>
          )}
          {live && <Button label="Lance a lance" icon="pulse" variant="onMedia" onPress={openMatch} fullWidth />}
          {finished && (
            <View style={{ gap: spacing.md }}>
              {match.highlightsVideoId && (
                <Pressable
                  onPress={() => navigation.navigate('VideoDetail', { videoId: match.highlightsVideoId! })}
                  accessibilityRole="button"
                  accessibilityLabel="Assistir melhores momentos"
                >
                  <MediaImage imageKey="video-featured" icon="videocam-outline" scrim style={{ height: 110, borderRadius: radius.lg }}>
                    <View style={[StyleSheet.absoluteFill, styles.row, { padding: spacing.md, gap: spacing.md, alignItems: 'flex-end' }]}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="play" size={18} color={colors.onPrimary} style={{ marginLeft: 2 }} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="title" tone="onMedia">Melhores momentos</Text>
                        <Text variant="footnote" tone="onMedia" style={{ opacity: 0.8 }}>FlaTV · 6:29</Text>
                      </View>
                    </View>
                  </MediaImage>
                </Pressable>
              )}
              <Button label="Ver resumo da partida" variant="onMedia" onPress={openMatch} fullWidth />
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
});
