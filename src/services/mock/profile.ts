import { DEMO_FAN, DEMO_HISTORY, DEMO_NOTIFICATIONS } from '@/data/demo/fan';
import type { AuthService, ProfileService } from '@/services/adapters';
import type { FanProfile } from '@/types/fan';
import { delay, structuredCloneSafe } from './utils';

let profile: FanProfile = structuredCloneSafe(DEMO_FAN);
const notifications = structuredCloneSafe(DEMO_NOTIFICATIONS);

export function createMockAuthService(): AuthService {
  return {
    getSession: async () => delay({ fanId: profile.id, isDemo: true }, 50),
    // Sem login real nesta fase: "sair" apenas restaura o torcedor demo.
    signOut: async () => {
      profile = structuredCloneSafe(DEMO_FAN);
      return delay(undefined, 200);
    },
  };
}

export function createMockProfileService(): ProfileService {
  return {
    getProfile: async () => delay(profile, 150),
    async updateProfile(patch) {
      profile = { ...profile, ...patch };
      return delay(profile, 200);
    },
    getHistory: async () => delay(DEMO_HISTORY),
    getNotifications: async () => delay(notifications, 200),
    async markNotificationsRead() {
      notifications.forEach((n) => (n.read = true));
      return delay(undefined, 100);
    },
  };
}
