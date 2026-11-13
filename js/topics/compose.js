// Product of matrices: one move, then another. The grid goes through A and then through B; the columns of
// the product BA are where î and ĵ land after both moves, B·(columns of A). The order matters (BA ≠ AB),
// areas multiply (det BA = det B · det A), and a move can be undone.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';
import { morph } from './matrix.js';

const WINDOW = { cx: 0.5, cy: 0.8, unit: 48 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const snap = v => clamp(Math.round(v * 2) / 2, -5, 5);
const r2 = v => fmt(Math.round(v * 100) / 100);

// A matrix is [a, b, c, d] = (a b; c d): its columns are (a; c) and (b; d)
const mul = ([a, b, c, d], [e, f, g, h]) => [a * e + b * g, a * f + b * h, c * e + d * g, c * f + d * h];
const det = ([a, b, c, d]) => a * d - b * c;
const lerpI = ([a, b, c, d], k) => [1 - k + k * a, k * b, k * c, 1 - k + k * d];
const tex = ([a, b, c, d], color = '') => `${color}{\\begin{pmatrix} ${r2(a)} & ${r2(b)} \\\\ ${r2(c)} & ${r2(d)} \\end{pmatrix}}`;

const ROT = [0, -1, 1, 0], SHEAR = [1, 1, 0, 1];
const STRETCH = [1.5, 0, 0, 2], TURN = [1, -1, 1, 1]; // det 3 and det 2
const UNSHEAR = [1, -1, 0, 1];

// The plane after part t of the way: t from 0 to 1 is A, from 1 to 2 is B on top of it
const stage = (A, B, tt) => (tt <= 1 ? lerpI(A, tt) : mul(lerpI(B, tt - 1), A));
const show = (p, sc, M, opts) => morph(p, sc, [M[0], M[2]], [M[1], M[3]], 1, opts);

export default {
  view: '2d',
  view2d: WINDOW,
  lab: false,

  setup(scene) {
    scene.ensureParam('t', 2, { min: 0, max: 2, step: 0.01 });
    scene.ensureParam('o', 0, { min: 0, max: 1, step: 1 }); // the order: 0 — rotation first, 1 — shear first
    scene.ensureParam('ix', 1, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('iy', 0, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('jx', 0, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('jy', 1, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('D', 0, { min: -8, max: 8, step: 1 });

    const phase = (tt, first, second) => (tt <= 1
      ? t({ en: `\\text{first: ${first.en}}`, ru: `\\text{сначала: ${first.ru}}` })
      : t({ en: `\\text{then: ${second.en}}`, ru: `\\text{потом: ${second.ru}}` }));
    const ROT_W = { en: 'rotation', ru: 'поворот' }, SHEAR_W = { en: 'shear', ru: 'сдвиг' };
    const handles = (p, sc, s) => {
      const set = (a, b) => (x, y) => { sc.setParam(a, snap(x)); sc.setParam(b, snap(y)); };
      p.handle(s.ix, s.iy, COLORS.green, set('ix', 'iy'));
      p.handle(s.jx, s.jy, COLORS.red, set('jx', 'jy'));
    };

    scene.custom.push(
      {
        id: 'two',
        draw2d(p, sc, s) { show(p, sc, stage(ROT, SHEAR, s.t)); },
        legend: s => `${phase(s.t, ROT_W, SHEAR_W)}:\\quad ${tex(stage(ROT, SHEAR, s.t))}`,
      },
      {
        // The two orders side by side in time: o = 0 — rotation, then shear; o = 1 — shear, then rotation
        id: 'order',
        draw2d(p, sc, s) { show(p, sc, s.o ? stage(SHEAR, ROT, s.t) : stage(ROT, SHEAR, s.t)); },
        legend: s => (s.o
          ? `${phase(s.t, SHEAR_W, ROT_W)}:\\quad AB = ${tex(mul(ROT, SHEAR))}`
          : `${phase(s.t, ROT_W, SHEAR_W)}:\\quad BA = ${tex(mul(SHEAR, ROT))}`),
      },
      {
        id: 'areas',
        draw2d(p, sc, s) { show(p, sc, stage(STRETCH, TURN, s.t)); },
        legend: s => `\\det A = ${r2(det(STRETCH))},\\ \\det B = ${r2(det(TURN))}:\\quad \\text{${t({ en: 'area', ru: 'площадь' })}} = \\yellow{${r2(det(stage(STRETCH, TURN, s.t)))}}`,
      },
      {
        id: 'undo',
        draw2d(p, sc, s) { show(p, sc, stage(SHEAR, UNSHEAR, s.t)); },
        legend: s => `${tex(UNSHEAR)} ${tex(SHEAR)} = ${tex(mul(UNSHEAR, SHEAR))}`,
      },
      // ---- Tasks ----
      {
        id: 'build',
        draw2d(p, sc, s) { show(p, sc, [s.ix, s.jx, s.iy, s.jy]); handles(p, sc, s); },
      },
      {
        id: 'detT',
        draw2d(p, sc) { show(p, sc, mul([1, 0, 0, -2], [1.5, 0.5, 0, 2])); },
        legend: s => `\\det A = 3,\\ \\det B = -2:\\quad \\det(BA) = \\ ?\\qquad D = ${r2(s.D)}`,
      },
      {
        // The grid after the shear and then the student's matrix X; the student drags the columns of X
        id: 'undoT',
        draw2d(p, sc, s) {
          const X = [s.ix, s.jx, s.iy, s.jy];
          show(p, sc, mul(X, SHEAR));
          p.arrow(0, 0, s.ix, s.iy, COLORS.green + '99', { width: 2, dash: [5, 4] });
          p.arrow(0, 0, s.jx, s.jy, COLORS.red + '99', { width: 2, dash: [5, 4] });
          handles(p, sc, s);
        },
        legend: s => `X = ${tex([s.ix, s.jx, s.iy, s.jy])},\\quad X \\cdot ${tex(SHEAR)} = ${tex(mul([s.ix, s.jx, s.iy, s.jy], SHEAR))}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'One move, then another', ru: 'Одно движение, потом другое' },
      text: {
        en: 'First turn the plane by $90°$ — the matrix $A$. Then shear what you got — the matrix $B$. The result is again a linear move: the grid stays straight and even. So it has a matrix of its own, the <i>product</i> $BA$.',
        ru: 'Сначала повернём плоскость на $90°$ — это матрица $A$. Потом сдвинем то, что получилось, — матрица $B$. Результат — снова линейное движение: сетка остаётся прямой и равномерной. Значит, у него есть своя матрица — <i>произведение</i> $BA$.',
      },
      try: { en: 'Press ▶ next to $t$: from $0$ to $1$ the turn, from $1$ to $2$ the shear.', ru: 'Нажмите ▶ возле $t$: от $0$ до $1$ — поворот, от $1$ до $2$ — сдвиг.' },
      state: { show: ['two'], window: WINDOW, controls: ['t'] },
      enter(scene) {
        scene.setParam('t', 0);
        scene.animateParams({ t: 2 }, 5000);
      },
    },
    {
      title: { en: 'Follow the two arrows', ru: 'Следите за двумя стрелками' },
      text: {
        en: 'As always, it is enough to know where $\\green{\\hat\\imath}$ and $\\red{\\hat\\jmath}$ land. After the turn $\\hat\\imath$ is at $\\binom{0}{1}$; then $B$ takes that arrow to $B\\binom{0}{1} = \\binom{1}{1}$. So the first column of $BA$ is $B$ applied to the first column of $A$, and the same for the second: $$BA = \\big(\\,B\\,a_1 \\;\\big|\\; B\\,a_2\\,\\big).$$',
        ru: 'Как всегда, достаточно знать, куда попадут $\\green{\\hat\\imath}$ и $\\red{\\hat\\jmath}$. После поворота $\\hat\\imath$ стоит в $\\binom{0}{1}$; потом $B$ переводит эту стрелку в $B\\binom{0}{1} = \\binom{1}{1}$. Значит, первый столбец $BA$ — это $B$, применённая к первому столбцу $A$, и так же со вторым: $$BA = \\big(\\,B\\,a_1 \\;\\big|\\; B\\,a_2\\,\\big).$$',
      },
      try: { en: 'Stop $t$ at $1$ and at $2$ and read the arrows.', ru: 'Остановите $t$ на $1$ и на $2$ и прочитайте стрелки.' },
      check: {
        q: { en: 'Where does $\\hat\\jmath$ land after both moves?', ru: 'Куда попадает $\\hat\\jmath$ после обоих движений?' },
        options: [{ text: '$\\binom{-1}{0}$', ok: true }, { text: '$\\binom{0}{1}$' }, { text: '$\\binom{1}{1}$' }],
        explain: {
          en: 'The turn takes $\\hat\\jmath$ to $\\binom{-1}{0}$; the shear does not move points on the $x$ axis. So $\\binom{-1}{0}$ — the second column of $BA = \\begin{pmatrix} 1 & -1 \\\\ 1 & 0 \\end{pmatrix}$.',
          ru: 'Поворот переводит $\\hat\\jmath$ в $\\binom{-1}{0}$; сдвиг точки на оси $x$ не двигает. Значит, $\\binom{-1}{0}$ — второй столбец $BA = \\begin{pmatrix} 1 & -1 \\\\ 1 & 0 \\end{pmatrix}$.',
        },
        reveal: scene => scene.animateParams({ t: 2 }, 1200),
      },
      state: { show: ['two'], params: { t: 1 }, window: WINDOW, controls: ['t'] },
    },
    {
      title: { en: 'The order matters', ru: 'Порядок важен' },
      text: {
        en: 'Now shear first and turn after ($o = 1$). The final grid is different: $AB \\ne BA$. With numbers $2 \\cdot 3 = 3 \\cdot 2$, but with moves «first this, then that» is not the same as «first that, then this» — like putting on socks and shoes.',
        ru: 'Теперь сначала сдвиг, а потом поворот ($o = 1$). Итоговая сетка другая: $AB \\ne BA$. С числами $2 \\cdot 3 = 3 \\cdot 2$, а с движениями «сначала это, потом то» — не то же, что «сначала то, потом это». Как носки и ботинки.',
      },
      try: { en: 'Switch $o$ and press ▶ next to $t$ each time.', ru: 'Переключайте $o$ и каждый раз нажимайте ▶ возле $t$.' },
      check: {
        q: { en: 'Which pair of moves can be done in either order with the same result?', ru: 'Какую пару движений можно делать в любом порядке с одним результатом?' },
        options: [
          { text: { en: 'two rotations', ru: 'два поворота' }, ok: true },
          { text: { en: 'a rotation and a shear', ru: 'поворот и сдвиг' } },
          { text: { en: 'any two', ru: 'любые две' } },
        ],
        explain: {
          en: 'Turning by $30°$ and then by $60°$ is turning by $90°$ either way. But a turn and a shear, as you saw, do not commute.',
          ru: 'Повернуть на $30°$, потом на $60°$ — в любом порядке поворот на $90°$. А поворот и сдвиг, как вы видели, не переставляются.',
        },
      },
      state: { show: ['order'], params: { o: 1, t: 2 }, window: WINDOW, controls: ['o', 't'] },
    },
    {
      title: { en: 'Read from right to left', ru: 'Читается справа налево' },
      text: {
        en: 'Why $BA$ and not $AB$ for «first $A$, then $B$»? Because a matrix acts on the vector to its right: $BA\\,\\vec v = B(A\\vec v)$ — first $A$ touches $\\vec v$, then $B$ touches the result. It is the same as $f(g(x))$: the inner function works first.',
        ru: 'Почему «сначала $A$, потом $B$» — это $BA$, а не $AB$? Потому что матрица действует на вектор справа от неё: $BA\\,\\vec v = B(A\\vec v)$ — сначала $\\vec v$ касается $A$, потом результат касается $B$. Так же, как $f(g(x))$: первой работает внутренняя функция.',
      },
      check: {
        q: { en: 'First $C$, then $B$, then $A$. Which product?', ru: 'Сначала $C$, потом $B$, потом $A$. Какое произведение?' },
        options: [{ text: '$CBA$' }, { text: '$ABC$', ok: true }, { text: '$BAC$' }],
        explain: {
          en: '$ABC\\,\\vec v = A(B(C\\vec v))$: $C$ is next to $\\vec v$, so it works first.',
          ru: '$ABC\\,\\vec v = A(B(C\\vec v))$: $C$ стоит рядом с $\\vec v$, значит, работает первой.',
        },
      },
      state: { show: ['two'], params: { t: 2 }, window: WINDOW, controls: ['t'] },
    },
    {
      title: { en: 'Areas multiply', ru: 'Площади умножаются' },
      text: {
        en: '$A$ makes every area $3$ times bigger; $B$ then doubles it again. Together: $6$ times. So $$\\det(BA) = \\det B \\cdot \\det A.$$ A formula that is a pain to check by algebra — and obvious from the picture.',
        ru: '$A$ увеличивает любую площадь в $3$ раза; потом $B$ ещё удваивает. Вместе — в $6$ раз. Значит, $$\\det(BA) = \\det B \\cdot \\det A.$$ Формула, которую мучительно проверять алгеброй, — и очевидная на картинке.',
      },
      try: { en: 'Press ▶ next to $t$ and watch the area of the yellow square.', ru: 'Нажмите ▶ возле $t$ и следите за площадью жёлтого квадрата.' },
      state: { show: ['areas'], params: { t: 2 }, window: WINDOW, controls: ['t'] },
    },
    {
      title: { en: 'Undoing a move', ru: 'Отменить движение' },
      text: {
        en: 'The shear $\\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix}$ pushes every point right by its height. To undo it, push left by the height: $\\begin{pmatrix} 1 & -1 \\\\ 0 & 1 \\end{pmatrix}$. Together they give the <i>identity</i> matrix — «do nothing». Such a matrix is called the <i>inverse</i>, $A^{-1}$. A matrix with $\\det = 0$ has none: a squashed plane cannot be spread out again.',
        ru: 'Сдвиг $\\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix}$ толкает каждую точку вправо на её высоту. Чтобы отменить, толкнём влево на высоту: $\\begin{pmatrix} 1 & -1 \\\\ 0 & 1 \\end{pmatrix}$. Вместе они дают <i>единичную</i> матрицу — «ничего не делать». Такую матрицу называют <i>обратной</i>, $A^{-1}$. У матрицы с $\\det = 0$ обратной нет: сплющенную плоскость обратно не расправить.',
      },
      try: { en: 'Press ▶ next to $t$: the grid leans and straightens back.', ru: 'Нажмите ▶ возле $t$: сетка наклоняется и выпрямляется обратно.' },
      check: {
        q: { en: 'What is the inverse of the rotation by $90°$?', ru: 'Какая матрица обратна повороту на $90°$?' },
        options: [
          { text: { en: 'rotation by $90°$ the other way', ru: 'поворот на $90°$ в другую сторону' }, ok: true },
          { text: { en: 'the same rotation', ru: 'тот же поворот' } },
          { text: { en: 'it has none', ru: 'её нет' } },
        ],
        explain: {
          en: 'Turning back undoes turning. The same rotation twice is a turn by $180°$, not «nothing».',
          ru: 'Поворот назад отменяет поворот. Тот же поворот дважды — это поворот на $180°$, а не «ничего».',
        },
      },
      state: { show: ['undo'], params: { t: 2 }, window: WINDOW, controls: ['t'] },
      enter(scene) {
        scene.setParam('t', 0);
        scene.animateParams({ t: 2 }, 5000);
      },
    },
    {
      title: { en: 'Build the product', ru: 'Соберите произведение' },
      text: {
        en: 'First $A$ — a turn by $90°$ counter-clockwise, then $B$ — stretching twice along $x$: $B = \\begin{pmatrix} 2 & 0 \\\\ 0 & 1 \\end{pmatrix}$. Drag $\\green{\\hat\\imath}$ and $\\red{\\hat\\jmath}$ to where they land after both moves.',
        ru: 'Сначала $A$ — поворот на $90°$ против часовой, потом $B$ — растяжение вдвое по $x$: $B = \\begin{pmatrix} 2 & 0 \\\\ 0 & 1 \\end{pmatrix}$. Перетащите $\\green{\\hat\\imath}$ и $\\red{\\hat\\jmath}$ туда, куда они попадут после обоих движений.',
      },
      task: {
        kind: 'drag',
        target: { ix: 0, iy: 1, jx: -2, jy: 0 },
        back: 1,
        right: {
          en: '$\\hat\\imath$ turns up to $\\binom{0}{1}$ — the stretch along $x$ does not touch it. $\\hat\\jmath$ turns left to $\\binom{-1}{0}$ and is stretched to $\\binom{-2}{0}$. $BA = \\begin{pmatrix} 0 & -2 \\\\ 1 & 0 \\end{pmatrix}$.',
          ru: '$\\hat\\imath$ поворачивается вверх, в $\\binom{0}{1}$, — растяжение по $x$ её не трогает. $\\hat\\jmath$ поворачивается влево, в $\\binom{-1}{0}$, и растягивается до $\\binom{-2}{0}$. $BA = \\begin{pmatrix} 0 & -2 \\\\ 1 & 0 \\end{pmatrix}$.',
        },
        mistakes: [
          { params: { ix: 0, iy: 2, jx: -1, jy: 0 }, text: {
            en: 'This is $AB$: stretched first, turned after. Here the turn comes first — stretch the arrows where they are <b>after</b> turning.',
            ru: 'Это $AB$: сначала растянули, потом повернули. А здесь сначала поворот — растягивайте стрелки там, где они <b>после</b> поворота.' } },
        ],
        hints: {
          ix: { en: '$\\hat\\imath$: first turn it, then stretch along $x$ what you got.', ru: '$\\hat\\imath$: сначала поверните, потом растяните по $x$ то, что получилось.' },
          iy: { en: '$\\hat\\imath$: first turn it, then stretch along $x$ what you got.', ru: '$\\hat\\imath$: сначала поверните, потом растяните по $x$ то, что получилось.' },
          jx: { en: '$\\hat\\jmath$: after the turn it points left — along $x$, so the stretch acts on it.', ru: '$\\hat\\jmath$: после поворота он смотрит влево — вдоль $x$, и растяжение на него действует.' },
          jy: { en: '$\\hat\\jmath$: after the turn it points left — along $x$, so the stretch acts on it.', ru: '$\\hat\\jmath$: после поворота он смотрит влево — вдоль $x$, и растяжение на него действует.' },
        },
      },
      state: { show: ['build'], params: { ix: 1, iy: 0, jx: 0, jy: 1 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Determinant of a product', ru: 'Определитель произведения' },
      text: {
        en: '$\\det A = 3$ and $\\det B = -2$. Set $D$ to $\\det(BA)$.',
        ru: '$\\det A = 3$, $\\det B = -2$. Поставьте $D$ равным $\\det(BA)$.',
      },
      task: {
        kind: 'drag',
        target: { D: -6 },
        back: 4,
        right: {
          en: '$A$ multiplies areas by $3$, then $B$ by $2$ and turns the plane over: $\\det(BA) = (-2) \\cdot 3 = -6$.',
          ru: '$A$ умножает площади на $3$, потом $B$ — на $2$ и переворачивает плоскость: $\\det(BA) = (-2) \\cdot 3 = -6$.',
        },
        mistakes: [
          { params: { D: 1 }, text: { en: 'Determinants of a product multiply, not add: areas grow $3$ times and then $2$ times more.', ru: 'Определители произведения перемножаются, а не складываются: площади растут в $3$ раза, потом ещё в $2$.' } },
          { params: { D: 6 }, text: { en: 'The size is right, but $B$ turns the plane over ($\\det B < 0$), and nothing turns it back.', ru: 'Модуль верный, но $B$ переворачивает плоскость ($\\det B < 0$), и обратно её ничто не переворачивает.' } },
        ],
        hints: { D: { en: 'Areas: $3$ times, then $2$ times. And the sign?', ru: 'Площади: в $3$ раза, потом в $2$. А знак?' } },
      },
      state: { show: ['detT'], params: { D: 0 }, window: WINDOW, controls: ['D'] },
    },
    {
      title: { en: 'Undo the shear', ru: 'Отмените сдвиг' },
      text: {
        en: 'The plane has been sheared by $\\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix}$, and then your matrix $X$ is applied (its columns are the dashed arrows). Drag them so that the grid becomes square again.',
        ru: 'Плоскость сдвинута матрицей $\\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix}$, а потом к ней применяется ваша матрица $X$ (её столбцы — пунктирные стрелки). Перетащите их так, чтобы сетка снова стала квадратной.',
      },
      task: {
        kind: 'drag',
        target: { ix: 1, iy: 0, jx: -1, jy: 1 },
        back: 5,
        right: {
          en: '$X = \\begin{pmatrix} 1 & -1 \\\\ 0 & 1 \\end{pmatrix}$ pushes back by the height: $X \\cdot S = I$. That is the inverse of the shear.',
          ru: '$X = \\begin{pmatrix} 1 & -1 \\\\ 0 & 1 \\end{pmatrix}$ толкает обратно на высоту: $X \\cdot S = I$. Это и есть обратная к сдвигу.',
        },
        mistakes: [
          { params: { ix: 1, iy: 0, jx: 1, jy: 1 }, text: {
            en: 'The same shear once more: now the grid leans twice as much. To undo, push the other way.',
            ru: 'Тот же сдвиг ещё раз: теперь сетка наклонена вдвое сильнее. Чтобы отменить, толкайте в другую сторону.' } },
          { params: { ix: 1, iy: -1, jx: 0, jy: 1 }, text: {
            en: 'This tilts the other axis. The shear moved $\\hat\\jmath$, not $\\hat\\imath$: undo exactly that.',
            ru: 'Это наклоняет другую ось. Сдвиг двигал $\\hat\\jmath$, а не $\\hat\\imath$: отменяйте именно это.' } },
        ],
        hints: {
          jx: { en: 'The grid still leans: the shear pushed points right by their height. Push them left by the same amount.', ru: 'Сетка ещё наклонена: сдвиг толкнул точки вправо на их высоту. Толкните влево на столько же.' },
          jy: { en: 'The grid still leans: the shear pushed points right by their height. Push them left by the same amount.', ru: 'Сетка ещё наклонена: сдвиг толкнул точки вправо на их высоту. Толкните влево на столько же.' },
          ix: { en: '$\\hat\\imath$ did not move under the shear, so it should stay at $(1;\\ 0)$.', ru: '$\\hat\\imath$ при сдвиге не двигался, значит, должен остаться в $(1;\\ 0)$.' },
          iy: { en: '$\\hat\\imath$ did not move under the shear, so it should stay at $(1;\\ 0)$.', ru: '$\\hat\\imath$ при сдвиге не двигался, значит, должен остаться в $(1;\\ 0)$.' },
        },
      },
      state: { show: ['undoT'], params: { ix: 1, iy: 0, jx: 0, jy: 1 }, window: WINDOW, controls: [] },
    },
  ],
};
