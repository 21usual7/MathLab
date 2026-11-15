// Classification: a line that separates two classes. The side of a point is the sign of the score
// s = w·x + b — a dot product, the shadow of the point on the arrow w; the sigmoid turns the score into a
// probability (a smooth step over the plane in 3D); the length of w is confidence; the log loss punishes
// confident mistakes; training turns the line into place. And data no line can separate.
// heat() — the probability over the plane as colour, with the boundary p = 0.5 — is used by network.js too.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';
import { twoClouds, ring, sigma, score, logloss, loglossGrad, correct, descend, along } from './ml-math.js';

const r2 = v => fmt(Math.round(v * 100) / 100);
const WIN = { cx: 0, cy: 0, unit: 62 };
const START = [-1, 0.6, 1.5]; // the training starts from a line that gets almost everything wrong
const C1 = COLORS.blue, C0 = COLORS.orange; // spam / not spam
export const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const RGB1 = rgb(C1), RGB0 = rgb(C0);

// Colour over the whole view, computed on a coarse grid of samples and smoothed: rgba(v) of the value f(x, y)
export function paint(p, f, rgba, res = 5) {
  const W = Math.ceil(p.w / res) + 1, H = Math.ceil(p.h / res) + 1, v = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) v[j * W + i] = f(p.toX(i * res), p.toY(j * res));
  const c = paint.canvas || (paint.canvas = document.createElement('canvas'));
  c.width = W; c.height = H;
  const g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  for (let k = 0; k < W * H; k++) d.set(rgba(v[k]), 4 * k);
  g.putImageData(img, 0, 0);
  p.ctx.imageSmoothingEnabled = true;
  p.ctx.drawImage(c, -res / 2, -res / 2, W * res, H * res);
  return { v, W, H };
}

// The probability f(x, y) of class 1 as colour over the whole view, and the line where it is ½
export function heat(p, f, { res = 5, boundary = true } = {}) {
  const { v, W, H } = paint(p, f, q => { const col = q > 0.5 ? RGB1 : RGB0; return [...col, 255 * (0.07 + 0.36 * Math.min(1, Math.abs(2 * q - 1)))]; }, res);
  if (!boundary) return;
  // The boundary: marching squares on the same samples
  const ctx = p.ctx;
  ctx.beginPath();
  for (let j = 0; j + 1 < H; j++) {
    for (let i = 0; i + 1 < W; i++) {
      const a = v[j * W + i] - 0.5, b = v[j * W + i + 1] - 0.5, cc = v[(j + 1) * W + i + 1] - 0.5, dd = v[(j + 1) * W + i] - 0.5, pts = [];
      const edge = (z1, z2, x1, y1, x2, y2) => { if ((z1 < 0) !== (z2 < 0)) { const k = z1 / (z1 - z2); pts.push([(x1 + (x2 - x1) * k) * res, (y1 + (y2 - y1) * k) * res]); } };
      edge(a, b, i, j, i + 1, j); edge(b, cc, i + 1, j, i + 1, j + 1); edge(cc, dd, i + 1, j + 1, i, j + 1); edge(dd, a, i, j + 1, i, j);
      for (let k = 0; k + 1 < pts.length; k += 2) { ctx.moveTo(...pts[k]); ctx.lineTo(...pts[k + 1]); }
    }
  }
  p.stroke('rgba(255,255,255,0.85)', 2);
}

// The points of two classes; a wrong one gets a red ring
export function points(p, pts, f = null) {
  for (const [x, y, c] of pts) {
    if (f && (f(x, y) > 0.5) !== !!c) p.ring(x, y, COLORS.red, 9);
    p.dot(x, y, c ? C1 : C0, 5.5);
  }
}

const DATA = twoClouds();
const model = s => [s.w1 * s.c, s.w2 * s.c, s.b * s.c];
const prob = m => (x, y) => sigma(score(m, x, y));
const trained = s => along(descend((a, b, c) => loglossGrad(DATA, [a, b, c]), START, 1, 60), s.k);
// The line ring.js data get from logistic regression: the best a line can do there
const RING = ring();
export const RING_LINE = descend((a, b, c) => loglossGrad(RING, [a, b, c]), [0.3, 0.2, 0], 1, 400).pop();

