import { filterContent } from '@/utils/contentFilters';

const now = Date.UTC(2026, 10, 6, 15, 0, 0);
const iso = (daysAgo: number) => new Date(now - daysAgo * 86_400_000).toISOString();
const items = [
  { id: 'a', publishedAt: iso(0.1), category: 'jogos' as const, durationSec: 120 },
  { id: 'b', publishedAt: iso(3), category: 'elenco' as const, durationSec: 600 },
  { id: 'c', publishedAt: iso(20), category: 'jogos' as const, durationSec: 400 },
];

describe('filtros da central de conteúdo', () => {
  const base = { period: 'tudo', category: 'todas', sort: 'recentes', duration: 'qualquer' } as const;
  it('filtra por período', () => {
    expect(filterContent(items, { ...base, period: '7d' }, now).map((i) => i.id)).toEqual(['a', 'b']);
  });
  it('filtra por duração', () => {
    expect(filterContent(items, { ...base, duration: 'curtos' }, now).map((i) => i.id)).toEqual(['a']);
    expect(filterContent(items, { ...base, duration: 'longos' }, now).map((i) => i.id)).toEqual(['b', 'c']);
  });
  it('filtra por categoria e ordena', () => {
    expect(
      filterContent(items, { ...base, category: 'jogos', sort: 'antigos' }, now).map((i) => i.id)
    ).toEqual(['c', 'a']);
  });
});
