// Similar triangles. A lamp throws the shadow of a triangle onto a wall: every side grows k times, the angles
// stay. Two equal angles are enough — the sun makes the shadows of a stick and a tree similar, and the stick
// measures the tree. Areas grow k² times: a triangle twice as big is tiled by four copies.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';

const WHITE = '#ffffff';
const VIEW = { cx: 2.5, cy: 2.5, unit: 50, fit: [11, 6.5] };
const r2 = v => fmt(Math.round(v * 100) / 100);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const O = [-2, 1]; // the lamp
const T = [[-1, 1.3], [0.4, 1.1], [-0.4, 2.1]];
const scale = (P, k) => [O[0] + k * (P[0] - O[0]), O[1] + k * (P[1] - O[1])];
const len = (P, Q) => Math.hypot(Q[0] - P[0], Q[1] - P[1]);
const tri = (p, S, color, fill) => { p.fill(S, fill); p.polyline([...S, S[0]], color, 2.5); };

export default {
  view: '2d',
  view2d: VIEW,
  lab: false,

  setup(scene) {
    scene.ensureParam('k', 2, { min: 1, max: 4, step: 0.05 });
    scene.ensureParam('sun', 50, { min: 25, max: 70, step: 1 }); // the height of the sun, in degrees
    scene.ensureParam('n', 2, { min: 1, max: 4, step: 1 }); // the scale for the tiling
    scene.ensureParam('H', 3, { min: 0.5, max: 10, step: 0.1 }); // the height of the tree in the task

    scene.custom.push(
      {
        // The lamp O, the triangle and its k-times copy; rays from O through the vertices
        id: 'lamp',
        draw2d(p, sc, s) {
          const S = T.map(P => scale(P, s.k));
          S.forEach(P => p.line(...O, ...P, COLORS.yellow + '55', { width: 1, dash: [4, 5] }));
          tri(p, S, COLORS.blue, COLORS.blue + '22');
          tri(p, T, COLORS.yellow, COLORS.yellow + '44');
          p.dot(...O, COLORS.yellow, 7);
          p.tex('lo', 'O', ...O, COLORS.yellow, { dx: -16, dy: -8 });
          p.handle(...S[1], COLORS.blue, (x, y) => {
            const k = ((x - O[0]) * (T[1][0] - O[0]) + (y - O[1]) * (T[1][1] - O[1])) / len(O, T[1]) ** 2;
            sc.setParam('k', clamp(Math.round(k * 20) / 20, 1, 4));
          });
        },
        legend: s => `\\frac{\\blue{A'B'}}{\\yellow{AB}} = \\frac{${r2(s.k * len(T[0], T[1]))}}{${r2(len(T[0], T[1]))}} = ${r2(s.k)},\\quad \\frac{\\blue{B'C'}}{\\yellow{BC}} = ${r2(s.k)}`,
      },
      {
        // A stick and a tree in the sun: the shadows make two similar right triangles
        id: 'sun',
        draw2d(p, sc, s) {
          const tn = Math.tan(s.sun * Math.PI / 180), stick = 1, tree = 5;
          p.line(-1, 0, 10, 0, '#8b95a7', { width: 2 });
          [[0, stick, COLORS.yellow], [3, tree, COLORS.green]].forEach(([x, h, c]) => {
            const L = h / tn;
            p.fill([[x, 0], [x, h], [x + L, 0]], c + '22');
            p.line(x, 0, x, h, c, { width: 5 });
            p.line(x, h, x + L, 0, COLORS.yellow + 'aa', { width: 1.5, dash: [5, 4] });
            p.line(x, 0, x + L, 0, '#1b2230', { width: 6 });
            p.tex('sh' + x, r2(L), x + L / 2, 0, '#b9c1cd', { dx: 0, dy: 18, align: 'center' });
            p.tex('hh' + x, r2(h), x, h / 2, c, { dx: -8, dy: 0, align: 'right' });
          });
        },
        legend: s => {
          const tn = Math.tan(s.sun * Math.PI / 180);
          return `\\frac{\\green{5}}{${r2(5 / tn)}} = \\frac{\\yellow{1}}{${r2(1 / tn)}} = ${r2(tn)}`;
        },
      },
      {
        // A triangle n times larger tiled by n² copies of the small one
        id: 'tiles',
        draw2d(p, sc, s) {
          const a = [1.8, 0], b = [0.7, 1.5], n = s.n;
          for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) {
            const P = [i * a[0] + j * b[0], i * a[1] + j * b[1]];
            tri(p, [P, [P[0] + a[0], P[1] + a[1]], [P[0] + b[0], P[1] + b[1]]], COLORS.yellow, COLORS.yellow + '33');
            if (j < n - i - 1) {
              const Q = [P[0] + a[0], P[1] + a[1]];
              tri(p, [Q, [Q[0] + b[0], Q[1] + b[1]], [P[0] + b[0], P[1] + b[1]]], COLORS.yellow, COLORS.yellow + '33');
            }
          }
          p.polyline([[0, 0], [n * a[0], n * a[1]], [n * b[0], n * b[1]], [0, 0]], WHITE, 3);
        },
        legend: s => `k = ${s.n}:\\quad ${s.n * s.n}\\ \\text{${t({ en: 'copies', ru: 'копий' })}},\\quad S' = ${s.n}^2 \\cdot S`,
      },
      {
        // The task: a stick of 1 m casts 0.8 m, the tree casts 6 m — drag the top of the tree
        id: 'tree',
        draw2d(p, sc, s) {
          p.line(-1, 0, 10, 0, '#8b95a7', { width: 2 });
          p.line(0, 0, 0, 1, COLORS.yellow, { width: 5 });
          p.line(0, 0, 0.8, 0, '#1b2230', { width: 6 });
          p.line(0, 1, 0.8, 0, COLORS.yellow + 'aa', { width: 1.5, dash: [5, 4] });
          p.tex('t1', '1', 0, 0.5, COLORS.yellow, { dx: -8, dy: 0, align: 'right' });
          p.tex('t08', '0.8', 0.4, 0, '#b9c1cd', { dx: 0, dy: 18, align: 'center' });
          p.line(2, 0, 2, s.H, COLORS.green, { width: 6 });
          p.line(2, 0, 8, 0, '#1b2230', { width: 6 });
          p.line(2, s.H, 8, 0, COLORS.yellow + 'aa', { width: 1.5, dash: [5, 4] });
          p.tex('t6', '6', 5, 0, '#b9c1cd', { dx: 0, dy: 18, align: 'center' });
          p.handle(2, s.H, COLORS.green, (x, y) => sc.setParam('H', clamp(Math.round(y * 10) / 10, 0.5, 10)));
          p.tex('tH', `H = ${r2(s.H)}`, 2, s.H, COLORS.green, { dx: 12, dy: -6 });
        },
      },
    );
  },

  steps: [
    {
      title: { en: 'A lamp and a shadow', ru: 'Лампа и тень' },
      text: {
        en: 'A lamp $O$ shines through a small <span class="c-yellow">triangle</span> and throws its shadow further on. Every vertex moves along its ray $k$ times further from $O$, so every side becomes $k$ times longer — and the angles do not change at all. Triangles with equal angles and proportional sides are called <b>similar</b>; $k$ is the scale.',
        ru: 'Лампа $O$ светит сквозь маленький <span class="c-yellow">треугольник</span> и отбрасывает его тень дальше. Каждая вершина уходит по своему лучу в $k$ раз дальше от $O$, поэтому каждая сторона становится в $k$ раз длиннее — а углы не меняются вовсе. Треугольники с равными углами и пропорциональными сторонами называют <b>подобными</b>, $k$ — коэффициент подобия.',
      },
      try: { en: 'Drag the blue vertex: the ratio is the same for all sides.', ru: 'Тяните синюю вершину: отношение одно и то же для всех сторон.' },
      state: { show: ['lamp'], params: { k: 2 }, window: VIEW, controls: ['k'] },
    },
    {
      title: { en: 'Measure a tree with a stick', ru: 'Измерить дерево палкой' },
      text: {
        en: 'The sun is so far away that its rays are parallel. A stick and a tree stand upright, the rays fall at the same angle: two right triangles with equal angles. <b>Two equal angles are enough</b> for similarity (the third is then equal too — the sum is $180°$). So height over shadow is the same for both: a one-metre stick measures the tree.',
        ru: 'Солнце так далеко, что его лучи параллельны. Палка и дерево стоят вертикально, лучи падают под одним углом: два прямоугольных треугольника с равными углами. <b>Двух равных углов достаточно</b> для подобия (третий тогда тоже равен — сумма $180°$). Поэтому высота, делённая на тень, у обоих одна и та же: метровая палка измеряет дерево.',
      },
      try: { en: 'Move the sun: both shadows change, the ratio stays shared.', ru: 'Двигайте солнце: обе тени меняются, а отношение остаётся общим.' },
      state: { show: ['sun'], params: { sun: 35 }, window: { cx: 4.5, cy: 2.3, unit: 50, fit: [12, 6] }, controls: ['sun'] },
    },
    {
      proof: true,
      statement: {
        en: '<b>Theorem.</b> If one triangle is similar to another with scale $k$, its area is $k^2$ times as large.',
        ru: '<b>Теорема.</b> Если треугольник подобен другому с коэффициентом $k$, его площадь больше в $k^2$ раз.',
      },
      title: { en: 'Areas grow as k²', ru: 'Площади растут как k²' },
      text: {
        en: 'Make a triangle $2$ times larger: it is tiled by $4$ copies of the small one. $3$ times: $9$ copies. The sides grow $k$ times, but the area grows in both directions at once — $k \\cdot k = k^2$. For any $k$ the same: the area is base times height over two, and both grow $k$ times. $\\blacksquare$',
        ru: 'Увеличим треугольник в $2$ раза: он складывается из $4$ копий маленького. В $3$ раза — из $9$. Стороны растут в $k$ раз, а площадь растёт сразу в двух направлениях — в $k \\cdot k = k^2$. Для любого $k$ то же: площадь — основание на высоту пополам, и оба множителя растут в $k$ раз. $\\blacksquare$',
      },
      check: {
        q: { en: 'A map at scale $1 : 1000$. A field on it is $3\\ \\text{cm}^2$. How much larger is the real field?', ru: 'Карта в масштабе $1 : 1000$. Поле на ней — $3\\ \\text{см}^2$. Во сколько раз реальное поле больше?' },
        options: [{ text: '$1\\,000\\,000$', ok: true }, { text: '$1000$' }, { text: '$3000$' }],
        explain: {
          en: 'Lengths are $1000$ times larger, areas $1000^2 = 1\\,000\\,000$ times: $3\\ \\text{cm}^2$ on the map are $300\\ \\text{m}^2$ on the ground.',
          ru: 'Длины больше в $1000$ раз, площади — в $1000^2 = 1\\,000\\,000$ раз: $3\\ \\text{см}^2$ на карте — это $300\\ \\text{м}^2$ на земле.',
        },
      },
      state: { show: ['tiles'], params: { n: 2 }, window: { cx: 4.5, cy: 3, unit: 80, fit: [11, 7] }, controls: ['n'] },
    },
    {
      title: { en: 'How tall is the tree?', ru: 'Какой высоты дерево?' },
      text: {
        en: 'A stick of $1$ m casts a shadow of $0.8$ m. The tree next to it casts $6$ m. Drag the top of the tree to its real height.',
        ru: 'Палка длиной $1$ м отбрасывает тень $0.8$ м. Дерево рядом — тень $6$ м. Поднимите верхушку дерева на его настоящую высоту.',
      },
      task: {
        kind: 'drag',
        target: { H: 7.5 },
        tol: 0.05,
        back: 1,
        right: {
          en: '$\\frac{H}{6} = \\frac{1}{0.8}$, so $H = 7.5$ m. The dashed rays are now parallel — the triangles are similar.',
          ru: '$\\frac{H}{6} = \\frac{1}{0.8}$, значит, $H = 7.5$ м. Пунктирные лучи теперь параллельны — треугольники подобны.',
        },
        mistakes: [
          { params: { H: 4.8 }, text: { en: 'This is $6 \\cdot 0.8$: the ratio is upside down. The tree is <b>taller</b> than its shadow, like the stick.', ru: 'Это $6 \\cdot 0.8$: отношение перевёрнуто. Дерево <b>выше</b> своей тени, как и палка.' } },
          { params: { H: 6.2 }, text: { en: 'Adding the difference $0.2$ does not work: similar means <b>times</b>, not <b>plus</b>.', ru: 'Прибавить разницу $0.2$ нельзя: подобие — это «во столько-то <b>раз</b>», а не «на столько-то больше».' } },
        ],
        hints: { H: { en: 'Make the two dashed rays parallel.', ru: 'Сделайте два пунктирных луча параллельными.' } },
      },
      state: { show: ['tree'], params: { H: 3 }, window: { cx: 4, cy: 4, unit: 50, fit: [11, 10] }, controls: [] },
    },
  ],
};
