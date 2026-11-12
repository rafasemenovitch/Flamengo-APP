/// <reference types="node" />
/**
 * Estilos MapLibre do Modo Maracanã (map/styles/), gerados por `npm run map:styles`.
 * Confere a validade pela especificação oficial e as regras do pedido: sem POIs genéricos,
 * só as ruas do entorno, fontes do app, dados fora do estilo e os dois temas iguais em
 * estrutura (a troca de tema só muda cores).
 */
import fs from 'node:fs';
import path from 'node:path';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';

import { MAP_FONTS } from '../../map/web/fonts';
import { PICTOGRAMS } from '../../map/web/icons';

const DIR = path.join(__dirname, '../../map/styles');
const load = (t: string) => JSON.parse(fs.readFileSync(path.join(DIR, `maracana-${t}.json`), 'utf8'));
const styles = { light: load('light'), dark: load('dark') };
const FAMILIES = new Set<string>(MAP_FONTS.map((f) => f.family));
const POIS = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../assets/stadiums/maracana/pois.geojson'), 'utf8')
).features as { properties: { category: string } }[];

/** Todas as famílias citadas em text-font (inclusive dentro de "format"). */
function fontsIn(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === 'string') && value.some((v) => /Grotesk|Noto|Sans/.test(v)))
      value.forEach((v) => out.add(v));
    else value.forEach((v) => fontsIn(v, out));
  } else if (value && typeof value === 'object') Object.values(value).forEach((v) => fontsIn(v, out));
  return out;
}

describe.each(Object.entries(styles))('estilo %s', (theme, style) => {
  it('é válido pela especificação do MapLibre', () => {
    expect(validateStyleMin(style)).toEqual([]);
  });

  it('não traz POIs genéricos, nomes de bairro nem escudos de rodovia', () => {
    const layers = style.layers.map((l: any) => l['source-layer']).filter(Boolean);
    for (const banned of ['poi', 'place', 'aerodrome_label', 'housenumber', 'mountain_peak'])
      expect(layers).not.toContain(banned);
    const names = style.layers.filter((l: any) => l['source-layer'] === 'transportation_name');
    expect(names.map((l: any) => l.id)).toEqual(['street_labels']);
  });

  it('usa só as fontes do app e as imagens desenhadas pelo mapa', () => {
    const cats = Object.keys(style.metadata['fla:poi']);
    const IMAGES = new Set(['pill', 'station', 'badge', 'selected-ring', ...cats.map((c) => `poi-${c}`)]);
    for (const layer of style.layers) {
      for (const f of fontsIn(layer.layout?.['text-font'])) expect(FAMILIES.has(f)).toBe(true);
      for (const f of fontsIn(layer.layout?.['text-field'])) expect(FAMILIES.has(f)).toBe(true);
      const icon = layer.layout?.['icon-image'];
      if (typeof icon === 'string') expect(IMAGES.has(icon)).toBe(true);
    }
    expect(style.glyphs).toBeUndefined();
    expect(style.sprite).toBeUndefined();
  });

  it('toda categoria de ponto tem cor, pictograma próprio e camada', () => {
    const cats = Object.keys(style.metadata['fla:poi']);
    for (const { properties } of POIS) expect(cats).toContain(properties.category);
    for (const c of cats) {
      expect(PICTOGRAMS[c]?.length).toBeGreaterThan(0);
      expect(style.layers.some((l: any) => l.id === `poi-${c}`)).toBe(true);
    }
  });

  it('sem cobertura: nada tapa as arquibancadas', () => {
    expect(JSON.stringify(style.layers)).not.toMatch(/roof/);
  });

  it('nível, área, seleção e filtros são estado do estilo', () => {
    for (const k of ['level', 'flatten', 'selectedSector', 'area', 'hidden'])
      expect(style.state[k]).toBeDefined();
  });

  it('dados do estádio ficam fora do estilo', () => {
    for (const src of Object.values<any>(style.sources))
      if (src.type === 'geojson') expect(src.data.features).toEqual([]);
    expect(style.metadata['fla:theme']).toBe(theme);
  });
});

it('claro e escuro têm as mesmas camadas, na mesma ordem', () => {
  expect(styles.dark.layers.map((l: any) => l.id)).toEqual(styles.light.layers.map((l: any) => l.id));
});
