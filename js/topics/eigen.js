// Eigenvectors. A matrix turns almost every arrow off its line — but some lines stay where they are: arrows
// on them are only stretched, M·v = λ·v. A rotation has none, a shear has one; applied again and again,
// a matrix turns any arrow towards the line with the biggest λ.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';
import { morph } from './matrix.js';

const WINDOW = { cx: 0.5, cy: 0.8, unit: 48 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const snap = v => clamp(Math.round(v * 2) / 2, -5, 5);
const r2 = v => fmt(Math.round(v * 100) / 100);
const col = (x, y) => `\\begin{pmatrix} ${r2(x)} \\\\ ${r2(y)} \\end{pmatrix}`;

// M = [a b; c d] by columns î′ = (a; c), ĵ′ = (b; d); part t of the way from the identity
const at = (s, tt = s.t) => [1 - tt + tt * s.ix, tt * s.jx, tt * s.iy, 1 - tt + tt * s.jy];
const apply = ([a, b, c, d], [x, y]) => [a * x + b * y, c * x + d * y];
const crossOf = (u, w) => u[0] * w[1] - u[1] * w[0];

// Real eigenvalues with a direction for each (none for a rotation)
function eigen([a, b, c, d]) {
  const tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det;
  if (disc < -1e-9) return [];
  const ls = disc < 1e-9 ? [tr / 2] : [(tr + Math.sqrt(disc)) / 2, (tr - Math.sqrt(disc)) / 2];
  return ls.map(l => {
    let u = Math.abs(b) > 1e-9 ? [b, l - a] : Math.abs(c) > 1e-9 ? [l - d, c] : null;
    if (!u) return [{ l: a, u: [1, 0] }, { l: d, u: [0, 1] }]; // already diagonal: the axes
    const n = Math.hypot(...u);
    return [{ l, u: [u[0] / n, u[1] / n] }];
  }).flat().filter((e, i, all) => all.findIndex(o => Math.abs(crossOf(o.u, e.u)) < 1e-9 && Math.abs(o.l - e.l) < 1e-9) === i);
}

// The moved plane, the eigenlines (if asked), v before the move (faint) and after (yellow), the line of v
function scene2(p, sc, s, { lines = false, dragV = true, M = at(s) } = {}) {
  morph(p, sc, [s.ix, s.iy], [s.jx, s.jy], s.t);
  if (lines) eigen(at(s, 1)).forEach((e, i) => p.line(0, 0, ...e.u, [COLORS.purple, COLORS.teal][i] + 'cc', { width: 2.5, extend: true }));
  const v = [s.vx, s.vy], w = apply(M, v);
  p.line(0, 0, ...v, 'rgba(255,255,255,0.3)', { width: 1, dash: [6, 5], extend: true });
  p.arrow(0, 0, ...v, 'rgba(255,255,255,0.55)', { width: 2.5 });
  p.arrow(0, 0, ...w, COLORS.yellow, { width: 3.2 });
  p.tex('ev', '\\vec v', ...v, 'rgba(255,255,255,0.75)', { dx: 10, dy: 12 });
  p.tex('eMv', '\\yellow{M\\vec v}', ...w, COLORS.yellow, { dx: 10, dy: -12 });
  if (dragV) p.handle(...v, WHITE_HANDLE, (x, y) => { sc.setParam('vx', snap(x)); sc.setParam('vy', snap(y)); });
}
const WHITE_HANDLE = '#ffffff';

// M·v is it on the line of v? Then say λ
function stays(s, M = at(s, 1)) {
  const v = [s.vx, s.vy], w = apply(M, v);
  if (!s.vx && !s.vy) return t({ en: '\\vec v = \\vec 0', ru: '\\vec v = \\vec 0' });
  if (Math.abs(crossOf(v, w)) > 1e-6) return t({ en: '\\text{left its line}', ru: '\\text{сошёл со своей прямой}' });
  const l = Math.abs(v[0]) > Math.abs(v[1]) ? w[0] / v[0] : w[1] / v[1];
  return `M\\vec v = \\lambda \\vec v,\\ \\ \\lambda = ${r2(l)}`;
}

const MAT = s => `M = \\begin{pmatrix} \\green{${r2(s.ix)}} & \\red{${r2(s.jx)}} \\\\ \\green{${r2(s.iy)}} & \\red{${r2(s.jy)}} \\end{pmatrix}`;

export default {
  view: '2d',
  view2d: WINDOW,
  lab: false,

  setup(scene) {
    scene.ensureParam('ix', 2, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('iy', 1, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('jx', 1, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('jy', 2, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('t', 1, { min: 0, max: 1, step: 0.01 });
    scene.ensureParam('vx', 2, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('vy', 0.5, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('n', 0, { min: 0, max: 8, step: 1 });
    scene.ensureParam('lambda', 0, { min: -4, max: 4, step: 0.5 }); // the student's answer in the second task

    scene.custom.push(
      {
        id: 'off',
        draw2d(p, sc, s) { scene2(p, sc, s); },
        legend: s => `\\begin{gathered} ${MAT(s)},\\quad M${col(s.vx, s.vy)} = \\yellow{${col(...apply(at(s, 1), [s.vx, s.vy]))}} \\\\ ${stays(s)} \\end{gathered}`,
      },
      {
        id: 'lines',
        draw2d(p, sc, s) { scene2(p, sc, s, { lines: true }); },
        legend: s => {
          const es = eigen(at(s, 1));
          const list = es.length
            ? es.map((e, i) => `${['\\purple', '\\teal'][i]}{\\lambda = ${r2(e.l)}}`).join(',\\ ')
            : t({ en: '\\text{no lines stay}', ru: '\\text{ни одна прямая не остаётся}' });
          return `\\begin{gathered} ${MAT(s)}:\\ \\ ${list} \\\\ ${stays(s)} \\end{gathered}`;
        },
      },
      {
        // M applied again and again: the directions of v, Mv, M²v, … (all drawn the same length)
        id: 'power',
        draw2d(p, sc, s) {
          const M = at(s, 1);
          eigen(M).forEach((e, i) => p.line(0, 0, ...e.u, [COLORS.purple, COLORS.teal][i] + '88', { width: 2, extend: true }));
          let v = [s.vx, s.vy];
          for (let k = 0; k <= Math.round(s.n); k++) {
            const L = Math.hypot(...v);
            if (!L) break;
            const u = [3 * v[0] / L, 3 * v[1] / L], last = k === Math.round(s.n);
            p.arrow(0, 0, ...u, last ? COLORS.yellow : `rgba(255,214,102,${0.15 + 0.5 * k / 8})`, { width: last ? 3.2 : 2 });
            v = apply(M, v);
          }
          p.handle(s.vx, s.vy, WHITE_HANDLE, (x, y) => { sc.setParam('vx', snap(x)); sc.setParam('vy', snap(y)); });
        },
        legend: s => `M^{${Math.round(s.n)}}\\,\\vec v`,
      },
      // ---- Tasks ----
      {
        id: 'findV',
        draw2d(p, sc, s) { scene2(p, sc, s); },
        legend: s => `${MAT(s)}`,
      },
      {
        // v is fixed on an eigenline; the student sets λ, a faint arrow λ·v shows the guess
        id: 'findL',
        draw2d(p, sc, s) {
          scene2(p, sc, s, { dragV: false });
          p.arrow(0, 0, s.lambda * s.vx, s.lambda * s.vy, COLORS.orange, { width: 2, dash: [5, 4] });
          p.tex('lv', `\\orange{${r2(s.lambda)}\\,\\vec v}`, s.lambda * s.vx, s.lambda * s.vy, COLORS.orange, { dx: 10, dy: 14 });
        },
        legend: s => `${MAT(s)},\\quad \\vec v = ${col(s.vx, s.vy)},\\quad \\lambda = ${r2(s.lambda)}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'Most arrows leave their line', ru: 'Почти все стрелки сходят со своей прямой' },
      text: {
        en: 'Take the matrix $M = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}$ and an arrow $\\vec v$. The dashed line is the line of $\\vec v$. While the plane moves, $\\yellow{M\\vec v}$ turns away from it: a matrix does not only stretch arrows, it also turns them.',
        ru: 'Возьмём матрицу $M = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}$ и стрелку $\\vec v$. Пунктир — прямая, на которой лежит $\\vec v$. Пока плоскость движется, $\\yellow{M\\vec v}$ отворачивает от неё: матрица не только растягивает стрелки, но и поворачивает их.',
      },
      try: { en: 'Press ▶ next to $t$. Drag the end of $\\vec v$ to other places.', ru: 'Нажмите ▶ возле $t$. Перетаскивайте конец $\\vec v$ в другие места.' },
      state: { show: ['off'], params: { ix: 2, iy: 1, jx: 1, jy: 2, vx: 2, vy: 0.5 }, window: WINDOW, controls: ['t'] },
      enter(scene) {
        scene.setParam('t', 0);
        scene.animateParams({ t: 1 }, 3000);
      },
    },
    {
      title: { en: 'But some lines stay', ru: 'Но некоторые прямые остаются' },
      text: {
        en: 'Some arrows do not turn at all. On the <span class="c-purple">purple</span> line $y = x$ every arrow is stretched $3$ times; on the <span class="c-teal">teal</span> line $y = -x$ it stays as it is. They are <i>eigenvectors</i> of $M$, and the stretch factors are <i>eigenvalues</i>: $$M\\vec v = \\lambda\\,\\vec v.$$ «Eigen» is German for «own»: these are the matrix’s own directions.',
        ru: 'Некоторые стрелки вообще не поворачиваются. На <span class="c-purple">фиолетовой</span> прямой $y = x$ каждая стрелка растягивается в $3$ раза; на <span class="c-teal">бирюзовой</span> $y = -x$ остаётся как есть. Это <i>собственные векторы</i> $M$, а коэффициенты растяжения — <i>собственные значения</i>: $$M\\vec v = \\lambda\\,\\vec v.$$ Это собственные направления матрицы — её «оси».',
      },
      try: { en: 'Put $\\vec v$ on a coloured line and press ▶ next to $t$: the arrow only grows.', ru: 'Положите $\\vec v$ на цветную прямую и нажмите ▶ возле $t$: стрелка только растёт.' },
      check: {
        q: { en: 'Where does $M$ send $\\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$?', ru: 'Куда $M$ переводит $\\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$?' },
        options: [{ text: '$\\begin{pmatrix} 3 \\\\ 3 \\end{pmatrix}$', ok: true }, { text: '$\\begin{pmatrix} 2 \\\\ 2 \\end{pmatrix}$' }, { text: '$\\begin{pmatrix} 3 \\\\ 1 \\end{pmatrix}$' }],
        explain: {
          en: '$1 \\cdot \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix} + 1 \\cdot \\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix} = \\begin{pmatrix} 3 \\\\ 3 \\end{pmatrix} = 3 \\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$: same line, $\\lambda = 3$.',
          ru: '$1 \\cdot \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix} + 1 \\cdot \\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix} = \\begin{pmatrix} 3 \\\\ 3 \\end{pmatrix} = 3 \\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$: та же прямая, $\\lambda = 3$.',
        },
        reveal: scene => scene.animateParams({ vx: 1, vy: 1 }, 1000),
      },
      state: { show: ['lines'], params: { ix: 2, iy: 1, jx: 1, jy: 2, vx: 2, vy: 0.5, t: 1 }, window: WINDOW, controls: ['t'] },
    },
    {
      title: { en: 'λ can be negative', ru: 'λ бывает отрицательным' },
      text: {
        en: 'For $M = \\begin{pmatrix} 1 & 2 \\\\ 2 & 1 \\end{pmatrix}$ the line $y = x$ is stretched $3$ times again, but arrows on $y = -x$ are turned around: $\\lambda = -1$. They still stay on their line — only pointing the other way. And $\\lambda = 0$ would mean the line is squashed to the origin: then $\\det M = 0$.',
        ru: 'У $M = \\begin{pmatrix} 1 & 2 \\\\ 2 & 1 \\end{pmatrix}$ прямая $y = x$ снова растягивается в $3$ раза, а стрелки на $y = -x$ разворачиваются: $\\lambda = -1$. Они всё равно остаются на своей прямой — только смотрят в другую сторону. А $\\lambda = 0$ значило бы, что прямая сплющивается в точку: тогда $\\det M = 0$.',
      },
      try: { en: 'Put $\\vec v$ on the teal line and press ▶ next to $t$.', ru: 'Положите $\\vec v$ на бирюзовую прямую и нажмите ▶ возле $t$.' },
      state: { show: ['lines'], params: { ix: 1, iy: 2, jx: 2, jy: 1, vx: 1.5, vy: -1.5, t: 1 }, window: WINDOW, controls: ['t'] },
    },
    {
      title: { en: 'A rotation has none, a shear has one', ru: 'У поворота — ни одной, у сдвига — одна' },
      text: {
        en: 'A rotation by $90°$ turns <b>every</b> arrow, so no line stays: there are no (real) eigenvectors. A shear $\\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix}$ keeps exactly one line, the $x$ axis, with $\\lambda = 1$; all other arrows lean.',
        ru: 'Поворот на $90°$ поворачивает <b>каждую</b> стрелку, поэтому ни одна прямая не остаётся: (действительных) собственных векторов нет. Сдвиг $\\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix}$ сохраняет ровно одну прямую — ось $x$, с $\\lambda = 1$; остальные стрелки наклоняются.',
      },
      try: { en: 'Drag $\\vec v$ around: for the rotation nothing works.', ru: 'Покрутите $\\vec v$: для поворота ничего не подходит.' },
      check: {
        q: { en: 'Which matrix has the $x$ and $y$ axes as its eigenlines?', ru: 'У какой матрицы собственные прямые — оси $x$ и $y$?' },
        options: [{ text: '$\\begin{pmatrix} 3 & 0 \\\\ 0 & -2 \\end{pmatrix}$', ok: true }, { text: '$\\begin{pmatrix} 0 & 3 \\\\ -2 & 0 \\end{pmatrix}$' }, { text: '$\\begin{pmatrix} 1 & 1 \\\\ 1 & 1 \\end{pmatrix}$' }],
        explain: {
          en: 'A diagonal matrix sends $\\hat\\imath$ to $3\\hat\\imath$ and $\\hat\\jmath$ to $-2\\hat\\jmath$: both stay on their axes. Its eigenvalues are just the numbers on the diagonal.',
          ru: 'Диагональная матрица переводит $\\hat\\imath$ в $3\\hat\\imath$, а $\\hat\\jmath$ в $-2\\hat\\jmath$: обе остаются на своих осях. Её собственные значения — просто числа на диагонали.',
        },
        reveal: scene => scene.animateParams({ ix: 3, iy: 0, jx: 0, jy: -2 }, 1500),
      },
      state: { show: ['lines'], params: { ix: 0, iy: 1, jx: -1, jy: 0, vx: 2, vy: 1, t: 1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Again and again', ru: 'Снова и снова' },
      text: {
        en: 'Apply $M = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}$ to $\\vec v$, then to the result, and so on (all arrows are drawn the same length — only the direction matters). Whatever $\\vec v$ you start with, the arrows swing towards the <span class="c-purple">purple</span> line, the one with the biggest $\\lambda$: along it the arrow grows $3$ times per step, across only $1$ time. This is how Google ranked pages and how vibrations settle into their main mode.',
        ru: 'Применим $M = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}$ к $\\vec v$, потом к результату, и так далее (все стрелки нарисованы одной длины — важно только направление). С какого бы $\\vec v$ ни начать, стрелки разворачиваются к <span class="c-purple">фиолетовой</span> прямой — той, у которой $\\lambda$ больше: вдоль неё стрелка растёт в $3$ раза за шаг, поперёк — в $1$. Так Google ранжировал страницы, и так колебания приходят к своей главной форме.',
      },
      try: { en: 'Press ▶ next to $n$; drag $\\vec v$ to another start.', ru: 'Нажмите ▶ возле $n$; перетащите $\\vec v$ в другое начало.' },
      state: { show: ['power'], params: { ix: 2, iy: 1, jx: 1, jy: 2, vx: 1, vy: -2, n: 0 }, window: WINDOW, controls: ['n'] },
      enter(scene) {
        // Set at once: the animation of n would cancel the move of v to its start
        scene.setParam('vx', 1);
        scene.setParam('vy', -2);
        scene.setParam('n', 0);
        scene.animateParams({ n: 8 }, 5000);
      },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'For $M = \\begin{pmatrix} 3 & 1 \\\\ 0 & 2 \\end{pmatrix}$ find both eigenlines by dragging $\\vec v$. Then think: if a matrix has two eigenlines, take its eigenvectors as a basis — in that basis the matrix just stretches along the axes. That is the idea behind diagonalisation.',
        ru: 'Для $M = \\begin{pmatrix} 3 & 1 \\\\ 0 & 2 \\end{pmatrix}$ найдите обе собственные прямые, перетаскивая $\\vec v$. И подумайте: если у матрицы две собственные прямые, возьмите собственные векторы за базис — в этом базисе матрица просто растягивает вдоль осей. В этом идея диагонализации.',
      },
      state: { show: ['off'], params: { ix: 3, iy: 0, jx: 1, jy: 2, vx: 1, vy: 1, t: 1 }, window: WINDOW, controls: ['t'] },
    },
    {
      title: { en: 'Find an arrow that stays', ru: 'Найдите стрелку, которая не сходит' },
      text: {
        en: 'For $M = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}$ the coloured lines are hidden. Drag $\\vec v$ (not to the origin) so that $\\yellow{M\\vec v}$ stays on the dashed line of $\\vec v$.',
        ru: 'Для $M = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}$ цветные прямые спрятаны. Перетащите $\\vec v$ (не в начало координат) так, чтобы $\\yellow{M\\vec v}$ остался на пунктирной прямой $\\vec v$.',
      },
      task: {
        kind: 'drag',
        target: [-2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5].flatMap(k => [{ vx: k, vy: k }, { vx: k, vy: -k }]),
        back: 1,
        right: {
          en: 'On $y = x$ the arrow is stretched $3$ times, on $y = -x$ it stays the same ($\\lambda = 1$). Both lines work.',
          ru: 'На $y = x$ стрелка растягивается в $3$ раза, на $y = -x$ остаётся прежней ($\\lambda = 1$). Подходят обе прямые.',
        },
        hints: {
          vx: { en: '$M\\vec v$ is off the dashed line. Look which way it turns and move $\\vec v$ the same way: the turn shrinks near an eigenline.', ru: '$M\\vec v$ не на пунктире. Посмотрите, куда он отворачивает, и двигайте $\\vec v$ туда же: возле собственной прямой поворот уменьшается.' },
          vy: { en: '$M\\vec v$ is off the dashed line. Look which way it turns and move $\\vec v$ the same way: the turn shrinks near an eigenline.', ru: '$M\\vec v$ не на пунктире. Посмотрите, куда он отворачивает, и двигайте $\\vec v$ туда же: возле собственной прямой поворот уменьшается.' },
        },
      },
      state: { show: ['findV'], params: { ix: 2, iy: 1, jx: 1, jy: 2, vx: 2, vy: 0.5, t: 1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Find λ', ru: 'Найдите λ' },
      text: {
        en: 'For $M = \\begin{pmatrix} 3 & 1 \\\\ 0 & 2 \\end{pmatrix}$ the arrow $\\vec v = \\begin{pmatrix} 1 \\\\ -1 \\end{pmatrix}$ is an eigenvector. Set $\\lambda$ so that the orange $\\lambda\\vec v$ covers $\\yellow{M\\vec v}$.',
        ru: 'Для $M = \\begin{pmatrix} 3 & 1 \\\\ 0 & 2 \\end{pmatrix}$ стрелка $\\vec v = \\begin{pmatrix} 1 \\\\ -1 \\end{pmatrix}$ — собственный вектор. Подберите $\\lambda$ так, чтобы оранжевая $\\lambda\\vec v$ совпала с $\\yellow{M\\vec v}$.',
      },
      task: {
        kind: 'drag',
        target: { lambda: 2 },
        back: 1,
        right: {
          en: '$M\\vec v = 1 \\cdot \\begin{pmatrix} 3 \\\\ 0 \\end{pmatrix} - 1 \\cdot \\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix} = \\begin{pmatrix} 2 \\\\ -2 \\end{pmatrix} = 2\\vec v$.',
          ru: '$M\\vec v = 1 \\cdot \\begin{pmatrix} 3 \\\\ 0 \\end{pmatrix} - 1 \\cdot \\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix} = \\begin{pmatrix} 2 \\\\ -2 \\end{pmatrix} = 2\\vec v$.',
        },
        mistakes: [
          { params: { lambda: 3 }, text: {
            en: '$3$ is the eigenvalue of the other line, the $x$ axis: $M\\hat\\imath = 3\\hat\\imath$. Compute $M\\vec v$ for this $\\vec v$.',
            ru: '$3$ — собственное значение другой прямой, оси $x$: $M\\hat\\imath = 3\\hat\\imath$. Посчитайте $M\\vec v$ для этого $\\vec v$.' } },
          { params: { lambda: -2 }, text: {
            en: 'The length is right, but $M\\vec v$ points the same way as $\\vec v$, not the opposite: $\\lambda$ is positive.',
            ru: 'Длина верная, но $M\\vec v$ смотрит туда же, куда $\\vec v$, а не наоборот: $\\lambda$ положительное.' } },
        ],
        hints: { lambda: { en: 'The orange arrow does not cover the yellow one yet. $M\\vec v = x\\cdot(\\text{1st column}) + y\\cdot(\\text{2nd column})$.', ru: 'Оранжевая стрелка пока не совпадает с жёлтой. $M\\vec v = x\\cdot(\\text{1-й столбец}) + y\\cdot(\\text{2-й столбец})$.' } },
      },
      state: { show: ['findL'], params: { ix: 3, iy: 0, jx: 1, jy: 2, vx: 1, vy: -1, t: 1, lambda: 0 }, window: WINDOW, controls: ['lambda'] },
    },
    {
      title: { en: 'The eigenvector of a shear', ru: 'Собственный вектор сдвига' },
      text: {
        en: 'For the shear $M = \\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix}$ drag $\\vec v$ (not to the origin) so that $\\yellow{M\\vec v}$ stays on its line.',
        ru: 'Для сдвига $M = \\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix}$ перетащите $\\vec v$ (не в начало координат) так, чтобы $\\yellow{M\\vec v}$ остался на его прямой.',
      },
      task: {
        kind: 'drag',
        target: [-4, -3, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 3, 4].map(k => ({ vx: k, vy: 0 })),
        back: 3,
        right: {
          en: 'A shear slides every point sideways by its height; points at height $0$ do not move. So the $x$ axis is the only eigenline, $\\lambda = 1$.',
          ru: 'Сдвиг смещает каждую точку вбок на её высоту; точки на высоте $0$ стоят. Поэтому ось $x$ — единственная собственная прямая, $\\lambda = 1$.',
        },
        mistakes: [-3, -2, -1, 1, 2, 3].map(k => ({ params: { vx: 0, vy: k }, text: {
          en: 'The $y$ axis is not kept: $M\\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix} = \\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$ — the arrow leans. A shear keeps the horizontal direction, not the vertical one.',
          ru: 'Ось $y$ не сохраняется: $M\\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix} = \\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$ — стрелка наклоняется. Сдвиг сохраняет горизонтальное направление, а не вертикальное.' } })),
        hints: {
          vx: { en: '$M\\vec v$ leans away. Which points does a shear not move at all?', ru: '$M\\vec v$ наклоняется. Какие точки сдвиг вообще не двигает?' },
          vy: { en: '$M\\vec v$ leans away. Which points does a shear not move at all?', ru: '$M\\vec v$ наклоняется. Какие точки сдвиг вообще не двигает?' },
        },
      },
      state: { show: ['findV'], params: { ix: 1, iy: 0, jx: 1, jy: 1, vx: 1, vy: 2, t: 1 }, window: WINDOW, controls: [] },
    },
  ],
};
