import { useId } from 'react';
import { Image, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { brandAssets } from '@assets/brand';
import { useTheme, withAlpha } from '@/design-system';
import type { TrophyAward } from '@/types/trophies';
import { TROPHY_CANVAS, hangingMedalHeight } from '@/utils/trophyCabinet';

/** Mantém a tonalidade do metal no CRF, com contraste de uma gravação mais escura. */
function darkerMetal(hex: string, amount = 0.57) {
  const rgb = hex.slice(1).match(/.{2}/g)!;
  return `#${rgb
    .map((channel) =>
      Math.round(parseInt(channel, 16) * amount)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
}

export function TrophyArt({
  award,
  size = 88,
  locked = false,
  hanging = false,
  ribbonLength = 52,
}: {
  award: Pick<TrophyAward, 'kind' | 'tier'>;
  size?: number;
  locked?: boolean;
  hanging?: boolean;
  ribbonLength?: number;
}) {
  const { colors, scheme } = useTheme();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const metal = locked ? colors.inkTertiary : colors[award.tier];
  const ink = darkerMetal(metal);
  const edge = withAlpha(darkerMetal(metal, 0.47), 0.9);
  const shine = scheme === 'dark' ? colors.inkPrimary : colors.bgCanvas;
  const shadow = scheme === 'dark' ? colors.bgCanvas : colors.inkPrimary;
  const ribbon = locked ? colors.inkTertiary : colors.accent;
  const isHanging = hanging && award.kind === 'medal';
  const cy = isHanging ? ribbonLength + 44 : 70;
  const viewHeight = isHanging ? ribbonLength + 82 : TROPHY_CANVAS.height;
  const height = isHanging
    ? hangingMedalHeight(size, ribbonLength)
    : (size * TROPHY_CANVAS.height) / TROPHY_CANVAS.width;
  const emblem =
    award.kind === 'medal'
      ? { x: 36, y: cy - 19, width: 40, height: (40 * 577) / 600 }
      : { x: 39, y: 27, width: 34, height: (34 * 577) / 600 };
  return (
    <View
      pointerEvents="none"
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height }}
    >
      <Svg width={size} height={height} viewBox={`0 0 112 ${viewHeight}`}>
        <Defs>
          <LinearGradient id={`metal-${id}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={ink} />
            <Stop offset="0.2" stopColor={metal} />
            <Stop offset="0.5" stopColor={metal} />
            <Stop offset="0.82" stopColor={metal} />
            <Stop offset="1" stopColor={darkerMetal(metal, 0.75)} />
          </LinearGradient>
        </Defs>
        <G opacity={locked ? 0.38 : 1}>
          {award.kind === 'medal' ? (
            <>
              {isHanging ? (
                <>
                  <Path d={`M23 0h21l22 ${ribbonLength}H47Z`} fill={ribbon} stroke={edge} strokeWidth={1.3} />
                  <Path d={`M68 0h21L66 ${ribbonLength}H47Z`} fill={ribbon} stroke={edge} strokeWidth={1.3} />
                  <Path
                    d={`M30 0l25 ${ribbonLength}M82 0 58 ${ribbonLength}`}
                    stroke={withAlpha(shadow, 0.6)}
                    strokeWidth={5}
                  />
                  <Ellipse
                    cx={56}
                    cy={ribbonLength + 6}
                    rx={10}
                    ry={8}
                    fill="none"
                    stroke={metal}
                    strokeWidth={4}
                  />
                </>
              ) : (
                <>
                  <Path d="M26 8h20l25 44-18 14Z" fill={ribbon} stroke={edge} strokeWidth={2} />
                  <Path d="M66 8h20L60 66 42 52Z" fill={ribbon} stroke={edge} strokeWidth={2} />
                  <Path d="m33 8 23 42M79 8 57 50" stroke={withAlpha(shadow, 0.55)} strokeWidth={6} />
                  <Path d="m50 96-15 19h42L62 96" fill={metal} stroke={edge} strokeWidth={2} />
                  <Path d="M38 115h36" stroke={metal} strokeWidth={4} strokeLinecap="round" />
                </>
              )}
              <Circle cx={56} cy={cy} r={33} fill={`url(#metal-${id})`} stroke={edge} strokeWidth={2.2} />
              <Path d={`M56 ${cy - 33}a33 33 0 0 1 0 66Z`} fill={withAlpha(shadow, 0.1)} />
              <Circle cx={56} cy={cy} r={27} fill="none" stroke={withAlpha(shine, 0.48)} strokeWidth={1.5} />
              <Path
                d={`M31 ${cy - 9}c3-10 11-17 21-18`}
                fill="none"
                stroke={withAlpha(shine, 0.55)}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <Path
                d="M32 23H15v12c0 18 11 23 27 23M80 23h17v12c0 18-11 23-27 23"
                fill="none"
                stroke={edge}
                strokeWidth={11}
                strokeLinejoin="round"
              />
              <Path
                d="M32 23H15v12c0 18 11 23 27 23M80 23h17v12c0 18-11 23-27 23"
                fill="none"
                stroke={metal}
                strokeWidth={7}
                strokeLinejoin="round"
              />
              <Path
                d="M31 14h50v30c0 18-10 27-25 29-15-2-25-11-25-29Z"
                fill={`url(#metal-${id})`}
                stroke={edge}
                strokeWidth={2.4}
              />
              <Path d="M56 15h24v29c0 15-8 24-24 28Z" fill={withAlpha(shadow, 0.1)} />
              <Path
                d="M38 21v18c0 7 2 12 4 14"
                stroke={withAlpha(shine, 0.55)}
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M51 72v17l-11 8h32l-11-8V72"
                fill={`url(#metal-${id})`}
                stroke={edge}
                strokeWidth={2}
              />
              <Path d="M36 96h40l7 12H29Z" fill={metal} stroke={edge} strokeWidth={2} />
              <Rect
                x={28}
                y={107}
                width={56}
                height={10}
                rx={3}
                fill={`url(#metal-${id})`}
                stroke={edge}
                strokeWidth={2}
              />
              <Path d="M35 110h42" stroke={withAlpha(shine, 0.5)} strokeWidth={1.5} strokeLinecap="round" />
              <Path d="M26 14h60" stroke={metal} strokeWidth={5} strokeLinecap="round" />
              <Path d="M30 12h52" stroke={withAlpha(shine, 0.65)} strokeWidth={1.5} strokeLinecap="round" />
            </>
          )}
          {!locked && award.tier === 'gold' && (
            <Path
              d={
                award.kind === 'medal'
                  ? `m91 ${cy - 5} 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z`
                  : 'm91 65 2 5 5 2-5 2-2 5-2-5-5-2 5-2ZM19 82l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5Z'
              }
              fill={metal}
            />
          )}
        </G>
        {locked && (
          <G transform={`translate(76 ${isHanging ? cy + 12 : 88})`}>
            <Rect
              x={0}
              y={7}
              width={19}
              height={16}
              rx={4}
              fill={colors.bgCanvas}
              stroke={colors.inkSecondary}
              strokeWidth={1.6}
            />
            <Path
              d="M4 7V2a5.5 5.5 0 0 1 11 0v5"
              fill="none"
              stroke={colors.inkSecondary}
              strokeWidth={1.6}
            />
            <Circle cx={9.5} cy={14} r={1.5} fill={colors.inkSecondary} />
          </G>
        )}
      </Svg>
      {!!brandAssets.monogramWhite && (
        <Image
          source={brandAssets.monogramWhite}
          resizeMode="contain"
          accessible={false}
          style={{
            position: 'absolute',
            left: (size * emblem.x) / 112,
            top: (size * emblem.y) / 112,
            width: (size * emblem.width) / 112,
            height: (size * emblem.height) / 112,
            tintColor: ink,
            opacity: locked ? 0.38 : 1,
          }}
        />
      )}
    </View>
  );
}

export function ShelfRail() {
  const { colors } = useTheme();
  return (
    <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height={12} viewBox="0 0 100 12" preserveAspectRatio="none">
        <Path d="M0 0h100v5H0Z" fill={colors.lineHairline} />
        <Path d="M0 5h100v5H0Z" fill={colors.bgRaised2} />
        <Path d="M0 1h100" stroke={withAlpha(colors.inkTertiary, 0.6)} strokeWidth={1} />
        <Path d="M0 11h100" stroke={colors.lineHairline} strokeWidth={1} />
      </Svg>
    </View>
  );
}
