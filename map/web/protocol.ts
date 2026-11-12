/**
 * Mensagens entre o app (React Native) e o mapa (WebView). Tipos compartilhados pelos
 * dois lados: o app importa este arquivo na fase 4.
 *
 * Toda a interface (folha inferior, busca, cards) é do app; o mapa só desenha e avisa
 * dos toques.
 */
import type { StyleSpecification } from 'maplibre-gl';

import type { LevelsFile, StadiumData } from '../../src/services/stadium/types';

export type { LevelsFile, StadiumData };
export type Theme = 'light' | 'dark';

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
  /** Espaço coberto pela interface do app (topo e folha inferior), em pixels lógicos. */
  | { type: 'setInsets'; top: number; bottom: number; right?: number }
  | { type: 'setLevel'; level: LevelId }
  | { type: 'setFilters'; hidden: string[] }
  /** "Onde você está?": área do torcedor; `block` (ex.: "512") escolhe o nível quando a área tem mais de um. */
  | { type: 'setArea'; area: string | null; block?: string }
  | { type: 'focusPoi'; id: string }
  | { type: 'focusSector'; id: string }
  | { type: 'clearSelection' }
  /** Posição do torcedor: `accuracy` em metros (círculo de precisão); `level` null = sem nível. */
  | { type: 'setUserLocation'; lng: number; lat: number; accuracy: number; level: string | null }
  | { type: 'clearUserLocation' }
  /** Leva a câmera até o torcedor. */
  | { type: 'focusUser' }
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
  /** A página carregou e espera o `init` (antes disso, mensagens se perderiam). */
  | { type: 'loaded' }
  | { type: 'ready' }
  | { type: 'levelChanged'; level: LevelId }
  | { type: 'poiTapped'; id: string }
  | { type: 'sectorTapped'; id: string }
  | { type: 'gateTapped'; id: string }
  | { type: 'cameraChanged'; camera: CameraState }
  | { type: 'error'; message: string };
