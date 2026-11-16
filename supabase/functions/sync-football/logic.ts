/**
 * Regras da sincronização com a API-Football, sem dependências (roda no Deno da Edge Function
 * e no Jest). Regras do projeto: CLAUDE.md, seção "API de futebol".
 */

export const FLAMENGO_ID = 127;
export const BRASILEIRAO_ID = 71;

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

/** Validade de cada tipo de dado (regra 3). */
export const TTL = {
  squad: 7 * DAY,
  profile: 7 * DAY,
  fixtures: DAY,
  standings: DAY,
  lineup: 15 * MIN,
  live: 3 * MIN,
} as const;

/** Janela da escalação: de 75 min antes do apito até ela sair. */
export const LINEUP_WINDOW = 75 * MIN;
/** Depois do apito, acompanha o jogo por até 3 h (prorrogação, pênaltis, atraso). */
export const LIVE_WINDOW = 3 * 60 * MIN;
/** O Cron roda a cada 3 min; a folga evita pular um ciclo por segundos de atraso. */
const CRON_SLACK = 30_000;

/** Abaixo disso, só o essencial (dia de jogo) continua chamando a API (regra 5). */
export const RESERVE = 15;
/** O limite é 10 por minuto; paramos em 9 para não encostar. */
export const PER_MINUTE = 9;

/** Situações em que o jogo não muda mais (regra 7: não buscar de novo). */
export const FINAL_STATUS = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'CANC', 'ABD'] as const;
export const isFinal = (status: string) => (FINAL_STATUS as readonly string[]).includes(status);

export function isStale(fetchedAt: string | null | undefined, ttl: number, now: number) {
  if (!fetchedAt) return true;
  return now - new Date(fetchedAt).getTime() >= ttl;
}

/** Pode chamar a API? `remaining` é o que o último header informou hoje (null = sem chamada hoje). */
export function budgetAllows(remaining: number | null, essential: boolean) {
  if (remaining === null) return true;
  if (remaining <= 0) return false;
  return essential || remaining >= RESERVE;
}

/** Início do dia da cota (00:00 UTC), quando os 100 pedidos voltam. */
export const quotaDayStart = (now: number) => new Date(Math.floor(now / DAY) * DAY).toISOString();

export interface MatchdayFixture {
  kickoff: string;
  status: string;
  hasLineups: boolean;
  detailsFetchedAt: string | null;
}

/** O que buscar de um jogo agora: escalação, ao vivo ou nada (regra 3). */
export function matchdayAction(f: MatchdayFixture, now: number): 'lineup' | 'live' | null {
  if (isFinal(f.status)) return null;
  const kickoff = new Date(f.kickoff).getTime();
  if (now < kickoff - LINEUP_WINDOW || now > kickoff + LIVE_WINDOW) return null;
  if (now < kickoff) {
    if (f.hasLineups) return null;
    return isStale(f.detailsFetchedAt, TTL.lineup - CRON_SLACK, now) ? 'lineup' : null;
  }
  return isStale(f.detailsFetchedAt, TTL.live - CRON_SLACK, now) ? 'live' : null;
}

/** Temporadas do plano gratuito: do ano −4 ao ano −2 (em 2026: 2022, 2023 e 2024). */
export function freeSeasons(now: number) {
  const year = new Date(now).getUTCFullYear();
  return [year - 4, year - 3, year - 2];
}

/** Texto do erro da API, que vem como objeto ou lista mesmo com HTTP 200. */
export function apiErrorText(errors: unknown): string | null {
  if (!errors) return null;
  if (Array.isArray(errors)) return errors.length ? JSON.stringify(errors) : null;
  if (typeof errors === 'object') return Object.keys(errors).length ? JSON.stringify(errors) : null;
  return String(errors);
}

export function headerInt(value: string | null) {
  if (value === null || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/* Formato da API-Football v3 (só os campos usados). */

export interface ApiTeam {
  id: number;
  name: string;
  logo?: string | null;
  code?: string | null;
  country?: string | null;
}

export interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    referee?: string | null;
    venue?: { name?: string | null; city?: string | null } | null;
    status: { short: string; elapsed?: number | null };
  };
  league: { id: number; name: string; season: number; round?: string | null };
  teams: { home: ApiTeam; away: ApiTeam };
  goals: { home: number | null; away: number | null };
  score?: unknown;
  events?: unknown[];
  lineups?: unknown[];
  statistics?: unknown[];
  players?: unknown[];
}

