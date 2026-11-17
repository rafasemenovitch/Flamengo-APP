import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Bandeiras desenhadas (simplificadas) dos países da base do Quem é o Cria?. Emoji de
 * bandeira muda de cara em cada aparelho e não aparece em alguns Androids. País fora da
 * lista mostra só a sigla (quem chama decide).
 */
type Draw = () => React.ReactNode;

const stripesH =
  (colors: string[], weights?: number[]): Draw =>
  () => {
    const w = weights ?? colors.map(() => 1);
    const total = w.reduce((a, b) => a + b, 0);
    let y = 0;
    return colors.map((c, i) => {
      const h = (14 * w[i]!) / total;
      const r = <Rect key={i} x={0} y={y} width={20} height={h + 0.2} fill={c} />;
      y += h;
      return r;
    });
  };

const stripesV =
  (colors: string[]): Draw =>
  () =>
    colors.map((c, i) => (
      <Rect
        key={i}
        x={(20 / colors.length) * i}
        y={0}
        width={20 / colors.length + 0.2}
        height={14}
        fill={c}
      />
    ));

const FLAGS: Record<string, Draw> = {
  BRA: () => (
    <>
      <Rect width={20} height={14} fill="#229E45" />
      <Path d="M10 2 L18 7 L10 12 L2 7 Z" fill="#F8E509" />
      <Circle cx={10} cy={7} r={3} fill="#2B49A3" />
    </>
  ),
  ARG: () => (
    <>
      {stripesH(['#74ACDF', '#FFFFFF', '#74ACDF'])()}
      <Circle cx={10} cy={7} r={1.4} fill="#F6B40E" />
    </>
  ),
  URY: () => (
    <>
      {stripesH([
        '#FFFFFF',
        '#0038A8',
        '#FFFFFF',
        '#0038A8',
        '#FFFFFF',
        '#0038A8',
        '#FFFFFF',
        '#0038A8',
        '#FFFFFF',
      ])()}
      <Rect width={8} height={7.8} fill="#FFFFFF" />
      <Circle cx={4} cy={3.9} r={2} fill="#FCD116" />
    </>
  ),
  PRY: stripesH(['#D52B1E', '#FFFFFF', '#0038A8']),
  CHL: () => (
    <>
      {stripesH(['#FFFFFF', '#D52B1E'])()}
      <Rect width={7} height={7} fill="#0039A6" />
      <Circle cx={3.5} cy={3.5} r={1.2} fill="#FFFFFF" />
    </>
  ),
  PER: stripesV(['#D91023', '#FFFFFF', '#D91023']),
  COL: stripesH(['#FCD116', '#003893', '#CE1126'], [2, 1, 1]),
  ECU: () => (
    <>
      {stripesH(['#FFDD00', '#034EA2', '#ED1C24'], [2, 1, 1])()}
      <Circle cx={10} cy={7} r={1.8} fill="#6B4E16" />
    </>
  ),
  SRB: stripesH(['#C6363C', '#0C4076', '#FFFFFF']),
  ESP: stripesH(['#AA151B', '#F1BF00', '#AA151B'], [1, 2, 1]),
  ITA: stripesV(['#009246', '#FFFFFF', '#CE2B37']),
  PRT: () => (
    <>
      <Rect width={20} height={14} fill="#FF0000" />
      <Rect width={8} height={14} fill="#006600" />
      <Circle cx={8} cy={7} r={2.4} fill="#FFCC00" />
    </>
  ),
};

/** Nome por extenso, para o leitor de tela e as regras. */
export const COUNTRY_NAME: Record<string, string> = {
  BRA: 'Brasil',
  ARG: 'Argentina',
  URY: 'Uruguai',
  PRY: 'Paraguai',
  CHL: 'Chile',
  PER: 'Peru',
  COL: 'Colômbia',
  ECU: 'Equador',
  SRB: 'Sérvia',
  ESP: 'Espanha',
  ITA: 'Itália',
  PRT: 'Portugal',
};

export const hasFlag = (code: string) => code in FLAGS;

export function Flag({ code, width = 20 }: { code: string; width?: number }) {
  const draw = FLAGS[code];
  if (!draw) return null;
  return (
    <Svg width={width} height={(width * 14) / 20} viewBox="0 0 20 14" accessible={false}>
      {draw()}
    </Svg>
  );
}
