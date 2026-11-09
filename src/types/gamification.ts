export interface FanLevel {
  level: number;
  name: string;
  minPoints: number;
}

export interface FanProgress {
  points: number;
  level: FanLevel;
  nextLevel?: FanLevel;
  /**
   * "Pé quente": vitórias seguidas do Flamengo nos jogos em que o torcedor
   * esteve no estádio (calculado a partir do Passaporte).
   */
  luckyStreak: number;
  bestLuckyStreak: number;
  /** Pé quente dos amigos, para comparação. */
  luckyFriends: { name: string; streak: number }[];
  weeklyPoints: number;
  /** A pontuação é da temporada: zera todo 1º de janeiro. */
  season: { year: number; endsAt: string };
  /** Próximo prêmio da trilha ainda não alcançado. */
  nextReward?: TrailReward;
}

/** De onde vêm os pontos da temporada. */
export type PointsSource =
  'bolao' | 'quiz' | 'enquete' | 'presenca' | 'pe-quente' | 'conquista' | 'socio' | 'loja';

/** Lançamento no extrato de pontos. */
export interface PointsEntry {
  id: string;
  source: PointsSource;
  label: string;
  points: number;
  date: string;
}

/** Regra de pontuação (tela "Como ganhar"). */
export interface PointsRule {
  id: string;
  group: 'jogo' | 'estadio' | 'dia' | 'torcedor';
  title: string;
  detail?: string;
  /** Texto do valor, ex.: "10", "60 · 80 · 100". */
  points: string;
}

/** Prêmio da trilha da temporada (estilo "trilha de recompensas"). */
export interface TrailReward {
  id: string;
  /** Pontos da temporada para liberar. */
  points: number;
  title: string;
  detail: string;
  kind: 'desconto' | 'digital' | 'sorteio' | 'experiencia' | 'socio';
  icon: string;
  /** Só para sócios-torcedores. */
  membersOnly?: boolean;
  /** Código do cupom depois de resgatado. */
  claimedCode?: string;
  claimedAt?: string;
}

export type MedalGroup =
  'presenca' | 'estrada' | 'palpites' | 'conhecimento' | 'comunidade' | 'manto' | 'socio' | 'especiais';

export interface Medal {
  id: string;
  name: string;
  description: string;
  group: MedalGroup;
  tier: 'bronze' | 'silver' | 'gold';
  icon: string;
  unlockedAt?: string;
  /** Progresso 0–1 quando ainda bloqueada. */
  progress?: number;
}

export interface RankingEntry {
  position: number;
  fanName: string;
  city: string;
  points: number;
  isCurrentUser?: boolean;
}

export type RankingScope = 'brasil' | 'estado' | 'amigos';

export interface Prediction {
  matchId: string;
  home: number;
  away: number;
  submittedAt: string;
  /** Preenchido após o jogo. */
  pointsAwarded?: number;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  closesAt: string;
  userVoteId?: string;
  kind: 'enquete' | 'craque-do-jogo';
}

export interface Quiz {
  id: string;
  question: string;
  options: { id: string; label: string }[];
  points: number;
  /** Só revelado após responder. */
  answered?: { optionId: string; correct: boolean; correctOptionId: string; explanation: string };
}

export interface PredictionPool {
  id: string;
  name: string;
  members: number;
  userPosition: number;
  userPoints: number;
  /** Próximo jogo do bolão. */
  nextMatchLabel: string;
  /** Topo do ranking do bolão (inclui o torcedor). */
  leaderboard: { name: string; points: number; exactScores: number; isYou?: boolean }[];
}

export interface PassportStamp {
  id: string;
  matchId: string;
  label: string;
  date: string;
  venue: string;
  result: 'Vitória' | 'Empate' | 'Derrota';
  /** Ex.: "Brasileirão". */
  competition: string;
  /** Placar do ponto de vista do Flamengo, ex.: "2 × 1". */
  score: string;
  opponent: string;
}

export interface CommunityGroup {
  id: string;
  name: string;
  region: string;
  members: number;
  description: string;
  joined: boolean;
  nextMeetup?: string;
  /** Grupo reconhecido pelo clube (consulados, embaixadas). */
  verified?: boolean;
  /** Grupo fechado entre amigos. */
  private?: boolean;
  /** Quem publica os avisos da comunidade (os demais acompanham). */
  host?: string;
  /** Caravana organizada pelo grupo para um jogo. */
  caravan?: { match: string; departure: string; date: string; seatsLeft: number; price: number };
}
