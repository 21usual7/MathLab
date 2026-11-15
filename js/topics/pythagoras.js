// The Pythagorean theorem: a² + b² = c². The proof by rearrangement: in a square of side a + b, four copies
// of the triangle leave free either one square c² or two squares a² and b² — the same free area.
// Then the theorem at work: the distance between two points, the length of a vector, a circle.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';

const r2 = v => fmt(Math.round(v * 100) / 100);
const lerp = (a, b, k) => a + (b - a) * k;
const rot = ([x, y], th) => [x * Math.cos(th) - y * Math.sin(th), x * Math.sin(th) + y * Math.cos(th)];
const clampLeg = v => Math.max(0.5, Math.min(6, Math.round(v * 2) / 2));

// The four triangles in a square of side s = a + b. Each is [right-angle vertex, end of leg a, end of leg b],
// listed so that both places have the same orientation: a triangle gets there by a turn and a slide, not a flip.
// m = 0: around a tilted square c²; m = 1: two rectangles a × b, free squares a² and b².
export function triangles(a, b) {
  const s = a + b;
  return [
    [[[0, 0], [a, 0], [0, b]], [[0, 0], [a, 0], [0, b]]],
    [[[s, 0], [s, a], [a, 0]], [[a, b], [0, b], [a, 0]]],
    [[[s, s], [b, s], [s, a]], [[s, b], [s, s], [a, b]]],
    [[[0, s], [0, b], [b, s]], [[a, s], [a, b], [s, s]]],
  ];
}
// A triangle moved rigidly part m of the way: turn about its right angle and slide it
export function moved([from, to], m) {
  const ang = v => Math.atan2(v[1], v[0]);
  const u = [from[1][0] - from[0][0], from[1][1] - from[0][1]], w = [to[1][0] - to[0][0], to[1][1] - to[0][1]];
  let d = ang(w) - ang(u);
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const c = [lerp(from[0][0], to[0][0], m), lerp(from[0][1], to[0][1], m)];
  return from.map(P => { const q = rot([P[0] - from[0][0], P[1] - from[0][1]], d * m); return [c[0] + q[0], c[1] + q[1]]; });
}

const TRI = { cx: 0.6, cy: 1.2, unit: 46 };
const BOX = (s = 7) => ({ cx: s / 2, cy: s / 2, unit: 50, fit: [s + 2.5, s + 2.5] });

