import type { MedalGroup } from './gamification';

export type TrophyTier = 'bronze' | 'silver' | 'gold';
export type TrophyKind = 'medal' | 'trophy';
export type TrophyMotif =
  'ball' | 'flame' | 'flag' | 'map' | 'target' | 'book' | 'voice' | 'shirt' | 'shield' | 'star' | 'clock';
export type TrophyCounter =
  | 'matches'
  | 'matchStreak'
  | 'winStreak'
  | 'awayMatches'
  | 'stadiums'
  | 'exactScores'
  | 'quizzes'
  | 'quizDays'
  | 'polls'
  | 'shirts'
  | 'memberYears';

type GoalBase = {
  id: string;
  name: string;
  description: string;
  group: MedalGroup;
  motif: TrophyMotif;
};

export type TrophyGoal = GoalBase &
  (
    | {
        kind: 'evolving';
        counter: TrophyCounter;
        thresholds: readonly [number, number, number];
        verb: string;
        unit: string;
        unitOne?: string;
      }
    | { kind: 'special' }
  );

export type TrophyAward = { kind: TrophyKind; tier: TrophyTier; target: number };
export type TrophyProgress = {
  /** Contagens acumuladas; sequências usam o maior recorde, para preservar o prêmio. */
  counters: Partial<Record<TrophyCounter, number>>;
  /** Só eventos efetivamente registrados liberam as conquistas únicas. */
  completed: Record<string, { at?: string } | undefined>;
  partial?: Record<string, number | undefined>;
};

export type TrophyAchievement = TrophyGoal & {
  value: number;
  earned: boolean;
  current?: TrophyAward;
  next?: TrophyAward;
  progress: number;
  earnedAt?: string;
};
