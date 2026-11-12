/**
 * Gera os dados do Modo Maracanã a partir das fontes em map/tools/sources/:
 *   - osm-maracana.json          contorno, gramado e as 6 rampas (OpenStreetMap, ODbL)
 *   - concessoes-manual-2019.json posições das concessões (Manual da Instalação, Figs. 68–71)
 * e das regras documentadas em assets/stadiums/maracana/SOURCES.md.
 *
 * Saída: assets/stadiums/maracana/{venue,levels,sources}.json e
 *        {stadium,gates,pois,walkways}.geojson
 *
 * Determinístico: a mesma entrada gera sempre os mesmos arquivos.
 * Uso: npx tsx map/tools/build-stadium.ts
 */
import fs from 'node:fs';
import path from 'node:path';

import type {
  Area,
  Confidence,
  Gate,
  Level,
  Poi,
  PoiCategory,
  Ramp,
  Sector,
  Side,
  Source,
  Venue,
  WalkwayEdge,
  WalkwayType,
} from '../../src/services/stadium/types';

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'assets/stadiums/maracana');
const SRC = path.join(__dirname, 'sources');

type LngLat = [number, number];
type Ring = LngLat[];
type Feature = { type: 'Feature'; id?: string; properties: Record<string, unknown>; geometry: any };
const fc = (features: Feature[]) => ({ type: 'FeatureCollection', features });
const round = (n: number, d = 7) => Math.round(n * 10 ** d) / 10 ** d;

// ─────────────────────────────────────────────────────────────── fontes
const SOURCES: Source[] = [
  {
    id: 'manual2019',
    title: 'Manual da Instalação do Complexo do Maracanã (Anexo X)',
    publisher: 'Governo do Estado do Rio de Janeiro, Casa Civil',
    url: 'https://www.rj.gov.br/casacivil/sites/default/files/arquivos_paginas/13.Anexo%20X%20-%20Manual%20de%20Instala%C3%A7%C3%A3o_0.pdf',
    date: '2019',
  },
  {
    id: 'escopo2019',
    title: 'Guia de Escopo Operacional (Anexo XI)',
    publisher: 'Governo do Estado do Rio de Janeiro, Casa Civil',
    url: 'https://www.rj.gov.br/casacivil/sites/default/files/arquivos_paginas/14.Anexo%20XI%20-%20Guia%20de%20Escopo%20Operacional_0.pdf',
    date: '2019',
  },
  {
    id: 'nfl2026',
    title: 'NFL Brazil Game 2026 — guia de acessibilidade',
    publisher: 'NFL',
    url: 'https://www.nfl.com/international/games/rio/event-info/accessibility-guide',
    date: '2026-09',
    note: 'Evento de futebol americano; parte da estrutura (ex.: banheiros químicos) pode ser específica do evento.',
  },
  {
    id: 'lance2024',
    title: 'Maracanã: como chegar e onde fica cada portão',
    publisher: 'Lance!',
    url: 'https://www.lance.com.br/lancepedia/maracana-como-chegar-portao.html',
    date: '2024-10-26',
  },
  {
    id: 'ingressos2025',
    title: 'Informações sobre ingressos para Flamengo x Vasco (Brasileirão 2025)',
    publisher: 'Vasco da Gama (via NetVasco)',
    url: 'https://www.netvasco.com.br/n/369272/informacoes-sobre-ingressos-para-Flamengo-x-vasco',
    date: '2025-09-15',
    note: 'Lista setores, portões de cada setor e acesso por biometria facial. Portões podem mudar por jogo.',
  },
  {
    id: 'ingressos2023',
    title: 'Flamengo x Vasco: informações sobre ingressos',
    publisher: 'Lance!',
    url: 'https://www.lance.com.br/flamengo/flamengo-x-vasco-veja-informacoes-sobre-ingressos-para-estreia-de-tite-no-maracana.html',
    date: '2023-10-11',
  },
  {
    id: 'alerj2026',
    title: 'Lei 10.773/25 prevê postos de apoio às mulheres vítimas de assédio em estádios do Rio',
    publisher: 'Assembleia Legislativa do Estado do Rio de Janeiro (Alerj)',
    url: 'https://www.alerj.rj.gov.br/Visualizar/Noticia/85362',
    date: '2026-06-06',
    note: 'A lei exige postos avançados de atendimento a vítimas de violência de gênero nos estádios. Em jun/2026 a Alerj ainda ia vistoriar onde fica o posto no Maracanã.',
  },
  {
    id: 'mprj2025',
    title: 'MPRJ leva Ouvidoria ao Maracanã e reforça combate ao racismo',
    publisher: 'Ministério Público do Estado do Rio de Janeiro',
    url: 'https://www.mprj.mp.br/web/guest/visualizar?noticiaId=179306',
    date: '2025-05-15',
    note: 'Promotores do GAEDEST nos jogos; denúncia à segurança do estádio, à PM ou ao promotor de plantão; Ouvidoria pelo 127.',
  },
  {
    id: 'agbrasil2025',
    title: 'Torcedor chileno é preso após gestos racistas em jogo no Maracanã',
    publisher: 'Agência Brasil',
    url: 'https://agenciabrasil.ebc.com.br/direitos-humanos/noticia/2025-05/torcedor-chileno-e-preso-apos-gestos-racistas-em-jogo-no-maracana',
    date: '2025-05-15',
    note: 'Segurança do estádio acionou o Batalhão Especial de Policiamento em Estádios; audiência de custódia no Juizado Especial do Torcedor.',
  },
  {
    id: 'cnn2023',
    title: 'Justiça mantém torcedora argentina presa por injúria racial no Maracanã',
    publisher: 'CNN Brasil',
    url: 'https://www.cnnbrasil.com.br/nacional/justica-mantem-torcedora-argentina-presa-por-caso-de-injuria-racial-no-maracana/',
    date: '2023-11-22',
    note: 'Cita o "posto do Juizado do Torcedor no estádio do Maracanã" (Juizado do Torcedor e dos Grandes Eventos, TJ-RJ).',
  },
  {
    id: 'gov-canais',
    title: 'Ligue 180 (Central de Atendimento à Mulher) e Disque 100 (Direitos Humanos)',
    publisher: 'Governo Federal',
    url: 'https://www.gov.br/mulheres/pt-br/ligue180',
    date: '2026-11-11',
  },
  {
    id: 'osm',
    title: 'OpenStreetMap (Overpass API)',
    publisher: '© OpenStreetMap contributors, ODbL',
    url: 'https://www.openstreetmap.org/relation/4587734',
    date: '2026-11-11',
  },
];

// ─────────────────────────────────────────────────────────────── OSM
const osm = JSON.parse(fs.readFileSync(path.join(SRC, 'osm-maracana.json'), 'utf8')).elements as any[];
const byId = new Map(osm.map((e) => [`${e.type}/${e.id}`, e]));

function joinWays(members: any[]): Ring[] {
  const segs: LngLat[][] = members
    .filter((m) => m.geometry?.length)
    .map((m) => m.geometry.map((p: any) => [p.lon, p.lat] as LngLat));
  const rings: Ring[] = [];
  const same = (a: LngLat, b: LngLat) => a[0] === b[0] && a[1] === b[1];
  while (segs.length) {
    let ring = segs.shift()!;
    let grew = true;
    while (grew && !same(ring[0], ring[ring.length - 1])) {
      grew = false;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        if (same(s[0], ring[ring.length - 1])) ring = ring.concat(s.slice(1));
        else if (same(s[s.length - 1], ring[ring.length - 1])) ring = ring.concat([...s].reverse().slice(1));
        else if (same(s[s.length - 1], ring[0])) ring = s.slice(0, -1).concat(ring);
        else if (same(s[0], ring[0])) ring = [...s].reverse().slice(0, -1).concat(ring);
        else continue;
        segs.splice(i, 1);
        grew = true;
        break;
      }
    }
    rings.push(ring);
  }
  return rings;
}

const pitchWay = osm.find((e) => e.tags?.leisure === 'pitch');
const pitchOsm: LngLat[] = pitchWay.geometry.map((p: any) => [p.lon, p.lat]);
const stadiumRel = byId.get('relation/4587734');

// ─────────────────────────────────────────────── referencial do gramado
// Origem no centro do gramado; u = eixo maior (+Norte), v = eixo menor (+Leste), em metros.
const c0: LngLat = [
  pitchOsm.slice(0, 4).reduce((s, p) => s + p[0], 0) / 4,
  pitchOsm.slice(0, 4).reduce((s, p) => s + p[1], 0) / 4,
];
const KX = 111320 * Math.cos((c0[1] * Math.PI) / 180);
const KY = 110540;
const toXY = (p: LngLat) => [(p[0] - c0[0]) * KX, (p[1] - c0[1]) * KY] as const;
const fromXY = (x: number, y: number): LngLat => [round(c0[0] + x / KX), round(c0[1] + y / KY)];

