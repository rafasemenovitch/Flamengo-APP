import type { TrophyAchievement, TrophyAward, TrophyGoal, TrophyProgress } from '@/types/trophies';

export const AWARD_EVOLUTION = [
  { kind: 'medal', tier: 'bronze' },
  { kind: 'medal', tier: 'silver' },
  { kind: 'medal', tier: 'gold' },
  { kind: 'trophy', tier: 'bronze' },
  { kind: 'trophy', tier: 'silver' },
  { kind: 'trophy', tier: 'gold' },
] as const;
export const TIER_LABEL = { bronze: 'bronze', silver: 'prata', gold: 'ouro' } as const;

export function awardLabel(award: Pick<TrophyAward, 'kind' | 'tier'>) {
  return `${award.kind === 'medal' ? 'Medalha' : 'Troféu'} de ${TIER_LABEL[award.tier]}`;
}

export function goalAwards(goal: TrophyGoal): TrophyAward[] {
  return goal.kind === 'special'
    ? [{ kind: 'trophy', tier: 'gold', target: 1 }]
    : AWARD_EVOLUTION.map((award, i) => ({ ...award, target: goal.thresholds[i]! }));
}

export function goalRequirement(goal: TrophyGoal, target: number) {
  if (goal.kind === 'special') return goal.description;
  return `${goal.verb} ${target.toLocaleString('pt-BR')} ${target === 1 ? (goal.unitOne ?? goal.unit) : goal.unit}.`;
}

/** Só os contadores e eventos fornecidos liberam peças. Nunca cria atividade ou pontos. */
export function resolveTrophyRoom(goals: readonly TrophyGoal[], data: TrophyProgress): TrophyAchievement[] {
  return goals.map((goal) => {
    const awards = goalAwards(goal);
    const completed = data.completed[goal.id];
    const raw = goal.kind === 'evolving' ? data.counters[goal.counter] : completed ? 1 : 0;
    const value = typeof raw === 'number' && Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
    const current = awards.filter((award) => value >= award.target).at(-1);
    const next = awards.find((award) => value < award.target);
    const partial = data.partial?.[goal.id] ?? 0;
    const progress =
      goal.kind === 'special'
        ? completed
          ? 1
          : Number.isFinite(partial)
            ? Math.max(0, Math.min(1, partial))
            : 0
        : next
          ? Math.min(1, value / next.target)
          : 1;
    return { ...goal, value, earned: !!current, current, next, progress, earnedAt: completed?.at };
  });
}

export function earnedTrophies(achievements: readonly TrophyAchievement[]) {
  return achievements.filter((achievement) => achievement.earned && achievement.current);
}
