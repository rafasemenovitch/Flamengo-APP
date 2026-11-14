import { Ionicons } from '@expo/vector-icons';
import { Pressable, Switch, View } from 'react-native';

import { Button, Text, useTheme } from '@/design-system';
import type { Step } from '@/services/stadium/routing';
import type { PoiCategory } from '@/services/stadium/types';
import { CategoryMark } from './SheetParts';

/**
 * Caminho até um ponto: o tempo a pé em destaque (número em Anybody, como os números do
 * app), a chave "Sem escadas" e os passos numerados. Tocar num passo mostra o nível dele.
 */
export function RouteView({
  title,
  category,
  minutes,
  meters,
  origin,
  accessible,
  onAccessible,
  steps,
  onStep,
  onClose,
}: {
  title: string;
  category: PoiCategory;
  minutes: number;
  meters: number;
  origin: string;
  accessible: boolean;
  onAccessible: (v: boolean) => void;
  steps: Step[];
  onStep: (s: Step) => void;
  onClose: () => void;
}) {
  const { colors, layout } = useTheme();
  const numbered = steps.filter((s) => s.kind !== 'start');
  return (
    <View>
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: layout.gutter, gap: 12 }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="overline" tone="tertiary">
            Caminho até
          </Text>
          <Text variant="displayM" accessibilityRole="header">
            {title}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Encerrar rota"
          style={{ width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={24} color={colors.inkPrimary} />
        </Pressable>
      </View>

      <View
        accessible
        accessibilityLabel={`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} a pé, ${Math.round(meters)} metros. ${origin}`}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 12,
          paddingHorizontal: layout.gutter,
          marginTop: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text variant="displayXl">{minutes}</Text>
          <Text variant="titleM">min</Text>
        </View>
        <Text variant="bodyS" tone="secondary" style={{ flex: 1, paddingBottom: 6 }}>
          {Math.round(meters / 10) * 10} m a pé{'\n'}
          {origin}
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginHorizontal: layout.gutter,
          marginTop: 18,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.lineHairline,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="titleS">Sem escadas</Text>
          <Text variant="bodyS" tone="secondary">
            Só rampas e elevadores
          </Text>
        </View>
        <Switch
          value={accessible}
          onValueChange={onAccessible}
          accessibilityLabel="Sem escadas, só rampas e elevadores"
          trackColor={{ true: colors.accent, false: colors.bgRaised2 }}
          thumbColor="#FFFFFF"
          // Na web (react-native-web) a cor do botão ligado é outra propriedade.
          {...({ activeThumbColor: '#FFFFFF' } as object)}
          ios_backgroundColor={colors.bgRaised2}
        />
      </View>

      <View style={{ marginTop: 4 }}>
        {numbered.map((s, i) => {
          const last = s.kind === 'arrive';
          return (
            <Pressable
              key={`${i}-${s.text}`}
              onPress={() => onStep(s)}
              disabled={!s.level}
              accessibilityRole="button"
              accessibilityLabel={`Passo ${i + 1}: ${s.text}${s.meters ? `, ${Math.round(s.meters)} metros` : ''}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                minHeight: 56,
                paddingVertical: 8,
                paddingHorizontal: layout.gutter,
                borderBottomWidth: last ? 0 : 1,
                borderColor: colors.lineHairline,
                backgroundColor: pressed ? colors.bgRaised2 : 'transparent',
              })}
            >
              {last ? (
                <CategoryMark category={category} size={28} />
              ) : (
                <Text variant="displayS" tone="tertiary" style={{ width: 28, textAlign: 'center' }}>
                  {i + 1}
                </Text>
              )}
              <Text variant={last ? 'titleS' : 'bodyL'} style={{ flex: 1 }}>
                {s.text}
              </Text>
              {!!s.meters && <Text variant="numericTable">{Math.round(s.meters / 10) * 10} m</Text>}
            </Pressable>
          );
        })}
      </View>

      <View style={{ paddingHorizontal: layout.gutter, marginTop: 16 }}>
        <Button label="Encerrar rota" variant="secondary" onPress={onClose} fullWidth />
      </View>
    </View>
  );
}
