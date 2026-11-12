/**
 * Gera os estilos MapLibre do Modo Maracanã (claro e escuro) em map/styles/.
 *
 * Base: cópia do estilo Positron do OpenFreeMap (map/tools/sources/openfreemap-positron.json).
 * Ficam só as camadas de fundo, água, verde, quadras, ruas e trilhos, recoloridas com os
 * tons do app. Saem POIs, ônibus, divisas, escudos de rodovia e nomes de bairro. Dos nomes
 * de rua, só os do entorno do estádio (STREETS).
 *
 * Por cima vêm as camadas do estádio, que leem as fontes GeoJSON "stadium", "gates" e
 * "transit". No estilo elas vão vazias; o código do mapa (map/web/) preenche com os dados
 * de assets/stadiums/<id>/. O mesmo JSON serve ao MapLibre nativo no futuro.
 *
 * Sem "glyphs": no MapLibre GL JS os rótulos são desenhados localmente com as fontes do
 * app (Schibsted Grotesk), que funcionam sem internet. No MapLibre nativo será preciso
 * acrescentar uma URL de glyphs gerados dessas mesmas fontes (ver docs/maracana/README.md).
 *
 * Uso: npx tsx map/tools/build-styles.ts
 */
import fs from 'node:fs';
import path from 'node:path';

import { darkColors, lightColors, palette } from '../../src/design-system/tokens/colors';

const ROOT = path.resolve(__dirname, '../..');
const BASE = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'map/tools/sources/openfreemap-positron.json'), 'utf8')
);

/** Ruas cujo nome aparece no mapa (grafia do OpenStreetMap). */
const STREETS = [
  'Avenida Maracanã',
  'Avenida Rei Pelé',
  'Avenida Professor Manoel de Abreu',
  'Rua Professor Eurico Rabelo',
  'Rua Eurico Rabelo',
  'Rua Mata Machado',
];

/** Famílias de fonte do app, pelo nome que o MapLibre passa ao navegador. */
export const FONT = {
  medium: ['Schibsted Grotesk Medium'],
  semibold: ['Schibsted Grotesk SemiBold'],
  bold: ['Schibsted Grotesk Bold'],
};

type Theme = 'light' | 'dark';

/**
 * Tons do mapa. Os neutros de interface vêm dos tokens do app; os de terreno
 * (verde, água, concreto) são próprios do mapa e ficam todos aqui.
 */
const T = {
  light: {
    background: '#F3F2EF',
    residential: '#EFEEEA',
    green: '#DFE6D6',
    wood: '#D9E2D0',
    water: '#C8D3D9',
    building: '#E8E6E1',
    buildingEdge: '#DDDBD5',
    path: '#FBFAF8',
    minor: '#FFFFFF',
    majorCasing: '#E1DFD9',
    major: '#FFFFFF',
    rail: '#DCDAD5',
    railDash: '#F3F2EF',
    streetLabel: '#8B8A86',
    labelHalo: '#F3F2EF',
    esplanade: '#E7E5E0',
    esplanadeEdge: '#D8D6D0',
    facade: '#DCDBD7',
    ramp: '#D3D1CB',
    box: '#CFD0D3',
    stand: {
      '1': ['#D5D7DC', '#CDD0D5'],
      '2': ['#BBBEC6', '#B4B7BF'],
      '3': ['#A2A6B0', '#9B9FA9'],
      '5': ['#898E9A', '#828793'],
    },
    pillar: '#E4E3DF',
    dim: '#C9CBD0',
    dimOpacity: 0.35,
    areaTint: '#E7B3BB',
    sectionLine: 'rgba(255,255,255,0.55)',
    sectionLabel: '#4E4E55',
    poiLabel: '#26262B',
    pitch: '#79A66B',
    pitchStripe: '#719E63',
    surround: '#6F9A62',
    pitchLine: '#FFFFFF',
    pill: { fill: palette.ink900, stroke: palette.ink800, text: palette.white, sub: palette.ink300 },
    station: { fill: lightColors.inkSecondary, glyph: palette.white, text: lightColors.inkSecondary },
    badge: { fill: palette.white, stroke: '#D6D5D0', text: palette.ink900 },
    accent: lightColors.accent,
    light: { color: '#FFFFFF', intensity: 0.38 },
  },
  dark: {
    background: '#0E0E10',
    residential: '#111113',
    green: '#121813',
    wood: '#121813',
    water: '#0D1418',
    building: '#17171A',
    buildingEdge: '#1D1D21',
    path: '#18181B',
    minor: '#1D1D21',
    majorCasing: '#0E0E10',
    major: '#26262B',
    rail: '#232327',
    railDash: '#0E0E10',
    streetLabel: '#76767E',
    labelHalo: '#0E0E10',
    esplanade: '#18181B',
    esplanadeEdge: '#232327',
    facade: '#222226',
    ramp: '#26262A',
    box: '#2C2C31',
    stand: {
      '1': ['#2E2E34', '#2A2A30'],
      '2': ['#3A3A42', '#36363D'],
      '3': ['#46464F', '#42424A'],
      '5': ['#53535D', '#4E4E58'],
    },
    pillar: '#2A2A2F',
    dim: '#2A2A30',
    dimOpacity: 0.45,
    areaTint: '#6E2632',
    sectionLine: 'rgba(0,0,0,0.35)',
    sectionLabel: '#A6A6AD',
    poiLabel: '#F5F5F4',
    pitch: '#3E6A3A',
    pitchStripe: '#396436',
    surround: '#355B32',
    pitchLine: '#E6ECE4',
    pill: {
      fill: darkColors.bgRaised2,
      stroke: '#3A3A42',
      text: darkColors.inkPrimary,
      sub: darkColors.inkSecondary,
    },
    station: { fill: palette.ink800, glyph: darkColors.inkPrimary, text: darkColors.inkSecondary },
    badge: { fill: palette.ink50, stroke: palette.ink950, text: palette.ink950 },
    accent: darkColors.accent,
    light: { color: '#FFFFFF', intensity: 0.3 },
  },
} as const;

