/// <reference types="node" />
/**
 * Integridade dos dados do Modo Maracanã (assets/stadiums/maracana/).
 * Regras do pedido: todo dado com fonte e confiança, nível 4 fora do público,
 * grafo conectado e caminho acessível de cada portão a cada nível público.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(__dirname, '../../assets/stadiums/maracana');
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));

const levels = read('levels.json');
const venue = read('venue.json');
const sources = read('sources.json') as { id: string }[];
const pois = read('pois.geojson').features as { properties: any }[];
const gates = read('gates.geojson').features as { properties: any }[];
const walk = read('walkways.geojson').features as { properties: any }[];
const SOURCE_IDS = new Set(sources.map((s) => s.id));
const CONF = ['confirmado', 'fonte_unica', 'estimado'];

const sourced = (x: any) =>
  Array.isArray(x.source) &&
  x.source.length > 0 &&
  x.source.every((s: string) => SOURCE_IDS.has(s)) &&
  CONF.includes(x.confidence);

describe('dados do estádio', () => {
  it('níveis públicos são 1, 2, 3 e 5; o 4 não é público', () => {
    const pub = levels.levels.filter((l: any) => l.public).map((l: any) => l.id);
    expect(pub).toEqual(['1', '2', '3', '5']);
    expect(levels.levels.find((l: any) => l.id === '4').public).toBe(false);
  });

  it('todo ponto, portão, rampa e setor tem fonte e confiança', () => {
    for (const f of pois) expect(sourced(f.properties)).toBe(true);
    for (const f of gates) expect(sourced(f.properties)).toBe(true);
    for (const s of levels.sectors) expect(sourced(s)).toBe(true);
    for (const r of levels.ramps) expect(sourced(r)).toBe(true);
  });

  it('nenhum ponto fica no nível 4 ou em nível inexistente', () => {
    const pub = new Set(levels.levels.filter((l: any) => l.public).map((l: any) => l.id));
    for (const f of pois) if (f.properties.level !== null) expect(pub.has(f.properties.level)).toBe(true);
  });

  it('nada de bebida alcoólica nos nomes', () => {
    for (const f of pois) expect(f.properties.name).not.toMatch(/cerveja|chope|chopp|drink|alco/i);
  });

  it('seis portões, A a F, cada um com a sua rampa', () => {
    const g = gates
      .filter((f) => f.properties.kind === 'gate')
      .map((f) => f.properties.id)
      .sort();
    expect(g).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(levels.ramps.map((r: any) => r.gate).sort()).toEqual(g);
  });

  it('canais de ajuda: segurança, Juizado, acolhimento à mulher e denúncia de racismo', () => {
    const ids = venue.help.map((h: any) => h.id);
    for (const id of ['seguranca', 'juizado', 'acolhimento', 'mprj', 'ligue180', 'disque100'])
      expect(ids).toContain(id);
    const poiIds = new Set(pois.map((f) => f.properties.id));
    for (const h of venue.help) {
      expect(h.source.every((s: string) => SOURCE_IDS.has(s))).toBe(true);
      if (h.poi) expect(poiIds.has(h.poi)).toBe(true);
    }
    for (const cat of ['seguranca', 'juizado', 'acolhimento', 'posto_medico'])
      expect(pois.some((f) => f.properties.category === cat)).toBe(true);
  });

  it('o nome do estádio vem dos dados', () => {
    expect(venue.name).toBe('Maracanã');
    expect(venue.bounds).toHaveLength(4);
  });
});

describe('grafo de corredores', () => {
  const nodes = walk.filter((f) => f.properties.kind === 'node').map((f) => f.properties);
  const edges = walk.filter((f) => f.properties.kind === 'edge').map((f) => f.properties);
  const adj = (accessibleOnly: boolean) => {
    const m = new Map<string, string[]>();
    for (const e of edges) {
      if (accessibleOnly && !e.accessible) continue;
      m.set(e.from, [...(m.get(e.from) ?? []), e.to]);
      m.set(e.to, [...(m.get(e.to) ?? []), e.from]);
    }
    return m;
  };
  const reach = (start: string, g: Map<string, string[]>) => {
    const seen = new Set([start]);
    const stack = [start];
    while (stack.length)
      for (const n of g.get(stack.pop()!) ?? [])
        if (!seen.has(n)) {
          seen.add(n);
          stack.push(n);
        }
    return seen;
  };

  it('todo nó está conectado', () => {
    const seen = reach('g-A', adj(false));
    expect(nodes.filter((n) => !seen.has(n.id)).map((n) => n.id)).toEqual([]);
  });

  it('escadas nunca são acessíveis; elevadores e rampas sim', () => {
    for (const e of edges) {
      if (e.type === 'escada' || e.type === 'escada_rolante') expect(e.accessible).toBe(false);
      if (e.type === 'elevador' || e.type === 'rampa') expect(e.accessible).toBe(true);
      expect(e.length).toBeGreaterThan(0);
    }
  });

  it('de cada portão há caminho acessível até cada nível público', () => {
    const g = adj(true);
    for (const gate of ['A', 'B', 'C', 'D', 'E', 'F']) {
      const seen = reach(`g-${gate}`, g);
      for (const level of ['1', '2', '3', '5'])
        expect(nodes.some((n) => n.level === level && seen.has(n.id))).toBe(true);
    }
  });

  it('todo ponto de interesse está no grafo', () => {
    const refs = new Set(nodes.map((n) => n.ref));
    for (const f of pois) expect(refs.has(f.properties.id)).toBe(true);
  });
});
