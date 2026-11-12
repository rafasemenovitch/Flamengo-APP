/**
 * Maracanã: mapa ESQUEMÁTICO próprio (não é planta oficial) + coordenadas
 * geográficas APROXIMADAS para o mapa de "Como chegar".
 */
export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface StadiumSector {
  id: string;
  /** Área correspondente no mapa do estádio (levels.json → areas), para o "Onde você está?". */
  areaId: string;
  name: string;
  /** Ângulo inicial/final do arco do setor, em graus (0 = topo, sentido horário). */
  arc: [number, number];
  /** Leste/Oeste têm anel inferior e superior; Norte/Sul (atrás dos gols) ocupam o anel todo. */
  ring: 'lower' | 'upper' | 'full';
  description: string;
  /** Chave da foto da vista do setor (placeholder até haver fotos). */
  viewImageKey: string;
}

export interface StadiumGate {
  id: string;
  label: string;
  sectorIds: string[];
  /** Posição no esquema (0–100). */
  x: number;
  y: number;
  /** Posição aproximada no mapa da cidade. */
  coords: LatLng;
  accessible: boolean;
  /** Referência de rua/acesso. */
  access: string;
}

export type FacilityType = 'restroom' | 'food' | 'store' | 'first-aid' | 'accessibility' | 'atm';

export interface Facility {
  id: string;
  type: FacilityType;
  label: string;
  description: string;
  x: number;
  y: number;
  nearSectorIds: string[];
}

export type TransportMode = 'metro' | 'train' | 'bus' | 'brt' | 'app' | 'walk';

export interface TransportPoint {
  id: string;
  mode: TransportMode;
  title: string;
  details: string;
  coords: LatLng;
  /** Texto de busca usado para abrir a rota no app de mapas (mais preciso que coordenadas). */
  mapsQuery: string;
  /** Portões mais próximos, em ordem. */
  bestGateIds: string[];
  /** Caminhada até o portão mais próximo, em minutos. */
  walkMinutes: number;
}

export interface Stadium {
  id: string;
  name: string;
  nickname: string;
  capacity: number;
  address: string;
  coords: LatLng;
  mapsQuery: string;
  sectors: StadiumSector[];
  gates: StadiumGate[];
  facilities: Facility[];
  transport: TransportPoint[];
  tips: string[];
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

/** Cadastro facial para acesso ao estádio (vinculado à conta, usado pelo ingresso). */
export interface FaceEnrollment {
  status: 'not-enrolled' | 'enrolled';
  enrolledAt?: string;
  /** Sempre demonstrativo: a imagem não sai do aparelho nesta versão. */
  isDemo: true;
}
