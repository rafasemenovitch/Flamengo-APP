import { CRIA_PINS } from '@/data/cria/pins';
import { CRIA_PLAYERS } from '@/data/cria/players';
import { CRIA_SCHEDULE } from '@/data/cria/schedule.generated';
import { compare, isWin, toAttributes, TOLERANCE, clueSpeech, type CriaAttributes } from '@/features/cria/compare';
import { addDays, challengeNumber, CRIA_LAUNCH, dayKey, nextResetAt, shortDate } from '@/features/cria/dates';
import {
  decodeId,
  encodeId,
  era,
  generateSchedule,
  secretIdFor,
  targetDifficulty,
} from '@/features/cria/schedule';
import { periodLabel, searchPlayers } from '@/features/cria/search';

const P = (id: string) => {
  const p = CRIA_PLAYERS.find((x) => x.id === id);
  if (!p) throw new Error(`jogador ${id} não está na base`);
  return p;
};
const A = (id: string) => toAttributes(P(id));
const base: CriaAttributes = {
  position: 'Meia',
  nationality: 'BRA',
  arrivalYear: 2000,
  goals: 100,
  matches: 300,
  titles: 5,
};
const clue = (guess: Partial<CriaAttributes>, secret: Partial<CriaAttributes>, attr: keyof CriaAttributes) =>
  compare({ ...base, ...guess }, { ...base, ...secret }).find((c) => c.attr === attr)!;

describe('comparação', () => {
  it('o próprio secreto é vitória: tudo verde, sem setas', () => {
    const clues = compare(A('zico'), A('zico'));
    expect(clues.map((c) => c.status)).toEqual(Array(6).fill('exact'));
    expect(clues.every((c) => c.arrow === null)).toBe(true);
    expect(isWin(clues)).toBe(true);
  });

  it('tolerâncias: piso fixo para números baixos, 15% do secreto para os altos', () => {
    expect(TOLERANCE.goals(508)).toBe(76); // Zico: 432 a 584
    expect(TOLERANCE.goals(20)).toBe(5); // zagueiro: o piso vale
    expect(TOLERANCE.matches(875)).toBe(131); // Júnior
    expect(TOLERANCE.matches(60)).toBe(20);
  });

  it('exemplo real: secreto Zico, palpite Dida (264 gols) fica cinza com seta para cima', () => {
    const goals = compare(A('dida'), A('zico')).find((c) => c.attr === 'goals')!;
    expect(goals).toMatchObject({ status: 'far', arrow: 'up', value: P('dida').goals });
  });

  it('exemplo real: secreto Zico, palpite Adílio (mesma geração, meia) tem posição e país verdes', () => {
    const [pos, nat, year] = compare(A('adilio'), A('zico'));
    expect(pos!.status).toBe('exact');
    expect(nat!.status).toBe('exact');
    expect(year).toMatchObject({ status: 'far', arrow: 'down' }); // Zico chegou antes (1971 × 1975)
  });

  it('amarelo na borda da faixa e cinza logo depois', () => {
    expect(clue({ goals: 95 }, { goals: 100 }, 'goals')).toMatchObject({ status: 'close', arrow: 'up' });
    expect(clue({ goals: 85 }, { goals: 100 }, 'goals')).toMatchObject({ status: 'close' }); // 15 = 15%
    expect(clue({ goals: 84 }, { goals: 100 }, 'goals')).toMatchObject({ status: 'far' });
    expect(clue({ arrivalYear: 2002 }, { arrivalYear: 2000 }, 'arrivalYear')).toMatchObject({
      status: 'close',
      arrow: 'down',
    });
    expect(clue({ arrivalYear: 2003 }, { arrivalYear: 2000 }, 'arrivalYear').status).toBe('far');
    expect(clue({ titles: 7 }, { titles: 5 }, 'titles').status).toBe('close');
    expect(clue({ titles: 8 }, { titles: 5 }, 'titles').status).toBe('far');
    expect(clue({ matches: 320 }, { matches: 300 }, 'matches').status).toBe('close');
    expect(clue({ matches: 346 }, { matches: 300 }, 'matches').status).toBe('far');
  });

  it('zero é número como outro: 0 × 0 verde; 3 × 0 amarelo com seta para baixo', () => {
    expect(clue({ goals: 0 }, { goals: 0 }, 'goals')).toMatchObject({ status: 'exact', arrow: null });
    expect(clue({ goals: 3 }, { goals: 0 }, 'goals')).toMatchObject({ status: 'close', arrow: 'down' });
  });

  it('empate num número é verde mesmo quando os jogadores são diferentes', () => {
    expect(clue({ titles: 5, goals: 10 }, { titles: 5, goals: 99 }, 'titles')).toMatchObject({
      status: 'exact',
      arrow: null,
    });
  });

  it('a seta aparece em toda diferença numérica, qualquer que seja a cor', () => {
    for (const g of [1, 99, 500]) {
      const c = clue({ goals: g }, { goals: 100 }, 'goals');
      expect(c.arrow).toBe(g < 100 ? 'up' : 'down');
    }
  });

  it('posição e país não têm amarelo nem seta', () => {
    expect(clue({ position: 'Volante' }, { position: 'Meia' }, 'position')).toMatchObject({
      status: 'far',
      arrow: null,
    });
    expect(clue({ nationality: 'URY' }, { nationality: 'BRA' }, 'nationality').status).toBe('far');
  });

  it('frase para o leitor de tela', () => {
    expect(clueSpeech(clue({ goals: 103 }, { goals: 90 }, 'goals'))).toBe('Gols: 103, perto, o secreto marcou menos');
    expect(clueSpeech(clue({ goals: 300 }, { goals: 90 }, 'goals'))).toBe('Gols: 300, longe, o secreto marcou menos');
    expect(clueSpeech(clue({}, {}, 'position'), 'Meia')).toBe('Posição: Meia, igual');
  });
});

