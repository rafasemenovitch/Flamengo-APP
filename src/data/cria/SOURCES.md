# Quem é o Cria? Fontes e critérios

Base: `players.ts`. Cada atributo de cada jogador tem `sources` e `confidence`. O teste `src/__tests__/criaData.test.ts` confere as regras abaixo.

## Critérios (iguais para todos os jogadores)

| Atributo | Critério |
| --- | --- |
| Posição | Uma posição principal: Goleiro, Zagueiro, Lateral, Volante, Meia ou Atacante. É a posição em que o jogador mais atuou **pelo Flamengo**, não na carreira. |
| Nacionalidade | A nacionalidade esportiva, ou seja, a seleção que defendeu. Se não defendeu nenhuma, vale o país de nascimento. Dupla nacionalidade (ex.: Zico, luso-brasileiro) conta como a esportiva. |
| Chegada | O ano do primeiro jogo (ou da primeira temporada) pelo time profissional do Flamengo. Vale igual para crias da base e para contratados. |
| Gols e jogos | Todos os jogos do time profissional, **inclusive amistosos**, como no levantamento histórico do clube (é a contagem dos "508 gols do Zico"). Jogos e gols em todas as passagens somados. |
| Títulos | Títulos coletivos das competições da lista abaixo em que o jogador fazia parte do elenco campeão, segundo a lista nominal de títulos do artigo do jogador. Prêmios individuais não contam. |

### Competições que contam como título

Campeonato Carioca (o campeonato, não os turnos), Campeonato Brasileiro (inclusive a Copa União de 1987), Copa do Brasil, Supercopa do Brasil, Copa Libertadores, Recopa Sul-Americana, Copa Intercontinental/Mundial, Copa Mercosul, Copa dos Campeões, Copa de Ouro Sul-Americana e Torneio Rio-São Paulo.

**Não contam:**
- Taça Guanabara e Taça Rio, que são turnos do Carioca;
- torneios amistosos, como o Ramón de Carranza e a Taça Ciudad de Palma;
- os jogos intermediários do Intercontinental da FIFA, como o Dérbi das Américas.

## Fontes

| Id | Fonte | Uso |
| --- | --- | --- |
| `wikipedia-pt` | Wikipédia em português, artigo de cada jogador (infobox e seção de títulos), lida pela API pública | Passagens, jogos, gols, nacionalidade, títulos pelo clube |
| `wikipedia-en` | Wikipédia em inglês, "List of CR Flamengo players" (quem fez 100 jogos ou mais; cada linha cita a fonte) | Conferência de jogos, gols, ano de estreia, nacionalidade e posição |
| `lance-*`, `goal-*`, `trivela-*` | Matérias da imprensa (link e data em `tools/cria/press.ts`) | Conferência de jogos, gols e títulos dos ídolos |
| `curadoria` | Escolha manual (`tools/cria/curation.ts`) | Posição no jogo, dificuldade, apelidos e nacionalidade esportiva quando a fonte traz mais de uma |

A base é gerada por `tools/cria/build.ts`: nenhum número é digitado à mão.

## Confiança e quem pode ser resposta

- **`confirmado`:** duas fontes dão exatamente o mesmo valor.
- **`fonte_unica`:** só uma fonte dá aquele valor. O campo `closeTo` lista outras fontes que ficam a até 3% dele.
- **Quando as fontes divergem:**
  - fica o valor repetido por mais fontes;
  - se nenhum se repete e a diferença passa de 10%, fica a **maior** contagem, porque há fichas que contam só o campeonato nacional;
  - fora isso, a ordem de preferência é a imprensa, depois a lista em inglês para quem estreou antes de 2000 (ela inclui amistosos) e depois o artigo em português, que é atualizado com a temporada.
- **Pode ser resposta** (`eligible`) quem não tem atributo pendente e tem jogos e gols conferidos por uma segunda fonte, igual ou a até 3%.
  - **Por que 3% basta:** cada jogador tem um único valor na base, e a pista verde só aparece quando o palpite é o próprio jogador ou outro com o mesmo número. Uma diferença de 1% entre as fontes não muda nenhuma cor de forma injusta. A tolerância do amarelo é de 15%.
