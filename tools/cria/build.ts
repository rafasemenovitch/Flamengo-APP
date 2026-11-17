/**
 * Monta a base do Quem é o Cria? a partir das fontes já lidas:
 *   - Wikipédia em português, infobox e títulos de cada artigo (tools/cria/.cache/wikipedia.json);
 *   - Wikipédia em inglês, "List of CR Flamengo players" (tools/cria/.cache/en-list-rows.json);
 *   - imprensa (tools/cria/press.ts);
 *   - curadoria manual (tools/cria/curation.ts): posição no jogo, dificuldade, apelidos.
 *
 *   npx tsx tools/cria/wikipedia.ts   (lê as fontes; cache local)
 *   npx tsx tools/cria/build.ts       (gera src/data/cria/players.ts e a reconciliação)
 *
 * Regras de confiança e de quem pode ser resposta: src/data/cria/SOURCES.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { CriaAttribute, CriaEvidence, CriaPlayer, CriaPosition } from '../../src/data/cria/types';
import { CANDIDATES } from './candidates';
import { CURATION } from './curation';
import { PRESS, PRESS_SOURCES } from './press';
import type { ListRow, WikiPlayer } from './wikipedia';

const ROOT = join(__dirname, '..', '..');
const CACHE = join(__dirname, '.cache');
const TODAY = new Date().toISOString().slice(0, 10);

const wiki: WikiPlayer[] = JSON.parse(readFileSync(join(CACHE, 'wikipedia.json'), 'utf8'));
const en: { revision: number; rows: ListRow[] } = JSON.parse(readFileSync(join(CACHE, 'en-list-rows.json'), 'utf8'));

export const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** Códigos da FIFA (lista em inglês) e da Wikipédia em português → ISO 3166-1 alfa-3. */
const ISO: Record<string, string> = {
  URU: 'URY',
  PAR: 'PRY',
  CHI: 'CHL',
  POR: 'PRT',
  SPN: 'ESP',
  GER: 'DEU',
  ENG: 'GBR',
};
const iso = (c: string) => ISO[c] ?? c;

const COARSE: Record<CriaPosition, string> = {
  Goleiro: 'GK',
  Zagueiro: 'DF',
  Lateral: 'DF',
  Volante: 'MF',
  Meia: 'MF',
  Atacante: 'FW',
};

// ——— Títulos ———————————————————————————————————————————————————————————

// Artilharias ("2021 (11 gols)") e prêmios individuais aparecem na mesma seção.
const NOT_TITLES =
  /\(\s*\d+\s*gols?\s*\)|artilh|melhor |prêmio|bola de|aspirantes|juniores|júnior|sub-\d|torneio início|taça guanabara|taça rio|turno|dérbi|challenger|campeões mundiais|campeões estaduais|supercopa (dos campeões )?(da )?libertadores|série b|copa são paulo|seleção/i;

const COMPETITION_RE: [string, RegExp][] = [
  ['mundial', /intercontinental|mundial interclubes|mundial de clubes/i],
  ['libertadores', /libertadores/i],
  ['recopa', /recopa sul/i],
  // "Supercopa do Brasil" contém "Copa do Brasil": a Supercopa vem antes
  ['supercopa', /supercopa/i],
  ['copa-do-brasil', /copa do brasil/i],
  ['brasileiro', /campeonato brasileiro|copa união|série a/i],
  ['mercosul', /mercosul/i],
  ['copa-dos-campeoes', /copa dos campeões/i],
  ['copa-de-ouro', /copa (de )?ouro/i],
  ['rio-sp', /rio[- ]são paulo/i],
  ['carioca', /carioca|campeonato estadual do rio/i],
];

export function parseTitles(lines: string[], spells: { from: number; to: number | null }[]) {
  const inSpell = (y: number) => spells.some((s) => y >= s.from && y <= (s.to ?? 9999) + 1);
  const ids = new Set<string>();
  for (const line of lines) {
    if (NOT_TITLES.test(line)) continue;
    const comp = COMPETITION_RE.find(([, re]) => re.test(line))?.[0];
    if (!comp) continue;
    for (const m of line.matchAll(/\b((?:19|20)\d{2})\b(\s*\(\s*especial\s*\))?/gi)) {
      const year = Number(m[1]);
      if (!inSpell(year)) continue;
      ids.add(`${comp}-${year}${m[2] ? 'e' : ''}`);
    }
  }
  return [...ids].sort();
}

// ——— Passagens ————————————————————————————————————————————————————————

