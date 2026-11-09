import type {
  CommunityGroup,
  FanLevel,
  FanProgress,
  Medal,
  PassportStamp,
  PointsEntry,
  PointsRule,
  Poll,
  Prediction,
  PredictionPool,
  Quiz,
  RankingEntry,
  RankingScope,
  TrailReward,
} from '@/types/gamification';

/** Pontos virtuais, níveis, medalhas, rankings, palpites, bolões, quizzes e enquetes. Sem apostas financeiras. */
export interface GamificationService {
  /** Pontuação da TEMPORADA (zera todo ano): bolão, quiz, enquetes, estádio, pé quente, conquistas, sócio e loja. */
  getProgress(): Promise<FanProgress>;
  getLevels(): Promise<FanLevel[]>;
  /** Trilha de prêmios da temporada. */
  getTrail(): Promise<TrailReward[]>;
  /** Resgata um prêmio já alcançado e devolve o cupom. */
  claimReward(rewardId: string): Promise<TrailReward>;
  /** Extrato: de onde vieram os pontos. */
  getPointsHistory(): Promise<PointsEntry[]>;
  getPointsRules(): Promise<PointsRule[]>;
  getMedals(): Promise<Medal[]>;
  getRanking(scope: RankingScope): Promise<RankingEntry[]>;
  getPrediction(matchId: string): Promise<Prediction | null>;
  submitPrediction(matchId: string, home: number, away: number): Promise<Prediction>;
  getPools(): Promise<PredictionPool[]>;
  getPoll(id?: string): Promise<Poll>;
  vote(pollId: string, optionId: string): Promise<Poll>;
  getDailyQuiz(): Promise<Quiz>;
  answerQuiz(quizId: string, optionId: string): Promise<Quiz>;
  getPassport(): Promise<PassportStamp[]>;
  getCommunityGroups(): Promise<CommunityGroup[]>;
  toggleGroup(groupId: string): Promise<CommunityGroup>;
}
