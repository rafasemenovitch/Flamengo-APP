import { View } from 'react-native';

import { Button, Text, useTheme } from '@/design-system';

/**
 * Avisos de localização na folha: explicação antes do pedido, permissão negada, GPS
 * desligado e "fora do Maracanã". Bloco editorial (sobrelinha, título, texto, ação),
 * separado por fio, como as seções das outras telas.
 */
export function LocationNotice({
  overline,
  title,
  body,
  primary,
  secondary,
}: {
  overline: string;
  title: string;
  body?: string;
  primary?: {
    label: string;
    icon?: 'navigate-outline' | 'location-outline' | 'settings-outline';
    onPress: () => void;
  };
  secondary?: { label: string; onPress: () => void };
}) {
  const { colors, layout } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        marginHorizontal: layout.gutter,
        marginTop: 20,
        paddingBottom: 20,
        gap: 6,
        borderBottomWidth: 1,
        borderColor: colors.lineHairline,
      }}
    >
      <Text variant="overline" tone="brand">
        {overline}
      </Text>
      <Text variant="titleL">{title}</Text>
      {body && (
        <Text variant="bodyM" tone="secondary">
          {body}
        </Text>
      )}
      {(primary || secondary) && (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
          {secondary && (
            <Button
              label={secondary.label}
              variant="secondary"
              size="sm"
              onPress={secondary.onPress}
              style={{ flex: 1 }}
            />
          )}
          {primary && (
            <Button
              label={primary.label}
              icon={primary.icon}
              size="sm"
              onPress={primary.onPress}
              style={{ flex: secondary ? 1.4 : 1 }}
            />
          )}
        </View>
      )}
    </View>
  );
}
