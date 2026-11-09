import type { BolaoGuess, BolaoPoints } from '@/types/bolao';

/** Regras de pontuação do Bolão da Nação (fonte única para cálculo e tela de regras). */
export const BOLAO_RULES = {
  exact: 10,
  diff: 7,
  result: 5,
  goals: 2,
  scorer: 6,
  assist: 5,
  /** Participantes mínimos para o campeão do bolão ganhar o prêmio. */
  prizeMinMembers: 10,
  prizeDiscountPct: 20,
} as const;

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);

/**
 * Pontos de um palpite.
 * - Placar exato: 10
 * - Vencedor (ou empate) e saldo de gols: 7
 * - Só o vencedor (ou empate): 5
 * - Errou o resultado mas acertou os gols de um dos times: 2
 * - Artilheiro escolhido marcou: +6 · Garçom escolhido deu assistência: +5
 * - Coringa: dobra o total do jogo
 */
export function scoreGuess(
  guess: Pick<BolaoGuess, 'home' | 'away' | 'scorerId' | 'assistId' | 'joker'>,
  final: { home: number; away: number },
  flaScorerIds: string[] = [],
  flaAssistIds: string[] = []
): BolaoPoints {
  let kind: BolaoPoints['kind'] = 'miss';
  let base = 0;
  if (guess.home === final.home && guess.away === final.away) {
    kind = 'exact';
    base = BOLAO_RULES.exact;
  } else if (sign(guess.home - guess.away) === sign(final.home - final.away)) {
    const sameDiff = guess.home - guess.away === final.home - final.away;
    kind = sameDiff ? 'diff' : 'result';
    base = sameDiff ? BOLAO_RULES.diff : BOLAO_RULES.result;
  } else if (guess.home === final.home || guess.away === final.away) {
    kind = 'goals';
    base = BOLAO_RULES.goals;
  }
  const scorer = guess.scorerId && flaScorerIds.includes(guess.scorerId) ? BOLAO_RULES.scorer : 0;
  const assist = guess.assistId && flaAssistIds.includes(guess.assistId) ? BOLAO_RULES.assist : 0;
  const subtotal = base + scorer + assist;
  return { kind, base, scorer, assist, joker: !!guess.joker, total: guess.joker ? subtotal * 2 : subtotal };
}

/** Máximo possível num jogo (para mostrar "vale até N pts"). */
export function maxPoints(joker: boolean) {
  const max = BOLAO_RULES.exact + BOLAO_RULES.scorer + BOLAO_RULES.assist;
  return joker ? max * 2 : max;
}

export const POINTS_LABEL: Record<BolaoPoints['kind'], string> = {
  exact: 'Placar exato',
  diff: 'Resultado e saldo',
  result: 'Resultado certo',
  goals: 'Gols de um time',
  miss: 'Não pontuou',
};

/** Código de convite: 6 caracteres sem ambiguidade (sem 0/O, 1/I). */
export function makeInviteCode(seed: string) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let code = '';
  for (let i = 0; i < 6; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    code += alphabet[h % alphabet.length];
  }
  return code;
}

/** Normaliza o que o torcedor digitou (minúsculas, espaços, link colado). */
export function normalizeCode(input: string) {
  const fromLink = input.match(/bolao\/([A-Za-z0-9]+)/);
  return (fromLink?.[1] ?? input)
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);
}
