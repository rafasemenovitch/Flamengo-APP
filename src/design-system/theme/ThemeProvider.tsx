import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from '../tokens/colors';
import { elevation, layout, motion, radius, spacing } from '../tokens/layout';
import {
  fontSets,
  typographySets,
  type FontFamilies,
  type TypeSet,
  type Typography,
} from '../tokens/typography';

/** 'dark' é o padrão do produto (dia de jogo, estádio à noite). */
export type ThemePreference = 'dark' | 'light' | 'system';
export type ColorScheme = 'dark' | 'light';

export interface Theme {
  scheme: ColorScheme;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  layout: typeof layout;
  motion: typeof motion;
  elevation: typeof elevation;
  typography: Typography;
  /** Famílias do conjunto ativo, para quem precisa de `fontFamily` direto (SVG, inputs). */
  fonts: FontFamilies;
  typeSet: TypeSet;
}

interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  typeSet: TypeSet;
  setTypeSet: (set: TypeSet) => void;
}

const STORAGE_KEY = '@flamengo/theme-preference';
const DEFAULT_PREFERENCE: ThemePreference = 'dark';
const TYPE_SET_KEY = '@flamengo/type-set';
/** Teste tipográfico: 'sport' (Barlow Condensed + Manrope) ou 'classic' (Anybody + Schibsted). */
export const DEFAULT_TYPE_SET: TypeSet = 'sport';

export function buildTheme(scheme: ColorScheme, typeSet: TypeSet = DEFAULT_TYPE_SET): Theme {
  return {
    scheme,
    colors: scheme === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    layout,
    motion,
    elevation,
    typography: typographySets[typeSet],
    fonts: fontSets[typeSet],
    typeSet,
  };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_PREFERENCE);
  const [typeSet, setTypeSetState] = useState<TypeSet>(DEFAULT_TYPE_SET);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'dark' || stored === 'light' || stored === 'system') setPreferenceState(stored);
      })
      .catch(() => undefined);
    AsyncStorage.getItem(TYPE_SET_KEY)
      .then((stored) => {
        if (stored === 'classic' || stored === 'sport') setTypeSetState(stored);
      })
      .catch(() => undefined);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme: ColorScheme =
      preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;
    return {
      theme: buildTheme(scheme, typeSet),
      preference,
      typeSet,
      setTypeSet: (set) => {
        setTypeSetState(set);
        AsyncStorage.setItem(TYPE_SET_KEY, set).catch(() => undefined);
      },
      setPreference: (pref) => {
        setPreferenceState(pref);
        AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => undefined);
      },
    };
  }, [preference, systemScheme, typeSet]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme precisa estar dentro de <ThemeProvider>.');
  return ctx;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}

export function useThemePreference() {
  const { preference, setPreference } = useThemeContext();
  return { preference, setPreference };
}

/** Troca de tipografia (teste A/B visual): Configurações → Aparência e controles da demo. */
export function useTypeSet() {
  const { typeSet, setTypeSet } = useThemeContext();
  return { typeSet, setTypeSet };
}
