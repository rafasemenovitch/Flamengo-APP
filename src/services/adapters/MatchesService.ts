import type {
  Competition,
  CompetitionId,
  HeadToHead,
  Match,
  MatchDetail,
  MatchFilter,
  StandingsTable,
} from '@/types/match';
import type { Player } from '@/types/player';

export type Unsubscribe = () => void;

/** Calendário, placar ao vivo, escalações, eventos, estatísticas, histórico e elenco. */
export interface MatchesService {
  /** Jogo em destaque na Home: o próximo, o que está ao vivo ou o que acabou de terminar. */
  getFeaturedMatch(): Promise<MatchDetail>;
  getMatches(filter?: MatchFilter): Promise<Match[]>;
  getMatch(id: string): Promise<MatchDetail>;
  getCompetitions(): Promise<Competition[]>;
  getStandings(competitionId: CompetitionId): Promise<StandingsTable>;
  getHeadToHead(opponentId: string): Promise<HeadToHead>;
  getSquad(): Promise<Player[]>;
  getPlayer(id: string): Promise<Player>;
  /** Atualizações ao vivo de uma partida (placar, minuto, eventos). */
  subscribeToMatch(id: string, onUpdate: (match: MatchDetail) => void): Unsubscribe;
}
