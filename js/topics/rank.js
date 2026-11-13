// Rank and kernel: what a matrix loses. A matrix with det = 0 squashes space into a plane, a line or a point; the
// dimension of what is left (the image, spanned by the columns) is the rank. What is lost is the kernel — every
// arrow that lands at the origin. Lost + left = 3. A system Mx = b is solvable only for b in the image, and then
// its solutions are one solution plus the whole kernel: a line or a plane of them.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';
import { add, mul, lerp, apply, cross, box, section, clipLine } from '../core/geom.js';
import { space, m3, col3 } from './matrix3.js';

const RR = 3, ZZ = 3;
const BOX = box(RR, ZZ);
const CAMERA = [6.5, -7.5, 4.6];
const WHITE = '#ffffff';
const r2 = v => fmt(Math.round(v * 100) / 100);

// Rank 2: the third column is the sum of the first two. Image: the plane of a and b; kernel: the line of (1; 1; −1)
const A2 = [1, 0, 0.5], B2 = [0, 1, 0.5], C2 = [1, 1, 1], K2 = [1, 1, -1];
// Rank 1: all three columns on the line of (1; 1; 0.5). Kernel: the plane x + 2y − z = 0
const A1 = [1, 1, 0.5], B1 = [2, 2, 1], C1 = [-1, -1, -0.5], N1 = [1, 2, -1];

// Points of the kernel line (rank 2), drawn before the move and carried by it to the origin
const KERNEL_PTS = [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2].map(s => mul(K2, s));

// Solutions of Mx = (1; 1; 1): x₀ + s·(1; 1; −1), the handle runs from s = −1.5 to s = 1.5
const X0 = [1, 1, 0], S0 = add(X0, mul(K2, -1.5)), S1 = add(X0, mul(K2, 1.5));

// Tasks. 1: P slides on a rail that crosses the kernel line of the rank-2 matrix at (0.5; 0.5; −0.5)
const P0 = [-1, 1, -0.5], P1 = [2, 0, -0.5];
// 2: b = (1; 2; h): solvable only in the image plane of A2, B2, where z = (x + y) / 2
// 3: columns (1; 2; 1), (2; 4; 2), (1; k; 1): rank 1 at k = 2
const KA = [1, 2, 1], KB = [2, 4, 2], KC = k => [1, k, 1];

// The image plane of the rank-2 matrix: through the origin, normal a × b
const imagePlane = (p, key, a, b, color = COLORS.teal) => p.sheet(key, section(BOX, { n: cross(a, b), d: 0 }), color, { opacity: 0.16 });
const kernelLine = (p, key, k, color = COLORS.orange) => {
  const seg = clipLine([0, 0, 0], k, RR, ZZ);
  if (seg) p.segment(key, seg[0], seg[1], color, { radius: 0.035 });
};

