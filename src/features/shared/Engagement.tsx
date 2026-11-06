import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, ProgressBar, Skeleton, TeamCrest, Text, useTheme } from '@/design-system';
import { services } from '@/services';
import { useAppState } from '@/state/AppStateProvider';
import type { Poll, Prediction, Quiz } from '@/types/gamification';
import type { Match } from '@/types/match';
import { formatNumber } from '@/utils/format';
import { haptic } from '@/utils/haptics';

function Stepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const { colors, spacing, layout } = useTheme();
  const btn = (icon: 'remove' | 'add', delta: number) => (
    <Pressable
      onPress={() => {
        haptic.select();
        onChange(Math.max(0, Math.min(9, value + delta)));
      }}
      accessibilityRole="button"
      accessibilityLabel={`${delta > 0 ? 'Aumentar' : 'Diminuir'} gols de ${label}`}
      style={({ pressed }) => [
        styles.stepBtn,
        {
          width: layout.minTouch,
          height: layout.minTouch,
          backgroundColor: colors.surfaceMuted,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.textPrimary} />
    </Pressable>
  );
  return (
    <View style={{ alignItems: 'center', gap: spacing.xs }}>
      {btn('add', 1)}
      <Text variant="number" accessibilityLabel={`${value} gols para ${label}`}>
        {value}
      </Text>
      {btn('remove', -1)}
    </View>
  );
}

/** Palpite de placar: pontos virtuais, sem nenhuma aposta financeira. */
export function PredictionCard({ match }: { match: Match }) {
  const { spacing } = useTheme();
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

  if (saved === undefined) return <Skeleton height={190} radius={20} />;

  return (
    <Card variant="elevated" padding="lg">
      <View style={{ gap: spacing.lg }}>
        <View style={styles.between}>
          <Text variant="h3">Seu palpite</Text>
          <Badge label="+10 pts" tone="brand" icon="flash" />
        </View>
        <View style={[styles.between, { alignItems: 'center' }]}>
          <View style={{ alignItems: 'center', gap: 6, width: 80 }}>
            <TeamCrest shortName={match.homeTeam.code} color={match.homeTeam.color} size={36} />
            <Text variant="caption" numberOfLines={1}>
              {match.homeTeam.shortName}
            </Text>
          </View>
          {locked ? (
            <Text variant="number">{saved ? `${saved.home} × ${saved.away}` : '—'}</Text>
          ) : (
            <View style={[styles.row, { gap: spacing.lg }]}>
              <Stepper value={home} onChange={setHome} label={match.homeTeam.shortName} />
              <Text variant="h2" tone="tertiary">
                ×
              </Text>
              <Stepper value={away} onChange={setAway} label={match.awayTeam.shortName} />
            </View>
          )}
          <View style={{ alignItems: 'center', gap: 6, width: 80 }}>
            <TeamCrest shortName={match.awayTeam.code} color={match.awayTeam.color} size={36} />
            <Text variant="caption" numberOfLines={1}>
              {match.awayTeam.shortName}
            </Text>
          </View>
        </View>
        {locked ? (
          <Text variant="caption" tone="secondary" align="center">
            {saved
              ? 'Palpite registrado. Os pontos saem ao fim do jogo.'
              : 'Palpites encerrados para este jogo.'}
          </Text>
        ) : (
          <Button
            label={saved ? 'Atualizar palpite' : 'Confirmar palpite'}
            icon={saved ? 'refresh' : 'checkmark'}
            onPress={submit}
            loading={saving}
            fullWidth
          />
        )}
        <Text variant="footnote" tone="tertiary" align="center">
          Pontos virtuais do programa de fidelidade. Não envolve dinheiro nem apostas.
        </Text>
      </View>
    </Card>
  );
}

export function PollCard({ pollId, onVoted }: { pollId?: string; onVoted?: () => void }) {
  const { spacing, colors, radius, layout } = useTheme();
  const { refreshProgress } = useAppState();
  const [poll, setPoll] = useState<Poll>();

  useEffect(() => {
    services.gamification.getPoll(pollId).then(setPoll);
  }, [pollId]);

  if (!poll) return <Skeleton height={200} radius={20} />;
  const total = poll.options.reduce((s, o) => s + o.votes, 0);
  const voted = !!poll.userVoteId;

  const vote = async (optionId: string) => {
    haptic.select();
    setPoll(await services.gamification.vote(poll.id, optionId));
    refreshProgress();
    onVoted?.();
  };

  return (
    <Card variant="elevated" padding="lg">
      <View style={{ gap: spacing.md }}>
        <View style={styles.between}>
          <Badge
            label={poll.kind === 'craque-do-jogo' ? 'Craque do jogo' : 'Enquete'}
            tone="brand"
            icon="stats-chart"
          />
          <Text variant="footnote" tone="tertiary">
            {formatNumber(total)} votos
          </Text>
        </View>
        <Text variant="h3">{poll.question}</Text>
        {poll.options.map((o) => {
          const pct = total ? o.votes / total : 0;
          const mine = poll.userVoteId === o.id;
          return (
            <Pressable
              key={o.id}
              disabled={voted}
              onPress={() => vote(o.id)}
              accessibilityRole="button"
              accessibilityLabel={voted ? `${o.label}, ${Math.round(pct * 100)}%` : `Votar em ${o.label}`}
              accessibilityState={{ selected: mine, disabled: voted }}
              style={({ pressed }) => [
                {
                  minHeight: layout.minTouch,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: mine ? colors.primary : colors.border,
                  padding: spacing.md,
                  gap: 6,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={styles.between}>
                <Text variant="bodyStrong">{o.label}</Text>
                {voted && (
                  <Text variant="tabular" tone={mine ? 'brand' : 'secondary'}>
                    {Math.round(pct * 100)}%
                  </Text>
                )}
              </View>
              {voted && (
                <ProgressBar value={pct} height={6} color={mine ? colors.primary : colors.borderStrong} />
              )}
            </Pressable>
          );
        })}
        {!voted && (
          <Text variant="footnote" tone="tertiary">
            Vote e ganhe 5 pontos.
          </Text>
        )}
      </View>
    </Card>
  );
}

export function QuizCard() {
  const { spacing, colors, radius, layout } = useTheme();
  const { refreshProgress } = useAppState();
  const [quiz, setQuiz] = useState<Quiz>();

  useEffect(() => {
    services.gamification.getDailyQuiz().then(setQuiz);
  }, []);

  if (!quiz) return <Skeleton height={220} radius={20} />;
  const a = quiz.answered;

  const answer = async (optionId: string) => {
    const answered = await services.gamification.answerQuiz(quiz.id, optionId);
    if (answered.answered?.correct) haptic.success();
    else haptic.select();
    setQuiz(answered);
    refreshProgress();
  };

  return (
    <Card variant="elevated" padding="lg">
      <View style={{ gap: spacing.md }}>
        <View style={styles.between}>
          <Badge label="Quiz do dia" tone="info" icon="help-circle" />
          <Badge label={`+${quiz.points} pts`} tone="brand" />
        </View>
        <Text variant="h3">{quiz.question}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {quiz.options.map((o) => {
            const isCorrect = a?.correctOptionId === o.id;
            const isWrongPick = a && a.optionId === o.id && !a.correct;
            const border = isCorrect ? colors.success : isWrongPick ? colors.danger : colors.border;
            const bg = isCorrect
              ? colors.successSubtle
              : isWrongPick
                ? colors.dangerSubtle
                : colors.surfaceMuted;
            return (
              <Pressable
                key={o.id}
                disabled={!!a}
                onPress={() => answer(o.id)}
                accessibilityRole="button"
                accessibilityLabel={`Resposta ${o.label}${isCorrect ? ', correta' : isWrongPick ? ', errada' : ''}`}
                style={({ pressed }) => ({
                  flexBasis: '47%',
                  flexGrow: 1,
                  minHeight: layout.minTouch + 4,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderColor: border,
                  backgroundColor: bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text variant="bodyStrong">{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {a && (
          <View style={[styles.row, { gap: spacing.sm }]}>
            <Ionicons
              name={a.correct ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={a.correct ? colors.success : colors.danger}
            />
            <Text variant="callout" tone="secondary" style={{ flex: 1 }}>
              {a.correct ? `Acertou! +${quiz.points} pontos. ` : 'Não foi dessa vez. '}
              {a.explanation}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