export interface ApiSquadPlayer {
  id: number;
  name: string;
  age?: number | null;
  number?: number | null;
  position?: string | null;
  photo?: string | null;
}

export interface ApiProfile {
  player: {
    id: number;
    name: string;
    firstname?: string | null;
    lastname?: string | null;
    age?: number | null;
    birth?: { date?: string | null } | null;
    nationality?: string | null;
    height?: string | null;
    weight?: string | null;
    number?: number | null;
    position?: string | null;
    photo?: string | null;
  };
}

export function teamRow(t: ApiTeam) {
  return {
    id: t.id,
    name: t.name,
    logo_url: t.logo ?? null,
    ...(t.code !== undefined ? { code: t.code } : {}),
    ...(t.country !== undefined ? { country: t.country } : {}),
  };
}

/** Linha de `football_fixtures`. Os detalhes só entram quando a resposta os traz. */
export function fixtureRow(f: ApiFixture, fetchedAt: string) {
  const withDetails = Array.isArray(f.events) || Array.isArray(f.lineups);
  return {
    id: f.fixture.id,
    season: f.league.season,
    league_id: f.league.id,
    league_name: f.league.name,
    round: f.league.round ?? null,
    kickoff: f.fixture.date,
    status: f.fixture.status.short,
    elapsed: f.fixture.status.elapsed ?? null,
    venue_name: f.fixture.venue?.name ?? null,
    venue_city: f.fixture.venue?.city ?? null,
    referee: f.fixture.referee ?? null,
    home_team_id: f.teams.home.id,
    away_team_id: f.teams.away.id,
    home_goals: f.goals.home,
    away_goals: f.goals.away,
    score: f.score ?? null,
    fetched_at: fetchedAt,
    ...(withDetails
      ? {
          events: f.events ?? [],
          lineups: f.lineups ?? [],
          statistics: f.statistics ?? [],
          players: f.players ?? [],
          details_fetched_at: fetchedAt,
        }
      : {}),
  };
}

export function squadPlayerRow(p: ApiSquadPlayer, teamId: number, fetchedAt: string) {
  return {
    id: p.id,
    team_id: teamId,
    in_squad: true,
    name: p.name,
    age: p.age ?? null,
    number: p.number ?? null,
    position: p.position ?? null,
    photo_url: p.photo ?? null,
    squad_fetched_at: fetchedAt,
  };
}

/** "182 cm" → 182. */
const toInt = (v: string | null | undefined) => {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : null;
};

export function profileRow(p: ApiProfile['player'], fetchedAt: string) {
  return {
    name: p.name,
    firstname: p.firstname ?? null,
    lastname: p.lastname ?? null,
    age: p.age ?? null,
    birth_date: p.birth?.date ?? null,
    nationality: p.nationality ?? null,
    height_cm: toInt(p.height),
    weight_kg: toInt(p.weight),
    profile_fetched_at: fetchedAt,
  };
}

/** Caminho no Storage: `teams/127.png`, `players/1234.png`. */
export function mediaPath(kind: 'teams' | 'players', id: number, url: string) {
  const ext = /\.(png|jpe?g|webp|svg)(\?|$)/i.exec(url)?.[1]?.toLowerCase() ?? 'png';
  return `${kind}/${id}.${ext === 'jpeg' ? 'jpg' : ext}`;
}

/**
 * Recorta o fundo branco liso das fotos de jogador (150×150, rosto e ombros), para o app
 * pôr o jogador no círculo com o fundo do tema em vez de um quadrado branco.
 * Só o branco ligado às bordas de cima e dos lados some (a camisa toca a borda de baixo);
 * na transição, o pixel ganha transparência parcial e perde o halo branco.
 * `rgba` é alterado no lugar e devolvido.
 */
