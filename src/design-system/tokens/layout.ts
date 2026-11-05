import { Easing } from 'react-native';

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Herdado do Zuno: cantos generosos dão a sensação "premium" dos cards. */
export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const layout = {
  /** Margem lateral padrão das telas. */
  gutter: 16,
  /** Alvo de toque mínimo (acessibilidade). */
  minTouch: 44,
  /** Largura máxima de conteúdo em tablets/telas grandes. */
  maxContentWidth: 640,
  fabSize: 56,
} as const;

export const motion = {
  duration: { instant: 100, fast: 160, base: 240, slow: 400, pulse: 1100 },
  easing: {
    standard: Easing.bezier(0.2, 0, 0, 1),
    decelerate: Easing.bezier(0, 0, 0, 1),
    inOut: Easing.inOut(Easing.ease),
  },
  /** Escala aplicada ao pressionar elementos tocáveis. */
  pressScale: 0.97,
} as const;

/** Sombras discretas; no tema escuro a hierarquia vem mais da cor da superfície. */
export const elevation = {
  none: {},
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;
