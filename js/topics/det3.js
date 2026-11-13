// The determinant in space: how many times a 3×3 matrix changes volumes. Every cube of the grid becomes the same
// box, so every volume is multiplied by one number: the volume of the box on î′, ĵ′, k̂′. A stretch multiplies by
// a·b·c, a shear keeps volumes (the base stays, the height stays); zero when space is squashed into a plane,
// negative when it is turned inside out — a right hand becomes a left one.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';
import { lerp, apply, det3, mul, cross, len } from '../core/geom.js';
import { space, brick, m3 } from './matrix3.js';

const CAMERA = [6, -7.5, 4.6];
const r2 = v => fmt(Math.round(v * 100) / 100);
const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const A = s => [s.ax, s.ay, s.az], B = s => [s.bx, s.by, s.bz], C = s => [s.cx, s.cy, s.cz];
const MOVE = { ax: 1.5, ay: 0.5, az: 0, bx: -0.5, by: 1, bz: 0.5, cx: 0.5, cy: -0.5, cz: 1.5 };
// The volume in yellow, or in purple when space is turned inside out
const vol = v => `${v < -1e-9 ? '\\purple' : '\\yellow'}{${r2(v)}}`;
const pr = v => (v < 0 ? `(${r2(v)})` : r2(v));
// det along the first row, with the numbers in: a(ei − fh) − b(di − fg) + c(dh − eg)
const expand = (a, b, c) => {
  const minor = (p, q) => `${pr(p[1])} \\cdot ${pr(q[2])} - ${pr(q[1])} \\cdot ${pr(p[2])}`;
  return `\\begin{aligned} &${pr(a[0])}(${minor(b, c)}) \\\\ -\\ &${pr(b[0])}(${minor(a, c)}) \\\\ +\\ &${pr(c[0])}(${minor(a, b)}) = ${vol(det3(a, b, c))} \\end{aligned}`;
};

// Base and height: î′, ĵ′ in the floor (a parallelogram of area 3), k̂′ slides at the height h
const BA = [2, 0, 0], BB = [0.5, 1.5, 0];
// k̂′ goes up and down a rail over the floor parallelogram of î′, ĵ′ (area 2.25)
const FA = [1.5, 0, 0], FB = [0.5, 1.5, 0], F0 = [0.5, 0.5, -2], F1 = [0.5, 0.5, 2];
// Tasks: base of area 3, k̂′ on a rail from z = −3 to z = 3; a matrix to read; a matrix with k in it
const TA = [2, 0, 0], TB = [0.5, 1.5, 0], T0 = [-0.5, 0.5, -3], T1 = [-0.5, 0.5, 3];
const R = [[2, 0, 1], [1, 3, 0], [0, 1, 1]];
const KA = [1, 1, 0], KB = [0, 1, 1], KC = k => [1, k, 1];

// The floor parallelogram of î′, ĵ′ in teal and the height of k̂′ above it, dashed
function baseAndHeight(p, key, a, b, c) {
  p.polygon(`${key}:base`, [[0, 0, 0], a, [a[0] + b[0], a[1] + b[1], 0], b], COLORS.teal, { opacity: 0.3, outline: false });
  p.segment(`${key}:h`, [c[0], c[1], 0], c, '#ffffff', { hidden: true });
}

