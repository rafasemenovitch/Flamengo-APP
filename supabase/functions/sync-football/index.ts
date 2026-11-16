/**
 * Única porta de entrada para a API-Football (CLAUDE.md, "API de futebol"). Quem chama é o
 * Supabase Cron, nunca o app. Cada tarefa confere antes no banco se o dado ainda vale e só
 * então gasta uma chamada; toda chamada vai para `sync_log`.
 *
 *   POST /functions/v1/sync-football?job=daily     elenco, jogos, tabela, imagens, detalhes, perfis
 *   POST /functions/v1/sync-football?job=matchday  escalação e ao vivo (sem custo fora de dia de jogo)
 *   (também aceita job=squad|profiles|fixtures|standings|teams|details|media)
 *
 * Cabeçalho obrigatório: `x-sync-secret: <SYNC_SECRET>`.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { decode, encode } from 'npm:fast-png@6';

import {
  BRASILEIRAO_ID,
  FLAMENGO_ID,
  PER_MINUTE,
  TEAM_SEARCHES,
  TTL,
  type ApiFixture,
  type ApiProfile,
  type ApiSquadPlayer,
  type ApiTeam,
  apiErrorText,
  budgetAllows,
  cutoutWhiteBackground,
  fixtureRow,
  freeSeasons,
  headerInt,
  isFinal,
  isStale,
  matchdayAction,
  mediaPath,
  pickTeam,
  profileRow,
  quotaDayStart,
  squadPlayerRow,
  teamRow,
  toRgba,
} from './logic.ts';

const API = 'https://v3.football.api-sports.io';
const BUCKET = 'football';
/** Por execução: o resto fica para a próxima hora (e respeita os 10 por minuto). */
const PROFILES_PER_RUN = 3;
const DETAIL_CALLS_PER_RUN = 5;
const MEDIA_PER_RUN = 25;

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

class StopSync extends Error {}

function seasons(now: number) {
  const env = Deno.env.get('FOOTBALL_SEASONS');
  if (!env) return freeSeasons(now);
  return env
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter(Number.isFinite);
}

async function remainingToday(now: number): Promise<number | null> {
  const { data } = await db
    .from('sync_log')
    .select('requests_remaining')
    .gte('called_at', quotaDayStart(now))
    .not('requests_remaining', 'is', null)
    .order('called_at', { ascending: false })
    .limit(1);
  return data?.[0]?.requests_remaining ?? null;
}

async function callsLastMinute(now: number) {
  const { count } = await db
    .from('sync_log')
    .select('id', { count: 'exact', head: true })
    .gte('called_at', new Date(now - 60_000).toISOString());
  return count ?? 0;
}

