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

type Shot = { name: string; url: string; width?: number; height?: number };

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
};

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
      await page.goto(`http://localhost:${PORT}/map/dev/${s.url}`);
      await page.waitForSelector('body[data-ready]', { timeout: 45_000 });
      await page.waitForTimeout(1500); // tiles do mapa de base
      await page.screenshot({ path: path.join(out, `${s.name}.png`) });
      console.log('  ok', s.name);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
