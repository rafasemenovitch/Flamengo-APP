begin;

create or replace function public.flamengo_valid_cpf(value text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare i integer; n integer; s integer; digit integer;
begin
  if value !~ '^[0-9]{11}$' or value = repeat(substr(value, 1, 1), 11) then return false; end if;
  for n in 9..10 loop
    s := 0;
    for i in 1..n loop s := s + substr(value, i, 1)::integer * (n + 2 - i); end loop;
    digit := (s * 10) % 11;
    if digit = 10 then digit := 0; end if;
    if digit <> substr(value, n + 1, 1)::integer then return false; end if;
  end loop;
  return true;
end;
$$;

create table if not exists public.fan_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null check (length(trim(first_name)) between 1 and 100),
  last_name text not null check (length(trim(last_name)) between 1 and 150),
  display_name text not null check (length(trim(display_name)) between 1 and 100),
  cpf text not null check (public.flamengo_valid_cpf(cpf)),
  birth_date date not null check (birth_date >= date '1900-01-01' and birth_date <= current_date),
  gender text not null check (gender in ('masculino', 'feminino', 'outro', 'nao-informar')),
  fan_since integer not null check (fan_since >= extract(year from birth_date)::integer and fan_since <= extract(year from current_date)::integer),
  contact jsonb not null default '{}'::jsonb check (jsonb_typeof(contact) = 'object'),
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences) = 'object'),
  created_at timestamptz not null default now()
);

alter table public.fan_profiles enable row level security;
revoke all on public.fan_profiles from anon, authenticated;
grant select, insert, update on public.fan_profiles to authenticated;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'fan_profiles' and policyname = 'fan_profiles_select_own') then
    create policy fan_profiles_select_own on public.fan_profiles for select to authenticated using ((select auth.uid()) = id);
    create policy fan_profiles_insert_own on public.fan_profiles for insert to authenticated with check ((select auth.uid()) = id);
    create policy fan_profiles_update_own on public.fan_profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
  end if;
end $$;

comment on table public.fan_profiles is 'Dados pessoais privados por conta; nunca expor CPF em metadados do Auth ou rankings.';
commit;
