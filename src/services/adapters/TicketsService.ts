import type { PurchaseRequest, PurchaseResult, Ticket, TicketSale } from '@/types/tickets';

/** Venda (simulada), carteira e QR demonstrativo. */
export interface TicketsService {
  getSales(): Promise<TicketSale[]>;
  getSale(matchId: string): Promise<TicketSale>;
  /** No modo demo, nunca cobra nada: devolve ingressos marcados como DEMO. */
  purchase(request: PurchaseRequest): Promise<PurchaseResult>;
  getWallet(): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket>;
}
