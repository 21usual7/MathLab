// Vectors. An arrow is a displacement, not a place; its coordinates are steps along x and y. Adding is
// walking one arrow after the other, multiplying by a number stretches and flips. All the combinations
// a·v + b·w of two arrows form a grid that covers the plane — unless the arrows lie on one line.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';

const WHITE = '#ffffff';
const WINDOW = { cx: 0.5, cy: 0.8, unit: 52 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const snap = v => clamp(Math.round(v * 2) / 2, -6, 6);
const r2 = v => fmt(Math.round(v * 100) / 100);
const col = (x, y) => `\\begin{pmatrix} ${r2(x)} \\\\ ${r2(y)} \\end{pmatrix}`;
const cross = (s) => s.vx * s.wy - s.vy * s.wx;

// The plane covered by a·v + b·w: lines through k·v along w and through k·w along v
function grid(p, s, color) {
  for (let k = -12; k <= 12; k++) {
    p.line(k * s.vx, k * s.vy, k * s.vx + s.wx, k * s.vy + s.wy, color, { width: k ? 1 : 1.6, extend: true });
    p.line(k * s.wx, k * s.wy, k * s.wx + s.vx, k * s.wy + s.vy, color, { width: k ? 1 : 1.6, extend: true });
  }
}

export default {
  view: '2d',
  view2d: WINDOW,
  lab: false, // the Lab has no vectors yet

  setup(scene) {
    scene.ensureParam('vx', 2, { min: -6, max: 6, step: 0.5 });
    scene.ensureParam('vy', 1, { min: -6, max: 6, step: 0.5 });
    scene.ensureParam('wx', -1, { min: -6, max: 6, step: 0.5 });
    scene.ensureParam('wy', 1.5, { min: -6, max: 6, step: 0.5 });
    scene.ensureParam('a', 1, { min: -3, max: 3, step: 0.5 });
    scene.ensureParam('b', 1, { min: -3, max: 3, step: 0.5 });
    scene.ensureParam('sx', 1, { min: -6, max: 6, step: 0.5 }); // the student's arrow in the first task
    scene.ensureParam('sy', -1, { min: -6, max: 6, step: 0.5 });

    const tipV = (p, sc, s) => p.handle(s.vx, s.vy, COLORS.green, (x, y) => { sc.setParam('vx', snap(x)); sc.setParam('vy', snap(y)); });
    const tipW = (p, sc, s) => p.handle(s.wx, s.wy, COLORS.red, (x, y) => { sc.setParam('wx', snap(x)); sc.setParam('wy', snap(y)); });
    const name = (p, key, tex, x, y, color) => p.tex(key, tex, x, y, color, { dx: 10, dy: -12 });

    scene.custom.push(
      {
        // One arrow, drawn from three different places: the same displacement
        id: 'arrow',
        draw2d(p, sc, s) {
          [[-4, 2.5], [2, -2.5]].forEach(([x, y]) => p.arrow(x, y, x + s.vx, y + s.vy, COLORS.green + '77', { width: 2.5 }));
          p.arrow(0, 0, s.vx, s.vy, COLORS.green, { width: 3 });
          name(p, 'v', '\\green{\\vec v}', s.vx, s.vy, COLORS.green);
          tipV(p, sc, s);
        },
        legend: s => `\\green{\\vec v} = ${col(s.vx, s.vy)}`,
      },
      {
        // Coordinates: so many steps along x, then so many along y
        id: 'coords',
        draw2d(p, sc, s) {
          p.arrow(0, 0, s.vx, 0, COLORS.grey, { width: 2, dash: [5, 4] });
          p.arrow(s.vx, 0, s.vx, s.vy, COLORS.grey, { width: 2, dash: [5, 4] });
          p.tex('cx', r2(s.vx), s.vx / 2, 0, COLORS.grey, { dx: 0, dy: s.vy >= 0 ? 16 : -16, align: 'center' });
          p.tex('cy', r2(s.vy), s.vx, s.vy / 2, COLORS.grey, { dx: s.vx >= 0 ? 10 : -10, dy: 0, align: s.vx >= 0 ? 'left' : 'right' });
          p.arrow(0, 0, s.vx, s.vy, COLORS.green, { width: 3 });
          name(p, 'v', '\\green{\\vec v}', s.vx, s.vy, COLORS.green);
          tipV(p, sc, s);
        },
        legend: s => `\\green{\\vec v} = ${r2(s.vx)}\\,\\vec\\imath + ${r2(s.vy)}\\,\\vec\\jmath = ${col(s.vx, s.vy)}`,
      },
      {
        // The sum: one arrow after the other, both ways round — a parallelogram
        id: 'sum',
        draw2d(p, sc, s) {
          const x = s.vx + s.wx, y = s.vy + s.wy;
          p.arrow(s.vx, s.vy, x, y, COLORS.red + '88', { width: 2.2, dash: [6, 4] });
          p.arrow(s.wx, s.wy, x, y, COLORS.green + '88', { width: 2.2, dash: [6, 4] });
          p.arrow(0, 0, x, y, COLORS.yellow, { width: 3 });
          p.arrow(0, 0, s.vx, s.vy, COLORS.green, { width: 3 });
          p.arrow(0, 0, s.wx, s.wy, COLORS.red, { width: 3 });
          name(p, 'v', '\\green{\\vec v}', s.vx, s.vy, COLORS.green);
          name(p, 'w', '\\red{\\vec w}', s.wx, s.wy, COLORS.red);
          name(p, 's', '\\yellow{\\vec v + \\vec w}', x, y, COLORS.yellow);
          tipV(p, sc, s);
          tipW(p, sc, s);
        },
        legend: s => `\\green{${col(s.vx, s.vy)}} + \\red{${col(s.wx, s.wy)}} = \\yellow{${col(s.vx + s.wx, s.vy + s.wy)}}`,
      },
      {
        // a·v: stretched, shrunk, flipped
        id: 'scale',
        draw2d(p, sc, s) {
          p.line(0, 0, s.vx, s.vy, 'rgba(255,255,255,0.15)', { width: 1, extend: true });
          p.arrow(0, 0, s.a * s.vx, s.a * s.vy, COLORS.yellow, { width: 3 });
          p.arrow(0, 0, s.vx, s.vy, COLORS.green, { width: 2 });
          name(p, 'v', '\\green{\\vec v}', s.vx, s.vy, COLORS.green);
          name(p, 'av', `\\yellow{${r2(s.a)}\\,\\vec v}`, s.a * s.vx, s.a * s.vy, COLORS.yellow);
        },
        legend: s => `\\yellow{${r2(s.a)}}\\,\\green{${col(s.vx, s.vy)}} = \\yellow{${col(s.a * s.vx, s.a * s.vy)}}`,
      },
      {
        // a·v + b·w over the grid that v and w make
        id: 'combo',
        draw2d(p, sc, s) {
          grid(p, s, 'rgba(120,170,255,0.22)');
          const ax = s.a * s.vx, ay = s.a * s.vy, x = ax + s.b * s.wx, y = ay + s.b * s.wy;
          p.arrow(0, 0, ax, ay, COLORS.green + 'aa', { width: 2.5 });
          p.arrow(ax, ay, x, y, COLORS.red + 'aa', { width: 2.5 });
          p.arrow(0, 0, s.vx, s.vy, COLORS.green, { width: 3 });
          p.arrow(0, 0, s.wx, s.wy, COLORS.red, { width: 3 });
          p.dot(x, y, COLORS.yellow, 6);
          name(p, 'v', '\\green{\\vec v}', s.vx, s.vy, COLORS.green);
          name(p, 'w', '\\red{\\vec w}', s.wx, s.wy, COLORS.red);
          tipV(p, sc, s);
          tipW(p, sc, s);
        },
        legend: s => {
          const x = s.a * s.vx + s.b * s.wx, y = s.a * s.vy + s.b * s.wy;
          const span = Math.abs(cross(s)) < 1e-9
            ? t({ en: '\\text{only a line}', ru: '\\text{только прямая}' })
            : t({ en: '\\text{the whole plane}', ru: '\\text{вся плоскость}' });
          return `${r2(s.a)}\\,\\green{\\vec v} + ${r2(s.b)}\\,\\red{\\vec w} = \\yellow{${col(x, y)}} \\qquad ${span}`;
        },
      },
      // ---- Tasks ----
      {
        // u and w are fixed; the student drags the end of the yellow arrow to u + w
        id: 'sumT',
        draw2d(p, sc, s) {
          p.arrow(0, 0, 3, 1, COLORS.green, { width: 3 });
          p.arrow(0, 0, -1, 2, COLORS.red, { width: 3 });
          name(p, 'u', '\\green{\\vec u}', 3, 1, COLORS.green);
          name(p, 'w', '\\red{\\vec w}', -1, 2, COLORS.red);
          p.arrow(0, 0, s.sx, s.sy, COLORS.yellow, { width: 3 });
          p.handle(s.sx, s.sy, COLORS.yellow, (x, y) => { sc.setParam('sx', snap(x)); sc.setParam('sy', snap(y)); });
        },
      },
      {
        // v, w and the point P; the student moves a and b
        id: 'reachP',
        draw2d(p, sc, s) {
          grid(p, s, 'rgba(120,170,255,0.18)');
          const ax = s.a * s.vx, ay = s.a * s.vy, x = ax + s.b * s.wx, y = ay + s.b * s.wy;
          p.arrow(0, 0, ax, ay, COLORS.green + 'aa', { width: 2.5 });
          p.arrow(ax, ay, x, y, COLORS.red + 'aa', { width: 2.5 });
          p.arrow(0, 0, s.vx, s.vy, COLORS.green, { width: 3 });
          p.arrow(0, 0, s.wx, s.wy, COLORS.red, { width: 3 });
          name(p, 'v', '\\green{\\vec v}', s.vx, s.vy, COLORS.green);
          name(p, 'w', '\\red{\\vec w}', s.wx, s.wy, COLORS.red);
          p.ring(-1, 4, WHITE, 8);
          p.tex('P', 'P', -1, 4, WHITE, { dx: 12, dy: -12 });
          p.dot(x, y, COLORS.yellow, 6);
        },
      },
      {
        // v is fixed, w is dragged; the grid collapses when w falls on the line of v
        id: 'collapse',
        draw2d(p, sc, s) {
          grid(p, s, 'rgba(120,170,255,0.22)');
          p.arrow(0, 0, s.vx, s.vy, COLORS.green, { width: 3 });
          p.arrow(0, 0, s.wx, s.wy, COLORS.red, { width: 3 });
          name(p, 'v', '\\green{\\vec v}', s.vx, s.vy, COLORS.green);
          name(p, 'w', '\\red{\\vec w}', s.wx, s.wy, COLORS.red);
          tipW(p, sc, s);
        },
      },
    );
  },

  steps: [
    {
      title: { en: 'An arrow is a move', ru: 'Стрелка — это перемещение' },
      text: {
        en: 'A vector is an arrow: a length and a direction. What matters is <b>how far and which way</b> it moves you, not where it starts. The three green arrows are one and the same vector $\\green{\\vec v}$, drawn from three different places. Usually we draw it from the origin.',
        ru: 'Вектор — это стрелка: длина и направление. Важно, <b>на сколько и куда</b> он перемещает, а не откуда он начинается. Три зелёные стрелки — один и тот же вектор $\\green{\\vec v}$, нарисованный из трёх разных мест. Обычно его рисуют из начала координат.',
      },
      try: { en: 'Drag the end of the bright arrow: all three copies change together.', ru: 'Тяните конец яркой стрелки: все три копии меняются вместе.' },
      state: { show: ['arrow'], params: { vx: 2, vy: 1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Two numbers', ru: 'Два числа' },
      text: {
        en: 'To describe the move, say how many steps it makes along $x$ and how many along $y$. These are the coordinates of the vector, written in a column: $\\green{\\vec v} = \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$. In other words, $\\vec v$ is $2$ steps of the unit arrow $\\vec\\imath$ to the right and $1$ step of $\\vec\\jmath$ up.',
        ru: 'Чтобы описать перемещение, скажем, сколько шагов оно делает по $x$ и сколько по $y$. Это координаты вектора, их пишут столбиком: $\\green{\\vec v} = \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$. Иначе говоря, $\\vec v$ — это $2$ шага единичной стрелки $\\vec\\imath$ вправо и $1$ шаг $\\vec\\jmath$ вверх.',
      },
      try: { en: 'Drag the end of $\\vec v$ and read the two steps.', ru: 'Тяните конец $\\vec v$ и читайте два шага.' },
      check: {
        q: { en: 'The arrow goes from $A(1;\\ 1)$ to $B(4;\\ 3)$. What are its coordinates?', ru: 'Стрелка идёт из $A(1;\\ 1)$ в $B(4;\\ 3)$. Каковы её координаты?' },
        options: [{ text: '$\\begin{pmatrix} 4 \\\\ 3 \\end{pmatrix}$' }, { text: '$\\begin{pmatrix} 3 \\\\ 2 \\end{pmatrix}$', ok: true }, { text: '$\\begin{pmatrix} 5 \\\\ 4 \\end{pmatrix}$' }],
        explain: {
          en: 'A vector is a move, so subtract: end minus start. $4 - 1 = 3$ steps right, $3 - 1 = 2$ steps up. $(4;\\ 3)$ are the coordinates of the <i>point</i> $B$, not of the move.',
          ru: 'Вектор — перемещение, поэтому вычитаем: конец минус начало. $4 - 1 = 3$ шага вправо, $3 - 1 = 2$ шага вверх. $(4;\\ 3)$ — координаты <i>точки</i> $B$, а не перемещения.',
        },
      },
      state: { show: ['coords'], params: { vx: 2, vy: 1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Adding is walking', ru: 'Сложение — это прогулка' },
      text: {
        en: 'First move by $\\green{\\vec v}$, then by $\\red{\\vec w}$: where do you end up? That is $\\yellow{\\vec v + \\vec w}$ — put the tail of the second arrow at the tip of the first. In the other order you arrive at the same place, so the two paths make a parallelogram. In numbers, steps simply add up: $x$ with $x$, $y$ with $y$.',
        ru: 'Сначала переместимся на $\\green{\\vec v}$, потом на $\\red{\\vec w}$: где окажемся? Это и есть $\\yellow{\\vec v + \\vec w}$ — хвост второй стрелки ставим в конец первой. В другом порядке придём туда же, поэтому два пути образуют параллелограмм. В числах шаги просто складываются: $x$ с $x$, $y$ с $y$.',
      },
      try: { en: 'Drag the ends of $\\vec v$ and $\\vec w$.', ru: 'Тяните концы $\\vec v$ и $\\vec w$.' },
      check: {
        q: { en: '$\\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix} + \\begin{pmatrix} -3 \\\\ 2 \\end{pmatrix} = ?$', ru: '$\\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix} + \\begin{pmatrix} -3 \\\\ 2 \\end{pmatrix} = ?$' },
        options: [{ text: '$\\begin{pmatrix} -1 \\\\ 3 \\end{pmatrix}$', ok: true }, { text: '$\\begin{pmatrix} 5 \\\\ -1 \\end{pmatrix}$' }, { text: '$\\begin{pmatrix} -6 \\\\ 2 \\end{pmatrix}$' }],
        explain: {
          en: '$2$ steps right and $3$ left — $1$ left in total; $1$ up and $2$ up — $3$ up.',
          ru: '$2$ шага вправо и $3$ влево — всего $1$ влево; $1$ вверх и $2$ вверх — $3$ вверх.',
        },
        reveal: scene => scene.animateParams({ vx: 2, vy: 1, wx: -3, wy: 2 }, 1200),
      },
      state: { show: ['sum'], params: { vx: 2, vy: 1, wx: -1, wy: 1.5 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Multiplying by a number', ru: 'Умножение на число' },
      text: {
        en: '$\\yellow{a\\,\\vec v}$ is $\\vec v$ stretched $a$ times: $2\\vec v$ is twice as long, $\\frac12\\vec v$ half as long. A negative number also turns the arrow around: $-\\vec v$ goes back. All the multiples of $\\vec v$ lie on one line through the origin. Numbers that stretch vectors are called <i>scalars</i>, from «scale».',
        ru: '$\\yellow{a\\,\\vec v}$ — это $\\vec v$, растянутый в $a$ раз: $2\\vec v$ вдвое длиннее, $\\frac12\\vec v$ — вдвое короче. Отрицательное число ещё и разворачивает стрелку: $-\\vec v$ идёт назад. Все кратные $\\vec v$ лежат на одной прямой через начало координат. Числа, которые растягивают векторы, называют <i>скалярами</i> — от английского scale, «масштаб».',
      },
      try: { en: 'Press ▶ next to $a$.', ru: 'Нажмите ▶ возле $a$.' },
      state: { show: ['scale'], params: { vx: 2, vy: 1, a: 1.5 }, window: WINDOW, controls: ['a'] },
    },
    {
      title: { en: 'Combinations cover the plane', ru: 'Комбинации покрывают плоскость' },
      text: {
        en: 'Now stretch both and add: $a\\,\\green{\\vec v} + b\\,\\red{\\vec w}$. This is a <i>linear combination</i>. The faint grid shows all of them with whole $a$ and $b$: it is like graph paper, only slanted. Between its lines lie the fractional ones — so <b>every point of the plane</b> is $a\\vec v + b\\vec w$ for some $a$ and $b$. These two numbers are the coordinates of the point in the <i>basis</i> $\\vec v$, $\\vec w$.',
        ru: 'Теперь растянем оба и сложим: $a\\,\\green{\\vec v} + b\\,\\red{\\vec w}$. Это <i>линейная комбинация</i>. Бледная сетка показывает все такие точки с целыми $a$ и $b$: это как клетчатая бумага, только косая. Между её линиями — дробные, так что <b>любая точка плоскости</b> — это $a\\vec v + b\\vec w$ при каких-то $a$ и $b$. Эти два числа — координаты точки в <i>базисе</i> $\\vec v$, $\\vec w$.',
      },
      try: { en: 'Move $a$ and $b$; drag the ends of $\\vec v$ and $\\vec w$ — the grid follows.', ru: 'Двигайте $a$ и $b$; тяните концы $\\vec v$ и $\\vec w$ — сетка следует за ними.' },
      hint: {
        title: { en: 'And the usual coordinates?', ru: 'А обычные координаты?' },
        text: {
          en: 'They are the same thing with the basis $\\vec\\imath = \\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$, $\\vec\\jmath = \\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix}$: the point $(3;\\ 2)$ is $3\\vec\\imath + 2\\vec\\jmath$. The square grid of the paper is the grid of this basis.',
          ru: 'Это то же самое с базисом $\\vec\\imath = \\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$, $\\vec\\jmath = \\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix}$: точка $(3;\\ 2)$ — это $3\\vec\\imath + 2\\vec\\jmath$. Квадратная сетка тетради — сетка этого базиса.',
        },
      },
      state: { show: ['combo'], params: { vx: 2, vy: 1, wx: -1, wy: 1.5, a: 1, b: 1 }, window: WINDOW, controls: ['a', 'b'] },
    },
    {
      title: { en: 'When the grid collapses', ru: 'Когда сетка схлопывается' },
      text: {
        en: 'Put $\\red{\\vec w}$ on the line of $\\green{\\vec v}$ — say $\\vec w = -\\vec v$ or $\\vec w = 2\\vec v$. The grid folds into a single line: whatever $a$ and $b$ are, $a\\vec v + b\\vec w$ stays on it. Such vectors are called <i>collinear</i> (or linearly dependent): one is a multiple of the other, and together they reach no further than one of them alone.',
        ru: 'Положите $\\red{\\vec w}$ на прямую $\\green{\\vec v}$ — например, $\\vec w = -\\vec v$ или $\\vec w = 2\\vec v$. Сетка складывается в одну прямую: какими бы ни были $a$ и $b$, $a\\vec v + b\\vec w$ остаётся на ней. Такие векторы называют <i>коллинеарными</i> (линейно зависимыми): один — кратное другого, и вместе они достают не дальше, чем один из них.',
      },
      try: { en: 'Drag the end of $\\vec w$ onto the line of $\\vec v$ and watch the grid.', ru: 'Тяните конец $\\vec w$ на прямую $\\vec v$ и смотрите на сетку.' },
      check: {
        q: { en: 'Can $\\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$ and $\\begin{pmatrix} -4 \\\\ -2 \\end{pmatrix}$ be a basis of the plane?', ru: 'Могут ли $\\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$ и $\\begin{pmatrix} -4 \\\\ -2 \\end{pmatrix}$ быть базисом плоскости?' },
        options: [{ text: { en: 'yes', ru: 'да' } }, { text: { en: 'no', ru: 'нет' }, ok: true }],
        explain: {
          en: '$\\begin{pmatrix} -4 \\\\ -2 \\end{pmatrix} = -2 \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$: the same line. Their combinations never leave it, so the point $(0;\\ 1)$, for example, cannot be reached.',
          ru: '$\\begin{pmatrix} -4 \\\\ -2 \\end{pmatrix} = -2 \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$ — та же прямая. Их комбинации с неё не сходят, и, например, точку $(0;\\ 1)$ не получить.',
        },
        reveal: scene => scene.animateParams({ vx: 2, vy: 1, wx: -4, wy: -2 }, 1500),
      },
      state: { show: ['combo'], params: { vx: 2, vy: 1, wx: -1, wy: 1.5, a: 1, b: 1 }, window: WINDOW, controls: ['a', 'b'] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'Make your own basis: drag $\\vec v$ and $\\vec w$, then reach a point with $a$ and $b$. Try a very thin basis — two arrows almost on one line: the grid stretches, and to reach a nearby point you need huge $a$ and $b$. How much a basis squeezes the plane is measured by the <i>determinant</i> — a topic ahead.',
        ru: 'Сделайте свой базис: тяните $\\vec v$ и $\\vec w$, потом доберитесь до точки с помощью $a$ и $b$. Попробуйте очень «тонкий» базис — две стрелки почти на одной прямой: сетка вытягивается, и чтобы дойти до близкой точки, нужны огромные $a$ и $b$. Насколько базис сплющивает плоскость, измеряет <i>определитель</i> — это тема впереди.',
      },
      state: { show: ['combo'], params: { a: 1.5, b: -1 }, window: WINDOW, controls: ['a', 'b'] },
    },
    {
      title: { en: 'Add the arrows', ru: 'Сложите стрелки' },
      text: {
        en: 'Drag the end of the yellow arrow so that it becomes $\\green{\\vec u} + \\red{\\vec w}$. No numbers this time — use the grid.',
        ru: 'Перетащите конец жёлтой стрелки так, чтобы она стала $\\green{\\vec u} + \\red{\\vec w}$. Чисел на этот раз нет — пользуйтесь сеткой.',
      },
      task: {
        kind: 'drag',
        target: { sx: 2, sy: 3 },
        back: 2,
        right: {
          en: 'Walk $\\vec u$ — $3$ right, $1$ up — and then $\\vec w$ — $1$ left, $2$ up: you end at $(2;\\ 3)$.',
          ru: 'Пройдём $\\vec u$ — $3$ вправо, $1$ вверх — и потом $\\vec w$ — $1$ влево, $2$ вверх: окажемся в $(2;\\ 3)$.',
        },
        mistakes: [
          { params: { sx: 4, sy: -1 }, text: {
            en: 'This is $\\vec u - \\vec w$: you went along $\\vec w$ backwards. For the sum, put the tail of $\\vec w$ at the tip of $\\vec u$ and keep its direction.',
            ru: 'Это $\\vec u - \\vec w$: вы прошли $\\vec w$ задом наперёд. Для суммы хвост $\\vec w$ ставим в конец $\\vec u$ и сохраняем направление.' } },
          { params: { sx: -4, sy: 1 }, text: {
            en: 'This is $\\vec w - \\vec u$, the arrow from the tip of $\\vec u$ to the tip of $\\vec w$. The sum is not between the tips — it is the far corner of the parallelogram.',
            ru: 'Это $\\vec w - \\vec u$ — стрелка от конца $\\vec u$ к концу $\\vec w$. Сумма не между концами — это дальний угол параллелограмма.' } },
        ],
        hints: {
          sx: { en: 'Left–right is off: $\\vec u$ goes $3$ right, $\\vec w$ goes $1$ left.', ru: 'Не то по горизонтали: $\\vec u$ идёт на $3$ вправо, $\\vec w$ — на $1$ влево.' },
          sy: { en: 'Up–down is off: $\\vec u$ goes $1$ up, $\\vec w$ goes $2$ up.', ru: 'Не то по вертикали: $\\vec u$ идёт на $1$ вверх, $\\vec w$ — на $2$ вверх.' },
        },
      },
      state: { show: ['sumT'], params: { sx: 1, sy: -1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Reach the point', ru: 'Доберитесь до точки' },
      text: {
        en: 'The basis is $\\green{\\vec v} = \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$, $\\red{\\vec w} = \\begin{pmatrix} -1 \\\\ 1 \\end{pmatrix}$. Choose $a$ and $b$ so that $a\\vec v + b\\vec w$ lands on the point $P(-1;\\ 4)$.',
        ru: 'Базис: $\\green{\\vec v} = \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$, $\\red{\\vec w} = \\begin{pmatrix} -1 \\\\ 1 \\end{pmatrix}$. Подберите $a$ и $b$ так, чтобы $a\\vec v + b\\vec w$ попала в точку $P(-1;\\ 4)$.',
      },
      task: {
        kind: 'drag',
        target: { a: 1, b: 3 },
        back: 4,
        right: {
          en: '$1 \\cdot \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix} + 3 \\begin{pmatrix} -1 \\\\ 1 \\end{pmatrix} = \\begin{pmatrix} -1 \\\\ 4 \\end{pmatrix}$. In the basis $\\vec v$, $\\vec w$ the point $P$ has coordinates $(1;\\ 3)$ — other numbers than $(-1;\\ 4)$, the same point.',
          ru: '$1 \\cdot \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix} + 3 \\begin{pmatrix} -1 \\\\ 1 \\end{pmatrix} = \\begin{pmatrix} -1 \\\\ 4 \\end{pmatrix}$. В базисе $\\vec v$, $\\vec w$ у точки $P$ координаты $(1;\\ 3)$ — другие числа, чем $(-1;\\ 4)$, а точка та же.',
        },
        mistakes: [
          { params: { a: -1, b: 3 }, text: {
            en: 'Close in spirit, but the coordinates $(-1;\\ 4)$ belong to the usual basis $\\vec\\imath$, $\\vec\\jmath$. Here the steps are $\\vec v$ and $\\vec w$: count along the slanted grid.',
            ru: 'Это обычные координаты $(-1;\\ 4)$ — они для базиса $\\vec\\imath$, $\\vec\\jmath$. А здесь шаги — $\\vec v$ и $\\vec w$: считайте по косой сетке.' } },
        ],
        hints: {
          a: { en: '$a$ is off: count how many $\\vec v$-steps along the slanted grid lead to the line of $P$.', ru: 'Не то $a$: посчитайте, сколько шагов $\\vec v$ по косой сетке ведут к линии $P$.' },
          b: { en: '$b$ is off: from there, how many $\\vec w$-steps to $P$?', ru: 'Не то $b$: а оттуда — сколько шагов $\\vec w$ до $P$?' },
        },
      },
      state: { show: ['reachP'], params: { vx: 2, vy: 1, wx: -1, wy: 1, a: 1, b: 1 }, window: WINDOW, controls: ['a', 'b'] },
    },
    {
      title: { en: 'Fold the grid', ru: 'Сложите сетку' },
      text: {
        en: '$\\green{\\vec v}$ is fixed. Drag the end of $\\red{\\vec w}$ so that the combinations $a\\vec v + b\\vec w$ cover only a line, not the whole plane.',
        ru: '$\\green{\\vec v}$ закреплён. Перетащите конец $\\red{\\vec w}$ так, чтобы комбинации $a\\vec v + b\\vec w$ давали только прямую, а не всю плоскость.',
      },
      task: {
        kind: 'drag',
        target: [{ wx: -4, wy: -2 }, { wx: -2, wy: -1 }, { wx: -1, wy: -0.5 }, { wx: 0, wy: 0 }, { wx: 1, wy: 0.5 }, { wx: 2, wy: 1 }, { wx: 3, wy: 1.5 }, { wx: 4, wy: 2 }],
        back: 5,
        right: {
          en: 'Now $\\vec w$ is a multiple of $\\vec v$ — they are collinear, and every combination stays on their common line.',
          ru: 'Теперь $\\vec w$ — кратное $\\vec v$: они коллинеарны, и любая комбинация остаётся на их общей прямой.',
        },
        hints: {
          wx: { en: '$\\vec w$ is not on the line of $\\vec v$ yet: the grid still covers the plane. $\\vec v$ goes $2$ right per $1$ up.', ru: '$\\vec w$ ещё не на прямой $\\vec v$: сетка по-прежнему покрывает плоскость. $\\vec v$ идёт на $2$ вправо на каждый $1$ вверх.' },
          wy: { en: '$\\vec w$ is not on the line of $\\vec v$ yet: the grid still covers the plane. $\\vec v$ goes $2$ right per $1$ up.', ru: '$\\vec w$ ещё не на прямой $\\vec v$: сетка по-прежнему покрывает плоскость. $\\vec v$ идёт на $2$ вправо на каждый $1$ вверх.' },
        },
      },
      state: { show: ['collapse'], params: { vx: 2, vy: 1, wx: -1, wy: 2 }, window: WINDOW, controls: [] },
    },
  ],
};
