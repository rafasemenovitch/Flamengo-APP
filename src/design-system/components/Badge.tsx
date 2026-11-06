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
    case 'neutral':
      return { bg: c.surfaceMuted, fg: c.textSecondary };
    case 'brand':
      return { bg: c.primarySubtle, fg: c.primaryText };
    case 'solidBrand':
      return { bg: c.primary, fg: c.onPrimary };
    case 'success':
      return { bg: c.successSubtle, fg: c.success };
    case 'warning':
      return { bg: c.warningSubtle, fg: c.warning };
    case 'danger':
      return { bg: c.dangerSubtle, fg: c.danger };
    case 'info':
      return { bg: c.infoSubtle, fg: c.info };
    case 'live':
      return { bg: c.live, fg: c.onPrimary };
    case 'demo':
      return { bg: c.demoSubtle, fg: c.demo };
    case 'onMedia':
      return { bg: 'rgba(0,0,0,0.45)', fg: c.textOnMedia };
  }
}

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

/** Pílula de status (evolução do StatusPill do Zuno). */
export function Badge({ label, tone = 'neutral', icon, style }: BadgeProps) {
  const { colors, radius } = useTheme();
  const { bg, fg } = toneColors(tone, colors);
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderRadius: radius.pill }, style]}>
      {icon && <Ionicons name={icon} size={12} color={fg} />}
      <Text variant="overline" style={{ color: fg, fontSize: 10, letterSpacing: 0.8 }}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Selo obrigatório em tudo que é simulado (ingressos, QR, carteirinha,
 * checkout, pagamentos, benefícios, placares simulados).
 */
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
});
