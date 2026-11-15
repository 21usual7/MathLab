// Areas by cutting and moving. A rectangle is counted in unit squares. A parallelogram loses a triangle on one
// side and gets it back on the other — a rectangle with the same base and height. Two copies of a triangle make
// a parallelogram, so a triangle is half; sliding its apex along a parallel line keeps the area. Two copies of
// a trapezoid make a parallelogram with base a + b.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';

const WHITE = '#ffffff';
const VIEW = { cx: 3, cy: 1.8, unit: 50, fit: [11, 6] };
const r2 = v => fmt(Math.round(v * 100) / 100);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const shape = (p, S, color, fill, w = 2.5) => { p.fill(S, fill); p.polyline([...S, S[0]], color, w); };
const height = (p, x, h, key) => {
  p.line(x, 0, x, h, WHITE + 'aa', { width: 1.5, dash: [4, 4] });
  p.tex(key, 'h', x, h / 2, WHITE, { dx: 6, dy: 0 });
};

export default {
  view: '2d',
  view2d: VIEW,
  lab: false,

  setup(scene) {
    scene.ensureParam('a', 4, { min: 1, max: 6, step: 1 });
    scene.ensureParam('b', 3, { min: 1, max: 4, step: 1 });
    scene.ensureParam('m', 0, { min: 0, max: 1, step: 0.01 });
    scene.ensureParam('tx', 1, { min: -2, max: 6, step: 0.1 }); // the apex of the triangle
    scene.ensureParam('ty', 2, { min: 0.5, max: 5, step: 0.1 });

    scene.custom.push(
      {
        // A rectangle a × b counted in unit squares
        id: 'rect',
        draw2d(p, sc, s) {
          for (let i = 0; i < s.a; i++) for (let j = 0; j < s.b; j++) shape(p, [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], COLORS.blue + '88', COLORS.blue + '22', 1);
          p.polyline([[0, 0], [s.a, 0], [s.a, s.b], [0, s.b], [0, 0]], WHITE, 2.5);
          p.handle(s.a, s.b, COLORS.blue, (x, y) => { sc.setParam('a', clamp(Math.round(x), 1, 6)); sc.setParam('b', clamp(Math.round(y), 1, 4)); });
        },
        legend: s => `S = ${s.a} \\cdot ${s.b} = ${s.a * s.b}`,
      },
      {
        // The parallelogram: the left triangle is cut off and moved to the right
        id: 'para',
        draw2d(p, sc, s) {
          const a = 4, h = 2.5, d = 1.5, m = s.m;
          shape(p, [[d, 0], [a, 0], [a, h], [d, h]], COLORS.green, COLORS.green + '33');
          const cut = [[0, 0], [d, 0], [d, h]].map(P => [P[0] + a * m, P[1]]);
          shape(p, cut, COLORS.yellow, COLORS.yellow + '55');
          p.polyline([[0, 0], [a, 0], [a + d, h], [d, h], [0, 0]], WHITE + (m > 0.02 ? '44' : 'ff'), 2);
          height(p, d, h, 'ph');
          p.tex('pa', 'a', a / 2, 0, WHITE, { dx: 0, dy: 16, align: 'center' });
        },
        legend: s => (s.m > 0.98 ? `S = a \\cdot h = 4 \\cdot 2.5 = 10` : `\\text{${s.m < 0.02 ? 'S = ?' : '…'}}`),
      },
      {
        // A triangle with base 4 and its apex on a line: twice the triangle is a parallelogram
        id: 'tri',
        draw2d(p, sc, s) {
          const A = [0, 0], B = [4, 0], C = [s.tx, s.ty];
          p.line(-3, s.ty, 8, s.ty, COLORS.purple + '66', { width: 1, dash: [6, 5] });
          shape(p, [B, [B[0] + C[0], C[1]], C], COLORS.yellow + '88', COLORS.yellow + '18', 1.5);
          shape(p, [A, B, C], COLORS.yellow, COLORS.yellow + '44');
          height(p, C[0], C[1], 'th');
          p.handle(...C, COLORS.yellow, (x, y) => { sc.setParam('tx', clamp(Math.round(x * 10) / 10, -2, 6)); sc.setParam('ty', clamp(Math.round(y * 10) / 10, 0.5, 5)); });
        },
        legend: s => `S = \\frac12 \\cdot 4 \\cdot ${r2(s.ty)} = ${r2(2 * s.ty)}`,
      },
      {
        // A trapezoid and its copy turned upside down: together a parallelogram with base a + b
        id: 'trap',
        draw2d(p, sc, s) {
          const a = 4, b = 2, h = 2, d = 0.7, m = s.m;
          const T = [[0, 0], [a, 0], [d + b, h], [d, h]];
          const turned = T.map(([x, y]) => [a + d + b - x, h - y]); // turned by 180° about the middle of the right side
          shape(p, T, COLORS.blue, COLORS.blue + '33');
          shape(p, turned.map(([x, y]) => [x + 3 * (1 - m), y]), COLORS.orange, COLORS.orange + '33');
          height(p, d, h, 'zh');
          p.tex('za', 'a', a / 2, 0, COLORS.blue, { dx: 0, dy: 16, align: 'center' });
          p.tex('zb', 'b', d + b / 2, h, COLORS.blue, { dx: 0, dy: -12, align: 'center' });
        },
        legend: s => (s.m > 0.98 ? `2S = (a + b) \\cdot h \\ \\Rightarrow\\ S = \\frac{a + b}{2}\\,h` : ''),
      },
      {
        // The task: a triangle of area 6 on the base 4
        id: 'task',
        draw2d(p, sc, s) {
          const C = [s.tx, s.ty];
          shape(p, [[0, 0], [4, 0], C], COLORS.yellow, COLORS.yellow + '33');
          p.handle(...C, COLORS.yellow, (x, y) => { sc.setParam('tx', clamp(Math.round(x * 10) / 10, -2, 6)); sc.setParam('ty', clamp(Math.round(y * 10) / 10, 0.5, 5)); });
          p.tex('k4', '4', 2, 0, WHITE, { dx: 0, dy: 16, align: 'center' });
        },
      },
    );
  },

  steps: [
    {
      title: { en: 'Area is counting squares', ru: 'Площадь — это счёт квадратиков' },
      text: {
        en: 'Area answers «how many unit squares fit inside». A rectangle $a \\times b$ holds $b$ rows of $a$ squares: $S = ab$. Everything else in this topic is reduced to a rectangle by cutting and moving pieces — and moving a piece does not change its area.',
        ru: 'Площадь отвечает на вопрос «сколько единичных квадратиков помещается внутри». В прямоугольнике $a \\times b$ — $b$ рядов по $a$ квадратиков: $S = ab$. Всё остальное в этой теме сводится к прямоугольнику: режем и перекладываем куски — а при перекладывании площадь не меняется.',
      },
      try: { en: 'Drag the corner of the rectangle.', ru: 'Тяните угол прямоугольника.' },
      state: { show: ['rect'], params: { a: 4, b: 3 }, window: VIEW, controls: [] },
    },
    {
      title: { en: 'A parallelogram is a rectangle in disguise', ru: 'Параллелограмм — переодетый прямоугольник' },
      text: {
        en: 'Cut the <span class="c-yellow">triangle</span> off the left side of the parallelogram along its height and move it to the right: it fits exactly. The result is a rectangle with the same base $a$ and the height $h$. So $S = a \\cdot h$ — the height, not the slanted side.',
        ru: 'Отрежем <span class="c-yellow">треугольник</span> с левого края параллелограмма по высоте и перенесём вправо: он встаёт точно на место. Получился прямоугольник с тем же основанием $a$ и высотой $h$. Значит, $S = a \\cdot h$ — именно высота, а не наклонная сторона.',
      },
      try: { en: 'Press ▶ next to $m$.', ru: 'Нажмите ▶ возле $m$.' },
      state: { show: ['para'], params: { m: 0 }, window: VIEW, controls: ['m'] },
      enter(scene) { scene.setParam('m', 0); scene.animateParams({ m: 1 }, 2500); },
    },
    {
      proof: true,
      statement: { en: '<b>Area of a triangle.</b> $S = \\frac12\\,a h$.', ru: '<b>Площадь треугольника.</b> $S = \\frac12\\,a h$.' },
      title: { en: 'Half of a parallelogram', ru: 'Половина параллелограмма' },
      text: {
        en: 'Put a copy of the triangle next to it, turned by $180°$: together they make a parallelogram with base $a$ and height $h$, area $ah$. The triangle is exactly half. Now slide the apex along the purple line: the base and the height stay, so the area stays — the triangle gets skewed, but not bigger. $\\blacksquare$',
        ru: 'Приложим к треугольнику его копию, повёрнутую на $180°$: вместе они дают параллелограмм с основанием $a$ и высотой $h$, площадь $ah$. Треугольник — ровно половина. Теперь ведите вершину по фиолетовой прямой: основание и высота не меняются, значит, и площадь тоже — треугольник перекашивается, но не растёт. $\\blacksquare$',
      },
      state: { show: ['tri'], params: { tx: 1, ty: 2 }, window: VIEW, controls: [] },
    },
    {
      title: { en: 'A trapezoid: two copies', ru: 'Трапеция: две копии' },
      text: {
        en: 'A trapezoid has two parallel sides $a$ and $b$. Its copy turned upside down fits next to it, and together they make a parallelogram with base $a + b$ and the same height. Half of it: $$S = \\frac{a + b}{2}\\,h$$ — the average of the two bases times the height.',
        ru: 'У трапеции две параллельные стороны, $a$ и $b$. Её копия, перевёрнутая вверх ногами, прикладывается рядом, и вместе они дают параллелограмм с основанием $a + b$ и той же высотой. Половина: $$S = \\frac{a + b}{2}\\,h$$ — среднее двух оснований, умноженное на высоту.',
      },
      check: {
        q: { en: 'A trapezoid with bases $3$ and $7$ and height $4$. Its area?', ru: 'Трапеция с основаниями $3$ и $7$ и высотой $4$. Площадь?' },
        options: [{ text: '$20$', ok: true }, { text: '$40$' }, { text: '$84$' }],
        explain: {
          en: '$\\frac{3 + 7}{2} \\cdot 4 = 20$. $40$ forgets the half — it is the parallelogram of two copies.',
          ru: '$\\frac{3 + 7}{2} \\cdot 4 = 20$. $40$ — без половины: это параллелограмм из двух копий.',
        },
      },
      state: { show: ['trap'], params: { m: 0 }, window: { cx: 4.5, cy: 1.2, unit: 50, fit: [12, 5] }, controls: ['m'] },
      enter(scene) { scene.setParam('m', 0); scene.animateParams({ m: 1 }, 2500); },
    },
    {
      title: { en: 'A triangle of area 6', ru: 'Треугольник площади 6' },
      text: {
        en: 'The base is $4$. Drag the apex so that the area is exactly $6$.',
        ru: 'Основание равно $4$. Поставьте вершину так, чтобы площадь была ровно $6$.',
      },
      task: {
        kind: 'drag',
        target: { tx: 2, ty: 3 },
        ok: s => Math.abs(s.ty - 3) < 0.05,
        back: 2,
        right: {
          en: '$\\frac12 \\cdot 4 \\cdot 3 = 6$. Any apex at height $3$ works — the whole line of answers.',
          ru: '$\\frac12 \\cdot 4 \\cdot 3 = 6$. Подходит любая вершина на высоте $3$ — целая прямая ответов.',
        },
        mistakes: [
          { when: s => Math.abs(s.ty - 1.5) < 0.05, text: { en: 'Here $4 \\cdot 1.5 = 6$ — but that is the parallelogram. The triangle is half: $3$.', ru: 'Здесь $4 \\cdot 1.5 = 6$ — но это параллелограмм. Треугольник — половина: $3$.' } },
        ],
        hint: s => (s.ty < 3 ? { en: 'Higher: the area is $2h$.', ru: 'Выше: площадь равна $2h$.' } : { en: 'Lower: the area is $2h$.', ru: 'Ниже: площадь равна $2h$.' }),
      },
      state: { show: ['task'], params: { tx: 0.5, ty: 1 }, window: VIEW, controls: [] },
    },
  ],
};
