import type { ContentCategory, NewsArticle, RecommendedItem, Video } from '@/types/content';

export interface NewsService {
  getLatest(limit?: number): Promise<NewsArticle[]>;
  getArticle(id: string): Promise<NewsArticle>;
  getByCategory(category: ContentCategory): Promise<NewsArticle[]>;
}

export interface FlaTVService {
  getFeatured(limit?: number): Promise<Video[]>;
  getVideos(category?: ContentCategory): Promise<Video[]>;
  getVideo(id: string): Promise<Video>;
}

/** Recomendação simples a partir de jogadores favoritos e interesses do perfil. */
export interface RecommendationService {
  getForYou(input: { favoritePlayerIds: string[]; interests: ContentCategory[] }): Promise<RecommendedItem[]>;
}