describe('busca', () => {
  const ids = (q: string, used?: Set<string>) => searchPlayers(CRIA_PLAYERS, q, used).map((h) => h.player.id);

  it('"gab" acha Gabigol e Gabriel', () => {
    expect(ids('gab')).toEqual(expect.arrayContaining(['gabigol', 'gabriel-2013']));
  });

  it('não liga para acento nem maiúscula', () => {
    expect(ids('LEONIDAS')[0]).toBe('leonidas');
    expect(ids('petkovic')[0]).toBe('petkovic');
    expect(ids('adilio')[0]).toBe('adilio');
  });

  it('acha por apelido e por nome completo', () => {
    expect(ids('galinho')[0]).toBe('zico');
    expect(ids('imperador')[0]).toBe('adriano');
    expect(ids('arthur antunes')[0]).toBe('zico');
  });

  it('acha pelo sobrenome', () => {
    expect(ids('moura')).toContain('leo-moura');
  });

  it('homônimos aparecem juntos e se diferenciam pelo período', () => {
    const hits = searchPlayers(CRIA_PLAYERS, 'jorginho');
    expect(hits.map((h) => h.player.id)).toEqual(expect.arrayContaining(['jorginho-1980', 'jorginho-2025']));
    const periods = hits.filter((h) => h.player.name === 'Jorginho').map((h) => periodLabel(h.player));
    expect(new Set(periods).size).toBe(periods.length);
  });

  it('jogadores já chutados aparecem desativados', () => {
    const hits = searchPlayers(CRIA_PLAYERS, 'zico', new Set(['zico']));
    expect(hits[0]).toMatchObject({ used: true });
  });

  it('o nome vem antes do apelido e o mais lembrado antes', () => {
    // "Júnior" é o lateral; "Júnior Baiano" vem depois
    expect(ids('junior')[0]).toBe('junior');
  });

  it('busca vazia não devolve nada', () => {
    expect(ids('   ')).toEqual([]);
  });

  it('período no clube', () => {
    expect(periodLabel({ spells: [{ from: 1971, to: 1983 }, { from: 1985, to: 1989 }] })).toBe('1971–1989');
    expect(periodLabel({ spells: [{ from: 2019, to: null }] })).toBe('2019–');
    expect(periodLabel({ spells: [{ from: 1995, to: 1995 }] })).toBe('1995');
  });
});

describe('dia do desafio (Brasília)', () => {
  it('vira à meia-noite de Brasília (03:00 UTC), qualquer que seja o fuso do aparelho', () => {
    expect(dayKey(Date.parse('2026-11-18T02:59:59Z'))).toBe('2026-11-17');
    expect(dayKey(Date.parse('2026-11-18T03:00:00Z'))).toBe('2026-11-18');
  });

  it('número do desafio: #1 no lançamento', () => {
    expect(challengeNumber(CRIA_LAUNCH)).toBe(1);
    expect(challengeNumber(addDays(CRIA_LAUNCH, 11))).toBe(12);
  });

  it('próxima virada', () => {
    expect(nextResetAt(Date.parse('2026-11-17T22:00:00Z'))).toBe(Date.parse('2026-11-18T03:00:00Z'));
    expect(nextResetAt(Date.parse('2026-11-18T03:00:00Z'))).toBe(Date.parse('2026-11-19T03:00:00Z'));
  });

  it('data curta', () => {
    expect(shortDate('2026-03-03')).toBe('3 mar');
  });
});

