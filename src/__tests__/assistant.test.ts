import { createMockAssistantService } from '@/services/mock/assistant';
import { createMockMembershipService, createMockStoreService } from '@/services/mock/commerce';
import { createMockGamificationService } from '@/services/mock/gamification';
import { createMockProfileService } from '@/services/mock/profile';
import { createMockMatchesService } from '@/services/mock/matches';
import { createMockStadiumService, createMockTicketsService } from '@/services/mock/tickets';

describe('Assistente Fla (mock)', () => {
  const assistant = createMockAssistantService({
    matches: createMockMatchesService(),
    tickets: createMockTicketsService(),
    stadium: createMockStadiumService(),
    store: createMockStoreService(),
    membership: createMockMembershipService(),
    gamification: createMockGamificationService(),
    profile: createMockProfileService(),
  });

  it('responde o portão a partir do ingresso, com fonte', async () => {
    const r = await assistant.ask('Qual portão do meu setor?', []);
    expect(r.grounded).toBe(true);
    expect(r.text).toContain('Portão C');
    expect(r.sources.length).toBeGreaterThan(0);
  });

  it('responde sobre o sócio com os planos reais', async () => {
    const r = await assistant.ask('Quais os benefícios do sócio?', []);
    expect(r.grounded).toBe(true);
    expect(r.text).toContain('Maraca 1');
  });

  it('diz que não sabe quando não há informação oficial', async () => {
    const r = await assistant.ask('Qual a senha do wi-fi do vestiário?', []);
    expect(r.grounded).toBe(false);
    expect(r.sources).toHaveLength(0);
  });
});

describe('Assistente Fla: catálogo de perguntas', () => {
  const assistant = createMockAssistantService({
    matches: createMockMatchesService(),
    tickets: createMockTicketsService(),
    stadium: createMockStadiumService(),
    store: createMockStoreService(),
    membership: createMockMembershipService(),
    gamification: createMockGamificationService(),
    profile: createMockProfileService(),
  });

  it('toda pergunta do catálogo tem resposta com reação do mascote', async () => {
    const topics = await assistant.getTopics();
    const ids = topics.flatMap((t) => t.questions.map((q) => q.id));
    expect(ids.length).toBeGreaterThan(20);
    for (const id of ids) {
      const r = await assistant.answer(id);
      expect(r.text.length).toBeGreaterThan(10);
      expect(r.expression).toBeDefined();
      for (const f of r.followUps ?? []) expect(assistant.findQuestion(f)).toBeDefined();
    }
  }, 60_000);

  it('portão vem do ingresso, com mapa e botão para o estádio', async () => {
    const r = await assistant.answer('meu-portao');
    expect(r.gesture).toBe('map');
    expect(r.card?.kind).toBe('ticket');
    expect(r.actions?.some((a) => a.route === 'StadiumMode')).toBe(true);
  });
});