// Rumo do eixo maior: aresta mais longa do gramado do OSM, apontando para o lado "Norte" do estádio.
const edges = [0, 1, 2, 3].map((i) => {
  const [x1, y1] = toXY(pitchOsm[i]);
  const [x2, y2] = toXY(pitchOsm[i + 1]);
  return {
    len: Math.hypot(x2 - x1, y2 - y1),
    brg: ((Math.atan2(x2 - x1, y2 - y1) * 180) / Math.PI + 360) % 360,
  };
});
const longEdge = edges.reduce((a, b) => (b.len > a.len ? b : a));
// O setor Norte fica do lado da Radial Oeste (rumo ~30°); escolhe o sentido mais próximo do norte geográfico.
const BEARING = longEdge.brg > 90 && longEdge.brg < 270 ? (longEdge.brg + 180) % 360 : longEdge.brg;
const B = (BEARING * Math.PI) / 180;
const toUV = (p: LngLat) => {
  const [x, y] = toXY(p);
  return [x * Math.sin(B) + y * Math.cos(B), x * Math.cos(B) - y * Math.sin(B)] as const;
};
const fromUV = (u: number, v: number): LngLat =>
  fromXY(u * Math.sin(B) + v * Math.cos(B), u * Math.cos(B) - v * Math.sin(B));
/** Ângulo φ no referencial do gramado: 0 = Norte, 90 = Leste, 180 = Sul, 270 = Oeste. */
const polar = (phiDeg: number, r: number): LngLat => {
  const f = (phiDeg * Math.PI) / 180;
  return fromUV(r * Math.cos(f), r * Math.sin(f));
};
const phiOf = (u: number, v: number) => ((Math.atan2(v, u) * 180) / Math.PI + 360) % 360;

// ─────────────────────────────────────────────── contornos do estádio
// Borda frontal da arquibancada (Fig. 21 do manual): 6,5 m das laterais (tabela 2) e ~22 m atrás dos gols.
const FRONT = { a: 52.5 + 22, b: 34 + 6.5, n: 2.6 };
const superR = (phi: number, a: number, b: number, n: number) => {
  const f = (phi * Math.PI) / 180;
  return (Math.abs(Math.cos(f) / a) ** n + Math.abs(Math.sin(f) / b) ** n) ** (-1 / n);
};
const front = (phi: number) => superR(phi, FRONT.a, FRONT.b, FRONT.n);

// Fachada: anel externo do OSM sem as rampas monumentais (raio > 185 m) e suavizado.
const outerRings = joinWays(stadiumRel.members.filter((m: any) => m.role === 'outer'));
const innerRings = joinWays(stadiumRel.members.filter((m: any) => m.role === 'inner'));
const facadeSamples: { phi: number; r: number }[] = [];
for (const ring of outerRings)
  for (const p of ring) {
    const [u, v] = toUV(p);
    const r = Math.hypot(u, v);
    if (r < 185) facadeSamples.push({ phi: phiOf(u, v), r });
  }
const angDist = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const facadeTable = Array.from({ length: 360 }, (_, deg) => {
  const near = facadeSamples.filter((s) => angDist(s.phi, deg) <= 14).map((s) => s.r);
  near.sort((a, b) => a - b);
  return near.length ? near[Math.floor(near.length / 2)] : NaN;
});
// preenche buracos (sob as rampas) por interpolação
for (let d = 0; d < 360; d++)
  if (Number.isNaN(facadeTable[d])) {
    let a = d,
      b = d;
    while (Number.isNaN(facadeTable[(a + 359) % 360])) a = (a + 359) % 360;
    while (Number.isNaN(facadeTable[(b + 1) % 360])) b = (b + 1) % 360;
    const ra = facadeTable[(a + 359) % 360],
      rb = facadeTable[(b + 1) % 360];
    const span = ((b - a + 360) % 360) + 2,
      k = ((d - a + 360) % 360) + 1;
    facadeTable[d] = ra + ((rb - ra) * k) / span;
  }
const smooth = facadeTable.map((_, d) => {
  let s = 0;
  for (let k = -6; k <= 6; k++) s += facadeTable[(d + k + 360) % 360];
  return s / 13;
});
const facade = (phi: number) => {
  const d = ((phi % 360) + 360) % 360,
    i = Math.floor(d),
    f = d - i;
  return smooth[i] * (1 - f) + smooth[(i + 1) % 360] * f;
};
/**
 * Fundo da arquibancada: fachada menos o anel de circulação externo (estrutura com as
 * rampas internas). As concessões do manual ficam 25–39 m para dentro da fachada, e a
 * Fig. 21 põe o fundo da arquibancada Leste a ~63 m da lateral do campo: 30 m atende os dois.
 */
const CONCOURSE = 30;
const standOuter = (phi: number) => facade(phi) - CONCOURSE;
/** Ponto a uma fração t do fundo da arquibancada (0 = frente, 1 = fundo). */
const atT = (phi: number, t: number) => front(phi) + t * (standOuter(phi) - front(phi));

const arc = (from: number, to: number, rFn: (phi: number) => number, step = 2): LngLat[] => {
  const pts: LngLat[] = [];
  const n = Math.max(2, Math.ceil(Math.abs(to - from) / step));
  for (let i = 0; i <= n; i++) {
    const phi = from + ((to - from) * i) / n;
    pts.push(polar(phi, rFn(phi)));
  }
  return pts;
};
const band = (from: number, to: number, t0: number, t1: number): Ring => {
  const outer = arc(from, to, (p) => atT(p, t1));
  const inner = arc(to, from, (p) => atT(p, t0));
  const ring = [...outer, ...inner];
  ring.push(ring[0]);
  return ring;
};
const fullRing = (rFn: (phi: number) => number): Ring => {
  const r = arc(0, 360, rFn, 2);
  r[r.length - 1] = r[0];
  return r;
};

// ─────────────────────────────────────────────── níveis
const LEVELS: Level[] = [
  {
    id: '0',
    name: 'Térreo',
    short: 'T',
    public: false,
    order: 0,
    floor: 0,
    description: 'Área de competição, administração, imprensa e acesso VIP.',
  },
  {
    id: '1',
    name: 'Nível 1',
    short: '1',
    public: true,
    order: 1,
    floor: 6,
    description: 'Arquibancadas inferiores nos quatro lados, Maracanã Mais (Oeste) e Leste Mais (Leste).',
  },
  {
    id: '2',
    name: 'Nível 2',
    short: '2',
    public: true,
    order: 2,
    floor: 14,
    description: 'Camarotes Leste e Oeste e arquibancadas superiores Norte e Sul.',
  },
  {
    id: '3',
    name: 'Nível 3',
    short: '3',
    public: true,
    order: 3,
    floor: 19,
    description: 'Arquibancada Leste Superior, camarotes Oeste e Tribuna de Honra.',
  },
  {
    id: '4',
    name: 'Nível 4',
    short: '4',
    public: false,
    order: 4,
    floor: 23,
    description: 'Salas de trabalho da imprensa.',
  },
  {
    id: '5',
    name: 'Nível 5',
    short: '5',
    public: true,
    order: 5,
    floor: 27,
    description: 'Arquibancadas superiores Norte e Sul, cadeiras cativas (Oeste) e imprensa.',
  },
];
const FLOOR = Object.fromEntries(LEVELS.map((l) => [l.id, l.floor]));

// ─────────────────────────────────────────────── setores
// Lados por ângulo φ: Norte [-50, 50], Leste [50, 130], Sul [130, 230], Oeste [230, 310].
const SIDE_SPAN: Record<Side, [number, number]> = {
  norte: [-50, 50],
  leste: [50, 130],
  sul: [130, 230],
  oeste: [230, 310],
};
// A numeração dos blocos corre no sentido anti-horário (φ decrescente), começando no Oeste junto ao Norte (Fig. 21).
type SectorSpec = Omit<Sector, 'blocks' | 'source' | 'confidence' | 'note'> & {
  t: [number, number];
  blockRange?: [number, number];
  skip?: number[];
  rake: [number, number];
  source?: string[];
  confidence?: Confidence;
  note?: string;
};
const range = (a: number, b: number, skip: number[] = []) =>
  Array.from({ length: b - a + 1 }, (_, i) => a + i).filter((n) => !skip.includes(n));

