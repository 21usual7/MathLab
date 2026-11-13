// Systems of equations and the inverse matrix. A system M·x = b asks which arrow the matrix moves onto b:
// count the steps to b along the slanted grid. The same answer is where the two lines of the equations
// cross. The inverse matrix plays the move backwards; when det = 0 there is none — and no single answer.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';
import { morph } from './matrix.js';

const WHITE = '#ffffff';
const WINDOW = { cx: 0.5, cy: 1.5, unit: 46 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const snap = v => clamp(Math.round(v * 2) / 2, -6, 6);
const r2 = v => fmt(Math.round(v * 100) / 100);

// [a, b, c, d] = (a b; c d)
const apply = ([a, b, c, d], [x, y]) => [a * x + b * y, c * x + d * y];
const det = ([a, b, c, d]) => a * d - b * c;
const inv = M => { const [a, b, c, d] = M, D = det(M); return [d / D, -b / D, -c / D, a / D]; };
const mul = ([a, b, c, d], [e, f, g, h]) => [a * e + b * g, a * f + b * h, c * e + d * g, c * f + d * h];
const lerpI = ([a, b, c, d], k) => [1 - k + k * a, k * b, k * c, 1 - k + k * d];
const tex = ([a, b, c, d]) => `\\begin{pmatrix} ${r2(a)} & ${r2(b)} \\\\ ${r2(c)} & ${r2(d)} \\end{pmatrix}`;
const col = ([x, y]) => `\\begin{pmatrix} ${r2(x)} \\\\ ${r2(y)} \\end{pmatrix}`;
const show = (p, sc, M) => morph(p, sc, [M[0], M[2]], [M[1], M[3]], 1);

// The system 2x − y = 1, x + y = 5: its matrix and right side; the answer is (2; 3)
const M0 = [2, -1, 1, 1], B0 = [1, 5];
// The task: x + 2y = 1, −x + y = 5; the answer is (−3; 2)
const M1 = [1, 2, -1, 1], B1 = [1, 5];
// A matrix with det = 0: both columns on the line y = 2x
const MZ = [1, 0.5, 2, 1];
// The task about the inverse: X·M2 should be I
const M2 = [2, 1, 1, 1];

// The point x is dragged on the slanted grid: its handle sits at M·x, and a drag is taken back with M⁻¹
function solver(p, sc, s, M, b) {
  show(p, sc, M);
  p.ring(...b, WHITE, 8);
  p.tex('b', '\\vec b', ...b, WHITE, { dx: 12, dy: -12 });
  const img = apply(M, [s.px, s.py]);
  p.arrow(0, 0, ...img, COLORS.yellow, { width: 3 });
  p.tex('mx', '\\yellow{M\\vec x}', ...img, COLORS.yellow, { dx: 12, dy: 14 });
  p.handle(...img, COLORS.yellow, (x, y) => {
    const [u, v] = apply(inv(M), [x, y]);
    sc.setParam('px', snap(u));
    sc.setParam('py', snap(v));
  });
}

export default {
  view: '2d',
  view2d: WINDOW,
  lab: false,

  setup(scene) {
    scene.ensureParam('px', 1, { min: -6, max: 6, step: 0.5 });
    scene.ensureParam('py', 1, { min: -6, max: 6, step: 0.5 });
    scene.ensureParam('t', 1, { min: 0, max: 1, step: 0.01 });
    scene.ensureParam('by', 3, { min: -2, max: 6, step: 0.5 });
    scene.ensureParam('k', 0, { min: -4, max: 6, step: 0.5 });
    scene.ensureParam('ix', 1, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('iy', 0, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('jx', 0, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('jy', 1, { min: -5, max: 5, step: 0.5 });

    scene.custom.push(
      {
        id: 'ask',
        draw2d(p, sc, s) { solver(p, sc, s, M0, B0); },
        legend: s => `${tex(M0)} ${col([s.px, s.py])} = \\yellow{${col(apply(M0, [s.px, s.py]))}} \\qquad \\vec b = ${col(B0)}`,
      },
      {
        // The rows: each equation is a line; the answer is where they cross
        id: 'rows',
        draw2d(p) {
          p.line(0, -1, 1, 1, COLORS.blue, { width: 2.5, extend: true });
          p.line(0, 5, 1, 4, COLORS.purple, { width: 2.5, extend: true });
          p.dot(2, 3, WHITE, 6);
          p.tex('r1', '\\blue{2x - y = 1}', 4, 7, COLORS.blue, { dx: 10, dy: 0 });
          p.tex('r2', '\\purple{x + y = 5}', -1.5, 6.5, COLORS.purple, { dx: 10, dy: 0 });
          p.tex('ans', '(2;\\ 3)', 2, 3, WHITE, { dx: 12, dy: 12 });
        },
        legend: () => '\\begin{cases} 2x - y = 1 \\\\ x + y = 5 \\end{cases} \\iff \\begin{pmatrix} 2 & -1 \\\\ 1 & 1 \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} 1 \\\\ 5 \\end{pmatrix}',
      },
      {
        // Playing the move backwards: the grid goes from M to I, b rides back to the answer
        id: 'rewind',
        draw2d(p, sc, s) {
          const Mt = lerpI(M0, s.t), x = apply(inv(M0), B0), at = apply(Mt, x);
          show(p, sc, Mt);
          p.ring(...B0, 'rgba(255,255,255,0.5)', 8);
          p.dot(...at, COLORS.yellow, 7);
          p.tex('xt', '\\yellow{\\vec x}', ...at, COLORS.yellow, { dx: 12, dy: -12 });
        },
        legend: s => `M^{-1} = ${tex(inv(M0))},\\quad M^{-1} ${col(B0)} = \\yellow{${col(apply(inv(M0), B0))}}`,
      },
      {
        // det = 0: the plane goes onto a line; b on it or off it
        id: 'flat',
        draw2d(p, sc, s) {
          show(p, sc, MZ);
          p.line(0, 0, 1, 2, COLORS.yellow + 'aa', { width: 3, extend: true });
          p.ring(1, s.by, WHITE, 8);
          p.tex('b', '\\vec b', 1, s.by, WHITE, { dx: 12, dy: -12 });
          p.handle(1, s.by, WHITE, (x, y) => sc.setParam('by', clamp(Math.round(y * 2) / 2, -2, 6)));
        },
        legend: s => `\\det ${tex(MZ)} = 0:\\quad \\vec b = ${col([1, s.by])} \\Rightarrow ${Math.abs(s.by - 2) < 1e-9
          ? t({ en: '\\text{infinitely many solutions}', ru: '\\text{решений бесконечно много}' })
          : t({ en: '\\text{no solutions}', ru: '\\text{решений нет}' })}`,
      },
      // ---- Tasks ----
      {
        id: 'solveT',
        draw2d(p, sc, s) { solver(p, sc, s, M1, B1); },
        legend: s => `${tex(M1)} ${col([s.px, s.py])} = \\yellow{${col(apply(M1, [s.px, s.py]))}} \\qquad \\vec b = ${col(B1)}`,
      },
      {
        // 2x − y = 1 and kx − 2y = 3: the second line turns with k
        id: 'parallelT',
        draw2d(p, sc, s) {
          p.line(0, -1, 1, 1, COLORS.blue, { width: 2.5, extend: true });
          p.line(0, -1.5, 1, s.k / 2 - 1.5, COLORS.purple, { width: 2.5, extend: true });
          // Where they cross: 2x − 1 = kx/2 − 1.5
          if (Math.abs(s.k - 4) > 1e-9) { const X = -0.5 / (2 - s.k / 2); p.dot(X, 2 * X - 1, WHITE, 6); }
        },
        legend: s => `\\begin{cases} \\blue{2x - y = 1} \\\\ \\purple{${r2(s.k)}x - 2y = 3} \\end{cases}`,
      },
      {
        // The student's X after M2: the grid X·M2 should be square again
        id: 'invT',
        draw2d(p, sc, s) {
          const X = [s.ix, s.jx, s.iy, s.jy];
          show(p, sc, mul(X, M2));
          p.arrow(0, 0, s.ix, s.iy, COLORS.green + '99', { width: 2, dash: [5, 4] });
          p.arrow(0, 0, s.jx, s.jy, COLORS.red + '99', { width: 2, dash: [5, 4] });
          const set = (a, b) => (x, y) => { sc.setParam(a, clamp(Math.round(x * 2) / 2, -5, 5)); sc.setParam(b, clamp(Math.round(y * 2) / 2, -5, 5)); };
          p.handle(s.ix, s.iy, COLORS.green, set('ix', 'iy'));
          p.handle(s.jx, s.jy, COLORS.red, set('jx', 'jy'));
        },
        legend: s => `X = ${tex([s.ix, s.jx, s.iy, s.jy])},\\quad X ${tex(M2)} = ${tex(mul([s.ix, s.jx, s.iy, s.jy], M2))}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'A system is a question about a move', ru: 'Система — это вопрос о движении' },
      text: {
        en: 'The system $2x - y = 1$, $x + y = 5$ can be written as one equation $M\\vec x = \\vec b$, with the matrix of the coefficients. Read it as a question: <b>which arrow $\\vec x$ does $M$ move onto $\\vec b$?</b> The grid is already moved; its nodes are the images of whole-number arrows. Count the steps to $\\vec b$ along the slanted grid.',
        ru: 'Систему $2x - y = 1$, $x + y = 5$ можно записать одним уравнением $M\\vec x = \\vec b$, где $M$ — матрица коэффициентов. Читайте его как вопрос: <b>какую стрелку $\\vec x$ матрица $M$ переносит в $\\vec b$?</b> Сетка уже сдвинута; её узлы — образы стрелок с целыми координатами. Отсчитайте шаги до $\\vec b$ по косой сетке.',
      },
      try: { en: 'Drag the yellow point along the slanted grid onto $\\vec b$; read $\\vec x$ in the legend.', ru: 'Тяните жёлтую точку по косой сетке в $\\vec b$; $\\vec x$ — в подписи.' },
      state: { show: ['ask'], params: { px: 1, py: 1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'The school picture: two lines', ru: 'Школьная картинка: две прямые' },
      text: {
        en: 'At school the same system is two lines, one per equation: all points with $2x - y = 1$ and all points with $x + y = 5$. The point on both is the answer, $(2;\\ 3)$ — the same as on the previous step. Two pictures of one problem: by rows (lines) and by columns (the moved grid).',
        ru: 'В школе та же система — это две прямые, по одной на уравнение: все точки с $2x - y = 1$ и все точки с $x + y = 5$. Точка, лежащая на обеих, — ответ, $(2;\\ 3)$ — тот же, что на прошлом шаге. Две картинки одной задачи: по строкам (прямые) и по столбцам (сдвинутая сетка).',
      },
      check: {
        q: { en: 'Two lines on a plane. How many solutions can a system of two equations have?', ru: 'Две прямые на плоскости. Сколько решений может быть у системы из двух уравнений?' },
        options: [{ text: '1' }, { text: { en: '0, 1 or infinitely many', ru: '0, 1 или бесконечно много' }, ok: true }, { text: '0, 1 or 2' }],
        explain: {
          en: 'Lines cross once, or are parallel (none), or are the same line (every point of it). Two different lines cannot cross twice.',
          ru: 'Прямые пересекаются один раз, или параллельны (ни одного), или совпадают (каждая точка). Дважды две разные прямые пересечься не могут.',
        },
      },
      state: { show: ['rows'], window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Play the move backwards', ru: 'Отмотать движение назад' },
      text: {
        en: 'If $M$ moves $\\vec x$ onto $\\vec b$, then playing the move backwards brings $\\vec b$ back to $\\vec x$. The backward move is the <i>inverse matrix</i>: $$\\vec x = M^{-1}\\vec b.$$ Watch: the grid straightens out, and the point that was at $\\vec b$ rides to the answer.',
        ru: 'Если $M$ переносит $\\vec x$ в $\\vec b$, то движение, проигранное назад, вернёт $\\vec b$ в $\\vec x$. Обратное движение — это <i>обратная матрица</i>: $$\\vec x = M^{-1}\\vec b.$$ Смотрите: сетка выпрямляется, а точка, стоявшая в $\\vec b$, едет к ответу.',
      },
      try: { en: 'Drag $t$ from $1$ to $0$ and back.', ru: 'Тяните $t$ от $1$ к $0$ и обратно.' },
      state: { show: ['rewind'], window: WINDOW, controls: ['t'] },
      enter(scene) {
        scene.setParam('t', 1);
        scene.animateParams({ t: 0 }, 3500);
      },
    },
    {
      title: { en: 'The formula for 2×2', ru: 'Формула для 2×2' },
      text: {
        en: 'For a $2 \\times 2$ matrix the inverse is short: swap the diagonal, change the signs of the other two, divide by the determinant: $$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}^{-1} = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}.$$ Dividing by $\\det$ makes sense: $M$ multiplied areas by $\\det$, the inverse has to divide them back.',
        ru: 'Для матрицы $2 \\times 2$ обратная получается коротко: переставить диагональ, сменить знаки у двух других чисел и разделить на определитель: $$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}^{-1} = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}.$$ Деление на $\\det$ понятно: $M$ умножила площади на $\\det$, обратная должна разделить обратно.',
      },
      check: {
        q: { en: '$\\begin{pmatrix} 2 & 0 \\\\ 0 & 4 \\end{pmatrix}^{-1} = ?$', ru: '$\\begin{pmatrix} 2 & 0 \\\\ 0 & 4 \\end{pmatrix}^{-1} = ?$' },
        options: [
          { text: '$\\begin{pmatrix} 0.5 & 0 \\\\ 0 & 0.25 \\end{pmatrix}$', ok: true },
          { text: '$\\begin{pmatrix} 4 & 0 \\\\ 0 & 2 \\end{pmatrix}$' },
          { text: '$\\begin{pmatrix} -2 & 0 \\\\ 0 & -4 \\end{pmatrix}$' },
        ],
        explain: {
          en: 'Stretched $2$ times along $x$ and $4$ along $y$ — to undo, squeeze $2$ and $4$ times. By the formula: $\\frac{1}{8}\\begin{pmatrix} 4 & 0 \\\\ 0 & 2 \\end{pmatrix}$.',
          ru: 'Растянули в $2$ раза по $x$ и в $4$ по $y$ — чтобы отменить, сожмём в $2$ и в $4$ раза. По формуле: $\\frac{1}{8}\\begin{pmatrix} 4 & 0 \\\\ 0 & 2 \\end{pmatrix}$.',
        },
      },
      state: { show: ['rewind'], params: { t: 1 }, window: WINDOW, controls: ['t'] },
    },
    {
      title: { en: 'When det = 0', ru: 'Когда det = 0' },
      text: {
        en: 'If $\\det M = 0$, the plane is squashed onto a line, and there is no way back: $M^{-1}$ does not exist. For the system it means: if $\\vec b$ is off that line, nothing lands on it — <b>no solutions</b>; if $\\vec b$ is on the line, a whole line of arrows lands on it — <b>infinitely many</b>. In the school picture these are parallel lines and coinciding lines.',
        ru: 'Если $\\det M = 0$, плоскость сплющена в прямую, и пути назад нет: $M^{-1}$ не существует. Для системы это значит: если $\\vec b$ не на этой прямой, в него ничего не попадает — <b>решений нет</b>; если на прямой — в него попадает целая прямая стрелок — <b>решений бесконечно много</b>. На школьной картинке это параллельные и совпадающие прямые.',
      },
      try: { en: 'Drag $\\vec b$ up and down: onto the yellow line and off it.', ru: 'Тяните $\\vec b$ вверх и вниз: на жёлтую прямую и с неё.' },
      state: { show: ['flat'], params: { by: 3 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'Solve $3x + y = 7$, $x - y = 1$ both ways: by the formula $M^{-1}\\vec b$ and by drawing two lines. Then change one number so that $\\det = 0$ and see which of the two cases you get.',
        ru: 'Решите $3x + y = 7$, $x - y = 1$ двумя способами: по формуле $M^{-1}\\vec b$ и двумя прямыми. Потом измените одно число так, чтобы $\\det = 0$, и посмотрите, какой из двух случаев получится.',
      },
      state: { show: ['ask'], params: { px: 0, py: 0 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Solve on the grid', ru: 'Решите на сетке' },
      text: {
        en: 'The system $x + 2y = 1$, $-x + y = 5$. Drag the yellow point along the slanted grid so that $M\\vec x = \\vec b$.',
        ru: 'Система $x + 2y = 1$, $-x + y = 5$. Тяните жёлтую точку по косой сетке так, чтобы $M\\vec x = \\vec b$.',
      },
      task: {
        kind: 'drag',
        target: { px: -3, py: 2 },
        back: 0,
        right: {
          en: '$\\vec x = (-3;\\ 2)$: $-3 + 2 \\cdot 2 = 1$ and $3 + 2 = 5$. On the grid: $-3$ steps along the first column and $2$ along the second.',
          ru: '$\\vec x = (-3;\\ 2)$: $-3 + 2 \\cdot 2 = 1$ и $3 + 2 = 5$. На сетке: $-3$ шага вдоль первого столбца и $2$ вдоль второго.',
        },
        mistakes: [
          { params: { px: 2, py: 1 }, text: {
            en: 'This solves the system with rows and columns swapped: $x - y = 1$, $2x + y = 5$. The columns of $M$ are $\\binom{1}{-1}$ and $\\binom{2}{1}$.',
            ru: 'Это решение системы с переставленными строками и столбцами: $x - y = 1$, $2x + y = 5$. Столбцы $M$ — это $\\binom{1}{-1}$ и $\\binom{2}{1}$.' } },
        ],
        hints: {
          px: { en: 'The yellow arrow is not at $\\vec b$ yet. Count along the slanted grid: how many steps of the first column, then of the second?', ru: 'Жёлтая стрелка ещё не в $\\vec b$. Считайте по косой сетке: сколько шагов первого столбца, потом второго?' },
          py: { en: 'The yellow arrow is not at $\\vec b$ yet. Count along the slanted grid: how many steps of the first column, then of the second?', ru: 'Жёлтая стрелка ещё не в $\\vec b$. Считайте по косой сетке: сколько шагов первого столбца, потом второго?' },
        },
      },
      state: { show: ['solveT'], params: { px: 1, py: 1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'A system with no solutions', ru: 'Система без решений' },
      text: {
        en: 'In the system $2x - y = 1$, $kx - 2y = 3$ choose $k$ so that there are no solutions.',
        ru: 'В системе $2x - y = 1$, $kx - 2y = 3$ подберите $k$ так, чтобы решений не было.',
      },
      task: {
        kind: 'drag',
        target: { k: 4 },
        back: 4,
        right: {
          en: 'With $k = 4$ the second line is $y = 2x - 1.5$, parallel to $y = 2x - 1$: they never meet. And $\\det \\begin{pmatrix} 2 & -1 \\\\ 4 & -2 \\end{pmatrix} = -4 + 4 = 0$.',
          ru: 'При $k = 4$ вторая прямая — $y = 2x - 1.5$, параллельная $y = 2x - 1$: они не встречаются. И $\\det \\begin{pmatrix} 2 & -1 \\\\ 4 & -2 \\end{pmatrix} = -4 + 4 = 0$.',
        },
        mistakes: [
          { params: { k: 2 }, text: {
            en: 'The numbers in front of $x$ are equal, but the slopes are not: the second line is $y = x - 1.5$, the first $y = 2x - 1$. Compare slopes: divide by the number in front of $y$.',
            ru: 'Числа при $x$ одинаковые, а наклоны — нет: вторая прямая $y = x - 1.5$, первая $y = 2x - 1$. Сравнивайте наклоны: делите на число при $y$.' } },
        ],
        hints: { k: { en: 'The lines still cross (the white point). No solutions means parallel lines: equal slopes. Or: $\\det = 0$.', ru: 'Прямые ещё пересекаются (белая точка). Нет решений — значит, прямые параллельны: наклоны равны. Или: $\\det = 0$.' } },
      },
      state: { show: ['parallelT'], params: { k: 0 }, window: WINDOW, controls: ['k'] },
    },
    {
      title: { en: 'Build the inverse', ru: 'Соберите обратную' },
      text: {
        en: 'The plane has been moved by $M = \\begin{pmatrix} 2 & 1 \\\\ 1 & 1 \\end{pmatrix}$, then your $X$ is applied (dashed arrows — its columns). Make $X = M^{-1}$: the grid has to become square again.',
        ru: 'Плоскость сдвинута матрицей $M = \\begin{pmatrix} 2 & 1 \\\\ 1 & 1 \\end{pmatrix}$, потом применяется ваша $X$ (пунктирные стрелки — её столбцы). Сделайте $X = M^{-1}$: сетка должна снова стать квадратной.',
      },
      task: {
        kind: 'drag',
        target: { ix: 1, iy: -1, jx: -1, jy: 2 },
        back: 3,
        right: {
          en: '$\\det M = 2 - 1 = 1$, so $M^{-1} = \\begin{pmatrix} 1 & -1 \\\\ -1 & 2 \\end{pmatrix}$: the diagonal swapped, the other two with minus.',
          ru: '$\\det M = 2 - 1 = 1$, поэтому $M^{-1} = \\begin{pmatrix} 1 & -1 \\\\ -1 & 2 \\end{pmatrix}$: диагональ переставлена, два других числа — с минусом.',
        },
        mistakes: [
          { params: { ix: 1, iy: 1, jx: 1, jy: 2 }, text: {
            en: 'The diagonal is swapped, but the other two numbers keep their sign. In the inverse they change it: $-b$, $-c$.',
            ru: 'Диагональ переставлена, но два других числа сохранили знак. В обратной они его меняют: $-b$, $-c$.' } },
          { params: { ix: 2, iy: -1, jx: -1, jy: 1 }, text: {
            en: 'The signs are changed, but the diagonal is not swapped: $a$ and $d$ trade places.',
            ru: 'Знаки сменены, но диагональ не переставлена: $a$ и $d$ меняются местами.' } },
        ],
        hints: {
          ix: { en: 'The grid is not square yet. Use the formula: swap $a$ and $d$, change the signs of $b$ and $c$, divide by $\\det M = 1$.', ru: 'Сетка ещё не квадратная. По формуле: переставьте $a$ и $d$, смените знаки у $b$ и $c$, разделите на $\\det M = 1$.' },
          iy: { en: 'The grid is not square yet. Use the formula: swap $a$ and $d$, change the signs of $b$ and $c$, divide by $\\det M = 1$.', ru: 'Сетка ещё не квадратная. По формуле: переставьте $a$ и $d$, смените знаки у $b$ и $c$, разделите на $\\det M = 1$.' },
          jx: { en: 'The grid is not square yet. Use the formula: swap $a$ and $d$, change the signs of $b$ and $c$, divide by $\\det M = 1$.', ru: 'Сетка ещё не квадратная. По формуле: переставьте $a$ и $d$, смените знаки у $b$ и $c$, разделите на $\\det M = 1$.' },
          jy: { en: 'The grid is not square yet. Use the formula: swap $a$ and $d$, change the signs of $b$ and $c$, divide by $\\det M = 1$.', ru: 'Сетка ещё не квадратная. По формуле: переставьте $a$ и $d$, смените знаки у $b$ и $c$, разделите на $\\det M = 1$.' },
        },
      },
      state: { show: ['invT'], params: { ix: 1, iy: 0, jx: 0, jy: 1 }, window: WINDOW, controls: [] },
    },
  ],
};
