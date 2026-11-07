import type { ImageSourcePropType } from 'react-native';

/**
 * PONTO ÚNICO de material de marca (artes em LOGO/, recortadas aqui).
 * O que for `null` é desenhado por placeholders próprios.
 */
export const brandAssets: {
  /** Monograma CRF vermelho (fundo transparente): escudo do Flamengo sobre fundo preto. */
  crest: ImageSourcePropType | null;
  /** Monograma CRF branco: sobre fotos e blocos vermelhos, e marca-d'água. */
  crestWhite: ImageSourcePropType | null;
  /** Logotipo horizontal para o cabeçalho (texto branco + CRF vermelho, fundo transparente). */
  wordmark: ImageSourcePropType | null;
  /** Ilustração do mascote para popups de aviso (fase futura). */
  mascot: ImageSourcePropType | null;
} = {
  crest: require('./crf-red.png'),
  crestWhite: require('./crf-white.png'),
  wordmark: require('./wordmark.png'),
  mascot: null,
};

/**
 * Fotos de jogadores, notícias e vídeos: no modo demo, os seeds apontam para
 * chaves de placeholder (ex.: 'news-1'); quando houver imagens licenciadas,
 * registre-as aqui por chave e o MediaImage passa a exibi-las.
 */
export const mediaAssets: Record<string, ImageSourcePropType> = {};