const SECTOR_SPECS: SectorSpec[] = [
  // Nível 1 — arquibancada inferior
  {
    id: 'oeste-inferior',
    name: 'Cadeira Oeste Inferior',
    ticketName: 'Oeste Inferior',
    side: 'oeste',
    level: '1',
    kind: 'arquibancada',
    gates: ['A'],
    ramps: ['rampa-a'],
    t: [0, 0.43],
    blockRange: [101, 107],
    rake: [1.5, 11],
  },
  {
    id: 'sul-inferior',
    name: 'Cadeira Sul Inferior',
    ticketName: 'Sul',
    side: 'sul',
    level: '1',
    kind: 'arquibancada',
    gates: ['B', 'C'],
    ramps: ['rampa-b', 'rampa-c'],
    t: [0, 0.43],
    blockRange: [108, 115],
    rake: [1.5, 11],
    visitor: true,
  },
  {
    id: 'leste-inferior',
    name: 'Cadeira Leste Inferior',
    ticketName: 'Leste Inferior',
    side: 'leste',
    level: '1',
    kind: 'arquibancada',
    gates: ['D'],
    ramps: ['rampa-d'],
    t: [0, 0.43],
    blockRange: [116, 122],
    rake: [1.5, 11],
  },
  {
    id: 'norte-inferior',
    name: 'Cadeira Norte Inferior',
    ticketName: 'Norte',
    side: 'norte',
    level: '1',
    kind: 'arquibancada',
    gates: ['E', 'F'],
    ramps: ['rampa-e', 'rampa-f'],
    t: [0, 0.43],
    blockRange: [123, 130],
    rake: [1.5, 11],
  },
  // Nível 2
  {
    id: 'camarotes-oeste-2',
    name: 'Camarotes Oeste (Nível 2)',
    side: 'oeste',
    level: '2',
    kind: 'camarote',
    gates: ['A'],
    ramps: ['rampa-a'],
    t: [0.45, 0.52],
    rake: [12, 15],
  },
  {
    id: 'camarotes-leste-2',
    name: 'Camarotes Leste (Nível 2)',
    side: 'leste',
    level: '2',
    kind: 'camarote',
    gates: ['D'],
    ramps: ['rampa-d'],
    t: [0.45, 0.52],
    rake: [12, 15],
  },
  {
    id: 'sul-superior-2',
    name: 'Cadeira Sul Superior (Nível 2)',
    ticketName: 'Sul',
    side: 'sul',
    level: '2',
    kind: 'arquibancada',
    gates: ['B', 'C'],
    ramps: ['rampa-b', 'rampa-c'],
    t: [0.45, 0.76],
    blockRange: [201, 218],
    rake: [14, 23],
    visitor: true,
  },
  {
    id: 'norte-superior-2',
    name: 'Cadeira Norte Superior (Nível 2)',
    ticketName: 'Norte',
    side: 'norte',
    level: '2',
    kind: 'arquibancada',
    gates: ['E', 'F'],
    ramps: ['rampa-e', 'rampa-f'],
    t: [0.45, 0.76],
    blockRange: [219, 238],
    rake: [14, 23],
  },
  // Nível 3
  {
    id: 'camarotes-oeste-3',
    name: 'Camarotes Oeste e Tribuna de Honra (Nível 3)',
    side: 'oeste',
    level: '3',
    kind: 'tribuna',
    gates: ['A'],
    ramps: ['rampa-a'],
    t: [0.52, 0.6],
    rake: [16, 19],
  },
  {
    id: 'leste-superior',
    name: 'Cadeira Leste Superior',
    ticketName: 'Leste Superior',
    side: 'leste',
    level: '3',
    kind: 'arquibancada',
    gates: ['D'],
    ramps: ['rampa-d'],
    t: [0.52, 1],
    blockRange: [301, 313],
    rake: [17, 31],
  },
  // Nível 5
  {
    id: 'cativas-oeste',
    name: 'Cadeiras Cativas (Oeste)',
    side: 'oeste',
    level: '5',
    kind: 'cativa',
    gates: ['A'],
    ramps: ['rampa-a'],
    t: [0.6, 1],
    blockRange: [501, 511],
    skip: [506],
    rake: [21, 31],
  },
  {
    id: 'sul-superior-5',
    name: 'Cadeira Sul Superior (Nível 5)',
    ticketName: 'Sul',
    side: 'sul',
    level: '5',
    kind: 'arquibancada',
    gates: ['B', 'C', 'D'],
    ramps: ['rampa-b', 'rampa-c', 'rampa-d'],
    t: [0.76, 1],
    blockRange: [512, 529],
    rake: [24, 31],
    visitor: true,
  },
  {
    id: 'norte-superior-5',
    name: 'Cadeira Norte Superior (Nível 5)',
    ticketName: 'Norte',
    side: 'norte',
    level: '5',
    kind: 'arquibancada',
    gates: ['E', 'F', 'D'],
    ramps: ['rampa-e', 'rampa-f', 'rampa-d'],
    t: [0.76, 1],
    blockRange: [530, 547],
    rake: [24, 31],
  },
];
// Áreas premium dentro da arquibancada inferior (Fig. 21: caixas sobre os blocos 103–105 e 118–120)
const PREMIUM: {
  id: string;
  name: string;
  side: Side;
  gates: string[];
  ramps: string[];
  span: [number, number];
}[] = [
  {
    id: 'maracana-mais',
    name: 'Maracanã Mais',
    side: 'oeste',
    gates: ['A'],
    ramps: ['rampa-a'],
    span: [258, 282],
  },
  { id: 'leste-mais', name: 'Leste Mais', side: 'leste', gates: ['D'], ramps: ['rampa-d'], span: [78, 102] },
];

// Perfil da bacia (altura do topo de cada degrau pela profundidade t, 0 = beira do campo,
// 1 = fundo da arquibancada). Anel inferior até t 0,43; faixa de camarotes; anel superior
// até o topo (31 m). Aproximação a partir dos cortes do manual (Figs. 14 e 15).
const BOWL = { box: 14.5 };
const bowlHeight = (t: number) =>
  t <= 0.43 ? 1.5 + (9.5 * t) / 0.43 : t <= 0.52 ? 13.5 : 17 + (14 * (t - 0.52)) / 0.48;

// Áreas na linguagem do torcedor ("Onde você está?"): lado + inferior/superior.
// O primeiro algarismo do bloco do assento diz o nível (512 → nível 5).
const AREAS: (Omit<Area, 'levels' | 'defaultLevel' | 'blocks'> & { defaultLevel?: string })[] = [
  {
    id: 'norte-inferior',
    name: 'Norte Inferior',
    side: 'norte',
    tier: 'inferior',
    sectors: ['norte-inferior'],
  },
  {
    id: 'norte-superior',
    name: 'Norte Superior',
    side: 'norte',
    tier: 'superior',
    sectors: ['norte-superior-2', 'norte-superior-5'],
  },
  {
    id: 'sul-inferior',
    name: 'Sul Inferior',
    side: 'sul',
    tier: 'inferior',
    sectors: ['sul-inferior'],
    visitor: true,
  },
  {
    id: 'sul-superior',
    name: 'Sul Superior',
    side: 'sul',
    tier: 'superior',
    sectors: ['sul-superior-2', 'sul-superior-5'],
    visitor: true,
  },
  {
    id: 'leste-inferior',
    name: 'Leste Inferior',
    side: 'leste',
    tier: 'inferior',
    sectors: ['leste-inferior'],
  },
  {
    id: 'leste-superior',
    name: 'Leste Superior',
    side: 'leste',
    tier: 'superior',
    sectors: ['leste-superior'],
  },
  { id: 'leste-mais', name: 'Leste Mais', side: 'leste', tier: 'premium', sectors: ['leste-mais'] },
  {
    id: 'camarotes-leste',
    name: 'Camarotes Leste',
    side: 'leste',
    tier: 'camarote',
    sectors: ['camarotes-leste-2'],
  },
  {
    id: 'oeste-inferior',
    name: 'Oeste Inferior',
    side: 'oeste',
    tier: 'inferior',
    sectors: ['oeste-inferior'],
  },
  { id: 'maracana-mais', name: 'Maracanã Mais', side: 'oeste', tier: 'premium', sectors: ['maracana-mais'] },
  {
    id: 'camarotes-oeste',
    name: 'Camarotes e Tribuna (Oeste)',
    side: 'oeste',
    tier: 'camarote',
    sectors: ['camarotes-oeste-2', 'camarotes-oeste-3'],
  },
  {
    id: 'oeste-superior',
    name: 'Oeste Superior (Cativas)',
    side: 'oeste',
    tier: 'superior',
    sectors: ['cativas-oeste'],
  },
];
const AREA_OF: Record<string, string> = Object.fromEntries(
  AREAS.flatMap((a) => a.sectors.map((sid) => [sid, a.id]))
);

const sectorSource = (s: SectorSpec): { source: string[]; confidence: Confidence; note?: string } => {
  if (s.source) return { source: s.source, confidence: s.confidence ?? 'fonte_unica', note: s.note };
  const src = ['manual2019'];
  if (s.ticketName) src.push('ingressos2025', 'ingressos2023');
  return {
    source: src,
    confidence: s.ticketName ? 'confirmado' : 'fonte_unica',
    note: 'Lado, nível e blocos pelas Figs. 12 e 21 do manual; geometria aproximada a partir do contorno do OSM.',
  };
};

const stadiumFeatures: Feature[] = [];
const sectors: Sector[] = [];
const sectionLabels: Feature[] = [];

