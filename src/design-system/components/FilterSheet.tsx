import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';
import { Text } from './Text';

export interface FilterGroup {
  key: string;
  title: string;
  options: { key: string; label: string }[];
}

export type FilterValues = Record<string, string>;

/**
 * Filtros no padrão de loja online: um botão "Filtros" (com quantos estão
 * ativos) abre uma folha com os grupos; nada muda até tocar em "Mostrar".
 */
export function FilterBar({
  groups,
  value,
  defaults,
  onApply,
  count,
  countLabel,
}: {
  groups: FilterGroup[];
  value: FilterValues;
  defaults: FilterValues;
  onApply: (v: FilterValues) => void;
  /** Quantos resultados um conjunto de filtros daria (para o botão "Mostrar N"). */
  count?: (v: FilterValues) => number;
  /** Ex.: (n) => `${n} notícias` */
  countLabel?: (n: number) => string;
}) {
  const { colors, layout, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterValues>(value);
  const active = groups.filter((g) => value[g.key] !== defaults[g.key]);
  const summary = active
    .map((g) => g.options.find((o) => o.key === value[g.key])?.label)
    .filter(Boolean)
    .join(', ');
  const draftCount = count?.(draft);

  const show = () => {
    setDraft(value);
    setOpen(true);
  };

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: layout.gutter,
        }}
      >
        <Pressable
          onPress={show}
          accessibilityRole="button"
          accessibilityLabel={`Filtros${active.length ? `, ${active.length} ativos` : ''}`}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 40,
            paddingHorizontal: 14,
            borderRadius: radius.s,
            borderWidth: 1,
            borderColor: active.length ? colors.inkPrimary : colors.lineStrong,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="options-outline" size={18} color={colors.inkPrimary} />
          <Text variant="labelM">Filtros</Text>
          {active.length > 0 && (
            <View
              style={{
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                paddingHorizontal: 5,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="labelTab" style={{ color: colors.inkOnRed }}>
                {active.length}
              </Text>
            </View>
          )}
        </Pressable>
        <Text variant="bodyS" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
          {summary || (count && countLabel ? countLabel(count(value)) : '')}
        </Text>
        {active.length > 0 && (
          <Pressable onPress={() => onApply(defaults)} accessibilityRole="button" hitSlop={8}>
            <Text variant="labelM" tone="brand">
              Limpar
            </Text>
          </Pressable>
        )}
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}
          onPress={() => setOpen(false)}
          accessible={false}
        >
          <Pressable onPress={() => undefined} accessible={false} style={{ maxHeight: '85%' }}>
            <SafeAreaView
              edges={['bottom']}
              style={{
                backgroundColor: colors.bgRaised,
                borderTopLeftRadius: radius.l,
                borderTopRightRadius: radius.l,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: layout.gutter,
                  paddingTop: 20,
                  paddingBottom: 8,
                }}
              >
                <Text variant="displayS">Filtros</Text>
                <Pressable
                  onPress={() => setOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                  hitSlop={12}
                >
                  <Ionicons name="close" size={24} color={colors.inkPrimary} />
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
                {groups.map((g) => (
                  <View key={g.key} style={{ marginTop: 20 }}>
                    <Text variant="titleS" style={{ paddingHorizontal: layout.gutter, marginBottom: 4 }}>
                      {g.title}
                    </Text>
                    {g.options.map((o) => {
                      const on = draft[g.key] === o.key;
                      return (
                        <Pressable
                          key={o.key}
                          onPress={() => setDraft((d) => ({ ...d, [g.key]: o.key }))}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: on }}
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: 48,
                            paddingHorizontal: layout.gutter,
                            backgroundColor: pressed ? colors.bgRaised2 : 'transparent',
                          })}
                        >
                          <Text variant="bodyL" tone={on ? 'primary' : 'secondary'}>
                            {o.label}
                          </Text>
                          <Ionicons
                            name={on ? 'radio-button-on' : 'radio-button-off'}
                            size={22}
                            color={on ? colors.accentText : colors.inkTertiary}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  padding: layout.gutter,
                  borderTopWidth: 1,
                  borderColor: colors.lineHairline,
                }}
              >
                <Button
                  label="Limpar"
                  variant="secondary"
                  onPress={() => setDraft(defaults)}
                  style={{ flex: 1 }}
                />
                <Button
                  label={draftCount === undefined ? 'Aplicar' : `Mostrar ${draftCount}`}
                  disabled={draftCount === 0}
                  onPress={() => {
                    onApply(draft);
                    setOpen(false);
                  }}
                  style={{ flex: 1.6 }}
                />
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
