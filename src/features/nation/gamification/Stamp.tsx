import { Image, View } from 'react-native';
import Svg, { Circle, Defs, Path, Polygon, Text as SvgText, TextPath } from 'react-native-svg';

import { brandAssets } from '@assets/brand';
import { fonts, useTheme, withAlpha } from '@/design-system';
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

/**
 * Carimbo do Passaporte: aro duplo com o nome da competição e a data,
 * o CRF no centro e o placar. Vitória em vermelho, empate em branco,
 * derrota apagada. Cada carimbo sai levemente torto e com falhas de tinta.
 */
export function Stamp({ stamp, size }: { stamp: PassportStamp; size: number }) {
  const { colors } = useTheme();
  const rnd = seeded(stamp.id);
  const rotate = (rnd() - 0.5) * 18;
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
        <Defs>
          <Path id={`top-${stamp.id}`} d="M 20 100 A 80 80 0 0 1 180 100" />
          <Path id={`bot-${stamp.id}`} d="M 11 100 A 89 89 0 0 0 189 100" />
        </Defs>
        <Circle cx={100} cy={100} r={95} stroke={ink} strokeWidth={5} fill="none" />
        <Circle cx={100} cy={100} r={73} stroke={ink} strokeWidth={1.6} fill="none" />
        <SvgText fill={ink} fontFamily={fonts.bold} fontSize={12.5} letterSpacing={1.6}>
          <TextPath href={`#top-${stamp.id}`} startOffset="50%" textAnchor="middle">
            {top}
          </TextPath>
        </SvgText>
        <SvgText fill={ink} fontFamily={fonts.bold} fontSize={12.5} letterSpacing={2}>
          <TextPath href={`#bot-${stamp.id}`} startOffset="50%" textAnchor="middle">
            {date}
          </TextPath>
        </SvgText>
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
  const { colors } = useTheme();
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
