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

export type Gender = 'masculino' | 'feminino' | 'outro' | 'nao-informar';

export interface FanProfile {
  id: string;
  /** Nome completo (como no documento). */
  name: string;
  /** Como o torcedor quer ser chamado no app. */
  firstName: string;
  email: string;
  /** Celular com DDD. */
  phone: string;
  cpf: string;
  /** AAAA-MM-DD */
  birthDate: string;
  gender: Gender;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
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

/** Expressões do avatar (rosto e ombros, trocáveis no mesmo lugar). */
export type AssistantExpression =
  'neutral' | 'wave' | 'talking' | 'thinking' | 'confused' | 'sorry' | 'wink' | 'happy';

/** Gestos (ilustrações maiores, da cintura para cima). */
export type AssistantGesture =
  'salute' | 'point-side' | 'point-up' | 'phone' | 'magnifier' | 'clipboard' | 'map' | 'open-arms';

/** Botão de uma resposta: leva a uma tela do app ou faz outra pergunta. */
export interface AssistantAction {
  label: string;
  /** Rota do app (ex.: 'MatchDetail', 'Ingressos'). */
  route?: string;
  params?: Record<string, string>;
  /** Faz esta pergunta (id do catálogo) em vez de navegar. */
  askId?: string;
  primary?: boolean;
}

/** Conteúdo rico dentro da conversa. */
export type AssistantCard =
  | { kind: 'match'; matchId: string; title: string; subtitle: string; meta: string }
  | { kind: 'ticket'; ticketId: string; title: string; sector: string; gate: string; seat: string }
  | { kind: 'steps'; title?: string; steps: string[] }
  | { kind: 'facts'; items: { label: string; value: string }[] };

export interface AssistantReply {
  text: string;
  sources: string[];
  /** false quando o assistente não encontrou informação oficial e disse que não sabe. */
  grounded: boolean;
  /** Atalho de navegação sugerido junto da resposta (formato antigo; ver `actions`). */
  action?: { label: string; route: string; params?: Record<string, string> };
  /** Reação do mascote no avatar desta mensagem. */
  expression?: AssistantExpression;
  /** Ilustração maior ao lado da mensagem (quando a resposta pede um gesto). */
  gesture?: AssistantGesture;
  actions?: AssistantAction[];
  card?: AssistantCard;
  /** Perguntas relacionadas sugeridas logo abaixo (ids do catálogo). */
  followUps?: string[];
}

/** Pergunta pronta do catálogo do assistente. */
export interface AssistantQuestion {
  id: string;
  text: string;
  /** Mostra a lupa ("buscando…") em vez do "pensando" enquanto responde. */
  search?: boolean;
}

export interface AssistantTopic {
  id: string;
  title: string;
  icon: string;
  questions: AssistantQuestion[];
}
