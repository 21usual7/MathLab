// A neural network folds the plane. One neuron is a line and a fold: h = max(0, n·x − d), a ramp over the plane.
// Three neurons are a 3×2 matrix with a shift — they lift the plane into space as a tilted plane — and then
// ReLU folds it onto the walls of the corner: the whole inside of the triangle of folds goes to one point,
// the corner, and a plane (the output neuron) cuts it off. Back in the plane the boundary is bent.
// Then training finds the folds by itself (and sometimes gets stuck), and more neurons round the boundary.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';
import { box, section } from '../core/geom.js';
import { ring, initNet, trainFilm, forward, netLoss, correct } from './ml-math.js';
import { heat, paint, points, rgb, RING_LINE } from './classify.js';
import { sigma, score } from './ml-math.js';

const r2 = v => fmt(Math.round(v * 100) / 100);
const WIN = { cx: 0, cy: 0, unit: 58 };
const DATA = ring();
const NEU = [COLORS.red, COLORS.green, COLORS.purple]; // neuron i in the plane = axis hᵢ in space
const NRGB = NEU.map(rgb);
const SUB = ['₁', '₂', '₃'];
const acc = net => correct(DATA, (x, y) => forward(net, x, y).out);

// The network built by hand: three folds n·x = d, the output is sure "blue" only where no fold is active
const V = -6, C = 1.5; // out = σ(1.5 − 6·(h₁ + h₂ + h₃)): blue while h₁ + h₂ + h₃ < 0.25
const hand = s => ({
  W: [0, 1, 2].map(i => [Math.cos(s[`a${i}`]), Math.sin(s[`a${i}`])]),
  b: [0, 1, 2].map(i => -s[`d${i}`]),
  v: [V, V, V],
  c: C,
});
// Training as a film, one per starting seed (computed when first needed)
const FILMS = new Map();
const film = (seed, H = 3) => {
  const key = `${H}:${seed}`;
  if (!FILMS.has(key)) FILMS.set(key, trainFilm(initNet(H, seed), DATA, 0.05, 3000, 20));
  return FILMS.get(key);
};
const frame = s => film(Math.round(s.sd))[Math.max(0, Math.min(150, Math.round(s.k)))];
const net = s => (s.tr ? frame(s).net : hand(s));

// ---- In the plane ----

// The fold lines of the neurons, each with a short arrow to its active side; with `drag`, a handle at the foot
function folds(p, sc, n, { drag = false, only = null } = {}) {
  n.W.forEach(([a, b], i) => {
    if (only !== null && i !== only) return;
    const L = Math.hypot(a, b) || 1, ux = a / L, uy = b / L, d = -n.b[i] / L, F = [ux * d, uy * d];
    p.line(...F, F[0] - uy, F[1] + ux, NEU[i % 3], { width: 2.5, extend: true });
    p.arrow(...F, F[0] + 0.7 * ux, F[1] + 0.7 * uy, NEU[i % 3], { width: 2 });
    if (drag) {
      p.handle(...F, NEU[i], (x, y) => {
        sc.setParam(`a${i}`, Math.atan2(y, x));
        sc.setParam(`d${i}`, Math.max(0.2, Math.min(3.5, Math.round(Math.hypot(x, y) * 20) / 20)));
      });
    }
  });
}
// Where the neurons are active: each tints its side in its colour
function tints(p, n, count = 3) {
  paint(p, (x, y) => n.W.slice(0, count).reduce((m, w, i) => m | ((w[0] * x + w[1] * y + n.b[i] > 0) << i), 0), mask => {
    const c = [0, 0, 0];
    let k = 0;
    for (let i = 0; i < count; i++) if (mask & (1 << i)) { k++; for (let j = 0; j < 3; j++) c[j] += NRGB[i][j]; }
    return k ? [c[0] / k, c[1] / k, c[2] / k, 40 + 22 * k] : [0, 0, 0, 0];
  });
}

// ---- In space: the hidden layer ----

