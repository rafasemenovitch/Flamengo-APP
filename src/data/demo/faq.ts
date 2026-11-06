/**
 * Base de conhecimento local do Assistente Fla (modo demo). Cada entrada
 * cita a "fonte oficial" de onde a resposta viria — no modo live, essas
 * fontes seriam documentos oficiais do clube indexados para o LLM.
 */
export interface FaqEntry {
  id: string;
  keywords: string[];
  answer: string;
  source: string;
  action?: { label: string; route: string; params?: Record<string, string> };
}

export const FAQ: FaqEntry[] = [
  {
    id: 'faq-socio-beneficios',
    keywords: ['beneficio', 'beneficios', 'socio', 'vantagem', 'plano', 'planos'],
    answer:
      'O programa Nação tem quatro planos. Sem Fronteiras (R$ 21,80/mês), para quem mora fora do Rio, com prioridade em jogos como visitante. Maraca 3, Maraca 2 e Maraca 1 dão de 60% a 75% de desconto sobre a inteira no Maracanã e prioridade crescente na compra. O Maraca 1 (R$ 357,94/mês) garante o lugar o ano todo. Todos acessam a pré-venda. Seu plano atual é o Maraca 2, com 65% de desconto.',
    source: 'Programa Nação: site oficial e matérias de abr/2026 (valores de referência)',
    action: { label: 'Ver planos', route: 'Membership' },
  },
  {
    id: 'faq-ingresso-compra',
    keywords: ['comprar', 'compra', 'ingresso', 'ingressos', 'venda', 'bilhete'],
    answer:
      'A venda abre primeiro para sócios, por ordem de prioridade, e depois para o público geral. No app, vá em Ingressos, escolha o jogo e o setor. Nesta versão, a compra é simulada.',
    source: 'Política de venda de ingressos (demonstrativo)',
    action: { label: 'Abrir Ingressos', route: 'Ingressos' },
  },
  {
    id: 'faq-chegada',
    keywords: ['chegar', 'chegada', 'horario', 'abre', 'abrem', 'portoes', 'cedo'],
    answer:
      'Os portões abrem 2h30 antes do jogo. Para jogos à noite, recomendamos chegar com pelo menos 1h30 de antecedência. O Modo Maracanã mostra o horário ideal para o seu portão.',
    source: 'Guia do torcedor no Maracanã (demonstrativo)',
    action: { label: 'Abrir Modo Maracanã', route: 'StadiumMode' },
  },
  {
    id: 'faq-transporte',
    keywords: ['metro', 'metrô', 'trem', 'onibus', 'ônibus', 'transporte', 'estacionamento', 'carro', 'uber'],
    answer:
      'O jeito mais prático é o metrô (Linha 2, Estação Maracanã) ou o trem (Estação Maracanã). Há ponto de embarque para transporte por app na Rua Eurico Rabelo e estacionamentos credenciados próximos.',
    source: 'Guia do torcedor no Maracanã (demonstrativo)',
    action: { label: 'Ver transporte', route: 'StadiumMode' },
  },
  {
    id: 'faq-proibidos',
    keywords: ['proibido', 'proibidos', 'pode levar', 'levar', 'guarda-chuva', 'bandeira', 'objetos'],
    answer:
      'Não é permitida a entrada com guarda-chuva, objetos de vidro, sinalizadores ou fogos. Bandeiras sem mastro rígido costumam ser liberadas, conforme orientação da segurança no dia.',
    source: 'Regulamento de acesso ao estádio (demonstrativo)',
  },
  {
    id: 'faq-meia',
    keywords: ['meia', 'meia-entrada', 'estudante', 'idoso', 'desconto'],
    answer:
      'Têm direito à meia-entrada estudantes, pessoas com 60 anos ou mais, pessoas com deficiência e jovens de baixa renda, conforme a lei. É preciso apresentar o documento comprobatório na entrada.',
    source: 'Lei da meia-entrada — resumo (demonstrativo)',
  },
  {
    id: 'faq-loja-troca',
    keywords: ['troca', 'trocar', 'devolucao', 'devolução', 'tamanho', 'loja'],
    answer:
      'Produtos da loja podem ser trocados em até 30 dias, com etiqueta e nota fiscal. Nesta versão, as compras são simuladas.',
    source: 'Política de trocas da loja (demonstrativo)',
    action: { label: 'Abrir loja', route: 'Store' },
  },
];

export const ASSISTANT_SUGGESTIONS = [
  'Qual portão do meu setor?',
  'Quais os benefícios do sócio?',
  'Quando é o próximo jogo?',
  'Que horas devo chegar ao estádio?',
  'Como chego de metrô?',
  'O que não posso levar ao estádio?',
];
