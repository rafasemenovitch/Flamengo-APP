import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';

import {
  Button,
  Countdown,
  DemoBadge,
  LiveIndicator,
  Skeleton,
  Text,
  TreatedImage,
  useTheme,
} from '@/design-system';
import { competitionName, ScoreBoard } from '@/features/shared/MatchUI';
import type { MatchDetail } from '@/types/match';
import { formatMatchDate } from '@/utils/format';

const HERO_HEIGHT = 520;

/**
 * Hero do próximo jogo (especificação 12.9): sangria total, foto tratada,
 * um protagonista tipográfico por estado — contagem (pré), placar (ao vivo),
 * placar final (pós).
 */
export function HeroMatchCard({ match, loading }: { match?: MatchDetail; loading: boolean }) {
  const navigation = useNavigation();
  const { layout } = useTheme();

  if (loading || !match) return <Skeleton height={HERO_HEIGHT} radius={0} />;

  const live = match.status === 'live' || match.status === 'halftime';
  const finished = match.status === 'finished';
  const goals = [...match.events]
    .reverse()
    .filter((e) => e.type === 'goal' || e.type === 'penalty-goal' || e.type === 'own-goal');
  const openMatch = () => navigation.navigate('MatchDetail', { matchId: match.id });

  const meta = live
    ? match.venue.name
    : finished
      ? `encerrado · ${match.venue.name}`
      : `${formatMatchDate(match.kickoff)} · ${match.venue.name}`;

  return (
    <TreatedImage imageKey={`hero-${match.id}`} aspect="hero" overlay style={{ height: HERO_HEIGHT }}>
      <View style={{ flex: 1, padding: layout.gutter, justifyContent: 'space-between' }}>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="overline" tone="onMedia">
              {competitionName(match.competitionId)} · {match.stage}
            </Text>
            <DemoBadge />
          </View>
          <Text variant="bodyM" tone="onMedia" style={{ opacity: 0.8 }}>
            {meta}
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          {live && (
            <View style={{ alignItems: 'center' }}>
              <LiveIndicator minute={match.status === 'halftime' ? 'Intervalo' : match.liveMinute} />
            </View>
          )}
          {finished && (
            <Text variant="overline" tone="onMedia" align="center">
              Encerrado
            </Text>
          )}
          <ScoreBoard match={match} onMedia />
          {!live && !finished && <Countdown target={match.kickoff} onMedia />}
          {(live || finished) && goals.length > 0 && (
            <Text variant="bodyS" tone="onMedia" align="center" style={{ opacity: 0.85 }}>
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
  );
}
