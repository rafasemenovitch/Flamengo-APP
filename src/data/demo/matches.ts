import type { CompetitionId, LineupPlayer, MatchEvent, Venue } from '@/types/match';
import { BROADCASTERS, VENUES } from './seed';

export interface MatchSeed {
  id: string;
  competitionId: CompetitionId;
  stage: string;
  opponentId: string;
  /** Flamengo é mandante? */
  isHome: boolean;
  dayOffset: number;
  time: string;
  venue: Venue;
  /** Placar final (jogos encerrados), do ponto de vista mandante × visitante. */
  score?: { home: number; away: number };
  /** Gols do Flamengo: [playerId, minuto, assistência?]. */
  flaGoals?: [string, number, string?][];
  /** Minutos dos gols do adversário. */
  oppGoals?: number[];
  ticketsOnSale?: boolean;
  broadcast?: string[];
  attendance?: number;
}

/** Id do jogo em destaque — o estado dele (pré/ao vivo/pós) vem do cenário demo. */
export const FEATURED_MATCH_ID = 'm-bra-33';

export const MATCH_SEEDS: MatchSeed[] = [
  // ---------- Resultados ----------
  {
    id: 'm-bra-29',
    competitionId: 'brasileirao',
    stage: '29ª rodada',
    opponentId: 'bah',
    isHome: true,
    dayOffset: -25,
    time: '16:00',
    venue: VENUES.maracana,
    score: { home: 3, away: 0 },
    flaGoals: [
      ['p09', 18, 'p10'],
      ['p07', 51],
      ['p09', 77, 'p11'],
    ],
    oppGoals: [],
    attendance: 61234,
  },
  {
    id: 'm-lib-sf1',
    competitionId: 'libertadores',
    stage: 'Semifinal · Ida',
    opponentId: 'rac',
    isHome: false,
    dayOffset: -21,
    time: '21:30',
    venue: VENUES.cilindro,
    score: { home: 0, away: 1 },
    flaGoals: [['p10', 63, 'p18']],
    oppGoals: [],
  },
  {
    id: 'm-bra-30',
    competitionId: 'brasileirao',
    stage: '30ª rodada',
    opponentId: 'cor',
    isHome: false,
    dayOffset: -18,
    time: '18:30',
    venue: VENUES.neoQuimica,
    score: { home: 1, away: 1 },
    flaGoals: [['p11', 70]],
    oppGoals: [34],
  },
  {
    id: 'm-lib-sf2',
    competitionId: 'libertadores',
    stage: 'Semifinal · Volta',
    opponentId: 'rac',
    isHome: true,
    dayOffset: -14,
    time: '21:30',
    venue: VENUES.maracana,
    score: { home: 2, away: 1 },
    flaGoals: [
      ['p09', 22, 'p06'],
      ['p07', 81, 'p10'],
    ],
    oppGoals: [56],
    attendance: 68420,
  },
  {
    id: 'm-bra-31',
    competitionId: 'brasileirao',
    stage: '31ª rodada',
    opponentId: 'for',
    isHome: true,
    dayOffset: -11,
    time: '19:00',
    venue: VENUES.maracana,
    score: { home: 2, away: 0 },
    flaGoals: [
      ['p03', 29, 'p10'],
      ['p19', 88],
    ],
    oppGoals: [],
    attendance: 52880,
  },
  {
    id: 'm-cdb-sf1',
    competitionId: 'copa-do-brasil',
    stage: 'Semifinal · Ida',
    opponentId: 'cru',
    isHome: false,
    dayOffset: -7,
    time: '21:30',
    venue: VENUES.mineirao,
    score: { home: 1, away: 1 },
    flaGoals: [['p09', 44, 'p02']],
    oppGoals: [12],
  },
  {
    id: 'm-bra-32',
    competitionId: 'brasileirao',
    stage: '32ª rodada',
    opponentId: 'gre',
    isHome: false,
    dayOffset: -3,
    time: '16:00',
    venue: VENUES.arenaGremio,
    score: { home: 1, away: 2 },
    flaGoals: [
      ['p10', 38],
      ['p17', 86, 'p20'],
    ],
    oppGoals: [61],
  },

  // ---------- Próximos (o primeiro é o jogo em destaque) ----------
  {
    id: FEATURED_MATCH_ID,
    competitionId: 'brasileirao',
    stage: '33ª rodada',
    opponentId: 'pal',
    isHome: true,
    dayOffset: 2,
    time: '21:30',
    venue: VENUES.maracana,
    ticketsOnSale: true,
    broadcast: [BROADCASTERS[0]!, BROADCASTERS[2]!],
  },
  {
    id: 'm-cdb-sf2',
    competitionId: 'copa-do-brasil',
    stage: 'Semifinal · Volta',
    opponentId: 'cru',
    isHome: true,
    dayOffset: 6,
    time: '21:30',
    venue: VENUES.maracana,
    ticketsOnSale: true,
    broadcast: [BROADCASTERS[0]!, BROADCASTERS[1]!],
  },
  {
    id: 'm-bra-34',
    competitionId: 'brasileirao',
    stage: '34ª rodada',
    opponentId: 'vas',
    isHome: false,
    dayOffset: 10,
    time: '18:30',
    venue: VENUES.maracana,
    ticketsOnSale: true,
    broadcast: [BROADCASTERS[2]!],
  },
  {
    id: 'm-bra-35',
    competitionId: 'brasileirao',
    stage: '35ª rodada',
    opponentId: 'bot',
    isHome: true,
    dayOffset: 16,
    time: '16:00',
    venue: VENUES.maracana,
    ticketsOnSale: false,
    broadcast: [BROADCASTERS[0]!],
  },
  {
    id: 'm-bra-36',
    competitionId: 'brasileirao',
    stage: '36ª rodada',
    opponentId: 'sao',
    isHome: false,
    dayOffset: 20,
    time: '20:00',
    venue: VENUES.morumbis,
    broadcast: [BROADCASTERS[1]!],
  },
  {
    id: 'm-lib-final',
    competitionId: 'libertadores',
    stage: 'Final',
    opponentId: 'nac',
    isHome: false,
    dayOffset: 23,
    time: '17:00',
    venue: VENUES.centenario,
    broadcast: [BROADCASTERS[0]!, BROADCASTERS[1]!],
  },
];

