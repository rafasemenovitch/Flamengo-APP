import type {
  FanLevel,
  PointsEntry,
  PointsRule,
  RankingEntry,
  RankingScope,
  TrailReward,
} from '@/types/gamification';
import { demoDate } from './clock';

/**
 * TEMPORADA DA NAÇÃO — uma pontuação só para tudo, que zera todo 1º de janeiro.
 *
 * Escala ancorada no bolão (placar exato = 10, máximo de um jogo = 21):
 * coisas do dia a dia valem pouco (quiz 10, enquete 2) e o que é raro vale
 * muito (ir ao estádio 30, pé quente 60 → 80 → 100 → 120).
 */
export const SEASON_YEAR = 2026;
export const SEASON_ENDS_AT = `${SEASON_YEAR + 1}-01-01T00:00:00-03:00`;

/** Níveis com nomes da história e do hino ("raça, amor e paixão"). */
export const LEVELS: FanLevel[] = [
  { level: 1, name: 'Estreante', minPoints: 0 },
  { level: 2, name: 'Arquibancada', minPoints: 250 },
  { level: 3, name: 'Geral', minPoints: 600 },
  { level: 4, name: 'Raça', minPoints: 1000 },
  { level: 5, name: 'Amor', minPoints: 1600 },
  { level: 6, name: 'Paixão', minPoints: 2300 },
  { level: 7, name: 'Manto Sagrado', minPoints: 3100 },
  { level: 8, name: 'Lenda da Nação', minPoints: 4000 },
];

/** Valores das regras (fonte única para cálculo e para a tela "Como ganhar"). */
export const POINTS = {
  quiz: 10,
  quizWeekStreak: 15,
  poll: 2,
  attendance: 30,
  attendanceAway: 50,
  /** Pé quente: 3, 4, 5 vitórias seguidas; a partir da 6ª, cada uma vale o último valor. */
  luckyStreak: [60, 80, 100, 120] as const,
  medal: { bronze: 20, silver: 40, gold: 80 },
  memberMonth: 20,
  /** Loja oficial: 1 ponto a cada R$ 10. */
  storePerReais: 10,
} as const;

export const POINTS_RULES: PointsRule[] = [
  {
    id: 'r-bolao',
    group: 'jogo',
    title: 'Bolão',
    detail: 'Os pontos do bolão contam iguais aqui',
    points: 'até 21',
  },
  {
    id: 'r-temporada',
    group: 'jogo',
    title: 'Palpites da temporada',
    detail: 'Artilheiro 25 · maior garçom 30',
    points: '25 · 30',
  },
  {
    id: 'r-presenca',
    group: 'estadio',
    title: 'Ir ao jogo',
    detail: 'Carimbo no Passaporte ao passar na catraca',
    points: String(POINTS.attendance),
  },
  {
    id: 'r-fora',
    group: 'estadio',
    title: 'Jogo fora de casa',
    detail: 'Na torcida visitante',
    points: String(POINTS.attendanceAway),
  },
  {
    id: 'r-pequente',
    group: 'estadio',
    title: 'Pé quente',
    detail: '3, 4 e 5 vitórias seguidas com você no estádio. Depois, 120 por vitória',
    points: POINTS.luckyStreak.slice(0, 3).join(' · '),
  },
  { id: 'r-quiz', group: 'dia', title: 'Acertar o quiz do dia', points: String(POINTS.quiz) },
  {
    id: 'r-quiz7',
    group: 'dia',
    title: '7 dias seguidos de quiz',
    detail: 'Bônus a cada semana completa',
    points: String(POINTS.quizWeekStreak),
  },
  {
    id: 'r-enquete',
    group: 'dia',
    title: 'Votar numa enquete',
    detail: 'Inclui o craque do jogo',
    points: String(POINTS.poll),
  },
  {
    id: 'r-conquista',
    group: 'torcedor',
    title: 'Conquistas',
    detail: 'Bronze 20 · prata 40 · ouro 80',
    points: '20 · 40 · 80',
  },
  {
    id: 'r-socio',
    group: 'torcedor',
    title: 'Sócio-Torcedor em dia',
    detail: 'A cada mensalidade paga',
    points: String(POINTS.memberMonth),
  },
  {
    id: 'r-loja',
    group: 'torcedor',
    title: 'Compras na loja oficial',
    detail: '1 ponto a cada R$ 10',
    points: '1 / R$ 10',
  },
];

