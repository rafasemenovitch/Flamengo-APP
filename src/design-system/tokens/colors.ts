/**
 * Paleta bruta — NUNCA usar direto em componentes. Componentes leem apenas os
 * tokens semânticos de `ThemeColors` (via useTheme()), para que tema claro e
 * escuro funcionem sem nenhuma cor literal espalhada pelas telas.
 */
export const palette = {
  red300: '#FF7A84',
  red400: '#FF4D5A',
  red500: '#E01A2F',
  red600: '#C8102E', // rubro principal — 5,9:1 com branco
  red700: '#A00D24',
  red800: '#6E0A19',
  red900: '#2A0509',

  black: '#000000',
  ink950: '#0A0A0C',
  ink900: '#111114',
  ink850: '#16161A',
  ink800: '#1C1C21',
  ink750: '#232329',
  ink700: '#2B2B32',
  ink600: '#3A3A43',
  ink500: '#5A5A64',
  ink400: '#83838D',
  ink300: '#A9A9B2',
  ink200: '#D4D4DA',
  ink100: '#E8E8EC',
  ink50: '#F4F4F6',
  white: '#FFFFFF',

  green400: '#34D399',
  green700: '#0F7A3D',
  amber400: '#F5B83D',
  amber700: '#8A5A00',
  blue400: '#60A5FA',
  blue700: '#1D4ED8',
  gold: '#D4A72C',
  silver: '#A8B0BA',
  bronze: '#B87A4B',
} as const;

export interface ThemeColors {
  /** Fundo da tela. */
  background: string;
  /** Cards e superfícies sobre o fundo. */
  surface: string;
  /** Superfície acima de outra (sheet, card dentro de card, tab bar). */
  surfaceElevated: string;
  /** Fundo de chips, inputs e trilhas de progresso. */
  surfaceMuted: string;
  border: string;
  borderStrong: string;

  /** Preenchimento de marca (botões, destaques). Sempre com `onPrimary` por cima. */
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  /** Vermelho para TEXTO/ÍCONE sobre background/surface (contraste ≥ 4,5:1). */
  primaryText: string;
  /** Fundo tingido de vermelho (badges, item selecionado). */
  primarySubtle: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  /** Texto sobre imagens/gradientes escuros, independente do tema. */
  textOnMedia: string;

  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  danger: string;
  dangerSubtle: string;
  info: string;
  infoSubtle: string;

  /** Indicador AO VIVO. */
  live: string;
  liveSubtle: string;
  /** Selo DEMO (tudo que é simulado). */
  demo: string;
  demoSubtle: string;

  gold: string;
  silver: string;
  bronze: string;

  overlay: string;
  skeleton: string;
  skeletonHighlight: string;
  /** Degradê do card hero (de cima para baixo). */
  heroGradient: readonly [string, string];
  /** Escurecimento sobre imagens para legibilidade do texto. */
  mediaScrim: readonly [string, string];
}

export const darkColors: ThemeColors = {
  background: palette.ink950,
  surface: palette.ink850,
  surfaceElevated: palette.ink800,
  surfaceMuted: palette.ink750,
  border: palette.ink700,
  borderStrong: palette.ink600,

  primary: palette.red600,
  primaryPressed: palette.red700,
  onPrimary: palette.white,
  primaryText: palette.red400,
  primarySubtle: 'rgba(224, 26, 47, 0.18)',

  textPrimary: '#F5F5F7',
  textSecondary: palette.ink300,
  textTertiary: palette.ink400,
  textOnMedia: palette.white,

  success: palette.green400,
  successSubtle: 'rgba(52, 211, 153, 0.16)',
  warning: palette.amber400,
  warningSubtle: 'rgba(245, 184, 61, 0.16)',
  danger: '#FF6B6B',
  dangerSubtle: 'rgba(255, 107, 107, 0.16)',
  info: palette.blue400,
  infoSubtle: 'rgba(96, 165, 250, 0.16)',

  live: '#FF3045',
  liveSubtle: 'rgba(255, 48, 69, 0.18)',
  demo: palette.amber400,
  demoSubtle: 'rgba(245, 184, 61, 0.14)',

  gold: palette.gold,
  silver: palette.silver,
  bronze: palette.bronze,

  overlay: 'rgba(0, 0, 0, 0.65)',
  skeleton: palette.ink800,
  skeletonHighlight: palette.ink700,
  heroGradient: ['#3A0610', palette.ink900],
  mediaScrim: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)'],
};

export const lightColors: ThemeColors = {
  background: palette.ink50,
  surface: palette.white,
  surfaceElevated: palette.white,
  surfaceMuted: palette.ink100,
  border: '#E3E3E8',
  borderStrong: palette.ink200,

  primary: palette.red600,
  primaryPressed: palette.red700,
  onPrimary: palette.white,
  primaryText: '#B00E28',
  primarySubtle: 'rgba(200, 16, 46, 0.09)',

  textPrimary: palette.ink950,
  textSecondary: '#52525C',
  textTertiary: '#6B6B75',
  textOnMedia: palette.white,

  success: palette.green700,
  successSubtle: 'rgba(15, 122, 61, 0.10)',
  warning: palette.amber700,
  warningSubtle: 'rgba(245, 184, 61, 0.18)',
  danger: '#C62828',
  dangerSubtle: 'rgba(198, 40, 40, 0.09)',
  info: palette.blue700,
  infoSubtle: 'rgba(29, 78, 216, 0.09)',

  live: '#D90022',
  liveSubtle: 'rgba(217, 0, 34, 0.10)',
  demo: palette.amber700,
  demoSubtle: 'rgba(245, 184, 61, 0.20)',

  gold: '#A77F12',
  silver: '#6F7782',
  bronze: '#8E5A33',

  overlay: 'rgba(10, 10, 12, 0.5)',
  skeleton: palette.ink100,
  skeletonHighlight: palette.ink50,
  heroGradient: [palette.red700, palette.red900],
  mediaScrim: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'],
};

/** Aplica alpha (0–1) a uma cor #RRGGBB. Útil para tingimentos derivados de tokens. */
export function withAlpha(hex: string, alpha: number) {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}
