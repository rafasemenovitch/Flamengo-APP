/**
 * Prints das páginas de map/dev/ com Playwright (Chrome instalado na máquina,
 * sem baixar navegador). Viewport de celular 390 × 844 @2x.
 *
 * Uso: npx tsx map/tools/shots.ts <fase>      ex.: npx tsx map/tools/shots.ts 1
 * Saída: docs/maracana/screens/fase-<fase>/
 * Chrome: CHROME_PATH=/caminho/do/chrome se não estiver no lugar padrão.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

import { serve } from './serve';

const ROOT = path.resolve(__dirname, '../..');
const PORT = 8788;
const CHROME =
  process.env.CHROME_PATH ??
  [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].find((p) => fs.existsSync(p));

type Shot = {
  name: string;
  url: string;
  width?: number;
  height?: number;
  /** Bloqueia o mapa de base (simula falta de internet). */
  offline?: boolean;
};

const PHASES: Record<string, Shot[]> = {
  '1': [
    { name: '01-todos-niveis', url: 'report.html?level=all' },
    { name: '02-nivel-1', url: 'report.html?level=1&zoom=16.4' },
    { name: '03-nivel-2', url: 'report.html?level=2&zoom=16.4' },
    { name: '04-nivel-3', url: 'report.html?level=3&zoom=16.4' },
    { name: '05-nivel-5', url: 'report.html?level=5&zoom=16.4' },
    { name: '06-grafo-corredores', url: 'report.html?level=all&graph=1&labels=0' },
    { name: '07-visao-geral-desktop', url: 'report.html?level=all&zoom=16.7', width: 1400, height: 1000 },
    { name: '08-grafo-desktop', url: 'report.html?level=all&graph=1&zoom=16.7', width: 1400, height: 1000 },
  ],
  '2': [
    { name: '01-inicial-claro', url: 'index.html?panel=0&theme=light' },
    { name: '02-inicial-escuro', url: 'index.html?panel=0&theme=dark' },
    { name: '03-gramado-claro', url: 'index.html?panel=0&theme=light&cam=close' },
    { name: '04-gramado-escuro', url: 'index.html?panel=0&theme=dark&cam=close' },
    { name: '05-girado-claro', url: 'index.html?panel=0&theme=light&cam=rotated' },
    { name: '06-girado-escuro', url: 'index.html?panel=0&theme=dark&cam=rotated' },
    { name: '07-zoom-minimo-claro', url: 'index.html?panel=0&theme=light&cam=min' },
    { name: '08-limite-escuro', url: 'index.html?panel=0&theme=dark&cam=far' },
    { name: '09-sem-tiles-claro', url: 'index.html?panel=0&theme=light', offline: true },
    { name: '10-sem-tiles-escuro', url: 'index.html?panel=0&theme=dark', offline: true },
    { name: '11-desktop-claro', url: 'index.html?panel=0&theme=light', width: 1400, height: 900 },
    { name: '12-desktop-escuro', url: 'index.html?panel=0&theme=dark', width: 1400, height: 900 },
  ],
};

/** Folha lado a lado: referências (docs/maracana/referencias/) × prints da fase. */
const COMPARE: Record<string, string[]> = {
  '2': ['01-inicial-claro', '02-inicial-escuro'],
};

async function compare(browser: import('playwright-core').Browser, out: string, ours: string[]) {
  const base = `http://localhost:${PORT}/docs/maracana`;
  const phaseDir = path.relative(path.join(ROOT, 'docs/maracana'), out);
  const cols = [
    ['SoFi Stadium (referência)', `${base}/referencias/sofi-stadium.jpg`],
    ['Tottenham (referência)', `${base}/referencias/tottenham-hotspur-stadium.jpg`],
    ...ours.map((n) => [n.replace(/^\d+-/, '').replace('-', ' '), `${base}/${phaseDir}/${n}.png`]),
  ];
  const page = await browser.newPage({ viewport: { width: 1640, height: 900 }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0;padding:20px;background:#1e1e22;font:600 15px system-ui;color:#f5f5f4;display:flex;gap:16px">
    ${cols.map(([t, src]) => `<figure style="margin:0;width:390px"><figcaption style="margin-bottom:8px">${t}</figcaption><img src="${src}" style="width:390px;height:810px;object-fit:cover;object-position:top;border-radius:14px"></figure>`).join('')}</body>`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(out, 'comparacao-referencias.png'), fullPage: true });
  console.log('  ok comparacao-referencias');
  await page.close();
}

async function main() {
  const phase = process.argv[2] ?? '1';
  const shots = PHASES[phase];
  if (!shots) throw new Error(`Fase sem prints definidos: ${phase}`);
  if (!CHROME) throw new Error('Chrome não encontrado. Defina CHROME_PATH.');
  const out = path.join(ROOT, 'docs/maracana/screens', `fase-${phase}`);
  fs.mkdirSync(out, { recursive: true });
  const server = await serve(PORT);
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    for (const s of shots) {
      const page = await browser.newPage({
        viewport: { width: s.width ?? 390, height: s.height ?? 844 },
        deviceScaleFactor: 2,
      });
      page.on('pageerror', (e) => console.log(`  [${s.name}] erro:`, e.message));
      if (s.offline) await page.route(/openfreemap\.org/, (r) => r.abort('internetdisconnected'));
      await page.goto(`http://localhost:${PORT}/map/dev/${s.url}`);
      await page.waitForSelector('body[data-ready]', { timeout: 45_000 });
      await page.waitForTimeout(1500); // tiles do mapa de base
      await page.screenshot({ path: path.join(out, `${s.name}.png`) });
      console.log('  ok', s.name);
      await page.close();
    }
    if (COMPARE[phase]) await compare(browser, out, COMPARE[phase]);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
