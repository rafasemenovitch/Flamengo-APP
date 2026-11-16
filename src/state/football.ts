import { useSyncExternalStore } from 'react';

import { CLUB, SQUAD, TEAMS } from '@/data/demo/seed';
import type { Player, PlayerPosition } from '@/types/player';

/**
 * Dados reais de futebol que a sincronização (supabase/functions/sync-football) salvou:
 * escudos, elenco atual, fotos recortadas e perfis. O app só lê do Supabase (CLAUDE.md,
 * "API de futebol"); a última leitura fica no aparelho para abrir rápido e sem internet.
 * Sem Supabase ou antes de carregar, tudo cai nos placeholders de sempre.
 */

const CACHE_KEY = '@flamengo/football-catalog-v1';
const BUCKET = 'football';

interface CatalogTeam {
  id: number;
  name: string;
  logo: string | null;
}

interface CatalogPlayer {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  number: number | null;
  position: string | null;
  photo: string | null;
  birthDate: string | null;
  nationality: string | null;
  heightCm: number | null;
}

interface Catalog {
  teams: CatalogTeam[];
  squad: CatalogPlayer[];
  savedAt: number;
}

let catalog: Catalog | null = null;
let version = 0;
const listeners = new Set<() => void>();
let logoByTeam = new Map<string, string>();
let extras: Player[] = [];

export const normalizeName = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** Times do app cujo nome não bate com o da API nem pelo começo. */
const TEAM_ALIASES: Record<string, string[]> = {
  cap: ['Atletico Paranaense'],
  rbb: ['RB Bragantino'],
  ldu: ['LDU de Quito', 'LDU Quito'],
  est: ['Estudiantes L.P.'],
};

/** Liga cada time do app ao escudo salvo: nome igual (ou apelido) primeiro, depois "começa com". */
export function matchTeamLogos(
  appTeams: { id: string; name: string }[],
  apiTeams: { name: string; logo: string | null }[]
) {
  const withLogo = apiTeams.filter((t) => t.logo).map((t) => ({ key: normalizeName(t.name), logo: t.logo! }));
  const out = new Map<string, string>();
  for (const team of appTeams) {
    const names = [team.name, ...(TEAM_ALIASES[team.id] ?? [])].map(normalizeName);
    const hit =
      withLogo.find((t) => names.includes(t.key)) ??
      withLogo.find((t) => names.some((n) => n.length >= 4 && t.key.startsWith(n)));
    if (hit) out.set(team.id, hit.logo);
  }
  return out;
}

const NATIONALITY: Record<string, string> = {
  Brazil: 'Brasil',
  Uruguay: 'Uruguai',
  Argentina: 'Argentina',
  Chile: 'Chile',
  Spain: 'Espanha',
  Ecuador: 'Equador',
  Colombia: 'Colômbia',
  Paraguay: 'Paraguai',
  Peru: 'Peru',
  Venezuela: 'Venezuela',
  Italy: 'Itália',
  Portugal: 'Portugal',
};

const POSITION: Record<string, PlayerPosition> = {
  Goalkeeper: 'Goleiro',
  Defender: 'Zagueiro',
  Midfielder: 'Meia',
  Attacker: 'Atacante',
};

/** "G. de Arrascaeta" → "Arrascaeta"; "Lucas Paquetá" fica igual. */
function shirtName(p: CatalogPlayer) {
  const n = p.name.replace(/^[A-Z]\.\s+/, '');
  return n.replace(/^(de|da|do|dos|das)\s+/i, (m) => m[0]!.toUpperCase() + m.slice(1));
}

function fullName(p: CatalogPlayer) {
  return p.firstname && p.lastname ? `${p.firstname.split(' ')[0]} ${p.lastname}` : shirtName(p);
}

