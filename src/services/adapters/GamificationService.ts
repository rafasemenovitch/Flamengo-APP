import type {
  CommunityGroup,
  FanProgress,
  Medal,
  PassportStamp,
  Poll,
  Prediction,
  PredictionPool,
  Quiz,
  RankingEntry,
  RankingScope,
} from '@/types/gamification';

/** Pontos virtuais, níveis, medalhas, rankings, palpites, bolões, quizzes e enquetes. Sem apostas financeiras. */
export interface GamificationService {
  getProgress(): Promise<FanProgress>;
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
