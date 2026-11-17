import { Share, View } from 'react-native';

import { Button, Mascot, Text, useTheme } from '@/design-system';
import { useCountdown } from '@/hooks/useCountdown';
import type { CriaGame } from '@/services/adapters/DailyGameService';
import { pad2 } from '@/utils/format';
import { haptic } from '@/utils/haptics';

import { GuessRow } from './Clues';
import { challengeNumber, nextResetAt } from './dates';
import { shareText } from './share';

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

/** Fim da partida: vitória ou derrota, o Cria revelado, compartilhar e o próximo desafio. */
export function ResultBlock({
  game,
  newDay,
  onPlayNewDay,
}: {
  game: CriaGame;
  /** Já existe um desafio novo (o dia virou com a tela aberta). */
  newDay: string | null;
  onPlayNewDay: () => void;
}) {
  const { colors, radius } = useTheme();
  const won = game.status === 'venceu';
  const n = game.rows.length;

  const share = async () => {
    haptic.select();
    await Share.share({ message: shareText(game) }).catch(() => undefined);
  };

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ gap: 20, paddingTop: 24, borderTopWidth: 1, borderColor: colors.lineHairline }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text variant="displayM">{won ? winLine(n) : 'Não foi hoje.'}</Text>
          <Text variant="bodyM" tone="secondary">
            {won ? `O Cria era ${game.secret?.name}.` : 'Amanhã tem outro. Seguimos juntos.'}
          </Text>
        </View>
        <Mascot pose={won ? (n === 1 ? 'fan-high-five' : 'fan-victory') : 'fan-defeat'} size={96} />
      </View>

      {!won && game.secret && (
        <View style={{ padding: 16, borderRadius: radius.l, backgroundColor: colors.bgRaised }}>
          <GuessRow guess={game.secret} title="O Cria" />
        </View>
      )}

      <Button label="Compartilhar" onPress={share} fullWidth />

      {newDay ? (
        <View style={{ gap: 12 }}>
          <Text variant="titleM">Já tem Cria novo.</Text>
          <Button
            label={`Jogar o #${challengeNumber(newDay)}`}
            variant="secondary"
            onPress={onPlayNewDay}
            fullWidth
          />
        </View>
      ) : (
        <NextCountdown />
      )}
    </View>
  );
}
