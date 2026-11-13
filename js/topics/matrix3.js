// A 3×3 matrix moves space. The same idea as on the plane, one dimension up: grid lines of space stay straight,
// parallel and evenly spaced, the origin stays; so the move is fixed by where three arrows land, î, ĵ, k̂.
// Written as columns, they are the matrix; multiplying by it is x·î′ + y·ĵ′ + z·k̂′. If k̂′ falls into the plane
// of î′ and ĵ′, all of space is squashed into that plane.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';
import { add, mul, lerp, apply, det3 } from '../core/geom.js';

const CAMERA = [6, -7.5, 4.6];
const r2 = v => fmt(Math.round(v * 100) / 100);
const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
export const NAMES = ['î', 'ĵ', 'k̂'];
// Columns in their colors: î′ green, ĵ′ red, k̂′ blue (as î′ and ĵ′ on the plane)
export const m3 = (a, b, c) => `\\begin{pmatrix} ${[0, 1, 2].map(i => `\\green{${r2(a[i])}} & \\red{${r2(b[i])}} & \\blue{${r2(c[i])}}`).join(' \\\\ ')} \\end{pmatrix}`;
export const col3 = (v, color = '') => `${color ? `\\${color}{` : ''}\\begin{pmatrix} ${v.map(r2).join(' \\\\ ')} \\end{pmatrix}${color ? '}' : ''}`;

// The box on the arrows a, b, c (the unit cube after the move): six faint faces and twelve edges
export function brick(p, key, a, b, c, color, { at = [0, 0, 0], opacity = 0.16 } = {}) {
  const P = (x, y, z) => add(at, apply(a, b, c, [x, y, z]));
  const faces = [
    [P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)], [P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)],
    [P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)], [P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1)],
    [P(0, 0, 0), P(0, 1, 0), P(0, 1, 1), P(0, 0, 1)], [P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1)],
  ];
  faces.forEach((f, i) => p.polygon(`${key}:f${i}`, f, color, { opacity, outline: false }));
  const edges = [];
  for (const [u, v] of [[0, 1], [1, 2], [2, 0]]) {
    for (const s of [0, 1]) for (const r of [0, 1]) {
      const q = [0, 0, 0];
      q[3 - u - v] = s; q[v] = r;
      const q2 = [...q];
      q2[u] = 1;
      edges.push([P(...q), P(...q2)]);
    }
  }
  edges.forEach(([x, y], i) => p.segment(`${key}:e${i}`, x, y, color, { radius: 0.018 }));
}

// Space under the matrix with columns A, B, C, part t of the way from where it was: the moved grid of space,
// the unit cube (yellow, purple when space is turned inside out), î′, ĵ′, k̂′; optionally a vector v and its walk
// x·î′ + y·ĵ′ + z·k̂′. Also used by the topics about the 3D determinant, three planes and rank.
export function space(p, key, A, B, C, tt, { v = null, cube = true, grid = true, arrows = true, n = 2, prime = tt > 0.5 } = {}) {
  const [a, b, c] = [A, B, C].map((X, i) => lerp(E[i], X, tt));
  const at = (x, y, z) => apply(a, b, c, [x, y, z]);
  if (grid) {
    const segs = [];
    for (let i = -n; i <= n; i++) {
      for (let j = -n; j <= n; j++) segs.push([at(-n, i, j), at(n, i, j)], [at(i, -n, j), at(i, n, j)], [at(i, j, -n), at(i, j, n)]);
    }
    p.lines(`${key}:grid`, segs, '#78aaff', 0.2);
  }
  if (cube) brick(p, `${key}:cube`, a, b, c, det3(a, b, c) < -1e-9 ? COLORS.purple : COLORS.yellow);
  if (v) {
    const s1 = mul(a, v[0]), s2 = add(s1, mul(b, v[1])), s3 = add(s2, mul(c, v[2]));
    p.segment(`${key}:w1`, [0, 0, 0], s1, COLORS.green, { hidden: true });
    p.segment(`${key}:w2`, s1, s2, COLORS.red, { hidden: true });
    p.segment(`${key}:w3`, s2, s3, COLORS.blue, { hidden: true });
    p.arrow(`${key}:v`, [0, 0, 0], s3, COLORS.yellow, { radius: 0.05, name: 'v' });
  }
  if (arrows) {
    [a, b, c].forEach((X, i) => p.arrow(`${key}:${i}`, [0, 0, 0], X, [COLORS.green, COLORS.red, COLORS.blue][i], { name: NAMES[i] + (prime ? '′' : '') }));
  }
  return { a, b, c };
}

