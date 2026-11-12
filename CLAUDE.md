# Flamengo App: regras do projeto

Este arquivo vale para qualquer pessoa (e qualquer Claude) que trabalhe neste repositório.

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
- Todo setor, portão, rampa e ponto tem `source` e `confidence` (`confirmado`, `fonte_unica`, `estimado`). Nunca inventar posição sem marcar `estimado`. Divergências vão para o `SOURCES.md` do estádio. `src/__tests__/stadiumData.test.ts` confere isso.
- `src/services/stadium/` é genérico (serve ao Morumbis também): nada de "Maracanã" na lógica, só nos dados.
- No Modo Maracanã: sem mascote, sem QR Code de ingresso (acesso é por biometria facial), sem exigir ingresso, sem ícone ou texto de bebida alcoólica.

## Outras regras

- Dados 100% demonstrativos. Sem logos ou fotos oficiais baixados; escudos dos adversários são placeholders (virão da API de futebol).
- Bolão e pontos: só pontos, sem dinheiro.
- Mascote urubu só em momentos interativos (pop-ups e área Nação), nunca em estados vazios ou telas utilitárias.
- Antes de fechar uma mudança: `npm run check` (tsc, lint e testes).
- Sempre faça `git push` depois de cada commit, para o repositório no GitHub ficar em dia para os dois.
