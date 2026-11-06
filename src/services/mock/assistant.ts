import { ASSISTANT_SUGGESTIONS, FAQ } from '@/data/demo/faq';
import type { AssistantService, MatchesService, TicketsService } from '@/services/adapters';
import type { AssistantReply } from '@/types/fan';
import { formatMatchDate } from '@/utils/format';
import { delay, normalize } from './utils';

const NOT_FOUND: AssistantReply = {
  text: 'Não encontrei essa informação nas fontes oficiais que tenho disponíveis. Prefiro não arriscar uma resposta. Você pode tentar perguntar de outro jeito ou consultar os canais oficiais do clube.',
  sources: [],
  grounded: false,
};

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

/**
 * Assistente do modo demo: intenções com dados do próprio app (portão,
 * próximo jogo) + busca por palavras-chave na FAQ local. Nunca inventa:
 * sem correspondência, responde que não sabe (grounded: false).
 * Para trocar por um LLM, implemente AssistantService em services/live
 * mantendo a mesma regra.
 */
export function createMockAssistantService(deps: {
  matches: MatchesService;
  tickets: TicketsService;
}): AssistantService {
  return {
    getSuggestions: async () => delay(ASSISTANT_SUGGESTIONS, 100),
    async ask(question) {
      const q = normalize(question);

      if (has(q, 'portao', 'meu setor', 'minha cadeira', 'meu lugar', 'entrada')) {
        const [ticket] = await deps.tickets.getWallet();
        if (ticket) {
          return delay({
            text: `Seu ingresso é para o setor ${ticket.sectorName} (${ticket.seat}). A entrada recomendada é pelo Portão ${ticket.gate}. No Modo Maracanã você vê o mapa, as filas e como chegar.`,
            sources: ['Carteira de ingressos', 'Mapa do estádio (esquemático)'],
            grounded: true,
            action: {
              label: 'Ver no mapa do estádio',
              route: 'StadiumMode',
              params: { sectorId: ticket.sectorId },
            },
          });
        }
        return delay({
          text: 'Você ainda não tem ingresso na carteira. Quando comprar, eu te digo o portão do seu setor.',
          sources: ['Carteira de ingressos'],
          grounded: true,
          action: { label: 'Ver ingressos', route: 'Ingressos' },
        });
      }

      if (has(q, 'proximo jogo', 'quando joga', 'quando e o jogo', 'que horas e o jogo', 'proxima partida')) {
        const m = await deps.matches.getFeaturedMatch();
        const opponent = m.homeTeam.id === 'fla' ? m.awayTeam : m.homeTeam;
        if (m.status === 'live' || m.status === 'halftime') {
          return delay({
            text: `O Flamengo está jogando agora contra o ${opponent.shortName}: ${m.homeTeam.shortName} ${m.score?.home ?? 0} × ${m.score?.away ?? 0} ${m.awayTeam.shortName}${m.liveMinute ? `, aos ${m.liveMinute}` : ''}.`,
            sources: ['Central de Jogos'],
            grounded: true,
            action: { label: 'Acompanhar ao vivo', route: 'MatchDetail', params: { matchId: m.id } },
          });
        }
        if (m.status === 'scheduled') {
          return delay({
            text: `O próximo jogo é ${m.homeTeam.shortName} × ${m.awayTeam.shortName}, ${m.stage}, ${formatMatchDate(m.kickoff)}, no ${m.venue.name}.`,
            sources: ['Calendário oficial (demonstrativo)'],
            grounded: true,
            action: { label: 'Ver detalhes', route: 'MatchDetail', params: { matchId: m.id } },
          });
        }
        const upcoming = await deps.matches.getMatches({ when: 'upcoming' });
        const next = upcoming[0];
        if (next) {
          return delay({
            text: `O próximo jogo é ${next.homeTeam.shortName} × ${next.awayTeam.shortName}, ${next.stage}, ${formatMatchDate(next.kickoff)}, no ${next.venue.name}.`,
            sources: ['Calendário oficial (demonstrativo)'],
            grounded: true,
            action: { label: 'Ver detalhes', route: 'MatchDetail', params: { matchId: next.id } },
          });
        }
      }

      let best: { score: number; entry: (typeof FAQ)[number] } | undefined;
      for (const entry of FAQ) {
        const score = entry.keywords.reduce((s, k) => s + (q.includes(normalize(k).trim()) ? 1 : 0), 0);
        if (score > 0 && (!best || score > best.score)) best = { score, entry };
      }
      if (best) {
        return delay(
          {
            text: best.entry.answer,
            sources: [best.entry.source],
            grounded: true,
            action: best.entry.action,
          },
          600
        );
      }
      return delay(NOT_FOUND, 600);
    },
  };
}
