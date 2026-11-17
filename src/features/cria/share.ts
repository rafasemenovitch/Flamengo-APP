import type { CriaGame } from '@/services/adapters/DailyGameService';

import { MAX_GUESSES } from './constants';
import type { ClueStatus } from './compare';

/**
 * Resultado para compartilhar, no formato dos jogos de palavra: um quadrado por pista,
 * uma linha por palpite, sem nenhum nome. Os quadrados coloridos são a única exceção à
 * regra "sem emoji" do app: é o formato que todo mundo reconhece nos grupos.
 */

const SQUARES: Record<'normal' | 'contraste', Record<ClueStatus, string>> = {
  normal: { exact: '🟩', close: '🟨', far: '⬛' },
  // alto contraste: laranja e azul, como no modo daltônico do Wordle
  contraste: { exact: '🟧', close: '🟦', far: '⬛' },
};

export function shareText(game: CriaGame, mode: 'normal' | 'contraste' = 'normal') {
  const score = game.status === 'venceu' ? `${game.rows.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  const grid = game.rows.map((r) => r.clues.map((c) => SQUARES[mode][c.status]).join('')).join('\n');
  return `Quem é o Cria? #${game.number} · ${score}\n${grid}`;
}
