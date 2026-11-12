# Flamengo App (conceito)

Aplicativo conceito para a torcida do Flamengo: jogos, ingressos, Modo Maracanã, conteúdo,
comunidade, gamificação, loja, sócio-torcedor e Assistente Fla. Feito para apresentação
comercial, com **dados 100% demonstrativos** e sem nenhum material oficial do clube.

Base técnica e estética reaproveitadas do app Zuno (auditoria em [docs/ZUNO_AUDIT.md](docs/ZUNO_AUDIT.md)).

## Ver no celular (QR Code fixo)

<img src="QR-CODE-ACESSO-EXPO-GO/QR-CODE-EXPO-GO.png" width="260" alt="QR Code do app no Expo Go">

Escaneie com o **Expo Go**, logado numa conta membro da organização `flamengo-app` no Expo.
Instruções: [QR-CODE-ACESSO-EXPO-GO](QR-CODE-ACESSO-EXPO-GO/README.md).

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

Expo SDK 58 · React Native 0.88 · React 19.3 · react-native-maps · expo-location · expo-camera · TypeScript strict · React Navigation 7 ·
`Animated` nativo (respeita "reduzir movimento") · react-native-svg · expo-linear-gradient.
Fontes: Schibsted Grotesk (texto) e Anybody (títulos e placares), licença OFL, em `assets/fonts`.

## Login com Supabase

O login por e-mail/senha e o cadastro ficam depois da primeira tela de boas-vindas.
Também é possível entrar como visitante, com o mesmo acesso ao conteúdo demonstrativo.
Configuração do projeto, chaves públicas e confirmação por código: [guia do Supabase](docs/SUPABASE.md).

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
- Carteirinha do Sócio-Torcedor (selo DEMO). Os **planos do programa Nação são reais**: nomes, prioridades, descontos e convidados. Os valores de referência foram pesquisados em nov/2026; Maraca 2 e Maraca 3 são estimados. As fontes estão em `src/data/demo/commerce.ts`
- Pontos, rankings, medalhas, bolões, quizzes e enquetes (pontos virtuais, **sem apostas**)
- Mapa do Maracanã: esquema vetorial próprio, não é planta oficial. No "Como chegar", as posições de portões e estações são aproximadas, mas as rotas são reais (Google/Apple Maps)
- Filas por portão (simuladas) e cadastro facial (simulado; a foto fica só no aparelho)
- Notícias, vídeos e imagens (degradês de placeholder)
- Escudo: forma genérica de placeholder (troque em `assets/brand/index.ts`)

## Status

- [x] Fase 0: auditoria do Zuno
- [x] Fase 1: fundação (design system, serviços, dados demo e navegação completa)
- [x] Fase 2: Home completa (card de jogo em 3 estados, seletor de cenário em dev, atalhos, banner do Modo Maracanã, notícias, FlaTV, Para você, classificação, palpite, enquete e quiz)
- [x] Fase 3: Jogos, Ingressos + Modo Maracanã, Nação (loja, sócio, gamificação, rankings, Passaporte, comunidade), Perfil, Configurações e Assistente Fla

### Roteiro de demonstração
0. Primeira abertura: boas-vindas → login/cadastro ou visitante → ídolos → alertas (rever em Perfil → Configurações → Rever boas-vindas).
1. Home: **toque e segure a saudação** ("Boa tarde, Rafael") para abrir os controles escondidos da demonstração e alternar entre pré-jogo, dia de jogo, ao vivo e pós-jogo.
   No modo **Ao vivo**, o relógio avança (1 min de jogo a cada 4 s) e o 3º gol, aos 83', dispara o alerta de gol.
2. Comprar ingresso: escolha o setor no mapa → "Compra simulada" → carteira com QR DEMONSTRATIVO → **cadastro facial** (câmera frontal; a foto não sai do aparelho).
3. Modo Maracanã (aberto a todos, sem ingresso): mapa interativo (toque em setores, portões e serviços; camadas de banheiros, alimentação etc.), **Como chegar** com mapa real, sua localização, a melhor estação e o melhor portão, e rota no Google/Apple Maps, além de **Filas agora**.
4. Assistente Fla (botão vermelho): "Qual portão do meu setor?", "Quando é o próximo jogo?", e algo fora da base para ver o "não sei".
5. Perfil: favorite jogadores e veja o "Para você" da Home mudar.