/**
 * Altura do anel externo de circulação. Fica baixo de propósito (corte do prédio): assim
 * a bacia das arquibancadas aparece inteira, como nos apps de referência.
 */
const FACADE_TOP = 9;

/**
 * Cor de cada categoria de ponto de interesse (iguais nos dois temas). Família de tons
 * médios que não briga com o vermelho do app: o vermelho fica só para seleção e destaque.
 * Ordem = ordem de desenho (o último fica por cima).
 */
export const POI_COLORS: Record<string, string> = {
  escada: '#4B5160',
  escada_rolante: '#4B5160',
  elevador: '#4B5160',
  estacionamento: '#3A5A8A',
  saida_emergencia: '#3B8F5A',
  bilheteria: '#8C6A3A',
  loja: '#7655A6',
  informacao: '#2F7C88',
  sala_sensorial: '#5F72B0',
  seguranca: '#34495E',
  juizado: '#5B4E80',
  acolhimento: '#94487F',
  posto_medico: '#2F8A5B',
  bebidas: '#B0702A',
  alimentacao: '#C27A2C',
  banheiro_acessivel: '#2D5C8F',
  banheiro: '#3F6FA0',
};
export const POI_CATEGORIES = Object.keys(POI_COLORS);

const EMPTY = { type: 'FeatureCollection', features: [] };
const KEEP = new Set([
  'background',
  'landuse_residential',
  'park',
  'landcover_wood',
  'water',
  'waterway',
  'building',
  'highway_path',
  'highway_minor',
  'highway_major_casing',
  'highway_major_inner',
  'highway_motorway_casing',
  'highway_motorway_inner',
  'railway_transit',
  'railway_transit_dashline',
  'railway',
  'railway_dashline',
  'highway_motorway_bridge_casing',
  'highway_motorway_bridge_inner',
]);

