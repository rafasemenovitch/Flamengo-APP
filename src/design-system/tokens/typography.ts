import type { TextStyle } from 'react-native';

/**
 * Dois conjuntos tipográficos, trocáveis em tempo real para comparar
 * (Perfil → Configurações → Aparência → Tipografia, ou nos controles da demo):
 *
 * - `classic`: Anybody (display, instâncias de scripts/build-fonts.py) +
 *   Schibsted Grotesk (texto). É a tipografia original, intacta.
 * - `sport`: Barlow Condensed ExtraBold (títulos de impacto, nomes dos times
 *   no card principal, placares, cronômetros) + Manrope 400–700 (interface e
 *   leitura).
 *
 * Telas nunca usam nomes de fonte direto: usam as variantes de <Text> ou
 * `useTheme().fonts`. Para adotar um conjunto de vez, mude DEFAULT_TYPE_SET
 * (ThemeProvider) e apague o outro daqui.
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
  // Teste tipográfico "sport" (licença OFL em assets/fonts/licenses)
  BarlowCondensed_800ExtraBold: require('../../../assets/fonts/BarlowCondensed_800ExtraBold.ttf'),
  Manrope_400Regular: require('../../../assets/fonts/Manrope_400Regular.ttf'),
  Manrope_500Medium: require('../../../assets/fonts/Manrope_500Medium.ttf'),
  Manrope_600SemiBold: require('../../../assets/fonts/Manrope_600SemiBold.ttf'),
  Manrope_700Bold: require('../../../assets/fonts/Manrope_700Bold.ttf'),
} as const;

const classicFonts = {
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
};

export type FontFamilies = typeof classicFonts;

const BARLOW = 'BarlowCondensed_800ExtraBold';
const sportFonts: FontFamilies = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  /** A interface nova vai até 700. */
  extrabold: 'Manrope_700Bold',
  displayWide150: BARLOW,
  displayWide120: BARLOW,
  displayWide110: BARLOW,
  /** Números de apoio (tabelas, horário) ficam na fonte de interface. */
  displayNormal700: 'Manrope_700Bold',
  displayNormal600: 'Manrope_600SemiBold',
  displayCond85: BARLOW,
  displayCond75: BARLOW,
};

export type TypeSet = 'classic' | 'sport';
export const fontSets: Record<TypeSet, FontFamilies> = { classic: classicFonts, sport: sportFonts };
/** @deprecated use `useTheme().fonts` (segue o conjunto ativo). */
export const fonts = classicFonts;

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];
const track = (size: number, pct: number) => (size * pct) / 100;

/**
 * Escala tipográfica original (especificação, seção 5.2). Um protagonista
 * `displayHero` ou `displayXl` por tela.
 */
const classicScale = {
  displayHero: {
    fontFamily: classicFonts.displayWide120,
    fontSize: 80,
    lineHeight: 80,
    letterSpacing: track(80, -3),
    fontVariant: tabular,
  },
  displayXl: {
    fontFamily: classicFonts.displayWide110,
    fontSize: 52,
    lineHeight: 52,
    letterSpacing: track(52, -2),
    fontVariant: tabular,
  },
  displayL: {
    fontFamily: classicFonts.displayCond75,
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: track(40, -1.5),
  },
  displayM: {
    fontFamily: classicFonts.displayCond85,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: track(28, -1),
  },
  displayS: {
    fontFamily: classicFonts.displayNormal700,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: track(20, -0.5),
    fontVariant: tabular,
  },
  /** Comemoração de gol (largura 150). */
  displayGoal: {
    fontFamily: classicFonts.displayWide150,
    fontSize: 80,
    lineHeight: 84,
    letterSpacing: track(80, -3),
  },
  /**
   * Título de conteúdo (notícia, vídeo, produto, pop-up, etapas de fluxo).
   * No conjunto original é idêntico ao displayM; no novo vai para a fonte de
   * interface, porque a esportiva fica só para o que é de impacto.
   */
  headline: {
    fontFamily: classicFonts.displayCond85,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: track(28, -1),
  },
  /** Títulos de seção (Notícias, FlaTV...): grotesca editorial pesada. */
  sectionTitle: {
    fontFamily: classicFonts.extrabold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: track(24, -0.8),
  },
  titleL: { fontFamily: classicFonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: track(22, -0.5) },
  titleM: { fontFamily: classicFonts.semibold, fontSize: 18, lineHeight: 24 },
  titleS: { fontFamily: classicFonts.semibold, fontSize: 16, lineHeight: 22 },
  bodyL: { fontFamily: classicFonts.regular, fontSize: 17, lineHeight: 26 },
  bodyM: { fontFamily: classicFonts.regular, fontSize: 15, lineHeight: 22 },
  bodyS: { fontFamily: classicFonts.regular, fontSize: 13, lineHeight: 18, letterSpacing: track(13, 0.2) },
  labelButton: { fontFamily: classicFonts.bold, fontSize: 16, lineHeight: 20 },
  labelM: { fontFamily: classicFonts.semibold, fontSize: 13, lineHeight: 16, letterSpacing: track(13, 0.3) },
  labelTab: {
    fontFamily: classicFonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: track(11, 0.5),
  },
  overline: {
    fontFamily: classicFonts.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: track(11, 6),
    textTransform: 'uppercase',
  },
  numericTable: {
    fontFamily: classicFonts.displayNormal600,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: tabular,
  },
} satisfies Record<string, TextStyle>;

