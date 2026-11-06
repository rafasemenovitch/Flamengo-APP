import type { AppNotification, FanProfile, HistoryEntry } from '@/types/fan';
import type { Membership } from '@/types/commerce';
import type { Ticket } from '@/types/tickets';
import { demoDate } from './clock';
import { FEATURED_MATCH_ID } from './matches';

/** Torcedor demonstrativo "logado" (login real fica para uma fase futura). */
export const DEMO_FAN: FanProfile = {
  id: 'fan-demo',
  name: 'Rafael Souza',
  firstName: 'Rafael',
  email: 'torcedor.demo@exemplo.com',
  city: 'Rio de Janeiro',
  state: 'RJ',
  fanSince: 1998,
  favoritePlayerIds: ['p10', 'p09'],
  interests: ['jogos', 'bastidores', 'base'],
  notifications: { goals: true, matchStart: true, matchEnd: true, lineups: true, news: false, tickets: true, store: false },
  privacy: { showInRankings: true, shareCity: true, personalizedContent: true },
};

export const DEMO_MEMBERSHIP: Membership = {
  planId: 'plan-maraca-2',
  memberNumber: '0000 1981 2019',
  holderName: DEMO_FAN.name,
  since: '2019-03-01',
  validUntil: demoDate(240).slice(0, 10),
  status: 'active',
  priorityPoints: 1240,
  isDemo: true,
};

/** Ingresso já comprado para o jogo em destaque (para a carteira e o Modo Maracanã). */
export const DEMO_TICKETS: Ticket[] = [
  {
    id: 't-demo-1',
    matchId: FEATURED_MATCH_ID,
    sectorId: 'leste-inf',
    sectorName: 'Leste Inferior',
    gate: 'C',
    seat: 'Fila K · Cadeira 14',
    holderName: DEMO_FAN.name,
    type: 'member',
    price: 56,
    purchasedAt: demoDate(-2, '10:12'),
    status: 'valid',
    qrPayload: 'DEMONSTRATIVO-SEM-VALIDADE-t-demo-1',
    isDemo: true,
  },
];

export const DEMO_HISTORY: HistoryEntry[] = [
  { id: 'h1', kind: 'ticket', title: 'Ingresso — Flamengo × Palmeiras', date: demoDate(-2, '10:12'), detail: 'Leste Inferior · Sócio (demo)' },
  { id: 'h2', kind: 'points', title: '+50 pontos', date: demoDate(-3, '18:00'), detail: 'Palpite certo do vencedor' },
  { id: 'h3', kind: 'purchase', title: 'Camisa Jogo I 2026', date: demoDate(-9, '15:40'), detail: 'Pedido simulado #DEMO-4821' },
  { id: 'h4', kind: 'medal', title: 'Medalha "Sabe tudo"', date: demoDate(-12, '21:00'), detail: '10 quizzes seguidos' },
  { id: 'h5', kind: 'ticket', title: 'Ingresso — Flamengo × Racing', date: demoDate(-16, '09:30'), detail: 'Norte · Sócio (demo)' },
];

export const DEMO_NOTIFICATIONS: AppNotification[] = [
  { id: 'nt1', kind: 'match', title: 'Escalação confirmada', body: 'Veja o time para o jogo contra o Palmeiras.', createdAt: demoDate(0, '09:00'), read: false },
  { id: 'nt2', kind: 'tickets', title: 'Seu ingresso está na carteira', body: 'Leste Inferior · Portão C.', createdAt: demoDate(-2, '10:13'), read: false },
  { id: 'nt3', kind: 'gamification', title: 'Você subiu no ranking semanal', body: 'Agora você está entre os 1.300 primeiros.', createdAt: demoDate(-1, '20:00'), read: true },
  { id: 'nt4', kind: 'news', title: 'Nova camisa III', body: 'Já disponível na loja do app.', createdAt: demoDate(-4, '10:00'), read: true },
];
