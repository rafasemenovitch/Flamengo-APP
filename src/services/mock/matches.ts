import { minutesFromNow, demoDate } from '@/data/demo/clock';
import {
  FEATURED_LIVE_MINUTE,
  FEATURED_MATCH_ID,
  FEATURED_SCRIPT,
  FLA_LINEUP,
  MATCH_SEEDS,
  OPPONENT_FORMATION,
  opponentLineup,
  type MatchSeed,
} from '@/data/demo/matches';
import {
  CLUB,
  COMPETITIONS,
  HEAD_COACH,
  OPPONENT_COACHES,
  OPPONENT_NAMES,
  REFEREES,
  SQUAD,
  TEAMS,
  playerById,
} from '@/data/demo/seed';
import { BRASILEIRAO_TABLE, FLA_FORM, GOALS_OVERRIDE, ZONES } from '@/data/demo/standings';
import { FEATURED_HIGHLIGHTS } from '@/data/demo/content';
import {
  CARIOCA_FINALS,
  CARIOCA_TAÇA_GUANABARA,
  COPA_DO_BRASIL_KO,
  LIBERTADORES_GROUPS,
  LIBERTADORES_KO,
  type GroupRowSeed,
  type TieSeed,
} from '@/data/demo/competitions';
import type { MatchesService } from '@/services/adapters';
import type {
  CompetitionId,
  CompetitionOverview,
  KnockoutRound,
  HeadToHead,
  Lineup,
  LineupPlayer,
  Match,
  MatchDetail,
  MatchEvent,
  MatchStat,
  Score,
  StandingRow,
  StandingsTable,
} from '@/types/match';
import { demoScenario, LIVE_SECONDS_PER_MINUTE } from './demoScenario';
import { delay, hash, NotFoundError, structuredCloneSafe } from './utils';

const FULLTIME_ORDER = 94;
const HALFTIME_BREAK_MIN = 15;

function teamsOf(seed: MatchSeed) {
  const opponent = TEAMS[seed.opponentId];
  if (!opponent) throw new NotFoundError('Time', seed.opponentId);
  return seed.isHome ? { home: CLUB, away: opponent } : { home: opponent, away: CLUB };
}

/** Minuto atual do jogo em destaque no cenário ao vivo (avança com o tempo real). */
function featuredLiveOrder() {
  const elapsedSec = (Date.now() - demoScenario.since()) / 1000;
  return Math.min(FULLTIME_ORDER, FEATURED_LIVE_MINUTE + Math.floor(elapsedSec / LIVE_SECONDS_PER_MINUTE));
}

/** Minuto exibido: acréscimos do 1º tempo como 45+x (ordens 46–47) e do 2º como 90+x. */
function formatMinute(order: number) {
  if (order <= 45) return `${order}'`;
  if (order <= 47) return `45+${order - 45}'`;
  if (order <= 90) return `${order}'`;
  return `90+${order - 90}'`;
}

function scoreFromEvents(events: MatchEvent[]): Score {
  const score = { home: 0, away: 0 };
  for (const e of events) {
    if ((e.type === 'goal' || e.type === 'penalty-goal' || e.type === 'own-goal') && e.side) score[e.side]++;
  }
  return score;
}

function featuredState() {
  const scenario = demoScenario.get();
  const seed = MATCH_SEEDS.find((m) => m.id === FEATURED_MATCH_ID)!;
  if (scenario === 'upcoming') {
    return { kickoff: demoDate(seed.dayOffset, seed.time), status: 'scheduled' as const, order: -1 };
  }
  if (scenario === 'matchday') {
    // Arredonda para a próxima meia hora, ~3h à frente: "jogo hoje".
    const d = new Date(minutesFromNow(180));
    d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
    return { kickoff: d.toISOString(), status: 'scheduled' as const, order: -1 };
  }
  if (scenario === 'live') {
    const order = featuredLiveOrder();
    const kickoff = minutesFromNow(-(order + (order > 47 ? HALFTIME_BREAK_MIN : 0)));
    const status = order >= FULLTIME_ORDER ? ('finished' as const) : ('live' as const);
    return { kickoff, status, order };
  }
  return { kickoff: minutesFromNow(-150), status: 'finished' as const, order: FULLTIME_ORDER };
}

