# Plano: Modo Maracanã 3D (MapLibre em WebView). Foco na fase 1

## Contexto
O Modo Maracanã é a peça principal do pitch. Hoje ele é um esquema SVG próprio (`src/features/stadium/StadiumMap.tsx`), com "Como chegar" em `react-native-maps` (`ArrivalMap.tsx`) e filas por portão.

O pedido é reconstruí-lo como um mapa geográfico real, travado no entorno, com o estádio em 3D por cima. O nível de acabamento esperado é o dos apps do SoFi Stadium e do Tottenham. Tudo precisa rodar no Expo Go e funcionar sem internet, menos o mapa de base. Os dados de estilo ficam separados, para migrar depois ao MapLibre nativo.

O trabalho segue em 7 fases, e eu paro para aprovação ao fim de cada uma. **Este plano detalha a fase 1 (pesquisa e dados) e fixa a arquitetura que as fases seguintes vão usar.**

## O que já existe e muda de papel
- **`StadiumService` atual** (`src/services/adapters/StadiumService.ts`, implementação demo em `src/services/mock/`):
  - também abastece a carteira de ingressos e o aviso "Seu jogo é hoje" da Home, pelo `getMatchDayPlan` e pelo `getQueues`;
  - **por isso não será apagado.** Na fase 4, os ids de setor e portão dele passam a apontar para o dataset novo, para que ingresso, Home e mapa falem dos mesmos setores.
- **`StadiumModeScreen` e a rota `StadiumMode`** (`src/navigation/types.ts`) continuam. A tela é trocada pela nova `src/features/maracana/MaracanaScreen.tsx`, com os mesmos parâmetros (`sectorId`), então os atalhos atuais continuam funcionando.
- **Abas "Como chegar" e "Filas":**
  - "Como chegar" vira o card "Você está fora do Maracanã", que reaproveita `openDirections` de `src/features/stadium/directions.ts`;
  - a fila entra no card de cada portão;
  - o `react-native-maps` deixa de ser usado no Modo Maracanã.
- **Controles da demo:** a "Simular localização" entra no `DemoControlsSheet` (`src/features/home/HomeParts.tsx`), junto do seletor de sócio e não sócio.
- **Design system:** tokens de cor, tipografia e espaçamento, `Text` com correção das maiúsculas da Anybody, `useTheme().scheme` para o tema do mapa e `haptic`.

## Arquitetura (vale para todas as fases)
- **Motor do mapa:**
  - MapLibre GL JS dentro de `react-native-webview`, instalado com `npx expo install`. Ele faz parte do Expo Go, então não entra módulo nativo novo.
  - O HTML é um bundle único gerado por **esbuild**, com MapLibre, JS e CSS embutidos, em `map/build/`. O app carrega esse HTML por `source={{ html }}`, a partir de um módulo TS gerado (`map/build/mapHtml.ts`).
  - Sem rede, o motor, o estádio e os pontos continuam funcionando.
- **Dados fora do HTML:**
  - `assets/stadiums/maracana/*.geojson` e `levels.json` são a fonte canônica.
  - Como o Metro não importa `.geojson` direto, `npm run map:build` gera um `stadiumData.generated.ts`. É ele que o `DemoStadiumAdapter` usa.
  - Os estilos ficam em `map/styles/maracana-{light,dark}.json`. A WebView recebe tudo por `postMessage` (`init`).
- **Fontes dentro do mapa:**
  - os rótulos do MapLibre precisam de "glyphs" (PBF), que normalmente vêm da internet;
  - vou gerar PBFs locais da **Schibsted Grotesk e da Anybody**, as fontes do app, com o `maplibre/font-maker`, e servi-los embutidos;
  - assim os rótulos usam as fontes do app e funcionam offline;
  - as pílulas de portão aplicam a mesma correção das maiúsculas da Anybody.
