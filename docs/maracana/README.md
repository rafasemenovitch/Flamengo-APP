# Modo Maracanã: mapa 3D do estádio

Reconstrução do Modo Maracanã como mapa geográfico real (MapLibre GL JS em WebView), com o estádio em 3D. O padrão de qualidade são os apps do SoFi Stadium e do Tottenham Hotspur Stadium (`referencias/`). Plano aprovado: [`plano.md`](plano.md).

## Fases

| Fase | Conteúdo | Situação |
|---|---|---|
| 1 | Pesquisa e dados | Aprovada |
| 2 | Mapa isolado no navegador: estilos, 3D, gramado, portões, câmera | Aprovada |
| 3 | Interação: níveis, "Onde você está?", ícones, rótulos, toques, ponte de mensagens | Aprovada |
| 4 | Integração no app (WebView, folha inferior, busca, cards) | Aprovada |
| 5 | Localização (GPS, fora do estádio, simulação para demo) | Aprovada |
| 6 | Mais perto e rotas (grafo, modo acessível) | **Entregue, aguardando aprovação** |
| 7 | Acabamento (vista do lugar, animações, estados, desempenho) | — |

## Onde está cada coisa

- **Dados:** `assets/stadiums/maracana/`, gerados por `npm run map:data`. Fontes e divergências no [`SOURCES.md`](../../assets/stadiums/maracana/SOURCES.md).
- **Entradas da geração:** `map/tools/sources/` (extrato do OSM e concessões das plantas do manual).
- **Gerador:** `map/tools/build-stadium.ts`.
- **Mapa no navegador:** `npm run map:dev` e depois http://localhost:8787/map/dev/index.html. Painel com tema, "Sem tiles" e recentralizar. Parâmetros: `?theme=light|dark`, `&tiles=0`, `&panel=0`, `&level=1|2|3|5`, `&area=<id>&block=512`, `&poi=<id>`, `&sector=<id>`, `&filter=banheiros|acessibilidade`, `&zoom=`, `&cam=close|rotated|min|far`.
- **Código do mapa:** `map/web/`. `stadiumMap.ts` (núcleo), `bridge.ts` e `protocol.ts` (mensagens com o app), `icons.ts` (pictogramas próprios), `images.ts`, `fonts.ts`. É o mesmo código que vai para a WebView na fase 4.
- **Estilos:** `map/styles/maracana-{light,dark}.json`, **gerados** por `npm run map:styles` (`map/tools/build-styles.ts`) a partir da cópia do Positron do OpenFreeMap em `map/tools/sources/`. Não editar os JSON à mão. `src/__tests__/stadiumStyles.test.ts` valida os dois.
- **Tela do app:** `src/features/maracana/` (`MaracanaScreen.tsx`, `StadiumMapView.tsx` com a WebView, `.web.tsx` com iframe para os prints, e `components/`). Serviço genérico em `src/services/stadium/` (`StadiumMapService`, `DemoStadiumAdapter`, `query.ts` com busca, distâncias e referências).
- **O que o app carrega, gerado por `npm run map:build`:** `map/build/mapHtml.js` (HTML único da WebView: MapLibre, `map/web` e as fontes do app embutidos) e `src/services/stadium/generated/<estádio>.js` (os dados, porque o Metro não lê `.geojson`). Depois de mudar dados, estilos ou `map/web`, rode `npm run map:build` e faça commit dos gerados.
- **Prints do app (web):** `npx expo export --platform web --output-dir <pasta>` e `npx tsx map/tools/app-shots.ts <pasta> <saída> [tema] nome=query|passos` (ver o cabeçalho do arquivo). A versão web aceita `?rota=StadiumMode` para abrir a tela direto.
- **Relatório visual:** `npm run map:dev` e depois http://localhost:8787/map/dev/report.html. Parâmetros: `?level=1|2|3|5|all`, `&graph=1`, `&zoom=`.
- **Prints:** `npm run map:shots -- <fase>`, salvos em `screens/fase-<n>/`. Usa o Chrome instalado; se ele estiver em outro lugar, defina `CHROME_PATH`.
- **Tipos genéricos de estádio:** `src/services/stadium/types.ts`.
- **Teste de integridade:** `src/__tests__/stadiumData.test.ts`, que roda no `npm run check`.

## Fase 2: mapa no navegador

Prints em [`screens/fase-2/`](screens/fase-2/), incluindo `comparacao-referencias.png` (SoFi e Tottenham ao lado dos nossos).