- **Títulos:** contados a partir da lista nominal de títulos pelo Flamengo no artigo de cada jogador, filtrada pelas competições acima e pelos anos em que ele estava no clube.
  - **Fica fora da base:** quem não tem essa lista no artigo, porque sem ela o número de títulos seria um chute.
- **Jogadores em atividade:** os números mudam a cada rodada e a imprensa publica totais de datas diferentes, então quase sempre ficam `fonte_unica` e entram só para chute. No desafio, os atributos ficam congelados no momento da publicação.
- **Fora da base por decisão editorial:** o goleiro Bruno, condenado pelo assassinato de Eliza Samudio.

### Fontes avaliadas e não usadas

| Fonte | Motivo |
| --- | --- |
| Flapédia | O domínio saiu do ar e hoje é outro site, sem relação com o Flamengo. |
| Flaestatística | É a referência histórica do clube, mas o `robots.txt` bloqueia o robô da Anthropic e o site proíbe a reprodução. Não foi coletado. Os números da Wikipédia e da imprensa costumam citá-lo, por isso duas fontes que concordam podem ter a mesma origem: isso está marcado nas notas. |
| Transfermarkt | O `robots.txt` bloqueia robôs de IA. |
| ogol / zerozero | Conta só uma parte das partidas antigas (Zico aparece com 576 jogos e 395 gols), o que não segue o critério de "todos os jogos". |

## Reconciliação

Gerada por `tools/cria/build.ts`: todo dado em que as fontes não batem e a decisão tomada.