- **Serviço genérico** em `src/services/stadium/`:
  - `types.ts`: Level, Sector, Gate, Ramp, Poi, PoiCategory, Walkway, Source, Confidence;
  - `StadiumService.ts`: o contrato;
  - `DemoStadiumAdapter.ts`: a implementação com os dados locais;
  - é registrado em `src/services/mock/index.ts`, `adapters/index.ts` e `live/index.ts` como `services.venueMap`;
  - nada de "Maracanã" na lógica: o nome vem dos dados, e o mesmo código serve ao Morumbis.
- **Ponte entre app e mapa:**
  - mensagens tipadas em `map/web/protocol.ts`, compartilhado entre o app e a WebView;
  - do app para o mapa: `init`, `setTheme`, `setLevel`, `setFilters`, `focusPoi`, `focusSector`, `setUserLocation`, `showRoute`, `clearRoute`, `recenter`;
  - do mapa para o app: `ready`, `poiTapped`, `sectorTapped`, `gateTapped`, `cameraChanged`, `error`;
  - toda a interface (folha inferior, busca, chips, cards) é React Native.
- **Estrutura de arquivos:** a mesma pedida em 2.4. Os estudos e fontes ficam em `docs/maracana/`.

## Fase 1: pesquisa e dados (o que vou executar após aprovação)

### 1. Fontes
- **Os 2 PDFs do Governo do RJ:**
  - Manual da Instalação: figuras 9 a 13, 21, 22, mapas de assentos e figuras 66 a 71.
  - Guia de Escopo Operacional.
  - **Esta máquina não tem `pdftoppm`.** Vou criar um ambiente Python temporário na área de rascunho, com PyMuPDF, para converter as páginas das figuras em imagem e lê-las.
  - Os PDFs e as páginas convertidas **não entram no repositório**, por direitos autorais. O `SOURCES.md` cita link e página.
- **Guia de acessibilidade da NFL Rio e matéria do Lance!:** leio as páginas.
- **OpenStreetMap (Overpass API):**
  - polígono do estádio (`leisure=stadium`, `building`) e gramado (`leisure=pitch`);
  - `entrance=*`, `amenity=toilets|fast_food|bar|restaurant|cafe`, `highway=elevator`, estacionamentos e estátuas;
  - nomes das ruas e das estações.
  - O GeoJSON vem do OSM (licença ODbL), com atribuição.
- **Pesquisa própria:**
  - site do Maracanã e do Complexo (tour, acessibilidade, setores);
  - FlaIngressos e sócio Nação: nomes dos setores vendidos, portão de cada setor e orientação da biometria facial;
  - notícias de 2024 em diante, depois da nova concessão;
  - fotos de notícias e do Wikimedia Commons para a posição das rampas e da estátua do Bellini.
- **Limitação honesta:** não consigo abrir Street View nem assistir a vídeos do YouTube. Onde isso fizer falta, a posição fica `estimado`, com o motivo registrado.
- **Tiles:** leio os termos atuais do OpenFreeMap e confirmo se permitem uso comercial. Se não permitirem, troco para o plano grátis da MapTiler, com a chave em `EXPO_PUBLIC_MAPTILER_KEY` no `.env`; nesse caso eu te peço a chave.

### 2. Reconciliação em `assets/stadiums/maracana/SOURCES.md`
Tabela com: dado | fonte 1 | fonte 2 | fonte 3 | decisão | motivo. Ela cobre, no mínimo:
- 74 × 60 pontos de alimentação;
- quem é a rampa "da UERJ" e quem é a "do Bellini" (A ou D);
- letras dos portões do Lance! × letras das rampas do manual × nomenclatura dos ingressos do Flamengo;
- banheiros químicos do evento da NFL, que podem não existir em jogo de futebol;
- "08" postos médicos;
- dimensões oficiais do gramado.

