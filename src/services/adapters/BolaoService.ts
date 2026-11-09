import type {
  BolaoCreateInput,
  BolaoGuess,
  BolaoMatch,
  BolaoMemberGuess,
  BolaoPool,
  BolaoPreview,
  BolaoSeasonPick,
  BolaoSummary,
} from '@/types/bolao';

/**
 * Bolão da Nação: palpites (placar, artilheiro, garçom, coringa), bolões entre
 * amigos com convite por código e aprovação do administrador. Só pontos, sem dinheiro.
 */
export interface BolaoService {
  getSummary(): Promise<BolaoSummary>;
  /** Jogos do Flamengo: abertos (próximos) e encerrados, com o palpite do torcedor. */
  getMatches(): Promise<{ open: BolaoMatch[]; closed: BolaoMatch[] }>;
  getMatch(matchId: string): Promise<BolaoMatch>;
  saveGuess(guess: Omit<BolaoGuess, 'savedAt'>): Promise<BolaoGuess>;
  /** Coringa já usado em outro jogo do mesmo mês? */
  jokerUsedElsewhere(matchId: string): Promise<boolean>;

  getSeasonPicks(): Promise<BolaoSeasonPick[]>;
  saveSeasonPick(pickId: string, optionId: string): Promise<BolaoSeasonPick>;

  getMyPools(): Promise<BolaoPool[]>;
  getPool(poolId: string): Promise<BolaoPool>;
  createPool(input: BolaoCreateInput): Promise<BolaoPool>;
  findPool(code: string): Promise<BolaoPreview | null>;
  requestJoin(code: string): Promise<BolaoPool>;
  answerRequest(poolId: string, requestId: string, approve: boolean): Promise<BolaoPool>;
  leavePool(poolId: string): Promise<void>;
  /** Palpites dos membros num jogo (escondidos até o apito inicial). */
  getPoolGuesses(poolId: string, matchId: string): Promise<BolaoMemberGuess[]>;
}
