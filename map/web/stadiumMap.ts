/**
 * Núcleo do mapa do estádio (MapLibre GL JS). Roda na página de desenvolvimento
 * (map/dev/) e, a partir da fase 4, dentro da WebView do app.
 *
 * Genérico: nome, centro, eixo do campo e estações vêm de venue.json; geometria de
 * stadium/gates.geojson; cores e camadas do estilo (map/styles/). Nada de estádio
 * específico aqui.
 */
import maplibregl, { type Map as MlMap, type StyleSpecification } from 'maplibre-gl';

import type { Venue } from '../../src/services/stadium/types';
import { applyStyleImages } from './images';

export type Theme = 'light' | 'dark';
type FC = import('geojson').FeatureCollection;

export interface StadiumData {
  venue: Venue;
  stadium: FC;
  gates: FC;
}

export interface StadiumMapOptions {
  container: HTMLElement;
  data: StadiumData;
  styles: Record<Theme, StyleSpecification>;
  theme: Theme;
  /** Necessário só para tirar prints do canvas. */
  preserveDrawingBuffer?: boolean;
}

/** Limites da câmera: o usuário não sai do entorno nem vê a cidade inteira. */
export const LIMITS = {
  minZoom: 15.5,
  maxZoom: 19.5,
  /** Raio em volta do centro do estádio. */
  radius: 600,
  /** Folga em volta de cada estação, que podem ficar além do raio. */
  stationMargin: 150,
  pitch: 50,
  maxPitch: 70,
};

const M_PER_DEG = 111_320;
const EARTH = 40_075_016.686;

export function maxBounds(venue: Venue): [[number, number], [number, number]] {
  const [lng, lat] = venue.center;
  const mLng = M_PER_DEG * Math.cos((lat * Math.PI) / 180);
  let w = lng - LIMITS.radius / mLng,
    e = lng + LIMITS.radius / mLng,
    s = lat - LIMITS.radius / M_PER_DEG,
    n = lat + LIMITS.radius / M_PER_DEG;
  for (const st of venue.transit) {
    w = Math.min(w, st.lng - LIMITS.stationMargin / mLng);
    e = Math.max(e, st.lng + LIMITS.stationMargin / mLng);
    s = Math.min(s, st.lat - LIMITS.stationMargin / M_PER_DEG);
    n = Math.max(n, st.lat + LIMITS.stationMargin / M_PER_DEG);
  }
  return [
    [w, s],
    [e, n],
  ];
}

/**
 * Câmera inicial: eixo maior do campo na horizontal da tela, inclinação de 50° e zoom
 * que enquadra o estádio com a esplanada na largura disponível.
 */
export function initialCamera(venue: Venue, width: number) {
  const lat = venue.center[1];
  const metersAcross = 480; // fachada (~330 m no eixo maior) + esplanada e portões B, C, E, F
  const mpp = metersAcross / Math.max(width, 280);
  const zoom = Math.log2((EARTH * Math.cos((lat * Math.PI) / 180)) / (512 * mpp));
  const bearing = ((venue.pitchBearing + 90 + 540) % 360) - 180;
  return {
    center: venue.center,
    zoom: Math.min(17.4, Math.max(LIMITS.minZoom, zoom)),
    pitch: LIMITS.pitch,
    bearing,
  };
}

function transitFc(venue: Venue): FC {
  return {
    type: 'FeatureCollection',
    features: venue.transit.map((s) => ({
      type: 'Feature',
      properties: { id: s.id, name: s.name, lines: s.lines.join(' · ') },
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
    })),
  };
}

/** Estilo com os dados do estádio já dentro das fontes GeoJSON. */
function withData(style: StyleSpecification, data: StadiumData): StyleSpecification {
  const sources = { ...style.sources } as Record<string, any>;
  sources.stadium = { ...sources.stadium, data: data.stadium };
  sources.gates = { ...sources.gates, data: data.gates };
  sources.transit = { ...sources.transit, data: transitFc(data.venue) };
  return { ...style, sources };
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export class StadiumMap {
  readonly map: MlMap;
  private theme: Theme;

  constructor(private readonly opts: StadiumMapOptions) {
    const { container, data, theme } = opts;
    this.theme = theme;
    const style = withData(opts.styles[theme], data);
    this.paintContainer(style);
    this.map = new maplibregl.Map({
      container,
      style,
      ...initialCamera(data.venue, container.clientWidth),
      minZoom: LIMITS.minZoom,
      maxZoom: LIMITS.maxZoom,
      maxPitch: LIMITS.maxPitch,
      maxBounds: maxBounds(data.venue),
      attributionControl: false,
      canvasContextAttributes: { preserveDrawingBuffer: !!opts.preserveDrawingBuffer, antialias: true },
    });
    this.map.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-right');
    this.map.on('style.load', () => applyStyleImages(this.map, this.currentStyle()));
  }

  private currentStyle() {
    return this.opts.styles[this.theme];
  }

  /** Fundo do contêiner igual ao do estilo: sem clarão branco antes do primeiro quadro. */
  private paintContainer(style: StyleSpecification) {
    const bg = (style.metadata as Record<string, string>)['fla:background'];
    this.opts.container.style.background = bg;
    this.opts.container.dataset.theme = (style.metadata as Record<string, string>)['fla:theme'];
  }

  setTheme(theme: Theme) {
    if (theme === this.theme) return;
    this.theme = theme;
    const style = withData(this.opts.styles[theme], this.opts.data);
    this.paintContainer(style);
    this.map.setStyle(style, { diff: true });
    applyStyleImages(this.map, style);
  }

  /** Volta à câmera inicial com um voo curto (sem animação se o sistema pedir menos movimento). */
  recenter() {
    const cam = initialCamera(this.opts.data.venue, this.opts.container.clientWidth);
    if (reducedMotion()) this.map.jumpTo(cam);
    else this.map.flyTo({ ...cam, duration: 800, essential: false });
  }
}
