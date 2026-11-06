import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { ThemeColors } from '../tokens/colors';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'solidBrand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'live'
  | 'demo'
  | 'onMedia';

function toneColors(tone: BadgeTone, c: ThemeColors) {
  switch (tone) {
    case 'solidBrand':
    case 'live':
      return { bg: c.accent, fg: c.inkOnRed };
    case 'demo':
    case 'warning':
      return { bg: c.warningBg, fg: c.warning };
    case 'onMedia':
      return { bg: 'rgba(10,10,11,0.7)', fg: c.inkOnRed };
    case 'success':
      return { bg: c.bgRaised2, fg: c.success };
    case 'danger':
    case 'brand':
      return { bg: c.bgRaised2, fg: c.accentText };
    default:
      return { bg: c.bgRaised2, fg: c.inkSecondary };
  }
}

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

/**
 * Selo pequeno (raio 8, 20px). Regra: no máximo 1 selo por objeto; pontos
 * ("+10 pts") são TEXTO vermelho, não selo.
 */
export function Badge({ label, tone = 'neutral', icon, style }: BadgeProps) {
  const { colors, radius } = useTheme();
  const { bg, fg } = toneColors(tone, colors);
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderRadius: radius.s }, style]}>
      {icon && <Ionicons name={icon} size={12} color={fg} />}
      <Text variant="overline" style={{ color: fg, fontSize: 10, lineHeight: 12, letterSpacing: 0.6 }}>
        {label}
      </Text>
    </View>
  );
}

/** Selo DEMO (especificação 12.16): tudo que é simulado. Máximo 1 por objeto. */
export function DemoBadge({ style, label = 'Demo' }: { style?: StyleProp<ViewStyle>; label?: string }) {
  return (
    <View accessible accessibilityLabel="Conteúdo demonstrativo, sem validade real">
      <Badge label={label} tone="demo" icon="flask-outline" style={style} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 20,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
  },
});
