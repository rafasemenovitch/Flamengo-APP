export type ContentCategory =
  'jogos' | 'elenco' | 'bastidores' | 'base' | 'clube' | 'socio' | 'loja' | 'feminino';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  body: string[];
  category: ContentCategory;
  publishedAt: string;
  readMinutes: number;
  imageKey: string;
  author: string;
  playerIds: string[];
  tags: string[];
}

export interface Video {
  id: string;
  title: string;
  description: string;
  category: ContentCategory;
  /** Duração em segundos. */
  durationSec: number;
  publishedAt: string;
  imageKey: string;
  views: number;
  playerIds: string[];
  /** Exclusivo para sócios. */
  membersOnly: boolean;
  /** Vídeo ligado a uma partida (melhores momentos). */
  matchId?: string;
}

/** Item do "Para você": notícia ou vídeo com o motivo da recomendação. */
export type RecommendedItem =
  { kind: 'news'; item: NewsArticle; reason: string } | { kind: 'video'; item: Video; reason: string };
