/**
 * Rotas a pé pelo grafo de corredores (src/services/stadium/routing.ts): tempo, rotas
 * entre níveis, modo acessível sem escadas, passos em texto e "mais perto" pelo caminho.
 */
import maracana from '@/services/stadium/generated/maracana';
import { poisOf } from '@/services/stadium/query';
import {
  WALK_SPEED,
  buildGraph,
  edgeSeconds,
  minutes,
  nodeForPoi,
  pathTo,
  routeSteps,
  walkTree,
} from '@/services/stadium/routing';

const g = buildGraph(maracana.walkways!);
const pois = poisOf(maracana);
const fromSeat = walkTree(g, [{ node: 's-leste-inferior', cost: 0 }]);
const fromSeatAccessible = walkTree(g, [{ node: 's-leste-inferior', cost: 0 }], { accessible: true });
const name = (ref: string) =>
  pois.find((p) => p.id === ref)?.name ?? maracana.levels.ramps.find((r) => r.id === ref)?.name;

describe('rotas a pé', () => {
  it('anda a 1,2 m/s no corredor e cobra mais na escada e no elevador', () => {
    const base = { id: 'x', from: 'a', to: 'b', accessible: true, length: 12, coords: [] };
    expect(edgeSeconds({ ...base, type: 'corredor' })).toBeCloseTo(12 / WALK_SPEED);
    expect(edgeSeconds({ ...base, type: 'escada' })).toBeGreaterThan(12 / WALK_SPEED);
    expect(edgeSeconds({ ...base, type: 'elevador' })).toBeGreaterThan(45);
    expect(minutes(10)).toBe(1);
    expect(minutes(150)).toBe(3);
  });

  it('chega a um ponto de outro nível subindo por rampa, escada ou elevador', () => {
    const target = pois.find((p) => p.level === '3' && p.category === 'banheiro')!;
    const path = pathTo(fromSeat, nodeForPoi(g, target.id)!)!;
    expect(path).not.toBeNull();
    expect(path.edges.some((e) => ['rampa', 'escada', 'escada_rolante', 'elevador'].includes(e.type))).toBe(
      true
    );
    expect(path.seconds).toBeGreaterThan(30);
  });

  it('o modo acessível nunca usa escada e alcança todos os pontos', () => {
    for (const p of pois) {
      const node = nodeForPoi(g, p.id);
      if (!node) continue;
      const path = pathTo(fromSeatAccessible, node);
      expect(path).not.toBeNull();
      for (const e of path!.edges) expect(['escada', 'escada_rolante']).not.toContain(e.type);
    }
  });

  it('o caminho acessível nunca é mais rápido que o livre', () => {
    for (const p of pois.slice(0, 60)) {
      const node = nodeForPoi(g, p.id)!;
      expect(fromSeatAccessible.seconds.get(node)!).toBeGreaterThanOrEqual(
        fromSeat.seconds.get(node)! - 1e-6
      );
    }
  });

  it('passos em texto: corredor, mudança de nível e chegada com o lado', () => {
    const target = pois.find((p) => p.level === '2' && p.category === 'alimentacao')!;
    const path = pathTo(fromSeat, nodeForPoi(g, target.id)!)!;
    const steps = routeSteps(g, path, {
      target: { name: target.name, at: target.coords },
      origin: 'Saindo do Leste Inferior',
      name,
    });
    expect(steps[0]!.kind).toBe('start');
    expect(steps.some((s) => s.kind === 'walk' && /nível 1/.test(s.text))).toBe(true);
    expect(
      steps.some(
        (s) => ['ramp', 'stairs', 'escalator', 'elevator'].includes(s.kind) && /nível 2/.test(s.text)
      )
    ).toBe(true);
    expect(steps[steps.length - 1]!.text).toMatch(new RegExp(`^${target.name}( à (direita|esquerda))?$`));
  });

  it('o banheiro mais perto do Leste Inferior pelo caminho fica do lado Leste', () => {
    const ranked = pois
      .filter((p) => p.category === 'banheiro' && p.level === '1')
      .map((p) => ({ p, s: fromSeat.seconds.get(nodeForPoi(g, p.id)!)! }))
      .sort((a, b) => a.s - b.s);
    const sector = maracana.levels.sectors.find((s) => s.id === ranked[0]!.p.sector);
    expect(sector?.side).toBe('leste');
    expect(minutes(ranked[0]!.s)).toBeLessThanOrEqual(3);
  });

  it('do portão D dá para chegar ao nível 5 pela rampa monumental', () => {
    const fromGate = walkTree(g, [{ node: 'g-D', cost: 0 }], { accessible: true });
    const target = pois.find((p) => p.level === '5' && p.category === 'banheiro')!;
    const path = pathTo(fromGate, nodeForPoi(g, target.id)!)!;
    expect(path.edges.some((e) => e.type === 'rampa' || e.type === 'elevador')).toBe(true);
  });
});
