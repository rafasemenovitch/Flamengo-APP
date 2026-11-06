import type { Benefit, MembershipPlan, MembershipProgramInfo, Product } from '@/types/commerce';
import type { SectorOffer } from '@/types/tickets';
import { demoDate } from './clock';

const SHIRT_SIZES = ['P', 'M', 'G', 'GG', 'XGG'];

export const PRODUCTS: Product[] = [
  { id: 'pr1', name: 'Camisa Jogo I 2026', category: 'camisas', price: 349.9, sizes: SHIRT_SIZES, description: 'Listras horizontais rubro-negras, tecido leve com tecnologia de ventilação. Modelo torcedor. Produto demonstrativo.', imageKey: 'product-1', tag: 'Mais vendido', memberDiscountPct: 15 },
  { id: 'pr2', name: 'Camisa Jogo II 2026', category: 'camisas', price: 349.9, sizes: SHIRT_SIZES, description: 'Camisa branca com detalhes em vermelho e preto. Produto demonstrativo.', imageKey: 'product-2', memberDiscountPct: 15 },
  { id: 'pr3', name: 'Camisa III Arquibancada', category: 'camisas', price: 379.9, sizes: SHIRT_SIZES, description: 'Edição especial inspirada na torcida. Produto demonstrativo.', imageKey: 'product-3', tag: 'Lançamento', memberDiscountPct: 10 },
  { id: 'pr4', name: 'Agasalho de Viagem', category: 'treino', price: 499.9, compareAtPrice: 599.9, sizes: SHIRT_SIZES, description: 'Usado pelo elenco nas viagens. Produto demonstrativo.', imageKey: 'product-4', tag: 'Promoção', memberDiscountPct: 15 },
  { id: 'pr5', name: 'Camisa de Treino', category: 'treino', price: 229.9, sizes: SHIRT_SIZES, description: 'Tecido respirável para o dia a dia. Produto demonstrativo.', imageKey: 'product-5', memberDiscountPct: 15 },
  { id: 'pr6', name: 'Boné Rubro-Negro', category: 'acessorios', price: 129.9, description: 'Aba curva, ajuste traseiro. Produto demonstrativo.', imageKey: 'product-6', memberDiscountPct: 10 },
  { id: 'pr7', name: 'Cachecol Nação', category: 'acessorios', price: 89.9, description: 'Para levar ao estádio. Produto demonstrativo.', imageKey: 'product-7', tag: 'Exclusivo sócio', memberDiscountPct: 20 },
  { id: 'pr8', name: 'Kit Infantil Jogo I', category: 'infantil', price: 279.9, sizes: ['2', '4', '6', '8', '10', '12'], description: 'Camisa e calção para os pequenos. Produto demonstrativo.', imageKey: 'product-8', memberDiscountPct: 15 },
  { id: 'pr9', name: 'Moletom Casual', category: 'casual', price: 299.9, sizes: SHIRT_SIZES, description: 'Algodão, estampa minimalista. Produto demonstrativo.', imageKey: 'product-9', memberDiscountPct: 10 },
  { id: 'pr10', name: 'Caneca Térmica', category: 'acessorios', price: 99.9, compareAtPrice: 119.9, description: 'Mantém a temperatura por até 6 horas. Produto demonstrativo.', imageKey: 'product-10', tag: 'Promoção', memberDiscountPct: 10 },
];

/**
 * PROGRAMA DE SÓCIO REAL ("Nação"), pesquisado em 06/11/2026.
 * - Estrutura, prioridades, descontos e convidados: site oficial (Maraca 1) e
 *   guia fla.app.br (nov/2025).
 * - Preços 2026 (reajuste de 10% em abr/2026): Sem Fronteiras e Maraca 1 em
 *   flamengorj.com.br e torcidaflamengo.com.br. Maraca 2 e 3 não tiveram o
 *   valor novo divulgado: ESTIMADOS (valor 2025 + 10%).
 * Conferir sempre em https://nacao.flamengo.com.br antes de apresentar.
 */