const A = s => [s.ax, s.ay, s.az], B = s => [s.bx, s.by, s.bz], C = s => [s.cx, s.cy, s.cz], K = s => [s.k_x, s.k_y, s.k_z];
const MOVE = { ax: 1.5, ay: 0.5, az: 0, bx: -0.5, by: 1, bz: 0.5, cx: 0.5, cy: -0.5, cz: 1.5 };
const ID = { ax: 1, ay: 0, az: 0, bx: 0, by: 1, bz: 0, cx: 0, cy: 0, cz: 1 };

// Familiar moves of space (î′, ĵ′, k̂′)
const EXAMPLES = [
  { M: [[0, 1, 0], [-1, 0, 0], [0, 0, 1]], name: { en: 'rotation by 90° about the z axis', ru: 'поворот на 90° вокруг оси z' } },
  { M: [[2, 0, 0], [0, 1, 0], [0, 0, 0.5]], name: { en: 'stretch along x, squeeze along z', ru: 'растяжение по x, сжатие по z' } },
  { M: [[1, 0, 0], [0, 1, 0], [0, 1, 1]], name: { en: 'shear: the top slides along y', ru: 'сдвиг: верх съезжает вдоль y' } },
  { M: [[1, 0, 0], [0, 1, 0], [0, 0, -1]], name: { en: 'mirror in the floor', ru: 'отражение в полу' } },
];

// Tasks: where v lands; the fixed matrix and v
const W = [[1, 0, 1], [1, 1, 0], [0, 0, 2]], WV = [1, 1, 1];
// The flattening task: î′ = (1; 0; 0), ĵ′ = (0; 1; 1), k̂′ slides up and down at (0; 2; ·)
const FA = [1, 0, 0], FB = [0, 1, 1], F0 = [0, 2, -1], F1 = [0, 2, 3];

