/**
 * Mapa ESQUEMÁTICO próprio (não é planta oficial). Coordenadas num viewBox
 * 0–100 × 0–100 desenhado em SVG pela tela do Modo Maracanã.
 */
export interface StadiumSector {
  id: string;
  name: string;
  /** Ângulo inicial/final do arco do setor, em graus (0 = topo, sentido horário). */
  arc: [number, number];
  ring: 'lower' | 'upper';
}

export interface StadiumGate {
  id: string;
  label: string;
  sectorIds: string[];
  /** Posição no esquema (0–100). */
  x: number;
  y: number;
  accessible: boolean;
}

export type FacilityType = 'restroom' | 'food' | 'store' | 'first-aid' | 'accessibility' | 'atm';

export interface Facility {
  id: string;
  type: FacilityType;
  label: string;
  x: number;
  y: number;
  nearSectorIds: string[];
}

export interface TransportOption {
  id: string;
  mode: 'metro' | 'train' | 'bus' | 'brt' | 'app' | 'walk';
  title: string;
  details: string;
  /** Tempo estimado a partir da estação/ponto até o portão. */
  walkMinutes?: number;
}

export interface ParkingOption {
  id: string;
  name: string;
  distance: string;
  price: string;
  note?: string;
}

export interface Stadium {
  id: string;
  name: string;
  nickname: string;
  capacity: number;
  address: string;
  sectors: StadiumSector[];
  gates: StadiumGate[];
  facilities: Facility[];
  transport: TransportOption[];
  parking: ParkingOption[];
}

export interface GateQueue {
  gateId: string;
  waitMinutes: number;
  level: 'low' | 'medium' | 'high';
}

export interface MatchDayPlan {
  matchId: string;
  gatesOpenAt: string;
  /** Horário recomendado de chegada ao portão. */
  recommendedArrival: string;
  recommendedGateId: string;
  queues: GateQueue[];
  /** Avisos do dia (ex.: "Proibido entrada com guarda-chuva"). */
  notices: string[];
  isDemo: true;
}
