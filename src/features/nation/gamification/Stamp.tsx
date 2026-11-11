import { Image, View } from 'react-native';
import Svg, { Circle, G, Polygon, Text as SvgText } from 'react-native-svg';

import { brandAssets } from '@assets/brand';
import { useTheme, withAlpha } from '@/design-system';
import type { PassportStamp } from '@/types/gamification';

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

/** Número estável a partir do id (inclinação e falhas de tinta não mudam entre renders). */
function seeded(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  let x = h >>> 0;
  return () => {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    return x / 4294967296;
  };
}

function star(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`);
  }
  return pts.join(' ');
}

/** Largura aproximada de cada letra (em em) da Schibsted Bold em caixa alta. */
function charWidth(c: string) {
  if (c === ' ' || c === '·') return 0.32;
  if ('IJ1'.includes(c)) return 0.36;
  if ('MW'.includes(c)) return 0.86;
  if ('ÃÁÂÀÉÊÍÓÔÕÚÇ'.includes(c)) return 0.68;
  return 0.66;
}

/**
 * Texto em arco, letra por letra, centrado no topo (ou na base) do carimbo.
 * O textAnchor do TextPath não funciona no react-native-svg; assim a
 * centralização é exata e o carimbo fica simétrico.
 */
function ArcText({
  text,
  radius,
  fill,
  bottom,
  fontSize = 12.5,
  spacing = 1.8,
}: {
  text: string;
  radius: number;
  fill: string;
  bottom?: boolean;
  fontSize?: number;
  spacing?: number;
}) {
  const { fonts } = useTheme();
  const chars = [...text];
  const widths = chars.map((c) => charWidth(c) * fontSize + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  let acc = 0;
  return (
    <G>
      {chars.map((c, i) => {
        const mid = acc + (widths[i]! - spacing) / 2;
        acc += widths[i]!;
        const offset = (mid - total / 2) / radius; // radianos a partir do centro do arco
        const theta = bottom ? Math.PI / 2 - offset : -Math.PI / 2 + offset;
        const x = 100 + radius * Math.cos(theta);
        const y = 100 + radius * Math.sin(theta);
        const deg = (theta * 180) / Math.PI + (bottom ? -90 : 90);
        return (
          <SvgText
            key={i}
            x={x}
            y={y}
            fill={fill}
            fontFamily={fonts.bold}
            fontSize={fontSize}
            textAnchor="middle"
            transform={`rotate(${deg} ${x} ${y})`}
          >
            {c}
          </SvgText>
        );
      })}
    </G>
  );
}

/**
 * Carimbo do Passaporte: aro duplo com o nome da competição e a data,
 * o CRF no centro e o placar. Vitória em vermelho, empate em branco,
 * derrota apagada. Cada carimbo sai levemente torto e com falhas de tinta.
 */
export function Stamp({ stamp, size }: { stamp: PassportStamp; size: number }) {
  const { colors, fonts } = useTheme();
  const rnd = seeded(stamp.id);
  const rotate = (rnd() - 0.5) * 12;
  const ink =
    stamp.result === 'Vitória'
      ? colors.accentText
      : stamp.result === 'Empate'
        ? colors.inkPrimary
        : withAlpha(colors.inkPrimary, 0.28);
  const d = new Date(stamp.date);
  const date = `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const top = `${stamp.competition} · ${stamp.venue}`.toUpperCase();
  const specks = Array.from({ length: 34 }, () => ({
    x: 14 + rnd() * 172,
    y: 14 + rnd() * 172,
    r: 0.8 + rnd() * 2.4,
  }));
  const monogram = brandAssets.monogramWhite;
  const mono = size * 0.34;

  return (
    <View
      accessible
      accessibilityLabel={`${stamp.result}: Flamengo ${stamp.score} ${stamp.opponent}, ${stamp.competition}, ${date}`}
      style={{ width: size, height: size, transform: [{ rotate: `${rotate}deg` }] }}
    >
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Circle cx={100} cy={100} r={95} stroke={ink} strokeWidth={5} fill="none" />
        <Circle cx={100} cy={100} r={73} stroke={ink} strokeWidth={1.6} fill="none" />
        <ArcText text={top} radius={80} fill={ink} />
        <ArcText text={date} radius={89} fill={ink} bottom />
        <Polygon points={star(16, 100, 5)} fill={ink} />
        <Polygon points={star(184, 100, 5)} fill={ink} />
        <SvgText
          x={100}
          y={136}
          fill={ink}
          fontFamily={fonts.displayNormal700}
          fontSize={26}
          textAnchor="middle"
        >
          {stamp.score}
        </SvgText>
        <SvgText
          x={100}
          y={154}
          fill={ink}
          fontFamily={fonts.bold}
          fontSize={11}
          letterSpacing={1.4}
          textAnchor="middle"
        >
          {stamp.opponent.toUpperCase()}
        </SvgText>
      </Svg>
      {monogram && (
        <Image
          source={monogram}
          accessible={false}
          resizeMode="contain"
          style={{
            position: 'absolute',
            left: (size - mono) / 2,
            top: size * 0.2,
            width: mono,
            height: mono * 0.96,
            tintColor: ink,
          }}
        />
      )}
      {/* Falhas de tinta por cima de tudo, na cor do fundo. */}
      <Svg width={size} height={size} viewBox="0 0 200 200" style={{ position: 'absolute' }}>
        {specks.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={colors.bgCanvas} />
        ))}
      </Svg>
    </View>
  );
}

/** Espaço do próximo carimbo: aro tracejado, à espera do jogo. */
export function NextStamp({ size, label, date }: { size: number; label: string; date: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Circle
          cx={100}
          cy={100}
          r={94}
          stroke={colors.inkTertiary}
          strokeWidth={2}
          strokeDasharray="6 7"
          fill="none"
        />
        <SvgText
          x={100}
          y={92}
          fill={colors.inkSecondary}
          fontFamily={fonts.bold}
          fontSize={12}
          letterSpacing={2}
          textAnchor="middle"
        >
          PRÓXIMO CARIMBO
        </SvgText>
        <SvgText
          x={100}
          y={116}
          fill={colors.inkPrimary}
          fontFamily={fonts.semibold}
          fontSize={15}
          textAnchor="middle"
        >
          {label}
        </SvgText>
        <SvgText
          x={100}
          y={136}
          fill={colors.inkTertiary}
          fontFamily={fonts.regular}
          fontSize={12}
          textAnchor="middle"
        >
          {date}
        </SvgText>
      </Svg>
    </View>
  );
}
