/**
 * Lê na Wikipédia em português (API pública, licença CC BY-SA) o que os artigos dizem de
 * cada candidato: posição, nacionalidade, passagens pelo Flamengo com jogos e gols e os
 * títulos listados pelo clube. Saída para revisão: tools/cria/.cache/wikipedia.json.
 *
 *   npx tsx tools/cria/wikipedia.ts            (usa o cache)
 *   npx tsx tools/cria/wikipedia.ts --refresh  (busca de novo)
 *
 * Não é a base do jogo: a base (src/data/cria/players.ts) é escrita à mão a partir desta
 * saída e da imprensa, com fonte e grau de confiança por atributo.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { CANDIDATES, type Candidate } from './candidates';

const CACHE = join(__dirname, '.cache');
const UA = 'FlamengoApp-QuemEoCria/0.1 (pesquisa de dados; github.com/rafasemenovitch)';
const refresh = process.argv.includes('--refresh');

interface Spell {
  years: string;
  loan: boolean;
  matches: number | null;
  goals: number | null;
}

export interface WikiPlayer {
  id: string;
  name: string;
  article: string | null;
  revision: number | null;
  url: string | null;
  fullName: string | null;
  position: string | null;
  nationality: string[];
  birthPlace: string | null;
  flamengo: Spell[];
  totalMatches: number | null;
  totalGoals: number | null;
  firstYear: number | null;
  titles: string[];
  updated: string | null;
  problems: string[];
}

async function fetchWikitext(title: string, lang = 'pt') {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=parse&prop=wikitext|revid&format=json&formatversion=2&redirects=1&page=` +
    encodeURIComponent(title);
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const text = await res.text();
    if (res.ok && text.startsWith('{')) {
      const json = JSON.parse(text) as { parse?: { title: string; revid: number; wikitext: string } };
      return json.parse ?? null;
    }
    // limite de ritmo da Wikipédia: espera e tenta de novo
    await sleep(5000 * (attempt + 1));
  }
  throw new Error('Wikipédia recusou a leitura (limite de ritmo)');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Tira links, predefinições simples e comentários: "[[meio-campista|meia]]" → "meia". */
