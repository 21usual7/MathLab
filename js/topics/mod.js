// Remainders: arithmetic on a clock face. Numbers that differ by n land on the same mark, so adding is walking
// around the circle, multiplying is jumping, and the jumps of a reach every mark exactly when a and n have no
// common divisor — then a can be divided by. Powers go around the circle too and come back to 1: the ground
// for the public-key topics.

import { COLORS, THEME } from '../core/palette.js';
import { t } from '../core/i18n.js';

export const R = 3;
const WINDOW = { cx: 0, cy: 0, unit: 82, grid: false, fit: [8.4, 8.4] };
const LIT = 'rgba(255,255,255,0.38)';

export const mod = (a, n) => ((a % n) + n) % n;
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
// a^k mod n without overflow (k ≥ 0)
export function powmod(a, k, n) {
  let r = 1 % n, b = mod(a, n);
  for (; k > 0; k = Math.floor(k / 2)) {
    if (k % 2) r = (r * b) % n;
    b = (b * b) % n;
  }
  return r;
}

// Mark k of n on a circle of radius r: 0 at the top, clockwise like a clock
export const at = (k, n, r = R) => [r * Math.sin(2 * Math.PI * k / n), r * Math.cos(2 * Math.PI * k / n)];

// The clock of remainders 0 … n − 1: a circle with numbered marks; marks listed in `marks` (k → color) are lit
export function clock(p, key, n, { marks = {}, labels = n <= 40 } = {}) {
  p.polyline(Array.from({ length: 145 }, (_, i) => at(i, 144)), 'rgba(255,255,255,0.16)', 1.5);
  for (let k = 0; k < n; k++) {
    const c = marks[k];
    p.dot(...at(k, n), c || LIT, c ? 7 : 3.5);
    if (labels) p.tex(`${key}:n${k}`, String(k), ...at(k, n, R + 0.45), c || THEME.label, { dx: 0, dy: 0, align: 'center' });
  }
}

// s steps forward from k: a spiral just inside the circle, a little further in with every lap
export function walk(p, k, s, n, color) {
  if (s < 0.01) return;
  const N = Math.max(12, Math.round(s * 8)), pts = [];
  for (let i = 0; i <= N; i++) {
    const q = s * i / N;
    pts.push(at(k + q, n, R - 0.28 - 0.2 * q / n));
  }
  p.polyline(pts.slice(0, -1), color, 2.5);
  p.arrow(...pts[N - 2], ...pts[N], color, { width: 2.5 });
}

// Chords k₀ → k₁ → k₂ … between marks (jumps of a, powers of a)
export function chords(p, seq, n, color, width = 2) {
  for (let i = 0; i + 1 < seq.length; i++) {
    if (seq[i] === seq[i + 1]) continue;
    p.arrow(...at(seq[i], n, R - 0.12), ...at(seq[i + 1], n, R - 0.12), color, { width });
  }
}

// 0, a, 2a, … until it comes back to 0; powers 1, a, a², … until they repeat
export const multiples = (a, n) => { const s = [0]; for (let k = mod(a, n); k !== 0 && s.length <= n; k = mod(k + a, n)) s.push(k); return [...s, 0]; };
export const powers = (a, n) => { const s = [1 % n]; for (let k = mod(a, n); !s.includes(k) && s.length <= n; k = (k * a) % n) s.push(k); return [...s, (s[s.length - 1] * a) % n]; };

const I = v => Math.round(v);
const lit = ks => Object.fromEntries(ks.map(([k, c]) => [k, c]));

