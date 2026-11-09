# Assistente Fla: poses do mascote

Oito poses do Urubu no papel de **Assistente Fla**, o assistente virtual de IA do app. Ele usa **headset em todas** porque o headset é o que diferencia o assistente do mascote torcedor. Use estas imagens apenas no contexto do assistente.

- PNG transparente, 512×512, rosto e ombros
- Mesma escala e alinhamento em todas (troca entre poses sem "pulo")
- `manifest.json` traz, para cada pose, quando usar e quando evitar. Use-o para escolher a imagem pelo estado da resposta.

| Arquivo | Usar quando |
|---|---|
| `assistente-fla_01_neutro-acolhedor_avatar-padrao.png` | Avatar padrão, botão flutuante, cabeçalho do chat (fallback) |
| `assistente-fla_02_acenando-ola_inicio-da-conversa.png` | Boas-vindas, abertura do chat |
| `assistente-fla_03_falando-explicando_respondendo.png` | Respostas com explicação ou passo a passo |
| `assistente-fla_04_pensando_processando-resposta.png` | Carregando / "digitando..." |
| `assistente-fla_05_confuso_nao-entendeu-a-pergunta.png` | Pergunta ambígua, pedir mais detalhes |
| `assistente-fla_06_sem-graca_informacao-nao-encontrada.png` | Não encontrou, fora do escopo, erro dentro do chat |
| `assistente-fla_07_piscando-joinha_dando-dica.png` | Dicas, sugestões, ação concluída |
| `assistente-fla_08_muito-feliz_agradecendo-fim-da-conversa.png` | Agradecimento, encerramento, notícia muito boa |

`alta-resolucao/` tem a pose 01 em 1024×1024, para splash ou telas grandes.

Não espelhe as imagens horizontalmente. O escudo na camisa é marca do Flamengo e serve só para demonstração.