/**
 * Trilha de prêmios: cada nível libera um prêmio grande e há prêmios menores
 * no caminho. Benefícios que o clube já costuma oferecer (cupons da loja,
 * desconto em ingresso e na mensalidade, tour, sorteios e experiências).
 */
export const TRAIL_REWARDS: TrailReward[] = [
  {
    id: 'tr-100',
    points: 100,
    title: 'Papel de parede da temporada',
    detail: 'Arte exclusiva para o celular',
    kind: 'digital',
    icon: 'image-outline',
  },
  {
    id: 'tr-250',
    points: 250,
    title: '5% off na loja oficial',
    detail: 'Uma compra, qualquer produto',
    kind: 'desconto',
    icon: 'bag-handle-outline',
  },
  {
    id: 'tr-400',
    points: 400,
    title: 'Moldura rubro-negra no perfil',
    detail: 'Aparece no ranking e nos bolões',
    kind: 'digital',
    icon: 'person-circle-outline',
  },
  {
    id: 'tr-600',
    points: 600,
    title: 'Frete grátis na loja',
    detail: 'Uma entrega para todo o Brasil',
    kind: 'desconto',
    icon: 'cube-outline',
  },
  {
    id: 'tr-800',
    points: 800,
    title: '10% off na loja oficial',
    detail: 'Uma compra, qualquer produto',
    kind: 'desconto',
    icon: 'pricetag-outline',
  },
  {
    id: 'tr-1000',
    points: 1000,
    title: '10% off num ingresso',
    detail: 'Qualquer jogo do Flamengo no Maracanã',
    kind: 'desconto',
    icon: 'ticket-outline',
  },
  {
    id: 'tr-1300',
    points: 1300,
    title: 'Tour do Maracanã pela metade',
    detail: '50% off para você e um acompanhante',
    kind: 'experiencia',
    icon: 'business-outline',
  },
  {
    id: 'tr-1600',
    points: 1600,
    title: '10% off em 3 mensalidades',
    detail: 'No plano de Sócio-Torcedor (novo ou renovação)',
    kind: 'socio',
    icon: 'card-outline',
  },
  {
    id: 'tr-1950',
    points: 1950,
    title: '+200 pontos de prioridade',
    detail: 'Sobe na fila de compra de ingressos',
    kind: 'socio',
    icon: 'trending-up-outline',
    membersOnly: true,
  },
  {
    id: 'tr-2300',
    points: 2300,
    title: '15% off num ingresso',
    detail: 'Qualquer jogo do Flamengo no Maracanã',
    kind: 'desconto',
    icon: 'ticket-outline',
  },
  {
    id: 'tr-2700',
    points: 2700,
    title: 'Sorteio: visita ao Ninho do Urubu',
    detail: 'Um cupom no sorteio mensal de visitas ao CT',
    kind: 'sorteio',
    icon: 'football-outline',
  },
  {
    id: 'tr-3100',
    points: 3100,
    title: '20% off numa camisa oficial',
    detail: 'Jogo, treino ou retrô',
    kind: 'desconto',
    icon: 'shirt-outline',
  },
  {
    id: 'tr-3500',
    points: 3500,
    title: 'Sorteio: camisa autografada',
    detail: 'Assinada pelo elenco da temporada',
    kind: 'sorteio',
    icon: 'create-outline',
  },
  {
    id: 'tr-4000',
    points: 4000,
    title: 'Entrar em campo com o time',
    detail: 'Sorteio entre as Lendas da Nação, mais 20% off num ingresso',
    kind: 'experiencia',
    icon: 'star-outline',
  },
];

/** Prêmios já resgatados pelo torcedor demo. */
export const CLAIMED_REWARDS: Record<string, string> = {
  'tr-100': 'FUNDO-2026',
  'tr-250': 'FLA5-K3P9QD',
  'tr-600': 'FRETE-7MX2LA',
};

/**
 * Extrato da temporada do torcedor demo (o bolão entra calculado, ao vivo).
 * Os valores seguem as regras acima.
 */
