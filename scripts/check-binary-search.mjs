// Run: node scripts/check-binary-search.mjs. Optional: CHROMIUM_PATH=/usr/bin/chromium.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root = new URL('../', import.meta.url);
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = new URL(`.${pathname === '/' ? '/index.html' : pathname}`, root);
    if (!file.href.startsWith(root.href)) { res.writeHead(403).end(); return; }
    const data = await readFile(fileURLToPath(file));
    res.setHeader('Content-Type', ({ js: 'text/javascript', css: 'text/css', html: 'text/html', svg: 'image/svg+xml' })[file.pathname.split('.').pop()] || 'application/octet-stream'); res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const base = `http://127.0.0.1:${server.address().port}`;
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => { localStorage.setItem('mathlab-lang', 'ru'); localStorage.removeItem('mathlab-worlds'); });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const go = async (mode = 0) => { await page.goto(`${base}/#world/binary-search/${mode}`); await page.waitForSelector(mode ? '.algorithm-lab:not([hidden])' : '.algorithm-story'); };
  const button = name => page.getByRole('button', { name, exact: true });
  const seek = async time => { await page.locator('.algorithm-timeline').evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, time); };
  await go();
  assert.equal(await page.locator('.algorithm-story').count(), 1);
  await button('▶ Смотреть историю').click(); await page.waitForTimeout(120); await button('Ⅱ Пауза').click();
  const paused = await page.locator('.algorithm-story').getAttribute('data-time'); await page.waitForTimeout(100);
  assert.equal(await page.locator('.algorithm-story').getAttribute('data-time'), paused);
  await seek(12.7); await button('▶ Продолжить').click(); await page.waitForTimeout(650);
  const gate = await page.locator('.algorithm-story').getAttribute('data-time'); assert.equal(gate, '13.12');
  await page.waitForTimeout(100); assert.equal(await page.locator('.algorithm-story').getAttribute('data-time'), gate);
  assert(await page.locator('.algorithm-prediction').isVisible());
  await button('lo = mid + 1').click(); assert.match(await page.locator('.algorithm-prediction .algorithm-feedback').innerText(), /удалит возможный ответ/);
  assert.equal(await button('Продолжить довод →').isVisible(), false);
  await button('hi = mid').click(); await button('Продолжить довод →').click(); await button('Ⅱ Пауза').click();
  assert.equal(await page.locator('.algorithm-story').getAttribute('data-chapter'), 'discard');
  await button('⌕ Причинный микроскоп').click();
  const dialog = page.getByRole('dialog'); assert(await dialog.isVisible());
  await dialog.getByRole('combobox', { name: 'Снимок состояния' }).selectOption('1');
  const before = await dialog.locator('pre').first().innerText();
  await dialog.getByRole('combobox', { name: 'Изменить одну строку' }).selectOption('stall');
  assert.equal(await dialog.locator('pre').first().innerText(), before, 'only the update changes, not the starting snapshot');
  assert.match(await dialog.locator('.algorithm-feedback').innerText(), /длина не уменьшилась/);
  await dialog.getByRole('combobox', { name: 'Снимок состояния' }).selectOption('2');
  await dialog.getByRole('combobox', { name: 'Изменить одну строку' }).selectOption('upper');
  assert.match(await dialog.locator('.algorithm-feedback').innerText(), /Нарушен инвариант/);
  await page.keyboard.press('Escape'); assert.equal(await dialog.count(), 0);
  assert.equal(await page.locator('.world-status.right').count(), 0, 'watching and experiments do not solve a challenge');
  await page.getByRole('combobox', { name: 'Сцена истории' }).selectOption('4');
  await seek(44); const replay = await page.locator('.algorithm-state').innerText(); await seek(8); await seek(44);
  assert.equal(await page.locator('.algorithm-state').innerText(), replay);
  if (process.env.ALGORITHM_SCREENSHOT) {
    await seek(46.95); await page.locator('.stage-host').evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: process.env.ALGORITHM_SCREENSHOT, fullPage: true });
  }
  await button('Новый пример: проверьте себя ↗').click(); await page.waitForSelector('[data-field="boundary-0"]');
  await page.locator('[data-field="boundary-0"]').fill('2'); await page.locator('[data-field="boundary-1"]').fill('3'); await page.locator('[data-field="boundary-2"]').fill('4');
  await page.locator('[data-field="why-n"]').selectOption('below'); await button('Проверить границы').click(); assert.equal(await page.locator('.world-status.right').count(), 0);
  await page.locator('[data-field="boundary-0"]').fill('1'); await page.locator('[data-field="why-n"]').selectOption('missing'); await button('Проверить границы').click(); assert.equal(await page.locator('.world-status.right').count(), 0);
  await page.locator('[data-field="why-n"]').selectOption('below'); await button('Проверить границы').click(); await page.waitForSelector('.world-status.right');
  await go(2);
  await page.locator('[data-field="array"]').fill('3, 1'); await page.locator('[data-field="target"]').fill('3'); await button('Испытать мой контрпример').click(); assert.equal(await page.locator('.world-status.right').count(), 0);
  await page.locator('[data-field="array"]').fill('1, 3'); await page.locator('[data-field="failure-reason"]').selectOption('invariant'); await button('Испытать мой контрпример').click(); assert.equal(await page.locator('.world-status.right').count(), 0);
  assert.match(await page.locator('.algorithm-lab pre').last().innerText(), /Δ=1/);
  await page.locator('[data-field="failure-reason"]').selectOption('progress'); await button('Испытать мой контрпример').click(); await page.waitForSelector('.world-status.right');
  await go(); await button('⌕ Причинный микроскоп').click();
  await page.evaluate(() => { location.hash = '#worlds/algorithms'; }); await page.waitForSelector('.algorithm-story', { state: 'detached' });
  assert.equal(await page.locator('dialog.algorithm-microscope').count(), 0);
  assert.equal(await page.locator('link[href$="/css/algorithms.css"]').count(), 0, 'world disposal releases its stylesheet');
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', locale: 'en' });
  await mobile.addInitScript(() => localStorage.setItem('mathlab-lang', 'en'));
  const phone = await mobile.newPage(); phone.on('pageerror', e => errors.push(e.message));
  await phone.goto(`${base}/#world/binary-search/0`); await phone.waitForSelector('.algorithm-story');
  assert.match(await phone.locator('.algorithm-caption').innerText(), /array is sorted/);
  assert(await phone.locator('.world-stage').evaluate(el => el.getBoundingClientRect().height > innerHeight * .8), 'the film stage must use the phone viewport');
  await phone.getByRole('button', { name: '▶ Watch the story', exact: true }).click();
  assert.equal(await phone.locator('.algorithm-story').getAttribute('data-chapter'), 'compare');
  const staticTime = await phone.locator('.algorithm-story').getAttribute('data-time'); await phone.waitForTimeout(150); assert.equal(await phone.locator('.algorithm-story').getAttribute('data-time'), staticTime);
  assert(await phone.locator('.algorithm-prediction').isVisible());
  await phone.getByRole('button', { name: '▶ Continue', exact: true }).click();
  assert.equal(await phone.locator('.algorithm-story').getAttribute('data-chapter'), 'compare', 'reduced-motion playback also waits for a prediction');
  await phone.getByRole('button', { name: 'hi = mid', exact: true }).click();
  await phone.getByRole('button', { name: 'Continue the argument →', exact: true }).click();
  assert.equal(await phone.locator('.algorithm-story').getAttribute('data-chapter'), 'discard', 'the justified discard scene must not be skipped');
  await phone.getByRole('button', { name: '⌕ Causal microscope', exact: true }).click(); await phone.keyboard.press('Escape');
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'mobile must not overflow horizontally');
  if (process.env.ALGORITHM_SCREENSHOT) {
    await phone.getByRole('combobox', { name: 'Story chapter' }).selectOption('4');
    assert.match(await phone.locator('.algorithm-state').innerText(), /lo=4, hi=4/);
    await phone.locator('.stage-host').evaluate(el => { el.scrollTop = 0; });
    await phone.screenshot({ path: process.env.ALGORITHM_SCREENSHOT.replace(/\.png$/, '') + '-mobile.png', fullPage: true });
  }
  assert.deepEqual(errors, []); console.log('Binary search: director, prediction, causal intervention, independent transfer, counterexample, cleanup, EN/mobile/reduced motion passed.');
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