type Scale = Record<keyof typeof classicScale, TextStyle>;

/**
 * Escala "sport". Mesmos tamanhos da original (o layout não muda); só
 * entrelinha e espaçamento entre letras foram ajustados ao desenho de cada
 * fonte, para não cortar nem quebrar.
 * - Barlow Condensed 800: títulos de página, nomes dos times no card
 *   principal, títulos de impacto ("Raça"), placares e cronômetros.
 * - Manrope 600–700: competição, títulos de cards e notícias, botões, abas.
 * - Manrope 400–500: descrições, datas, horários, apoio.
 */
const S = sportFonts;
const sportScale: Scale = {
  displayHero: {
    fontFamily: BARLOW,
    fontSize: 80,
    lineHeight: 84,
    letterSpacing: track(80, -1),
    fontVariant: tabular,
  },
  displayXl: {
    fontFamily: BARLOW,
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: track(52, -0.5),
    fontVariant: tabular,
  },
  displayL: { fontFamily: BARLOW, fontSize: 40, lineHeight: 44, letterSpacing: track(40, -0.5) },
  displayM: { fontFamily: BARLOW, fontSize: 28, lineHeight: 32, letterSpacing: 0, fontVariant: tabular },
  /** Competição e horário do card principal, números de apoio: destaque sem a fonte esportiva. */
  displayS: {
    fontFamily: S.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: track(20, -1),
    fontVariant: tabular,
  },
  displayGoal: { fontFamily: BARLOW, fontSize: 80, lineHeight: 88, letterSpacing: track(80, -1) },
  /** Manrope é mais larga que a Anybody condensada: 24 ocupa o mesmo espaço que 28 ocupava. */
  headline: { fontFamily: S.bold, fontSize: 24, lineHeight: 30, letterSpacing: track(24, -1.5) },
  sectionTitle: { fontFamily: S.bold, fontSize: 24, lineHeight: 30, letterSpacing: track(24, -1.5) },
  titleL: { fontFamily: S.bold, fontSize: 22, lineHeight: 28, letterSpacing: track(22, -1) },
  titleM: { fontFamily: S.semibold, fontSize: 18, lineHeight: 24, letterSpacing: track(18, -0.5) },
  titleS: { fontFamily: S.semibold, fontSize: 16, lineHeight: 22, letterSpacing: track(16, -0.3) },
  bodyL: { fontFamily: S.regular, fontSize: 17, lineHeight: 26 },
  bodyM: { fontFamily: S.regular, fontSize: 15, lineHeight: 22 },
  bodyS: { fontFamily: S.regular, fontSize: 13, lineHeight: 18 },
  labelButton: { fontFamily: S.bold, fontSize: 16, lineHeight: 20 },
  labelM: {
    fontFamily: S.semibold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: track(13, 0.2),
    fontVariant: tabular,
  },
  labelTab: { fontFamily: S.semibold, fontSize: 11, lineHeight: 14, letterSpacing: track(11, 0.3) },
  overline: {
    fontFamily: S.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: track(11, 6),
    textTransform: 'uppercase',
  },
  numericTable: { fontFamily: S.semibold, fontSize: 15, lineHeight: 20, fontVariant: tabular },
};

/**
 * Nomes da primeira versão, como apelidos da escala (migração).
 * @deprecated use os tokens da escala.
 */
function withLegacy(scale: Scale, f: FontFamilies) {
  return {
    ...scale,
    score: scale.displayHero,
    number: {
      ...scale.displayXl,
      fontSize: 32,
      lineHeight: f === classicFonts ? 34 : 36,
      letterSpacing: track(32, f === classicFonts ? -2 : -0.5),
    },
    numberSm: scale.displayS,
    display: scale.displayL,
    h1: scale.displayL,
    h2: scale.displayM,
    h3: scale.titleM,
    title: scale.titleS,
    body: scale.bodyM,
    bodyStrong: { ...scale.bodyM, fontFamily: f.semibold },
    callout: scale.bodyM,
    caption: scale.bodyS,
    footnote: { ...scale.bodyS, fontSize: 12, lineHeight: 16 },
    label: scale.labelM,
    tabular: scale.numericTable,
  };
}

export type Typography = ReturnType<typeof withLegacy>;

export const typographySets: Record<TypeSet, Typography> = {
  classic: withLegacy(classicScale, classicFonts),
  sport: withLegacy(sportScale, sportFonts),
};

/** @deprecated use `useTheme().typography` (segue o conjunto ativo). */
export const typography = typographySets.classic;

export type TypographyVariant = keyof typeof typography;

/** Tetos de fonte dinâmica (acessibilidade): 130% em texto, 110% em display. */
export const maxFontScale = (variant: TypographyVariant) =>
  variant.startsWith('display') ||
  ['headline', 'score', 'number', 'numberSm', 'display', 'h1', 'h2'].includes(variant)
    ? 1.1
    : 1.3;
