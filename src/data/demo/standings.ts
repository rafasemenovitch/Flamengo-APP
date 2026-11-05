/** Classificação do Brasileirão após a 32ª rodada (simulada). [teamId, V, E, D] */
export const BRASILEIRAO_TABLE: Array<[string, number, number, number]> = [
  ['pal', 21, 5, 6],
  ['fla', 20, 7, 5],
  ['bot', 16, 10, 6],
  ['cru', 16, 8, 8],
  ['flu', 15, 8, 9],
  ['bah', 15, 7, 10],
  ['int', 13, 10, 9],
  ['sao', 13, 8, 11],
  ['cor', 12, 9, 11],
  ['cam', 12, 8, 12],
  ['gre', 12, 7, 13],
  ['vas', 11, 9, 12],
  ['rbb', 11, 8, 13],
  ['mir', 10, 10, 12],
  ['for', 10, 8, 14],
  ['san', 9, 10, 13],
  ['vit', 9, 8, 15],
  ['cap', 8, 9, 15],
  ['cfc', 7, 9, 16],
  ['rem', 6, 8, 18],
];

/** Sobrescreve gols do Flamengo e do líder para números mais "redondos" na apresentação. */
export const GOALS_OVERRIDE: Record<string, [number, number]> = {
  fla: [61, 24],
  pal: [58, 27],
};

export const FLA_FORM: Array<'W' | 'D' | 'L'> = ['W', 'W', 'D', 'W', 'W'];

export const ZONES = {
  libertadores: [1, 4],
  'pre-libertadores': [5, 6],
  sudamericana: [7, 12],
  relegation: [17, 20],
} as const;