const BOX = box(4, 4);
// The plane, lifted (u from 0 to 1: the matrix and the shift) and folded (u from 1 to 2: ReLU), times a scale
function lift(n, x, y, u, k) {
  const z = n.W.map((w, i) => w[0] * x + w[1] * y + n.b[i]);
  const flat = [x, y, 0];
  return z.map((v, i) => k * (u <= 1 ? flat[i] + (v - flat[i]) * u : v + (Math.max(0, v) - v) * (u - 1)));
}
// The scale that keeps the picture in the box: the far points of the data, before the fold and after it
const reach = (n, f) => Math.max(1, ...DATA.flatMap(([x, y]) => forward(n, x, y).z.map(f)));
function hidden(p, n, u, { cut = false, corner = false } = {}) {
  const k1 = 3.4 / reach(n, Math.abs), k2 = 3.4 / reach(n, v => v);
  const k = u <= 1 ? k1 ** u : k1 + (k2 - k1) * (u - 1);
  // Axes h₁, h₂, h₃ in the colours of the neurons
  NEU.forEach((c, i) => {
    const e = [0, 0, 0];
    e[i] = 3.8;
    p.lines(`ax${i}`, [[[0, 0, 0], e]], c, 0.9);
    p.point(`axl${i}`, e.map(v => v * 1.08), c, `h${SUB[i]}`, 0.001);
  });
  // The grid of the input plane, carried along; each piece coloured by the decision of the network
  const segs = [[], []], N = 28, A = 3.6;
  for (let a = -A; a <= A + 1e-9; a += 0.6) {
    for (let j = 0; j < N; j++) {
      const t0 = -A + 2 * A * j / N, t1 = -A + 2 * A * (j + 1) / N;
      for (const [P, Q] of [[[a, t0], [a, t1]], [[t0, a], [t1, a]]]) {
        const blue = forward(n, (P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2).out > 0.5;
        segs[blue ? 1 : 0].push([lift(n, ...P, u, k), lift(n, ...Q, u, k)]);
      }
    }
  }
  p.lines('sheet0', segs[0], COLORS.orange, 0.35);
  p.lines('sheet1', segs[1], COLORS.blue, 0.55);
  DATA.forEach(([x, y, c], i) => p.sphere(`d${i}`, lift(n, x, y, u, k), c ? COLORS.blue : COLORS.orange, 0.085));
  // The output neuron: the plane v·h + c = 0 (in the picture's scale)
  if (cut) {
    const L = Math.hypot(...n.v);
    p.sheet('cut', section(BOX, { n: n.v.map(v => v / L), d: -n.c * k / L }), COLORS.yellow, { opacity: 0.13 });
  }
  if (corner && u > 1.95) p.point('corner', [0, 0, 0], COLORS.blue, '(0;\u00a00;\u00a00)', 0.001);
}

const mat = n => `\\begin{pmatrix} ${n.W.map((w, i) => `\\textcolor{${NEU[i]}}{${r2(w[0])}} & \\textcolor{${NEU[i]}}{${r2(w[1])}}`).join(' \\\\ ')} \\end{pmatrix}`;
const col = v => `\\begin{pmatrix} ${v.map((x, i) => `\\textcolor{${NEU[i % 3]}}{${r2(x)}}`).join(' \\\\ ')} \\end{pmatrix}`;
const layerTex = n => `\\begin{gathered} \\vec h = \\operatorname{ReLU}\\left(W \\tbinom{x}{y} + \\vec b\\right) \\\\ W = ${mat(n)},\\quad \\vec b = ${col(n.b)} \\end{gathered}`;
const outTex = n => `p = \\sigma(${n.v.map((v, i) => `${i && v >= 0 ? '+' : ''}${r2(v)}\\,\\textcolor{${NEU[i]}}{h_${i + 1}}`).join('')} ${n.c < 0 ? '-' : '+'} ${r2(Math.abs(n.c))})`;
const accTex = n => `\\text{${t({ en: 'right', ru: 'верно' })}: } ${acc(n)} / ${DATA.length}`;

export default {
  view: '2d',
  view2d: WIN,
  view3d: { R: 4, zmax: 4, camera: [7.5, 6.2, 5.2], axes: false },
  lab: false,

  setup(scene) {
    // Three folds: the direction of each (angle) and its distance from the centre
    [[1.57, 1.1], [-2.62, 1.1], [-0.52, 1.1]].forEach(([a, d], i) => { // a triangle around the centre
      scene.ensureParam(`a${i}`, a, { min: -Math.PI, max: Math.PI, step: 0.01 });
      scene.ensureParam(`d${i}`, d, { min: 0.2, max: 3.5, step: 0.05 });
    });
    scene.ensureParam('u', 0, { min: 0, max: 2, step: 0.01 }); // 0 — the plane, 1 — lifted, 2 — folded
    scene.ensureParam('tr', 0, { min: 0, max: 1, step: 1 }); // 1 — the trained network instead of the hand-made one
    scene.ensureParam('sd', 1, { min: 1, max: 12, step: 1 }); // the random start of training
    scene.ensureParam('k', 0, { min: 0, max: 150, step: 0.01 }); // a frame of training: 20 epochs each
    scene.ensureParam('H', 3, { min: 3, max: 8, step: 1 }); // neurons in the hidden layer

    scene.custom.push(
      {
        id: 'line',
        draw2d(p) { heat(p, (x, y) => sigma(score(RING_LINE, x, y))); points(p, DATA, (x, y) => sigma(score(RING_LINE, x, y))); },
        legend: () => `\\text{${t({ en: 'the best line', ru: 'лучшая прямая' })}: } ${correct(DATA, (x, y) => sigma(score(RING_LINE, x, y)))} / ${DATA.length}`,
      },
      {
        // One neuron: a ramp that starts at its line
        id: 'neuron',
        draw2d(p, sc, s) {
          const n = hand(s);
          paint(p, (x, y) => Math.max(0, n.W[0][0] * x + n.W[0][1] * y + n.b[0]), h => [...NRGB[0], 255 * Math.min(0.5, h * 0.13)]);
          points(p, DATA);
          folds(p, sc, n, { drag: true, only: 0 });
          p.tex('h', `h${SUB[0]} = 0`, -n.W[0][0] * 2.2, -n.W[0][1] * 2.2, '#e6e9ef', { align: 'center', dx: 0, dy: 0 });
        },
        draw3d(p, sc, s) {
          const n = hand(s);
          p.surface('ramp', (x, y) => -2 + 0.8 * Math.max(0, n.W[0][0] * x + n.W[0][1] * y + n.b[0]), COLORS.red, 60);
          DATA.forEach(([x, y, c], i) => p.sphere(`d${i}`, [x, y, -2 + 0.8 * Math.max(0, n.W[0][0] * x + n.W[0][1] * y + n.b[0]) + 0.05], c ? COLORS.blue : COLORS.orange, 0.08));
        },
        legend: s => `\\textcolor{${NEU[0]}}{h_1} = \\max(0,\\ ${r2(Math.cos(s.a0))}\\,x ${Math.sin(s.a0) < 0 ? '-' : '+'} ${r2(Math.abs(Math.sin(s.a0)))}\\,y - ${r2(s.d0)})`,
      },
      {
        // Three folds in the plane
        id: 'three',
        draw2d(p, sc, s) {
          const n = hand(s);
          tints(p, n);
          points(p, DATA);
          folds(p, sc, n, { drag: true });
        },
        legend: s => layerTex(hand(s)),
      },
      {
        // The plane in space: lifted by the matrix, folded by ReLU
        id: 'space',
        draw2d(p, sc, s) {
          const n = hand(s);
          tints(p, n);
          points(p, DATA);
          folds(p, sc, n, { drag: true });
        },
        draw3d(p, sc, s) { hidden(p, hand(s), s.u, { corner: true }); },
        legend: s => layerTex(hand(s)),
      },
      {
        // The output neuron: a plane across the corner; in the input plane, a bent boundary
        id: 'out',
        draw2d(p, sc, s) {
          const n = net(s);
          heat(p, (x, y) => forward(n, x, y).out);
          points(p, DATA, (x, y) => forward(n, x, y).out);
          folds(p, sc, n, { drag: !s.tr });
        },
        draw3d(p, sc, s) { hidden(p, net(s), 2, { cut: true, corner: !s.tr }); },
        legend: s => { const n = net(s); return `\\begin{gathered} ${outTex(n)} \\\\ ${accTex(n)} \\end{gathered}`; },
      },
      {
        // Training from a random start
        id: 'train',
        draw2d(p, sc, s) {
          const n = frame(s).net;
          heat(p, (x, y) => forward(n, x, y).out);
          points(p, DATA, (x, y) => forward(n, x, y).out);
          folds(p, sc, n);
        },
        draw3d(p, sc, s) { hidden(p, frame(s).net, 2, { cut: true }); },
        legend: s => {
          const f = frame(s);
          return `\\begin{gathered} \\text{${t({ en: 'epoch', ru: 'эпоха' })} } ${20 * Math.round(s.k)}: \\quad \\text{log loss} = \\red{${r2(f.loss)}} \\\\ ${accTex(f.net)} \\end{gathered}`;
        },
      },
      {
        // More neurons: the trained boundary for H = 3 … 8
        id: 'many',
        draw2d(p, sc, s) {
          const f = film(1, Math.round(s.H)), n = f[f.length - 1].net;
          heat(p, (x, y) => forward(n, x, y).out);
          points(p, DATA, (x, y) => forward(n, x, y).out);
          n.W.forEach(([a, b], i) => {
            const L = Math.hypot(a, b) || 1, d = -n.b[i] / L, F = [a / L * d, b / L * d];
            p.line(...F, F[0] - b / L, F[1] + a / L, 'rgba(255,255,255,0.22)', { width: 1, dash: [5, 5], extend: true });
          });
        },
        legend: s => `H = ${Math.round(s.H)} \\qquad ${accTex(film(1, Math.round(s.H)).at(-1).net)}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'A ring: no line will do', ru: 'Кольцо: прямая не справится' },
      text: {
        en: 'Blue points in the middle, orange around them. Logistic regression from the previous topic gives its best line — and gets barely half right. Whatever line we take, part of the ring is on the blue side. We need a model that can bend the boundary. A neural network does it in a surprising way: it does not bend the line, it bends <b>the plane itself</b>.',
        ru: 'Синие точки в середине, оранжевые вокруг. Логистическая регрессия из прошлой темы даёт лучшую прямую — и угадывает едва половину. Какую прямую ни возьми, часть кольца окажется на синей стороне. Нужна модель, которая умеет гнуть границу. Нейросеть делает это неожиданным способом: она гнёт не прямую, а <b>саму плоскость</b>.',
      },
      state: { view: '2d', show: ['line'], window: WIN, controls: [] },
    },
    {
      title: { en: 'A neuron: a line and a fold', ru: 'Нейрон: прямая и сгиб' },
      text: {
        en: 'A neuron computes the same score as logistic regression, $\\vec n \\cdot \\binom{x}{y} - d$, but instead of the sigmoid it uses $\\operatorname{ReLU}(s) = \\max(0, s)$: negative becomes $0$. Over the plane this is a sheet of paper folded along the line: flat on one side, a ramp on the other. The neuron "fires" only on the side of its arrow, and the farther, the stronger.',
        ru: 'Нейрон считает тот же счёт, что логистическая регрессия, $\\vec n \\cdot \\binom{x}{y} - d$, но вместо сигмоиды берёт $\\operatorname{ReLU}(s) = \\max(0, s)$: отрицательное становится $0$. Над плоскостью это лист бумаги, согнутый по прямой: с одной стороны ровный, с другой — пандус. Нейрон «срабатывает» только со стороны своей стрелки, и чем дальше, тем сильнее.',
      },
      try: { en: 'Drag the red point: the fold turns and moves, the ramp follows it.', ru: 'Тяните красную точку: сгиб поворачивается и сдвигается, пандус — за ним.' },
      state: { view: 'split', show: ['neuron'], params: { a0: 1.57, d0: 1.1 }, window: WIN, camera: [7.5, -8, 5.5], controls: [] },
    },
    {
      title: { en: 'Three neurons — three folds', ru: 'Три нейрона — три сгиба' },
      text: {
        en: 'Take three neurons with their arrows looking outwards. Each tints its active side in its colour. Inside the triangle not one of them fires: $h_1 = h_2 = h_3 = 0$. Together the three are one formula: a $3 \\times 2$ matrix times the point, plus a shift, and ReLU on every row — the layer of a network.',
        ru: 'Возьмём три нейрона со стрелками наружу. Каждый подкрашивает свою активную сторону своим цветом. Внутри треугольника не срабатывает ни один: $h_1 = h_2 = h_3 = 0$. Вместе три нейрона — одна формула: матрица $3 \\times 2$ на точку, плюс сдвиг, и ReLU в каждой строке — это и есть слой сети.',
      },
      try: { en: 'Drag the three points and put all the blue ones in the untinted triangle.', ru: 'Тяните три точки и уложите все синие в неподкрашенный треугольник.' },
      check: {
        q: { en: 'Could two folds enclose the blue points instead of three?', ru: 'Можно ли окружить синие точки двумя сгибами вместо трёх?' },
        options: [
          { text: { en: 'Yes, if they cross', ru: 'Да, если они пересекаются' } },
          { text: { en: 'No: two lines never enclose a bounded region', ru: 'Нет: две прямые никогда не ограничивают область со всех сторон' }, ok: true },
          { text: { en: 'Yes, if they are parallel', ru: 'Да, если они параллельны' } },
        ],
        explain: {
          en: 'Two lines cut the plane into four (or three) parts, every one of them reaches infinity. A triangle is the fewest lines that close a region — so the fewest neurons for a ring is three.',
          ru: 'Две прямые режут плоскость на четыре (или три) части, и каждая уходит в бесконечность. Треугольник — наименьшее число прямых, замыкающих область, поэтому для кольца нужно минимум три нейрона.',
        },
      },
      state: { view: '2d', show: ['three'], params: { a0: 1.57, d0: 1.1, a1: -2.62, d1: 1.1, a2: -0.52, d2: 1.1 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'The plane goes into space', ru: 'Плоскость уходит в пространство' },
      text: {
        en: 'Now look at the plane through the eyes of the network. Every point $(x;\\ y)$ gets three numbers $(h_1;\\ h_2;\\ h_3)$ — a point in space. First only the matrix and the shift: the plane is carried into space as a <b>tilted plane</b> (a $3 \\times 2$ matrix has rank $2$ — it cannot fill space). The axes are in the colours of the neurons. Nothing is separated yet: a plane is still a plane.',
        ru: 'Теперь посмотрим на плоскость глазами сети. Каждая точка $(x;\\ y)$ получает три числа $(h_1;\\ h_2;\\ h_3)$ — точку в пространстве. Сначала только матрица и сдвиг: плоскость переносится в пространство как <b>наклонная плоскость</b> (у матрицы $3 \\times 2$ ранг $2$ — пространство ей не заполнить). Оси — в цветах нейронов. Пока ничего не разделено: плоскость остаётся плоскостью.',
      },
      try: { en: 'Press ▶ at $u$ or drag it from $0$ to $1$.', ru: 'Нажмите ▶ у $u$ или тяните его от $0$ до $1$.' },
      state: { view: 'split', show: ['space'], params: { a0: 1.57, d0: 1.1, a1: -2.62, d1: 1.1, a2: -0.52, d2: 1.1 }, window: WIN, controls: ['u'] },
      enter(scene) { scene.setParam('u', 0); scene.animateParams({ u: 1 }, 3500); },
    },
    {
      title: { en: 'The fold: ReLU', ru: 'Сгиб: ReLU' },
      text: {
        en: 'Now ReLU: every negative coordinate becomes $0$. Part of the tilted plane below the floor is pressed onto the floor, the parts behind the walls onto the walls — the sheet is folded into the corner of the box. And the whole triangle, where all three $h$ were negative, is pressed into <b>one point</b> — the corner $(0;\\ 0;\\ 0)$.',
        ru: 'Теперь ReLU: каждая отрицательная координата становится $0$. Часть наклонной плоскости ниже пола прижимается к полу, части за стенками — к стенкам: лист складывается в угол коробки. А весь треугольник, где все три $h$ были отрицательны, прижимается в <b>одну точку</b> — угол $(0;\\ 0;\\ 0)$.',
      },
      try: { en: 'Move $u$ from $1$ to $2$ and back. Turn the 3D view.', ru: 'Двигайте $u$ от $1$ до $2$ и обратно. Поверните 3D-вид.' },
      check: {
        q: { en: 'Where did all the blue points go?', ru: 'Куда попали все синие точки?' },
        options: [
          { text: { en: 'Into one point, the corner', ru: 'В одну точку — угол' }, ok: true },
          { text: { en: 'Onto the floor', ru: 'На пол' } },
          { text: { en: 'Far from the corner', ru: 'Далеко от угла' } },
        ],
        explain: {
          en: 'All three neurons are silent on them, so $\\vec h = (0;\\ 0;\\ 0)$ for every blue point. The orange ones are on the walls, away from the corner. Now a flat cut can separate them.',
          ru: 'На них молчат все три нейрона, поэтому у каждой синей точки $\\vec h = (0;\\ 0;\\ 0)$. Оранжевые — на стенках, вдали от угла. Теперь их можно отделить плоским срезом.',
        },
        reveal: scene => scene.animateParams({ u: 2 }, 1500),
      },
      state: { view: 'split', show: ['space'], params: { u: 1, a0: 1.57, d0: 1.1, a1: -2.62, d1: 1.1, a2: -0.52, d2: 1.1 }, window: WIN, controls: ['u'] },
      enter(scene) { scene.animateParams({ u: 2 }, 3500); },
    },
    {
      title: { en: 'A plane cuts off the corner', ru: 'Плоскость срезает угол' },
      text: {
        en: 'The last neuron is logistic regression again — but in the space of $\\vec h$: $p = \\sigma(\\vec v \\cdot \\vec h + c)$. Its boundary is a plane, and the yellow plane cuts the corner with all the blue points away from the walls. In the hidden space the classes are separated by a flat cut. Brought back to the input plane, the same cut is a <b>bent</b> boundary around the blue points.',
        ru: 'Последний нейрон — снова логистическая регрессия, но в пространстве $\\vec h$: $p = \\sigma(\\vec v \\cdot \\vec h + c)$. Её граница — плоскость, и жёлтая плоскость отрезает угол со всеми синими точками от стенок. В скрытом пространстве классы разделены плоским срезом. Перенесённый обратно на входную плоскость, тот же срез — <b>изогнутая</b> граница вокруг синих точек.',
      },
      try: { en: 'Drag a fold too far out: an orange point gets into the corner, and the plane cannot cut it off.', ru: 'Отодвиньте сгиб слишком далеко: оранжевая точка попадёт в угол, и плоскость её уже не отрежет.' },
      state: { view: 'split', show: ['out'], params: { tr: 0, a0: 1.57, d0: 1.1, a1: -2.62, d1: 1.1, a2: -0.52, d2: 1.1 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'Training finds the folds', ru: 'Обучение само находит сгибы' },
      text: {
        en: 'Nobody places the folds by hand. Start from random lines and run gradient descent on the log loss — the same rule as for one line; the slope for each weight comes from the chain rule (backpropagation). Watch the folds crawl until the sheet in space is folded so that a plane separates the colours. A network found its own folds — not necessarily ours.',
        ru: 'Сгибы никто не ставит руками. Начнём со случайных прямых и запустим градиентный спуск по log loss — то же правило, что для одной прямой; наклон по каждому весу даёт цепное правило (обратное распространение). Смотрите, как сгибы ползут, пока лист в пространстве не сложится так, что цвета разделит плоскость. Сеть нашла свои сгибы — не обязательно наши.',
      },
      try: { en: 'Press ▶ at $k$. Then change the start $sd$: at $sd = 10$ the descent gets stuck at $65$ of $70$ — the landscape of a network has many valleys.', ru: 'Нажмите ▶ у $k$. Потом смените старт $sd$: при $sd = 10$ спуск застревает на $65$ из $70$ — у рельефа сети много долин.' },
      state: { view: 'split', show: ['train'], params: { sd: 1 }, window: WIN, controls: ['k', 'sd'] },
      enter(scene) { scene.setParam('k', 0); scene.animateParams({ k: 150 }, 9000); },
    },
    {
      title: { en: 'More neurons — a rounder boundary', ru: 'Больше нейронов — круглее граница' },
      text: {
        en: 'With $H$ neurons the boundary is made of up to $H$ straight pieces (the dashed lines are the folds). More neurons, rounder boundary. Their space has $H$ dimensions — we cannot look into it, but the idea is the same: fold, then cut flat. A deep network folds again and again, layer after layer, and the folds of folds can follow any shape.',
        ru: 'С $H$ нейронами граница складывается из $H$ прямых кусков (пунктир — сгибы). Больше нейронов — круглее граница. Их пространство $H$-мерное, заглянуть в него нельзя, но идея та же: сложить, а потом срезать плоско. Глубокая сеть складывает снова и снова, слой за слоем, и сгибы сгибов могут повторить любую форму.',
      },
      try: { en: 'Move $H$ from $3$ to $8$.', ru: 'Двигайте $H$ от $3$ до $8$.' },
      state: { view: '2d', show: ['many'], params: { H: 3 }, window: WIN, controls: ['H'] },
    },
    {
      title: { en: 'Build the network by hand', ru: 'Соберите сеть руками' },
      text: {
        en: 'Place the three folds so that the network classifies all $70$ points correctly. The output neuron is already set: blue only where no fold fires.',
        ru: 'Расставьте три сгиба так, чтобы сеть верно классифицировала все $70$ точек. Выходной нейрон уже настроен: синий — только там, где не срабатывает ни один сгиб.',
      },
      task: {
        kind: 'drag',
        ok: s => acc(hand(s)) === DATA.length,
        target: { a0: 1.57, d0: 1.1, a1: -2.62, d1: 1.1, a2: -0.52, d2: 1.1 },
        back: 2,
        right: {
          en: 'All $70$. The triangle has to hold the whole blue disc (radius $\\approx 1.05$) and stay inside the orange ring (from $2.4$): its corners are twice as far as its sides, so the folds must be at about $1.05$–$1.15$ from the centre.',
          ru: 'Все $70$. Треугольник должен вместить весь синий диск (радиус $\\approx 1.05$) и не вылезти за оранжевое кольцо (от $2.4$): его углы вдвое дальше сторон, поэтому сгибы должны стоять примерно в $1.05$–$1.15$ от центра.',
        },
        hint: s => {
          const n = hand(s), wrong = DATA.filter(([x, y, c]) => (forward(n, x, y).out > 0.5) !== !!c);
          const blue = wrong.filter(q => q[2]).length, orange = wrong.length - blue;
          return blue
            ? { en: `${blue} blue points are outside the triangle: move the folds out.`, ru: `Синих снаружи треугольника: ${blue}. Отодвиньте сгибы.` }
            : { en: `${orange} orange points are inside: the corners of the triangle reach the ring. Bring the folds closer, or turn them.`, ru: `Оранжевых внутри: ${orange}. Углы треугольника залезли в кольцо — придвиньте сгибы или поверните.` };
        },
      },
      state: { view: '2d', show: ['out'], params: { tr: 0, a0: 0.4, d0: 2.2, a1: 2.2, d1: 0.6, a2: -1.9, d2: 1.6 }, window: WIN, controls: [] },
    },
  ],
};
