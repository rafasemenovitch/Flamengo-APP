import type { CriaAttribute, CriaPlayer, CriaPosition } from '@/data/cria/types';

/**
 * Regras de comparação do Quem é o Cria? (src/data/cria/SOURCES.md e plano, seção 4).
 *
 * - Verde (`exact`): valor igual ao do secreto.
 * - Amarelo (`close`): número perto do secreto, dentro da tolerância do atributo.
 * - Cinza (`far`): diferente ou longe.
 * - Seta: `up` se o secreto tem valor MAIOR que o palpite, `down` se menor; só em número.
 *
 * As tolerâncias são calculadas sobre o valor do SECRETO: a faixa é a mesma para todo
 * palpite do dia. O piso fixo protege quem tem números baixos; a porcentagem, os artilheiros.
 */

/** O que é comparado: congelado no início da partida para nenhuma atualização mudar pistas. */
export interface CriaAttributes {
  position: CriaPosition;
  nationality: string;
  arrivalYear: number;
  goals: number;
  matches: number;
  titles: number;
}

export type ClueStatus = 'exact' | 'close' | 'far';
export type ClueArrow = 'up' | 'down' | null;

export interface Clue {
  attr: CriaAttribute;
  status: ClueStatus;
  arrow: ClueArrow;
  /** Valor do PALPITE, que é o que aparece na célula. */
  value: string | number;
}

export const toAttributes = (p: CriaPlayer): CriaAttributes => ({
  position: p.position,
  nationality: p.nationality,
  arrivalYear: p.arrivalYear,
  goals: p.goals,
  matches: p.matches,
  titles: p.titles.length,
});

/** Diferença máxima (inclusive) que ainda é amarelo, dado o valor do secreto. */
export const TOLERANCE = {
  arrivalYear: () => 2,
  goals: (secret: number) => Math.max(5, Math.floor(secret * 0.15)),
  matches: (secret: number) => Math.max(20, Math.floor(secret * 0.15)),
  titles: () => 2,
} as const;

/** Textos das regras (modal de regras e leitor de tela). */
export const RULES_TEXT: Record<CriaAttribute, string> = {
  position: 'Verde se for a mesma posição.',
  nationality: 'Verde se for o mesmo país.',
  arrivalYear: 'Ano do primeiro jogo pelo Flamengo. Amarelo até 2 anos de diferença.',
  goals: 'Todos os jogos, com amistosos. Amarelo até 5 gols ou 15% do secreto, o que for maior.',
  matches: 'Todos os jogos, com amistosos. Amarelo até 20 jogos ou 15% do secreto, o que for maior.',
  titles: 'Títulos oficiais com o Flamengo. Amarelo até 2 de diferença.',
};

export const ATTRIBUTE_ORDER: CriaAttribute[] = [
  'position',
  'nationality',
  'arrivalYear',
  'goals',
  'matches',
  'titles',
];

function numeric(attr: 'arrivalYear' | 'goals' | 'matches' | 'titles', guess: number, secret: number): Clue {
  const diff = secret - guess;
  const arrow: ClueArrow = diff > 0 ? 'up' : diff < 0 ? 'down' : null;
  const status: ClueStatus =
    diff === 0 ? 'exact' : Math.abs(diff) <= TOLERANCE[attr](secret) ? 'close' : 'far';
  return { attr, status, arrow, value: guess };
}

/** As seis pistas de um palpite, na ordem da grade. */
export function compare(guess: CriaAttributes, secret: CriaAttributes): Clue[] {
  return [
    {
      attr: 'position',
      status: guess.position === secret.position ? 'exact' : 'far',
      arrow: null,
      value: guess.position,
    },
    {
      attr: 'nationality',
      status: guess.nationality === secret.nationality ? 'exact' : 'far',
      arrow: null,
      value: guess.nationality,
    },
    numeric('arrivalYear', guess.arrivalYear, secret.arrivalYear),
    numeric('goals', guess.goals, secret.goals),
    numeric('matches', guess.matches, secret.matches),
    numeric('titles', guess.titles, secret.titles),
  ];
}

export const isWin = (clues: Clue[]) => clues.every((c) => c.status === 'exact');

const LABEL: Record<CriaAttribute, string> = {
  position: 'Posição',
  nationality: 'País',
  arrivalYear: 'Chegada',
  goals: 'Gols',
  matches: 'Jogos',
  titles: 'Títulos',
};

const ARROW_SPEECH: Record<CriaAttribute, { up: string; down: string }> = {
  position: { up: '', down: '' },
  nationality: { up: '', down: '' },
  arrivalYear: { up: 'o secreto chegou depois', down: 'o secreto chegou antes' },
  goals: { up: 'o secreto marcou mais', down: 'o secreto marcou menos' },
  matches: { up: 'o secreto jogou mais', down: 'o secreto jogou menos' },
  titles: { up: 'o secreto ganhou mais', down: 'o secreto ganhou menos' },
};

const STATUS_SPEECH: Record<ClueStatus, string> = { exact: 'igual', close: 'perto', far: 'diferente' };

/** "Gols: 103, perto, o secreto marcou menos". Para o leitor de tela. */
export function clueSpeech(c: Clue, displayValue: string = String(c.value)) {
  const status = c.status === 'far' && c.arrow ? 'longe' : STATUS_SPEECH[c.status];
  const parts = [`${LABEL[c.attr]}: ${displayValue}`, status];
  if (c.arrow) parts.push(ARROW_SPEECH[c.attr][c.arrow]);
  return parts.join(', ');
}

export const ATTRIBUTE_LABEL = LABEL;
