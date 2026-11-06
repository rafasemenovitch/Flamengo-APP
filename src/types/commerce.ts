export type ProductCategory = 'camisas' | 'treino' | 'casual' | 'acessorios' | 'infantil';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  /** Preço anterior, quando em promoção. */
  compareAtPrice?: number;
  sizes?: string[];
  description: string;
  imageKey: string;
  tag?: 'Lançamento' | 'Mais vendido' | 'Promoção' | 'Exclusivo sócio';
  /** Desconto para sócio-torcedor, em %. */
  memberDiscountPct: number;
}

export interface CartItem {
  productId: string;
  size?: string;
  quantity: number;
}

export interface Cart {
  items: Array<CartItem & { product: Product; lineTotal: number }>;
  subtotal: number;
  memberDiscount: number;
  shipping: number;
  total: number;
}

export interface OrderResult {
  orderId: string;
  total: number;
  createdAt: string;
  isDemo: true;
}

export interface MembershipPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  /** Cor de destaque do plano (token de paleta). */
  tier: 'bronze' | 'silver' | 'gold' | 'black';
  highlight?: string;
  /** 1 = prioridade máxima na compra de ingressos. */
  ticketPriority: number;
  /** Desconto sobre a inteira em jogos no Maracanã (0 quando o plano não tem). */
  ticketDiscountPct: number;
  /** Para quem é o plano (ex.: "Torcedores fora do Rio"). */
  audience?: string;
  /** Regra de convidados, como divulgada. */
  guests?: string;
  /** true quando o preço é estimado (fonte não divulgou o valor atualizado). */
  priceIsEstimate?: boolean;
  benefits: string[];
}

/** Metadados do programa de sócio e das fontes consultadas. */
export interface MembershipProgramInfo {
  name: string;
  checkedAt: string;
  priceNote: string;
  officialUrl: string;
  sources: string[];
}

export interface Membership {
  planId: string;
  memberNumber: string;
  holderName: string;
  since: string;
  validUntil: string;
  status: 'active' | 'pending' | 'expired';
  /** Pontos de prioridade para compra de ingressos. */
  priorityPoints: number;
  isDemo: true;
}

export interface Benefit {
  id: string;
  title: string;
  partner: string;
  description: string;
  category: 'ingressos' | 'loja' | 'experiencias' | 'parceiros';
  isDemo: true;
}