function genericEvents(seed: MatchSeed): MatchEvent[] {
  if (!seed.score) return [];
  const flaSide = seed.isHome ? 'home' : 'away';
  const oppSide = seed.isHome ? 'away' : 'home';
  const events: MatchEvent[] = [
    { id: `${seed.id}-ko`, minute: "0'", order: 0, type: 'kickoff', text: 'Começa o jogo.' },
    { id: `${seed.id}-ht`, minute: "45'", order: 46, type: 'halftime', text: 'Fim do primeiro tempo.' },
    { id: `${seed.id}-ft`, minute: "90+3'", order: 93, type: 'fulltime', text: 'Fim de jogo.' },
  ];
  (seed.flaGoals ?? []).forEach(([pid, min, assistId], i) => {
    const pl = playerById(pid);
    const assist = assistId ? playerById(assistId) : undefined;
    events.push({
      id: `${seed.id}-fg${i}`,
      minute: `${min}'`,
      order: min,
      type: 'goal',
      side: flaSide,
      playerName: pl?.shortName,
      secondaryName: assist?.shortName,
      text: `Gol do Flamengo! ${pl?.shortName ?? ''}${assist ? `, assistência de ${assist.shortName}` : ''}.`,
    });
  });
  (seed.oppGoals ?? []).forEach((min, i) => {
    const name = OPPONENT_NAMES[(hash(seed.id) + i) % OPPONENT_NAMES.length]!;
    events.push({
      id: `${seed.id}-og${i}`,
      minute: `${min}'`,
      order: min,
      type: 'goal',
      side: oppSide,
      playerName: name,
      text: `Gol do adversário: ${name}.`,
    });
  });
  const cardMin = 20 + (hash(seed.id) % 50);
  events.push({
    id: `${seed.id}-y1`,
    minute: `${cardMin}'`,
    order: cardMin,
    type: 'yellow',
    side: oppSide,
    playerName: OPPONENT_NAMES[hash(seed.id) % OPPONENT_NAMES.length],
    text: 'Cartão amarelo.',
  });
  return events.sort((a, b) => a.order - b.order);
}

function flaLineup(): Lineup {
  const toLineup = (id: string): LineupPlayer => {
    const pl = playerById(id)!;
    return {
      playerId: pl.id,
      name: pl.shortName,
      number: pl.number,
      position: pl.role,
      isCaptain: id === FLA_LINEUP.captainId,
    };
  };
  return {
    formation: FLA_LINEUP.formation,
    coach: HEAD_COACH,
    starters: FLA_LINEUP.starters.map(toLineup),
    bench: FLA_LINEUP.bench.map(toLineup),
  };
}

function lineupsFor(seed: MatchSeed) {
  const opp = opponentLineup(OPPONENT_NAMES, hash(seed.id) % OPPONENT_NAMES.length);
  const oppLineup: Lineup = {
    formation: OPPONENT_FORMATION,
    coach: OPPONENT_COACHES[seed.opponentId] ?? 'Técnico (demo)',
    ...opp,
  };
  return seed.isHome ? { home: flaLineup(), away: oppLineup } : { home: oppLineup, away: flaLineup() };
}

