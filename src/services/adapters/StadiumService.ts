import type { MatchDayPlan, Stadium } from '@/types/stadium';

/** Modo Maracanã: mapa esquemático, setores, portões, serviços, transporte, filas. */
export interface StadiumService {
  getStadium(): Promise<Stadium>;
  getMatchDayPlan(matchId: string, sectorId?: string): Promise<MatchDayPlan>;
}
