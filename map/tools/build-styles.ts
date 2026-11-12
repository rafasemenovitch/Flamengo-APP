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
    roof: '#FFFFFF',
    roofOpacity: 0.22,
    pitch: '#79A66B',
    pitchStripe: '#719E63',
    surround: '#6F9A62',
    pitchLine: '#FFFFFF',
    pill: { fill: palette.ink900, stroke: palette.ink800, text: palette.white, sub: palette.ink300 },
    station: { fill: lightColors.inkSecondary, glyph: palette.white, text: lightColors.inkSecondary },
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
    roof: '#FFFFFF',
    roofOpacity: 0.05,
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
    light: { color: '#FFFFFF', intensity: 0.3 },
  },
} as const;

/**
 * Altura do anel externo de circulação. Fica baixo de propósito (corte do prédio): assim
 * a bacia das arquibancadas aparece inteira, como nos apps de referência.
 */
const FACADE_TOP = 9;

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
    filter: ['in', ['get', 'name'], ['literal', STREETS]],
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

function stadiumLayers(t: (typeof T)[Theme]) {
  const stand = (lvl: '1' | '2' | '3' | '5') => [
    'case',
    ['==', ['%', ['get', 'step'], 2], 0],
    t.stand[lvl][0],
    t.stand[lvl][1],
  ];
  return [
    {
      id: 'stadium-esplanade',
      type: 'fill',
      source: 'stadium',
      filter: ['==', ['get', 'kind'], 'esplanade'],
      paint: { 'fill-color': t.esplanade },
    },
    {
      id: 'stadium-esplanade-edge',
      type: 'line',
      source: 'stadium',
      filter: ['==', ['get', 'kind'], 'esplanade'],
      paint: { 'line-color': t.esplanadeEdge, 'line-width': 1 },
    },
    {
      id: 'stadium-surround',
      type: 'fill',
      source: 'stadium',
      filter: ['==', ['get', 'kind'], 'field-surround'],
      paint: { 'fill-color': t.surround },
    },
    {
      id: 'stadium-pitch',
      type: 'fill',
      source: 'stadium',
      filter: ['==', ['get', 'kind'], 'pitch'],
      paint: { 'fill-color': t.pitch },
    },
    {
      id: 'stadium-pitch-stripes',
      type: 'fill',
      source: 'stadium',
      filter: ['all', ['==', ['get', 'kind'], 'pitch-stripe'], ['==', ['get', 'stripe'], 1]],
      paint: { 'fill-color': t.pitchStripe },
    },
    {
      id: 'stadium-pitch-lines',
      type: 'line',
      source: 'stadium',
      filter: ['==', ['get', 'kind'], 'pitch-lines'],
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
      filter: ['match', ['get', 'kind'], ['stand', 'box', 'concourse', 'ramp'], true, false],
      paint: {
        'fill-extrusion-color': [
          'match',
          ['get', 'kind'],
          'ramp',
          t.ramp,
          'concourse',
          t.facade,
          'box',
          t.box,
          ['match', ['get', 'level'], '1', stand('1'), '2', stand('2'), '3', stand('3'), stand('5')],
        ],
        'fill-extrusion-base': 0,
        'fill-extrusion-height': [
          'match',
          ['get', 'kind'],
          'ramp',
          1.5,
          'concourse',
          FACADE_TOP,
          ['get', 'top'],
        ],
        'fill-extrusion-vertical-gradient': true,
      },
    },
    {
      id: 'stadium-roof',
      type: 'fill-extrusion',
      source: 'stadium',
      filter: ['==', ['get', 'kind'], 'roof'],
      paint: {
        'fill-extrusion-color': t.roof,
        // Some ao aproximar: de perto ela só atrapalha a leitura das arquibancadas.
        'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 16.4, t.roofOpacity, 17.2, 0],
        'fill-extrusion-base': ['get', 'base'],
        'fill-extrusion-height': ['get', 'top'],
      },
    },
    {
      id: 'transit-labels',
      type: 'symbol',
      source: 'transit',
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
    {
      id: 'gate-labels',
      type: 'symbol',
      source: 'gates',
      filter: ['==', ['get', 'kind'], 'gate'],
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
        'text-allow-overlap': true,
        'icon-allow-overlap': true,
        'symbol-z-order': 'source',
      },
      paint: { 'text-color': t.pill.text },
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
      'fla:images': { pill: t.pill, station: t.station },
    },
    light: {
      anchor: 'viewport',
      color: t.light.color,
      intensity: t.light.intensity,
      position: [1.15, 200, 35],
    },
    sources: {
      openmaptiles: { type: 'vector', url: BASE.sources.openmaptiles.url },
      // tolerance/maxzoom baixos: círculos e arcos do campo sem facetas de perto.
      stadium: {
        type: 'geojson',
        data: EMPTY,
        attribution: '© OpenStreetMap contributors',
        maxzoom: 20,
        tolerance: 0.1,
      },
      gates: { type: 'geojson', data: EMPTY },
      transit: { type: 'geojson', data: EMPTY },
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
