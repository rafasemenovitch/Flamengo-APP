import { Fragment, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Crest, fonts, LiveIndicator, Text, useTheme } from '@/design-system';
import { COMPETITIONS } from '@/data/demo/seed';
import type { Match, StandingsTable as Table, Team } from '@/types/match';
import { formatTime } from '@/utils/format';

export const competitionName = (id: string) => COMPETITIONS.find((c) => c.id === id)?.shortName ?? id;

export const isFla = (t: Team) => t.id === 'fla';

/** Resultado do ponto de vista do Flamengo. */
export function flaResult(m: Match): 'W' | 'D' | 'L' | undefined {
  if (!m.score || m.status !== 'finished') return undefined;
  const fla = isFla(m.homeTeam) ? m.score.home : m.score.away;
  const opp = isFla(m.homeTeam) ? m.score.away : m.score.home;
  return fla > opp ? 'W' : fla < opp ? 'L' : 'D';
}

/** Letra de resultado: V em verde, E neutro, D em vermelho (sem pílula). */
export function ResultLetter({ result }: { result: 'W' | 'D' | 'L' }) {
  const map = { W: ['V', 'success'], D: ['E', 'secondary'], L: ['D', 'brand'] } as const;
  const [label, tone] = map[result];
  return (
    <Text
      variant="labelM"
      tone={tone}
      accessibilityLabel={result === 'W' ? 'Vitória' : result === 'D' ? 'Empate' : 'Derrota'}
    >
      {label}
    </Text>
  );
}
/** @deprecated */
export const ResultPill = ResultLetter;

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.toDateString() === n.toDateString();
}

/**
 * Linha de partida (especificação 12.8), sem card: coluna de data, times com
 * escudo de 20px (Flamengo em destaque), horário ou placar à direita.
 */
