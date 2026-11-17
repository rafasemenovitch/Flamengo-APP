import type { CriaPlayer } from '@/data/cria/types';

/**
 * Busca de jogadores do Quem é o Cria?: sem acento, sem maiúscula, por nome, sobrenome e
 * apelido ("gab" acha Gabigol e Gabriel; "galinho" acha Zico). Homônimos aparecem com o
 * período no clube para diferenciar ("Jorginho · 1984–1989" e "Jorginho · 2025–").
 */

export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export interface SearchHit {
  player: CriaPlayer;
  /** Já chutado nesta partida: aparece, mas desativado. */
  used: boolean;
  /** Apelido que bateu, quando não foi o nome ("Galinho" para Zico). */
  matchedAlias?: string;
}

/** "1971–1989", "2019–" (ainda no clube), "1995–1999" com várias passagens. */
export function periodLabel(p: Pick<CriaPlayer, 'spells'>) {
  const from = Math.min(...p.spells.map((s) => s.from));
  const open = p.spells.some((s) => s.to === null);
  const to = open ? null : Math.max(...p.spells.map((s) => s.to ?? 0));
  if (open) return `${from}–`;
  return from === to ? String(from) : `${from}–${to}`;
}

/** 0 = não bate; maior = melhor. Todas as palavras da busca precisam bater no começo de alguma palavra. */
function score(query: string[], text: string) {
  const words = fold(text).split(' ');
  const joined = words.join(' ');
  if (!query.every((q) => words.some((w) => w.startsWith(q)))) return 0;
  const q = query.join(' ');
  if (joined === q) return 4;
  if (joined.startsWith(q)) return 3;
  if (words.some((w) => w.startsWith(query[0]!))) return 2;
  return 1;
}

export function searchPlayers(
  players: CriaPlayer[],
  query: string,
  usedIds: ReadonlySet<string> = new Set(),
  limit = 8
): SearchHit[] {
  const q = fold(query).split(' ').filter(Boolean);
  if (!q.length) return [];
  const hits: (SearchHit & { rank: number })[] = [];
  for (const player of players) {
    const byName = score(q, player.name);
    let best = byName * 2; // o nome vale mais que o apelido
    let matchedAlias: string | undefined;
    for (const a of player.aliases) {
      const s = score(q, a);
      if (s && s > best) {
        best = s;
        matchedAlias = a;
      }
    }
    if (!best) continue;
    hits.push({ player, used: usedIds.has(player.id), matchedAlias: byName ? undefined : matchedAlias, rank: best });
  }
  return hits
    .sort(
      (a, b) =>
        b.rank - a.rank ||
        // mais jogos primeiro: o mais lembrado aparece antes
        b.player.matches - a.player.matches ||
        a.player.name.localeCompare(b.player.name, 'pt')
    )
    .slice(0, limit)
    .map(({ rank: _rank, ...hit }) => hit);
}

/** Nomes repetidos na base (para mostrar o período só quando ajuda, ou sempre se preferir). */
export function homonymNames(players: CriaPlayer[]) {
  const seen = new Map<string, number>();
  for (const p of players) seen.set(fold(p.name), (seen.get(fold(p.name)) ?? 0) + 1);
  return new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
}
