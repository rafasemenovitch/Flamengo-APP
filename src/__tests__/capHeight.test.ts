import { ANYBODY_CAP_SCALE, isAnybody, splitCaps } from '@/design-system/components/capHeight';
import { typography } from '@/design-system/tokens/typography';

const caps = (t: string) =>
  splitCaps(t)
    .filter((s) => s.cap)
    .map((s) => s.text)
    .join('');

describe('correção das maiúsculas da Anybody (regra fixa, ver CLAUDE.md)', () => {
  it('amplia a maiúscula até a altura das hastes', () => {
    expect(ANYBODY_CAP_SCALE).toBeCloseTo(1.163, 3);
  });

  it('corrige maiúsculas em palavras com minúsculas', () => {
    expect(caps('Flamengo')).toBe('F');
    expect(caps('Palmeiras')).toBe('P');
    expect(caps('Bolão da Nação')).toBe('BN');
    expect(caps('Hoje tem Mengão!')).toBe('HM');
  });

  it('não mexe em palavras só em maiúsculas, números e sinais', () => {
    expect(caps('GOL!')).toBe('');
    expect(caps('RSNH26')).toBe('');
    expect(caps('1.482')).toBe('');
    expect(caps('Portão C')).toBe('P');
  });

  it('amplia o artigo de uma letra que abre a frase, não a letra-código', () => {
    expect(caps('O Flamengo inteiro num app só')).toBe('OF');
    expect(caps('O estádio em 3D, do portão ao seu lugar')).toBe('O');
    expect(caps('Vai cedo. A fila anda')).toBe('VA');
    expect(caps('Portão A')).toBe('P');
    expect(caps('Entre pelo Portão D. O resto é festa')).toBe('EPO');
  });

  it('preserva o texto inteiro', () => {
    const t = 'Flamengo × Palmeiras, 16h00';
    expect(
      splitCaps(t)
        .map((s) => s.text)
        .join('')
    ).toBe(t);
  });

  it('cobre todos os estilos display (todos usam Anybody)', () => {
    for (const v of [
      'displayHero',
      'displayXl',
      'displayL',
      'displayM',
      'displayS',
      'displayGoal',
    ] as const) {
      expect(isAnybody(typography[v].fontFamily)).toBe(true);
    }
  });
});