function baseLayers(t: (typeof T)[Theme]) {
  const color: Record<string, Record<string, unknown>> = {
    background: { 'background-color': t.background },
    landuse_residential: { 'fill-color': t.residential, 'fill-opacity': 1 },
    park: { 'fill-color': t.green },
    landcover_wood: { 'fill-color': t.wood },
    water: { 'fill-color': t.water },
    waterway: { 'line-color': t.water },
    building: { 'fill-color': t.building, 'fill-outline-color': t.buildingEdge },
    highway_path: { 'line-color': t.path, 'line-opacity': 1 },
    highway_minor: { 'line-color': t.minor, 'line-opacity': 1 },
    highway_major_casing: { 'line-color': t.majorCasing },
    highway_major_inner: { 'line-color': t.major },
    highway_motorway_casing: { 'line-color': t.majorCasing },
    highway_motorway_inner: { 'line-color': t.major },
    railway_transit: { 'line-color': t.rail },
    railway_transit_dashline: { 'line-color': t.railDash },
    railway: { 'line-color': t.rail },
    railway_dashline: { 'line-color': t.railDash },
    highway_motorway_bridge_casing: { 'line-color': t.majorCasing },
    highway_motorway_bridge_inner: { 'line-color': t.major },
  };
  const layers = BASE.layers
    .filter((l: any) => KEEP.has(l.id))
    .map((l: any) => {
      const { maxzoom, ...rest } = l;
      // Quadras residenciais somem no z16 do Positron; aqui ficam em todos os zooms.
      const layer = l.id === 'landuse_residential' ? rest : { ...rest, ...(maxzoom ? { maxzoom } : {}) };
      return { ...layer, paint: { ...layer.paint, ...color[l.id] } };
    });
  // Gramados e campos (o Positron não desenha a classe "grass").
  const parkAt = layers.findIndex((l: any) => l.id === 'park');
  layers.splice(parkAt + 1, 0, {
    id: 'landcover_grass',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'landcover',
    filter: ['==', ['get', 'class'], 'grass'],
    paint: { 'fill-color': t.green },
  });
  layers.push({
    id: 'street_labels',
    type: 'symbol',
    source: 'openmaptiles',
    'source-layer': 'transportation_name',
    minzoom: 15,
    filter: ['all', ['in', ['get', 'name'], ['literal', STREETS]], NOT_SEAT],
    layout: {
      'symbol-placement': 'line',
      'symbol-spacing': 420,
      'text-field': ['get', 'name'],
      'text-font': FONT.medium,
      'text-size': ['interpolate', ['linear'], ['zoom'], 15, 10, 18, 12],
      'text-transform': 'uppercase',
      'text-letter-spacing': 0.12,
      'text-rotation-alignment': 'map',
      'text-pitch-alignment': 'viewport',
    },
    paint: { 'text-color': t.streetLabel, 'text-halo-color': t.labelHalo, 'text-halo-width': 1.4 },
  });
  return layers;
}

// Estado do mapa, alterado pelo código (map.setGlobalStateProperty) sem tocar no estilo.
const STATE = {
  /** Nível ativo ('all' = visão geral do estádio, sem pontos). */
  level: { default: 'all' },
  /** Fator de altura das extrusões: 1 na visão geral; menor com um nível ativo. */
  flatten: { default: 1 },
  /** Setor tocado (vermelho). */
  selectedSector: { default: '' },
  /** Área do usuário ("Onde você está?"): tom e contorno vermelhos. */
  area: { default: '' },
  /** Categorias escondidas pelos filtros. */
  hidden: { default: [] as string[] },
  /** Vista do seu lugar: some com rótulos de portão, estação e rua (flutuariam no ar). */
  seatView: { default: false },
};
const LVL = ['global-state', 'level'];
const KIND = ['get', 'kind'];
const SOLIDS = ['match', KIND, ['stand', 'box', 'concourse', 'ramp', 'pillar', 'ring-beam'], true, false];
/** Colunata e viga: só na visão geral (nem translúcidas com um nível ativo). */
const FRAME = ['match', KIND, ['pillar', 'ring-beam'], true, false];
/** Ativo no nível atual: sem nível (anel externo, rampas) vale sempre; pilares só na visão geral. */
const ACTIVE = [
  'case',
  FRAME,
  ['==', LVL, 'all'],
  ['any', ['==', LVL, 'all'], ['!', ['has', 'level']], ['==', ['get', 'level'], LVL]],
];
const EXTRUDE_BASE = ['*', ['global-state', 'flatten'], ['match', KIND, 'ring-beam', ['get', 'base'], 0]];
const HEIGHT = [
  '*',
  ['global-state', 'flatten'],
  ['match', KIND, 'ramp', 1.5, 'concourse', FACADE_TOP, ['get', 'top']],
];
/** O usuário em outro nível que não o ativo aparece apagado. */
const USER_OPACITY = [
  'case',
  ['any', ['==', LVL, 'all'], ['==', ['get', 'level'], ''], ['==', ['get', 'level'], LVL]],
  1,
  0.4,
];
const ROUTE_OPACITY = [
  'case',
  ['any', ['==', LVL, 'all'], ['==', ['get', 'level'], ''], ['==', ['get', 'level'], LVL]],
  1,
  0.3,
];
const ICON_SIZE = ['interpolate', ['linear'], ['zoom'], 15.5, 0.62, 17, 0.8, 19, 1];
const NOT_SEAT = ['!', ['boolean', ['global-state', 'seatView']]];
const visible = (cat: string) => ['!', ['in', cat, ['array', ['global-state', 'hidden']]]];

