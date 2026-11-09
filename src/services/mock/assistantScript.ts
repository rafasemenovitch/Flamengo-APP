import type {
  GamificationService,
  MatchesService,
  MembershipService,
  ProfileService,
  StadiumService,
  StoreService,
  TicketsService,
} from '@/services/adapters';
import type { AssistantReply, AssistantTopic } from '@/types/fan';
import { formatCurrency, formatMatchDate, formatNumber, shiftTime } from '@/utils/format';

export interface ScriptDeps {
  matches: MatchesService;
  tickets: TicketsService;
  stadium: StadiumService;
  membership: MembershipService;
  store: StoreService;
  gamification: GamificationService;
  profile: ProfileService;
}

/**
 * Catálogo do Assistente Fla: perguntas prontas por tema. Cada resposta
 * escolhe a reação do mascote (expressão + gesto), traz botões para as
 * telas certas e, quando faz sentido, um card dentro do chat.
 */
export const TOPICS: AssistantTopic[] = [
  {
    id: 'jogos',
    title: 'Jogos',
    icon: 'football-outline',
    questions: [
      { id: 'proximo-jogo', text: 'Quando é o próximo jogo?', search: true },
      { id: 'tabela', text: 'Como está o Flamengo no Brasileirão?', search: true },
      { id: 'ultimo-resultado', text: 'Qual foi o último resultado?', search: true },
      { id: 'onde-assistir', text: 'Onde vai passar o jogo?' },
      { id: 'lembrar-jogo', text: 'Me avisa quando o jogo começar' },
    ],
  },
  {
    id: 'ingressos',
    title: 'Ingressos',
    icon: 'ticket-outline',
    questions: [
      { id: 'duvida-ingresso', text: 'Tenho uma dúvida sobre ingresso' },
      { id: 'comprar-ingresso', text: 'Como comprar ingresso?' },
      { id: 'meu-portao', text: 'Qual portão do meu setor?', search: true },
      { id: 'facial', text: 'Como funciona a entrada pelo rosto?' },
      { id: 'meia', text: 'Quem tem direito à meia-entrada?' },
    ],
  },
  {
    id: 'maracana',
    title: 'Maracanã',
    icon: 'location-outline',
    questions: [
      { id: 'como-chegar', text: 'Como chego ao Maracanã?' },
      { id: 'horario-chegada', text: 'Que horas devo chegar?', search: true },
      { id: 'o-que-levar', text: 'O que não posso levar ao estádio?' },
      { id: 'estacionamento', text: 'Tem estacionamento no estádio?' },
      { id: 'servicos', text: 'Onde ficam banheiros e bares?' },
    ],
  },
  {
    id: 'socio',
    title: 'Sócio',
    icon: 'card-outline',
    questions: [
      { id: 'planos', text: 'Quais são os planos de sócio?' },
      { id: 'meu-plano', text: 'Qual é o meu plano?', search: true },
      { id: 'prioridade', text: 'Como funciona a prioridade na compra?' },
    ],
  },
  {
    id: 'loja',
    title: 'Loja',
    icon: 'bag-handle-outline',
    questions: [
      { id: 'desconto-loja', text: 'Sócio tem desconto na loja?' },
      { id: 'meu-carrinho', text: 'O que tem no meu carrinho?', search: true },
      { id: 'troca', text: 'Como faço uma troca?' },
    ],
  },
  {
    id: 'nacao',
    title: 'Nação',
    icon: 'people-outline',
    questions: [
      { id: 'meus-pontos', text: 'Quantos pontos eu tenho?', search: true },
      { id: 'ganhar-pontos', text: 'Como ganho pontos?' },
      { id: 'pe-quente', text: 'O que é o pé quente?' },
      { id: 'bolao', text: 'Como funciona o bolão?' },
    ],
  },
  {
    id: 'conversa',
    title: 'Conversa',
    icon: 'chatbubbles-outline',
    questions: [
      { id: 'o-que-faz', text: 'O que você sabe fazer?' },
      { id: 'novidades', text: 'Tem novidade no app?' },
      { id: 'nao-achei', text: 'Minha pergunta não está aqui' },
      { id: 'valeu', text: 'Valeu, Assistente!' },
    ],
  },
];

