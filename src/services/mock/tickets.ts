import { SALE_PHASES, SECTOR_OFFERS } from '@/data/demo/commerce';
import { DEMO_FAN, DEMO_TICKETS } from '@/data/demo/fan';
import { MATCH_SEEDS } from '@/data/demo/matches';
import type { StadiumService, TicketsService } from '@/services/adapters';
import type { Ticket, TicketSale } from '@/types/tickets';
import { STADIUM, GATE_QUEUES, MATCH_DAY_NOTICES } from '@/data/demo/stadium';
import type { MatchDayPlan } from '@/types/stadium';
import { delay, hash, newId, NotFoundError } from './utils';

/** Carteira em memória (reinicia ao recarregar o app). */
const wallet: Ticket[] = [...DEMO_TICKETS];

function saleFor(matchId: string): TicketSale {
  const h = hash(matchId);
  return {
    matchId,
    phases: SALE_PHASES,
    maxPerFan: 4,
    // Pequena variação de disponibilidade por jogo, para não ficar tudo igual.
    sectors: SECTOR_OFFERS.map((s, i) =>
      (h >> i) % 7 === 0 && s.availability === 'available' ? { ...s, availability: 'few-left' as const } : s
    ),
  };
}

export function createMockTicketsService(): TicketsService {
  return {
    getSales: async () => delay(MATCH_SEEDS.filter((m) => m.ticketsOnSale).map((m) => saleFor(m.id))),
    getSale: async (matchId) => {
      if (!MATCH_SEEDS.some((m) => m.id === matchId)) throw new NotFoundError('Venda', matchId);
      return delay(saleFor(matchId));
    },
    async purchase({ matchId, sectorId, type, quantity }) {
      const offer = SECTOR_OFFERS.find((s) => s.sectorId === sectorId);
      if (!offer) throw new NotFoundError('Setor', sectorId);
      if (offer.availability === 'sold-out') throw new Error('Setor esgotado.');
      const price = type === 'full' ? offer.priceFull : type === 'half' ? offer.priceHalf : offer.priceMember;
      const orderId = newId('DEMO');
      const tickets: Ticket[] = Array.from({ length: quantity }, (_, i) => {
        const id = newId('t');
        return {
          id,
          matchId,
          sectorId,
          sectorName: offer.name,
          gate: offer.gate,
          seat: sectorId.includes('inf') || sectorId.includes('sup') ? `Fila ${String.fromCharCode(70 + i)} · Cadeira ${10 + i}` : 'Lugar livre no setor',
          holderName: DEMO_FAN.name,
          type,
          price,
          purchasedAt: new Date().toISOString(),
          status: 'valid',
          qrPayload: `DEMONSTRATIVO-SEM-VALIDADE-${id}`,
          isDemo: true,
        };
      });
      wallet.unshift(...tickets);
      return delay({ orderId, tickets, total: price * quantity, isDemo: true as const }, 900);
    },
    getWallet: async () => delay(wallet),
    getTicket: async (id) => {
      const t = wallet.find((x) => x.id === id);
      if (!t) throw new NotFoundError('Ingresso', id);
      return delay(t);
    },
  };
}

export function createMockStadiumService(): StadiumService {
  return {
    getStadium: async () => delay(STADIUM),
    async getMatchDayPlan(matchId, sectorId) {
      const ticket = wallet.find((t) => t.matchId === matchId);
      const sector = sectorId ?? ticket?.sectorId;
      const gate = STADIUM.gates.find((g) => sector && g.sectorIds.includes(sector)) ?? STADIUM.gates[0]!;
      const seed = MATCH_SEEDS.find((m) => m.id === matchId);
      const queues = Object.entries(GATE_QUEUES).map(([gateId, base]) => {
        const wait = Math.max(3, base + ((hash(matchId + gateId) % 7) - 3));
        return { gateId, waitMinutes: wait, level: wait < 8 ? ('low' as const) : wait < 15 ? ('medium' as const) : ('high' as const) };
      });
      const plan: MatchDayPlan = {
        matchId,
        // Horários relativos ao início do jogo são calculados na UI a partir do kickoff.
        gatesOpenAt: '-150',
        recommendedArrival: gate.id === 'A' || gate.id === 'E' ? '-90' : '-75',
        recommendedGateId: gate.id,
        queues,
        notices: seed ? MATCH_DAY_NOTICES : [],
        isDemo: true,
      };
      return delay(plan);
    },
  };
}
