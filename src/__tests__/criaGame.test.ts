import { CRIA_PLAYERS } from '@/data/cria/players';
import { CRIA_SCHEDULE } from '@/data/cria/schedule.generated';
import { addDays, dayKey } from '@/features/cria/dates';
import { obfuscate, reveal, secretIdFor } from '@/features/cria/schedule';
import { shareText } from '@/features/cria/share';
import { createLocalDailyGameService } from '@/services/mock/dailyGame';

// Armazenamento em memória no lugar do AsyncStorage (o módulo nativo não existe no Jest).
const mockStore = new Map<string, string>();
const kv = {
  getItem: async (k: string) => mockStore.get(k) ?? null,
  setItem: async (k: string, v: string) => void mockStore.set(k, v),
  removeItem: async (k: string) => void mockStore.delete(k),
};
const service = () => createLocalDailyGameService(kv);

beforeEach(() => mockStore.clear());

const day = '2026-11-20';
const secretId = secretIdFor(CRIA_SCHEDULE, day)!;
const wrong = CRIA_PLAYERS.filter((p) => p.id !== secretId).map((p) => p.id);

describe('partida do dia (adaptador local)', () => {
  it('começa jogando, sem entregar o secreto', async () => {
    const game = await service().getGame(day);
    expect(game).toMatchObject({ date: day, status: 'jogando', rows: [] });
    expect(game.secret).toBeUndefined();
  });

  it('o secreto salvo no aparelho não aparece em texto puro', async () => {
    await service().getGame(day);
    const raw = [...mockStore.values()].join('');
    const secret = CRIA_PLAYERS.find((p) => p.id === secretId)!;
    expect(raw.includes(secret.id)).toBe(false);
    expect(raw.includes(secret.name)).toBe(false);
  });

  it('salva cada palpite e continua de onde parou ao reabrir', async () => {
    await service().guess(day, wrong[0]!);
    await service().guess(day, wrong[1]!);
    const reopened = await service().getGame(day);
    expect(reopened.rows.map((r) => r.playerId)).toEqual([wrong[0], wrong[1]]);
  });

  it('palpite repetido não conta', async () => {
    const svc = service();
    await svc.guess(day, wrong[0]!);
    const game = await svc.guess(day, wrong[0]!);
    expect(game.rows).toHaveLength(1);
  });

  it('acertar encerra na hora e revela o secreto; depois disso nada muda', async () => {
    const svc = service();
    await svc.guess(day, wrong[0]!);
    const won = await svc.guess(day, secretId);
    expect(won.status).toBe('venceu');
    expect(won.secret?.playerId).toBe(secretId);
    expect((await svc.guess(day, wrong[1]!)).rows).toHaveLength(2);
  });

  it('cinco erros: derrota com o secreto revelado e sem rejogar', async () => {
    const svc = service();
    for (const id of wrong.slice(0, 5)) await svc.guess(day, id);
    const lost = await svc.getGame(day);
    expect(lost.status).toBe('perdeu');
    expect(lost.secret?.clues.every((c) => c.status === 'exact')).toBe(true);
    expect((await svc.guess(day, secretId)).status).toBe('perdeu');
  });

  it('pistas congeladas: as linhas salvas não são recalculadas', async () => {
    const svc = service();
    const first = await svc.guess(day, wrong[0]!);
    const key = [...mockStore.keys()].find((k) => k.includes(day))!;
    const saved = JSON.parse(mockStore.get(key)!);
    saved.rows[0].clues[0].status = 'close'; // simula uma linha antiga, de outra versão da base
    mockStore.set(key, JSON.stringify(saved));
    const reopened = await service().getGame(day);
    expect(reopened.rows[0]!.clues[0]!.status).toBe('close');
    expect(first.rows[0]!.clues[0]!.status).not.toBe('close');
  });

  it('cada dia tem a sua partida', async () => {
    const svc = service();
    await svc.guess(day, wrong[0]!);
    expect((await svc.getGame(addDays(day, 1))).rows).toEqual([]);
  });
});

describe('controles da demonstração', () => {
  it('avançar dia e voltar ao dia de verdade', async () => {
    const svc = service();
    expect(await svc.today()).toBe(dayKey());
    await svc.demo.nextDay();
    await svc.demo.nextDay();
    expect(await svc.today()).toBe(addDays(dayKey(), 2));
    await svc.demo.realDay();
    expect(await svc.today()).toBe(dayKey());
  });

  it('reiniciar o desafio de hoje', async () => {
    const svc = service();
    const today = await svc.today();
    await svc.guess(today, wrong[0]!);
    await svc.demo.resetToday();
    expect((await svc.getGame(today)).rows).toEqual([]);
  });

  it('escolher o secreto de hoje', async () => {
    const svc = service();
    const today = await svc.today();
    await svc.demo.setSecret('zico');
    expect((await svc.guess(today, 'zico')).status).toBe('venceu');
  });
});

describe('compartilhar', () => {
  it('quadrados por pista, número do desafio, sem nenhum nome', async () => {
    const svc = service();
    await svc.guess(day, wrong[0]!);
    const game = await svc.guess(day, secretId);
    const text = shareText(game);
    expect(text.split('\n')[0]).toBe(`Quem é o Cria? #${game.number} · 2/5`);
    expect(text.split('\n')).toHaveLength(3);
    expect(text.split('\n')[2]).toBe('🟩🟩🟩🟩🟩🟩');
    for (const p of CRIA_PLAYERS) expect(text.includes(p.name)).toBe(false);
  });

  it('derrota mostra X/5; alto contraste troca as cores', async () => {
    const svc = service();
    for (const id of wrong.slice(0, 5)) await svc.guess(day, id);
    const game = await svc.getGame(day);
    expect(shareText(game)).toContain('· X/5');
    expect(shareText(game, 'contraste')).not.toMatch(/🟩|🟨/);
  });
});

it('disfarce de texto: ida e volta, com acento', () => {
  const t = JSON.stringify({ name: 'Léo Moura', period: '2005–2015' });
  expect(reveal(obfuscate(t, day), day)).toBe(t);
  expect(obfuscate(t, day).includes('Moura')).toBe(false);
});
