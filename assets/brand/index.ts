import type { ImageSourcePropType } from 'react-native';

/**
 * PONTO ÚNICO de material de marca. Hoje não temos licença de escudo, logo
 * nem fotos oficiais: tudo é `null`, e os componentes desenham placeholders
 * próprios (ver src/design-system/components/brand/).
 *
 * Quando houver material autorizado, basta trocar `null` por `require(...)`:
 *   crest: require('./crest.png'),
 */
export const brandAssets: {
  /** Escudo do clube (PNG transparente, quadrado, >= 512px). */
  crest: ImageSourcePropType | null;
  /** Logotipo horizontal para o cabeçalho. */
  wordmark: ImageSourcePropType | null;
  /** Ilustração do mascote para popups de aviso (fase futura). */
  mascot: ImageSourcePropType | null;
} = {
  crest: null,
  wordmark: null,
  mascot: null,
};

/**
 * Fotos de jogadores, notícias e vídeos: no modo demo, os seeds apontam para
 * chaves de placeholder (ex.: 'news-1'); quando houver imagens licenciadas,
 * registre-as aqui por chave e o MediaImage passa a exibi-las.
 */
export const mediaAssets: Record<string, ImageSourcePropType> = {};
