// Overfitting: a model that memorises. Polynomials of growing degree through ten noisy points: too simple
// misses the shape, degree 9 passes through every point and goes wild between them. The proof: through n points
// there is exactly one polynomial of degree n − 1 (Lagrange, and the roots of a difference) — so it fits the
// noise too. New points expose it: the error on them is a U. Other data — other curves (variance);
// a penalty λ or more data calm it down.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';
import { wave, truth, polyFit, meanErr } from './ml-math.js';

const r2 = v => fmt(Math.round(v * 100) / 100);
const r3 = v => fmt(Math.round(v * 1000) / 1000);
const WIN = { cx: 0, cy: 0.2, unit: 92 };
const TEST = wave(103, 30); // new points, never shown to the model while it learns
const train = s => wave(Math.round(s.sd), Math.round(s.n));
const lambda = s => (s.lam <= -7.95 ? 0 : 10 ** s.lam);
const fit = (s, d = Math.round(s.d), pts = train(s)) => polyFit(pts, d, lambda(s));

// The four points of the proof and their Lagrange polynomials: ℓᵢ is 1 at xᵢ and 0 at the other three
const P4 = [[-3, -1], [-1, 1.5], [1, 2], [3, 0]];
const ell = i => x => P4.reduce((m, [xj], j) => (j === i ? m : m * (x - xj) / (P4[i][0] - xj)), 1);
const LCOL = [COLORS.green, COLORS.red, COLORS.purple, COLORS.teal];
const lag = x => P4.reduce((m, [, y], i) => m + y * ell(i)(x), 0);
const bump = x => P4.reduce((m, [xi]) => m * (x - xi), 1) / 10; // zero at all four points

// The errors on the training points and on the new ones, for every degree: a small chart in the corner
function chart(p, s) {
  const ctx = p.ctx, W = Math.min(250, p.w * 0.44), H = W * 0.6, x0 = p.w - W - 12, y0 = 12;
  const pts = train(s), rows = Array.from({ length: 10 }, (_, d) => { const f = fit(s, d, pts); return [meanErr(pts, f), meanErr(TEST, f)]; });
  const X = d => x0 + 26 + (W - 38) * d / 9, Y = e => y0 + 10 + (H - 34) * (1.5 - Math.max(-3, Math.min(1.5, Math.log10(Math.max(e, 1e-3))))) / 4.5;
  ctx.fillStyle = 'rgba(13,17,23,0.88)';
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.rect(x0, y0, W, H); ctx.fill(); ctx.stroke();
  const d = Math.round(s.d);
  ctx.strokeStyle = 'rgba(244,211,94,0.5)';
  ctx.beginPath(); ctx.moveTo(X(d), y0 + 6); ctx.lineTo(X(d), y0 + H - 22); ctx.stroke();
  [[0, COLORS.blue], [1, COLORS.orange]].forEach(([k, c]) => {
    ctx.beginPath();
    rows.forEach((r, i) => (i ? ctx.lineTo(X(i), Y(r[k])) : ctx.moveTo(X(i), Y(r[k]))));
    p.stroke(c, 2);
    rows.forEach((r, i) => { ctx.beginPath(); ctx.arc(X(i), Y(r[k]), i === d ? 4 : 2.2, 0, 2 * Math.PI); ctx.fillStyle = c; ctx.fill(); });
  });
  ctx.font = '500 10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#6f7a8c';
  for (let i = 0; i <= 9; i += 3) ctx.fillText(String(i), X(i), y0 + H - 8);
  if (W > 220) ctx.fillText(t({ en: 'degree', ru: 'степень' }), X(4.5), y0 + H - 8);
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.blue; ctx.fillText(t({ en: 'training', ru: 'учебные' }), x0 + 8, y0 + 14);
  ctx.fillStyle = COLORS.orange; ctx.fillText(t({ en: 'new', ru: 'новые' }), x0 + 8, y0 + 27);
  if (W > 220) { ctx.fillStyle = '#6f7a8c'; ctx.textAlign = 'right'; ctx.fillText(t({ en: 'error, log scale', ru: 'ошибка, лог. шкала' }), x0 + W - 6, y0 + 14); }
}

