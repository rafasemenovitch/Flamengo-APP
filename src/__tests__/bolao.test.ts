import { createMockBolaoService } from '@/services/mock/bolao';
import { normalizeCode, scoreGuess } from '@/utils/bolaoScoring';

describe('pontuação do bolão', () => {
  it('placar exato vale 10', () => {
    expect(scoreGuess({ home: 2, away: 1 }, { home: 2, away: 1 }).total).toBe(10);
  });
  it('resultado e saldo vale 7; só resultado vale 5', () => {
    expect(scoreGuess({ home: 3, away: 2 }, { home: 2, away: 1 }).total).toBe(7);
    expect(scoreGuess({ home: 3, away: 0 }, { home: 2, away: 1 }).total).toBe(5);
  });
  it('empate certo com outro placar é saldo (7)', () => {
    expect(scoreGuess({ home: 0, away: 0 }, { home: 2, away: 2 }).kind).toBe('diff');
  });
  it('errou o resultado mas acertou os gols de um time vale 2', () => {
    expect(scoreGuess({ home: 2, away: 3 }, { home: 2, away: 1 }).total).toBe(2);
  });
  it('artilheiro +6, garçom +5 e coringa dobra', () => {
    const p = scoreGuess(
      { home: 2, away: 1, scorerId: 'p09', assistId: 'p10', joker: true },
      { home: 2, away: 1 },
      ['p09'],
      ['p10']
    );
    expect(p.total).toBe((10 + 6 + 5) * 2);
  });
  it('aceita código digitado ou link colado', () => {
    expect(normalizeCode(' nacao26 ')).toBe('NACAO26');
    expect(normalizeCode('https://flamengo.app/bolao/RSNH26')).toBe('RSNH26');
  });
});

describe('bolões (mock)', () => {
  const svc = createMockBolaoService();
  it('cria bolão com código de convite e o torcedor como admin', async () => {
    const p = await svc.createPool({ name: 'Teste', scope: 'todos', requireApproval: true });
    expect(p.code).toHaveLength(6);
    expect(p.isAdmin).toBe(true);
    expect(p.members).toHaveLength(1);
    expect(p.members[0]!.points).toBe(0);
  });
  it('encontra bolão pelo código e pede para entrar', async () => {
    const preview = await svc.findPool('nacao26');
    expect(preview?.name).toBe('Bolão da Zona Norte');
    const pool = await svc.requestJoin('NACAO26');
    expect(pool.status).toBe('pending');
    expect(await svc.findPool('XXXXXX')).toBeNull();
  });
  it('não aceita palpite em jogo encerrado', async () => {
    await expect(svc.saveGuess({ matchId: 'm-bra-32', home: 1, away: 0 })).rejects.toThrow();
  });
});