/** Uma chamada à API, com as travas de cota e o registro em `sync_log`. */
async function api<T>(endpoint: string, params: Record<string, string | number>, essential = false) {
  const now = Date.now();
  if (!budgetAllows(await remainingToday(now), essential))
    throw new StopSync('Cota do dia na reserva: só buscas essenciais.');
  if ((await callsLastMinute(now)) >= PER_MINUTE)
    throw new StopSync('Limite por minuto: continua na próxima.');

  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  let status = 0;
  let body: { response?: T[]; results?: number; errors?: unknown } | null = null;
  let error: string | null = null;
  let res: Response | null = null;
  try {
    res = await fetch(`${API}/${endpoint}?${qs}`, {
      headers: { 'x-apisports-key': Deno.env.get('API_FOOTBALL_KEY')! },
    });
    status = res.status;
    body = await res.json().catch(() => null);
    error = apiErrorText(body?.errors) ?? (res.ok ? null : `HTTP ${res.status}`);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  await db.from('sync_log').insert({
    endpoint,
    params,
    http_status: status || null,
    results: body?.results ?? null,
    requests_remaining: headerInt(res?.headers.get('x-ratelimit-requests-remaining') ?? null),
    minute_remaining: headerInt(res?.headers.get('x-ratelimit-remaining') ?? null),
    error,
  });
  if (error) throw new Error(`${endpoint}: ${error}`);
  return body?.response ?? [];
}

async function getState(key: string) {
  const { data } = await db.from('sync_state').select('*').eq('key', key).maybeSingle();
  return data as { key: string; fetched_at: string; complete: boolean } | null;
}
const setState = (key: string, complete: boolean, note: string | null = null) =>
  db.from('sync_state').upsert({ key, fetched_at: new Date().toISOString(), complete, note });

async function upsertTeams(teams: ApiTeam[]) {
  const unique = [...new Map(teams.map((t) => [t.id, teamRow(t)])).values()];
  if (unique.length) await check(db.from('football_teams').upsert(unique));
}

async function check<R extends { error: { message: string } | null }>(q: PromiseLike<R>) {
  const r = await q;
  if (r.error) throw new Error(r.error.message);
  return r;
}

/* ---------- tarefas ---------- */

/** Elenco atual numa chamada só (regra 8). Validade: 7 dias. */
async function squad() {
  const key = `squad:${FLAMENGO_ID}`;
  const state = await getState(key);
  if (state && !isStale(state.fetched_at, TTL.squad, Date.now())) return 'em dia';
  const res = await api<{ team: ApiTeam; players: ApiSquadPlayer[] }>('players/squads', {
    team: FLAMENGO_ID,
  });
  const entry = res[0];
  if (!entry) return 'vazio';
  const now = new Date().toISOString();
  await upsertTeams([entry.team]);
  await check(db.from('football_players').update({ in_squad: false }).eq('team_id', FLAMENGO_ID));
  await check(
    db.from('football_players').upsert(entry.players.map((p) => squadPlayerRow(p, FLAMENGO_ID, now)))
  );
  await setState(key, false);
  return `${entry.players.length} jogadores`;
}

/** Perfil completo (nascimento, nacionalidade, altura), poucos por execução. Validade: 7 dias. */
async function profiles() {
  const cutoff = new Date(Date.now() - TTL.profile).toISOString();
  const { data } = await db
    .from('football_players')
    .select('id')
    .eq('in_squad', true)
    .or(`profile_fetched_at.is.null,profile_fetched_at.lt.${cutoff}`)
    .order('profile_fetched_at', { ascending: true, nullsFirst: true })
    .limit(PROFILES_PER_RUN);
  let done = 0;
  for (const { id } of data ?? []) {
    const res = await api<ApiProfile>('players/profiles', { player: id });
    const p = res[0]?.player;
    const row = p
      ? profileRow(p, new Date().toISOString())
      : { profile_fetched_at: new Date().toISOString() };
    await check(db.from('football_players').update(row).eq('id', id));
    done++;
  }
  return `${done} perfis`;
}

/** Todos os jogos do Flamengo por temporada (todas as competições numa chamada). */
async function fixtures() {
  const out: string[] = [];
  for (const season of seasons(Date.now())) {
    const key = `fixtures:${FLAMENGO_ID}:${season}`;
    const state = await getState(key);
    if (state?.complete) continue; // temporada encerrada já salva: nunca de novo (regra 7)
    if (state && !isStale(state.fetched_at, TTL.fixtures, Date.now())) continue;
    let res: ApiFixture[];
    try {
      res = await api<ApiFixture>('fixtures', { team: FLAMENGO_ID, season });
    } catch (e) {
      if (e instanceof StopSync) throw e;
      await setState(key, false, (e as Error).message); // ex.: temporada fora do plano; tenta em 1 dia
      out.push(`${season}: ${(e as Error).message}`);
      continue;
    }
    const now = new Date().toISOString();
    await upsertTeams(res.flatMap((f) => [f.teams.home, f.teams.away]));
    // Sem os detalhes: eles vêm depois, em `details`, e não podem ser apagados aqui.
    if (res.length) await check(db.from('football_fixtures').upsert(res.map((f) => fixtureRow(f, now))));
    const complete = res.length > 0 && res.every((f) => isFinal(f.fixture.status.short));
    await setState(key, complete);
    out.push(`${season}: ${res.length} jogos`);
  }
  return out.join(', ') || 'em dia';
}

/** Classificação do Brasileirão por temporada. */
async function standings() {
  const out: string[] = [];
  const thisYear = new Date().getUTCFullYear();
  for (const season of seasons(Date.now())) {
    const key = `standings:${BRASILEIRAO_ID}:${season}`;
    const state = await getState(key);
    if (state?.complete) continue;
    if (state && !isStale(state.fetched_at, TTL.standings, Date.now())) continue;
    let res: { league: { id: number; name: string; standings: unknown[] } }[];
    try {
      res = await api('standings', { league: BRASILEIRAO_ID, season });
    } catch (e) {
      if (e instanceof StopSync) throw e;
      await setState(key, false, (e as Error).message);
      out.push(`${season}: ${(e as Error).message}`);
      continue;
    }
    const league = res[0]?.league;
    if (league)
      await check(
        db.from('football_standings').upsert({
          league_id: league.id,
          season,
          league_name: league.name,
          standings: league.standings,
          fetched_at: new Date().toISOString(),
        })
      );
    await setState(key, !!league && season < thisYear);
    out.push(`${season}: ${league ? 'ok' : 'vazio'}`);
  }
  return out.join(', ') || 'em dia';
}

/**
 * Eventos, escalações e estatísticas dos jogos encerrados, uma vez só, do mais recente para trás.
 * O plano gratuito não aceita `ids=` (vários jogos por chamada): é um jogo por chamada.
 */
async function details() {
  const { data } = await db
    .from('football_fixtures')
    .select('id')
    .eq('is_final', true)
    .is('details_fetched_at', null)
    .order('kickoff', { ascending: false })
    .limit(DETAIL_CALLS_PER_RUN);
  let saved = 0;
  for (const { id } of data ?? []) {
    const res = await api<ApiFixture>('fixtures', { id });
    const now = new Date().toISOString();
    // Marca como buscado mesmo se a API não trouxer detalhes (ex.: jogo cancelado), para não repetir.
    const row = res[0] ? { ...fixtureRow(res[0], now), details_fetched_at: now } : null;
    if (row) await check(db.from('football_fixtures').upsert(row));
    else await check(db.from('football_fixtures').update({ details_fetched_at: now }).eq('id', id));
    saved++;
  }
  return `${saved} jogos detalhados`;
}

/** Escudos e fotos: baixa uma vez do servidor de imagens e serve pelo Storage (regra 6). */
async function media() {
  let saved = 0;
  const jobs: {
    table: 'football_teams' | 'football_players';
    kind: 'teams' | 'players';
    col: string;
    pathCol: string;
  }[] = [
    { table: 'football_teams', kind: 'teams', col: 'logo_url', pathCol: 'logo_path' },
    { table: 'football_players', kind: 'players', col: 'photo_url', pathCol: 'photo_path' },
  ];
  for (const j of jobs) {
    const { data } = await db
      .from(j.table)
      .select(`id, ${j.col}`)
      .is(j.pathCol, null)
      .not(j.col, 'is', null)
      .limit(MEDIA_PER_RUN);
    for (const row of (data ?? []) as unknown as Record<string, string | number>[]) {
      const url = String(row[j.col]);
      const id = Number(row.id);
      const res = await fetch(url).catch(() => null);
      if (!res?.ok) continue;
      const path = mediaPath(j.kind, id, url);
      const { error } = await db.storage.from(BUCKET).upload(path, await res.arrayBuffer(), {
        contentType: res.headers.get('content-type') ?? 'image/png',
        upsert: true,
      });
      if (error) continue;
      await check(
        db
          .from(j.table)
          .update({ [j.pathCol]: path })
          .eq('id', id)
      );
      saved++;
    }
  }
  return `${saved} imagens, ${await cutouts()} recortes`;
}

/** PNG do jogador sem o fundo branco, em `players/<id>-recorte.png`. */
function makeCutout(bytes: ArrayBuffer) {
  const png = decode(new Uint8Array(bytes));
  if (png.depth !== 8 || png.palette) return null; // fotos da API: RGB 8 bits; outro formato fica sem recorte
  const rgba = toRgba(png.data, png.channels, png.width * png.height);
  cutoutWhiteBackground(rgba, png.width, png.height);
  return encode({ width: png.width, height: png.height, data: rgba, channels: 4, depth: 8 });
}

async function cutouts() {
  const { data } = await db
    .from('football_players')
    .select('id, photo_path')
    .not('photo_path', 'is', null)
    .is('photo_cutout_path', null)
    .limit(MEDIA_PER_RUN);
  let done = 0;
  for (const row of data ?? []) {
    const original = await db.storage.from(BUCKET).download(row.photo_path as string);
    if (original.error || !original.data) continue;
    let cut: Uint8Array | null = null;
    try {
      cut = makeCutout(await original.data.arrayBuffer());
    } catch {
      cut = null;
    }
    if (!cut) continue;
    const path = `players/${row.id}-recorte.png`;
    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, cut, { contentType: 'image/png', upsert: true });
    if (error) continue;
    await check(db.from('football_players').update({ photo_cutout_path: path }).eq('id', row.id));
    done++;
  }
  return done;
}

