import { countdownTo, formatCompact, formatCurrency, formatDuration, formatNumber } from '@/utils/format';

describe('formatação pt-BR', () => {
  it('formata moeda com separadores brasileiros', () => {
    expect(formatCurrency(1234.5)).toBe('R$ 1.234,50');
    expect(formatCurrency(21.8)).toBe('R$ 21,80');
    expect(formatCurrency(357.94)).toBe('R$ 357,94');
  });

  it('formata números grandes e compactos', () => {
    expect(formatNumber(78000)).toBe('78.000');
    expect(formatCompact(1_204_000)).toBe('1,2 mi');
    expect(formatCompact(98_500)).toBe('98,5 mil');
    expect(formatCompact(950)).toBe('950');
  });

  it('formata duração de vídeo', () => {
    expect(formatDuration(312)).toBe('5:12');
    expect(formatDuration(65)).toBe('1:05');
  });

  it('calcula contagem regressiva e nunca fica negativa', () => {
    const now = Date.UTC(2026, 10, 6, 12, 0, 0);
    const target = new Date(now + (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000).toISOString();
    expect(countdownTo(target, now)).toMatchObject({ days: 2, hours: 3, minutes: 4, seconds: 5 });
    expect(countdownTo(new Date(now - 1000).toISOString(), now).totalMs).toBe(0);
  });
});
