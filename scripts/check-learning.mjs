// Run: CHROMIUM_PATH=/usr/bin/chromium node scripts/check-learning.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import derivative from '../js/topics/derivative.js';

const root = new URL('../', import.meta.url);
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = new URL(`.${path === '/' ? '/index.html' : path}`, root);
    if (!file.href.startsWith(root.href)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.setHeader('Content-Type', ({ js: 'text/javascript', css: 'text/css', html: 'text/html' })[file.pathname.split('.').pop()] || 'application/octet-stream');
    res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => localStorage.setItem('mathlab-lang', 'ru'));
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = `http://127.0.0.1:${server.address().port}`;
    const go = async index => {
      await page.goto(`${base}/#topic/derivative/${index + 1}`);
      try { await page.locator(`.step[data-i="${index}"]`).waitFor({ state: 'visible' }); }
      catch (error) { console.error('Page errors:', errors); throw error; }
      return page.locator(`.step[data-i="${index}"]`);
    };
    const find = id => derivative.steps.findIndex(step => step.id === id);
    const corner = await go(find('corner-prediction'));
    assert.equal(await corner.locator('.check-explain').innerText(), '');
    // No displayed pair of slopes before a prediction.
    assert(!((await page.locator('.legend').innerText()).includes('−1')));
    await corner.locator('.check-options button').first().click();
    await corner.locator('.check.answered').waitFor();
    assert((await corner.locator('.check-explain').innerText()).includes('Производной в нуле нет'));
    const experiment = await go(find('corner-experiment'));
    const slider = page.getByRole('slider', { name: 'gap', exact: true });
    await slider.fill('0.01'); await slider.dispatchEvent('input');
    await page.waitForTimeout(100);
    assert.equal(await slider.inputValue(), '0.01');
    await page.waitForFunction(() => document.querySelector('.legend')?.textContent.includes('0.01'));
    assert(await experiment.isVisible());
    const stationary = await go(find('stationary-counterexample'));
    await stationary.locator('.check-options button').last().click();
    assert((await stationary.locator('.check-explain').innerText()).includes('контрпример'));
    const transfer = await go(find('local-transfer'));
    await page.getByRole('slider', { name: 'estimate', exact: true }).fill('9.05');
    await page.getByRole('slider', { name: 'estimate', exact: true }).dispatchEvent('input');
    await transfer.locator('.task-check').click();
    assert((await transfer.locator('.task-feedback').innerText()).includes('прибавили время'));
    await page.getByRole('slider', { name: 'estimate', exact: true }).fill('9.2');
    await page.getByRole('slider', { name: 'estimate', exact: true }).dispatchEvent('input');
    await transfer.locator('.task-check').click();
    await transfer.locator('.task.solved').waitFor();
    assert((await transfer.locator('.task-feedback').innerText()).includes('точный ответ может отличаться'));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    if (process.env.LEARNING_SCREENSHOT) await page.screenshot({ path: `/tmp/mathlab-learning-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true });
    await page.goto(`${base}/#topics`);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('Learning browser checks passed: predictions, counterexamples, causal slider, transfer, desktop/mobile.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
