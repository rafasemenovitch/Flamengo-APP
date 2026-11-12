/**
 * Pictogramas próprios dos pontos de interesse, desenhados em grade de 24 unidades,
 * traço 2 e cantos arredondados (todos no mesmo padrão). Sem emoji, sem ícone de terceiros.
 * Nenhum pictograma de bebida alcoólica: "bebidas" é um copo de refrigerante com canudo.
 */
export type Draw = (ctx: CanvasRenderingContext2D) => void;

const line = (ctx: CanvasRenderingContext2D, pts: [number, number][]) => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
};
const dot = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};
const person = (ctx: CanvasRenderingContext2D, x: number, skirt = false) => {
  dot(ctx, x, 5.2, 1.9);
  ctx.beginPath();
  if (skirt) {
    ctx.moveTo(x - 1.6, 8.5);
    ctx.lineTo(x + 1.6, 8.5);
    ctx.lineTo(x + 3.4, 15);
    ctx.lineTo(x - 3.4, 15);
  } else ctx.roundRect(x - 2.6, 8.5, 5.2, 7, 1.2);
  ctx.fill();
  line(ctx, [
    [x - 1.1, 15],
    [x - 1.1, 19.5],
  ]);
  line(ctx, [
    [x + 1.1, 15],
    [x + 1.1, 19.5],
  ]);
};

