/**
 * Imagens usadas pelos estilos: a pílula dos portões ("pill") e o ícone de estação
 * ("station"). As cores vêm do próprio estilo (metadata "fla:images"), então trocar o
 * tema só redesenha as imagens com as cores novas.
 */
import type { Map as MlMap, StyleSpecification } from 'maplibre-gl';

import { PICTOGRAMS } from './icons';

type ImageColors = {
  pill: { fill: string; stroke: string };
  station: { fill: string; glyph: string };
  badge: { fill: string; stroke: string };
  selected: string;
};
type Meta = { 'fla:images': ImageColors; 'fla:poi': Record<string, string> };

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
function pill({ fill, stroke }: ImageColors['pill'], H = 26) {
  const W = H + 14,
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
      content: [R * RATIO * 0.6, (H / 8.7) * RATIO, (W - R * 0.6) * RATIO, (H - H / 8.7) * RATIO] as [
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

/** Ícone de ponto de interesse: círculo da categoria, borda clara, sombra suave e pictograma branco. */
const POI = 34; // tamanho lógico com margem para a sombra
const POI_R = 13;
function poiIcon(color: string, draw: (ctx: CanvasRenderingContext2D) => void) {
  const { c, ctx } = canvas(POI, POI);
  const m = POI / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1.5;
  ctx.beginPath();
  ctx.arc(m, m, POI_R, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.stroke();
  // pictograma: grade de 24 → 15 unidades, centrado
  const k = 15 / 24;
  ctx.save();
  ctx.translate(m - 12 * k, m - 12 * k);
  ctx.scale(k, k);
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  draw(ctx);
  ctx.restore();
  return { data: ctx.getImageData(0, 0, c.width, c.height), options: { pixelRatio: RATIO } };
}

/** Anel da seleção, desenhado por baixo do ícone escolhido. */
function selectedRing(color: string) {
  const S = 48;
  const { c, ctx } = canvas(S, S);
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, 19, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.22;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = color;
  ctx.stroke();
  return { data: ctx.getImageData(0, 0, c.width, c.height), options: { pixelRatio: RATIO } };
}

export function applyStyleImages(map: MlMap, style: StyleSpecification) {
  const meta = style.metadata as Meta;
  const colors = meta['fla:images'];
  const images: Record<string, { data: ImageData; options: object }> = {
    pill: pill(colors.pill),
    badge: pill(colors.badge, 15),
    station: station(colors.station),
    'selected-ring': selectedRing(colors.selected),
  };
  for (const [cat, color] of Object.entries(meta['fla:poi']))
    images[`poi-${cat}`] = poiIcon(color, PICTOGRAMS[cat]);
  for (const [name, { data, options }] of Object.entries(images)) {
    if (map.hasImage(name)) map.removeImage(name);
    map.addImage(name, data, options);
  }
}