export const MEMBERSHIP_PROGRAM: MembershipProgramInfo = {
  name: 'Nação',
  checkedAt: '2026-11-06',
  priceNote:
    'Valores de referência pesquisados em nov/2026, após o reajuste de 10% de abril. Maraca 2 e Maraca 3 são estimativas (valor de 2025 + 10%).',
  officialUrl: 'https://nacao.flamengo.com.br',
  sources: [
    'flamengo.com.br — venda do plano Nação Maraca 1 (jan/2026)',
    'flamengorj.com.br e torcidaflamengo.com.br — reajuste de 10% (abr/2026)',
    'fla.app.br — guia dos planos Nação (nov/2025)',
  ],
};

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'plan-sem-fronteiras',
    name: 'Nação Sem Fronteiras',
    monthlyPrice: 21.8,
    tier: 'bronze',
    ticketPriority: 4,
    ticketDiscountPct: 0,
    audience: 'Para quem mora fora do Rio ou acompanha o time como visitante',
    guests: 'Até 2 por jogo',
    benefits: [
      'Prioridade em jogos como visitante, fora do RJ',
      'Até 2 jogos por ano no Maracanã (exceto semifinais e finais)',
      'Acesso à pré-venda (10% da carga reservada a sócios)',
      'Descontos com parceiros e embaixadas',
    ],
  },
  {
    id: 'plan-maraca-3',
    name: 'Nação Maraca 3',
    monthlyPrice: 67.1,
    priceIsEstimate: true,
    tier: 'silver',
    ticketPriority: 3,
    ticketDiscountPct: 60,
    guests: '1 convidado + opcionais',
    benefits: [
      '60% de desconto sobre a inteira no Maracanã',
      'Prioridade nível 3 na compra',
      'Acesso à pré-venda (10% da carga reservada a sócios)',
      'Rating que valoriza o tempo de permanência',
      'Acesso ao Pacote Maracanã',
    ],
  },
  {
    id: 'plan-maraca-2',
    name: 'Nação Maraca 2',
    monthlyPrice: 165,
    priceIsEstimate: true,
    tier: 'gold',
    ticketPriority: 2,
    ticketDiscountPct: 65,
    highlight: 'Equilíbrio',
    guests: '2 convidados + 2 opcionais (R$ 60/mês cada)',
    benefits: [
      '65% de desconto sobre a inteira no Maracanã',
      'Prioridade nível 2 na compra',
      'Acesso à pré-venda (10% da carga reservada a sócios)',
      'Rating que valoriza o tempo de permanência',
      'Prioridade de migração para o Maraca 1',
      'Acesso ao Pacote Maracanã',
    ],
  },
  {
    id: 'plan-maraca-1',
    name: 'Nação Maraca 1',
    monthlyPrice: 357.94,
    tier: 'black',
    ticketPriority: 1,
    ticketDiscountPct: 75,
    highlight: 'Vagas limitadas',
    guests: 'Até 3 convidados (R$ 60/mês cada)',
    benefits: [
      'Garantia do seu lugar o ano todo no Maracanã',
      '75% de desconto sobre a inteira',
      'Prioridade máxima na compra para todos os jogos como mandante no Maracanã',
      'Rating que valoriza o tempo de permanência',
      'Prioridade na compra do Pacote Maracanã',
    ],
  },
];

/** Benefícios do programa (fontes acima). Os de parceiros variam e são ilustrativos. */
export const BENEFITS: Benefit[] = [
  { id: 'b1', title: 'Pré-venda exclusiva', partner: 'Ingressos', description: 'Todos os planos acessam a pré-venda, com 10% da carga reservada a sócios.', category: 'ingressos', isDemo: true },
  { id: 'b2', title: 'Prioridade por plano e rating', partner: 'Ingressos', description: 'A fila de compra segue o plano (Maraca 1 → 2 → 3 → Sem Fronteiras) e o tempo de permanência.', category: 'ingressos', isDemo: true },
  { id: 'b3', title: 'Desconto sobre a inteira', partner: 'Ingressos', description: 'De 60% (Maraca 3) a 75% (Maraca 1) em jogos no Maracanã.', category: 'ingressos', isDemo: true },
  { id: 'b4', title: 'Pacote Maracanã', partner: 'Ingressos', description: 'Planos Maraca têm acesso ao pacote de jogos da temporada, por ordem de prioridade.', category: 'experiencias', isDemo: true },
  { id: 'b5', title: 'Parceiros e embaixadas', partner: 'Rede de parceiros', description: 'Descontos com parceiros e embaixadas da Nação pelo Brasil. Ofertas variam.', category: 'parceiros', isDemo: true },
];

/** Setores à venda. Inteira/meia são demonstrativas; o preço de sócio aplica 65% (plano Maraca 2 do torcedor demo). */
export const SECTOR_OFFERS: SectorOffer[] = [
  { sectorId: 'norte', name: 'Norte', gate: 'A', priceFull: 120, priceHalf: 60, priceMember: 42, availability: 'few-left' },
  { sectorId: 'sul', name: 'Sul', gate: 'E', priceFull: 120, priceHalf: 60, priceMember: 42, availability: 'available' },
  { sectorId: 'leste-inf', name: 'Leste Inferior', gate: 'C', priceFull: 160, priceHalf: 80, priceMember: 56, availability: 'available' },
  { sectorId: 'leste-sup', name: 'Leste Superior', gate: 'C', priceFull: 140, priceHalf: 70, priceMember: 49, availability: 'available' },
  { sectorId: 'oeste-inf', name: 'Oeste Inferior', gate: 'F', priceFull: 220, priceHalf: 110, priceMember: 77, availability: 'few-left' },
  { sectorId: 'oeste-sup', name: 'Oeste Superior', gate: 'F', priceFull: 190, priceHalf: 95, priceMember: 66, availability: 'sold-out' },
  { sectorId: 'visitante', name: 'Visitante', gate: 'B', priceFull: 120, priceHalf: 60, priceMember: 120, availability: 'available' },
];

export const SALE_PHASES = [
  { audience: 'Sócio Maracanã e Manto Sagrado', startsAt: demoDate(-3, '10:00') },
  { audience: 'Demais sócios', startsAt: demoDate(-2, '10:00') },
  { audience: 'Público geral', startsAt: demoDate(-1, '10:00') },
];
