export type SectorAvailability = 'available' | 'few-left' | 'sold-out';

export interface SectorOffer {
  sectorId: string;
  name: string;
  /** Portão de acesso recomendado. */
  gate: string;
  priceFull: number;
  priceHalf: number;
  /** Preço para sócio-torcedor. */
  priceMember: number;
  availability: SectorAvailability;
}

export interface TicketSale {
  matchId: string;
  /** Abertura de vendas por público. */
  phases: { audience: string; startsAt: string }[];
  sectors: SectorOffer[];
  maxPerFan: number;
}

export type TicketType = 'full' | 'half' | 'member';

export interface PurchaseRequest {
  matchId: string;
  sectorId: string;
  type: TicketType;
  quantity: number;
}

export interface Ticket {
  id: string;
  matchId: string;
  sectorId: string;
  sectorName: string;
  gate: string;
  /** Ex.: "Fila K · Cadeira 14" (setores com lugar marcado) ou "Lugar livre". */
  seat: string;
  holderName: string;
  type: TicketType;
  price: number;
  purchasedAt: string;
  status: 'valid' | 'used' | 'cancelled';
  /** Conteúdo do QR — sempre marcado como demonstrativo. */
  qrPayload: string;
  isDemo: true;
}

export interface PurchaseResult {
  orderId: string;
  tickets: Ticket[];
  total: number;
  isDemo: true;
}
