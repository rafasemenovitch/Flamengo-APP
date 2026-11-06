export interface FanLevel {
  level: number;
  name: string;
  minPoints: number;
}

export interface FanProgress {
  points: number;
  level: FanLevel;
  nextLevel?: FanLevel;
  /** Jogos seguidos com presença registrada (estádio ou check-in). */
  attendanceStreak: number;
  weeklyPoints: number;
}

export type MedalGroup = 'presenca' | 'palpites' | 'conhecimento' | 'comunidade' | 'especiais';

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

export type RankingScope = 'geral' | 'semanal' | 'estado' | 'amigos';

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
}

export interface PassportStamp {
  id: string;
  matchId: string;
  label: string;
  date: string;
  venue: string;
  result: string;
}

export interface CommunityGroup {
  id: string;
  name: string;
  region: string;
  members: number;
  description: string;
  joined: boolean;
  nextMeetup?: string;
}
