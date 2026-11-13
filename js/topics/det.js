// The determinant: how many times a matrix changes areas. Every cell of the grid is a copy of the unit square,
// so every area is multiplied by the same number. A stretch multiplies by a·d, a shear does not change areas,
// in general it is ad − bc; zero when the plane collapses, negative when it is turned inside out.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';
import { morph } from './matrix.js';

const WINDOW = { cx: 0.5, cy: 0.8, unit: 48 };
const r2 = v => fmt(Math.round(v * 100) / 100);
const det = s => s.ix * s.jy - s.jx * s.iy;
const tex = (a, b, c, d) => `\\begin{pmatrix} \\green{${r2(a)}} & \\red{${r2(b)}} \\\\ \\green{${r2(c)}} & \\red{${r2(d)}} \\end{pmatrix}`;
// det written out: ad − bc with the numbers in
const pr = v => (v < 0 ? `(${r2(v)})` : r2(v)); // a negative factor in brackets: 2 · 1 − (−1) · 1
const formula = s => `\\det ${tex(s.ix, s.jx, s.iy, s.jy)} = ${pr(s.ix)} \\cdot ${pr(s.jy)} - ${pr(s.jx)} \\cdot ${pr(s.iy)} = ${det(s) < -1e-9 ? '\\purple' : '\\yellow'}{${r2(det(s))}}`;
// The square is yellow while the plane keeps its orientation and purple when it is turned inside out
const square = s => (det(s) < -1e-9 ? COLORS.purple : COLORS.yellow);
const I = s => [s.ix, s.iy], J = s => [s.jx, s.jy];

