import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text, useTheme } from '@/design-system';
import type { Area, Side } from '@/services/stadium/types';

const SIDES: { side: Side; label: string }[] = [
  { side: 'norte', label: 'Norte' },
  { side: 'sul', label: 'Sul' },
  { side: 'leste', label: 'Leste' },
  { side: 'oeste', label: 'Oeste' },
];

/** "Norte Inferior" → "Inferior"; "Camarotes e Tribuna (Oeste)" → "Camarotes e Tribuna". */
const shortName = (a: Area, sideLabel: string) => {
  const rest = a.name.slice(sideLabel.length + 1);
  if (a.name.startsWith(`${sideLabel} `) && /^(Inferior|Superior)/.test(rest)) return rest;
  return a.name.replace(/\s*\((Oeste|Leste|Norte|Sul)\)$/, '');
};

/**
 * "Onde você está?": lado + faixa (inferior, superior, camarote, premium), na linguagem do
 * ingresso. O bloco do assento é opcional e só serve para escolher o andar certo.
 */
export function AreaPicker({
  visible,
  areas,
  value,
  block,
  onClose,
  onApply,
}: {
  visible: boolean;
  areas: Area[];
  value: string | null;
  block?: string;
  onClose: () => void;
  onApply: (area: string | null, block?: string) => void;
}) {
  const { colors, layout, radius, typography } = useTheme();
  const { height } = useWindowDimensions();
  // O rascunho começa do valor atual a cada abertura (a tela remonta o seletor pela `key`).
  const [draft, setDraft] = useState(value);
  const [draftBlock, setDraftBlock] = useState(block ?? '');

  const area = areas.find((a) => a.id === draft);
  const blockLevel = draftBlock.length === 3 ? draftBlock[0] : undefined;
  const blockOff = !!area && !!blockLevel && !area.levels.includes(blockLevel);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}
        onPress={onClose}
        accessible={false}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable onPress={() => undefined} accessible={false}>
            <SafeAreaView
              edges={['bottom']}
              style={{
                maxHeight: height * 0.9,
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
                }}
              >
                <Text variant="displayS" accessibilityRole="header">
                  Onde você está?
                </Text>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                  hitSlop={12}
                >
                  <Ionicons name="close" size={24} color={colors.inkPrimary} />
                </Pressable>
              </View>
              <Text
                variant="bodyS"
                tone="secondary"
                style={{ paddingHorizontal: layout.gutter, marginTop: 4 }}
              >
                Use o lado e o anel do seu ingresso.
              </Text>
              <ScrollView
                style={{ flexShrink: 1 }}
                contentContainerStyle={{ paddingBottom: 8 }}
                keyboardShouldPersistTaps="handled"
              >
                {SIDES.map(({ side, label }) => (
                  <View key={side} style={{ marginTop: 20 }}>
                    <Text variant="overline" tone="secondary" style={{ paddingHorizontal: layout.gutter }}>
                      {label}
                    </Text>
                    {areas
                      .filter((a) => a.side === side)
                      .map((a) => {
                        const on = draft === a.id;
                        return (
                          <Pressable
                            key={a.id}
                            onPress={() => setDraft(a.id)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: on }}
                            accessibilityLabel={a.name}
                            style={({ pressed }) => ({
                              flexDirection: 'row',
                              alignItems: 'center',
                              minHeight: 48,
                              paddingHorizontal: layout.gutter,
                              gap: 12,
                              backgroundColor: pressed ? colors.bgRaised2 : 'transparent',
                            })}
                          >
                            <Text variant="bodyL" tone={on ? 'primary' : 'secondary'} style={{ flex: 1 }}>
                              {shortName(a, label)}
                            </Text>
                            {a.visitor && (
                              <Text variant="bodyS" tone="tertiary">
                                visitante
                              </Text>
                            )}
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

                <View style={{ marginTop: 24, paddingHorizontal: layout.gutter, gap: 8 }}>
                  <Text variant="overline" tone="secondary">
                    Bloco · opcional
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TextInput
                      value={draftBlock}
                      onChangeText={(t) => setDraftBlock(t.replace(/\D/g, '').slice(0, 3))}
                      keyboardType="number-pad"
                      maxLength={3}
                      placeholder="118"
                      accessibilityLabel="Bloco do assento"
                      placeholderTextColor={colors.inkTertiary}
                      selectionColor={colors.accentText}
                      style={[
                        typography.displayS,
                        {
                          width: 88,
                          height: 48,
                          paddingHorizontal: 14,
                          borderRadius: radius.m,
                          backgroundColor: colors.bgRaised2,
                          color: colors.inkPrimary,
                        },
                      ]}
                    />
                    <Text variant="bodyS" tone={blockOff ? 'danger' : 'secondary'} style={{ flex: 1 }}>
                      {blockOff
                        ? 'Esse bloco não fica nessa área.'
                        : 'Está no ingresso. O primeiro número é o andar.'}
                    </Text>
                  </View>
                </View>
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
                  onPress={() => {
                    onApply(null);
                    onClose();
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Pronto"
                  disabled={!draft}
                  onPress={() => {
                    onApply(draft, blockOff || draftBlock.length < 3 ? undefined : draftBlock);
                    onClose();
                  }}
                  style={{ flex: 1.6 }}
                />
              </View>
            </SafeAreaView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
