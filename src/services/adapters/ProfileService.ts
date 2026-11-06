import type { AppNotification, FanProfile, HistoryEntry } from '@/types/fan';
import type { FaceEnrollment } from '@/types/stadium';

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
  /** Cadastro facial para entrada no estádio (vale para todos os ingressos da conta). */
  getFaceEnrollment(): Promise<FaceEnrollment>;
  /** No modo demo, a foto NÃO sai do aparelho: só o status é registrado. */
  enrollFace(photoUri: string): Promise<FaceEnrollment>;
  removeFace(): Promise<FaceEnrollment>;
}
