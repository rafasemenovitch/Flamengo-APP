import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';

import {
  Button,
  Countdown,
  Crest,
  DemoBadge,
  LiveIndicator,
  Skeleton,
  Text,
  TreatedImage,
  useTheme,
} from '@/design-system';
import { competitionName } from '@/features/shared/MatchUI';
import type { MatchDetail } from '@/types/match';
import { formatDayLabel, formatShortDate, formatTime } from '@/utils/format';

/** "Hoje", "Amanhã" ou a data curta ("18 nov"): o dia da semana fica em Detalhes. */
function when(iso: string) {
  const label = formatDayLabel(iso);
  return label === 'Hoje' || label === 'Amanhã' ? label : formatShortDate(iso);
}

/** Compacto o bastante para os atalhos aparecerem sem rolar (tela de ~844pt). */
const HERO_HEIGHT = 310;

/**
 * Card do próximo jogo: cartão com margem e cantos, foto tratada, enxuto. No alto, só a
 * competição e quando ("Hoje · 14h00"); no meio, os escudos e um protagonista por estado
 * (contagem antes, placar ao vivo e no fim). Rodada e estádio ficam em Detalhes.
 */
export function HeroMatchCard({ match, loading }: { match?: MatchDetail; loading: boolean }) {
  const navigation = useNavigation();
  const { layout, radius } = useTheme();

  if (loading || !match)
    return (
      <View style={{ paddingHorizontal: layout.gutter }}>
        <Skeleton height={HERO_HEIGHT} radius={radius.l} />
      </View>
    );

  const live = match.status === 'live' || match.status === 'halftime';
  const finished = match.status === 'finished';
  const started = (live || finished) && !!match.score;
  const goals = [...match.events]
    .reverse()
    .filter((e) => e.type === 'goal' || e.type === 'penalty-goal' || e.type === 'own-goal');
  const openMatch = () => navigation.navigate('MatchDetail', { matchId: match.id });

  return (
    <View style={{ paddingHorizontal: layout.gutter }}>
      <TreatedImage
        imageKey={`hero-${match.id}`}
        aspect="hero"
        overlay
        style={{ height: HERO_HEIGHT, borderRadius: radius.l, overflow: 'hidden' }}
      >
        <View style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Text variant="displayS" tone="onMedia" style={{ flex: 1 }} numberOfLines={1}>
              {competitionName(match.competitionId)}
            </Text>
            {!live && !finished ? (
              <Text variant="displayS" tone="onMedia">
                {when(match.kickoff)} · {formatTime(match.kickoff)}
              </Text>
            ) : (
              <DemoBadge />
            )}
          </View>

          <View style={{ gap: 12 }}>
            {live && (
              <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <LiveIndicator minute={match.status === 'halftime' ? 'Intervalo' : match.liveMinute} />
              </View>
            )}
            {finished && (
              <Text variant="overline" tone="onMedia" align="center">
                Encerrado
              </Text>
            )}
            <View
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 }}
              accessible
              accessibilityLabel={
                started
                  ? `${match.homeTeam.shortName} ${match.score!.home}, ${match.awayTeam.shortName} ${match.score!.away}`
                  : `${match.homeTeam.shortName} contra ${match.awayTeam.shortName}`
              }
            >
              <Crest team={match.homeTeam} size={64} onMedia />
              {started ? (
                <Text variant="displayXl" tone="onMedia" numberOfLines={1}>
                  {match.score!.home}–{match.score!.away}
                </Text>
              ) : (
                <Text variant="displayM" tone="onMedia" style={{ opacity: 0.6 }}>
                  ×
                </Text>
              )}
              <Crest team={match.awayTeam} size={64} onMedia />
            </View>
            {!live && !finished && <Countdown target={match.kickoff} onMedia size="compact" />}
            {started && goals.length > 0 && (
              <Text variant="bodyS" tone="onMedia" align="center" style={{ opacity: 0.85 }} numberOfLines={1}>
                {goals.map((g) => `${g.playerName} ${g.minute}`).join('  ·  ')}
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {!live && !finished && (
              <>
                {match.ticketsOnSale && (
                  <Button
                    label="Comprar ingresso"
                    onPress={() => navigation.navigate('TicketPurchase', { matchId: match.id })}
                    style={{ flex: 1.4 }}
                  />
                )}
                <Button label="Detalhes" variant="onMedia" onPress={openMatch} style={{ flex: 1 }} />
              </>
            )}
            {live && (
              <>
                <Button label="Lance a lance" onPress={openMatch} style={{ flex: 1.4 }} />
                <Button label="Estatísticas" variant="onMedia" onPress={openMatch} style={{ flex: 1 }} />
              </>
            )}
            {finished && (
              <>
                <Button
                  label="Melhores momentos"
                  onPress={() =>
                    match.highlightsVideoId
                      ? navigation.navigate('VideoDetail', { videoId: match.highlightsVideoId })
                      : openMatch()
                  }
                  style={{ flex: 1.4 }}
                />
                <Button label="Craque do jogo" variant="onMedia" onPress={openMatch} style={{ flex: 1 }} />
              </>
            )}
          </View>
        </View>
      </TreatedImage>
    </View>
  );
}
