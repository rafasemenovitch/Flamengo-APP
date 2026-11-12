/**
 * Gera o que o app usa do mapa:
 *
 * 1. map/build/mapHtml.js: HTML único da WebView, com MapLibre, o código de map/web,
 *    o CSS e as fontes do app embutidos. Funciona sem internet (só o mapa de base é online).
 *    Não leva dados nem estilos: eles chegam do app pela mensagem `init`.
 * 2. src/services/stadium/generated/<estádio>.js: os dados de assets/stadiums/<estádio>/
 *    num módulo que o Metro importa (ele não lê .geojson).
 *
 * Uso: npx tsx map/tools/build-webview.ts   (faz parte de `npm run map:build`)
 */
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

import { MAP_FONTS } from '../web/fonts';

const ROOT = path.resolve(__dirname, '../..');
const STADIUMS = ['maracana'];

async function html() {
  const bundle = await build({
    entryPoints: [path.join(ROOT, 'map/web/app.ts')],
    bundle: true,
    minify: true,
    write: false,
    format: 'iife',
    target: 'es2020',
    logLevel: 'warning',
  });
  const js = bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const css = fs.readFileSync(path.join(ROOT, 'node_modules/maplibre-gl/dist/maplibre-gl.css'), 'utf8');
  const fonts = Object.fromEntries(
    MAP_FONTS.map(({ file }) => [
      file,
      `data:font/ttf;base64,${fs.readFileSync(path.join(ROOT, 'assets/fonts', file)).toString('base64')}`,
    ])
  );
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>${css}
html,body,#map{margin:0;width:100%;height:100%;overflow:hidden;background:transparent;-webkit-tap-highlight-color:transparent}
.maplibregl-ctrl-bottom-right{bottom:var(--attrib-bottom,0px)}
.maplibregl-ctrl-attrib{font:9px/1.5 'Schibsted Grotesk Medium',system-ui,sans-serif;background:transparent!important}
.maplibregl-ctrl-attrib a{color:inherit!important}
#map[data-theme=light] .maplibregl-ctrl-attrib{color:#8b8a86}
#map[data-theme=dark] .maplibregl-ctrl-attrib{color:#76767e}
</style></head><body><div id="map"></div>
<script>window.__FONTS=${JSON.stringify(fonts)}</script>
<script>${js}</script></body></html>`;
}

function dataModule(id: string) {
  const dir = path.join(ROOT, 'assets/stadiums', id);
  const read = (f: string) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const data = {
    venue: read('venue.json'),
    levels: read('levels.json'),
    stadium: read('stadium.geojson'),
    gates: read('gates.geojson'),
    pois: read('pois.geojson'),
  };
  // JSON.parse de uma string é mais rápido de carregar que um objeto literal grande.
  return `// Gerado por map/tools/build-webview.ts a partir de assets/stadiums/${id}/. Não editar.\nexport default JSON.parse(${JSON.stringify(JSON.stringify(data))});\n`;
}

async function main() {
  const out = path.join(ROOT, 'map/build');
  fs.mkdirSync(out, { recursive: true });
  const page = await html();
  fs.writeFileSync(
    path.join(out, 'mapHtml.js'),
    `// Gerado por map/tools/build-webview.ts. Não editar.\nexport default ${JSON.stringify(page)};\n`
  );
  fs.writeFileSync(
    path.join(out, 'mapHtml.d.ts'),
    '/** HTML da WebView do mapa do estádio (gerado). */\ndeclare const html: string;\nexport default html;\n'
  );
  console.log(`ok map/build/mapHtml.js (${(page.length / 1024).toFixed(0)} KB)`);

  const gen = path.join(ROOT, 'src/services/stadium/generated');
  fs.mkdirSync(gen, { recursive: true });
  for (const id of STADIUMS) {
    fs.writeFileSync(path.join(gen, `${id}.js`), dataModule(id));
    fs.writeFileSync(
      path.join(gen, `${id}.d.ts`),
      "import type { StadiumData } from '../types';\n\ndeclare const data: StadiumData;\nexport default data;\n"
    );
    console.log(`ok src/services/stadium/generated/${id}.js`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
