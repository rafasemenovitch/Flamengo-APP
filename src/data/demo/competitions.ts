/**
 * Fases das copas (dados SIMULADOS, coerentes com o calendário demo):
 * Libertadores — grupos + mata-mata (Flamengo na final);
 * Copa do Brasil — mata-mata (semifinal em andamento);
 * Carioca — Taça Guanabara + fase final (Flamengo campeão).
 * [timeA, timeB, ida, volta?] — placares do ponto de vista de A × B na ida.
 */
export type TieSeed = [string, string, [number, number] | null, [number, number] | null];

/** Tabela de grupo: [teamId, V, E, D, GP, GC] */
export type GroupRowSeed = [string, number, number, number, number, number];

export const LIBERTADORES_GROUPS: { name: string; rows: GroupRowSeed[] }[] = [
  {
    name: 'Grupo C',
    rows: [
      ['fla', 4, 1, 1, 11, 4],
      ['ldu', 3, 1, 2, 8, 6],
      ['cer', 2, 1, 3, 6, 9],
      ['tal', 1, 1, 4, 4, 10],
    ],
  },
  {
    name: 'Grupo A',
    rows: [
      ['pal', 5, 0, 1, 13, 4],
      ['est', 3, 2, 1, 9, 6],
      ['bol', 2, 1, 3, 7, 10],
      ['pen', 0, 1, 5, 3, 12],
    ],
  },
];

/** Libertadores: oitavas → final. A ida é jogada na casa do time da DIREITA (B). */
export const LIBERTADORES_KO: { name: string; ties: TieSeed[] }[] = [
  {
    name: 'Oitavas',
    ties: [
      ['fla', 'est', [1, 1], [2, 0]],
      ['ldu', 'pal', [1, 0], [0, 2]],
      ['rac', 'cer', [2, 1], [1, 1]],
      ['olm', 'nac', [0, 0], [0, 1]],
      ['riv', 'bol', [3, 0], [1, 2]],
      ['bot', 'tal', [2, 0], [1, 1]],
      ['sao', 'pen', [1, 1], [2, 1]],
      ['int', 'cap', [0, 1], [1, 0]],
    ],
  },
  {
    name: 'Quartas',
    ties: [
      ['fla', 'ldu', [1, 1], [1, 0]],
      ['rac', 'pal', [1, 0], [1, 1]],
      ['nac', 'riv', [1, 1], [1, 0]],
      ['bot', 'sao', [0, 1], [2, 0]],
    ],
  },
  {
    name: 'Semifinal',
    ties: [
      ['fla', 'rac', [1, 0], [2, 1]],
      ['nac', 'bot', [2, 2], [1, 0]],
    ],
  },
  { name: 'Final · jogo único', ties: [['fla', 'nac', null, null]] },
];

export const COPA_DO_BRASIL_KO: { name: string; ties: TieSeed[] }[] = [
  {
    name: 'Oitavas',
    ties: [
      ['fla', 'crb', [3, 0], [2, 1]],
      ['cru', 'for', [1, 0], [1, 1]],
      ['cor', 'vas', [0, 0], [1, 2]],
      ['pal', 'gre', [2, 1], [0, 0]],
      ['sao', 'bah', [1, 1], [0, 1]],
      ['cap', 'int', [1, 0], [1, 1]],
      ['flu', 'cam', [0, 2], [1, 1]],
      ['san', 'rbb', [2, 0], [0, 1]],
    ],
  },
  {
    name: 'Quartas',
    ties: [
      ['fla', 'cap', [2, 0], [1, 1]],
      ['cru', 'bah', [1, 0], [0, 0]],
      ['vas', 'pal', [1, 2], [0, 1]],
      ['cam', 'san', [2, 1], [1, 1]],
    ],
  },
  {
    name: 'Semifinal',
    ties: [
      // Ida no Mineirão (1 × 1); volta no Maracanã ainda por jogar.
      ['fla', 'cru', [1, 1], null],
      ['pal', 'cam', [1, 0], null],
    ],
  },
  { name: 'Final', ties: [['?', '?', null, null]] },
];

export const CARIOCA_TAÇA_GUANABARA: GroupRowSeed[] = [
  ['fla', 9, 1, 1, 24, 7],
  ['flu', 7, 2, 2, 18, 9],
  ['vas', 6, 3, 2, 16, 10],
  ['bot', 6, 2, 3, 17, 11],
  ['vrd', 5, 2, 4, 12, 12],
  ['nig', 4, 3, 4, 11, 13],
  ['boa', 3, 4, 4, 10, 13],
  ['ptg', 3, 3, 5, 9, 14],
  ['mad', 3, 2, 6, 8, 15],
  ['ban', 2, 3, 6, 7, 16],
  ['sam', 2, 2, 7, 8, 19],
  ['mar', 1, 3, 7, 6, 17],
];

export const CARIOCA_FINALS: { name: string; ties: TieSeed[] }[] = [
  {
    name: 'Semifinal',
    ties: [
      ['fla', 'bot', [2, 0], null],
      ['flu', 'vas', [1, 1], null],
    ],
  },
  { name: 'Final', ties: [['fla', 'flu', [1, 0], [2, 2]]] },
];
