/**
 * Página de desenvolvimento do mapa do estádio, fora do app.
 * Abrir: npm run map:dev  →  http://localhost:8787/map/dev/index.html
 *
 * Parâmetros de URL:
 *   theme=light|dark    tema (padrão: o do sistema)
 *   tiles=0             simula falta de internet para o mapa de base
 *   panel=0             esconde o painel (prints)
 *   cam=close|rotated|min|far   câmeras de teste; sem cam, a câmera inicial
 */
import type { StyleSpecification } from 'maplibre-gl';

import { loadMapFonts } from '../web/fonts';
import { StadiumMap, type Theme } from '../web/stadiumMap';

const q = new URLSearchParams(location.search);
const DATA = '/assets/stadiums/maracana/';
const json = (url: string) => fetch(url).then((r) => r.json());

async function main() {
  const theme: Theme =
    (q.get('theme') as Theme) ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const [venue, stadium, gates, light, dark] = await Promise.all([
    json(DATA + 'venue.json'),
    json(DATA + 'stadium.geojson'),
    json(DATA + 'gates.geojson'),
    json('/map/styles/maracana-light.json'),
    json('/map/styles/maracana-dark.json'),
    loadMapFonts((file) => `/assets/fonts/${file}`),
  ]);
  const styles = { light, dark } as Record<Theme, StyleSpecification>;
  if (q.get('tiles') === '0')
    for (const s of Object.values(styles))
      (s.sources as any).openmaptiles = { type: 'vector', url: 'http://127.0.0.1:9/sem-internet.json' };

  const container = document.getElementById('map')!;
  const sm = new StadiumMap({
    container,
    data: { venue, stadium, gates },
    styles,
    theme,
    preserveDrawingBuffer: true,
  });
  const { map } = sm;
  (window as any).__map = map;

  const cam = q.get('cam');
  if (cam === 'close') map.jumpTo({ zoom: 17.75, pitch: 42 });
  if (cam === 'rotated')
    map.jumpTo({ bearing: map.getBearing() + 60, pitch: 62, zoom: map.getZoom() + 0.25 });
  if (cam === 'min') map.jumpTo({ zoom: 15.5 });
  if (cam === 'far') map.jumpTo({ center: [venue.center[0] + 0.03, venue.center[1] + 0.02], zoom: 15.5 });

  // Painel
  const panel = document.getElementById('panel')!;
  panel.hidden = q.get('panel') === '0';
  const themeButtons = [...panel.querySelectorAll<HTMLButtonElement>('[data-theme]')];
  const markTheme = (t: Theme) =>
    themeButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.theme === t)));
  markTheme(theme);
  themeButtons.forEach((b) =>
    b.addEventListener('click', () => {
      sm.setTheme(b.dataset.theme as Theme);
      markTheme(b.dataset.theme as Theme);
    })
  );
  const tiles = document.getElementById('tiles')!;
  tiles.setAttribute('aria-pressed', String(q.get('tiles') === '0'));
  tiles.addEventListener('click', () => {
    q.get('tiles') === '0' ? q.delete('tiles') : q.set('tiles', '0');
    location.search = q.toString();
  });
  document.getElementById('recenter')!.addEventListener('click', () => sm.recenter());
  const out = document.getElementById('cam')!;
  const show = () =>
    (out.textContent = `zoom ${map.getZoom().toFixed(2)} · inclinação ${map.getPitch().toFixed(0)}° · rotação ${map.getBearing().toFixed(0)}°`);
  map.on('move', show);
  show();

  map.once('idle', () => document.body.setAttribute('data-ready', '1'));
}

main().catch((e) => {
  document.body.setAttribute('data-ready', 'error');
  document.body.insertAdjacentHTML('beforeend', `<pre>${String(e?.stack ?? e)}</pre>`);
});