**O que tem:**
- Dois estilos próprios derivados do Positron do OpenFreeMap. O claro é quente e calmo; o escuro fica perto do preto do app. Sem POIs, ônibus, bairros ou escudos de rodovia. Os nomes de rua são só os do entorno (Av. Maracanã, Av. Rei Pelé, Av. Prof. Manoel de Abreu, Rua Prof. Eurico Rabelo, Rua Mata Machado), em maiúsculas espaçadas, e há as estações Maracanã e São Cristóvão com um ícone próprio.
- Estádio em 3D com luz: arquibancadas em degraus, com tons de cinza (claro) ou grafite (escuro) que escurecem do nível 1 ao 5; anel externo baixo, em corte, para a bacia aparecer inteira; e a cobertura translúcida, que some ao aproximar.
- Gramado verde dessaturado, com faixas de corte e linhas oficiais (105 × 68 m).
- Pílulas dos seis portões, com "UERJ" e "BELLINI" no A e no D.
- Câmera inicial com o eixo maior do campo na horizontal, 50° de inclinação e zoom que enquadra os seis portões na largura da tela. Zoom de 15,5 a 19,5. Limite de 600 m em volta do centro, estendido até 150 m além de cada estação (a São Cristóvão fica a uns 760 m).
- Sem internet, o fundo vira a cor lisa do tema e o estádio, os portões e as estações continuam completos (prints 09 e 10).
- Rótulos nas fontes do app (Schibsted Grotesk), desenhados localmente: funcionam sem internet. **Para o MapLibre nativo** será preciso gerar glyphs (PBF) dessas fontes e acrescentar `glyphs` ao estilo; o resto do estilo é o mesmo.
- A troca de tema não recarrega o mapa: só muda cores e imagens.

**Ainda abaixo das referências (para as próximas fases):**
- Os ícones dos pontos de interesse, os rótulos e o seletor de nível são da fase 3; sem eles o mapa parece mais vazio que os dois prints.
- O estádio ocupa menos da tela que nas referências, porque a câmera inicial mostra os seis portões. Na fase 3, com o seletor de nível, a câmera de cada nível aproxima.
- Arquibancadas sem a textura de fileiras e seções do SoFi. Na fase 3 as seções numeradas entram como linhas finas e rótulos no nível ativo.
- As rampas são extrusões planas (1,5 m): o MapLibre não desenha rampa inclinada.

## Fase 3: interação no mapa

Prints em [`screens/fase-3/`](screens/fase-3/), nos dois temas.

**Ajustes pedidos na aprovação da fase 2:**
- **Sem cobertura.** Ela tapava arquibancadas, banheiros e lojas.
- **Mais cara de Maracanã:**
  - a bacia agora tem um perfil único em toda a volta, com anel inferior, faixa de camarotes e anel superior, como o estádio real; antes, cada setor tinha a sua altura e os cantos ficavam em degraus;
  - a fachada ganhou a colunata dos 60 pilares, com a viga de coroamento por cima. Ela só aparece na visão geral.
- **"Onde você está?"** (pedido novo): o torcedor escolhe a área na linguagem do ingresso. São 12 áreas, entre elas Norte Inferior, Norte Superior, Leste Inferior, Leste Superior, Maracanã Mais e os camarotes. O bloco do assento, se a pessoa souber, define o nível: o 535 fica no nível 5. A área fica em vermelho e a câmera gira para que ela apareça embaixo, de frente para o campo, como quem está sentado ali. Os dados ficam em `levels.json` → `areas`.

**O que tem:**
- **Visão geral ("Estádio"):** o estádio inteiro em 3D, sem pontos.
- **Níveis 1, 2, 3 e 5:** o estádio baixa com uma animação curta, os outros níveis ficam translúcidos e aparecem só os pontos daquele nível. Escadas, escadas rolantes e elevadores aparecem em todos os níveis que conectam. Baixar o estádio é o que deixa cada ícone em cima do lugar certo: o mapa não sabe desenhar ícones no alto.
- **Ícones próprios para as 17 categorias:** círculo colorido com sombra e pictograma branco no mesmo traço, sem emoji e sem copo de cerveja. O vermelho fica só para seleção e para a área do usuário.
- **Aglomeração:** pontos próximos da mesma categoria viram um ícone com contador. O toque aproxima o mapa até separá-los.
- **Rótulos:** os nomes aparecem só de perto (zoom 18), sem sobreposição. Os números dos blocos aparecem no nível ativo.
- **Toques:** em um ponto (anel vermelho e nome), em uma arquibancada (setor em vermelho) e em um portão. Cada toque avisa o app pela ponte de mensagens (`map/web/protocol.ts`).
- **Filtros:** categorias escondidas pelo estado do estilo. A página de desenvolvimento tem "Banheiros" e "Acessibilidade".
- O estado do mapa (nível, área, seleção, filtros) é "global-state" do estilo: o código só muda valores, e o mesmo estilo serve ao MapLibre nativo.

