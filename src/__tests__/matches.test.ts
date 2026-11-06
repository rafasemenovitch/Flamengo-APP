import { FEATURED_MATCH_ID } from '@/data/demo/matches';
import { demoScenario } from '@/services/mock/demoScenario';
import { createMockMatchesService } from '@/services/mock/matches';

describe('jogo em destaque por cenário (mock)', () => {
  const matches = createMockMatchesService();

  it('pré-jogo: agendado, sem placar, com venda aberta', async () => {
    demoScenario.set('upcoming');
    const m = await matches.getFeaturedMatch();
    expect(m.id).toBe(FEATURED_MATCH_ID);
    expect(m.status).toBe('scheduled');
    expect(m.score).toBeUndefined();
    expect(m.ticketsOnSale).toBe(true);
    expect(new Date(m.kickoff).getTime()).toBeGreaterThan(Date.now());
  });

  it("ao vivo: começa aos 67' com 2 × 1", async () => {
    demoScenario.set('live');
    const m = await matches.getFeaturedMatch();
    expect(m.status).toBe('live');
    expect(m.liveMinute).toBe("67'");
    expect(m.score).toEqual({ home: 2, away: 1 });
    expect(m.stats?.length).toBeGreaterThan(0);
  });

  it('pós-jogo: 3 × 1, melhores momentos e Flamengo líder', async () => {
    demoScenario.set('finished');
    const m = await matches.getFeaturedMatch();
    expect(m.status).toBe('finished');
    expect(m.score).toEqual({ home: 3, away: 1 });
    expect(m.highlightsVideoId).toBeDefined();
    const table = await matches.getStandings('brasileirao');
    expect(table.rows[0]?.team.id).toBe('fla');
    expect(table.rows[0]?.points).toBe(70);
  });

  it('tabela tem 20 times com pontos coerentes', async () => {
    demoScenario.set('upcoming');
    const table = await matches.getStandings('brasileirao');
    expect(table.rows).toHaveLength(20);
    for (const r of table.rows) expect(r.points).toBe(r.won * 3 + r.drawn);
  });
});
