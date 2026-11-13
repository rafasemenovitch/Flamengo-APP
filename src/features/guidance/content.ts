export const RESOURCE_GUIDES = {
  maracana: {
    title: 'Seu caminho no estádio',
    steps: [
      'Toque na área acima para escolher seu setor. Use a coluna de níveis para ver o andar.',
      'Use a busca ou os atalhos para encontrar um serviço.',
      'Abra o serviço e toque em “Como chegar”. “Sem escadas” usa rampas e elevadores.',
    ],
  },
  tickets: {
    title: 'Do ingresso ao seu setor',
    steps: [
      'Abra “Carteira” para encontrar seus ingressos.',
      'Toque no ingresso para consultar setor, portão e lugar.',
      'Use “Ver meu setor no mapa” para localizar seu setor no estádio.',
    ],
  },
  bolao: {
    title: 'Seu primeiro palpite',
    steps: [
      'Escolha um jogo e ajuste o placar no seu palpite.',
      'Confira o prazo. Artilheiro, assistência e coringa são explicados junto aos controles.',
      'Toque em “Salvar palpite” antes do início da partida. A classificação fica no seu bolão.',
    ],
  },
  trail: {
    title: 'Acompanhe sua temporada',
    steps: [
      'Em “Como ganhar”, consulte as atividades e as regras de pontos.',
      'Acompanhe sua barra de progresso e os níveis na trilha.',
      'Confira a regra de reinício anual em “Como ganhar”. A posição no Bolão fica na classificação do bolão.',
    ],
  },
  assistant: {
    title: 'Uma pergunta por vez',
    steps: [
      'Toque em “Fazer pergunta”, no fim da tela.',
      'Escolha um tema para ver as perguntas disponíveis.',
      'Toque em uma pergunta pronta, como “Quando é o próximo jogo?”.',
    ],
  },
} as const;

export type GuidedResource = keyof typeof RESOURCE_GUIDES;

export const FEATURE_PRESENTATION = [
  {
    id: 'maracana',
    title: 'Explore o Maracanã',
    body: 'Encontre setores, portões e serviços. Veja caminhos pelo estádio e opções sem escadas.',
    note: 'Você pode explorar o Modo Maracanã mesmo sem ingresso.',
  },
  {
    id: 'tickets',
    title: 'Seu ingresso, fácil de encontrar',
    body: 'Na carteira, consulte seu ingresso, setor e portão. Depois, veja seu setor no mapa.',
    note: 'Exemplo demonstrativo. Sem validade para entrada.',
  },
  {
    id: 'nation',
    title: 'Participe da Nação',
    body: 'Dê seus palpites no Bolão e acompanhe os pontos das atividades na trilha da temporada.',
    note: 'Exemplos: nenhum palpite ou ponto é registrado.',
  },
  {
    id: 'assistant',
    title: 'Conte com o Assistente Fla',
    body: 'Toque em Fazer pergunta, escolha um tema e consulte informações sobre o aplicativo.',
    note: 'Escolha entre os temas e as perguntas disponíveis.',
  },
] as const;
