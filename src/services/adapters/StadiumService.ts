import type { GateQueue, MatchDayPlan, Stadium } from '@/types/stadium';

/** Modo Maracanã (aberto a todos): mapa, setores, portões, serviços, transporte, filas. */
export interface StadiumService {
  getStadium(): Promise<Stadium>;
  /** Fila estimada em cada portão agora (não depende de ingresso). */
  getQueues(): Promise<GateQueue[]>;
  /** Plano do dia de jogo para QUEM TEM INGRESSO (usado no ingresso e no banner da Home). */
  getMatchDayPlan(matchId: string, sectorId?: string): Promise<MatchDayPlan>;
}
