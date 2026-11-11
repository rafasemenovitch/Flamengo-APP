import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  /** Obrigatório: botão só com ícone precisa de rótulo para leitor de tela. */
  accessibilityLabel: string;
  onPress: () => void;
  variant?: 'surface' | 'plain' | 'onMedia';
  /** Número no canto (ex.: notificações não lidas). */
  badgeCount?: number;
  style?: StyleProp<ViewStyle>;
}

/** Botão de ícone com alvo de 44×44 (o Zuno usava 36px + hitSlop). */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'surface',
  badgeCount,
  style,
}: IconButtonProps) {
  const { colors, fonts, layout } = useTheme();
  const bg =
    variant === 'surface' ? colors.surfaceMuted : variant === 'onMedia' ? 'rgba(0,0,0,0.35)' : 'transparent';
  const fg = variant === 'onMedia' ? colors.textOnMedia : colors.textPrimary;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={badgeCount ? `${accessibilityLabel}, ${badgeCount} não lidas` : accessibilityLabel}
      style={[
        styles.base,
        {
          width: layout.minTouch,
          height: layout.minTouch,
          borderRadius: layout.minTouch / 2,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={22} color={fg} />
      {!!badgeCount && badgeCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
          <Text variant="footnote" tone="onPrimary" style={[styles.badgeText, { fontFamily: fonts.bold }]}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, lineHeight: 12 },
});