for (const s of SECTOR_SPECS) {
  const [a0, a1] = SIDE_SPAN[s.side];
  const blocks = s.blockRange ? range(s.blockRange[0], s.blockRange[1], s.skip).map(String) : [];
  const meta = sectorSource(s);
  sectors.push({
    id: s.id,
    name: s.name,
    ticketName: s.ticketName,
    side: s.side,
    level: s.level,
    kind: s.kind,
    blocks,
    gates: s.gates,
    ramps: s.ramps,
    visitor: s.visitor,
    ...meta,
  });
  // Degraus: a faixa vira anéis de ~6% da profundidade, com a altura dada pelo perfil
  // único da bacia (BOWL). Assim o anel inferior e o superior são contínuos em volta do
  // campo, como no Maracanã, em vez de cada setor ter a sua própria altura.
  const boxy = s.kind === 'camarote' || s.kind === 'tribuna';
  const STEPS = boxy ? 1 : Math.max(2, Math.round((s.t[1] - s.t[0]) / 0.06));
  for (let k = 0; k < STEPS; k++) {
    const t0 = s.t[0] + ((s.t[1] - s.t[0]) * k) / STEPS;
    const t1 = s.t[0] + ((s.t[1] - s.t[0]) * (k + 1)) / STEPS;
    const top = boxy ? BOWL.box : bowlHeight(t1);
    stadiumFeatures.push({
      type: 'Feature',
      properties: {
        kind: boxy ? 'box' : 'stand',
        sector: s.id,
        area: AREA_OF[s.id],
        level: s.level,
        side: s.side,
        step: k,
        base: round(FLOOR[s.level] === undefined ? 0 : Math.max(0, s.rake[0] - 3), 1),
        top: round(top, 1),
      },
      geometry: { type: 'Polygon', coordinates: [band(a1, a0, t0, t1)] },
    });
  }
  // Contorno do setor inteiro (destaque da área do usuário e alvo de toque).
  stadiumFeatures.push({
    type: 'Feature',
    properties: { kind: 'sector', sector: s.id, area: AREA_OF[s.id], level: s.level, side: s.side },
    geometry: { type: 'Polygon', coordinates: [band(a1, a0, s.t[0], s.t[1])] },
  });
  // Seções numeradas: divide o vão angular igualmente, em ordem anti-horária (φ decrescente).
  blocks.forEach((b, i) => {
    const p0 = a1 - ((a1 - a0) * i) / blocks.length;
    const p1 = a1 - ((a1 - a0) * (i + 1)) / blocks.length;
    stadiumFeatures.push({
      type: 'Feature',
      properties: { kind: 'section', ref: b, sector: s.id, area: AREA_OF[s.id], level: s.level },
      geometry: { type: 'Polygon', coordinates: [band(p1, p0, s.t[0], s.t[1])] },
    });
    const pm = (p0 + p1) / 2;
    sectionLabels.push({
      type: 'Feature',
      properties: { kind: 'section-label', ref: b, sector: s.id, area: AREA_OF[s.id], level: s.level },
      geometry: { type: 'Point', coordinates: polar(pm, atT(pm, (s.t[0] + s.t[1]) / 2)) },
    });
  });
}
for (const p of PREMIUM) {
  sectors.push({
    id: p.id,
    name: p.name,
    ticketName: p.name,
    side: p.side,
    level: '1',
    kind: 'premium',
    blocks: [],
    gates: p.gates,
    ramps: p.ramps,
    source: ['manual2019', 'nfl2026', 'ingressos2025'],
    confidence: 'confirmado',
    note: 'Lounge no nível 1 (manual, cap. 2); posição sobre os blocos centrais pela Fig. 21.',
  });
  stadiumFeatures.push({
    type: 'Feature',
    properties: {
      kind: 'box',
      sector: p.id,
      area: AREA_OF[p.id],
      level: '1',
      side: p.side,
      step: 0,
      base: 0,
      top: 12,
    },
    geometry: { type: 'Polygon', coordinates: [band(p.span[1], p.span[0], 0.3, 0.45)] },
  });
  stadiumFeatures.push({
    type: 'Feature',
    properties: { kind: 'sector', sector: p.id, area: AREA_OF[p.id], level: '1', side: p.side },
    geometry: { type: 'Polygon', coordinates: [band(p.span[1], p.span[0], 0.3, 0.45)] },
  });
}

// Gramado, entorno e linhas do campo (105 × 68 m — manual, Fig. 16; orientação do OSM)
const rect = (hu: number, hv: number, cu = 0, cv = 0): Ring => {
  const r: Ring = [
    fromUV(cu - hu, cv - hv),
    fromUV(cu + hu, cv - hv),
    fromUV(cu + hu, cv + hv),
    fromUV(cu - hu, cv + hv),
  ];
  r.push(r[0]);
  return r;
};
stadiumFeatures.push(
  {
    type: 'Feature',
    properties: { kind: 'field-surround' },
    geometry: { type: 'Polygon', coordinates: [fullRing(front)] },
  },
  {
    type: 'Feature',
    properties: { kind: 'pitch' },
    geometry: { type: 'Polygon', coordinates: [rect(52.5, 34)] },
  }
);
// Faixas de corte da grama (só visual): 12 faixas de 8,75 m ao longo do comprimento.
for (let i = 0; i < 12; i++)
  stadiumFeatures.push({
    type: 'Feature',
    properties: { kind: 'pitch-stripe', stripe: i % 2 },
    geometry: { type: 'Polygon', coordinates: [rect(4.375, 34, -52.5 + 4.375 + i * 8.75)] },
  });
const L = 52.5,
  W = 34;
const circle = (cu: number, cv: number, r: number, f0 = 0, f1 = 360): LngLat[] =>
  Array.from({ length: 129 }, (_, i) => {
    const f = ((f0 + ((f1 - f0) * i) / 128) * Math.PI) / 180;
    return fromUV(cu + r * Math.cos(f), cv + r * Math.sin(f));
  });
const lines: LngLat[][] = [rect(L, W), [fromUV(0, -W), fromUV(0, W)], circle(0, 0, 9.15)];
for (const sgn of [1, -1]) {
  const gl = sgn * L;
  // grande área 16,5 × 40,32; pequena área 5,5 × 18,32; pênalti a 11 m; arco de 9,15 m
  lines.push([
    fromUV(gl, -20.16),
    fromUV(gl - sgn * 16.5, -20.16),
    fromUV(gl - sgn * 16.5, 20.16),
    fromUV(gl, 20.16),
  ]);
  lines.push([
    fromUV(gl, -9.16),
    fromUV(gl - sgn * 5.5, -9.16),
    fromUV(gl - sgn * 5.5, 9.16),
    fromUV(gl, 9.16),
  ]);
  const spot = gl - sgn * 11;
  const ang = (Math.acos(5.5 / 9.15) * 180) / Math.PI; // arco só fora da grande área
  lines.push(sgn > 0 ? circle(spot, 0, 9.15, 180 - ang, 180 + ang) : circle(spot, 0, 9.15, -ang, ang));
  lines.push(circle(spot, 0, 0.25));
}
lines.push(circle(0, 0, 0.3));
stadiumFeatures.push({
  type: 'Feature',
  properties: { kind: 'pitch-lines' },
  geometry: { type: 'MultiLineString', coordinates: lines },
});

// Anel de circulação externo (corredores), fachada, cobertura e esplanada
const ringBetween = (inner: (p: number) => number, outer: (p: number) => number) => [
  fullRing(outer),
  fullRing(inner).reverse(),
];
stadiumFeatures.push(
  {
    type: 'Feature',
    properties: { kind: 'concourse', base: 0, top: 4 },
    geometry: { type: 'Polygon', coordinates: ringBetween(standOuter, facade) },
  },
  {
    type: 'Feature',
    properties: {
      kind: 'roof',
      base: 33,
      top: 35,
      note: 'Abertura pelo anel interno do OSM; cobre ~96% dos assentos (manual).',
    },
    geometry: {
      type: 'Polygon',
      coordinates: [fullRing((p) => facade(p) - 2), ...innerRings.map((r) => [...r].reverse())],
    },
  },
  {
    type: 'Feature',
    properties: { kind: 'esplanade' },
    geometry: { type: 'Polygon', coordinates: [fullRing((p) => facade(p) + 28)] },
  },
  {
    type: 'Feature',
    properties: { kind: 'outline', source: 'osm' },
    geometry: { type: 'Polygon', coordinates: outerRings },
  }
);

// Rampas: polígonos reais do OSM ("Acesso A - Oeste" … "Acesso F - Norte")
const RAMP_REL: Record<string, number> = {
  A: 5588896,
  B: 5588897,
  C: 5588898,
  D: 5588899,
  E: 5588900,
  F: 5588901,
};
const rampGeom: Record<string, Ring[]> = {};
for (const [letter, rid] of Object.entries(RAMP_REL)) {
  const rel = byId.get(`relation/${rid}`);
  const rings = joinWays(rel.members).filter((r) => r.length > 3);
  rampGeom[letter] = rings;
  stadiumFeatures.push({
    type: 'Feature',
    properties: { kind: 'ramp', ramp: `rampa-${letter.toLowerCase()}`, name: rel.tags.name, source: 'osm' },
    geometry: {
      type: 'Polygon',
      coordinates: rings.map((r) => (r[0][0] === r[r.length - 1][0] ? r : [...r, r[0]])),
    },
  });
}

// ─────────────────────────────────────────────── portões e rampas
const GATE_INFO: Record<
  string,
  { street: string; side: Side; nickname?: string; station: string; turnstiles: number }
