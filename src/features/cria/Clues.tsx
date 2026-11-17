import { useEffect, useState } from 'react';
import { Animated, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text, useTheme } from '@/design-system';
import type { CriaPosition } from '@/data/cria/types';
import { useReduceMotion } from '@/hooks/useReduceMotion';

import { ATTRIBUTE_ORDER, clueSpeech, type Clue, type ClueStatus } from './compare';
import { COUNTRY_NAME, Flag } from './Flag';

/**
 * Tentativas do Quem é o Cria?: grade de quadrados, uma linha de seis pistas por palpite e
 * o nome das colunas no topo, para ler cada atributo de cima para baixo (layout escolhido
 * nos prints de docs/quem-e-o-cria/screens/layout/).
 */

export interface GuessView {
  playerId: string;
  name: string;
  period: string;
  clues: Clue[];
}

export const MAX_GUESSES = 5;

const POS_SHORT: Record<CriaPosition, string> = {
  Goleiro: 'GOL',
  Zagueiro: 'ZAG',
  Lateral: 'LAT',
  Volante: 'VOL',
  Meia: 'MEI',
  Atacante: 'ATA',
};

/** Atraso entre uma pista e a seguinte na revelação. */
const STEP_MS = 90;
const FLIP_MS = 220;
const GAP = 4;

export function useClueColors(status: ClueStatus) {
  const { colors } = useTheme();
  // Texto sobre verde e amarelo: a cor do fundo da tela (escura no tema escuro, clara no claro).
  if (status === 'exact') return { bg: colors.success, fg: colors.bgCanvas };
  if (status === 'close') return { bg: colors.warning, fg: colors.bgCanvas };
  return { bg: colors.bgRaised2, fg: colors.inkPrimary };
}

export function Arrow({ dir, color, size = 10 }: { dir: 'up' | 'down'; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10" accessible={false}>
      <Path
        d={dir === 'up' ? 'M5 1 L9 6 H6.4 V9 H3.6 V6 H1 Z' : 'M5 9 L9 4 H6.4 V1 H3.6 V4 H1 Z'}
        fill={color}
      />
    </Svg>
  );
}

const displayValue = (c: Clue) =>
  c.attr === 'position' ? POS_SHORT[c.value as CriaPosition] : String(c.value);

const speechValue = (c: Clue) =>
  c.attr === 'nationality' ? (COUNTRY_NAME[c.value as string] ?? String(c.value)) : String(c.value);

/** Rótulo curto de cada coluna. */
const COLUMN: Record<Clue['attr'], string> = {
  position: 'Pos',
  nationality: 'País',
  arrivalYear: 'Chegou',
  goals: 'Gols',
  matches: 'Jogos',
  titles: 'Títulos',
};

/** Uma pista num quadrado: valor no centro, seta no canto. */
export function ClueCell({ clue, size }: { clue: Clue; size: number }) {
  const { radius } = useTheme();
  const { bg, fg } = useClueColors(clue.status);
  return (
    <View
      accessible
      accessibilityLabel={clueSpeech(clue, speechValue(clue))}
      style={{
        width: size,
        height: size,
        borderRadius: radius.s,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {clue.attr === 'nationality' ? (
        <View style={{ alignItems: 'center', gap: 3 }}>
          <View style={{ borderRadius: 2, overflow: 'hidden' }}>
            <Flag code={String(clue.value)} width={22} />
          </View>
          <Text variant="labelTab" style={{ color: fg }}>
            {String(clue.value)}
          </Text>
        </View>
      ) : (
        <Text variant="numericTable" style={{ color: fg, fontSize: 16 }} numberOfLines={1}>
          {displayValue(clue)}
        </Text>
      )}
      {clue.arrow && (
        <View style={{ position: 'absolute', top: 5, right: 5 }}>
          <Arrow dir={clue.arrow} color={fg} size={9} />
        </View>
      )}
    </View>
  );
}

/** Quadrado que vira (ou só aparece, com "reduzir movimento") depois de `delay`. */
function RevealCell({
  clue,
  size,
  delay,
  animate,
}: {
  clue: Clue;
  size: number;
  delay: number;
  animate: boolean;
}) {
  const reduceMotion = useReduceMotion();
  const [t] = useState(() => new Animated.Value(animate ? 0 : 1));
  useEffect(() => {
    if (!animate) return;
    Animated.timing(t, {
      toValue: 1,
      duration: reduceMotion ? 120 : FLIP_MS,
      delay: reduceMotion ? 0 : delay,
      useNativeDriver: true,
    }).start();
  }, [animate, delay, reduceMotion, t]);
  const style = reduceMotion
    ? { opacity: t }
    : {
        opacity: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
        transform: [
          { perspective: 600 },
          { rotateX: t.interpolate({ inputRange: [0, 1], outputRange: ['90deg', '0deg'] }) },
        ],
      };
  return (
    <Animated.View style={style}>
      <ClueCell clue={clue} size={size} />
    </Animated.View>
  );
}

/** Quanto dura a revelação de uma linha inteira (para mostrar o fim só depois). */
export const REVEAL_TOTAL_MS = STEP_MS * 5 + FLIP_MS;

/** Largura útil medida: os seis quadrados ocupam a linha toda em qualquer celular. */
function useCellSize() {
  const [w, setW] = useState(0);
  return [w ? (w - GAP * 5) / 6 : 0, (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)] as const;
}

function ColumnHeader({ size }: { size: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: GAP }} importantForAccessibility="no-hide-descendants">
      {ATTRIBUTE_ORDER.map((a) => (
        <Text key={a} variant="labelTab" tone="tertiary" align="center" style={{ width: size }}>
          {COLUMN[a]}
        </Text>
      ))}
    </View>
  );
}

