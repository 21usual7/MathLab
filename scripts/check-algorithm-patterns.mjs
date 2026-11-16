import assert from 'node:assert/strict';
import { algorithmBrowser } from './algorithm-browser-support.mjs';
import { LESSONS, BINARY_TASK } from '../js/topics/algorithms/pattern-lessons.js';
await algorithmBrowser(async (browser, base) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('mathlab-lang', 'ru'));
  const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
  const go = async (id, step) => { await page.goto(`${base}/#topic/${id}/${step}`); await page.waitForSelector('.pattern-lesson, .algorithm-lab'); };
  const button = name => page.getByRole('button', { name, exact: true });
  const run = async code => { await page.locator('.python-editor').fill(code); await button('▶ Запустить проверки').click(); await page.waitForFunction(() => !document.querySelector('.python-workbench')?.hasAttribute('aria-busy'), null, { timeout: 60000 }); };
  await page.goto(`${base}/#topics/algorithms`); await page.waitForSelector('.subject'); assert.equal(await page.locator('.node.ready').count(), 10);
  for (const [id, lesson] of Object.entries(LESSONS)) {
    await go(id, 1); const choice = page.locator('.pattern-choices .btn'); await choice.nth((lesson.prediction.correct + 1) % lesson.prediction.options.length).click();
    assert.equal(await page.locator('.dot.solved').count(), 0); await choice.nth(lesson.prediction.correct).click(); assert.equal(await page.locator('.dot.solved').count(), 1);
    await go(id, 2); const initial = await page.locator('.pattern-snapshot').innerText(); await button('Один шаг →').click(); assert.notEqual(await page.locator('.pattern-snapshot').innerText(), initial); await page.locator('.pattern-trace').getByRole('button', { name: '← Назад', exact: true }).click(); assert.equal(await page.locator('.pattern-snapshot').innerText(), initial);
    await go(id, 3); await page.getByRole('combobox', { name: 'Изменяемая причина' }).selectOption('1'); assert.match(await page.locator('.pattern-intervention').innerText(), /испорченный/);
    await go(id, 5); await page.locator('[data-field="transfer-answer"]').fill(lesson.transfer.answer); await page.getByRole('combobox', { name: 'Обоснование' }).selectOption(String(lesson.transfer.correct)); await button('Проверить рассуждение').click(); assert.equal(await page.locator('.dot.solved').count(), 2);
    await go(id, 4); await run(lesson.task.starter); assert(await page.locator('.python-case.wrong').count() > 0, `${id}: starter must not solve the task`);
    if (id === 'prefix-sums') {
      await page.locator('.python-editor').fill(lesson.task.solution);
      await page.getByText('Свой пример', { exact: true }).click();
      await page.locator('.python-custom').fill('[[2, -1, 5], [[0, 2]]]');
      await button('▶ Запустить свой пример').click();
      await page.waitForFunction(() => !document.querySelector('.python-workbench')?.hasAttribute('aria-busy'), null, { timeout: 60000 });
      assert.match(await page.locator('.python-results').innerText(), /\[6\]/);
      assert.equal(await page.locator('.dot.solved').count(), 2, 'custom example alone does not solve the exercise');
    }
    await run(lesson.task.solution); assert.equal(await page.locator('.python-case.right').count(), lesson.task.cases.length, `${id}: actual CPython checks`);
    assert.equal(await page.locator('.dot.solved').count(), 3); await page.reload(); await page.waitForSelector('.python-editor'); assert.equal(await page.locator('.python-editor').inputValue(), lesson.task.solution); assert.equal(await page.locator('.dot.solved').count(), 3);
    console.log(`${id}: prediction, reversible trace, intervention, transfer, Python execution and saved progress passed.`);
  }
  await go('binary-search', 4); await page.waitForSelector('.python-editor'); await run(BINARY_TASK.solution); assert.equal(await page.locator('.python-case.right').count(), BINARY_TASK.cases.length);
  // Failure paths are real Python, not a JS simulation of Python.
  await run('def lower_bound(nums, target):\n    return 1 / 0'); assert.match(await page.locator('.python-results').innerText(), /ZeroDivisionError/);
  await run('def lower_bound(nums, target)\n    return 0'); assert.match(await page.locator('.python-output').innerText(), /SyntaxError/);
  await run('def lower_bound(nums, target):\n    while True:\n        pass'); assert.match(await page.locator('.python-output').innerText(), /Превышено время/);
  await run(BINARY_TASK.solution); assert.equal(await page.locator('.python-case.right').count(), BINARY_TASK.cases.length, 'runner recovers after timeout');
  await run(BINARY_TASK.solution + '\nprint("hello from Python")'); assert.match(await page.locator('.python-output').innerText(), /hello from Python/);
  await page.locator('.python-editor').fill('while True:\n    pass'); await button('▶ Запустить проверки').click(); await button('■ Остановить').click(); assert(await button('▶ Запустить проверки').isEnabled());
  await button('▶ Запустить проверки').click(); await page.goto(`${base}/#topics/algorithms`); await page.waitForSelector('.subject'); assert.equal(await page.locator('link[href$="/css/algorithms.css"]').count(), 0);
  const offline = await browser.newPage();
  await offline.addInitScript(() => localStorage.setItem('mathlab-lang', 'en'));
  await offline.route('https://cdn.jsdelivr.net/pyodide/**', route => route.abort());
  await offline.goto(`${base}/#topic/prefix-sums/4`); await offline.waitForSelector('.python-editor');
  await offline.getByRole('button', { name: /Run checks/ }).click();
  await offline.waitForFunction(() => !document.querySelector('.python-workbench')?.hasAttribute('aria-busy'), null, { timeout: 60000 });
  assert(await offline.getByRole('button', { name: /Run checks/ }).isEnabled(), 'failed download allows retry'); await offline.close();
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', locale: 'en' });
  await phone.addInitScript(() => localStorage.setItem('mathlab-lang', 'en')); phone.on('pageerror', e => errors.push(e.message));
  for (const id of Object.keys(LESSONS)) for (const step of [1, 2, 3, 4, 5]) {
    await phone.goto(`${base}/#topic/${id}/${step}`); await phone.waitForSelector('.pattern-lesson');
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${id}/${step}: no horizontal overflow`);
    assert.equal(await phone.locator('.site-nav [data-nav="topics"].active').count(), 1);
  }
  if (process.env.ALGORITHM_SCREENSHOT) {
    await page.goto(`${base}/#topic/prefix-sums/2`); await page.waitForSelector('.pattern-snapshot'); await page.evaluate(() => document.getAnimations().forEach(a => a.finish())); await page.screenshot({ path: process.env.ALGORITHM_SCREENSHOT, fullPage: true });
    await phone.goto(`${base}/#topic/hash-two-sum/4`); await phone.waitForSelector('.python-editor'); await phone.screenshot({ path: process.env.ALGORITHM_SCREENSHOT.replace('.png', '-mobile.png'), fullPage: true });
  }
  assert.deepEqual(errors, []); console.log('Actual WASM Python, syntax/runtime errors, timeouts, recovery, stop, navigation cleanup, all mobile/EN steps passed.');
});