function stadiumLayers(t: (typeof T)[Theme]) {
  const stand = (lvl: '1' | '2' | '3' | '5') => [
    'case',
    ['==', ['%', ['get', 'step'], 2], 0],
    t.stand[lvl][0],
    t.stand[lvl][1],
  ];
  const poiLayers = POI_CATEGORIES.flatMap((cat) => [
    {
      id: `poi-${cat}-cluster`,
      type: 'symbol',
      source: `poi-${cat}`,
      filter: ['all', ['has', 'point_count'], visible(cat)],
      layout: {
        'icon-image': `poi-${cat}`,
        'icon-size': ICON_SIZE,
        'icon-allow-overlap': true,
      },
    },
    {
      id: `poi-${cat}-count`,
      type: 'symbol',
      source: `poi-${cat}`,
      filter: ['all', ['has', 'point_count'], visible(cat)],
      layout: {
        'icon-image': 'badge',
        'icon-text-fit': 'both',
        'icon-text-fit-padding': [0.5, 3, 0.5, 3],
        'text-field': ['to-string', ['get', 'point_count']],
        'text-font': FONT.bold,
        'text-size': 9,
        'text-offset': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15.5,
          ['literal', [0.95, -0.95]],
          19,
          ['literal', [1.45, -1.45]],
        ],
        'icon-allow-overlap': true,
        'text-allow-overlap': true,
      },
      paint: { 'text-color': t.badge.text },
    },
    {
      id: `poi-${cat}`,
      type: 'symbol',
      source: `poi-${cat}`,
      filter: ['all', ['!', ['has', 'point_count']], visible(cat)],
      layout: {
        'icon-image': `poi-${cat}`,
        'icon-size': ICON_SIZE,
        'icon-allow-overlap': true,
        // Nome ao lado do ícone só bem de perto; sem sobreposição de rótulos.
        'text-field': ['step', ['zoom'], '', 18, ['get', 'name']],
        'text-font': FONT.semibold,
        'text-size': 11,
        'text-optional': true,
        'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
        'text-radial-offset': 1.25,
        'text-max-width': 9,
      },
      paint: { 'text-color': t.poiLabel, 'text-halo-color': t.labelHalo, 'text-halo-width': 1.5 },
    },
  ]);
  return [
    {
      id: 'stadium-esplanade',
      type: 'fill',
      source: 'stadium',
      filter: ['==', KIND, 'esplanade'],
      paint: { 'fill-color': t.esplanade },
    },
    {
      id: 'stadium-esplanade-edge',
      type: 'line',
      source: 'stadium',
      filter: ['==', KIND, 'esplanade'],
      paint: { 'line-color': t.esplanadeEdge, 'line-width': 1 },
    },
    {
      id: 'stadium-surround',
      type: 'fill',
      source: 'stadium',
      filter: ['==', KIND, 'field-surround'],
      paint: { 'fill-color': t.surround },
    },
    {
      id: 'stadium-pitch',
      type: 'fill',
      source: 'stadium',
      filter: ['==', KIND, 'pitch'],
      paint: { 'fill-color': t.pitch },
    },
    {
      id: 'stadium-pitch-stripes',
      type: 'fill',
      source: 'stadium',
      filter: ['all', ['==', KIND, 'pitch-stripe'], ['==', ['get', 'stripe'], 1]],
      paint: { 'fill-color': t.pitchStripe },
    },
    {
      id: 'stadium-pitch-lines',
      type: 'line',
      source: 'stadium',
      filter: ['==', KIND, 'pitch-lines'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': t.pitchLine,
        'line-opacity': 0.92,
        'line-width': ['interpolate', ['exponential', 2], ['zoom'], 15.5, 0.6, 17, 1.2, 19.5, 5],
      },
    },
    {
      id: 'stadium-structure',
      type: 'fill-extrusion',
      source: 'stadium',
      filter: ['all', SOLIDS, ACTIVE],
      paint: {
        'fill-extrusion-color': [
          'case',
          ['==', ['get', 'sector'], ['global-state', 'selectedSector']],
          t.accent,
          ['==', ['get', 'area'], ['global-state', 'area']],
          t.areaTint,
          [
            'match',
            KIND,
            'ramp',
            t.ramp,
            'concourse',
            t.facade,
            ['pillar', 'ring-beam'],
            t.pillar,
            'box',
            t.box,
            ['match', ['get', 'level'], '1', stand('1'), '2', stand('2'), '3', stand('3'), stand('5')],
          ],
        ],
        'fill-extrusion-base': EXTRUDE_BASE,
        'fill-extrusion-height': HEIGHT,
        'fill-extrusion-vertical-gradient': true,
      },
    },
    {
      // Outros níveis: translúcidos e apagados enquanto um nível está ativo.
      id: 'stadium-structure-dim',
      type: 'fill-extrusion',
      source: 'stadium',
      filter: ['all', SOLIDS, ['!', FRAME], ['!', ACTIVE]],
      paint: {
        'fill-extrusion-color': t.dim,
        'fill-extrusion-opacity': t.dimOpacity,
        'fill-extrusion-base': 0,
        'fill-extrusion-height': HEIGHT,
      },
    },
    {
      id: 'stadium-sections',
      type: 'line',
      source: 'stadium',
      minzoom: 16.5,
      filter: ['all', ['==', KIND, 'section'], ['==', ['get', 'level'], LVL]],
      paint: { 'line-color': t.sectionLine, 'line-width': 0.7 },
    },
    {
      id: 'area-outline',
      type: 'line',
      source: 'stadium',
      filter: [
        'all',
        ['==', KIND, 'sector'],
        ['==', ['get', 'area'], ['global-state', 'area']],
        ['==', ['get', 'level'], LVL],
      ],
      layout: { 'line-join': 'round' },
      paint: { 'line-color': t.accent, 'line-width': 2.5 },
    },
    // Rota: vermelha (é "a sua"), tracejada e animada no sentido do destino, com contorno
    // para destacar do mapa. Trechos em outro nível ficam apagados.
    {
      id: 'route-casing',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': t.labelHalo,
        'line-width': ['interpolate', ['linear'], ['zoom'], 15.5, 5, 18, 9],
        'line-opacity': ['*', 0.9, ROUTE_OPACITY],
      },
    },
    {
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': t.accent,
        'line-width': ['interpolate', ['linear'], ['zoom'], 15.5, 3, 18, 5.5],
        'line-dasharray': [2, 1.5],
        'line-opacity': ROUTE_OPACITY,
      },
    },
    {
      id: 'section-labels',
      type: 'symbol',
      source: 'stadium',
      minzoom: 17.2,
      filter: ['all', ['==', KIND, 'section-label'], ['==', ['get', 'level'], LVL]],
      layout: {
        'text-field': ['get', 'ref'],
        'text-font': FONT.semibold,
        'text-size': 10,
        'text-pitch-alignment': 'map',
        'text-rotation-alignment': 'viewport',
      },
      paint: { 'text-color': t.sectionLabel },
    },
    {
      id: 'transit-labels',
      type: 'symbol',
      source: 'transit',
      filter: NOT_SEAT,
      layout: {
        'icon-image': 'station',
        'icon-size': 0.5,
        'text-field': ['get', 'name'],
        'text-font': FONT.semibold,
        'text-size': 12,
        'text-anchor': 'left',
        'text-max-width': 14,
        'text-offset': [1.1, 0],
        'icon-allow-overlap': true,
      },
      paint: { 'text-color': t.station.text, 'text-halo-color': t.labelHalo, 'text-halo-width': 1.5 },
    },
    ...poiLayers,
    {
      id: 'gate-labels',
      type: 'symbol',
      source: 'gates',
      filter: ['all', ['==', KIND, 'gate'], NOT_SEAT],
      layout: {
        'icon-image': 'pill',
        'icon-text-fit': 'both',
        'icon-text-fit-padding': [3, 8, 3, 8],
        'text-field': [
          'case',
          ['has', 'nickname'],
          [
            'format',
            ['get', 'name'],
            {},
            '  ',
            {},
            ['upcase', ['get', 'nickname']],
            { 'font-scale': 0.78, 'text-color': t.pill.sub, 'text-font': ['literal', FONT.medium] },
          ],
          ['get', 'name'],
        ],
        'text-font': FONT.semibold,
        'text-size': ['interpolate', ['linear'], ['zoom'], 15.5, 10.5, 17, 12, 19, 13],
        // Etiqueta logo acima do ponto do portão: o ponto exato (e você, se estiver lá) fica visível.
        'text-anchor': 'bottom',
        'text-offset': [0, -0.7],
        'text-allow-overlap': true,
        'icon-allow-overlap': true,
        'symbol-z-order': 'source',
      },
      paint: { 'text-color': t.pill.text },
    },
    // Você no mapa: círculo de precisão real do GPS, pulso suave e o ponto (vermelho = "o seu").
    // Em outro nível que não o ativo, fica apagado.
    {
      id: 'user-accuracy',
      type: 'fill',
      source: 'user',
      filter: ['==', ['get', 'kind'], 'accuracy'],
      paint: { 'fill-color': t.accent, 'fill-opacity': ['*', 0.12, USER_OPACITY] },
    },
    {
      id: 'user-accuracy-edge',
      type: 'line',
      source: 'user',
      filter: ['==', ['get', 'kind'], 'accuracy'],
      paint: { 'line-color': t.accent, 'line-width': 1, 'line-opacity': ['*', 0.45, USER_OPACITY] },
    },
    {
      id: 'user-pulse',
      type: 'circle',
      source: 'user',
      filter: ['==', ['get', 'kind'], 'position'],
      paint: {
        'circle-color': t.accent,
        'circle-radius': 9,
        'circle-opacity': 0,
        'circle-pitch-alignment': 'viewport',
      },
    },
    {
      id: 'user-dot',
      type: 'circle',
      source: 'user',
      filter: ['==', ['get', 'kind'], 'position'],
      paint: {
        'circle-color': t.accent,
        'circle-radius': 7,
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 2.5,
        'circle-opacity': USER_OPACITY,
        'circle-stroke-opacity': USER_OPACITY,
        'circle-pitch-alignment': 'viewport',
      },
    },
    {
      id: 'poi-selected-ring',
      type: 'symbol',
      source: 'selection',
      layout: { 'icon-image': 'selected-ring', 'icon-size': ICON_SIZE, 'icon-allow-overlap': true },
    },
    {
      id: 'poi-selected',
      type: 'symbol',
      source: 'selection',
      layout: {
        'icon-image': ['concat', 'poi-', ['get', 'category']],
        'icon-size': ['interpolate', ['linear'], ['zoom'], 15.5, 0.72, 17, 0.92, 19, 1.15],
        'icon-allow-overlap': true,
        'text-field': ['get', 'name'],
        'text-font': FONT.bold,
        'text-size': 12,
        'text-anchor': 'top',
        'text-offset': [0, 1.5],
        'text-allow-overlap': true,
      },
      paint: { 'text-color': t.poiLabel, 'text-halo-color': t.labelHalo, 'text-halo-width': 2 },
    },
  ];
}

