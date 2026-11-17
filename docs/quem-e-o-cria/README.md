# Quem é o Cria?

O jogo diário da Nação: descobrir em até 5 palpites o jogador da história do Flamengo escolhido para o dia.

## Onde está cada coisa

| Parte | Arquivo |
| --- | --- |
| Base de jogadores (gerada) | `src/data/cria/players.ts` ← `npm run cria:data` (`tools/cria/`) |
| Critérios, fontes e divergências | `src/data/cria/SOURCES.md` |
| Agenda do ano (gerada, disfarçada) | `src/data/cria/schedule.generated.ts` ← `npm run cria:agenda` |
| Datas fixadas (aniversários) | `src/data/cria/pins.ts` |
| Regras de comparação, busca, datas e agenda | `src/features/cria/{compare,search,dates,schedule}.ts` |
| Telas | `src/features/cria/` (`CriaScreen`, `Clues`, `PlayerSearch`, `RulesSheet`, `ResultBlock`) |
| Partida salva e demonstração | `src/services/mock/dailyGame.ts` (interface em `src/services/adapters/DailyGameService.ts`) |
| Cards "Jogos do dia" | `src/features/nation/DailyGames.tsx` |
| Testes | `src/__tests__/cria{Data,Rules,Game}.test.ts` |

## Critérios de aceite

- [x] **Nação:** "Jogos do dia" fica abaixo da trilha e acima dos bolões, com 3 cards (Quem é o Cria?, Quiz Diário, "Em breve").
- [x] **Estado do dia no card:**
  - Quem é o Cria?: Jogar, Em andamento + palpites, Acertou em N / Não foi hoje + contagem;
  - Quiz: Responder, Acertou ou Errou.
- [x] **Partida:** 5 tentativas e 6 atributos (posição, país, chegada, gols, jogos e títulos).
- [x] **Cores, setas e tolerâncias:** documentadas (`compare.ts`, `SOURCES.md`) e testadas, com exemplos reais.
- [x] **iPhone SE:** nenhum número ou nome cortado (prints `se-*`). Dentro dos quadrados, a fonte cresce no máximo 20% com fonte grande.
- [x] **Busca:**
  - tolera acentos;
  - acha apelidos e nome completo;
  - diferencia homônimos pelo período (os dois Jorginhos, os dois Juans).
- [x] **Progresso:** fica salvo e é retomado, e não dá para rejogar o desafio do dia.
- [x] **Desafio diário:** é o mesmo para todos e vira à meia-noite de Brasília.
- [x] **Resposta escondida:** na agenda e no aparelho, o secreto fica disfarçado, nunca em texto puro.
- [x] **Fontes:**
  - toda estatística tem fonte e grau de confiança;
  - só vira resposta quem tem jogos e gols conferidos por uma segunda fonte.
- [x] **Compartilhar:** não revela nenhum nome.
- [x] **Acessibilidade:**
  - há alto contraste (laranja e azul), que vale também no compartilhar;
  - o leitor de tela lê cada pista ("Gols: 103, perto, o secreto marcou menos").
- [x] **Demonstração:** painel da Home (toque longo no nome) com próximo dia, dia de hoje, reiniciar e escolher o Cria.
- [x] **Prints:** em `screens/final/`, revisados.

## Compartilhar (exemplo)

```
Quem é o Cria? #1 · 3/5
⬛🟩⬛🟨⬛⬛
🟩🟩⬛⬛⬛⬛
🟩🟩🟩🟩🟩🟩
```

## Prints finais (`screens/final/`, 390 × 844; `se-*` em 375 × 667)

| Arquivo | Estado |
| --- | --- |
| `01` a `03` | Card na Nação: jogar, em andamento e concluído |
| `04` | Tela inicial |
| `05` | Regras |
| `06` | Busca |
| `07` | 1 tentativa |
| `08` | 3 tentativas |
| `09` | 5 tentativas (vitória) |
| `10` | Derrota |
| `11` | Alto contraste |
| `12` | Painel da demonstração |
| `13` | Vitória de primeira |

As decisões de layout ficam em `screens/layout/` (grade × blocos).

## Limites conhecidos

- **Respostas fáceis:** só 11 (por exemplo, Arrascaeta, Bruno Henrique e Pedro ficam só para chute, porque os números mudam a cada rodada). Em 31 dos 104 domingos e segundas do ano entra um médio.
- **Repetição:** um jogador pode voltar depois de 53 dias, não de 90; para 90 dias sem repetir, a base precisa de mais de 90 respostas possíveis.
- **Ainda local:** a agenda e o progresso ficam no aparelho. O `SupabaseDailyGameAdapter` (o servidor escolhe o secreto e só o revela no fim) usa a mesma interface.
- **O que ainda pode parecer genérico:**
  - os três cards da Nação seguem o desenho "ícone, título e estado" que o pedido pedia; os desenhos são próprios, mas o formato é comum;
  - a tela do Quiz Diário é só o card antigo numa tela própria.
- **Ainda não verificado:** o leitor de tela e a fonte grande foram revistos no código e na web, não num aparelho com VoiceOver ou TalkBack.
