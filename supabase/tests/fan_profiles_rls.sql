-- Testes com dados sintéticos. Nenhuma conta, senha ou perfil de teste é persistido.
begin;
select set_config('flamengo.test_a', gen_random_uuid()::text, true);
select set_config('flamengo.test_b', gen_random_uuid()::text, true);
insert into auth.users (id, email) values
  (current_setting('flamengo.test_a')::uuid, 'profile-a-' || current_setting('flamengo.test_a') || '@example.invalid'),
  (current_setting('flamengo.test_b')::uuid, 'profile-b-' || current_setting('flamengo.test_b') || '@example.invalid');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('flamengo.test_a'), 'role', 'authenticated')::text, true);
insert into public.fan_profiles (id, first_name, last_name, display_name, cpf, birth_date, gender, fan_since)
values (current_setting('flamengo.test_a')::uuid, 'Rodrigo', 'Teste', 'Rodrigo', '52998224725', '1990-01-01', 'masculino', 2000);

do $$ begin
  if (select count(*) from public.fan_profiles) <> 1 then raise exception 'Falha: conta A leu outros perfis'; end if;
  begin
    insert into public.fan_profiles (id, first_name, last_name, display_name, cpf, birth_date, gender, fan_since)
    values (current_setting('flamengo.test_b')::uuid, 'Intruso', 'Teste', 'Intruso', '52998224725', '1990-01-01', 'outro', 2000);
    raise exception 'Falha: conta A criou perfil de B';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claims', json_build_object('sub', current_setting('flamengo.test_b'), 'role', 'authenticated')::text, true);
insert into public.fan_profiles (id, first_name, last_name, display_name, cpf, birth_date, gender, fan_since)
values (current_setting('flamengo.test_b')::uuid, 'Marina', 'Teste', 'Marina', '11144477735', '1995-05-10', 'feminino', 2010);

do $$ declare changed integer; begin
  if (select count(*) from public.fan_profiles) <> 1 then raise exception 'Falha: conta B leu outros perfis'; end if;
  if (select display_name from public.fan_profiles) <> 'Marina' then raise exception 'Falha: perfil incorreto'; end if;
  update public.fan_profiles set display_name = 'Nao permitido' where id = current_setting('flamengo.test_a')::uuid;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Falha: conta B alterou perfil de A'; end if;
  update public.fan_profiles set fan_since = 2011 where id = current_setting('flamengo.test_b')::uuid;
  if (select fan_since from public.fan_profiles) <> 2011 then raise exception 'Falha: B nao salvou o proprio perfil'; end if;
  begin
    update public.fan_profiles set cpf = '11111111111' where id = current_setting('flamengo.test_b')::uuid;
    raise exception 'Falha: CPF invalido aceito';
  exception when check_violation then null;
  end;
end $$;

reset role;
set local role anon;
do $$ begin
  begin
    perform count(*) from public.fan_profiles;
    raise exception 'Falha: visitante acessou dados pessoais';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
select 'OK: contas isoladas, alteracao propria permitida, CPF validado e visitante sem acesso. Testes revertidos.' as resultado;
