import { TROPHY_GOALS } from '@/data/trophies';
import { createMockBolaoService } from '@/services/mock/bolao';
import { createMockGamificationService } from '@/services/mock/gamification';
import type { TrophyProgress } from '@/types/trophies';
import { awardLabel, earnedTrophies, goalAwards, resolveTrophyRoom } from '@/utils/trophies';

const empty: TrophyProgress = { counters: {}, completed: {} };
const presence = (matches: number) =>
  resolveTrophyRoom(TROPHY_GOALS, { ...empty, counters: { matches } }).find(
    (goal) => goal.id === 'sempre-presente'
  )!;

describe('evolução da Sala de Troféus', () => {
  it.each([
    [0, undefined, undefined, 5],
    [4, undefined, undefined, 5],
    [5, 'medal', 'bronze', 10],
    [9, 'medal', 'bronze', 10],
    [10, 'medal', 'silver', 25],
    [24, 'medal', 'silver', 25],
    [25, 'medal', 'gold', 50],
    [49, 'medal', 'gold', 50],
    [50, 'trophy', 'bronze', 100],
    [99, 'trophy', 'bronze', 100],
    [100, 'trophy', 'silver', 250],
    [249, 'trophy', 'silver', 250],
    [250, 'trophy', 'gold', undefined],
    [999, 'trophy', 'gold', undefined],
  ])('%i jogos mantém só o prêmio atual e aponta o próximo marco', (count, kind, tier, next) => {
    const goal = presence(count as number);
    expect(goal.current?.kind).toBe(kind);
    expect(goal.current?.tier).toBe(tier);
    expect(goal.next?.target).toBe(next);
    expect(goal.earned).toBe(!!kind);
    expect(goal.value).toBe(count);
    expect(goal.id).toBe('sempre-presente');
  });

  it('não expõe peças bloqueadas na vitrine do perfil nem duplica estágios antigos', () => {
    const room = resolveTrophyRoom(TROPHY_GOALS, {
      counters: { matches: 100, exactScores: 5 },
      completed: {},
    });
    const shelf = earnedTrophies(room);
    expect(shelf.map((goal) => goal.id)).toEqual(['sempre-presente', 'vidente']);
    expect(shelf[0]!.current).toEqual({ kind: 'trophy', tier: 'silver', target: 100 });
    expect(earnedTrophies(resolveTrophyRoom(TROPHY_GOALS, empty))).toEqual([]);
  });

  it('Manto Sagrado e Até o fim têm um único troféu de ouro, liberado só por evento registrado', () => {
    for (const id of ['manto-sagrado', 'ate-o-fim']) {
      const definition = TROPHY_GOALS.find((goal) => goal.id === id)!;
      expect(goalAwards(definition)).toEqual([{ kind: 'trophy', tier: 'gold', target: 1 }]);
      const locked = resolveTrophyRoom([definition], { ...empty, partial: { [id]: 1 } })[0]!;
      expect(locked.earned).toBe(false);
      const unlocked = resolveTrophyRoom([definition], {
        ...empty,
        completed: { [id]: { at: '2026-11-16' } },
      })[0]!;
      expect(unlocked.earned).toBe(true);
      expect(unlocked.next).toBeUndefined();
      expect(unlocked.earnedAt).toBe('2026-11-16');
      expect(awardLabel(unlocked.current!)).toBe('Troféu de ouro');
    }
  });

  it('contadores ausentes ou inválidos nunca dão um prêmio', () => {
    for (const count of [Number.NaN, Infinity, -10, -Infinity]) expect(presence(count).earned).toBe(false);
    expect(presence(4.99).earned).toBe(false);
    expect(presence(10).progress).toBe(0.4);
    expect(presence(999).progress).toBe(1);
  });

  it('mantém um só objetivo por contador, nomes únicos e seis marcos crescentes', () => {
    expect(new Set(TROPHY_GOALS.map((goal) => goal.id)).size).toBe(TROPHY_GOALS.length);
    expect(new Set(TROPHY_GOALS.map((goal) => goal.name)).size).toBe(TROPHY_GOALS.length);
    const evolving = TROPHY_GOALS.filter((goal) => goal.kind === 'evolving');
    expect(new Set(evolving.map((goal) => goal.counter)).size).toBe(evolving.length);
    for (const goal of evolving) {
      expect(goal.thresholds).toHaveLength(6);
      goal.thresholds.forEach((target, i) => {
        expect(Number.isInteger(target)).toBe(true);
        expect(target).toBeGreaterThan(goal.thresholds[i - 1] ?? 0);
      });
    }
  });
});

describe('fonte demonstrativa da sala', () => {
  const service = createMockGamificationService();
  it('usa os mesmos placares exatos do Bolão; consultar a sala não soma pontos', async () => {
    const before = await service.getProgress();
    const [room, summary] = await Promise.all([
      service.getTrophyRoom(),
      createMockBolaoService().getSummary(),
    ]);
    expect(room.find((goal) => goal.id === 'vidente')!.value).toBe(summary.exactScores);
    expect(room.find((goal) => goal.id === 'manto-sagrado')!.earned).toBe(true);
    expect(room.find((goal) => goal.id === 'ate-o-fim')!.earned).toBe(false);
    expect((await service.getProgress()).points).toBe(before.points);
  });
  it('conta a conclusão de um quiz uma única vez, mesmo ao reenviar a resposta', async () => {
    const before = (await service.getTrophyRoom()).find((goal) => goal.id === 'sabe-tudo')!.value;
    await service.answerQuiz('quiz-1', 'b');
    await service.answerQuiz('quiz-1', 'b');
    const after = (await service.getTrophyRoom()).find((goal) => goal.id === 'sabe-tudo')!.value;
    expect(after).toBe(before + 1);
  });
});
