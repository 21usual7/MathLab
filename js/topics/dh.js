// A shared secret in public: the Diffie–Hellman key exchange. Powers of g on a clock of a prime p jump around in
// a scrambled order: computing g^x mod p is easy, finding x back (the discrete logarithm) is hopeless for a big p.
// Alice sends A = g^a, Bob sends B = g^b; each raises what he got to his own secret: B^a = A^b = g^(ab).
// Eve hears g, p, A, B — and still cannot get g^(ab).

import { COLORS } from '../core/palette.js';
import { t } from '../core/i18n.js';
import { clock, chords, powmod, at, R } from './mod.js';

const P = 23, G = 5;
const WINDOW = { cx: 0, cy: 0, unit: 82, grid: false, fit: [8.4, 8.4] };
const SCATTER = { cx: 11, cy: 11, unit: 25, grid: true, fit: [25, 25] };
const I = v => Math.round(v);
const pw = x => powmod(G, x, P);
const lit = ks => Object.fromEntries(ks.map(([k, c]) => [k, c]));

export default {
  view: '2d',
  view2d: WINDOW,
  lab: false,

  setup(scene) {
    scene.ensureParam('x', 3, { min: 0, max: 22, step: 1 });
    scene.ensureParam('a', 6, { min: 1, max: 21, step: 1 }); // Alice's secret
    scene.ensureParam('b', 15, { min: 1, max: 21, step: 1 }); // Bob's secret
    scene.ensureParam('A', 0, { min: 0, max: 22, step: 1 }); // the student's answers
    scene.ensureParam('S', 0, { min: 0, max: 22, step: 1 });

    scene.custom.push(
      {
        // g^0, g^1, …, g^x: x jumps along the powers of 5
        id: 'forward',
        draw2d(p, sc, s) {
          const x = I(s.x), seq = Array.from({ length: x + 1 }, (_, i) => pw(i));
          clock(p, 'forward', P, { marks: lit([...seq.map(k => [k, COLORS.purple]), [pw(x), COLORS.yellow]]) });
          chords(p, seq, P, COLORS.purple);
        },
        legend: s => `${G}^{${I(s.x)}} \\bmod ${P} = \\yellow{${pw(I(s.x))}}`,
      },
      {
        // The points (x, 5^x mod 23): no pattern to follow back
        id: 'scatter',
        draw2d(p) {
          const pts = Array.from({ length: P - 1 }, (_, x) => [x, pw(x)]);
          p.polyline(pts, COLORS.purple + '55', 1.5);
          pts.forEach(([x, y]) => p.dot(x, y, COLORS.yellow, 4.5));
        },
        legend: () => `y = ${G}^x \\bmod ${P}`,
      },
      {
        // The exchange: Alice's A, Bob's B and the shared S on the clock
        id: 'exchange',
        draw2d(p, sc, s) {
          const a = I(s.a), b = I(s.b), A = pw(a), B = pw(b), S = powmod(B, a, P);
          clock(p, 'exchange', P, { marks: lit([[A, COLORS.red], [B, COLORS.blue], [S, COLORS.yellow]]) });
          [[A, 'A', COLORS.red], [B, 'B', COLORS.blue], [S, 'S', COLORS.yellow]].forEach(([k, name, c]) => p.text(name, ...at(k, P, R - 0.45), c, { size: 17, weight: 600 }));
        },
        legend: s => {
          const a = I(s.a), b = I(s.b);
          return `\\red{A} = ${G}^{${a}} \\bmod ${P} = \\red{${pw(a)}},\\quad \\blue{B} = ${G}^{${b}} \\bmod ${P} = \\blue{${pw(b)}}`;
        },
      },
      {
        id: 'exchangeS',
        legend: s => {
          const a = I(s.a), b = I(s.b);
          return `\\blue{B}^{${a}} = \\red{A}^{${b}} = ${G}^{${a} \\cdot ${b}} \\equiv \\yellow{${powmod(pw(b), a, P)}}`;
        },
      },
      {
        // What Eve can make of A and B: A·B = g^(a+b), not g^(ab)
        id: 'eve',
        draw2d(p, sc, s) {
          const a = I(s.a), b = I(s.b), A = pw(a), B = pw(b), S = powmod(B, a, P), E = (A * B) % P;
          clock(p, 'eve', P, { marks: lit([[A, COLORS.red], [B, COLORS.blue], [E, COLORS.grey], [S, COLORS.yellow]]) });
        },
        legend: s => {
          const a = I(s.a), b = I(s.b);
          return `\\red{A} \\cdot \\blue{B} = ${G}^{${a} + ${b}} \\equiv ${(pw(a) * pw(b)) % P} \\ne \\yellow{${powmod(pw(b), a, P)}}`;
        },
      },
      // ---- Tasks ----
      {
        id: 'taskA',
        draw2d(p, sc, s) { clock(p, 'taskA', P, { marks: lit([[I(s.A), COLORS.red]]) }); },
        legend: s => `${G}^3 \\bmod ${P} = \\ ?\\qquad \\red{A} = ${I(s.A)}`,
      },
      {
        id: 'taskS',
        draw2d(p, sc, s) { clock(p, 'taskS', P, { marks: lit([[10, COLORS.red], [2, COLORS.blue], [I(s.S), COLORS.yellow]]) }); },
        legend: s => `a = 3,\\ \\red{A} = 10,\\ \\blue{B} = 2\\qquad \\yellow{S} = ${I(s.S)}`,
      },
      {
        id: 'taskLog',
        draw2d(p, sc, s) {
          const x = I(s.x);
          clock(p, 'taskLog', P, { marks: lit([[19, COLORS.red], [pw(x), COLORS.yellow]]) });
        },
        legend: s => `${G}^{${I(s.x)}} \\bmod ${P} = \\yellow{${pw(I(s.x))}}\\qquad ${t({ en: '\\text{goal}', ru: '\\text{цель}' })}: \\red{19}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'Easy forward', ru: 'Вперёд — легко' },
      text: {
        en: 'Alice and Bob want a common secret key, but every word between them is heard by Eve. The trick needs a one-way road: easy to walk, hard to walk back. Here it is: on a clock of the prime $p = 23$, take powers of $g = 5$. To compute $5^x \\bmod 23$ just multiply by $5$ $x$ times, keeping remainders — $x$ jumps along the purple path. Even for numbers with hundreds of digits it is fast: squaring again and again reaches $x$ in a few hundred steps.',
        ru: 'Алиса и Боб хотят общий секретный ключ, но каждое их слово слышит Ева. Нужна дорога в одну сторону: идти легко, вернуться трудно. Вот она: на часах из простого числа $p = 23$ берём степени $g = 5$. Чтобы найти $5^x \\bmod 23$, достаточно $x$ раз умножить на $5$, оставляя остатки, — $x$ прыжков по фиолетовому пути. Даже для чисел из сотен цифр это быстро: возводя в квадрат снова и снова, до $x$ доходят за несколько сотен шагов.',
      },
      try: { en: 'Move $x$ and follow the jumps.', ru: 'Двигайте $x$ и следите за прыжками.' },
      check: {
        q: { en: '$5^2 \\bmod 23 = ?$', ru: '$5^2 \\bmod 23 = ?$' },
        options: [{ text: '$2$', ok: true }, { text: '$10$' }, { text: '$25$' }],
        explain: {
          en: '$25 = 23 + 2$. On the clock of $23$ there is no $25$: it is $2$.',
          ru: '$25 = 23 + 2$. На часах из $23$ числа $25$ нет: это $2$.',
        },
        reveal: scene => scene.animateParams({ x: 2 }, 800),
      },
      state: { show: ['forward'], params: { x: 3 }, window: WINDOW, controls: ['x'] },
    },
    {
      title: { en: 'Hard back', ru: 'Назад — трудно' },
      text: {
        en: 'Now the other way: given $5^x \\bmod 23 = 19$, find $x$. Here are all the points $(x;\\ 5^x \\bmod 23)$: they jump up and down with no pattern. Without the remainder $5^x$ grows smoothly, and $x$ is found by a logarithm. With the remainder there is nothing better known than to try $x$ one by one. This is the <i>discrete logarithm</i>. For $p$ with $600$ digits the tries would take longer than the age of the Universe.',
        ru: 'Теперь обратно: известно $5^x \\bmod 23 = 19$, найдите $x$. Вот все точки $(x;\\ 5^x \\bmod 23)$: они скачут вверх-вниз без всякого порядка. Без остатка $5^x$ растёт плавно, и $x$ находится логарифмом. С остатком ничего лучше перебора $x$ по очереди не известно. Это <i>дискретный логарифм</i>. Для $p$ из $600$ цифр перебор занял бы больше, чем возраст Вселенной.',
      },
      check: {
        q: { en: 'Why does the remainder make going back hard?', ru: 'Почему остаток делает обратный путь трудным?' },
        options: [
          { text: { en: 'close $x$ give unrelated values: no direction to search in', ru: 'близкие $x$ дают несвязанные значения: непонятно, куда искать' }, ok: true },
          { text: { en: 'the numbers are too big to compute', ru: 'числа слишком большие, чтобы считать' } },
          { text: { en: 'the logarithm of a remainder does not exist', ru: 'логарифма от остатка не бывает' } },
        ],
        explain: {
          en: 'Computing is easy — forward goes fast. But a smooth curve tells you «too high, go left»; scattered points tell you nothing, so you can only try.',
          ru: 'Считать легко — вперёд идёт быстро. Но плавная кривая подсказывает «слишком высоко, левее», а разбросанные точки не подсказывают ничего — остаётся только перебор.',
        },
      },
      state: { show: ['scatter'], window: SCATTER, controls: [] },
    },
    {
      title: { en: 'The exchange', ru: 'Обмен' },
      text: {
        en: 'Everybody knows $p = 23$ and $g = 5$. Alice picks a secret $a$ and sends $\\red{A} = 5^a$; Bob picks $b$ and sends $\\blue{B} = 5^b$ (all modulo $23$). Then Alice raises Bob\'s number to her secret, $\\blue{B}^a = 5^{ba}$, and Bob raises Alice\'s to his, $\\red{A}^b = 5^{ab}$. It is the same number <span class="c-yellow">$S$</span> — their common secret key.',
        ru: 'Все знают $p = 23$ и $g = 5$. Алиса выбирает секрет $a$ и отправляет $\\red{A} = 5^a$; Боб выбирает $b$ и отправляет $\\blue{B} = 5^b$ (всё по модулю $23$). Потом Алиса возводит число Боба в свой секрет: $\\blue{B}^a = 5^{ba}$, а Боб число Алисы — в свой: $\\red{A}^b = 5^{ab}$. Это одно и то же число <span class="c-yellow">$S$</span> — их общий секретный ключ.',
      },
      try: { en: 'Change $a$ and $b$: the two ways to $S$ always agree.', ru: 'Меняйте $a$ и $b$: оба пути к $S$ всегда сходятся.' },
      check: {
        q: { en: 'What does Eve hear?', ru: 'Что слышит Ева?' },
        options: [
          { text: { en: '$p$, $g$, $A$ and $B$', ru: '$p$, $g$, $A$ и $B$' }, ok: true },
          { text: { en: '$a$ and $b$', ru: '$a$ и $b$' } },
          { text: '$S$' },
        ],
        explain: {
          en: '$a$ and $b$ never leave Alice and Bob, $S$ is computed by each at home. Only $p$, $g$, $A$, $B$ travel.',
          ru: '$a$ и $b$ не покидают Алису и Боба, $S$ каждый вычисляет у себя. По сети идут только $p$, $g$, $A$, $B$.',
        },
      },
      state: { show: ['exchange', 'exchangeS'], params: { a: 6, b: 15 }, window: WINDOW, controls: ['a', 'b'] },
    },
    {
      title: { en: 'What Eve can do', ru: 'Что может Ева' },
      text: {
        en: 'Eve has $\\red{A}$ and $\\blue{B}$. Multiplying them gives $5^{a + b}$ — a <b>sum</b> of the secrets in the exponent, but she needs the <b>product</b> $5^{ab}$. To get it, she has to find $a$ from $A$ (or $b$ from $B$) — exactly the discrete logarithm. On a clock of $23$ she tries $22$ values and wins; on a real clock with $600$ digits she has no chance.',
        ru: 'У Евы есть $\\red{A}$ и $\\blue{B}$. Перемножив их, она получит $5^{a + b}$ — <b>сумму</b> секретов в показателе, а нужно <b>произведение</b> $5^{ab}$. Чтобы его получить, ей придётся найти $a$ по $A$ (или $b$ по $B$) — тот самый дискретный логарифм. На часах из $23$ она переберёт $22$ значения и победит; на настоящих часах из $600$ цифр — шансов нет.',
      },
      check: {
        q: { en: 'Why are real $p$ so huge?', ru: 'Зачем настоящие $p$ такие огромные?' },
        options: [
          { text: { en: 'so that trying all exponents is impossible', ru: 'чтобы перебрать все показатели было невозможно' }, ok: true },
          { text: { en: 'so that $A$ and $B$ do not coincide', ru: 'чтобы $A$ и $B$ не совпали' } },
          { text: { en: 'to make computing faster', ru: 'чтобы быстрее считать' } },
        ],
        explain: {
          en: 'Security is the number of tries Eve would need. With $p \\approx 2^{2048}$ there are as many exponents — the tries never end.',
          ru: 'Надёжность — это число попыток, которое понадобится Еве. При $p \\approx 2^{2048}$ показателей столько же — перебор не закончится никогда.',
        },
      },
      state: { show: ['eve'], params: { a: 6, b: 15 }, window: WINDOW, controls: ['a', 'b'] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'Play Alice and Bob with small secrets and check $S$ by hand. Then think: what if Eve does not just listen, but answers Alice in Bob\'s name and Bob in Alice\'s? The exchange itself cannot notice — that is why the internet also needs signatures. And the same idea with points of a curve instead of powers gives the elliptic-curve exchange used in most of today\'s connections.',
        ru: 'Сыграйте за Алису и Боба с маленькими секретами и проверьте $S$ вручную. И подумайте: а если Ева не только слушает, но и отвечает Алисе от имени Боба, а Бобу — от имени Алисы? Сам обмен этого не заметит — поэтому интернету нужны ещё и подписи. А та же идея с точками кривой вместо степеней даёт обмен на эллиптических кривых, которым защищено большинство сегодняшних соединений.',
      },
      state: { show: ['exchange', 'exchangeS'], params: { a: 4, b: 9 }, window: WINDOW, controls: ['a', 'b'] },
    },
    {
      title: { en: 'Compute A', ru: 'Посчитайте A' },
      text: {
        en: 'Alice\'s secret is $a = 3$. What does she send? Set $A = 5^3 \\bmod 23$.',
        ru: 'Секрет Алисы — $a = 3$. Что она отправит? Поставьте $A = 5^3 \\bmod 23$.',
      },
      task: {
        kind: 'drag',
        target: { A: 10 },
        back: 0,
        right: {
          en: '$5^3 = 125 = 5 \\cdot 23 + 10$. Or step by step: $5,\\ 25 \\equiv 2,\\ 2 \\cdot 5 = 10$.',
          ru: '$5^3 = 125 = 5 \\cdot 23 + 10$. Или по шагам: $5,\\ 25 \\equiv 2,\\ 2 \\cdot 5 = 10$.',
        },
        mistakes: [
          { params: { A: 15 }, text: { en: 'This is $5 \\cdot 3$. A power multiplies $5$ by itself: $5 \\cdot 5 \\cdot 5$.', ru: 'Это $5 \\cdot 3$. Степень — это $5$, умноженное само на себя: $5 \\cdot 5 \\cdot 5$.' } },
        ],
        hints: {
          A: { en: 'Multiply by $5$ three times, taking the remainder after each step: $5$, then $25 \\equiv 2$, then…', ru: 'Умножьте на $5$ три раза, беря остаток после каждого шага: $5$, потом $25 \\equiv 2$, потом…' },
        },
      },
      state: { show: ['taskA'], params: { A: 0 }, window: WINDOW, controls: ['A'] },
    },
    {
      title: { en: 'The shared key', ru: 'Общий ключ' },
      text: {
        en: 'Alice ($a = 3$, $A = 10$) got $B = 2$ from Bob. Compute their common key $S$.',
        ru: 'Алиса ($a = 3$, $A = 10$) получила от Боба $B = 2$. Посчитайте их общий ключ $S$.',
      },
      task: {
        kind: 'drag',
        target: { S: 8 },
        back: 2,
        right: {
          en: '$S = B^a = 2^3 = 8$. Bob gets the same: his $b = 2$ (since $5^2 \\equiv 2$), and $A^b = 10^2 = 100 = 4 \\cdot 23 + 8$.',
          ru: '$S = B^a = 2^3 = 8$. Боб получит то же: его $b = 2$ (ведь $5^2 \\equiv 2$), и $A^b = 10^2 = 100 = 4 \\cdot 23 + 8$.',
        },
        mistakes: [
          { params: { S: 20 }, text: { en: 'This is $A \\cdot B = 5^{a + b}$ — that Eve can compute too. Alice raises $B$ to her own secret: $B^a$.', ru: 'Это $A \\cdot B = 5^{a + b}$ — его может посчитать и Ева. Алиса возводит $B$ в свой секрет: $B^a$.' } },
          { params: { S: 6 }, text: { en: 'This is $B \\cdot a$. $B$ is raised to the power $a$: $B^a$.', ru: 'Это $B \\cdot a$. $B$ нужно возвести в степень $a$: $B^a$.' } },
        ],
        hints: {
          S: { en: 'Alice knows her $a$ and Bob\'s $B$: the key is $B^a \\bmod 23$.', ru: 'Алиса знает свой $a$ и число Боба $B$: ключ — это $B^a \\bmod 23$.' },
        },
      },
      state: { show: ['taskS'], params: { S: 0 }, window: WINDOW, controls: ['S'] },
    },
    {
      title: { en: 'Be Eve', ru: 'Побудьте Евой' },
      text: {
        en: 'Eve heard $A = 19$. Find Alice\'s secret $x$ with $5^x \\equiv 19 \\pmod{23}$ — there is no other way than to try.',
        ru: 'Ева услышала $A = 19$. Найдите секрет Алисы $x$, при котором $5^x \\equiv 19 \\pmod{23}$, — других способов, кроме перебора, нет.',
      },
      task: {
        kind: 'drag',
        target: { x: 15 },
        back: 1,
        right: {
          en: '$5^{15} \\equiv 19$. It took up to $22$ tries — and the yellow mark jumped with no pattern. With $600$-digit numbers this is where Eve gives up.',
          ru: '$5^{15} \\equiv 19$. Понадобилось до $22$ попыток — и жёлтая отметка прыгала без всякого порядка. С числами из $600$ цифр здесь Ева и сдаётся.',
        },
        hints: {
          x: x => ({ en: `$5^{${I(x)}} \\equiv ${pw(I(x))}$, not $19$. Keep trying.`, ru: `$5^{${I(x)}} \\equiv ${pw(I(x))}$, а не $19$. Пробуйте дальше.` }),
        },
      },
      state: { show: ['taskLog'], params: { x: 1 }, window: WINDOW, controls: ['x'] },
    },
  ],
};