/** Cadastro e escudo dos times do calendário que não apareceram nos jogos salvos (uma vez só). */
async function teams() {
  const out: string[] = [];
  for (const t of TEAM_SEARCHES) {
    const key = `team-search:${t.search}:${t.country}`;
    if ((await getState(key))?.complete) continue;
    const res = await api<{ team: ApiTeam }>('teams', { search: t.search, country: t.country });
    const found = pickTeam(
      res.map((r) => r.team),
      t.search,
      t.prefer
    );
    if (found) await upsertTeams([found]);
    await setState(key, true, found ? `${found.id} ${found.name}` : 'não encontrado');
    out.push(found ? found.name : `${t.search}: não encontrado`);
  }
  return out.join(', ') || 'em dia';
}

/** Dia de jogo: escalação (a cada 15 min, de 75 min antes até sair) e ao vivo (a cada 3 min). */
async function matchday() {
  const now = Date.now();
  const { data } = await db
    .from('football_fixtures')
    .select('id, kickoff, status, lineups, details_fetched_at')
    .eq('is_final', false)
    .gte('kickoff', new Date(now - 3 * 60 * 60_000).toISOString())
    .lte('kickoff', new Date(now + 75 * 60_000).toISOString());
  const out: string[] = [];
  for (const f of data ?? []) {
    const action = matchdayAction(
      {
        kickoff: f.kickoff,
        status: f.status,
        hasLineups: Array.isArray(f.lineups) && f.lineups.length > 0,
        detailsFetchedAt: f.details_fetched_at,
      },
      now
    );
    if (!action) continue;
    const res = await api<ApiFixture>('fixtures', { id: f.id }, true);
    if (res[0]) {
      await upsertTeams([res[0].teams.home, res[0].teams.away]);
      await check(db.from('football_fixtures').upsert(fixtureRow(res[0], new Date().toISOString())));
    }
    out.push(`${f.id}: ${action}`);
  }
  return out.join(', ') || 'sem jogo agora';
}

