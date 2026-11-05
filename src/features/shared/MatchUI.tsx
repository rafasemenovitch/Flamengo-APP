import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Badge, Card, LiveIndicator, TeamCrest, Text, useTheme } from '@/design-system';
import { COMPETITIONS } from '@/data/demo/seed';
import type { Match, StandingsTable as Table, Team } from '@/types/match';
import { formatMatchDate, formatShortDate, formatTime } from '@/utils/format';

export const competitionName = (id: string) => COMPETITIONS.find((c) => c.id === id)?.shortName ?? id;

export const isFla = (t: Team) => t.id === 'fla';

/** Resultado do ponto de vista do Flamengo. */
export function flaResult(m: Match): 'W' | 'D' | 'L' | undefined {
  if (!m.score || m.status !== 'finished') return undefined;
  const fla = isFla(m.homeTeam) ? m.score.home : m.score.away;
  const opp = isFla(m.homeTeam) ? m.score.away : m.score.home;
  return fla > opp ? 'W' : fla < opp ? 'L' : 'D';
}

export function ResultPill({ result }: { result: 'W' | 'D' | 'L' }) {
  const map = { W: ['V', 'success'], D: ['E', 'neutral'], L: ['D', 'danger'] } as const;
  const [label, tone] = map[result];
  return <Badge label={label} tone={tone} style={{ minWidth: 24, justifyContent: 'center' }} />;
}

