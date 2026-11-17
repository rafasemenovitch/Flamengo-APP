import type { Clue } from '@/features/cria/compare';

/**
 * Jogo diário Quem é o Cria?.
 *
 * Hoje: `LocalDailyGameAdapter` (src/services/mock/dailyGame.ts), com a agenda no app e o
 * progresso no aparelho. Depois: `SupabaseDailyGameAdapter`, em que o servidor escolhe o
 * secreto, compara cada palpite e só devolve o secreto quando a partida acaba. Por isso a
 * UI nunca recebe o secreto antes do fim: só as linhas já comparadas.
 */

/** Uma linha da grade, já comparada (congelada: não muda se a base for atualizada). */
export interface CriaRow {
  playerId: string;
  name: string;
  period: string;
  clues: Clue[];
}

export type CriaGameStatus = 'jogando' | 'venceu' | 'perdeu';

export interface CriaGame {
  /** Dia do desafio (AAAA-MM-DD, Brasília). */
  date: string;
  /** Número do desafio (#1 no lançamento). */
  number: number;
  rows: CriaRow[];
  status: CriaGameStatus;
  /** O secreto, como linha toda verde: só existe quando a partida acabou. */
  secret?: CriaRow;
}

export interface DailyGameService {
  /** Dia do desafio de agora (respeita o "avançar dia" da demonstração). */
  today(): Promise<string>;
  /** A partida de um dia: começa (e congela o secreto) se ainda não existir. */
  getGame(date: string): Promise<CriaGame>;
  /** Registra um palpite. Palpite repetido ou partida encerrada: devolve a partida sem mudar. */
  guess(date: string, playerId: string): Promise<CriaGame>;
  /** Controles escondidos da demonstração. */
  demo: {
    nextDay(): Promise<void>;
    /** Volta ao dia de verdade. */
    realDay(): Promise<void>;
    resetToday(): Promise<void>;
    /** Escolhe o secreto de hoje (e recomeça a partida). */
    setSecret(playerId: string): Promise<void>;
  };
}
