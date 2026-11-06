import type { AssistantService } from './AssistantService';
import type { FlaTVService, NewsService, RecommendationService } from './ContentService';
import type { GamificationService } from './GamificationService';
import type { MatchesService } from './MatchesService';
import type { MembershipService } from './MembershipService';
import type { AuthService, ProfileService } from './ProfileService';
import type { StadiumService } from './StadiumService';
import type { StoreService } from './StoreService';
import type { TicketsService } from './TicketsService';

export type * from './AssistantService';
export type * from './ContentService';
export type * from './GamificationService';
export type * from './MatchesService';
export type * from './MembershipService';
export type * from './ProfileService';
export type * from './StadiumService';
export type * from './StoreService';
export type * from './TicketsService';

/** Conjunto completo de serviços que a UI consome. */
export interface Services {
  matches: MatchesService;
  news: NewsService;
  flatv: FlaTVService;
  recommendations: RecommendationService;
  tickets: TicketsService;
  stadium: StadiumService;
  store: StoreService;
  membership: MembershipService;
  gamification: GamificationService;
  assistant: AssistantService;
  auth: AuthService;
  profile: ProfileService;
}