<!-- reconciliacao:inicio -->
| Jogador | Dado | Valores encontrados | Decisão | Motivo |
| --- | --- | --- | --- | --- |
| Leônidas | Jogos | 149 (wikipedia-pt) · 148 (wikipedia-en) · 149 (goal-artilheiros) | 149 | valor repetido por mais fontes |
| Leônidas | Gols | 153 (wikipedia-pt) · 147 (wikipedia-en) · 153 (goal-artilheiros) | 153 | valor repetido por mais fontes |
| Domingos da Guia | Jogos | 223 (wikipedia-pt) · 227 (wikipedia-en) | 227 | preferência: wikipedia-en |
| Zizinho | Jogos | 318 (wikipedia-pt) · 328 (wikipedia-en) · 318 (goal-artilheiros) | 318 | valor repetido por mais fontes |
| Zizinho | Gols | 146 (wikipedia-pt) · 142 (wikipedia-en) · 148 (goal-artilheiros) | 148 | preferência: goal-artilheiros |
| Pirillo | Jogos | 237 (wikipedia-pt) · 236 (goal-artilheiros) | 236 | preferência: goal-artilheiros |
| Jayme de Almeida | Chegada | 1972 (wikipedia-pt) · 1973 (wikipedia-en) | 1972 | o ano mais antigo: a lista em inglês ordena pela estreia |
| Henrique Frade | Jogos | 412 (wikipedia-pt) · 411 (wikipedia-en) · 412 (goal-artilheiros) | 412 | valor repetido por mais fontes |
| Henrique Frade | Gols | 212 (wikipedia-pt) · 213 (wikipedia-en) · 216 (goal-artilheiros) | 216 | preferência: goal-artilheiros |
| Evaristo de Macedo | Gols | 105 (wikipedia-pt) · 104 (wikipedia-en) | 104 | preferência: wikipedia-en |
| Joel | Gols | 115 (wikipedia-en) · 116 (goal-artilheiros) | 116 | preferência: goal-artilheiros |
| Dequinha | Jogos | 374 (wikipedia-pt) · 384 (wikipedia-en) | 384 | preferência: wikipedia-en |
| Índio | Jogos | 202 (wikipedia-pt) · 219 (wikipedia-en) | 219 | preferência: wikipedia-en |
| Índio | Gols | 134 (wikipedia-pt) · 144 (wikipedia-en) · 142 (goal-artilheiros) | 142 | preferência: goal-artilheiros |
| Índio | Chegada | 1951 (wikipedia-pt) · 1949 (wikipedia-en) | 1949 | o ano mais antigo: a lista em inglês ordena pela estreia |
| Moacir | Gols | 59 (wikipedia-pt) · 56 (wikipedia-en) | 56 | preferência: wikipedia-en |
| Gérson | Jogos | 147 (wikipedia-pt) · 151 (wikipedia-en) | 151 | preferência: wikipedia-en |
| Gérson | Chegada | 1959 (wikipedia-pt) · 1958 (wikipedia-en) | 1958 | o ano mais antigo: a lista em inglês ordena pela estreia |
| Carlinhos | Jogos | 517 (wikipedia-pt) · 517 (wikipedia-en) · 514 (lance-mais-jogos) | 517 | valor repetido por mais fontes |
| Doval | Gols | 95 (wikipedia-pt) · 92 (wikipedia-en) | 92 | preferência: wikipedia-en |
| Zico | Gols | 509 (wikipedia-pt) · 509 (wikipedia-en) · 508 (lance-zico) · 508 (goal-artilheiros) | 508 | valor repetido por mais fontes |
| Júnior | Jogos | 875 (wikipedia-pt) · 876 (wikipedia-en) · 875 (lance-mais-jogos) | 875 | valor repetido por mais fontes |
| Júnior | Gols | 77 (wikipedia-pt) · 76 (wikipedia-en) | 76 | preferência: wikipedia-en |
| Adílio | Jogos | 616 (wikipedia-pt) · 616 (wikipedia-en) · 617 (lance-mais-jogos) · 616 (goal-artilheiros) | 616 | valor repetido por mais fontes |
| Andrade | Jogos | 569 (wikipedia-en) · 570 (lance-mais-jogos) | 570 | preferência: lance-mais-jogos |
| Andrade | Chegada | 1976 (wikipedia-pt) · 1977 (wikipedia-en) | 1976 | o ano mais antigo: a lista em inglês ordena pela estreia |
| Leandro | Jogos | 421 (wikipedia-pt) · 414 (wikipedia-en) | 414 | preferência: wikipedia-en |
| Raul | Jogos | 227 (wikipedia-pt) · 228 (wikipedia-en) | 228 | preferência: wikipedia-en |
| Rondinelli | Jogos | 407 (wikipedia-pt) · 406 (wikipedia-en) | 406 | preferência: wikipedia-en |
| Manguito | Jogos | 114 (wikipedia-pt) · 116 (wikipedia-en) | 116 | preferência: wikipedia-en |
| Luisinho Lemos | Jogos | 183 (wikipedia-pt) · 160 (wikipedia-en) | 183 | diferença acima de 10%: a contagem menor omite competições |
| Luisinho Lemos | Gols | 82 (wikipedia-pt) · 94 (wikipedia-en) | 94 | diferença acima de 10%: a contagem menor omite competições |
| Geraldo | Jogos | 168 (wikipedia-pt) · 169 (wikipedia-en) | 169 | preferência: wikipedia-en |
| Bebeto | Jogos | 307 (wikipedia-pt) · 307 (wikipedia-en) · 306 (goal-artilheiros) | 307 | valor repetido por mais fontes |
| Bebeto | Gols | 151 (wikipedia-pt) · 150 (wikipedia-en) · 151 (goal-artilheiros) | 151 | valor repetido por mais fontes |
| Leonardo | Jogos | 138 (wikipedia-pt) · 177 (wikipedia-en) | 177 | diferença acima de 10%: a contagem menor omite competições |
| Leonardo | Gols | 5 (wikipedia-pt) · 10 (wikipedia-en) | 10 | diferença acima de 10%: a contagem menor omite competições |
| Aldair | Jogos | 185 (wikipedia-pt) · 184 (wikipedia-en) | 184 | preferência: wikipedia-en |
| Aldair | Gols | 11 (wikipedia-pt) · 12 (wikipedia-en) | 12 | preferência: wikipedia-en |
| Jorginho | Jogos | 245 (wikipedia-pt) · 247 (wikipedia-en) | 247 | preferência: wikipedia-en |
| Zinho | Jogos | 457 (wikipedia-pt) · 466 (wikipedia-en) | 466 | preferência: wikipedia-en |
| Gaúcho | Jogos | 202 (wikipedia-pt) · 199 (wikipedia-en) | 199 | preferência: wikipedia-en |
| Gaúcho | Chegada | 1984 (wikipedia-pt) · 1982 (wikipedia-en) | 1982 | o ano mais antigo: a lista em inglês ordena pela estreia |
| Júnior Baiano | Jogos | 264 (wikipedia-pt) · 337 (wikipedia-en) | 337 | diferença acima de 10%: a contagem menor omite competições |
| Júnior Baiano | Chegada | 1989 (wikipedia-pt) · 1988 (wikipedia-en) | 1988 | o ano mais antigo: a lista em inglês ordena pela estreia |
| Djalminha | Gols | 20 (wikipedia-pt) · 29 (wikipedia-en) | 29 | diferença acima de 10%: a contagem menor omite competições |
| Charles Guerreiro | Jogos | 246 (wikipedia-pt) · 254 (wikipedia-en) | 254 | preferência: wikipedia-en |
| Gilmar Rinaldi | Chegada | 1990 (wikipedia-pt) · 1991 (wikipedia-en) | 1990 | o ano mais antigo: a lista em inglês ordena pela estreia |
| Romário | Jogos | 221 (wikipedia-pt) · 240 (goal-artilheiros) | 240 | preferência: goal-artilheiros |
| Sávio | Jogos | 271 (wikipedia-pt) · 261 (wikipedia-en) | 261 | preferência: wikipedia-en |
| Sávio | Gols | 95 (wikipedia-pt) · 99 (wikipedia-en) | 99 | preferência: wikipedia-en |
| Petković | Chegada | 2000 (wikipedia-pt) · 2001 (wikipedia-en) | 2000 | o ano mais antigo: a lista em inglês ordena pela estreia |
| Juan | Jogos | 331 (wikipedia-pt) · 332 (wikipedia-en) | 332 | preferência: wikipedia-en |
| Júlio César | Jogos | 286 (wikipedia-pt) · 287 (wikipedia-en) | 287 | preferência: wikipedia-en |
| Ibson | Jogos | 203 (wikipedia-pt) · 233 (wikipedia-en) | 233 | diferença acima de 10%: a contagem menor omite competições |
| Ibson | Gols | 29 (wikipedia-pt) · 35 (wikipedia-en) | 35 | diferença acima de 10%: a contagem menor omite competições |
| Léo Moura | Jogos | 519 (wikipedia-pt) · 502 (wikipedia-en) · 519 (lance-mais-jogos) · 519 (trivela-leo-moura) | 519 | valor repetido por mais fontes |
| Léo Moura | Gols | 47 (wikipedia-pt) · 44 (wikipedia-en) · 47 (trivela-leo-moura) | 47 | valor repetido por mais fontes |
| Ronaldo Angelim | Jogos | 284 (wikipedia-pt) · 276 (wikipedia-en) | 284 | preferência: wikipedia-pt |
| Ronaldo Angelim | Gols | 17 (wikipedia-pt) · 16 (wikipedia-en) | 17 | preferência: wikipedia-pt |
| Kléberson | Gols | 23 (wikipedia-pt) · 22 (wikipedia-en) | 23 | preferência: wikipedia-pt |
| Toró | Jogos | 171 (wikipedia-pt) · 163 (wikipedia-en) | 171 | preferência: wikipedia-pt |
| Toró | Gols | 7 (wikipedia-pt) · 6 (wikipedia-en) | 7 | diferença acima de 10%: a contagem menor omite competições |
| Willians | Jogos | 181 (wikipedia-pt) · 176 (wikipedia-en) | 181 | preferência: wikipedia-pt |
| Paulo Victor | Chegada | 2006 (wikipedia-pt) · 2007 (wikipedia-en) | 2006 | o ano mais antigo: a lista em inglês ordena pela estreia |
| Everton | Jogos | 122 (wikipedia-pt) · 255 (wikipedia-en) | 255 | diferença acima de 10%: a contagem menor omite competições |
| Everton | Gols | 39 (wikipedia-pt) · 38 (wikipedia-en) | 39 | preferência: wikipedia-pt |
| Guerrero | Jogos | 112 (wikipedia-pt) · 113 (wikipedia-en) | 112 | preferência: wikipedia-pt |
| Guerrero | Gols | 42 (wikipedia-pt) · 43 (wikipedia-en) | 42 | preferência: wikipedia-pt |
| Diego | Jogos | 289 (wikipedia-pt) · 283 (wikipedia-en) | 289 | preferência: wikipedia-pt |
| Diego | Gols | 44 (wikipedia-pt) · 42 (wikipedia-en) | 44 | preferência: wikipedia-pt |
| Juan Maldonado | Jogos | 256 (wikipedia-pt) · 250 (wikipedia-en) | 256 | preferência: wikipedia-pt |
| Juan Maldonado | Gols | 32 (wikipedia-pt) · 31 (wikipedia-en) | 32 | preferência: wikipedia-pt |
| Diego Alves | Jogos | 217 (wikipedia-pt) · 216 (wikipedia-en) | 217 | preferência: wikipedia-pt |
| Cuéllar | Jogos | 171 (wikipedia-pt) · 167 (wikipedia-en) | 171 | preferência: wikipedia-pt |
| Lucas Paquetá | Jogos | 134 (wikipedia-pt) · 119 (wikipedia-en) | 134 | diferença acima de 10%: a contagem menor omite competições |
| Lucas Paquetá | Gols | 31 (wikipedia-pt) · 26 (wikipedia-en) | 31 | diferença acima de 10%: a contagem menor omite competições |
| Rodinei | Jogos | 223 (wikipedia-pt) · 222 (wikipedia-en) | 223 | preferência: wikipedia-pt |
| Willian Arão | Jogos | 377 (wikipedia-pt) · 371 (wikipedia-en) | 377 | preferência: wikipedia-pt |
| Willian Arão | Gols | 35 (wikipedia-pt) · 34 (wikipedia-en) | 35 | preferência: wikipedia-pt |
| Rodrigo Caio | Jogos | 152 (wikipedia-pt) · 149 (wikipedia-en) | 152 | preferência: wikipedia-pt |
| Rodrigo Caio | Gols | 6 (wikipedia-pt) · 5 (wikipedia-en) | 6 | diferença acima de 10%: a contagem menor omite competições |
| Filipe Luís | Jogos | 176 (wikipedia-pt) · 175 (wikipedia-en) | 176 | preferência: wikipedia-pt |
| Bruno Henrique | Jogos | 390 (wikipedia-pt) · 367 (wikipedia-en) | 390 | preferência: wikipedia-pt |
| Bruno Henrique | Gols | 119 (wikipedia-pt) · 116 (wikipedia-en) | 119 | preferência: wikipedia-pt |
| Arrascaeta | Jogos | 391 (wikipedia-pt) · 374 (wikipedia-en) | 391 | preferência: wikipedia-pt |
| Arrascaeta | Gols | 108 (wikipedia-pt) · 105 (wikipedia-en) | 108 | preferência: wikipedia-pt |
| Pedro | Jogos | 357 (wikipedia-pt) · 335 (wikipedia-en) | 357 | preferência: wikipedia-pt |
| Pedro | Gols | 179 (wikipedia-pt) · 169 (wikipedia-en) | 179 | preferência: wikipedia-pt |
| Michael | Jogos | 152 (wikipedia-pt) · 150 (wikipedia-en) | 152 | preferência: wikipedia-pt |
| David Luiz | Jogos | 132 (wikipedia-pt) · 109 (wikipedia-en) | 132 | diferença acima de 10%: a contagem menor omite competições |
| Thiago Maia | Jogos | 170 (wikipedia-pt) · 156 (wikipedia-en) | 170 | preferência: wikipedia-pt |
| Ayrton Lucas | Jogos | 239 (wikipedia-pt) · 223 (wikipedia-en) | 239 | preferência: wikipedia-pt |
| Léo Pereira | Jogos | 315 (wikipedia-pt) · 304 (wikipedia-en) | 315 | preferência: wikipedia-pt |
| Léo Pereira | Gols | 20 (wikipedia-pt) · 19 (wikipedia-en) | 20 | preferência: wikipedia-pt |
| Rossi | Jogos | 200 (wikipedia-pt) · 173 (wikipedia-en) | 200 | diferença acima de 10%: a contagem menor omite competições |
| Varela | Jogos | 156 (wikipedia-pt) · 145 (wikipedia-en) | 156 | preferência: wikipedia-pt |
| Varela | Gols | 5 (wikipedia-pt) · 4 (wikipedia-en) | 5 | diferença acima de 10%: a contagem menor omite competições |
| Pulgar | Jogos | 164 (wikipedia-pt) · 156 (wikipedia-en) | 164 | preferência: wikipedia-pt |
| Pulgar | Gols | 6 (wikipedia-pt) · 5 (wikipedia-en) | 6 | diferença acima de 10%: a contagem menor omite competições |
| Luiz Araújo | Jogos | 172 (wikipedia-pt) · 171 (wikipedia-en) | 172 | preferência: wikipedia-pt |
| Léo Ortiz | Jogos | 136 (wikipedia-pt) · 118 (wikipedia-en) | 136 | diferença acima de 10%: a contagem menor omite competições |
| Wesley | Jogos | 139 (wikipedia-pt) · 135 (wikipedia-en) | 139 | preferência: wikipedia-pt |
| Renato Abreu | Jogos | 271 (wikipedia-pt) · 250 (wikipedia-en) | 271 | preferência: wikipedia-pt |
| Renato Abreu | Gols | 73 (wikipedia-pt) · 68 (wikipedia-en) | 73 | preferência: wikipedia-pt |
| Vitinho | Jogos | 215 (wikipedia-pt) · 213 (wikipedia-en) | 215 | preferência: wikipedia-pt |
| Matheuzinho | Chegada | 2020 (wikipedia-pt) · 2019 (wikipedia-en) | 2020 | o ano mais antigo: a lista em inglês ordena pela estreia |
| Márcio Araújo | Jogos | 219 (wikipedia-pt) · 206 (wikipedia-en) | 219 | preferência: wikipedia-pt |
| Gabriel | Jogos | 214 (wikipedia-pt) · 204 (wikipedia-en) | 214 | preferência: wikipedia-pt |
| Gabriel | Gols | 23 (wikipedia-pt) · 22 (wikipedia-en) | 23 | preferência: wikipedia-pt |
| Paulinho | Jogos | 110 (wikipedia-pt) · 106 (wikipedia-en) | 110 | preferência: wikipedia-pt |
| Wallace | Jogos | 178 (wikipedia-pt) · 167 (wikipedia-en) | 178 | preferência: wikipedia-pt |
| Iranildo | Jogos | 251 (wikipedia-pt) · 282 (wikipedia-en) | 282 | diferença acima de 10%: a contagem menor omite competições |
| Iranildo | Gols | 25 (wikipedia-pt) · 34 (wikipedia-en) | 34 | diferença acima de 10%: a contagem menor omite competições |
| Beto | Jogos | 68 (wikipedia-pt) · 177 (wikipedia-en) | 177 | diferença acima de 10%: a contagem menor omite competições |
| Beto | Gols | 10 (wikipedia-pt) · 32 (wikipedia-en) | 32 | diferença acima de 10%: a contagem menor omite competições |
| Zé Carlos | Jogos | 352 (wikipedia-pt) · 354 (wikipedia-en) | 354 | preferência: wikipedia-en |
| Zé Carlos | Gols | 1 (wikipedia-pt) · 0 (wikipedia-en) | 1 | diferença acima de 10%: a contagem menor omite competições |
| Zé Carlos | Chegada | 1984 (wikipedia-pt) · 1985 (wikipedia-en) | 1984 | o ano mais antigo: a lista em inglês ordena pela estreia |
| Marquinhos | Jogos | 335 (wikipedia-pt) · 337 (wikipedia-en) | 337 | preferência: wikipedia-en |
| Marquinhos | Gols | 27 (wikipedia-pt) · 28 (wikipedia-en) | 28 | preferência: wikipedia-en |
| Leandro Machado | Jogos | 96 (wikipedia-pt) · 102 (wikipedia-en) | 102 | preferência: wikipedia-en |
| Leandro Machado | Gols | 40 (wikipedia-pt) · 39 (wikipedia-en) | 39 | preferência: wikipedia-en |
| Gilberto | Jogos | 67 (wikipedia-pt) · 117 (wikipedia-en) | 117 | diferença acima de 10%: a contagem menor omite competições |
| Alessandro | Jogos | 142 (wikipedia-pt) · 130 (wikipedia-en) | 130 | preferência: wikipedia-en |
| Alessandro | Gols | 9 (wikipedia-pt) · 6 (wikipedia-en) | 9 | diferença acima de 10%: a contagem menor omite competições |
| Jônatas | Jogos | 141 (wikipedia-pt) · 197 (wikipedia-en) | 197 | diferença acima de 10%: a contagem menor omite competições |
| Jônatas | Gols | 11 (wikipedia-pt) · 13 (wikipedia-en) | 13 | diferença acima de 10%: a contagem menor omite competições |
| Welinton | Jogos | 148 (wikipedia-pt) · 146 (wikipedia-en) | 148 | preferência: wikipedia-pt |
| Luiz Antônio | Jogos | 136 (wikipedia-pt) · 168 (wikipedia-en) | 168 | diferença acima de 10%: a contagem menor omite competições |
| Luiz Antônio | Gols | 7 (wikipedia-pt) · 8 (wikipedia-en) | 8 | diferença acima de 10%: a contagem menor omite competições |
| Adalberto | Jogos | 183 (wikipedia-pt) · 185 (wikipedia-en) | 185 | preferência: wikipedia-en |
| Aírton Beleza | Jogos | 130 (wikipedia-pt) · 132 (wikipedia-en) | 132 | preferência: wikipedia-en |
| Aírton Beleza | Gols | 72 (wikipedia-pt) · 71 (wikipedia-en) | 71 | preferência: wikipedia-en |
| Andrezinho | Jogos | 109 (wikipedia-pt) · 108 (wikipedia-en) | 109 | preferência: wikipedia-pt |
| Andrezinho | Gols | 13 (wikipedia-pt) · 14 (wikipedia-en) | 13 | preferência: wikipedia-pt |
| David Braz | Jogos | 99 (wikipedia-pt) · 103 (wikipedia-en) | 99 | preferência: wikipedia-pt |

**Fora da base (19):** bigua (sem curadoria); valido (sem curadoria); henrique-frade (artigo sem lista de títulos pelo Flamengo); jordan (artigo sem lista de títulos pelo Flamengo); pavao (sem curadoria); esquerdinha (sem curadoria); ubirajara (sem curadoria); rondinelli (artigo sem lista de títulos pelo Flamengo); paulo-cesar-caju (sem ano de estreia); nunes (sem jogos em nenhuma fonte); figueiredo (sem curadoria); paulo-nunes (sem ano de estreia); nelio (sem curadoria); rodrigo-mendes (sem curadoria); ze-roberto (artigo sem lista de títulos pelo Flamengo); vagner-love (artigo sem lista de títulos pelo Flamengo); santos (sem gols em nenhuma fonte); joao-gomes (artigo sem lista de títulos pelo Flamengo); reyes (artigo sem lista de títulos pelo Flamengo).
<!-- reconciliacao:fim -->