// The arrow w starts at the foot of the perpendicular from the origin to the line w·x + b = 0
const foot = ([w1, w2, b]) => { const L = w1 * w1 + w2 * w2 || 1; return [-b * w1 / L, -b * w2 / L]; };

// The model in 3D: the probability as a height over the plane, a smooth step; points at the height of their class
const LOW = -1.6, TOP = 3.2;
const Zp = q => LOW + TOP * q;
function step3d(p, m, { misses = false } = {}) {
  const g = [];
  for (let k = -4; k <= 4; k++) g.push([[k, -4, LOW], [k, 4, LOW]], [[-4, k, LOW], [4, k, LOW]]);
  p.lines('floor', g, '#3a4352', 0.7);
  p.lines('pax', [[[-4, 4, LOW], [-4, 4, LOW + TOP + 0.3]], [[-4, 4, LOW + TOP], [-3.8, 4, LOW + TOP]], [[-4, 4, LOW + TOP / 2], [-3.8, 4, LOW + TOP / 2]]], '#8b95a7', 0.9);
  p.point('p1', [-4, 4, LOW + TOP + 0.55], '#8b95a7', 'p', 0.001);
  p.point('p1v', [-4.35, 4, LOW + TOP], '#8b95a7', '1', 0.001);
  p.point('p05', [-4.4, 4, LOW + TOP / 2], '#8b95a7', '½', 0.001);
  p.surface('step', (x, y) => Zp(sigma(score(m, x, y))), C1, 60);
  DATA.forEach(([x, y, c], i) => {
    p.sphere(`d${i}`, [x, y, Zp(c)], c ? C1 : C0, 0.09);
    if (misses) p.tube(`m${i}`, [[x, y, Zp(c)], [x, y, Zp(sigma(score(m, x, y)))]], COLORS.red, 0.025);
  });
}

