import type { Services } from '@/services/adapters';
import { createMockAssistantService } from './assistant';
import { createMockMembershipService, createMockStoreService } from './commerce';
import { createMockFlaTVService, createMockNewsService, createMockRecommendationService } from './content';
import { createMockGamificationService } from './gamification';
import { createMockMatchesService } from './matches';
import { createMockAuthService, createMockProfileService } from './profile';
import { createMockStadiumService, createMockTicketsService } from './tickets';

export { demoScenario, DEMO_SCENARIOS, type DemoScenario } from './demoScenario';

export function createMockServices(): Services {
  const matches = createMockMatchesService();
  const tickets = createMockTicketsService();
  return {
    matches,
    news: createMockNewsService(),
    flatv: createMockFlaTVService(),
    recommendations: createMockRecommendationService(),
    tickets,
    stadium: createMockStadiumService(),
    store: createMockStoreService(),
    membership: createMockMembershipService(),
    gamification: createMockGamificationService(),
    assistant: createMockAssistantService({ matches, tickets }),
    auth: createMockAuthService(),
    profile: createMockProfileService(),
  };
}
