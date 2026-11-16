import assert from 'node:assert/strict';
import { algorithmBrowser } from './algorithm-browser-support.mjs';
import { STRUCTURES } from '../js/topics/algorithms/structure-lessons.js';

// What a student would click to reach every sandbox goal. Each item: an op button, an [arg, value] to type first, or a node to tap.
const ru = o => typeof o === 'string' ? o : o.ru;
const PLAN = {
  'array': [...Array(5).fill('append'), ['i', '0'], 'read', 'insert0', ...Array(12).fill('append')],
  'hash-table': [['key', 'кот'], 'put', ['key', 'ток'], 'put', ['key', 'лес'], 'get', ['key', 'кот'], ['value', '9'], 'put', ['key', 'мир'], 'put', ['key', 'дом'], 'put', ['key', 'сон'], 'put'],
  'stack-queue': ['push', 'push', 'pop', 'enqueue', 'enqueue', 'dequeue', 'pop', 'pop', { check: 'list' }, 'enqueue', 'dequeue'],
  'tree': [{ node: 'G' }, 'pre', 'post', 'level', 'add-left'],
  'graphs': [{ node: '0' }, { node: '5' }, { node: '0' }, { node: '5' }, { check: 'directed' }],
  'heap': [['x', '5'], 'push', ['x', '3'], 'push', ['x', '8'], 'push', ['x', '1'], 'push', 'peek', 'pop', 'pop', 'pop', 'pop', 'pop'],
};
await algorithmBrowser(async (browser, base) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('mathlab-lang', 'ru'));
  const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
  const go = async (id, step) => { await page.goto(`${base}/#topic/${id}/${step}`); await page.waitForSelector('.structure-lesson h2'); };
  const idle = () => page.waitForFunction(() => !document.querySelector('.sandbox[aria-busy]'), null, { timeout: 20000 });
  const solvedDots = () => page.locator('.dot.solved').count();
  for (const [id, lesson] of Object.entries(STRUCTURES)) {
    const step = kind => lesson.steps.findIndex(s => s.kind === kind) + 1;
    // Microscope: the whole script plays without errors and ends disabled.
    await go(id, step('guided')); const next = page.locator('.structure-lesson .algorithm-actions .btn').first();
    for (const _ of lesson.steps[step('guided') - 1].script) { await next.click(); await page.waitForTimeout(60); await idle(); }
    assert.equal(await next.isDisabled(), true, `${id}: script finished`);
    // Sandbox: every goal is reachable by ordinary clicks.
    await go(id, step('sandbox'));
    for (const a of PLAN[id]) {
      if (typeof a === 'string') await page.locator(`.sandbox [data-op="${a}"]`).click();
      else if (Array.isArray(a)) await page.locator(`.sandbox [data-arg="${a[0]}"]`).fill(a[1]);
      else if (a.node) await page.locator(`.sandbox [data-node="${a.node}"]`).click();
      else if (a.check) await page.locator(`.sandbox [data-arg="${a.check}"]`).check();
      await page.waitForTimeout(40); await idle();
    }
    const goals = lesson.steps[step('sandbox') - 1].goals.length;
    assert.equal(await page.locator('.structure-goals li.done').count(), goals, `${id}: all sandbox goals`);
    assert.equal(await solvedDots(), 1);
    // Quiz: a wrong answer explains and does not solve; all right answers solve.
    await go(id, step('quiz')); const quiz = lesson.steps[step('quiz') - 1].items, boxes = page.locator('.structure-q');
    await boxes.nth(0).getByRole('button', { name: ru(quiz[0].options[(quiz[0].correct + 1) % quiz[0].options.length]), exact: true }).click();
    assert.equal(await solvedDots(), 1);
    for (let j = 0; j < quiz.length; j++) await boxes.nth(j).getByRole('button', { name: ru(quiz[j].options[quiz[j].correct]), exact: true }).click();
    assert.equal(await solvedDots(), 2, `${id}: quiz solved`);
    // Python: the starter fails, the reference solution passes in real CPython.
    await go(id, step('python')); const task = lesson.steps[step('python') - 1].task;
    const run = async code => { await page.locator('.python-editor').fill(code); await page.getByRole('button', { name: '▶ Запустить проверки', exact: true }).click(); await page.waitForFunction(() => !document.querySelector('.python-workbench')?.hasAttribute('aria-busy'), null, { timeout: 60000 }); };
    await run(task.starter); assert(await page.locator('.python-case.wrong').count() > 0, `${id}: starter must not pass`);
    await run(task.solution); assert.equal(await page.locator('.python-case.right').count(), task.cases.length, `${id}: solution passes`);
    assert.equal(await solvedDots(), 3);
    for (let s = 1; s <= lesson.steps.length; s++) { await go(id, s); }
    console.log(`${id}: microscope, sandbox goals, quiz, real Python and all ${lesson.steps.length} steps passed.`);
  }
  // Phone: no horizontal overflow on any step; the Algorithms page shows square stations for structures.
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  for (const id of Object.keys(STRUCTURES)) for (let s = 1; s <= 10; s++) {
    await phone.goto(`${base}/#topic/${id}/${s}`); await phone.waitForSelector('.structure-lesson h2');
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${id}/${s}: overflow`);
  }
  await page.goto(`${base}/#algorithms`); await page.waitForSelector('.metro');
  assert.equal(await page.locator('.metro-station.structure').count(), Object.keys(STRUCTURES).length);
  assert.deepEqual(errors, []);
  console.log('Structures: phone layout and Algorithms page passed.');
});
