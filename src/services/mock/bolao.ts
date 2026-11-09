import { demoDate } from '@/data/demo/clock';
import { SQUAD, TEAMS } from '@/data/demo/seed';
import type { BolaoService } from '@/services/adapters';
import type {
  BolaoGuess,
  BolaoMatch,
  BolaoMember,
  BolaoMemberGuess,
  BolaoPool,
  BolaoPreview,
  BolaoSeasonPick,
} from '@/types/bolao';
import type { MatchDetail } from '@/types/match';
import { makeInviteCode, normalizeCode, scoreGuess } from '@/utils/bolaoScoring';
import { allDetails } from './matches';
import { delay, hash, NotFoundError, structuredCloneSafe } from './utils';

const YOU = 'Você';
const FLA = 'fla';
/** Pontos do torcedor em rodadas anteriores ao período mostrado no demo. */
const BASE_POINTS = 70;
const BASE_EXACT = 3;

const byShortName = new Map(SQUAD.map((p) => [p.shortName, p.id]));

function isFlaHome(m: MatchDetail) {
  return m.homeTeam.id === FLA;
}

function flaInvolvement(m: MatchDetail) {
  const side = isFlaHome(m) ? 'home' : 'away';
  const goals = m.events.filter((e) => (e.type === 'goal' || e.type === 'penalty-goal') && e.side === side);
  return {
    scorers: goals.map((g) => byShortName.get(g.playerName ?? '')).filter(Boolean) as string[],
    assists: goals.map((g) => byShortName.get(g.secondaryName ?? '')).filter(Boolean) as string[],
  };
}

/** Palpites já feitos em jogos encerrados (mandante × visitante, como o placar). */
const guesses = new Map<string, BolaoGuess>(
  (
    [
      ['m-bra-32', 0, 1, 'p10', 'p20', false],
      ['m-cdb-sf1', 1, 1, 'p07', undefined, false],
      ['m-bra-31', 2, 0, 'p09', 'p20', true],
      ['m-lib-sf2', 1, 0, 'p10', 'p07', false],
      ['m-bra-30', 3, 1, 'p11', undefined, false],
    ] as const
  ).map(([matchId, home, away, scorerId, assistId, joker]) => [
    matchId,
    { matchId, home, away, scorerId, assistId, joker, savedAt: demoDate(-30) },
  ])
);

const seasonPicks: BolaoSeasonPick[] = [
  {
    id: 'sp-bra',
    question: 'Quem será o campeão brasileiro?',
    points: 30,
    locksAt: demoDate(12, '23:59'),
    options: ['fla', 'pal', 'bot', 'cru', 'flu'].map((id) => ({
      id,
      label: id === FLA ? 'Flamengo' : (TEAMS[id]?.name ?? id),
    })),
    choiceId: 'fla',
  },
  {
    id: 'sp-art',
    question: 'Quem será o artilheiro do Flamengo na temporada?',
    points: 20,
    locksAt: demoDate(12, '23:59'),
    options: SQUAD.filter((p) => p.position === 'Atacante' || p.position === 'Meia')
      .slice(0, 8)
      .map((p) => ({ id: p.id, label: p.shortName })),
  },
  {
    id: 'sp-lib',
    question: 'Até onde o Flamengo vai na Libertadores?',
    points: 15,
    locksAt: demoDate(20, '23:59'),
    options: [
      { id: 'campeao', label: 'Campeão' },
      { id: 'vice', label: 'Vice-campeão' },
    ],
  },
];

type PoolSeed = Omit<BolaoPool, 'members'> & {
  others: [name: string, points: number, exact: number, movement: number][];
  youMovement: number;
  /** Ajuste dos pontos do torcedor neste bolão (escopo diferente de jogos). */
  youOffset: number;
};

const OTHERS_RESENHA: PoolSeed['others'] = [
  ['Bruno Costa', 141, 7, 0],
  ['Lívia Andrade', 128, 6, 1],
  ['Marcos Paulo', 119, 4, -1],
  ['Pedro Henrique', 104, 3, 2],
  ['Camila Reis', 97, 4, 0],
  ['Diego Faria', 88, 2, -2],
  ['Ana Clara', 81, 3, 1],
  ['Thiago Melo', 74, 1, 0],
  ['Juliana Rocha', 66, 2, -1],
  ['Felipe Nunes', 52, 1, 0],
  ['Gabriel Lopes', 40, 0, 0],
];