function build(theme: Theme) {
  const t = T[theme];
  return {
    version: 8,
    name: `Modo Maracanã · ${theme === 'light' ? 'claro' : 'escuro'}`,
    metadata: {
      'fla:theme': theme,
      'fla:background': t.background,
      // Imagens desenhadas pelo código do mapa (map/web/images.ts) com estas cores.
      'fla:images': { pill: t.pill, station: t.station, badge: t.badge, selected: t.accent },
      'fla:poi': POI_COLORS,
    },
    state: STATE,
    light: {
      anchor: 'viewport',
      color: t.light.color,
      intensity: t.light.intensity,
      position: [1.15, 200, 35],
    },
    sources: {
      // Atribuição curta, numa linha (substitui a do TileJSON; continua citando todos).
      openmaptiles: {
        type: 'vector',
        url: BASE.sources.openmaptiles.url,
        attribution:
          '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>',
      },
      // tolerance/maxzoom baixos: círculos e arcos do campo sem facetas de perto.
      stadium: {
        type: 'geojson',
        data: EMPTY,
        attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>',
        maxzoom: 20,
        tolerance: 0.1,
      },
      gates: { type: 'geojson', data: EMPTY },
      transit: { type: 'geojson', data: EMPTY },
      selection: { type: 'geojson', data: EMPTY },
      user: { type: 'geojson', data: EMPTY },
      route: { type: 'geojson', data: EMPTY, lineMetrics: true },
      // Uma fonte por categoria: a aglomeração junta só pontos da mesma categoria.
      ...Object.fromEntries(
        POI_CATEGORIES.map((cat) => [
          `poi-${cat}`,
          { type: 'geojson', data: EMPTY, cluster: true, clusterRadius: 30, clusterMaxZoom: 17 },
        ])
      ),
    },
    layers: [...baseLayers(t), ...stadiumLayers(t)],
  };
}

const out = path.join(ROOT, 'map/styles');
fs.mkdirSync(out, { recursive: true });
for (const theme of ['light', 'dark'] as const) {
  const file = path.join(out, `maracana-${theme}.json`);
  fs.writeFileSync(file, JSON.stringify(build(theme), null, 2) + '\n');
  console.log('ok', path.relative(ROOT, file));
}
