/**
 * Rotas a pé pelo grafo de corredores (walkways.geojson): tempo de caminhada, "mais perto"
 * pelo caminho de verdade e passos em texto. Genérico: nada aqui conhece um estádio.
 *
 * Tempo: 1,2 m/s andando; rampa e escada custam mais; elevador soma a espera.
 * Modo acessível: só arestas `accessible` (nunca escada nem escada rolante).
 */
import type { LngLat } from './query';
import type { WalkwayType } from './types';

type FC = import('geojson').FeatureCollection;

export const WALK_SPEED = 1.2;

export interface GraphNode {
  id: string;
  level: string | null;
  ref: string | null;
  z: number;
  at: LngLat;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: WalkwayType;
  accessible: boolean;
  length: number;
  coords: LngLat[];
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  adj: Map<string, GraphEdge[]>;
}

/** Segundos para percorrer uma aresta. */
export function edgeSeconds(e: GraphEdge) {
  const walk = e.length / WALK_SPEED;
  switch (e.type) {
    case 'rampa':
      return walk * 1.25;
    case 'escada':
      return walk * 1.7 + 8;
    case 'escada_rolante':
      return walk * 0.9 + 8;
    case 'elevador':
      // Espera média + subida (mais rápida que andar).
      return 45 + e.length / 3;
    default:
      return walk;
  }
}

export function buildGraph(walkways: FC): Graph {
  const nodes = new Map<string, GraphNode>();
  const adj = new Map<string, GraphEdge[]>();
  for (const f of walkways.features) {
    const p = f.properties as Record<string, any>;
    if (p.kind === 'node')
      nodes.set(p.id, {
        id: p.id,
        level: p.level ?? null,
        ref: p.ref ?? null,
        z: p.z ?? 0,
        at: (f.geometry as unknown as { coordinates: LngLat }).coordinates,
      });
  }
  for (const f of walkways.features) {
    const p = f.properties as Record<string, any>;
    if (p.kind !== 'edge') continue;
    const coords = (f.geometry as unknown as { coordinates: LngLat[] }).coordinates;
    const e: GraphEdge = {
      id: p.id,
      from: p.from,
      to: p.to,
      type: p.type,
      accessible: p.accessible,
      length: p.length,
      coords,
    };
    const back: GraphEdge = { ...e, from: p.to, to: p.from, coords: [...coords].reverse() };
    adj.set(e.from, [...(adj.get(e.from) ?? []), e]);
    adj.set(back.from, [...(adj.get(back.from) ?? []), back]);
  }
  return { nodes, adj };
}

const flat = (a: LngLat, b: LngLat) => {
  const k = Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
  return Math.hypot((a[0] - b[0]) * 111_320 * k, (a[1] - b[1]) * 110_540);
};

/**
 * Pontos de partida a partir de uma posição: os nós mais próximos no mesmo nível (ou na
 * esplanada, sem nível), com o custo de andar até eles.
 */
export function startsNear(g: Graph, at: LngLat, level: string | null, k = 3) {
  return [...g.nodes.values()]
    .filter((n) => n.level === level)
    .map((n) => ({ node: n.id, cost: flat(at, n.at) / WALK_SPEED }))
    .sort((a, b) => a.cost - b.cost)
    .slice(0, k);
}

export interface Tree {
  seconds: Map<string, number>;
  prev: Map<string, GraphEdge>;
}

/** Dijkstra a partir de vários pontos de partida (o grafo tem centenas de nós: basta uma fila simples). */
export function walkTree(
  g: Graph,
  starts: { node: string; cost: number }[],
  opts: { accessible?: boolean } = {}
): Tree {
  const seconds = new Map<string, number>();
  const prev = new Map<string, GraphEdge>();
  const open = new Map<string, number>();
  for (const s of starts)
    if (g.nodes.has(s.node)) open.set(s.node, Math.min(s.cost, open.get(s.node) ?? Infinity));
  while (open.size) {
    let cur = '';
    let best = Infinity;
    for (const [id, c] of open)
      if (c < best) {
        best = c;
        cur = id;
      }
    open.delete(cur);
    if (seconds.has(cur)) continue;
    seconds.set(cur, best);
    for (const e of g.adj.get(cur) ?? []) {
      if (opts.accessible && !e.accessible) continue;
      if (seconds.has(e.to)) continue;
      const c = best + edgeSeconds(e);
      if (c < (open.get(e.to) ?? Infinity)) {
        open.set(e.to, c);
        prev.set(e.to, e);
      }
    }
  }
  return { seconds, prev };
}

export interface WalkPath {
  edges: GraphEdge[];
  seconds: number;
  meters: number;
}

/** Caminho até um nó, reconstruído da árvore. */
export function pathTo(tree: Tree, target: string): WalkPath | null {
  const seconds = tree.seconds.get(target);
  if (seconds === undefined) return null;
  const edges: GraphEdge[] = [];
  for (let e = tree.prev.get(target); e; e = tree.prev.get(e.from)) edges.unshift(e);
  return { edges, seconds, meters: edges.reduce((m, e) => m + e.length, 0) };
}

/** Nó do grafo de um ponto de interesse no nível pedido (escadas e elevadores têm um por nível). */
export function nodeForPoi(g: Graph, poiId: string, level?: string | null) {
  const own = g.nodes.get(`p-${poiId}`);
  if (own) return own.id;
  const stem = poiId.replace(/-\d$/, '');
  return level ? (g.nodes.has(`p-${stem}-${level}`) ? `p-${stem}-${level}` : undefined) : undefined;
}