export default {
  view: '2d',
  view2d: WINDOW,
  lab: false,

  setup(scene) {
    scene.ensureParam('n', 12, { min: 2, max: 24, step: 1 });
    scene.ensureParam('a', 9, { min: 0, max: 23, step: 1 });
    scene.ensureParam('b', 5, { min: 0, max: 100, step: 1 });
    scene.ensureParam('x', 0, { min: 0, max: 11, step: 1 }); // the student's answer

    scene.custom.push(
      {
        // a + b: b steps forward from a
        id: 'add',
        draw2d(p, sc, s) {
          const n = I(s.n), a = mod(I(s.a), n), b = I(s.b);
          clock(p, 'add', n, { marks: lit([[a, COLORS.blue], [mod(a + b, n), COLORS.yellow]]) });
          walk(p, a, b, n, COLORS.yellow);
        },
        legend: s => {
          const n = I(s.n), a = mod(I(s.a), n), b = I(s.b), q = Math.floor((a + b) / n);
          return `\\blue{${a}} + ${b} = ${a + b}${q ? ` = ${q > 1 ? `${q} \\cdot ` : ''}${n} + ${mod(a + b, n)}` : ''} \\;\\Rightarrow\\; ${a} + ${b} \\equiv \\yellow{${mod(a + b, n)}} \\pmod{${n}}`;
        },
      },
      {
        // Jumps of a: 0, a, 2a, … around the clock
        id: 'jumps',
        draw2d(p, sc, s) {
          const n = I(s.n), a = mod(I(s.a), n), seq = multiples(a, n);
          clock(p, 'jumps', n, { marks: lit(seq.map(k => [k, COLORS.green])) });
          chords(p, seq, n, COLORS.green);
        },
        legend: s => {
          const n = I(s.n), a = mod(I(s.a), n), seq = multiples(a, n).slice(0, -1);
          return `${a} \\cdot k \\bmod ${n}:\\ \\green{${seq.join(',\\ ')}}`;
        },
      },
      {
        id: 'jumpsInfo',
        legend: s => {
          const n = I(s.n), a = mod(I(s.a), n), m = multiples(a, n).length - 1;
          const [all, only] = t({ en: ['all marks', 'only'], ru: ['все отметки', 'только'] });
          return `${m === n ? `\\text{${all}}` : `\\text{${only} ${m}}`},\\quad \\gcd(${a}, ${n}) = ${gcd(a, n)}`;
        },
      },
      {
        // a·1, a·2, … until 1: the number of jumps is the inverse of a
        id: 'inverse',
        draw2d(p, sc, s) {
          const n = I(s.n), a = mod(I(s.a), n), seq = multiples(a, n), k = seq.indexOf(1);
          clock(p, 'inverse', n, { marks: lit([[1, COLORS.yellow], ...seq.slice(1, k > 0 ? k : undefined).map(j => [j, COLORS.green])]) });
          chords(p, k > 0 ? seq.slice(0, k + 1) : seq, n, COLORS.green);
        },
        legend: s => {
          const n = I(s.n), a = mod(I(s.a), n), k = multiples(a, n).indexOf(1);
          return k > 0
            ? `${a} \\cdot \\yellow{${k}} = ${a * k} \\equiv 1 \\pmod{${n}} \\;\\Rightarrow\\; ${a}^{-1} \\equiv \\yellow{${k}}`
            : `${a} \\cdot k \\not\\equiv 1 \\pmod{${n}}:\\ ${t({ en: '\\text{no inverse}', ru: '\\text{обратного нет}' })}`;
        },
      },
      {
        // Powers of a: 1, a, a², … until they repeat
        id: 'powers',
        draw2d(p, sc, s) {
          const n = I(s.n), a = mod(I(s.a), n), seq = powers(a, n);
          clock(p, 'powers', n, { marks: lit([...seq.map(k => [k, COLORS.purple]), [1, COLORS.yellow]]) });
          chords(p, seq, n, COLORS.purple);
        },
        legend: s => {
          const n = I(s.n), a = mod(I(s.a), n), seq = powers(a, n).slice(0, -1);
          return `${a}^0, ${a}^1, ${a}^2, \\ldots \\bmod ${n}:\\ \\purple{${seq.join(',\\ ')}},\\ \\yellow{${powmod(a, seq.length, n)}}, \\ldots`;
        },
      },
      // ---- Tasks ----
      {
        id: 'solveAdd',
        draw2d(p, sc, s) {
          const x = I(s.x);
          clock(p, 'solveAdd', 12, { marks: lit([[5, COLORS.blue], [2, COLORS.grey], [mod(5 + x, 12), COLORS.yellow]]) });
          walk(p, 5, x, 12, COLORS.yellow);
        },
        legend: s => `\\blue{5} + \\yellow{x} \\equiv 2 \\pmod{12}\\qquad x = ${I(s.x)}:\\ 5 + ${I(s.x)} \\equiv ${mod(5 + I(s.x), 12)}`,
      },
      {
        id: 'solveInv',
        draw2d(p, sc, s) {
          const x = I(s.x), seq = Array.from({ length: x + 1 }, (_, j) => mod(3 * j, 11));
          clock(p, 'solveInv', 11, { marks: lit([[1, COLORS.grey], ...seq.slice(1).map(k => [k, COLORS.green]), [seq[x], COLORS.yellow]]) });
          chords(p, seq, 11, COLORS.green);
        },
        legend: s => `3 \\cdot \\yellow{x} \\equiv 1 \\pmod{11}\\qquad 3 \\cdot ${I(s.x)} = ${3 * I(s.x)} \\equiv ${mod(3 * I(s.x), 11)}`,
      },
      {
        id: 'allA',
        draw2d(p, sc, s) {
          const a = mod(I(s.a), 10), seq = multiples(a, 10);
          clock(p, 'allA', 10, { marks: lit(seq.map(k => [k, COLORS.green])) });
          chords(p, seq, 10, COLORS.green);
        },
        legend: s => `a = ${I(s.a)}:\\ \\green{${multiples(mod(I(s.a), 10), 10).slice(0, -1).join(',\\ ')}}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'A clock counts in a circle', ru: 'Часы считают по кругу' },
      text: {
        en: 'It is $9$ o\'clock. In $5$ hours it will be $14$ — but the clock shows <span class="c-yellow">$2$</span>: after $12$ it starts again from $0$. A clock keeps only the <i>remainder</i> of division by $12$: $14 = 12 + 2$. Mathematicians write $14 \\equiv 2 \\pmod{12}$ — «$14$ and $2$ are the same modulo $12$». Here begins all of modern cryptography.',
        ru: 'Сейчас $9$ часов. Через $5$ часов будет $14$ — но часы покажут <span class="c-yellow">$2$</span>: после $12$ они начинают снова с $0$. Часы хранят только <i>остаток</i> от деления на $12$: $14 = 12 + 2$. Математики пишут $14 \\equiv 2 \\pmod{12}$ — «$14$ и $2$ равны по модулю $12$». Отсюда начинается вся современная криптография.',
      },
      try: { en: 'Move $b$ past $12$ and further: the yellow spiral goes round again, and only the remainder is left.', ru: 'Двигайте $b$ за $12$ и дальше: жёлтая спираль идёт на новый круг, а остаётся только остаток.' },
      check: {
        q: { en: 'It is $10$ o\'clock. What will the clock show in $100$ hours?', ru: 'Сейчас $10$ часов. Что покажут часы через $100$ часов?' },
        options: [{ text: '$2$', ok: true }, { text: '$10$' }, { text: '$8$' }],
        explain: {
          en: '$100 = 8 \\cdot 12 + 4$: eight full circles change nothing, and $4$ hours are left. $10 + 4 = 14 \\equiv 2$.',
          ru: '$100 = 8 \\cdot 12 + 4$: восемь полных кругов ничего не меняют, остаются $4$ часа. $10 + 4 = 14 \\equiv 2$.',
        },
        reveal: scene => scene.animateParams({ a: 10, b: 100 }, 1800),
      },
      state: { show: ['add'], params: { n: 12, a: 9, b: 5 }, window: WINDOW, controls: ['b'] },
    },
    {
      title: { en: 'Any clock', ru: 'Любые часы' },
      text: {
        en: 'A clock can have any number of marks $n$ — the <i>modulus</i>. Then every whole number lands on one of the marks $0, 1, \\ldots, n - 1$: on its remainder after division by $n$. Numbers that differ by $n$ land on the same mark. Addition works as before: walk forward and see where you stop.',
        ru: 'У часов может быть любое число отметок $n$ — <i>модуль</i>. Тогда каждое целое число попадает на одну из отметок $0, 1, \\ldots, n - 1$ — на свой остаток от деления на $n$. Числа, отличающиеся на $n$, попадают на одну отметку. Сложение работает как раньше: шагаем вперёд и смотрим, где остановились.',
      },
      try: { en: 'Change $n$, $a$ and $b$. Try $n = 2$: even and odd.', ru: 'Меняйте $n$, $a$ и $b$. Попробуйте $n = 2$: чётные и нечётные.' },
      check: {
        q: { en: '$17 \\bmod 5 = ?$', ru: '$17 \\bmod 5 = ?$' },
        options: [{ text: '$2$', ok: true }, { text: '$3$' }, { text: '$3.4$' }],
        explain: {
          en: '$17 = 3 \\cdot 5 + 2$: three full circles of five marks and $2$ more. A remainder is always a whole number from $0$ to $n - 1$.',
          ru: '$17 = 3 \\cdot 5 + 2$: три полных круга по пять отметок и ещё $2$. Остаток — всегда целое число от $0$ до $n - 1$.',
        },
        reveal: scene => scene.animateParams({ n: 5, a: 0, b: 17 }, 1500),
      },
      state: { show: ['add'], params: { n: 7, a: 4, b: 6 }, window: WINDOW, controls: ['n', 'a', 'b'] },
    },
    {
      title: { en: 'Multiplying is jumping', ru: 'Умножение — прыжки' },
      text: {
        en: 'Multiples of $a$ — $0, a, 2a, 3a, \\ldots$ — are jumps of $a$ marks around the clock. On a clock of $12$, jumps of $5$ visit <b>every</b> mark and draw a star. Jumps of $4$ visit only $0$, $4$, $8$ — a triangle — and come back. The difference: $4$ and $12$ share the divisor $4$, while $5$ and $12$ share nothing but $1$. The jumps reach every mark exactly when $\\gcd(a, n) = 1$.',
        ru: 'Кратные $a$ — $0, a, 2a, 3a, \\ldots$ — это прыжки на $a$ отметок по кругу. На часах из $12$ прыжки по $5$ обходят <b>все</b> отметки и рисуют звезду. Прыжки по $4$ попадают только в $0$, $4$, $8$ — треугольник — и возвращаются. Разница: у $4$ и $12$ общий делитель $4$, а у $5$ и $12$ — только $1$. Прыжки обходят все отметки ровно тогда, когда $\\gcd(a, n) = 1$.',
      },
      try: { en: 'Move $a$ from $1$ to $11$ and watch which stars close early.', ru: 'Двигайте $a$ от $1$ до $11$ и смотрите, какие звёзды замыкаются раньше.' },
      check: {
        q: { en: 'On a clock of $12$, how many marks do jumps of $9$ visit?', ru: 'Сколько отметок часов из $12$ обойдут прыжки по $9$?' },
        options: [{ text: '$4$', ok: true }, { text: '$12$' }, { text: '$3$' }],
        explain: {
          en: '$\\gcd(9, 12) = 3$, so only multiples of $3$: $0, 9, 6, 3$ — four marks, a square.',
          ru: '$\\gcd(9, 12) = 3$, значит, только кратные $3$: $0, 9, 6, 3$ — четыре отметки, квадрат.',
        },
        reveal: scene => scene.animateParams({ a: 9 }, 800),
      },
      state: { show: ['jumps', 'jumpsInfo'], params: { n: 12, a: 5 }, window: WINDOW, controls: ['a', 'n'] },
    },
    {
      title: { en: 'Division: the inverse', ru: 'Деление: обратный элемент' },
      text: {
        en: 'On a clock there are no fractions, but division still exists. On a clock of $7$, jump by $3$ until you land on <span class="c-yellow">$1$</span>: it takes $5$ jumps, $3 \\cdot 5 = 15 \\equiv 1$. So $5$ plays the role of $\\frac13$: <i>dividing by $3$ is multiplying by $5$</i>. Such an inverse exists exactly when the jumps reach every mark — when $\\gcd(a, n) = 1$. If $n$ is prime, every $a \\ne 0$ has one.',
        ru: 'На часах нет дробей, но деление всё равно есть. На часах из $7$ прыгайте по $3$, пока не попадёте в <span class="c-yellow">$1$</span>: понадобится $5$ прыжков, $3 \\cdot 5 = 15 \\equiv 1$. Значит, $5$ играет роль $\\frac13$: <i>разделить на $3$ — то же, что умножить на $5$</i>. Такой обратный есть ровно тогда, когда прыжки обходят все отметки — когда $\\gcd(a, n) = 1$. Если $n$ простое, обратный есть у любого $a \\ne 0$.',
      },
      try: { en: 'Change $a$ on the clock of $7$, then try $n = 12$ with $a = 4$: no inverse.', ru: 'Меняйте $a$ на часах из $7$, потом попробуйте $n = 12$ и $a = 4$: обратного нет.' },
      check: {
        q: { en: 'What is $2^{-1}$ modulo $7$?', ru: 'Чему равно $2^{-1}$ по модулю $7$?' },
        options: [{ text: '$4$', ok: true }, { text: '$5$' }, { text: '$0.5$' }],
        explain: {
          en: '$2 \\cdot 4 = 8 = 7 + 1 \\equiv 1$. There is no $0.5$ on the clock; $5$ is the answer to $2 + x \\equiv 0$, the opposite, not the inverse.',
          ru: '$2 \\cdot 4 = 8 = 7 + 1 \\equiv 1$. Числа $0.5$ на часах нет; $5$ — ответ на $2 + x \\equiv 0$, это противоположное, а не обратное.',
        },
        reveal: scene => scene.animateParams({ a: 2 }, 800),
      },
      state: { show: ['inverse'], params: { n: 7, a: 3 }, window: WINDOW, controls: ['a', 'n'] },
    },
    {
      title: { en: 'Powers go around too', ru: 'Степени тоже ходят по кругу' },
      text: {
        en: 'Now multiply again and again: $1, a, a^2, a^3, \\ldots$ On a clock of $7$ the powers of $3$ are $1, 3, 2, 6, 4, 5$ and then $3^6 \\equiv 1$ again: they visit every mark except $0$ in a scrambled order. Powers of $2$ come back sooner: $1, 2, 4, 1$. For a prime $p$ always $a^{p-1} \\equiv 1$ (Fermat\'s little theorem). Cryptography is built on this circle: going forward is easy, going back is hard.',
        ru: 'Теперь умножаем снова и снова: $1, a, a^2, a^3, \\ldots$ На часах из $7$ степени тройки — $1, 3, 2, 6, 4, 5$, а потом снова $3^6 \\equiv 1$: они обходят все отметки, кроме $0$, в перепутанном порядке. Степени двойки возвращаются раньше: $1, 2, 4, 1$. Для простого $p$ всегда $a^{p-1} \\equiv 1$ (малая теорема Ферма). На этом круге построена криптография: вперёд идти легко, назад — трудно.',
      },
      try: { en: 'Try $n = 11$ or $n = 13$ and find an $a$ whose powers visit all marks.', ru: 'Попробуйте $n = 11$ или $n = 13$ и найдите $a$, степени которого обходят все отметки.' },
      check: {
        q: { en: '$5^6 \\bmod 7 = ?$', ru: '$5^6 \\bmod 7 = ?$' },
        options: [{ text: '$1$', ok: true }, { text: '$5$' }, { text: '$30$' }],
        explain: {
          en: '$7$ is prime and $5 \\ne 0$, so by Fermat $5^{7-1} \\equiv 1$ — no need to compute $15625$.',
          ru: '$7$ простое и $5 \\ne 0$, значит, по Ферма $5^{7-1} \\equiv 1$ — считать $15625$ не нужно.',
        },
        reveal: scene => scene.animateParams({ a: 5 }, 800),
      },
      state: { show: ['powers'], params: { n: 7, a: 3 }, window: WINDOW, controls: ['a', 'n'] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'On a clock of $12$: what is $7 \\cdot 7$? Does $7$ have an inverse, and which? Which numbers have no inverse at all? Then look at the powers on a clock of $11$: which $a$ visit all ten marks? Such an $a$ is called a <i>generator</i> — the next topics need one.',
        ru: 'На часах из $12$: чему равно $7 \\cdot 7$? Есть ли у $7$ обратный, и какой? У каких чисел обратного нет совсем? Потом посмотрите степени на часах из $11$: какие $a$ обходят все десять отметок? Такое $a$ называют <i>образующим</i> — оно понадобится в следующих темах.',
      },
      state: { show: ['powers'], params: { n: 11, a: 2 }, window: WINDOW, controls: ['a', 'n'] },
    },
    {
      title: { en: 'Solve on the clock', ru: 'Решите на часах' },
      text: {
        en: 'Find $x$ from $0$ to $11$ with $5 + x \\equiv 2 \\pmod{12}$: how many hours after $5$ o\'clock does the clock show $2$?',
        ru: 'Найдите $x$ от $0$ до $11$, при котором $5 + x \\equiv 2 \\pmod{12}$: через сколько часов после $5$ часы покажут $2$?',
      },
      task: {
        kind: 'drag',
        target: { x: 9 },
        back: 0,
        right: {
          en: '$5 + 9 = 14 \\equiv 2$. On the clock there are no negative numbers: $2 - 5 = -3$ is the same as $-3 + 12 = 9$.',
          ru: '$5 + 9 = 14 \\equiv 2$. Отрицательных на часах нет: $2 - 5 = -3$ — то же, что $-3 + 12 = 9$.',
        },
        mistakes: [
          { params: { x: 3 }, text: {
            en: '$5 + 3 = 8$, not $2$. From $5$ to $2$ the clock goes forward through $12$: $2 - 5 = -3$, and $-3$ on the clock is $9$.',
            ru: '$5 + 3 = 8$, а не $2$. От $5$ до $2$ часы идут вперёд через $12$: $2 - 5 = -3$, а $-3$ на часах — это $9$.' } },
        ],
        hints: {
          x: x => ({ en: `$5 + ${I(x)} \\equiv ${mod(5 + I(x), 12)}$. Keep walking until the yellow arrow stops at $2$.`, ru: `$5 + ${I(x)} \\equiv ${mod(5 + I(x), 12)}$. Шагайте дальше, пока жёлтая стрелка не остановится на $2$.` }),
        },
      },
      state: { show: ['solveAdd'], params: { x: 0 }, window: WINDOW, controls: ['x'] },
    },
    {
      title: { en: 'Find the inverse', ru: 'Найдите обратный' },
      text: {
        en: 'Find $x$ with $3x \\equiv 1 \\pmod{11}$ — the inverse of $3$. Each step of $x$ adds one jump of $3$.',
        ru: 'Найдите $x$, при котором $3x \\equiv 1 \\pmod{11}$, — обратный к $3$. Каждый шаг $x$ добавляет один прыжок на $3$.',
      },
      task: {
        kind: 'drag',
        target: { x: 4 },
        back: 3,
        right: {
          en: '$3 \\cdot 4 = 12 = 11 + 1$. So modulo $11$, dividing by $3$ is multiplying by $4$.',
          ru: '$3 \\cdot 4 = 12 = 11 + 1$. Значит, по модулю $11$ разделить на $3$ — то же, что умножить на $4$.',
        },
        mistakes: [
          { params: { x: 8 }, text: {
            en: '$3 + 8 = 11 \\equiv 0$: $8$ is the opposite of $3$, it undoes adding. The inverse undoes <b>multiplying</b>: $3 \\cdot x \\equiv 1$.',
            ru: '$3 + 8 = 11 \\equiv 0$: $8$ — противоположное к $3$, оно отменяет сложение. Обратный отменяет <b>умножение</b>: $3 \\cdot x \\equiv 1$.' } },
        ],
        hints: {
          x: x => ({ en: `$3 \\cdot ${I(x)} \\equiv ${mod(3 * I(x), 11)}$, not $1$.`, ru: `$3 \\cdot ${I(x)} \\equiv ${mod(3 * I(x), 11)}$, а не $1$.` }),
        },
      },
      state: { show: ['solveInv'], params: { x: 0 }, window: WINDOW, controls: ['x'] },
    },
    {
      title: { en: 'A star through every mark', ru: 'Звезда через все отметки' },
      text: {
        en: 'On a clock of $10$, choose a jump $a$ bigger than $1$ whose jumps visit all ten marks.',
        ru: 'На часах из $10$ выберите прыжок $a$ больше $1$, прыжки которого обходят все десять отметок.',
      },
      task: {
        kind: 'drag',
        target: [{ a: 3 }, { a: 7 }, { a: 9 }],
        back: 2,
        right: {
          en: 'Any $a$ with $\\gcd(a, 10) = 1$ works: $3$, $7$ or $9$. They share no divisor with $10 = 2 \\cdot 5$.',
          ru: 'Подходит любое $a$ с $\\gcd(a, 10) = 1$: $3$, $7$ или $9$. У них нет общих делителей с $10 = 2 \\cdot 5$.',
        },
        mistakes: [
          { params: { a: 1 }, text: { en: '$1$ does visit everything, but by walking, not jumping. Take a bigger $a$.', ru: '$1$ обходит всё, но шагами, а не прыжками. Возьмите $a$ побольше.' } },
          { params: { a: 5 }, text: { en: '$5$ is odd, but $5$ itself divides $10$: the jumps go $0, 5, 0$.', ru: '$5$ нечётное, но само делит $10$: прыжки идут $0, 5, 0$.' } },
        ],
        hints: {
          a: a => ({ en: `$\\gcd(${I(a)}, 10) = ${gcd(I(a), 10)}$: the jumps visit only multiples of it.`, ru: `$\\gcd(${I(a)}, 10) = ${gcd(I(a), 10)}$: прыжки попадают только на кратные ему.` }),
        },
      },
      state: { show: ['allA'], params: { a: 2 }, window: WINDOW, controls: ['a'] },
    },
  ],
};