describe('agenda', () => {
  it('disfarce: ida e volta, tamanho fixo, nada em texto puro', () => {
    const code = encodeId('zico', '2026-11-17');
    expect(decodeId(code, '2026-11-17')).toBe('zico');
    expect(decodeId(code, '2026-11-18')).not.toBe('zico');
    expect(code).toHaveLength(encodeId('leo-moura', '2026-11-17').length);
  });

  it('o arquivo gerado não traz nenhum id em texto puro', () => {
    const text = JSON.stringify(CRIA_SCHEDULE);
    for (const p of CRIA_PLAYERS) expect(text.includes(`"${p.id}"`)).toBe(false);
  });

  it('todo dia da agenda aponta para alguém que pode ser resposta', () => {
    const eligible = new Set(CRIA_PLAYERS.filter((p) => p.eligible).map((p) => p.id));
    CRIA_SCHEDULE.days.forEach((_, i) => {
      const id = secretIdFor(CRIA_SCHEDULE, addDays(CRIA_SCHEDULE.start, i));
      expect(eligible.has(id!)).toBe(true);
    });
    expect(secretIdFor(CRIA_SCHEDULE, addDays(CRIA_SCHEDULE.start, -1))).toBeNull();
  });

  it('a agenda gerada é a mesma que o gerador produz hoje (não ficou desatualizada)', () => {
    const { days } = generateSchedule(CRIA_PLAYERS, {
      start: CRIA_SCHEDULE.start,
      days: CRIA_SCHEDULE.days.length,
      pins: CRIA_PINS,
    });
    expect(days.map((d) => encodeId(d.id, d.date))).toEqual(CRIA_SCHEDULE.days);
  });

  const { gap, days } = generateSchedule(CRIA_PLAYERS, { start: CRIA_LAUNCH, days: 365, pins: CRIA_PINS });

  it('determinística', () => {
    const again = generateSchedule(CRIA_PLAYERS, { start: CRIA_LAUNCH, days: 365, pins: CRIA_PINS });
    expect(again.days).toEqual(days);
  });

  it('datas fixadas: Zico no dia 3 de março', () => {
    expect(days.find((d) => d.date === '2027-03-03')?.id).toBe('zico');
  });

  it('não repete o mesmo jogador dentro da janela (fora as datas fixadas)', () => {
    const pinnedDates = new Set(days.filter((d) => CRIA_PINS[d.date.slice(5)]).map((d) => d.date));
    const last = new Map<string, number>();
    days.forEach((d, i) => {
      if (!pinnedDates.has(d.date) && last.has(d.id)) expect(i - last.get(d.id)!).toBeGreaterThanOrEqual(gap);
      last.set(d.id, i);
    });
    expect(gap).toBeGreaterThanOrEqual(50);
  });

  it('a dificuldade do dia é respeitada na maior parte dos dias', () => {
    const byId = new Map(CRIA_PLAYERS.map((p) => [p.id, p]));
    const hit = days.filter((d) => byId.get(d.id)!.difficulty === targetDifficulty(d.date)).length;
    expect(hit / days.length).toBeGreaterThan(0.6);
  });

  it('alterna gerações: nunca três dias seguidos da mesma', () => {
    const byId = new Map(CRIA_PLAYERS.map((p) => [p.id, p]));
    const eras = days.map((d) => era(byId.get(d.id)!));
    let run = 1;
    let worst = 1;
    for (let i = 1; i < eras.length; i++) {
      run = eras[i] === eras[i - 1] ? run + 1 : 1;
      worst = Math.max(worst, run);
    }
    expect(worst).toBeLessThanOrEqual(3);
  });

  it('domingo e segunda fáceis, sexta difícil', () => {
    expect(targetDifficulty('2026-11-22')).toBe('facil'); // domingo
    expect(targetDifficulty('2026-11-23')).toBe('facil'); // segunda
    expect(targetDifficulty('2026-11-27')).toBe('dificil'); // sexta
    expect(targetDifficulty('2026-11-25')).toBe('medio');
  });

  it('data fixada para quem não pode ser resposta é erro', () => {
    expect(() =>
      generateSchedule(CRIA_PLAYERS, { start: CRIA_LAUNCH, days: 2, pins: { [CRIA_LAUNCH]: 'arrascaeta' } })
    ).toThrow(/não pode ser resposta/);
  });
});
