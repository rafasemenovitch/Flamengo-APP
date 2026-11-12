/**
 * Imagens usadas pelos estilos: a pílula dos portões ("pill") e o ícone de estação
 * ("station"). As cores vêm do próprio estilo (metadata "fla:images"), então trocar o
 * tema só redesenha as imagens com as cores novas.
 */
import type { Map as MlMap, StyleSpecification } from 'maplibre-gl';

type ImageColors = {
  pill: { fill: string; stroke: string };
  station: { fill: string; glyph: string };
};

const RATIO = 2;

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w * RATIO;
  c.height = h * RATIO;
  const ctx = c.getContext('2d')!;
  ctx.scale(RATIO, RATIO);
  return { c, ctx };
}

/** Pílula esticável: só o miolo estica, as pontas arredondadas ficam fixas. */
function pill({ fill, stroke }: ImageColors['pill']) {
  const W = 40,
    H = 26,
    R = H / 2;
  const { c, ctx } = canvas(W, H);
  ctx.beginPath();
  ctx.roundRect(0.75, 0.75, W - 1.5, H - 1.5, R - 0.75);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  const data = ctx.getImageData(0, 0, c.width, c.height);
  return {
    data,
    options: {
      pixelRatio: RATIO,
      stretchX: [[R * RATIO, (W - R) * RATIO]] as [number, number][],
      stretchY: [[R * RATIO - 1, R * RATIO + 1]] as [number, number][],
      content: [R * RATIO * 0.6, 3 * RATIO, (W - R * 0.6) * RATIO, (H - 3) * RATIO] as [
        number,
        number,
        number,
        number,
      ],
    },
  };
}

/** Círculo com um trem estilizado (desenho próprio, sem logotipo de operadora). */
function station({ fill, glyph }: ImageColors['station']) {
  const S = 40;
  const { c, ctx } = canvas(S, S);
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.stroke();
  // Trem: corpo arredondado, janela, faróis e trilhos.
  ctx.fillStyle = glyph;
  ctx.strokeStyle = glyph;
  ctx.beginPath();
  ctx.roundRect(12, 9, 16, 18, 4);
  ctx.fill();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(14.5, 12, 11, 6, 1.5);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(15.5, 22.5, 1.4, 0, Math.PI * 2);
  ctx.arc(24.5, 22.5, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(14, 30);
  ctx.lineTo(12, 32);
  ctx.moveTo(26, 30);
  ctx.lineTo(28, 32);
  ctx.stroke();
  return { data: ctx.getImageData(0, 0, c.width, c.height), options: { pixelRatio: RATIO } };
}

const DRAW = { pill, station } as const;

export function applyStyleImages(map: MlMap, style: StyleSpecification) {
  const colors = (style.metadata as Record<string, unknown>)['fla:images'] as ImageColors;
  for (const [name, draw] of Object.entries(DRAW)) {
    const { data, options } = draw(colors[name as keyof ImageColors] as never);
    if (map.hasImage(name)) map.removeImage(name);
    map.addImage(name, data, options);
  }
}