function parseSpells(p: WikiPlayer) {
  return p.flamengo
    .map((s) => {
      const ys = s.years.match(/\d{4}/g)?.map(Number) ?? [];
      if (!ys.length) return null;
      const open = /[–—-]\s*$/.test(s.years.trim()) || /[–—-]\s*(atual|presente)/i.test(s.years);
      return { from: ys[0]!, to: open ? null : (ys[ys.length - 1] ?? ys[0]!) };
    })
    .filter((s): s is { from: number; to: number | null } => !!s);
}

// ——— Montagem ———————————————————————————————————————————————————————

interface Divergence {
  id: string;
  name: string;
  attr: string;
  values: string;
  decision: string;
  why: string;
}
const divergences: Divergence[] = [];
const dropped: { id: string; why: string }[] = [];

function findRow(p: WikiPlayer, names: string[], pos: CriaPosition) {
  const keys = names.map(norm);
  const hits = en.rows.filter(
    (r) =>
      (keys.includes(norm(r.name)) || (r.link && keys.includes(norm(r.link.replace(/\s*\(.*\)$/, ''))))) &&
      // mesmo nome não basta: a estreia tem de bater (±3 anos) e a posição não pode contradizer
      (!p.firstYear || Math.abs(r.first - p.firstYear) <= 3) &&
      (r.pos === COARSE[pos] || r.pos === 'FF' || COARSE[pos] === 'MF' || r.pos === 'MF')
  );
  return hits.sort((a, b) => Math.abs(a.first - (p.firstYear ?? 0)) - Math.abs(b.first - (p.firstYear ?? 0)))[0];
}

/** Escolhe o número e a confiança: duas fontes iguais = confirmado. */
function pickNumber(
  id: string,
  name: string,
  attr: 'matches' | 'goals',
  wikiValue: number | null,
  row: ListRow | undefined,
  press: { source: string; value: number }[],
  debut: number
): { value: number; ev: CriaEvidence } | null {
  const options: { source: string; value: number }[] = [];
  if (wikiValue !== null) options.push({ source: 'wikipedia-pt', value: wikiValue });
  if (row) options.push({ source: 'wikipedia-en', value: attr === 'matches' ? row.apps : row.goals });
  options.push(...press);
  if (!options.length) return null;

  // Valor que mais fontes repetem. Sem repetição:
  //  - se as fontes divergem mais de 10%, fica a MAIOR contagem (a menor costuma omitir
  //    competições: há fichas que só contam o campeonato nacional);
  //  - senão, a imprensa (números conhecidos da torcida) e, depois, a preferência pelo
  //    critério "todos os jogos": até 2000, a lista em inglês (inclui amistosos); depois,
  //    o artigo em português (atualizado com a temporada).
  const preferred = debut < 2000 && row?.friendlies ? 'wikipedia-en' : 'wikipedia-pt';
  const counts = new Map<number, string[]>();
  for (const o of options) counts.set(o.value, [...(counts.get(o.value) ?? []), o.source]);
  const all = options.map((o) => o.value);
  const wide = Math.max(...all) > 0 && (Math.max(...all) - Math.min(...all)) / Math.max(...all) > 0.1;
  const isPress = (ss: string[]) => ss.some((x) => !x.startsWith('wikipedia'));
  const ranked = [...counts.entries()].sort(
    (a, b) =>
      b[1].length - a[1].length ||
      (wide ? b[0] - a[0] : 0) ||
      Number(isPress(b[1])) - Number(isPress(a[1])) ||
      Number(b[1].includes(preferred)) - Number(a[1].includes(preferred))
  );
  const [value, sources] = ranked[0]!;
  const close = options
    .filter((o) => !sources.includes(o.source) && Math.abs(o.value - value) <= Math.max(1, value * 0.03))
    .map((o) => o.source);
  if (counts.size > 1) {
    divergences.push({
      id,
      name,
      attr: attr === 'matches' ? 'Jogos' : 'Gols',
      values: options.map((o) => `${o.value} (${o.source})`).join(' · '),
      decision: String(value),
      why:
        sources.length > 1
          ? 'valor repetido por mais fontes'
          : wide
            ? 'diferença acima de 10%: a contagem menor omite competições'
            : `preferência: ${sources[0]}`,
    });
  }
  return {
    value,
    ev: {
      sources,
      confidence: sources.length > 1 ? 'confirmado' : 'fonte_unica',
      ...(close.length ? { closeTo: close } : {}),
    },
  };
}

