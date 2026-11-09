import type { AssistantMessage, AssistantQuestion, AssistantReply, AssistantTopic } from '@/types/fan';

/**
 * Assistente Fla. Regra para QUALQUER implementação (FAQ local hoje, LLM
 * depois): responder apenas com base em informação oficial disponível,
 * citar as fontes em `sources` e, quando não souber, dizer isso com
 * `grounded: false` em vez de inventar.
 */
export interface AssistantService {
  getSuggestions(): Promise<string[]>;
  /** Pergunta livre (texto). Mantida para a integração futura com LLM. */
  ask(question: string, history: AssistantMessage[]): Promise<AssistantReply>;
  /** Catálogo de perguntas prontas, por tema (modo atual do chat). */
  getTopics(): Promise<AssistantTopic[]>;
  findQuestion(id: string): AssistantQuestion | undefined;
  /** Resposta de uma pergunta do catálogo, com reação do mascote, botões e cards. */
  answer(questionId: string): Promise<AssistantReply>;
}
