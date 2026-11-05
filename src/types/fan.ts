import type { ContentCategory } from './content';

export interface NotificationPrefs {
  goals: boolean;
  matchStart: boolean;
  matchEnd: boolean;
  lineups: boolean;
  news: boolean;
  tickets: boolean;
  store: boolean;
}

export interface PrivacyPrefs {
  showInRankings: boolean;
  shareCity: boolean;
  personalizedContent: boolean;
}

export interface FanProfile {
  id: string;
  name: string;
  firstName: string;
  email: string;
  city: string;
  state: string;
  fanSince: number;
  favoritePlayerIds: string[];
  interests: ContentCategory[];
  notifications: NotificationPrefs;
  privacy: PrivacyPrefs;
}

export type HistoryEntry =
  | { id: string; kind: 'ticket'; title: string; date: string; detail: string }
  | { id: string; kind: 'purchase'; title: string; date: string; detail: string }
  | { id: string; kind: 'points'; title: string; date: string; detail: string }
  | { id: string; kind: 'medal'; title: string; date: string; detail: string };

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  kind: 'match' | 'news' | 'tickets' | 'store' | 'gamification';
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  /** Fontes oficiais usadas na resposta (ex.: "Regulamento Sócio-Torcedor"). */
  sources?: string[];
}

export interface AssistantReply {
  text: string;
  sources: string[];
  /** false quando o assistente não encontrou informação oficial e disse que não sabe. */
  grounded: boolean;
  /** Atalho de navegação sugerido junto da resposta. */
  action?: { label: string; route: string; params?: Record<string, string> };
}
