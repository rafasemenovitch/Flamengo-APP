import { TROPHY_GOALS } from '@/data/trophies';
import { arrangeTrophyCabinet, selectCabinetMedals, TROPHY_CANVAS } from '@/utils/trophyCabinet';
import { resolveTrophyRoom } from '@/utils/trophies';
import { trophyCabinetScenario } from './fixtures/trophyCabinet';

const moments = TROPHY_GOALS.filter((goal) => goal.group === 'especiais');

describe('estante fixa do perfil', () => {
  it.each([
    [0, 0],
    [1, 0],
    [3, 0],
    [0, 1],
    [1, 4],
    [1, 8],
    [3, 10],
    [2, 15],
    [3, 18],
  ])('%i taças desbloqueadas e %i medalhas cabem na mesma estante', (unlockedCups, medals) => {
    const list = trophyCabinetScenario(medals, unlockedCups);
    for (const width of [280, 350, 560]) {
      const layout = arrangeTrophyCabinet(list, width);
      expect(layout.pieces).toHaveLength(moments.length + 10);
      expect(layout.pieces.filter((piece) => piece.hanging)).toHaveLength(10);
      expect(layout.pieces.filter((piece) => piece.hanging && piece.achievement.earned)).toHaveLength(
        Math.min(medals, 10)
      );
      const cups = layout.pieces.filter((piece) => !piece.hanging);
      expect(cups.filter((piece) => piece.achievement.earned)).toHaveLength(unlockedCups);
      expect(cups.every((piece) => piece.award.kind === 'trophy')).toBe(true);
      for (const hanging of [false, true]) {
        const row = layout.pieces.filter((piece) => piece.hanging === hanging);
        for (let i = 1; i < row.length; i++) {
          const previous = row[i - 1]!;
          expect(previous.touchX + previous.touchWidth).toBeLessThanOrEqual(row[i]!.touchX + 0.001);
        }
      }
      for (const piece of layout.pieces) {
        expect(piece.x).toBeGreaterThanOrEqual(0);
        expect(piece.x + piece.size).toBeLessThanOrEqual(width + 0.001);
        expect(piece.y).toBeGreaterThanOrEqual(0);
        expect(piece.y + piece.height).toBeLessThanOrEqual(layout.height);
        if (piece.hanging) {
          const discTop = piece.y + ((piece.ribbonLength + 44 - 33) * piece.size) / 112;
          expect(discTop).toBeGreaterThan(layout.shelfTop + 12);
        } else {
          expect(piece.y + (piece.size * TROPHY_CANVAS.foot) / 112).toBeCloseTo(layout.shelfTop);
        }
      }
    }
  });
  it('sem conquistas mantém as três taças e dez medalhas bloqueadas, ligadas a objetivos reais', () => {
    const room = resolveTrophyRoom(TROPHY_GOALS, { counters: {}, completed: {} });
    const pieces = arrangeTrophyCabinet(room, 350).pieces;
    expect(pieces).toHaveLength(13);
    expect(pieces.every((piece) => !piece.achievement.earned)).toBe(true);
    expect(new Set(pieces.map((piece) => piece.achievement.id)).size).toBe(13);
    expect(pieces.every((piece) => TROPHY_GOALS.some((goal) => goal.id === piece.achievement.id))).toBe(true);
  });

  it('desbloquear prêmios mantém as posições da estante e revela o prêmio atual', () => {
    const before = arrangeTrophyCabinet(trophyCabinetScenario(0), 350);
    const after = arrangeTrophyCabinet(trophyCabinetScenario(1, 1), 350);
    const positions = (pieces: typeof before.pieces) =>
      pieces
        .filter((piece) => !piece.hanging)
        .map(({ achievement, x, y, size }) => ({ id: achievement.id, x, y, size }));
    expect(positions(after.pieces)).toEqual(positions(before.pieces));
    const unlocked = after.pieces.find((piece) => piece.achievement.id === moments[0]!.id)!;
    expect(unlocked.achievement.earned).toBe(true);
    expect(unlocked.award).toEqual(unlocked.achievement.current);
    expect(after.pieces.filter((piece) => piece.hanging)).toHaveLength(10);
    expect(after.pieces.filter((piece) => piece.hanging && piece.achievement.earned)).toHaveLength(1);
  });

  it('com oito conquistas exibe oito medalhas no valor atual e duas bloqueadas', () => {
    const medals = selectCabinetMedals(trophyCabinetScenario(8));
    expect(medals).toHaveLength(10);
    expect(medals.filter((goal) => goal.earned).map((goal) => goal.current!.tier)).toEqual([
      'gold',
      'gold',
      'silver',
      'silver',
      'silver',
      'bronze',
      'bronze',
      'bronze',
    ]);
    expect(medals.filter((goal) => !goal.earned)).toHaveLength(2);
  });

  it('com quinze conquistas escolhe as dez mais valiosas, sem alterar a coleção', () => {
    const room = trophyCabinetScenario(15);
    const ids = room.map((goal) => goal.id);
    const medals = selectCabinetMedals(Object.freeze(room));
    expect(medals.map((goal) => goal.current!.tier)).toEqual([
      'gold',
      'gold',
      'gold',
      'gold',
      'gold',
      'gold',
      'gold',
      'silver',
      'silver',
      'silver',
    ]);
    expect(room.map((goal) => goal.id)).toEqual(ids);
    expect(new Set(medals.map((goal) => goal.id)).size).toBe(10);
  });

  it('uma medalha fora da seleção entra na estante ao evoluir para ouro', () => {
    const room = trophyCabinetScenario(15);
    const goal = room.find((entry) => entry.id === 'sempre-presente')!;
    expect(selectCabinetMedals(room).some((entry) => entry.id === goal.id)).toBe(false);
    const upgraded = room.map((entry) =>
      entry.id === goal.id
        ? {
            ...entry,
            value: 25,
            current: { kind: 'medal' as const, tier: 'gold' as const, target: 25 },
            next: undefined,
            progress: 1,
          }
        : entry
    );
    const medals = selectCabinetMedals(upgraded);
    expect(medals).toHaveLength(10);
    expect(medals.some((entry) => entry.id === goal.id && entry.current?.tier === 'gold')).toBe(true);
    expect(medals.every((entry) => entry.current?.tier !== 'bronze')).toBe(true);
  });

  it('com todas conquistadas mostra dez de ouro e mantém a ordem da Sala nos empates', () => {
    const room = trophyCabinetScenario(18);
    const medals = selectCabinetMedals(room);
    expect(medals.map((goal) => goal.id)).toEqual(
      room
        .filter((goal) => goal.group !== 'especiais')
        .slice(0, 10)
        .map((goal) => goal.id)
    );
    expect(medals.every((goal) => goal.earned && goal.current?.tier === 'gold')).toBe(true);
  });

  it('todos os intervalos entre medalhas são iguais, inclusive nas duas pontas', () => {
    for (const width of [280, 350, 560]) {
      const medals = arrangeTrophyCabinet(trophyCabinetScenario(8), width).pieces.filter(
        (piece) => piece.hanging
      );
      const step = medals[1]!.x - medals[0]!.x;
      for (let i = 1; i < medals.length; i++) expect(medals[i]!.x - medals[i - 1]!.x).toBeCloseTo(step);
      expect(medals[0]!.x).toBeCloseTo(0);
      expect(medals.at(-1)!.x + medals.at(-1)!.size).toBeCloseTo(width);
    }
  });
});
