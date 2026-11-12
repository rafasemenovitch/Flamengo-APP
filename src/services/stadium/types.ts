/**
 * Modelo de dados genérico de estádio (Maracanã hoje, Morumbis amanhã).
 * Nada aqui é específico de um estádio: nomes, níveis e setores vêm dos dados
 * em assets/stadiums/<id>/. Os mesmos arquivos alimentam o MapLibre JS (WebView)
 * e, no futuro, o MapLibre nativo.
 */

/** Grau de confiança de cada dado (ver SOURCES.md do estádio). */
export type Confidence = 'confirmado' | 'fonte_unica' | 'estimado';

/** Fonte citada por um dado; o id aponta para sources.json. */
export type SourceId = string;

export interface Source {
  id: SourceId;
  title: string;
  publisher: string;
  url: string;
  /** Data de publicação ou de acesso (AAAA-MM-DD). */
  date: string;
  note?: string;
}

export interface Sourced {
  source: SourceId[];
  confidence: Confidence;
  /** Como o dado foi obtido ou estimado. */
  note?: string;
}

export type Side = 'norte' | 'sul' | 'leste' | 'oeste';

export interface Level {
  id: string;
  /** "Nível 1" */
  name: string;
  /** "1", exibido na pílula do seletor. */
  short: string;
  public: boolean;
  /** Ordem vertical (0 = térreo). */
  order: number;
  /** Altura aproximada do piso do nível, em metros (extrusão 3D e rotas). */
  floor: number;
  description: string;
}

export type SectorKind = 'arquibancada' | 'camarote' | 'premium' | 'tribuna' | 'cativa';

export interface Sector extends Sourced {
  id: string;
  /** Nome no estádio ("Cadeira Leste Inferior"). */
  name: string;
  /** Nome de venda usado pelo clube mandante, se houver ("Leste Inferior"). */
  ticketName?: string;
  side: Side;
  level: string;
  kind: SectorKind;
  /** Blocos/seções numerados (o primeiro algarismo é o nível). */
  blocks: string[];
  gates: string[];
  ramps: string[];
  /** Setor usado pela torcida visitante (pode mudar por jogo). */
  visitor?: boolean;
}

/** Faixa da arquibancada como o torcedor fala: inferior, superior, camarote ou premium. */
export type Tier = 'inferior' | 'superior' | 'camarote' | 'premium';

/**
 * Área para o "Onde você está?": lado + faixa, na linguagem do torcedor ("Leste Inferior").
 * Agrupa um ou mais setores; quando a área ocupa mais de um nível (Norte Superior: blocos
 * 2xx e 5xx), o bloco do assento escolhe o nível.
 */
export interface Area {
  id: string;
  name: string;
  side: Side;
  tier: Tier;
  sectors: string[];
  /** Níveis públicos onde a área fica. */
  levels: string[];
  /** Nível mostrado quando a pessoa não informa o bloco. */
  defaultLevel: string;
  /** Blocos por nível (o primeiro algarismo do bloco é o nível). */
  blocks: Record<string, string[]>;
  visitor?: boolean;
}

export interface Gate extends Sourced {
  id: string;
  /** "Portão A" */
  name: string;
  /** Apelido histórico ("UERJ", "Bellini"). */
  nickname?: string;
  street: string;
  side: Side;
  ramp: string;
  /** Estação de metrô/trem mais próxima (id em venue.transit). */
  station: string;
  turnstiles?: number;
}

export interface Ramp extends Sourced {
  id: string;
  /** "Rampa A" */
  name: string;
  gate: string;
  monumental: boolean;
  /** Níveis públicos aos quais a rampa leva. */
  levels: string[];
}

export type PoiCategory =
  | 'banheiro'
  | 'banheiro_acessivel'
  | 'alimentacao'
  | 'bebidas'
  | 'loja'
  | 'elevador'
  | 'escada_rolante'
  | 'escada'
  | 'posto_medico'
  | 'informacao'
  | 'sala_sensorial'
  | 'bilheteria'
  | 'estacionamento'
  | 'saida_emergencia'
  /** Posto policial / segurança do estádio. */
  | 'seguranca'
  /** Juizado do Torcedor (JECrim) no estádio. */
  | 'juizado'
  /** Posto de acolhimento a vítimas de violência de gênero (assédio, importunação). */
  | 'acolhimento';

export interface Poi extends Sourced {
  id: string;
  category: PoiCategory;
  name: string;
  /** Nível onde fica; null = área externa (esplanada), visível em todos os níveis. */
  level: string | null;
  /** Para elevadores, escadas e escadas rolantes: todos os níveis que conectam. */
  levels?: string[];
  /** Setor mais próximo (id). */
  sector?: string;
}

export type WalkwayType = 'corredor' | 'rampa' | 'escada' | 'escada_rolante' | 'elevador' | 'externo';

export interface WalkwayNode {
  id: string;
  level: string | null;
  /** Ponto de interesse, portão ou setor ligado a este nó, se houver. */
  ref?: string;
}

export interface WalkwayEdge {
  id: string;
  from: string;
  to: string;
  type: WalkwayType;
  accessible: boolean;
  /** Comprimento em metros (horizontal + desnível). */
  length: number;
}

export interface TransitStation {
  id: string;
  name: string;
  lines: string[];
  lng: number;
  lat: number;
  source: SourceId[];
}

/** Canal de ajuda e denúncia (racismo, assédio, emergência), mostrado no card "Preciso de ajuda". */
export interface HelpChannel {
  id: string;
  name: string;
  /** Para que serve, em uma linha. */
  description: string;
  phone?: string;
  url?: string;
  /** Ponto de interesse no estádio, se houver atendimento presencial. */
  poi?: string;
  source: SourceId[];
}

/** Metadados do estádio: nome, enquadramento da câmera e entorno. */
export interface Venue {
  id: string;
  name: string;
  officialName: string;
  city: string;
  center: [number, number];
  /** Rumo do eixo maior do gramado (graus a partir do norte). */
  pitchBearing: number;
  /** [oeste, sul, leste, norte] — limites do mapa. */
  bounds: [number, number, number, number];
  attribution: string[];
  transit: TransitStation[];
  help: HelpChannel[];
  defaultLevel: string;
}

/** Conteúdo de levels.json. */
export interface LevelsFile {
  levels: Level[];
  areas: Area[];
  sectors: Sector[];
  ramps: Ramp[];
}

type FeatureCollection = import('geojson').FeatureCollection;

/** Tudo o que o mapa precisa de um estádio (gerado de assets/stadiums/<id>/). */
export interface StadiumData {
  venue: Venue;
  levels: LevelsFile;
  stadium: FeatureCollection;
  gates: FeatureCollection;
  pois: FeatureCollection;
}
