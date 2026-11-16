-- Dados de futebol vindos da API-Football (regras em CLAUDE.md, "API de futebol").
-- Só a Edge Function sync-football escreve (com a service role); o app só lê.
begin;

create table if not exists public.football_teams (
  id integer primary key,
  name text not null,
  code text,
  country text,
  logo_url text,           -- origem na API; o app nunca usa (regra 6)
  logo_path text,          -- caminho no bucket "football", ex.: teams/127.png
  updated_at timestamptz not null default now()
);

create table if not exists public.football_players (
  id integer primary key,
  team_id integer references public.football_teams(id),
  in_squad boolean not null default false,
  name text not null,
  firstname text,
  lastname text,
  age integer,
  birth_date date,
  nationality text,
  height_cm integer,
  weight_kg integer,
  number integer,
  position text,
  photo_url text,
  photo_path text,
  squad_fetched_at timestamptz,
  profile_fetched_at timestamptz
);

create table if not exists public.football_fixtures (
  id integer primary key,
  season integer not null,
  league_id integer not null,
  league_name text not null,
  round text,
  kickoff timestamptz not null,
  status text not null,
  is_final boolean generated always as (status in ('FT', 'AET', 'PEN', 'AWD', 'WO', 'CANC', 'ABD')) stored,
  elapsed integer,
  venue_name text,
  venue_city text,
  referee text,
  home_team_id integer not null references public.football_teams(id),
  away_team_id integer not null references public.football_teams(id),
  home_goals integer,
  away_goals integer,
  score jsonb,
  events jsonb,
  lineups jsonb,
  statistics jsonb,
  players jsonb,
  fetched_at timestamptz not null,
  details_fetched_at timestamptz
);
create index if not exists football_fixtures_kickoff on public.football_fixtures (kickoff);
create index if not exists football_fixtures_pending_details on public.football_fixtures (kickoff desc)
  where is_final and details_fetched_at is null;

create table if not exists public.football_standings (
  league_id integer not null,
  season integer not null,
  league_name text not null,
  standings jsonb not null,
  fetched_at timestamptz not null,
  primary key (league_id, season)
);

-- Quando cada conjunto foi buscado e se já está encerrado (nunca buscar de novo).
create table if not exists public.sync_state (
  key text primary key,          -- ex.: fixtures:127:2024, standings:71:2024, squad:127
  fetched_at timestamptz not null,
  complete boolean not null default false,
  note text
);

-- Toda chamada à API (regra 5).
create table if not exists public.sync_log (
  id bigint generated always as identity primary key,
  endpoint text not null,
  params jsonb,
  called_at timestamptz not null default now(),
  http_status integer,
  results integer,
  requests_remaining integer,    -- header x-ratelimit-requests-remaining (cota do dia)
  minute_remaining integer,      -- header x-ratelimit-remaining (por minuto)
  error text
);
create index if not exists sync_log_called_at on public.sync_log (called_at desc);

-- Leitura pública só dos dados de futebol; controle da sincronização fica fechado.
alter table public.football_teams enable row level security;
alter table public.football_players enable row level security;
alter table public.football_fixtures enable row level security;
alter table public.football_standings enable row level security;
alter table public.sync_state enable row level security;
alter table public.sync_log enable row level security;

revoke all on public.football_teams, public.football_players, public.football_fixtures,
  public.football_standings, public.sync_state, public.sync_log from anon, authenticated;
grant select on public.football_teams, public.football_players, public.football_fixtures,
  public.football_standings to anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['football_teams', 'football_players', 'football_fixtures', 'football_standings'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_read') then
      execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_read', t);
    end if;
  end loop;
end $$;

-- Ao vivo pelo Realtime.
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'football_fixtures'
  ) then
    alter publication supabase_realtime add table public.football_fixtures;
  end if;
end $$;

-- Escudos e fotos (regra 6): bucket público, escrito só pela função.
insert into storage.buckets (id, name, public)
values ('football', 'football', true)
on conflict (id) do nothing;

commit;
