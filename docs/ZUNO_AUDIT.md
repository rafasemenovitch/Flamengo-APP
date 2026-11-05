# Auditoria do Zuno — base para o App do Flamengo

> Fase 0. Fonte auditada: `~/Developer/ZUNO/Código/app` (app mobile), commit `d4a33b5`.
> `partner-web/`, `marketing/` e `supabase/` foram olhados só de passagem: não entram no app do torcedor.
> **Nada foi modificado no repositório do Zuno.**

---

## 1. Stack e infraestrutura

| Item | Zuno |
|---|---|
| Framework | **React Native 0.86.3 + Expo SDK 57** (managed, `expo/AppEntry.js`) |
| React | 19.2.3 |
| Linguagem | TypeScript ~6.0, `strict: true`, alias `@/*` → `src/*` |
| Gerenciador de pacotes | npm (`package-lock.json`); Node 24.21 / npm 11.19 na máquina |
| Navegação | React Navigation 7 (`native-stack` + `bottom-tabs`), `navigationRef` global |
| Estado | React Context: `AuthContext` (sessão), `AppDataContext` (todos os dados, ~880 linhas), `ZikoContext` (mascote/tour) |
| Estilização | `StyleSheet.create` + tokens em `src/theme/` (sem lib de UI) |
| Ícones | `@expo/vector-icons` (Ionicons) |
| Fontes | `@expo-google-fonts/baloo-2` (display) + fonte do sistema |
| Animação | API `Animated` nativa do RN (`useNativeDriver: true`), sem Reanimated. Respeita "reduzir movimento" via `useReduceMotion` |
| Gráficos/SVG | `react-native-svg` (máscara do tour); gráfico de peso feito só com Views |
| Backend | Supabase (Postgres + Auth + Storage + Realtime), cliente em `services/supabase.ts` |
| Auth | Supabase Auth + `AsyncStorage` |
| Outros | `expo-linear-gradient`, `expo-image-picker`, `expo-document-picker`, `expo-clipboard`, `netinfo`, `datetimepicker`, `webview`, deep links (`zuno://`) |
| Testes | **Nenhum** |
| Lint/format | Script `lint` existe, mas **ESLint e Prettier não estão instalados** |
| Build | Expo Go / `expo start`; sem `eas.json` |

## 2. Design system

| O quê | Onde | Observação |
|---|---|---|
| Cores | `src/theme/colors.ts` | Objeto `colors` com nomes semânticos (`background`, `surface`, `primary`, `primaryAction`, `text`, `textMuted`, `warning*`, `danger*`, `success`, `border`, `overlay`, cores de medalha). Comentários documentam contraste. **Só tema claro.** |
| Cores de categoria | `src/theme/categoryColors.ts` | Paleta pastel por categoria + `categoryBadgeStyle()` |
| Espaçamento e raios | `src/theme/spacing.ts` | `spacing` 4/8/16/24/32 · `radius` 8/16/24/pill. Cantos bem arredondados (referência Duolingo/Instagram) |
| Tipografia | `src/theme/typography.ts` | Só 2 tokens (`display`, `displaySemiBold` = Baloo 2). Tamanhos e pesos ficam soltos em cada tela |
| Sombras | não há tokens | Cards usam borda de 1px em vez de sombra |
| Tema escuro | **não existe** | `userInterfaceStyle: "light"`, nenhum `useColorScheme` |

**Na prática**, o que dá ao Zuno a "sensação de qualidade" é: cantos generosos (16–24), cards tingidos (cor com alpha `1C`/`26` + borda com alpha `33`), boa respiração (16/24), um único acento forte de cor, micro-animações com spring e cópia cuidada em português.

## 3. Inventário de componentes

Legenda: ✅ reaproveitável direto · 🔧 reaproveitável com adaptação · ❌ não serve