function RowName({ guess, title }: { guess: GuessView; title?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
      {title && (
        <Text variant="overline" tone="secondary">
          {title}
        </Text>
      )}
      <Text variant="titleS" numberOfLines={1} style={{ flexShrink: 1 }}>
        {guess.name}
      </Text>
      <Text variant="bodyS" tone="tertiary">
        {guess.period}
      </Text>
    </View>
  );
}

function CluesRow({ guess, size, animate }: { guess: GuessView; size: number; animate: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: GAP }}>
      {guess.clues.map((c, i) => (
        <RevealCell key={c.attr} clue={c} size={size} delay={i * STEP_MS} animate={animate} />
      ))}
    </View>
  );
}

/** Uma linha avulsa com o cabeçalho das colunas (exemplo das regras, Cria revelado). */
export function GuessRow({ guess, title }: { guess: GuessView; title?: string }) {
  const [size, onLayout] = useCellSize();
  return (
    <View
      onLayout={onLayout}
      style={{ gap: 8 }}
      accessibilityLabel={title ? `${title}: ${guess.name}` : guess.name}
    >
      {size > 0 && (
        <>
          <ColumnHeader size={size} />
          <RowName guess={guess} title={title} />
          <CluesRow guess={guess} size={size} animate={false} />
        </>
      )}
    </View>
  );
}

/** A grade inteira: cabeçalho, palpites e as linhas que faltam (vazias, numeradas). */
export function GuessGrid({
  guesses,
  animateLast,
  showEmpty = true,
}: {
  guesses: GuessView[];
  animateLast?: boolean;
  /** Linhas vazias das tentativas que faltam (some quando a partida acaba). */
  showEmpty?: boolean;
}) {
  const { colors, radius } = useTheme();
  const [size, onLayout] = useCellSize();
  const empty = showEmpty ? Math.max(0, MAX_GUESSES - guesses.length) : 0;
  return (
    <View onLayout={onLayout} style={{ gap: 12 }}>
      {size > 0 && (
        <>
          <ColumnHeader size={size} />
          {guesses.map((g, i) => (
            <View key={g.playerId} style={{ gap: 6 }} accessibilityLabel={`Tentativa ${i + 1}, ${g.name}`}>
              <RowName guess={g} />
              <CluesRow guess={g} size={size} animate={!!animateLast && i === guesses.length - 1} />
            </View>
          ))}
          {Array.from({ length: empty }, (_, i) => (
            <View key={`vazia-${i}`} style={{ gap: 6 }} importantForAccessibility="no-hide-descendants">
              <View style={{ height: 22, justifyContent: 'center' }}>
                <Text variant="bodyS" tone="tertiary">
                  {guesses.length + i + 1}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: GAP }}>
                {ATTRIBUTE_ORDER.map((a) => (
                  <View
                    key={a}
                    style={{
                      width: size,
                      height: size,
                      borderRadius: radius.s,
                      borderWidth: 1,
                      borderColor: colors.lineHairline,
                    }}
                  />
                ))}
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}
