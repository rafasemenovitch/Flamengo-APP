# Assistente Fla: poses do mascote

Poses do Urubu no papel de **Assistente Fla**, o assistente virtual de IA do app. Ele usa **headset em todas**, que é o que diferencia o assistente do mascote torcedor. Use estas imagens apenas no contexto do assistente.

`manifest.json` traz, para cada pose, quando usar e quando evitar. Use-o para escolher a imagem pelo estado da resposta.

## expressoes/: avatar do chat (512×512, rosto e ombros, mesma escala)

| Arquivo | Usar quando |
|---|---|
| `01_neutro-acolhedor_avatar-padrao` | Avatar padrão, botão flutuante (fallback) |
| `02_acenando-ola_inicio-da-conversa` | Boas-vindas no chat |
| `03_falando-explicando_respondendo` | Respostas com explicação |
| `04_pensando_processando-resposta` | Carregando / "digitando..." |
| `05_confuso_nao-entendeu-a-pergunta` | Pergunta ambígua |
| `06_sem-graca_informacao-nao-encontrada` | Não encontrou, fora do escopo, erro no chat |
| `07_piscando-joinha_dando-dica` | Dicas e sugestões |
| `08_muito-feliz_agradecendo-fim-da-conversa` | Agradecimento, encerramento, notícia boa |

## gestos/: ilustrações maiores (640×640, da cintura para cima)

| Arquivo | Usar quando |
|---|---|
| `09_continencia_missao-cumprida` | Ação concluída, pedido resolvido |
| `10_apontando-para-o-lado_destacar-balao-ou-conteudo` | Personagem à esquerda de um balão ou card |
| `11_apontando-para-cima_destacar-botao-ou-aviso` | Destacar algo acima, novidade |
| `12_mostrando-celular_apresentar-tela-ou-recurso-do-app` | Onboarding e tutorial (tela branca recebe print) |
| `13_lupa_buscando-informacao` | Buscando informação |
| `14_prancheta_checklist-ou-passo-a-passo` | Checklist, passo a passo |
| `15_mapa-com-pin_como-chegar-ou-localizacao` | Como chegar, portão, transporte |
| `16_bracos-abertos_como-posso-ajudar` | Chat vazio, convite para perguntar |

Os arquivos começam com `assistente-fla_`. `alta-resolucao/` tem a pose 01 em 1024×1024.

Não espelhe as imagens. O escudo na camisa é marca do Flamengo e serve só para demonstração.
