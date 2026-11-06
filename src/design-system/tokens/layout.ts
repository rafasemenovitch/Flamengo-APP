import { Easing } from 'react-native';

/** Espaçamento, base 4 (especificação, seção 6). */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  x20: 20,
  xl: 24,
  xxl: 32,
  /** Entre seções da Home e das abas. */
  xxxl: 48,
  x64: 64,
  /** Padding inferior extra em telas com o FAB. */
  x96: 96,
} as const;

/** Nada acima de 16px, exceto círculos. Botões com raio 12 (não são pílulas). */
export const radius = {
  none: 0,
  s: 8,
  m: 12,
  l: 16,
  full: 9999,
  /** @deprecated apelidos da 1ª versão */
  xs: 8,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 16,
  pill: 9999,
} as const;

export const layout = {
  gutter: 20,
  minTouch: 44,
  maxContentWidth: 600,
  fabSize: 56,
  tabBarHeight: 60,
} as const;

const standard = Easing.bezier(0.2, 0, 0, 1);

export const motion = {
  duration: {
    fast: 160,
    base: 260,
    slow: 420,
    live: 1600,
    celebrate: 900,
    reduced: 120,
    instant: 100,
    pulse: 1600,
  },
  easing: {
    standard,
    slow: Easing.bezier(0.3, 0, 0, 1),
    decelerate: standard,
    inOut: Easing.inOut(Easing.ease),
  },
  pressScale: 0.97,
} as const;

/** Sem sombras em cards e listas; só FAB e bottom sheet. */
export const elevation = {
  none: {},
  card: {},
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
} as const;
