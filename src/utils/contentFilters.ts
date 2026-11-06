import type { ContentCategory } from '@/types/content';

export type Period = 'tudo' | 'hoje' | '7d' | '30d';
export type Sort = 'recentes' | 'antigos';
export type Duration = 'qualquer' | 'curtos' | 'longos';

export interface ContentQuery {
  period: Period;
  category: 'todas' | ContentCategory;
  sort: Sort;
  duration: Duration;
}

const DAY = 86_400_000;

/** Filtra e ordena notícias/vídeos (regra de dados fora dos componentes visuais). */
export function filterContent<
  T extends { publishedAt: string; category: ContentCategory; durationSec?: number },
>(items: T[], q: ContentQuery, now = Date.now()): T[] {
  const since =
    q.period === 'hoje'
      ? new Date(new Date(now).toDateString()).getTime()
      : q.period === '7d'
        ? now - 7 * DAY
        : q.period === '30d'
          ? now - 30 * DAY
          : -Infinity;
  return items
    .filter((i) => new Date(i.publishedAt).getTime() >= since)
    .filter((i) => q.category === 'todas' || i.category === q.category)
    .filter((i) =>
      i.durationSec === undefined || q.duration === 'qualquer'
        ? true
        : q.duration === 'curtos'
          ? i.durationSec <= 300
          : i.durationSec > 300
    )
    .sort((a, b) =>
      q.sort === 'recentes'
        ? b.publishedAt.localeCompare(a.publishedAt)
        : a.publishedAt.localeCompare(b.publishedAt)
    );
}
