/**
 * Página de desenvolvimento do mapa do estádio, fora do app. Simula o app: manda as
 * mesmas mensagens (map/web/protocol.ts) que a tela do Modo Maracanã vai mandar.
 * Abrir: npm run map:dev  →  http://localhost:8787/map/dev/index.html
 *
 * Parâmetros de URL:
 *   theme=light|dark        tema (padrão: o do sistema)
 *   tiles=0                 simula falta de internet para o mapa de base
 *   panel=0                 esconde o painel (prints); card=0 esconde o cartão
 *   level=1|2|3|5           nível ativo (sem: visão geral)
 *   area=<id>&block=512     "Onde você está?"
 *   poi=<id> | sector=<id>  seleção
 *   filter=banheiros|acessibilidade
 *   cam=close|rotated|min|far   câmeras de teste
 */
import type { StyleSpecification } from 'maplibre-gl';

import { createBridge } from '../web/bridge';
import type { FromMap, StadiumData, Theme, ToMap } from '../web/protocol';

const q = new URLSearchParams(location.search);
const DATA = '/assets/stadiums/maracana/';
const json = (url: string) => fetch(url).then((r) => r.json());

/** Filtros de demonstração (no app, viram os chips da folha inferior). */
const ACCESSIBLE = ['banheiro_acessivel', 'elevador', 'sala_sensorial', 'informacao', 'posto_medico'];
const FILTERS: Record<string, (cats: string[]) => string[]> = {
  banheiros: (cats) => cats.filter((c) => !c.startsWith('banheiro')),
  acessibilidade: (cats) => cats.filter((c) => !ACCESSIBLE.includes(c)),
};

