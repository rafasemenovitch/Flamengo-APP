/** Base do Quem é o Cria? Critérios e fontes: src/data/cria/SOURCES.md. */

export type CriaPosition = 'Goleiro' | 'Zagueiro' | 'Lateral' | 'Volante' | 'Meia' | 'Atacante';

export type CriaAttribute = 'position' | 'nationality' | 'arrivalYear' | 'goals' | 'matches' | 'titles';

/**
 * - `confirmado`: duas fontes independentes dão o mesmo valor.
 * - `fonte_unica`: uma fonte só (ou fontes que copiam a mesma origem).
 * - `pendente`: sem valor confiável; o jogador entra para chute, nunca como resposta.
 */
export type CriaConfidence = 'confirmado' | 'fonte_unica' | 'pendente';

export interface CriaEvidence {
  /** Ids de `CRIA_SOURCES`. */
  sources: string[];
  confidence: CriaConfidence;
  /** Outras fontes que dão um valor até 3% diferente (só para jogos e gols). */
  closeTo?: string[];
  /** Divergência ou observação curta; o detalhe vai no SOURCES.md. */
  note?: string;
}

export interface CriaPlayer {
  id: string;
  /** Como a torcida chama: "Zico", "Gabigol". */
  name: string;
  /** Nome completo, apelidos e grafias alternativas, para a busca. */
  aliases: string[];
  /** Preparado para imagem licenciada; por enquanto sempre null. */
  photo: null;
  position: CriaPosition;
  /** ISO 3166-1 alfa-3 da nacionalidade esportiva (a seleção que defendeu ou poderia defender). */
  nationality: string;
  /** Ano do primeiro jogo pelo time profissional do Flamengo. */
  arrivalYear: number;
  goals: number;
  matches: number;
  /** Ids de `CRIA_TITLES` em que o jogador foi campeão pelo clube. */
  titles: string[];
  spells: { from: number; to: number | null }[];
  stats: Record<CriaAttribute, CriaEvidence>;
  /** Data (AAAA-MM-DD) da conferência dos números. */
  updatedAt: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  /** Pode ser o jogador secreto (regra em SOURCES.md, conferida em teste). */
  eligible: boolean;
  /** Ainda no elenco: números mudam e são congelados por desafio. */
  active?: boolean;
}

export interface CriaSource {
  id: string;
  label: string;
  url: string;
}