/**
 * Pode ser resposta: nenhum atributo pendente, e jogos e gols conferidos por uma segunda
 * fonte (igual = confirmado, ou até 3% de diferença). Mesma regra no teste criaData.
 */
const isEligible = (st: Record<CriaAttribute, CriaEvidence>) =>
  Object.values(st).every((e) => e.confidence !== 'pendente') &&
  (['goals', 'matches'] as const).every((a) => st[a].confidence === 'confirmado' || !!st[a].closeTo?.length);

const players: CriaPlayer[] = [];

for (const c of CANDIDATES) {
  const cur = CURATION[c.id];
  if (!cur) {
    dropped.push({ id: c.id, why: 'sem curadoria' });
    continue;
  }
  const p = wiki.find((w) => w.id === c.id);
  if (!p || !p.article) {
    dropped.push({ id: c.id, why: 'sem artigo na Wikipédia' });
    continue;
  }
  const press = PRESS[c.id] ?? [];
  const names = [c.name, ...(cur.aka ?? []), p.fullName ?? '', p.article.replace(/\s*\(.*\)$/, '')].filter(Boolean);
  const row = findRow(p, names, cur.pos);
  let spells = parseSpells(p);
  const pressSince = press.find((f) => f.since)?.since;
  const debut =
    row && row.first < 2000 && p.firstYear ? Math.min(row.first, p.firstYear) : (p.firstYear ?? row?.first ?? pressSince);
  if (!debut) {
    dropped.push({ id: c.id, why: 'sem ano de estreia' });
    continue;
  }
  // Sem passagens legíveis no artigo: usa os anos da lista em inglês ("1954–1963").
  if (!spells.length && row) {
    spells = row.years.split(/<br\s*\/?>/i).flatMap((part) => {
      const ys = part.match(/\d{4}/g)?.map(Number) ?? [];
      return ys.length ? [{ from: ys[0]!, to: /[–-]\s*$/.test(part.trim()) ? null : ys[ys.length - 1]! }] : [];
    });
  }

  const pick = (attr: 'matches' | 'goals') =>
    pickNumber(
      c.id,
      c.name,
      attr,
      attr === 'matches' ? p.totalMatches : p.totalGoals,
      row,
      press.filter((f) => f[attr] !== undefined).map((f) => ({ source: f.source, value: f[attr]! })),
      debut
    );
  const matches = pick('matches');
  const goals = pick('goals');
  if (!matches || !goals) {
    dropped.push({ id: c.id, why: `sem ${!matches ? 'jogos' : 'gols'} em nenhuma fonte` });
    continue;
  }

  const titles = parseTitles(p.titles, spells.length ? spells : [{ from: debut, to: null }]);
  const titlePress = press.find((f) => f.titles !== undefined);
  if (!p.titles.length) {
    dropped.push({ id: c.id, why: 'artigo sem lista de títulos pelo Flamengo' });
    continue;
  }
  if (titlePress && titlePress.titles !== titles.length) {
    divergences.push({
      id: c.id,
      name: c.name,
      attr: 'Títulos',
      values: `${titles.length} (wikipedia-pt) · ${titlePress.titles} (${titlePress.source})`,
      decision: String(titles.length),
      why: 'lista nominal da Wikipédia; a matéria não detalha',
    });
  }

  const natWiki = p.nationality.map(iso);
  const nationality = cur.nat ?? natWiki[0] ?? (row ? iso(row.nat) : undefined);
  if (!nationality) {
    dropped.push({ id: c.id, why: 'sem nacionalidade' });
    continue;
  }
  const natSources = [natWiki.includes(nationality) ? 'wikipedia-pt' : 'curadoria', row && iso(row.nat) === nationality ? 'wikipedia-en' : null].filter(
    (s): s is string => !!s
  );

  const arrivalSources = [
    p.firstYear === debut ? 'wikipedia-pt' : null,
    row && row.first === debut ? 'wikipedia-en' : null,
    pressSince === debut ? press.find((f) => f.since)!.source : null,
  ].filter(
    (s): s is string => !!s
  );
  if (row && p.firstYear && row.first !== p.firstYear) {
    divergences.push({
      id: c.id,
      name: c.name,
      attr: 'Chegada',
      values: `${p.firstYear} (wikipedia-pt) · ${row.first} (wikipedia-en)`,
      decision: String(debut),
      why: 'o ano mais antigo: a lista em inglês ordena pela estreia',
    });
  }

  const posSources = ['wikipedia-pt', row && row.pos === COARSE[cur.pos] ? 'wikipedia-en' : null].filter(
    (s): s is string => !!s
  );

  const ev = (sources: string[], note?: string): CriaEvidence => ({
    sources,
    confidence: sources.length > 1 ? 'confirmado' : 'fonte_unica',
    ...(note ? { note } : {}),
  });

  const stats: Record<CriaAttribute, CriaEvidence> = {
    position: ev(posSources, cur.note),
    nationality: ev(natSources),
    arrivalYear: ev(arrivalSources),
    goals: goals.ev,
    matches: matches.ev,
    titles: ev(['wikipedia-pt', ...(titlePress && titlePress.titles === titles.length ? [titlePress.source] : [])]),
  };

  const aliases = [...new Set([p.fullName, ...(cur.aka ?? [])].filter((a): a is string => !!a && a !== c.name))];
  players.push({
    id: c.id,
    name: c.name,
    aliases,
    photo: null,
    position: cur.pos,
    nationality,
    arrivalYear: debut,
    goals: goals.value,
    matches: matches.value,
    titles,
    spells: spells.length ? spells : [{ from: debut, to: null }],
    stats,
    updatedAt: TODAY,
    difficulty: cur.diff,
    eligible: isEligible(stats),
    ...(cur.active ? { active: true } : {}),
  });
}

