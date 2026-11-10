# Mascote Urubu: assets

Duas pastas, dois papéis. Cada uma tem seu próprio `manifest.json`, que diz quando usar e quando evitar cada pose.

- `assistente-fla/`: o Urubu **com headset**, papel de assistente virtual de IA. Use só no chat, no botão flutuante e nos balões de ajuda.
- `mascote/`: o Urubu **sem headset**, papel de torcedor. Use no resto do app.

Nunca misture as duas: o headset é o que diz ao usuário que quem está falando é a IA.

## mascote/emocoes-de-jogo/ (640×640, mesma escala)

| Arquivo | Usar quando |
|---|---|
| `mascote_01_gritando-gol_gol-do-flamengo` | Gol do Flamengo |
| `mascote_02_tenso-roendo-unhas_jogo-apertado-ou-penaltis` | Final apertado, pênaltis |
| `mascote_03_maos-na-cabeca_quase-gol-ou-lance-perigoso` | Chance perdida, bola na trave |
| `mascote_04_reclamando_marcacao-polemica-ou-var` | VAR, gol anulado, marcação contra |
| `mascote_05_cachecol-erguido_cantando-apoio-da-torcida` | Dia de jogo, pré-jogo |
| `mascote_06_bracos-para-cima_vitoria-fim-de-jogo` | Vitória |
| `mascote_07_ombros-encolhidos_empate` | Empate |
| `mascote_08_triste-punho-no-peito_derrota-seguimos-juntos` | Derrota |
| `mascote_09_mao-no-escudo_orgulho-rubro-negro` | Sócio-torcedor, orgulho, perfil |

## mascote/modo-maracana/ (640×640, mesma escala)

O Modo Maracanã é aberto a qualquer torcedor, com ou sem ingresso. Estas poses não indicam posse de ingresso.

| Arquivo | Usar quando |
|---|---|
| `mascote_10_indicando-caminho_rotas-e-como-chegar` | Rotas, direção de portões e serviços |
| `mascote_11_mochila_a-caminho-do-estadio-transporte` | Transporte, estacionamento |
| `mascote_12_olhando-relogio_filas-e-horario-de-chegada` | Filas, horário de chegada |
| `mascote_13_binoculo_explorar-mapa-do-estadio` | Mapa interativo, banheiros, bares, lojas |
| `mascote_14_cachorro-quente-e-refrigerante_alimentacao` | Alimentação |
| `mascote_15_lanterna-do-celular_ativacoes-no-estadio` | Ativações, festa de luzes |
| `mascote_16_selfie_experiencias-no-estadio` | Experiências, pontos de foto, Passaporte |
| `mascote_17_cachecol-bracos-abertos_chegamos-ao-maracana` | Boas-vindas do Modo Maracanã |

## mascote/ingressos-loja-socio/ (640×640, mesma escala)

As poses 18 e 19 indicam que o usuário tem ingresso: use só nas telas de Ingressos.

| Arquivo | Usar quando |
|---|---|
| `mascote_18_mostrando-ingresso_ingresso-comprado` | Compra de ingresso, jogos à venda |
| `mascote_19_mostrando-celular_ingresso-digital-carteira` | Carteira de ingressos (tela recebe print) |
| `mascote_20_sacola-de-compras_loja` | Loja, compra concluída |
| `mascote_21_admirando-camisa_produto-da-loja` | Lançamento, página de produto |
| `mascote_22_caixa-de-entrega_pedido-a-caminho` | Pedido enviado, histórico |
| `mascote_23_cartao-de-socio_carteirinha-socio-torcedor` | Carteirinha, área do sócio |
| `mascote_24_caixa-de-presente_beneficio-ou-oferta-exclusiva` | Benefício, oferta, recompensa |
| `mascote_25_credencial-vip_experiencia-exclusiva` | Experiências exclusivas |

## mascote/gamificacao-comunidade/ (640×640, mesma escala)

| Arquivo | Usar quando |
|---|---|
| `mascote_26_erguendo-trofeu_conquista-desbloqueada` | Conquista, topo do ranking |
| `mascote_27_medalha-no-peito_medalha-ou-badge-ganha` | Nova medalha/badge |
| `mascote_28_lendo-livro_quiz-historia-do-flamengo` | Quiz, história do clube |
| `mascote_29_passaporte-carimbado_passaporte-rubro-negro` | Passaporte Rubro-Negro |
| `mascote_30_votando-na-urna_enquetes-e-votacoes` | Enquetes, craque do jogo |
| `mascote_31_segurando-estrela_subiu-de-nivel` | Subiu de nível, pontos |
| `mascote_32_high-five_palpite-certo-ou-desafio-concluido` | Palpite certo, desafio concluído |
| `mascote_33_bandeira-e-pin_comunidades-por-regiao` | Comunidades por região |

## mascote/corpo-inteiro-destaque/ (800×800, corpo inteiro, pés na base)

| Arquivo | Usar quando |
|---|---|
| `mascote_34_corpo-inteiro_bracos-cruzados_abertura-do-app` | Splash, login |
| `mascote_35_corpo-inteiro_pulando-de-alegria_comemoracao-tela-cheia` | Comemoração em tela cheia |
| `mascote_36_corpo-inteiro_embaixadinha_entretenimento-e-desafios` | Minijogos, desafios, intervalo |
| `mascote_37_corpo-inteiro_agitando-bandeira_dia-de-jogo-e-convocacao` | Dia de jogo, campanhas |
| `mascote_38_corpo-inteiro_correndo_carregamento` | Carregamento |
| `mascote_39_corpo-inteiro_acenando_boas-vindas-onboarding` | Onboarding, primeiro acesso |

## mascote/telas-vazias-e-erros/ (800×800, corpo inteiro, mesma escala da pasta anterior)

Use para estados fora do chat. Erros dentro do chat usam `assistente-fla/expressoes` (05 e 06).

| Arquivo | Usar quando |
|---|---|
| `mascote_40_corpo-inteiro_sentado-esperando_nada-por-aqui-ainda` | Lista vazia, sem notificações, carteira vazia |
| `mascote_41_corpo-inteiro_deitado-relaxando_sem-jogos-hoje` | Sem jogos hoje |
| `mascote_42_corpo-inteiro_radio-antena-torta_erro-de-conexao` | Sem internet, erro ao carregar |
| `mascote_43_corpo-inteiro_megafone_ativar-notificacoes` | Pedir permissão de notificações |
| `mascote_44_corpo-inteiro_dormindo-em-pe_manutencao` | Manutenção, sessão expirada |
| `mascote_45_corpo-inteiro_caixa-vazia_carrinho-vazio` | Carrinho vazio, busca sem resultados |

O mascote nunca aparece com bebida alcoólica nem associado a apostas. O escudo na camisa é marca do Flamengo e serve só para demonstração. Não espelhe as imagens.
