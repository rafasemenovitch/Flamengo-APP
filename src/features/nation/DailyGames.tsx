import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { PressableScale, SectionTitle, Text, useTheme } from '@/design-system';
import { nextResetAt } from '@/features/cria/dates';
import { MAX_GUESSES } from '@/features/cria/Clues';
import { useCriaStatus } from '@/features/cria/useCriaStatus';
import { useAsync } from '@/hooks/useAsync';
import { useCountdown } from '@/hooks/useCountdown';
import { services } from '@/services';
import { haptic } from '@/utils/haptics';
import { pad2 } from '@/utils/format';

/**
 * "Jogos do dia" na Nação: Quem é o Cria?, Quiz Diário e um terceiro jogo que ainda vem.
 * Carrossel horizontal: no iPhone SE cabem dois cards e meio, e a sobra mostra que há mais.
 */

const CARD_W = 152;
const CARD_H = 168;
const GAP = 10;

/** Desenho do Cria: a camisa com a interrogação no peito. */
function CriaGlyph({ color }: { color: string }) {
  return (
    <Svg width={34} height={34} viewBox="0 0 34 34" accessible={false}>
      <Path
        d="M11 4 L4 8 L6.5 14 L9.5 12.6 V30 H24.5 V12.6 L27.5 14 L30 8 L23 4 C22 6.6 19.8 8 17 8 C14.2 8 12 6.6 11 4 Z"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M14.6 16.4 C14.6 14.9 15.7 14 17 14 C18.4 14 19.4 14.9 19.4 16.1 C19.4 17.6 17 17.9 17 19.8"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={17} cy={23.4} r={1.3} fill={color} />
    </Svg>
  );
}

/** Desenho do Quiz: as quatro alternativas em grade, uma marcada. */
function QuizGlyph({ color, mark }: { color: string; mark: string }) {
  return (
    <Svg width={34} height={34} viewBox="0 0 34 34" accessible={false}>
      <Rect x={3} y={5} width={13} height={11} rx={2.5} fill="none" stroke={color} strokeWidth={2} />
      <Rect x={18} y={5} width={13} height={11} rx={2.5} fill={mark} />
      <Rect x={3} y={18} width={13} height={11} rx={2.5} fill="none" stroke={color} strokeWidth={2} />
      <Rect x={18} y={18} width={13} height={11} rx={2.5} fill="none" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

/** Desenho do jogo que vem: um lugar ainda vazio, tracejado. */
function SoonGlyph({ color }: { color: string }) {
  return (
    <Svg width={34} height={34} viewBox="0 0 34 34" accessible={false}>
      <Rect
        x={4}
        y={4}
        width={26}
        height={26}
        rx={5}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray="4 4"
      />
    </Svg>
  );
}

function GameCard({
  glyph,
  name,
  status,
  detail,
  onPress,
  label,
  disabled,
  highlight,
}: {
  glyph: ReactNode;
  name: string;
  status: string;
  detail?: string;
  onPress: () => void;
  label: string;
  disabled?: boolean;
  /** Ação pendente hoje: o status vem em vermelho. */
  highlight?: boolean;
}) {
  const { colors, radius } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: radius.l,
        backgroundColor: colors.bgRaised,
        padding: 16,
        justifyContent: 'space-between',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {glyph}
      <View style={{ gap: 4 }}>
        <Text variant="displayS" numberOfLines={2}>
          {name}
        </Text>
        <Text variant="labelM" tone={highlight ? 'brand' : 'secondary'} numberOfLines={1}>
          {status}
        </Text>
        {detail && (
          <Text variant="bodyS" tone="tertiary" numberOfLines={1}>
            {detail}
          </Text>
        )}
      </View>
    </PressableScale>
  );
}

function useNextCria() {
  const left = useCountdown(new Date(nextResetAt()).toISOString());
  return left ? `${pad2(left.hours)}:${pad2(left.minutes)}` : '';
}

export function DailyGames() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { colors, layout } = useTheme();
  const cria = useCriaStatus();
  const next = useNextCria();
  const quiz = useAsync(() => services.gamification.getDailyQuiz(), [isFocused]);

  const criaStatus =
    cria.state === 'novo'
      ? 'Jogar'
      : cria.state === 'andamento'
        ? `Em andamento · ${cria.guesses}/${MAX_GUESSES}`
        : cria.won
          ? `Acertou em ${cria.guesses}`
          : 'Não foi hoje';
  const answered = quiz.data?.answered;
  const quizStatus = !quiz.data ? ' ' : !answered ? 'Responder' : answered.correct ? 'Acertou' : 'Errou';

  return (
    <View>
      <SectionTitle title="Jogos do dia" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + GAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: GAP }}
      >
        <GameCard
          glyph={<CriaGlyph color={colors.inkPrimary} />}
          name="Quem é o Cria?"
          status={criaStatus}
          detail={cria.state === 'fim' ? `Próximo em ${next}` : undefined}
          highlight={cria.state !== 'fim'}
          label={`Quem é o Cria?, ${criaStatus}${cria.state === 'fim' ? `, próximo em ${next}` : ''}`}
          onPress={() => navigation.navigate('Cria')}
        />
        <GameCard
          glyph={<QuizGlyph color={colors.inkPrimary} mark={answered ? colors.inkPrimary : colors.accent} />}
          name="Quiz Diário"
          status={quizStatus}
          highlight={!!quiz.data && !answered}
          label={`Quiz Diário, ${quizStatus}`}
          onPress={() => navigation.navigate('DailyQuiz')}
        />
        <GameCard
          glyph={<SoonGlyph color={colors.inkTertiary} />}
          name="Novo jogo"
          status="Em breve"
          disabled
          label="Novo jogo, em breve"
          onPress={() => haptic.select()}
        />
      </ScrollView>
    </View>
  );
}
