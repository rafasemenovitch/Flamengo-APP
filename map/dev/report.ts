/**
 * Relatório visual dos dados do estádio (fase 1). Mapa plano, sem 3D:
 * contorno do OSM, setores por nível, seções, portões e rampas, todos os pontos
 * coloridos pelo grau de confiança e o grafo de corredores.
 *
 * Parâmetros de URL: ?level=all|1|2|3|5  &graph=1  &zoom=16.2  &labels=0
 * Abrir: npm run map:dev  →  http://localhost:8787/map/dev/report.html
 */
import maplibregl from 'maplibre-gl';

const q = new URLSearchParams(location.search);
const LEVEL = q.get('level') ?? 'all';
const GRAPH = q.get('graph') === '1';
const BASE = '/assets/stadiums/maracana/';

const CONF_COLOR = { confirmado: '#1f9d55', fonte_unica: '#e0a100', estimado: '#8a8f98' } as const;
const LEVEL_COLOR: Record<string, string> = {
  '1': '#2b6cb0',
  '2': '#2c7a7b',
  '3': '#805ad5',
  '5': '#c05621',
};
const SIDE_COLOR: Record<string, string> = {
  norte: '#38a169',
  sul: '#d69e2e',
  leste: '#e53e3e',
  oeste: '#3182ce',
};
const EDGE_COLOR: Record<string, string> = {
  corredor: '#4a5568',
  rampa: '#2b6cb0',
  escada: '#c53030',
  escada_rolante: '#b7791f',
  elevador: '#2f855a',
  externo: '#718096',
};
const CAT_LETTER: Record<string, string> = {
  banheiro: 'B',
  banheiro_acessivel: 'BA',
  alimentacao: 'A',
  bebidas: 'Be',
  loja: 'L',
  elevador: 'E',
  escada_rolante: 'ER',
  escada: 'Es',
  posto_medico: '+',
  informacao: 'i',
  sala_sensorial: 'S',
  bilheteria: 'T',
  estacionamento: 'P',
  saida_emergencia: 'X',
};

