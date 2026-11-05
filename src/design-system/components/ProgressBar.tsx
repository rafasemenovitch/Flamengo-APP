import { View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

/** Barra de progresso (0–1). Usada em níveis, medalhas, enquetes e estatísticas. */
export function ProgressBar({ value, color, height = 8, track }: { value: number; color?: string; height?: number; track?: string }) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={{ height, borderRadius: height / 2, backgroundColor: track ?? colors.surfaceMuted, overflow: 'hidden' }}
    >
      <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: height / 2, backgroundColor: color ?? colors.primary }} />
    </View>
  );
}