let pools: PoolSeed[] = [
  {
    id: 'bp-resenha',
    name: 'Resenha do Maraca',
    code: 'RSNH26',
    adminName: YOU,
    isAdmin: true,
    scope: 'todos',
    requireApproval: true,
    createdAt: demoDate(-120),
    requests: [{ id: 'rq1', name: 'Lucas Martins', requestedAt: demoDate(0, '09:12') }],
    status: 'member',
    others: OTHERS_RESENHA,
    youMovement: 1,
    youOffset: 0,
  },
  {
    id: 'bp-firma',
    name: 'Firma Rubro-Negra',
    code: 'FRM7QK',
    adminName: 'Bruno Costa',
    isAdmin: false,
    scope: 'brasileirao',
    requireApproval: true,
    createdAt: demoDate(-90),
    requests: [],
    status: 'member',
    others: [
      ['Bruno Costa', 102, 5, 0],
      ['Renata Alves', 99, 4, 0],
      ['Carlos Souza', 77, 2, 1],
      ['Patrícia Lima', 63, 2, -1],
      ['Eduardo Pires', 58, 1, 0],
      ['Fernanda Dias', 41, 1, 0],
      ['Rodrigo Tel', 30, 0, 0],
    ],
    youMovement: 2,
    youOffset: -22,
  },
];

/** Bolões que existem e podem ser encontrados pelo código (demo). */
const DIRECTORY: PoolSeed[] = [
  {
    id: 'bp-zn',
    name: 'Bolão da Zona Norte',
    code: 'NACAO26',
    adminName: 'Carlos Eduardo',
    isAdmin: false,
    scope: 'todos',
    requireApproval: true,
    createdAt: demoDate(-200),
    requests: [],
    status: 'member',
    others: Array.from({ length: 45 }, (_, i) => [
      `Torcedor ${String.fromCharCode(65 + (i % 26))}. ${['Silva', 'Souza', 'Lima', 'Costa', 'Rocha'][i % 5]}`,
      220 - i * 4,
      Math.max(0, 9 - Math.floor(i / 5)),
      (i % 3) - 1,
    ]),
    youMovement: 0,
    youOffset: 0,
  },
  {
    id: 'bp-nit',
    name: 'Rubro-Negros de Niterói',
    code: 'FLA2026',
    adminName: 'Marcelo Tavares',
    isAdmin: false,
    scope: 'brasileirao',
    requireApproval: false,
    createdAt: demoDate(-150),
    requests: [],
    status: 'member',
    others: Array.from({ length: 22 }, (_, i) => [
      `${['Rafa', 'Duda', 'Leo', 'Bia', 'Gui', 'Nina'][i % 6]} ${['M.', 'S.', 'R.', 'T.'][i % 4]}`,
      150 - i * 6,
      Math.max(0, 6 - Math.floor(i / 4)),
      0,
    ]),
    youMovement: 0,
    youOffset: -22,
  },
];

/** Pedidos de entrada: aprovados sozinhos alguns segundos depois (simula o admin). */
const joinRequests = new Map<string, number>();
const APPROVAL_MS = 6000;

const nameOf = (id?: string) => SQUAD.find((p) => p.id === id)?.shortName;

function bolaoMatch(m: MatchDetail): BolaoMatch {
  const base = bolaoMatchCore(m);
  const g = base.guess;
  return g ? { ...base, guessNames: { scorer: nameOf(g.scorerId), assist: nameOf(g.assistId) } } : base;
}

function bolaoMatchCore(m: MatchDetail): BolaoMatch {
  const guess = guesses.get(m.id);
  const locked = m.status !== 'scheduled';
  if (m.status === 'finished' && m.score) {
    const { scorers, assists } = flaInvolvement(m);
    return {
      match: m,
      guess,
      locked,
      flaScorers: scorers,
      flaAssists: assists,
      points: guess ? scoreGuess(guess, m.score, scorers, assists) : undefined,
    };
  }
  return { match: m, guess, locked };
}

function matchesState() {
  const all = allDetails().filter((m) => m.homeTeam.id === FLA || m.awayTeam.id === FLA);
  const open = all.filter((m) => m.status !== 'finished').map(bolaoMatch);
  const closed = all
    .filter((m) => m.status === 'finished')
    .reverse()
    .slice(0, 6)
    .map(bolaoMatch);
  return { open, closed };
}

