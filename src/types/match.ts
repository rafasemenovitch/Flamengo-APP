export type CompetitionId = 'brasileirao' | 'libertadores' | 'copa-do-brasil' | 'carioca';

export interface Competition {
  id: CompetitionId;
  name: string;
  shortName: string;
  season: string;
  /** Formato da competição (pontos corridos ou mata-mata), usado para decidir se há tabela. */
  format: 'league' | 'knockout' | 'groups+knockout';
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  /** Sigla de 3 letras. */
  code: string;
  /** Cor principal (placeholder de escudo). */
  color: string;
  city: string;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
}

export type MatchStatus = 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed';

export interface Score {
  home: number;
  away: number;
}

export type MatchEventType =
  | 'goal'
  | 'own-goal'
  | 'penalty-goal'
  | 'yellow'
  | 'red'
  | 'substitution'
  | 'var'
  | 'kickoff'
  | 'halftime'
  | 'fulltime'
  | 'commentary';

export interface MatchEvent {
  id: string;
  /** Minuto exibido, ex.: "45+2'". */
  minute: string;
  /** Minuto numérico para ordenação. */
  order: number;
  type: MatchEventType;
  side?: 'home' | 'away';
  playerName?: string;
  /** Assistência (gol) ou jogador que sai (substituição). */
  secondaryName?: string;
  text: string;
}

export interface LineupPlayer {
  playerId?: string;
  name: string;
  number: number;
  position: string;
  isCaptain?: boolean;
}

export interface Lineup {
  formation: string;
  coach: string;
  starters: LineupPlayer[];
  bench: LineupPlayer[];
}

export interface MatchStat {
  key: string;
  label: string;
  home: number;
  away: number;
  /** Ex.: '%' para posse de bola. */
  unit?: string;
}

export interface Match {
  id: string;
  competitionId: CompetitionId;
  /** Ex.: "33ª rodada", "Semifinal · Volta". */
  stage: string;
  homeTeam: Team;
  awayTeam: Team;
  /** ISO 8601. */
  kickoff: string;
  venue: Venue;
  status: MatchStatus;
  score?: Score;
  /** Minuto atual quando ao vivo, ex.: "67'". */
  liveMinute?: string;
  broadcast?: string[];
  ticketsOnSale: boolean;
  /** Placar/estado vem de simulação local. */
  isDemo: boolean;
}

export interface MatchDetail extends Match {
  events: MatchEvent[];
  lineups?: { home: Lineup; away: Lineup };
  stats?: MatchStat[];
  referee?: string;
  attendance?: number;
  /** Enquete de craque do jogo (pós-jogo). */
  manOfTheMatchPollId?: string;
  highlightsVideoId?: string;
}

export interface StandingRow {
  position: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  /** Últimos 5 jogos, mais recente por último. */
  form: ('W' | 'D' | 'L')[];
  zone?: 'libertadores' | 'pre-libertadores' | 'sudamericana' | 'relegation';
}

export interface StandingsTable {
  competitionId: CompetitionId;
  title: string;
  rows: StandingRow[];
  updatedAt: string;
}

export interface HeadToHead {
  opponent: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  lastMatches: { date: string; competition: string; home: string; away: string; score: Score }[];
}

export interface MatchFilter {
  competitionId?: CompetitionId;
  /** upcoming = agendados/ao vivo; results = encerrados. */
  when?: 'upcoming' | 'results';
}
