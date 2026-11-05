import type { AppNotification, FanProfile, HistoryEntry } from '@/types/fan';

export interface Session {
  fanId: string;
  /** Sessão demonstrativa (sem login real nesta fase). */
  isDemo: boolean;
}

/** Login/cadastro ficam para depois: no modo demo há sempre um torcedor logado. */
export interface AuthService {
  getSession(): Promise<Session | null>;
  signOut(): Promise<void>;
}

export interface ProfileService {
  getProfile(): Promise<FanProfile>;
  updateProfile(patch: Partial<Omit<FanProfile, 'id'>>): Promise<FanProfile>;
  getHistory(): Promise<HistoryEntry[]>;
  getNotifications(): Promise<AppNotification[]>;
  markNotificationsRead(): Promise<void>;
}