function statsFor(seed: MatchSeed, score: Score, progress: number): MatchStat[] {
  const h = hash(seed.id);
  const flaPossession = 52 + (h % 12);
  const scale = (n: number) => Math.round(n * progress);
  const dec = (n: number) => Math.round(n * progress * 100) / 100;
  const flaShots = 12 + (h % 8);
  const oppShots = 6 + ((h >>> 3) % 7);
  const flaScore = seed.isHome ? score.home : score.away;
  const oppScore = seed.isHome ? score.away : score.home;
  // Valores do ponto de vista do Flamengo; depois orientados para mandante/visitante.
  const rows: [string, string, MatchStat['group'], number, number, string?][] = [
    ['possession', 'Posse de bola', 'geral', flaPossession, 100 - flaPossession, '%'],
    ['xg', 'Gols esperados (xG)', 'geral', dec(1.4 + (h % 9) / 10), dec(0.5 + ((h >>> 2) % 7) / 10)],
    ['bigChances', 'Grandes chances', 'geral', scale(3 + (h % 3)), scale(1 + ((h >>> 1) % 2))],
    ['shots', 'Finalizações', 'ataque', scale(flaShots), scale(oppShots)],
    [
      'onTarget',
      'No gol',
      'ataque',
      Math.max(flaScore, scale(Math.round(flaShots * 0.42))),
      Math.max(oppScore, scale(Math.round(oppShots * 0.4))),
    ],
    [
      'offTarget',
      'Para fora',
      'ataque',
      scale(Math.round(flaShots * 0.38)),
      scale(Math.round(oppShots * 0.45)),
    ],
    ['corners', 'Escanteios', 'ataque', scale(4 + (h % 5)), scale(2 + ((h >>> 2) % 5))],
    ['offsides', 'Impedimentos', 'ataque', scale(1 + (h % 3)), scale((h >>> 5) % 3)],
    ['passes', 'Passes', 'passes', scale(540 + (h % 60)), scale(380 + ((h >>> 3) % 60))],
    ['passAcc', 'Precisão dos passes', 'passes', 88 + (h % 5), 79 + ((h >>> 2) % 6), '%'],
    ['crosses', 'Cruzamentos', 'passes', scale(14 + (h % 8)), scale(9 + ((h >>> 1) % 6))],
    ['tackles', 'Desarmes', 'defesa', scale(14 + (h % 6)), scale(18 + ((h >>> 3) % 6))],
    ['interceptions', 'Interceptações', 'defesa', scale(7 + (h % 4)), scale(9 + ((h >>> 2) % 5))],
    ['saves', 'Defesas do goleiro', 'defesa', scale(1 + ((h >>> 4) % 3)), scale(3 + (h % 4))],
    ['fouls', 'Faltas', 'disciplina', scale(10 + (h % 6)), scale(12 + ((h >>> 4) % 6))],
    ['yellow', 'Cartões amarelos', 'disciplina', scale(1 + (h % 2)), scale(2 + ((h >>> 3) % 2))],
  ];
  return rows.map(([key, label, group, fla, opp, unit]) => ({
    key,
    label,
    group,
    unit,
    home: seed.isHome ? fla : opp,
    away: seed.isHome ? opp : fla,
  }));
}

/** Médias da temporada (pré-jogo), no estilo dos apps de estatística. */
function previewFor(seed: MatchSeed): NonNullable<MatchDetail['preview']> {
  const h = hash(seed.opponentId);
  const fla: [number, number, number, number, number, number] = [2.1, 0.8, 58, 15.4, 12, 71];
  const opp: [number, number, number, number, number, number] = [
    1.2 + (h % 6) / 10,
    1.0 + ((h >>> 2) % 5) / 10,
    46 + (h % 9),
    10.8 + ((h >>> 1) % 30) / 10,
    5 + (h % 6),
    48 + (h % 18),
  ];
  const defs: [string, string, string?][] = [
    ['goalsFor', 'Gols marcados por jogo'],
    ['goalsAgainst', 'Gols sofridos por jogo'],
    ['possession', 'Posse de bola média', '%'],
    ['shots', 'Finalizações por jogo'],
    ['cleanSheets', 'Jogos sem sofrer gol'],
    ['ppg', 'Aproveitamento', '%'],
  ];
  const stats = defs.map(([key, label, unit], i) => ({
    key,
    label,
    unit,
    home: seed.isHome ? fla[i]! : opp[i]!,
    away: seed.isHome ? opp[i]! : fla[i]!,
  }));
  const flaForm: ('W' | 'D' | 'L')[] = ['W', 'W', 'D', 'W', 'W'];
  const forms: ('W' | 'D' | 'L')[][] = [
    ['W', 'L', 'D', 'W', 'L'],
    ['D', 'W', 'W', 'L', 'D'],
    ['L', 'D', 'W', 'W', 'W'],
  ];
  const oppForm = forms[h % forms.length]!;
  return {
    stats,
    homeForm: seed.isHome ? flaForm : oppForm,
    awayForm: seed.isHome ? oppForm : flaForm,
  };
}

