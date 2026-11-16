export type PlayerPosition = 'Goleiro' | 'Lateral' | 'Zagueiro' | 'Volante' | 'Meia' | 'Atacante';

export interface PlayerSeasonStats {
  matches: number;
  goals: number;
  assists: number;
  minutes: number;
  yellowCards: number;
  redCards: number;
  /** Só para goleiros. */
  cleanSheets?: number;
}

export interface Player {
  id: string;
  /** Id na API-Football (foto e perfil vêm do Supabase por ele). */
  apiId?: number;
  name: string;
  /** Nome de camisa. */
  shortName: string;
  number: number;
  position: PlayerPosition;
  /** Detalhe da função, ex.: "Ponta-esquerda". */
  role: string;
  birthDate: string;
  nationality: string;
  heightCm: number;
  /** Sem dado (jogador vindo só da API): a linha some do perfil. */
  preferredFoot?: 'Direito' | 'Esquerdo' | 'Ambos';
  joinedYear?: number;
  imageKey: string;
  season: PlayerSeasonStats;
  bio: string;
}