export default {
  view: '3d',
  view3d: { R: 3, zmax: 3, camera: CAMERA },
  lab: false,

  setup(scene) {
    for (const [name, v] of Object.entries(MOVE)) scene.ensureParam(name, v, { min: -4, max: 4, step: 0.5 });
    scene.ensureParam('t', 1, { min: 0, max: 1, step: 0.01 });
    scene.ensureParam('h', 1, { min: -2, max: 2.5, step: 0.5 }); // the height of k̂′ over the floor
    scene.ensureParam('s', 0.5, { min: 0, max: 1 }); // k̂′ slides along x
    scene.ensureParam('u', 0.75, { min: 0, max: 1 }); // k̂′ on a rail
    scene.ensureParam('D', 0, { min: -2, max: 12, step: 1 }); // the student's answer
    scene.ensureParam('k', 0, { min: -2, max: 4, step: 0.5 });

    scene.custom.push(
      {
        // The unit cube and a tall brick 1 × 1 × 2 nearby, both carried by the matrix
        id: 'volumes',
        draw3d(p, sc, s) {
          const { a, b, c } = space(p, 'volumes', A(s), B(s), C(s), s.t, { grid: false });
          brick(p, 'volumes:brick', a, b, mul(c, 2), COLORS.teal, { at: apply(a, b, c, [-2, -1, 0]) });
        },
        legend: s => {
          const [a, b, c] = [A(s), B(s), C(s)].map((X, i) => lerp(E[i], X, s.t)), k = Math.abs(det3(a, b, c));
          const [cu, br] = t({ en: ['cube', 'brick'], ru: ['куб', 'брусок'] });
          return `\\text{${cu}: } 1 \\to \\yellow{${r2(k)}} \\qquad \\text{${br}: } \\teal{2} \\to \\teal{${r2(2 * k)}}`;
        },
      },
      {
        id: 'det',
        draw3d(p, sc, s) { space(p, 'det', A(s), B(s), C(s), s.t); },
        legend: s => `\\det ${m3(A(s), B(s), C(s))} = ${vol(det3(A(s), B(s), C(s)))}`,
      },
      {
        id: 'expand',
        draw3d(p, sc, s) { space(p, 'expand', A(s), B(s), C(s), 1); },
        legend: s => `M = ${m3(A(s), B(s), C(s))}`,
      },
      { id: 'expandF', legend: s => `\\det M = ${expand(A(s), B(s), C(s))}` },
      {
        // Base times height: k̂′ slides parallel to the floor (dragged) and goes up and down (slider h)
        id: 'baseh',
        draw3d(p, sc, s) {
          const x0 = [-1.5, 0.6, s.h], x1 = [2.5, 0.6, s.h], c = lerp(x0, x1, s.s);
          space(p, 'baseh', BA, BB, c, 1, { grid: false });
          baseAndHeight(p, 'baseh', BA, BB, c);
          p.segment('baseh:rail', x0, x1, COLORS.grey, { radius: 0.012 });
          p.handle('baseh:hd', x0, x1, s.s, COLORS.blue, v => sc.setParam('s', v));
        },
        legend: s => {
          const [S, H, V] = t({ en: ['base', 'height', 'volume'], ru: ['основание', 'высота', 'объём'] });
          return `\\text{${V}} = \\teal{\\text{${S}}} \\cdot \\text{${H}} = \\teal{3} \\cdot ${r2(s.h)} = ${vol(3 * s.h)}`;
        },
      },
      {
        // k̂′ goes down through the floor: the box flattens, then turns inside out
        id: 'flat',
        draw3d(p, sc, s) {
          const c = lerp(F0, F1, s.u);
          space(p, 'flat', FA, FB, c, 1, { grid: false });
          baseAndHeight(p, 'flat', FA, FB, c);
          p.segment('flat:rail', F0, F1, COLORS.grey, { radius: 0.012 });
          p.handle('flat:hd', F0, F1, s.u, COLORS.blue, u => sc.setParam('u', u));
        },
        legend: s => `\\det ${m3(FA, FB, lerp(F0, F1, s.u))} = ${vol(det3(FA, FB, lerp(F0, F1, s.u)))}`,
      },
      // ---- Tasks ----
      {
        id: 'vol6',
        draw3d(p, sc, s) {
          const c = lerp(T0, T1, s.u);
          space(p, 'vol6', TA, TB, c, 1, { grid: false });
          baseAndHeight(p, 'vol6', TA, TB, c);
          p.segment('vol6:rail', T0, T1, COLORS.grey, { radius: 0.012 });
          p.handle('vol6:hd', T0, T1, s.u, COLORS.blue, u => sc.setParam('u', u));
        },
        legend: () => `\\green{\\hat\\imath'} = (2;\\ 0;\\ 0),\\quad \\red{\\hat\\jmath'} = (0.5;\\ 1.5;\\ 0)`,
      },
      {
        id: 'readDet',
        draw3d(p) { space(p, 'readDet', ...R, 1, { grid: false }); },
        legend: s => `\\det ${m3(...R)} = \\ ?\\qquad D = ${r2(s.D)}`,
      },
      {
        id: 'kflat',
        draw3d(p, sc, s) { space(p, 'kflat', KA, KB, KC(s.k), 1); },
        legend: s => m3(KA, KB, KC(s.k)),
      },
    );
  },

  steps: [
    {
      title: { en: 'All volumes change alike', ru: 'Все объёмы меняются одинаково' },
      text: {
        en: 'On the plane a matrix multiplied all areas by one number. In space it is the same with volumes. Watch the yellow unit cube and the teal brick of volume $2$: whatever the matrix, the brick stays exactly twice the cube. Every cube of the grid of space turns into the same box, and any body is made of small cubes. That one number — the volume of the box on $\\green{\\hat\\imath\'}$, $\\red{\\hat\\jmath\'}$, $\\blue{\\hat k\'}$ — is the <i>determinant</i> of the $3 \\times 3$ matrix.',
        ru: 'На плоскости матрица умножала все площади на одно число. В пространстве то же самое с объёмами. Смотрите на жёлтый единичный куб и бирюзовый брусок объёма $2$: при любой матрице брусок ровно вдвое больше куба. Каждый кубик сетки пространства превращается в один и тот же ящик, а любое тело складывается из маленьких кубиков. Это число — объём ящика на $\\green{\\hat\\imath\'}$, $\\red{\\hat\\jmath\'}$, $\\blue{\\hat k\'}$ — и есть <i>определитель</i> матрицы $3 \\times 3$.',
      },
      try: { en: 'Press ▶ next to $t$: the two numbers in the legend grow and shrink together.', ru: 'Нажмите ▶ возле $t$: два числа в подписи растут и уменьшаются вместе.' },
      state: { show: ['volumes'], params: MOVE, camera: CAMERA, controls: ['t'] },
      enter(scene) {
        scene.setParam('t', 0);
        scene.animateParams({ t: 1 }, 3500);
      },
    },
    {
      title: { en: 'A stretch multiplies', ru: 'Растяжение — произведение' },
      text: {
        en: 'The easiest case: the three arrows stay on the axes. The cube becomes a brick $a \\times b \\times c$, and its volume is $a \\cdot b \\cdot c$ — the three numbers on the diagonal of the matrix. Here: twice as long, one and a half times as wide, the same height: volumes grow $3$ times.',
        ru: 'Самый простой случай: три стрелки остаются на осях. Куб становится бруском $a \\times b \\times c$, и его объём — $a \\cdot b \\cdot c$, произведение трёх чисел на диагонали матрицы. Здесь: вдвое длиннее, в полтора раза шире, той же высоты — объёмы вырастают в $3$ раза.',
      },
      check: {
        q: { en: '$\\det \\begin{pmatrix} 2 & 0 & 0 \\\\ 0 & 3 & 0 \\\\ 0 & 0 & 0.5 \\end{pmatrix} = ?$', ru: '$\\det \\begin{pmatrix} 2 & 0 & 0 \\\\ 0 & 3 & 0 \\\\ 0 & 0 & 0.5 \\end{pmatrix} = ?$' },
        options: [{ text: '$5.5$' }, { text: '$3$', ok: true }, { text: '$6$' }],
        explain: {
          en: '$2 \\cdot 3 \\cdot 0.5 = 3$. Volumes multiply, they do not add: the sum $5.5$ means nothing here.',
          ru: '$2 \\cdot 3 \\cdot 0.5 = 3$. Объёмы умножаются, а не складываются: сумма $5.5$ здесь ничего не значит.',
        },
        reveal: scene => scene.animateParams({ ax: 2, ay: 0, az: 0, bx: 0, by: 3, bz: 0, cx: 0, cy: 0, cz: 0.5 }, 1200),
      },
      state: { show: ['det'], params: { ax: 2, ay: 0, az: 0, bx: 0, by: 1.5, bz: 0, cx: 0, cy: 0, cz: 1, t: 1 }, camera: CAMERA, controls: [] },
    },
    {
      title: { en: 'Base times height', ru: 'Основание на высоту' },
      text: {
        en: '$\\green{\\hat\\imath\'}$ and $\\red{\\hat\\jmath\'}$ lie on the floor; their <span class="c-teal">parallelogram</span> has area $3$. Drag the end of $\\blue{\\hat k\'}$ along its rail: the box leans over, but its volume does not change — the base is the same, and so is the height. Like a deck of cards pushed sideways. Only the height $h$ matters: volume $= 3h$.',
        ru: '$\\green{\\hat\\imath\'}$ и $\\red{\\hat\\jmath\'}$ лежат на полу; их <span class="c-teal">параллелограмм</span> имеет площадь $3$. Тяните конец $\\blue{\\hat k\'}$ вдоль направляющей: ящик кренится, но объём не меняется — основание то же, высота та же. Как колода карт, которую толкнули вбок. Важна только высота $h$: объём $= 3h$.',
      },
      try: { en: 'Drag the blue point, then change $h$ with the slider.', ru: 'Тяните синюю точку, потом меняйте $h$ ползунком.' },
      check: {
        q: { en: 'A shear tilts $\\hat k$ and leaves the floor. Its determinant is…', ru: 'Сдвиг наклоняет $\\hat k$ и не трогает пол. Его определитель…' },
        options: [{ text: '$1$', ok: true }, { text: { en: 'depends on the tilt', ru: 'зависит от наклона' } }, { text: '$0$' }],
        explain: {
          en: 'The base is the unit square of the floor, the height of $\\hat k\'$ is still $1$: volume $1 \\cdot 1 = 1$, however far the top slides.',
          ru: 'Основание — единичный квадрат пола, высота $\\hat k\'$ по-прежнему $1$: объём $1 \\cdot 1 = 1$, как далеко ни съехал бы верх.',
        },
      },
      state: { show: ['baseh'], params: { h: 1, s: 0.5 }, camera: CAMERA, controls: ['h'] },
    },
    {
      title: { en: 'The formula', ru: 'Формула' },
      text: {
        en: 'In general the determinant is computed along the first row: each of its numbers is multiplied by the $2 \\times 2$ determinant that is left when you cross out its row and column, with signs $+\\,-\\,+$: $$\\det \\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix} = \\begin{aligned} &a(ei - fh) \\\\ -\\ &b(di - fg) \\\\ +\\ &c(dh - eg). \\end{aligned}$$ Behind it is the same «base times height»; the legend shows the formula with the numbers of the matrix on the stage.',
        ru: 'В общем случае определитель считают по первой строке: каждое её число умножают на определитель $2 \\times 2$, который остаётся, если вычеркнуть его строку и столбец, со знаками $+\\,-\\,+$: $$\\det \\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix} = \\begin{aligned} &a(ei - fh) \\\\ -\\ &b(di - fg) \\\\ +\\ &c(dh - eg). \\end{aligned}$$ За ней стоит то же «основание на высоту»; в подписи — формула с числами матрицы со сцены.',
      },
      check: {
        q: { en: '$\\det \\begin{pmatrix} 2 & 0 & 0 \\\\ 1 & 3 & 0 \\\\ 1 & 1 & 1 \\end{pmatrix} = ?$', ru: '$\\det \\begin{pmatrix} 2 & 0 & 0 \\\\ 1 & 3 & 0 \\\\ 1 & 1 & 1 \\end{pmatrix} = ?$' },
        options: [{ text: '$6$', ok: true }, { text: '$7$' }, { text: '$0$' }],
        explain: {
          en: 'Along the first row only $2$ is not zero: $2 \\cdot (3 \\cdot 1 - 0 \\cdot 1) = 6$. Above the diagonal there are only zeros — then the determinant is the product of the diagonal: the box is a stretch with shears, and shears keep volumes.',
          ru: 'В первой строке не ноль только $2$: $2 \\cdot (3 \\cdot 1 - 0 \\cdot 1) = 6$. Над диагональю одни нули — тогда определитель равен произведению диагонали: ящик — это растяжение со сдвигами, а сдвиги объём не меняют.',
        },
        reveal: scene => scene.animateParams({ ax: 2, ay: 1, az: 1, bx: 0, by: 3, bz: 1, cx: 0, cy: 0, cz: 1 }, 1200),
      },
      state: { show: ['expand', 'expandF'], params: MOVE, camera: CAMERA, controls: [] },
    },
    {
      title: { en: 'Zero: space became a plane', ru: 'Ноль: пространство стало плоскостью' },
      text: {
        en: 'Drag $\\blue{\\hat k\'}$ down to the floor. The box is flattened into the floor parallelogram, its volume is $0$ — and so is the determinant. The other way round too: $\\det = 0$ exactly when the three columns lie in one plane, and the matrix squashes all of space into it (or into a line, or a point). Such a matrix cannot be undone.',
        ru: 'Опустите $\\blue{\\hat k\'}$ на пол. Ящик сплющивается в параллелограмм на полу, его объём $0$ — и определитель тоже. И наоборот: $\\det = 0$ ровно тогда, когда три столбца лежат в одной плоскости и матрица сплющивает в неё всё пространство (или в прямую, или в точку). Такую матрицу нельзя отменить.',
      },
      try: { en: 'Drag the blue point down to the floor and watch the determinant.', ru: 'Тяните синюю точку вниз до пола и следите за определителем.' },
      check: {
        q: { en: 'A matrix has two equal columns. Its determinant…', ru: 'У матрицы два одинаковых столбца. Её определитель…' },
        options: [{ text: { en: 'is $0$', ru: 'равен $0$' }, ok: true }, { text: { en: 'can be anything', ru: 'может быть любым' } }, { text: { en: 'is $1$', ru: 'равен $1$' } }],
        explain: {
          en: 'Two equal arrows and any third one always lie in one plane: the box is flat, its volume is $0$.',
          ru: 'Две одинаковые стрелки и любая третья всегда лежат в одной плоскости: ящик плоский, объём $0$.',
        },
      },
      state: { show: ['flat'], params: { u: 0.75 }, camera: [7, -6.5, 2.6], controls: [] },
    },
    {
      title: { en: 'Negative: a right hand became a left one', ru: 'Минус: правая рука стала левой' },
      text: {
        en: 'Keep going: drag $\\blue{\\hat k\'}$ below the floor. The volume grows again, but the determinant is <b>negative</b> and the box is purple: space has been turned inside out, like a glove. Curl the fingers of your right hand from $\\green{\\hat\\imath\'}$ to $\\red{\\hat\\jmath\'}$: the thumb points to the side where $\\blue{\\hat k\'}$ should be. On that side the sign is plus; on the other, minus — a right hand turned into its mirror image.',
        ru: 'Продолжайте: опустите $\\blue{\\hat k\'}$ под пол. Объём снова растёт, но определитель <b>отрицательный</b>, и ящик фиолетовый: пространство вывернули, как перчатку. Согните пальцы правой руки от $\\green{\\hat\\imath\'}$ к $\\red{\\hat\\jmath\'}$ — большой палец покажет, с какой стороны должна быть $\\blue{\\hat k\'}$. С этой стороны знак плюс, с другой — минус: правая рука превратилась в своё отражение.',
      },
      try: { en: 'Move $\\hat k\'$ through the floor and back.', ru: 'Проводите $\\hat k\'$ сквозь пол и обратно.' },
      check: {
        q: { en: 'Two columns of a matrix are swapped. The determinant…', ru: 'В матрице поменяли местами два столбца. Определитель…' },
        options: [{ text: { en: 'changes sign', ru: 'меняет знак' }, ok: true }, { text: { en: 'stays the same', ru: 'не меняется' } }, { text: { en: 'becomes $0$', ru: 'становится $0$' } }],
        explain: {
          en: 'The box is the same, so the size of the volume is the same. But the order of the arrows changed: what was a right-handed triple is now left-handed. So the sign flips.',
          ru: 'Ящик тот же, значит, и объём по модулю тот же. Но порядок стрелок поменялся: что было правой тройкой, стало левой. Поэтому знак меняется.',
        },
      },
      state: { show: ['flat'], params: { u: 0.25 }, camera: [7, -6.5, 2.6], controls: [] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'Replay the move with $t$ and guess the determinant before you look. Then think: a rotation keeps volumes and does not turn space inside out — what is its determinant? If one matrix multiplies volumes by $2$ and another by $3$, what does doing both do? That is why $\\det(AB) = \\det A \\cdot \\det B$, in space as on the plane.',
        ru: 'Переиграйте движение ползунком $t$ и угадайте определитель, прежде чем смотреть. И подумайте: поворот сохраняет объёмы и не выворачивает пространство — каков его определитель? Если одна матрица умножает объёмы на $2$, а другая на $3$, что сделают обе подряд? Поэтому $\\det(AB) = \\det A \\cdot \\det B$ — в пространстве, как и на плоскости.',
      },
      state: { show: ['det'], params: MOVE, camera: CAMERA, controls: ['t'] },
    },
    {
      title: { en: 'Make the volume 6', ru: 'Сделайте объём 6' },
      text: {
        en: '$\\green{\\hat\\imath\'}$ and $\\red{\\hat\\jmath\'}$ are fixed on the floor. Drag $\\blue{\\hat k\'}$ along its rail so that the determinant is $6$.',
        ru: '$\\green{\\hat\\imath\'}$ и $\\red{\\hat\\jmath\'}$ закреплены на полу. Тяните $\\blue{\\hat k\'}$ вдоль направляющей так, чтобы определитель стал равен $6$.',
      },
      task: {
        kind: 'drag',
        target: { u: 5 / 6 },
        tol: 0.025,
        back: 2,
        right: {
          en: 'The base parallelogram has area $2 \\cdot 1.5 = 3$, so the volume is $3h$, and $3h = 6$ at $h = 2$. Where the rail stands over the floor does not matter — only the height.',
          ru: 'Площадь параллелограмма в основании $2 \\cdot 1.5 = 3$, значит, объём $3h$, и $3h = 6$ при $h = 2$. Где именно над полом стоит направляющая, неважно — важна только высота.',
        },
        mistakes: [
          { params: { u: 1 / 6 }, text: {
            en: 'The volume is $6$, but the box is purple: $\\hat k\'$ is under the floor, and the determinant is $-6$. It has to be on the side of the thumb of the right hand — above.',
            ru: 'Объём $6$, но ящик фиолетовый: $\\hat k\'$ под полом, и определитель $-6$. Нужна сторона большого пальца правой руки — сверху.' } },
        ],
        hints: {
          u: u => (u < 5 / 6
            ? { en: 'Too small. Find the area of the base first: then the volume is that area times the height.', ru: 'Маловато. Сначала найдите площадь основания: объём — это она, умноженная на высоту.' }
            : { en: 'Too big. Volume = area of the base × height.', ru: 'Многовато. Объём = площадь основания × высота.' }),
        },
      },
      state: { show: ['vol6'], params: { u: 0.62 }, camera: CAMERA, controls: [] },
    },
    {
      title: { en: 'Compute the determinant', ru: 'Посчитайте определитель' },
      text: {
        en: 'The stage shows the box of the matrix in the legend. Compute its determinant along the first row and set $D$.',
        ru: 'На сцене — ящик матрицы из подписи. Посчитайте её определитель по первой строке и поставьте $D$.',
      },
      task: {
        kind: 'drag',
        target: { D: 7 },
        back: 3,
        right: {
          en: '$2 \\cdot (3 \\cdot 1 - 1 \\cdot 0) - 1 \\cdot (0 \\cdot 1 - 1 \\cdot 1) + 0 = 6 + 1 = 7$. The middle term had a minus in front of a negative bracket — that is where the $+1$ comes from.',
          ru: '$2 \\cdot (3 \\cdot 1 - 1 \\cdot 0) - 1 \\cdot (0 \\cdot 1 - 1 \\cdot 1) + 0 = 6 + 1 = 7$. У среднего слагаемого минус стоит перед отрицательной скобкой — отсюда $+1$.',
        },
        mistakes: [
          { params: { D: 5 }, text: {
            en: 'The middle term is taken with a <b>minus</b>: $-1 \\cdot (0 \\cdot 1 - 1 \\cdot 1) = -1 \\cdot (-1) = +1$. It looks like the minus got lost.',
            ru: 'Среднее слагаемое берётся с <b>минусом</b>: $-1 \\cdot (0 \\cdot 1 - 1 \\cdot 1) = -1 \\cdot (-1) = +1$. Похоже, минус потерялся.' } },
          { params: { D: 6 }, text: {
            en: 'This is the product of the diagonal, $2 \\cdot 3 \\cdot 1$. It is enough only when above (or below) the diagonal there are zeros. Here there is a $1$ above it.',
            ru: 'Это произведение диагонали, $2 \\cdot 3 \\cdot 1$. Его хватает, только когда над (или под) диагональю нули. Здесь над ней стоит $1$.' } },
        ],
        hints: {
          D: D => (D < 7
            ? { en: 'Too small. $a(ei - fh) - b(di - fg) + c(dh - eg)$ — mind the signs.', ru: 'Маловато. $a(ei - fh) - b(di - fg) + c(dh - eg)$ — следите за знаками.' }
            : { en: 'Too big. $a(ei - fh) - b(di - fg) + c(dh - eg)$.', ru: 'Многовато. $a(ei - fh) - b(di - fg) + c(dh - eg)$.' }),
        },
      },
      state: { show: ['readDet'], params: { D: 0 }, camera: [6.5, -8, 5], controls: ['D'] },
    },
    {
      title: { en: 'Flatten it with k', ru: 'Сплющите числом k' },
      text: {
        en: 'For which $k$ does this matrix squash space into a plane? Set $k$ with the slider and turn the scene to see the box become flat.',
        ru: 'При каком $k$ эта матрица сплющивает пространство в плоскость? Поставьте $k$ ползунком и поверните сцену, чтобы увидеть, как ящик становится плоским.',
      },
      task: {
        kind: 'drag',
        target: { k: 2 },
        back: 4,
        right: {
          en: 'At $k = 2$ the third column is $(1;\\ 2;\\ 1) = \\green{\\hat\\imath\'} + \\red{\\hat\\jmath\'}$: it lies in the plane of the first two. Along the first row: $1 \\cdot (1 - k) - 0 + 1 \\cdot (1 - 0) = 2 - k = 0$.',
          ru: 'При $k = 2$ третий столбец $(1;\\ 2;\\ 1) = \\green{\\hat\\imath\'} + \\red{\\hat\\jmath\'}$ лежит в плоскости первых двух. По первой строке: $1 \\cdot (1 - k) - 0 + 1 \\cdot (1 - 0) = 2 - k = 0$.',
        },
        hints: {
          k: k => ({
            en: `At $k = ${r2(k)}$ the box still has volume $${r2(Math.abs(2 - k))}$. The determinant is a simple expression in $k$: compute it along the first row and solve $\\det = 0$.`,
            ru: `При $k = ${r2(k)}$ у ящика ещё есть объём $${r2(Math.abs(2 - k))}$. Определитель — простое выражение от $k$: посчитайте его по первой строке и решите $\\det = 0$.`,
          }),
        },
      },
      state: { show: ['kflat'], params: { k: -1 }, camera: CAMERA, controls: ['k'] },
    },
  ],
};
