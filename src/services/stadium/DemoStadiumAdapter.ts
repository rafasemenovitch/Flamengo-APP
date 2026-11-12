import maracana from './generated/maracana';
import type { StadiumMapService } from './StadiumMapService';
import type { StadiumData } from './types';

/**
 * Dados locais, gerados de assets/stadiums/<id>/ por `npm run map:build`. Funcionam sem
 * internet; quando houver plantas oficiais, só os dados mudam.
 */
const LOCAL: Record<string, StadiumData> = { maracana };

export function createDemoStadiumMapService(): StadiumMapService {
  return {
    async getStadiumData(venueId) {
      const data = LOCAL[venueId];
      if (!data) throw new Error(`Estádio sem dados de mapa: ${venueId}`);
      return data;
    },
  };
}