### 3. Montagem dos dados
- **Geração:** um script em TypeScript (`map/tools/build-stadium.ts`, rodado com `tsx`) usa **@turf/turf** para gerar tudo a partir do contorno e do gramado do OSM. Tudo é reproduzível: a mesma entrada gera sempre os mesmos arquivos.
- **Gramado e linhas:**
  - as linhas do campo (105 × 68 m, se confirmado) são calculadas num sistema local em metros, alinhado ao eixo maior do polígono do OSM, e convertidas para latitude e longitude;
  - incluem as linhas laterais e de fundo, o meio-campo, o círculo central (9,15 m), as grandes e pequenas áreas, as marcas de pênalti e os arcos.
- **Anéis de arquibancada:**
  - faixas concêntricas entre o gramado e o contorno externo, uma por nível público (1, 2, 3 e 5), com `base` e `top` crescentes para a extrusão 3D;
  - a proporção das faixas e das alturas segue os cortes do manual e as fotos.
- **Setores:**
  - o anel é dividido em Norte, Sul, Leste e Oeste pelo ângulo em relação ao eixo do campo;
  - depois vem a subdivisão pelos setores vendidos (Leste Inferior e Superior etc.);
  - as seções 5xx entram onde houver dado, como 501 e 511 no guia da NFL.
- **Cobertura e esplanada:** a cobertura é um anel externo semitransparente; a esplanada tem as 6 rampas desenhadas.
- **Portões e pontos:**
  - `gates.geojson` e `pois.geojson` são pontos com `level`, `category`, `source[]` e `confidence` (`confirmado`, `fonte_unica` ou `estimado`);
  - os 292 banheiros e os bares, sem posição pública, entram distribuídos pelo anel de circulação de cada nível, proporcionais aos setores, e marcados como `estimado`;
  - **sem nenhum ícone ou texto de bebida alcoólica.**
- **`walkways.geojson`:**
  - um anel de circulação por nível, ligações radiais até cada setor e ligações entre níveis (rampas A–F, escadas, escadas rolantes, elevadores E1–E17 sem os de carga);
  - ligações dos portões até as rampas;
  - cada trecho tem `type`, `accessible` e comprimento em metros (calculado pelo turf).
- **`levels.json`:** os níveis 1, 2, 3 e 5, com nome, alturas e `public`. O nível 4 e o térreo ficam com `public: false` e fora do seletor.
- **Validação automática:** um teste Jest (`src/__tests__/stadiumData.test.ts`) confere:
  - todo ponto, portão e setor tem `source` e `confidence`;
  - o nível 4 não é público;
  - todo nó do grafo está conectado;
  - existe caminho acessível de cada portão até cada nível.

### 4. Relatório visual dos dados (entrega da fase 1)
- **Página de desenvolvimento** (`map/dev/index.html`): abre o mapa no navegador com os mesmos dados e estilos do app, mais um painel simples. Nesta fase ela tem o modo "relatório":
  - mapa plano, com o contorno e os anéis por nível;
  - setores coloridos;
  - portões e rampas;
  - todos os pontos coloridos por grau de confiança (verde para `confirmado`, amarelo para `fonte_unica`, cinza para `estimado`);
  - o grafo de corredores por cima.
- **Prints:** uso **Playwright** (`playwright-core` como dependência de desenvolvimento, usando o Chrome já instalado, sem baixar navegador). O script `npm run map:shots` tira as capturas em 390 × 844 @2x e salva em `docs/maracana/screens/fase-1/`.
- **Referências:** salvo os dois prints que você mandou em `docs/maracana/referencias/`.
- **Commit e push**, e paro para você revisar o relatório antes da fase 2.

### Dependências novas
- **No app:** `react-native-webview`, via `expo install`.
- **Só para desenvolvimento, fora do bundle do app:** `maplibre-gl`, `esbuild`, `@turf/turf`, `tsx` e `playwright-core`.
- Os scripts `map:build` e `map:shots` ficam no `package.json`.
- Atualizo o `CLAUDE.md` com as regras desta funcionalidade: dados com `source` e `confidence`, sem mascote, sem QR, sem álcool, e estilo e dados fora do HTML.