/** Escalação padrão do Flamengo (4-3-3). */
export const FLA_LINEUP = {
  formation: '4-3-3',
  starters: ['p01', 'p02', 'p03', 'p04', 'p06', 'p05', 'p08', 'p10', 'p11', 'p09', 'p07'],
  bench: ['p25', 'p13', 'p15', 'p29', 'p18', 'p20', 'p17', 'p19', 'p27'],
  captainId: 'p10',
};

export const OPPONENT_FORMATION = '4-2-3-1';
export const OPPONENT_POSITIONS = ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'VOL', 'VOL', 'MEI', 'PD', 'PE', 'CA'];
export const OPPONENT_BENCH_POSITIONS = ['GOL', 'ZAG', 'LD', 'VOL', 'MEI', 'ATA', 'ATA'];

/**
 * Roteiro do jogo em destaque (Flamengo × Palmeiras). O cenário demo decide
 * até que minuto ele "já aconteceu": ao vivo = até 67', pós-jogo = completo.
 */
export const FEATURED_SCRIPT: Omit<MatchEvent, 'id'>[] = [
  { minute: "0'", order: 0, type: 'kickoff', text: 'Bola rolando no Maracanã!' },
  {
    minute: "6'",
    order: 6,
    type: 'commentary',
    text: 'Arantes arrisca de fora da área, a bola passa perto do ângulo.',
  },
  {
    minute: "12'",
    order: 12,
    type: 'goal',
    side: 'home',
    playerName: 'Vasconcelos',
    secondaryName: 'Arantes',
    text: 'GOL DO FLAMENGO! Arantes cruza na medida e Vasconcelos sobe mais que todo mundo.',
  },
  {
    minute: "27'",
    order: 27,
    type: 'yellow',
    side: 'away',
    playerName: 'Danilo Prates',
    text: 'Cartão amarelo por falta dura em Everton.',
  },
  {
    minute: "38'",
    order: 38,
    type: 'goal',
    side: 'away',
    playerName: 'Leandro Viana',
    text: 'Gol do adversário. Contra-ataque rápido e finalização cruzada.',
  },
  { minute: "45+2'", order: 47, type: 'halftime', text: 'Fim do primeiro tempo: 1 a 1.' },
  { minute: "48'", order: 48, type: 'commentary', text: 'Segundo tempo começa com o Flamengo pressionando.' },
  {
    minute: "54'",
    order: 54,
    type: 'goal',
    side: 'home',
    playerName: 'Bruno Siqueira',
    secondaryName: 'Everton',
    text: 'GOL DO FLAMENGO! Everton invade a área e rola para Bruno Siqueira empurrar.',
  },
  {
    minute: "61'",
    order: 61,
    type: 'substitution',
    side: 'home',
    playerName: 'Ferreyra',
    secondaryName: 'Tavares',
    text: 'Entra Ferreyra, sai Tavares.',
  },
  {
    minute: "64'",
    order: 64,
    type: 'yellow',
    side: 'home',
    playerName: 'Pacheco',
    text: 'Amarelo para Pacheco, que para o contra-ataque.',
  },
  {
    minute: "66'",
    order: 66,
    type: 'commentary',
    text: 'Pressão alta do Flamengo; Maracanã empurra o time.',
  },
  {
    minute: "74'",
    order: 74,
    type: 'substitution',
    side: 'home',
    playerName: 'Olivera',
    secondaryName: 'Vasconcelos',
    text: 'Entra Olivera, sai Vasconcelos, aplaudido de pé.',
  },
  {
    minute: "79'",
    order: 79,
    type: 'var',
    text: 'VAR checa possível pênalti no Everton. Lance revisado: segue o jogo.',
  },
  {
    minute: "83'",
    order: 83,
    type: 'goal',
    side: 'home',
    playerName: 'Olivera',
    secondaryName: 'Ferreyra',
    text: 'GOL DO FLAMENGO! Ferreyra enfia, Olivera tira do goleiro. 3 a 1!',
  },
  {
    minute: "90+4'",
    order: 94,
    type: 'fulltime',
    text: 'Fim de jogo! Flamengo 3 × 1 e liderança do Brasileirão.',
  },
];

/** Minuto em que o cenário "ao vivo" está congelado. */
export const FEATURED_LIVE_MINUTE = 67;

export function opponentLineup(
  names: string[],
  offset: number
): { starters: LineupPlayer[]; bench: LineupPlayer[] } {
  const pick = (i: number) => names[(i + offset) % names.length]!;
  return {
    starters: OPPONENT_POSITIONS.map((pos, i) => ({
      name: pick(i),
      number: i + 1,
      position: pos,
      isCaptain: i === 5,
    })),
    bench: OPPONENT_BENCH_POSITIONS.map((pos, i) => ({
      name: pick(i + 11),
      number: 12 + i * 3,
      position: pos,
    })),
  };
}
