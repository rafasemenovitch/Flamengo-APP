import { createMockAssistantService } from '@/services/mock/assistant';
import { createMockMatchesService } from '@/services/mock/matches';
import { createMockTicketsService } from '@/services/mock/tickets';

describe('Assistente Fla (mock)', () => {
  const assistant = createMockAssistantService({
    matches: createMockMatchesService(),
    tickets: createMockTicketsService(),
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
