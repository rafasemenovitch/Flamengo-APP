# Flamengo App (conceito)

Aplicativo conceito para a torcida do Flamengo: jogos, ingressos, Modo Maracanã, conteúdo,
comunidade, gamificação, loja, sócio-torcedor e Assistente Fla. Feito para apresentação
comercial, com **dados 100% demonstrativos** e sem nenhum material oficial do clube.

Base técnica e estética reaproveitadas do app Zuno (auditoria em [docs/ZUNO_AUDIT.md](docs/ZUNO_AUDIT.md)).

## Como rodar

Requisitos: Node 20+ e o app **Expo Go** atualizado (SDK 58) no celular, ou um simulador iOS/Android.

Em redes de empresa/faculdade que isolam aparelhos, use `npm start -- --tunnel`.

```bash
npm install            # instala as dependências
cp .env.example .env   # EXPO_PUBLIC_DATA_SOURCE=demo
npm start              # abre o Metro; leia o QR com o Expo Go
npm run typecheck      # checagem de tipos
```

## Stack

Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript strict · React Navigation 7 ·
`Animated` nativo (respeita "reduzir movimento") · react-native-svg · expo-linear-gradient.
Fontes: Inter (texto) e Barlow Condensed (títulos e placares), licença OFL, em `assets/fonts`.

## Estrutura

```
App.tsx                     # fontes, tema, alertas e navegação
assets/
  brand/                    # ÚNICO lugar para escudo, logo, mascote e fotos licenciadas (hoje: placeholders)
  fonts/
src/
  design-system/
    tokens/                 # cores (claro/escuro), tipografia, espaçamento, movimento
    theme/                  # ThemeProvider (escuro como padrão), makeStyles
    components/             # Button, Card, Badge/DemoBadge, LiveIndicator, Skeleton, Screen, AlertHost...
  navigation/               # 5 abas + stack raiz com as rotas internas + FAB do Assistente
  features/
    home/  matches/  tickets/  nation/  profile/  assistant/  content/
  services/
    adapters/               # interfaces de cada domínio (contrato da UI)
    mock/                   # implementações demonstrativas
    live/                   # integrações reais (ainda não implementadas)
    index.ts                # escolhe mock ou live por EXPO_PUBLIC_DATA_SOURCE
  data/demo/                # seeds; nomes de jogadores, adversários e números ficam em seed.ts
  hooks/                    # useAsync (loading/erro/refresh), useReduceMotion
  types/                    # modelos de domínio
  utils/                    # formatação pt-BR (datas, moeda, contagem regressiva)
```

## Como trocar o mock por uma API real

1. Implemente a interface do domínio de `src/services/adapters` num arquivo em `src/services/live`
   (ex.: `live/matches.ts` implementando `MatchesService`).
2. Registre-a em `createLiveServices()` (`src/services/live/index.ts`).
3. Rode com `EXPO_PUBLIC_DATA_SOURCE=live`.

A UI só conhece `services` e as interfaces, então nenhuma tela muda. Dá para migrar um domínio
por vez: compondo `createMockServices()` com as partes já reais.

O **Assistente** segue uma regra para qualquer implementação (FAQ local hoje, LLM depois):
responder apenas com base em informação oficial disponível, citar as fontes e dizer quando não
sabe (`grounded: false`).

## O que é demonstrativo

Tudo no modo `demo`. Na interface, os itens simulados levam o selo **DEMO**:

- Placar ao vivo, eventos, escalações e estatísticas (cenário controlável: pré-jogo, dia de jogo, ao vivo e pós-jogo)
- Elenco (**jogadores fictícios**), classificação e resultados
- Ingressos, QR Codes (marca d'água "DEMONSTRATIVO", não escaneáveis como ingresso) e carteira
- Checkout da loja e de ingressos: nunca pede dados de cartão e termina em "Compra simulada"
- Carteirinha e benefícios do Sócio-Torcedor
- Pontos, rankings, medalhas, bolões, quizzes e enquetes (pontos virtuais, **sem apostas**)
- Mapa do Maracanã: esquema vetorial próprio, não é planta oficial
- Notícias, vídeos e imagens (degradês de placeholder)
- Escudo: forma genérica de placeholder (troque em `assets/brand/index.ts`)

## Status

- [x] Fase 0: auditoria do Zuno
- [x] Fase 1: fundação (design system, serviços, dados demo e navegação completa)
- [ ] Fase 2: Home completa
- [ ] Fase 3: abas Jogos, Ingressos, Nação, Perfil e Assistente
