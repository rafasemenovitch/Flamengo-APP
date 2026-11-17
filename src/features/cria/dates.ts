/**
 * Dia do desafio: vira à meia-noite de Brasília. O Brasil não tem horário de verão desde
 * 2019, então Brasília é UTC−3 o ano todo e a conta não depende do fuso do aparelho.
 */

const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Primeiro desafio: #1. */
export const CRIA_LAUNCH = '2026-11-17';

/** "2026-11-17" do dia em Brasília no instante dado. */
export function dayKey(now: Date | number = Date.now()) {
  return new Date(+now - BRT_OFFSET_MS).toISOString().slice(0, 10);
}

/** Dias inteiros entre duas chaves ("2026-11-17" → "2026-11-18" = 1). */
export function daysBetween(fromKey: string, toKey: string) {
  return Math.round((Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) / DAY_MS);
}

export function addDays(key: string, days: number) {
  return new Date(Date.parse(`${key}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Número do desafio: #1 no lançamento. */
export const challengeNumber = (key: string) => daysBetween(CRIA_LAUNCH, key) + 1;

/** Instante (ms) da próxima virada, para a contagem regressiva. */
export function nextResetAt(now: Date | number = Date.now()) {
  return Date.parse(`${addDays(dayKey(now), 1)}T00:00:00Z`) + BRT_OFFSET_MS;
}

/** Dia da semana da chave: 0 = domingo. */
export const weekday = (key: string) => new Date(`${key}T12:00:00Z`).getUTCDay();

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "17 nov" */
export function shortDate(key: string) {
  const [, m, d] = key.split('-').map(Number);
  return `${d} ${MONTHS[m! - 1]}`;
}
