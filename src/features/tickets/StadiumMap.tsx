import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import Svg, { Ellipse, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { useTheme, withAlpha } from '@/design-system';
import type { FacilityType, Stadium } from '@/types/stadium';

const CX = 50;
const CY = 50;
const RINGS = { lower: [27, 36], upper: [37.5, 46] } as const;
/** Estádio oval: achata o eixo vertical. */
const SY = 0.86;

function point(angleDeg: number, r: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a) * SY] as const;
}

function sectorPath(start: number, end: number, r0: number, r1: number) {
  const e = end <= start ? end + 360 : end;
  const steps = 16;
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const ang = start + ((e - start) * i) / steps;
    const [ox, oy] = point(ang, r1);
    const [ix, iy] = point(ang, r0);
    outer.push(`${ox.toFixed(2)},${oy.toFixed(2)}`);
    inner.unshift(`${ix.toFixed(2)},${iy.toFixed(2)}`);
  }
  return `M${outer.join(' L')} L${inner.join(' L')} Z`;
}

const FACILITY_ICON: Record<FacilityType, keyof typeof Ionicons.glyphMap> = {
  restroom: 'male-female',
  food: 'fast-food',
  store: 'bag-handle',
  'first-aid': 'medkit',
  accessibility: 'accessibility',
  atm: 'cash',
};

/**
 * Mapa ESQUEMÁTICO próprio do estádio (não é planta oficial): setores em
 * dois anéis, gramado, portões e serviços. Setores são tocáveis.
 */
export function StadiumMap({
  stadium,
  highlightSectorId,
  highlightGateId,
  onSectorPress,
  showFacilities,
  height = 300,
}: {
  stadium: Stadium;
  highlightSectorId?: string;
  highlightGateId?: string;
  onSectorPress?: (sectorId: string) => void;
  showFacilities?: boolean;
  height?: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ height, aspectRatio: 1, alignSelf: 'center' }} accessible accessibilityLabel={`Mapa esquemático do ${stadium.name}${highlightSectorId ? `, setor ${stadium.sectors.find((s) => s.id === highlightSectorId)?.name} destacado` : ''}`}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        {stadium.sectors.map((s) => {
          const [r0, r1] = RINGS[s.ring];
          const active = s.id === highlightSectorId;
          const isAway = s.id === 'visitante';
          return (
            <Path
              key={s.id}
              d={sectorPath(s.arc[0], s.arc[1], r0, r1)}
              fill={active ? colors.primary : isAway ? withAlpha(colors.textTertiary, 0.35) : withAlpha(colors.primary, 0.22)}
              stroke={colors.background}
              strokeWidth={0.8}
              onPress={onSectorPress ? () => onSectorPress(s.id) : undefined}
            />
          );
        })}
        {/* Gramado */}
        <Ellipse cx={CX} cy={CY} rx={25} ry={25 * SY} fill={withAlpha(colors.success, 0.18)} />
        <Rect x={35} y={37} width={30} height={26} rx={1} fill="none" stroke={withAlpha(colors.success, 0.7)} strokeWidth={0.5} />
        <Line x1={50} y1={37} x2={50} y2={63} stroke={withAlpha(colors.success, 0.7)} strokeWidth={0.5} />
        {stadium.sectors
          .filter((s) => s.ring === 'lower')
          .map((s) => {
            const e = s.arc[1] <= s.arc[0] ? s.arc[1] + 360 : s.arc[1];
            const [x, y] = point((s.arc[0] + e) / 2, 31.5);
            return (
              <SvgText key={`l-${s.id}`} x={x} y={y + 1} fontSize={3} fill={s.id === highlightSectorId ? colors.onPrimary : colors.textSecondary} textAnchor="middle" fontWeight="bold">
                {s.name.split(' ')[0]!.toUpperCase()}
              </SvgText>
            );
          })}
      </Svg>
      {/* Portões e serviços como Views por cima (ícones nativos) */}
      {stadium.gates.map((g) => {
        const active = g.id === highlightGateId;
        return (
          <View
            key={g.id}
            style={{
              position: 'absolute',
              left: `${g.x}%`,
              top: `${g.y}%`,
              width: 22,
              height: 22,
              marginLeft: -11,
              marginTop: -11,
              borderRadius: 11,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? colors.primary : colors.surfaceElevated,
              borderWidth: 1.5,
              borderColor: active ? colors.onPrimary : colors.borderStrong,
            }}
          >
            <SvgLabel text={g.id} color={active ? colors.onPrimary : colors.textPrimary} />
          </View>
        );
      })}
      {showFacilities &&
        stadium.facilities.map((f) => (
          <View
            key={f.id}
            style={{ position: 'absolute', left: `${f.x}%`, top: `${f.y}%`, width: 18, height: 18, marginLeft: -9, marginTop: -9, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }}
          >
            <Ionicons name={FACILITY_ICON[f.type]} size={10} color={colors.textSecondary} />
          </View>
        ))}
    </View>
  );
}

function SvgLabel({ text, color }: { text: string; color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <SvgText x={11} y={15} fontSize={11} fontWeight="bold" fill={color} textAnchor="middle">
        {text}
      </SvgText>
    </Svg>
  );
}

export { FACILITY_ICON };
