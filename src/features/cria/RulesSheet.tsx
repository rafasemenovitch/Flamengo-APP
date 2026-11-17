import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text, useTheme } from '@/design-system';
import { CRIA_PLAYERS } from '@/data/cria/players';

import { Arrow, GuessBlock, useClueColors, type GuessView } from './Clues';
import {
  ATTRIBUTE_LABEL,
  ATTRIBUTE_ORDER,
  RULES_TEXT,
  compare,
  toAttributes,
  type ClueStatus,
} from './compare';
import { periodLabel } from './search';

/** Exemplo real: o secreto é o Gabigol e o palpite foi Bebeto. */
function example(): GuessView | null {
  const guess = CRIA_PLAYERS.find((p) => p.id === 'bebeto');
  const secret = CRIA_PLAYERS.find((p) => p.id === 'gabigol');
  if (!guess || !secret) return null;
  return {
    playerId: guess.id,
    name: guess.name,
    period: periodLabel(guess),
    clues: compare(toAttributes(guess), toAttributes(secret)),
  };
}

function Swatch({ status, label }: { status: ClueStatus; label: string }) {
  const { bg } = useClueColors(status);
  const { colors, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: radius.s / 2,
          backgroundColor: bg,
          // o cinza é quase o fundo do modal: um fio para ele aparecer
          borderWidth: status === 'far' ? 1 : 0,
          borderColor: colors.lineStrong,
        }}
      />
      <Text variant="bodyM">{label}</Text>
    </View>
  );
}

export function RulesSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, layout, radius } = useTheme();
  const ex = example();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}
        onPress={onClose}
        accessible={false}
      >
        <Pressable onPress={() => undefined} accessible={false} style={{ maxHeight: '92%' }}>
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
                alignSelf: 'center',
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.lineHairline,
                marginTop: 8,
              }}
            />
            <ScrollView contentContainerStyle={{ padding: layout.gutter, gap: 24 }}>
              <View style={{ gap: 8 }}>
                <Text variant="displayM" accessibilityRole="header">
                  Como jogar
                </Text>
                <Text variant="bodyM" tone="secondary">
                  Um jogador da história do Flamengo por dia, o mesmo para todo mundo. Você tem 5 palpites. A
                  cada um, as pistas dizem o quanto você chegou perto.
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                <Swatch status="exact" label="Igual ao do Cria" />
                <Swatch status="close" label="Perto" />
                <Swatch status="far" label="Longe ou diferente" />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 18, alignItems: 'center' }}>
                    <Arrow dir="up" color={colors.inkPrimary} size={12} />
                  </View>
                  <Text variant="bodyM">O Cria tem mais (ou chegou depois)</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 18, alignItems: 'center' }}>
                    <Arrow dir="down" color={colors.inkPrimary} size={12} />
                  </View>
                  <Text variant="bodyM">O Cria tem menos (ou chegou antes)</Text>
                </View>
              </View>

              {ex && (
                <View style={{ gap: 10 }}>
                  <Text variant="overline" tone="secondary">
                    Exemplo: o Cria é o Gabigol
                  </Text>
                  <GuessBlock guess={ex} title="Palpite" />
                  <Text variant="bodyS" tone="secondary">
                    Mesma posição e mesmo país. Bebeto marcou menos gols, mas perto; jogou mais, também perto;
                    chegou bem antes e ganhou bem menos títulos.
                  </Text>
                </View>
              )}

              <View style={{ gap: 12 }}>
                {ATTRIBUTE_ORDER.map((a) => (
                  <View key={a} style={{ gap: 2 }}>
                    <Text variant="titleS">{ATTRIBUTE_LABEL[a]}</Text>
                    <Text variant="bodyS" tone="secondary">
                      {RULES_TEXT[a]}
                    </Text>
                  </View>
                ))}
              </View>

              <Text variant="bodyS" tone="tertiary">
                Um Cria novo à meia-noite, horário de Brasília. Quem ainda está no elenco entra com os números
                do dia do desafio.
              </Text>

              <Button label="Entendi" onPress={onClose} fullWidth />
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