export function cutoutWhiteBackground(rgba: Uint8Array, width: number, height: number) {
  const BG_MIN = 232; // canal mais escuro acima disso…
  const BG_CHROMA = 20; // …e quase sem cor = fundo
  const EDGE_MIN = 196; // vizinho do fundo mais claro que isso fica translúcido
  const n = width * height;
  const minC = (i: number) => Math.min(rgba[i * 4]!, rgba[i * 4 + 1]!, rgba[i * 4 + 2]!);
  const chroma = (i: number) => Math.max(rgba[i * 4]!, rgba[i * 4 + 1]!, rgba[i * 4 + 2]!) - minC(i);
  const isBgColor = (i: number) => minC(i) >= BG_MIN && chroma(i) <= BG_CHROMA;

  const bg = new Uint8Array(n);
  const stack: number[] = [];
  const seed = (i: number) => {
    if (!bg[i] && isBgColor(i)) {
      bg[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < width; x++) seed(x);
  for (let y = 0; y < height; y++) {
    seed(y * width);
    seed(y * width + width - 1);
  }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % width;
    const y = (i - x) / width;
    if (x > 0) seed(i - 1);
    if (x < width - 1) seed(i + 1);
    if (y > 0) seed(i - width);
    if (y < height - 1) seed(i + width);
  }

  for (let i = 0; i < n; i++) {
    if (bg[i]) {
      rgba[i * 4 + 3] = 0;
      continue;
    }
    const x = i % width;
    const y = (i - x) / width;
    const touchesBg =
      (x > 0 && bg[i - 1]) ||
      (x < width - 1 && bg[i + 1]) ||
      (y > 0 && bg[i - width]) ||
      (y < height - 1 && bg[i + width]);
    const m = minC(i);
    if (!touchesBg || m < EDGE_MIN) continue;
    // Quanto mais branco, mais transparente; e tira o branco que vazou na cor.
    const a = Math.max(0.15, Math.min(1, (255 - m) / (255 - EDGE_MIN)));
    for (let c = 0; c < 3; c++) {
      const v = rgba[i * 4 + c]!;
      rgba[i * 4 + c] = Math.max(0, Math.min(255, Math.round((v - 255 * (1 - a)) / a)));
    }
    rgba[i * 4 + 3] = Math.round(a * (rgba[i * 4 + 3] ?? 255));
  }
  return rgba;
}

/** Converte RGB ou RGBA de 8 bits (`channels` 3 ou 4) para RGBA. */
export function toRgba(data: ArrayLike<number>, channels: number, pixels: number) {
  if (channels === 4) return Uint8Array.from(data);
  const out = new Uint8Array(pixels * 4);
  for (let i = 0; i < pixels; i++) {
    out[i * 4] = data[i * channels] ?? 0;
    out[i * 4 + 1] = data[i * channels + (channels >= 3 ? 1 : 0)] ?? 0;
    out[i * 4 + 2] = data[i * channels + (channels >= 3 ? 2 : 0)] ?? 0;
    out[i * 4 + 3] = 255;
  }
  return out;
}

/**
 * Times do calendário do app que não cruzaram com o Flamengo nas temporadas salvas: busca
 * uma vez só o cadastro (e o escudo) de cada um. `prefer` desempata quando a busca acha vários.
 */
export const TEAM_SEARCHES: { search: string; country: string; prefer?: string }[] = [
  { search: 'Mirassol', country: 'Brazil' },
  { search: 'Remo', country: 'Brazil' },
  { search: 'CRB', country: 'Brazil' },
  { search: 'Marica', country: 'Brazil' },
  { search: 'River Plate', country: 'Argentina' },
  { search: 'Estudiantes', country: 'Argentina', prefer: 'Estudiantes L.P.' },
  { search: 'Nacional', country: 'Uruguay' },
  { search: 'LDU', country: 'Ecuador', prefer: 'LDU de Quito' },
  { search: 'Cerro Porteno', country: 'Paraguay' },
];

export const normalizeName = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** Escolhe o time certo entre os achados: o preferido, o de nome igual, o que começa igual, o primeiro. */
export function pickTeam<T extends { name: string }>(found: T[], search: string, prefer?: string) {
  const s = normalizeName(search);
  const p = prefer ? normalizeName(prefer) : null;
  return (
    (p && found.find((t) => normalizeName(t.name) === p)) ||
    found.find((t) => normalizeName(t.name) === s) ||
    found.find((t) => normalizeName(t.name).startsWith(s)) ||
    found[0] ||
    null
  );
}
