import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { Button, Crest, Mascot, Skeleton, Text, useTheme, withAlpha } from '@/design-system';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { Poll, PollOption, Prediction, Quiz } from '@/types/gamification';
import type { Match } from '@/types/match';
import { formatNumber } from '@/utils/format';
import { haptic } from '@/utils/haptics';

function StepButton({
  icon,
  onPress,
  label,
}: {
  icon: 'add' | 'remove';
  onPress: () => void;
  label: string;
}) {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptic.select();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: radius.m,
        backgroundColor: colors.bgRaised2,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={colors.inkPrimary} />
    </Pressable>
  );
}

/** Palpite (especificação 12.14): objeto bgRaised, números display.xl, − e + de 44px. */
export function PredictionCard({ match }: { match: Match }) {
  const { colors, radius } = useTheme();
  const { refreshProgress } = useAppState();
  const [saved, setSaved] = useState<Prediction | null | undefined>(undefined);
  const [home, setHome] = useState(2);
  const [away, setAway] = useState(0);
  const [saving, setSaving] = useState(false);
  const locked = match.status !== 'scheduled';

  useEffect(() => {
    services.gamification.getPrediction(match.id).then((p) => {
      setSaved(p);
      if (p) {
        setHome(p.home);
        setAway(p.away);
      }
    });
  }, [match.id]);

  const submit = async () => {
    setSaving(true);
    try {
      setSaved(await services.gamification.submitPrediction(match.id, home, away));
      haptic.success();
      refreshProgress();
    } finally {
      setSaving(false);
    }
  };

  if (saved === undefined) return <Skeleton height={300} radius={radius.l} />;

  const side = (team: Match['homeTeam'], value: number, set: (n: number) => void) => (
    <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
      <Crest team={team} size={40} />
      <Text variant="titleS" numberOfLines={1}>
        {team.shortName}
      </Text>
      {!locked && (
        <StepButton
          icon="add"
          label={`Mais um gol para ${team.shortName}`}
          onPress={() => set(Math.min(9, value + 1))}
        />
      )}
      <Text variant="displayXl" accessibilityLabel={`${value} gols para ${team.shortName}`}>
        {value}
      </Text>
      {!locked && (
        <StepButton
          icon="remove"
          label={`Menos um gol para ${team.shortName}`}
          onPress={() => set(Math.max(0, value - 1))}
        />
      )}
    </View>
  );

  return (
    <View style={{ backgroundColor: colors.bgRaised, borderRadius: radius.l, padding: 20, gap: 20 }}>
      <View style={styles.between}>
        <Text variant="titleM">Seu palpite</Text>
        <Text variant="labelM" tone="brand">
          +10 pts
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {side(match.homeTeam, home, setHome)}
        <Text variant="displayM" tone="tertiary">
          ×
        </Text>
        {side(match.awayTeam, away, setAway)}
      </View>
      {locked ? (
        <Text variant="bodyM" tone="secondary" align="center">
          {saved
            ? 'Palpite registrado. Os pontos saem ao fim do jogo.'
            : 'Palpites encerrados para este jogo.'}
        </Text>
      ) : (
        <Button
          label={saved ? 'Atualizar palpite' : 'Confirmar palpite'}
          onPress={submit}
          loading={saving}
          fullWidth
        />
      )}
      <Text variant="bodyS" tone="tertiary" align="center">
        Pontos virtuais do programa de fidelidade. Não envolve dinheiro nem apostas.
      </Text>
    </View>
  );
}

function PollOptionRow({
  option,
  pct,
  voted,
  mine,
  onPress,
}: {
  option: PollOption;
  pct: number;
  voted: boolean;
  mine: boolean;
  onPress: () => void;
}) {
  const { colors, radius, motion } = useTheme();
  const reduceMotion = useReduceMotion();
  const fill = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (!voted) return;
    Animated.timing(fill, {
      toValue: pct,
      duration: reduceMotion ? 0 : motion.duration.slow,
      easing: motion.easing.slow,
      useNativeDriver: false,
    }).start();
  }, [voted, pct, fill, reduceMotion, motion]);
  return (
    <Pressable
      disabled={voted}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={voted ? `${option.label}, ${Math.round(pct * 100)}%` : `Votar em ${option.label}`}
      accessibilityState={{ selected: mine, disabled: voted }}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: radius.m,
        backgroundColor: colors.bgRaised2,
        overflow: 'hidden',
        justifyContent: 'center',
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {voted && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: mine ? withAlpha(colors.accent, 0.35) : withAlpha(colors.inkPrimary, 0.1),
            },
          ]}
        />
      )}
      <View style={[styles.between, { paddingHorizontal: 16 }]}>
        <Text variant="titleS">{option.label}</Text>
        {voted && <Text variant="numericTable">{Math.round(pct * 100)}%</Text>}
      </View>
    </Pressable>
  );
}

