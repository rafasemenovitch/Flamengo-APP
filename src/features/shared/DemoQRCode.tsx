import { View } from 'react-native';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';

import { palette, useTheme } from '@/design-system';

const N = 25;

function seeded(payload: string) {
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) h = Math.imul(h ^ payload.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * QR Code DEMONSTRATIVO: padrão visual parecido com QR, gerado a partir do
 * payload, mas NÃO é um QR válido (não é decodificável) e leva marca d'água
 * diagonal "DEMONSTRATIVO" — não pode ser confundido com ingresso real.
 */
export function DemoQRCode({ payload, size = 220 }: { payload: string; size?: number }) {
  const { colors } = useTheme();
  const rnd = seeded(payload);
  const cell = 100 / N;
  const finder = (x: number, y: number) => (
    <G key={`f${x}${y}`}>
      <Rect x={x * cell} y={y * cell} width={7 * cell} height={7 * cell} fill={palette.ink950} />
      <Rect x={(x + 1) * cell} y={(y + 1) * cell} width={5 * cell} height={5 * cell} fill={palette.white} />
      <Rect x={(x + 2) * cell} y={(y + 2) * cell} width={3 * cell} height={3 * cell} fill={palette.ink950} />
    </G>
  );
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
  const cells = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      if (!inFinder(x, y) && rnd() > 0.52)
        cells.push(
          <Rect
            key={`${x}-${y}`}
            x={x * cell}
            y={y * cell}
            width={cell}
            height={cell}
            fill={palette.ink950}
          />
        );

  return (
    <View
      accessible
      accessibilityLabel="QR Code demonstrativo, sem validade como ingresso"
      style={{
        width: size,
        height: size,
        padding: 12,
        backgroundColor: palette.white,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: colors.demo,
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        {cells}
        {finder(0, 0)}
        {finder(N - 7, 0)}
        {finder(0, N - 7)}
        <G rotation={-35} origin="50, 50">
          <Rect x={-10} y={42} width={120} height={16} fill={colors.demo} opacity={0.92} />
          <SvgText
            x={50}
            y={53.5}
            fontSize={8.5}
            fontWeight="bold"
            fill={palette.ink950}
            textAnchor="middle"
            letterSpacing={1.2}
          >
            DEMONSTRATIVO
          </SvgText>
        </G>
      </Svg>
    </View>
  );
}
