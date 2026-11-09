import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Avatar,
  Button,
  DemoBadge,
  EmptyState,
  ErrorState,
  LiveIndicator,
  Screen,
  SectionTitle,
  Skeleton,
  Tabs,
  Text,
  TreatedImage,
  useTheme,
} from '@/design-system';
import { PollCard } from '@/features/shared/Engagement';
import { competitionName, isFla, ResultLetter, ScoreBoard } from '@/features/shared/MatchUI';
import { useAsync } from '@/hooks/useAsync';
import { useLiveMatch } from '@/hooks/useMatch';
import type { RootScreenProps } from '@/navigation/types';
import { services } from '@/services';
import type { Lineup, MatchDetail, MatchEvent, MatchStat } from '@/types/match';
import { formatMatchDate, formatNumber, formatShortDate } from '@/utils/format';

type Tab = 'resumo' | 'escalacoes' | 'lances' | 'estatisticas' | 'confrontos';

const EVENT_ICON: Partial<Record<MatchEvent['type'], keyof typeof Ionicons.glyphMap>> = {
  goal: 'football-outline',
  'penalty-goal': 'football-outline',
  'own-goal': 'football-outline',
  yellow: 'square',
  red: 'square',
  substitution: 'swap-horizontal-outline',
  var: 'tv-outline',
  kickoff: 'play-outline',
  halftime: 'pause-outline',
  fulltime: 'flag-outline',
  commentary: 'chatbubble-outline',
};