| Componente | Caminho | O que faz | Veredito |
|---|---|---|---|
| `AppHeader` | `components/AppHeader.tsx` | Wordmark + botão de configurações | 🔧 vira o header da Home (saudação, badge de nível, sino) |
| `StatusPill` | `components/StatusPill.tsx` | Pílula de status com tons | ✅ base do `Badge` (incluindo selo **DEMO** e **AO VIVO**) |
| `FormField` | `components/FormField.tsx` | Input com label e botão "Concluir" no teclado numérico | ✅ |
| `PasswordField` | `components/PasswordField.tsx` | Senha com olho | ✅ |
| `PhoneField` | `components/PhoneField.tsx` | Telefone com máscara | ✅ (perfil) |
| `DateField` | `components/DateField.tsx` | Seletor de data | 🔧 (perfil: data de nascimento) |
| `FolderCard` | `components/FolderCard.tsx` | Card tingido com ícone, título e contagem | 🔧 vira `ShortcutCard` (atalhos rápidos da Home) |
| `PetStoriesRow` | `components/PetStoriesRow.tsx` | Linha de avatares no estilo stories | 🔧 jogadores favoritos / stories da FlaTV |
| `PetAvatar` / `PetAvatarPicker` | `components/` | Avatar com cor e foto ou mascote | 🔧 `Avatar` genérico (torcedor, jogador) |
| `WeightChart` | `components/WeightChart.tsx` | Sparkline interativa feita com Views | 🔧 forma recente do time / evolução de pontos |
| `WeightCheckInModal` | `components/` | Modal com ação rápida | 🔧 padrão de bottom sheet simples |
| `VaccineCard` | `components/` | Card de item com status de vencimento | ❌ domínio pet (o padrão visual serve de referência) |
| `TempAccessBanner` | `components/` | Faixa global no topo | 🔧 faixa "Modo demonstração" / "Jogo hoje" |
| `ZikoPopup` + `PopupHost` | `ziko/` | Modal animado com fila por prioridade, deduplicação e intervalo mínimo | 🔧 **muito bom**: tirar o mascote e virar `AlertHost` (gol, início de jogo, conquista) |
| `ZikoEmptyState` | `ziko/ZikoEmptyState.tsx` | Estado vazio/erro com ilustração e CTA, versão compacta | 🔧 `EmptyState` / `ErrorState` com ícone no lugar do mascote |
| `ZikoLoadingScreen` | `ziko/` | Splash de carregamento | 🔧 splash com o escudo placeholder |
| `CoachMarks` | `ziko/CoachMarks.tsx` | Tour guiado com recorte via máscara SVG | 🔧 tour do primeiro acesso (opcional, fase futura) |
| `IntroCarousel` | `ziko/IntroCarousel.tsx` | Carrossel de onboarding paginado | 🔧 onboarding (escolha de ídolos e preferências) |
| `StreakFlame` / `StreakAura` | `ziko/` | Ícone pulsante com "pop" em marcos | 🔧 base do **indicador AO VIVO pulsante** e da sequência de presença no Passaporte |
| `MedalBadge` + `catalog.ts` | `medals/` | Medalha colorida ou bloqueada, catálogo tipado, a11y | 🔧 **medalhas do Passaporte Rubro-Negro** (trocar imagens e critérios) |
| `MedalGalleryScreen` | `screens/Perfil/` | Grade de conquistas por grupo | 🔧 galeria de medalhas |
| `useReduceMotion` | `ziko/useReduceMotion.ts` | Hook de "reduzir movimento" | ✅ |
| `NetworkStatusWatcher` | `ziko/` | Aviso de offline | 🔧 (tirar a dependência do Ziko) |
| Ziko (mascote, poses, cópia) | `ziko/Ziko.tsx`, `poses.ts`, `copy.ts` | Mascote dragão com poses | ❌ identidade do Zuno |

**Não existem no Zuno** e precisam ser criados: `Button` (os botões são estilos soltos em cada tela), `Card` genérico, `Skeleton`, `Toast`, `BottomSheet` de verdade, `Carousel` horizontal com snap, `SegmentedControl`/abas internas, `ScoreBoard`, `Countdown`, `QRCode`, `SectionHeader`, FAB.