/** Aplica o catálogo: escudos, perfil real no elenco do app e quem mais está no elenco atual. */
function apply(next: Catalog) {
  catalog = next;
  logoByTeam = matchTeamLogos(
    [CLUB, ...Object.values(TEAMS)],
    next.teams.map((t) => ({ name: t.name, logo: t.logo }))
  );
  const byApi = new Map(next.squad.map((p) => [p.id, p]));
  const mapped = new Set<number>();
  for (const pl of SQUAD) {
    const real = pl.apiId ? byApi.get(pl.apiId) : undefined;
    if (!real) continue;
    mapped.add(real.id);
    if (real.birthDate) pl.birthDate = real.birthDate;
    if (real.heightCm) pl.heightCm = real.heightCm;
    if (real.nationality) pl.nationality = NATIONALITY[real.nationality] ?? real.nationality;
    if (real.number) pl.number = real.number;
  }
  extras = next.squad
    .filter((p) => !mapped.has(p.id))
    .map((p): Player => {
      const position = POSITION[p.position ?? ''] ?? 'Meia';
      return {
        id: `api-${p.id}`,
        apiId: p.id,
        name: fullName(p),
        shortName: shirtName(p),
        number: p.number ?? 0,
        position,
        role: position,
        birthDate: p.birthDate ?? '',
        nationality: p.nationality ? (NATIONALITY[p.nationality] ?? p.nationality) : '',
        heightCm: p.heightCm ?? 0,
        imageKey: `player-api-${p.id}`,
        season: { matches: 0, goals: 0, assists: 0, minutes: 0, yellowCards: 0, redCards: 0 },
        bio: '',
      };
    })
    .sort((a, b) => a.number - b.number);
  version++;
  listeners.forEach((l) => l());
}

// Armazenamento e Supabase só quando for buscar: o design system importa este módulo e
// não pode depender de módulo nativo ao carregar (testes, telas de catálogo).
const storage = async () => (await import('@react-native-async-storage/async-storage')).default;

async function fetchCatalog(): Promise<Catalog | null> {
  const { getSupabase } = await import('@/services/supabase/client');
  const supabase = getSupabase();
  if (!supabase) return null;
  const url = (path: string | null) =>
    path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null;
  const [teams, players] = await Promise.all([
    supabase.from('football_teams').select('id, name, logo_path'),
    supabase
      .from('football_players')
      .select(
        'id, name, firstname, lastname, number, position, photo_cutout_path, birth_date, nationality, height_cm'
      )
      .eq('in_squad', true),
  ]);
  if (teams.error || players.error) return null;
  return {
    savedAt: Date.now(),
    teams: (teams.data ?? []).map((t) => ({ id: t.id, name: t.name, logo: url(t.logo_path) })),
    squad: (players.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      firstname: p.firstname,
      lastname: p.lastname,
      number: p.number,
      position: p.position,
      // Só a foto recortada: a original tem fundo branco e destoa do app.
      photo: url(p.photo_cutout_path),
      birthDate: p.birth_date,
      nationality: p.nationality,
      heightCm: p.height_cm,
    })),
  };
}

let started = false;
/** Lê o que está salvo no aparelho e depois atualiza pelo Supabase. Chamado uma vez na abertura. */
export function loadFootball() {
  if (started) return;
  started = true;
  void (async () => {
    const AsyncStorage = await storage().catch(() => null);
    try {
      const raw = await AsyncStorage?.getItem(CACHE_KEY);
      if (raw && !catalog) apply(JSON.parse(raw) as Catalog);
    } catch {
      // cache ilegível: segue para o Supabase
    }
    try {
      const fresh = await fetchCatalog();
      if (!fresh || (!fresh.teams.length && !fresh.squad.length)) return;
      apply(fresh);
      await AsyncStorage?.setItem(CACHE_KEY, JSON.stringify(fresh));
    } catch {
      // sem rede ou sem Supabase: fica o que já estava
    }
  })();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Re-renderiza quando o catálogo chega. */
export const useFootballVersion = () => useSyncExternalStore(subscribe, () => version);

export const teamLogo = (teamId: string) => logoByTeam.get(teamId);

export function playerPhoto(player: { apiId?: number } | undefined) {
  if (!player?.apiId || !catalog) return undefined;
  return catalog.squad.find((p) => p.id === player.apiId)?.photo ?? undefined;
}

/** Elenco completo: os do app (com perfil real) + quem mais está no elenco atual. */
export const fullSquad = (): Player[] => [...SQUAD, ...extras];

export const findSquadPlayer = (id: string) => fullSquad().find((p) => p.id === id);

/** Só para testes. */
export function __setCatalogForTests(next: Catalog | null) {
  if (next) apply(next);
  else {
    catalog = null;
    logoByTeam = new Map();
    extras = [];
    version++;
  }
}
