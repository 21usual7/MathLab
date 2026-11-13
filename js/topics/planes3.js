// Three equations — three planes. An equation ax + by + cz = d is a plane with the normal (a; b; c); two planes
// meet along a line (infinitely many solutions), a third one cuts the line at a point — the solution. When the
// three normals lie in one plane (det = 0), the planes are all parallel to one line: they form a prism (no
// solutions) or a book (infinitely many).

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';
import { box, section, meet2, meet3, clipLine, add, mul, dot, len, lerp, det3 } from '../core/geom.js';

const RR = 4, ZZ = 4;
const BOX = box(RR, ZZ);
const CAMERA = [11, 1, 5];
const WHITE = '#ffffff';
const r2 = v => fmt(Math.round(v * 100) / 100);

// "2x - y + z = 1" in TeX from the normal and the right side
export function eqTex(n, d) {
  let s = '';
  n.forEach((c, i) => {
    if (Math.abs(c) < 1e-9) return;
    const v = 'xyz'[i], k = Math.abs(c), num = Math.abs(k - 1) < 1e-9 ? '' : r2(k);
    s += s ? ` ${c < 0 ? '-' : '+'} ${num}${v}` : `${c < 0 ? '-' : ''}${num}${v}`;
  });
  return `${s || '0'} = ${r2(d)}`;
}

const N1 = [1, 1, 1], D1 = 3, N2 = [1, -1, 1], D2 = 1, N3 = [2, 1, -1], D3 = 2; // the solution is (1; 1; 1)
const N4 = [2, 0, 2]; // = n₁ + n₂: the third plane for the prism and the book
const COL = [COLORS.blue, COLORS.yellow, COLORS.pink];

// Planes of a system, their common lines (white) and the common point (if there is a single one)
function system(p, key, eqs, { lines = true, point = true } = {}) {
  eqs.forEach(([n, d], i) => p.sheet(`${key}:p${i}`, section(BOX, { n, d }), COL[i], { opacity: 0.2 }));
  if (lines) {
    for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) {
      if (!eqs[i] || !eqs[j]) continue;
      const m = meet2(eqs[i][0], eqs[i][1], eqs[j][0], eqs[j][1]), seg = m && clipLine(m.p, m.u, RR, ZZ);
      if (seg) p.segment(`${key}:l${i}${j}`, seg[0], seg[1], WHITE, { radius: 0.025 });
    }
  }
  if (point && eqs.length === 3) {
    const X = meet3(...eqs.flat());
    if (X && X.every(v => Math.abs(v) < 6)) p.point(`${key}:X`, X, WHITE, 'X', 0.12);
  }
}

const cases = (eqs, colors = COL) => `\\begin{cases} ${eqs.map(([n, d], i) => `\\textcolor{${colors[i]}}{${eqTex(n, d)}}`).join(' \\\\ ')} \\end{cases}`;

// Task 1: the line of the first two planes, the student slides X along it; the third plane is 3x + y + z = 6
const L = meet2(N1, D1, N2, D2); // p = (1; 1; 1), u = (2; 0; −2)
const LA = add(L.p, mul(L.u, -1)), LB = add(L.p, L.u); // from (−1; 1; 3) to (3; 1; −1)
const N5 = [3, 1, 1], D5 = 6;
// Task 3: kx + 2y + z = 2
const NK = k => [k, 2, 1];