function yourTotals(offset = 0) {
  const { closed } = matchesState();
  const scored = closed.filter((c) => c.points);
  return {
    points: BASE_POINTS + offset + scored.reduce((a, c) => a + c.points!.total, 0),
    exact: BASE_EXACT + scored.filter((c) => c.points!.kind === 'exact').length,
    results: scored.filter((c) => c.points!.kind !== 'miss' && c.points!.kind !== 'goals').length + 9,
  };
}

function nextOpenMatchId() {
  return matchesState().open.find((m) => !m.locked)?.match.id;
}

function buildPool(seed: PoolSeed): BolaoPool {
  const you = yourTotals(seed.youOffset);
  const nextId = nextOpenMatchId();
  const members: BolaoMember[] = [
    ...seed.others.map(([name, points, exactScores, movement], i) => ({
      id: `${seed.id}-m${i}`,
      name,
      points,
      exactScores,
      movement,
      isAdmin: name === seed.adminName,
      guessedNext: hash(`${seed.id}${name}`) % 3 !== 0,
    })),
    {
      id: `${seed.id}-you`,
      name: YOU,
      points: you.points,
      exactScores: you.exact,
      movement: seed.youMovement,
      isYou: true,
      isAdmin: seed.isAdmin,
      guessedNext: !!(nextId && guesses.has(nextId)),
    },
  ].sort((a, b) => b.points - a.points || b.exactScores - a.exactScores);
  const { others: _o, youMovement: _y, youOffset: _f, ...rest } = seed;
  return { ...rest, members };
}

function refreshRequests() {
  const now = Date.now();
  for (const [code, at] of joinRequests) {
    if (now - at < APPROVAL_MS) continue;
    const found = DIRECTORY.find((d) => d.code === code);
    joinRequests.delete(code);
    if (found && !pools.some((p) => p.id === found.id)) pools = [...pools, { ...found, status: 'member' }];
  }
}

function pendingPools(): PoolSeed[] {
  return [...joinRequests.keys()]
    .map((code) => DIRECTORY.find((d) => d.code === code))
    .filter((d): d is PoolSeed => !!d)
    .map((d) => ({ ...d, status: 'pending' as const }));
}

/** Palpite fictício (estável) de um membro. */
function fakeGuess(seedKey: string) {
  const h = hash(seedKey);
  const home = [1, 2, 2, 3, 1, 0, 2, 1][h % 8]!;
  const away = [0, 1, 0, 1, 1, 0, 2, 0][(h >>> 3) % 8]!;
  const attackers = SQUAD.filter((p) => p.position === 'Atacante' || p.position === 'Meia');
  return { home, away, scorerId: attackers[(h >>> 5) % attackers.length]!.id };
}

