import type { CompetitionId, Match } from './match';

/** Palpite do torcedor para um jogo (vale para todos os bolões em que ele está). */
export interface BolaoGuess {
  matchId: string;
  home: number;
  away: number;
  /** Jogador do Flamengo que vai marcar (id do elenco). */
  scorerId?: string;
  /** Jogador do Flamengo que vai dar assistência. */
  assistId?: string;
  /** Coringa: dobra os pontos do jogo. Um por mês. */
  joker?: boolean;
  savedAt: string;
}

/** Como os pontos de um jogo foram calculados. */
export interface BolaoPoints {
  /** 'exact' | 'diff' | 'result' | 'goals' | 'miss' */
  kind: 'exact' | 'diff' | 'result' | 'goals' | 'miss';
  base: number;
  scorer: number;
  assist: number;
  joker: boolean;
  total: number;
}

export interface BolaoMatch {
  match: Match;
  guess?: BolaoGuess;
  /** Palpites fecham no apito inicial. */
  locked: boolean;
  /** Resultado final e pontos (jogos encerrados). */
  points?: BolaoPoints;
  /** Quem marcou e quem deu assistência pelo Flamengo (jogos encerrados). */
  flaScorers?: string[];
  flaAssists?: string[];
  /** Nomes de camisa do artilheiro e do garçom escolhidos. */
  guessNames?: { scorer?: string; assist?: string };
}

export interface BolaoSummary {
  totalPoints: number;
  exactScores: number;
  correctResults: number;
  guessesMade: number;
  /** Jogos abertos ainda sem palpite. */
  pendingGuesses: number;
  jokerAvailable: boolean;
}

export interface BolaoMember {
  id: string;
  name: string;
  points: number;
  exactScores: number;
  /** Variação de posição desde a última rodada (+ subiu, − caiu). */
  movement: number;
  isYou?: boolean;
  isAdmin?: boolean;
  /** Já palpitou no próximo jogo do bolão. */
  guessedNext: boolean;
}

export interface BolaoJoinRequest {
  id: string;
  name: string;
  requestedAt: string;
}

export type BolaoScope = 'todos' | CompetitionId;

export interface BolaoPool {
  id: string;
  name: string;
  code: string;
  adminName: string;
  isAdmin: boolean;
  scope: BolaoScope;
  requireApproval: boolean;
  createdAt: string;
  /** Ordenados por pontos (posição = índice + 1). */
  members: BolaoMember[];
  /** Pedidos de entrada (só o administrador vê). */
  requests: BolaoJoinRequest[];
  /** 'member' = participa; 'pending' = pediu para entrar e aguarda aprovação. */
  status: 'member' | 'pending';
}

/** Prévia de um bolão encontrado pelo código (antes de pedir para entrar). */
export interface BolaoPreview {
  code: string;
  name: string;
  adminName: string;
  memberCount: number;
  scope: BolaoScope;
  requireApproval: boolean;
  alreadyIn: boolean;
}

/** Palpite de um membro num jogo (aparece depois que o jogo começa). */
export interface BolaoMemberGuess {
  memberId: string;
  name: string;
  isYou?: boolean;
  guess?: { home: number; away: number; scorer?: string };
  points?: number;
}

/** Palpites especiais da temporada (respondidos uma vez, fecham numa data). */
export interface BolaoSeasonPick {
  id: string;
  question: string;
  points: number;
  locksAt: string;
  options: { id: string; label: string }[];
  choiceId?: string;
}

export interface BolaoCreateInput {
  name: string;
  scope: BolaoScope;
  requireApproval: boolean;
}
