# Modo Maracanã: mapa 3D do estádio

Reconstrução do Modo Maracanã como mapa geográfico real (MapLibre GL JS em WebView), com o estádio em 3D. O padrão de qualidade são os apps do SoFi Stadium e do Tottenham Hotspur Stadium (`referencias/`). Plano aprovado: [`plano.md`](plano.md).

## Fases

| Fase | Conteúdo | Situação |
|---|---|---|
| 1 | Pesquisa e dados | **Entregue, aguardando aprovação** |
| 2 | Mapa isolado no navegador: estilos, 3D, gramado, portões, câmera | — |
| 3 | Interação: níveis, ícones, rótulos, toques, ponte de mensagens | — |
| 4 | Integração no app (WebView, folha inferior, busca, cards) | — |
| 5 | Localização (GPS, fora do estádio, simulação para demo) | — |
| 6 | Mais perto e rotas (grafo, modo acessível) | — |
| 7 | Acabamento (vista do lugar, animações, estados, desempenho) | — |

## Onde está cada coisa

- **Dados:** `assets/stadiums/maracana/`, gerados por `npm run map:data`. Fontes e divergências no [`SOURCES.md`](../../assets/stadiums/maracana/SOURCES.md).
- **Entradas da geração:** `map/tools/sources/` (extrato do OSM e concessões das plantas do manual).
- **Gerador:** `map/tools/build-stadium.ts`.
- **Relatório visual:** `npm run map:dev` e depois http://localhost:8787/map/dev/report.html. Parâmetros: `?level=1|2|3|5|all`, `&graph=1`, `&zoom=`.
- **Prints:** `npm run map:shots -- <fase>`, salvos em `screens/fase-<n>/`. Usa o Chrome instalado; se ele estiver em outro lugar, defina `CHROME_PATH`.
- **Tipos genéricos de estádio:** `src/services/stadium/types.ts`.
- **Teste de integridade:** `src/__tests__/stadiumData.test.ts`, que roda no `npm run check`.