## 4. Funcionalidades prontas → app do Flamengo

| Zuno | Estado no Zuno | Vira no Flamengo |
|---|---|---|
| Welcome / Criar conta / Login / Esqueci senha (`screens/Auth`) | Funcional (Supabase Auth) | **Login e cadastro do torcedor**; no mock, sessão local |
| Configurações / Editar conta (`screens/Settings`) | Funcional, com `Switch` | **Perfil → Configurações, notificações e privacidade** |
| Home com seções, cards tingidos e agenda | Funcional | Padrão de seções da **Home** (o conteúdo é todo novo) |
| Lembretes por popup (`ziko/reminders.ts`) | Lembretes **in-app**, sem push (não há `expo-notifications`) | Lógica de priorização → **alertas de gol, início e fim de jogo** (in-app agora; push depois) |
| Sequência + 29 medalhas (`ziko/achievements.ts`, `medals/`) | Funcional (medalhas ainda em stub) | **Gamificação / Passaporte Rubro-Negro**: níveis, medalhas, sequência de presença |
| Loja → Carrinho → Confirmação (`screens/Loja`) | Mock local, stepper, total | **Loja**: carrinho e **checkout simulado** (termina em "Compra simulada") |
| Mensagens / ChatThread (`screens/Mensagens`) | Chat local com bolhas e teclado | **Assistente Fla**: a UI de chat serve de base |
| Cartão de emergência (`EmergencyCardScreen`) | Card "carteirinha" | **Carteirinha do Sócio-Torcedor** e visual do ingresso |
| Compartilhar perfil (permanente/temporário, deep link) | Funcional | Compartilhar ingresso ou convite de grupo (fase futura) |
| Mapa de lojas | **Não existe** (só coordenadas no mock) | Modo Maracanã: esquema vetorial próprio em SVG (sem lib de mapas) |
| Onboarding em carrossel | Funcional | Onboarding (ídolos favoritos e interesses alimentam o "Para você") |

## 5. Padrões de arquitetura que vale manter

- `strict` + alias `@/`, tipos de domínio em `src/types/`.
- Um navigator por aba (`XStackNavigator`) + `types.ts` central com `ParamList` e `ScreenProps<T>` tipados.
- Root com troca auth/app (`RootNavigator`) e modais no stack principal.
- Hosts globais (`PopupHost`, `CoachMarksHost`) acima do provider de dados, para que a camada de dados também consiga disparar alertas.
- Cópia de texto centralizada (`ziko/copy.ts`) e catálogos tipados (`medals/catalog.ts`).
- Flags de desenvolvimento em `constants.ts` com `__DEV__` (equivale ao seletor de estado do jogo pedido na Fase 2).
- Comentários que explicam o **porquê** de decisões de UX e contraste.
- Respeito sistemático a "reduzir movimento".

## 6. Dívidas técnicas que NÃO vamos copiar

1. **`AppDataContext` monolítico** (~880 linhas): mistura o mapeamento do Supabase, regras de negócio e estado de UI, e chama o Supabase direto. Nada de adapters. → No Flamengo: interfaces de serviço por domínio + hooks por feature.
2. **Sem tema escuro** e ~75 cores hex literais em telas e componentes. → Tokens semânticos com tema claro e escuro, sem nenhuma cor literal em componente.
3. **Tipografia sem escala**: `fontSize`/`fontWeight` soltos em cada tela. → Escala tipográfica com tokens (incluindo dígitos tabulares).
4. **Botões duplicados**: cada tela estiliza o seu próprio `TouchableOpacity`. → `Button` único com variantes.
5. **Acessibilidade fraca**: 9 `accessibilityLabel` em ~360 toques; vários alvos com 22–36px compensados com `hitSlop`. → Mínimo de 44px e rótulo em todo controle.
6. **Sem skeletons, sem pull-to-refresh** (só `ActivityIndicator`).
7. **Sem testes, ESLint/Prettier não instalados** apesar do script `lint`.
8. `services/supabase.ts` dá `throw` sem `.env` (o app nem abre sem backend). → No Flamengo, o modo demo roda sem nenhuma variável.
9. `any` nos mapeadores de linha e `eslint-disable` de `exhaustive-deps`.
10. Componentes de tela grandes (Home com 580 linhas, misturando dados e UI).

