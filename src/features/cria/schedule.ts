import type { CriaPlayer } from '@/data/cria/types';

import { addDays, weekday } from './dates';

/**
 * Agenda do Quem é o Cria?: que jogador é o secreto em cada dia.
 *
 * Gerada com antecedência por `npm run cria:agenda` (determinística: a mesma base dá a
 * mesma agenda). O id de cada dia vai DISFARÇADO no arquivo, misturado com uma sequência
 * que depende da data, para a resposta não aparecer em texto puro no app. Não é
 * segurança de verdade: quando houver servidor, ele escolhe o secreto e a resposta só
 * chega ao aparelho no fim da partida.
 */

// ——— Disfarce ———————————————————————————————————————————————————————

const SALT = 'mengao-cria';

/** FNV-1a de 32 bits. */
function hash32(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Gerador pseudoaleatório pequeno e determinístico. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function keystream(date: string, length: number) {
  const next = mulberry32(hash32(`${SALT}:${date}`));
  return Array.from({ length }, () => Math.floor(next() * 256));
}

/** Todo código tem o mesmo tamanho, para o comprimento não entregar o nome. */
const CODE_BYTES = 24;

/** id → hex misturado com a data. Os ids são ASCII ("zico", "leo-moura"). */
export function encodeId(id: string, date: string) {
  if (id.length > CODE_BYTES) throw new Error(`id longo demais: ${id}`);
  const padded = id.padEnd(CODE_BYTES, '\0');
  const ks = keystream(date, CODE_BYTES);
  return [...padded].map((ch, i) => (ch.charCodeAt(0) ^ ks[i]!).toString(16).padStart(2, '0')).join('');
}

export function decodeId(hex: string, date: string) {
  const bytes = hex.match(/../g)?.map((h) => parseInt(h, 16)) ?? [];
  const ks = keystream(date, bytes.length);
  return String.fromCharCode(...bytes.map((b, i) => b ^ ks[i]!)).replace(/\0+$/, '');
}

/** Texto qualquer (JSON do secreto congelado) disfarçado pela data, em hex. */
export function obfuscate(text: string, date: string) {
  const bytes = [...new TextEncoder().encode(text)];
  const ks = keystream(`texto:${date}`, bytes.length);
  return bytes.map((b, i) => (b ^ ks[i]!).toString(16).padStart(2, '0')).join('');
}

export function reveal(hex: string, date: string) {
  const bytes = hex.match(/../g)?.map((h) => parseInt(h, 16)) ?? [];
  const ks = keystream(`texto:${date}`, bytes.length);
  return new TextDecoder().decode(new Uint8Array(bytes.map((b, i) => b ^ ks[i]!)));
}

/** Id do secreto de uma data, ou null fora da agenda. */
export function secretIdFor(schedule: { start: string; days: string[] }, date: string) {
  const i = Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${schedule.start}T00:00:00Z`)) / 86_400_000
  );
  const code = schedule.days[i];
  return code ? decodeId(code, date) : null;
}

// ——— Geração ———————————————————————————————————————————————————————

export type Difficulty = CriaPlayer['difficulty'];

/** Domingo e segunda fáceis, sexta difícil, o resto médio. */
export function targetDifficulty(date: string): Difficulty {
  const d = weekday(date);
  if (d === 0 || d === 1) return 'facil';
  if (d === 5) return 'dificil';
  return 'medio';
}

/** Geração do jogador: antes de 1970, 1970–1999, 2000 em diante. */
export const era = (p: Pick<CriaPlayer, 'arrivalYear'>) =>
  p.arrivalYear < 1970 ? 'antigo' : p.arrivalYear < 2000 ? 'classico' : 'recente';

/** Intervalo mínimo desejado entre duas aparições do mesmo jogador. */
export const IDEAL_GAP = 90;

export interface ScheduleOptions {
  start: string;
  days: number;
  /** "MM-DD" → id (todo ano) ou "AAAA-MM-DD" → id (só naquela data). */
  pins?: Record<string, string>;
  seed?: number;
}

/**
 * Escolha de cada dia, em ordem de prioridade:
 * 1. data fixada à mão (aniversário de ídolo etc.);
 * 2. jogador fora da janela de repetição, da dificuldade do dia e de outra geração que ontem;
 * 3. relaxa a geração; depois a dificuldade (mas ainda trocando de geração);
 * 4. se todos apareceram dentro da janela, o que está há mais tempo sem aparecer.
 *
 * A janela é de 90 dias quando a base permite; com menos de 90 respostas possíveis ela
 * encolhe para 80% do total, senão a agenda travaria.
 */
export function generateSchedule(players: CriaPlayer[], opts: ScheduleOptions) {
  const eligible = players.filter((p) => p.eligible).sort((a, b) => a.id.localeCompare(b.id));
  if (!eligible.length) throw new Error('nenhum jogador elegível');
  const byId = new Map(eligible.map((p) => [p.id, p]));
  const gap = Math.min(IDEAL_GAP, Math.floor(eligible.length * 0.8));
  const rand = mulberry32(opts.seed ?? 2026);
  const lastUsed = new Map<string, number>();
  const out: { date: string; id: string }[] = [];
  let prevEra: string | null = null;

  for (let i = 0; i < opts.days; i++) {
    const date = addDays(opts.start, i);
    const pinned = opts.pins?.[date] ?? opts.pins?.[date.slice(5)];
    let pick: CriaPlayer | undefined = pinned ? byId.get(pinned) : undefined;
    if (pinned && !pick)
      throw new Error(`data fixada ${date} aponta para "${pinned}", que não pode ser resposta`);

    if (!pick) {
      const free = eligible.filter((p) => i - (lastUsed.get(p.id) ?? -Infinity) >= gap);
      const target = targetDifficulty(date);
      const tiers = [
        free.filter((p) => p.difficulty === target && era(p) !== prevEra),
        free.filter((p) => p.difficulty === target),
        free.filter((p) => p.difficulty === 'medio' && era(p) !== prevEra),
        free.filter((p) => era(p) !== prevEra),
        free,
      ];
      const pool = tiers.find((t) => t.length);
      if (pool) pick = pool[Math.floor(rand() * pool.length)];
      else {
        // todos dentro da janela: o mais antigo
        pick = [...eligible].sort((a, b) => (lastUsed.get(a.id) ?? -1) - (lastUsed.get(b.id) ?? -1))[0];
      }
    }
    lastUsed.set(pick!.id, i);
    prevEra = era(pick!);
    out.push({ date, id: pick!.id });
  }
  return { gap, days: out };
}