export default {
  view: '2d',
  view2d: TRI,
  lab: false,

  setup(scene) {
    scene.ensureParam('a', 3, { min: 0.5, max: 6, step: 0.5 });
    scene.ensureParam('b', 4, { min: 0.5, max: 6, step: 0.5 });
    scene.ensureParam('m', 0, { min: 0, max: 1, step: 0.01 }); // how far the triangles are rearranged
    scene.ensureParam('px', 1, { min: -6, max: 6, step: 1 }); // two points for the distance
    scene.ensureParam('py', 1, { min: -6, max: 6, step: 1 });
    scene.ensureParam('qx', 5, { min: -6, max: 6, step: 1 });
    scene.ensureParam('qy', 4, { min: -6, max: 6, step: 1 });

    scene.custom.push(
      {
        // The right triangle with the squares on its three sides; the legs are dragged by their ends
        id: 'tri',
        draw2d(p, sc, s) {
          const { a, b } = s, c = Math.hypot(a, b);
          p.fill([[0, 0], [a, 0], [a, -a], [0, -a]], COLORS.blue + '40');
          p.fill([[0, 0], [0, b], [-b, b], [-b, 0]], COLORS.green + '40');
          p.fill([[a, 0], [0, b], [b, a + b], [a + b, a]], COLORS.red + '40');
          p.polyline([[0, 0], [a, 0], [0, b], [0, 0]], '#ffffff', 2.5);
          p.polyline([[0.35, 0], [0.35, 0.35], [0, 0.35]], 'rgba(255,255,255,0.6)', 1.2);
          p.tex('tA', `a^2 = ${r2(a * a)}`, a / 2, -a / 2, COLORS.blue, { dx: 0, dy: 0, align: 'center' });
          p.tex('tB', `b^2 = ${r2(b * b)}`, -b / 2, b / 2, COLORS.green, { dx: 0, dy: 0, align: 'center' });
          p.tex('tC', `c^2 = ${r2(c * c)}`, (a + b) / 2, (a + b) / 2, COLORS.red, { dx: 0, dy: 0, align: 'center' });
          p.tex('la', 'a', a / 2, 0, COLORS.blue, { dx: 0, dy: 14, align: 'center' });
          p.tex('lb', 'b', 0, b / 2, COLORS.green, { dx: -14, dy: 0, align: 'center' });
          p.handle(a, 0, COLORS.blue, x => sc.setParam('a', clampLeg(x)));
          p.handle(0, b, COLORS.green, (x, y) => sc.setParam('b', clampLeg(y)));
        },
        legend: s => `\\blue{a^2} + \\green{b^2} = ${r2(s.a * s.a)} + ${r2(s.b * s.b)} = ${r2(s.a * s.a + s.b * s.b)},\\qquad \\red{c^2} = ${r2(s.a * s.a + s.b * s.b)},\\ \\ c = ${r2(Math.hypot(s.a, s.b))}`,
      },
      {
        // The proof: four triangles in the square of side a + b
        id: 'box',
        draw2d(p, sc, s) {
          const { a, b, m } = s, S = a + b;
          if (m < 0.02) p.fill([[a, 0], [S, a], [b, S], [0, b]], COLORS.red + '55');
          if (m > 0.98) {
            p.fill([[0, b], [a, b], [a, S], [0, S]], COLORS.blue + '55');
            p.fill([[a, 0], [S, 0], [S, b], [a, b]], COLORS.green + '55');
            p.tex('bA', 'a^2', a / 2, b + a / 2, COLORS.blue, { dx: 0, dy: 0, align: 'center' });
            p.tex('bB', 'b^2', a + b / 2, b / 2, COLORS.green, { dx: 0, dy: 0, align: 'center' });
          }
          if (m < 0.02) p.tex('bC', 'c^2', S / 2, S / 2, COLORS.red, { dx: 0, dy: 0, align: 'center' });
          triangles(a, b).forEach(tr => {
            const pts = moved(tr, m);
            p.fill(pts, 'rgba(244,211,94,0.28)');
            p.polyline([...pts, pts[0]], COLORS.yellow, 2);
          });
          p.polyline([[0, 0], [S, 0], [S, S], [0, S], [0, 0]], '#ffffff', 2.5);
          p.tex('bs', 'a + b', S / 2, 0, '#b9c1cd', { dx: 0, dy: 16, align: 'center' });
        },
        legend: s => (s.m < 0.02
          ? `(a + b)^2 = 4 \\cdot \\yellow{\\tfrac{ab}{2}} + \\red{c^2}`
          : s.m > 0.98 ? `(a + b)^2 = 4 \\cdot \\yellow{\\tfrac{ab}{2}} + \\blue{a^2} + \\green{b^2}` : `\\text{${t({ en: 'moving the triangles…', ru: 'перекладываем треугольники…' })}}`),
      },
      {
        // The free corner of the first arrangement really is a square: its corners are 90°
        id: 'corner',
        draw2d(p, sc, s) {
          const { a, b } = s, S = a + b;
          const at = [a, 0], u = [-a, b], v = [S - a, a], k = 0.45 / Math.hypot(...u), l = 0.45 / Math.hypot(...v);
          p.polyline([[at[0] + u[0] * k, at[1] + u[1] * k], [at[0] + u[0] * k + v[0] * l, at[1] + u[1] * k + v[1] * l], [at[0] + v[0] * l, at[1] + v[1] * l]], '#ffffff', 1.6);
          p.tex('cα', '\\alpha', a - 0.55, 0.22, COLORS.teal, { dx: 0, dy: 0, align: 'center' });
          p.tex('cβ', '\\beta', a + 0.6, 0.18, COLORS.purple, { dx: 0, dy: 0, align: 'center' });
        },
      },
      {
        // The theorem at work: the distance between two points of the grid
        id: 'dist',
        draw2d(p, sc, s) {
          const P = [s.px, s.py], Q = [s.qx, s.qy];
          p.line(...P, Q[0], P[1], COLORS.blue, { width: 2.5 });
          p.line(Q[0], P[1], ...Q, COLORS.green, { width: 2.5 });
          p.line(...P, ...Q, COLORS.red, { width: 3 });
          p.tex('dx', `${Math.abs(Q[0] - P[0])}`, (P[0] + Q[0]) / 2, P[1], COLORS.blue, { dx: 0, dy: 14, align: 'center' });
          p.tex('dy', `${Math.abs(Q[1] - P[1])}`, Q[0], (P[1] + Q[1]) / 2, COLORS.green, { dx: 14, dy: 0, align: 'center' });
          const snap = v => Math.max(-6, Math.min(6, Math.round(v)));
          p.handle(...P, '#ffffff', (x, y) => { sc.setParam('px', snap(x)); sc.setParam('py', snap(y)); });
          p.handle(...Q, '#ffffff', (x, y) => { sc.setParam('qx', snap(x)); sc.setParam('qy', snap(y)); });
          p.tex('dP', 'A', ...P, '#ffffff', { dx: -16, dy: -12 });
          p.tex('dQ', 'B', ...Q, '#ffffff', { dx: 10, dy: -12 });
        },
        legend: s => {
          const dx = s.qx - s.px, dy = s.qy - s.py;
          return `|AB| = \\sqrt{\\blue{${Math.abs(dx)}}^2 + \\green{${Math.abs(dy)}}^2} = \\sqrt{${dx * dx + dy * dy}} = \\red{${r2(Math.hypot(dx, dy))}}`;
        },
      },
      {
        // The task: a = 5 fixed, the student drags b until c = 13
        id: 'task13',
        draw2d(p, sc, s) {
          const a = 5, b = s.b, c = Math.hypot(a, b);
          p.polyline([[0, 0], [a, 0], [0, b], [0, 0]], '#ffffff', 2.5);
          p.tex('ta', 'a = 5', a / 2, 0, COLORS.blue, { dx: 0, dy: 14, align: 'center' });
          p.tex('tc', `c = ${r2(c)}`, a / 2, b / 2, COLORS.red, { dx: 12, dy: -10 });
          p.handle(0, b, COLORS.green, (x, y) => sc.setParam('b', Math.max(0.5, Math.min(14, Math.round(y * 2) / 2))));
          p.tex('tb', `b = ${r2(b)}`, 0, b / 2, COLORS.green, { dx: -14, dy: 0, align: 'right' });
        },
        legend: s => `5^2 + \\green{${r2(s.b)}}^2 = ${r2(25 + s.b * s.b)},\\qquad ${t({ en: '\\text{goal}', ru: '\\text{цель}' })}:\\ c^2 = 13^2 = 169`,
      },
    );
  },

  steps: [
    {
      title: { en: 'Three squares on a right triangle', ru: 'Три квадрата на прямоугольном треугольнике' },
      text: {
        en: 'A right triangle has legs $a$, $b$ and the long side $c$ opposite the right angle, the hypotenuse. Build a square on each side. Drag the ends of the legs and watch the areas: the two small squares together are always exactly as big as the large one. $a^2 + b^2 = c^2$ — this is the Pythagorean theorem.',
        ru: 'У прямоугольного треугольника катеты $a$, $b$ и длинная сторона $c$ напротив прямого угла — гипотенуза. Построим квадрат на каждой стороне. Тяните концы катетов и смотрите на площади: два маленьких квадрата вместе всегда ровно такие же, как большой. $a^2 + b^2 = c^2$ — это и есть теорема Пифагора.',
      },
      try: { en: 'Make $a = 6$, $b = 8$: what is $c$?', ru: 'Сделайте $a = 6$, $b = 8$: чему равно $c$?' },
      check: {
        q: { en: 'Legs $3$ and $4$. The hypotenuse?', ru: 'Катеты $3$ и $4$. Гипотенуза?' },
        options: [{ text: '$5$', ok: true }, { text: '$7$' }, { text: '$25$' }],
        explain: {
          en: '$3^2 + 4^2 = 9 + 16 = 25 = 5^2$. Not $7$: lengths do not add, areas of squares do. And $25$ is $c^2$, not $c$.',
          ru: '$3^2 + 4^2 = 9 + 16 = 25 = 5^2$. Не $7$: складываются не длины, а площади квадратов. А $25$ — это $c^2$, а не $c$.',
        },
        reveal: scene => scene.animateParams({ a: 3, b: 4 }, 700),
      },
      state: { show: ['tri'], params: { a: 2, b: 3 }, window: TRI, controls: ['a', 'b'] },
    },
    {
      proof: true,
      statement: {
        en: '<b>The Pythagorean theorem.</b> In a right triangle with legs $a$, $b$ and hypotenuse $c$: $a^2 + b^2 = c^2$.',
        ru: '<b>Теорема Пифагора.</b> В прямоугольном треугольнике с катетами $a$, $b$ и гипотенузой $c$: $a^2 + b^2 = c^2$.',
      },
      title: { en: 'Four triangles in a square', ru: 'Четыре треугольника в квадрате' },
      text: {
        en: 'Take a square of side $a + b$ and put four copies of our triangle in its corners, as in the picture. The free middle has four sides $c$. Its corners are right angles: at each of them the angles $\\alpha$ and $\\beta$ of two triangles meet, and $\\alpha + \\beta = 90°$ (the angles of a triangle add up to $180°$). So the middle is a square of area $c^2$.',
        ru: 'Возьмём квадрат со стороной $a + b$ и положим в его углы четыре копии нашего треугольника, как на картинке. У свободной середины четыре стороны $c$. Её углы прямые: в каждом сходятся углы $\\alpha$ и $\\beta$ двух треугольников, а $\\alpha + \\beta = 90°$ (сумма углов треугольника — $180°$). Значит, середина — квадрат площади $c^2$.',
      },
      state: { show: ['box', 'corner'], params: { a: 3, b: 4, m: 0 }, window: BOX(7), controls: [] },
    },
    {
      proof: true,
      title: { en: 'Move the triangles', ru: 'Переложим треугольники' },
      text: {
        en: 'Now move the same four triangles inside the same square: put them together in pairs into two rectangles $a \\times b$. The free space is now two squares: $a^2$ and $b^2$. Move $m$ back and forth — the triangles only move, they do not change.',
        ru: 'Теперь переложим те же четыре треугольника внутри того же квадрата: сложим их попарно в два прямоугольника $a \\times b$. Свободное место теперь — два квадрата: $a^2$ и $b^2$. Двигайте $m$ туда и обратно — треугольники только перемещаются, но не меняются.',
      },
      state: { show: ['box'], params: { a: 3, b: 4, m: 1 }, ms: 2200, window: BOX(7), controls: ['m'] },
    },
    {
      proof: true,
      title: { en: 'The same free space', ru: 'То же свободное место' },
      text: {
        en: 'The big square is the same, and the four triangles take the same area. So the free space is the same too: in the first picture it is $c^2$, in the second $a^2 + b^2$. Therefore $a^2 + b^2 = c^2$. Change $a$ and $b$: the argument never used particular numbers. $\\blacksquare$',
        ru: 'Большой квадрат тот же, и четыре треугольника занимают ту же площадь. Значит, и свободное место одно и то же: на первой картинке это $c^2$, на второй — $a^2 + b^2$. Поэтому $a^2 + b^2 = c^2$. Меняйте $a$ и $b$: рассуждение нигде не использовало конкретные числа. $\\blacksquare$',
      },
      state: { show: ['box'], params: { a: 2.5, b: 4.5, m: 0 }, window: BOX(7), controls: ['m', 'a', 'b'] },
    },
    {
      title: { en: 'Where it lives in grades 10–11', ru: 'Где это в 10–11 классе' },
      text: {
        en: 'The distance between two points is a hypotenuse: the legs are the differences of the coordinates, $|AB| = \\sqrt{\\Delta x^2 + \\Delta y^2}$. The same formula is the <b>length of a vector</b> $\\sqrt{x^2 + y^2}$, and all points at distance $r$ from the origin give the <b>circle</b> $x^2 + y^2 = r^2$. In space use it twice: $\\sqrt{x^2 + y^2 + z^2}$. And the scalar product $\\vec v \\cdot \\vec v = |\\vec v|^2$ is Pythagoras in disguise.',
        ru: 'Расстояние между двумя точками — гипотенуза: катеты — разности координат, $|AB| = \\sqrt{\\Delta x^2 + \\Delta y^2}$. Та же формула — <b>длина вектора</b> $\\sqrt{x^2 + y^2}$, а все точки на расстоянии $r$ от начала координат дают <b>окружность</b> $x^2 + y^2 = r^2$. В пространстве применим её дважды: $\\sqrt{x^2 + y^2 + z^2}$. А скалярное произведение $\\vec v \\cdot \\vec v = |\\vec v|^2$ — это Пифагор в другой одежде.',
      },
      try: { en: 'Drag $A$ and $B$ over the grid. Find two points at distance exactly $5$ that are not on one horizontal or vertical line.', ru: 'Тяните $A$ и $B$ по сетке. Найдите две точки на расстоянии ровно $5$, не лежащие на одной горизонтали или вертикали.' },
      state: { show: ['dist'], window: { cx: 2, cy: 2, unit: 46 }, controls: [] },
    },
    {
      title: { en: 'Find the other leg', ru: 'Найдите второй катет' },
      text: {
        en: 'One leg is $5$. Drag the other one so that the hypotenuse is exactly $13$.',
        ru: 'Один катет равен $5$. Тяните второй так, чтобы гипотенуза стала ровно $13$.',
      },
      task: {
        kind: 'drag',
        target: { b: 12 },
        tol: 0.1,
        back: 0,
        right: {
          en: '$5^2 + 12^2 = 25 + 144 = 169 = 13^2$. Triples of whole numbers like $(3, 4, 5)$ and $(5, 12, 13)$ are called Pythagorean.',
          ru: '$5^2 + 12^2 = 25 + 144 = 169 = 13^2$. Тройки целых чисел вроде $(3, 4, 5)$ и $(5, 12, 13)$ называют пифагоровыми.',
        },
        mistakes: [
          { params: { b: 8 }, text: { en: 'This is $13 - 5$. Lengths do not subtract — squares do: $b^2 = 13^2 - 5^2$.', ru: 'Это $13 - 5$. Вычитаются не длины, а квадраты: $b^2 = 13^2 - 5^2$.' } },
        ],
        hints: { b: { en: '$b^2 = c^2 - a^2 = 169 - 25$.', ru: '$b^2 = c^2 - a^2 = 169 - 25$.' } },
      },
      state: { show: ['task13'], params: { b: 3 }, window: { cx: 2.5, cy: 6, unit: 40, fit: [12, 16] }, controls: [] },
    },
  ],
};
