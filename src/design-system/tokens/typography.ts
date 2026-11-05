import type { TextStyle } from 'react-native';

/**
 * Inter para leitura (interface, textos) e Barlow Condensed para títulos,
 * placares e números grandes — condensada, esportiva e séria.
 * Arquivos em assets/fonts (licença OFL), carregados em App.tsx.
 */
export const fontFiles = {
  Inter_400Regular: require('../../../assets/fonts/Inter_400Regular.ttf'),
  Inter_500Medium: require('../../../assets/fonts/Inter_500Medium.ttf'),
  Inter_600SemiBold: require('../../../assets/fonts/Inter_600SemiBold.ttf'),
  Inter_700Bold: require('../../../assets/fonts/Inter_700Bold.ttf'),
  BarlowCondensed_600SemiBold: require('../../../assets/fonts/BarlowCondensed_600SemiBold.ttf'),
  BarlowCondensed_700Bold: require('../../../assets/fonts/BarlowCondensed_700Bold.ttf'),
  BarlowCondensed_800ExtraBold: require('../../../assets/fonts/BarlowCondensed_800ExtraBold.ttf'),
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  displaySemibold: 'BarlowCondensed_600SemiBold',
  display: 'BarlowCondensed_700Bold',
  displayHeavy: 'BarlowCondensed_800ExtraBold',
} as const;

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

/** Escala tipográfica. Telas usam `<Text variant="...">`, nunca fontSize solto. */
export const typography = {
  /** Placar grande do card hero. */
  score: { fontFamily: fonts.displayHeavy, fontSize: 56, lineHeight: 60, fontVariant: tabular },
  /** Números de destaque (contagem regressiva, pontos). */
  number: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, fontVariant: tabular },
  numberSm: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, fontVariant: tabular },
  display: { fontFamily: fonts.displayHeavy, fontSize: 36, lineHeight: 40, letterSpacing: 0.2 },
  h1: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: 0.2 },
  h2: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, letterSpacing: 0.2 },
  h3: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24 },
  title: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  callout: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  footnote: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 16 },
  overline: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  tabular: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, fontVariant: tabular },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
