import { Pressable, View } from 'react-native';

import { Text, useTheme } from '@/design-system';
import { useDemoLocation } from '@/hooks/useMatch';
import { IS_DEMO, type DemoLocation } from '@/services';
import { haptic } from '@/utils/haptics';

const GATES = ['A', 'B', 'C', 'D', 'E', 'F'];

const same = (a: DemoLocation, b: DemoLocation) =>
  a.kind === b.kind && (a.kind !== 'gate' || (b.kind === 'gate' && a.id === b.id));

/**
 * Painel de demonstração: onde o celular "está" no Modo Maracanã. Serve para apresentar
 * o app longe do estádio. Mesmo desenho do controle Sócio / Não sócio.
 */
export function DemoLocationPicker() {
  const { colors, radius } = useTheme();
  const [value, set] = useDemoLocation();
  if (!IS_DEMO) return null;

  const option = (loc: DemoLocation, label: string, flex = 1) => {
    const on = same(loc, value);
    return (
      <Pressable
        key={label}
        onPress={() => {
          haptic.select();
          set(loc);
        }}
        accessibilityRole="radio"
        accessibilityState={{ selected: on }}
        accessibilityLabel={loc.kind === 'gate' ? `No Portão ${loc.id}` : label}
        style={{
          flex,
          height: 44,
          borderRadius: radius.s,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: on ? colors.inkPrimary : 'transparent',
          borderWidth: on ? 0 : 1,
          borderColor: colors.lineHairline,
        }}
      >
        <Text
          variant={loc.kind === 'gate' ? 'displayS' : 'labelM'}
          style={{ color: on ? colors.bgCanvas : colors.inkSecondary }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={{ gap: 8 }}>
      <Text variant="titleL">Simular localização</Text>
      <Text variant="bodyS" tone="secondary">
        Onde o celular aparece no Modo Maracanã.
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {option({ kind: 'real' }, 'GPS real')}
        {option({ kind: 'seat' }, 'No meu setor')}
        {option({ kind: 'outside' }, 'Fora')}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {GATES.map((id) => option({ kind: 'gate', id }, id))}
      </View>
    </View>
  );
}
