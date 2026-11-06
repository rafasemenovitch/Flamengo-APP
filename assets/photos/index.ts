import type { ImageSourcePropType } from 'react-native';

/**
 * Fotos já TRATADAS (duotone "bandeirão"), geradas por scripts/treat-images.py.
 * Hoje só há placeholders desenhados por código. Para usar fotos licenciadas:
 * coloque-as em assets/photos/source/, rode o script e registre-as em `photos`.
 */
export type PhotoAspect = 'hero' | 'wide' | 'video' | 'square';

export const placeholders: Record<PhotoAspect, ImageSourcePropType[]> = {
  hero: [require('./treated/placeholder-hero.jpg')],
  wide: [require('./treated/placeholder-wide-1.jpg'), require('./treated/placeholder-wide-2.jpg')],
  video: [require('./treated/placeholder-video-1.jpg'), require('./treated/placeholder-video-2.jpg')],
  square: [require('./treated/placeholder-square-1.jpg'), require('./treated/placeholder-square-2.jpg')],
};

/** Fotos tratadas por chave de conteúdo (ex.: 'news-1'). Vazio até haver material licenciado. */
export const photos: Record<string, ImageSourcePropType> = {};