export const SEASON_LEDGER: PointsEntry[] = [
  {
    id: 'l1',
    source: 'presenca',
    label: '10 jogos no Maracanã',
    points: 10 * POINTS.attendance,
    date: demoDate(-11),
  },
  { id: 'l2', source: 'pe-quente', label: 'Pé quente: 3 vitórias seguidas', points: 60, date: demoDate(-11) },
  { id: 'l3', source: 'pe-quente', label: 'Pé quente: 4 vitórias seguidas', points: 80, date: demoDate(-82) },
  { id: 'l4', source: 'pe-quente', label: 'Pé quente: 3 vitórias seguidas', points: 60, date: demoDate(-96) },
  {
    id: 'l5',
    source: 'quiz',
    label: '28 acertos no quiz do dia',
    points: 28 * POINTS.quiz,
    date: demoDate(-1),
  },
  {
    id: 'l6',
    source: 'quiz',
    label: '1 semana completa de quiz',
    points: POINTS.quizWeekStreak,
    date: demoDate(-12),
  },
  {
    id: 'l7',
    source: 'enquete',
    label: '30 votos em enquetes',
    points: 30 * POINTS.poll,
    date: demoDate(-2),
  },
  {
    id: 'l8',
    source: 'conquista',
    label: 'Manto Sagrado (ouro)',
    points: POINTS.medal.gold,
    date: demoDate(-9),
  },
  {
    id: 'l9',
    source: 'conquista',
    label: 'Pé quente, Sabe tudo e Embaixador (prata)',
    points: 3 * POINTS.medal.silver,
    date: demoDate(-11),
  },
  {
    id: 'l10',
    source: 'conquista',
    label: 'Vidente, Voz da Nação e Clássico é clássico (bronze)',
    points: 3 * POINTS.medal.bronze,
    date: demoDate(-40),
  },
  {
    id: 'l11',
    source: 'socio',
    label: '10 mensalidades em dia',
    points: 10 * POINTS.memberMonth,
    date: demoDate(-8),
  },
  { id: 'l12', source: 'loja', label: 'Camisa Jogo I 2026 (R$ 349,90)', points: 34, date: demoDate(-9) },
];

type RankSeed = Omit<RankingEntry, 'points'> & { points?: number };

/** Rankings da temporada (o "Você" recebe os pontos reais na hora). */
export const SEASON_RANKINGS: Record<RankingScope, RankSeed[]> = {
  brasil: [
    { position: 1, fanName: 'Marina S.', city: 'Rio de Janeiro', points: 3_910 },
    { position: 2, fanName: 'Carlos E.', city: 'Niterói', points: 3_855 },
    { position: 3, fanName: 'Juliana P.', city: 'Belém', points: 3_790 },
    { position: 4, fanName: 'Rodrigo M.', city: 'Brasília', points: 3_702 },
    { position: 5, fanName: 'Ana L.', city: 'Recife', points: 3_644 },
    { position: 6, fanName: 'Felipe R.', city: 'São Paulo', points: 3_590 },
    { position: 7, fanName: 'Bianca T.', city: 'Manaus', points: 3_512 },
    { position: 8, fanName: 'Gustavo A.', city: 'Salvador', points: 3_470 },
    { position: 48_210, fanName: 'Você', city: 'Rio de Janeiro', isCurrentUser: true },
  ],
  estado: [
    { position: 1, fanName: 'Marina S.', city: 'Rio de Janeiro', points: 3_910 },
    { position: 2, fanName: 'Carlos E.', city: 'Niterói', points: 3_855 },
    { position: 3, fanName: 'Pedro H.', city: 'Duque de Caxias', points: 3_420 },
    { position: 4, fanName: 'Camila F.', city: 'Rio de Janeiro', points: 3_301 },
    { position: 5, fanName: 'Tiago C.', city: 'Petrópolis', points: 3_215 },
    { position: 9_870, fanName: 'Você', city: 'Rio de Janeiro', isCurrentUser: true },
  ],
  amigos: [
    { position: 1, fanName: 'Bruno Costa', city: 'Rio de Janeiro', points: 1_712 },
    { position: 2, fanName: 'Você', city: 'Rio de Janeiro', isCurrentUser: true },
    { position: 3, fanName: 'Lívia Andrade', city: 'Niterói', points: 1_190 },
    { position: 4, fanName: 'Marcos Paulo', city: 'Rio de Janeiro', points: 870 },
    { position: 5, fanName: 'Camila Reis', city: 'Rio de Janeiro', points: 655 },
  ],
};
