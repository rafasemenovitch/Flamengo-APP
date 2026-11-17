import type { TrophyAchievement, TrophyAward } from '@/types/trophies';
import { earnedTrophies, goalAwards } from './trophies';

export const TROPHY_CANVAS = { width: 112, height: 128, foot: 117 } as const;
export const CABINET_MEDAL_LIMIT = 10;

/** Empates mantêm a ordem da Sala; vagas restantes continuam ligadas a objetivos reais. */
export function selectCabinetMedals(achievements: readonly TrophyAchievement[]) {
  const medals = achievements.filter((goal) => goal.group !== 'especiais');
  const value = { bronze: 1, silver: 2, gold: 3 };
  const earned = earnedTrophies(medals)
    .filter((goal) => goal.current!.kind === 'medal')
    .sort((a, b) => value[b.current!.tier] - value[a.current!.tier]);
  const locked = medals.filter((goal) => !goal.earned || !goal.current);
  return [...earned, ...locked].slice(0, CABINET_MEDAL_LIMIT);
}

export function hangingMedalHeight(size: number, ribbonLength: number) {
  return (size * (ribbonLength + 82)) / TROPHY_CANVAS.width;
}

export type CabinetPiece = {
  achievement: TrophyAchievement;
  award: TrophyAward;
  x: number;
  touchX: number;
  touchWidth: number;
  y: number;
  size: number;
  height: number;
  hanging: boolean;
  ribbonLength: number;
};

/** Uma taça por momento especial e dez medalhas, incluindo as ainda bloqueadas. */
export function arrangeTrophyCabinet(achievements: readonly TrophyAchievement[], availableWidth: number) {
  const width = Math.max(1, Number.isFinite(availableWidth) ? availableWidth : 320);
  const cups = achievements.filter((goal) => goal.group === 'especiais');
  const medals = selectCabinetMedals(achievements);
  const cupSlot = width / Math.max(1, cups.length);
  const cupSizes = cups.map((_, index) => {
    const prominent = cups.length % 2 === 1 && index === Math.floor(cups.length / 2);
    return Math.min(width, 112, cupSlot * 1.2) * (prominent ? 1 : 0.88 + (index % 2) * 0.04);
  });
  const shelfTop =
    8 + Math.max(0, ...cupSizes.map((size) => (size * TROPHY_CANVAS.foot) / TROPHY_CANVAS.width));
  const clampX = (center: number, size: number) => Math.max(0, Math.min(width - size, center - size / 2));
  const pieces: CabinetPiece[] = cups.map((achievement, index) => {
    const size = cupSizes[index]!;
    return {
      achievement,
      award: achievement.current ?? goalAwards(achievement)[0]!,
      size,
      x: clampX((index + 0.5) * cupSlot, size),
      touchX: index * cupSlot,
      touchWidth: cupSlot,
      y: shelfTop - (size * TROPHY_CANVAS.foot) / TROPHY_CANVAS.width,
      height: (size * TROPHY_CANVAS.height) / TROPHY_CANVAS.width,
      hanging: false,
      ribbonLength: 0,
    };
  });
  const medalSlot = width / Math.max(1, medals.length);
  const medalSize = Math.min(width, 90, medalSlot * 1.55);
  // O desenho inteiro fica dentro da estante. Seus centros mantêm a mesma distância,
  // inclusive nas pontas: limitar cada x separadamente apertava os pares das extremidades.
  const medalStep = medals.length > 1 ? (width - medalSize) / (medals.length - 1) : 0;
  medals.forEach((achievement, index) => {
    const ribbonLength = Math.max(index % 2 ? 92 : 52, Math.ceil((16 * 112) / medalSize) - 11);
    const x = medals.length > 1 ? index * medalStep : (width - medalSize) / 2;
    const center = x + medalSize / 2;
    const touchX = index === 0 ? 0 : center - medalStep / 2;
    const touchRight = index === medals.length - 1 ? width : center + medalStep / 2;
    pieces.push({
      achievement,
      award: achievement.current ?? goalAwards(achievement)[0]!,
      x,
      touchX,
      touchWidth: touchRight - touchX,
      y: shelfTop - 2,
      size: medalSize,
      height: hangingMedalHeight(medalSize, ribbonLength),
      hanging: true,
      ribbonLength,
    });
  });
  return {
    width,
    shelfTop,
    pieces,
    height: Math.max(shelfTop + 12, ...pieces.map((piece) => piece.y + piece.height)) + 8,
  };
}
