import type {
  CommunityGroup,
  FanLevel,
  Medal,
  PassportStamp,
  Poll,
  PredictionPool,
  RankingEntry,
} from '@/types/gamification';
import { demoDate } from './clock';

export const LEVELS: FanLevel[] = [
  { level: 1, name: 'Torcedor', minPoints: 0 },
  { level: 2, name: 'Arquibancada', minPoints: 500 },
  { level: 3, name: 'Geral', minPoints: 1500 },
  { level: 4, name: 'Raça', minPoints: 3000 },
  { level: 5, name: 'Nação', minPoints: 5000 },
  { level: 6, name: 'Manto Sagrado', minPoints: 8000 },
  { level: 7, name: 'Lenda', minPoints: 12000 },
];

export const FAN_POINTS = 3480;
export const FAN_WEEKLY_POINTS = 240;

export const MEDALS: Medal[] = [
  {
    id: 'md1',
    name: 'Primeira vez no Maraca',
    description: 'Registre presença no seu primeiro jogo.',
    group: 'presenca',
    tier: 'bronze',
    icon: 'ticket',
    unlockedAt: demoDate(-200),
  },
  {
    id: 'md2',
    name: 'Fiel',
    description: 'Vá a 5 jogos seguidos no estádio.',
    group: 'presenca',
    tier: 'silver',
    icon: 'flame',
    progress: 0.8,
  },
  {
    id: 'md3',
    name: 'Sempre presente',
    description: 'Vá a 20 jogos na temporada.',
    group: 'presenca',
    tier: 'gold',
    icon: 'trophy',
    progress: 0.45,
  },
  {
    id: 'md4',
    name: 'Vidente',
    description: 'Acerte um placar exato.',
    group: 'palpites',
    tier: 'bronze',
    icon: 'eye',
    unlockedAt: demoDate(-40),
  },
  {
    id: 'md5',
    name: 'Mãe Diná',
    description: 'Acerte 5 placares exatos.',
    group: 'palpites',
    tier: 'gold',
    icon: 'sparkles',
    progress: 0.4,
  },
  {
    id: 'md6',
    name: 'Sabe tudo',
    description: 'Acerte 10 quizzes seguidos.',
    group: 'conhecimento',
    tier: 'silver',
    icon: 'school',
    unlockedAt: demoDate(-12),
  },
  {
    id: 'md7',
    name: 'Historiador',
    description: 'Complete a trilha de quizzes de títulos.',
    group: 'conhecimento',
    tier: 'gold',
    icon: 'library',
    progress: 0.6,
  },
  {
    id: 'md8',
    name: 'Voz da Nação',
    description: 'Vote em 20 enquetes.',
    group: 'comunidade',
    tier: 'bronze',
    icon: 'megaphone',
    unlockedAt: demoDate(-60),
  },
  {
    id: 'md9',
    name: 'Embaixador',
    description: 'Participe de um grupo regional.',
    group: 'comunidade',
    tier: 'silver',
    icon: 'people',
    unlockedAt: demoDate(-90),
  },
  {
    id: 'md10',
    name: 'Noite de final',
    description: 'Esteja no estádio numa final.',
    group: 'especiais',
    tier: 'gold',
    icon: 'star',
    progress: 0,
  },
];

export const RANKINGS: Record<'geral' | 'semanal' | 'estado' | 'amigos', RankingEntry[]> = {
  geral: [
    { position: 1, fanName: 'Marina S.', city: 'Rio de Janeiro', points: 15420 },
    { position: 2, fanName: 'Carlos E.', city: 'Niterói', points: 14980 },
    { position: 3, fanName: 'Juliana P.', city: 'Belém', points: 14210 },
    { position: 4, fanName: 'Rodrigo M.', city: 'Brasília', points: 13870 },
    { position: 5, fanName: 'Ana L.', city: 'Recife', points: 13340 },
    { position: 6, fanName: 'Felipe R.', city: 'São Paulo', points: 12990 },
    { position: 7, fanName: 'Bianca T.', city: 'Manaus', points: 12750 },
    { position: 8, fanName: 'Gustavo A.', city: 'Salvador', points: 12400 },
    { position: 12_480, fanName: 'Você', city: 'Rio de Janeiro', points: 3480, isCurrentUser: true },
  ],
  semanal: [
    { position: 1, fanName: 'Pedro H.', city: 'Duque de Caxias', points: 980 },
    { position: 2, fanName: 'Marina S.', city: 'Rio de Janeiro', points: 940 },
    { position: 3, fanName: 'Letícia V.', city: 'Fortaleza', points: 910 },
    { position: 4, fanName: 'Tiago C.', city: 'Vitória', points: 860 },
    { position: 5, fanName: 'Camila F.', city: 'Rio de Janeiro', points: 820 },
    { position: 1_204, fanName: 'Você', city: 'Rio de Janeiro', points: 240, isCurrentUser: true },
  ],
  estado: [
    { position: 1, fanName: 'Marina S.', city: 'Rio de Janeiro', points: 15420 },
    { position: 2, fanName: 'Carlos E.', city: 'Niterói', points: 14980 },
    { position: 3, fanName: 'Pedro H.', city: 'Duque de Caxias', points: 11800 },
    { position: 4, fanName: 'Camila F.', city: 'Rio de Janeiro', points: 11250 },
    { position: 3_310, fanName: 'Você', city: 'Rio de Janeiro', points: 3480, isCurrentUser: true },
  ],
  amigos: [
    { position: 1, fanName: 'Bruno (amigo)', city: 'Rio de Janeiro', points: 4210 },
    { position: 2, fanName: 'Você', city: 'Rio de Janeiro', points: 3480, isCurrentUser: true },
    { position: 3, fanName: 'Lívia (amiga)', city: 'Niterói', points: 2950 },
    { position: 4, fanName: 'Marcos (amigo)', city: 'Rio de Janeiro', points: 1870 },
  ],
};

