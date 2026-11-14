/**
 * Prints do app inteiro (versão web exportada), em viewport de celular 390 × 844 @2x.
 * Serve para comparar telas novas com as que já existem, sem aparelho.
 *
 * 1. npx expo export --platform web --output-dir <pasta>
 * 2. npx tsx map/tools/app-shots.ts <pasta> <saída> [tema] nome=query[|passo|passo] ...
 *    ex.: npx tsx map/tools/app-shots.ts /tmp/web docs/x dark inicio= maracana=rota=StadiumMode
 *    Passos depois de abrir: `toque:Texto` (toca no texto visível), `rotulo:Rótulo` (toca pelo
 *    rótulo de acessibilidade), `segura:Texto` (toque longo), `clica:x,y` (toque na tela), `digita:texto`, `espera:ms`.
 *    GPS falso: GEO="lat,lng,precisão" (permissão concedida). Sem internet para o mapa: OFFLINE=1.
 *
 * As boas-vindas são puladas (visitante). `rota=` abre a tela direto (só na web,
 * ver openRouteFromUrl em src/navigation/RootNavigator.tsx).
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright-core';

const [dir, out, theme = 'dark', ...pages] = process.argv.slice(2);
const CHROME =
  process.env.CHROME_PATH ??
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find((p) =>
    fs.existsSync(p)
  );
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
};

async function main() {
  if (!dir || !out || !CHROME)
    throw new Error('Uso: app-shots.ts <export-web> <saída> [tema] nome=query ...');
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let file = path.join(root, url);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory())
      file = path.join(root, 'index.html'); // app de página única
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise<void>((r) => server.listen(8790, r));
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    for (const spec of pages) {
      const [name, rest = ''] = spec.split(/=(.*)/s);
      const [query, ...steps] = rest.split('|');
      const geo = process.env.GEO;
      const [lat, lng, accuracy] = (geo && geo !== 'negado' ? geo : '').split(',').map(Number);
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        ...(lat
          ? { geolocation: { latitude: lat, longitude: lng!, accuracy }, permissions: ['geolocation'] }
          : {}),
      });
      page.on('pageerror', (e) => console.log(`  [${name}] erro:`, e.message));
      page.setDefaultTimeout(8000);
      // OFFLINE=1: o mapa da cidade não carrega (simula falta de internet); o resto do app sim.
      if (process.env.OFFLINE) await page.route(/openfreemap\.org/, (r) => r.abort('internetdisconnected'));
      // NOVO=1: abre como na primeira vez (boas-vindas e escolha de conta).
      await page.addInitScript(
        ([t, fresh]) => {
          if (!fresh) {
            localStorage.setItem('@flamengo/onboarding-done', '1');
            localStorage.setItem('@flamengo/auth-guest', '1');
          }
          localStorage.setItem('@flamengo/theme-preference', t);
        },
        [theme, !!process.env.NOVO] as const
      );
      await page.goto(`http://localhost:8790/${query ? '?' + query : ''}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(Number(process.env.WAIT ?? 3500));
      // Pop-up de boas-vindas do dia de jogo: fecha para o print mostrar a tela.
      const later = page.getByText('Agora não', { exact: true });
      if (await later.isVisible().catch(() => false)) {
        await later.click();
        await page.waitForTimeout(900);
      }
      for (const step of steps) {
        const [kind, arg = ''] = step.split(/:(.*)/s);
        try {
          if (kind === 'toque') await page.getByText(arg, { exact: true }).first().click();
          if (kind === 'rotulo') await page.getByLabel(arg, { exact: true }).first().click();
          if (kind === 'clica') {
            const [x, y] = arg.split(',').map(Number);
            await page.mouse.click(x!, y!);
          }
          if (kind === 'segura') await page.getByText(arg, { exact: true }).first().click({ delay: 900 });
          if (kind === 'digita') await page.keyboard.type(arg, { delay: 40 });
          if (kind === 'espera') await page.waitForTimeout(Number(arg));
        } catch {
          console.log(`  [${name}] passo falhou: ${step}`);
        }
        await page.waitForTimeout(kind === 'espera' ? 0 : 1200);
      }
      await page.screenshot({ path: path.join(out, `${name}.png`) });
      console.log('  ok', name);
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