export default {
  view: '2d',
  view2d: WINDOW,
  lab: false,

  setup(scene) {
    scene.ensureParam('ix', 2, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('iy', 1, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('jx', -1, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('jy', 1, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('t', 1, { min: 0, max: 1, step: 0.01 });
    scene.ensureParam('D', 0, { min: -4, max: 8, step: 0.5 }); // the student's answer in the second task

    scene.custom.push(
      {
        id: 'areas',
        draw2d(p, sc, s) {
          // The unit square and a circle of radius 0.6 at (1; −1.5), both carried by the matrix
          morph(p, sc, I(s), J(s), s.t, { drag: true, square: square(s) });
          const a = [1 - s.t + s.t * s.ix, s.t * s.iy], b = [s.t * s.jx, 1 - s.t + s.t * s.jy];
          const ring = Array.from({ length: 64 }, (_, k) => {
            const x = 1 + 0.6 * Math.cos(k * Math.PI / 32), y = -1.5 + 0.6 * Math.sin(k * Math.PI / 32);
            return [x * a[0] + y * b[0], x * a[1] + y * b[1]];
          });
          p.fill(ring, COLORS.teal + '44');
          p.polyline([...ring, ring[0]], COLORS.teal, 1.5);
        },
        legend: s => {
          const k = Math.abs((1 - s.t + s.t * s.ix) * (1 - s.t + s.t * s.jy) - s.t * s.t * s.jx * s.iy);
          const [sq, ci] = t({ en: ['square', 'circle'], ru: ['квадрат', 'круг'] });
          return `\\text{${sq}: } 1 \\to \\yellow{${r2(k)}} \\qquad \\text{${ci}: } \\teal{0.36\\pi} \\to \\teal{${r2(k * 0.36)}\\pi}`;
        },
      },
      {
        id: 'det',
        draw2d(p, sc, s) { morph(p, sc, I(s), J(s), s.t, { drag: true, square: square(s) }); },
        legend: formula,
      },
      {
        // A shear: ĵ′ slides along the line y = 1, î′ stays
        id: 'shear',
        draw2d(p, sc, s) {
          p.line(-10, 1, 10, 1, 'rgba(255,255,255,0.3)', { width: 1, dash: [6, 5] });
          morph(p, sc, [1, 0], [s.jx, 1], 1, { square: COLORS.yellow });
          p.handle(s.jx, 1, COLORS.red, x => sc.setParam('jx', Math.max(-5, Math.min(5, Math.round(x * 2) / 2))));
        },
        legend: s => formula({ ix: 1, iy: 0, jx: s.jx, jy: 1 }),
      },
      // ---- Tasks ----
      {
        // î′ is fixed at (1; 0); the student drags ĵ′
        id: 'onlyJ',
        draw2d(p, sc, s) {
          morph(p, sc, [1, 0], J(s), 1, { square: square({ ix: 1, iy: 0, jx: s.jx, jy: s.jy }) });
          p.handle(s.jx, s.jy, COLORS.red, (x, y) => {
            sc.setParam('jx', Math.max(-5, Math.min(5, Math.round(x * 2) / 2)));
            sc.setParam('jy', Math.max(-5, Math.min(5, Math.round(y * 2) / 2)));
          });
        },
      },
      {
        // A fixed matrix; the student reads its determinant off the picture and sets D
        id: 'readDet',
        draw2d(p, sc) { morph(p, sc, [2, 1], [1, 3], 1); },
        legend: s => `\\det ${tex(2, 1, 1, 3)} = \\ ?\\qquad D = ${r2(s.D)}`,
      },
      {
        // î′ is fixed at (0; 1)
        id: 'flipJ',
        draw2d(p, sc, s) {
          morph(p, sc, [0, 1], J(s), 1, { square: square({ ix: 0, iy: 1, jx: s.jx, jy: s.jy }) });
          p.handle(s.jx, s.jy, COLORS.red, (x, y) => {
            sc.setParam('jx', Math.max(-5, Math.min(5, Math.round(x * 2) / 2)));
            sc.setParam('jy', Math.max(-5, Math.min(5, Math.round(y * 2) / 2)));
          });
        },
      },
    );
  },

  steps: [
    {
      title: { en: 'All areas change alike', ru: 'Все площади меняются одинаково' },
      text: {
        en: 'Watch the yellow unit square and the teal circle while the matrix moves the plane. The square grows $3$ times — and so does the circle. No accident: every cell of the grid is a copy of the unit square, and any shape is made of cells. So a matrix multiplies <b>all</b> areas by one and the same number. That number is its <i>determinant</i>.',
        ru: 'Смотрите на жёлтый единичный квадрат и бирюзовый круг, пока матрица двигает плоскость. Квадрат вырастает в $3$ раза — и круг тоже. Это не случайно: каждая клетка сетки — копия единичного квадрата, а любая фигура складывается из клеток. Значит, матрица умножает <b>все</b> площади на одно и то же число. Это число и есть её <i>определитель</i>.',
      },
      try: { en: 'Press ▶ next to $t$. Then drag $\\hat\\imath\'$ and $\\hat\\jmath\'$: the two numbers in the legend stay in the same ratio.', ru: 'Нажмите ▶ возле $t$. Потом тяните $\\hat\\imath\'$ и $\\hat\\jmath\'$: два числа в подписи всё время в одном отношении.' },
      state: { show: ['areas'], params: { ix: 2, iy: 1, jx: -1, jy: 1 }, window: WINDOW, controls: ['t'] },
      enter(scene) {
        scene.setParam('t', 0);
        scene.animateParams({ t: 1 }, 3500);
      },
    },
    {
      title: { en: 'A stretch multiplies', ru: 'Растяжение — умножение' },
      text: {
        en: 'The easiest case: $\\hat\\imath\'$ stays on the $x$ axis, $\\hat\\jmath\'$ on the $y$ axis. The square becomes an $a \\times d$ rectangle, so areas are multiplied by $a \\cdot d$. Stretch $3$ times along $x$ and $2$ times along $y$ — areas grow $6$ times.',
        ru: 'Самый простой случай: $\\hat\\imath\'$ остаётся на оси $x$, $\\hat\\jmath\'$ — на оси $y$. Квадрат становится прямоугольником $a \\times d$, и площади умножаются на $a \\cdot d$. Растянуть в $3$ раза по $x$ и в $2$ раза по $y$ — площади вырастут в $6$ раз.',
      },
      check: {
        q: { en: 'What is the determinant of $\\begin{pmatrix} 2 & 0 \\\\ 0 & 0.5 \\end{pmatrix}$?', ru: 'Чему равен определитель $\\begin{pmatrix} 2 & 0 \\\\ 0 & 0.5 \\end{pmatrix}$?' },
        options: [{ text: '$2.5$' }, { text: '$1$', ok: true }, { text: '$0$' }],
        explain: {
          en: 'Twice as wide, half as high: $2 \\cdot 0.5 = 1$. The square changes its shape, but not its area.',
          ru: 'Вдвое шире, вдвое ниже: $2 \\cdot 0.5 = 1$. Квадрат меняет форму, но не площадь.',
        },
        reveal: scene => scene.animateParams({ ix: 2, iy: 0, jx: 0, jy: 0.5 }, 1200),
      },
      state: { show: ['det'], params: { ix: 3, iy: 0, jx: 0, jy: 2, t: 1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'A shear keeps areas', ru: 'Сдвиг площадь не меняет' },
      text: {
        en: 'Now slide $\\red{\\hat\\jmath\'}$ along the dashed line. The square leans over and becomes a parallelogram — but its base is still $1$ and its height is still $1$. Base times height: the area stays $1$, and the determinant too.',
        ru: 'Теперь двигайте $\\red{\\hat\\jmath\'}$ вдоль пунктира. Квадрат наклоняется и становится параллелограммом — но основание по-прежнему $1$, и высота по-прежнему $1$. Основание на высоту: площадь остаётся $1$, а с ней и определитель.',
      },
      try: { en: 'Drag the end of $\\hat\\jmath\'$ left and right.', ru: 'Тяните конец $\\hat\\jmath\'$ влево и вправо.' },
      state: { show: ['shear'], params: { jx: 1.5 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'The formula: ad − bc', ru: 'Формула: ad − bc' },
      text: {
        en: 'In general the area of the parallelogram on $\\green{\\binom{a}{c}}$ and $\\red{\\binom{b}{d}}$ is $$\\det \\begin{pmatrix} \\green{a} & \\red{b} \\\\ \\green{c} & \\red{d} \\end{pmatrix} = ad - bc.$$ The first product is the stretch along the axes; the second one corrects for how much each arrow leans towards the other axis. With $b = 0$ or $c = 0$ it is a stretch with a shear, and only $ad$ is left.',
        ru: 'В общем случае площадь параллелограмма на $\\green{\\binom{a}{c}}$ и $\\red{\\binom{b}{d}}$ равна $$\\det \\begin{pmatrix} \\green{a} & \\red{b} \\\\ \\green{c} & \\red{d} \\end{pmatrix} = ad - bc.$$ Первое произведение — растяжение вдоль осей; второе поправляет на то, насколько каждая стрелка наклонена к другой оси. При $b = 0$ или $c = 0$ это растяжение со сдвигом, и остаётся только $ad$.',
      },
      try: { en: 'Drag $\\hat\\imath\'$ and $\\hat\\jmath\'$ and count the cells inside the parallelogram.', ru: 'Тяните $\\hat\\imath\'$ и $\\hat\\jmath\'$ и считайте клетки внутри параллелограмма.' },
      check: {
        q: { en: '$\\det \\begin{pmatrix} 3 & 1 \\\\ 2 & 4 \\end{pmatrix} = ?$', ru: '$\\det \\begin{pmatrix} 3 & 1 \\\\ 2 & 4 \\end{pmatrix} = ?$' },
        options: [{ text: '$14$' }, { text: '$10$', ok: true }, { text: '$12$' }],
        explain: {
          en: '$3 \\cdot 4 - 1 \\cdot 2 = 12 - 2 = 10$. Main diagonal minus the other one.',
          ru: '$3 \\cdot 4 - 1 \\cdot 2 = 12 - 2 = 10$. Главная диагональ минус побочная.',
        },
        reveal: scene => scene.animateParams({ ix: 3, iy: 2, jx: 1, jy: 4 }, 1200),
      },
      state: { show: ['det'], params: { ix: 2, iy: 1, jx: -1, jy: 1, t: 1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Zero: the plane collapsed', ru: 'Ноль: плоскость схлопнулась' },
      text: {
        en: 'Put $\\red{\\hat\\jmath\'}$ on the line of $\\green{\\hat\\imath\'}$. The square is flattened into a segment, its area is $0$ — and so is the determinant. The other way round too: $\\det = 0$ means exactly that the matrix squashes the plane into a line (or a point). That is why such a matrix cannot be undone.',
        ru: 'Положите $\\red{\\hat\\jmath\'}$ на прямую $\\green{\\hat\\imath\'}$. Квадрат сплющивается в отрезок, его площадь $0$ — и определитель тоже. И наоборот: $\\det = 0$ ровно тогда, когда матрица сплющивает плоскость в прямую (или в точку). Поэтому такую матрицу нельзя «отменить».',
      },
      try: { en: 'Drag $\\hat\\jmath\'$ onto the line of $\\hat\\imath\'$ and watch the determinant.', ru: 'Перетащите $\\hat\\jmath\'$ на прямую $\\hat\\imath\'$ и следите за определителем.' },
      check: {
        q: { en: 'For which $k$ is $\\det \\begin{pmatrix} 2 & k \\\\ 1 & 3 \\end{pmatrix} = 0$?', ru: 'При каком $k$ определитель $\\begin{pmatrix} 2 & k \\\\ 1 & 3 \\end{pmatrix}$ равен нулю?' },
        options: [{ text: '$k = 6$', ok: true }, { text: '$k = 1.5$' }, { text: '$k = -6$' }],
        explain: {
          en: '$2 \\cdot 3 - k \\cdot 1 = 0$, so $k = 6$. Check: $\\binom{6}{3} = 3 \\binom{2}{1}$ — the columns are on one line.',
          ru: '$2 \\cdot 3 - k \\cdot 1 = 0$, значит $k = 6$. Проверка: $\\binom{6}{3} = 3 \\binom{2}{1}$ — столбцы на одной прямой.',
        },
      },
      state: { show: ['det'], params: { ix: 2, iy: 1, jx: -1, jy: 1, t: 1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Negative: the plane turned over', ru: 'Минус: плоскость перевернулась' },
      text: {
        en: 'Keep dragging $\\red{\\hat\\jmath\'}$ across the line of $\\green{\\hat\\imath\'}$, to the other side. The area grows again, but the determinant is <b>negative</b>, and the square turns purple: the plane has been turned over, like a sheet of paper flipped. Before, $\\hat\\jmath\'$ was to the left of $\\hat\\imath\'$ (counter-clockwise from it); now it is to the right. The sign of the determinant tells the orientation, its size tells the area.',
        ru: 'Продолжайте тянуть $\\red{\\hat\\jmath\'}$ через прямую $\\green{\\hat\\imath\'}$, на другую сторону. Площадь снова растёт, но определитель <b>отрицательный</b>, и квадрат становится фиолетовым: плоскость перевернули, как лист бумаги. Раньше $\\hat\\jmath\'$ был слева от $\\hat\\imath\'$ (против часовой от него), теперь — справа. Знак определителя говорит об ориентации, модуль — о площади.',
      },
      try: { en: 'Move $\\hat\\jmath\'$ to the other side of $\\hat\\imath\'$ and back.', ru: 'Переводите $\\hat\\jmath\'$ на другую сторону от $\\hat\\imath\'$ и обратно.' },
      check: {
        q: { en: 'What is the determinant of the mirror $\\begin{pmatrix} -1 & 0 \\\\ 0 & 1 \\end{pmatrix}$?', ru: 'Каков определитель отражения $\\begin{pmatrix} -1 & 0 \\\\ 0 & 1 \\end{pmatrix}$?' },
        options: [{ text: '$1$' }, { text: '$-1$', ok: true }, { text: '$0$' }],
        explain: {
          en: 'A mirror keeps areas (size $1$) and turns the plane over (sign minus): $(-1) \\cdot 1 - 0 \\cdot 0 = -1$.',
          ru: 'Отражение сохраняет площади (модуль $1$) и переворачивает плоскость (знак минус): $(-1) \\cdot 1 - 0 \\cdot 0 = -1$.',
        },
        reveal: scene => scene.animateParams({ ix: -1, iy: 0, jx: 0, jy: 1 }, 1200),
      },
      state: { show: ['det'], params: { ix: 2, iy: 1, jx: 1.5, jy: 2.5, t: 1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'Find a matrix with determinant $4$ that is not a stretch along the axes, and one with determinant $-2$. Then think: a rotation keeps areas and does not turn the plane over — what is its determinant? And if you apply two matrices one after the other, what happens to the areas?',
        ru: 'Найдите матрицу с определителем $4$, которая не растяжение вдоль осей, и матрицу с определителем $-2$. И подумайте: поворот сохраняет площади и не переворачивает плоскость — каков его определитель? А если применить две матрицы одну за другой, что станет с площадями?',
      },
      state: { show: ['areas'], params: { ix: 1.5, iy: 0.5, jx: -0.5, jy: 1.5, t: 1 }, window: WINDOW, controls: ['t'] },
    },
    {
      title: { en: 'Make the area 3', ru: 'Сделайте площадь 3' },
      text: {
        en: '$\\green{\\hat\\imath\'}$ is fixed at $(1;\\ 0)$. Drag $\\red{\\hat\\jmath\'}$ so that the determinant is $3$.',
        ru: '$\\green{\\hat\\imath\'}$ закреплён в $(1;\\ 0)$. Перетащите $\\red{\\hat\\jmath\'}$ так, чтобы определитель стал равен $3$.',
      },
      task: {
        kind: 'drag',
        target: Array.from({ length: 21 }, (_, k) => ({ jx: -5 + k / 2, jy: 3 })),
        back: 2,
        right: {
          en: 'With $\\hat\\imath\' = (1;\\ 0)$ the determinant is $1 \\cdot d - b \\cdot 0 = d$: only the height of $\\hat\\jmath\'$ matters. Any point of the line $y = 3$ works — sliding along it is a shear, and a shear keeps the area.',
          ru: 'При $\\hat\\imath\' = (1;\\ 0)$ определитель равен $1 \\cdot d - b \\cdot 0 = d$: важна только высота $\\hat\\jmath\'$. Подходит любая точка прямой $y = 3$ — движение вдоль неё есть сдвиг, а сдвиг площадь не меняет.',
        },
        mistakes: Array.from({ length: 21 }, (_, k) => ({ params: { jx: -5 + k / 2, jy: -3 }, text: {
          en: 'The area is $3$, but the square is purple: the plane is turned over and the determinant is $-3$. $\\hat\\jmath\'$ has to stay on the left of $\\hat\\imath\'$ — above it.',
          ru: 'Площадь $3$, но квадрат фиолетовый: плоскость перевёрнута, и определитель $-3$. $\\hat\\jmath\'$ должен остаться слева от $\\hat\\imath\'$ — над ним.' } })),
        hints: {
          jx: { en: 'With $\\hat\\imath\'$ along the $x$ axis the base is $1$, so the area is the height of $\\hat\\jmath\'$. It should be $3$.', ru: 'Когда $\\hat\\imath\'$ лежит на оси $x$, основание равно $1$, и площадь — это высота $\\hat\\jmath\'$. Она должна быть $3$.' },
          jy: { en: 'With $\\hat\\imath\'$ along the $x$ axis the base is $1$, so the area is the height of $\\hat\\jmath\'$. It should be $3$.', ru: 'Когда $\\hat\\imath\'$ лежит на оси $x$, основание равно $1$, и площадь — это высота $\\hat\\jmath\'$. Она должна быть $3$.' },
        },
      },
      state: { show: ['onlyJ'], params: { jx: 1, jy: 1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Read the determinant', ru: 'Найдите определитель' },
      text: {
        en: 'The picture shows the matrix $\\begin{pmatrix} 2 & 1 \\\\ 1 & 3 \\end{pmatrix}$ at work. Set $D$ to its determinant — compute it, or count the cells of the yellow parallelogram.',
        ru: 'На картинке работает матрица $\\begin{pmatrix} 2 & 1 \\\\ 1 & 3 \\end{pmatrix}$. Поставьте $D$ равным её определителю — посчитайте или сосчитайте клетки жёлтого параллелограмма.',
      },
      task: {
        kind: 'drag',
        target: { D: 5 },
        back: 3,
        right: {
          en: '$2 \\cdot 3 - 1 \\cdot 1 = 5$: the yellow parallelogram has the area of five unit squares.',
          ru: '$2 \\cdot 3 - 1 \\cdot 1 = 5$: жёлтый параллелограмм по площади — пять единичных квадратов.',
        },
        mistakes: [
          { params: { D: 7 }, text: {
            en: 'This is $ad + bc$. The second product is <b>subtracted</b>: $2 \\cdot 3 - 1 \\cdot 1$.',
            ru: 'Это $ad + bc$. Второе произведение <b>вычитается</b>: $2 \\cdot 3 - 1 \\cdot 1$.' } },
          { params: { D: 6 }, text: {
            en: 'This is only $a \\cdot d$ — right for a stretch along the axes. Here the arrows lean, and $bc = 1$ has to be subtracted.',
            ru: 'Это только $a \\cdot d$ — верно для растяжения вдоль осей. Здесь стрелки наклонены, и нужно вычесть $bc = 1$.' } },
        ],
        hints: {
          D: D => (D < 5
            ? { en: 'Too small: the parallelogram is bigger than that. $\\det = ad - bc$.', ru: 'Слишком мало: параллелограмм больше. $\\det = ad - bc$.' }
            : { en: 'Too big. $\\det = ad - bc$.', ru: 'Слишком много. $\\det = ad - bc$.' }),
        },
      },
      state: { show: ['readDet'], params: { D: 0 }, window: { cx: 1.5, cy: 1.8, unit: 52 }, controls: ['D'] },
    },
    {
      title: { en: 'Turn it over', ru: 'Переверните' },
      text: {
        en: '$\\green{\\hat\\imath\'}$ is fixed at $(0;\\ 1)$. Drag $\\red{\\hat\\jmath\'}$ so that the determinant is $-1$: the areas stay the same, but the plane is turned over.',
        ru: '$\\green{\\hat\\imath\'}$ закреплён в $(0;\\ 1)$. Перетащите $\\red{\\hat\\jmath\'}$ так, чтобы определитель стал $-1$: площади те же, но плоскость перевёрнута.',
      },
      task: {
        kind: 'drag',
        target: Array.from({ length: 21 }, (_, k) => ({ jx: 1, jy: -5 + k / 2 })),
        back: 5,
        right: {
          en: '$\\det = 0 \\cdot d - b \\cdot 1 = -b$, so $b = 1$: $\\hat\\jmath\'$ is on the right of $\\hat\\imath\'$, at distance $1$ from its line. The square turned purple.',
          ru: '$\\det = 0 \\cdot d - b \\cdot 1 = -b$, значит $b = 1$: $\\hat\\jmath\'$ справа от $\\hat\\imath\'$, на расстоянии $1$ от его прямой. Квадрат стал фиолетовым.',
        },
        mistakes: Array.from({ length: 21 }, (_, k) => ({ params: { jx: -1, jy: -5 + k / 2 }, text: {
          en: 'The area is $1$, but the plane is not turned over: $\\hat\\jmath\'$ is on the left of $\\hat\\imath\'$, the determinant is $+1$. Move it to the other side.',
          ru: 'Площадь $1$, но плоскость не перевёрнута: $\\hat\\jmath\'$ слева от $\\hat\\imath\'$, определитель $+1$. Переведите его на другую сторону.' } })),
        hints: {
          jx: { en: '$\\hat\\imath\'$ points up, so the area is how far $\\hat\\jmath\'$ is from the $y$ axis. Turned over means: to the right of $\\hat\\imath\'$.', ru: '$\\hat\\imath\'$ смотрит вверх, поэтому площадь — это расстояние от $\\hat\\jmath\'$ до оси $y$. Перевёрнута — значит, справа от $\\hat\\imath\'$.' },
          jy: { en: '$\\hat\\imath\'$ points up, so the area is how far $\\hat\\jmath\'$ is from the $y$ axis. Turned over means: to the right of $\\hat\\imath\'$.', ru: '$\\hat\\imath\'$ смотрит вверх, поэтому площадь — это расстояние от $\\hat\\jmath\'$ до оси $y$. Перевёрнута — значит, справа от $\\hat\\imath\'$.' },
        },
      },
      state: { show: ['flipJ'], params: { jx: -2, jy: 1 }, window: WINDOW, controls: [] },
    },
  ],
};