export const POOLS: PredictionPool[] = [
  {
    id: 'pool1',
    name: 'Bolão da Família',
    members: 12,
    userPosition: 3,
    userPoints: 86,
    nextMatchLabel: 'Flamengo × Palmeiras',
    leaderboard: [
      { name: 'Tio Marcos', points: 104, exactScores: 6 },
      { name: 'Ana (prima)', points: 92, exactScores: 5 },
      { name: 'Você', points: 86, exactScores: 4, isYou: true },
      { name: 'Pai', points: 81, exactScores: 3 },
    ],
  },
  {
    id: 'pool2',
    name: 'Trabalho — Nação RJ',
    members: 38,
    userPosition: 9,
    userPoints: 74,
    nextMatchLabel: 'Flamengo × Palmeiras',
    leaderboard: [
      { name: 'Carla R.', points: 131, exactScores: 8 },
      { name: 'Diego M.', points: 118, exactScores: 7 },
      { name: 'Paulo S.', points: 115, exactScores: 6 },
      { name: 'Você', points: 74, exactScores: 3, isYou: true },
    ],
  },
];

/** Pé quente dos amigos (vitórias seguidas nos jogos em que foram ao estádio). */
export const LUCKY_FRIENDS = [
  { name: 'Bruno', streak: 5 },
  { name: 'Lívia', streak: 2 },
  { name: 'Marcos', streak: 1 },
];

export const DAILY_POLL: Poll = {
  id: 'poll-daily',
  kind: 'enquete',
  question: 'Quem deve começar no ataque contra o Palmeiras?',
  closesAt: demoDate(2, '20:00'),
  options: [
    { id: 'o1', label: 'Vasconcelos', votes: 18_420 },
    { id: 'o2', label: 'Olivera', votes: 6_310 },
    { id: 'o3', label: 'Os dois juntos', votes: 9_870 },
  ],
};

export const MOTM_POLL: Poll = {
  id: 'poll-motm',
  kind: 'craque-do-jogo',
  question: 'Quem foi o craque do jogo?',
  closesAt: demoDate(1, '12:00'),
  options: [
    { id: 'p09', label: 'Vasconcelos', votes: 12_400 },
    { id: 'p07', label: 'Bruno Siqueira', votes: 9_800 },
    { id: 'p10', label: 'Arantes', votes: 7_150 },
    { id: 'p19', label: 'Olivera', votes: 5_320 },
  ],
};

export const QUIZZES = [
  {
    id: 'quiz-1',
    question: 'Em que ano o Maracanã foi inaugurado?',
    options: [
      { id: 'a', label: '1938' },
      { id: 'b', label: '1950' },
      { id: 'c', label: '1962' },
      { id: 'd', label: '1970' },
    ],
    correctOptionId: 'b',
    explanation: 'O estádio foi inaugurado em 1950, para a Copa do Mundo daquele ano.',
    points: 50,
  },
];

export const PASSPORT: PassportStamp[] = [
  {
    id: 's1',
    matchId: 'm-lib-sf2',
    label: 'Flamengo 2 × 1 Racing',
    date: demoDate(-14, '21:30'),
    venue: 'Maracanã',
    result: 'Vitória',
  },
  {
    id: 's2',
    matchId: 'm-bra-31',
    label: 'Flamengo 2 × 0 Fortaleza',
    date: demoDate(-11, '19:00'),
    venue: 'Maracanã',
    result: 'Vitória',
  },
  {
    id: 's3',
    matchId: 'm-bra-29',
    label: 'Flamengo 3 × 0 Bahia',
    date: demoDate(-25, '16:00'),
    venue: 'Maracanã',
    result: 'Vitória',
  },
  {
    id: 's4',
    matchId: 'old-1',
    label: 'Flamengo 1 × 1 Fluminense',
    date: demoDate(-46, '16:00'),
    venue: 'Maracanã',
    result: 'Empate',
  },
];

export const COMMUNITY_GROUPS: CommunityGroup[] = [
  {
    id: 'g1',
    name: 'Nação Zona Norte',
    region: 'Rio de Janeiro — RJ',
    members: 18_240,
    description: 'Encontros antes dos jogos e caravanas para o Maracanã.',
    joined: true,
    nextMeetup: demoDate(2, '18:00'),
  },
  {
    id: 'g2',
    name: 'Rubro-Negros de Niterói',
    region: 'Niterói — RJ',
    members: 6_120,
    description: 'Ônibus fretado em dias de jogo.',
    joined: false,
  },
  {
    id: 'g3',
    name: 'Nação Nordeste',
    region: 'Recife, Fortaleza e Salvador',
    members: 24_900,
    description: 'Telões e encontros em bares parceiros.',
    joined: false,
    nextMeetup: demoDate(2, '20:30'),
  },
  {
    id: 'g4',
    name: 'Flamengo em São Paulo',
    region: 'São Paulo — SP',
    members: 15_300,
    description: 'Para quem torce longe do Rio.',
    joined: false,
  },
  {
    id: 'g5',
    name: 'Nação pelo Mundo',
    region: 'Exterior',
    members: 9_870,
    description: 'Torcedores fora do Brasil.',
    joined: false,
  },
];