function buildDetail(seed: MatchSeed): MatchDetail {
  const { home, away } = teamsOf(seed);
  const isFeatured = seed.id === FEATURED_MATCH_ID;
  const base = {
    id: seed.id,
    competitionId: seed.competitionId,
    stage: seed.stage,
    homeTeam: home,
    awayTeam: away,
    venue: seed.venue,
    broadcast: seed.broadcast,
    ticketsOnSale: !!seed.ticketsOnSale,
    referee: REFEREES[hash(seed.id) % REFEREES.length],
    isDemo: true,
  };

  if (isFeatured) {
    const st = featuredState();
    const events = FEATURED_SCRIPT.filter((e) => e.order <= st.order).map((e, i) => ({ ...e, id: `f-${i}` }));
    const started = st.status !== 'scheduled';
    const score = started ? scoreFromEvents(events) : undefined;
    return {
      ...base,
      kickoff: st.kickoff,
      status: st.status === 'live' && st.order > 45 && st.order <= 47 ? 'halftime' : st.status,
      score,
      liveMinute: st.status === 'live' ? formatMinute(st.order) : undefined,
      ticketsOnSale: st.status === 'scheduled',
      events: [...events].reverse(),
      lineups: lineupsFor(seed),
      stats: started && score ? statsFor(seed, score, Math.min(1, st.order / FULLTIME_ORDER)) : undefined,
      preview: started ? undefined : previewFor(seed),
      attendance: st.status === 'finished' ? 71_204 : undefined,
      manOfTheMatchPollId: st.status === 'finished' ? 'poll-motm' : undefined,
      highlightsVideoId: st.status === 'finished' ? FEATURED_HIGHLIGHTS.id : undefined,
    };
  }

  const kickoff = demoDate(seed.dayOffset, seed.time);
  const finished = !!seed.score;
  const events = genericEvents(seed);
  return {
    ...base,
    kickoff,
    status: finished ? 'finished' : 'scheduled',
    score: seed.score,
    events: [...events].reverse(),
    lineups: finished || seed.dayOffset <= 2 ? lineupsFor(seed) : undefined,
    stats: finished && seed.score ? statsFor(seed, seed.score, 1) : undefined,
    preview: finished ? undefined : previewFor(seed),
    attendance: seed.attendance,
  };
}

function toSummary(d: MatchDetail): Match {
  const {
    events: _e,
    lineups: _l,
    stats: _s,
    preview: _p,
    referee: _r,
    attendance: _a,
    manOfTheMatchPollId: _m,
    highlightsVideoId: _h,
    ...summary
  } = d;
  return summary;
}

export function allDetails() {
  return MATCH_SEEDS.map(buildDetail).sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}

function computeStandings(): StandingsTable {
  const featuredFinished = featuredState().status === 'finished';
  const rows = BRASILEIRAO_TABLE.map(([teamId, w, d, l]) => {
    let won = w,
      drawn = d,
      lost = l;
    const override = GOALS_OVERRIDE[teamId];
    let goalsFor = override?.[0] ?? Math.round(w * 1.8 + d * 0.9 + l * 0.5);
    let goalsAgainst = override?.[1] ?? Math.round(w * 0.5 + d * 0.9 + l * 1.8);
    let form: ('W' | 'D' | 'L')[] =
      teamId === 'fla'
        ? [...FLA_FORM]
        : (['W', 'D', 'L', 'W', 'D'] as const).map(
            (_, i) => (['W', 'D', 'L'] as const)[(hash(teamId) >> i) % 3]!
          );
    if (featuredFinished && teamId === 'fla') {
      won++;
      goalsFor += 3;
      goalsAgainst += 1;
      form = [...form.slice(1), 'W'];
    }
    if (featuredFinished && teamId === 'pal') {
      lost++;
      goalsFor += 1;
      goalsAgainst += 3;
      form = [...form.slice(1), 'L'];
    }
    return {
      team: TEAMS[teamId]!,
      played: won + drawn + lost,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      points: won * 3 + drawn,
      form,
    };
  });
  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.won - a.won ||
      b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor
  );
  const zoneFor = (pos: number): StandingRow['zone'] => {
    for (const [zone, [from, to]] of Object.entries(ZONES))
      if (pos >= from && pos <= to) return zone as StandingRow['zone'];
    return undefined;
  };
  return {
    competitionId: 'brasileirao',
    title: 'Brasileirão 2026',
    rows: rows.map((r, i) => ({ ...r, position: i + 1, zone: zoneFor(i + 1) })),
    updatedAt: new Date().toISOString(),
  };
}

// ---------- Copas: grupos e chaveamento (simulados) ----------

