/**
 * Entrada do mapa dentro da WebView do app (bundle gerado por map/tools/build-webview.ts).
 * As fontes do app chegam embutidas como data URI em `window.__FONTS`; dados e estilos
 * chegam do app pela mensagem `init`.
 */
import { createBridge } from './bridge';

declare global {
  interface Window {
    __FONTS?: Record<string, string>;
  }
}

createBridge({
  container: document.getElementById('map')!,
  fontSrc: (file) => window.__FONTS?.[file] ?? '',
});