export function plain(s: string) {
  return s
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[\s\S]*?<\/ref>/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\{\{0\|[^}]*\}\}/g, '')
    .replace(/'''?/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** A ficha com a carreira: Info/Futebolista, Info/Futebol ou Info/Treinador (ex-jogadores). */
function infobox(w: string) {
  for (const m of w.matchAll(/\{\{\s*Info\/(?:Futebol|Treinador)[^|\n]*/gi)) {
    const p = parseTemplate(w, m.index);
    if (p.clubes || p.clube1 || p.ano1) return p;
  }
  return null;
}

function parseTemplate(w: string, start: number) {
  let depth = 0;
  let i = start;
  for (; i < w.length; i++) {
    if (w.startsWith('{{', i)) {
      depth++;
      i++;
    } else if (w.startsWith('}}', i)) {
      depth--;
      i++;
      if (depth === 0) break;
    }
  }
  const body = w.slice(start, i);
  const params: Record<string, string> = {};
  // parâmetros de topo: "|nome = valor" no começo da linha
  for (const part of body.split(/\n\s*\|/).slice(1)) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    params[part.slice(0, eq).trim().toLowerCase()] = part.slice(eq + 1).trim();
  }
  return params;
}

const num = (s: string | undefined) => {
  if (!s) return null;
  const m = plain(s).replace(/\./g, '').match(/\d+/);
  return m ? Number(m[0]) : null;
};

/** O Flamengo do Rio; "Flamengo-MG" e "Flamengo (PI)" são outros clubes. */
const isFla = (club: string) =>
  /\{\{\s*Futebol Flamengo\s*\}\}|Clube de Regatas do Flamengo|\|\s*Flamengo\s*\]\]/i.test(club);

function spells(p: Record<string, string>): Spell[] {
  const out: Spell[] = [];
  // Formato numerado: ano1/clube1/jogos1/gols1
  for (let n = 1; n <= 30; n++) {
    const club = p[`clube${n}`] ?? p[`clubes${n}`];
    if (!club) continue;
    if (!isFla(club)) continue;
    out.push({
      years: plain(p[`ano${n}`] ?? p[`anos${n}`] ?? ''),
      loan: /seta fut|emp fut|empr/i.test(club),
      matches: num(p[`jogos${n}`] ?? p[`partidas${n}`]),
      goals: num(p[`gols${n}`] ?? p[`golos${n}`]),
    });
  }
  if (out.length) return out;
  // Formato em lista: ano / clubes / jogos(golos) separados por <br />
  const list = (v: string | undefined) => {
    const items = (v ?? '').split(/<br\s*\/?\s*>/i);
    while (items.length && !plain(items[items.length - 1]!)) items.pop();
    return items;
  };
  const clubs = list(p.clubes);
  let years = list(p.ano ?? p.anos);
  let games = list(p['jogos(golos)'] ?? p['jogos (golos)'] ?? p['jogos(gols)']);
  // Linha "Total" no fim das colunas de ano e de jogos não tem clube correspondente.
  if (/total/i.test(years[years.length - 1] ?? '')) {
    years = years.slice(0, -1);
    if (games.length === years.length + 1) games = games.slice(0, -1);
  }
  // Anos alinham com clubes; jogos só valem se a coluna estiver alinhada: mesmo tamanho, ou
  // mais curta com itens vazios deixados de propósito para manter as posições.
  if (years.length !== clubs.length) return [{ years: 'desalinhado', loan: false, matches: null, goals: null }];
  const gamesAligned =
    games.length === clubs.length || (games.length < clubs.length && games.some((g) => !plain(g)));
  clubs.forEach((club, k) => {
    if (!isFla(club)) return;
    const g = gamesAligned ? plain(games[k] ?? '').match(/(\d+)\s*\((\d+)\)/) : null;
    out.push({
      years: plain(years[k] ?? ''),
      loan: /seta fut|emp fut/i.test(club),
      matches: g ? Number(g[1]) : null,
      goals: g ? Number(g[2]) : null,
    });
  });
  return out;
}

function nationality(p: Record<string, string>) {
  const raw = p.nacionalidade ?? p.país ?? '';
  return [...raw.matchAll(/\{\{\s*([A-Z]{3})n?\b/g)].map((m) => m[1]!);
}

/** Títulos listados sob "Flamengo" na seção de títulos. */
function titles(w: string) {
  const sec = w.match(/\n==\s*(?:Títulos|Conquistas)[^=\n]*==\s*\n([\s\S]*?)(?=\n==[^=]|$)/i);
  if (!sec) return [];
  const lines = sec[1]!.split('\n');
  const out: string[] = [];
  let inFla = false;
  for (const line of lines) {
    const head = line.match(/^(?:={3,}\s*(.+?)\s*={3,}|;\s*(.+)|'''(.+?)'''\s*:?\s*$)/);
    if (head) {
      inFla = /flamengo/i.test(head[1] ?? head[2] ?? head[3] ?? '');
      continue;
    }
    if (inFla && /^\s*\*/.test(line)) out.push(plain(line.replace(/^\s*\*+/, '')));
  }
  return out;
}

async function one(c: Candidate): Promise<WikiPlayer> {
  const file = join(CACHE, `${c.id}.json`);
  let page: Awaited<ReturnType<typeof fetchWikitext>>;
  // O cache guarda o título pedido: se a candidata mudar de artigo, busca de novo.
  const cached = !refresh && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
  if (cached && cached.requested === c.wiki) page = cached.page;
  else {
    page = await fetchWikitext(c.wiki);
    writeFileSync(file, JSON.stringify({ requested: c.wiki, page }));
    await sleep(1500);
  }
  const base: WikiPlayer = {
    id: c.id,
    name: c.name,
    article: page?.title ?? null,
    revision: page?.revid ?? null,
    url: page ? `https://pt.wikipedia.org/w/index.php?oldid=${page.revid}` : null,
    fullName: null,
    position: null,
    nationality: [],
    birthPlace: null,
    flamengo: [],
    totalMatches: null,
    totalGoals: null,
    firstYear: null,
    titles: [],
    updated: null,
    problems: [],
  };
  if (!page) return { ...base, problems: ['artigo não encontrado'] };
  const p = infobox(page.wikitext);
  if (!p) return { ...base, problems: ['sem infobox de futebolista'] };
  const fl = spells(p);
  const sum = (k: 'matches' | 'goals') =>
    fl.length && fl.every((s) => s[k] !== null) ? fl.reduce((a, s) => a + (s[k] ?? 0), 0) : null;
  const firstYear = fl.map((s) => Number(s.years.match(/\d{4}/)?.[0])).filter(Boolean).sort()[0] ?? null;
  const problems: string[] = [];
  if (!fl.length) problems.push('Flamengo não aparece nos clubes da infobox');
  if (fl.some((s) => s.matches === null)) problems.push('passagem sem número de jogos');
  return {
    ...base,
    fullName: plain(p.nomecompleto ?? p['nome completo'] ?? p.nome ?? '') || null,
    position: plain(p['posição'] ?? p.posicao ?? '') || null,
    nationality: nationality(p),
    birthPlace: plain(p.nascimento_local ?? p['local de nascimento'] ?? p.cidadenatal ?? '') || null,
    flamengo: fl,
    totalMatches: sum('matches'),
    totalGoals: sum('goals'),
    firstYear,
    titles: titles(page.wikitext),
    updated: plain(p['clube-atualização'] ?? p.pcupdate ?? '') || null,
    problems,
  };
}

async function main() {
  mkdirSync(CACHE, { recursive: true });
  const out: WikiPlayer[] = [];
  for (const c of CANDIDATES) {
    try {
      out.push(await one(c));
    } catch (e) {
      out.push({ ...(await Promise.resolve({} as WikiPlayer)), id: c.id, name: c.name, problems: [String(e)] });
    }
  }
  writeFileSync(join(CACHE, 'wikipedia.json'), JSON.stringify(out, null, 2));
  const bad = out.filter((p) => p.problems.length);
  console.log(`${out.length} candidatos, ${out.length - bad.length} completos, ${bad.length} com problema`);
  for (const p of bad) console.log(`- ${p.id} (${p.article ?? '—'}): ${p.problems.join('; ')}`);
  await englishList();
}

export interface ListRow {
  name: string;
  link: string | null;
  nat: string;
  pos: string;
  first: number;
  years: string;
  apps: number;
  goals: number;
  /** Linha marcada com † na lista: inclui amistosos (jogadores do século XX). */
  friendlies: boolean;
}

/**
 * "List of CR Flamengo players" (Wikipédia em inglês): quem fez 100 jogos ou mais, com
 * nacionalidade, posição, anos, jogos e gols, cada linha com a referência citada.
 */
async function englishList() {
  const file = join(CACHE, 'en-list.json');
  let page: Awaited<ReturnType<typeof fetchWikitext>>;
  if (!refresh && existsSync(file)) page = JSON.parse(readFileSync(file, 'utf8'));
  else {
    page = await fetchWikitext('List of CR Flamengo players', 'en');
    writeFileSync(file, JSON.stringify(page));
  }
  if (!page) throw new Error('lista em inglês não encontrada');
  const rows: ListRow[] = [];
  const re =
    /scope="row"[^|]*\|\s*(.+?)\n\|align="left"\|\{\{([A-Z]{3})\}\}\|\|\{\{sort\|\d+\|(\w+)\}\}\|\|\{\{sort\|(\d{4})\|([^}]*)\}\}\|\|([\d,]+)\|\|([\d,]+)/;
  for (const r of page.wikitext.split('\n|-')) {
    const m = r.match(re);
    if (!m) continue;
    rows.push({
      name: plain(m[1]!).replace(/†/g, '').trim(),
      link: m[1]!.match(/\[\[([^|\]]*)/)?.[1] ?? null,
      nat: m[2]!,
      pos: m[3]!,
      first: Number(m[4]),
      years: m[5]!,
      apps: Number(m[6]!.replace(/,/g, '')),
      goals: Number(m[7]!.replace(/,/g, '')),
      friendlies: m[1]!.includes('†'),
    });
  }
  writeFileSync(join(CACHE, 'en-list-rows.json'), JSON.stringify({ revision: page.revid, rows }, null, 2));
  console.log(`lista em inglês: ${rows.length} jogadores (revisão ${page.revid})`);
}

void main();
