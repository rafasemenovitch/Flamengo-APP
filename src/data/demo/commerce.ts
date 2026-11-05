import type { Benefit, MembershipPlan, Product } from '@/types/commerce';
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

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  { id: 'plan-raiz', name: 'Raiz', monthlyPrice: 29.9, tier: 'bronze', ticketPriority: 1, ticketDiscountPct: 20, storeDiscountPct: 5, benefits: ['20% de desconto em ingressos', 'Prioridade básica na compra', '5% de desconto na loja'] },
  { id: 'plan-nacao', name: 'Nação', monthlyPrice: 69.9, tier: 'silver', ticketPriority: 2, ticketDiscountPct: 35, storeDiscountPct: 10, highlight: 'Mais escolhido', benefits: ['35% de desconto em ingressos', 'Prioridade intermediária', '10% de desconto na loja', 'Conteúdo exclusivo na FlaTV'] },
  { id: 'plan-manto', name: 'Manto Sagrado', monthlyPrice: 149.9, tier: 'gold', ticketPriority: 3, ticketDiscountPct: 50, storeDiscountPct: 15, benefits: ['50% de desconto em ingressos', 'Alta prioridade na compra', '15% de desconto na loja', 'Conteúdo exclusivo na FlaTV', 'Sorteio de experiências no CT'] },
  { id: 'plan-maraca', name: 'Maracanã', monthlyPrice: 399.9, tier: 'black', ticketPriority: 4, ticketDiscountPct: 100, storeDiscountPct: 20, benefits: ['Ingresso garantido em jogos em casa', 'Prioridade máxima', '20% de desconto na loja', 'Acesso antecipado ao estádio', 'Encontro anual com o elenco'] },
];

export const BENEFITS: Benefit[] = [
  { id: 'b1', title: '15% em camisas oficiais', partner: 'Loja do app', description: 'Desconto aplicado automaticamente no carrinho.', category: 'loja', isDemo: true },
  { id: 'b2', title: 'Pré-venda de ingressos', partner: 'Ingressos', description: 'Compre antes do público geral, por ordem de prioridade.', category: 'ingressos', isDemo: true },
  { id: 'b3', title: 'Tour pelo estádio', partner: 'Experiências', description: 'Visita guiada com acompanhante.', category: 'experiencias', isDemo: true },
  { id: 'b4', title: '20% em academias parceiras', partner: 'Parceiro demonstrativo', description: 'Benefício ilustrativo de rede de parceiros.', category: 'parceiros', isDemo: true },
  { id: 'b5', title: 'Cashback em transporte por app', partner: 'Parceiro demonstrativo', description: 'Em dias de jogo, ida e volta ao estádio.', category: 'parceiros', isDemo: true },
];

/** Setores à venda (preços demonstrativos). */
export const SECTOR_OFFERS: SectorOffer[] = [
  { sectorId: 'norte', name: 'Norte', gate: 'A', priceFull: 120, priceHalf: 60, priceMember: 60, availability: 'few-left' },
  { sectorId: 'sul', name: 'Sul', gate: 'E', priceFull: 120, priceHalf: 60, priceMember: 60, availability: 'available' },
  { sectorId: 'leste-inf', name: 'Leste Inferior', gate: 'C', priceFull: 160, priceHalf: 80, priceMember: 90, availability: 'available' },
  { sectorId: 'leste-sup', name: 'Leste Superior', gate: 'C', priceFull: 140, priceHalf: 70, priceMember: 75, availability: 'available' },
  { sectorId: 'oeste-inf', name: 'Oeste Inferior', gate: 'F', priceFull: 220, priceHalf: 110, priceMember: 130, availability: 'few-left' },
  { sectorId: 'oeste-sup', name: 'Oeste Superior', gate: 'F', priceFull: 190, priceHalf: 95, priceMember: 110, availability: 'sold-out' },
  { sectorId: 'visitante', name: 'Visitante', gate: 'B', priceFull: 120, priceHalf: 60, priceMember: 120, availability: 'available' },
];

export const SALE_PHASES = [
  { audience: 'Sócio Maracanã e Manto Sagrado', startsAt: demoDate(-3, '10:00') },
  { audience: 'Demais sócios', startsAt: demoDate(-2, '10:00') },
  { audience: 'Público geral', startsAt: demoDate(-1, '10:00') },
];