// ——— Saída ———————————————————————————————————————————————————————————

const header = `/**
 * GERADO por tools/cria/build.ts a partir das fontes (SOURCES.md). Não editar à mão:
 * corrija a curadoria (tools/cria/curation.ts) ou a imprensa (tools/cria/press.ts) e gere de novo.
 */
import type { CriaPlayer, CriaSource } from './types';

export const CRIA_DATA_VERSION = '${TODAY}';

export const CRIA_SOURCES: CriaSource[] = ${JSON.stringify(
  [
    {
      id: 'wikipedia-pt',
      label: 'Wikipédia em português, artigo do jogador',
      url: 'https://pt.wikipedia.org',
    },
    {
      id: 'wikipedia-en',
      label: 'Wikipédia em inglês, List of CR Flamengo players',
      url: `https://en.wikipedia.org/w/index.php?oldid=${en.revision}`,
    },
    { id: 'curadoria', label: 'Curadoria do app', url: '' },
    ...PRESS_SOURCES.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  ],
  null,
  2
)};

export const CRIA_PLAYERS: CriaPlayer[] = `;
// Um jogador por linha: o diff de uma atualização mostra exatamente quem mudou.
const body = `[\n${players.map((pl) => `  ${JSON.stringify(pl)},`).join('\n')}\n]`;
writeFileSync(join(ROOT, 'src/data/cria/players.ts'), header + body + ';\n');

// Reconciliação no SOURCES.md, entre os marcadores.
const md = join(ROOT, 'src/data/cria/SOURCES.md');
const START = '<!-- reconciliacao:inicio -->';
const END = '<!-- reconciliacao:fim -->';
const table = [
  '| Jogador | Dado | Valores encontrados | Decisão | Motivo |',
  '| --- | --- | --- | --- | --- |',
  ...divergences.map((d) => `| ${d.name} | ${d.attr} | ${d.values} | ${d.decision} | ${d.why} |`),
  '',
  `**Fora da base (${dropped.length}):** ${dropped.map((d) => `${d.id} (${d.why})`).join('; ')}.`,
].join('\n');
const text = readFileSync(md, 'utf8');
const before = text.includes(START) ? text.slice(0, text.indexOf(START)) : text.trimEnd() + '\n\n';
const after = text.includes(END) ? text.slice(text.indexOf(END) + END.length) : '\n';
writeFileSync(md, `${before}${START}\n${table}\n${END}${after}`);

const elig = players.filter((pl) => pl.eligible);
const by = (k: (p: CriaPlayer) => string, list: CriaPlayer[]) =>
  Object.entries(list.reduce<Record<string, number>>((a, p) => ((a[k(p)] = (a[k(p)] ?? 0) + 1), a), {}))
    .map(([x, n]) => `${x}:${n}`)
    .join(' ');
console.log(`${players.length} jogadores na base, ${elig.length} com jogos e gols confirmados`);
console.log('elegíveis por dificuldade:', by((p) => p.difficulty, elig));
console.log('elegíveis por década:', by((p) => `${Math.floor(p.arrivalYear / 10) * 10}`, elig));
console.log(`${divergences.length} divergências, ${dropped.length} fora`);
for (const d of dropped) console.log(`  fora: ${d.id} — ${d.why}`);
