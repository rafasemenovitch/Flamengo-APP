/**
 * Núcleo do mapa do estádio (MapLibre GL JS). Roda na página de desenvolvimento
 * (map/dev/) e, a partir da fase 4, dentro da WebView do app (via bridge.ts).
 *
 * Genérico: nome, centro, eixo do campo, áreas e estações vêm dos dados
 * (assets/stadiums/<id>/); cores e camadas do estilo (map/styles/). O estado
 * (nível, área, seleção, filtros) é "global-state" do estilo: o código só muda valores.
 */
import maplibregl, {
  type GeoJSONSource,
  type Map as MlMap,
  type MapGeoJSONFeature,
  type StyleSpecification,
} from 'maplibre-gl';

import { applyStyleImages } from './images';
import type { CameraState, FromMap, LevelId, StadiumData, Theme } from './protocol';

export type { StadiumData, Theme } from './protocol';
type Feature = import('geojson').Feature;
type FC = import('geojson').FeatureCollection;
type Point = import('geojson').Point;

export interface StadiumMapOptions {
  container: HTMLElement;
  data: StadiumData;
  styles: Record<Theme, StyleSpecification>;
  theme: Theme;
  level?: LevelId;
  /** Avisos para o app (toques, câmera, nível). */
  emit?: (msg: FromMap) => void;
  /** Necessário só para tirar prints do canvas. */
  preserveDrawingBuffer?: boolean;
  /** "Reduzir movimento" vindo do app. */
  reducedMotion?: boolean;
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
/** Altura relativa das extrusões com um nível ativo: o estádio "baixa" e os pontos ficam no lugar. */
const FLAT = 0.3;
const LEVEL_MS = 520;

const M_PER_DEG = 111_320;
const EARTH = 40_075_016.686;

export function maxBounds(venue: StadiumData['venue']): [[number, number], [number, number]] {
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

const zoomFor = (lat: number, metersAcross: number, width: number) =>
  Math.log2((EARTH * Math.cos((lat * Math.PI) / 180)) / (512 * (metersAcross / Math.max(width, 280))));

/**
 * Câmera inicial: eixo maior do campo na horizontal da tela, inclinação de 50° e zoom
 * que enquadra o estádio com a esplanada e os seis portões na largura disponível.
 */
export function initialCamera(venue: StadiumData['venue'], width: number) {
  const bearing = ((venue.pitchBearing + 90 + 540) % 360) - 180;
  return {
    center: venue.center,
    zoom: Math.min(17.4, Math.max(LIMITS.minZoom, zoomFor(venue.center[1], 480, width))),
    pitch: LIMITS.pitch,
    bearing,
  };
}

function transitFc(venue: StadiumData['venue']): FC {
  return {
    type: 'FeatureCollection',
    features: venue.transit.map((s) => ({
      type: 'Feature',
      properties: { id: s.id, name: s.name, lines: s.lines.join(' · ') },
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
    })),
  };
}

const fc = (features: Feature[]): FC => ({ type: 'FeatureCollection', features });
let appReducedMotion = false;
const reducedMotion = () =>
  appReducedMotion || (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
const ease = (t: number) => 1 - (1 - t) ** 3;

/** Média dos vértices (basta para mirar a câmera num setor). */
function centroid(features: Feature[]): [number, number] {
  let x = 0,
    y = 0,
    n = 0;
  for (const f of features)
    if (f.geometry.type === 'Polygon')
      for (const [lng, lat] of f.geometry.coordinates[0]) {
        x += lng;
        y += lat;
        n++;
      }
  return [x / n, y / n];
}

/** Círculo de raio `r` metros em volta de `c`, como polígono (precisão do GPS). */
function circlePolygon(c: [number, number], r: number): import('geojson').Polygon {
  const k = Math.cos((c[1] * Math.PI) / 180);
  const ring = Array.from({ length: 49 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    return [c[0] + (r * Math.cos(a)) / (M_PER_DEG * k), c[1] + (r * Math.sin(a)) / M_PER_DEG];
  });
  return { type: 'Polygon', coordinates: [ring] };
}

/** Rumo (graus) de a para b. */
function bearingTo(a: [number, number], b: [number, number]) {
  const k = Math.cos((a[1] * Math.PI) / 180);
  return (Math.atan2((b[0] - a[0]) * k, b[1] - a[1]) * 180) / Math.PI;
}

export class StadiumMap {
  readonly map: MlMap;
  private theme: Theme;
  private level: LevelId = 'all';
  private flatten = 1;
  private anim = 0;
  private selectedPoi: Feature | null = null;
  private readonly categories: string[];
  private readonly poiById = new Map<string, Feature>();

  constructor(private readonly opts: StadiumMapOptions) {
    const { container, data, theme } = opts;
    const t0 = performance.now();
    appReducedMotion = !!opts.reducedMotion;
    this.theme = theme;
    const style = this.withData(opts.styles[theme]);
    this.categories = Object.keys((style.metadata as Record<string, object>)['fla:poi']);
    for (const f of data.pois.features) this.poiById.set(String(f.properties!.id), f);
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
    this.map.on('style.load', () => applyStyleImages(this.map, this.opts.styles[this.theme]));
    this.map.once('load', () => {
      if (opts.level && opts.level !== 'all') this.setLevel(opts.level, false);
      this.emit({ type: 'ready', ms: Math.round(performance.now() - t0) });
    });
    this.map.on('click', (e) => void this.onClick(e.point));
    this.map.on('moveend', () => this.emit({ type: 'cameraChanged', camera: this.camera() }));
    let tilesWarned = false;
    this.map.on('error', (e) => {
      // Sem internet, só o mapa da cidade falha: avisa uma vez; o estádio continua inteiro.
      if (
        (e as { sourceId?: string }).sourceId === 'openmaptiles' ||
        /openfreemap|tiles/i.test(String(e.error?.message))
      ) {
        if (!tilesWarned) this.emit({ type: 'tilesUnavailable' });
        tilesWarned = true;
        return;
      }
      this.emit({ type: 'error', message: String(e.error?.message ?? e.error) });
    });
    // Ponteiro de mão sobre o que é tocável (navegador).
    this.map.on('mousemove', (e) => {
      const hit = this.map.queryRenderedFeatures(e.point, { layers: this.tappableLayers() }).length > 0;
      this.map.getCanvas().style.cursor = hit ? 'pointer' : '';
    });
  }

  private emit(msg: FromMap) {
    this.opts.emit?.(msg);
  }

  camera(): CameraState {
    const c = this.map.getCenter();
    return {
      center: [c.lng, c.lat],
      zoom: this.map.getZoom(),
      pitch: this.map.getPitch(),
      bearing: this.map.getBearing(),
    };
  }

  /** Estilo com os dados do estádio já dentro das fontes GeoJSON. */
  private withData(style: StyleSpecification): StyleSpecification {
    const { data } = this.opts;
    const sources = { ...style.sources } as Record<string, any>;
    sources.stadium = { ...sources.stadium, data: data.stadium };
    sources.gates = { ...sources.gates, data: data.gates };
    sources.transit = { ...sources.transit, data: transitFc(data.venue) };
    return { ...style, sources };
  }

  /** Fundo do contêiner igual ao do estilo: sem clarão branco antes do primeiro quadro. */
  private paintContainer(style: StyleSpecification) {
    const meta = style.metadata as Record<string, string>;
    this.opts.container.style.background = meta['fla:background'];
    this.opts.container.dataset.theme = meta['fla:theme'];
  }

  setTheme(theme: Theme) {
    if (theme === this.theme) return;
    this.theme = theme;
    const style = this.withData(this.opts.styles[theme]);
    this.paintContainer(style);
    this.map.setStyle(style, { diff: true });
    applyStyleImages(this.map, style);
    // O estilo novo traz as fontes vazias: devolve pontos, seleção e a sua posição.
    this.applyPois();
    if (this.selectedPoi) (this.map.getSource('selection') as GeoJSONSource).setData(fc([this.selectedPoi]));
    if (this.user) this.setUserLocation(this.user.at, this.user.accuracy, this.user.level);
    if (this.route.length) {
      const segs = this.route;
      // Sem novo voo de câmera: só devolve os dados da rota ao estilo novo.
      (this.map.getSource('route') as GeoJSONSource).setData(
        fc(
          segs.map((s) => ({
            type: 'Feature',
            properties: { level: s.level ?? '' },
            geometry: { type: 'LineString', coordinates: s.coords },
          }))
        )
      );
    }
  }

  /**
   * Área coberta pela interface do app: a câmera centraliza no que sobra e a atribuição
   * do mapa sobe para ficar visível acima da folha inferior.
   */
  setInsets(top: number, bottom: number, right = 0) {
    this.opts.container.style.setProperty('--attrib-bottom', `${bottom}px`);
    const apply = () => this.map.setPadding({ top, bottom, left: 0, right });
    // Mudar a margem durante um voo interromperia a animação: espera ela terminar.
    if (this.map.isMoving()) this.map.once('moveend', apply);
    else apply();
  }

  // ───────────────────────────── níveis
  getLevel() {
    return this.level;
  }

  /** Pontos que aparecem num nível: os dele, os que conectam a ele (escadas, elevadores) e os externos. */
  private poisOn(level: LevelId) {
    if (level === 'all') return [];
    return this.opts.data.pois.features.filter((f) => {
      const p = f.properties as { level: string | null; levels?: string[] | null };
      return p.level === level || p.level === null || (p.levels ?? []).includes(level);
    });
  }

  private applyPois() {
    const on = this.poisOn(this.level);
    for (const cat of this.categories)
      (this.map.getSource(`poi-${cat}`) as GeoJSONSource | undefined)?.setData(
        fc(on.filter((f) => f.properties!.category === cat))
      );
  }

  /**
   * Troca o nível. Na visão geral ('all') o estádio fica inteiro em 3D e sem pontos; com um
   * nível ativo ele baixa (fade + altura), os outros níveis ficam translúcidos e aparecem
   * os pontos daquele nível.
   */
  setLevel(level: LevelId, animate = true) {
    if (level !== 'all' && !this.opts.data.levels.levels.some((l) => l.public && l.id === level)) return;
    const fromOverview = this.level === 'all';
    this.level = level;
    this.map.setGlobalStateProperty('level', level);
    this.applyPois();
    if (this.selectedPoi && !this.poisOn(level).includes(this.selectedPoi)) this.clearSelection();
    this.tweenFlatten(level === 'all' ? 1 : FLAT, animate);
    // Saindo da visão geral, aproxima um pouco: os pontos ficam legíveis.
    if (fromOverview && level !== 'all' && this.map.getZoom() < 16.6) this.fly({ zoom: 16.75 }, animate);
    this.emit({ type: 'levelChanged', level });
  }

  private tweenFlatten(to: number, animate: boolean) {
    cancelAnimationFrame(this.anim);
    const from = this.flatten;
    if (!animate || reducedMotion() || from === to) {
      this.flatten = to;
      this.map.setGlobalStateProperty('flatten', to);
      return;
    }
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / LEVEL_MS);
      this.flatten = from + (to - from) * ease(t);
      this.map.setGlobalStateProperty('flatten', this.flatten);
      if (t < 1) this.anim = requestAnimationFrame(step);
    };
    this.anim = requestAnimationFrame(step);
  }

  setFilters(hidden: string[]) {
    this.map.setGlobalStateProperty('hidden', hidden);
  }

  // ───────────────────────────── "Onde você está?"
  /**
   * Marca a área do torcedor (tom e contorno vermelhos), ativa o nível dela e vira a câmera
   * para que a área fique embaixo, de frente para o campo, como quem está sentado ali.
   * O bloco do assento (ex.: "512") escolhe o nível quando a área tem mais de um.
   */
  setArea(areaId: string | null, block?: string) {
    this.map.setGlobalStateProperty('area', areaId ?? '');
    if (!areaId) return;
    const area = this.opts.data.levels.areas.find((a) => a.id === areaId);
    if (!area) return;
    const fromBlock = block ? area.levels.find((l) => block.trim().startsWith(l)) : undefined;
    const level = fromBlock ?? area.defaultLevel;
    this.setLevel(level);
    const shapes = this.opts.data.stadium.features.filter(
      (f) => f.properties!.kind === 'sector' && f.properties!.area === areaId && f.properties!.level === level
    );
    if (!shapes.length) return;
    const at = centroid(shapes);
    const center = this.opts.data.venue.center as [number, number];
    const target: [number, number] = [at[0] * 0.55 + center[0] * 0.45, at[1] * 0.55 + center[1] * 0.45];
    this.fly({ center: target, zoom: 17.1, pitch: 52, bearing: bearingTo(at, center) });
  }

  // ───────────────────────────── seleção
  focusPoi(id: string) {
    const f = this.poiById.get(id);
    if (!f) return;
    const p = f.properties as { level: string | null; levels?: string[] | null };
    if (p.level !== null && this.level !== p.level && !(p.levels ?? []).includes(String(this.level)))
      this.setLevel(p.level);
    if (this.level === 'all') this.setLevel(this.opts.data.venue.defaultLevel);
    this.selectedPoi = f;
    this.map.setGlobalStateProperty('selectedSector', '');
    (this.map.getSource('selection') as GeoJSONSource).setData(fc([f]));
    const [lng, lat] = (f.geometry as Point).coordinates;
    this.fly({ center: [lng, lat], zoom: Math.max(this.map.getZoom(), 17.6) });
  }

  focusSector(id: string) {
    const shapes = this.opts.data.stadium.features.filter(
      (f) => f.properties!.kind === 'sector' && f.properties!.sector === id
    );
    if (!shapes.length) return;
    this.clearSelection();
    this.map.setGlobalStateProperty('selectedSector', id);
    this.fly({ center: centroid(shapes), zoom: Math.max(this.map.getZoom(), 16.9) });
  }

  clearSelection() {
    this.selectedPoi = null;
    this.map.setGlobalStateProperty('selectedSector', '');
    (this.map.getSource('selection') as GeoJSONSource | undefined)?.setData(fc([]));
  }

  // ───────────────────────────── toques
  private tappableLayers() {
    const layers = ['poi-selected', 'gate-labels', 'stadium-structure'];
    for (const cat of this.categories) layers.push(`poi-${cat}`, `poi-${cat}-cluster`);
    return layers.filter((id) => this.map.getLayer(id));
  }

  private async onClick(point: maplibregl.Point) {
    // Área de toque generosa (dedo), como os 44 pt da interface.
    const box: [maplibregl.PointLike, maplibregl.PointLike] = [
      [point.x - 14, point.y - 14],
      [point.x + 14, point.y + 14],
    ];
    const hits = this.map.queryRenderedFeatures(box, { layers: this.tappableLayers() });
    const pick = (pred: (f: MapGeoJSONFeature) => boolean) => hits.find(pred);
    const poi = pick((f) => f.layer.id.startsWith('poi-') && !f.properties.point_count);
    if (poi?.properties.id) {
      this.focusPoi(String(poi.properties.id));
      this.emit({ type: 'poiTapped', id: String(poi.properties.id) });
      return;
    }
    const cluster = pick((f) => !!f.properties.point_count);
    if (cluster) {
      const src = this.map.getSource(cluster.source) as GeoJSONSource;
      const zoom = await src.getClusterExpansionZoom(cluster.properties.cluster_id);
      this.fly({ center: (cluster.geometry as Point).coordinates as [number, number], zoom: zoom + 0.3 });
      return;
    }
    const gate = pick((f) => f.layer.id === 'gate-labels');
    if (gate) {
      this.emit({ type: 'gateTapped', id: String(gate.properties.id) });
      return;
    }
    const stand = pick((f) => f.layer.id === 'stadium-structure' && !!f.properties.sector);
    if (stand) {
      this.focusSector(String(stand.properties.sector));
      this.emit({ type: 'sectorTapped', id: String(stand.properties.sector) });
      return;
    }
    this.clearSelection();
  }

  // ───────────────────────────── você no mapa
  private user: { at: [number, number]; accuracy: number; level: string | null } | null = null;
  private pulse = 0;

  /** Ponto do torcedor com o círculo de precisão real (metros). `null` tira do mapa. */
  setUserLocation(at: [number, number] | null, accuracy = 0, level: string | null = null) {
    const src = this.map.getSource('user') as GeoJSONSource | undefined;
    this.user = at ? { at, accuracy, level } : null;
    if (!src) return;
    if (!at) {
      src.setData(fc([]));
      cancelAnimationFrame(this.pulse);
      return;
    }
    const props = { level: level ?? '' };
    src.setData(
      fc([
        {
          type: 'Feature',
          properties: { ...props, kind: 'accuracy' },
          geometry: circlePolygon(at, accuracy),
        },
        {
          type: 'Feature',
          properties: { ...props, kind: 'position' },
          geometry: { type: 'Point', coordinates: at },
        },
      ])
    );
    if (!this.pulse && !reducedMotion()) this.startPulse();
  }

  /** Pulso suave em volta do ponto (1,8 s por ciclo). */
  private startPulse() {
    const t0 = performance.now();
    const step = (now: number) => {
      if (!this.user || !this.map.getLayer('user-pulse')) {
        this.pulse = 0;
        return;
      }
      const k = ((now - t0) % 1800) / 1800;
      this.map.setPaintProperty('user-pulse', 'circle-radius', 9 + 16 * k);
      this.map.setPaintProperty('user-pulse', 'circle-opacity', 0.35 * (1 - k));
      this.pulse = requestAnimationFrame(step);
    };
    this.pulse = requestAnimationFrame(step);
  }

  focusUser() {
    if (!this.user) return;
    this.fly({ center: this.user.at, zoom: Math.max(this.map.getZoom(), 17.4) });
  }

  // ───────────────────────────── vista do seu lugar
  private beforeSeat: { camera: CameraState; level: LevelId } | null = null;

  /**
   * Vista aproximada do campo a partir de um setor: câmera no degrau do meio do setor, 1,2 m
   * acima (altura dos olhos sentado), olhando para o centro do gramado, com o estádio inteiro.
   */
  seatView(sectorId: string) {
    const steps = this.opts.data.stadium.features.filter(
      (f) =>
        f.properties!.sector === sectorId && (f.properties!.kind === 'stand' || f.properties!.kind === 'box')
    );
    if (!steps.length) return;
    const sorted = [...steps].sort((a, b) => (a.properties!.step ?? 0) - (b.properties!.step ?? 0));
    const seat = sorted[Math.floor(sorted.length / 2)]!;
    const at = centroid([seat]);
    const eye = (seat.properties!.top ?? 6) + 1.2;
    if (!this.beforeSeat) this.beforeSeat = { camera: this.camera(), level: this.level };
    this.setLevel('all', false);
    // Sem o vermelho de "selecionado": os degraus à sua frente ficam no tom da sua área.
    this.map.setGlobalStateProperty('selectedSector', '');
    this.map.setMaxPitch(85);
    this.map.setMaxZoom(21);
    // Ângulo de visão perto do olho humano (o padrão, ~37°, parece teleobjetiva).
    this.map.setVerticalFieldOfView(62);
    this.map.setGlobalStateProperty('seatView', true);
    const cam = this.map.calculateCameraOptionsFromTo(
      new maplibregl.LngLat(at[0], at[1]),
      eye,
      new maplibregl.LngLat(this.opts.data.venue.center[0], this.opts.data.venue.center[1]),
      0
    );
    if (reducedMotion()) this.map.jumpTo(cam);
    else this.map.flyTo({ ...cam, duration: 1400, essential: false });
  }

  exitSeatView() {
    const back = this.beforeSeat;
    this.beforeSeat = null;
    this.map.setGlobalStateProperty('selectedSector', '');
    this.map.setVerticalFieldOfView(36.87);
    this.map.setGlobalStateProperty('seatView', false);
    this.map.setMaxPitch(LIMITS.maxPitch);
    this.map.setMaxZoom(LIMITS.maxZoom);
    if (!back) return;
    this.setLevel(back.level, false);
    this.fly(back.camera);
  }

  // ───────────────────────────── rota
  private route: { level: string | null; coords: [number, number][] }[] = [];
  private dash = 0;

  /** Desenha a rota e enquadra o caminho inteiro. Lista vazia apaga. */
  showRoute(segments: { level: string | null; coords: [number, number][] }[], extraBottom = 0) {
    this.route = segments;
    const src = this.map.getSource('route') as GeoJSONSource | undefined;
    src?.setData(
      fc(
        segments.map((s) => ({
          type: 'Feature',
          properties: { level: s.level ?? '' },
          geometry: { type: 'LineString', coordinates: s.coords },
        }))
      )
    );
    cancelAnimationFrame(this.dash);
    this.dash = 0;
    if (!segments.length) return;
    const all = segments.flatMap((s) => s.coords);
    const b = new maplibregl.LngLatBounds(all[0], all[0]);
    for (const c of all) b.extend(c);
    this.map.fitBounds(b, {
      padding: { top: 56, left: 40, right: 40, bottom: 40 + extraBottom },
      maxZoom: 18.2,
      pitch: this.map.getPitch(),
      bearing: this.map.getBearing(),
      duration: reducedMotion() ? 0 : 800,
    });
    if (!reducedMotion()) this.animateDash();
  }

  /** Tracejado andando no sentido do destino (sequência de padrões, como uma esteira). */
  private animateDash() {
    // Traço 2 + vão 1,5 (em larguras de linha), deslizando 0,5 por quadro.
    const seq: number[][] = [
      [0, 1.5, 2],
      [0.5, 1.5, 1.5],
      [1, 1.5, 1],
      [1.5, 1.5, 0.5],
      [2, 1.5, 0],
      [0, 0.5, 2, 1],
      [0, 1, 2, 0.5],
    ];
    let last = 0;
    let k = 0;
    const step = (now: number) => {
      if (!this.route.length || !this.map.getLayer('route-line')) return;
      if (now - last > 90) {
        last = now;
        k = (k + 1) % seq.length;
        this.map.setPaintProperty('route-line', 'line-dasharray', seq[k]);
      }
      this.dash = requestAnimationFrame(step);
    };
    this.dash = requestAnimationFrame(step);
  }

  // ───────────────────────────── câmera
  private fly(cam: Partial<CameraState>, animate = true) {
    if (!animate || reducedMotion()) this.map.jumpTo(cam);
    else this.map.flyTo({ ...cam, duration: 750, essential: false });
  }

  /** Volta à câmera inicial com um voo curto (sem animação se o sistema pedir menos movimento). */
  recenter() {
    this.fly(initialCamera(this.opts.data.venue, this.opts.container.clientWidth));
  }
}
