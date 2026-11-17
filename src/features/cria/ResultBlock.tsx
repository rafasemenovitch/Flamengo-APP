import { View } from 'react-native';

import { Mascot, Text, useTheme } from '@/design-system';
import { useCountdown } from '@/hooks/useCountdown';
import { pad2 } from '@/utils/format';

import { GuessBlock, type GuessView } from './Clues';
import { nextResetAt } from './dates';

/** Frase da vitória pelo número de palpites: curta, de arquibancada. */
function winLine(n: number) {
  if (n === 1) return 'De primeira. Isso é cria.';
  if (n === 2) return 'Em dois. Olho de olheiro.';
  if (n === 5) return 'No último lance.';
  return `Acertou em ${n}.`;
}

export function NextCountdown() {
  const left = useCountdown(new Date(nextResetAt()).toISOString());
  const text = left ? `${pad2(left.hours)}:${pad2(left.minutes)}:${pad2(left.seconds)}` : '--:--:--';
  return (
    <View
      style={{ gap: 2 }}
      accessible
      accessibilityLabel={`Próximo Cria em ${left?.hours ?? 0} horas e ${left?.minutes ?? 0} minutos`}
    >
      <Text variant="bodyS" tone="secondary">
        Próximo Cria em
      </Text>
      <Text variant="displayM">{text}</Text>
    </View>
  );
}

/** Fim da partida: vitória ou derrota, o Cria revelado e a contagem para o próximo. */
export function ResultBlock({
  won,
  guesses,
  secret,
}: {
  won: boolean;
  guesses: number;
  /** O Cria do dia como bloco todo verde (mostrado na derrota). */
  secret: GuessView;
}) {
  const { colors, radius } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ gap: 20, paddingTop: 24, borderTopWidth: 1, borderColor: colors.lineHairline }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text variant="displayM">{won ? winLine(guesses) : 'Não foi hoje.'}</Text>
          <Text variant="bodyM" tone="secondary">
            {won ? `O Cria era ${secret.name}.` : 'Amanhã tem outro. Seguimos juntos.'}
          </Text>
        </View>
        <Mascot pose={won ? (guesses === 1 ? 'fan-high-five' : 'fan-victory') : 'fan-defeat'} size={96} />
      </View>

      {!won && (
        <View style={{ padding: 16, borderRadius: radius.l, backgroundColor: colors.bgRaised }}>
          <GuessBlock guess={secret} title="O Cria" />
        </View>
      )}

      <NextCountdown />
    </View>
  );
}
