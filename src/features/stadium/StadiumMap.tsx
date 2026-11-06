import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import Svg, { Ellipse, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Text, useTheme, withAlpha } from '@/design-system';
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

export const FACILITY_ICON: Record<FacilityType, keyof typeof Ionicons.glyphMap> = {
  restroom: 'male-female',
  food: 'fast-food',
  store: 'bag-handle',
  'first-aid': 'medkit',
  accessibility: 'accessibility',
  atm: 'cash',
};

export const FACILITY_LABEL: Record<FacilityType, string> = {
  restroom: 'Banheiros',
  food: 'Alimentação',
  store: 'Loja',
  'first-aid': 'Saúde',
  accessibility: 'Acessibilidade',
  atm: 'Caixa eletrônico',
};

/**
 * Mapa ESQUEMÁTICO e interativo do estádio (não é planta oficial): setores
 * em dois anéis, gramado, portões e serviços. Tudo tocável.
 */
export function StadiumMap({
  stadium,
  highlightSectorId,
  highlightGateId,
  onSectorPress,
  onGatePress,
  facilityTypes,
  selectedFacilityId,
  onFacilityPress,
  height = 300,
}: {
  stadium: Stadium;
  highlightSectorId?: string;
  highlightGateId?: string;
  onSectorPress?: (sectorId: string) => void;
  onGatePress?: (gateId: string) => void;
  /** Tipos de serviço visíveis (vazio/undefined = nenhum). */
  facilityTypes?: FacilityType[];
  selectedFacilityId?: string;
  onFacilityPress?: (facilityId: string) => void;
  height?: number;
}) {
  const { colors } = useTheme();
  const facilities = stadium.facilities.filter((f) => facilityTypes?.includes(f.type));
  const sectorName = stadium.sectors.find((s) => s.id === highlightSectorId)?.name;

  return (
    <View
      style={{ height, aspectRatio: 1, alignSelf: 'center' }}
      accessibilityLabel={`Mapa esquemático do ${stadium.name}${sectorName ? `, setor ${sectorName} selecionado` : ''}`}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        {stadium.sectors.map((s) => {
          const [r0, r1] = RINGS[s.ring];
          const active = s.id === highlightSectorId;
          const isAway = s.id === 'visitante';
          return (
            <Path
              key={s.id}
              d={sectorPath(s.arc[0], s.arc[1], r0, r1)}
              fill={active ? colors.accent : isAway ? colors.bgRaised : colors.bgRaised2}
              stroke={colors.bgCanvas}
              strokeWidth={0.8}
              onPress={onSectorPress ? () => onSectorPress(s.id) : undefined}
            />
          );
        })}
        <Ellipse cx={CX} cy={CY} rx={25} ry={25 * SY} fill={withAlpha(colors.success, 0.18)} />
        <Rect
          x={35}
          y={37}
          width={30}
          height={26}
          rx={1}
          fill="none"
          stroke={withAlpha(colors.success, 0.7)}
          strokeWidth={0.5}
        />
        <Line x1={50} y1={37} x2={50} y2={63} stroke={withAlpha(colors.success, 0.7)} strokeWidth={0.5} />
        {stadium.sectors
          .filter((s) => s.ring === 'lower')
          .map((s) => {
            const e = s.arc[1] <= s.arc[0] ? s.arc[1] + 360 : s.arc[1];
            const [x, y] = point((s.arc[0] + e) / 2, 31.5);
            return (
              <SvgText
                key={`l-${s.id}`}
                x={x}
                y={y + 1}
                fontSize={3}
                fill={s.id === highlightSectorId ? colors.onPrimary : colors.textSecondary}
                textAnchor="middle"
                fontWeight="bold"
              >
                {s.name.split(' ')[0]!.toUpperCase()}
              </SvgText>
            );
          })}
      </Svg>

      {stadium.gates.map((g) => {
        const active = g.id === highlightGateId;
        return (
          <Pressable
            key={g.id}
            onPress={onGatePress ? () => onGatePress(g.id) : undefined}
            disabled={!onGatePress}
            accessibilityRole="button"
            accessibilityLabel={g.label}
            hitSlop={10}
            style={{
              position: 'absolute',
              left: `${g.x}%`,
              top: `${g.y}%`,
              width: 26,
              height: 26,
              marginLeft: -13,
              marginTop: -13,
              borderRadius: 13,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? colors.primary : colors.surfaceElevated,
              borderWidth: 1.5,
              borderColor: active ? colors.onPrimary : colors.borderStrong,
            }}
          >
            <Text
              variant="label"
              style={{ fontSize: 11, lineHeight: 13, color: active ? colors.onPrimary : colors.textPrimary }}
            >
              {g.id}
            </Text>
          </Pressable>
        );
      })}

      {facilities.map((f) => {
        const sel = f.id === selectedFacilityId;
        return (
          <Pressable
            key={f.id}
            onPress={onFacilityPress ? () => onFacilityPress(f.id) : undefined}
            disabled={!onFacilityPress}
            accessibilityRole="button"
            accessibilityLabel={f.label}
            hitSlop={10}
            style={{
              position: 'absolute',
              left: `${f.x}%`,
              top: `${f.y}%`,
              width: sel ? 30 : 24,
              height: sel ? 30 : 24,
              marginLeft: sel ? -15 : -12,
              marginTop: sel ? -15 : -12,
              borderRadius: 15,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: sel ? colors.textPrimary : colors.surfaceElevated,
              borderWidth: 1,
              borderColor: sel ? colors.textPrimary : colors.border,
            }}
          >
            <Ionicons
              name={FACILITY_ICON[f.type]}
              size={sel ? 15 : 12}
              color={sel ? colors.background : colors.textSecondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
