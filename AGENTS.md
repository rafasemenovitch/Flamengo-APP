# Fluxo de trabalho com o GitHub

Instruções do usuário para este projeto:

1. Antes de alterar arquivos, verificar o estado local e executar `git pull --ff-only` para obter as atualizações do GitHub. Preservar alterações locais; se houver conflito ou divergência, resolver sem descartar trabalho e informar qualquer impedimento.
2. Fazer as mudanças solicitadas e concluir as verificações adequadas.
3. Mostrar ao usuário o resultado pronto para revisão, com uma prévia quando aplicável, e resumir as mudanças e verificações.
4. Executar `git push` somente após aprovação explícita do usuário para o resultado apresentado. O pedido de uma alteração não autoriza o envio por si só.
5. Se o resultado mudar depois da aprovação, apresentar as novas mudanças para aprovação antes do envio.
6. Antes de cada `git push` ou publicação no Expo, executar `git fetch origin` e verificar se surgiram novos commits remotos. Integrar essas mudanças preservando o trabalho local e remoto e repetir as verificações afetadas. Se a integração alterar o resultado aprovado, apresentar as diferenças e aguardar nova aprovação antes do envio. Não usar push forçado.

# API de futebol

Siga a seção "API de futebol (API-Football, plano gratuito)" do `CLAUDE.md`: o app nunca chama a API direto, só lê do Supabase; toda chamada passa pela Edge Function de sincronização, com cache por `fetched_at`, agendamento por Cron e registro em `sync_log`.