/** Enquete (especificação 12.13). */
export function PollCard({ pollId, onVoted }: { pollId?: string; onVoted?: () => void }) {
  const { radius } = useTheme();
  const { refreshProgress } = useAppState();
  const [poll, setPoll] = useState<Poll>();

  useEffect(() => {
    services.gamification.getPoll(pollId).then(setPoll);
  }, [pollId]);

  if (!poll) return <Skeleton height={280} radius={radius.l} />;
  const total = poll.options.reduce((s, o) => s + o.votes, 0);
  const voted = !!poll.userVoteId;

  const vote = async (optionId: string) => {
    haptic.select();
    setPoll(await services.gamification.vote(poll.id, optionId));
    refreshProgress();
    onVoted?.();
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.between}>
        <Text variant="overline" tone="secondary">
          {poll.kind === 'craque-do-jogo' ? 'Craque do jogo' : 'Enquete'}
        </Text>
        <Text variant="bodyS" tone="tertiary">
          {formatNumber(total)} votos
        </Text>
      </View>
      <Text variant="titleL">{poll.question}</Text>
      <View style={{ gap: 8 }}>
        {poll.options.map((o) => (
          <PollOptionRow
            key={o.id}
            option={o}
            pct={total ? o.votes / total : 0}
            voted={voted}
            mine={poll.userVoteId === o.id}
            onPress={() => vote(o.id)}
          />
        ))}
      </View>
      <Text variant="bodyS" tone="secondary">
        {voted ? 'Voto registrado' : '+5 pts ao votar'}
      </Text>
    </View>
  );
}

/** Quiz do dia (especificação 12.14): grade 2×2 de células de 64px. */
export function QuizCard() {
  const { colors, radius } = useTheme();
  const { refreshProgress } = useAppState();
  const [quiz, setQuiz] = useState<Quiz>();

  useEffect(() => {
    services.gamification.getDailyQuiz().then(setQuiz);
  }, []);

  if (!quiz) return <Skeleton height={260} radius={radius.l} />;
  const a = quiz.answered;

  const answer = async (optionId: string) => {
    const answered = await services.gamification.answerQuiz(quiz.id, optionId);
    if (answered.answered?.correct) haptic.success();
    else haptic.select();
    setQuiz(answered);
    refreshProgress();
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.between}>
        <Text variant="overline" tone="secondary">
          Quiz do dia
        </Text>
        <Text variant="labelM" tone="brand">
          +{quiz.points} pts
        </Text>
      </View>
      <Text variant="titleL">{quiz.question}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {quiz.options.map((o) => {
          const isCorrect = a?.correctOptionId === o.id;
          const isWrongPick = !!a && a.optionId === o.id && !a.correct;
          return (
            <Pressable
              key={o.id}
              disabled={!!a}
              onPress={() => answer(o.id)}
              accessibilityRole="button"
              accessibilityLabel={`Resposta ${o.label}${isCorrect ? ', correta' : isWrongPick ? ', errada' : ''}`}
              style={({ pressed }) => ({
                flexBasis: '48%',
                flexGrow: 1,
                height: 64,
                borderRadius: radius.s,
                backgroundColor: colors.bgRaised2,
                borderWidth: isCorrect || isWrongPick ? 1.5 : 0,
                borderColor: isCorrect ? colors.success : colors.danger,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              {isCorrect && <Ionicons name="checkmark" size={18} color={colors.success} />}
              {isWrongPick && <Ionicons name="close" size={18} color={colors.danger} />}
              <Text variant="displayS">{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {a && (
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          {a.correct && <Mascot pose="fan-quiz" size={56} />}
          <Text variant="bodyM" tone="secondary" style={{ flex: 1 }}>
            {a.correct ? `Acertou! +${quiz.points} pts. ` : 'Não foi dessa vez. '}
            {a.explanation}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
