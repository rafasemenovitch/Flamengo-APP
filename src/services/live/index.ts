import type { Services } from '@/services/adapters';

/**
 * Integrações reais (APIs oficiais do clube, bilheteria, loja, CRM de sócios,
 * LLM do Assistente). Ainda não implementadas: cada domínio deve ganhar seu
 * próprio arquivo aqui (ex.: live/matches.ts) implementando a interface de
 * services/adapters — a UI não muda.
 *
 * Enquanto isso, qualquer chamada falha com uma mensagem clara.
 */
function notImplemented<T extends object>(domain: string): T {
  return new Proxy({} as T, {
    get(_target, method) {
      return () => {
        throw new Error(
          `Integração live de "${domain}.${String(method)}" ainda não foi implementada. Use EXPO_PUBLIC_DATA_SOURCE=demo.`
        );
      };
    },
  });
}

export function createLiveServices(): Services {
  return {
    matches: notImplemented('matches'),
    news: notImplemented('news'),
    flatv: notImplemented('flatv'),
    recommendations: notImplemented('recommendations'),
    tickets: notImplemented('tickets'),
    stadium: notImplemented('stadium'),
    store: notImplemented('store'),
    membership: notImplemented('membership'),
    gamification: notImplemented('gamification'),
    assistant: notImplemented('assistant'),
    auth: notImplemented('auth'),
    profile: notImplemented('profile'),
  };
}