> = {
  A: {
    street: 'Rua Prof. Manoel de Abreu',
    side: 'oeste',
    nickname: 'UERJ',
    station: 'maracana',
    turnstiles: 36,
  },
  B: { street: 'Rua Prof. Eurico Rabelo', side: 'sul', station: 'maracana', turnstiles: 17 },
  C: { street: 'Rua Prof. Eurico Rabelo', side: 'sul', station: 'maracana', turnstiles: 17 },
  D: {
    street: 'Avenida Maracanã',
    side: 'leste',
    nickname: 'Bellini',
    station: 'sao-cristovao',
    turnstiles: 38,
  },
  E: { street: 'Av. Rei Pelé (Radial Oeste)', side: 'norte', station: 'sao-cristovao', turnstiles: 17 },
  F: { street: 'Av. Rei Pelé (Radial Oeste)', side: 'norte', station: 'sao-cristovao', turnstiles: 17 },
};
const RAMP_LEVELS: Record<string, string[]> = {
  A: ['1', '2', '3', '5'],
  B: ['1', '2'],
  C: ['1', '2'],
  D: ['1', '2', '3', '5'],
  E: ['1', '2'],
  F: ['1', '2'],
};
const gates: Gate[] = [];
const ramps: Ramp[] = [];
const gateFeatures: Feature[] = [];
const gatePoint: Record<string, LngLat> = {};
const rampFoot: Record<string, { phi: number }> = {};
for (const letter of Object.keys(RAMP_REL)) {
  const pts = rampGeom[letter].flat();
  // Portão = ponta externa da rampa (onde ficam as catracas, na esplanada)
  const far = pts.reduce(
    (best, p) => {
      const [u, v] = toUV(p);
      const r = Math.hypot(u, v);
      return r > best.r ? { p, r, u, v } : best;
    },
    { p: pts[0], r: -1, u: 0, v: 0 }
  );
  const cu = pts.reduce((s, p) => s + toUV(p)[0], 0) / pts.length;
  const cv = pts.reduce((s, p) => s + toUV(p)[1], 0) / pts.length;
  const phi = phiOf(cu, cv);
  rampFoot[letter] = { phi };
  gatePoint[letter] = far.p;
  const info = GATE_INFO[letter];
  const id = letter;
  gates.push({
    id,
    name: `Portão ${letter}`,
    nickname: info.nickname,
    street: info.street,
    side: info.side,
    ramp: `rampa-${letter.toLowerCase()}`,
    station: info.station,
    turnstiles: info.turnstiles,
    source: ['manual2019', 'lance2024', 'osm'],
    confidence: 'confirmado',
    note: 'Letra igual à da rampa (manual, Figs. 8 e 21; OSM "Acesso X"). Ponto na ponta externa da rampa do OSM.',
  });
  ramps.push({
    id: `rampa-${letter.toLowerCase()}`,
    name: `Rampa ${letter}`,
    gate: id,
    monumental: letter === 'A' || letter === 'D',
    levels: RAMP_LEVELS[letter],
    source: ['manual2019', 'osm'],
    confidence: 'confirmado',
    note: letter === 'D' ? 'Também leva ao nível 5 Norte e Sul (manual, Fig. 21).' : undefined,
  });
  gateFeatures.push(
    {
      type: 'Feature',
      properties: {
        kind: 'gate',
        id,
        name: `Portão ${letter}`,
        nickname: info.nickname ?? null,
        side: info.side,
      },
      geometry: { type: 'Point', coordinates: far.p },
    },
    {
      type: 'Feature',
      properties: { kind: 'ramp', id: `rampa-${letter.toLowerCase()}`, name: `Rampa ${letter}`, gate: id },
      geometry: { type: 'Point', coordinates: [round(c0[0] + 0, 7), 0] },
    }
  );
  // ponto do rótulo da rampa: meio do caminho entre fachada e portão
  const mid = polar(phi, (facade(phi) + far.r) / 2);
  gateFeatures[gateFeatures.length - 1].geometry.coordinates = mid;
}

// ─────────────────────────────────────────────── pontos de interesse
const pois: (Poi & { lng: number; lat: number })[] = [];
const sideOf = (phi: number): Side =>
  (Object.entries(SIDE_SPAN).find(([, [a, b]]) => {
    const p = (phi - a + 360) % 360;
    return p <= b - a;
  })?.[0] ?? 'norte') as Side;
const sectorAt = (level: string, phi: number) => {
  const side = sideOf(phi);
  return (
    sectors.find((s) => s.level === level && s.side === side && s.kind !== 'premium')?.id ??
    sectors.find((s) => s.side === side)?.id
  );
};
let seq = 0;
function addPoi(
  p: Omit<Poi, 'id'> & { phi: number; t?: number; r?: number; ring?: string; dr?: number; id?: string }
) {
  const r = p.r ?? (p.ring ? ringR(p.ring, p.phi) + (p.dr ?? 0) : atT(p.phi, p.t ?? 0.5));
  const [lng, lat] = polar(p.phi, r);
  const { phi, t, r: _r, ring: _ring, dr: _dr, ...rest } = p;
  pois.push({
    id: p.id ?? `${p.category}-${++seq}`,
    ...rest,
    sector: rest.sector ?? (rest.level ? sectorAt(rest.level, phi) : undefined),
    lng,
    lat,
  });
}

// Anel de circulação de cada nível (fração t), calibrado pela mediana das concessões do manual.
const conc = JSON.parse(fs.readFileSync(path.join(SRC, 'concessoes-manual-2019.json'), 'utf8')).items as {
  level: number;
  u: number;
  v: number;
}[];
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
/** Recuo (m) do corredor de cada nível em relação à fachada, pela mediana das concessões. */
const offOf = (lv: number) =>
  median(conc.filter((c) => c.level === lv).map((c) => facade(phiOf(c.u, c.v)) - Math.hypot(c.u, c.v)));
const RING_OFF: Record<string, number> = { '1': offOf(1), '2': offOf(2), '3': offOf(3), '5': offOf(4) };
const ringR = (level: string, phi: number) => facade(phi) - RING_OFF[level];

// Alimentação: posições das Figs. 68–71 (o "nível 4" do manual atende as cativas do nível 5, Oeste).
conc.forEach((c, i) => {
  const level = c.level === 4 ? '5' : String(c.level);
  const phi = phiOf(c.u, c.v);
  const isTribuna = level === '3' && sideOf(phi) === 'oeste';
  addPoi({
    id: `alimentacao-m${i + 1}`,
    category: isTribuna ? 'bebidas' : 'alimentacao',
    name: isTribuna ? 'Bar da Tribuna' : 'Lanchonete',
    level,
    phi,
    r: Math.hypot(c.u, c.v),
    source: ['manual2019'],
    confidence: 'fonte_unica',
    note: `Concessão ${i + 1} das Figs. 68–71 do manual (nível ${c.level} na planta).`,
  });
});
// Nível 5 Norte e Sul: o manual não traz planta; distribuídas no anel superior.
for (const side of ['norte', 'sul'] as const) {
  const [a0, a1] = SIDE_SPAN[side];
  for (let k = 0; k < 4; k++)
    addPoi({
      category: 'alimentacao',
      name: 'Lanchonete',
      level: '5',
      phi: a0 + ((a1 - a0) * (k + 0.5)) / 4,
      ring: '5',
      source: ['manual2019', 'escopo2019'],
      confidence: 'estimado',
      note: 'Sem planta pública do nível 5; distribuída pelo anel superior (74 concessões no manual, 60 no Guia de Escopo).',
    });
}

// Banheiros: 292 no total (Guia de Escopo), sem mapa público. Cada ícone representa um bloco de banheiros,
// posicionado entre concessões no anel de cada nível. Acessíveis fixos no Leste e Oeste (NFL).
const RESTROOM_BLOCKS: Record<string, number[]> = {
  '1': range(0, 15).map((k) => k * 24 + 12),
  '2': range(0, 13).map((k) => k * 26 + 13),
  '3': [62, 76, 90, 104, 118, 245, 295],
  '5': [-40, -20, 0, 20, 40, 140, 160, 180, 200, 220, 250, 290],
};
for (const [level, phis] of Object.entries(RESTROOM_BLOCKS))
  for (const phi0 of phis) {
    const phi = (phi0 + 360) % 360;
    addPoi({
      category: 'banheiro',
      name: 'Banheiros',
      level,
      phi,
      ring: level,
      source: ['escopo2019'],
      confidence: 'estimado',
      note: 'Total de 292 banheiros (Guia de Escopo); posição distribuída pelo anel de circulação.',
    });
  }
for (const [level, phis] of Object.entries({
  '1': [80, 100, 260, 280],
  '2': [90, 270],
  '3': [90, 270],
  '5': [270],
}))
  for (const phi of phis)
    addPoi({
      category: 'banheiro_acessivel',
      name: 'Banheiro acessível',
      level,
      phi,
      ring: level,
      source: ['nfl2026', 'escopo2019'],
      confidence: 'estimado',
      note: 'Banheiros acessíveis fixos nos lados Leste e Oeste (guia NFL); posição exata estimada.',
    });

