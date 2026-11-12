/**
 * Consultas sobre os dados de um estádio: busca com sinônimos, distâncias e referências
 * ("perto do bloco 118"). Genérico: nada aqui conhece um estádio específico.
 *
 * As distâncias desta versão são em linha reta. A fase de rotas troca por distância pelos
 * corredores (walkways.geojson) com tempo a pé.
 */
import type { Confidence, PoiCategory, StadiumData } from './types';

export type LngLat = [number, number];

export interface PoiInfo {
  id: string;
  category: PoiCategory;
  name: string;
  level: string | null;
  levels: string[];
  sector?: string;
  confidence: Confidence;
  coords: LngLat;
}

export interface GateInfo {
  id: string;
  name: string;
  nickname?: string;
  street: string;
  side: string;
  station: string;
  coords: LngLat;
}

/** Palavras que o torcedor usa para cada categoria (sem acento, minúsculas). */
export const SYNONYMS: Record<PoiCategory, string[]> = {
  banheiro: ['banheiro', 'banheiros', 'sanitario', 'wc', 'toalete', 'toilete', 'mictorio'],
  banheiro_acessivel: ['banheiro acessivel', 'acessivel', 'pcd', 'cadeirante', 'banheiro', 'wc'],
  alimentacao: ['comida', 'comer', 'lanche', 'lanchonete', 'bar', 'fome', 'cachorro quente', 'pipoca'],
  bebidas: ['bebida', 'agua', 'refrigerante', 'refri', 'suco', 'bar', 'sede'],
  loja: ['loja', 'camisa', 'produto', 'manto', 'quiosque', 'souvenir'],
  elevador: ['elevador', 'subir', 'descer', 'acessivel', 'cadeirante'],
  escada_rolante: ['escada rolante', 'escada', 'subir', 'descer'],
  escada: ['escada', 'subir', 'descer'],
  posto_medico: [
    'medico',
    'enfermaria',
    'saude',
    'ambulatorio',
    'primeiros socorros',
    'socorro',
    'passando mal',
  ],
  informacao: ['informacao', 'informacoes', 'atendimento', 'ajuda', 'duvida'],
  sala_sensorial: ['sala sensorial', 'sensorial', 'autismo', 'tea', 'silencio'],
  bilheteria: ['bilheteria', 'ingresso', 'problema com ingresso', 'biometria'],
  estacionamento: ['estacionamento', 'carro', 'vaga'],
  saida_emergencia: ['saida', 'saida de emergencia', 'emergencia'],
  seguranca: ['seguranca', 'policia', 'policial', 'ajuda', 'denuncia', 'furto', 'briga'],
  juizado: ['juizado', 'denuncia', 'racismo', 'injuria', 'justica'],
  acolhimento: ['acolhimento', 'mulher', 'assedio', 'importunacao', 'violencia', 'denuncia', 'ajuda'],
};

export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

const point = (g: unknown): LngLat => (g as { coordinates: LngLat }).coordinates;

export function poisOf(data: StadiumData): PoiInfo[] {
  return data.pois.features.map((f) => {
    const p = f.properties as Record<string, any>;
    return {
      id: p.id,
      category: p.category,
      name: p.name,
      level: p.level ?? null,
      levels: p.levels ?? [],
      sector: p.sector,
      confidence: p.confidence,
      coords: point(f.geometry),
    };
  });
}

export function gatesOf(data: StadiumData): GateInfo[] {
  return data.gates.features
    .filter((f) => f.properties?.kind === 'gate')
    .map((f) => {
      const p = f.properties as Record<string, any>;
      return {
        id: p.id,
        name: p.name,
        nickname: p.nickname,
        street: p.street,
        side: p.side,
        station: p.station,
        coords: point(f.geometry),
      };
    });
}

/** O ponto aparece neste nível (é dele, conecta a ele, ou é externo)? */
export const isOnLevel = (p: PoiInfo, level: string) =>
  p.level === level || p.level === null || p.levels.includes(level);

/** Distância em metros (aproximação plana, ótima na escala de um estádio). */
export function distanceM(a: LngLat, b: LngLat) {
  const k = Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
  const dx = (a[0] - b[0]) * 111_320 * k;
  const dy = (a[1] - b[1]) * 110_540;
  return Math.hypot(dx, dy);
}

