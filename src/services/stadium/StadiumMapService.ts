import type { StadiumData } from './types';

/**
 * Mapa do estádio (Modo Maracanã e, no futuro, Morumbis). Genérico: o id do estádio
 * escolhe os dados; nada da lógica conhece um estádio específico.
 */
export interface StadiumMapService {
  /** Geometria, níveis, áreas, portões e pontos de interesse de um estádio. */
  getStadiumData(venueId: string): Promise<StadiumData>;
}
