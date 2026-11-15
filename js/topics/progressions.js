// Progressions. The sum 1 + 2 + … + n: two staircases make a rectangle n × (n + 1) (Gauss).
// The sum 1 + q + … + q^(n−1): shift it by one step, qS − S = qⁿ − 1, almost everything cancels.
// For |q| < 1 the infinite sum is 1/(1 − q) — the door to limits, compound interest and e.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';

const r3 = v => fmt(Math.round(v * 1000) / 1000);
const I = v => Math.round(v);
const STAIR = n => ({ cx: n / 2 + 0.5, cy: (n + 1) / 2, unit: 46, fit: [n + 4, n + 4] });
const BARS = { cx: 4.2, cy: 0.9, unit: 60, fit: [10, 5] };

export default {
  view: '2d',
  view2d: STAIR(6),
  lab: false,

  setup(scene) {
    scene.ensureParam('n', 6, { min: 1, max: 12, step: 1 });
    scene.ensureParam('m', 0, { min: 0, max: 1, step: 0.01 }); // the second staircase moving in
    scene.ensureParam('q', 0.6, { min: 0.1, max: 1.6, step: 0.05 });
    scene.ensureParam('k', 6, { min: 1, max: 9, step: 1 }); // how many terms of the geometric sum

    // One unit square of a staircase
    const cell = (p, x, y, color) => { p.fill([[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]], color + '88'); p.polyline([[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1], [x, y]], color, 1.2); };

    scene.custom.push(
      {
        // 1 + 2 + … + n as a staircase; with m the same staircase, turned over, slides on top of it
        id: 'stairs',
        draw2d(p, sc, s) {
          const n = I(s.n), m = s.m;
          for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) cell(p, i, j, COLORS.blue);
          if (m > 0) {
            // the copy: column i has n − i squares, hanging from the height n + 1; it comes from the right
            const dx = (1 - m) * (n + 2);
            for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) cell(p, i + dx, n - j, COLORS.yellow);
          }
          if (m > 0.98) {
            p.polyline([[0, 0], [n, 0], [n, n + 1], [0, n + 1], [0, 0]], '#ffffff', 2.5);
            p.tex('sw', `n = ${n}`, n / 2, 0, '#b9c1cd', { dx: 0, dy: 16, align: 'center' });
            p.tex('sh', `n + 1 = ${n + 1}`, n, (n + 1) / 2, '#b9c1cd', { dx: 12, dy: 0 });
          }
        },
        legend: s => {
          const n = I(s.n), S = n * (n + 1) / 2;
          return s.m > 0.98
            ? `\\blue{S} + \\yellow{S} = ${n} \\cdot ${n + 1} = ${2 * S}\\ \\Rightarrow\\ S = ${S}`
            : `\\blue{1 + 2 + \\ldots + ${n}} = ${S}`;
        },
      },
      {
        // 1, q, q², … as bars; the sum and (for q < 1) where it goes
        id: 'bars',
        draw2d(p, sc, s) {
          const q = s.q, k = I(s.k);
          for (let i = 0; i < k; i++) { const h = q ** i; p.fill([[i * 0.9, 0], [i * 0.9 + 0.7, 0], [i * 0.9 + 0.7, h], [i * 0.9, h]], COLORS.green + '99'); }
        },
        legend: s => {
          const q = s.q, k = I(s.k), S = (q ** k - 1) / (q - 1);
          return `1 + q + q^2 + \\ldots + q^{${k - 1}} = ${r3(Math.abs(q - 1) < 1e-9 ? k : S)}` + (q < 1 ? `\\qquad \\tfrac{1}{1 - q} = ${r3(1 / (1 - q))}` : '');
        },
      },
      {
        // The geometric proof: S and q·S, one under the other, shifted by one place
        id: 'shift',
        draw2d(p, sc, s) {
          const q = s.q, k = I(s.k), H = Math.max(1, q ** (k - 1)), sc2 = 1.6 / H;
          const bar = (i, y0, h, color) => p.fill([[i * 0.9, y0], [i * 0.9 + 0.7, y0], [i * 0.9 + 0.7, y0 + h * sc2], [i * 0.9, y0 + h * sc2]], color);
          for (let i = 0; i < k; i++) bar(i, 2.1, q ** i, i === 0 ? COLORS.red + 'cc' : COLORS.green + '99'); // S
          for (let i = 1; i <= k; i++) bar(i, 0, q ** i, i === k ? COLORS.yellow + 'cc' : COLORS.green + '99'); // qS
          for (let i = 1; i < k; i++) p.line(i * 0.9 + 0.35, 2.05, i * 0.9 + 0.35, 1.7, 'rgba(255,255,255,0.35)', { width: 1, dash: [3, 3] });
          p.tex('lS', 'S', -0.25, 2.5, '#ffffff', { dx: 0, dy: 0, align: 'right' });
          p.tex('lqS', 'qS', -0.25, 0.4, '#ffffff', { dx: 0, dy: 0, align: 'right' });
        },
        legend: s => {
          const k = I(s.k);
          return `q\\,S - S = \\yellow{q^{${k}}} - \\red{1}\\ \\Rightarrow\\ S = \\dfrac{q^{${k}} - 1}{q - 1}`;
        },
      },
      {
        // q = 1/2: halves fill one square — the infinite sum is finite
        id: 'halves',
        draw2d(p) {
          let x = 0, y = 0, w = 4, h = 4, horiz = true;
          const colors = [COLORS.blue, COLORS.green, COLORS.yellow, COLORS.orange, COLORS.purple, COLORS.teal, COLORS.red];
          p.polyline([[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]], '#ffffff', 2);
          for (let i = 0; i < 12; i++) {
            const c = colors[i % colors.length] + '99';
            if (horiz) { p.fill([[x, y], [x + w / 2, y], [x + w / 2, y + h], [x, y + h]], c); x += w / 2; w /= 2; } else { p.fill([[x, y], [x + w, y], [x + w, y + h / 2], [x, y + h / 2]], c); y += h / 2; h /= 2; }
            if (i < 4) p.tex(`h${i}`, `\\tfrac{1}{${2 ** (i + 1)}}`, horiz ? x - w / 2 : x + w / 2, horiz ? y + h / 2 : y - h / 4, '#ffffff', { dx: 0, dy: 0, align: 'center' });
            horiz = !horiz;
          }
        },
        legend: () => `\\tfrac12 + \\tfrac14 + \\tfrac18 + \\ldots = 1`,
      },
      {
        id: 'taskQ',
        draw2d(p, sc, s) { sc.custom.find(c => c.id === 'bars').draw2d(p, sc, { ...s, k: 9 }); },
        legend: s => `1 + q + q^2 + \\ldots = \\tfrac{1}{1 - ${r3(s.q)}} = ${s.q < 1 ? r3(1 / (1 - s.q)) : '\\infty'}\\qquad ${t({ en: '\\text{goal}', ru: '\\text{цель}' })}:\\ 4`,
      },
    );
  },

  steps: [
    {
      title: { en: 'A staircase of numbers', ru: 'Лесенка из чисел' },
      text: {
        en: 'An arithmetic progression grows by the same step: $1, 2, 3, \\ldots$ Its sum $1 + 2 + \\ldots + n$ is a staircase of squares: column $1$, column $2$, … up to $n$. Count the squares for $n = 100$ one by one? A schoolboy Gauss found a way in a minute.',
        ru: 'Арифметическая прогрессия растёт на один и тот же шаг: $1, 2, 3, \\ldots$ Её сумма $1 + 2 + \\ldots + n$ — лесенка из квадратиков: столбик $1$, столбик $2$, … до $n$. Считать квадратики для $n = 100$ по одному? Школьник Гаусс нашёл способ за минуту.',
      },
      check: {
        q: { en: '$1 + 2 + \\ldots + 100 = ?$', ru: '$1 + 2 + \\ldots + 100 = ?$' },
        options: [{ text: '$5050$', ok: true }, { text: '$5000$' }, { text: '$10100$' }],
        explain: {
          en: 'The proof below gives $\\frac{100 \\cdot 101}{2} = 5050$. ($10100$ is the whole rectangle — two staircases.)',
          ru: 'Доказательство ниже даёт $\\frac{100 \\cdot 101}{2} = 5050$. ($10100$ — весь прямоугольник, две лесенки.)',
        },
      },
      state: { show: ['stairs'], params: { n: 6, m: 0 }, window: STAIR(6), controls: ['n'] },
    },
    {
      proof: true,
      statement: {
        en: '<b>The sum of an arithmetic progression.</b> $1 + 2 + \\ldots + n = \\dfrac{n(n + 1)}{2}$; for any progression $a_1 + \\ldots + a_n = \\dfrac{(a_1 + a_n)\\,n}{2}$.',
        ru: '<b>Сумма арифметической прогрессии.</b> $1 + 2 + \\ldots + n = \\dfrac{n(n + 1)}{2}$; для любой прогрессии $a_1 + \\ldots + a_n = \\dfrac{(a_1 + a_n)\\,n}{2}$.',
      },
      title: { en: 'Two staircases make a rectangle', ru: 'Две лесенки — прямоугольник' },
      text: {
        en: 'Take a second copy of the staircase, turn it upside down and put it on top. Under column $i$ of the blue one there are $i$ squares, the yellow one adds $n + 1 - i$: every column has $n + 1$ squares. So both staircases together form a rectangle $n \\times (n + 1)$.',
        ru: 'Возьмём вторую такую же лесенку, перевернём и положим сверху. В столбике $i$ у синей $i$ квадратиков, жёлтая добавляет $n + 1 - i$: в каждом столбике выходит $n + 1$. Значит, две лесенки вместе — прямоугольник $n \\times (n + 1)$.',
      },
      state: { show: ['stairs'], params: { n: 6, m: 1 }, ms: 1800, window: STAIR(6), controls: ['m', 'n'] },
    },
    {
      proof: true,
      title: { en: 'Half of the rectangle', ru: 'Половина прямоугольника' },
      text: {
        en: 'One staircase is half of it: $1 + 2 + \\ldots + n = \\frac{n(n + 1)}{2}$. The same works for any arithmetic progression: written forwards and backwards, every column holds $a_1 + a_n$ (one term grows by the step exactly as much as the other shrinks), so the sum is $\\frac{(a_1 + a_n)\\,n}{2}$. $\\blacksquare$',
        ru: 'Одна лесенка — его половина: $1 + 2 + \\ldots + n = \\frac{n(n + 1)}{2}$. То же для любой арифметической прогрессии: запишем её вперёд и назад — в каждом столбике будет $a_1 + a_n$ (одно слагаемое растёт на шаг ровно настолько, насколько другое уменьшается), поэтому сумма равна $\\frac{(a_1 + a_n)\\,n}{2}$. $\\blacksquare$',
      },
      state: { show: ['stairs'], params: { n: 10, m: 1 }, window: STAIR(10), controls: ['n'] },
    },
    {
      title: { en: 'Multiplying instead of adding', ru: 'Умножать вместо прибавлять' },
      text: {
        en: 'A geometric progression multiplies by the same number $q$: $1, q, q^2, \\ldots$ — like money in a bank or a population. For $q > 1$ the bars grow fast; for $q < 1$ they shrink, and the sum seems to stop growing. Move $q$ and the number of terms.',
        ru: 'Геометрическая прогрессия умножает на одно и то же число $q$: $1, q, q^2, \\ldots$ — как деньги в банке или численность популяции. При $q > 1$ столбики растут быстро; при $q < 1$ уменьшаются, и сумма будто перестаёт расти. Двигайте $q$ и число слагаемых.',
      },
      state: { show: ['bars'], params: { q: 0.6, k: 6 }, window: BARS, controls: ['q', 'k'] },
    },
    {
      proof: true,
      statement: {
        en: '<b>The sum of a geometric progression.</b> For $q \\ne 1$: $1 + q + \\ldots + q^{n-1} = \\dfrac{q^n - 1}{q - 1}$.',
        ru: '<b>Сумма геометрической прогрессии.</b> При $q \\ne 1$: $1 + q + \\ldots + q^{n-1} = \\dfrac{q^n - 1}{q - 1}$.',
      },
      title: { en: 'Shift by one and subtract', ru: 'Сдвинуть на один и вычесть' },
      text: {
        en: 'Multiply the sum $S$ by $q$: every bar becomes the next one, $qS = q + q^2 + \\ldots + q^n$. Put $qS$ under $S$ shifted by one place: the green bars match in pairs. Only two are left without a pair: $1$ in $S$ (red) and $q^n$ in $qS$ (yellow). So $qS - S = q^n - 1$, and dividing by $q - 1$: $S = \\frac{q^n - 1}{q - 1}$. $\\blacksquare$',
        ru: 'Умножим сумму $S$ на $q$: каждый столбик становится следующим, $qS = q + q^2 + \\ldots + q^n$. Поставим $qS$ под $S$ со сдвигом на одно место: зелёные столбики совпадают парами. Без пары остаются только два: $1$ в $S$ (красный) и $q^n$ в $qS$ (жёлтый). Значит, $qS - S = q^n - 1$, и, деля на $q - 1$: $S = \\frac{q^n - 1}{q - 1}$. $\\blacksquare$',
      },
      state: { show: ['shift'], params: { q: 0.7, k: 6 }, window: { cx: 3.2, cy: 1.8, unit: 60, fit: [9, 5.5] }, controls: ['q', 'k'] },
    },
    {
      title: { en: 'An infinite sum can be finite', ru: 'Бесконечная сумма может быть конечной' },
      text: {
        en: 'For $0 < q < 1$ the powers $q^n$ shrink to $0$, so $S = \\frac{q^n - 1}{q - 1} \\to \\frac{1}{1 - q}$. For $q = \\frac12$: $1 + \\frac12 + \\frac14 + \\ldots = 2$ — the halves fill a square and never spill over. Infinitely many terms, a finite sum: this is the first meeting with a <b>limit</b>.',
        ru: 'При $0 < q < 1$ степени $q^n$ уменьшаются к $0$, поэтому $S = \\frac{q^n - 1}{q - 1} \\to \\frac{1}{1 - q}$. При $q = \\frac12$: $1 + \\frac12 + \\frac14 + \\ldots = 2$ — половинки заполняют квадрат и никогда не выливаются за край. Бесконечно много слагаемых — конечная сумма: это первая встреча с <b>пределом</b>.',
      },
      state: { show: ['halves'], window: { cx: 2, cy: 2, unit: 70, fit: [6, 6] }, controls: [] },
    },
    {
      title: { en: 'Where it lives in grades 10–11', ru: 'Где это в 10–11 классе' },
      text: {
        en: 'A deposit growing by $p\\%$ a year is a geometric progression with $q = 1 + \\frac{p}{100}$ — and paying interest more and more often leads to the number <b>$e$</b>. The function $q^x$ is the progression with every $x$ filled in: the <b>exponent</b>, and the logarithm counts its steps. The infinite sum $\\frac{1}{1 - q}$ is the simplest <b>series</b>; Taylor series write $e^x$ and $\\sin x$ the same way. And $\\frac{n(n+1)}{2}$ returns in the <b>integral</b>: the area under $y = x$ is a staircase with infinitely thin steps.',
        ru: 'Вклад, растущий на $p\\%$ в год, — геометрическая прогрессия с $q = 1 + \\frac{p}{100}$, а начисление процентов всё чаще ведёт к числу <b>$e$</b>. Функция $q^x$ — та же прогрессия, заполненная для всех $x$: <b>экспонента</b>, а логарифм считает её шаги. Бесконечная сумма $\\frac{1}{1 - q}$ — простейший <b>ряд</b>; ряды Тейлора так же записывают $e^x$ и $\\sin x$. А $\\frac{n(n+1)}{2}$ вернётся в <b>интеграле</b>: площадь под $y = x$ — лесенка с бесконечно тонкими ступеньками.',
      },
      state: { show: ['bars'], params: { q: 1.2, k: 9 }, window: { cx: 4.2, cy: 2.2, unit: 46, fit: [10, 7] }, controls: ['q', 'k'] },
    },
    {
      title: { en: 'An infinite sum of 4', ru: 'Бесконечная сумма, равная 4' },
      text: {
        en: 'Choose $q$ so that $1 + q + q^2 + \\ldots$ (forever) equals $4$.',
        ru: 'Подберите $q$ так, чтобы $1 + q + q^2 + \\ldots$ (до бесконечности) равнялась $4$.',
      },
      task: {
        kind: 'drag',
        target: { q: 0.75 },
        tol: 0.02,
        back: 5,
        right: {
          en: '$\\frac{1}{1 - q} = 4$ means $1 - q = \\frac14$, $q = \\frac34$: $1 + \\frac34 + \\frac{9}{16} + \\ldots = 4$.',
          ru: '$\\frac{1}{1 - q} = 4$ означает $1 - q = \\frac14$, $q = \\frac34$: $1 + \\frac34 + \\frac{9}{16} + \\ldots = 4$.',
        },
        mistakes: [
          { params: { q: 0.25 }, text: { en: 'With $q = \\frac14$ the sum is $\\frac{1}{1 - 1/4} = \\frac43$. It is $1 - q$ that must be $\\frac14$.', ru: 'При $q = \\frac14$ сумма $\\frac{1}{1 - 1/4} = \\frac43$. Равным $\\frac14$ должно быть $1 - q$.' } },
        ],
        hints: { q: { en: 'Solve $\\frac{1}{1 - q} = 4$.', ru: 'Решите $\\frac{1}{1 - q} = 4$.' } },
      },
      state: { show: ['taskQ'], params: { q: 0.4 }, window: BARS, controls: ['q'] },
    },
  ],
};
