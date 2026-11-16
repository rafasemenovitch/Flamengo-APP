import {
  budgetAllows,
  chunk,
  fixtureRow,
  freeSeasons,
  apiErrorText,
  isStale,
  matchdayAction,
  mediaPath,
  profileRow,
  quotaDayStart,
  type ApiFixture,
} from '../../supabase/functions/sync-football/logic';

const MIN = 60_000;
const kickoff = Date.UTC(2026, 10, 16, 21, 30);
const iso = (t: number) => new Date(t).toISOString();

describe('sincronização da API de futebol', () => {
  it('só busca o que venceu', () => {
    const now = Date.UTC(2026, 10, 16);
    expect(isStale(null, 1000, now)).toBe(true);
    expect(isStale(iso(now - 6 * 24 * 60 * MIN), 7 * 24 * 60 * MIN, now)).toBe(false);
    expect(isStale(iso(now - 7 * 24 * 60 * MIN), 7 * 24 * 60 * MIN, now)).toBe(true);
  });

  it('guarda 15 chamadas do dia para o essencial', () => {
    expect(budgetAllows(null, false)).toBe(true);
    expect(budgetAllows(15, false)).toBe(true);
    expect(budgetAllows(14, false)).toBe(false);
    expect(budgetAllows(14, true)).toBe(true);
    expect(budgetAllows(0, true)).toBe(false);
  });

  it('a cota do dia começa às 00:00 UTC', () => {
    expect(quotaDayStart(Date.UTC(2026, 10, 16, 23, 59))).toBe('2026-11-16T00:00:00.000Z');
  });

  it('escalação de 15 em 15 min a partir de 75 min antes, até sair', () => {
    const base = { kickoff: iso(kickoff), status: 'NS', hasLineups: false, detailsFetchedAt: null };
    expect(matchdayAction(base, kickoff - 80 * MIN)).toBeNull();
    expect(matchdayAction(base, kickoff - 75 * MIN)).toBe('lineup');
    expect(
      matchdayAction({ ...base, detailsFetchedAt: iso(kickoff - 70 * MIN) }, kickoff - 60 * MIN)
    ).toBeNull();
    expect(matchdayAction({ ...base, detailsFetchedAt: iso(kickoff - 70 * MIN) }, kickoff - 55 * MIN)).toBe(
      'lineup'
    );
    expect(matchdayAction({ ...base, hasLineups: true }, kickoff - 30 * MIN)).toBeNull();
  });

  it('ao vivo de 3 em 3 min só durante o jogo', () => {
    const live = {
      kickoff: iso(kickoff),
      status: '2H',
      hasLineups: true,
      detailsFetchedAt: iso(kickoff + 60 * MIN),
    };
    expect(matchdayAction(live, kickoff + 61 * MIN)).toBeNull();
    expect(matchdayAction(live, kickoff + 63 * MIN)).toBe('live');
    expect(matchdayAction({ ...live, status: 'FT' }, kickoff + 120 * MIN)).toBeNull();
    expect(matchdayAction({ ...live, status: 'NS' }, kickoff + 4 * 60 * MIN)).toBeNull();
  });

  it('plano gratuito: do ano −4 ao −2', () => {
    expect(freeSeasons(Date.UTC(2026, 10, 16))).toEqual([2022, 2023, 2024]);
  });

  it('erro da API vem no corpo, mesmo com HTTP 200', () => {
    expect(apiErrorText([])).toBeNull();
    expect(apiErrorText({})).toBeNull();
    expect(apiErrorText({ plan: 'Free plans do not have access to this season' })).toContain('plan');
  });

  it('agrupa até 20 jogos por chamada', () => {
    expect(
      chunk(
        Array.from({ length: 45 }, (_, i) => i),
        20
      ).map((c) => c.length)
    ).toEqual([20, 20, 5]);
  });

  it('jogo da temporada não apaga detalhes já salvos', () => {
    const f: ApiFixture = {
      fixture: { id: 1, date: '2024-12-08T19:00:00+00:00', status: { short: 'FT', elapsed: 90 } },
      league: { id: 71, name: 'Serie A', season: 2024, round: 'Regular Season - 38' },
      teams: { home: { id: 127, name: 'Flamengo' }, away: { id: 121, name: 'Palmeiras' } },
      goals: { home: 2, away: 1 },
    };
    expect(fixtureRow(f, 'agora')).not.toHaveProperty('events');
    const withDetails = fixtureRow({ ...f, events: [], lineups: [] }, 'agora');
    expect(withDetails).toHaveProperty('details_fetched_at', 'agora');
  });

  it('perfil e imagens', () => {
    expect(profileRow({ id: 1, name: 'A', height: '182 cm', weight: null }, 'agora')).toMatchObject({
      height_cm: 182,
      weight_kg: null,
    });
    expect(mediaPath('players', 9, 'https://media.api-sports.io/football/players/9.png')).toBe(
      'players/9.png'
    );
    expect(mediaPath('teams', 127, 'https://x/127.jpeg?v=2')).toBe('teams/127.jpg');
  });
});
