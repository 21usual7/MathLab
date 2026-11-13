// A matrix moves the whole plane. A linear map keeps grid lines straight, parallel and evenly spaced and
// keeps the origin; so it is fixed by where the two basis arrows land, î → î′ and ĵ → ĵ′. Those two arrows,
// written as columns, are the matrix; multiplying a vector is taking x·î′ + y·ĵ′.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';

const WHITE = '#ffffff';
const WINDOW = { cx: 0.5, cy: 0.8, unit: 48 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const snap = v => clamp(Math.round(v * 2) / 2, -5, 5);
const r2 = v => fmt(Math.round(v * 100) / 100);
const I_ = '\\hat\\imath', J_ = '\\hat\\jmath';
const mat = (I, J) => `\\begin{pmatrix} \\green{${r2(I[0])}} & \\red{${r2(J[0])}} \\\\ \\green{${r2(I[1])}} & \\red{${r2(J[1])}} \\end{pmatrix}`;
const col = (x, y) => `\\begin{pmatrix} ${r2(x)} \\\\ ${r2(y)} \\end{pmatrix}`;

// Familiar moves: rotation, stretch, shear, reflection (î′, ĵ′)
const EXAMPLES = [
  { I: [0, 1], J: [-1, 0], name: { en: 'rotation by 90°', ru: 'поворот на 90°' } },
  { I: [2, 0], J: [0, 0.5], name: { en: 'stretch along x, squeeze along y', ru: 'растяжение по x, сжатие по y' } },
  { I: [1, 0], J: [1, 1], name: { en: 'shear', ru: 'сдвиг (скос)' } },
  { I: [-1, 0], J: [0, 1], name: { en: 'mirror in the y axis', ru: 'отражение в оси y' } },
];

// The plane under the matrix with columns I, J, part t of the way from where it was:
// the moved grid, the unit square, î′ and ĵ′; optionally a vector v and handles on î′, ĵ′.
// Also used by the topic about the determinant (square: the colour of the square).
export function morph(p, sc, I0, J0, tt, { v = null, drag = false, square = COLORS.yellow } = {}) {
  const I = [1 - tt + tt * I0[0], tt * I0[1]], J = [tt * J0[0], 1 - tt + tt * J0[1]];
  const at = (x, y) => [x * I[0] + y * J[0], x * I[1] + y * J[1]];
  for (let k = -14; k <= 14; k++) {
    const c = k ? 'rgba(120,170,255,0.28)' : 'rgba(150,190,255,0.6)';
    p.line(...at(k, 0), ...at(k, 1), c, { width: k ? 1 : 1.6, extend: true });
    p.line(...at(0, k), ...at(1, k), c, { width: k ? 1 : 1.6, extend: true });
  }
  const sq = [at(0, 0), at(1, 0), at(1, 1), at(0, 1)];
  p.fill(sq, square + '33');
  p.polyline([...sq, sq[0]], square + 'aa', 1.5);
  if (v) {
    const [x, y] = v, a = at(x, 0), b = at(x, y);
    p.arrow(0, 0, ...a, COLORS.green + '88', { width: 2, dash: [5, 4] });
    p.arrow(...a, ...b, COLORS.red + '88', { width: 2, dash: [5, 4] });
    p.arrow(0, 0, ...b, COLORS.yellow, { width: 3 });
    p.tex('v', '\\yellow{\\vec v}', ...b, COLORS.yellow, { dx: 10, dy: -12 });
  }
  p.arrow(0, 0, ...I, COLORS.green, { width: 3.2 });
  p.arrow(0, 0, ...J, COLORS.red, { width: 3.2 });
  p.tex('i', `\\green{${I_}${tt > 0.5 ? "'" : ''}}`, ...I, COLORS.green, { dx: 10, dy: -12 });
  p.tex('j', `\\red{${J_}${tt > 0.5 ? "'" : ''}}`, ...J, COLORS.red, { dx: 10, dy: -12 });
  if (drag) {
    const set = (a, b) => (x, y) => { sc.setParam(a, snap(x)); sc.setParam(b, snap(y)); sc.setParam('t', 1); };
    p.handle(...I, COLORS.green, set('ix', 'iy'));
    p.handle(...J, COLORS.red, set('jx', 'jy'));
  }
}

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
    scene.ensureParam('k', 0, { min: 0, max: 3, step: 1 });
    scene.ensureParam('qx', 0, { min: -5, max: 6, step: 0.5 }); // the student's point in the second task
    scene.ensureParam('qy', 0, { min: -5, max: 6, step: 0.5 });

    scene.custom.push(
      {
        id: 'morph',
        draw2d(p, sc, s) { morph(p, sc, I(s), J(s), s.t, { drag: true }); },
        legend: s => `${t({ en: '\\text{matrix}', ru: '\\text{матрица}' })}\\ ${mat(I(s), J(s))}`,
      },
      {
        // The same with the vector v = (1; 2) carried along: x·î′ + y·ĵ′
        id: 'morphV',
        draw2d(p, sc, s) { morph(p, sc, I(s), J(s), s.t, { v: [1, 2], drag: true }); },
        legend: s => `${mat(I(s), J(s))} ${col(1, 2)} = 1 \\green{${col(s.ix, s.iy)}} + 2 \\red{${col(s.jx, s.jy)}} = \\yellow{${col(s.ix + 2 * s.jx, s.iy + 2 * s.jy)}}`,
      },
      {
        id: 'examples',
        draw2d(p, sc, s) { const e = EXAMPLES[Math.round(s.k)]; morph(p, sc, e.I, e.J, s.t); },
        legend: s => { const e = EXAMPLES[Math.round(s.k)]; return `\\text{${t(e.name)}}:\\ ${mat(e.I, e.J)}`; },
      },
      // ---- Tasks ----
      {
        id: 'free',
        draw2d(p, sc, s) { morph(p, sc, I(s), J(s), 1, { drag: true }); },
      },
      {
        // The matrix is fixed; v = (2; 1) before the move is shown faint, the student puts where it lands
        id: 'whereV',
        draw2d(p, sc, s) {
          morph(p, sc, [1, 1], [-1, 2], 1);
          p.arrow(0, 0, 2, 1, 'rgba(255,255,255,0.4)', { width: 2, dash: [5, 4] });
          p.tex('v0', '\\vec v', 2, 1, 'rgba(255,255,255,0.6)', { dx: 10, dy: 10 });
          p.dot(s.qx, s.qy, COLORS.yellow, 6);
          p.handle(s.qx, s.qy, COLORS.yellow, (x, y) => { sc.setParam('qx', snap(x)); sc.setParam('qy', snap(y)); });
        },
        legend: () => `M = ${mat([1, 1], [-1, 2])},\\quad \\vec v = ${col(2, 1)}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'Every point moves', ru: 'Каждая точка куда-то едет' },
      text: {
        en: 'A transformation takes every point of the plane somewhere else. Watch the grid: it slants and stretches, but its lines stay <b>straight</b>, <b>parallel</b> and <b>evenly spaced</b>, and the origin stays put. Transformations like this are called <i>linear</i>. The yellow unit square turns into a parallelogram.',
        ru: 'Преобразование переносит каждую точку плоскости в другое место. Смотрите на сетку: она скашивается и растягивается, но её линии остаются <b>прямыми</b>, <b>параллельными</b> и <b>равноотстоящими</b>, а начало координат стоит на месте. Такие преобразования называют <i>линейными</i>. Жёлтый единичный квадрат превращается в параллелограмм.',
      },
      try: { en: 'Press ▶ next to $t$, or drag $t$ back and forth.', ru: 'Нажмите ▶ возле $t$ или тяните $t$ туда-сюда.' },
      state: { show: ['morph'], params: { ix: 2, iy: 1, jx: -1, jy: 1 }, window: WINDOW, controls: ['t'] },
      enter(scene) {
        scene.setParam('t', 0);
        scene.animateParams({ t: 1 }, 3500);
      },
    },
    {
      title: { en: 'Two arrows decide everything', ru: 'Всё решают две стрелки' },
      text: {
        en: 'Where does $\\yellow{\\vec v} = \\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix}$ go? Before the move it is $1\\,\\green{' + I_ + '} + 2\\,\\red{' + J_ + '}$: one step of $' + I_ + '$, two of $' + J_ + '$. The grid moves as a whole, so after the move it is still one step of the <i>new</i> $\\green{' + I_ + '\'}$ and two of the new $\\red{' + J_ + '\'}$. Know where the two basis arrows land — and you know where every point lands.',
        ru: 'Куда переедет $\\yellow{\\vec v} = \\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix}$? До движения это $1\\,\\green{' + I_ + '} + 2\\,\\red{' + J_ + '}$: один шаг $' + I_ + '$ и два шага $' + J_ + '$. Сетка движется целиком, поэтому после движения это всё так же один шаг <i>нового</i> $\\green{' + I_ + '\'}$ и два шага нового $\\red{' + J_ + '\'}$. Знаешь, куда попали две базисные стрелки, — знаешь, куда попала любая точка.',
      },
      try: { en: 'Drag the ends of $' + I_ + '\'$ and $' + J_ + '\'$: the whole plane follows.', ru: 'Тяните концы $' + I_ + '\'$ и $' + J_ + '\'$: вся плоскость следует за ними.' },
      check: {
        q: { en: 'If $' + I_ + '\' = \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$ and $' + J_ + '\' = \\begin{pmatrix} -1 \\\\ 1 \\end{pmatrix}$, where does $\\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix}$ go?', ru: 'Если $' + I_ + '\' = \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$ и $' + J_ + '\' = \\begin{pmatrix} -1 \\\\ 1 \\end{pmatrix}$, куда переедет $\\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix}$?' },
        options: [{ text: '$\\begin{pmatrix} 0 \\\\ 3 \\end{pmatrix}$', ok: true }, { text: '$\\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix}$' }, { text: '$\\begin{pmatrix} 3 \\\\ 0 \\end{pmatrix}$' }],
        explain: {
          en: '$1 \\cdot \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix} + 2 \\cdot \\begin{pmatrix} -1 \\\\ 1 \\end{pmatrix} = \\begin{pmatrix} 0 \\\\ 3 \\end{pmatrix}$ — the yellow arrow on the picture.',
          ru: '$1 \\cdot \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix} + 2 \\cdot \\begin{pmatrix} -1 \\\\ 1 \\end{pmatrix} = \\begin{pmatrix} 0 \\\\ 3 \\end{pmatrix}$ — жёлтая стрелка на картинке.',
        },
        reveal: scene => scene.animateParams({ ix: 2, iy: 1, jx: -1, jy: 1, t: 1 }, 1200),
      },
      state: { show: ['morphV'], params: { ix: 2, iy: 1, jx: -1, jy: 1, t: 1 }, window: WINDOW, controls: ['t'] },
    },
    {
      title: { en: 'A matrix is two columns', ru: 'Матрица — это две колонки' },
      text: {
        en: 'Write $\\green{' + I_ + '\'}$ and $\\red{' + J_ + '\'}$ side by side as columns — that table is the <i>matrix</i> of the transformation. Multiplying the matrix by a vector means exactly what we did: $x$ times the first column plus $y$ times the second. $$\\begin{pmatrix} \\green{a} & \\red{b} \\\\ \\green{c} & \\red{d} \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = x \\green{\\begin{pmatrix} a \\\\ c \\end{pmatrix}} + y \\red{\\begin{pmatrix} b \\\\ d \\end{pmatrix}}$$ The rule «row times column» from the textbook is the same thing, written out number by number.',
        ru: 'Запишем $\\green{' + I_ + '\'}$ и $\\red{' + J_ + '\'}$ рядом, столбцами, — эта табличка и есть <i>матрица</i> преобразования. Умножить матрицу на вектор — ровно то, что мы делали: $x$ раз первый столбец плюс $y$ раз второй. $$\\begin{pmatrix} \\green{a} & \\red{b} \\\\ \\green{c} & \\red{d} \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = x \\green{\\begin{pmatrix} a \\\\ c \\end{pmatrix}} + y \\red{\\begin{pmatrix} b \\\\ d \\end{pmatrix}}$$ Правило «строка на столбец» из учебника — то же самое, расписанное по числам.',
      },
      check: {
        q: { en: '$\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix} \\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix} = ?$', ru: '$\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix} \\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix} = ?$' },
        options: [{ text: '$\\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix}$' }, { text: '$\\begin{pmatrix} 1 \\\\ 3 \\end{pmatrix}$', ok: true }, { text: '$\\begin{pmatrix} 3 \\\\ 7 \\end{pmatrix}$' }],
        explain: {
          en: '$\\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$ is $' + I_ + '$ itself, and $' + I_ + '$ goes to the first <b>column</b>: $\\begin{pmatrix} 1 \\\\ 3 \\end{pmatrix}$. Not the first row.',
          ru: '$\\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$ — это сам $' + I_ + '$, а он переходит в первый <b>столбец</b>: $\\begin{pmatrix} 1 \\\\ 3 \\end{pmatrix}$. Не в первую строку.',
        },
      },
      state: { show: ['morphV'], params: { ix: 2, iy: 1, jx: -1, jy: 1, t: 1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Familiar moves', ru: 'Знакомые движения' },
      text: {
        en: 'Many moves you know are linear, and each is just two columns. Rotation by $90°$: $' + I_ + '$ goes up, $' + J_ + '$ goes left. A stretch: the columns lie on the axes. A shear: $' + I_ + '$ stays, $' + J_ + '$ leans over. A mirror: one of them turns around — and the square turns inside out (green and red swap sides).',
        ru: 'Многие знакомые движения линейны, и каждое — это просто два столбца. Поворот на $90°$: $' + I_ + '$ уходит вверх, $' + J_ + '$ — влево. Растяжение: столбцы лежат на осях. Сдвиг: $' + I_ + '$ стоит, $' + J_ + '$ наклоняется. Отражение: одна из стрелок разворачивается — и квадрат выворачивается наизнанку (зелёная и красная меняются сторонами).',
      },
      try: { en: 'Choose a move with $k$, then press ▶ next to $t$.', ru: 'Выберите движение ползунком $k$, потом нажмите ▶ возле $t$.' },
      check: {
        q: { en: 'Which matrix turns the plane by $90°$ clockwise?', ru: 'Какая матрица поворачивает плоскость на $90°$ по часовой стрелке?' },
        options: [{ text: '$\\begin{pmatrix} 0 & 1 \\\\ -1 & 0 \\end{pmatrix}$', ok: true }, { text: '$\\begin{pmatrix} 0 & -1 \\\\ 1 & 0 \\end{pmatrix}$' }, { text: '$\\begin{pmatrix} -1 & 0 \\\\ 0 & -1 \\end{pmatrix}$' }],
        explain: {
          en: 'Clockwise, $' + I_ + '$ (pointing right) turns down: $\\begin{pmatrix} 0 \\\\ -1 \\end{pmatrix}$ — the first column. $' + J_ + '$ (pointing up) turns right: $\\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$. The second option is the counter-clockwise turn, the third a turn by $180°$.',
          ru: 'По часовой $' + I_ + '$ (смотрит вправо) поворачивается вниз: $\\begin{pmatrix} 0 \\\\ -1 \\end{pmatrix}$ — первый столбец. $' + J_ + '$ (смотрит вверх) поворачивается вправо: $\\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$. Второй вариант — поворот против часовой, третий — на $180°$.',
        },
      },
      state: { show: ['examples'], params: { k: 0, t: 1 }, window: WINDOW, controls: ['k', 't'] },
    },
    {
      title: { en: 'When the plane collapses', ru: 'Когда плоскость схлопывается' },
      text: {
        en: 'Here $\\red{' + J_ + '\'}$ lies on the line of $\\green{' + I_ + '\'}$. The whole grid falls onto that line, and the square becomes a segment: the whole plane is squashed into a line. Such a move cannot be undone — many points land on the same place, and you cannot tell which one came from where. How much a matrix squashes areas is the <i>determinant</i>, the next topic.',
        ru: 'Здесь $\\red{' + J_ + '\'}$ лежит на прямой $\\green{' + I_ + '\'}$. Вся сетка ложится на эту прямую, а квадрат становится отрезком: вся плоскость сплющена в прямую. Такое движение нельзя отменить — много точек попадает в одно место, и не узнать, какая откуда пришла. Насколько матрица сплющивает площади, измеряет <i>определитель</i> — следующая тема.',
      },
      try: { en: 'Drag $' + J_ + '\'$ off the line and back: the plane opens and closes.', ru: 'Стащите $' + J_ + '\'$ с прямой и верните: плоскость раскрывается и схлопывается.' },
      check: {
        q: { en: 'Where does $\\begin{pmatrix} 2 & -4 \\\\ 1 & -2 \\end{pmatrix}$ put the whole plane?', ru: 'Куда матрица $\\begin{pmatrix} 2 & -4 \\\\ 1 & -2 \\end{pmatrix}$ отправляет всю плоскость?' },
        options: [{ text: { en: 'onto the line through $(2;\\ 1)$', ru: 'на прямую через $(2;\\ 1)$' }, ok: true }, { text: { en: 'it stays a plane', ru: 'остаётся плоскостью' } }, { text: { en: 'into the origin', ru: 'в начало координат' } }],
        explain: {
          en: 'The second column is $-2$ times the first, so both land on the line of $\\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$, and so does every combination of them.',
          ru: 'Второй столбец — это первый, умноженный на $-2$, поэтому оба лежат на прямой $\\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$, а значит, и любая их комбинация.',
        },
        reveal: scene => scene.animateParams({ ix: 2, iy: 1, jx: -4, jy: -2, t: 1 }, 1500),
      },
      state: { show: ['morph'], params: { ix: 2, iy: 1, jx: -2, jy: -1, t: 1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'Drag $' + I_ + '\'$ and $' + J_ + '\'$ anywhere and replay the move with $t$. Find a matrix that turns the square inside out without squashing it, and one that makes it twice as big. And think ahead: what happens if you apply one matrix and then another?',
        ru: 'Тяните $' + I_ + '\'$ и $' + J_ + '\'$ куда угодно и переигрывайте движение ползунком $t$. Найдите матрицу, которая выворачивает квадрат, не сплющивая, и такую, которая увеличивает его площадь вдвое. И подумайте наперёд: что будет, если применить одну матрицу, а потом другую?',
      },
      state: { show: ['morph'], params: { ix: 1.5, iy: 0.5, jx: -0.5, jy: 1, t: 1 }, window: WINDOW, controls: ['t'] },
    },
    {
      title: { en: 'Build a rotation', ru: 'Соберите поворот' },
      text: {
        en: 'Drag $\\green{' + I_ + '\'}$ and $\\red{' + J_ + '\'}$ so that the matrix turns the plane by $90°$ <b>counter-clockwise</b>.',
        ru: 'Перетащите $\\green{' + I_ + '\'}$ и $\\red{' + J_ + '\'}$ так, чтобы матрица поворачивала плоскость на $90°$ <b>против часовой стрелки</b>.',
      },
      task: {
        kind: 'drag',
        target: { ix: 0, iy: 1, jx: -1, jy: 0 },
        back: 3,
        right: {
          en: '$' + I_ + '$ turns from «right» to «up», $' + J_ + '$ from «up» to «left»: the matrix $\\begin{pmatrix} 0 & -1 \\\\ 1 & 0 \\end{pmatrix}$.',
          ru: '$' + I_ + '$ поворачивается из «вправо» в «вверх», $' + J_ + '$ — из «вверх» во «влево»: матрица $\\begin{pmatrix} 0 & -1 \\\\ 1 & 0 \\end{pmatrix}$.',
        },
        mistakes: [
          { params: { ix: 0, iy: -1, jx: 1, jy: 0 }, text: {
            en: 'This is a turn the other way, clockwise: $' + I_ + '$ went down. Counter-clockwise, «right» turns into «up».',
            ru: 'Это поворот в другую сторону, по часовой: $' + I_ + '$ ушёл вниз. Против часовой «вправо» поворачивается в «вверх».' } },
          { params: { ix: 0, iy: 1, jx: 1, jy: 0 }, text: {
            en: '$' + I_ + '\'$ is right, but $' + J_ + '$ went right instead of left — look at the square: it is turned inside out. This is a mirror in the line $y = x$, not a rotation.',
            ru: '$' + I_ + '\'$ верно, а $' + J_ + '$ ушёл вправо вместо влево — посмотрите на квадрат: он вывернут. Это отражение в прямой $y = x$, а не поворот.' } },
        ],
        hints: {
          ix: { en: '$' + I_ + '$ points right; after a quarter turn counter-clockwise it points up.', ru: '$' + I_ + '$ смотрит вправо; после четверти оборота против часовой он смотрит вверх.' },
          iy: { en: '$' + I_ + '$ points right; after a quarter turn counter-clockwise it points up.', ru: '$' + I_ + '$ смотрит вправо; после четверти оборота против часовой он смотрит вверх.' },
          jx: { en: '$' + J_ + '$ points up; after the same turn it points left.', ru: '$' + J_ + '$ смотрит вверх; после того же поворота он смотрит влево.' },
          jy: { en: '$' + J_ + '$ points up; after the same turn it points left.', ru: '$' + J_ + '$ смотрит вверх; после того же поворота он смотрит влево.' },
        },
      },
      state: { show: ['free'], params: { ix: 1, iy: 0, jx: 0, jy: 1, t: 1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Where does it land?', ru: 'Куда переедет?' },
      text: {
        en: 'The plane has been moved by the matrix in the legend. The faint arrow is $\\vec v$ before the move. Drag the yellow point to where $\\vec v$ lands.',
        ru: 'Плоскость сдвинута матрицей из подписи. Бледная стрелка — $\\vec v$ до движения. Перетащите жёлтую точку туда, куда переедет $\\vec v$.',
      },
      task: {
        kind: 'drag',
        target: { qx: 1, qy: 4 },
        back: 2,
        right: {
          en: '$2\\,\\green{\\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}} + 1\\,\\red{\\begin{pmatrix} -1 \\\\ 2 \\end{pmatrix}} = \\begin{pmatrix} 1 \\\\ 4 \\end{pmatrix}$. On the moved grid it is simply the node «$2$ along $' + I_ + '\'$, $1$ along $' + J_ + '\'$».',
          ru: '$2\\,\\green{\\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}} + 1\\,\\red{\\begin{pmatrix} -1 \\\\ 2 \\end{pmatrix}} = \\begin{pmatrix} 1 \\\\ 4 \\end{pmatrix}$. На сдвинутой сетке это просто узел «$2$ вдоль $' + I_ + '\'$, $1$ вдоль $' + J_ + '\'$».',
        },
        mistakes: [
          { params: { qx: 3, qy: 0 }, text: {
            en: 'You took the rows for the columns. The first <b>column</b> $\\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$ is where $' + I_ + '$ lands; take it $2$ times, then add the second column once.',
            ru: 'Вы взяли строки вместо столбцов. Первый <b>столбец</b> $\\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$ — то, куда попал $' + I_ + '$; возьмите его $2$ раза и прибавьте второй столбец один раз.' } },
          { params: { qx: 2, qy: 1 }, text: {
            en: 'This is $\\vec v$ before the move. The point moves together with the grid: count $2$ steps along the new $' + I_ + '\'$ and $1$ along the new $' + J_ + '\'$.',
            ru: 'Это $\\vec v$ до движения. Точка едет вместе с сеткой: отсчитайте $2$ шага вдоль нового $' + I_ + '\'$ и $1$ вдоль нового $' + J_ + '\'$.' } },
          { params: { qx: -1, qy: 5 }, text: {
            en: 'The numbers are swapped: this is $1$ step along $' + I_ + '\'$ and $2$ along $' + J_ + '\'$. $\\vec v = (2;\\ 1)$: $x = 2$ goes with the first column.',
            ru: 'Перепутаны числа: это $1$ шаг вдоль $' + I_ + '\'$ и $2$ вдоль $' + J_ + '\'$. $\\vec v = (2;\\ 1)$: $x = 2$ идёт с первым столбцом.' } },
        ],
        hints: {
          qx: { en: 'Not there yet. Count along the moved grid: $2$ steps along the green arrow, then $1$ along the red one.', ru: 'Пока не там. Считайте по сдвинутой сетке: $2$ шага вдоль зелёной стрелки, потом $1$ вдоль красной.' },
          qy: { en: 'Not there yet. Count along the moved grid: $2$ steps along the green arrow, then $1$ along the red one.', ru: 'Пока не там. Считайте по сдвинутой сетке: $2$ шага вдоль зелёной стрелки, потом $1$ вдоль красной.' },
        },
      },
      state: { show: ['whereV'], params: { qx: 0, qy: 0 }, window: { cx: 0.5, cy: 1.5, unit: 46 }, controls: [] },
    },
    {
      title: { en: 'Build a shear', ru: 'Соберите сдвиг' },
      text: {
        en: 'Make a shear: horizontal lines stay where they are, and the point $(0;\\ 1)$ moves to $(1;\\ 1)$. Drag $\\green{' + I_ + '\'}$ and $\\red{' + J_ + '\'}$.',
        ru: 'Сделайте сдвиг: горизонтальные линии остаются на месте, а точка $(0;\\ 1)$ переезжает в $(1;\\ 1)$. Тяните $\\green{' + I_ + '\'}$ и $\\red{' + J_ + '\'}$.',
      },
      task: {
        kind: 'drag',
        target: { ix: 1, iy: 0, jx: 1, jy: 1 },
        back: 3,
        right: {
          en: '$' + I_ + '$ lies on a horizontal line, so it stays: $\\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$. $' + J_ + '$ is the point $(0;\\ 1)$, so it goes to $\\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$. The matrix is $\\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix}$: every point slides right by its own height.',
          ru: '$' + I_ + '$ лежит на горизонтальной линии, значит, стоит на месте: $\\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$. $' + J_ + '$ — это точка $(0;\\ 1)$, значит, переходит в $\\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$. Матрица $\\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix}$: каждая точка съезжает вправо на свою высоту.',
        },
        mistakes: [
          { params: { ix: 1, iy: 1, jx: 0, jy: 1 }, text: {
            en: 'This shear tilts the horizontal lines and keeps the vertical ones. We need the opposite: horizontal lines stay.',
            ru: 'Этот сдвиг наклоняет горизонтальные линии и сохраняет вертикальные. Нужно наоборот: горизонтальные остаются.' } },
        ],
        hints: {
          ix: { en: 'Horizontal lines stay in place — so $' + I_ + '$, which lies on one, does not move.', ru: 'Горизонтальные линии остаются на месте — значит, $' + I_ + '$, который на такой линии лежит, не двигается.' },
          iy: { en: 'Horizontal lines stay in place — so $' + I_ + '$, which lies on one, does not move.', ru: 'Горизонтальные линии остаются на месте — значит, $' + I_ + '$, который на такой линии лежит, не двигается.' },
          jx: { en: '$' + J_ + '$ is the point $(0;\\ 1)$: it has to land on $(1;\\ 1)$.', ru: '$' + J_ + '$ — это точка $(0;\\ 1)$: она должна попасть в $(1;\\ 1)$.' },
          jy: { en: '$' + J_ + '$ is the point $(0;\\ 1)$: it has to land on $(1;\\ 1)$.', ru: '$' + J_ + '$ — это точка $(0;\\ 1)$: она должна попасть в $(1;\\ 1)$.' },
        },
      },
      state: { show: ['free'], params: { ix: 1, iy: 0, jx: 0, jy: 1, t: 1 }, window: WINDOW, controls: [] },
    },
  ],
};
