import { t } from '../../core/i18n.js';
import { PASSWORDS, passwordChance, attemptBudget, passwordDigest, bytes, hex } from './math.js';
import { L, el, action, check, field, line, workshop } from './ui.js';

const modes = [
  { id: 'free', title: L('Пароли — это распределение', 'Passwords form a distribution'),
    text: L('Перед Евой 100 вымышленных аккаунтов и 10 возможных паролей. Числа на карточках задают население целиком. Выберите несколько догадок: важен не только размер множества, но и то, как часто люди выбирают каждый вариант. Переключитесь на равномерный выбор и сравните результат.', 'Eve faces 100 fictional accounts and 10 possible passwords. The card counts define the entire population. Select some guesses: the size of the set matters, but so does how often each option is chosen. Switch to uniform choices and compare the result.') },
  { id: 'budget', title: L('Три попытки', 'Three guesses'),
    text: L('У вас только три разных догадки для заданного вымышленного населения. Подберите их так, чтобы охватить не меньше 66 аккаунтов из 100. Это точная вероятность в показанной модели, не оценка реальных людей.', 'You have only three distinct guesses for this fictional population. Choose them to cover at least 66 of 100 accounts. This is an exact probability in the displayed model, not an estimate for real people.'),
    goal: L('Три догадки, охват не меньше 66%.', 'Three guesses, at least 66% coverage.'),
    after: L('Оптимально начинать с наиболее вероятных вариантов. Размер алфавита сам по себе не даёт энтропию человеческого пароля: нужна модель выбора.', 'The optimal strategy starts with the most probable options. Alphabet size alone does not give the entropy of a human-chosen password: a choice model is needed.') },
  { id: 'defend', title: L('Онлайн и украденная база', 'Online and a stolen database'),
    text: L('При входе через сайт сервер может ограничивать попытки. После кражи базы Ева проверяет догадки у себя: лимит входов уже не действует. Соль делает записи одинаковых паролей разными; дорогая функция повышает стоимость каждой догадки. Исследуйте оба механизма.', 'At a website login the server can limit attempts. After stealing the database, Eve checks guesses locally: login limits no longer apply. A salt makes records of identical passwords different; an expensive function raises the cost of each guess. Explore both mechanisms.'),
    goal: L('Для украденной базы включите разные соли, увеличьте стоимость хотя бы в 20 раз и выберите действующий механизм защиты.', 'For a stolen database, use distinct salts, increase cost at least 20-fold and select the protection that still applies.'),
    after: L('Соль не является секретом и не мешает проверять одну догадку против одного хеша. Она мешает переиспользовать одну готовую таблицу для всех аккаунтов. Стоимость замедляет каждую проверку. Здесь PBKDF2 показан как пример функции с настройкой стоимости, не как рекомендация параметров.', 'Salt is public and does not prevent testing one guess against one hash. It prevents reusing one precomputed table across accounts. The cost slows each check. Here PBKDF2 illustrates a tunable-cost function; its settings are not deployment recommendations.') },
];
export default {
  modes,
  mount(ui) {
    const w = workshop(ui, { next: 'crypto-channel', title: L('Бюджет Евы', 'Eve’s guessing budget'), sources: [['https://pages.nist.gov/800-63-4/sp800-63b.html', 'NIST · Passwords']], note: L('Все пароли и частоты вымышлены. Скорость перебора — условная модель, не замер вашего устройства. Реальные пароли вводить не нужно.', 'All passwords and frequencies are fictional. Guessing speed is a model, not a device benchmark. Do not enter real passwords.') });
    let mode, picks = new Set(), uniform = false, online = true, cost = 1, salted = false, job = 0, alive = true;
    let grid, summary, people, budget, hashes;
    function draw() {
      const chance = passwordChance([...picks], uniform), n = Math.round(chance * 100);
      summary.textContent = t(L(`Догадок: ${picks.size} · охвачено ${n} из 100 (${n}%)`, `Guesses: ${picks.size} · covers ${n} of 100 (${n}%)`));
      grid.replaceChildren();
      for (const p of PASSWORDS) {
        const b = action('', () => {
          if (picks.has(p.word)) picks.delete(p.word);
          else if (mode !== 'budget' || picks.size < 3) picks.add(p.word);
          else return ui.status(t(L('Доступны три догадки. Снимите одну из выбранных.', 'You have three guesses. Remove one of the selected guesses.')), 'fail');
          draw();
        });
        b.className = `crypto-password${picks.has(p.word) ? ' selected' : ''}`;
        b.setAttribute('aria-pressed', String(picks.has(p.word))); b.append(el('code', '', p.word), el('span', '', `${uniform ? 10 : p.count} / 100`)); grid.append(b);
      }
      people.replaceChildren();
      for (let i = 0; i < 100; i++) {
        const figure = el('span', i < n ? 'exposed' : ''); figure.setAttribute('aria-hidden', 'true');
        figure.innerHTML = '<svg viewBox="0 0 16 22"><circle cx="8" cy="5" r="4"/><path d="M1 22V15Q1 10 8 10Q15 10 15 15V22Z"/></svg>'; people.append(figure);
      }
      people.setAttribute('aria-label', t(L(`${n} из 100 аккаунтов охвачены догадками`, `${n} of 100 accounts covered by the guesses`)));
      if (budget) budget.textContent = t(L(`За условную минуту: ${attemptBudget({ cost, online })} проверок. ${online ? 'Сервер ограничивает число попыток до 3.' : 'Лимита входов нет: 60 × 1000 / стоимость.'}`, `In a model minute: ${attemptBudget({ cost, online })} checks. ${online ? 'The server limits attempts to 3.' : 'No login limit: 60 × 1000 / cost.'}`));
    }
    async function hashDemo() {
      const token = ++job; hashes.textContent = t(L('Вычисляются две записи одного вымышленного пароля…', 'Computing two records of the same fictional password…'));
      try {
        const a = bytes('salt-for-alice-01'), b = salted ? bytes('salt-for-bob---02') : a;
        const [x, y] = await Promise.all([passwordDigest('violet', a), passwordDigest('violet', b)]);
        if (!alive || token !== job) return;
        hashes.replaceChildren(el('p', 'crypto-micro', 'PBKDF2 · SHA-256 · 20 000 iterations'), el('code', '', `Alice: ${hex(x.slice(0, 10))}…\nBob:   ${hex(y.slice(0, 10))}…`), el('p', 'crypto-micro', salted ? L('Пароль один, соли разные — записи разные. Соли хранятся рядом с записями.', 'Same password, different salts — different records. Salts are stored alongside the records.') : L('Один пароль и одна соль — одинаковые записи. Сравните с разными солями.', 'Same password and same salt — identical records. Compare with distinct salts.')));
      } catch { if (alive && token === job) hashes.textContent = t(L('Для Web Crypto нужен HTTPS или localhost.', 'Web Crypto requires HTTPS or localhost.')); }
    }
    function build() {
      w.experiment.replaceChildren(); grid = el('div', 'crypto-password-grid'); summary = el('output', 'crypto-receipt'); people = el('div', 'crypto-population'); budget = null;
      w.experiment.append(grid, summary, people);
      if (mode === 'free') {
        const f = check(L('Равномерный случайный выбор из этих 10 вариантов', 'Uniform random choice among these 10 options'), uniform, v => { uniform = v; draw(); }); w.experiment.append(f.el);
      }
      const run = action(L('Проверить выбранные догадки', 'Try selected guesses'), () => {
        w.story({ attack: true, sender: 'eve', sent: 'login', caption: L(`Ева проверила ${picks.size} догадки. В этой модели они подходят к ${Math.round(passwordChance([...picks], uniform) * 100)} аккаунтам из 100.`, `Eve tried ${picks.size} guesses. In this model they match ${Math.round(passwordChance([...picks], uniform) * 100)} of 100 accounts.`) }, true);
        if (mode === 'budget') {
          if (picks.size === 3 && passwordChance([...picks]) >= .66) ui.solve(mode);
          else ui.status(t(L('Потратьте три попытки на самые вероятные варианты. Повтор одной догадки не добавит охвата.', 'Spend the three attempts on the most likely options. Repeating a guess adds no coverage.')), 'fail');
        }
      }, true); w.experiment.append(run);
      if (mode === 'defend' || mode === 'free') {
        budget = el('output', 'crypto-receipt'); hashes = el('div', 'crypto-hash-records');
        const local = check(L('Онлайн: сервер ограничивает попытки', 'Online: the server limits attempts'), online, v => { online = v; draw(); });
        const price = field(L('Стоимость одной проверки (условный множитель)', 'Cost per check (model multiplier)'), { type: 'range', value: cost, min: 1, max: 100, step: 1, name: 'cost', onInput: v => { cost = v; draw(); } });
        const salt = check(L('Разная соль у Алисы и Боба', 'Distinct salts for Alice and Bob'), salted, v => { salted = v; hashDemo(); });
        w.experiment.append(el('h3', '', L('После кражи базы', 'After a database theft')), local.el, price.el, budget, salt.el, hashes); hashDemo();
        if (mode === 'defend') {
          const f = el('select'); f.setAttribute('aria-label', t(L('Что ограничивает офлайн-атаку?', 'What limits the offline attack?')));
          for (const [v, label] of [['', L('Выберите механизм…', 'Choose a mechanism…')], ['cost', L('Стоимость вычисления каждой догадки', 'The computational cost of each guess')], ['login', L('Лимит попыток входа на сайте', 'The website’s login attempt limit')], ['secret', L('Секретность соли', 'Keeping the salt secret')]]) { const o = el('option', '', label); o.value = v; f.append(o); }
          w.experiment.append(f, action(L('Проверить защиту', 'Check defense'), () => {
            if (!online && salted && cost >= 20 && f.value === 'cost') ui.solve(mode);
            else ui.status(t(L('Для украденной базы снимите онлайн-лимит и проверьте, что остаётся: разные соли и дорогая проверка каждой догадки.', 'For a stolen database, remove the online limit and inspect what remains: distinct salts and an expensive check for every guess.')), 'fail');
          }, true));
        }
      }
      draw();
      w.story({ attack: true, alice: L('Учебные аккаунты', 'Fictional accounts'), bob: L('Проверяет вход', 'Checks a login'), caption: L('Ева выбирает, на какие догадки потратить бюджет. Каждый силуэт ниже — один вымышленный аккаунт.', 'Eve chooses how to spend her guessing budget. Each silhouette below is one fictional account.') });
    }
    return { setMode(id) { job++; mode = id; picks = new Set(); uniform = false; online = true; cost = 1; salted = false; build(); }, dispose() { alive = false; job++; w.dispose(); } };
  },
};
