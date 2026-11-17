import { TROPHY_GOALS } from '@/data/trophies';
import type { TrophyAchievement } from '@/types/trophies';
import { arrangeTrophyCabinet, TROPHY_CANVAS } from '@/utils/trophyCabinet';
import { resolveTrophyRoom } from '@/utils/trophies';

const base = resolveTrophyRoom(TROPHY_GOALS, { counters: {}, completed: {} });
function collection(cups: number, medals: number): TrophyAchievement[] {
  return base.slice(0, cups + medals).map((goal, index) => ({
    ...goal,
    earned: true,
    current: { kind: index < cups ? 'trophy' : 'medal', tier: 'gold', target: 1 },
  }));
}

describe('estante fixa do perfil', () => {
  it.each([
    [0, 1],
    [1, 0],
    [2, 2],
    [3, 7],
    [6, 12],
    [21, 0],
  ])('%i troféus e %i medalhas cabem na mesma estante em telas pequenas', (cups, medals) => {
    const list = collection(cups, medals);
    for (const width of [280, 350, 560]) {
      const layout = arrangeTrophyCabinet(list, width);
      expect(layout.pieces).toHaveLength(cups + medals);
      expect(layout.pieces.filter((piece) => piece.hanging)).toHaveLength(medals);
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
  it('não cria peças para preencher lugares de objetivos bloqueados', () => {
    expect(arrangeTrophyCabinet(base, 350).pieces).toEqual([]);
  });
});