export default {
  view: '2d',
  view2d: WIN,
  view3d: { R: 4, zmax: 4, camera: [7, -8, 6], axes: false },
  lab: false,

  setup(scene) {
    scene.ensureParam('w1', -0.6, { min: -6, max: 6, step: 0.01 });
    scene.ensureParam('w2', 1, { min: -6, max: 6, step: 0.01 });
    scene.ensureParam('b', 0.5, { min: -10, max: 10, step: 0.01 });
    scene.ensureParam('c', 1, { min: 0.2, max: 4, step: 0.01 }); // confidence: w and b times c
    scene.ensureParam('px', 1.5, { min: -4, max: 4, step: 0.1 }); // a probe point
    scene.ensureParam('py', -2, { min: -4, max: 4, step: 0.1 });
    scene.ensureParam('k', 0, { min: 0, max: 60, step: 0.01 });

    // The line by its foot (moves it) and the head of the arrow w (turns it, sets the length)
    const handles = (p, sc, s) => {
      const m = [s.w1, s.w2, s.b], F = foot(m);
      p.handle(...F, '#ffffff', (x, y) => sc.setParam('b', -(s.w1 * x + s.w2 * y)));
      p.handle(F[0] + s.w1, F[1] + s.w2, COLORS.yellow, (x, y) => {
        const w1 = Math.max(-6, Math.min(6, x - F[0])), w2 = Math.max(-6, Math.min(6, y - F[1]));
        sc.setParam('w1', w1); sc.setParam('w2', w2); sc.setParam('b', -(w1 * F[0] + w2 * F[1]));
      });
    };
    const arrowW = (p, m) => {
      const F = foot(m);
      p.arrow(...F, F[0] + m[0], F[1] + m[1], COLORS.yellow, { width: 3 });
      p.tex('w', '\\vec w', F[0] + m[0], F[1] + m[1], COLORS.yellow, { dx: 10, dy: -12 });
    };

    scene.custom.push(
      {
        // Two sides of a line
        id: 'sides',
        draw2d(p, sc, s) {
          const m = [s.w1, s.w2, s.b], F = foot(m);
          heat(p, (x, y) => (score(m, x, y) > 0 ? 0.62 : 0.38), { boundary: false });
          p.line(...F, F[0] - s.w2, F[1] + s.w1, 'rgba(255,255,255,0.85)', { width: 2, extend: true });
          points(p, DATA, prob(m));
          arrowW(p, m);
          handles(p, sc, s);
        },
        legend: s => `\\text{${t({ en: 'right', ru: 'верно' })}: } ${correct(DATA, prob([s.w1, s.w2, s.b]))} / ${DATA.length}`,
      },
      {
        // The score of a point is its shadow on w: level lines s = const are parallel to the boundary
        id: 'score',
        draw2d(p, sc, s) {
          const m = [s.w1, s.w2, s.b], F = foot(m), L2 = s.w1 * s.w1 + s.w2 * s.w2;
          heat(p, (x, y) => (score(m, x, y) > 0 ? 0.62 : 0.38), { boundary: false });
          p.line(...F, F[0] - s.w2, F[1] + s.w1, 'rgba(255,255,255,0.85)', { width: 2, extend: true });
          for (let v = -4; v <= 4; v++) {
            if (!v) continue;
            const P = [F[0] + v * s.w1 / L2, F[1] + v * s.w2 / L2]; // where s = v on the line of w
            p.line(P[0], P[1], P[0] - s.w2, P[1] + s.w1, 'rgba(255,255,255,0.16)', { width: 1, dash: [4, 5], extend: true });
            p.text(String(v > 0 ? `+${v}` : v), P[0], P[1], 'rgba(255,255,255,0.5)', { size: 11 });
          }
          points(p, DATA);
          // The probe: its shadow on the line of w, and its score
          const sP = score(m, s.px, s.py), Q = [F[0] + sP * s.w1 / L2, F[1] + sP * s.w2 / L2];
          p.line(F[0] - 6 * s.w1, F[1] - 6 * s.w2, F[0] + 6 * s.w1, F[1] + 6 * s.w2, COLORS.yellow + '40', { width: 1 });
          p.line(s.px, s.py, ...Q, COLORS.purple, { width: 1.5, dash: [5, 4] });
          p.dot(...Q, COLORS.purple, 4);
          arrowW(p, m);
          p.handle(s.px, s.py, COLORS.purple, (x, y) => { sc.setParam('px', Math.round(x * 10) / 10); sc.setParam('py', Math.round(y * 10) / 10); });
          p.tex('P', `P,\\ s = ${r2(sP)}`, s.px, s.py, COLORS.purple, { dx: 12, dy: -14 });
          handles(p, sc, s);
        },
        legend: s => `\\begin{aligned} s &= \\vec w \\cdot P + b \\\\ &= ${r2(s.w1)} \\cdot ${r2(s.px)} ${s.w2 < 0 ? '-' : '+'} ${r2(Math.abs(s.w2))} \\cdot ${s.py < 0 ? `(${r2(s.py)})` : r2(s.py)} ${s.b < 0 ? '-' : '+'} ${r2(Math.abs(s.b))} \\\\ &= \\purple{${r2(score([s.w1, s.w2, s.b], s.px, s.py))}} \\end{aligned}`,
      },
      {
        // The probability: heat in the plane, a smooth step in space
        id: 'prob',
        draw2d(p, sc, s) {
          const m = model(s);
          heat(p, prob(m));
          points(p, DATA, prob(m));
          arrowW(p, m);
          p.tex('P', `p = ${r2(sigma(score(m, s.px, s.py)))}`, s.px, s.py, COLORS.purple, { dx: 12, dy: -14 });
          p.dot(s.px, s.py, COLORS.purple, 5);
          handles(p, sc, s);
        },
        draw3d(p, sc, s) { step3d(p, model(s)); },
        legend: s => `p = \\sigma(s) = \\dfrac{1}{1 + e^{-s}} \\qquad |\\vec w| = ${r2(Math.hypot(s.w1, s.w2) * s.c)}`,
      },
      {
        // The log loss: every point pays −ln p of its own class; the red bars in 3D are what it missed
        id: 'loss',
        draw2d(p, sc, s) {
          const m = model(s);
          heat(p, prob(m));
          for (const [x, y, c] of DATA) {
            const q = sigma(score(m, x, y)), pay = -Math.log(Math.max(1e-9, c ? q : 1 - q));
            if (pay < 0.05) continue;
            p.ctx.beginPath();
            p.ctx.arc(p.sx(x), p.sy(y), 6 + 10 * Math.min(4, pay), 0, 2 * Math.PI);
            p.stroke(COLORS.red + 'cc', 2);
          }
          points(p, DATA);
          arrowW(p, m);
          handles(p, sc, s);
        },
        draw3d(p, sc, s) { step3d(p, model(s), { misses: true }); },
        legend: s => `\\begin{gathered} \\text{log loss} = -\\tfrac{1}{n}\\textstyle\\sum \\ln p_{\\text{${t({ en: 'true', ru: 'верн.' })}}} = \\red{${r2(logloss(DATA, model(s)))}} \\\\ \\text{${t({ en: 'right', ru: 'верно' })}: } ${correct(DATA, prob(model(s)))} / ${DATA.length} \\end{gathered}`,
      },
      {
        // Training: gradient descent on the log loss
        id: 'train',
        draw2d(p, sc, s) {
          const m = trained(s);
          heat(p, prob(m));
          points(p, DATA, prob(m));
          arrowW(p, m);
        },
        draw3d(p, sc, s) { step3d(p, trained(s), { misses: true }); },
        legend: s => {
          const m = trained(s);
          return `\\begin{gathered} \\text{${t({ en: 'step', ru: 'шаг' })} } ${Math.floor(s.k)}: \\quad \\text{log loss} = \\red{${r2(logloss(DATA, m))}} \\\\ |\\vec w| = ${r2(Math.hypot(m[0], m[1]))} \\end{gathered}`;
        },
      },
      {
        // A ring: the best line is still poor
        id: 'ring',
        draw2d(p) {
          heat(p, prob(RING_LINE));
          points(p, RING, prob(RING_LINE));
        },
        legend: () => `\\text{${t({ en: 'the best line', ru: 'лучшая прямая' })}: } ${correct(RING, prob(RING_LINE))} / ${RING.length}`,
      },
      {
        // The task: the probability at Q, the line fixed, only the confidence c changes
        id: 'sure',
        draw2d(p, sc, s) {
          const m = model(s);
          heat(p, prob(m));
          points(p, DATA);
          arrowW(p, m);
          p.dot(2.4, 2.6, COLORS.purple, 6);
          p.tex('Q', `Q,\\ p = ${r2(sigma(score(m, 2.4, 2.6)))}`, 2.4, 2.6, COLORS.purple, { dx: 12, dy: -14 });
        },
        draw3d(p, sc, s) { step3d(p, model(s)); p.sphere('Q', [2.4, 2.6, Zp(sigma(score(model(s), 2.4, 2.6)))], COLORS.purple, 0.13); },
        legend: s => `p(Q) = \\sigma(${r2(score(model(s), 2.4, 2.6))}) = \\purple{${r2(sigma(score(model(s), 2.4, 2.6)))}}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'Spam or not', ru: 'Спам или нет' },
      text: {
        en: 'Every letter is a point: two features, say the number of links and the share of capital letters, already centred and scaled. Blue letters are spam, orange are not. The simplest rule: a line, with spam on one side. The yellow arrow $\\vec w$ is perpendicular to the line and points to the "spam" side. The machine has to learn the arrow $\\vec w$ and the shift $b$.',
        ru: 'Каждое письмо — точка: два признака, скажем, число ссылок и доля заглавных букв, уже центрированные и отмасштабированные. Синие письма — спам, оранжевые — нет. Самое простое правило — прямая: по одну её сторону спам. Жёлтая стрелка $\\vec w$ перпендикулярна прямой и смотрит в сторону «спама». Машине надо выучить стрелку $\\vec w$ и сдвиг $b$.',
      },
      try: { en: 'Drag the white point (moves the line) and the end of the arrow (turns it). Points in a red ring are on the wrong side.', ru: 'Тяните белую точку (двигает прямую) и конец стрелки (поворачивает). Точки в красном кольце — по неверную сторону.' },
      state: { view: '2d', show: ['sides'], params: { w1: -0.6, w2: 1, b: 0.5, c: 1 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'The side is the sign of a dot product', ru: 'Сторона — это знак скалярного произведения' },
      text: {
        en: 'How does a machine know the side of a point $P$? It computes the <b>score</b> $s = \\vec w \\cdot P + b$. The dot product is the shadow of $P$ on the arrow $\\vec w$ times its length: points with the same shadow have the same score and lie on one line parallel to the boundary (the dashed stripes). On the boundary $s = 0$, on the side of $\\vec w$ it is positive, on the other negative.',
        ru: 'Как машина узнаёт сторону точки $P$? Она считает <b>счёт</b> $s = \\vec w \\cdot P + b$. Скалярное произведение — это тень $P$ на стрелку $\\vec w$, умноженная на её длину: у точек с одинаковой тенью одинаковый счёт, и они лежат на одной прямой, параллельной границе (пунктирные полосы). На границе $s = 0$, со стороны $\\vec w$ счёт положительный, с другой — отрицательный.',
      },
      try: { en: 'Drag the purple point $P$ across the stripes and watch its shadow and $s$.', ru: 'Тяните фиолетовую точку $P$ поперёк полос и смотрите на её тень и $s$.' },
      check: {
        q: { en: 'The arrow $\\vec w$ is made twice as long, the line stays. What happens to the score of every point?', ru: 'Стрелку $\\vec w$ удлинили вдвое, прямая та же. Что станет со счётом каждой точки?' },
        options: [{ text: { en: 'It doubles', ru: 'Удвоится' }, ok: true }, { text: { en: 'It stays', ru: 'Не изменится' } }, { text: { en: 'It halves', ru: 'Уменьшится вдвое' } }],
        explain: {
          en: 'To keep the line, $b$ doubles too, and $s = \\vec w \\cdot P + b$ doubles. The sides are the same — but the numbers are louder. This will be confidence.',
          ru: 'Чтобы прямая осталась, $b$ тоже удваивается, и $s = \\vec w \\cdot P + b$ удваивается. Стороны те же — но числа «громче». Это и будет уверенность.',
        },
      },
      state: { view: '2d', show: ['score'], params: { w1: 1, w2: 1.2, b: 0, px: 1.5, py: -2 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'From a score to a probability', ru: 'Из счёта — вероятность' },
      text: {
        en: 'A score can be any number, a probability is between $0$ and $1$. The <b>sigmoid</b> $\\sigma(s) = \\frac{1}{1 + e^{-s}}$ squeezes one into the other: $\\sigma(0) = \\frac12$ on the boundary, far on the side of $\\vec w$ it tends to $1$, far on the other side to $0$. In 3D the probability over the plane is a smooth step; blue points sit at height $1$, orange at $0$. In the plane the same is the colour: the more confident, the brighter.',
        ru: 'Счёт может быть каким угодно числом, вероятность — от $0$ до $1$. <b>Сигмоида</b> $\\sigma(s) = \\frac{1}{1 + e^{-s}}$ сжимает одно в другое: на границе $\\sigma(0) = \\frac12$, далеко со стороны $\\vec w$ она стремится к $1$, далеко с другой — к $0$. В 3D вероятность над плоскостью — плавная ступенька; синие точки сидят на высоте $1$, оранжевые — на $0$. На плоскости то же самое — цвет: чем увереннее, тем ярче.',
      },
      try: { en: 'Turn the arrow and watch the step turn with it.', ru: 'Поверните стрелку — ступенька повернётся вместе с ней.' },
      state: { view: 'split', show: ['prob'], params: { w1: 1, w2: 1.2, b: 0, c: 1, px: 0.6, py: -0.3 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'The length of the arrow is confidence', ru: 'Длина стрелки — уверенность' },
      text: {
        en: 'Multiply $\\vec w$ and $b$ by $c$: the line stays, but all scores grow $c$ times. The step becomes steep: points near the line are already labelled with $p$ close to $0$ or $1$. A short arrow is a cautious model, a long one is a sure one. Sure is good when it is right — and very bad when it is wrong.',
        ru: 'Умножим $\\vec w$ и $b$ на $c$: прямая остаётся, но все счета растут в $c$ раз. Ступенька становится крутой: даже точки рядом с прямой получают $p$, близкую к $0$ или $1$. Короткая стрелка — осторожная модель, длинная — самоуверенная. Уверенность хороша, когда модель права, — и очень плоха, когда нет.',
      },
      try: { en: 'Move $c$ from $0.3$ to $4$.', ru: 'Двигайте $c$ от $0.3$ до $4$.' },
      state: { view: 'split', show: ['prob'], params: { w1: 1, w2: 1.2, b: 0, c: 0.4 }, window: WIN, controls: ['c'] },
    },
    {
      title: { en: 'The price of a confident mistake', ru: 'Цена уверенной ошибки' },
      text: {
        en: 'How to score a model with probabilities? Every point pays $-\\ln p$, where $p$ is the probability the model gave to its <b>true</b> class: $p = 1$ costs nothing, $p = \\frac12$ costs $0.69$, $p = 0.01$ costs $4.6$. The red rings are these prices, the red bars in 3D — how far the step is from the true height. The mean price is the <b>log loss</b>. A confident mistake is the most expensive thing there is.',
        ru: 'Как оценить модель, которая выдаёт вероятности? Каждая точка платит $-\\ln p$, где $p$ — вероятность, которую модель дала её <b>настоящему</b> классу: $p = 1$ ничего не стоит, $p = \\frac12$ стоит $0.69$, $p = 0.01$ — уже $4.6$. Красные кольца — эти цены, красные столбики в 3D — насколько ступенька не дотянула до нужной высоты. Средняя цена — это <b>log loss</b>. Уверенная ошибка — самое дорогое, что бывает.',
      },
      try: { en: 'Tilt the line so that two points are wrong, then raise $c$: the rings of the wrong points swell.', ru: 'Наклоните прямую так, чтобы две точки оказались неверными, и поднимите $c$: кольца неверных точек раздуваются.' },
      check: {
        q: { en: 'Why not simply count the mistakes and minimise their number?', ru: 'Почему бы просто не считать ошибки и не уменьшать их число?' },
        options: [
          { text: { en: 'Counting is too slow', ru: 'Считать слишком долго' } },
          { text: { en: 'The count jumps in steps: it has no slope to roll down', ru: 'Число ошибок меняется скачками: у него нет наклона, по которому катиться' }, ok: true },
          { text: { en: 'It gives the same result', ru: 'Получится то же самое' } },
        ],
        explain: {
          en: 'Turn the line a little — the number of mistakes usually does not change at all, and then suddenly jumps by one. Its landscape is flat terraces, the gradient is zero almost everywhere. The log loss changes smoothly with every move, so descent has something to feel.',
          ru: 'Поверните прямую чуть-чуть — число ошибок обычно не меняется вовсе, а потом вдруг прыгает на единицу. Его рельеф — плоские террасы, градиент почти везде ноль. Log loss меняется плавно при любом движении, поэтому спуску есть что нащупать.',
        },
      },
      state: { view: 'split', show: ['loss'], params: { w1: 1.2, w2: 0.2, b: -0.6, c: 1.5 }, window: WIN, controls: ['c'] },
    },
    {
      title: { en: 'Training', ru: 'Обучение' },
      text: {
        en: 'Gradient descent on the log loss. Its gradient is as simple as for the squares: every point pushes the arrow by its input times $(p - y)$ — how much the model missed. Wrong points push hard, the line turns into place. Then something new: when all points are right, the loss can still go down by making the arrow longer. Here the classes are separable, and the model would grow sure without end — in practice a penalty for long $\\vec w$ stops it.',
        ru: 'Градиентный спуск по log loss. Его градиент так же прост, как у квадратов: каждая точка толкает стрелку на свой вход, умноженный на $(p - y)$ — насколько модель промахнулась. Неверные точки толкают сильно, и прямая встаёт на место. Дальше новое: когда все точки верны, ошибку ещё можно уменьшать, удлиняя стрелку. Здесь классы разделимы, и модель становилась бы уверенней без конца — на практике это останавливают штрафом за длинный $\\vec w$.',
      },
      try: { en: 'Press ▶ at $k$, or drag it.', ru: 'Нажмите ▶ у $k$ или тяните его.' },
      state: { view: 'split', show: ['train'], window: WIN, controls: ['k'] },
      enter(scene) { scene.setParam('k', 0); scene.animateParams({ k: 60 }, 7000); },
    },
    {
      title: { en: 'When a line is not enough', ru: 'Когда прямой мало' },
      text: {
        en: 'Here the blue points are in the middle and the orange ones around them. Training gives the best possible line — and it is useless: any line leaves a part of the ring on the blue side. A line cannot bend. To separate a ring one needs a model that can — a neural network, which is the next topic.',
        ru: 'Здесь синие точки в середине, а оранжевые — вокруг. Обучение даёт лучшую возможную прямую — и она бесполезна: любая прямая оставляет часть кольца на синей стороне. Прямая не умеет гнуться. Чтобы отделить кольцо, нужна модель, которая умеет, — нейросеть, это следующая тема.',
      },
      state: { view: '2d', show: ['ring'], window: WIN, controls: [] },
    },
    {
      title: { en: 'Separate them', ru: 'Разделите' },
      text: {
        en: 'Put the line so that every letter is on its own side: spam on the side of $\\vec w$, the rest on the other.',
        ru: 'Поставьте прямую так, чтобы каждое письмо оказалось на своей стороне: спам — со стороны $\\vec w$, остальные — с другой.',
      },
      task: {
        kind: 'drag',
        ok: s => correct(DATA, prob([s.w1, s.w2, s.b])) === DATA.length,
        target: { w1: 0.62, w2: 0.79, b: -0.11 },
        back: 0,
        right: {
          en: 'All $26$ are right. There are many such lines — the log loss picks the one that keeps the points farthest from it.',
          ru: 'Все $26$ верно. Таких прямых много — log loss выбирает ту, от которой точки дальше всего.',
        },
        mistakes: [{
          when: s => correct(DATA, prob([s.w1, s.w2, s.b])) === 0,
          text: { en: 'The line is right, but the arrow looks the wrong way: everything is upside down. Turn $\\vec w$ to the blue side.', ru: 'Прямая хорошая, но стрелка смотрит не туда: всё наоборот. Разверните $\\vec w$ к синим.' },
        }],
        hint: s => { const n = DATA.length - correct(DATA, prob([s.w1, s.w2, s.b])); return { en: `${n} points are on the wrong side (in red rings).`, ru: `Неверно: ${n} (точки в красных кольцах).` }; },
      },
      state: { view: '2d', show: ['sides'], params: { w1: -0.6, w2: 1, b: 0.5 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'Make it sure', ru: 'Добавьте уверенности' },
      text: {
        en: 'The line is trained and fixed. Choose the confidence $c$ so that the model gives the letter $Q$ the probability of spam $p = 0.9$.',
        ru: 'Прямая обучена и закреплена. Подберите уверенность $c$ так, чтобы модель дала письму $Q$ вероятность спама $p = 0.9$.',
      },
      task: {
        kind: 'drag',
        ok: s => Math.abs(sigma(score(model(s), 2.4, 2.6)) - 0.9) <= 0.015,
        target: { c: 0.64 },
        tol: 0.03,
        back: 3,
        right: {
          en: '$\\sigma(s) = 0.9$ means $e^{-s} = \\frac19$, $s = \\ln 9 \\approx 2.2$: the score of $Q$ has to be $2.2$.',
          ru: '$\\sigma(s) = 0.9$ значит $e^{-s} = \\frac19$, $s = \\ln 9 \\approx 2.2$: счёт $Q$ должен быть $2.2$.',
        },
        hint: s => (sigma(score(model(s), 2.4, 2.6)) > 0.9
          ? { en: 'Too sure: lower $c$.', ru: 'Слишком уверенно: уменьшите $c$.' }
          : { en: 'Not sure enough: raise $c$.', ru: 'Недостаточно уверенно: увеличьте $c$.' }),
      },
      state: { view: 'split', show: ['sure'], params: { w1: 0.62, w2: 0.79, b: -0.11, c: 2 }, window: WIN, controls: ['c'] },
    },
  ],
};