## Fases seguintes (resumo, cada uma com prints, commit e aprovação)
2. **Mapa no navegador:**
   - estilos claro e escuro derivados do OpenFreeMap, sem POIs genéricos e só com as ruas e estações pedidas;
   - extrusões com luz;
   - gramado com linhas;
   - portões em pílula;
   - `maxBounds` de cerca de 600 m, zoom de 15,5 a 19,5, inclinação de cerca de 50° e rotação com o campo na horizontal;
   - fundo sólido do tema quando os tiles não carregam.
3. **Interação:** troca de nível (os outros ficam translúcidos), ícones SVG próprios por categoria como imagens do mapa, rótulos só em zoom alto com colisão, aglomeração com contador, toques e ponte de mensagens.
4. **App:**
   - tela nova na WebView, com folha inferior de três alturas, busca com sinônimos, chips, cards de ponto e de setor, selo "Posições aproximadas · demonstração" e faixa do ingresso;
   - tema sincronizado;
   - checagem no Expo Go.
5. **Localização:** `expo-location` com explicação antes de pedir permissão, nível pelo ingresso ou pelo seletor, círculo de precisão, "Localização aproximada", "Você está fora do Maracanã" e a simulação na demo.
6. **Mais perto e rotas:** distância pelo grafo, a 1,2 m/s com mais tempo em escadas e rampas; A* entre níveis; modo acessível sem escadas; rota tracejada animada; passos em texto.
7. **Acabamento:**
   - "vista do seu lugar" pela câmera do MapLibre posicionada no setor;
   - animações respeitando "reduzir movimento";
   - todos os estados vazios e de erro;
   - desempenho (abrir em menos de 2 s, 60 fps);
   - leitor de tela, fonte grande e áreas de toque de 44 pt.

## Verificação
- **Fase 1:**
  - `npm run check` (tsc, lint e Jest, com o teste novo de integridade dos dados);
  - `npm run map:build` sem erros;
  - prints do relatório em `docs/maracana/screens/fase-1/`, que eu mesmo abro e confiro antes de te mostrar;
  - resumo das divergências encontradas e do que ficou `estimado`.
- **Fases 2 a 7:** os prints da seção 7 do pedido, nos dois temas, lado a lado com as referências, com uma lista escrita do que ainda está abaixo delas. A partir da fase 4, confirmo também no Expo Go via `npm run publicar`, e você vê pelo QR.

## Riscos já mapeados
- **Termos do OpenFreeMap:** se não permitirem uso comercial, a saída é a MapTiler com chave.
- **Geometria interna:** não existe planta pública com as alturas reais. Os anéis serão uma aproximação fiel ao contorno e aos cortes do manual, marcada como demonstração.
- **Fontes do mapa:** se a geração dos glyphs locais falhar, os rótulos usam os glyphs do provedor de tiles, que só funcionam com internet, e os ícones continuam funcionando offline.
- **Folha inferior:** o app não tem `@gorhom/bottom-sheet` nem reanimated. Na fase 4 decido entre adicionar essas bibliotecas (estão no Expo Go) ou fazer a folha com `Animated` e `PanResponder`, testando a fluidez.

## Pedido acrescentado na aprovação da fase 2: "Onde você está?"
O torcedor pensa em "inferior" e "superior", não em níveis 1 a 5. O app passa a ter um seletor de área: o lado, inferior/superior/camarote/premium e, se a pessoa souber, o bloco do assento. A partir da área, o app mostra os banheiros, bares etc. mais perto dela.
- **Fase 3:** dados das áreas (`levels.json` → `areas`), destaque no mapa e câmera virada para a área (mensagem `setArea`).
- **Fase 4:** botão "Você está em: Leste Inferior" no topo da tela, preenchido pelo ingresso quando houver.
- **Fase 6:** "Perto de você" a partir da área, pela distância no grafo.

Também na aprovação da fase 2: sem cobertura sobre o estádio, e um modelo mais parecido com o Maracanã.