const JOBS = { squad, profiles, fixtures, standings, teams, details, media, matchday } as const;
const DAILY = ['squad', 'fixtures', 'standings', 'teams', 'media', 'details', 'profiles'] as const;
/** Não gastam cota: rodam mesmo depois que a trava parou as outras. */
const FREE_JOBS: readonly string[] = ['media'];

Deno.serve(async (req) => {
  const secret = Deno.env.get('SYNC_SECRET');
  if (!secret || req.headers.get('x-sync-secret') !== secret)
    return new Response('Não autorizado', { status: 401 });

  const job = new URL(req.url).searchParams.get('job') ?? 'daily';
  const names: (keyof typeof JOBS)[] =
    job === 'daily' ? [...DAILY] : job in JOBS ? [job as keyof typeof JOBS] : [];
  if (!names.length) return Response.json({ error: `Tarefa desconhecida: ${job}` }, { status: 400 });

  const result: Record<string, string> = {};
  let stopped = false;
  for (const name of names) {
    if (stopped && !FREE_JOBS.includes(name)) {
      result[name] = 'fica para a próxima';
      continue;
    }
    try {
      result[name] = await JOBS[name]();
    } catch (e) {
      result[name] = `erro: ${(e as Error).message}`;
      if (e instanceof StopSync) stopped = true;
    }
  }
  return Response.json(result);
});
