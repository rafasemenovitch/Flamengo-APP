import { demoDate } from '@/data/demo/clock';
import {
  COMMUNITY_GROUPS,
  DAILY_POLL,
  LUCKY_FRIENDS,
  MEDALS,
  MOTM_POLL,
  PASSPORT,
  POOLS,
  QUIZZES,
} from '@/data/demo/gamification';
import {
  CLAIMED_REWARDS,
  LEVELS,
  POINTS,
  POINTS_RULES,
  SEASON_ENDS_AT,
  SEASON_LEDGER,
  SEASON_RANKINGS,
  SEASON_YEAR,
  TRAIL_REWARDS,
} from '@/data/demo/season';
import type { GamificationService } from '@/services/adapters';
import type { CommunityGroup, PointsEntry, Poll, Prediction, Quiz, TrailReward } from '@/types/gamification';
import { bolaoSeasonPoints } from './bolao';
import { delay, NotFoundError, structuredCloneSafe } from './utils';

/** Lançamentos feitos durante o uso do demo (quiz, enquete...). */
const liveLedger: PointsEntry[] = [];
const claimed: Record<string, { code: string; at: string }> = Object.fromEntries(
  Object.entries(CLAIMED_REWARDS).map(([id, code]) => [id, { code, at: demoDate(-30) }])
);

function addPoints(source: PointsEntry['source'], label: string, value: number) {
  liveLedger.unshift({
    id: `live-${liveLedger.length}`,
    source,
    label,
    points: value,
    date: new Date().toISOString(),
  });
}

/** Extrato completo: bolão (calculado), lançamentos do demo e o histórico da temporada. */
function ledger(): PointsEntry[] {
  return [
    ...liveLedger,
    {
      id: 'bolao',
      source: 'bolao',
      label: 'Pontos no bolão',
      points: bolaoSeasonPoints(),
      date: new Date().toISOString(),
    },
    ...SEASON_LEDGER,
  ];
}

const seasonPoints = () => ledger().reduce((a, e) => a + e.points, 0);

function trail(): TrailReward[] {
  return TRAIL_REWARDS.map((r) =>
    claimed[r.id] ? { ...r, claimedCode: claimed[r.id]!.code, claimedAt: claimed[r.id]!.at } : r
  );
}

function rewardCode(id: string) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let h = 2166136261;
  for (const ch of `${id}${Date.now()}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let code = 'FLA-';
  for (let i = 0; i < 6; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    code += alphabet[h % alphabet.length];
  }
  return code;
}
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

/** Vitórias seguidas (mais recentes primeiro) e a maior sequência no Passaporte. */
function luckyStreaks() {
  const stamps = [...PASSPORT].sort((a, b) => b.date.localeCompare(a.date));
  let current = 0;
  for (const st of stamps) {
    if (st.result !== 'Vitória') break;
    current++;
  }
  let best = 0;
  let run = 0;
  for (const st of [...stamps].reverse()) {
    run = st.result === 'Vitória' ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return { luckyStreak: current, bestLuckyStreak: best };
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
      const points = seasonPoints();
      const week = Date.now() - 7 * 86_400_000;
      return delay({
        points,
        ...levelFor(points),
        ...luckyStreaks(),
        luckyFriends: LUCKY_FRIENDS,
        weeklyPoints: ledger()
          .filter((e) => new Date(e.date).getTime() >= week && e.id !== 'bolao')
          .reduce((a, e) => a + e.points, 0),
        season: { year: SEASON_YEAR, endsAt: SEASON_ENDS_AT },
        nextReward: trail().find((r) => r.points > points),
      });
    },
    getLevels: async () => delay(LEVELS, 50),
    getTrail: async () => delay(trail(), 200),
    async claimReward(rewardId) {
      const r = TRAIL_REWARDS.find((x) => x.id === rewardId);
      if (!r) throw new NotFoundError('Prêmio', rewardId);
      if (seasonPoints() < r.points) throw new Error('Você ainda não chegou neste prêmio.');
      if (!claimed[r.id]) claimed[r.id] = { code: rewardCode(r.id), at: new Date().toISOString() };
      return delay(
        trail().find((x) => x.id === rewardId)!,
        600
      );
    },
    getPointsHistory: async () => delay(ledger(), 200),
    getPointsRules: async () => delay(POINTS_RULES, 100),
    getMedals: async () => delay(MEDALS),
    async getRanking(scope) {
      const points = seasonPoints();
      return delay(
        SEASON_RANKINGS[scope]
          .map((r) => ({ ...r, points: r.isCurrentUser ? points : (r.points ?? 0) }))
          .sort((a, b) => a.position - b.position)
      );
    },
    getPrediction: async (matchId) => delay(predictions.get(matchId) ?? null, 150),
    async submitPrediction(matchId, home, away) {
      const isNew = !predictions.has(matchId);
      const prediction: Prediction = { matchId, home, away, submittedAt: new Date().toISOString() };
      predictions.set(matchId, prediction);
      void isNew; // pontos de palpite vêm do bolão
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
        addPoints('enquete', `Voto: ${poll.question}`, POINTS.poll);
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
        if (correct) addPoints('quiz', 'Acertou o quiz do dia', POINTS.quiz);
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