/** Detalhe da partida (especificação 13.2). */
export function MatchDetailScreen({ route }: RootScreenProps<'MatchDetail'>) {
  const { matchId } = route.params;
  const navigation = useNavigation();
  const { layout } = useTheme();
  const q = useLiveMatch(() => services.matches.getMatch(matchId), [matchId]);
  const m = q.data;
  const [tab, setTab] = useState<Tab>('resumo');

  if (q.loading) {
    return (
      <Screen title="Partida">
        <Skeleton height={300} radius={0} />
      </Screen>
    );
  }
  if (q.error || !m)
    return (
      <Screen title="Partida" scroll={false}>
        <ErrorState onRetry={q.reload} />
      </Screen>
    );

  const live = m.status === 'live' || m.status === 'halftime';
  const started = m.status !== 'scheduled';
  const opponent = isFla(m.homeTeam) ? m.awayTeam : m.homeTeam;

  return (
    <Screen title={competitionName(m.competitionId)} refreshing={q.refreshing} onRefresh={q.refresh}>
      <TreatedImage imageKey={`match-${m.id}`} aspect="wide" overlay style={{ height: 300 }}>
        <View style={{ flex: 1, padding: layout.gutter, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="overline" tone="onMedia">
              {m.stage}
            </Text>
            {live ? (
              <LiveIndicator minute={m.status === 'halftime' ? 'Intervalo' : m.liveMinute} />
            ) : (
              <DemoBadge />
            )}
          </View>
          <ScoreBoard match={m} onMedia size="xl" />
          <Text variant="bodyS" tone="onMedia" align="center" style={{ opacity: 0.85 }}>
            {m.status === 'finished' ? 'Encerrado · ' : ''}
            {formatMatchDate(m.kickoff)} · {m.venue.name}
          </Text>
        </View>
      </TreatedImage>

      {m.status === 'scheduled' && m.ticketsOnSale && (
        <View style={{ paddingHorizontal: layout.gutter, marginTop: 20 }}>
          <Button
            label="Comprar ingresso"
            onPress={() => navigation.navigate('TicketPurchase', { matchId: m.id })}
            fullWidth
          />
        </View>
      )}

      <View style={{ marginTop: 20 }}>
        <Tabs<Tab>
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

      <View style={{ paddingTop: 24 }}>
        {tab === 'resumo' && <Summary m={m} onTab={setTab} />}
        {tab === 'escalacoes' &&
          (m.lineups ? (
            <Lineups m={m} />
          ) : (
            <EmptyState
              compact
              title="Escalações ainda não saíram."
              message="Saem cerca de 1 hora antes do jogo."
            />
          ))}
        {tab === 'lances' &&
          (started ? (
            <Timeline m={m} events={m.events} />
          ) : (
            <EmptyState
              compact
              pose="fan-tense"
              title="A bola ainda não rolou."
              message="O lance a lance aparece aqui em tempo real."
            />
          ))}
        {tab === 'estatisticas' &&
          (m.stats ? (
            <Stats m={m} />
          ) : m.preview ? (
            <PreviewStats m={m} />
          ) : (
            <EmptyState compact title="Sem estatísticas ainda." />
          ))}
        {tab === 'confrontos' && <HeadToHead opponentId={opponent.id} />}
      </View>
    </Screen>
  );
}

function Summary({ m, onTab }: { m: MatchDetail; onTab: (t: Tab) => void }) {
  const { colors, layout } = useTheme();
  const keyEvents = m.events.filter((e) => ['goal', 'penalty-goal', 'own-goal', 'red'].includes(e.type));
  const info: [string, string][] = [
    ['Data', formatMatchDate(m.kickoff)],
    ['Estádio', `${m.venue.name} · ${m.venue.city}`],
    ['Árbitro', m.referee ?? 'A definir'],
    ['Transmissão', m.broadcast?.join(', ') ?? 'A definir'],
    ...(m.attendance ? [['Público', formatNumber(m.attendance)] as [string, string]] : []),
  ];
  return (
    <View style={{ gap: 48 }}>
      {m.manOfTheMatchPollId && (
        <View style={{ paddingHorizontal: layout.gutter }}>
          <PollCard pollId={m.manOfTheMatchPollId} />
        </View>
      )}
      {keyEvents.length > 0 && (
        <View>
          <SectionTitle title="Gols" action="Lance a lance" onAction={() => onTab('lances')} />
          <Timeline m={m} events={keyEvents} />
        </View>
      )}
      <View>
        <SectionTitle title="Ficha" />
        {info.map(([k, v]) => (
          <View
            key={k}
            style={{
              flexDirection: 'row',
              paddingHorizontal: layout.gutter,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderColor: colors.lineHairline,
            }}
          >
            <Text variant="bodyS" tone="tertiary" style={{ width: 100 }}>
              {k}
            </Text>
            <Text variant="bodyM" style={{ flex: 1 }}>
              {v}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Lance a lance: minuto em display.s, ícone e texto; gols do Flamengo com barra vermelha. */
function Timeline({ m, events }: { m: MatchDetail; events: MatchEvent[] }) {
  const { colors, layout } = useTheme();
  const flaSide = isFla(m.homeTeam) ? 'home' : 'away';
  if (events.length === 0) return <EmptyState compact title="Nenhum lance ainda." />;
  return (
    <View>
      {events.map((e) => {
        const goal = e.type.includes('goal');
        const flaGoal = goal && e.side === flaSide;
        const iconColor =
          e.type === 'yellow'
            ? colors.warning
            : e.type === 'red'
              ? colors.danger
              : goal
                ? colors.inkPrimary
                : colors.inkTertiary;
        return (
          <View
            key={e.id}
            accessible
            accessibilityLabel={`${e.minute} ${e.text}`}
            style={{
              flexDirection: 'row',
              gap: 12,
              paddingHorizontal: layout.gutter,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderColor: colors.lineHairline,
            }}
          >
            {flaGoal && (
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 10,
                  bottom: 10,
                  width: 3,
                  backgroundColor: colors.accent,
                }}
              />
            )}
            <Text variant="displayS" style={{ width: 56 }}>
              {e.minute}
            </Text>
            <Ionicons
              name={EVENT_ICON[e.type] ?? 'ellipse-outline'}
              size={20}
              color={iconColor}
              style={{ marginTop: 2 }}
            />
            <View style={{ flex: 1, gap: 2 }}>
              {e.playerName && (
                <Text variant="titleS" style={{ color: flaGoal ? colors.accentText : colors.inkPrimary }}>
                  {goal ? `Gol · ${e.playerName}` : e.playerName}
                  {e.type === 'substitution' && e.secondaryName ? ` ↔ ${e.secondaryName}` : ''}
                </Text>
              )}
              <Text variant="bodyM" tone="secondary">
                {e.text}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Lineups({ m }: { m: MatchDetail }) {
  const [side, setSide] = useState<'home' | 'away'>(isFla(m.homeTeam) ? 'home' : 'away');
  const { layout } = useTheme();
  const lineup = m.lineups![side];
  const team = side === 'home' ? m.homeTeam : m.awayTeam;
  return (
    <View style={{ gap: 24 }}>
      <Tabs
        segments={[
          { key: 'home', label: m.homeTeam.shortName },
          { key: 'away', label: m.awayTeam.shortName },
        ]}
        value={side}
        onChange={setSide}
      />
      <View style={{ paddingHorizontal: layout.gutter }}>
        <Pitch lineup={lineup} />
      </View>
      <View style={{ paddingHorizontal: layout.gutter, gap: 4 }}>
        <Text variant="titleM">
          {team.shortName} · {lineup.formation}
        </Text>
        <Text variant="bodyS" tone="secondary">
          Técnico: {lineup.coach}
        </Text>
      </View>
      <PlayerList title="Titulares" players={lineup.starters} />
      <PlayerList title="Reservas" players={lineup.bench} />
    </View>
  );
}

function PlayerList({ title, players }: { title: string; players: Lineup['starters'] }) {
  const navigation = useNavigation();
  const { colors, layout } = useTheme();
  return (
    <View>
      <Text variant="overline" tone="secondary" style={{ paddingHorizontal: layout.gutter, marginBottom: 8 }}>
        {title}
      </Text>
      {players.map((p) => (
        <Pressable
          key={`${p.number}-${p.name}`}
          disabled={!p.playerId}
          onPress={() => p.playerId && navigation.navigate('PlayerProfile', { playerId: p.playerId })}
          accessibilityRole={p.playerId ? 'button' : undefined}
          accessibilityLabel={`${p.number}, ${p.name}, ${p.position}${p.isCaptain ? ', capitão' : ''}`}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            minHeight: 56,
            paddingHorizontal: layout.gutter,
            borderTopWidth: 1,
            borderColor: colors.lineHairline,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Avatar name={p.name} number={p.number} size={32} />
          <Text variant="titleS" style={{ flex: 1 }}>
            {p.name}
            {p.isCaptain ? ' (C)' : ''}
          </Text>
          <Text variant="bodyS" tone="tertiary">
            {p.position}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Campo em vista superior: linhas hairline sobre bgRaised, jogadores em círculos de 32px. */
function Pitch({ lineup }: { lineup: Lineup }) {
  const { colors, radius } = useTheme();
  const lines = [1, ...lineup.formation.split('-').map(Number)];
  let idx = 0;
  const rows = lines.map((n) => lineup.starters.slice(idx, (idx += n)));
  return (
    <View
      style={{
        backgroundColor: colors.bgRaised,
        borderRadius: radius.l,
        paddingVertical: 20,
        gap: 20,
        overflow: 'hidden',
      }}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            alignItems: 'center',
            justifyContent: 'center',
            margin: 12,
            borderWidth: 1,
            borderColor: colors.lineHairline,
          },
        ]}
      >
        <View
          style={{ position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.lineHairline }}
        />
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            borderWidth: 1,
            borderColor: colors.lineHairline,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            width: 140,
            height: 48,
            borderWidth: 1,
            borderTopWidth: 0,
            borderColor: colors.lineHairline,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: 140,
            height: 48,
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: colors.lineHairline,
          }}
        />
      </View>
      {[...rows].reverse().map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
          {row.map((p) => (
            <View key={p.number} style={{ alignItems: 'center', width: 68, gap: 4 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.inkPrimary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="labelM" style={{ color: colors.bgCanvas }}>
                  {p.number}
                </Text>
              </View>
              <Text variant="bodyS" numberOfLines={1} align="center">
                {p.name.split(' ').slice(-1)[0]}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const STAT_GROUPS: [NonNullable<MatchStat['group']>, string][] = [
  ['geral', 'Visão geral'],
  ['ataque', 'Ataque'],
  ['passes', 'Passes'],
  ['defesa', 'Defesa'],
  ['disciplina', 'Disciplina'],
];
/** Estatísticas em que o menor número é o melhor. */
const LOWER_IS_BETTER = new Set(['goalsAgainst', 'fouls', 'yellow', 'offsides']);

function statValue(n: number, unit?: string) {
  const v = Number.isInteger(n) ? String(n) : n.toFixed(n < 10 ? 2 : 1).replace('.', ',');
  return `${v}${unit ?? ''}`;
}

/** Uma linha comparativa: números nas pontas (o melhor em destaque) e duas barras. */
function StatRow({ m, s }: { m: MatchDetail; s: MatchStat }) {
  const { colors } = useTheme();
  const total = s.home + s.away || 1;
  const lowerBetter = LOWER_IS_BETTER.has(s.key);
  const homeLeads = lowerBetter ? s.home < s.away : s.home > s.away;
  const awayLeads = lowerBetter ? s.away < s.home : s.away > s.home;
  const barColor = (fla: boolean, leads: boolean) =>
    fla ? colors.accent : leads ? colors.inkPrimary : colors.inkTertiary;
  return (
    <View style={{ gap: 8 }} accessible accessibilityLabel={`${s.label}: ${s.home} a ${s.away}`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text variant="numericTable" tone={homeLeads ? 'primary' : 'tertiary'} style={{ width: 64 }}>
          {statValue(s.home, s.unit)}
        </Text>
        <Text variant="bodyM" tone="secondary" align="center" style={{ flex: 1 }}>
          {s.label}
        </Text>
        <Text
          variant="numericTable"
          tone={awayLeads ? 'primary' : 'tertiary'}
          style={{ width: 64, textAlign: 'right' }}
        >
          {statValue(s.away, s.unit)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 4, height: 4 }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'flex-end',
            backgroundColor: colors.bgRaised2,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${(s.home / total) * 100}%`,
              backgroundColor: barColor(isFla(m.homeTeam), homeLeads),
            }}
          />
        </View>
        <View style={{ flex: 1, backgroundColor: colors.bgRaised2, borderRadius: 2, overflow: 'hidden' }}>
          <View
            style={{
              width: `${(s.away / total) * 100}%`,
              height: '100%',
              backgroundColor: barColor(isFla(m.awayTeam), awayLeads),
            }}
          />
        </View>
      </View>
    </View>
  );
}

/** Posse de bola em destaque: dois números grandes e uma barra única dividida. */
function Possession({ m, s, title }: { m: MatchDetail; s: MatchStat; title: string }) {
  const { colors, layout } = useTheme();
  const homeColor = isFla(m.homeTeam) ? colors.accent : colors.inkTertiary;
  const awayColor = isFla(m.awayTeam) ? colors.accent : colors.inkTertiary;
  return (
    <View style={{ paddingHorizontal: layout.gutter, gap: 12 }}>
      <Text variant="bodyM" tone="secondary" align="center">
        {title}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Text variant="displayXl">{statValue(s.home, '%')}</Text>
          <Text variant="titleS" tone="secondary">
            {m.homeTeam.shortName}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="displayXl">{statValue(s.away, '%')}</Text>
          <Text variant="titleS" tone="secondary">
            {m.awayTeam.shortName}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', height: 8, gap: 3 }}>
        <View style={{ flex: s.home, backgroundColor: homeColor, borderRadius: 2 }} />
        <View style={{ flex: s.away, backgroundColor: awayColor, borderRadius: 2 }} />
      </View>
    </View>
  );
}

function TeamsHeader({ m }: { m: MatchDetail }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text variant="titleS">{m.homeTeam.shortName}</Text>
      <Text variant="titleS">{m.awayTeam.shortName}</Text>
    </View>
  );
}

/** Estatísticas da partida, agrupadas como nos apps de estatística (dados demonstrativos). */
function Stats({ m }: { m: MatchDetail }) {
  const { layout } = useTheme();
  const stats = m.stats!;
  const possession = stats.find((s) => s.key === 'possession');
  return (
    <View style={{ gap: 48 }}>
      {possession && <Possession m={m} s={possession} title="Posse de bola" />}
      {STAT_GROUPS.map(([g, title]) => {
        const rows = stats.filter((s) => s.group === g && s.key !== 'possession');
        if (!rows.length) return null;
        return (
          <View key={g}>
            <SectionTitle title={title} />
            <View style={{ paddingHorizontal: layout.gutter, gap: 20 }}>
              {rows.map((s) => (
                <StatRow key={s.key} m={m} s={s} />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Antes da bola rolar: forma recente e médias da temporada dos dois times. */
function PreviewStats({ m }: { m: MatchDetail }) {
  const { layout } = useTheme();
  const p = m.preview!;
  const possession = p.stats.find((s) => s.key === 'possession');
  return (
    <View style={{ gap: 48 }}>
      <View>
        <SectionTitle title="Últimos 5 jogos" />
        <View style={{ paddingHorizontal: layout.gutter, gap: 16 }}>
          {(
            [
              [m.homeTeam.shortName, p.homeForm],
              [m.awayTeam.shortName, p.awayForm],
            ] as const
          ).map(([name, form]) => (
            <View key={name} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text variant="titleM" style={{ flex: 1 }}>
                {name}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {form.map((r, i) => (
                  <ResultLetter key={i} result={r} />
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
      {possession && <Possession m={m} s={possession} title="Posse de bola média na temporada" />}
      <View>
        <SectionTitle title="Médias na temporada" />
        <View style={{ paddingHorizontal: layout.gutter, gap: 20 }}>
          <TeamsHeader m={m} />
          {p.stats
            .filter((s) => s.key !== 'possession')
            .map((s) => (
              <StatRow key={s.key} m={m} s={s} />
            ))}
        </View>
      </View>
    </View>
  );
}

function HeadToHead({ opponentId }: { opponentId: string }) {
  const { colors, layout } = useTheme();
  const h = useAsync(() => services.matches.getHeadToHead(opponentId), [opponentId]);
  if (h.loading || !h.data)
    return (
      <View style={{ paddingHorizontal: layout.gutter }}>
        <Skeleton height={260} radius={8} />
      </View>
    );
  const d = h.data;
  const blocks: [string, number, 'success' | 'secondary' | 'brand'][] = [
    ['Vitórias', d.wins, 'success'],
    ['Empates', d.draws, 'secondary'],
    ['Derrotas', d.losses, 'brand'],
  ];
  return (
    <View style={{ gap: 48 }}>
      <View style={{ paddingHorizontal: layout.gutter, gap: 16 }}>
        <Text variant="bodyS" tone="secondary">
          Flamengo × {d.opponent.shortName} · {d.played} jogos (dados demonstrativos)
        </Text>
        <View style={{ flexDirection: 'row' }}>
          {blocks.map(([l, v, tone]) => (
            <View key={l} style={{ flex: 1 }}>
              <Text variant="displayXl" tone={tone}>
                {v}
              </Text>
              <Text variant="bodyS" tone="secondary">
                {l}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View>
        <SectionTitle title="Últimos confrontos" />
        {d.lastMatches.map((x, i) => (
          <View
            key={i}
            style={{
              paddingHorizontal: layout.gutter,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderColor: colors.lineHairline,
            }}
          >
            <Text variant="titleS">
              {x.home} {x.score.home} × {x.score.away} {x.away}
            </Text>
            <Text variant="bodyS" tone="tertiary">
              {x.competition} · {formatShortDate(x.date)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
