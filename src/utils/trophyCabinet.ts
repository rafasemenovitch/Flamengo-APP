import type { TrophyAchievement } from '@/types/trophies';
import { earnedTrophies } from './trophies';

export const TROPHY_CANVAS = { width: 112, height: 128, foot: 117 } as const;

export function hangingMedalHeight(size: number, ribbonLength: number) {
  return (size * (ribbonLength + 82)) / TROPHY_CANVAS.width;
}

export type CabinetPiece = {
  achievement: TrophyAchievement;
  x: number;
  touchX: number;
  touchWidth: number;
  y: number;
  size: number;
  height: number;
  hanging: boolean;
  ribbonLength: number;
};

/** Todos os prêmios cabem na mesma estante: taças em cima e medalhas penduradas. */
export function arrangeTrophyCabinet(achievements: readonly TrophyAchievement[], availableWidth: number) {
  const width = Math.max(1, Number.isFinite(availableWidth) ? availableWidth : 320);
  const earned = earnedTrophies(achievements);
  const cups = earned.filter((goal) => goal.current!.kind === 'trophy');
  const medals = earned.filter((goal) => goal.current!.kind === 'medal');
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
  medals.forEach((achievement, index) => {
    const ribbonLength = index % 2 ? 92 : 52;
    pieces.push({
      achievement,
      x: clampX((index + 0.5) * medalSlot, medalSize),
      touchX: index * medalSlot,
      touchWidth: medalSlot,
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
