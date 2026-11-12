# Maracanã: fontes e reconciliação dos dados

Dados **demonstrativos** até termos as plantas oficiais. Todo setor, portão, rampa e ponto tem `source` (ids abaixo) e `confidence`:

- **confirmado**: duas ou mais fontes independentes concordam.
- **fonte_unica**: uma fonte oficial, sem contradição.
- **estimado**: posição inferida, com o método em `note`.

Os arquivos desta pasta são gerados por `npm run map:data` (`map/tools/build-stadium.ts`), a partir de `map/tools/sources/`. Não edite os `.geojson` à mão: corrija a fonte ou a regra no script e gere de novo.

## Fontes

| id | Fonte | Data | Uso |
|---|---|---|---|
| `manual2019` | [Manual da Instalação do Complexo do Maracanã (Anexo X), Gov. RJ](https://www.rj.gov.br/casacivil/sites/default/files/arquivos_paginas/13.Anexo%20X%20-%20Manual%20de%20Instala%C3%A7%C3%A3o_0.pdf) | 2019 | Níveis, rampas, portões, setores (Figs. 8, 9, 12, 21), elevadores (Fig. 10), escadas rolantes (Fig. 11), gramado (Fig. 16), concessões (Figs. 68–71), estacionamentos |
| `escopo2019` | [Guia de Escopo Operacional (Anexo XI), Gov. RJ](https://www.rj.gov.br/casacivil/sites/default/files/arquivos_paginas/14.Anexo%20XI%20-%20Guia%20de%20Escopo%20Operacional_0.pdf) | 2019 | Totais de banheiros (292), bares (60), elevadores e escadas rolantes, postos médicos |
| `nfl2026` | [NFL Brazil Game 2026: guia de acessibilidade](https://www.nfl.com/international/games/rio/event-info/accessibility-guide) | set/2026 | Elevadores no Oeste, banheiros acessíveis, salas sensoriais (501 e 511), atendimento, resolução de ingressos, estacionamento acessível |
| `lance2024` | [Lance!: como chegar e onde fica cada portão](https://www.lance.com.br/lancepedia/maracana-como-chegar-portao.html) | 26/10/2024 | Rua e estação de cada portão |
| `ingressos2025` | [Ingressos Flamengo x Vasco, Brasileirão 2025 (site do Vasco, via NetVasco)](https://www.netvasco.com.br/n/369272/informacoes-sobre-ingressos-para-Flamengo-x-vasco) | 15/09/2025 | Setores vendidos e portão de cada setor; acesso por biometria facial |
| `ingressos2023` | [Lance!: ingressos Flamengo x Vasco](https://www.lance.com.br/flamengo/flamengo-x-vasco-veja-informacoes-sobre-ingressos-para-estreia-de-tite-no-maracana.html) | 11/10/2023 | Nomes dos setores vendidos pelo Flamengo |
| `alerj2026` | [Alerj: Lei 10.773/25 prevê postos de apoio às mulheres vítimas de assédio em estádios](https://www.alerj.rj.gov.br/Visualizar/Noticia/85362) | 06/06/2026 | Posto de atendimento a vítimas de violência de gênero no estádio |
| `mprj2025` | [MPRJ leva Ouvidoria ao Maracanã e reforça combate ao racismo](https://www.mprj.mp.br/web/guest/visualizar?noticiaId=179306) | 15/05/2025 | Como denunciar racismo: segurança do estádio, PM, promotor de plantão (GAEDEST), Ouvidoria pelo 127 |
| `agbrasil2025` | [Agência Brasil: torcedor preso por gestos racistas no Maracanã](https://agenciabrasil.ebc.com.br/direitos-humanos/noticia/2025-05/torcedor-chileno-e-preso-apos-gestos-racistas-em-jogo-no-maracana) | 15/05/2025 | Batalhão Especial de Policiamento em Estádios; Juizado Especial do Torcedor; Centro de Comando e Controle |
| `cnn2023` | [CNN Brasil: posto do Juizado do Torcedor no Maracanã](https://www.cnnbrasil.com.br/nacional/justica-mantem-torcedora-argentina-presa-por-caso-de-injuria-racial-no-maracana/) | 22/11/2023 | Existência do posto do Juizado do Torcedor e dos Grandes Eventos (TJ-RJ) no estádio |
| `gov-canais` | [Governo Federal: Ligue 180](https://www.gov.br/mulheres/pt-br/ligue180) e Disque 100 | 11/11/2026 | Canais nacionais de atendimento à mulher e de denúncia de discriminação |
| `osm` | [OpenStreetMap](https://www.openstreetmap.org/relation/4587734) via Overpass API (© OpenStreetMap contributors, ODbL) | 11/11/2026 | Contorno do estádio, gramado, as 6 rampas ("Acesso A - Oeste" … "Acesso F - Norte"), estátua do Bellini, estações, entradas de estacionamento |

Os PDFs e as páginas convertidas em imagem não ficam no repositório. Para conferir, baixe pelos links e procure a legenda da figura.

**Mapa de base:** [OpenFreeMap](https://openfreemap.org). Uso comercial permitido pelo FAQ oficial, sem chave e sem limite de acessos. Atribuição obrigatória: "OpenFreeMap © OpenMapTiles Data from OpenStreetMap". Os termos de serviço foram lidos em 11/11/2026, na versão de 14/10/2026.

## Como a geometria foi montada

- **Referencial:** origem no centro do gramado do OSM; `u` no eixo maior (+Norte), `v` no eixo menor (+Leste). O eixo maior aponta para **31,1°**: o Norte fica do lado da Radial Oeste, o Leste do lado da Av. Maracanã.
- **Gramado:** 105 × 68 m (manual, Fig. 16), alinhado ao polígono do OSM, que mede 104,4 × 67,9 m. As linhas do campo seguem a regra: área de 16,5 m, pequena área de 5,5 m, pênalti a 11 m, círculo de 9,15 m.
- **Frente da arquibancada:** 6,5 m da linha lateral (manual, tabela 2) e cerca de 22 m atrás dos gols (Fig. 21). A forma é uma superelipse.
- **Fachada:** anel externo do OSM, sem as rampas monumentais e suavizado.
- **Anel de circulação de cada nível:** recuo da fachada pela mediana das concessões do manual:
  - nível 1: 39 m;
  - nível 2: 33 m;
  - nível 3: 27 m;
  - nível 5: 25 m (pelas concessões do "nível 4", que atendem as cativas).
- **Fundo da arquibancada:** fachada menos 30 m. Isso combina com as concessões e com a Fig. 21, que põe o fundo da arquibancada Leste a cerca de 63 m da linha lateral.
- **Faixas por nível:** frações radiais medidas na Fig. 21.
  - Norte e Sul: N1 de 0 a 0,43; N2 de 0,45 a 0,76; N5 de 0,76 a 1.
  - Leste: N1 de 0 a 0,43; camarotes N2 de 0,45 a 0,52; N3 de 0,52 a 1.
  - Oeste: N1; camarotes N2; camarotes e tribuna N3; cativas N5 de 0,6 a 1.
- **Altura da bacia (3D):** um perfil único pela profundidade da faixa, igual em toda a volta, como a bacia real do Maracanã:
  - anel inferior até 11 m;
  - faixa de camarotes a cerca de 14 m;
  - anel superior de 17 m a 31 m.
  É uma aproximação visual pelos cortes do manual (Figs. 14 e 15), não um levantamento.
- **Colunata:** 60 pilares nos eixos estruturais P00–P59 (Fig. 10), a cada 6°, com uma viga de coroamento a 28,5–31 m. A seção dos pilares (~2,4 × 3 m) é estimada. A cobertura existe nos dados, mas não é desenhada no mapa, porque esconderia arquibancadas e pontos.
- **Áreas do "Onde você está?":** lado + inferior/superior/camarote/premium, agrupando os setores acima. Norte Superior e Sul Superior ocupam os níveis 2 (blocos 2xx) e 5 (blocos 5xx); sem o bloco, o mapa mostra o nível 2.
- **Lados por ângulo:** Norte de −50° a 50°, Leste de 50° a 130°, Sul de 130° a 230°, Oeste de 230° a 310°.
- **Blocos:** numerados no sentido anti-horário, como na sinalização (Fig. 8). O primeiro algarismo é o nível (manual, p. 29).
  - 101–130 no nível 1;
  - 201–218 (Sul) e 219–238 (Norte) no nível 2;
  - 301–313 (Leste) no nível 3;
  - 501–511 (Oeste, sem o 506), 512–529 (Sul) e 530–547 (Norte) no nível 5.
- **Concessões:** as 73 manchas das Figs. 68–71 foram detectadas automaticamente. Cada planta foi calibrada pelo gramado desenhado: centro do círculo central, linhas de fundo e laterais, e escala de 0,95 a 1,0 px/m. O resultado está em `map/tools/sources/concessoes-manual-2019.json`.

## Reconciliação das divergências

| Dado | Fonte 1 | Fonte 2 | Fonte 3 | Decisão | Motivo |
|---|---|---|---|---|---|
| Pontos de alimentação | Manual, cap. 6: **74** concessões | Guia de Escopo: **60** bares | Figs. 68–71: **73** manchas (N1 30, N2 32, N3 9, N4 2) | Posições das **73** manchas, mais 8 `estimado` no nível 5 Norte e Sul | As figuras batem com o 74 do texto (duas manchas coladas viram uma). O 60 do Guia deve contar só bares, ou uma operação posterior. O nível 5 Norte e Sul não tem planta. |
| Rampa da UERJ × do Bellini | Manual, p. 13: "Bellini (**A**) e UERJ (**D**)" | Manual, Figs. 12 e 21 e tabelas p. 30–31: **Portão A (UERJ)**, **Portão D (Bellini)** | OSM: Estátua do Bellini a leste do estádio, junto ao "Acesso D - Leste" | **A = UERJ (Oeste)**, **D = Bellini (Leste)** | Duas figuras e as tabelas do próprio manual, mais a geografia do OSM, contra uma frase do texto. |
| Letras dos portões × rampas | Manual, Figs. 8 e 21: a mesma letra no portão e na rampa | OSM: "Acesso A - Oeste" … "Acesso F - Norte" | Lance! (ruas) e ingressos 2025 (Sul B/C, Leste D, Oeste e Maracanã Mais A) | **Mesma letra.** Portão X = Rampa X | Quatro fontes concordam. É a nomenclatura dos ingressos do Flamengo. |
| Nível da Leste Superior | Manual, p. 14: nível 3 tem "Arquibancada Leste"; blocos **3**01–313 | Manual, tabela do Portão D: "2 · cadeira superior" | — | **Nível 3** | O texto dos níveis e a numeração dos blocos concordam; a tabela simplifica. |
| Banheiros químicos acessíveis Norte e Sul | Guia NFL | — | — | **Não incluídos** | Montados para o evento da NFL; podem não existir em jogo de futebol. Os acessíveis fixos (Leste e Oeste) entram. |
| Postos médicos | Guia de Escopo: **8 postos médicos** (médico, enfermeiro e técnico, com ambulância tipo D) e **9 ambulâncias**, em todos os níveis; casos graves vão a hospital de referência | Manual: centro médico no térreo, ambulatório no nível 1 | — | 8 postos, `estimado` (ambulatório no N1 Oeste; os outros distribuídos) | Quantidade confirmada pelo Guia; não há planta com as posições. O hospital de referência não é nomeado. |
| Juizado do Torcedor | Guia de Escopo: sala do JECrim no **térreo, Setor Norte, perto do Acesso E** | CNN 2023: "posto do Juizado do Torcedor no estádio" | Agência Brasil 2025: audiência de custódia no Juizado Especial do Torcedor | Ponto `fonte_unica` junto ao Acesso E | A existência tem 3 fontes; a posição, só o Guia. |
| Acolhimento à mulher (assédio, importunação) | Lei estadual 10.773/25: postos avançados de atendimento a vítimas de violência de gênero nos estádios | Alerj (jun/2026): vistoria ainda ia verificar onde fica o posto no Maracanã | — | Ponto `estimado` junto ao Juizado, mais canais Ligue 180 e 190 | A lei existe, mas o local no Maracanã não foi divulgado. |
| Racismo e discriminação | MPRJ (2025): acionar a segurança do estádio, a PM ou o promotor de plantão; Ouvidoria pelo 127 | Agência Brasil (2025): a segurança aciona o Batalhão Especial de Policiamento em Estádios | Governo Federal: Disque 100 | Canais em `venue.json` (`help`), mais pontos de segurança `estimado` | São canais, não um local fixo; o app vai mostrar um card "Preciso de ajuda". |
| Policiamento | Manual: GEPE na operação; sala de segurança patrimonial no térreo Norte (uso interno) | Agência Brasil 2025: Batalhão Especial de Policiamento em Estádios | — | 2 postos policiais `estimado` (rampas A e D) e 4 pontos "Segurança do estádio" no nível 1 | Sem posição pública dos postos. |
| Elevadores | Manual, Fig. 10: 17 (15 públicos), por eixo de pilar | Guia de Escopo: 17 elevadores | Guia NFL: elevadores no lado Oeste | Contagem `confirmado`; posições `estimado` pelo pilar | A suposição de 60 eixos iguais a partir do Oeste deixa E1–E8 no Oeste (bate com a NFL) e E9–E12 simétricos no Leste. **E16 e E17 (P15)** dependem do sentido da numeração: ficaram no Sul. |
| Escadas rolantes | Manual, Fig. 11: 8, por pilar | Guia de Escopo: 8 | — | Contagem `confirmado`; posições `estimado` | Mesmo método dos elevadores. |
| Banheiros | Guia de Escopo: 292 banheiros em 5 níveis | — | — | Ícones de **blocos** de banheiros no anel de cada nível, `estimado` | Não existe mapa público com a posição de cada banheiro. |
| Dimensões do gramado | Manual: 105 × 68 m | OSM: 104,4 × 67,9 m | — | 105 × 68, orientação do OSM | Diferença menor que a precisão do OSM. |
| Setor visitante | Ingressos 2025: Sul | Ingressos 2023: Sul | Manual, Fig. 12: "Setor Visit." no Sul | Sul `visitor: true` | Pode mudar por jogo. |
| Rampa D e nível 5 | Manual, Fig. 21: "a rampa da Leste D também dá acesso ao Nível 5 no Setor Norte e Sul" | Ingressos 2025: "Setor Sul nível 5: Portão D" | — | D leva ao anel do nível 5 | Duas fontes. |
| Loja | Manual: lojas e quiosques temporários em áreas de grande movimento | Busca (nov/2026): sem loja oficial fixa do Flamengo no estádio | — | 2 quiosques `estimado`, na Rampa A e na Rampa D | Sem confirmação de loja fixa. |

## Limitações conhecidas

- Não consultei Street View nem vídeos. A posição das rampas e da estátua veio do OSM.
- Não achei notícia de mudança de setores, bares ou portões depois da concessão à Fla-Flu Serviços (2024–2026). Os portões de cada setor variam por jogo.
- Alturas das arquibancadas e da cobertura são aproximadas, só para a leitura em 3D.
