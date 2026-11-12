/**
 * Busca e consultas do Modo Maracanã (src/services/stadium/query.ts) e a coerência entre
 * ingresso, ofertas de setor e os dados do mapa (portões e áreas).
 */
import { SECTOR_OFFERS } from '@/data/demo/commerce';
import { DEMO_TICKETS } from '@/data/demo/fan';
import { STADIUM } from '@/data/demo/stadium';
import maracana from '@/services/stadium/generated/maracana';
import {
  SYNONYMS,
  areaCenter,
  distanceM,
  gatesOf,
  nearest,
  nearestBlock,
  nearestGate,
  normalize,
  poisOf,
  search,
} from '@/services/stadium/query';

const data = maracana;
const pois = poisOf(data);
const cats = (q: string) =>
  new Set(search(data, q).flatMap((h) => (h.kind === 'poi' ? [h.poi.category] : [])));

describe('busca com sinônimos', () => {
  it('acha banheiro por wc, sanitário e banheiro', () => {
    for (const q of ['wc', 'sanitário', 'Banheiro']) expect(cats(q).has('banheiro')).toBe(true);
  });
  it('acha comida por lanche, comida e bar', () => {
    for (const q of ['lanche', 'comida', 'bar']) expect(cats(q).has('alimentacao')).toBe(true);
  });
  it('acha saúde por médico e enfermaria', () => {
    for (const q of ['médico', 'enfermaria']) expect(cats(q).has('posto_medico')).toBe(true);
  });
  it('acha loja por camisa e o elevador por elevador', () => {
    expect(cats('camisa').has('loja')).toBe(true);
    expect(cats('elevador').has('elevador')).toBe(true);
  });
  it('acha portões pela letra, pela rampa e pelo apelido', () => {
    const gates = (q: string) => search(data, q).flatMap((h) => (h.kind === 'gate' ? [h.gate.id] : []));
    expect(gates('portão D')).toEqual(['D']);
    expect(gates('rampa a')).toEqual(['A']);
    expect(gates('Bellini')).toEqual(['D']);
    expect(gates('portão')).toHaveLength(6);
  });
  it('acha a área pelo nome', () => {
    expect(search(data, 'leste inferior').some((h) => h.kind === 'area' && h.id === 'leste-inferior')).toBe(
      true
    );
  });
  it('nenhum sinônimo fala de bebida alcoólica', () => {
    for (const words of Object.values(SYNONYMS))
      for (const w of words) expect(w).not.toMatch(/cerveja|chope|chopp|drink|alco/);
  });
  it('normaliza acento e caixa', () => {
    expect(normalize('  Médico  ')).toBe('medico');
  });
});

describe('perto de você', () => {
  const from = areaCenter(data, 'leste-inferior', '1')!;
  it('a área tem centro no nível dela', () => {
    expect(from).not.toBeNull();
    expect(areaCenter(data, 'leste-inferior', '5')).toBeNull();
  });
  it('lista do mais perto ao mais longe, só do nível pedido', () => {
    const list = nearest(pois, from, { level: '1', categories: ['banheiro'] });
    expect(list.length).toBeGreaterThan(3);
    for (let i = 1; i < list.length; i++)
      expect(list[i]!.distance).toBeGreaterThanOrEqual(list[i - 1]!.distance);
    for (const p of list) expect(p.level === '1' || p.level === null || p.levels.includes('1')).toBe(true);
    // O banheiro mais perto do Leste Inferior fica do lado Leste, a menos de 150 m.
    expect(list[0]!.distance).toBeLessThan(150);
  });
  it('dá o bloco de referência de um ponto', () => {
    const p = nearest(pois, from, { level: '1', categories: ['banheiro'] })[0]!;
    expect(nearestBlock(data, p.coords, p.level)).toMatch(/^1\d\d$/);
  });
  it('ponto externo não cita bloco; a referência é o portão', () => {
    const juizado = pois.find((p) => p.category === 'juizado')!;
    expect(nearestBlock(data, juizado.coords, null)).toBeUndefined();
    expect(nearestGate(data, juizado.coords)?.id).toBe('E');
  });
  it('distância plana coerente', () => {
    expect(Math.round(distanceM([-43.23, -22.912], [-43.23, -22.911]))).toBe(111);
  });
});

describe('ingresso, ofertas e mapa falam dos mesmos portões', () => {
  const areas = data.levels.areas;
  const sectorsOfArea = (id: string) =>
    data.levels.sectors.filter((s) => areas.find((a) => a.id === id)!.sectors.includes(s.id));
  it('todo setor do app tem área no mapa', () => {
    for (const s of STADIUM.sectors) expect(areas.some((a) => a.id === s.areaId)).toBe(true);
  });
  it('o portão de cada oferta é um portão da área no mapa', () => {
    for (const o of SECTOR_OFFERS) {
      const areaId = STADIUM.sectors.find((s) => s.id === o.sectorId)!.areaId;
      const gates = new Set(sectorsOfArea(areaId).flatMap((s) => s.gates));
      expect(gates.has(o.gate)).toBe(true);
    }
  });
  it('os portões do app existem no mapa, com a mesma posição', () => {
    const real = new Map(gatesOf(data).map((g) => [g.id, g.coords]));
    for (const g of STADIUM.gates) {
      const at = real.get(g.id)!;
      expect(at).toBeDefined();
      expect(distanceM(at, [g.coords.longitude, g.coords.latitude])).toBeLessThan(5);
    }
  });
  it('o ingresso de demonstração tem bloco e portão do setor', () => {
    const t = DEMO_TICKETS[0]!;
    expect(t.seat).toMatch(/Bloco 1\d\d/);
    expect(t.gate).toBe('D');
  });
});