/** Linha de jogo usada no calendário, resultados e ingressos. */
export function MatchRow({ match, onPress, trailing }: { match: Match; onPress?: () => void; trailing?: React.ReactNode }) {
  const { spacing, colors } = useTheme();
  const live = match.status === 'live' || match.status === 'halftime';
  const result = flaResult(match);
  return (
    <Card onPress={onPress} accessibilityLabel={`${match.homeTeam.shortName} contra ${match.awayTeam.shortName}, ${formatMatchDate(match.kickoff)}`} padding="sm">
      <View style={{ gap: spacing.sm }}>
        <View style={styles.rowBetween}>
          <Text variant="overline" tone="tertiary" numberOfLines={1} style={{ flex: 1 }}>
            {competitionName(match.competitionId)} · {match.stage}
          </Text>
          {live ? <LiveIndicator compact minute={match.liveMinute} /> : result ? <ResultPill result={result} /> : null}
        </View>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <TeamLine team={match.homeTeam} score={match.score?.home} />
            <TeamLine team={match.awayTeam} score={match.score?.away} />
          </View>
          <View style={{ alignItems: 'flex-end', marginLeft: spacing.md, gap: 2 }}>
            {match.status === 'scheduled' ? (
              <>
                <Text variant="label">{formatShortDate(match.kickoff)}</Text>
                <Text variant="numberSm">{formatTime(match.kickoff)}</Text>
              </>
            ) : (
              <Text variant="caption" tone="tertiary">
                {formatShortDate(match.kickoff)}
              </Text>
            )}
            {trailing}
          </View>
        </View>
        <View style={[styles.row, { gap: 4 }]}>
          <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
          <Text variant="footnote" tone="tertiary">
            {match.venue.name}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function TeamLine({ team, score }: { team: Team; score?: number }) {
  const { spacing } = useTheme();
  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      <TeamCrest shortName={team.code} color={team.color} size={22} />
      <Text variant={isFla(team) ? 'bodyStrong' : 'body'} style={{ flex: 1 }} numberOfLines={1}>
        {team.shortName}
      </Text>
      {score !== undefined && <Text variant="numberSm">{score}</Text>}
    </View>
  );
}

/** Placar grande (hero e detalhe da partida). */
export function ScoreBoard({ match, onMedia }: { match: Match; onMedia?: boolean }) {
  const { spacing } = useTheme();
  const tone = onMedia ? 'onMedia' : 'primary';
  const started = match.status !== 'scheduled' && match.status !== 'postponed';
  return (
    <View style={[styles.rowBetween, { alignItems: 'center' }]}>
      <TeamBlock team={match.homeTeam} onMedia={onMedia} />
      <View style={{ alignItems: 'center', minWidth: 110, gap: spacing.xs }}>
        {started && match.score ? (
          <Text variant="score" tone={tone} accessibilityLabel={`Placar ${match.score.home} a ${match.score.away}`}>
            {match.score.home}
            <Text variant="h1" tone={tone} style={{ opacity: 0.5 }}>
              {'  ×  '}
            </Text>
            {match.score.away}
          </Text>
        ) : (
          <Text variant="number" tone={tone}>
            {formatTime(match.kickoff)}
          </Text>
        )}
      </View>
      <TeamBlock team={match.awayTeam} onMedia={onMedia} />
    </View>
  );
}

function TeamBlock({ team, onMedia }: { team: Team; onMedia?: boolean }) {
  return (
    <View style={{ alignItems: 'center', width: 84, gap: 6 }}>
      <TeamCrest shortName={team.code} color={team.color} size={52} />
      <Text variant="label" tone={onMedia ? 'onMedia' : 'primary'} numberOfLines={1} align="center">
        {team.shortName}
      </Text>
    </View>
  );
}

/** Tabela de classificação (compacta = só posições próximas do Flamengo). */
export function StandingsTable({ table, compact }: { table: Table; compact?: boolean }) {
  const { colors, spacing, radius } = useTheme();
  let rows = table.rows;
  if (compact) {
    const idx = rows.findIndex((r) => r.team.id === 'fla');
    const start = Math.max(0, Math.min(idx - 2, rows.length - 5));
    rows = rows.slice(start, start + 5);
  }
  const zoneColor = (z?: string) =>
    z === 'libertadores' ? colors.info : z === 'pre-libertadores' ? colors.success : z === 'sudamericana' ? colors.warning : z === 'relegation' ? colors.danger : 'transparent';
  return (
    <View accessibilityRole="list">
      <View style={[styles.row, { paddingHorizontal: spacing.md, paddingBottom: spacing.sm }]}>
        <Text variant="overline" tone="tertiary" style={{ width: 28 }}>#</Text>
        <Text variant="overline" tone="tertiary" style={{ flex: 1 }}>Time</Text>
        {['J', 'V', 'SG'].map((h) => (
          <Text key={h} variant="overline" tone="tertiary" style={styles.col}>{h}</Text>
        ))}
        <Text variant="overline" tone="tertiary" style={styles.colPts}>Pts</Text>
      </View>
      {rows.map((r) => {
        const fla = r.team.id === 'fla';
        return (
          <View
            key={r.team.id}
            accessible
            accessibilityLabel={`${r.position}º ${r.team.shortName}, ${r.points} pontos`}
            style={[styles.row, { paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.sm }, fla && { backgroundColor: colors.primarySubtle }]}
          >
            <View style={{ width: 28, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: zoneColor(r.zone) }} />
              <Text variant="tabular">{r.position}</Text>
            </View>
            <View style={[styles.row, { flex: 1, gap: spacing.sm }]}>
              <TeamCrest shortName={r.team.code} color={r.team.color} size={20} />
              <Text variant={fla ? 'bodyStrong' : 'callout'} numberOfLines={1} style={{ flex: 1 }} tone={fla ? 'brand' : 'primary'}>
                {r.team.shortName}
              </Text>
            </View>
            <Text variant="tabular" tone="secondary" style={styles.col}>{r.played}</Text>
            <Text variant="tabular" tone="secondary" style={styles.col}>{r.won}</Text>
            <Text variant="tabular" tone="secondary" style={styles.col}>{r.goalsFor - r.goalsAgainst}</Text>
            <Text variant="tabular" style={[styles.colPts, { fontFamily: 'Inter_700Bold' }]}>{r.points}</Text>
          </View>
        );
      })}
      {!compact && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, padding: spacing.md }}>
          {[['libertadores', 'Libertadores'], ['pre-libertadores', 'Pré-Libertadores'], ['sudamericana', 'Sul-Americana'], ['relegation', 'Rebaixamento']].map(([z, l]) => (
            <View key={z} style={[styles.row, { gap: 6 }]}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: zoneColor(z) }} />
              <Text variant="footnote" tone="secondary">{l}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  col: { width: 30, textAlign: 'center' },
  colPts: { width: 36, textAlign: 'right' },
});
