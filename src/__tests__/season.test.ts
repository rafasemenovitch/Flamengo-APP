import { createMockGamificationService } from '@/services/mock/gamification';

describe('temporada da Nação (mock)', () => {
  const svc = createMockGamificationService();

  it('soma o extrato inteiro (inclui o bolão) na pontuação da temporada', async () => {
    const [progress, history] = await Promise.all([svc.getProgress(), svc.getPointsHistory()]);
    expect(progress.points).toBe(history.reduce((a, e) => a + e.points, 0));
    expect(history.some((e) => e.source === 'bolao')).toBe(true);
    expect(progress.nextReward!.points).toBeGreaterThan(progress.points);
  });

  it('acertar o quiz vale 10 pontos', async () => {
    const before = (await svc.getProgress()).points;
    await svc.answerQuiz('quiz-1', 'b');
    expect((await svc.getProgress()).points).toBe(before + 10);
  });

  it('só resgata prêmio alcançado, e o resgate gera cupom', async () => {
    const trail = await svc.getTrail();
    const { points } = await svc.getProgress();
    const open = trail.find((r) => r.points <= points && !r.claimedCode)!;
    const locked = trail.find((r) => r.points > points)!;
    expect((await svc.claimReward(open.id)).claimedCode).toMatch(/^FLA-/);
    await expect(svc.claimReward(locked.id)).rejects.toThrow();
  });
});
