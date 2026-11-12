import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, View } from 'react-native';

import { Button, ErrorState, Text, useTheme } from '@/design-system';

/**
 * Cortina sobre o mapa enquanto ele abre e, se não abrir, o erro com "Tentar de novo".
 * Some com um esmaecer curto (instantâneo com "reduzir movimento"). Sem mascote: tela utilitária.
 */
export function MapCurtain({
  visible,
  error,
  onRetry,
  reduced,
}: {
  visible: boolean;
  error: boolean;
  onRetry: () => void;
  reduced: boolean;
}) {
  const { colors, motion } = useTheme();
  const [opacity] = useState(() => new Animated.Value(1));
  const show = visible || error;
  useEffect(() => {
    if (show || reduced) {
      opacity.setValue(show ? 1 : 0);
      return;
    }
    Animated.timing(opacity, {
      toValue: 0,
      duration: motion.duration.slow,
      easing: motion.easing.standard,
      useNativeDriver: true,
    }).start();
  }, [show, reduced, opacity, motion]);
  return (
    <Animated.View
      // Depois de aberto, fica transparente e não recebe toques nem leitor de tela.
      pointerEvents={show ? 'auto' : 'none'}
      accessibilityElementsHidden={!show}
      importantForAccessibility={show ? 'auto' : 'no-hide-descendants'}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: colors.bgCanvas,
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
      }}
    >
      {error ? (
        <ErrorState
          title="O mapa não abriu."
          message="Pode ser o celular sem memória livre. Tente de novo."
          onRetry={onRetry}
        />
      ) : (
        <View
          accessible
          accessibilityLabel="Abrindo o mapa do estádio"
          style={{ alignItems: 'center', gap: 14 }}
        >
          <ActivityIndicator color={colors.inkSecondary} />
          <Text variant="bodyM" tone="secondary">
            Abrindo o Maracanã
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

/**
 * Vista do seu lugar: a câmera do mapa está na altura dos olhos de quem senta no setor.
 * Cartão pequeno embaixo, para o campo ficar à vista.
 */
export function SeatCard({
  name,
  level,
  bottom,
  onClose,
}: {
  name: string;
  level?: string;
  bottom: number;
  onClose: () => void;
}) {
  const { colors, layout, radius, elevation } = useTheme();
  return (
    <View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: layout.gutter,
          paddingTop: 18,
          paddingBottom: Math.max(bottom, 16) + 8,
          gap: 4,
          backgroundColor: colors.bgRaised,
          borderTopLeftRadius: radius.l,
          borderTopRightRadius: radius.l,
        },
        elevation.floating,
        { shadowOpacity: 0.18 },
      ]}
    >
      <Text variant="overline" tone="brand">
        Vista aproximada
      </Text>
      <Text variant="displayM" accessibilityRole="header">
        {name}
      </Text>
      <Text variant="bodyS" tone="secondary">
        {level ? `Do meio do setor, nível ${level}. ` : ''}Ângulo calculado pelo modelo, não é foto.
      </Text>
      <Button
        label="Voltar ao mapa"
        variant="secondary"
        onPress={onClose}
        fullWidth
        style={{ marginTop: 14 }}
      />
    </View>
  );
}
