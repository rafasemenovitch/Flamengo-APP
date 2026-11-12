import { useAsync } from '@/hooks/useAsync';
import { services } from '@/services';
import type { Ticket } from '@/types/tickets';

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

/** "Bloco 118 · Fila K · Cadeira 14" → "118". */
export const blockOf = (seat?: string) => /bloco\s*(\d{3})/i.exec(seat ?? '')?.[1];

/**
 * Ingresso para um jogo de hoje, se houver. O Modo Maracanã não exige ingresso: quando
 * existe, ele só preenche o "Você está em" e mostra portão e entrada.
 */
export function useTodayTicket() {
  return useAsync(async (): Promise<(Ticket & { areaId?: string; block?: string }) | null> => {
    const [wallet, stadium] = await Promise.all([
      services.tickets.getWallet(),
      services.stadium.getStadium(),
    ]);
    for (const t of wallet) {
      if (t.status !== 'valid') continue;
      const match = await services.matches.getMatch(t.matchId).catch(() => undefined);
      if (!match || !isToday(match.kickoff)) continue;
      const areaId = stadium.sectors.find((s) => s.id === t.sectorId)?.areaId;
      return { ...t, areaId, block: blockOf(t.seat) };
    }
    return null;
  });
}
