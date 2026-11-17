import { useEffect, useState } from 'react';
import { Animated, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text, useTheme } from '@/design-system';
import type { CriaPosition } from '@/data/cria/types';
import { useReduceMotion } from '@/hooks/useReduceMotion';

import { ATTRIBUTE_LABEL, ATTRIBUTE_ORDER, clueSpeech, type Clue, type ClueStatus } from './compare';
import { COUNTRY_NAME, Flag } from './Flag';

/**
 * Tentativas do Quem é o Cria?: um bloco por palpite, com as seis pistas em 3 × 2 e o
 * nome de cada pista dentro da célula (layout escolhido nos prints de
 * docs/quem-e-o-cria/screens/layout/).
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
const CELL_HEIGHT = 64;

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

/** Uma pista: rótulo pequeno em cima, valor em baixo, seta ao lado do número. */
export function ClueCell({ clue, width }: { clue: Clue; width: number }) {
  const { radius } = useTheme();
  const { bg, fg } = useClueColors(clue.status);
  const isNat = clue.attr === 'nationality';
  return (
    <View
      accessible
      accessibilityLabel={clueSpeech(clue, speechValue(clue))}
      style={{
        width,
        height: CELL_HEIGHT,
        borderRadius: radius.s,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <Text variant="labelTab" style={{ color: fg, opacity: 0.72 }}>
        {ATTRIBUTE_LABEL[clue.attr]}
      </Text>
      {isNat ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ borderRadius: 2, overflow: 'hidden' }}>
            <Flag code={String(clue.value)} width={20} />
          </View>
          <Text variant="numericTable" style={{ color: fg, fontSize: 16 }}>
            {String(clue.value)}
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text variant="numericTable" style={{ color: fg, fontSize: 18, lineHeight: 22 }} numberOfLines={1}>
            {displayValue(clue)}
          </Text>
          {clue.arrow && <Arrow dir={clue.arrow} color={fg} />}
        </View>
      )}
    </View>
  );
}

/** Célula que vira (ou só aparece, com "reduzir movimento") depois de `delay`. */
function RevealCell({
  clue,
  width,
  delay,
  animate,
}: {
  clue: Clue;
  width: number;
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
      <ClueCell clue={clue} width={width} />
    </Animated.View>
  );
}

/** Quanto dura a revelação de uma linha inteira (para tocar o som/vibração do fim). */
export const REVEAL_TOTAL_MS = STEP_MS * 5 + FLIP_MS;

function useWidth() {
  const [w, setW] = useState(0);
  return [w, (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)] as const;
}

/** Um bloco: número, nome e período em cima; as seis pistas em 3 × 2. */
export function GuessBlock({
  guess,
  index,
  animate = false,
  title,
}: {
  guess: GuessView;
  index?: number;
  animate?: boolean;
  /** Troca o número da tentativa por um rótulo ("O Cria de hoje"). */
  title?: string;
}) {
  const [w, onLayout] = useWidth();
  const cell = w ? Math.floor((w - GAP * 2) / 3) : 0;
  return (
    <View
      onLayout={onLayout}
      style={{ gap: 8 }}
      accessibilityLabel={title ? `${title}: ${guess.name}` : `Tentativa ${(index ?? 0) + 1}, ${guess.name}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
        {title ? (
          <Text variant="overline" tone="secondary">
            {title}
          </Text>
        ) : (
          <Text variant="displayS" tone="tertiary">
            {(index ?? 0) + 1}
          </Text>
        )}
        <Text variant="titleS" numberOfLines={1} style={{ flex: 1 }}>
          {guess.name}
        </Text>
        <Text variant="bodyS" tone="tertiary">
          {guess.period}
        </Text>
      </View>
      {cell > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
          {guess.clues.map((c, i) => (
            <RevealCell key={c.attr} clue={c} width={cell} delay={i * STEP_MS} animate={animate} />
          ))}
        </View>
      )}
    </View>
  );
}

/** Todas as tentativas; a última recém-chutada entra com a revelação. */
export function GuessBlocks({ guesses, animateLast }: { guesses: GuessView[]; animateLast?: boolean }) {
  return (
    <View style={{ gap: 20 }}>
      {guesses.map((g, i) => (
        <GuessBlock
          key={g.playerId}
          guess={g}
          index={i}
          animate={!!animateLast && i === guesses.length - 1}
        />
      ))}
    </View>
  );
}

/** Antes do primeiro palpite: o Cria de hoje com as seis pistas escondidas. */
export function MysteryBlock() {
  const { colors, radius } = useTheme();
  const [w, onLayout] = useWidth();
  const cell = w ? Math.floor((w - GAP * 2) / 3) : 0;
  return (
    <View
      onLayout={onLayout}
      style={{ gap: 8 }}
      accessible
      accessibilityLabel="O Cria de hoje: seis pistas escondidas"
    >
      <Text variant="overline" tone="secondary">
        O Cria de hoje
      </Text>
      {cell > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
          {ATTRIBUTE_ORDER.map((a) => (
            <View
              key={a}
              style={{
                width: cell,
                height: CELL_HEIGHT,
                borderRadius: radius.s,
                borderWidth: 1,
                borderColor: colors.lineHairline,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Text variant="labelTab" tone="tertiary">
                {ATTRIBUTE_LABEL[a]}
              </Text>
              <Text variant="numericTable" tone="tertiary" style={{ fontSize: 18, lineHeight: 22 }}>
                ?
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
