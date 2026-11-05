import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Avatar,
  Badge,
  Button,
  Card,
  DemoBadge,
  EmptyState,
  ErrorState,
  LiveIndicator,
  ProgressBar,
  Screen,
  SegmentedControl,
  Skeleton,
  Text,
  useTheme,
} from '@/design-system';
import { PollCard } from '@/features/shared/Engagement';
import { competitionName, ScoreBoard } from '@/features/shared/MatchUI';
import { useAsync } from '@/hooks/useAsync';
import { useLiveMatch } from '@/hooks/useMatch';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import type { Lineup, MatchDetail, MatchEvent } from '@/types/match';
import { formatMatchDate, formatNumber, formatShortDate } from '@/utils/format';

type Tab = 'resumo' | 'escalacoes' | 'lances' | 'estatisticas' | 'confrontos';

const EVENT_ICON: Partial<Record<MatchEvent['type'], keyof typeof Ionicons.glyphMap>> = {
  goal: 'football',
  'penalty-goal': 'football',
  'own-goal': 'football',
  yellow: 'square',
  red: 'square',
  substitution: 'swap-horizontal',
  var: 'tv',
  kickoff: 'play',
  halftime: 'pause',
  fulltime: 'flag',
  commentary: 'chatbubble-outline',
};

export function MatchDetailScreen({ route }: RootScreenProps<'MatchDetail'>) {
  const { matchId } = route.params;
  const navigation = useNavigation();
  const { colors, spacing, radius, layout } = useTheme();
  const q = useLiveMatch(() => services.matches.getMatch(matchId), [matchId]);
  const m = q.data;
  const started = m && m.status !== 'scheduled';
  const [tab, setTab] = useState<Tab>('resumo');

  if (q.loading) {
    return (
      <Screen title="Partida">
        <View style={{ padding: layout.gutter, gap: spacing.lg }}>
          <Skeleton height={220} radius={radius.xl} />
          <Skeleton height={300} radius={radius.lg} />
        </View>
      </Screen>
    );
  }
  if (q.error || !m) return <Screen title="Partida" scroll={false}><ErrorState onRetry={q.reload} /></Screen>;

  const live = m.status === 'live' || m.status === 'halftime';
  const opponent = m.homeTeam.id === 'fla' ? m.awayTeam : m.homeTeam;

  return (
    <Screen title={competitionName(m.competitionId)} refreshing={q.refreshing} onRefresh={q.refresh}>
      <View style={{ paddingHorizontal: layout.gutter }}>
        <LinearGradient colors={colors.heroGradient} style={{ borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg }}>
          <View style={styles.between}>
            <Text variant="overline" tone="onMedia" style={{ opacity: 0.8 }}>{m.stage}</Text>
            {live ? <LiveIndicator minute={m.status === 'halftime' ? 'Intervalo' : m.liveMinute} /> : m.status === 'finished' ? <Badge label="Encerrado" tone="onMedia" /> : <DemoBadge />}
          </View>
          <ScoreBoard match={m} onMedia />
          <Text variant="caption" tone="onMedia" align="center" style={{ opacity: 0.8 }}>
            {formatMatchDate(m.kickoff)} · {m.venue.name}, {m.venue.city}
          </Text>
          {m.status === 'scheduled' && m.ticketsOnSale && (
            <Button label="Comprar ingresso" icon="ticket" onPress={() => navigation.navigate('TicketPurchase', { matchId: m.id })} fullWidth />
          )}
        </LinearGradient>
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <SegmentedControl<Tab>
          accessibilityLabel="Seções da partida"
          segments={[
            { key: 'resumo', label: 'Resumo' },
            { key: 'escalacoes', label: 'Escalações' },
            { key: 'lances', label: 'Lance a lance' },
            { key: 'estatisticas', label: 'Estatísticas' },
            { key: 'confrontos', label: 'Confrontos' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      <View style={{ padding: layout.gutter, gap: spacing.lg }}>
        {tab === 'resumo' && <Summary m={m} onTab={setTab} />}
        {tab === 'escalacoes' && (m.lineups ? <Lineups m={m} /> : <EmptyState compact icon="people-outline" title="Escalações ainda não divulgadas" message="Saem cerca de 1 hora antes do jogo." />)}
        {tab === 'lances' && (started ? <Timeline events={m.events} /> : <EmptyState compact icon="time-outline" title="O jogo ainda não começou" message="O lance a lance aparece aqui em tempo real." />)}
        {tab === 'estatisticas' && (m.stats ? <Stats m={m} /> : <EmptyState compact icon="stats-chart-outline" title="Sem estatísticas ainda" />)}
        {tab === 'confrontos' && <HeadToHead opponentId={opponent.id} />}
      </View>
    </Screen>
  );
}

function Summary({ m, onTab }: { m: MatchDetail; onTab: (t: Tab) => void }) {
  const navigation = useNavigation();
  const { spacing, colors } = useTheme();
  const keyEvents = m.events.filter((e) => ['goal', 'penalty-goal', 'own-goal', 'red'].includes(e.type));
  const info: Array<[keyof typeof Ionicons.glyphMap, string, string]> = [
    ['calendar-outline', 'Data', formatMatchDate(m.kickoff)],
    ['location-outline', 'Estádio', `${m.venue.name} · ${m.venue.city}`],
    ['person-outline', 'Árbitro', m.referee ?? 'A definir'],
    ['tv-outline', 'Transmissão', m.broadcast?.join(', ') ?? 'A definir'],
    ...(m.attendance ? [['people-outline', 'Público', formatNumber(m.attendance)] as [keyof typeof Ionicons.glyphMap, string, string]] : []),
  ];
  return (
    <>
      {m.status === 'finished' && m.highlightsVideoId && (
        <Button label="Assistir melhores momentos" icon="play-circle" onPress={() => navigation.navigate('VideoDetail', { videoId: m.highlightsVideoId! })} fullWidth />
      )}
      {m.manOfTheMatchPollId && <PollCard pollId={m.manOfTheMatchPollId} />}
      {keyEvents.length > 0 && (
        <Card>
          <Text variant="h3" style={{ marginBottom: spacing.md }}>Gols</Text>
          <Timeline events={keyEvents} dense />
          <Button label="Ver lance a lance" variant="ghost" onPress={() => onTab('lances')} style={{ alignSelf: 'center', marginTop: spacing.sm }} />
        </Card>
      )}
      <Card>
        <View style={{ gap: spacing.md }}>
          {info.map(([icon, k, v]) => (
            <View key={k} style={[styles.row, { gap: spacing.md }]}>
              <Ionicons name={icon} size={18} color={colors.textTertiary} />
              <Text variant="caption" tone="secondary" style={{ width: 90 }}>{k}</Text>
              <Text variant="callout" style={{ flex: 1 }}>{v}</Text>
            </View>
          ))}
        </View>
      </Card>
    </>
  );
}

function Timeline({ events, dense }: { events: MatchEvent[]; dense?: boolean }) {
  const { colors, spacing } = useTheme();
  if (events.length === 0) return <EmptyState compact title="Nenhum lance ainda" />;
  return (
    <View style={{ gap: dense ? spacing.sm : 0 }}>
      {events.map((e, i) => {
        const goal = e.type.includes('goal');
        const color = e.type === 'yellow' ? colors.warning : e.type === 'red' ? colors.danger : goal ? colors.primaryText : colors.textTertiary;
        return (
          <View key={e.id} style={[styles.row, { alignItems: 'flex-start', gap: spacing.md }]} accessible accessibilityLabel={`${e.minute} ${e.text}`}>
            <Text variant="tabular" tone="secondary" style={{ width: 44, textAlign: 'right', paddingTop: 2 }}>{e.minute}</Text>
            <View style={{ alignItems: 'center', width: 24 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: goal ? colors.primarySubtle : colors.surfaceMuted }}>
                <Ionicons name={EVENT_ICON[e.type] ?? 'ellipse'} size={12} color={color} />
              </View>
              {!dense && i < events.length - 1 && <View style={{ width: 2, flex: 1, minHeight: 20, backgroundColor: colors.border }} />}
            </View>
            <View style={{ flex: 1, paddingBottom: dense ? 0 : spacing.lg, gap: 2 }}>
              {e.playerName && <Text variant="bodyStrong">{e.playerName}{e.secondaryName && e.type === 'substitution' ? ` ↔ ${e.secondaryName}` : ''}</Text>}
              <Text variant={goal ? 'callout' : 'caption'} tone={goal ? 'primary' : 'secondary'}>{e.text}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Lineups({ m }: { m: MatchDetail }) {
  const [side, setSide] = useState<'home' | 'away'>(m.homeTeam.id === 'fla' ? 'home' : 'away');
  const { spacing } = useTheme();
  const lineup = m.lineups![side];
  const team = side === 'home' ? m.homeTeam : m.awayTeam;
  return (
    <>
      <View style={{ marginHorizontal: -16 }}>
        <SegmentedControl
          segments={[{ key: 'home', label: m.homeTeam.shortName }, { key: 'away', label: m.awayTeam.shortName }]}
          value={side}
          onChange={setSide}
        />
      </View>
      <Pitch lineup={lineup} />
      <Card>
        <Text variant="h3">{team.shortName} · {lineup.formation}</Text>
        <Text variant="caption" tone="secondary" style={{ marginBottom: spacing.md }}>Técnico: {lineup.coach}</Text>
        <PlayerList title="Titulares" players={lineup.starters} />
        <PlayerList title="Reservas" players={lineup.bench} />
      </Card>
    </>
  );
}

function PlayerList({ title, players }: { title: string; players: Lineup['starters'] }) {
  const navigation = useNavigation();
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
      <Text variant="overline" tone="tertiary" style={{ marginBottom: spacing.xs }}>{title}</Text>
      {players.map((p) => (
        <Pressable
          key={`${p.number}-${p.name}`}
          disabled={!p.playerId}
          onPress={() => p.playerId && navigation.navigate('PlayerProfile', { playerId: p.playerId })}
          accessibilityRole={p.playerId ? 'button' : undefined}
          accessibilityLabel={`${p.number}, ${p.name}, ${p.position}${p.isCaptain ? ', capitão' : ''}`}
          style={({ pressed }) => [styles.row, { gap: spacing.md, minHeight: 44, opacity: pressed ? 0.6 : 1 }]}
        >
          <Avatar name={p.name} number={p.number} size={32} />
          <Text variant="bodyStrong" style={{ flex: 1 }}>{p.name}{p.isCaptain ? '  (C)' : ''}</Text>
          <Text variant="caption" tone="tertiary">{p.position}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Campinho esquemático com a formação (linhas a partir da string "4-3-3"). */
function Pitch({ lineup }: { lineup: Lineup }) {
  const { colors, radius, spacing } = useTheme();
  const lines = [1, ...lineup.formation.split('-').map(Number)];
  let idx = 0;
  const rows = lines.map((n) => lineup.starters.slice(idx, (idx += n)));
  return (
    <View style={{ backgroundColor: colors.successSubtle, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.lg, gap: spacing.lg, overflow: 'hidden' }}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{ position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.border }} />
        <View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 1, borderColor: colors.border }} />
      </View>
      {[...rows].reverse().map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
          {row.map((p) => (
            <View key={p.number} style={{ alignItems: 'center', width: 64, gap: 4 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="label" tone="onPrimary">{p.number}</Text>
              </View>
              <Text variant="footnote" numberOfLines={1} align="center">{p.name.split(' ').slice(-1)[0]}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function Stats({ m }: { m: MatchDetail }) {
  const { colors, spacing } = useTheme();
  return (
    <Card>
      <View style={[styles.between, { marginBottom: spacing.lg }]}>
        <Text variant="label">{m.homeTeam.shortName}</Text>
        <Text variant="label">{m.awayTeam.shortName}</Text>
      </View>
      <View style={{ gap: spacing.lg }}>
        {m.stats!.map((s) => {
          const total = s.home + s.away || 1;
          return (
            <View key={s.key} style={{ gap: 6 }} accessible accessibilityLabel={`${s.label}: ${s.home} a ${s.away}`}>
              <View style={styles.between}>
                <Text variant="tabular">{s.home}{s.unit ?? ''}</Text>
                <Text variant="caption" tone="secondary">{s.label}</Text>
                <Text variant="tabular">{s.away}{s.unit ?? ''}</Text>
              </View>
              <View style={[styles.row, { gap: 4 }]}>
                <View style={{ flex: 1, transform: [{ scaleX: -1 }] }}>
                  <ProgressBar value={s.home / total} color={m.homeTeam.id === 'fla' ? colors.primary : colors.textTertiary} height={6} />
                </View>
                <View style={{ flex: 1 }}>
                  <ProgressBar value={s.away / total} color={m.awayTeam.id === 'fla' ? colors.primary : colors.textTertiary} height={6} />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function HeadToHead({ opponentId }: { opponentId: string }) {
  const { spacing } = useTheme();
  const h = useAsync(() => services.matches.getHeadToHead(opponentId), [opponentId]);
  if (h.loading || !h.data) return <Skeleton height={260} radius={20} />;
  const d = h.data;
  const blocks: Array<[string, number, 'success' | 'secondary' | 'danger']> = [
    ['Vitórias', d.wins, 'success'],
    ['Empates', d.draws, 'secondary'],
    ['Derrotas', d.losses, 'danger'],
  ];
  return (
    <>
      <Card>
        <Text variant="h3">Flamengo × {d.opponent.shortName}</Text>
        <Text variant="caption" tone="secondary">{d.played} jogos na história (dados demonstrativos)</Text>
        <View style={[styles.row, { marginTop: spacing.lg }]}>
          {blocks.map(([l, v, tone]) => (
            <View key={l} style={{ flex: 1, alignItems: 'center' }}>
              <Text variant="number" tone={tone}>{v}</Text>
              <Text variant="caption" tone="secondary">{l}</Text>
            </View>
          ))}
        </View>
      </Card>
      <Card>
        <Text variant="h3" style={{ marginBottom: spacing.md }}>Últimos confrontos</Text>
        {d.lastMatches.map((x, i) => (
          <View key={i} style={[styles.between, { paddingVertical: spacing.sm }]}>
            <View style={{ flex: 1 }}>
              <Text variant="callout">{x.home} {x.score.home} × {x.score.away} {x.away}</Text>
              <Text variant="footnote" tone="tertiary">{x.competition} · {formatShortDate(x.date)}</Text>
            </View>
          </View>
        ))}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