export default {
  view: '3d',
  view3d: { R: 3, zmax: 3, camera: CAMERA },
  lab: false,

  setup(scene) {
    for (const [name, v] of Object.entries(MOVE)) scene.ensureParam(name, v, { min: -4, max: 4, step: 0.5 });
    scene.ensureParam('t', 1, { min: 0, max: 1, step: 0.01 });
    scene.ensureParam('k', 0, { min: 0, max: 3, step: 1 });
    ['Q_x', 'Q_y', 'Q_z'].forEach(n => scene.ensureParam(n, 0, { min: -4, max: 4, step: 0.5 })); // the student's point
    ['k_x', 'k_y', 'k_z'].forEach(n => scene.ensureParam(n, 0, { min: -2, max: 2, step: 0.5 })); // k̂′ set by the student
    scene.ensureParam('u', 0.5, { min: 0, max: 1 }); // k̂′ on its segment in the last task

    scene.custom.push(
      {
        // Three basis arrows and v = 2î + ĵ + 2k̂, walked along them
        id: 'basis',
        draw3d(p) { space(p, 'basis', ...E, 1, { v: [2, 1, 2], cube: false, grid: false, prime: false }); },
        legend: () => '\\yellow{\\vec v} = \\begin{pmatrix} 2 \\\\ 1 \\\\ 2 \\end{pmatrix} = 2\\green{\\hat\\imath} + 1\\red{\\hat\\jmath} + 2\\blue{\\hat k}',
      },
      {
        id: 'move',
        draw3d(p, sc, s) { space(p, 'move', A(s), B(s), C(s), s.t); },
        legend: s => `${t({ en: '\\text{matrix}', ru: '\\text{матрица}' })}\\ ${m3(A(s), B(s), C(s))}`,
      },
      {
        // The same with v = (1; 2; 1) carried along
        id: 'moveV',
        draw3d(p, sc, s) { space(p, 'moveV', A(s), B(s), C(s), s.t, { v: [1, 2, 1] }); },
        legend: s => `${m3(A(s), B(s), C(s))} ${col3([1, 2, 1])} = 1${col3(A(s), 'green')} + 2${col3(B(s), 'red')} + 1${col3(C(s), 'blue')} = ${col3(apply(A(s), B(s), C(s), [1, 2, 1]), 'yellow')}`,
      },
      {
        id: 'examples',
        draw3d(p, sc, s) { const e = EXAMPLES[Math.round(s.k)]; space(p, 'examples', ...e.M, s.t); },
        legend: s => { const e = EXAMPLES[Math.round(s.k)]; return `\\text{${t(e.name)}}:\\ ${m3(...e.M)}`; },
      },
      // ---- Tasks ----
      {
        // The matrix is fixed; v before the move is white and faint, the student puts the yellow point where it lands
        id: 'whereV',
        draw3d(p, sc, s) {
          space(p, 'whereV', ...W, 1, { cube: false });
          p.arrow('whereV:v0', [0, 0, 0], WV, COLORS.grey, { name: 'v', radius: 0.03 });
          const Q = [s.Q_x, s.Q_y, s.Q_z];
          p.segment('whereV:Q', [0, 0, 0], Q, COLORS.yellow, { hidden: true });
          p.point('whereV:Qp', Q, COLORS.yellow, 'Q', 0.11);
        },
        legend: s => `M = ${m3(...W)},\\quad \\vec v = ${col3(WV)},\\quad \\yellow{Q} = ${col3([s.Q_x, s.Q_y, s.Q_z])}`,
      },
      {
        // î′ and ĵ′ stay; the student sets k̂′ with sliders
        id: 'shear',
        draw3d(p, sc, s) { space(p, 'shear', E[0], E[1], K(s), 1); },
        legend: s => m3(E[0], E[1], K(s)),
      },
      {
        id: 'flatten',
        draw3d(p, sc, s) {
          const c = lerp(F0, F1, s.u);
          space(p, 'flatten', FA, FB, c, 1);
          p.segment('flatten:rail', F0, F1, COLORS.grey, { radius: 0.012 });
          p.handle('flatten:h', F0, F1, s.u, COLORS.blue, u => sc.setParam('u', u));
        },
        legend: s => m3(FA, FB, lerp(F0, F1, s.u)),
      },
    );
  },

  steps: [
    {
      title: { en: 'A third arrow', ru: 'Третья стрелка' },
      text: {
        en: 'On the plane two arrows were enough, $\\green{\\hat\\imath}$ and $\\red{\\hat\\jmath}$. Space has a third direction, up, and a third arrow for it: $\\blue{\\hat k}$. Any arrow is a walk along the three: $\\yellow{\\vec v} = (2;\\ 1;\\ 2)$ means two steps along $\\green{\\hat\\imath}$, one along $\\red{\\hat\\jmath}$ and two up along $\\blue{\\hat k}$. Three numbers — three coordinates.',
        ru: 'На плоскости хватало двух стрелок, $\\green{\\hat\\imath}$ и $\\red{\\hat\\jmath}$. В пространстве есть третье направление — вверх — и третья стрелка для него: $\\blue{\\hat k}$. Любая стрелка — прогулка вдоль этих трёх: $\\yellow{\\vec v} = (2;\\ 1;\\ 2)$ значит два шага вдоль $\\green{\\hat\\imath}$, один вдоль $\\red{\\hat\\jmath}$ и два вверх вдоль $\\blue{\\hat k}$. Три числа — три координаты.',
      },
      try: { en: 'Turn the scene and follow the dashed walk from the origin to the tip of $\\vec v$.', ru: 'Поверните сцену и пройдите по пунктиру от начала координат до конца $\\vec v$.' },
      check: {
        q: { en: 'Which arrow is $3\\hat k - \\hat\\imath$?', ru: 'Какая стрелка — это $3\\hat k - \\hat\\imath$?' },
        options: [{ text: '$(-1;\\ 0;\\ 3)$', ok: true }, { text: '$(3;\\ 0;\\ -1)$' }, { text: '$(-1;\\ 3;\\ 0)$' }],
        explain: {
          en: 'The coordinates are counted along $\\hat\\imath$, $\\hat\\jmath$, $\\hat k$ in this order: $-1$ along $\\hat\\imath$, $0$ along $\\hat\\jmath$, $3$ along $\\hat k$ — one step back and three up.',
          ru: 'Координаты считаются вдоль $\\hat\\imath$, $\\hat\\jmath$, $\\hat k$ именно в этом порядке: $-1$ вдоль $\\hat\\imath$, $0$ вдоль $\\hat\\jmath$, $3$ вдоль $\\hat k$ — шаг назад и три вверх.',
        },
      },
      state: { show: ['basis'], camera: CAMERA, controls: [] },
    },
    {
      title: { en: 'All of space moves', ru: 'Двигается всё пространство' },
      text: {
        en: 'A matrix now moves every point of space. The blue lines are the grid of space, cut into cubes; watch it as $t$ goes from $0$ to $1$. The lines stay <b>straight</b>, <b>parallel</b> and <b>evenly spaced</b>, and the origin stays put — as on the plane. The yellow unit cube becomes a slanted box, a <i>parallelepiped</i>, and every cube of the grid becomes a copy of it.',
        ru: 'Теперь матрица двигает каждую точку пространства. Синие линии — сетка пространства, нарезанного на кубики; смотрите на неё, пока $t$ идёт от $0$ до $1$. Линии остаются <b>прямыми</b>, <b>параллельными</b> и <b>равноотстоящими</b>, а начало координат стоит на месте — как на плоскости. Жёлтый единичный куб становится косым ящиком — <i>параллелепипедом</i>, и каждый кубик сетки становится его копией.',
      },
      try: { en: 'Press ▶ next to $t$ and turn the scene while it plays.', ru: 'Нажмите ▶ возле $t$ и поворачивайте сцену, пока она играет.' },
      check: {
        q: { en: 'A linear move takes the midpoint of a segment to…', ru: 'Линейное движение переносит середину отрезка…' },
        options: [
          { text: { en: 'the midpoint of the new segment', ru: 'в середину нового отрезка' }, ok: true },
          { text: { en: 'anywhere on the new segment', ru: 'куда-то на новый отрезок' } },
          { text: { en: 'it depends on the matrix', ru: 'зависит от матрицы' } },
        ],
        explain: {
          en: 'The grid stays evenly spaced: equal steps stay equal. A point halfway along a segment is still halfway after the move — for any matrix.',
          ru: 'Сетка остаётся равномерной: равные шаги остаются равными. Точка на полпути по отрезку и после движения на полпути — при любой матрице.',
        },
      },
      state: { show: ['move'], params: MOVE, camera: CAMERA, controls: ['t'] },
      enter(scene) {
        scene.setParam('t', 0);
        scene.animateParams({ t: 1 }, 3500);
      },
    },
    {
      title: { en: 'Three columns', ru: 'Три столбца' },
      text: {
        en: 'Everything is decided by where the three arrows land: $\\green{\\hat\\imath\'}$, $\\red{\\hat\\jmath\'}$, $\\blue{\\hat k\'}$. Written side by side as columns, they are the $3 \\times 3$ matrix. A vector $(x;\\ y;\\ z)$ was $x$ steps along $\\hat\\imath$, $y$ along $\\hat\\jmath$, $z$ along $\\hat k$ — after the move it is the same steps along the new arrows: $$M \\begin{pmatrix} x \\\\ y \\\\ z \\end{pmatrix} = x\\,\\green{\\hat\\imath\'} + y\\,\\red{\\hat\\jmath\'} + z\\,\\blue{\\hat k\'}.$$',
        ru: 'Всё решают три стрелки — куда они попали: $\\green{\\hat\\imath\'}$, $\\red{\\hat\\jmath\'}$, $\\blue{\\hat k\'}$. Записанные рядом столбцами, они и есть матрица $3 \\times 3$. Вектор $(x;\\ y;\\ z)$ был $x$ шагов вдоль $\\hat\\imath$, $y$ вдоль $\\hat\\jmath$, $z$ вдоль $\\hat k$ — после движения это те же шаги вдоль новых стрелок: $$M \\begin{pmatrix} x \\\\ y \\\\ z \\end{pmatrix} = x\\,\\green{\\hat\\imath\'} + y\\,\\red{\\hat\\jmath\'} + z\\,\\blue{\\hat k\'}.$$',
      },
      try: { en: 'Replay with $t$: the dashed walk of $\\vec v = (1;\\ 2;\\ 1)$ bends together with the grid.', ru: 'Переиграйте ползунком $t$: пунктирная прогулка $\\vec v = (1;\\ 2;\\ 1)$ гнётся вместе с сеткой.' },
      check: {
        q: { en: '$\\begin{pmatrix} 1 & 2 & 3 \\\\ 4 & 5 & 6 \\\\ 7 & 8 & 9 \\end{pmatrix} \\begin{pmatrix} 0 \\\\ 1 \\\\ 0 \\end{pmatrix} = ?$', ru: '$\\begin{pmatrix} 1 & 2 & 3 \\\\ 4 & 5 & 6 \\\\ 7 & 8 & 9 \\end{pmatrix} \\begin{pmatrix} 0 \\\\ 1 \\\\ 0 \\end{pmatrix} = ?$' },
        options: [{ text: '$\\begin{pmatrix} 4 \\\\ 5 \\\\ 6 \\end{pmatrix}$' }, { text: '$\\begin{pmatrix} 2 \\\\ 5 \\\\ 8 \\end{pmatrix}$', ok: true }, { text: '$\\begin{pmatrix} 1 \\\\ 4 \\\\ 7 \\end{pmatrix}$' }],
        explain: {
          en: '$(0;\\ 1;\\ 0)$ is $\\hat\\jmath$ itself, and $\\hat\\jmath$ goes to the second <b>column</b>. The second row is a common slip.',
          ru: '$(0;\\ 1;\\ 0)$ — это сам $\\hat\\jmath$, а он переходит во второй <b>столбец</b>. Вторая строка — частая ошибка.',
        },
      },
      state: { show: ['moveV'], params: MOVE, camera: CAMERA, controls: ['t'] },
    },
    {
      title: { en: 'Familiar moves', ru: 'Знакомые движения' },
      text: {
        en: 'Each familiar move of space is three columns. A rotation about the $z$ axis turns $\\hat\\imath$ and $\\hat\\jmath$ in the floor and leaves $\\hat k$ alone. A stretch keeps the arrows on the axes. A shear leaves the floor and tilts $\\hat k$ — the cube leans over like a deck of cards. A mirror in the floor turns $\\hat k$ down — and the cube turns inside out (purple).',
        ru: 'Каждое знакомое движение пространства — три столбца. Поворот вокруг оси $z$ поворачивает $\\hat\\imath$ и $\\hat\\jmath$ на полу и не трогает $\\hat k$. Растяжение оставляет стрелки на осях. Сдвиг не трогает пол и наклоняет $\\hat k$ — куб кренится, как колода карт. Отражение в полу разворачивает $\\hat k$ вниз — и куб выворачивается наизнанку (фиолетовый).',
      },
      try: { en: 'Choose a move with $k$, then press ▶ next to $t$.', ru: 'Выберите движение ползунком $k$, потом нажмите ▶ возле $t$.' },
      check: {
        q: { en: 'A rotation about the $x$ axis. Which column stays $(1;\\ 0;\\ 0)$?', ru: 'Поворот вокруг оси $x$. Какой столбец остаётся $(1;\\ 0;\\ 0)$?' },
        options: [{ text: { en: 'the first', ru: 'первый' }, ok: true }, { text: { en: 'the second', ru: 'второй' } }, { text: { en: 'the third', ru: 'третий' } }],
        explain: {
          en: 'The arrow along the axis of rotation does not move. Along $x$ points $\\hat\\imath$, and where $\\hat\\imath$ lands is the first column.',
          ru: 'Стрелка вдоль оси поворота не двигается. Вдоль $x$ смотрит $\\hat\\imath$, а то, куда попал $\\hat\\imath$, — первый столбец.',
        },
      },
      state: { show: ['examples'], params: { k: 0, t: 1 }, camera: CAMERA, controls: ['k', 't'] },
    },
    {
      title: { en: 'When space collapses', ru: 'Когда пространство схлопывается' },
      text: {
        en: 'Here $\\blue{\\hat k\'} = \\green{\\hat\\imath\'} + \\red{\\hat\\jmath\'}$: the third arrow lies in the plane of the other two. Then every walk $x\\hat\\imath\' + y\\hat\\jmath\' + z\\hat k\'$ stays in that plane too — all of space is squashed flat, and the cube becomes a flat parallelogram. Turn the scene to look along the plane: the grid is a single sheet. Such a move cannot be undone.',
        ru: 'Здесь $\\blue{\\hat k\'} = \\green{\\hat\\imath\'} + \\red{\\hat\\jmath\'}$: третья стрелка лежит в плоскости двух других. Тогда и любая прогулка $x\\hat\\imath\' + y\\hat\\jmath\' + z\\hat k\'$ остаётся в этой плоскости — всё пространство сплющено, и куб стал плоским параллелограммом. Поверните сцену, чтобы смотреть вдоль плоскости: сетка — один лист. Такое движение нельзя отменить.',
      },
      try: { en: 'Press ▶ next to $t$ and watch the cube fold into a sheet.', ru: 'Нажмите ▶ возле $t$ и смотрите, как куб складывается в лист.' },
      check: {
        q: { en: 'And if all three columns are on one line?', ru: 'А если все три столбца лежат на одной прямой?' },
        options: [{ text: { en: 'space falls onto that line', ru: 'пространство ложится на эту прямую' }, ok: true }, { text: { en: 'onto a plane', ru: 'на плоскость' } }, { text: { en: 'into the origin', ru: 'в начало координат' } }],
        explain: {
          en: 'Steps along arrows of one line never leave it: the whole space is squashed into a line. Into the origin only if all three columns are zero.',
          ru: 'Шаги вдоль стрелок одной прямой с неё не уводят: всё пространство сплющено в прямую. В начало координат — только если все три столбца нулевые.',
        },
      },
      state: { show: ['move'], params: { ax: 1, ay: 0, az: 0.5, bx: 0, by: 1, bz: 0.5, cx: 1, cy: 1, cz: 1, t: 1 }, camera: [8, -6.5, 2.8], controls: ['t'] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'Go through the familiar moves again and predict each matrix before you look at the legend. Then think: a mirror turned the cube inside out, a collapse made it flat. On the plane a single number, the determinant, said both how areas change and whether the plane turns over. In space it will be a number for <b>volumes</b> — the next topic.',
        ru: 'Пройдите знакомые движения ещё раз и угадайте матрицу каждого, прежде чем смотреть в подпись. И подумайте: отражение вывернуло куб, схлопывание сделало его плоским. На плоскости одно число — определитель — говорило и во сколько раз меняются площади, и перевернулась ли плоскость. В пространстве это будет число для <b>объёмов</b> — следующая тема.',
      },
      state: { show: ['examples'], params: { k: 2, t: 1 }, camera: CAMERA, controls: ['k', 't'] },
    },
    {
      title: { en: 'Where does v land?', ru: 'Куда переедет v?' },
      text: {
        en: 'The matrix $M$ is fixed, $\\vec v = (1;\\ 1;\\ 1)$ is the faint arrow. Move the yellow point $Q$ with the sliders to where $M$ takes $\\vec v$.',
        ru: 'Матрица $M$ задана, $\\vec v = (1;\\ 1;\\ 1)$ — бледная стрелка. Поставьте жёлтую точку $Q$ ползунками туда, куда $M$ переносит $\\vec v$.',
      },
      task: {
        kind: 'drag',
        target: { Q_x: 2, Q_y: 1, Q_z: 3 },
        back: 2,
        right: {
          en: '$\\vec v = \\hat\\imath + \\hat\\jmath + \\hat k$, so $M\\vec v$ is the sum of the three columns: $(1;\\ 0;\\ 1) + (1;\\ 1;\\ 0) + (0;\\ 0;\\ 2) = (2;\\ 1;\\ 3)$.',
          ru: '$\\vec v = \\hat\\imath + \\hat\\jmath + \\hat k$, значит, $M\\vec v$ — сумма трёх столбцов: $(1;\\ 0;\\ 1) + (1;\\ 1;\\ 0) + (0;\\ 0;\\ 2) = (2;\\ 1;\\ 3)$.',
        },
        mistakes: [
          { params: { Q_x: 2, Q_y: 2, Q_z: 2 }, text: {
            en: 'These are the sums of the <b>rows</b>. The arrows that $\\vec v$ walks along are the columns: add up the columns.',
            ru: 'Это суммы <b>строк</b>. Стрелки, вдоль которых шагает $\\vec v$, — столбцы: сложите столбцы.' } },
          { params: { Q_x: 1, Q_y: 1, Q_z: 1 }, text: {
            en: 'This is $\\vec v$ itself, before the move. The matrix moves it: one step along each of the new arrows.',
            ru: 'Это сам $\\vec v$, до движения. Матрица его переносит: по шагу вдоль каждой из новых стрелок.' } },
        ],
        hints: {
          Q_x: { en: '$M\\vec v = 1\\cdot\\green{\\hat\\imath\'} + 1\\cdot\\red{\\hat\\jmath\'} + 1\\cdot\\blue{\\hat k\'}$: add the three columns coordinate by coordinate.', ru: '$M\\vec v = 1\\cdot\\green{\\hat\\imath\'} + 1\\cdot\\red{\\hat\\jmath\'} + 1\\cdot\\blue{\\hat k\'}$: сложите три столбца покоординатно.' },
          Q_y: { en: '$M\\vec v = 1\\cdot\\green{\\hat\\imath\'} + 1\\cdot\\red{\\hat\\jmath\'} + 1\\cdot\\blue{\\hat k\'}$: add the three columns coordinate by coordinate.', ru: '$M\\vec v = 1\\cdot\\green{\\hat\\imath\'} + 1\\cdot\\red{\\hat\\jmath\'} + 1\\cdot\\blue{\\hat k\'}$: сложите три столбца покоординатно.' },
          Q_z: { en: '$M\\vec v = 1\\cdot\\green{\\hat\\imath\'} + 1\\cdot\\red{\\hat\\jmath\'} + 1\\cdot\\blue{\\hat k\'}$: add the three columns coordinate by coordinate.', ru: '$M\\vec v = 1\\cdot\\green{\\hat\\imath\'} + 1\\cdot\\red{\\hat\\jmath\'} + 1\\cdot\\blue{\\hat k\'}$: сложите три столбца покоординатно.' },
        },
      },
      state: { show: ['whereV'], params: { Q_x: 0, Q_y: 0, Q_z: 0 }, camera: CAMERA, controls: ['Q_x', 'Q_y', 'Q_z'] },
    },
    {
      title: { en: 'Build a shear', ru: 'Соберите сдвиг' },
      text: {
        en: '$\\green{\\hat\\imath\'}$ and $\\red{\\hat\\jmath\'}$ stay where they were. Set $\\blue{\\hat k\'}$ with the sliders so that the floor does not move and the top of the cube slides by $1$ in the direction of $x$, keeping its height.',
        ru: '$\\green{\\hat\\imath\'}$ и $\\red{\\hat\\jmath\'}$ остаются на месте. Поставьте ползунками $\\blue{\\hat k\'}$ так, чтобы пол не двигался, а верх куба съехал на $1$ в сторону $x$, сохранив высоту.',
      },
      task: {
        kind: 'drag',
        target: { k_x: 1, k_y: 0, k_z: 1 },
        back: 3,
        right: {
          en: 'The top of the cube is where $\\hat k$ points. Slid by $1$ along $x$ at the same height: $\\hat k\' = (1;\\ 0;\\ 1)$. The cube leans like a pushed deck of cards.',
          ru: 'Верх куба — там, куда смотрит $\\hat k$. Сдвинутый на $1$ вдоль $x$ на той же высоте: $\\hat k\' = (1;\\ 0;\\ 1)$. Куб кренится, как колода, которую толкнули.',
        },
        mistakes: [
          { params: { k_x: 1, k_y: 0, k_z: 0 }, text: {
            en: 'The top did move along $x$ — but lost its height: $\\hat k\'$ lies on the floor, on top of $\\hat\\imath\'$, and the cube is flat. The height must stay $1$.',
            ru: 'Верх съехал вдоль $x$ — но потерял высоту: $\\hat k\'$ лёг на пол, поверх $\\hat\\imath\'$, и куб стал плоским. Высота должна остаться $1$.' } },
          { params: { k_x: 0, k_y: 1, k_z: 1 }, text: {
            en: 'This shear slides the top along $y$. The task wants $x$ — the direction of $\\green{\\hat\\imath\'}$.',
            ru: 'Этот сдвиг двигает верх вдоль $y$. А нужно вдоль $x$ — в сторону $\\green{\\hat\\imath\'}$.' } },
        ],
        hints: {
          k_x: x => (x < 1
            ? { en: 'The top must slide by $1$ in the direction of $x$: the first coordinate of $\\hat k\'$.', ru: 'Верх должен съехать на $1$ в сторону $x$ — это первая координата $\\hat k\'$.' }
            : { en: 'Too far along $x$: by $1$.', ru: 'Слишком далеко по $x$: нужно на $1$.' }),
          k_y: { en: 'Along $y$ the top does not move.', ru: 'Вдоль $y$ верх не двигается.' },
          k_z: { en: 'The height stays the same — the height of the cube.', ru: 'Высота остаётся прежней — высотой куба.' },
        },
      },
      state: { show: ['shear'], params: { k_x: 0, k_y: 0, k_z: 1 }, camera: CAMERA, controls: ['k_x', 'k_y', 'k_z'] },
    },
    {
      title: { en: 'Squash space', ru: 'Сплющите пространство' },
      text: {
        en: '$\\green{\\hat\\imath\'} = (1;\\ 0;\\ 0)$ and $\\red{\\hat\\jmath\'} = (0;\\ 1;\\ 1)$ are fixed. Drag the end of $\\blue{\\hat k\'}$ up and down its grey rail so that all of space collapses into a plane.',
        ru: '$\\green{\\hat\\imath\'} = (1;\\ 0;\\ 0)$ и $\\red{\\hat\\jmath\'} = (0;\\ 1;\\ 1)$ закреплены. Тяните конец $\\blue{\\hat k\'}$ вверх и вниз по серой направляющей так, чтобы всё пространство схлопнулось в плоскость.',
      },
      task: {
        kind: 'drag',
        target: { u: 0.75 },
        tol: 0.03,
        back: 4,
        right: {
          en: '$\\hat k\' = (0;\\ 2;\\ 2) = 2\\,\\hat\\jmath\'$ lies in the plane of $\\hat\\imath\'$ and $\\hat\\jmath\'$ — a plane that leans up, not the floor. The cube folded flat into it.',
          ru: '$\\hat k\' = (0;\\ 2;\\ 2) = 2\\,\\hat\\jmath\'$ лежит в плоскости $\\hat\\imath\'$ и $\\hat\\jmath\'$ — наклонной, а не в полу. Куб сложился в неё плоско.',
        },
        mistakes: [
          { params: { u: 0.25 }, text: {
            en: '$\\hat k\'$ is on the floor now — but the floor is not the plane of $\\hat\\imath\'$ and $\\hat\\jmath\'$: $\\red{\\hat\\jmath\'}$ goes up. Turn the scene: the box is still a box.',
            ru: '$\\hat k\'$ сейчас на полу — но пол не плоскость $\\hat\\imath\'$ и $\\hat\\jmath\'$: $\\red{\\hat\\jmath\'}$ поднимается вверх. Поверните сцену: ящик всё ещё объёмный.' } },
        ],
        hints: {
          u: u => (u < 0.75
            ? { en: 'The box is not flat yet: $\\hat k\'$ is below the plane of $\\hat\\imath\'$ and $\\hat\\jmath\'$. Look along $\\hat\\imath\'$ to see that plane as a line.', ru: 'Ящик ещё не плоский: $\\hat k\'$ ниже плоскости $\\hat\\imath\'$ и $\\hat\\jmath\'$. Посмотрите вдоль $\\hat\\imath\'$ — эта плоскость станет прямой.' }
            : { en: 'Too high: $\\hat k\'$ went above the plane of $\\hat\\imath\'$ and $\\hat\\jmath\'$.', ru: 'Слишком высоко: $\\hat k\'$ ушёл выше плоскости $\\hat\\imath\'$ и $\\hat\\jmath\'$.' }),
        },
      },
      state: { show: ['flatten'], params: { u: 0.1 }, camera: [9, -5, 3.5], controls: [] },
    },
  ],
};
