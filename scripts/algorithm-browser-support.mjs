import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
export async function algorithmBrowser(check) {
  const root = new URL('../', import.meta.url);
  const server = createServer(async (req, res) => {
    try {
      let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/MathLab/, '');
      const file = new URL(`.${pathname === '/' ? '/index.html' : pathname}`, root);
      if (!file.href.startsWith(root.href)) { res.writeHead(403).end(); return; }
      const data = await readFile(file);
      res.setHeader('Content-Type', ({ js: 'text/javascript', css: 'text/css', html: 'text/html', wasm: 'application/wasm', svg: 'image/svg+xml' })[file.pathname.split('.').pop()] || 'application/octet-stream'); res.end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
    await check(browser, `http://127.0.0.1:${server.address().port}/MathLab`);
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}