// Elevadores (Fig. 10): eixo do pilar → ângulo. Suposição: 60 eixos igualmente espaçados,
// P00 no eixo Oeste e numeração anti-horária (como a sinalização, Fig. 8).
const pillarPhi = (p: number) => (((270 - 6 * p) % 360) + 360) % 360;
// Pilares da fachada (só visual): os 60 eixos estruturais P00–P59 da Fig. 10, que dão ao
// Maracanã a sua colunata externa, e a viga de coroamento que os liga no alto (onde apoia
// a cobertura, que o mapa não desenha para não esconder as arquibancadas). Seção ~2,4 × 3 m.
for (let p = 0; p < 60; p++) {
  const phi = pillarPhi(p);
  const r = facade(phi) - 1.5;
  const dphi = (1.2 / r) * (180 / Math.PI);
  const ring: Ring = [
    polar(phi - dphi, r - 1.5),
    polar(phi + dphi, r - 1.5),
    polar(phi + dphi, r + 1.5),
    polar(phi - dphi, r + 1.5),
  ];
  ring.push(ring[0]);
  stadiumFeatures.push({
    type: 'Feature',
    properties: { kind: 'pillar', ref: `P${String(p).padStart(2, '0')}`, base: 0, top: 31 },
    geometry: { type: 'Polygon', coordinates: [ring] },
  });
}
stadiumFeatures.push({
  type: 'Feature',
  properties: { kind: 'ring-beam', base: 28.5, top: 31 },
  geometry: {
    type: 'Polygon',
    coordinates: [fullRing((p) => facade(p) + 0.2), fullRing((p) => facade(p) - 3.2).reverse()],
  },
});
const ELEVATORS: { id: string; pillar: number; levels: string[] }[] = [
  { id: 'E1', pillar: 3, levels: ['0', '1', '2', '3', '4'] },
  { id: 'E2', pillar: 3, levels: ['0', '1', '2', '3', '4'] },
  { id: 'E3', pillar: 57, levels: ['0', '1', '2', '3', '4'] },
  { id: 'E4', pillar: 57, levels: ['0', '1', '2', '3', '4'] },
  { id: 'E5', pillar: 1, levels: ['0', '1', '2', '3', '4', '5'] },
  { id: 'E6', pillar: 1, levels: ['0', '1', '2', '3', '4', '5'] },
  { id: 'E7', pillar: 59, levels: ['0', '1', '2', '3', '4', '5'] },
  { id: 'E8', pillar: 59, levels: ['0', '1', '2', '3', '4', '5'] },
  { id: 'E9', pillar: 27, levels: ['0', '1', '2'] },
  { id: 'E10', pillar: 27, levels: ['0', '1', '2'] },
  { id: 'E11', pillar: 34, levels: ['0', '1', '2'] },
  { id: 'E12', pillar: 34, levels: ['0', '1', '2'] },
  { id: 'E15', pillar: 60, levels: ['0', '1'] },
  { id: 'E16', pillar: 15, levels: ['0', '3', '4', '5'] },
  { id: 'E17', pillar: 15, levels: ['0', '3', '4', '5'] },
];
const pub = (lv: string[]) => lv.filter((l) => LEVELS.find((x) => x.id === l)?.public);
ELEVATORS.forEach((e, i) => {
  const pl = pub(e.levels);
  const phi = pillarPhi(e.pillar) + (i % 2 ? 1.2 : -1.2);
  for (const level of pl)
    addPoi({
      id: `elevador-${e.id.toLowerCase()}-${level}`,
      category: 'elevador',
      name: `Elevador ${e.id}`,
      level,
      levels: pl,
      phi,
      ring: level,
      source: ['manual2019', 'nfl2026'],
      confidence: 'estimado',
      note: `Pilar P${String(e.pillar).padStart(2, '0')} (Fig. 10). Ângulo pelo eixo do pilar, supondo 60 eixos iguais a partir do Oeste.${e.pillar === 15 ? ' Lado Sul depende do sentido da numeração dos pilares (não confirmado).' : ''}`,
    });
});
// Escadas rolantes (Fig. 11)
const ESCALATORS: { id: string; pillar: number; levels: string[] }[] = [
  { id: 'ESC1', pillar: 55, levels: ['2', '3'] },
  { id: 'ESC2', pillar: 55, levels: ['2', '3'] },
  { id: 'ESC3', pillar: 5, levels: ['2', '3'] },
  { id: 'ESC4', pillar: 5, levels: ['2', '3'] },
  { id: 'ESC5', pillar: 0, levels: ['0', '1'] },
  { id: 'ESC6', pillar: 0, levels: ['0', '1'] },
  { id: 'ESC7', pillar: 15, levels: ['0', '5'] },
  { id: 'ESC8', pillar: 15, levels: ['0', '5'] },
];
ESCALATORS.forEach((e, i) => {
  const pl = pub(e.levels);
  for (const level of pl)
    addPoi({
      id: `escada-rolante-${e.id.toLowerCase()}-${level}`,
      category: 'escada_rolante',
      name: `Escada rolante ${e.id.replace('ESC', '')}`,
      level,
      levels: pl,
      phi: pillarPhi(e.pillar) + (i % 2 ? 2.5 : 0.5),
      ring: level,
      dr: -3,
      source: ['manual2019'],
      confidence: 'estimado',
      note: `Pilar P${String(e.pillar).padStart(2, '0')} (Fig. 11). Ângulo estimado pelo eixo do pilar.`,
    });
});
// Escadas: núcleos entre os níveis 1 e 2 nas quinas (sem planta pública).
const STAIRS = [25, 65, 115, 155, 205, 245, 295, 335];
STAIRS.forEach((phi, i) => {
  for (const level of ['1', '2'])
    addPoi({
      id: `escada-${i + 1}-${level}`,
      category: 'escada',
      name: 'Escadas',
      level,
      levels: ['1', '2'],
      phi,
      ring: level,
      dr: -5,
      source: ['manual2019'],
      confidence: 'estimado',
      note: 'Núcleo de escadas estimado nas quinas do anel de circulação.',
    });
});
// Saúde: centro médico no térreo, ambulatório no nível 1; postos em todos os níveis ("08", Guia de Escopo).
const MEDICAL: [string, number][] = [
  ['1', 270],
  ['1', 90],
  ['2', 0],
  ['2', 180],
  ['3', 90],
  ['5', 0],
  ['5', 180],
  ['5', 270],
];
MEDICAL.forEach(([level, phi], i) =>
  addPoi({
    id: `posto-medico-${i + 1}`,
    category: 'posto_medico',
    name: level === '1' && phi === 270 ? 'Ambulatório' : 'Posto médico',
    level,
    phi: phi + 6,
    ring: level,
    source: ['manual2019', 'escopo2019'],
    confidence: 'estimado',
    note: 'Guia de Escopo: 8 postos médicos (médico, enfermeiro e técnico de enfermagem, com ambulância tipo D) e 9 ambulâncias; casos graves vão a hospital de referência. Ambulatório no nível 1 (manual). Posição estimada.',
  })
);
// Atendimento ao torcedor (NFL): Leste e Oeste; resolução de ingressos no nível 1 junto à rampa D / Leste Mais.
addPoi({
  category: 'informacao',
  name: 'Atendimento ao torcedor',
  level: '1',
  phi: 262,
  ring: '1',
  source: ['nfl2026'],
  confidence: 'estimado',
  note: 'Postos de atendimento nos lados Leste e Oeste (guia NFL).',
});
addPoi({
  category: 'informacao',
  name: 'Atendimento ao torcedor',
  level: '1',
  phi: 98,
  ring: '1',
  source: ['nfl2026'],
  confidence: 'estimado',
  note: 'Postos de atendimento nos lados Leste e Oeste (guia NFL).',
});
addPoi({
  category: 'bilheteria',
  name: 'Resolução de ingressos',
  level: '1',
  phi: 86,
  ring: '1',
  dr: -6,
  source: ['nfl2026'],
  confidence: 'fonte_unica',
  note: 'Nível 1, junto à rampa do Portão D e ao Leste Mais (guia NFL).',
});
// Salas sensoriais: nível 5, perto das seções 501 e 511 (NFL).
const secLabel = (ref: string) =>
  sectionLabels.find((f) => f.properties.ref === ref)!.geometry.coordinates as LngLat;
for (const ref of ['501', '511']) {
  const [u, v] = toUV(secLabel(ref));
  addPoi({
    category: 'sala_sensorial',
    name: 'Sala sensorial',
    level: '5',
    phi: phiOf(u, v),
    ring: '5',
    source: ['nfl2026'],
    confidence: 'fonte_unica',
    note: `Nível 5, perto da seção ${ref} (guia NFL).`,
  });
}
// Área externa (esplanada): loja, saídas, estacionamentos.
addPoi({
  category: 'loja',
  name: 'Loja (quiosque)',
  level: null,
  phi: rampFoot.A.phi + 8,
  r: facade(rampFoot.A.phi + 8) + 12,
  source: ['manual2019'],
  confidence: 'estimado',
  note: 'O manual prevê lojas e quiosques temporários em áreas de grande movimento; a Praça de Acesso sob a Rampa A é o principal acesso VIP. Sem loja fixa confirmada.',
});
addPoi({
  category: 'loja',
  name: 'Loja (quiosque)',
  level: null,
  phi: rampFoot.D.phi - 8,
  r: facade(rampFoot.D.phi - 8) + 12,
  source: ['manual2019'],
  confidence: 'estimado',
  note: 'Quiosque temporário em área de grande movimento (manual). Sem loja fixa confirmada.',
});
for (const letter of Object.keys(RAMP_REL)) {
  const phi = rampFoot[letter].phi;
  addPoi({
    id: `saida-${letter.toLowerCase()}`,
    category: 'saida_emergencia',
    name: `Saída ${letter}`,
    level: '1',
    phi: phi + 4,
    t: 1.0,
    source: ['manual2019'],
    confidence: 'estimado',
    note: `Saída pelo acesso da Rampa ${letter}.`,
  });
}
const osmNode = (ref: string, tag = 'parking_entrance') =>
  osm.find((e) => e.type === 'node' && e.tags?.amenity === tag && e.tags?.ref === ref);