async function main() {
  const [venue, levels, stadium, gates, pois, walkways] = await Promise.all(
    ['venue.json', 'levels.json', 'stadium.geojson', 'gates.geojson', 'pois.geojson', 'walkways.geojson'].map(
      (f) => fetch(BASE + f).then((r) => r.json())
    )
  );
  const lvl = (f: any) => LEVEL === 'all' || f.properties.level === LEVEL || f.properties.level == null;
  const filterFc = (fc: any, pred: (f: any) => boolean) => ({ ...fc, features: fc.features.filter(pred) });
  const poiFc = {
    ...pois,
    features: pois.features
      .filter((f: any) => LEVEL === 'all' || f.properties.level === LEVEL || f.properties.level == null)
      .map((f: any) => ({
        ...f,
        properties: { ...f.properties, letter: CAT_LETTER[f.properties.category] ?? '?' },
      })),
  };

  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/positron',
    center: venue.center,
    zoom: Number(q.get('zoom') ?? 16.15),
    bearing: venue.pitchBearing + 90, // Leste no topo, Norte à esquerda, como nas figuras do manual
    pitch: 0,
    attributionControl: { compact: true },
    canvasContextAttributes: { preserveDrawingBuffer: true },
  });
  map.setPadding({ top: 0, left: 0, right: 0, bottom: 110 });
  (window as any).__map = map;
  map.on('load', () => {
    map.addSource('stadium', { type: 'geojson', data: stadium });
    map.addSource('stands', {
      type: 'geojson',
      data: filterFc(stadium, (f) => ['stand', 'box'].includes(f.properties.kind) && lvl(f)),
    });
    map.addSource('gates', { type: 'geojson', data: gates });
    map.addSource('pois', { type: 'geojson', data: poiFc });
    map.addSource('walk', { type: 'geojson', data: filterFc(walkways, (f) => f.properties.kind === 'edge') });

    map.addLayer({
      id: 'esplanade',
      type: 'fill',
      source: 'stadium',
      filter: ['==', 'kind', 'esplanade'],
      paint: { 'fill-color': '#eef0f2', 'fill-opacity': 0.8 },
    });
    map.addLayer({
      id: 'concourse',
      type: 'fill',
      source: 'stadium',
      filter: ['==', 'kind', 'concourse'],
      paint: { 'fill-color': '#d9dde3' },
    });
    map.addLayer({
      id: 'surround',
      type: 'fill',
      source: 'stadium',
      filter: ['==', 'kind', 'field-surround'],
      paint: { 'fill-color': '#9cc49a' },
    });
    map.addLayer({
      id: 'pitch',
      type: 'fill',
      source: 'stadium',
      filter: ['==', 'kind', 'pitch'],
      paint: { 'fill-color': '#6aa86a' },
    });
    map.addLayer({
      id: 'lines',
      type: 'line',
      source: 'stadium',
      filter: ['==', 'kind', 'pitch-lines'],
      paint: { 'line-color': '#fff', 'line-width': 1 },
    });
    map.addLayer({
      id: 'stands',
      type: 'fill',
      source: 'stands',
      paint: {
        'fill-color':
          LEVEL === 'all'
            ? [
                'match',
                ['get', 'level'],
                '1',
                LEVEL_COLOR['1'],
                '2',
                LEVEL_COLOR['2'],
                '3',
                LEVEL_COLOR['3'],
                LEVEL_COLOR['5'],
              ]
            : [
                'match',
                ['get', 'side'],
                'norte',
                SIDE_COLOR.norte,
                'sul',
                SIDE_COLOR.sul,
                'leste',
                SIDE_COLOR.leste,
                SIDE_COLOR.oeste,
              ],
        'fill-opacity': ['interpolate', ['linear'], ['get', 'step'], 0, 0.45, 3, 0.8],
      },
    });
    map.addLayer({
      id: 'sections',
      type: 'line',
      source: 'stadium',
      filter: ['all', ['==', 'kind', 'section'], LEVEL === 'all' ? true : ['==', 'level', LEVEL]],
      paint: { 'line-color': '#ffffff', 'line-width': 0.6, 'line-opacity': 0.8 },
    });
    map.addLayer({
      id: 'outline',
      type: 'line',
      source: 'stadium',
      filter: ['==', 'kind', 'outline'],
      paint: { 'line-color': '#1a202c', 'line-width': 1.2, 'line-dasharray': [3, 2] },
    });
    map.addLayer({
      id: 'ramps',
      type: 'fill',
      source: 'stadium',
      filter: ['==', 'kind', 'ramp'],
      paint: { 'fill-color': '#4a5568', 'fill-opacity': 0.75 },
    });
    if (q.get('labels') !== '0')
      map.addLayer({
        id: 'section-labels',
        type: 'symbol',
        source: 'stadium',
        filter: [
          'all',
          ['==', 'kind', 'section-label'],
          LEVEL === 'all' ? ['==', 'level', '__none'] : ['==', 'level', LEVEL],
        ],
        layout: {
          'text-field': ['get', 'ref'],
          'text-size': 9,
          'text-font': ['Noto Sans Bold'],
          'text-allow-overlap': true,
        },
        paint: { 'text-color': '#fff' },
      });
    if (GRAPH)
      map.addLayer({
        id: 'walk',
        type: 'line',
        source: 'walk',
        paint: {
          'line-color': ['match', ['get', 'type'], ...Object.entries(EDGE_COLOR).flat(), '#000'] as any,
          'line-width': ['match', ['get', 'type'], 'corredor', 1, 2],
          'line-dasharray': [2, 1],
        },
      });
    map.addLayer({
      id: 'pois',
      type: 'circle',
      source: 'pois',
      paint: {
        'circle-radius': 6,
        'circle-color': [
          'match',
          ['get', 'confidence'],
          'confirmado',
          CONF_COLOR.confirmado,
          'fonte_unica',
          CONF_COLOR.fonte_unica,
          CONF_COLOR.estimado,
        ],
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 1,
      },
    });
    map.addLayer({
      id: 'poi-letters',
      type: 'symbol',
      source: 'pois',
      layout: {
        'text-field': ['get', 'letter'],
        'text-size': 7,
        'text-font': ['Noto Sans Bold'],
        'text-allow-overlap': true,
      },
      paint: { 'text-color': '#fff' },
    });
    map.addLayer({
      id: 'gates',
      type: 'symbol',
      source: 'gates',
      filter: ['==', 'kind', 'gate'],
      layout: {
        'text-field': [
          'concat',
          ['get', 'name'],
          ['case', ['to-boolean', ['get', 'nickname']], ['concat', '\n', ['get', 'nickname']], ''],
        ],
        'text-size': 11,
        'text-font': ['Noto Sans Bold'],
        'text-allow-overlap': true,
      },
      paint: { 'text-color': '#fff', 'text-halo-color': CONF_COLOR.confirmado, 'text-halo-width': 3 },
    });

    // Legenda
    const counts: Record<string, number> = {};
    for (const f of poiFc.features)
      counts[f.properties.confidence] = (counts[f.properties.confidence] ?? 0) + 1;
    const lev = levels.levels.filter((l: any) => l.public).map((l: any) => l.id);
    document.getElementById('legend')!.innerHTML = `
      <b>${venue.name} · ${LEVEL === 'all' ? 'todos os níveis' : 'Nível ' + LEVEL}</b>
      <div class="row">${Object.entries(CONF_COLOR)
        .map(
          ([k, c]) => `<span><i style="background:${c}"></i>${k.replace('_', ' ')} ${counts[k] ?? 0}</span>`
        )
        .join('')}</div>
      ${
        LEVEL === 'all'
          ? `<div class="row">${lev.map((l: string) => `<span><i style="background:${LEVEL_COLOR[l]}"></i>N${l}</span>`).join('')}</div>`
          : `<div class="row">${Object.entries(SIDE_COLOR)
              .map(([k, c]) => `<span><i style="background:${c}"></i>${k}</span>`)
              .join('')}</div>`
      }
      ${
        GRAPH
          ? `<div class="row">${Object.entries(EDGE_COLOR)
              .map(([k, c]) => `<span><i style="background:${c}"></i>${k.replace('_', ' ')}</span>`)
              .join('')}</div>`
          : ''
      }
      <div class="small">Letras: B banheiro · BA acessível · A alimentação · Be bebidas · L loja · E elevador · ER esc. rolante · Es escada · + saúde · i informação · S sala sensorial · T bilheteria · P estac. · X saída</div>`;
    map.once('idle', () => document.body.setAttribute('data-ready', '1'));
  });
}
main().catch((e) => {
  document.body.setAttribute('data-ready', 'error');
  document.body.insertAdjacentHTML('beforeend', `<pre>${String(e)}</pre>`);
});
