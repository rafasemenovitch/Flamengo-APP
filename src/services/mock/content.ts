import { FEATURED_HIGHLIGHTS, NEWS, VIDEOS } from '@/data/demo/content';
import { playerById } from '@/data/demo/seed';
import type { FlaTVService, NewsService, RecommendationService } from '@/services/adapters';
import type { ContentCategory, RecommendedItem } from '@/types/content';
import { delay, NotFoundError } from './utils';

const CATEGORY_LABEL: Record<ContentCategory, string> = {
  jogos: 'jogos',
  elenco: 'elenco',
  bastidores: 'bastidores',
  base: 'categorias de base',
  clube: 'clube',
  socio: 'sócio-torcedor',
  loja: 'loja',
  feminino: 'futebol feminino',
};

const byDateDesc = <T extends { publishedAt: string }>(a: T, b: T) => b.publishedAt.localeCompare(a.publishedAt);

export function createMockNewsService(): NewsService {
  return {
    getLatest: async (limit = 10) => delay([...NEWS].sort(byDateDesc).slice(0, limit)),
    getArticle: async (id) => {
      const article = NEWS.find((n) => n.id === id);
      if (!article) throw new NotFoundError('Notícia', id);
      return delay(article);
    },
    getByCategory: async (category) => delay(NEWS.filter((n) => n.category === category).sort(byDateDesc)),
  };
}

const ALL_VIDEOS = [FEATURED_HIGHLIGHTS, ...VIDEOS];

export function createMockFlaTVService(): FlaTVService {
  return {
    getFeatured: async (limit = 6) => delay([...VIDEOS].sort(byDateDesc).slice(0, limit)),
    getVideos: async (category) => delay(VIDEOS.filter((v) => !category || v.category === category).sort(byDateDesc)),
    getVideo: async (id) => {
      const video = ALL_VIDEOS.find((v) => v.id === id);
      if (!video) throw new NotFoundError('Vídeo', id);
      return delay(video);
    },
  };
}

/**
 * Recomendação simples: pontua cada conteúdo por jogador favorito citado
 * (+3) e categoria de interesse (+2), com leve bônus para recência.
 */
export function createMockRecommendationService(): RecommendationService {
  return {
    async getForYou({ favoritePlayerIds, interests }) {
      const scored: Array<RecommendedItem & { score: number }> = [];
      const reasonFor = (playerIds: string[], category: ContentCategory) => {
        const fav = playerIds.find((id) => favoritePlayerIds.includes(id));
        if (fav) return `Porque você segue ${playerById(fav)?.shortName ?? 'este jogador'}`;
        if (interests.includes(category)) return `Do seu interesse: ${CATEGORY_LABEL[category]}`;
        return 'Em alta na Nação';
      };
      const scoreOf = (playerIds: string[], category: ContentCategory, publishedAt: string) => {
        const favHits = playerIds.filter((id) => favoritePlayerIds.includes(id)).length;
        const ageDays = (Date.now() - new Date(publishedAt).getTime()) / 86_400_000;
        return favHits * 3 + (interests.includes(category) ? 2 : 0) + Math.max(0, 1 - ageDays / 14);
      };
      for (const n of NEWS) scored.push({ kind: 'news', item: n, reason: reasonFor(n.playerIds, n.category), score: scoreOf(n.playerIds, n.category, n.publishedAt) });
      for (const v of VIDEOS) scored.push({ kind: 'video', item: v, reason: reasonFor(v.playerIds, v.category), score: scoreOf(v.playerIds, v.category, v.publishedAt) });
      scored.sort((a, b) => b.score - a.score);
      return delay(scored.slice(0, 6).map(({ score: _s, ...rest }) => rest as RecommendedItem));
    },
  };
}
