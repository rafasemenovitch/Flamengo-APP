# API de futebol: como ligar

Regras: `CLAUDE.md`, seção "API de futebol". Em resumo: o app só lê do Supabase; quem fala com a
API-Football é a Edge Function `sync-football`, agendada pelo Supabase Cron.

## O que o plano gratuito traz (verificado em nov/2026)

- 100 chamadas por dia (zera 00:00 UTC), 10 por minuto.
- **Temporadas do ano −4 ao −2: hoje 2022, 2023 e 2024.** A temporada atual (2026) e 2025 não
  vêm no gratuito: a API responde com erro de plano. Por isso o app continua com o calendário
  demonstrativo; o histórico real entra agora.
- Elenco atual (`players/squads`) não depende de temporada. Escudos e fotos vêm do servidor de
  imagens da API e são copiados uma vez para o Storage.

## O que fica salvo

| Tabela / bucket | Conteúdo | Validade |
| --- | --- | --- |
| `football_players` | elenco atual + perfil (nascimento, nacionalidade, altura) | 7 dias |
| `football_teams` | Flamengo e adversários | junto com os jogos |
| `football_fixtures` | todos os jogos do Flamengo por temporada, com eventos, escalações, estatísticas e notas dos jogadores | encerrados: nunca de novo |
| `football_standings` | tabela do Brasileirão por temporada | temporada encerrada: nunca de novo |
| bucket `football` | `teams/<id>.png`, `players/<id>.png` | uma vez |
| `sync_log` | toda chamada, com a cota restante | — |
| `sync_state` | quando cada conjunto foi buscado | — |

Primeira carga: cerca de 55 chamadas, distribuídas pelo Cron ao longo do primeiro dia
(1 elenco, 3 temporadas de jogos, 3 tabelas e ~11 lotes de detalhes nas primeiras horas;
~35 perfis, 3 por hora).
Depois disso, quase nada: perfis a cada 7 dias e o elenco uma vez por semana.

## Passo a passo (uma vez só)

1. **Chave da API.** Crie a conta em <https://dashboard.api-football.com/register> (plano Free,
   sem cartão). A chave fica no ícone de pessoa da barra lateral, aba *My Access*
   (<https://dashboard.api-football.com/profile?access>). Não cole a chave em arquivo
   do projeto.
2. **Ligar o projeto ao Supabase** (no terminal, na pasta do app):
   ```sh
   npx supabase@latest login
   npx supabase@latest link --project-ref <ref>
   ```
   O `<ref>` é o trecho antes de `.supabase.co` na URL do projeto (Project Settings → General).
   O `link` pede a senha do banco.
3. **Criar tabelas, bucket e agendamentos:** `npm run api:db`
4. **Guardar os segredos na função.** Gere um segredo e guarde-o (vai ser usado no passo 6):
   ```sh
   openssl rand -hex 24
   npx supabase@latest secrets set API_FOOTBALL_KEY=<sua chave> SYNC_SECRET=<segredo gerado>
   ```
5. **Publicar a função:** `npm run api:deploy`
6. **Dizer ao Cron onde chamar.** No Supabase, *SQL Editor*:
   ```sql
   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
   select vault.create_secret('<o mesmo segredo do passo 4>', 'sync_secret');
   ```
7. **Primeira carga agora** (opcional; senão o Cron começa no minuto 7 da próxima hora):
   ```sh
   curl -X POST "https://<ref>.supabase.co/functions/v1/sync-football?job=daily" \
     -H "x-sync-secret: <segredo>"
   ```
   A resposta diz o que cada tarefa fez (`"fixtures": "2022: 74 jogos, ..."`). Para conferir:
   *Table Editor → sync_log* (a coluna `requests_remaining` mostra a cota do dia) e
   *Storage → football*.

## Agendamentos

- `football-daily`, de hora em hora: elenco, jogos, tabela, detalhes, perfis e imagens. Cada
  tarefa confere a validade antes; na maioria das horas não gasta nenhuma chamada.
- `football-matchday`, a cada 3 min: só consulta o banco. Em dia de jogo busca a escalação
  (a cada 15 min, de 75 min antes até sair) e o ao vivo (a cada 3 min, durante o jogo).
  Só funciona para temporadas que o plano libera.

Com menos de 15 chamadas restantes no dia, só o `matchday` continua.

## Mudar de plano depois

Num plano pago, ponha as temporadas desejadas em `FOOTBALL_SEASONS` (ex.:
`npx supabase@latest secrets set FOOTBALL_SEASONS=2024,2025,2026`). O resto não muda.
