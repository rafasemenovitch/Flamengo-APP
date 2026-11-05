import type { AssistantMessage, AssistantReply } from '@/types/fan';

/**
 * Assistente Fla. Regra para QUALQUER implementação (FAQ local hoje, LLM
 * depois): responder apenas com base em informação oficial disponível,
 * citar as fontes em `sources` e, quando não souber, dizer isso com
 * `grounded: false` em vez de inventar.
 */
export interface AssistantService {
  getSuggestions(): Promise<string[]>;
  ask(question: string, history: AssistantMessage[]): Promise<AssistantReply>;
}
