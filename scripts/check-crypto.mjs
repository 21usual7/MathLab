// Browser acceptance checks. Run: npm run test:crypto:browser
// Install Chromium with `npx playwright install chromium`, or set CHROMIUM_PATH.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { exchange } from '../js/worlds/crypto/math.js';
import { CRYPTO_WORLDS, loadCryptoWorld } from '../js/worlds/crypto/catalog.js';

const root = new URL('../', import.meta.url);
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = new URL(`.${pathname === '/' ? '/index.html' : pathname}`, root);
    if (!file.href.startsWith(root.href)) { res.writeHead(403).end(); return; }
    const data = await readFile(fileURLToPath(file));
    const ext = file.pathname.split('.').pop();
    res.setHeader('Content-Type', ({ js: 'text/javascript', css: 'text/css', html: 'text/html', svg: 'image/svg+xml' })[ext] || 'application/octet-stream');
    res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: process.env.CRYPTO_MOBILE ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, hasTouch: !!process.env.CRYPTO_MOBILE });
  await context.addInitScript(() => localStorage.setItem('mathlab-lang', 'ru'));
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const base = `http://127.0.0.1:${server.address().port}`;
  const go = async (world, mode = 0, story = false) => {
    const target=`${base}/#world/${world}/${mode}`;
    if(page.url()===target)await page.reload();else await page.goto(target);
    if(world==='crypto-xor'&&mode===0) { await page.waitForSelector('.xor-film-root'); if(story)return; await page.getByRole('button',{name:/^(Открыть лабораторию|Open laboratory) ↗$/}).click(); }
    await page.waitForSelector('.crypto-experiment');
    assert.equal(await page.locator('.crypto-lab').count(), 1);
  };
  const mode = async i => { await page.locator(`.mode-tab[data-m="${i}"]`).click(); assert.equal(await page.locator('.stage-host').evaluate(el => el.scrollTop), 0); };
  const solved = () => page.waitForSelector('.world-status.right');
  const button = text => page.getByRole('button', { name: text, exact: true });

  await go('crypto-xor',0,true);
  assert(await page.locator('.xor-film-cover').isVisible());
  await page.getByRole('button',{name:'▶ Смотреть историю',exact:true}).click();
  await page.waitForTimeout(150);await page.locator('.xor-film-nav > button').first().click();
  const filmTime=await page.locator('.xor-film-root').getAttribute('data-time');await page.waitForTimeout(100);
  assert.equal(await page.locator('.xor-film-root').getAttribute('data-time'),filmTime,'the story must actually pause');
  await page.getByRole('combobox',{name:'Сцена истории'}).selectOption('1');
  await page.getByRole('button',{name:'⌕ Под микроскопом',exact:true}).click();
  const result=+(await page.locator('.xor-film-lens').getAttribute('data-result'));
  await page.locator('.xor-film-lens [data-row="0"][data-bit="0"]').click();
  assert.equal(+(await page.locator('.xor-film-lens').getAttribute('data-result')),result^1);
  await page.getByRole('button',{name:'Вернуться к истории',exact:true}).click();
  await page.getByRole('combobox',{name:'Сцена истории'}).selectOption('1');
  await page.locator('.xor-film-nav > button').first().click();await page.waitForTimeout(100);
  await page.getByRole('button',{name:'⌕ Под микроскопом',exact:true}).click();
  const lensTime=+(await page.locator('.xor-film-root').getAttribute('data-time'));
  await page.waitForTimeout(120);assert.equal(+(await page.locator('.xor-film-root').getAttribute('data-time')),lensTime);
  await page.keyboard.press('Escape');assert(await page.locator('.xor-film-lens').isHidden());
  await page.waitForTimeout(120);assert(+(await page.locator('.xor-film-root').getAttribute('data-time'))>lensTime);
  await page.getByRole('combobox',{name:'Сцена истории'}).selectOption('5');
  const heldCipher=await page.locator('.xor-film-root').getAttribute('data-cipher');
  await page.getByRole('button',{name:'⌕ Под микроскопом',exact:true}).click();
  const inferred=+(await page.locator('.xor-film-lens').getAttribute('data-result'));
  await page.locator('.xor-film-lens [data-row="1"][data-bit="0"]').click();
  assert.equal(+(await page.locator('.xor-film-lens').getAttribute('data-result')),inferred^1);
  assert.equal(await page.locator('.xor-film-root').getAttribute('data-cipher'),heldCipher,'an assumption must not rewrite the intercept');
  assert(await page.locator('.xor-film-lens [data-row="0"][data-bit="0"]').isDisabled());
  await page.getByRole('button',{name:'Вернуться к истории',exact:true}).click();
  await page.getByRole('combobox',{name:'Сцена истории'}).selectOption('6');
  const recovered=await page.locator('.xor-film-root').getAttribute('data-recovered'),opened=await page.locator('.xor-film-root').getAttribute('data-opened');
  await page.getByRole('checkbox',{name:'Повторить маску во втором сообщении'}).uncheck();
  assert.equal(await page.locator('.xor-film-root').getAttribute('data-recovered'),recovered);
  assert.notEqual(await page.locator('.xor-film-root').getAttribute('data-opened'),opened);
  await page.getByRole('combobox',{name:'Сцена истории'}).selectOption('7');
  await page.getByRole('button',{name:'Известно позиций: 2',exact:true}).click();
  assert.equal(await page.locator('.xor-film-root').getAttribute('data-known'),'2');
  await page.getByRole('button',{name:'Открыть лабораторию ↗',exact:true}).click();
  assert.equal(await page.locator('.xor-film-root').count(),0);

  await go('crypto-xor');
  assert.equal(await page.locator('.crypto-cast').isVisible(),false,'XOR should show its own algorithm scene');
  const initialXor=+(await page.locator('.xor-process').getAttribute('data-result'));
  await page.getByRole('button',{name:/^M₁, бит 7:/}).click();
  assert.equal(+(await page.locator('.xor-process').getAttribute('data-result')),initialXor^128);
  await page.locator('.crypto-transport input').evaluate(input=>{input.value='100';input.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(parseInt((await page.locator('.xor-result-bit').allTextContents()).join(''),2),initialXor^128);
  await button('Сложить перехваты: что останется?').click();
  assert.match(await page.locator('.crypto-cancel-demo + button + output').textContent(), /сократилась/);
  await page.locator('.crypto-inspect summary').click();
  await page.locator('.crypto-byte-row').first().locator('.crypto-byte').nth(2).click();
  assert.match(await page.locator('.crypto-bits h3').innerText(), /Байт 3/);
  await go('crypto-xor', 1);
  assert.equal(await page.locator('.crypto-plaintext').count(), 0, 'Eve must not see the private letters or pad');
  await page.locator('[data-field=crib]').fill('MEET');
  assert.equal(await page.locator('.crypto-decoded').innerText(), 'SEND');
  await page.locator('[data-field=answer]').fill('NOPE'); await button('Проверить').click();
  assert.equal(await page.locator('.world-status.right').count(), 0);
  await page.locator('[data-field=answer]').fill('SEND'); await button('Проверить').click(); await solved();
  await mode(2); await page.getByRole('checkbox').check();
  await page.locator('.crypto-experiment select').selectOption('K₁ ⊕ K₂'); await button('Проверить исправление').click(); await solved();
  await mode(3); assert(await page.locator('.proof-nav').isVisible());
  await page.locator('[data-slide="1"]').click(); assert.match(await page.locator('.mode-info h2').innerText(), /Переставим/);

  await go('crypto-tamper', 1);
  await button('Перевернуть бит 3').click(); await button('Доставить изменённое').click(); await solved();
  assert.match(await page.locator('.crypto-receipt').innerText(), /PAY BOB 900/);
  await mode(2); await page.getByRole('checkbox').check();
  await button('Доставить исходное').click(); await page.waitForSelector('.crypto-receipt.accepted');
  await button('Перевернуть бит 3').click(); await button('Доставить изменённое').click(); await solved();
  assert.match(await page.locator('.crypto-receipt').innerText(), /Расшифровки нет/);

  await go('crypto-mitm', 1); await page.getByRole('checkbox').nth(0).check();
  const keys = exchange({ attack: true });
  await page.locator('[data-field=alice-key]').fill(String(keys.eveAlice));
  await page.locator('[data-field=bob-key]').fill(String(keys.eveBob));
  await button('Проверить ключи').click(); await solved();
  await mode(2); await page.getByRole('checkbox').nth(1).check(); await button('Провести обмен').click();
  await page.getByRole('checkbox').nth(0).check(); await button('Провести обмен').click(); await solved();

  await go('crypto-signatures', 1);
  await page.locator('[data-field=k]').fill('5'); await page.locator('[data-field=d]').fill('11');
  await button('Проверить восстановление').click(); await button('Подписать документ z₃ = 17').click(); await solved();
  await mode(2); await page.getByRole('checkbox').uncheck(); await page.locator('.crypto-experiment select').selectOption('unknowns');
  await button('Проверить').click(); await solved();

  await go('crypto-passwords', 1);
  for (let i = 0; i < 3; i++) await page.locator('.crypto-password').nth(i).click();
  await button('Проверить выбранные догадки').click(); await solved();
  await mode(2); await page.getByRole('checkbox').nth(0).uncheck();
  await page.locator('[data-field=cost]').focus();
  for (let i = 1; i < 20; i++) await page.locator('[data-field=cost]').press('ArrowRight');
  await page.getByRole('checkbox').nth(1).check();
  await page.waitForFunction(() => document.querySelector('.crypto-hash-records').textContent.includes('записи разные'));
  await page.locator('.crypto-experiment select').selectOption('cost'); await button('Проверить защиту').click(); await solved();

  await go('crypto-channel', 1);
  for (let i = 0; i < 4; i++) await page.getByRole('checkbox').nth(i).check();
  const suite = async () => { await button('Проверить все пять атак').click(); await page.waitForFunction(() => document.querySelectorAll('.crypto-trial').length === 5); };
  await suite(); await solved(); assert.equal(await page.locator('.crypto-trial.safe').count(), 5);
  await mode(2); for (let i = 0; i < 4; i++) await page.getByRole('checkbox').nth(i).check();
  await suite();
  for (let i = 0; i < 4; i++) {
    await page.getByRole('checkbox').nth(i).uncheck(); await suite();
    assert(await page.locator('.crypto-trial.broken').count() > 0);
    if (i !== 3) await page.getByRole('checkbox').nth(i).check();
  }
  await solved();
  await go('crypto-hashes');
  const hashA=await page.locator('.hash-digest code').first().textContent();
  await page.locator('[data-field=hash-message]').fill('abc');
  assert.equal(await page.locator('.hash-digest code').first().textContent(),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  await page.locator('.crypto-transport input').evaluate(input=>{input.value='100';input.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.locator('.hash-round-process').getAttribute('data-round'),'65');
  assert(+(await page.locator('.hash-round-process').getAttribute('data-differences'))>0);
  await mode(1); await button('+16 карточек').click(); await button('+16 карточек').click();
  await page.locator('.crypto-transport input').evaluate(input=>{input.value='100';input.dispatchEvent(new Event('input',{bubbles:true}));});
  assert(await page.locator('.hash-bucket.collided').count()>0);
  await page.locator('.crypto-experiment select').nth(1).selectOption('prefix');await button('Проверить вывод').click();await solved();
  await mode(2);await button('Выполнить проверку').click();await page.waitForFunction(()=>document.querySelector('.crypto-receipt').textContent.includes('принял'));
  await page.getByRole('combobox',{name:'Источник проверки'}).selectOption('trusted');
  await button('Выполнить проверку').click();await page.waitForFunction(()=>document.querySelector('.crypto-receipt').textContent.includes('отверг'));
  await page.getByRole('combobox',{name:'Почему первый вариант принял подмену?'}).selectOption('recomputed');await button('Проверить вывод').click();await solved();
  await mode(3);for(const role of ['table','checksum','crypto','mac','password'])await page.locator(`[data-role="${role}"]`).selectOption(role);
  await button('Проверить подбор').click();await solved();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('mathlab-worlds')));
  for (const w of CRYPTO_WORLDS) { const expected=(await loadCryptoWorld(w.id)).modes.filter(m=>m.goal).length; assert.equal(stored[w.id].length, expected, `challenges must be saved for ${w.id}`); }
  await go('crypto-xor'); assert.equal(await page.locator('.mode-tab.solved').count(), 2);
  assert.equal(await page.locator('.proof-nav').isVisible(), false);
  await page.getByRole('button', { name: 'EN', exact: true }).click(); await page.waitForSelector('.xor-film-root'); await page.getByRole('button',{name:'Open laboratory ↗',exact:true}).click(); await page.waitForSelector('.crypto-experiment');
  assert.match(await page.locator('.crypto-work-head').innerText(), /Lift the reused mask/);
  await page.goto(`${base}/#worlds/crypto`); await page.waitForSelector('.world-cards');
  assert.equal(await page.locator('.world-card').count(), CRYPTO_WORLDS.length);

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const phone = await mobile.newPage(); phone.on('pageerror', e => errors.push(e.message));
  for (const w of CRYPTO_WORLDS) {
    await phone.goto(`${base}/#world/${w.id}`);
    if(w.id==='crypto-xor') {
      await phone.waitForSelector('.xor-film-root');
      await phone.getByRole('button',{name:'▶ Смотреть историю',exact:true}).tap();
      assert.equal(await phone.locator('.xor-film-cover').isVisible(),false);
      await phone.getByRole('combobox',{name:'Сцена истории'}).selectOption('1');
      await phone.getByRole('button',{name:'⌕ Под микроскопом',exact:true}).tap();
      await phone.locator('.xor-film-lens [data-row="0"][data-bit="0"]').tap();
      await phone.getByRole('button',{name:'Вернуться к истории',exact:true}).tap();
      await phone.getByRole('button',{name:'Открыть лабораторию ↗',exact:true}).tap();
    }
    await phone.waitForSelector('.crypto-experiment');
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${w.id}: viewport overflow`);
    assert(await phone.locator('.crypto-cast:not([hidden]), .xor-process, .hash-round-process, .exchange-process').first().isVisible());
    await phone.locator('.crypto-play').tap();
    assert.equal(await phone.locator('.crypto-transport input').inputValue(), '100', 'reduced motion must deliver without animation');
    await phone.locator('.crypto-rewind').tap(); assert.equal(await phone.locator('.crypto-transport input').inputValue(), '0');
  }
  // Finite playback really pauses, and navigation removes the active scene.
  await go('crypto-xor'); await page.locator('.crypto-play').click(); await page.waitForTimeout(120);
  await page.locator('.crypto-play').click(); const progress = await page.locator('.crypto-transport input').inputValue();
  await page.waitForTimeout(120); assert.equal(await page.locator('.crypto-transport input').inputValue(), progress);
  await page.goto(`${base}/#topics`); await page.waitForSelector('.catalog'); assert.equal(await page.locator('.crypto-lab').count(), 0);
  assert.deepEqual(errors, []);
  console.log('Crypto browser checks passed: XOR story/microscope with pause, causal interventions and resume; all 15 challenges, algorithm scenes, proofs, saved progress, EN/RU, catalog, seven mobile layouts, reduced motion, pause and cleanup.');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
