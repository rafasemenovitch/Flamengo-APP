-- Agenda da sincronização (regra 4). A URL do projeto e o segredo ficam no Vault, criados à mão
-- uma vez (docs/api-futebol.md); nada de segredo neste arquivo.
--   football-daily     de hora em hora: só chama a API quando algo venceu (quase sempre zero)
--   football-matchday  a cada 3 min: só consulta o banco, salvo em dia de jogo
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.call_sync_football(job text)
returns bigint language sql security definer set search_path = '' as $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
      || '/functions/v1/sync-football?job=' || job,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'sync_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
$$;
revoke all on function public.call_sync_football(text) from public, anon, authenticated;

select cron.schedule('football-daily', '7 * * * *', $$ select public.call_sync_football('daily') $$);
select cron.schedule('football-matchday', '*/3 * * * *', $$ select public.call_sync_football('matchday') $$);
