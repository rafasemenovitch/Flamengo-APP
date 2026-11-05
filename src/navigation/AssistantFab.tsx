import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

import { PressableScale, useTheme } from '@/design-system';

/**
 * Botão flutuante do Assistente Fla. Fica ACIMA da tab bar, alinhado à
 * direita — nunca cobre a navegação; as telas de aba reservam espaço no fim
 * do scroll (Screen reserveFab) para não esconder conteúdo.
 */
export function AssistantFab({ bottom, onPress }: { bottom: number; onPress: () => void }) {
  const { colors, layout, elevation } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel="Abrir Assistente Fla"
      accessibilityHint="Tire dúvidas sobre jogos, ingressos, estádio e sócio"
      scaleTo={0.92}
      style={[
        styles.fab,
        elevation.floating,
        {
          bottom,
          right: layout.gutter,
          width: layout.fabSize,
          height: layout.fabSize,
          borderRadius: layout.fabSize / 2,
          backgroundColor: colors.primary,
          borderColor: colors.background,
        },
      ]}
    >
      <Ionicons name="chatbubble-ellipses" size={24} color={colors.onPrimary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