const pushAt = (p: Omit<Poi, 'id'> & { id: string }, ll: LngLat) =>
  pois.push({ ...p, lng: ll[0], lat: ll[1] });
for (const [ref, name, note] of [
  [
    '9',
    'Estacionamento coberto (Portão 9)',
    '356 vagas para camarotes e lounges (manual, tabela de estacionamento).',
  ],
  [
    '2',
    'Estacionamento VIP (Portões 1 e 2)',
    '117 vagas para Tribuna, Maracanã Mais e Camarote Oeste (manual).',
  ],
  [
    '4',
    'Estacionamento acessível (P4 · Júlio Delamare)',
    'Vagas para credencial PcD/60+ (guia NFL). Entrada pelo OSM, ref. 4.',
  ],
  [
    '11',
    'Estacionamento acessível (P11 · Atletismo)',
    'Vagas para credencial PcD/60+ (guia NFL). Entrada pelo OSM, ref. 11.',
  ],
] as const) {
  const n = osmNode(ref);
  if (n)
    pushAt(
      {
        id: `estacionamento-${ref}`,
        category: 'estacionamento',
        name,
        level: null,
        source: ref === '4' || ref === '11' ? ['nfl2026', 'osm'] : ['manual2019', 'osm'],
        confidence: 'fonte_unica',
        note,
      },
      [n.lon, n.lat]
    );
}

// Segurança, Juizado do Torcedor e acolhimento à mulher.
// JECrim: "Nível Térreo, Setor Norte, próximo ao Acesso E" (Guia de Escopo); posto do Juizado no estádio (CNN, Agência Brasil).
addPoi({
  id: 'juizado-torcedor',
  category: 'juizado',
  name: 'Juizado do Torcedor',
  level: null,
  phi: rampFoot.E.phi - 6,
  r: facade(rampFoot.E.phi - 6) - 4,
  source: ['escopo2019', 'cnn2023', 'agbrasil2025'],
  confidence: 'fonte_unica',
  note: 'JECrim no térreo, Setor Norte, perto do Acesso E (Guia de Escopo). Existência do posto confirmada por notícias de 2023 e 2025; posição só pelo Guia.',
});
// Acolhimento à mulher: exigido pela Lei estadual 10.773/25; local no Maracanã ainda não divulgado.
addPoi({
  id: 'acolhimento-mulher',
  category: 'acolhimento',
  name: 'Acolhimento à mulher',
  level: null,
  phi: rampFoot.E.phi + 6,
  r: facade(rampFoot.E.phi + 6) - 4,
  source: ['alerj2026'],
  confidence: 'estimado',
  note: 'Posto de atendimento a vítimas de violência de gênero exigido pela Lei 10.773/25. Local não divulgado; estimado junto ao Juizado e ao policiamento, para registrar a ocorrência sem sair do estádio.',
});
// Policiamento: Batalhão Especial de Policiamento em Estádios, acionado pela segurança do estádio.
for (const letter of ['A', 'D']) {
  const phi = rampFoot[letter].phi + 10;
  addPoi({
    id: `seguranca-${letter.toLowerCase()}`,
    category: 'seguranca',
    name: 'Posto policial',
    level: null,
    phi,
    r: facade(phi) + 10,
    source: ['manual2019', 'agbrasil2025'],
    confidence: 'estimado',
    note: 'Policiamento pelo Batalhão Especial de Policiamento em Estádios (Agência Brasil 2025; GEPE no manual). Posição do posto estimada junto às rampas monumentais.',
  });
}
// Segurança do estádio: ponto de contato com stewards, um por lado no nível 1.
for (const phi of [0, 90, 180, 270])
  addPoi({
    id: `seguranca-n1-${phi}`,
    category: 'seguranca',
    name: 'Segurança do estádio',
    level: '1',
    phi: phi + 12,
    ring: '1',
    source: ['escopo2019', 'mprj2025'],
    confidence: 'estimado',
    note: 'Seguranças e stewards em todos os setores (Guia de Escopo); o MPRJ orienta acionar a segurança do estádio em caso de racismo. Ponto de contato estimado.',
  });

// ─────────────────────────────────────────────── grafo de caminhos
type GNode = { id: string; level: string | null; ll: LngLat; ref?: string; z: number };
const nodes: GNode[] = [];
const graph: WalkwayEdge[] = [];
const nodeIdx = new Map<string, GNode>();
const addNode = (n: GNode) =>
  nodeIdx.has(n.id) ? nodeIdx.get(n.id)! : (nodes.push(n), nodeIdx.set(n.id, n), n);
const dist = (a: LngLat, b: LngLat) => {
  const [x1, y1] = toXY(a),
    [x2, y2] = toXY(b);
  return Math.hypot(x2 - x1, y2 - y1);
};
let eseq = 0;
const link = (a: GNode, b: GNode, type: WalkwayType, accessible: boolean, extra = 0) =>
  graph.push({
    id: `w${++eseq}`,
    from: a.id,
    to: b.id,
    type,
    accessible,
    length: Math.max(1, round(dist(a.ll, b.ll) + Math.abs(a.z - b.z) + extra, 1)),
  });

// Anéis: nível 1, 2 e 5 completos; nível 3 só nos arcos Leste e Oeste (público).
const RING_STEP = 7.5;
const RING_ARCS: Record<string, [number, number][]> = {
  '1': [[0, 360]],
  '2': [[0, 360]],
  '3': [
    [45, 135],
    [225, 315],
  ],
  '5': [[0, 360]],
};
const ringNodes: Record<string, GNode[]> = {};
for (const [level, arcs] of Object.entries(RING_ARCS)) {
  ringNodes[level] = [];
  for (const [a0, a1] of arcs) {
    const full = a1 - a0 === 360;
    const n = Math.round((a1 - a0) / RING_STEP);
    let prev: GNode | undefined, first: GNode | undefined;
    for (let k = 0; k < (full ? n : n + 1); k++) {
      const phi = a0 + k * RING_STEP;
      const node = addNode({
        id: `n${level}-${phi.toFixed(1)}`,
        level,
        ll: polar(phi, ringR(level, phi)),
        z: FLOOR[level],
      });
      ringNodes[level].push(node);
      if (prev) link(prev, node, 'corredor', true);
      prev = node;
      first ??= node;
    }
    if (full && prev && first) link(prev, first, 'corredor', true);
  }
}
const nearestRing = (level: string, ll: LngLat) =>
  ringNodes[level].reduce((b, n) => (dist(n.ll, ll) < dist(b.ll, ll) ? n : b));

// Setores: um nó no meio da faixa, ligado ao corredor (vomitório).
for (const s of SECTOR_SPECS) {
  const [a0, a1] = SIDE_SPAN[s.side];
  const phi = (a0 + a1) / 2;
  const n = addNode({
    id: `s-${s.id}`,
    level: s.level,
    ref: s.id,
    ll: polar(phi, atT(phi, (s.t[0] + s.t[1]) / 2)),
    z: FLOOR[s.level],
  });
  // liga a três pontos do corredor ao longo do setor (vomitórios)
  for (const f of [0.2, 0.5, 0.8]) {
    const p = a0 + (a1 - a0) * f;
    link(n, nearestRing(s.level, polar(p, ringR(s.level, p))), 'corredor', true);
  }
}
for (const p of PREMIUM) {
  const phi = (p.span[0] + p.span[1]) / 2;
  const n = addNode({
    id: `s-${p.id}`,
    level: '1',
    ref: p.id,
    ll: polar(phi, atT(phi, 0.38)),
    z: FLOOR['1'],
  });
  link(n, nearestRing('1', n.ll), 'corredor', true);
}