export default {
  view: '3d',
  view3d: { R: RR, zmax: ZZ, camera: CAMERA },
  lab: false,

  setup(scene) {
    scene.ensureParam('d', 0, { min: -6, max: 8, step: 0.5 }); // the right side of the single plane
    scene.ensureParam('e', 2, { min: -2, max: 10, step: 0.5 }); // the right side of the third plane (prism, book)
    scene.ensureParam('u', 0.5, { min: 0, max: 1 });
    scene.ensureParam('k', -2, { min: -3, max: 3, step: 0.5 });

    scene.custom.push(
      {
        // One plane x + y + z = d and its normal (1; 1; 1), drawn from the point of the plane closest to the origin
        id: 'one',
        draw3d(p, sc, s) {
          system(p, 'one', [[N1, s.d]]);
          const P = mul(N1, s.d / dot(N1, N1)), n = mul(N1, 1.3 / len(N1));
          p.arrow('one:n', P, add(P, n), COLORS.green, { name: 'n' });
          if (Math.abs(s.d - 3) < 0.01) p.point('one:P', [1, 2, 0], WHITE, '(1; 2; 0)', 0.1);
        },
        legend: s => `\\blue{${eqTex(N1, s.d)}},\\qquad \\green{\\vec n} = (1;\\ 1;\\ 1)`,
      },
      {
        id: 'two',
        draw3d(p) { system(p, 'two', [[N1, D1], [N2, D2]]); },
        legend: () => cases([[N1, D1], [N2, D2]]),
      },
      {
        id: 'three',
        draw3d(p) { system(p, 'three', [[N1, D1], [N2, D2], [N3, D3]]); },
        legend: () => `${cases([[N1, D1], [N2, D2], [N3, D3]])} \\qquad X = (1;\\ 1;\\ 1)`,
      },
      {
        // The normals of the three planes from the origin; the third one can be moved into the plane of the first two
        id: 'normals',
        draw3d(p, sc, s) {
          const n3 = lerp(N3, N4, s.u);
          [N1, N2, n3].forEach((n, i) => p.arrow(`normals:${i}`, [0, 0, 0], n, COL[i], { name: `n<sub>${i + 1}</sub>` }));
          p.sheet('normals:span', section(BOX, { n: [2, 0, -2], d: 0 }), COLORS.grey, { opacity: 0.08 });
        },
        legend: s => {
          const n3 = lerp(N3, N4, s.u);
          return `\\det \\begin{pmatrix} ${[N1, N2, n3].map(n => n.map(r2).join(' & ')).join(' \\\\ ')} \\end{pmatrix} = ${r2(det3(N1, N2, n3))}`;
        },
      },
      {
        // The third plane is 2x + 2z = e: its normal is n₁ + n₂; a prism for e ≠ 4, a book for e = 4
        id: 'prism',
        draw3d(p, sc, s) { system(p, 'prism', [[N1, D1], [N2, D2], [N4, s.e]]); },
        legend: s => cases([[N1, D1], [N2, D2], [N4, s.e]]),
      },
      // ---- Tasks ----
      {
        id: 'slide',
        draw3d(p, sc, s) {
          system(p, 'slide', [[N1, D1], [N2, D2], [N5, D5]], { point: false });
          p.handle('slide:X', LA, LB, s.u, WHITE, u => sc.setParam('u', u), 'X');
        },
        legend: s => {
          const X = lerp(LA, LB, s.u);
          return `${cases([[N1, D1], [N2, D2], [N5, D5]])} \\qquad X = (${X.map(r2).join(';\\ ')})`;
        },
      },
      {
        id: 'book',
        draw3d(p, sc, s) { system(p, 'book', [[N1, D1], [N2, D2], [[1, 3, 1], s.e]]); },
        legend: s => cases([[N1, D1], [N2, D2], [[1, 3, 1], s.e]]),
      },
      {
        id: 'kflat',
        draw3d(p, sc, s) { system(p, 'kflat', [[N1, D1], [N2, D2], [NK(s.k), 2]]); },
        legend: s => cases([[N1, D1], [N2, D2], [NK(s.k), 2]]),
      },
    );
  },

  steps: [
    {
      title: { en: 'One equation is a plane', ru: 'Одно уравнение — плоскость' },
      text: {
        en: 'The points $(x;\\ y;\\ z)$ with $x + y + z = 3$ fill a <span class="c-blue">plane</span>. Its coefficients $(1;\\ 1;\\ 1)$ form the arrow $\\green{\\vec n}$ perpendicular to it — the <i>normal</i>: along the plane the sum $x + y + z$ does not change, and across it, along $\\vec n$, it grows fastest. The right side $d$ only slides the plane along $\\vec n$, parallel to itself.',
        ru: 'Точки $(x;\\ y;\\ z)$, у которых $x + y + z = 3$, заполняют <span class="c-blue">плоскость</span>. Её коэффициенты $(1;\\ 1;\\ 1)$ — это стрелка $\\green{\\vec n}$, перпендикулярная ей, — <i>нормаль</i>: вдоль плоскости сумма $x + y + z$ не меняется, а поперёк, вдоль $\\vec n$, растёт быстрее всего. Правая часть $d$ только сдвигает плоскость вдоль $\\vec n$, параллельно самой себе.',
      },
      try: { en: 'Move $d$ and watch the plane slide along its normal.', ru: 'Двигайте $d$ и смотрите, как плоскость скользит вдоль нормали.' },
      check: {
        q: { en: 'Which point lies on the plane $x + y + z = 3$?', ru: 'Какая точка лежит на плоскости $x + y + z = 3$?' },
        options: [{ text: '$(1;\\ 2;\\ 0)$', ok: true }, { text: '$(3;\\ 3;\\ 3)$' }, { text: '$(1;\\ 1;\\ 3)$' }],
        explain: {
          en: '$1 + 2 + 0 = 3$. A point is on the plane when its coordinates make the equation true. For $(3;\\ 3;\\ 3)$ the sum is $9$, for $(1;\\ 1;\\ 3)$ it is $5$.',
          ru: '$1 + 2 + 0 = 3$. Точка лежит на плоскости, когда её координаты превращают уравнение в верное равенство. У $(3;\\ 3;\\ 3)$ сумма $9$, у $(1;\\ 1;\\ 3)$ — $5$.',
        },
        reveal: scene => scene.animateParams({ d: 3 }, 800),
      },
      state: { show: ['one'], params: { d: 3 }, camera: CAMERA, controls: ['d'] },
    },
    {
      title: { en: 'Two equations — a line', ru: 'Два уравнения — прямая' },
      text: {
        en: 'Add a second equation, $x - y + z = 1$: a <span class="c-yellow">second plane</span>. A solution of both must lie on both planes — on their common <b>line</b>. So two equations with three unknowns have infinitely many solutions: a whole line of them. One more unknown than on the plane, one more equation needed.',
        ru: 'Добавим второе уравнение, $x - y + z = 1$, — <span class="c-yellow">вторую плоскость</span>. Решение обоих должно лежать на обеих плоскостях — на их общей <b>прямой</b>. Поэтому у двух уравнений с тремя неизвестными решений бесконечно много: целая прямая. Неизвестных на одну больше, чем на плоскости, — нужно и на одно уравнение больше.',
      },
      try: { en: 'Turn the scene to look along the white line: both planes become lines crossing at a point.', ru: 'Поверните сцену так, чтобы смотреть вдоль белой прямой: обе плоскости превратятся в прямые, пересекающиеся в точке.' },
      check: {
        q: { en: 'Is $(2;\\ 1;\\ 0)$ a solution of both equations?', ru: 'Является ли $(2;\\ 1;\\ 0)$ решением обоих уравнений?' },
        options: [{ text: { en: 'yes', ru: 'да' }, ok: true }, { text: { en: 'only of the first', ru: 'только первого' } }, { text: { en: 'only of the second', ru: 'только второго' } }],
        explain: {
          en: '$2 + 1 + 0 = 3$ and $2 - 1 + 0 = 1$: both are true, so the point is on the white line. So is $(1;\\ 1;\\ 1)$, and $(0;\\ 1;\\ 2)$ — the line has infinitely many.',
          ru: '$2 + 1 + 0 = 3$ и $2 - 1 + 0 = 1$: оба верны, значит, точка на белой прямой. Как и $(1;\\ 1;\\ 1)$, и $(0;\\ 1;\\ 2)$ — на прямой их бесконечно много.',
        },
      },
      state: { show: ['two'], camera: CAMERA, controls: [] },
    },
    {
      title: { en: 'The third one — a point', ru: 'Третье — точка' },
      text: {
        en: 'The <span class="c-pink">third plane</span>, $2x + y - z = 2$, cuts the white line at one point $X = (1;\\ 1;\\ 1)$. It lies on all three planes, so it is the only solution of the system. Every way of solving — substitution, elimination, Cramer\'s rule — finds this same point where three planes meet.',
        ru: '<span class="c-pink">Третья плоскость</span>, $2x + y - z = 2$, пересекает белую прямую в одной точке $X = (1;\\ 1;\\ 1)$. Она лежит на всех трёх плоскостях — значит, это единственное решение системы. Любой способ решения — подстановка, сложение уравнений, формулы Крамера — находит эту самую точку, где встречаются три плоскости.',
      },
      try: { en: 'Turn the scene: three white lines (each pair of planes has one) all pass through $X$.', ru: 'Поверните сцену: три белые прямые (у каждой пары плоскостей своя) все проходят через $X$.' },
      check: {
        q: { en: 'Subtract the second equation from the first. What do you get?', ru: 'Вычтите из первого уравнения второе. Что получится?' },
        options: [{ text: '$2y = 2$', ok: true }, { text: '$2x + 2z = 4$' }, { text: '$y = 2$' }],
        explain: {
          en: '$(x + y + z) - (x - y + z) = 2y$ and $3 - 1 = 2$: so $y = 1$. That is the plane $y = 1$ through the white line — elimination just swaps planes for simpler ones through the same line.',
          ru: '$(x + y + z) - (x - y + z) = 2y$, а $3 - 1 = 2$: значит, $y = 1$. Это плоскость $y = 1$ через ту же белую прямую — метод сложения просто заменяет плоскости более простыми, проходящими через ту же прямую.',
        },
      },
      state: { show: ['three'], camera: CAMERA, controls: [] },
    },
    {
      title: { en: 'When there is no single point', ru: 'Когда точки нет' },
      text: {
        en: 'A single point exists unless the three normals $\\vec n_1$, $\\vec n_2$, $\\vec n_3$ lie in one plane. Move $u$: the normal of the third plane, $(2;\\ 1;\\ -1)$, turns into $(2;\\ 0;\\ 2) = \\vec n_1 + \\vec n_2$ — into the grey plane of the other two. Then the matrix of coefficients flattens space: its determinant is $0$, as in the topic about volumes. The rows of the system are its normals.',
        ru: 'Единственная точка есть, если только три нормали $\\vec n_1$, $\\vec n_2$, $\\vec n_3$ не лежат в одной плоскости. Двигайте $u$: нормаль третьей плоскости, $(2;\\ 1;\\ -1)$, превращается в $(2;\\ 0;\\ 2) = \\vec n_1 + \\vec n_2$ — попадает в серую плоскость двух других. Тогда матрица коэффициентов сплющивает пространство: её определитель $0$, как в теме про объёмы. Строки системы — это её нормали.',
      },
      try: { en: 'Press ▶ next to $u$ and watch the determinant.', ru: 'Нажмите ▶ возле $u$ и следите за определителем.' },
      state: { show: ['normals'], params: { u: 0 }, camera: CAMERA, controls: ['u'] },
    },
    {
      title: { en: 'No solutions: a prism', ru: 'Решений нет: призма' },
      text: {
        en: 'Here is such a system: the third equation is $2x + 2z = e$, its normal is $\\vec n_1 + \\vec n_2$. Each pair of planes still meets along a line, but the three lines are <b>parallel</b> — the planes form the walls of a triangular tunnel, a prism. No point is on all three: the system has no solutions, though no two planes are parallel.',
        ru: 'Вот такая система: третье уравнение $2x + 2z = e$, его нормаль $\\vec n_1 + \\vec n_2$. Каждая пара плоскостей по-прежнему пересекается по прямой, но три прямые <b>параллельны</b> — плоскости образуют стенки треугольного тоннеля, призмы. Ни одна точка не лежит на всех трёх: решений нет, хотя никакие две плоскости не параллельны.',
      },
      try: { en: 'Turn the scene to look along the tunnel: a triangle. Move $e$ and watch the triangle shrink.', ru: 'Поверните сцену, чтобы смотреть вдоль тоннеля: треугольник. Двигайте $e$ и смотрите, как треугольник сжимается.' },
      check: {
        q: { en: 'Add the first two equations. What does the sum say about $2x + 2z$?', ru: 'Сложите первые два уравнения. Что сумма говорит про $2x + 2z$?' },
        options: [{ text: '$2x + 2z = 4$', ok: true }, { text: '$2x + 2z = 2$' }, { text: { en: 'nothing', ru: 'ничего' } }],
        explain: {
          en: '$(x + y + z) + (x - y + z) = 2x + 2z$ and $3 + 1 = 4$. So any solution of the first two has $2x + 2z = 4$, and the third equation demands $2$: a contradiction. The system has no solutions.',
          ru: '$(x + y + z) + (x - y + z) = 2x + 2z$, а $3 + 1 = 4$. Значит, у любого решения первых двух $2x + 2z = 4$, а третье требует $2$: противоречие. Решений нет.',
        },
      },
      state: { show: ['prism'], params: { e: 2 }, camera: [-8, -3.5, 8.5], controls: ['e'] },
    },
    {
      title: { en: 'Infinitely many: a book', ru: 'Бесконечно много: книжка' },
      text: {
        en: 'Now $e = 4$: the third equation is exactly the sum of the first two. The tunnel has shrunk to nothing, and the three planes go through one line, like the pages of an open book. Every point of that line solves all three: the third equation says nothing new. So with $\\det = 0$ there are two outcomes — no solutions or infinitely many — and never exactly one.',
        ru: 'Теперь $e = 4$: третье уравнение — ровно сумма первых двух. Тоннель сжался в ничто, и три плоскости проходят через одну прямую, как страницы раскрытой книги. Любая точка этой прямой — решение всех трёх: третье уравнение ничего нового не говорит. Так что при $\\det = 0$ два исхода — решений нет или их бесконечно много — и никогда ровно одно.',
      },
      try: { en: 'Move $e$ away from $4$ and back: the book opens into a prism and closes.', ru: 'Уведите $e$ от $4$ и верните: книжка раскрывается в призму и снова закрывается.' },
      state: { show: ['prism'], params: { e: 4 }, camera: [-8, -3.5, 8.5], controls: ['e'] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'Go back to the three planes and find the three white lines. Then think about the cases with parallel planes: two of them parallel, all three parallel. How many solutions, and what is the determinant? And what do three planes through one point look like from far away?',
        ru: 'Вернитесь к трём плоскостям и найдите три белые прямые. Потом подумайте о случаях с параллельными плоскостями: две параллельны, все три параллельны. Сколько решений и каков определитель? И как выглядят издалека три плоскости через одну точку?',
      },
      state: { show: ['three'], camera: [11, -4, 8], rotate: true, controls: [] },
    },
    {
      title: { en: 'Find the solution', ru: 'Найдите решение' },
      text: {
        en: 'The white line is where the first two planes meet. Slide the point $X$ along it to the solution of the whole system — where the third plane, $3x + y + z = 6$, crosses the line.',
        ru: 'Белая прямая — там, где встречаются первые две плоскости. Сдвиньте точку $X$ вдоль неё к решению всей системы — туда, где её пересекает третья плоскость, $3x + y + z = 6$.',
      },
      task: {
        kind: 'drag',
        target: { u: 0.625 },
        tol: 0.02,
        back: 2,
        right: {
          en: '$X = (1.5;\\ 1;\\ 0.5)$: $1.5 + 1 + 0.5 = 3$, $1.5 - 1 + 0.5 = 1$, $4.5 + 1 + 0.5 = 6$. All three are true.',
          ru: '$X = (1.5;\\ 1;\\ 0.5)$: $1.5 + 1 + 0.5 = 3$, $1.5 - 1 + 0.5 = 1$, $4.5 + 1 + 0.5 = 6$. Все три верны.',
        },
        hints: {
          u: u => {
            const X = lerp(LA, LB, u), v = dot(N5, X);
            return {
              en: `Here the first two equations hold, but $3x + y + z = ${r2(v)}$, not $6$. ${v < 6 ? 'Move towards larger $x$.' : 'Move towards smaller $x$.'}`,
              ru: `Здесь первые два уравнения верны, но $3x + y + z = ${r2(v)}$, а не $6$. ${v < 6 ? 'Двигайтесь в сторону больших $x$.' : 'Двигайтесь в сторону меньших $x$.'}`,
            };
          },
        },
      },
      state: { show: ['slide'], params: { u: 0.15 }, camera: CAMERA, controls: [] },
    },
    {
      title: { en: 'Close the book', ru: 'Закройте книжку' },
      text: {
        en: 'The third equation is $x + 3y + z = e$. Choose $e$ so that the system has infinitely many solutions: all three planes through one line.',
        ru: 'Третье уравнение — $x + 3y + z = e$. Подберите $e$ так, чтобы у системы было бесконечно много решений: все три плоскости через одну прямую.',
      },
      task: {
        kind: 'drag',
        target: { e: 5 },
        back: 5,
        right: {
          en: '$(1;\\ 3;\\ 1) = 2\\vec n_1 - \\vec n_2$, so the third equation must be twice the first minus the second: $e = 2 \\cdot 3 - 1 = 5$. Check on a point of the line: $(1;\\ 1;\\ 1)$ gives $1 + 3 + 1 = 5$.',
          ru: '$(1;\\ 3;\\ 1) = 2\\vec n_1 - \\vec n_2$, значит, третье уравнение должно быть удвоенным первым минус второе: $e = 2 \\cdot 3 - 1 = 5$. Проверка на точке прямой: $(1;\\ 1;\\ 1)$ даёт $1 + 3 + 1 = 5$.',
        },
        mistakes: [
          { params: { e: 4 }, text: {
            en: 'That would be right for the sum of the first two equations, $2x + 2z$. But $x + 3y + z$ is not their sum: find which combination of the first two gives these coefficients.',
            ru: 'Это верно для суммы первых двух уравнений, $2x + 2z$. Но $x + 3y + z$ — не их сумма: найдите, какая комбинация первых двух даёт такие коэффициенты.' } },
        ],
        hints: {
          e: { en: 'The planes form a prism: there is no common point. Take any point of the white line of the first two planes, for instance $(2;\\ 1;\\ 0)$, and see what $x + 3y + z$ is there.', ru: 'Плоскости образуют призму: общей точки нет. Возьмите любую точку белой прямой первых двух плоскостей, например $(2;\\ 1;\\ 0)$, и посмотрите, чему там равно $x + 3y + z$.' },
        },
      },
      state: { show: ['book'], params: { e: 2 }, camera: [-8, -3.5, 8.5], controls: ['e'] },
    },
    {
      title: { en: 'No single solution', ru: 'Без единственного решения' },
      text: {
        en: 'The third equation is $kx + 2y + z = 2$. Find $k$ for which the system has <b>no single</b> solution.',
        ru: 'Третье уравнение — $kx + 2y + z = 2$. Найдите $k$, при котором у системы <b>нет единственного</b> решения.',
      },
      task: {
        kind: 'drag',
        target: { k: 1 },
        back: 3,
        right: {
          en: 'At $k = 1$ the normal $(1;\\ 2;\\ 1) = 1.5\\,\\vec n_1 - 0.5\\,\\vec n_2$ lies in the plane of the other two, and $\\det = 2k - 2 = 0$. The planes form a prism: $1.5 \\cdot 3 - 0.5 \\cdot 1 = 4 \\ne 2$, so there are no solutions at all.',
          ru: 'При $k = 1$ нормаль $(1;\\ 2;\\ 1) = 1.5\\,\\vec n_1 - 0.5\\,\\vec n_2$ лежит в плоскости двух других, и $\\det = 2k - 2 = 0$. Плоскости образуют призму: $1.5 \\cdot 3 - 0.5 \\cdot 1 = 4 \\ne 2$, так что решений нет совсем.',
        },
        hints: {
          k: k => {
            const X = meet3(N1, D1, N2, D2, NK(k), 2);
            return X ? {
              en: `At $k = ${r2(k)}$ there is still a single solution, $(${X.map(r2).join(';\\ ')})$. Compute the determinant of the coefficients as an expression in $k$ and make it $0$.`,
              ru: `При $k = ${r2(k)}$ решение ещё единственное: $(${X.map(r2).join(';\\ ')})$. Посчитайте определитель коэффициентов как выражение от $k$ и сделайте его нулём.`,
            } : null;
          },
        },
      },
      state: { show: ['kflat'], params: { k: -2 }, camera: CAMERA, controls: ['k'] },
    },
  ],
};
