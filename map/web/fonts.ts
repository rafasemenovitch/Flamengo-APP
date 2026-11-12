/**
 * Fontes do app para os rótulos do mapa. Sem "glyphs" no estilo, o MapLibre GL JS desenha
 * cada letra localmente com a família pedida em "text-font"; por isso cada peso vira uma
 * família com o nome exato usado nos estilos (map/tools/build-styles.ts → FONT).
 */
export const MAP_FONTS = [
  { family: 'Schibsted Grotesk Medium', file: 'SchibstedGrotesk_500Medium.ttf' },
  { family: 'Schibsted Grotesk SemiBold', file: 'SchibstedGrotesk_600SemiBold.ttf' },
  { family: 'Schibsted Grotesk Bold', file: 'SchibstedGrotesk_700Bold.ttf' },
] as const;

/**
 * Carrega as fontes antes de criar o mapa (senão as primeiras letras saem na fonte padrão
 * e ficam em cache). `src` devolve a URL de cada arquivo: caminho no servidor de
 * desenvolvimento ou data URI dentro da WebView.
 */
export async function loadMapFonts(src: (file: string) => string) {
  await Promise.all(
    MAP_FONTS.map(async ({ family, file }) => {
      // Faixa de peso inteira: o MapLibre deduz o peso pelo nome ("SemiBold" → 600) e
      // assim o navegador usa o arquivo certo sem engrossar a letra artificialmente.
      const face = new FontFace(family, `url(${src(file)})`, { weight: '100 900' });
      document.fonts.add(await face.load());
    })
  );
}