**Ainda falta (próximas fases):**
- **Fase 4:** a interface no app. O seletor "Onde você está?" vira um botão no topo, e a folha inferior traz a busca, os chips, os cards e o selo "Posições aproximadas · demonstração". Os cartões da página de desenvolvimento são só para testar.
- **Fase 6:** a resposta "banheiro e bar mais perto da sua área", calculada pelo grafo de corredores (não em linha reta), com o tempo a pé.
- Os pontos continuam com posição aproximada (cinza no relatório da fase 1) até virem as plantas oficiais.

## Fase 4: integração no app

Prints do app em [`screens/fase-4/`](screens/fase-4/), nos dois temas. A `comparacao-referencias.png` põe lado a lado SoFi, Tottenham, a Home do app e o Modo Maracanã.

**Identidade (regra principal do CLAUDE.md):** a tela foi desenhada a partir das telas que já existem, não de um modelo de app de mapa.
- "Você está em" e os títulos do detalhe usam a Anybody grande, como "Rafael" e "Raça" na Home.
- Os campos (NÍVEL, PORTÃO, FILA AGORA, DAQUI) seguem os campos do ingresso.
- Os atalhos (Banheiros, Comer, Saúde…) têm o mesmo desenho dos atalhos da Home: ícone e rótulo com fio vertical, o ativo em vermelho.
- As listas usam linhas com fio fino, sem cards.
- Botões com raio 12. As etiquetas dos portões no mapa deixaram de ser pílulas e viraram retângulos de raio 8, como os selos.
- Os pictogramas são próprios e os mesmos no mapa, na lista e nos atalhos (caminhos SVG em `map/web/icons.ts`), sem ícones genéricos.
- O seletor de nível é uma coluna de números em Anybody, como o painel de um elevador, em vez da pílula "Level 6" do SoFi.

**O que tem:**
- O mapa 3D a tela inteira, numa WebView que roda no Expo Go, sem módulo nativo novo. O HTML vem embutido e funciona sem internet; só o mapa de base é online.
- **"Você está em"**: vem do ingresso de hoje (setor, bloco 118 → nível 1) ou da escolha da pessoa no seletor, por lado e anel, com o bloco opcional. "Limpar" volta ao estádio inteiro.
- **Folha inferior** com três alturas e arraste: busca com sinônimos ("wc", "lanche", "médico", "Bellini", "racismo"), atalhos que filtram o mapa, "Mais perto de você" (banheiro, comida, bebidas, posto médico e saída), portões com fila, como chegar e ajuda e denúncia com os telefones.
- **Detalhes** de ponto, setor ("Estou aqui") e portão (fila, setores, rota a pé no app de mapas). Ponto estimado mostra "Posição aproximada"; o topo da tela mostra "Posições aproximadas" sempre.
- **Tema** sincronizado com o app.
- **Coerência dos dados:** os portões da demonstração foram corrigidos para os apurados na fase 1 (A Oeste/UERJ, B e C Sul, D Leste/Bellini, E e F Norte). O ingresso, as ofertas de setor, o assistente e o mapa agora dizem o mesmo; um teste garante.
- A tela antiga (esquema SVG, abas "Como chegar" e "Filas") e o `react-native-maps` saíram. "Como chegar" e as filas estão na folha.

**Ainda falta:**
- **Fase 5:** a posição do usuário (GPS, "Você está fora do Maracanã") e a simulação para a demo.
- **Fase 6:** distâncias e "mais perto" pelos corredores, com tempo a pé e rota desenhada. Hoje as distâncias são em linha reta, a partir do centro da sua área.
- **Vista do seu lugar** e o estado "sem internet" com aviso: fase 7.
- **Expo Go:** os prints são da versão web do app (o mesmo código, com iframe no lugar da WebView). Falta conferir no celular.

## Fase 5: localização

Prints em [`screens/fase-5/`](screens/fase-5/), nos dois temas. O GPS real foi testado de ponta a ponta na versão web com uma posição falsa do navegador (`GEO="lat,lng,precisão"` em `map/tools/app-shots.ts`).

