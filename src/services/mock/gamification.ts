import {
  COMMUNITY_GROUPS,
  DAILY_POLL,
  FAN_ATTENDANCE_STREAK,
  FAN_POINTS,
  FAN_WEEKLY_POINTS,
  LEVELS,
  MEDALS,
  MOTM_POLL,
  PASSPORT,
  POOLS,
  QUIZZES,
  RANKINGS,
} from '@/data/demo/gamification';
import type { GamificationService } from '@/services/adapters';
import type { CommunityGroup, Poll, Prediction, Quiz } from '@/types/gamification';
import { delay, NotFoundError, structuredCloneSafe } from './utils';

let points = FAN_POINTS;
const predictions = new Map<string, Prediction>();
const polls = new Map<string, Poll>([
  [DAILY_POLL.id, structuredCloneSafe(DAILY_POLL)],
  [MOTM_POLL.id, structuredCloneSafe(MOTM_POLL)],
]);
const quizAnswers = new Map<string, Quiz['answered']>();
const groups: CommunityGroup[] = structuredCloneSafe(COMMUNITY_GROUPS);

function levelFor(p: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => {
    if (p >= l.minPoints) idx = i;
  });
  return { level: LEVELS[idx]!, nextLevel: LEVELS[idx + 1] };
}

function publicQuiz(id: string): Quiz {
  const q = QUIZZES.find((x) => x.id === id);
  if (!q) throw new NotFoundError('Quiz', id);
  return {
    id: q.id,
    question: q.question,
    options: q.options,
    points: q.points,
    answered: quizAnswers.get(q.id),
  };
}

export function createMockGamificationService(): GamificationService {
  return {
    async getProgress() {
      return delay({
        points,
        ...levelFor(points),
        attendanceStreak: FAN_ATTENDANCE_STREAK,
        weeklyPoints: FAN_WEEKLY_POINTS,
      });
    },
    getMedals: async () => delay(MEDALS),
    getRanking: async (scope) =>
      delay(
        RANKINGS[scope].map((r) =>
          r.isCurrentUser ? { ...r, points: scope === 'semanal' ? r.points : points } : r
        )
      ),
    getPrediction: async (matchId) => delay(predictions.get(matchId) ?? null, 150),
    async submitPrediction(matchId, home, away) {
      const isNew = !predictions.has(matchId);
      const prediction: Prediction = { matchId, home, away, submittedAt: new Date().toISOString() };
      predictions.set(matchId, prediction);
      if (isNew) points += 10; // pontos virtuais por participar
      return delay(prediction, 400);
    },
    getPools: async () => delay(POOLS),
    async getPoll(id = DAILY_POLL.id) {
      const poll = polls.get(id);
      if (!poll) throw new NotFoundError('Enquete', id);
      return delay(poll, 200);
    },
    async vote(pollId, optionId) {
      const poll = polls.get(pollId);
      if (!poll) throw new NotFoundError('Enquete', pollId);
      if (!poll.userVoteId) {
        const opt = poll.options.find((o) => o.id === optionId);
        if (!opt) throw new NotFoundError('Opção', optionId);
        opt.votes += 1;
        poll.userVoteId = optionId;
        points += 5;
      }
      return delay(poll, 250);
    },
    getDailyQuiz: async () => delay(publicQuiz(QUIZZES[0]!.id), 200),
    async answerQuiz(quizId, optionId) {
      const q = QUIZZES.find((x) => x.id === quizId);
      if (!q) throw new NotFoundError('Quiz', quizId);
      if (!quizAnswers.has(quizId)) {
        const correct = optionId === q.correctOptionId;
        quizAnswers.set(quizId, {
          optionId,
          correct,
          correctOptionId: q.correctOptionId,
          explanation: q.explanation,
        });
        if (correct) points += q.points;
      }
      return delay(publicQuiz(quizId), 300);
    },
    getPassport: async () => delay(PASSPORT),
    getCommunityGroups: async () => delay(groups),
    async toggleGroup(groupId) {
      const g = groups.find((x) => x.id === groupId);
      if (!g) throw new NotFoundError('Grupo', groupId);
      g.joined = !g.joined;
      g.members += g.joined ? 1 : -1;
      return delay(g, 200);
    },
  };
}