export function createMockBolaoService(): BolaoService {
  return {
    async getSummary() {
      const { open } = matchesState();
      const you = yourTotals();
      const pending = open.filter((m) => !m.locked && !m.guess).length;
      const month = new Date().getMonth();
      const jokerUsed = [...guesses.values()].some(
        (g) =>
          g.joker &&
          open.some((m) => m.match.id === g.matchId && new Date(m.match.kickoff).getMonth() === month)
      );
      return delay(
        {
          totalPoints: you.points,
          exactScores: you.exact,
          correctResults: you.results,
          guessesMade: guesses.size + 14,
          pendingGuesses: pending,
          jokerAvailable: !jokerUsed,
        },
        200
      );
    },
    getMatches: async () => delay(matchesState(), 250),
    async getMatch(matchId) {
      const m = allDetails().find((x) => x.id === matchId);
      if (!m) throw new NotFoundError('Partida', matchId);
      return delay(bolaoMatch(m), 150);
    },
    async saveGuess(input) {
      const m = allDetails().find((x) => x.id === input.matchId);
      if (!m) throw new NotFoundError('Partida', input.matchId);
      if (m.status !== 'scheduled') throw new Error('Os palpites deste jogo já fecharam.');
      const g: BolaoGuess = { ...input, savedAt: new Date().toISOString() };
      guesses.set(input.matchId, g);
      return delay(g, 400);
    },
    async jokerUsedElsewhere(matchId) {
      const m = allDetails().find((x) => x.id === matchId);
      const month = m ? new Date(m.kickoff).getMonth() : -1;
      const used = [...guesses.values()].some((g) => {
        if (!g.joker || g.matchId === matchId) return false;
        const other = allDetails().find((x) => x.id === g.matchId);
        return !!other && new Date(other.kickoff).getMonth() === month;
      });
      return delay(used, 50);
    },

    getSeasonPicks: async () => delay(seasonPicks, 200),
    async saveSeasonPick(pickId, optionId) {
      const p = seasonPicks.find((x) => x.id === pickId);
      if (!p) throw new NotFoundError('Palpite da temporada', pickId);
      p.choiceId = optionId;
      return delay(p, 250);
    },

    async getMyPools() {
      refreshRequests();
      return delay([...pools.map(buildPool), ...pendingPools().map(buildPool)], 250);
    },
    async getPool(poolId) {
      refreshRequests();
      const seed = [...pools, ...pendingPools()].find((p) => p.id === poolId);
      if (!seed) throw new NotFoundError('Bolão', poolId);
      return delay(buildPool(seed), 200);
    },
    async createPool(input) {
      const id = `bp-${Date.now().toString(36)}`;
      const seed: PoolSeed = {
        id,
        name: input.name.trim(),
        code: makeInviteCode(id),
        adminName: YOU,
        isAdmin: true,
        scope: input.scope,
        requireApproval: input.requireApproval,
        createdAt: new Date().toISOString(),
        requests: [],
        status: 'member',
        others: [],
        youMovement: 0,
        youOffset: -yourTotals().points, // bolão novo: todo mundo começa do zero
      };
      pools = [seed, ...pools];
      return delay(buildPool(seed), 600);
    },
    async findPool(code) {
      const c = normalizeCode(code);
      const seed = [...pools, ...DIRECTORY].find((p) => p.code === c);
      if (!seed) return delay(null, 500);
      const preview: BolaoPreview = {
        code: seed.code,
        name: seed.name,
        adminName: seed.adminName,
        memberCount: seed.others.length + 1,
        scope: seed.scope,
        requireApproval: seed.requireApproval,
        alreadyIn: pools.some((p) => p.id === seed.id) || joinRequests.has(seed.code),
      };
      return delay(preview, 500);
    },
    async requestJoin(code) {
      const c = normalizeCode(code);
      const seed = DIRECTORY.find((p) => p.code === c);
      if (!seed) throw new NotFoundError('Bolão', c);
      if (seed.requireApproval) {
        joinRequests.set(c, Date.now());
        return delay(buildPool({ ...seed, status: 'pending' }), 500);
      }
      pools = [...pools, { ...seed, status: 'member' }];
      return delay(buildPool(seed), 500);
    },
    async answerRequest(poolId, requestId, approve) {
      const seed = pools.find((p) => p.id === poolId);
      if (!seed) throw new NotFoundError('Bolão', poolId);
      const req = seed.requests.find((r) => r.id === requestId);
      seed.requests = seed.requests.filter((r) => r.id !== requestId);
      if (approve && req) seed.others = [...seed.others, [req.name, 0, 0, 0]];
      return delay(buildPool(seed), 300);
    },
    async leavePool(poolId) {
      pools = pools.filter((p) => p.id !== poolId);
      return delay(undefined, 300);
    },
    async getPoolGuesses(poolId, matchId) {
      const seed = [...pools, ...DIRECTORY].find((p) => p.id === poolId);
      if (!seed) throw new NotFoundError('Bolão', poolId);
      const m = allDetails().find((x) => x.id === matchId);
      if (!m) throw new NotFoundError('Partida', matchId);
      const started = m.status !== 'scheduled';
      const inv = m.status === 'finished' ? flaInvolvement(m) : undefined;
      const rows: BolaoMemberGuess[] = seed.others.map(([name], i) => {
        const g = fakeGuess(`${seed.id}${name}${matchId}`);
        return {
          memberId: `${seed.id}-m${i}`,
          name,
          guess: started ? { home: g.home, away: g.away, scorer: nameOf(g.scorerId) } : undefined,
          points: inv && m.score ? scoreGuess(g, m.score, inv.scorers, inv.assists).total : undefined,
        };
      });
      const mine = guesses.get(matchId);
      rows.unshift({
        memberId: `${seed.id}-you`,
        name: YOU,
        isYou: true,
        guess: mine ? { home: mine.home, away: mine.away, scorer: nameOf(mine.scorerId) } : undefined,
        points:
          inv && m.score && mine ? scoreGuess(mine, m.score, inv.scorers, inv.assists).total : undefined,
      });
      return delay(structuredCloneSafe(rows), 250);
    },
  };
}
