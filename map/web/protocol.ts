/**
 * Mensagens entre o app (React Native) e o mapa (WebView). Tipos compartilhados pelos
 * dois lados: o app importa este arquivo na fase 4.
 *
 * Toda a interface (folha inferior, busca, cards) é do app; o mapa só desenha e avisa
 * dos toques.
 */
import type { StyleSpecification } from 'maplibre-gl';

import type { Area, Level, Sector, Venue } from '../../src/services/stadium/types';

type FC = import('geojson').FeatureCollection;
export type Theme = 'light' | 'dark';

/** Conteúdo de levels.json. */
export interface LevelsFile {
  levels: Level[];
  areas: Area[];
  sectors: Sector[];
}

export interface StadiumData {
  venue: Venue;
  levels: LevelsFile;
  stadium: FC;
  gates: FC;
  pois: FC;
}

/** Nível ativo, ou 'all' para a visão geral do estádio (sem pontos). */
export type LevelId = string | 'all';

/** App → mapa */
export type ToMap =
  | {
      type: 'init';
      data: StadiumData;
      styles: Record<Theme, StyleSpecification>;
      theme: Theme;
      level?: LevelId;
    }
  | { type: 'setTheme'; theme: Theme }
  | { type: 'setLevel'; level: LevelId }
  | { type: 'setFilters'; hidden: string[] }
  /** "Onde você está?": área do torcedor; `block` (ex.: "512") escolhe o nível quando a área tem mais de um. */
  | { type: 'setArea'; area: string | null; block?: string }
  | { type: 'focusPoi'; id: string }
  | { type: 'focusSector'; id: string }
  | { type: 'clearSelection' }
  | { type: 'setUserLocation'; lng: number; lat: number; accuracy: number; level: string | null }
  | { type: 'showRoute'; path: [number, number][] }
  | { type: 'clearRoute' }
  | { type: 'recenter' };

export interface CameraState {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

/** Mapa → app */
export type FromMap =
  | { type: 'ready' }
  | { type: 'levelChanged'; level: LevelId }
  | { type: 'poiTapped'; id: string }
  | { type: 'sectorTapped'; id: string }
  | { type: 'gateTapped'; id: string }
  | { type: 'cameraChanged'; camera: CameraState }
  | { type: 'error'; message: string };
