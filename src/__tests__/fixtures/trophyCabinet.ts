import { TROPHY_GOALS } from '@/data/trophies';
import type { TrophyProgress } from '@/types/trophies';
import { resolveTrophyRoom } from '@/utils/trophies';

/** Cenários visuais isolados: nunca gravam conquistas nem alteram o serviço do app. */
export function trophyCabinetScenario(medalCount: number, unlockedCups = 0) {
  const medalGoals = TROPHY_GOALS.filter((goal) => goal.group !== 'especiais');
  const earned = [
    ...medalGoals.filter((goal) => goal.kind === 'evolving'),
    ...medalGoals.filter((goal) => goal.kind === 'special'),
  ].slice(0, medalCount);
  const moments = TROPHY_GOALS.filter((goal) => goal.group === 'especiais');
  const progress: TrophyProgress = {
    counters: Object.fromEntries(
      earned.flatMap((goal, index) =>
        goal.kind === 'evolving'
          ? [[goal.counter, goal.thresholds[medalCount === medalGoals.length ? 2 : index % 3]!]]
          : []
      )
    ),
    completed: Object.fromEntries(
      [...earned.filter((goal) => goal.kind === 'special'), ...moments.slice(0, unlockedCups)].map((goal) => [
        goal.id,
        {},
      ])
    ),
  };
  return resolveTrophyRoom(TROPHY_GOALS, progress);
}