const trainDots = (p, pts) => pts.forEach(([x, y]) => p.dot(x, y, COLORS.blue, 5.5));
const testRings = p => TEST.forEach(([x, y]) => p.ring(x, y, COLORS.orange, 4));
const errTex = s => { const f = fit(s); return `\\begin{gathered} \\text{${t({ en: 'degree', ru: 'степень' })} } ${Math.round(s.d)} \\\\ \\blue{L_{\\text{${t({ en: 'train', ru: 'учеб' })}}} = ${r3(meanErr(train(s), f))}} \\quad \\orange{L_{\\text{${t({ en: 'new', ru: 'нов' })}}} = ${r3(meanErr(TEST, f))}} \\end{gathered}`; };

export default {
  view: '2d',
  view2d: WIN,
  lab: false,

  setup(scene) {
    scene.ensureParam('d', 1, { min: 0, max: 9, step: 1 }); // the degree
    scene.ensureParam('lam', -8, { min: -8, max: 1, step: 0.1 }); // λ = 10^lam (−8 means none)
    scene.ensureParam('sd', 3, { min: 3, max: 10, step: 1 }); // which ten points we happened to get
    scene.ensureParam('n', 10, { min: 10, max: 40, step: 1 }); // how many training points
    scene.ensureParam('k', 0, { min: -2, max: 2, step: 0.01 }); // the proof: another curve through the four points
    scene.ensureParam('m', 0, { min: 0, max: 1, step: 0.01 }); // the proof: from the four pieces to their sum

    scene.custom.push(
      {
        id: 'fit',
        draw2d(p, sc, s) {
          const pts = train(s), f = fit(s);
          p.curve(f, COLORS.yellow, 3);
          trainDots(p, pts);
        },
        legend: s => `\\begin{gathered} \\text{${t({ en: 'degree', ru: 'степень' })} } ${Math.round(s.d)} \\\\ \\blue{L_{\\text{${t({ en: 'train', ru: 'учеб' })}}} = ${r3(meanErr(train(s), fit(s)))}} \\end{gathered}`,
      },
      {
        // The same with the new points and the chart of both errors
        id: 'exam',
        draw2d(p, sc, s) {
          const pts = train(s), f = fit(s);
          testRings(p);
          p.curve(f, COLORS.yellow, 3);
          trainDots(p, pts);
          chart(p, s);
        },
        legend: errTex,
      },
      {
        // Variance: the curve of the same degree for eight other sets of ten points
        id: 'spread',
        draw2d(p, sc, s) {
          p.curve(truth, 'rgba(255,255,255,0.5)', 2, -Infinity, Infinity, [7, 6]);
          for (let seed = 3; seed <= 10; seed++) p.curve(polyFit(wave(seed, 10), Math.round(s.d), lambda(s)), COLORS.yellow + (seed === Math.round(s.sd) ? 'ff' : '55'), seed === Math.round(s.sd) ? 3 : 1.5);
          trainDots(p, train(s));
        },
        legend: s => `\\text{${t({ en: 'degree', ru: 'степень' })} } ${Math.round(s.d)}, \\quad \\text{${t({ en: '8 data sets', ru: '8 наборов данных' })}}`,
      },
      // ---- The proof ----
      {
        // Existence: yᵢ·ℓᵢ — each piece is right at its own point and zero at the others; their sum passes through all
        id: 'lagrange',
        draw2d(p, sc, s) {
          P4.forEach(([xi, yi], i) => {
            p.curve(x => yi * ell(i)(x), LCOL[i] + (s.m > 0.5 ? '44' : 'cc'), 2);
            p.vline(xi, 'rgba(255,255,255,0.12)', 1, [4, 5]);
          });
          if (s.m > 0) p.curve(x => s.m * lag(x), COLORS.yellow, 3);
          P4.forEach(([x, y], i) => { p.dot(x, y, LCOL[i], 6); });
        },
        legend: () => `\\ell_i(x) = \\prod_{j \\ne i} \\frac{x - x_j}{x_i - x_j}, \\qquad \\yellow{P(x) = \\sum y_i\\, \\ell_i(x)}`,
      },
      {
        // Uniqueness: another curve through the four points differs by something that is zero at all four of them
        id: 'unique',
        draw2d(p, sc, s) {
          p.curve(lag, COLORS.yellow + '66', 2);
          p.curve(x => s.k * bump(x), COLORS.red + 'aa', 2);
          p.curve(x => lag(x) + s.k * bump(x), COLORS.yellow, 3);
          P4.forEach(([x, y], i) => { p.dot(x, y, LCOL[i], 6); p.ring(x, 0, COLORS.red, 4); });
        },
        legend: s => `\\yellow{P(x)} + \\red{${r2(s.k)} \\cdot \\tfrac{(x+3)(x+1)(x-1)(x-3)}{10}}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'Ten points and a curve', ru: 'Десять точек и кривая' },
      text: {
        en: 'Ten measurements of something that changes smoothly, each with a little noise. The model is a polynomial of degree $d$, learned exactly as the line was: the coefficients that make the mean square of the misses smallest. Degree $1$ is the line: it gets the general rise and misses the wave completely. The model is too simple — it <i>underfits</i>.',
        ru: 'Десять измерений чего-то плавно меняющегося, каждое с небольшим шумом. Модель — многочлен степени $d$, обученный ровно так же, как прямая: коэффициенты, при которых средний квадрат промахов наименьший. Степень $1$ — это прямая: она ловит общий подъём и совсем не видит волну. Модель слишком проста — она <i>недообучена</i>.',
      },
      try: { en: 'Move $d$ from $0$ to $4$ and watch the error on the training points.', ru: 'Двигайте $d$ от $0$ до $4$ и следите за ошибкой на учебных точках.' },
      state: { show: ['fit'], params: { d: 1, lam: -8, sd: 3, n: 10 }, window: WIN, controls: ['d'] },
    },
    {
      title: { en: 'Degree 9: through every point', ru: 'Степень 9: через каждую точку' },
      text: {
        en: 'More degree — smaller error on the training points, always: a polynomial of a higher degree can do everything a lower one can, and more. At $d = 9$ the error is exactly $0$: the curve passes through all ten points. Perfect? Look between the points: the curve throws itself up and down to catch every noisy dot.',
        ru: 'Больше степень — меньше ошибка на учебных точках, всегда: многочлен высокой степени умеет всё, что низкой, и ещё больше. При $d = 9$ ошибка ровно $0$: кривая проходит через все десять точек. Идеально? Посмотрите между точками: кривая мечется вверх и вниз, чтобы поймать каждую шумную точку.',
      },
      check: {
        q: { en: 'How many coefficients does a polynomial of degree $9$ have?', ru: 'Сколько коэффициентов у многочлена степени $9$?' },
        options: [{ text: '$9$' }, { text: '$10$', ok: true }, { text: '$11$' }],
        explain: {
          en: '$a_0 + a_1 x + \\ldots + a_9 x^9$ — ten. Ten numbers to fit ten points: enough to hit each of them exactly. Why exactly — the proof follows.',
          ru: '$a_0 + a_1 x + \\ldots + a_9 x^9$ — десять. Десять чисел на десять точек — хватает, чтобы попасть в каждую точно. Почему ровно — доказательство дальше.',
        },
      },
      state: { show: ['fit'], params: { d: 9, lam: -8, sd: 3, n: 10 }, ms: 1500, window: WIN, controls: ['d'] },
    },
    {
      proof: true,
      statement: {
        en: '<b>Theorem.</b> Through $n$ points with different $x$ passes exactly one polynomial of degree at most $n - 1$. We show it for $n = 4$ (degree $3$); for any $n$ it is word for word the same.',
        ru: '<b>Теорема.</b> Через $n$ точек с разными $x$ проходит ровно один многочлен степени не выше $n - 1$. Покажем для $n = 4$ (степень $3$); для любого $n$ — слово в слово так же.',
      },
      title: { en: 'There is one: Lagrange', ru: 'Он есть: Лагранж' },
      text: {
        en: 'For each point build a piece $\\ell_i$ that is $1$ at its own $x_i$ and $0$ at the other three: the product of $(x - x_j)$ over the other points, divided by the same at $x_i$. Each $\\ell_i$ has degree $3$. Multiply each piece by its height $y_i$ and add: at $x_i$ only the $i$-th piece is not zero, and it gives exactly $y_i$. The sum $P$ passes through all four points.',
        ru: 'Для каждой точки построим кусок $\\ell_i$, равный $1$ в своём $x_i$ и $0$ в трёх других: произведение $(x - x_j)$ по другим точкам, делённое на то же самое в $x_i$. Каждый $\\ell_i$ — степени $3$. Умножим каждый кусок на свою высоту $y_i$ и сложим: в $x_i$ не равен нулю только $i$-й кусок, и он даёт ровно $y_i$. Сумма $P$ проходит через все четыре точки.',
      },
      try: { en: 'Move $m$ from $0$ to $1$: from the four coloured pieces to their sum.', ru: 'Двигайте $m$ от $0$ до $1$: от четырёх цветных кусков к их сумме.' },
      state: { show: ['lagrange'], params: { m: 0 }, window: { cx: 0, cy: 0.5, unit: 60 }, controls: ['m'] },
      enter(scene) { scene.setParam('m', 0); scene.animateParams({ m: 1 }, 3000); },
    },
    {
      proof: true,
      title: { en: 'There is only one', ru: 'И он один' },
      text: {
        en: 'Suppose $Q$ of degree at most $3$ passes through the same four points. Then $Q - P$ has degree at most $3$ and is zero at four places (the red rings). A nonzero polynomial of degree $3$ has at most $3$ roots, so $Q - P = 0$: $Q = P$. Any other curve through the points differs from $P$ by something zero at all of them — at least $(x + 3)(x + 1)(x - 1)(x - 3)$, degree $4$. Move $k$: the curve stays pinned to the points and does whatever it likes between them. $\\blacksquare$',
        ru: 'Пусть $Q$ степени не выше $3$ проходит через те же четыре точки. Тогда $Q - P$ — степени не выше $3$ и равен нулю в четырёх местах (красные кольца). У ненулевого многочлена степени $3$ не больше $3$ корней, значит, $Q - P = 0$: $Q = P$. Любая другая кривая через эти точки отличается от $P$ на что-то, равное нулю во всех них, — как минимум на $(x + 3)(x + 1)(x - 1)(x - 3)$, степень $4$. Двигайте $k$: кривая остаётся приколотой к точкам и между ними делает что хочет. $\\blacksquare$',
      },
      try: { en: 'Move $k$. Ten points and degree $9$ is the same: the data pin the curve only at the points.', ru: 'Двигайте $k$. Десять точек и степень $9$ — то же самое: данные прикалывают кривую только в точках.' },
      state: { show: ['unique'], params: { k: 0.6 }, window: { cx: 0, cy: 0.5, unit: 60 }, controls: ['k'] },
    },
    {
      title: { en: 'The exam: new points', ru: 'Экзамен: новые точки' },
      text: {
        en: 'So degree $9$ fits <b>the noise</b> as faithfully as the signal. To catch it, check the model on points it has not seen (orange rings). The chart shows both errors for every degree: the error on the training points (blue) only falls, the error on new points (orange) falls, has a bottom at $d = 4$, and then shoots up. That is <i>overfitting</i>: the model memorised the answers instead of understanding the shape.',
        ru: 'Итак, степень $9$ повторяет <b>шум</b> так же старательно, как сигнал. Чтобы это поймать, проверим модель на точках, которых она не видела (оранжевые кольца). График показывает обе ошибки при каждой степени: на учебных точках (синяя) она только падает, на новых (оранжевая) — падает, достигает дна при $d = 4$ и затем взлетает. Это <i>переобучение</i>: модель зазубрила ответы вместо того, чтобы понять форму.',
      },
      try: { en: 'Move $d$ and watch the yellow mark on the chart.', ru: 'Двигайте $d$ и следите за жёлтой меткой на графике.' },
      state: { show: ['exam'], params: { d: 4, lam: -8, sd: 3, n: 10 }, window: WIN, controls: ['d'] },
    },
    {
      title: { en: 'Other data — another curve', ru: 'Другие данные — другая кривая' },
      text: {
        en: 'Imagine we had got another ten points from the same process. Here are the curves for eight such sets (the dashed one is the truth). At degree $1$ they are almost the same — and all wrong in the same way: <i>bias</i>. At degree $9$ each set gives a wildly different curve: <i>variance</i>, the model follows chance. Good degrees are in between, where both are small.',
        ru: 'Представим, что нам достались другие десять точек того же процесса. Вот кривые для восьми таких наборов (пунктир — правда). При степени $1$ они почти одинаковые — и все ошибаются одинаково: это <i>смещение</i>. При степени $9$ каждый набор даёт совсем другую кривую: это <i>разброс</i>, модель следует случаю. Хорошие степени — посередине, где мало и того и другого.',
      },
      try: { en: 'Move $d$ from $1$ to $9$. Change $sd$ — which set is highlighted.', ru: 'Двигайте $d$ от $1$ до $9$. Меняйте $sd$ — какой набор выделен.' },
      state: { show: ['spread'], params: { d: 9, lam: -8, sd: 3, n: 10 }, window: WIN, controls: ['d', 'sd'] },
    },
    {
      title: { en: 'A penalty for big coefficients', ru: 'Штраф за большие коэффициенты' },
      text: {
        en: 'To fly between the points a polynomial needs huge coefficients. Let us charge for them: minimise $L + \\lambda \\sum a_k^2$. The model keeps degree $9$ but now prefers calm curves. Too small $\\lambda$ — still wild, too big — flat and wrong; in between the error on new points is even lower than at the best degree. The same trick stopped the endless confidence in classification.',
        ru: 'Чтобы метаться между точками, многочлену нужны огромные коэффициенты. Возьмём за них плату: будем минимизировать $L + \\lambda \\sum a_k^2$. Модель остаётся степени $9$, но теперь предпочитает спокойные кривые. Слишком маленькая $\\lambda$ — всё ещё бешеная, слишком большая — плоская и неверная; посередине ошибка на новых точках даже ниже, чем при лучшей степени. Тот же приём останавливал бесконечную уверенность в классификации.',
      },
      try: { en: 'Move $\\log_{10} \\lambda$ from $-8$ to $1$.', ru: 'Двигайте $\\log_{10} \\lambda$ от $-8$ до $1$.' },
      state: { show: ['exam'], params: { d: 9, lam: -8, sd: 3, n: 10 }, window: WIN, controls: ['lam'] },
      enter(scene) { scene.setParam('lam', -8); scene.animateParams({ lam: -3 }, 4000); },
    },
    {
      title: { en: 'More data', ru: 'Больше данных' },
      text: {
        en: 'The other cure: more points. With ten points degree $9$ has exactly enough freedom to hit them all; with forty it cannot — it has to go between them, along the shape, and the noise averages out. A big model needs a lot of data; that is why modern networks with billions of weights learn on billions of examples.',
        ru: 'Другое лекарство — больше точек. На десяти точках у степени $9$ ровно хватает свободы попасть во все; на сорока — уже нет: приходится идти между ними, вдоль формы, и шум усредняется. Большой модели нужно много данных; поэтому современные сети с миллиардами весов учат на миллиардах примеров.',
      },
      try: { en: 'Move $n$ from $10$ to $40$ with $d = 9$.', ru: 'Двигайте $n$ от $10$ до $40$ при $d = 9$.' },
      state: { show: ['exam'], params: { d: 9, lam: -8, sd: 3, n: 10 }, window: WIN, controls: ['n'] },
      enter(scene) { scene.setParam('n', 10); scene.animateParams({ n: 40 }, 4000); },
    },
    {
      title: { en: 'Choose the degree', ru: 'Выберите степень' },
      text: {
        en: 'Ten training points, no penalty. Choose the degree with the smallest error on the new points.',
        ru: 'Десять учебных точек, без штрафа. Выберите степень с наименьшей ошибкой на новых точках.',
      },
      task: {
        kind: 'drag',
        target: { d: 4 },
        tol: 0.4,
        back: 4,
        right: {
          en: 'Degree $4$: $L_{\\text{new}} \\approx 0.18$. Degrees $5$ and $6$ are almost as good; from $7$ on the model memorises.',
          ru: 'Степень $4$: $L_{\\text{нов}} \\approx 0.18$. Степени $5$ и $6$ почти так же хороши; с $7$ модель начинает зубрить.',
        },
        mistakes: [
          { params: { d: 9 }, text: { en: 'Zero error — but on the training points. On the new ones it is the worst of all.', ru: 'Ошибка ноль — но на учебных точках. На новых она хуже всех.' } },
          { params: { d: 8 }, text: { en: 'The training error is tiny, the new one is huge: the model memorised the noise.', ru: 'Учебная ошибка крошечная, новая огромная: модель запомнила шум.' } },
        ],
        hints: { d: d => (d < 4 ? { en: 'The curve is still too simple: the orange error can go lower.', ru: 'Кривая ещё слишком простая: оранжевая ошибка может быть ниже.' } : { en: 'Look at the orange line on the chart: where is its bottom?', ru: 'Смотрите на оранжевую линию графика: где у неё дно?' }) },
      },
      state: { show: ['exam'], params: { d: 1, lam: -8, sd: 3, n: 10 }, window: WIN, controls: ['d'] },
    },
    {
      title: { en: 'Tame degree 9', ru: 'Укротите степень 9' },
      text: {
        en: 'Degree $9$, ten points. Choose the penalty $\\lambda$ so that the error on new points is below $0.2$.',
        ru: 'Степень $9$, десять точек. Подберите штраф $\\lambda$ так, чтобы ошибка на новых точках стала меньше $0.2$.',
      },
      task: {
        kind: 'drag',
        ok: s => meanErr(TEST, polyFit(wave(3, 10), 9, lambda(s))) < 0.2,
        target: { lam: -3 },
        back: 6,
        right: {
          en: 'Around $\\lambda = 10^{-3}$ the curve follows the wave and ignores the noise. The penalty is chosen exactly like the degree: by the error on points the model has not seen.',
          ru: 'Около $\\lambda = 10^{-3}$ кривая повторяет волну и не замечает шума. Штраф подбирают так же, как степень: по ошибке на точках, которых модель не видела.',
        },
        hint: s => { const e = r2(meanErr(TEST, polyFit(wave(3, 10), 9, lambda(s)))); return s.lam < -2.6 ? { en: `New-point error ${e}: still memorising. Raise $\\lambda$.`, ru: `Ошибка на новых ${e}: всё ещё зубрит. Увеличьте $\\lambda$.` } : { en: `New-point error ${e}: too flat now. Lower $\\lambda$.`, ru: `Ошибка на новых ${e}: теперь слишком плоско. Уменьшите $\\lambda$.` }; },
      },
      state: { show: ['exam'], params: { d: 9, lam: -8, sd: 3, n: 10 }, window: WIN, controls: ['lam'] },
    },
  ],
};
