import { Ionicons } from '@expo/vector-icons';
import { Children, type ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  /** Ícone de linha de 20px, SEM fundo colorido (regra anti-template). */
  icon?: keyof typeof Ionicons.glyphMap;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  /** Linha grande (72px), usada nas entradas da Nação. */
  large?: boolean;
}

/** Linha de lista (especificação 12.16). */
export function ListItem({
  title,
  subtitle,
  icon,
  leading,
  trailing,
  onPress,
  chevron,
  destructive,
  large,
}: ListItemProps) {
  const { colors, layout } = useTheme();
  const showChevron = chevron ?? !!onPress;
  const fg = destructive ? colors.danger : colors.inkPrimary;

  const content = (
    <View
      style={{
        minHeight: large ? 72 : 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: layout.gutter,
        paddingVertical: 12,
      }}
    >
      {leading ??
        (icon && (
          <Ionicons name={icon} size={20} color={destructive ? colors.danger : colors.inkSecondary} />
        ))}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant={large ? 'titleM' : 'titleS'} style={{ color: fg }} numberOfLines={2}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="bodyS" tone="secondary" numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
      {showChevron && <Ionicons name="chevron-forward" size={16} color={colors.inkTertiary} />}
    </View>
  );

  if (!onPress) return content;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      scaleTo={0.99}
    >
      {content}
    </PressableScale>
  );
}

/** Grupo de linhas aberto no fundo (sem card), com hairlines recuadas 20px. */
export function ListGroup({ children }: { children: ReactNode }) {
  const { colors, layout } = useTheme();
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.lineHairline }}>
      {items.map((child, i) => (
        <View key={i}>
          {i > 0 && (
            <View style={{ height: 1, backgroundColor: colors.lineHairline, marginLeft: layout.gutter }} />
          )}
          {child}
        </View>
      ))}
    </View>
  );
}
