/**
 * Paleta bruta. Componentes NUNCA usam estes valores direto: usam os tokens
 * semânticos de `ThemeColors` via useTheme().
 */
export const palette = {
  black: '#000000',
  ink950: '#0A0A0B',
  ink900: '#151518',
  ink850: '#1E1E22',
  ink800: '#26262B',
  ink500: '#7C7C84',
  ink300: '#A6A6AD',
  ink50: '#F5F5F4',
  white: '#FFFFFF',
  red600: '#C8102E',
  red700: '#A50D26',
  red400: '#FF4D5E',
  redLive: '#FF2D3F',
  green: '#3CCB7F',
  amber: '#F5B544',
  // Medalhas (Conquistas)
  gold: '#D4A72C',
  silver: '#A8B0BA',
  bronze: '#B87A4B',
} as const;

/**
 * Tokens da identidade (especificação de redesign, seção 4). Preto profundo,
 * branco forte, vermelho com intenção.
 */
interface IdentityTokens {
  /** Fundo de todas as telas. */
  bgCanvas: string;
  /** Fundo de objetos: ingresso, palpite, bolha do assistente, busca. */
  bgRaised: string;
  /** Botões −/+, células de quiz, opções de enquete, skeleton. */
  bgRaised2: string;
  /** Blocos vermelhos de destaque (dia de jogo, comemoração, fundo de foto). */
  bgRed: string;
  inkPrimary: string;
  inkSecondary: string;
  /** Legendas e inativos. Nunca em texto essencial abaixo de 13px. */
  inkTertiary: string;
  inkOnRed: string;
  lineHairline: string;
  lineStrong: string;
  /** Preenchimento vermelho (botão primário). */
  accent: string;
  accentPressed: string;
  /** Texto/ícone vermelho sobre preto (contraste ~6:1). */
  accentText: string;
  accentTint: string;
  live: string;
  success: string;
  /** Texto do selo DEMO. */
  warning: string;
  warningBg: string;
  danger: string;
  /** Degradê de leitura sobre foto (topo → base). */
  overlayPhoto: readonly [string, string];
  scrim: string;
  gold: string;
  silver: string;
  bronze: string;
}

/**
 * Nomes da primeira versão do app, mantidos como APELIDOS dos tokens novos
 * durante a migração das telas. Não usar em código novo.
 * @deprecated
 */
interface LegacyTokens {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primaryText: string;
  primarySubtle: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnMedia: string;
  successSubtle: string;
  warningSubtle: string;
  dangerSubtle: string;
  info: string;
  infoSubtle: string;
  liveSubtle: string;
  demo: string;
  demoSubtle: string;
  overlay: string;
  skeleton: string;
  skeletonHighlight: string;
  heroGradient: readonly [string, string];
  mediaScrim: readonly [string, string];
}

export type ThemeColors = IdentityTokens & LegacyTokens;

function withLegacy(t: IdentityTokens): ThemeColors {
  return {
    ...t,
    background: t.bgCanvas,
    surface: t.bgRaised,
    surfaceElevated: t.bgRaised,
    surfaceMuted: t.bgRaised2,
    border: t.lineHairline,
    borderStrong: t.lineStrong,
    primary: t.accent,
    primaryPressed: t.accentPressed,
    onPrimary: t.inkOnRed,
    primaryText: t.accentText,
    primarySubtle: t.accentTint,
    textPrimary: t.inkPrimary,
    textSecondary: t.inkSecondary,
    textTertiary: t.inkTertiary,
    textOnMedia: t.inkOnRed,
    successSubtle: 'rgba(60,203,127,0.14)',
    warningSubtle: t.warningBg,
    dangerSubtle: 'rgba(255,77,94,0.14)',
    info: t.inkSecondary,
    infoSubtle: t.bgRaised2,
    liveSubtle: 'rgba(255,45,63,0.16)',
    demo: t.warning,
    demoSubtle: t.warningBg,
    overlay: t.scrim,
    skeleton: t.bgRaised2,
    skeletonHighlight: t.lineHairline,
    heroGradient: [t.bgRaised, t.bgCanvas],
    mediaScrim: t.overlayPhoto,
  };
}

export const darkColors: ThemeColors = withLegacy({
  bgCanvas: palette.ink950,
  bgRaised: palette.ink900,
  bgRaised2: palette.ink850,
  bgRed: palette.red600,
  inkPrimary: palette.ink50,
  inkSecondary: palette.ink300,
  inkTertiary: palette.ink500,
  inkOnRed: palette.white,
  lineHairline: palette.ink800,
  lineStrong: palette.ink50,
  accent: palette.red600,
  accentPressed: palette.red700,
  accentText: palette.red400,
  accentTint: 'rgba(200,16,46,0.16)',
  live: palette.redLive,
  success: palette.green,
  warning: palette.amber,
  warningBg: 'rgba(245,181,68,0.14)',
  danger: palette.red400,
  overlayPhoto: ['rgba(10,10,11,0)', 'rgba(10,10,11,0.85)'],
  scrim: 'rgba(0,0,0,0.6)',
  gold: palette.gold,
  silver: palette.silver,
  bronze: palette.bronze,
});

/**
 * Tema claro: arquitetura pronta, desenho NÃO priorizado nesta etapa
 * (especificação, seção 4). Valores provisórios com contraste adequado.
 */
export const lightColors: ThemeColors = withLegacy({
  bgCanvas: '#F5F5F4',
  bgRaised: '#FFFFFF',
  bgRaised2: '#EAEAEA',
  bgRed: palette.red600,
  inkPrimary: palette.ink950,
  inkSecondary: '#4E4E55',
  inkTertiary: '#6B6B73',
  inkOnRed: palette.white,
  lineHairline: '#DEDEE2',
  lineStrong: palette.ink950,
  accent: palette.red600,
  accentPressed: palette.red700,
  accentText: '#B00E28',
  accentTint: 'rgba(200,16,46,0.09)',
  live: '#D90022',
  success: '#0F7A3D',
  warning: '#8A5A00',
  warningBg: 'rgba(245,181,68,0.2)',
  danger: '#B00E28',
  overlayPhoto: ['rgba(10,10,11,0)', 'rgba(10,10,11,0.85)'],
  scrim: 'rgba(10,10,11,0.5)',
  gold: '#A77F12',
  silver: '#6F7782',
  bronze: '#8E5A33',
});

/** Aplica alpha (0–1) a uma cor #RRGGBB. */
export function withAlpha(hex: string, alpha: number) {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}