async function main() {
  const theme: Theme =
    (q.get('theme') as Theme) ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const [venue, levels, stadium, gates, pois, light, dark] = await Promise.all([
    json(DATA + 'venue.json'),
    json(DATA + 'levels.json'),
    json(DATA + 'stadium.geojson'),
    json(DATA + 'gates.geojson'),
    json(DATA + 'pois.geojson'),
    json('/map/styles/maracana-light.json'),
    json('/map/styles/maracana-dark.json'),
  ]);
  const data: StadiumData = { venue, levels, stadium, gates, pois };
  const styles = { light, dark } as Record<Theme, StyleSpecification>;
  if (q.get('tiles') === '0')
    for (const s of Object.values(styles))
      (s.sources as any).openmaptiles = { type: 'vector', url: 'http://127.0.0.1:9/sem-internet.json' };
  const categories = Object.keys((light.metadata as any)['fla:poi']);
  const poiById = new Map<string, any>(pois.features.map((f: any) => [f.properties.id, f.properties]));
  const areaById = new Map<string, any>(levels.areas.map((a: any) => [a.id, a]));
  const sectorById = new Map<string, any>(levels.sectors.map((s: any) => [s.id, s]));

  const card = document.getElementById('card')!;
  const levelName = (l: string | null) => (l ? `Nível ${l}` : 'Área externa');
  const showCard = (html: string | null) => {
    if (q.get('card') === '0') html = null;
    card.hidden = !html;
    card.innerHTML = html ?? '';
  };
  const onMap = (msg: FromMap) => {
    if (msg.type === 'ready') {
      console.info(`[mapa] pronto em ${msg.ms} ms`);
      afterReady();
    }
    if (msg.type === 'levelChanged') markLevel(msg.level);
    if (msg.type === 'cameraChanged') show();
    if (msg.type === 'poiTapped') {
      const p = poiById.get(msg.id);
      showCard(
        `<b>${p.name}</b><br><small>${levelName(p.level)}${p.sector ? ' · perto de ' + sectorById.get(p.sector)?.name : ''}${p.confidence === 'estimado' ? ' · posição aproximada' : ''}</small>`
      );
    }
    if (msg.type === 'sectorTapped') {
      const s = sectorById.get(msg.id);
      showCard(
        `<b>${s.name}</b><br><small>${levelName(s.level)} · portões ${s.gates.join(', ')}${s.blocks.length ? ' · blocos ' + s.blocks[0] + '–' + s.blocks[s.blocks.length - 1] : ''}</small>`
      );
    }
    if (msg.type === 'gateTapped') showCard(`<b>Portão ${msg.id}</b>`);
    if (msg.type === 'error') console.warn('[mapa]', msg.message);
  };

  const container = document.getElementById('map')!;
  const bridge = createBridge({
    container,
    fontSrc: (file) => `/assets/fonts/${file}`,
    emit: onMap,
    preserveDrawingBuffer: true,
  });
  const send = (msg: ToMap) => bridge.handle(msg);
  (window as any).__send = send;
  send({ type: 'init', data, styles, theme });

  // ── painel
  const panel = document.getElementById('panel')!;
  panel.hidden = q.get('panel') === '0';
  const press = (sel: string, pred: (b: HTMLElement) => boolean) =>
    panel.querySelectorAll<HTMLElement>(sel).forEach((b) => b.setAttribute('aria-pressed', String(pred(b))));
  const markTheme = (t: Theme) => press('[data-theme]', (b) => b.dataset.theme === t);
  markTheme(theme);
  panel.querySelectorAll<HTMLElement>('[data-theme]').forEach((b) =>
    b.addEventListener('click', () => {
      send({ type: 'setTheme', theme: b.dataset.theme as Theme });
      markTheme(b.dataset.theme as Theme);
    })
  );
  const levelsBox = document.getElementById('levels')!;
  for (const id of ['all', ...levels.levels.filter((l: any) => l.public).map((l: any) => l.id)]) {
    const b = document.createElement('button');
    b.dataset.level = id;
    b.textContent = id === 'all' ? 'Estádio' : `Nível ${id}`;
    b.addEventListener('click', () => send({ type: 'setLevel', level: id }));
    levelsBox.append(b, ' ');
  }
  const markLevel = (l: string) => press('[data-level]', (b) => b.dataset.level === l);
  markLevel('all');
  const areaSel = document.getElementById('area') as HTMLSelectElement;
  const blockIn = document.getElementById('block') as HTMLInputElement;
  for (const a of levels.areas) areaSel.add(new Option(a.name, a.id));
  const sendArea = () =>
    send({ type: 'setArea', area: areaSel.value || null, block: blockIn.value || undefined });
  areaSel.addEventListener('change', sendArea);
  blockIn.addEventListener('change', sendArea);
  let filter = '';
  const applyFilter = (f: string) => {
    filter = filter === f ? '' : f;
    press('[data-filter]', (b) => b.dataset.filter === filter);
    send({ type: 'setFilters', hidden: filter ? FILTERS[filter](categories) : [] });
  };
  panel
    .querySelectorAll<HTMLElement>('[data-filter]')
    .forEach((b) => b.addEventListener('click', () => applyFilter(b.dataset.filter!)));
  const tiles = document.getElementById('tiles')!;
  tiles.setAttribute('aria-pressed', String(q.get('tiles') === '0'));
  tiles.addEventListener('click', () => {
    q.get('tiles') === '0' ? q.delete('tiles') : q.set('tiles', '0');
    location.search = q.toString();
  });
  document.getElementById('recenter')!.addEventListener('click', () => send({ type: 'recenter' }));
  const out = document.getElementById('cam')!;
  function show() {
    const m = bridge.map()?.map;
    if (m)
      out.textContent = `zoom ${m.getZoom().toFixed(2)} · inclinação ${m.getPitch().toFixed(0)}° · rotação ${m.getBearing().toFixed(0)}°`;
  }

  // ── estado inicial pela URL (prints)
  function afterReady() {
    const m = bridge.map()!.map;
    (window as any).__map = m;
    m.on('move', show);
    const cam = q.get('cam');
    if (cam === 'close') m.jumpTo({ zoom: 17.75, pitch: 42 });
    if (cam === 'rotated') m.jumpTo({ bearing: m.getBearing() + 60, pitch: 62, zoom: m.getZoom() + 0.25 });
    if (cam === 'min') m.jumpTo({ zoom: 15.5 });
    if (cam === 'far') m.jumpTo({ center: [venue.center[0] + 0.03, venue.center[1] + 0.02], zoom: 15.5 });
    const lvl = q.get('level');
    if (lvl) send({ type: 'setLevel', level: lvl });
    const area = q.get('area');
    if (area) {
      areaSel.value = area;
      blockIn.value = q.get('block') ?? '';
      sendArea();
      const a = areaById.get(area);
      showCard(`<small>Você está em</small><br><b>${a.name}</b>`);
    }
    const f = q.get('filter');
    if (f) applyFilter(f);
    const poi = q.get('poi');
    if (poi) (onMap({ type: 'poiTapped', id: poi }), send({ type: 'focusPoi', id: poi }));
    const sector = q.get('sector');
    if (sector) (onMap({ type: 'sectorTapped', id: sector }), send({ type: 'focusSector', id: sector }));
    if (q.get('zoom')) m.jumpTo({ zoom: Number(q.get('zoom')) });
    show();
    // Pronto para print: depois das animações (voo de 750 ms, nível de 520 ms) e dos tiles.
    setTimeout(() => {
      m.once('idle', () => document.body.setAttribute('data-ready', '1'));
      m.triggerRepaint();
    }, 1100);
  }
}

main().catch((e) => {
  document.body.setAttribute('data-ready', 'error');
  document.body.insertAdjacentHTML('beforeend', `<pre>${String(e?.stack ?? e)}</pre>`);
});