export function findQuestion(id: string) {
  for (const t of TOPICS) {
    const q = t.questions.find((x) => x.id === id);
    if (q) return q;
  }
  return undefined;
}

const OFFICIAL = 'Informação do app (dados demonstrativos)';

type Answer = (d: ScriptDeps) => Promise<AssistantReply> | AssistantReply;

const reply = (
  r: Omit<AssistantReply, 'sources' | 'grounded'> & Partial<Pick<AssistantReply, 'sources' | 'grounded'>>
): AssistantReply => ({
  sources: [OFFICIAL],
  grounded: true,
  ...r,
});

const opponentOf = (m: {
  homeTeam: { id: string; shortName: string };
  awayTeam: { id: string; shortName: string };
}) => (m.homeTeam.id === 'fla' ? m.awayTeam : m.homeTeam);

const ANSWERS: Record<string, Answer> = {
  // ---------- Jogos ----------
  'proximo-jogo': async ({ matches }) => {
    const m = await matches.getFeaturedMatch();
    if (m.status === 'live' || m.status === 'halftime') {
      return reply({
        text: `Tá rolando agora! ${m.homeTeam.shortName} ${m.score?.home ?? 0} × ${m.score?.away ?? 0} ${m.awayTeam.shortName}${m.liveMinute ? `, aos ${m.liveMinute}` : ''}.`,
        expression: 'happy',
        gesture: 'point-side',
        card: {
          kind: 'match',
          matchId: m.id,
          title: `${m.homeTeam.shortName} × ${m.awayTeam.shortName}`,
          subtitle: `${m.stage} · ao vivo`,
          meta: m.venue.name,
        },
        actions: [
          {
            label: 'Acompanhar lance a lance',
            route: 'MatchDetail',
            params: { matchId: m.id },
            primary: true,
          },
        ],
        followUps: ['lembrar-jogo', 'tabela'],
      });
    }
    const next = m.status === 'scheduled' ? m : (await matches.getMatches({ when: 'upcoming' }))[0];
    if (!next)
      return reply({
        text: 'Não achei o próximo jogo no calendário agora.',
        expression: 'sorry',
        grounded: false,
        sources: [],
      });
    return reply({
      text: `O próximo é contra o ${opponentOf(next).shortName}, ${formatMatchDate(next.kickoff)}. Olha o card aqui do lado.`,
      expression: 'talking',
      gesture: 'point-side',
      card: {
        kind: 'match',
        matchId: next.id,
        title: `${next.homeTeam.shortName} × ${next.awayTeam.shortName}`,
        subtitle: next.stage,
        meta: `${formatMatchDate(next.kickoff)} · ${next.venue.name}`,
      },
      actions: [
        { label: 'Ver detalhes', route: 'MatchDetail', params: { matchId: next.id } },
        ...(next.ticketsOnSale
          ? [
              {
                label: 'Comprar ingresso',
                route: 'TicketPurchase',
                params: { matchId: next.id },
                primary: true,
              },
            ]
          : []),
      ],
      followUps: ['onde-assistir', 'lembrar-jogo'],
    });
  },
  tabela: async ({ matches }) => {
    const t = await matches.getStandings('brasileirao');
    const fla = t.rows.find((r) => r.team.id === 'fla');
    const leader = t.rows[0];
    if (!fla || !leader)
      return reply({
        text: 'Não consegui ler a tabela agora.',
        expression: 'sorry',
        grounded: false,
        sources: [],
      });
    const lider = fla.position === 1;
    return reply({
      text: lider
        ? `Mengão na liderança! ${fla.points} pontos em ${fla.played} jogos.`
        : `O Flamengo está em ${fla.position}º, com ${fla.points} pontos. ${leader.team.shortName} lidera com ${leader.points}. Diferença de ${leader.points - fla.points}.`,
      expression: lider ? 'happy' : 'talking',
      card: {
        kind: 'facts',
        items: [
          { label: 'Posição', value: `${fla.position}º` },
          { label: 'Pontos', value: String(fla.points) },
          { label: 'Vitórias', value: String(fla.won) },
          { label: 'Saldo', value: String(fla.goalsFor - fla.goalsAgainst) },
        ],
      },
      actions: [
        {
          label: 'Ver tabela completa',
          route: 'Standings',
          params: { competitionId: 'brasileirao' },
          primary: true,
        },
      ],
      followUps: ['proximo-jogo'],
    });
  },
  'ultimo-resultado': async ({ matches }) => {
    const [last] = await matches.getMatches({ when: 'results' });
    if (!last || !last.score)
      return reply({
        text: 'Não achei resultado recente.',
        expression: 'sorry',
        grounded: false,
        sources: [],
      });
    const flaHome = last.homeTeam.id === 'fla';
    const fla = flaHome ? last.score.home : last.score.away;
    const opp = flaHome ? last.score.away : last.score.home;
    const won = fla > opp;
    const draw = fla === opp;
    return reply({
      text: `${last.homeTeam.shortName} ${last.score.home} × ${last.score.away} ${last.awayTeam.shortName}, pelo ${last.stage}. ${won ? 'Vitória rubro-negra!' : draw ? 'Ficou no empate. Bora pro próximo.' : 'Uma vez Flamengo, sempre Flamengo. Bora pro próximo.'}`,
      expression: won ? 'happy' : draw ? 'talking' : 'sorry',
      actions: [
        { label: 'Ver resumo da partida', route: 'MatchDetail', params: { matchId: last.id }, primary: true },
      ],
      followUps: ['proximo-jogo', 'tabela'],
    });
  },
  'onde-assistir': async ({ matches }) => {
    const m = await matches.getFeaturedMatch();
    return reply({
      text: `${m.homeTeam.shortName} × ${m.awayTeam.shortName} vai passar em: ${m.broadcast?.join(', ') ?? 'a definir'}. Dica: os melhores momentos saem na FlaTV logo depois do jogo.`,
      expression: 'wink',
      actions: [
        { label: 'Abrir FlaTV', route: 'FlaTV' },
        { label: 'Detalhes do jogo', route: 'MatchDetail', params: { matchId: m.id } },
      ],
      followUps: ['lembrar-jogo'],
    });
  },
  'lembrar-jogo': async ({ profile }) => {
    const p = await profile.getProfile();
    await profile.updateProfile({ notifications: { ...p.notifications, matchStart: true, goals: true } });
    return reply({
      text: 'Missão cumprida! Ativei os avisos de início de jogo e de gol pra você. Pode deixar que eu te chamo.',
      expression: 'happy',
      gesture: 'salute',
      actions: [{ label: 'Ver minhas notificações', route: 'Settings' }],
      followUps: ['proximo-jogo'],
    });
  },

  // ---------- Ingressos ----------
  'duvida-ingresso': () =>
    reply({
      text: 'Claro! Mas me ajuda a entender: é sobre comprar um ingresso novo ou sobre um que você já tem?',
      expression: 'confused',
      followUps: ['comprar-ingresso', 'meu-portao', 'facial', 'meia'],
    }),
  'comprar-ingresso': () =>
    reply({
      text: 'É rapidinho. Segue o passo a passo:',
      expression: 'talking',
      gesture: 'clipboard',
      card: {
        kind: 'steps',
        steps: [
          'Abra a aba Ingressos e escolha o jogo',
          'Toque no setor no mapa do estádio',
          'Escolha o tipo: sócio, inteira ou meia',
          'Confirme. O ingresso vai direto pra sua carteira',
        ],
      },
      actions: [{ label: 'Ver jogos à venda', route: 'Ingressos', primary: true }],
      followUps: ['meia', 'prioridade'],
    }),
  'meu-portao': async ({ tickets }) => {
    const [t] = await tickets.getWallet();
    if (!t) {
      return reply({
        text: 'Ainda não achei ingresso na sua carteira. Quando você comprar, eu te digo o portão certinho.',
        expression: 'sorry',
        actions: [{ label: 'Comprar ingresso', route: 'Ingressos', primary: true }],
      });
    }
    return reply({
      text: `Seu setor é ${t.sectorName}. Entre pelo Portão ${t.gate}. Te mostro no mapa:`,
      expression: 'talking',
      gesture: 'map',
      card: {
        kind: 'ticket',
        ticketId: t.id,
        title: 'Seu ingresso',
        sector: t.sectorName,
        gate: t.gate,
        seat: t.seat,
      },
      actions: [
        {
          label: 'Ver no mapa do estádio',
          route: 'StadiumMode',
          params: { sectorId: t.sectorId },
          primary: true,
        },
        { label: 'Abrir ingresso', route: 'TicketDetail', params: { ticketId: t.id } },
      ],
      followUps: ['horario-chegada', 'como-chegar'],
    });
  },
  facial: () =>
    reply({
      text: 'No Maracanã a entrada é pelo rosto. Você cadastra uma selfie uma vez, ela fica ligada à sua conta e vale pra todos os seus ingressos. Na catraca, é só olhar pra câmera.',
      expression: 'talking',
      gesture: 'phone',
      actions: [{ label: 'Abrir meu ingresso', route: 'TicketWallet', primary: true }],
      followUps: ['meu-portao'],
    }),
  meia: () =>
    reply({
      text: 'Têm direito à meia: estudantes, pessoas com 60 anos ou mais, pessoas com deficiência e jovens de baixa renda. Leve o documento que comprova na entrada.',
      expression: 'talking',
      sources: ['Lei da meia-entrada (resumo demonstrativo)'],
      followUps: ['comprar-ingresso'],
    }),

  // ---------- Maracanã ----------
  'como-chegar': () =>
    reply({
      text: 'O melhor jeito é de metrô (Linha 2) ou trem, os dois param na Estação Maracanã, com passarela direto pro estádio. No Modo Maracanã eu te mostro a rota a partir de onde você está.',
      expression: 'talking',
      gesture: 'map',
      actions: [
        { label: 'Traçar minha rota', route: 'StadiumMode', params: { tab: 'chegar' }, primary: true },
      ],
      followUps: ['horario-chegada', 'estacionamento'],
    }),
  'horario-chegada': async ({ matches, stadium, tickets }) => {
    const m = await matches.getFeaturedMatch();
    const [t] = await tickets.getWallet();
    const plan = await stadium.getMatchDayPlan(m.id, t?.sectorId);
    const arrival = shiftTime(m.kickoff, Number(plan.recommendedArrival));
    const open = shiftTime(m.kickoff, Number(plan.gatesOpenAt));
    return reply({
      text: `Pro jogo de ${formatMatchDate(m.kickoff)}, chega às ${arrival} no Portão ${plan.recommendedGateId}. Os portões abrem às ${open}. Chegando cedo você foge da fila.`,
      expression: 'wink',
      card: {
        kind: 'facts',
        items: [
          { label: 'Chegue às', value: arrival },
          { label: 'Portões abrem', value: open },
          { label: 'Seu portão', value: plan.recommendedGateId },
        ],
      },
      actions: [{ label: 'Ver filas agora', route: 'StadiumMode', params: { tab: 'filas' }, primary: true }],
      followUps: ['como-chegar', 'o-que-levar'],
    });
  },
  'o-que-levar': () =>
    reply({
      text: 'Checklist do dia de jogo:',
      expression: 'talking',
      gesture: 'clipboard',
      card: {
        kind: 'steps',
        title: 'Pode e não pode',
        steps: [
          'Leve documento com foto',
          'Ingresso no app (ou rosto cadastrado)',
          'Não pode: guarda-chuva, vidro, sinalizador e fogos',
          'Bandeira sem mastro rígido costuma ser liberada',
        ],
      },
      followUps: ['horario-chegada'],
    }),
  estacionamento: () =>
    reply({
      text: 'Poxa, o Maracanã não tem estacionamento próprio em dia de jogo. O jeito é ir de metrô, trem ou transporte por app, com embarque na Rua Prof. Eurico Rabelo.',
      expression: 'sorry',
      actions: [{ label: 'Ver como chegar', route: 'StadiumMode', params: { tab: 'chegar' }, primary: true }],
      followUps: ['como-chegar'],
    }),
  servicos: () =>
    reply({
      text: 'No mapa do estádio, ligue as camadas de banheiros e alimentação. Tocando no seu setor, eu mostro o que fica mais perto.',
      expression: 'wink',
      gesture: 'point-up',
      actions: [
        { label: 'Abrir mapa do estádio', route: 'StadiumMode', params: { tab: 'estadio' }, primary: true },
      ],
    }),

  // ---------- Sócio ----------
  planos: async ({ membership }) => {
    const plans = await membership.getPlans();
    return reply({
      text: 'O programa Nação tem quatro planos. Quanto maior o plano, maior o desconto e a prioridade:',
      expression: 'talking',
      card: {
        kind: 'facts',
        items: plans.map((p) => ({
          label: p.name.replace('Nação ', ''),
          value: `${formatCurrency(p.monthlyPrice)}/mês`,
        })),
      },
      actions: [{ label: 'Ver planos e benefícios', route: 'Membership', primary: true }],
      sources: ['Programa Nação (valores de referência, nov/2026)'],
      followUps: ['meu-plano', 'prioridade'],
    });
  },
  'meu-plano': async ({ membership }) => {
    const [m, plans] = await Promise.all([membership.getMembership(), membership.getPlans()]);
    const plan = plans.find((p) => p.id === m?.planId);
    if (!m || !plan)
      return reply({
        text: 'Você ainda não é sócio. Quer conhecer os planos?',
        expression: 'wink',
        actions: [{ label: 'Ver planos', route: 'Membership', primary: true }],
      });
    return reply({
      text: `Você é ${plan.name}: ${plan.ticketDiscountPct}% de desconto sobre a inteira e prioridade ${plan.ticketPriority} na compra. Boa!`,
      expression: 'happy',
      card: {
        kind: 'facts',
        items: [
          { label: 'Plano', value: plan.name.replace('Nação ', '') },
          { label: 'Pontos de prioridade', value: formatNumber(m.priorityPoints) },
        ],
      },
      actions: [{ label: 'Abrir carteirinha', route: 'Membership', primary: true }],
      followUps: ['prioridade'],
    });
  },
  prioridade: () =>
    reply({
      text: 'A fila de compra segue esta ordem:',
      expression: 'talking',
      gesture: 'clipboard',
      card: {
        kind: 'steps',
        steps: [
          'Nação Maraca 1',
          'Nação Maraca 2',
          'Nação Maraca 3',
          'Nação Sem Fronteiras',
          'Público geral',
        ],
      },
      actions: [{ label: 'Ver planos', route: 'Membership' }],
      sources: ['Programa Nação (referência)'],
    }),

  // ---------- Loja ----------
  'desconto-loja': () =>
    reply({
      text: 'Tem sim! O desconto de sócio já aparece em cada produto e é aplicado sozinho no carrinho.',
      expression: 'wink',
      actions: [{ label: 'Abrir loja', route: 'Store', primary: true }],
      followUps: ['meu-carrinho'],
    }),
  'meu-carrinho': async ({ store }) => {
    const c = await store.getCart();
    if (!c.items.length) {
      return reply({
        text: 'Seu carrinho está vazio. O manto novo está te esperando.',
        expression: 'wink',
        gesture: 'point-up',
        actions: [{ label: 'Ver o Manto 2026', route: 'Store', primary: true }],
      });
    }
    return reply({
      text: `Você tem ${c.items.reduce((s, i) => s + i.quantity, 0)} item(ns), total de ${formatCurrency(c.total)} já com desconto de sócio.`,
      expression: 'talking',
      card: {
        kind: 'facts',
        items: c.items.map((i) => ({
          label: `${i.quantity}× ${i.product.name}`,
          value: formatCurrency(i.lineTotal),
        })),
      },
      actions: [{ label: 'Ir para o carrinho', route: 'Cart', primary: true }],
    });
  },
  troca: () =>
    reply({
      text: 'Trocas em até 30 dias, com etiqueta e nota fiscal:',
      expression: 'talking',
      gesture: 'clipboard',
      card: {
        kind: 'steps',
        steps: [
          'Guarde a etiqueta e a nota',
          'Acesse seus pedidos',
          'Escolha troca ou devolução',
          'Envie pelo correio ou leve na loja',
        ],
      },
      sources: ['Política de trocas (demonstrativa)'],
    }),

  // ---------- Nação ----------
  'meus-pontos': async ({ gamification }) => {
    const p = await gamification.getProgress();
    return reply({
      text: `Você tem ${formatNumber(p.points)} pontos e está no nível ${p.level.name}.${p.nextLevel ? ` Faltam ${formatNumber(p.nextLevel.minPoints - p.points)} pra ${p.nextLevel.name}.` : ''}`,
      expression: 'happy',
      card: {
        kind: 'facts',
        items: [
          { label: 'Pontos', value: formatNumber(p.points) },
          { label: 'Nível', value: p.level.name },
          { label: 'Pé quente', value: `${p.luckyStreak} seguidas` },
        ],
      },
      actions: [{ label: 'Abrir Nação', route: 'Nacao', primary: true }],
      followUps: ['ganhar-pontos', 'pe-quente'],
    });
  },
  'ganhar-pontos': () =>
    reply({
      text: 'Dá pra somar pontos assim:',
      expression: 'talking',
      gesture: 'clipboard',
      card: {
        kind: 'steps',
        steps: [
          'Palpite do jogo: +10',
          'Acertar o quiz do dia: +50',
          'Votar na enquete: +5',
          'Ir ao estádio: carimbo no Passaporte',
        ],
      },
      actions: [{ label: 'Jogar agora', route: 'Nacao', primary: true }],
    }),
  'pe-quente': async ({ gamification }) => {
    const p = await gamification.getProgress();
    const rival = p.luckyFriends.find((f) => f.streak > p.luckyStreak);
    return reply({
      text: `Pé quente é a sequência de vitórias nos jogos em que você foi ao estádio. Você está com ${p.luckyStreak}.${rival ? ` O ${rival.name} tem ${rival.streak}. Bora alcançar?` : ' Ninguém entre seus amigos te passa!'}`,
      expression: 'wink',
      actions: [{ label: 'Ver meu Passaporte', route: 'Passport', primary: true }],
    });
  },
  bolao: () =>
    reply({
      text: 'No bolão você palpita o placar com seus amigos. Placar na mosca vale mais. O ranking de cada bolão fica na aba Nação.',
      expression: 'talking',
      actions: [{ label: 'Ver meus bolões', route: 'Nacao', primary: true }],
      followUps: ['ganhar-pontos'],
    }),

  // ---------- Conversa ----------
  'o-que-faz': () =>
    reply({
      text: 'Eu te ajudo com jogos, ingressos, o dia no Maracanã, sócio, loja e seus pontos. Toque em "Fazer pergunta" e escolha um tema. Sempre que der, eu te levo direto pra tela certa.',
      expression: 'talking',
      gesture: 'phone',
      followUps: ['proximo-jogo', 'meu-portao', 'meus-pontos'],
    }),
  novidades: () =>
    reply({
      text: 'Olha só: agora tem o Modo Maracanã com rota até o estádio, e o pé quente no seu Passaporte!',
      expression: 'happy',
      gesture: 'point-up',
      actions: [
        { label: 'Abrir Modo Maracanã', route: 'StadiumMode', primary: true },
        { label: 'Ver pé quente', route: 'Passport' },
      ],
    }),
  'nao-achei': () =>
    reply({
      text: 'Poxa, ainda não sei responder tudo. Por enquanto eu respondo os temas da lista. Pra outras dúvidas, os canais oficiais do clube são o melhor caminho.',
      expression: 'sorry',
      grounded: false,
      sources: [],
      followUps: ['o-que-faz'],
    }),
  valeu: () =>
    reply({
      text: 'Tamo junto, rubro-negro! Qualquer coisa, é só chamar. Uma vez Flamengo, sempre Flamengo!',
      expression: 'happy',
      sources: [],
    }),
};

export async function answerQuestion(id: string, deps: ScriptDeps): Promise<AssistantReply> {
  const fn = ANSWERS[id];
  if (!fn) {
    return {
      text: 'Hum, não entendi essa. Escolhe uma das perguntas da lista?',
      expression: 'confused',
      grounded: false,
      sources: [],
      followUps: ['o-que-faz'],
    };
  }
  try {
    return await fn(deps);
  } catch {
    return {
      text: 'Perdemos o sinal aqui. Tenta de novo em instantes?',
      expression: 'sorry',
      grounded: false,
      sources: [],
    };
  }
}
