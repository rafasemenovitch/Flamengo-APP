# Flamengo App: regras do projeto

Este arquivo vale para qualquer pessoa (e qualquer Claude) que trabalhe neste repositório.

## Identidade própria, nunca "cara de IA" (regra principal)

O app já tem identidade visual: fontes, cores, estilo de card e jeito de escrever. Toda tela nova precisa parecer parte dele, desenhada por alguém, e não um modelo genérico de app. Algumas abas atuais ainda têm esse problema e vão ser corrigidas; **nenhuma tela nova pode nascer com ele.** A referência de acabamento e personalidade são apps como os do SoFi Stadium e do Tottenham Hotspur Stadium (`docs/maracana/referencias/`), sem copiar nenhum.

Isso vale desde o primeiro rascunho de cada mudança, não como polimento no fim.

- **Antes de desenhar, estude as telas que já existem** (Home, ingresso, Nação) e reaproveite os componentes do design system (`src/design-system/`). Só crie componente novo quando nenhum servir.
- **Cores e espaçamentos só pelos tokens.** Preto, branco e neutros; o vermelho é destaque (seleção, ação principal, "o seu"), nunca fundo de tudo.
- **Textos de quem é do clube:** curtos, diretos e específicos ("Você está no Leste Inferior", "Banheiro a 2 min"). Nada de tom de marketing ("Descubra…", "Explore…"), emoji, exclamação gratuita, frases que explicam o óbvio ou subtítulo em todo item.
- **Fuja do layout padrão de IA:**
  - todos os itens em cards arredondados iguais, com ícone, título e subtítulo;
  - fileiras genéricas de chips;
  - telas vazias com ícone centralizado e frase motivacional;
  - gradientes e sombras decorativas sem função;
  - ícones de bibliotecas genéricas onde o app já tem desenho próprio.
- **Hierarquia vem de tipografia e espaço, não de caixas.** Use a escala do `<Text>` (Anybody para impacto e números, Schibsted para leitura) e deixe o conteúdo respirar.
- **Antes de dar uma tela por pronta,** veja os prints ao lado das telas atuais do app e das referências. Diga com honestidade o que ainda parece genérico e corrija.

## Tipografia (supervisionar sempre)

As fontes atuais são definitivas e aprovadas. **Não troque as famílias** sem pedido explícito: um teste com Barlow Condensed + Manrope já foi feito e descartado.

- **Anybody** (display): títulos de impacto, nomes dos times, placares, números. Instâncias em `assets/fonts/Anybody-*`.
- **Schibsted Grotesk** (texto): interface e leitura.
- Escala única em `src/design-system/tokens/typography.ts`. As telas usam `<Text variant="...">` do design system, nunca nomes de fonte soltos.

### Correção das maiúsculas da Anybody (obrigatória)

Na Anybody, a maiúscula (1350 unidades) é mais baixa que as hastes das minúsculas (o "l" vai a 1570). Em palavras como "Flamengo" e "Palmeiras", a inicial parece afundar abaixo da linha da palavra. **Toda maiúscula da Anybody em palavra com minúsculas precisa ser ampliada 1570/1350 ≈ 1,163×** até a altura das hastes. Palavras só em maiúsculas e números não mudam.

- A correção é automática no `<Text>` do design system (`src/design-system/components/capHeight.tsx`), testada em `src/__tests__/capHeight.test.ts`.
- Para valer, **todo texto em Anybody passa pelo `<Text>` do design system**. Não use `Text` do `react-native` com `fontFamily` Anybody em palavras com minúsculas. Se precisar (SVG, `TextInput`), aplique `withCapCorrection`/`splitCaps` ou use só maiúsculas e números.
- Ao trocar ou adicionar uma instância da Anybody, meça de novo cap height × haste do "l" e ajuste `ANYBODY_CAP_SCALE` se mudar.

## Modo Maracanã (mapa 3D do estádio)

Plano completo e critérios de aceite: `docs/maracana/`. Trabalho em fases; cada fase termina com prints (`npm run map:shots -- <fase>`), commit e aprovação do usuário.

