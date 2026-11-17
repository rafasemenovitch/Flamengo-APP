/**
 * Números publicados pela imprensa, usados para conferir os da Wikipédia. Cada entrada
 * guarda o link e a data em que foi lida. Só entra o que está escrito na matéria.
 */
export interface PressSource {
  id: string;
  label: string;
  url: string;
  read: string;
}

export interface PressFact {
  source: string;
  matches?: number;
  goals?: number;
  titles?: number;
  /** Ano da estreia pelo Flamengo, quando a matéria informa. */
  since?: number;
}

export const PRESS_SOURCES: PressSource[] = [
  {
    id: 'lance-mais-jogos',
    label: 'Lance! · Jogadores com mais jogos pelo Flamengo',
    url: 'https://www.lance.com.br/flamengo/jogadores-com-mais-jogos-pelo-flamengo.html',
    read: '2026-11-16',
  },
  {
    id: 'goal-artilheiros',
    label: 'Goal · Os maiores artilheiros da história do Flamengo',
    url: 'https://www.goal.com/br/listas/quem-sao-os-maiores-artilheiros-da-historia-do-flamengo/b7stjqqelnyj1295ov6959yyi',
    read: '2026-11-16',
  },
  {
    id: 'goal-titulos',
    label: 'Goal · Jogadores com mais títulos pelo Flamengo',
    url: 'https://www.goal.com/br/listas/jogadores-mais-titulos-pelo-flamengo/blt1d6d7ea4097d89e6',
    read: '2026-11-16',
  },
  {
    id: 'lance-zico',
    label: 'Lance! · A história de Zico no Flamengo',
    url: 'https://www.lance.com.br/lancepedia/a-historia-de-zico-no-flamengo.html',
    read: '2026-11-16',
  },
  {
    id: 'trivela-leo-moura',
    label: 'Trivela · A dedicação de Léo Moura em 10 anos de Flamengo',
    url: 'https://trivela.com.br/brasil/dedicacao-de-leo-moura-em-10-anos-de-flamengo-merece-os-aplausos-em-seu-adeus/',
    read: '2026-11-17',
  },
  {
    id: 'trivela-fio',
    label: 'Trivela · Há 50 anos, Fio marcava o gol que o transformou em Maravilha',
    url: 'https://trivela.com.br/brasil/de-anjo-de-placa-ha-50-anos-fio-marcava-o-gol-que-o-transformou-em-maravilha/',
    read: '2026-11-16',
  },
];

export const PRESS: Record<string, PressFact[]> = {
  junior: [
    { source: 'lance-mais-jogos', matches: 875 },
    { source: 'goal-titulos', titles: 13 },
  ],
  zico: [
    { source: 'lance-mais-jogos', matches: 732 },
    { source: 'lance-zico', matches: 732, goals: 508 },
    { source: 'goal-artilheiros', matches: 732, goals: 508 },
    { source: 'goal-titulos', titles: 13 },
  ],
  adilio: [
    { source: 'lance-mais-jogos', matches: 617 },
    { source: 'goal-artilheiros', matches: 616, goals: 128 },
  ],
  jordan: [{ source: 'lance-mais-jogos', matches: 609 }],
  andrade: [{ source: 'lance-mais-jogos', matches: 570 }],
  cantarele: [{ source: 'lance-mais-jogos', matches: 557 }],
  'leo-moura': [
    { source: 'lance-mais-jogos', matches: 519 },
    { source: 'trivela-leo-moura', matches: 519, goals: 47 },
  ],
  carlinhos: [{ source: 'lance-mais-jogos', matches: 514 }],
  jadir: [{ source: 'lance-mais-jogos', matches: 498 }],
  dida: [{ source: 'goal-artilheiros', matches: 357, goals: 264, since: 1954 }],
  'henrique-frade': [{ source: 'goal-artilheiros', matches: 412, goals: 216 }],
  romario: [{ source: 'goal-artilheiros', matches: 240, goals: 204 }],
  pirillo: [{ source: 'goal-artilheiros', matches: 236, goals: 204 }],
  leonidas: [{ source: 'goal-artilheiros', matches: 149, goals: 153 }],
  bebeto: [{ source: 'goal-artilheiros', matches: 306, goals: 151 }],
  zizinho: [{ source: 'goal-artilheiros', matches: 318, goals: 148 }],
  indio: [{ source: 'goal-artilheiros', goals: 142 }],
  tita: [{ source: 'goal-artilheiros', matches: 391, goals: 135 }],
  joel: [{ source: 'goal-artilheiros', goals: 116 }],
  fio: [{ source: 'trivela-fio', matches: 294, goals: 84 }],
};