const TBD = { id: 'tbd', name: 'A definir', shortName: 'A definir', code: '?', color: '#3A3A43', city: '' };

function groupTable(
  title: string,
  rows: GroupRowSeed[],
  zones: (pos: number) => StandingRow['zone']
): StandingsTable {
  const sorted = rows
    .map(([id, w, d, l, gf, ga]) => ({
      team: TEAMS[id] ?? TBD,
      played: w + d + l,
      won: w,
      drawn: d,
      lost: l,
      goalsFor: gf,
      goalsAgainst: ga,
      points: w * 3 + d,
      form: [] as ('W' | 'D' | 'L')[],
    }))
    .sort((a, b) => b.points - a.points || b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst));
  return {
    competitionId: 'libertadores',
    title,
    rows: sorted.map((r, i) => ({ ...r, position: i + 1, zone: zones(i + 1) })),
    updatedAt: new Date().toISOString(),
  };
}

function rounds(seeds: { name: string; ties: TieSeed[] }[], singleLegNames: string[] = []): KnockoutRound[] {
  return seeds.map((r) => ({
    name: r.name,
    ties: r.ties.map(([a, b, first, second], i) => {
      const A = TEAMS[a] ?? TBD;
      const B = TEAMS[b] ?? TBD;
      const single = singleLegNames.some((n) => r.name.startsWith(n));
      // Placares sempre do ponto de vista A × B (home = A, away = B).
      const legs = single
        ? [{ label: 'Jogo único', score: first ? { home: first[0], away: first[1] } : undefined }]
        : [
            { label: 'Ida', score: first ? { home: first[0], away: first[1] } : undefined },
            { label: 'Volta', score: second ? { home: second[0], away: second[1] } : undefined },
          ];
      const aGoals = (first?.[0] ?? 0) + (single ? 0 : (second?.[0] ?? 0));
      const bGoals = (first?.[1] ?? 0) + (single ? 0 : (second?.[1] ?? 0));
      const complete = single ? !!first : !!first && !!second;
      const winnerId = complete ? (aGoals > bGoals ? A.id : bGoals > aGoals ? B.id : A.id) : undefined;
      return {
        id: `${r.name}-${i}`,
        home: A,
        away: B,
        legs,
        aggregate: first ? { home: aGoals, away: bGoals } : undefined,
        penalties: complete && aGoals === bGoals ? { home: 4, away: 3 } : undefined,
        winnerId,
        pending: !complete,
      };
    }),
  }));
}

function overviewFor(id: CompetitionId): CompetitionOverview {
  if (id === 'libertadores') {
    return {
      competitionId: id,
      title: 'CONMEBOL Libertadores 2026',
      phases: [
        {
          key: 'grupos',
          label: 'Fase de grupos',
          kind: 'table',
          tables: LIBERTADORES_GROUPS.map((g) =>
            groupTable(g.name, g.rows, (p) =>
              p <= 2 ? 'libertadores' : p === 3 ? 'sudamericana' : undefined
            )
          ),
          legend: [
            { zone: 'libertadores', label: 'Oitavas de final' },
            { zone: 'sudamericana', label: 'Playoff da Sul-Americana' },
          ],
        },
        {
          key: 'mata-mata',
          label: 'Mata-mata',
          kind: 'knockout',
          rounds: rounds(LIBERTADORES_KO, ['Final']),
        },
      ],
      note: 'Grupos exibidos: o do Flamengo e mais um. Dados simulados.',
    };
  }
  if (id === 'copa-do-brasil') {
    return {
      competitionId: id,
      title: 'Copa do Brasil 2026',
      phases: [{ key: 'mata-mata', label: 'Mata-mata', kind: 'knockout', rounds: rounds(COPA_DO_BRASIL_KO) }],
      note: 'Dados simulados.',
    };
  }
  if (id === 'carioca') {
    return {
      competitionId: id,
      title: 'Campeonato Carioca 2026',
      phases: [
        {
          key: 'tg',
          label: 'Taça Guanabara',
          kind: 'table',
          tables: [
            {
              ...groupTable('Taça Guanabara', CARIOCA_TAÇA_GUANABARA, (p) =>
                p <= 4 ? 'libertadores' : p >= 12 ? 'relegation' : undefined
              ),
              competitionId: 'carioca',
            },
          ],
          legend: [
            { zone: 'libertadores', label: 'Semifinal' },
            { zone: 'relegation', label: 'Rebaixamento' },
          ],
        },
        {
          key: 'final',
          label: 'Fase final',
          kind: 'knockout',
          rounds: rounds(CARIOCA_FINALS, ['Semifinal']),
        },
      ],
      note: 'Flamengo campeão carioca de 2026 (dados simulados).',
    };
  }
  return {
    competitionId: 'brasileirao',
    title: 'Brasileirão 2026',
    phases: [{ key: 'tabela', label: 'Tabela', kind: 'table', tables: [computeStandings()] }],
  };
}

