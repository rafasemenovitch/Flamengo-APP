import type { ImageSourcePropType } from 'react-native';

/**
 * PONTO ÚNICO de material de marca (artes em LOGO/, recortadas aqui).
 * O que for `null` é desenhado por placeholders próprios.
 */
export const brandAssets: {
  /**
   * Escudo do Flamengo como TIME em partidas, tabelas, escalações e bolões.
   * Fica `null`: escudos de times virão da API de dados esportivos.
   */
  crest: ImageSourcePropType | null;
  /**
   * Monograma CRF como MARCA DO APP (nunca no lugar de escudo de time):
   * carteirinha, comemoração de gol, boas-vindas e assinatura da Home.
   */
  monogramRed: ImageSourcePropType | null;
  monogramWhite: ImageSourcePropType | null;
  /** Logotipo horizontal para o cabeçalho (texto branco + CRF vermelho, fundo transparente). */
  wordmark: ImageSourcePropType | null;
  /** Mesmo logo com o texto em preto, para o tema claro. */
  wordmarkDark: ImageSourcePropType | null;
  /** Ilustração do mascote para popups de aviso (fase futura). */
  mascot: ImageSourcePropType | null;
} = {
  crest: null,
  monogramRed: require('./crf-red.png'),
  monogramWhite: require('./crf-white.png'),
  wordmark: require('./wordmark.png'),
  wordmarkDark: require('./wordmark-dark.png'),
  mascot: null,
};

/**
 * Fotos de jogadores, notícias e vídeos: no modo demo, os seeds apontam para
 * chaves de placeholder (ex.: 'news-1'); quando houver imagens licenciadas,
 * registre-as aqui por chave e o MediaImage passa a exibi-las.
 */
export const mediaAssets: Record<string, ImageSourcePropType> = {};