// Portões → rampas → níveis
for (const letter of Object.keys(RAMP_REL)) {
  const g = addNode({ id: `g-${letter}`, level: null, ref: letter, ll: gatePoint[letter], z: 0 });
  const phi = rampFoot[letter].phi;
  const foot = addNode({
    id: `r-${letter}`,
    level: null,
    ref: `rampa-${letter.toLowerCase()}`,
    ll: polar(phi, facade(phi) + 2),
    z: 0,
  });
  link(g, foot, 'externo', true);
  for (const level of RAMP_LEVELS[letter]) {
    if (!ringNodes[level]) continue;
    // Rampa A: níveis 3 e 5 só por elevador/escada rolante (VIP, camarotes e cativas).
    // Rampa D: chega ao anel do nível 5, que dá a volta e atende Norte e Sul (manual, Fig. 21).
    const targets = letter === 'A' && (level === '3' || level === '5') ? [] : [phi];
    for (const t of targets)
      link(foot, nearestRing(level, polar(t, ringR(level, t))), 'rampa', true, FLOOR[level] * 8);
  }
}
// Elevadores, escadas rolantes e escadas: ligam os nós do anel entre os níveis
const verticals = pois.filter((p) => p.levels && p.levels.length > 1);
const groups = new Map<string, typeof verticals>();
for (const p of verticals) {
  const key = p.name;
  groups.set(key, [...(groups.get(key) ?? []), p]);
}
for (const [, group] of groups) {
  const byLevel = group.sort((a, b) => FLOOR[a.level!] - FLOOR[b.level!]);
  const vnodes = byLevel.map((p) => {
    const n = addNode({ id: `p-${p.id}`, level: p.level, ref: p.id, ll: [p.lng, p.lat], z: FLOOR[p.level!] });
    link(n, nearestRing(p.level!, n.ll), 'corredor', true);
    return n;
  });
  const type: WalkwayType =
    byLevel[0].category === 'elevador'
      ? 'elevador'
      : byLevel[0].category === 'escada_rolante'
        ? 'escada_rolante'
        : 'escada';
  for (let i = 1; i < vnodes.length; i++)
    link(vnodes[i - 1], vnodes[i], type, type === 'elevador', type === 'elevador' ? 15 : 0);
}
// Demais pontos (nível definido): ligados ao corredor mais próximo
for (const p of pois)
  if (p.level && !(p.levels && p.levels.length > 1)) {
    const n = addNode({ id: `p-${p.id}`, level: p.level, ref: p.id, ll: [p.lng, p.lat], z: FLOOR[p.level] });
    link(n, nearestRing(p.level, n.ll), 'corredor', true);
  }
// Esplanada: anel externo em volta da fachada, ligado ao pé de cada rampa
const esplanade: GNode[] = [];
for (let k = 0; k < 48; k++) {
  const phi = k * 7.5;
  const n = addNode({ id: `x-${phi.toFixed(1)}`, level: null, ll: polar(phi, facade(phi) + 12), z: 0 });
  if (esplanade.length) link(esplanade[esplanade.length - 1], n, 'externo', true);
  esplanade.push(n);
}
link(esplanade[esplanade.length - 1], esplanade[0], 'externo', true);
const nearestEsplanade = (ll: LngLat) =>
  esplanade.reduce((b, n) => (dist(n.ll, ll) < dist(b.ll, ll) ? n : b));
for (const letter of Object.keys(RAMP_REL)) {
  const foot = nodeIdx.get(`r-${letter}`)!;
  link(foot, nearestEsplanade(foot.ll), 'externo', true);
}
// Pontos externos: ligados ao anel da esplanada
for (const p of pois)
  if (!p.level) {
    const n = addNode({ id: `p-${p.id}`, level: null, ref: p.id, ll: [p.lng, p.lat], z: 0 });
    link(n, nearestEsplanade(n.ll), 'externo', true);
  }

// ─────────────────────────────────────────────── venue e transporte
const stationNode = (name: string) =>
  osm.find((e) => e.type === 'node' && e.tags?.railway === 'station' && e.tags?.name === name);
const mar = stationNode('Maracanã')!,
  sc = stationNode('São Cristóvão')!;
const M = 600;
const corners = [fromXY(-M, -M), fromXY(M, M)];
const venue: Venue = {
  id: 'maracana',
  name: 'Maracanã',
  officialName: 'Estádio Jornalista Mário Filho',
  city: 'Rio de Janeiro',
  center: [round(c0[0]), round(c0[1])],
  pitchBearing: round(BEARING, 1),
  bounds: [corners[0][0], corners[0][1], corners[1][0], corners[1][1]],
  attribution: [
    '© OpenStreetMap contributors',
    'Manual da Instalação do Complexo do Maracanã (Gov. RJ, 2019)',
  ],
  transit: [
    {
      id: 'maracana',
      name: 'Estação Maracanã',
      lines: ['Metrô Linha 2', 'Trem SuperVia'],
      lng: mar.lon,
      lat: mar.lat,
      source: ['osm', 'lance2024'],
    },
    {
      id: 'sao-cristovao',
      name: 'Estação São Cristóvão',
      lines: ['Metrô Linha 2'],
      lng: sc.lon,
      lat: sc.lat,
      source: ['osm', 'lance2024'],
    },
  ],
  help: [
    {
      id: 'seguranca',
      name: 'Segurança do estádio',
      description: 'Racismo, assédio ou briga: chame o segurança mais perto ou vá ao posto policial.',
      poi: 'seguranca-a',
      source: ['mprj2025', 'agbrasil2025'],
    },
    {
      id: 'juizado',
      name: 'Juizado do Torcedor',
      description: 'Registro de ocorrência e audiência sem sair do estádio.',
      poi: 'juizado-torcedor',
      source: ['escopo2019', 'cnn2023'],
    },
    {
      id: 'acolhimento',
      name: 'Acolhimento à mulher',
      description: 'Atendimento a vítimas de assédio e importunação sexual no estádio.',
      poi: 'acolhimento-mulher',
      source: ['alerj2026'],
    },
    {
      id: 'mprj',
      name: 'Ouvidoria do MPRJ',
      description: 'Denúncia de racismo e discriminação, com fotos e vídeos.',
      phone: '127',
      source: ['mprj2025'],
    },
    {
      id: 'pm',
      name: 'Polícia Militar',
      description: 'Emergência policial.',
      phone: '190',
      source: ['gov-canais'],
    },
    {
      id: 'ligue180',
      name: 'Ligue 180',
      description: 'Central de Atendimento à Mulher, 24 h.',
      phone: '180',
      url: 'https://www.gov.br/mulheres/pt-br/ligue180',
      source: ['gov-canais'],
    },
    {
      id: 'disque100',
      name: 'Disque 100',
      description: 'Direitos humanos: racismo e outras discriminações.',
      phone: '100',
      source: ['gov-canais'],
    },
  ],
  defaultLevel: '1',
};

// ─────────────────────────────────────────────── escrita
const write = (name: string, data: unknown) => {
  fs.writeFileSync(
    path.join(OUT, name),
    JSON.stringify(data, null, name.endsWith('.geojson') ? 0 : 2) + '\n'
  );
};
fs.mkdirSync(OUT, { recursive: true });
write('venue.json', venue);
const areas: Area[] = AREAS.map((a) => {
  const secs = a.sectors.map((id) => sectors.find((x) => x.id === id)!);
  const levels = [...new Set(secs.map((x) => x.level))].sort();
  return {
    ...a,
    levels,
    defaultLevel: a.defaultLevel ?? levels[0],
    blocks: Object.fromEntries(
      levels.map((l) => [l, secs.filter((x) => x.level === l).flatMap((x) => x.blocks)])
    ),
  };
});
write('levels.json', {
  levels: LEVELS,
  areas,
  sectors,
  ramps,
  ringOffset: Object.fromEntries(Object.entries(RING_OFF).map(([k, v]) => [k, round(v, 1)])),
});
write('sources.json', SOURCES);
write('stadium.geojson', fc([...stadiumFeatures, ...sectionLabels]));
write(
  'gates.geojson',
  fc(
    gateFeatures.map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        ...(f.properties.kind === 'gate'
          ? gates.find((g) => g.id === f.properties.id)
          : ramps.find((r) => r.id === f.properties.id)),
      },
    }))
  )
);
write(
  'pois.geojson',
  fc(
    pois.map(({ lng, lat, ...p }) => ({
      type: 'Feature',
      properties: { ...p, levels: p.levels ?? null, sector: p.sector ?? null, note: p.note ?? null },
      geometry: { type: 'Point', coordinates: [lng, lat] },
    }))
  )
);
write(
  'walkways.geojson',
  fc([
    ...nodes.map((n) => ({
      type: 'Feature' as const,
      properties: { kind: 'node', id: n.id, level: n.level, ref: n.ref ?? null, z: n.z },
      geometry: { type: 'Point', coordinates: n.ll },
    })),
    ...graph.map((e) => ({
      type: 'Feature' as const,
      properties: { kind: 'edge', ...e },
      geometry: { type: 'LineString', coordinates: [nodeIdx.get(e.from)!.ll, nodeIdx.get(e.to)!.ll] },
    })),
  ])
);
const count = (k: PoiCategory) => pois.filter((p) => p.category === k).length;
console.log(
  `ok · eixo ${BEARING.toFixed(1)}° · ${sectors.length} setores · ${gates.length} portões · ${pois.length} pontos ` +
    `(alimentação ${count('alimentacao')}, banheiros ${count('banheiro')}, elevadores ${count('elevador')}) · ` +
    `grafo ${nodes.length} nós / ${graph.length} arestas · recuo dos corredores ${JSON.stringify(Object.fromEntries(Object.entries(RING_OFF).map(([k, v]) => [k, Math.round(v)])))} m`
);