/** Centro da área (setores dela) num nível. */
export function areaCenter(data: StadiumData, areaId: string, level: string): LngLat | null {
  let x = 0,
    y = 0,
    n = 0;
  for (const f of data.stadium.features) {
    const p = f.properties as Record<string, any>;
    if (p.kind !== 'sector' || p.area !== areaId || p.level !== level || f.geometry.type !== 'Polygon')
      continue;
    for (const [lng, lat] of f.geometry.coordinates[0] ?? []) {
      x += lng!;
      y += lat!;
      n++;
    }
  }
  return n ? [x / n, y / n] : null;
}

/** Bloco numerado mais próximo de um ponto, no mesmo nível ("perto do bloco 118"). */
export function nearestBlock(data: StadiumData, at: LngLat, level: string | null): string | undefined {
  // Fora das arquibancadas (esplanada) bloco não ajuda: a referência é o portão.
  if (level === null) return undefined;
  let best: { ref: string; d: number } | undefined;
  for (const f of data.stadium.features) {
    const p = f.properties as Record<string, any>;
    if (p.kind !== 'section-label' || (level && p.level !== level)) continue;
    const d = distanceM(at, point(f.geometry));
    if (!best || d < best.d) best = { ref: p.ref, d };
  }
  return best && best.d < 90 ? best.ref : undefined;
}

/** Portão mais próximo de um ponto (referência para o que fica fora das arquibancadas). */
export function nearestGate(data: StadiumData, at: LngLat): GateInfo | undefined {
  return gatesOf(data).reduce<GateInfo | undefined>(
    (best, g) => (!best || distanceM(at, g.coords) < distanceM(at, best.coords) ? g : best),
    undefined
  );
}

/** Pontos do nível, do mais perto ao mais longe de `from` (em linha reta, por enquanto). */
export function nearest(
  pois: PoiInfo[],
  from: LngLat,
  opts: { level: string; categories?: PoiCategory[] }
): (PoiInfo & { distance: number })[] {
  return pois
    .filter((p) => isOnLevel(p, opts.level) && (!opts.categories || opts.categories.includes(p.category)))
    .map((p) => ({ ...p, distance: distanceM(from, p.coords) }))
    .sort((a, b) => a.distance - b.distance);
}

export type SearchHit =
  | { kind: 'poi'; poi: PoiInfo }
  | { kind: 'gate'; gate: GateInfo }
  | { kind: 'area'; id: string; name: string };

/**
 * Busca por nome, categoria e sinônimo ("wc", "lanche", "médico", "portão D", "Bellini",
 * "leste inferior"). Os pontos do nível atual vêm primeiro.
 */
export function search(data: StadiumData, query: string, level?: string): SearchHit[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];

  const gateWord = /^(portao|porta|entrada|rampa|acesso)\s*([a-f])?$/.exec(q);
  for (const g of gatesOf(data)) {
    const letter = g.id.toLowerCase();
    if (
      (gateWord && (!gateWord[2] || gateWord[2] === letter)) ||
      normalize(g.name) === q ||
      (g.nickname && normalize(g.nickname).startsWith(q))
    )
      hits.push({ kind: 'gate', gate: g });
  }

  for (const a of data.levels.areas)
    if (normalize(a.name).includes(q)) hits.push({ kind: 'area', id: a.id, name: a.name });

  const matchesCategory = (cat: PoiCategory) =>
    SYNONYMS[cat].some((w) => w === q || w.startsWith(q) || (q.length > 3 && q.includes(w)));
  const pois = poisOf(data).filter((p) => matchesCategory(p.category) || normalize(p.name).includes(q));
  const here = (p: PoiInfo) => (level && isOnLevel(p, level) ? 0 : 1);
  pois.sort((a, b) => here(a) - here(b));
  for (const p of pois) hits.push({ kind: 'poi', poi: p });
  return hits;
}

function inRing(ring: number[][], at: LngLat) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] as LngLat;
    const [xj, yj] = ring[j] as LngLat;
    if (yi > at[1] !== yj > at[1] && at[0] < ((xj - xi) * (at[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * O ponto está no estádio? Conta a esplanada, as rampas (as monumentais se estendem
 * para fora dela) e a área junto aos portões.
 */
export function isInside(data: StadiumData, at: LngLat): boolean {
  for (const f of data.stadium.features) {
    const kind = (f.properties as Record<string, unknown>)?.kind;
    if ((kind === 'esplanade' || kind === 'ramp') && f.geometry.type === 'Polygon')
      if (inRing(f.geometry.coordinates[0] ?? [], at)) return true;
  }
  return gatesOf(data).some((g) => distanceM(g.coords, at) < 40);
}