export function MatchRow({
  match,
  onPress,
  trailing,
}: {
  match: Match;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  const { colors, layout } = useTheme();
  const d = new Date(match.kickoff);
  const today = isToday(match.kickoff);
  const live = match.status === 'live' || match.status === 'halftime';
  const result = flaResult(match);
  const team = (t: Team, score?: number) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Crest team={t} size={20} />
      <Text
        variant="titleS"
        numberOfLines={1}
        style={{
          flex: 1,
          fontFamily: isFla(t) ? fonts.bold : fonts.regular,
          color: isFla(t) ? colors.inkPrimary : colors.inkSecondary,
        }}
      >
        {t.shortName}
      </Text>
      {score !== undefined && <Text variant="displayS">{score}</Text>}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${match.homeTeam.shortName} contra ${match.awayTeam.shortName}, ${competitionName(match.competitionId)}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 96,
        paddingVertical: 12,
        paddingHorizontal: layout.gutter,
        gap: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {today && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 12,
            bottom: 12,
            width: 3,
            backgroundColor: colors.accent,
          }}
        />
      )}
      <View style={{ width: 44, alignItems: 'flex-start' }}>
        <Text variant="displayM">{String(d.getDate()).padStart(2, '0')}</Text>
        {today ? (
          <Text variant="labelM" tone="brand">
            Hoje
          </Text>
        ) : (
          <Text variant="overline" tone="tertiary">
            {WEEKDAYS[d.getDay()]}
          </Text>
        )}
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Text variant="overline" tone="tertiary" numberOfLines={1}>
          {competitionName(match.competitionId)} · {match.stage}
        </Text>
        {team(match.homeTeam, match.status !== 'scheduled' ? match.score?.home : undefined)}
        {team(match.awayTeam, match.status !== 'scheduled' ? match.score?.away : undefined)}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4, minWidth: 64 }}>
        {live ? (
          <LiveIndicator minute={match.status === 'halftime' ? 'Int.' : match.liveMinute} />
        ) : result ? (
          <ResultLetter result={result} />
        ) : (
          <Text variant="displayS">{formatTime(match.kickoff)}</Text>
        )}
        {trailing ?? (
          <Text variant="bodyS" tone="tertiary" numberOfLines={1}>
            {match.venue.name}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/** Lista de partidas agrupada por mês, com hairline entre linhas. */
export function MatchList({
  matches,
  onPress,
  trailing,
}: {
  matches: Match[];
  onPress: (m: Match) => void;
  trailing?: (m: Match) => ReactNode;
}) {
  const { colors, layout } = useTheme();
  const monthOf = (m: Match) => new Date(m.kickoff).getMonth();
  return (
    <View>
      {matches.map((m, i) => {
        const month = monthOf(m);
        const prev = matches[i - 1];
        const header = !prev || monthOf(prev) !== month;
        return (
          <Fragment key={m.id}>
            {header && (
              <Text
                variant="overline"
                tone="secondary"
                style={{ paddingHorizontal: layout.gutter, marginTop: i === 0 ? 8 : 32, marginBottom: 4 }}
              >
                {MONTHS[month]}
              </Text>
            )}
            {!header && (
              <View style={{ height: 1, backgroundColor: colors.lineHairline, marginLeft: layout.gutter }} />
            )}
            <MatchRow match={m} onPress={() => onPress(m)} trailing={trailing?.(m)} />
          </Fragment>
        );
      })}
    </View>
  );
}

/** Bloco de time do hero: escudo 56 + nome display.m. */
export function TeamBlock({ team, onMedia }: { team: Team; onMedia?: boolean }) {
  return (
    <View style={{ alignItems: 'center', width: 96, gap: 8 }}>
      <Crest team={team} size={56} />
      <Text
        variant="displayM"
        tone={onMedia ? 'onMedia' : 'primary'}
        numberOfLines={1}
        adjustsFontSizeToFit
        align="center"
      >
        {team.shortName}
      </Text>
    </View>
  );
}

/** Placar grande (hero e detalhe): times nas laterais, protagonista no centro. */
export function ScoreBoard({
  match,
  onMedia,
  size = 'hero',
}: {
  match: Match;
  onMedia?: boolean;
  size?: 'hero' | 'xl';
}) {
  const started = match.status !== 'scheduled' && match.status !== 'postponed';
  const tone = onMedia ? 'onMedia' : 'primary';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <TeamBlock team={match.homeTeam} onMedia={onMedia} />
      <View style={{ flex: 1, alignItems: 'center' }}>
        {started && match.score ? (
          <Text
            variant={size === 'hero' ? 'displayHero' : 'displayXl'}
            tone={tone}
            numberOfLines={1}
            adjustsFontSizeToFit
            accessibilityLabel={`Placar ${match.score.home} a ${match.score.away}`}
          >
            {match.score.home}–{match.score.away}
          </Text>
        ) : (
          <Text variant="displayM" tone={tone} style={{ opacity: 0.6 }}>
            ×
          </Text>
        )}
      </View>
      <TeamBlock team={match.awayTeam} onMedia={onMedia} />
    </View>
  );
}

/**
 * Classificação (especificação 12.12): sem fundo colorido; Flamengo com barra
 * vermelha de 3px e nome em vermelho; marcador de zona de 2px.
 */
export function StandingsTable({ table, compact }: { table: Table; compact?: boolean }) {
  const { colors, layout } = useTheme();
  let rows = table.rows;
  if (compact) {
    const idx = rows.findIndex((r) => r.team.id === 'fla');
    const start = Math.max(0, Math.min(idx - 2, rows.length - 5));
    rows = rows.slice(start, start + 5);
  }
  const zoneColor = (z?: string) =>
    z === 'libertadores'
      ? colors.inkPrimary
      : z === 'pre-libertadores'
        ? colors.inkSecondary
        : z === 'sudamericana'
          ? colors.inkTertiary
          : z === 'relegation'
            ? colors.accentText
            : 'transparent';
  const cols = ['J', 'V', 'SG'];
  return (
    <View accessibilityRole="list">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: layout.gutter,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderColor: colors.lineHairline,
        }}
      >
        <Text variant="overline" tone="tertiary" style={{ width: 32 }}>
          #
        </Text>
        <Text variant="overline" tone="tertiary" style={{ flex: 1 }}>
          Time
        </Text>
        {cols.map((h) => (
          <Text key={h} variant="overline" tone="tertiary" style={{ width: 34, textAlign: 'right' }}>
            {h}
          </Text>
        ))}
        <Text variant="overline" tone="tertiary" style={{ width: 40, textAlign: 'right' }}>
          Pts
        </Text>
      </View>
      {rows.map((r) => {
        const fla = r.team.id === 'fla';
        return (
          <View
            key={r.team.id}
            accessible
            accessibilityLabel={`${r.position}º ${r.team.shortName}, ${r.points} pontos`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 48,
              paddingHorizontal: layout.gutter,
              borderBottomWidth: 1,
              borderColor: colors.lineHairline,
            }}
          >
            {fla && (
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 8,
                  bottom: 8,
                  width: 3,
                  backgroundColor: colors.accent,
                }}
              />
            )}
            <View style={{ width: 32, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 2, height: 16, backgroundColor: zoneColor(r.zone) }} />
              <Text variant="numericTable">{r.position}</Text>
            </View>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Crest team={r.team} size={20} />
              <Text
                variant="titleS"
                numberOfLines={1}
                style={{
                  flex: 1,
                  color: fla ? colors.accentText : colors.inkPrimary,
                  fontFamily: fla ? fonts.bold : undefined,
                }}
              >
                {r.team.shortName}
              </Text>
            </View>
            {[r.played, r.won, r.goalsFor - r.goalsAgainst].map((v, i) => (
              <Text key={i} variant="numericTable" tone="secondary" style={{ width: 34, textAlign: 'right' }}>
                {v}
              </Text>
            ))}
            <Text
              variant="numericTable"
              style={{
                width: 40,
                textAlign: 'right',
                fontFamily: fla ? fonts.displayWide110 : fonts.displayNormal700,
              }}
            >
              {r.points}
            </Text>
          </View>
        );
      })}
      {!compact && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
            paddingHorizontal: layout.gutter,
            paddingTop: 12,
          }}
        >
          {[
            ['libertadores', 'Libertadores'],
            ['pre-libertadores', 'Pré-Libertadores'],
            ['sudamericana', 'Sul-Americana'],
            ['relegation', 'Rebaixamento'],
          ].map(([z, l]) => (
            <View key={z} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 2, height: 12, backgroundColor: zoneColor(z) }} />
              <Text variant="bodyS" tone="secondary">
                {l}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