export const PICTOGRAMS: Record<string, Draw> = {
  banheiro: (ctx) => {
    person(ctx, 7.5);
    person(ctx, 16.5, true);
  },
  banheiro_acessivel: (ctx) => {
    dot(ctx, 10, 4.5, 1.9);
    line(ctx, [
      [10, 8],
      [10, 13.5],
      [15, 13.5],
      [17.5, 19],
    ]);
    line(ctx, [
      [10, 10.5],
      [14, 10.5],
    ]);
    ctx.beginPath();
    ctx.arc(10.5, 15.5, 4.8, Math.PI * 0.15, Math.PI * 1.35);
    ctx.stroke();
  },
  alimentacao: (ctx) => {
    line(ctx, [
      [8, 4],
      [8, 20],
    ]);
    line(ctx, [
      [5.5, 4],
      [5.5, 9],
      [10.5, 9],
      [10.5, 4],
    ]);
    ctx.beginPath();
    ctx.moveTo(16, 20);
    ctx.lineTo(16, 4);
    ctx.quadraticCurveTo(19.5, 7, 19, 12);
    ctx.lineTo(16, 12);
    ctx.stroke();
  },
  bebidas: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(6.5, 8);
    ctx.lineTo(17.5, 8);
    ctx.lineTo(16, 20);
    ctx.lineTo(8, 20);
    ctx.closePath();
    ctx.stroke();
    line(ctx, [
      [12.5, 8],
      [14.5, 3],
      [17.5, 3],
    ]);
    line(ctx, [
      [7.2, 12.5],
      [16.8, 12.5],
    ]);
  },
  loja: (ctx) => {
    ctx.beginPath();
    ctx.roundRect(5, 8, 14, 12, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(12, 8, 3.5, Math.PI, 0);
    ctx.stroke();
  },
  elevador: (ctx) => {
    ctx.beginPath();
    ctx.roundRect(5, 3.5, 14, 17, 2);
    ctx.stroke();
    for (const [y, d] of [
      [7.5, -1],
      [16.5, 1],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(9, y - 1.6 * d);
      ctx.lineTo(15, y - 1.6 * d);
      ctx.lineTo(12, y + 1.8 * d);
      ctx.closePath();
      ctx.fill();
    }
  },
  escada_rolante: (ctx) => {
    line(ctx, [
      [3.5, 19],
      [8, 19],
      [16, 8],
      [20.5, 8],
    ]);
    line(ctx, [
      [8, 15],
      [15.5, 4.5],
    ]);
    ctx.beginPath();
    ctx.moveTo(12, 4);
    ctx.lineTo(16, 3.6);
    ctx.lineTo(15.6, 7.6);
    ctx.stroke();
  },
  escada: (ctx) => {
    line(ctx, [
      [4, 20],
      [8.5, 20],
      [8.5, 15],
      [13, 15],
      [13, 10],
      [17.5, 10],
      [17.5, 5],
      [20.5, 5],
    ]);
  },
  posto_medico: (ctx) => {
    ctx.beginPath();
    ctx.roundRect(9.5, 4, 5, 16, 1);
    ctx.roundRect(4, 9.5, 16, 5, 1);
    ctx.fill();
  },
  informacao: (ctx) => {
    dot(ctx, 12, 5.5, 1.8);
    line(ctx, [
      [9.5, 10],
      [12.5, 10],
      [12.5, 19],
    ]);
    line(ctx, [
      [9.5, 19],
      [15, 19],
    ]);
  },
  sala_sensorial: (ctx) => {
    ctx.beginPath();
    ctx.arc(12, 13, 7.5, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(3.5, 12.5, 4, 7, 1.5);
    ctx.roundRect(16.5, 12.5, 4, 7, 1.5);
    ctx.fill();
  },
  bilheteria: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(4, 7);
    ctx.lineTo(20, 7);
    ctx.lineTo(20, 10);
    ctx.arc(20, 12, 2, -Math.PI / 2, Math.PI / 2, true);
    ctx.lineTo(20, 17);
    ctx.lineTo(4, 17);
    ctx.lineTo(4, 14);
    ctx.arc(4, 12, 2, Math.PI / 2, -Math.PI / 2, true);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([1.5, 2]);
    line(ctx, [
      [14.5, 8.5],
      [14.5, 16],
    ]);
    ctx.setLineDash([]);
  },
  estacionamento: (ctx) => {
    ctx.lineWidth = 2.6;
    line(ctx, [
      [8.5, 20],
      [8.5, 4.5],
      [13, 4.5],
    ]);
    ctx.beginPath();
    ctx.moveTo(8.5, 13);
    ctx.lineTo(13, 13);
    ctx.arc(13, 8.75, 4.25, Math.PI / 2, -Math.PI / 2, true);
    ctx.stroke();
  },
  saida_emergencia: (ctx) => {
    line(ctx, [
      [11, 4],
      [5, 4],
      [5, 20],
      [11, 20],
    ]);
    line(ctx, [
      [9.5, 12],
      [19.5, 12],
    ]);
    line(ctx, [
      [16, 8.5],
      [19.5, 12],
      [16, 15.5],
    ]);
  },
  seguranca: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(12, 3.5);
    ctx.lineTo(19, 6);
    ctx.lineTo(19, 11.5);
    ctx.quadraticCurveTo(18.5, 17.5, 12, 20.5);
    ctx.quadraticCurveTo(5.5, 17.5, 5, 11.5);
    ctx.lineTo(5, 6);
    ctx.closePath();
    ctx.stroke();
    line(ctx, [
      [8.8, 12],
      [11.2, 14.4],
      [15.5, 9.6],
    ]);
  },
  juizado: (ctx) => {
    line(ctx, [
      [12, 4],
      [12, 19],
    ]);
    line(ctx, [
      [8, 19.5],
      [16, 19.5],
    ]);
    line(ctx, [
      [4.5, 7],
      [19.5, 7],
    ]);
    for (const x of [6.5, 17.5]) {
      line(ctx, [
        [x, 7],
        [x - 2.5, 13],
        [x + 2.5, 13],
        [x, 7],
      ]);
    }
  },
  acolhimento: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(12, 19.5);
    ctx.bezierCurveTo(4, 14, 3, 9.5, 5.5, 7);
    ctx.bezierCurveTo(8, 4.5, 11, 5.5, 12, 8);
    ctx.bezierCurveTo(13, 5.5, 16, 4.5, 18.5, 7);
    ctx.bezierCurveTo(21, 9.5, 20, 14, 12, 19.5);
    ctx.fill();
  },
};
