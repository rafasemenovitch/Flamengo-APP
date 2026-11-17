/**
 * Competições que contam como título no Quem é o Cria? (critério em SOURCES.md).
 * O id de cada título conquistado é `<competição>-<ano>`; o Carioca especial de 1979
 * é `carioca-1979e`. Turnos (Taça Guanabara, Taça Rio) e torneios amistosos não entram.
 */
export const CRIA_COMPETITIONS = {
  mundial: 'Mundial',
  libertadores: 'Libertadores',
  recopa: 'Recopa Sul-Americana',
  brasileiro: 'Brasileiro',
  'copa-do-brasil': 'Copa do Brasil',
  supercopa: 'Supercopa do Brasil',
  mercosul: 'Copa Mercosul',
  'copa-dos-campeoes': 'Copa dos Campeões',
  'copa-de-ouro': 'Copa de Ouro',
  'rio-sp': 'Torneio Rio-São Paulo',
  carioca: 'Carioca',
} as const;

export type CriaCompetition = keyof typeof CRIA_COMPETITIONS;

/** "brasileiro-1981" → "Brasileiro 1981"; "carioca-1979e" → "Carioca 1979 (especial)". */
export function titleLabel(id: string) {
  const m = id.match(/^(.+)-(\d{4})(e?)$/);
  if (!m) return id;
  const name = CRIA_COMPETITIONS[m[1] as CriaCompetition] ?? m[1];
  return `${name} ${m[2]}${m[3] ? ' (especial)' : ''}`;
}