**O que tem:**
- **Pedido no momento certo:** a permissão só é pedida quando a pessoa toca em "Minha localização" (o botão de seta, abaixo de recentralizar). Antes do pedido do sistema aparece a explicação "Mostrar onde você está?", com "Agora não" e "Usar localização". A posição só é acompanhada com a tela aberta.
- **Você no mapa:** ponto vermelho com pulso suave (parado se o sistema pedir menos movimento) e o círculo de precisão real do GPS. Acima de 30 m de erro, a folha mostra "Localização aproximada · ±45 m". Em outro nível que não o ativo, o ponto fica apagado.
- **Nível:** vem da área (ingresso ou "Onde você está?"). Sem área, vale o nível escolhido no seletor, que fica guardado durante a sessão.
- **Mais perto de você:** dentro do estádio, passa a contar a partir da sua posição, e não do centro da área.
- **Avisos no topo da folha** (aparecem mesmo com ela recolhida):
  - "Você está fora do Maracanã", com a distância, o portão do ingresso (ou o mais perto) e "Como chegar ao Portão D", que abre o app de mapas de transporte, ou a pé quando falta menos de 1,5 km;
  - localização negada (com "Escolher setor" e "Abrir ajustes");
  - GPS desligado;
  - erro ao achar a posição.
- **Dentro ou fora:** conta a esplanada, as rampas (as monumentais saem dela) e a área junto aos portões (`isInside` em `src/services/stadium/query.ts`, com teste).
- **Simular localização (demonstração):** no painel escondido da Home (toque longo no cabeçalho) e também com um toque longo no título "Modo Maracanã". As opções são GPS real, No meu setor, Fora, e os portões de A a F. O Modo Maracanã reage na hora.
- As etiquetas dos portões agora ficam logo acima do ponto do portão, para o ponto (e você) ficar visível.

**Falta:**
- **Expo Go:** a explicação e o pedido de permissão do sistema precisam ser vistos no celular. Na web, o navegador faz o papel do sistema.
- **Fase 6:** tempo a pé e rota pelos corredores, a partir de você.

## Fase 6: mais perto e rotas

Prints em [`screens/fase-6/`](screens/fase-6/), nos dois temas.

**Correções no grafo da fase 1 (`map/tools/build-stadium.ts`):**
- **Escadas:** estavam ligadas umas às outras ao longo do anel, porque o agrupamento era pelo nome ("Escadas"). Agora cada escada liga só os níveis do próprio núcleo, e um teste garante.
- **Rampas:** cada nível ia direto ao pé da rampa, então ir do nível 1 ao 3 "descia até a esplanada e subia de novo". Agora a rampa é contínua (pé → 1 → 2 → 3 → 5) e cada trecho cobra só o que falta subir.

**O que tem** (`src/services/stadium/routing.ts`, genérico):
- **Tempo a pé:** 1,2 m/s no corredor. Rampa custa 25% a mais, escada 70% a mais e mais 8 s, e elevador soma 45 s de espera.
- **Menor caminho** (Dijkstra) pelo grafo de corredores, entre níveis.
- **Origem:** você (GPS ou simulação, dentro do estádio), senão o seu lugar (setor e nível do bloco do ingresso), senão o portão do ingresso.
- **"Mais perto de você"** pelo caminho de verdade, com o tempo a pé. **"Perto do seu portão"** para quem ainda vai entrar. A busca também ordena pelo tempo a pé.
- **"Como chegar"** no detalhe de cada ponto abre a rota:
  - o tempo em destaque (número em Anybody) e a distância;
  - a chave "Sem escadas", só com rampas e elevadores, que nunca usa escada (testado para todos os pontos);
  - os passos numerados ("Siga pelo corredor do nível 1", "Suba a Rampa D até o nível 3", "Pegue o elevador E5 até o nível 5", "Banheiros à direita"). Tocar num passo mostra o nível dele.
- **No mapa:** linha vermelha tracejada, andando na direção do destino, com contorno. O trecho de outro nível fica apagado, e a câmera enquadra o caminho inteiro acima da folha.
- O "NÍVEL" do "Você está em" agora é o do seu lugar, não o nível que está na tela.

**Limites:**
- O grafo é aproximado, como as posições, até termos as plantas oficiais. Os tempos são estimativas.
- A rota não segue você andando (recalcular pelo GPS em movimento): fica para quando houver posicionamento interno confiável.