export default {
  view: '3d',
  view3d: { R: RR, zmax: ZZ, camera: CAMERA },
  lab: false,

  setup(scene) {
    scene.ensureParam('t', 1, { min: 0, max: 1, step: 0.01 });
    scene.ensureParam('k', 0, { min: 0, max: 1, step: 1 }); // rank 2 or rank 1
    scene.ensureParam('u', 0.2, { min: 0, max: 1 });
    scene.ensureParam('h', 0, { min: -2, max: 3, step: 0.5 });
    scene.ensureParam('m', 0, { min: -2, max: 4, step: 0.5 });
    scene.ensureParam('w', 0.5, { min: 0, max: 1 }); // x on the line of solutions

    scene.custom.push(
      {
        // Rank 2 and rank 1: the grid of space squashed into a plane or a line
        id: 'squash',
        draw3d(p, sc, s) {
          const two = Math.round(s.k) === 0;
          space(p, 'squash', ...(two ? [A2, B2, C2] : [A1, B1, C1]), s.t, { cube: false, n: 1 });
          if (s.t > 0.98) {
            if (two) imagePlane(p, 'squash:img', A2, B2);
            else kernelLine(p, 'squash:img', A1, COLORS.teal);
          }
        },
        legend: s => {
          const two = Math.round(s.k) === 0;
          const [im, pl, ln] = t({ en: ['image', 'a plane', 'a line'], ru: ['образ', 'плоскость', 'прямая'] });
          return `${m3(...(two ? [A2, B2, C2] : [A1, B1, C1]))}\\qquad \\teal{\\text{${im}}}: \\text{${two ? pl : ln}},\\ \\operatorname{rank} = ${two ? 2 : 1}`;
        },
      },
      {
        // The kernel: points of one line all go to the origin
        id: 'kernel',
        draw3d(p, sc, s) {
          const M = [A2, B2, C2].map((X, i) => lerp([[1, 0, 0], [0, 1, 0], [0, 0, 1]][i], X, s.t));
          space(p, 'kernel', A2, B2, C2, s.t, { cube: false, grid: false });
          if (s.t < 0.02) kernelLine(p, 'kernel:line', K2);
          KERNEL_PTS.forEach((q, i) => p.point(`kernel:pt${i}`, apply(...M, q), COLORS.orange, null, 0.08));
          if (s.t > 0.98) imagePlane(p, 'kernel:img', A2, B2);
        },
        legend: () => `${m3(A2, B2, C2)} ${col3(K2, 'orange')} = \\green{${col3(A2)}} + \\red{${col3(B2)}} - \\blue{${col3(C2)}} = ${col3([0, 0, 0])}`,
      },
      {
        // Rank 1: the kernel is a whole plane
        id: 'kernel1',
        draw3d(p) {
          space(p, 'kernel1', A1, B1, C1, 1, { cube: false, grid: false });
          kernelLine(p, 'kernel1:img', A1, COLORS.teal);
          p.sheet('kernel1:ker', section(BOX, { n: N1, d: 0 }), COLORS.orange, { opacity: 0.18 });
        },
        legend: () => {
          const [ker, im] = t({ en: ['kernel', 'image'], ru: ['ядро', 'образ'] });
          return `\\orange{\\text{${ker}}}: x + 2y - z = 0,\\quad \\teal{\\text{${im}}}: t\\,(1;\\ 1;\\ 0.5)`;
        },
      },
      {
        id: 'dims',
        legend: () => {
          const [ker, im] = t({ en: ['kernel', 'image'], ru: ['ядро', 'образ'] });
          return `\\dim \\orange{\\text{${ker}}} + \\dim \\teal{\\text{${im}}} = 2 + 1 = 3`;
        },
      },
      {
        // Mx = b for b in the image: one solution x₀ = (1; 1; 0) plus the kernel line, all going to b = (1; 1; 1)
        id: 'solutions',
        draw3d(p, sc, s) {
          const b = apply(A2, B2, C2, X0);
          imagePlane(p, 'solutions:img', A2, B2);
          const seg = clipLine(X0, K2, RR, ZZ), x = lerp(S0, S1, s.w);
          if (seg) p.segment('solutions:line', seg[0], seg[1], COLORS.orange, { radius: 0.03 });
          p.arrow('solutions:b', [0, 0, 0], b, COLORS.yellow, { name: 'b' });
          p.segment('solutions:map', x, b, WHITE, { hidden: true });
          p.handle('solutions:x', S0, S1, s.w, COLORS.orange, w => sc.setParam('w', w), 'x');
        },
        legend: s => {
          const x = lerp(S0, S1, s.w);
          return `M ${col3(x, 'orange')} = ${col3(apply(A2, B2, C2, x), 'yellow')}`;
        },
      },
      // ---- Tasks ----
      {
        id: 'findKer',
        draw3d(p, sc, s) {
          const P = lerp(P0, P1, s.u), Q = apply(A2, B2, C2, P);
          imagePlane(p, 'findKer:img', A2, B2);
          p.segment('findKer:rail', P0, P1, COLORS.grey, { radius: 0.012 });
          p.segment('findKer:OP', [0, 0, 0], P, COLORS.orange, { hidden: true });
          p.handle('findKer:P', P0, P1, s.u, COLORS.orange, u => sc.setParam('u', u), 'P');
          p.arrow('findKer:Q', [0, 0, 0], Q, COLORS.yellow, { name: 'MP' });
          p.point('findKer:O', [0, 0, 0], WHITE, null, 0.06);
        },
        legend: s => {
          const P = lerp(P0, P1, s.u);
          return `M = ${m3(A2, B2, C2)},\\quad M ${col3(P, 'orange')} = ${col3(apply(A2, B2, C2, P), 'yellow')}`;
        },
      },
      {
        id: 'reachB',
        draw3d(p, sc, s) {
          space(p, 'reachB', A2, B2, C2, 1, { cube: false, grid: false });
          imagePlane(p, 'reachB:img', A2, B2);
          const b = [1, 2, s.h];
          p.arrow('reachB:b', [0, 0, 0], b, COLORS.yellow, { name: 'b' });
        },
        legend: s => `${m3(A2, B2, C2)} \\vec x = ${col3([1, 2, s.h], 'yellow')}`,
      },
      {
        id: 'rank1',
        draw3d(p, sc, s) { space(p, 'rank1', KA, KB, KC(s.m), 1, { cube: false, n: 1 }); },
        legend: s => m3(KA, KB, KC(s.m)),
      },
    );
  },

  steps: [
    {
      title: { en: 'Squashed into a plane or a line', ru: 'Сплющено в плоскость или в прямую' },
      text: {
        en: 'When $\\det = 0$, a matrix squashes space — but into what? Here the third column is the sum of the first two, so all of space lands on the <span class="c-teal">plane</span> of $\\green{\\hat\\imath\'}$ and $\\red{\\hat\\jmath\'}$. Switch $k$: now all three columns are on one line, and space falls onto a <span class="c-teal">line</span>. Where everything lands is the <i>image</i>; its dimension — $2$ for a plane, $1$ for a line — is the <i>rank</i> of the matrix. It is how many of the columns really point in different directions.',
        ru: 'Когда $\\det = 0$, матрица сплющивает пространство — но во что? Здесь третий столбец — сумма первых двух, и всё пространство ложится на <span class="c-teal">плоскость</span> $\\green{\\hat\\imath\'}$ и $\\red{\\hat\\jmath\'}$. Переключите $k$: теперь все три столбца на одной прямой, и пространство падает на <span class="c-teal">прямую</span>. То, куда всё попадает, называют <i>образом</i>; его размерность — $2$ для плоскости, $1$ для прямой — это <i>ранг</i> матрицы. Сколько столбцов на самом деле смотрят в разные стороны.',
      },
      try: { en: 'Press ▶ next to $t$; switch $k$ and play again.', ru: 'Нажмите ▶ возле $t$; переключите $k$ и сыграйте ещё раз.' },
      check: {
        q: { en: 'What is the rank of a $3 \\times 3$ matrix with $\\det \\ne 0$?', ru: 'Каков ранг матрицы $3 \\times 3$ с $\\det \\ne 0$?' },
        options: [{ text: '$3$', ok: true }, { text: '$1$' }, { text: '$0$' }],
        explain: {
          en: 'The box on the columns has a volume, so space is not squashed: the image is all of space, dimension $3$. Rank $0$ belongs only to the zero matrix, which sends everything to the origin.',
          ru: 'У ящика на столбцах есть объём, значит, пространство не сплющено: образ — всё пространство, размерность $3$. Ранг $0$ только у нулевой матрицы, которая всё отправляет в начало координат.',
        },
      },
      state: { show: ['squash'], params: { k: 0 }, camera: CAMERA, controls: ['t', 'k'] },
      enter(scene) {
        scene.setParam('t', 0);
        scene.animateParams({ t: 1 }, 3500);
      },
    },
    {
      title: { en: 'The kernel: what goes to zero', ru: 'Ядро: что уходит в ноль' },
      text: {
        en: 'Something is lost when space is squashed. The <span class="c-orange">orange points</span> lie on one line, along $(1;\\ 1;\\ -1)$. Play $t$: they all slide into the origin. Indeed, $M(1;\\ 1;\\ -1) = \\hat\\imath\' + \\hat\\jmath\' - \\hat k\' = 0$, because $\\hat k\' = \\hat\\imath\' + \\hat\\jmath\'$. All arrows that a matrix sends to zero form the <i>kernel</i>. Here it is a line: one dimension is lost.',
        ru: 'Когда пространство сплющивается, что-то теряется. <span class="c-orange">Оранжевые точки</span> лежат на одной прямой, вдоль $(1;\\ 1;\\ -1)$. Сыграйте $t$: все они съезжаются в начало координат. И правда, $M(1;\\ 1;\\ -1) = \\hat\\imath\' + \\hat\\jmath\' - \\hat k\' = 0$, ведь $\\hat k\' = \\hat\\imath\' + \\hat\\jmath\'$. Все стрелки, которые матрица отправляет в ноль, образуют <i>ядро</i>. Здесь это прямая: потеряно одно измерение.',
      },
      try: { en: 'Press ▶ next to $t$ and watch the orange points.', ru: 'Нажмите ▶ возле $t$ и следите за оранжевыми точками.' },
      check: {
        q: { en: 'Why can such a matrix not be undone?', ru: 'Почему такую матрицу нельзя отменить?' },
        options: [
          { text: { en: 'many arrows land on the same place', ru: 'много стрелок попадает в одно место' }, ok: true },
          { text: { en: 'its numbers are too small', ru: 'у неё слишком маленькие числа' } },
          { text: { en: 'it has no columns', ru: 'у неё нет столбцов' } },
        ],
        explain: {
          en: 'The whole orange line landed at $0$ — and so did nothing else. To undo the move, one would have to tell which of them it was. Not only $0$: any two points that differ by an arrow of the kernel land on the same place.',
          ru: 'Вся оранжевая прямая попала в $0$. Чтобы отменить движение, надо было бы понять, какая именно точка пришла. И не только в $0$: любые две точки, отличающиеся на стрелку ядра, попадают в одно место.',
        },
      },
      state: { show: ['kernel'], camera: CAMERA, controls: ['t'] },
      enter(scene) {
        scene.setParam('t', 0);
        scene.animateParams({ t: 1 }, 3500);
      },
    },
    {
      title: { en: 'Lost + left = 3', ru: 'Потеряно + осталось = 3' },
      text: {
        en: 'Now all three columns lie on one <span class="c-teal">line</span>: rank $1$. What goes to zero is a whole <span class="c-orange">plane</span>: the kernel has dimension $2$. Every dimension of space either survives in the image or is lost in the kernel: $$\\dim(\\text{kernel}) + \\operatorname{rank} = 3.$$ Rank $2$ — the kernel is a line; rank $1$ — a plane; rank $3$ — only the zero arrow.',
        ru: 'Теперь все три столбца лежат на одной <span class="c-teal">прямой</span>: ранг $1$. В ноль уходит целая <span class="c-orange">плоскость</span>: ядро двумерно. Каждое измерение пространства либо сохраняется в образе, либо теряется в ядре: $$\\dim(\\text{ядро}) + \\operatorname{rank} = 3.$$ Ранг $2$ — ядро прямая; ранг $1$ — плоскость; ранг $3$ — одна нулевая стрелка.',
      },
      try: { en: 'Turn the scene: the teal line of the image crosses the orange plane of the kernel.', ru: 'Поверните сцену: бирюзовая прямая образа протыкает оранжевую плоскость ядра.' },
      check: {
        q: { en: 'A $3 \\times 3$ matrix sends a whole plane to zero. Its rank is…', ru: 'Матрица $3 \\times 3$ отправляет в ноль целую плоскость. Её ранг…' },
        options: [{ text: '$1$', ok: true }, { text: '$2$' }, { text: '$0$' }],
        explain: {
          en: '$3 - 2 = 1$: if the kernel is a plane, the image can only be a line (or the matrix sends even more to zero).',
          ru: '$3 - 2 = 1$: если ядро — плоскость, образ может быть только прямой (если не больше уходит в ноль).',
        },
      },
      state: { show: ['kernel1', 'dims'], camera: [7.5, -5.5, 3.5], controls: [] },
    },
    {
      title: { en: 'Systems with det = 0', ru: 'Системы с det = 0' },
      text: {
        en: 'Now the system $M\\vec x = \\vec b$ for this rank-2 matrix. A solution exists only if $\\vec b$ lies in the <span class="c-teal">image plane</span> — there is nowhere else to land. And if one solution $\\vec x_0$ exists, then $\\vec x_0$ plus any arrow of the kernel is also a solution: $M(\\vec x_0 + \\vec k) = \\vec b + 0$. So the solutions form a whole <span class="c-orange">line</span>, parallel to the kernel — the book from the topic about three planes.',
        ru: 'Теперь система $M\\vec x = \\vec b$ для этой матрицы ранга $2$. Решение есть, только если $\\vec b$ лежит в <span class="c-teal">плоскости образа</span> — больше попасть некуда. А если одно решение $\\vec x_0$ есть, то и $\\vec x_0$ плюс любая стрелка ядра — тоже решение: $M(\\vec x_0 + \\vec k) = \\vec b + 0$. Значит, решения образуют целую <span class="c-orange">прямую</span>, параллельную ядру, — та самая книжка из темы про три плоскости.',
      },
      try: { en: 'Drag the orange point $x$ along its line: $M\\vec x$ stays $\\vec b$.', ru: 'Тяните оранжевую точку $x$ по её прямой: $M\\vec x$ остаётся равным $\\vec b$.' },
      state: { show: ['solutions'], params: { w: 0.5 }, camera: CAMERA, controls: [] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'Find the rank of $\\begin{pmatrix} 1 & 2 & 3 \\\\ 4 & 5 & 6 \\\\ 7 & 8 & 9 \\end{pmatrix}$: is the third column a combination of the first two? Then think about rectangular matrices: a $3 \\times 2$ matrix takes the plane into space — what can its image be? And a $2 \\times 3$ matrix squashes space onto a plane — how big must its kernel be?',
        ru: 'Найдите ранг $\\begin{pmatrix} 1 & 2 & 3 \\\\ 4 & 5 & 6 \\\\ 7 & 8 & 9 \\end{pmatrix}$: является ли третий столбец комбинацией первых двух? И подумайте о прямоугольных матрицах: матрица $3 \\times 2$ переносит плоскость в пространство — каким может быть её образ? А матрица $2 \\times 3$ сплющивает пространство на плоскость — каким по меньшей мере будет её ядро?',
      },
      state: { show: ['squash'], params: { k: 0, t: 1 }, camera: CAMERA, controls: ['t', 'k'] },
    },
    {
      title: { en: 'Find the kernel', ru: 'Найдите ядро' },
      text: {
        en: 'This is the rank-2 matrix again. Slide $P$ along the grey rail until the matrix sends it to zero: the yellow arrow $MP$ must vanish.',
        ru: 'Это снова матрица ранга $2$. Сдвиньте $P$ по серой направляющей так, чтобы матрица отправила её в ноль: жёлтая стрелка $MP$ должна исчезнуть.',
      },
      task: {
        kind: 'drag',
        target: { u: 0.5 },
        tol: 0.025,
        back: 1,
        right: {
          en: '$P = (0.5;\\ 0.5;\\ -0.5) = 0.5\\,(1;\\ 1;\\ -1)$ — a point of the kernel line: $0.5\\,(\\hat\\imath\' + \\hat\\jmath\' - \\hat k\') = 0$.',
          ru: '$P = (0.5;\\ 0.5;\\ -0.5) = 0.5\\,(1;\\ 1;\\ -1)$ — точка прямой ядра: $0.5\\,(\\hat\\imath\' + \\hat\\jmath\' - \\hat k\') = 0$.',
        },
        hints: {
          u: u => {
            const Q = apply(A2, B2, C2, lerp(P0, P1, u));
            return {
              en: `$MP = (${Q.map(r2).join(';\\ ')})$, not zero yet. The kernel is the line of $(1;\\ 1;\\ -1)$: look for $P$ with $x = y = -z$.`,
              ru: `$MP = (${Q.map(r2).join(';\\ ')})$, ещё не ноль. Ядро — прямая $(1;\\ 1;\\ -1)$: ищите $P$, у которой $x = y = -z$.`,
            };
          },
        },
      },
      state: { show: ['findKer'], params: { u: 0.1 }, camera: [8, -3.5, 3], controls: [] },
    },
    {
      title: { en: 'Reach b', ru: 'Дотянитесь до b' },
      text: {
        en: 'For which height $h$ does the system with $\\vec b = (1;\\ 2;\\ h)$ have solutions? Move $h$ until $\\vec b$ lies in the teal image plane.',
        ru: 'При какой высоте $h$ у системы с $\\vec b = (1;\\ 2;\\ h)$ есть решения? Двигайте $h$, пока $\\vec b$ не ляжет в бирюзовую плоскость образа.',
      },
      task: {
        kind: 'drag',
        target: { h: 1.5 },
        back: 3,
        right: {
          en: 'Every image point is $x\\hat\\imath\' + y\\hat\\jmath\' + z\\hat k\' = (x + z;\\ y + z;\\ \\tfrac{x + y}{2} + z)$: its height is the mean of the first two coordinates. $\\frac{1 + 2}{2} = 1.5$. For other $h$ there are no solutions, for $h = 1.5$ a whole line of them.',
          ru: 'Любая точка образа — $x\\hat\\imath\' + y\\hat\\jmath\' + z\\hat k\' = (x + z;\\ y + z;\\ \\tfrac{x + y}{2} + z)$: её высота — среднее первых двух координат. $\\frac{1 + 2}{2} = 1.5$. При других $h$ решений нет, при $h = 1.5$ — целая прямая.',
        },
        mistakes: [
          { params: { h: 0 }, text: {
            en: '$h = 0$ puts $\\vec b$ on the floor, but the image plane is tilted: it is not the floor. Look how high the plane is above $(1;\\ 2)$.',
            ru: '$h = 0$ кладёт $\\vec b$ на пол, но плоскость образа наклонная — это не пол. Посмотрите, на какой высоте плоскость над точкой $(1;\\ 2)$.' } },
        ],
        hints: {
          h: h => (h < 1.5
            ? { en: 'Below the image plane: there is no solution. Raise $\\vec b$.', ru: 'Ниже плоскости образа: решений нет. Поднимите $\\vec b$.' }
            : { en: 'Above the image plane: there is no solution. Lower $\\vec b$.', ru: 'Выше плоскости образа: решений нет. Опустите $\\vec b$.' }),
        },
      },
      state: { show: ['reachB'], params: { h: -1 }, camera: [7.5, -5, 2.5], controls: ['h'] },
    },
    {
      title: { en: 'Rank 1', ru: 'Ранг 1' },
      text: {
        en: 'The columns are $(1;\\ 2;\\ 1)$, $(2;\\ 4;\\ 2)$ and $(1;\\ m;\\ 1)$. For which $m$ is the rank $1$ — all of space squashed into a line?',
        ru: 'Столбцы — $(1;\\ 2;\\ 1)$, $(2;\\ 4;\\ 2)$ и $(1;\\ m;\\ 1)$. При каком $m$ ранг равен $1$ — всё пространство сплющено в прямую?',
      },
      task: {
        kind: 'drag',
        target: { m: 2 },
        back: 0,
        right: {
          en: 'The second column is twice the first: they are already on one line. At $m = 2$ the third one is the first itself, so all three are on the line of $(1;\\ 2;\\ 1)$: rank $1$. For any other $m$ the rank is $2$ — space becomes a plane, but not a line.',
          ru: 'Второй столбец — удвоенный первый: они уже на одной прямой. При $m = 2$ третий совпадает с первым, и все три — на прямой $(1;\\ 2;\\ 1)$: ранг $1$. При любом другом $m$ ранг $2$ — пространство становится плоскостью, но не прямой.',
        },
        hints: {
          m: { en: 'The grid is still a plane: the third column points off the line of the first two. Make it a multiple of $(1;\\ 2;\\ 1)$.', ru: 'Сетка всё ещё плоскость: третий столбец смотрит мимо прямой первых двух. Сделайте его кратным $(1;\\ 2;\\ 1)$.' },
        },
      },
      state: { show: ['rank1'], params: { m: -1 }, camera: CAMERA, controls: ['m'] },
    },
  ],
};