## 7. Recomendação

### Stack do novo projeto
Mesma base do Zuno, com acréscimos pontuais:

- **Expo SDK 57 + RN 0.86 + React 19.2 + TypeScript strict**, npm, alias `@/`.
- **React Navigation 7** (mesmo padrão do Zuno, o que permite portar navigators e tipos quase direto).
- Estado: Context mínimo (sessão, tema, preferências) + **hooks por feature que consomem os serviços** (`useNextMatch`, `useNews`…), com um pequeno helper `useAsync` para loading, erro e refresh. Sem lib extra por enquanto.
- Animações: `Animated` nativo (como no Zuno) + `useReduceMotion`.
- Novas dependências: `react-native-qrcode-svg` (QR demonstrativo), `expo-haptics` (micro-interações), `@shopify/flash-list` (scroll de listas longas), uma fonte nova (ver pergunta abaixo).
- **ESLint + Prettier configurados de verdade** e Jest com `jest-expo` para os serviços mock e utilitários.
- **Sem Supabase na Fase 1**: `DATA_SOURCE=demo` não precisa de backend. A interface fica pronta para `live`.

### Feature → origem no Zuno → esforço

| Feature do Flamengo | Origem no Zuno | Esforço |
|---|---|---|
| Fundação (tokens claro/escuro, tipografia, componentes base) | `theme/`, `StatusPill`, `FormField`, padrões de card | **Médio** |
| Tab bar de 5 abas + stacks + FAB do Assistente | `navigation/*` | Baixo |
| Camada de serviços (adapters + mocks + seeds) | — (o Zuno não tem) | **Médio** |
| Home: header, atalhos, carrosséis, seções | `AppHeader`, `FolderCard`, `PetStoriesRow`, Home | Médio |
| Card do próximo jogo (3 estados) + contagem + AO VIVO pulsante | `StreakFlame` (pulso) | **Alto** (é a peça-vitrine) |
| Skeletons, estados vazios e de erro, pull-to-refresh | `ZikoEmptyState` (parcial) | Médio |
| Central de Jogos (calendário, tabela, partida com 5 abas) | — | **Alto** |
| Ingressos: compra simulada, carteira, QR DEMONSTRATIVO | `EmergencyCardScreen` (visual do cartão) | Médio |
| Modo Maracanã (mapa SVG esquemático, portões, transporte, filas) | `CoachMarks` (técnica SVG) | **Alto** |
| Loja → produto → carrinho → "Compra simulada" | `screens/Loja/*` | Baixo/Médio |
| Sócio-Torcedor (planos, carteirinha DEMO, benefícios) | `EmergencyCardScreen` | Médio |
| Gamificação / Passaporte (pontos, níveis, medalhas, rankings, palpites, quiz, enquetes) | `medals/*`, `achievements.ts`, `MedalGallery` | Médio |
| Comunidade (grupos por região) | — | Médio |
| Notícias / FlaTV (lista, detalhe, player placeholder) | — | Médio |
| Perfil (dados, favoritos, histórico, notificações, privacidade, login/logout) | `screens/Auth`, `screens/Settings`, `PasswordField`, `PhoneField` | Baixo/Médio |
| Assistente Fla (chat + sugestões + FAQ local + interface para LLM) | `ChatThreadScreen` | Médio |
| Alertas in-app (gol, início, fim) | `PopupHost` (fila e prioridade) | Baixo |
| Onboarding (ídolos e interesses) | `IntroCarousel` | Baixo |

### Observação sobre o local do repositório
`~/Flamengo-APP` e `~/Developer/ZUNO` ficam fora das pastas sincronizadas pelo iCloud (Desktop, Documents e iCloud Drive). Não foi preciso mover nada.