- Motor: MapLibre GL JS dentro de `react-native-webview` (roda no Expo Go). Não usar `react-native-maps`, Mapbox nativo, Google ou Apple Maps para o estádio.
- Dados em `assets/stadiums/<estádio>/`, **gerados** por `npm run map:data` a partir de `map/tools/sources/`. Não editar os `.geojson` à mão. Estilos em `map/styles/`, **gerados** por `npm run map:styles` (`map/tools/build-styles.ts`): mudar cor ou camada no gerador, não no JSON. Nunca escrever dados ou estilo dentro do HTML da WebView.
- Depois de mudar dados, estilos ou `map/web/`, rode `npm run map:build`: ele regera `map/build/mapHtml.js` (o HTML da WebView) e `src/services/stadium/generated/` (os dados que o app importa). Os dois vão no commit.
- Todo setor, portão, rampa e ponto tem `source` e `confidence` (`confirmado`, `fonte_unica`, `estimado`). Nunca inventar posição sem marcar `estimado`. Divergências vão para o `SOURCES.md` do estádio. `src/__tests__/stadiumData.test.ts` confere isso.
- `src/services/stadium/` é genérico (serve ao Morumbis também): nada de "Maracanã" na lógica, só nos dados.
- No Modo Maracanã: sem mascote, sem QR Code de ingresso (acesso é por biometria facial), sem exigir ingresso, sem ícone ou texto de bebida alcoólica.

## Quem é o Cria? (jogo diário da Nação)

- A base de jogadores (`src/data/cria/players.ts`) é **gerada** por `npm run cria:data` (`tools/cria/`): Wikipédia (API) + imprensa + curadoria. Não editar à mão; mudar a curadoria (`tools/cria/curation.ts`) ou a imprensa (`tools/cria/press.ts`) e gerar de novo.
- Critérios, confiança e quem pode ser resposta: `src/data/cria/SOURCES.md`, conferidos por `src/__tests__/criaData.test.ts`. Nunca inventar número: o que não tem fonte fica fora.
- Não coletar do Flaestatística nem do Transfermarkt: os dois bloqueiam robôs de IA no `robots.txt`.

## API de futebol (API-Football, plano gratuito)

Limites: 100 chamadas/dia (zera 00:00 UTC) e 10 chamadas/minuto. Estourar pode bloquear a chave.

1. O app NUNCA chama a API diretamente. Ele lê só do Supabase (tabelas + Realtime para ao vivo).
2. Toda chamada à API passa por uma única Edge Function de sincronização, com a chave guardada como secret.
3. Antes de qualquer chamada, verifique se o dado já está no Supabase e ainda está válido (campo `fetched_at`). Só chame a API se não houver dado ou se ele estiver vencido:
   - elenco, perfis e fotos: 7 dias
   - calendário e classificações: 1 dia
   - escalação: a cada 15 min, de 75 min antes do jogo até sair
   - jogo ao vivo: a cada 3 min, só durante a partida
4. As buscas são agendadas (Supabase Cron) com base no calendário do Flamengo. Nunca dispare uma chamada porque um usuário abriu uma tela. Se o dado não existe ainda, o app mostra um estado vazio ("Escalação ainda não divulgada").
5. Registre toda chamada na tabela `sync_log` (endpoint, horário, status, requisições restantes do header). Se faltar menos de 15 chamadas no dia, pare as buscas não essenciais.
6. Fotos de jogadores e escudos: baixe uma vez para o Supabase Storage e sirva de lá. Nunca use o link da API no app.
7. Dados já salvos (jogos passados, estatísticas finais) não são buscados de novo.
8. Prefira endpoints que trazem tudo de uma vez (ex.: elenco inteiro numa chamada; jogo por ID com eventos, escalações e estatísticas).

## Outras regras

- Escudos, elenco atual, fotos dos jogadores e perfis são reais: vêm da API de futebol pelo Supabase (`src/state/football.ts`), nunca de arquivo no repositório. Foto de jogador só a recortada (sem fundo branco), dentro do `Avatar`. O resto (calendário de 2026, estatísticas, notícias) é demonstrativo.
- Bolão e pontos: só pontos, sem dinheiro.
- Mascote urubu só em momentos interativos (pop-ups e área Nação), nunca em estados vazios ou telas utilitárias.
- Antes de fechar uma mudança: `npm run check` (tsc, lint e testes).
- Sempre faça `git push` depois de cada commit, para o repositório no GitHub ficar em dia para os dois.
