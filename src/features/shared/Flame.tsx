import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/design-system';

/**
 * Foguinho do pé quente: chama desenhada (vermelho com miolo claro), no
 * lugar do ícone genérico. Apagada quando a sequência está zerada.
 */
export function Flame({ size = 28, off = false }: { size?: number; off?: boolean }) {
  const { colors } = useTheme();
  return (
    <View accessible={false} style={{ width: size, height: size * 1.2 }}>
      <Svg width={size} height={size * 1.2} viewBox="0 0 40 48">
        <Path
          d="M21.5 1.5c1.6 7.4-2.3 11.4-6.2 15.6C11.6 21.1 7 25.6 7 32.4 7 40.4 12.9 46.5 20.4 46.5S34 40.6 34 32.9c0-5.3-2.3-9.4-5.1-12.4-.2 3.6-1.7 6.1-4.2 7.3 1.4-9.4-.5-19.2-3.2-26.3z"
          fill={off ? colors.inkTertiary : colors.accent}
        />
        <Path
          d="M20.6 46.5c-4.6 0-7.8-3.4-7.8-7.6 0-3.9 2.5-6.3 4.7-8.5 1.3-1.3 2.3-2.7 2.6-4.5 3.4 2.6 6.2 6.7 6.2 11.6 0 5.2-2.6 9-5.7 9z"
          fill={off ? colors.bgRaised2 : colors.accentText}
        />
        {!off && (
          <Path
            d="M20.7 46.5c-2 0-3.4-1.6-3.4-3.6 0-1.9 1.1-3 2.1-4 .5-.5.9-1.1 1.1-1.9 1.6 1.2 2.8 3 2.8 5.2 0 2.5-1.1 4.3-2.6 4.3z"
            fill={colors.inkOnRed}
          />
        )}
      </Svg>
    </View>
  );
}
