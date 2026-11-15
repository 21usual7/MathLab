// Real editor integration (needs Chromium): node scripts/check-expressions.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const root = new URL('../', import.meta.url);
const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/expressions.css"><div class="lab-panel" id="host" style="width:100%;max-width:430px"></div><script src="/node_modules/mathjs/lib/browser/math.js"></script><script type="module">
import {Scene} from '/js/core/scene.js';
import {ExprList} from '/js/ui/exprlist.js';
const scene = new Scene();
scene.add('y = x^2'); scene.add('a = 1.23456789123');
const list = new ExprList(document.querySelector('#host'), scene);
window.labTest = {scene, list};
</script>`;
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path === '/') { res.setHeader('Content-Type', 'text/html'); res.end(html); return; }
    const file = new URL(`.${path}`, root);
    if (!file.href.startsWith(root.href)) { res.writeHead(403).end(); return; }
    res.setHeader('Content-Type', ({ js: 'text/javascript', css: 'text/css', woff2: 'font/woff2' })[file.pathname.split('.').pop()] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1100, height: 850 } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const base = `http://127.0.0.1:${server.address().port}`;
  await page.goto(base);
  await page.waitForSelector('.math-editor.is-visual', { timeout: 30000 });
  const field = page.locator('.math-entry').first();
  const replace = async (locator, latex) => {
    await locator.click();
    await page.waitForTimeout(100); // MathLive settles its keyboard sink focus asynchronously.
    await locator.evaluate((el, value) => {
      el.setValue(value); el.dispatchEvent(new Event('input', { bubbles: true }));
    }, latex);
  };
  await field.click();
  await page.waitForTimeout(100);
  // Merely focusing must not round a saved constant or rewrite its source.
  await page.locator('.math-entry').nth(1).click();
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => labTest.scene.items[1].text), 'a = 1.23456789123');
  await replace(field, 'y=\\frac{x+1}{x-1}');
  await page.waitForFunction(() => labTest.scene.items[0].fn({ x: 3 }) === 2);
  assert.equal(await field.evaluate(el => el === document.activeElement), true);
  // Enter keeps the current editor alive and navigates to the next expression.
  await field.evaluate(el => { window.firstEditor = el; });
  await field.press('Enter');
  assert.equal(await field.evaluate(el => el === window.firstEditor), true);
  const draft = page.locator('.is-draft .math-entry');
  await replace(draft, 'y=\\sin\\left(b x\\right)');
  await page.waitForFunction(() => labTest.scene.items.some(i => i.text.includes('sin')));
  // Promoting the blank row must preserve focus; there is always one fresh blank.
  assert.equal(await page.locator('.is-draft').count(), 1);
  const sine = page.locator('.expression-row').filter({ has: page.locator('.math-entry') }).nth(2).locator('.math-entry');
  assert.equal(await sine.evaluate(el => el === document.activeElement), true);
  await sine.press('Enter');
  await page.waitForFunction(() => labTest.scene.items.some(i => i.info.kind === 'param' && i.info.name === 'b'));
  // Cancel a real edit, then use the existing keypad against a structured field.
  await field.click();
  await page.waitForTimeout(100);
  const before = await page.evaluate(() => labTest.scene.items[0].text);
  await replace(field, 'y=x^{3}');
  await page.waitForFunction(() => labTest.scene.items[0].fn({ x: 3 }) === 27);
  await field.press('Escape');
  assert.equal(await page.evaluate(() => labTest.scene.items[0].text), before);
  // Exercise real keyboard events, including leaving a superscript.
  await field.click();
  await page.waitForTimeout(100);
  await field.press('ControlOrMeta+a');
  await page.keyboard.type('y=x^2', { delay: 40 });
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type('+1', { delay: 40 });
  await page.waitForFunction(() => labTest.scene.items[0].fn({ x: 3 }) === 10);
  assert.equal(await field.evaluate(el => document.activeElement === el), true);
  await page.locator('.expression-row').first().locator('.kp-toggle').click();
  await page.locator('.kp-key[data-text="+"]').click();
  await page.locator('.kp-key[data-text="1"]').click();
  await page.waitForTimeout(180);
  assert.equal(await page.evaluate(() => labTest.scene.items[0].info.kind), 'function');
  await page.locator('.kp-close').click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: '/tmp/mathlab-expressions-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  // An unavailable editor library must leave usable, live text inputs.
  const offline = await context.newPage();
  await offline.route(/mathlive/, route => route.abort());
  await offline.goto(base);
  const raw = offline.locator('.math-source').first();
  await raw.fill('y = x^3 + 1');
  await offline.waitForFunction(() => labTest.scene.items[0].fn({ x: 2 }) === 9);
  assert.equal(await offline.locator('.math-preview').first().isVisible(), true);
  await offline.close();
  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const touch = await touchContext.newPage();
  await touch.goto(base);
  await touch.waitForSelector('.math-editor.is-visual');
  const touchDraft = touch.locator('.is-draft');
  await touchDraft.locator('.kp-toggle').tap();
  await touch.locator('.kp-key[data-text="x"]').tap();
  await touch.locator('.kp-key[data-text="^2"]').tap();
  await touch.waitForFunction(() => labTest.scene.items.some(i => i.info.kind === 'function' && i.fn({ x: 3 }) === 9));
  await touch.locator('.kp-enter').tap();
  assert.equal(await touch.locator('.is-draft').count(), 1);
  assert.equal(await touch.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await touchContext.close();
  console.log('Expression editor: live input, focus, precision, sliders, Escape, keypad, mobile and fallback passed.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