export function createMockMatchesService(): MatchesService {
  return {
    async getFeaturedMatch() {
      return delay(buildDetail(MATCH_SEEDS.find((m) => m.id === FEATURED_MATCH_ID)!));
    },
    async getMatches(filter) {
      let list = allDetails();
      if (filter?.competitionId) list = list.filter((m) => m.competitionId === filter.competitionId);
      if (filter?.when === 'results') list = list.filter((m) => m.status === 'finished').reverse();
      if (filter?.when === 'upcoming') list = list.filter((m) => m.status !== 'finished');
      return delay(list.map(toSummary));
    },
    async getMatch(id) {
      const seed = MATCH_SEEDS.find((m) => m.id === id);
      if (!seed) throw new NotFoundError('Partida', id);
      return delay(buildDetail(seed));
    },
    async getCompetitions() {
      return delay(COMPETITIONS);
    },
    async getStandings(competitionId) {
      if (competitionId !== 'brasileirao') {
        // Competições de mata-mata não têm tabela de pontos corridos no demo.
        return delay({
          competitionId,
          title: 'Sem tabela de classificação',
          rows: [],
          updatedAt: new Date().toISOString(),
        });
      }
      return delay(computeStandings());
    },
    async getCompetitionOverview(id) {
      return delay(overviewFor(id));
    },
    async getHeadToHead(opponentId) {
      const opponent = TEAMS[opponentId];
      if (!opponent) throw new NotFoundError('Time', opponentId);
      const h = hash(opponentId);
      const played = 40 + (h % 80);
      const wins = Math.round(played * (0.42 + (h % 10) / 100));
      const draws = Math.round(played * 0.27);
      const lastMatches = MATCH_SEEDS.filter((m) => m.opponentId === opponentId && m.score).map((m) => ({
        date: demoDate(m.dayOffset, m.time),
        competition: COMPETITIONS.find((c) => c.id === m.competitionId)!.shortName,
        home: m.isHome ? CLUB.shortName : opponent.shortName,
        away: m.isHome ? opponent.shortName : CLUB.shortName,
        score: m.score!,
      }));
      const synthetic = [0, 1, 2].map((i) => ({
        date: demoDate(-120 - i * 150, '16:00'),
        competition: 'Brasileirão',
        home: i % 2 === 0 ? CLUB.shortName : opponent.shortName,
        away: i % 2 === 0 ? opponent.shortName : CLUB.shortName,
        score: { home: (h >>> i) % 3, away: (h >>> (i + 2)) % 3 },
      }));
      const result: HeadToHead = {
        opponent,
        played,
        wins,
        draws,
        losses: played - wins - draws,
        lastMatches: [...lastMatches, ...synthetic].slice(0, 5),
      };
      return delay(result);
    },
    async getSquad() {
      return delay(SQUAD);
    },
    async getPlayer(id) {
      const pl = playerById(id);
      if (!pl) throw new NotFoundError('Jogador', id);
      return delay(pl);
    },
    subscribeToMatch(id, onUpdate) {
      const seed = MATCH_SEEDS.find((m) => m.id === id);
      if (!seed) return () => undefined;
      const emit = () => onUpdate(structuredCloneSafe(buildDetail(seed)));
      // Só o jogo em destaque muda ao vivo no demo.
      const timer = id === FEATURED_MATCH_ID ? setInterval(emit, LIVE_SECONDS_PER_MINUTE * 1000) : undefined;
      const unsubScenario = demoScenario.subscribe(emit);
      return () => {
        if (timer) clearInterval(timer);
        unsubScenario();
      };
    },
  };
}
