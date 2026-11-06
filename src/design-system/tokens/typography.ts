import type { TextStyle } from 'react-native';

/**
 * Display: Anybody (instâncias estáticas por largura/peso, geradas por
 * scripts/build-fonts.py). Texto: Schibsted Grotesk.
 * Para trocar pela fonte oficial do clube, altere SÓ `fontFiles` e `fonts`.
 */
export const fontFiles = {
  'Anybody-W150-900': require('../../../assets/fonts/Anybody-W150-900.ttf'),
  'Anybody-W120-900': require('../../../assets/fonts/Anybody-W120-900.ttf'),
  'Anybody-W110-900': require('../../../assets/fonts/Anybody-W110-900.ttf'),
  'Anybody-W100-700': require('../../../assets/fonts/Anybody-W100-700.ttf'),
  'Anybody-W100-600': require('../../../assets/fonts/Anybody-W100-600.ttf'),
  'Anybody-W85-800': require('../../../assets/fonts/Anybody-W85-800.ttf'),
  'Anybody-W75-800': require('../../../assets/fonts/Anybody-W75-800.ttf'),
  SchibstedGrotesk_400Regular: require('../../../assets/fonts/SchibstedGrotesk_400Regular.ttf'),
  SchibstedGrotesk_500Medium: require('../../../assets/fonts/SchibstedGrotesk_500Medium.ttf'),
  SchibstedGrotesk_600SemiBold: require('../../../assets/fonts/SchibstedGrotesk_600SemiBold.ttf'),
  SchibstedGrotesk_700Bold: require('../../../assets/fonts/SchibstedGrotesk_700Bold.ttf'),
  SchibstedGrotesk_800ExtraBold: require('../../../assets/fonts/SchibstedGrotesk_800ExtraBold.ttf'),
} as const;

export const fonts = {
  regular: 'SchibstedGrotesk_400Regular',
  medium: 'SchibstedGrotesk_500Medium',
  semibold: 'SchibstedGrotesk_600SemiBold',
  bold: 'SchibstedGrotesk_700Bold',
  extrabold: 'SchibstedGrotesk_800ExtraBold',
  /** Larga e pesada: números, "GOL!". */
  displayWide150: 'Anybody-W150-900',
  displayWide120: 'Anybody-W120-900',
  displayWide110: 'Anybody-W110-900',
  displayNormal700: 'Anybody-W100-700',
  displayNormal600: 'Anybody-W100-600',
  displayCond85: 'Anybody-W85-800',
  /** Alta e comprimida: títulos de aba. */
  displayCond75: 'Anybody-W75-800',
} as const;

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];
const track = (size: number, pct: number) => (size * pct) / 100;

/**
 * Escala tipográfica (especificação, seção 5.2). Um protagonista
 * `displayHero` ou `displayXl` por tela.
 */
const scale = {
  displayHero: {
    fontFamily: fonts.displayWide120,
    fontSize: 80,
    lineHeight: 80,
    letterSpacing: track(80, -3),
    fontVariant: tabular,
  },
  displayXl: {
    fontFamily: fonts.displayWide110,
    fontSize: 52,
    lineHeight: 52,
    letterSpacing: track(52, -2),
    fontVariant: tabular,
  },
  displayL: { fontFamily: fonts.displayCond75, fontSize: 40, lineHeight: 42, letterSpacing: track(40, -1.5) },
  displayM: { fontFamily: fonts.displayCond85, fontSize: 28, lineHeight: 30, letterSpacing: track(28, -1) },
  displayS: {
    fontFamily: fonts.displayNormal700,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: track(20, -0.5),
    fontVariant: tabular,
  },
  /** Comemoração de gol (largura 150). */
  displayGoal: {
    fontFamily: fonts.displayWide150,
    fontSize: 80,
    lineHeight: 84,
    letterSpacing: track(80, -3),
  },
  titleL: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: track(22, -0.5) },
  titleM: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
  titleS: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  bodyL: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 26 },
  bodyM: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyS: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, letterSpacing: track(13, 0.2) },
  labelButton: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 20 },
  labelM: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 16, letterSpacing: track(13, 0.3) },
  labelTab: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: track(11, 0.5) },
  overline: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: track(11, 6),
    textTransform: 'uppercase',
  },
  numericTable: { fontFamily: fonts.displayNormal600, fontSize: 15, lineHeight: 20, fontVariant: tabular },
} satisfies Record<string, TextStyle>;

/**
 * Nomes da primeira versão, como apelidos da escala nova (migração).
 * @deprecated use os tokens de `scale`.
 */
const legacy = {
  score: scale.displayHero,
  number: { ...scale.displayXl, fontSize: 32, lineHeight: 34, letterSpacing: track(32, -2) },
  numberSm: scale.displayS,
  display: scale.displayL,
  h1: scale.displayL,
  h2: scale.displayM,
  h3: scale.titleM,
  title: scale.titleS,
  body: scale.bodyM,
  bodyStrong: { ...scale.bodyM, fontFamily: fonts.semibold },
  callout: scale.bodyM,
  caption: scale.bodyS,
  footnote: { ...scale.bodyS, fontSize: 12, lineHeight: 16 },
  label: scale.labelM,
  tabular: scale.numericTable,
} satisfies Record<string, TextStyle>;

export const typography = { ...scale, ...legacy };

export type TypographyVariant = keyof typeof typography;

/** Tetos de fonte dinâmica (acessibilidade): 130% em texto, 110% em display. */
export const maxFontScale = (variant: TypographyVariant) =>
  variant.startsWith('display') || ['score', 'number', 'numberSm', 'display', 'h1', 'h2'].includes(variant)
    ? 1.1
    : 1.3;
