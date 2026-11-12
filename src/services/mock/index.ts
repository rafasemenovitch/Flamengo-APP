import type { Services } from '@/services/adapters';
import { createMockAssistantService } from './assistant';
import { createMockBolaoService } from './bolao';
import { createMockMembershipService, createMockStoreService } from './commerce';
import { createMockFlaTVService, createMockNewsService, createMockRecommendationService } from './content';
import { createMockGamificationService } from './gamification';
import { createMockMatchesService } from './matches';
import { createMockAuthService, createMockProfileService } from './profile';
import { withAccountProfile } from '@/services/supabase/profiles';
import { createDemoStadiumMapService } from '@/services/stadium/DemoStadiumAdapter';
import { createMockStadiumService, createMockTicketsService } from './tickets';

export {
  demoLocation,
  demoMember,
  demoScenario,
  DEMO_SCENARIOS,
  type DemoLocation,
  type DemoScenario,
} from './demoScenario';

export function createMockServices(): Services {
  const matches = createMockMatchesService();
  const tickets = createMockTicketsService();
  const stadium = createMockStadiumService();
  const store = createMockStoreService();
  const membership = createMockMembershipService();
  const gamification = createMockGamificationService();
  const profile = withAccountProfile(createMockProfileService());
  return {
    matches,
    news: createMockNewsService(),
    flatv: createMockFlaTVService(),
    recommendations: createMockRecommendationService(),
    tickets,
    stadium,
    store,
    membership,
    gamification,
    assistant: createMockAssistantService({
      matches,
      tickets,
      stadium,
      store,
      membership,
      gamification,
      profile,
    }),
    auth: createMockAuthService(),
    profile,
    bolao: createMockBolaoService(),
    venueMap: createDemoStadiumMapService(),
  };
}
