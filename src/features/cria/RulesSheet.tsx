import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, Switch, View } from 'react-native';

import { Text, useTheme } from '@/design-system';

import { ClueCell } from './Clues';
import { setHighContrast, useHighContrast } from './contrast';
import type { Clue } from './compare';

/**
 * Regras do Quem é o Cria?: só o necessário, no estilo do Termo. Uma frase e três exemplos
 * de pista; fecha no X ou tocando fora.
 */

const EXAMPLES: { clue: Clue; text: ReactNode }[] = [
  { clue: { attr: 'position', status: 'exact', arrow: null, value: 'Atacante' }, text: 'Igual ao do Cria.' },
  {
    clue: { attr: 'goals', status: 'close', arrow: 'up', value: 151 },
    text: 'Perto. A seta diz se o Cria tem mais ou menos.',
  },
  { clue: { attr: 'arrivalYear', status: 'far', arrow: 'up', value: 1983 }, text: 'Longe ou diferente.' },
];

export function RulesSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, radius } = useTheme();
  const contrast = useHighContrast();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Tocar fora fecha; para o leitor de tela, quem fecha é o X (o fundo não é botão, senão
          o VoiceOver junta a janela inteira num elemento só). */}
      <Pressable
        onPress={onClose}
        accessible={false}
        importantForAccessibility="no"
        style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', padding: 20 }}
      >
        <Pressable
          onPress={() => undefined}
          accessible={false}
          accessibilityViewIsModal
          style={{
            backgroundColor: colors.bgRaised,
            borderRadius: radius.l,
            padding: 24,
            gap: 20,
            maxWidth: 420,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Text variant="titleS" style={{ flex: 1 }}>
              Descubra o Cria em 5 tentativas. Depois de cada palpite, as pistas mostram o quão perto você
              está.
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={12}
              style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginTop: -4 }}
            >
              <Ionicons name="close" size={24} color={colors.inkSecondary} />
            </Pressable>
          </View>

          {EXAMPLES.map(({ clue, text }) => (
            <View key={clue.attr} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <ClueCell clue={clue} size={52} />
              <Text variant="bodyM" style={{ flex: 1 }}>
                {text}
              </Text>
            </View>
          ))}

          <Text variant="bodyS" tone="secondary">
            Gols e jogos contam amistosos. Um Cria novo à meia-noite.
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingTop: 16,
              borderTopWidth: 1,
              borderColor: colors.lineHairline,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text variant="titleS">Alto contraste</Text>
              <Text variant="bodyS" tone="secondary">
                Laranja e azul no lugar de verde e amarelo.
              </Text>
            </View>
            <Switch
              value={contrast}
              onValueChange={(v) => setHighContrast(v)}
              accessibilityLabel="Alto contraste"
              trackColor={{ true: colors.accent, false: colors.bgRaised2 }}
              thumbColor={colors.inkOnRed}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
