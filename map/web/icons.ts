/**
 * Pictogramas próprios dos pontos de interesse, em grade de 24 unidades, traço 2 e pontas
 * arredondadas. São caminhos SVG: o mapa desenha no canvas (Path2D) e o app desenha com
 * react-native-svg, então o ícone é o mesmo no mapa, na lista e nos atalhos.
 * Sem emoji e sem ícone de terceiros. "Bebidas" é um copo com canudo, nunca chope.
 */
export interface Stroke {
  d: string;
  /** Preenchido em vez de traço. */
  fill?: boolean;
  /** Espessura do traço (padrão 2). */
  width?: number;
}

const f = (n: number) => +n.toFixed(2);
const circle = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)}a${r} ${r} 0 1 0 ${f(2 * r)} 0a${r} ${r} 0 1 0 ${f(-2 * r)} 0Z`;
const poly = (pts: number[][], close = false) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x!)} ${f(y!)}`).join('') + (close ? 'Z' : '');
/** Retângulo de cantos arredondados. */
const rect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f(x + r)} ${f(y)}h${f(w - 2 * r)}a${r} ${r} 0 0 1 ${r} ${r}v${f(h - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${r}` +
  `h${f(-(w - 2 * r))}a${r} ${r} 0 0 1 ${-r} ${-r}v${f(-(h - 2 * r))}a${r} ${r} 0 0 1 ${r} ${-r}Z`;
/** Arco de a0 a a1 (radianos, sentido horário na tela). */
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => `${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`;
  return `M${p(a0)}A${r} ${r} 0 ${Math.abs(a1 - a0) > Math.PI ? 1 : 0} 1 ${p(a1)}`;
};

const person = (x: number, skirt = false): Stroke[] => [
  { d: circle(x, 5.2, 1.9), fill: true },
  {
    d: skirt
      ? poly(
          [
            [x - 1.6, 8.5],
            [x + 1.6, 8.5],
            [x + 3.4, 15],
            [x - 3.4, 15],
          ],
          true
        )
      : rect(x - 2.6, 8.5, 5.2, 7, 1.2),
    fill: true,
  },
  {
    d:
      poly([
        [x - 1.1, 15],
        [x - 1.1, 19.5],
      ]) +
      poly([
        [x + 1.1, 15],
        [x + 1.1, 19.5],
      ]),
  },
];

export const PICTOGRAMS: Record<string, Stroke[]> = {
  banheiro: [...person(7.5), ...person(16.5, true)],
  banheiro_acessivel: [
    { d: circle(10, 4.5, 1.9), fill: true },
    {
      d:
        poly([
          [10, 8],
          [10, 13.5],
          [15, 13.5],
          [17.5, 19],
        ]) +
        poly([
          [10, 10.5],
          [14, 10.5],
        ]),
    },
    { d: arc(10.5, 15.5, 4.8, Math.PI * 0.15, Math.PI * 1.35) },
  ],
  alimentacao: [
    {
      d:
        poly([
          [8, 4],
          [8, 20],
        ]) +
        poly([
          [5.5, 4],
          [5.5, 9],
          [10.5, 9],
          [10.5, 4],
        ]),
    },
    { d: 'M16 20L16 4Q19.5 7 19 12L16 12' },
  ],
  bebidas: [
    {
      d: poly(
        [
          [6.5, 8],
          [17.5, 8],
          [16, 20],
          [8, 20],
        ],
        true
      ),
    },
    {
      d:
        poly([
          [12.5, 8],
          [14.5, 3],
          [17.5, 3],
        ]) +
        poly([
          [7.2, 12.5],
          [16.8, 12.5],
        ]),
    },
  ],
  loja: [{ d: rect(5, 8, 14, 12, 2) }, { d: arc(12, 8, 3.5, Math.PI, Math.PI * 2) }],
  elevador: [
    { d: rect(5, 3.5, 14, 17, 2) },
    {
      d:
        poly(
          [
            [9, 9.1],
            [15, 9.1],
            [12, 5.7],
          ],
          true
        ) +
        poly(
          [
            [9, 14.9],
            [15, 14.9],
            [12, 18.3],
          ],
          true
        ),
      fill: true,
    },
  ],
  escada_rolante: [
    {
      d:
        poly([
          [3.5, 19],
          [8, 19],
          [16, 8],
          [20.5, 8],
        ]) +
        poly([
          [8, 15],
          [15.5, 4.5],
        ]),
    },
    {
      d: poly([
        [12, 4],
        [16, 3.6],
        [15.6, 7.6],
      ]),
    },
  ],
  escada: [
    {
      d: poly([
        [4, 20],
        [8.5, 20],
        [8.5, 15],
        [13, 15],
        [13, 10],
        [17.5, 10],
        [17.5, 5],
        [20.5, 5],
      ]),
    },
  ],
  posto_medico: [{ d: rect(9.5, 4, 5, 16, 1) + rect(4, 9.5, 16, 5, 1), fill: true }],
  informacao: [
    { d: circle(12, 5.5, 1.8), fill: true },
    {
      d:
        poly([
          [9.5, 10],
          [12.5, 10],
          [12.5, 19],
        ]) +
        poly([
          [9.5, 19],
          [15, 19],
        ]),
    },
  ],
  sala_sensorial: [
    { d: arc(12, 13, 7.5, Math.PI, Math.PI * 2) },
    { d: rect(3.5, 12.5, 4, 7, 1.5) + rect(16.5, 12.5, 4, 7, 1.5), fill: true },
  ],
  bilheteria: [
    { d: 'M4 7H20V10A2 2 0 0 0 20 14V17H4V14A2 2 0 0 0 4 10Z' },
    {
      d:
        poly([
          [14.5, 8.5],
          [14.5, 9.8],
        ]) +
        poly([
          [14.5, 11.6],
          [14.5, 12.9],
        ]) +
        poly([
          [14.5, 14.7],
          [14.5, 16],
        ]),
    },
  ],
  estacionamento: [{ d: 'M8.5 20V4.5H13A4.25 4.25 0 0 1 13 13H8.5', width: 2.6 }],
  saida_emergencia: [
    {
      d: poly([
        [11, 4],
        [5, 4],
        [5, 20],
        [11, 20],
      ]),
    },
    {
      d:
        poly([
          [9.5, 12],
          [19.5, 12],
        ]) +
        poly([
          [16, 8.5],
          [19.5, 12],
          [16, 15.5],
        ]),
    },
  ],
  seguranca: [
    { d: 'M12 3.5L19 6V11.5Q18.5 17.5 12 20.5Q5.5 17.5 5 11.5V6Z' },
    {
      d: poly([
        [8.8, 12],
        [11.2, 14.4],
        [15.5, 9.6],
      ]),
    },
  ],
  juizado: [
    {
      d:
        poly([
          [12, 4],
          [12, 19],
        ]) +
        poly([
          [8, 19.5],
          [16, 19.5],
        ]) +
        poly([
          [4.5, 7],
          [19.5, 7],
        ]),
    },
    {
      d:
        poly(
          [
            [6.5, 7],
            [4, 13],
            [9, 13],
          ],
          true
        ) +
        poly(
          [
            [17.5, 7],
            [15, 13],
            [20, 13],
          ],
          true
        ),
    },
  ],
  acolhimento: [
    {
      d: 'M12 19.5C4 14 3 9.5 5.5 7C8 4.5 11 5.5 12 8C13 5.5 16 4.5 18.5 7C21 9.5 20 14 12 19.5Z',
      fill: true,
    },
  ],
};
