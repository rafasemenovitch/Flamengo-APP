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

describe('fases das copas (mock)', () => {
  const matches = createMockMatchesService();

  it('Libertadores: grupos + mata-mata com o Flamengo na final pendente', async () => {
    const o = await matches.getCompetitionOverview('libertadores');
    expect(o.phases.map((p) => p.kind)).toEqual(['table', 'knockout']);
    const ko = o.phases[1]!.rounds!;
    const semi = ko.find((r) => r.name === 'Semifinal')!.ties.find((t) => t.home.id === 'fla')!;
    expect(semi.winnerId).toBe('fla');
    expect(semi.aggregate).toEqual({ home: 3, away: 1 });
    const final = ko[ko.length - 1]!.ties[0]!;
    expect(final.pending).toBe(true);
  });

  it('Copa do Brasil: semifinal com ida 1×1 e volta a jogar', async () => {
    const o = await matches.getCompetitionOverview('copa-do-brasil');
    const semi = o.phases[0]!.rounds!.find((r) => r.name === 'Semifinal')!.ties[0]!;
    expect(semi.legs[0]!.score).toEqual({ home: 1, away: 1 });
    expect(semi.pending).toBe(true);
  });

  it('Carioca: Flamengo lidera a Taça Guanabara e é campeão', async () => {
    const o = await matches.getCompetitionOverview('carioca');
    expect(o.phases[0]!.tables![0]!.rows[0]!.team.id).toBe('fla');
    const final = o.phases[1]!.rounds!.find((r) => r.name === 'Final')!.ties[0]!;
    expect(final.winnerId).toBe('fla');
  });
});