/** Minutos para mostrar ("1 min" no mínimo). */
export const minutes = (s: number) => Math.max(1, Math.round(s / 60));

export type StepKind = 'start' | 'walk' | 'outside' | 'ramp' | 'elevator' | 'stairs' | 'escalator' | 'arrive';

export interface Step {
  kind: StepKind;
  text: string;
  /** Nível onde o passo acontece (tocar no passo mostra esse nível). */
  level: string | null;
  meters?: number;
}

/**
 * Passos em texto: corredores por nível, rampas, elevadores e escadas, e a chegada
 * ("Banheiros à direita"). `name` dá o nome de um nó com referência (rampa, elevador…).
 */
export function routeSteps(
  g: Graph,
  path: WalkPath,
  opts: { target: { name: string; at: LngLat }; origin?: string; name: (ref: string) => string | undefined }
): Step[] {
  const steps: Step[] = [];
  if (opts.origin)
    steps.push({
      kind: 'start',
      text: opts.origin,
      level: g.nodes.get(path.edges[0]?.from ?? '')?.level ?? null,
    });
  const E = path.edges;
  const lvl = (id: string) => g.nodes.get(id)?.level ?? null;
  const z = (id: string) => g.nodes.get(id)?.z ?? 0;
  /** Nome da rampa: do pé (r-X) se ele estiver no trecho; senão, da rampa mais próxima do trecho. */
  const rampName = (a: number, b: number) => {
    for (let k = a; k <= b; k++)
      for (const id of [E[k]!.from, E[k]!.to]) {
        const ref = g.nodes.get(id)?.ref;
        if (ref?.startsWith('rampa')) return opts.name(ref);
      }
    const at = g.nodes.get(E[a]!.to)!.at;
    let best: GraphNode | undefined;
    for (const n of g.nodes.values())
      if (n.ref?.startsWith('rampa') && (!best || flat(n.at, at) < flat(best.at, at))) best = n;
    return best ? opts.name(best.ref!) : undefined;
  };
  let i = 0;
  while (i < E.length) {
    const e = E[i]!;
    if (e.type === 'corredor' || e.type === 'externo') {
      let m = 0;
      const level = lvl(e.to) ?? lvl(e.from);
      const outside = e.type === 'externo';
      while (
        i < E.length &&
        E[i]!.type === e.type &&
        (outside || (lvl(E[i]!.to) ?? lvl(E[i]!.from)) === level)
      ) {
        m += E[i]!.length;
        i++;
      }
      // O último trecho até o destino vira a chegada (não um "siga" de poucos metros).
      if (i >= E.length && m < 25) continue;
      steps.push(
        outside
          ? { kind: 'outside', text: 'Siga pela esplanada', level: null, meters: m }
          : { kind: 'walk', text: `Siga pelo corredor do nível ${level}`, level, meters: m }
      );
      continue;
    }
    if (e.type === 'elevador') {
      let j = i;
      while (j + 1 < E.length && E[j + 1]!.type === 'elevador') j++;
      const name = opts.name(g.nodes.get(e.from)?.ref ?? '') ?? 'o elevador';
      steps.push({
        kind: 'elevator',
        text: `Pegue o ${name.replace(/^Elevador/, 'elevador')} até o nível ${lvl(E[j]!.to)}`,
        level: lvl(E[j]!.to),
      });
      i = j + 1;
      continue;
    }
    const up = z(e.to) > z(e.from);
    if (e.type === 'rampa') {
      // Trechos seguidos da mesma rampa viram um passo só ("Suba a Rampa D até o nível 3").
      let j = i;
      while (j + 1 < E.length && E[j + 1]!.type === 'rampa') j++;
      const ramp = rampName(i, j) ?? 'a rampa';
      const to = lvl(E[j]!.to);
      steps.push({
        kind: 'ramp',
        text: up
          ? `Suba a ${ramp} até o nível ${to}`
          : to
            ? `Desça a ${ramp} até o nível ${to}`
            : `Desça a ${ramp} até a esplanada`,
        level: to,
      });
      i = j + 1;
      continue;
    } else
      steps.push({
        kind: e.type === 'escada' ? 'stairs' : 'escalator',
        text: `${up ? 'Suba' : 'Desça'} ${e.type === 'escada' ? 'a escada' : 'a escada rolante'} até o nível ${lvl(e.to)}`,
        level: lvl(e.to),
      });
    i++;
  }

  // Chegada: de que lado fica, olhando para onde se anda no corredor.
  const last = E[E.length - 1];
  const walkDir = [...E].reverse().find((x, k) => k > 0 && x.type === 'corredor');
  let side = '';
  if (last && walkDir && walkDir.coords.length >= 2) {
    const [a, b] = [walkDir.coords[0]!, walkDir.coords[walkDir.coords.length - 1]!];
    const from = g.nodes.get(last.from)!.at;
    const cross =
      (b[0] - a[0]) * (opts.target.at[1] - from[1]) - (b[1] - a[1]) * (opts.target.at[0] - from[0]);
    side = cross > 0 ? ' à esquerda' : ' à direita';
  }
  steps.push({ kind: 'arrive', text: `${opts.target.name}${side}`, level: lvl(last?.to ?? '') });
  return steps;
}
