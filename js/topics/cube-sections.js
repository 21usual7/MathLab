// Sections of a cube. A plane through three points cuts the cube along a polygon. The two rules that build
// any section (points on one face are joined; parallel faces are cut along parallel lines), the family of
// sections perpendicular to a diagonal (triangle → hexagon → triangle) and the diagonal section.

import { COLORS } from '../core/palette.js';
import { cube, plane3, section, lerp, norm, dist, avg, sub, cross, add, mul, POLYGON } from '../core/geom.js';
import { t } from '../core/i18n.js';

const CUBE = cube(3);
const V = CUBE.V;
const EDGE = '#c9d1dc';
const SEC = COLORS.yellow;
const CAMERA = [6.5, -8.5, 5.5];

const kind = n => t(POLYGON)[n] || '';

// A faint square of the plane around the section, so the plane is seen, not only the cut
function patch(pts, half = 3.4) {
  if (pts.length < 3) return [];
  const c = avg(pts), n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
  const u = norm(sub(pts[0], c)), w = cross(n, u);
  return [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) => add(c, add(mul(u, a * half), mul(w, b * half))));
}

// Three points sliding along three edges (parameters p, q, r from 0 to 1) and the section through them
function threePoints(id, edges, labels = ['P', 'Q', 'R']) {
  const points = s => edges.map(([a, b], i) => lerp(V[a], V[b], [s.p, s.q, s.r][i]));
  return {
    id,
    draw3d(p, sc, s) {
      const pts = points(s), sec = section(CUBE, plane3(...pts));
      p.polygon(`${id}:plane`, patch(sec), SEC, { opacity: 0.06, outline: false });
      p.polygon(`${id}:sec`, sec, SEC, { opacity: 0.32, poly: CUBE });
      pts.forEach((q, i) => p.point(`${id}:${i}`, q, COLORS.red, labels[i]));
    },
    legend: s => {
      const n = section(CUBE, plane3(...points(s))).length;
      return n ? `\\yellow{\\text{${kind(n)}}}\\ (${n})` : '';
    },
  };
}

// The plane x + y + z = s: perpendicular to the diagonal AC₁
const across = s => section(CUBE, { n: norm([1, 1, 1]), d: s / Math.sqrt(3) });

export default {
  view: '3d',
  view3d: { R: 4, zmax: 4, camera: CAMERA, axes: false },
  lab: false, // the Lab has no solids yet

  setup(scene) {
    scene.ensureParam('p', 0.5, { min: 0, max: 1 });
    scene.ensureParam('q', 0.5, { min: 0, max: 1 });
    scene.ensureParam('r', 0.5, { min: 0, max: 1 });
    scene.ensureParam('s', 2.5, { min: -4.4, max: 4.4 });
    scene.ensureParam('k', 0, { min: 0, max: 3 });
    scene.ensureParam('u', 0.2, { min: 0, max: 1 }); // N on CC₁ in the first task
    scene.ensureParam('m', 0.3, { min: 0, max: 1 }); // M on AA₁ in the second task

    const M = lerp(V.A, V.A1, 0.5), N = lerp(V.C, V.C1, 0.5);

    scene.custom.push(
      { id: 'cube', draw3d(p) { p.polyhedron('cube', CUBE, EDGE); } },
      threePoints('corner', [['A', 'A1'], ['A', 'B'], ['A', 'D']]),
      {
        // Building the section through B, D₁ and the midpoint M of AA₁ step by step (k = 0 … 3)
        id: 'build',
        draw3d(p, sc, s) {
          const k = s.k;
          p.point('build:B', V.B, COLORS.red);
          p.point('build:D1', V.D1, COLORS.red);
          p.point('build:M', M, COLORS.red, 'M');
          if (k >= 0.6) {
            p.segment('build:MB', M, V.B, COLORS.green, { poly: CUBE, radius: 0.036 });
            p.segment('build:MD1', M, V.D1, COLORS.green, { poly: CUBE, radius: 0.036 });
          }
          if (k >= 1.6) {
            p.segment('build:BN', V.B, N, COLORS.teal, { poly: CUBE, radius: 0.036 });
            p.point('build:N', N, COLORS.teal, 'N');
          }
          if (k >= 2.6) {
            p.segment('build:ND1', N, V.D1, COLORS.teal, { poly: CUBE, radius: 0.036 });
            p.polygon('build:sec', [V.B, N, V.D1, M], SEC, { opacity: 0.3, outline: false });
          }
        },
        legend: s => (s.k < 1.6
          ? t({ en: '\\text{Rule 1: points on one face are joined: } \\green{MB,\\ MD_1}', ru: '\\text{Правило 1: точки одной грани соединяем: } \\green{MB,\\ MD_1}' })
          : s.k < 2.6
            ? t({ en: '\\text{Rule 2: parallel faces, parallel cuts: } \\teal{BN \\parallel MD_1}', ru: '\\text{Правило 2: параллельные грани — параллельные разрезы: } \\teal{BN \\parallel MD_1}' })
            : t({ en: '\\text{Section } \\yellow{BND_1M}', ru: '\\text{Сечение } \\yellow{BND_1M}' })),
      },
      {
        id: 'across',
        draw3d(p, sc, s) {
          const sec = across(s.s);
          p.segment('across:diag', V.A, V.C1, COLORS.purple, { poly: CUBE, radius: 0.02 });
          p.polygon('across:plane', patch(sec, 2.8), SEC, { opacity: 0.05, outline: false });
          p.polygon('across:sec', sec, SEC, { opacity: 0.32, poly: CUBE });
        },
        legend: s => {
          const n = across(s.s).length;
          return `\\purple{AC_1} \\perp \\text{${t({ en: 'plane', ru: 'плоскость' })}}:\\ \\ ${n ? `\\yellow{\\text{${kind(n)}}}` : '\\text{—}'}`;
        },
      },
      {
        // Opposite sides of the middle hexagon in matching colours: they are parallel
        id: 'pairs',
        draw3d(p) {
          const h = across(0), colors = [COLORS.red, COLORS.green, COLORS.blue];
          h.forEach((a, i) => p.segment(`pairs:${i}`, a, h[(i + 1) % 6], colors[i % 3], { poly: CUBE, radius: 0.05 }));
        },
        legend: () => `\\text{${t({ en: 'opposite sides are parallel', ru: 'противоположные стороны параллельны' })}}`,
      },
      {
        id: 'diagonal',
        draw3d(p) {
          const sec = section(CUBE, plane3(V.A, V.C, V.C1));
          p.polygon('diagonal:sec', sec, SEC, { opacity: 0.32, poly: CUBE });
          p.segment('diagonal:AC', V.A, V.C, COLORS.green, { poly: CUBE, radius: 0.05 });
          p.segment('diagonal:CC1', V.C, V.C1, COLORS.red, { poly: CUBE, radius: 0.05 });
        },
        legend: () => `\\green{AC = 3\\sqrt{2} \\approx ${dist(V.A, V.C).toFixed(2)}},\\quad \\red{CC_1 = 3}`,
      },
      threePoints('free', [['A', 'A1'], ['B', 'C'], ['C1', 'D1']]),
      {
        // Task: the plane through M (AM = ⅓ AA₁), B and D₁; the student puts N on CC₁
        id: 'findN',
        draw3d(p, sc, s) {
          const M1 = lerp(V.A, V.A1, 1 / 3), N1 = lerp(V.C, V.C1, s.u);
          p.point('findN:B', V.B, COLORS.red);
          p.point('findN:D1', V.D1, COLORS.red);
          p.point('findN:M', M1, COLORS.red, 'M');
          p.segment('findN:MB', M1, V.B, COLORS.green, { poly: CUBE, radius: 0.036 });
          p.segment('findN:MD1', M1, V.D1, COLORS.green, { poly: CUBE, radius: 0.036 });
          p.segment('findN:BN', V.B, N1, COLORS.teal, { poly: CUBE, radius: 0.03 });
          p.segment('findN:ND1', N1, V.D1, COLORS.teal, { poly: CUBE, radius: 0.03 });
          p.handle('findN:N', V.C, V.C1, s.u, '#ffffff', u => sc.setParam('u', u), 'N');
        },
      },
      {
        // Task: M slides along AA₁, the section through M, B and D₁ follows it
        id: 'slideM',
        draw3d(p, sc, s) {
          const M1 = lerp(V.A, V.A1, s.m);
          p.polygon('slideM:sec', section(CUBE, plane3(M1, V.B, V.D1)), SEC, { opacity: 0.32, poly: CUBE });
          p.point('slideM:B', V.B, COLORS.red);
          p.point('slideM:D1', V.D1, COLORS.red);
          p.handle('slideM:M', V.A, V.A1, s.m, '#ffffff', m => sc.setParam('m', m), 'M');
        },
      },
      {
        // Task: the plane perpendicular to AC₁ is moved by its point on the diagonal (x + y + z = s)
        id: 'acrossT',
        draw3d(p, sc, s) {
          const sec = across(s.s);
          p.segment('acrossT:diag', V.A, V.C1, COLORS.purple, { poly: CUBE, radius: 0.02 });
          p.polygon('acrossT:plane', patch(sec, 2.8), SEC, { opacity: 0.05, outline: false });
          p.polygon('acrossT:sec', sec, SEC, { opacity: 0.32, poly: CUBE });
          p.handle('acrossT:O', V.A, V.C1, (s.s + 4.5) / 9, '#ffffff', t => sc.setParam('s', -4.5 + 9 * t));
        },
      },
    );
  },

  steps: [
    {
      title: { en: 'A cube and its names', ru: 'Куб и его имена' },
      text: {
        en: 'A cube $ABCDA_1B_1C_1D_1$: the bottom face is $ABCD$, and above each bottom vertex is the one with the same letter and index $1$. The edges you cannot see — behind the cube — are drawn dashed, as in a textbook. Turn the cube: the dashed edges change, because what is hidden depends on where you look from.',
        ru: 'Куб $ABCDA_1B_1C_1D_1$: нижняя грань — $ABCD$, а над каждой нижней вершиной стоит вершина с той же буквой и индексом $1$. Рёбра, которых не видно — за кубом, — нарисованы пунктиром, как в учебнике. Поверните куб: пунктирные рёбра меняются, потому что невидимое зависит от того, откуда смотреть.',
      },
      try: { en: 'Drag to turn the cube; find the position where $AA_1$ is hidden.', ru: 'Тяните, чтобы повернуть куб; найдите положение, где $AA_1$ скрыто.' },
      hint: {
        title: { en: 'Why draw hidden edges at all?', ru: 'Зачем вообще рисовать невидимые рёбра?' },
        text: {
          en: 'A flat drawing of a cube is ambiguous: the same picture can be read as a cube seen from above or from below. Dashed hidden edges remove the doubt — and in problems, points and lines often sit exactly on those hidden edges.',
          ru: 'Плоский рисунок куба двусмыслен: одну и ту же картинку можно прочитать как куб, видный сверху, или как куб, видный снизу. Пунктир снимает сомнение — а в задачах точки и прямые часто стоят как раз на невидимых рёбрах.',
        },
      },
      state: { show: ['cube'], camera: CAMERA, rotate: true, controls: [] },
    },
    {
      title: { en: 'A plane through three points', ru: 'Плоскость через три точки' },
      text: {
        en: 'Through any three points that are not on one line there is exactly one plane. Put $P$, $Q$, $R$ on the three edges from $A$. Their plane cuts the cube, and the cut — the <span class="c-yellow">section</span> — is a polygon. Here it is a triangle cutting off the corner $A$.',
        ru: 'Через любые три точки, не лежащие на одной прямой, проходит ровно одна плоскость. Поставим $P$, $Q$, $R$ на три ребра, выходящих из $A$. Их плоскость режет куб, и разрез — <span class="c-yellow">сечение</span> — это многоугольник. Здесь — треугольник, отрезающий угол $A$.',
      },
      try: { en: 'Move $p$, $q$, $r$: each point slides along its edge.', ru: 'Двигайте $p$, $q$, $r$: каждая точка едет по своему ребру.' },
      check: {
        q: { en: 'What triangle is it when $AP = AQ = AR$?', ru: 'Какой получится треугольник, если $AP = AQ = AR$?' },
        options: [
          { text: { en: 'equilateral', ru: 'равносторонний' }, ok: true },
          { text: { en: 'right-angled', ru: 'прямоугольный' } },
          { text: { en: 'it depends', ru: 'смотря какой' } },
        ],
        explain: {
          en: 'Each side, say $PQ$, is the hypotenuse of a right triangle $APQ$ with two equal legs. All three such triangles are equal, so all three sides are equal.',
          ru: 'Каждая сторона, например $PQ$, — гипотенуза прямоугольного треугольника $APQ$ с равными катетами. Все три таких треугольника равны, значит, равны и все три стороны.',
        },
        reveal: scene => scene.animateParams({ p: 0.6, q: 0.6, r: 0.6 }, 1500),
      },
      state: { show: ['cube', 'corner'], params: { p: 0.7, q: 0.4, r: 0.55 }, camera: CAMERA, controls: ['p', 'q', 'r'] },
    },
    {
      title: { en: 'Building by two rules', ru: 'Строим по двум правилам' },
      text: {
        en: 'How to draw a section by hand? Each side of it lies on a face of the cube. Take the plane through $B$, $D_1$ and the midpoint $M$ of $AA_1$. <b>Rule 1:</b> two points on one face are joined — $M$ and $B$ share a face, $M$ and $D_1$ too. <b>Rule 2:</b> parallel faces are cut along parallel lines — so in the face opposite to $ADD_1A_1$ draw through $B$ a line parallel to $MD_1$. It meets $CC_1$ at $N$. Join $N$ and $D_1$ — done.',
        ru: 'Как построить сечение от руки? Каждая его сторона лежит на грани куба. Возьмём плоскость через $B$, $D_1$ и середину $M$ ребра $AA_1$. <b>Правило 1:</b> две точки одной грани соединяем — у $M$ и $B$ общая грань, у $M$ и $D_1$ тоже. <b>Правило 2:</b> параллельные грани режутся по параллельным прямым — поэтому в грани, противоположной $ADD_1A_1$, проводим через $B$ прямую, параллельную $MD_1$. Она встречает $CC_1$ в точке $N$. Соединяем $N$ и $D_1$ — готово.',
      },
      try: { en: 'Press ▶ next to $k$ to replay the construction.', ru: 'Нажмите ▶ возле $k$, чтобы повторить построение.' },
      check: {
        q: { en: 'What is the quadrilateral $BND_1M$?', ru: 'Что за четырёхугольник $BND_1M$?' },
        options: [{ text: { en: 'a square', ru: 'квадрат' } }, { text: { en: 'a rhombus', ru: 'ромб' }, ok: true }, { text: { en: 'a rectangle', ru: 'прямоугольник' } }],
        explain: {
          en: 'All four sides are equal: each is the hypotenuse of a right triangle with legs $3$ and $1.5$. But the diagonals differ: $BD_1$ is a diagonal of the cube ($3\\sqrt3$), $MN$ of a face ($3\\sqrt2$). Equal sides, unequal diagonals — a rhombus, not a square.',
          ru: 'Все четыре стороны равны: каждая — гипотенуза прямоугольного треугольника с катетами $3$ и $1.5$. А диагонали разные: $BD_1$ — диагональ куба ($3\\sqrt3$), $MN$ — диагональ грани ($3\\sqrt2$). Стороны равны, диагонали нет — ромб, но не квадрат.',
        },
      },
      state: { show: ['cube', 'build'], camera: [7.5, -6, 4.5], controls: ['k'] },
      enter(scene) {
        scene.setParam('k', 0);
        scene.animateParams({ k: 3 }, 5000);
      },
    },
    {
      title: { en: 'From a triangle to a hexagon', ru: 'От треугольника к шестиугольнику' },
      text: {
        en: 'Now move a plane perpendicular to the diagonal $\\purple{AC_1}$, from the corner $C_1$ to the corner $A$. First it cuts off a small triangle. Past the vertices $B_1$, $D_1$, $C$ the triangle turns into a hexagon — exactly regular in the middle — and then back into a triangle.',
        ru: 'Теперь будем двигать плоскость, перпендикулярную диагонали $\\purple{AC_1}$, от угла $C_1$ к углу $A$. Сначала она отрезает маленький треугольник. Пройдя вершины $B_1$, $D_1$, $C$, треугольник превращается в шестиугольник — посередине правильный, — а потом снова в треугольник.',
      },
      try: { en: 'Press ▶ next to $s$.', ru: 'Нажмите ▶ возле $s$.' },
      check: {
        q: { en: 'Can a section of a cube be a heptagon (7 sides)?', ru: 'Может ли сечение куба быть семиугольником?' },
        options: [{ text: { en: 'yes', ru: 'да' } }, { text: { en: 'no', ru: 'нет' }, ok: true }],
        explain: {
          en: 'Every side of a section lies on a face, and a plane cuts each face at most once. A cube has $6$ faces, so a section has at most $6$ sides.',
          ru: 'Каждая сторона сечения лежит на грани, и плоскость пересекает каждую грань не больше одного раза. У куба $6$ граней, значит, у сечения не больше $6$ сторон.',
        },
      },
      state: { show: ['cube', 'across'], params: { s: 3 }, play: ['s'], camera: [8, 3.2, 6.2], controls: ['s'] },
    },
    {
      title: { en: 'Parallel sides', ru: 'Параллельные стороны' },
      text: {
        en: 'Look at the middle hexagon. Its opposite sides lie on opposite faces of the cube — and parallel faces are cut along parallel lines (rule 2). So the hexagon\'s opposite sides are parallel: the pairs share a colour. All six sides are equal too: each is half a diagonal of a face.',
        ru: 'Посмотрите на средний шестиугольник. Его противоположные стороны лежат на противоположных гранях куба — а параллельные грани режутся по параллельным прямым (правило 2). Поэтому противоположные стороны шестиугольника параллельны: пары окрашены одинаково. И все шесть сторон равны: каждая — половина диагонали грани.',
      },
      state: { show: ['cube', 'across', 'pairs'], params: { s: 0 }, camera: [8, 3.2, 6.2], controls: [] },
    },
    {
      title: { en: 'The diagonal section', ru: 'Диагональное сечение' },
      text: {
        en: 'The plane through $A$, $C$ and $C_1$ contains two opposite edges, $AA_1$ and $CC_1$. It cuts the cube along a rectangle $ACC_1A_1$ through the cube\'s middle — the diagonal section.',
        ru: 'Плоскость через $A$, $C$ и $C_1$ содержит два противоположных ребра, $AA_1$ и $CC_1$. Она режет куб по прямоугольнику $ACC_1A_1$, проходящему через середину куба, — это диагональное сечение.',
      },
      check: {
        q: { en: 'Is $ACC_1A_1$ a square?', ru: 'Является ли $ACC_1A_1$ квадратом?' },
        options: [{ text: { en: 'yes', ru: 'да' } }, { text: { en: 'no', ru: 'нет' }, ok: true }],
        explain: {
          en: '$CC_1$ is an edge, $3$. $AC$ is a diagonal of the bottom face: by Pythagoras $\\sqrt{3^2 + 3^2} = 3\\sqrt2 \\approx 4.24$. A rectangle $4.24 \\times 3$ — longer than it is high.',
          ru: '$CC_1$ — ребро, $3$. $AC$ — диагональ нижней грани: по теореме Пифагора $\\sqrt{3^2 + 3^2} = 3\\sqrt2 \\approx 4.24$. Прямоугольник $4.24 \\times 3$ — длиннее, чем выше.',
        },
      },
      state: { show: ['cube', 'diagonal'], camera: [8, -5, 4], controls: [] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'Three points on three edges that do not meet: $P$ on $AA_1$, $Q$ on $BC$, $R$ on $C_1D_1$. Move them and find a triangle, a quadrilateral, a pentagon and a hexagon. For each, check the two rules: which sides lie on parallel faces, and are they parallel?',
        ru: 'Три точки на трёх рёбрах, которые не пересекаются: $P$ на $AA_1$, $Q$ на $BC$, $R$ на $C_1D_1$. Двигайте их и найдите треугольник, четырёхугольник, пятиугольник и шестиугольник. Для каждого проверьте правила: какие стороны лежат на параллельных гранях — и параллельны ли они?',
      },
      state: { show: ['cube', 'free'], params: { p: 0.5, q: 0.5, r: 0.5 }, camera: CAMERA, controls: ['p', 'q', 'r'] },
    },
    {
      title: { en: 'Where is N?', ru: 'Где точка N?' },
      text: {
        en: 'The plane goes through $B$, $D_1$ and the point $M$ on $AA_1$ with $AM = \\frac13 AA_1$. Rule 1 already gave the sides $\\green{MB}$ and $\\green{MD_1}$. The plane also cuts the edge $CC_1$ — drag $N$ along it to the right place. Turn the cube to see better.',
        ru: 'Плоскость проходит через $B$, $D_1$ и точку $M$ на $AA_1$, где $AM = \\frac13 AA_1$. Правило 1 уже дало стороны $\\green{MB}$ и $\\green{MD_1}$. Плоскость пересекает и ребро $CC_1$ — перетащите $N$ по нему в нужное место. Поверните куб, чтобы лучше видеть.',
      },
      task: {
        kind: 'drag',
        target: { u: 2 / 3 },
        tol: 0.05,
        back: 2,
        right: {
          en: 'Rule 2: the faces $ADD_1A_1$ and $BCC_1B_1$ are parallel, so $BN \\parallel MD_1$. From $M$ to $D_1$ the height grows by $\\frac23$ of an edge — so from $B$ to $N$ as well: $CN = \\frac23 CC_1$. Note $AM + CN = $ one edge.',
          ru: 'Правило 2: грани $ADD_1A_1$ и $BCC_1B_1$ параллельны, значит $BN \\parallel MD_1$. От $M$ до $D_1$ высота растёт на $\\frac23$ ребра — значит, и от $B$ до $N$ тоже: $CN = \\frac23 CC_1$. Заметьте: $AM + CN$ — ровно одно ребро.',
        },
        mistakes: [
          { params: { u: 1 / 3 }, text: {
            en: '$N$ at the same height as $M$ looks natural, but then $BN$ is not parallel to $MD_1$: $BN$ rises by $\\frac13$, $MD_1$ by $\\frac23$ of an edge. Parallel faces are cut along parallel lines.',
            ru: '$N$ на одной высоте с $M$ — кажется естественным, но тогда $BN$ не параллельна $MD_1$: $BN$ поднимается на $\\frac13$ ребра, а $MD_1$ — на $\\frac23$. Параллельные грани режутся по параллельным прямым.' } },
          { params: { u: 1 }, text: {
            en: 'At $C_1$ the line $BC_1$ is a diagonal of the face — it rises by a whole edge, and $MD_1$ only by $\\frac23$. They are not parallel.',
            ru: 'В $C_1$ прямая $BC_1$ — диагональ грани: она поднимается на целое ребро, а $MD_1$ — только на $\\frac23$. Они не параллельны.' } },
        ],
        hints: {
          u: u => ({
            en: `Rule 2: $BN$ must be parallel to $MD_1$. $MD_1$ rises by $\\frac23$ of an edge, and your $BN$ rises ${u < 2 / 3 ? 'less' : 'more'}.`,
            ru: `Правило 2: $BN$ должна быть параллельна $MD_1$. $MD_1$ поднимается на $\\frac23$ ребра, а ваша $BN$ — ${u < 2 / 3 ? 'меньше' : 'больше'}.`,
          }),
        },
      },
      state: { show: ['cube', 'findN'], params: { u: 0.15 }, camera: [7.5, -6, 4.5], controls: [] },
    },
    {
      title: { en: 'Make a rectangle', ru: 'Получите прямоугольник' },
      text: {
        en: 'The plane goes through $B$, $D_1$ and a point $M$ on the edge $AA_1$. Drag $M$ so that the section becomes a rectangle.',
        ru: 'Плоскость проходит через $B$, $D_1$ и точку $M$ на ребре $AA_1$. Перетащите $M$ так, чтобы сечение стало прямоугольником.',
      },
      task: {
        kind: 'drag',
        target: [{ m: 0 }, { m: 1 }],
        tol: 0.04,
        back: 5,
        right: {
          en: 'With $M = A$ the plane contains the edge $AB$ and the section is $ABC_1D_1$; with $M = A_1$ it is $A_1BCD_1$. In both the sides are an edge and a face diagonal, and the edge is perpendicular to the face — the angles are right.',
          ru: 'При $M = A$ плоскость содержит ребро $AB$, и сечение — $ABC_1D_1$; при $M = A_1$ — $A_1BCD_1$. В обоих стороны — ребро и диагональ грани, а ребро перпендикулярно грани: углы прямые.',
        },
        mistakes: [
          { params: { m: 0.5 }, text: {
            en: 'In the middle all four sides are equal — it is the rhombus from step 3, but its angles are not right: the diagonals $BD_1$ and $MN$ are different.',
            ru: 'Посередине все четыре стороны равны — это ромб из шага 3, но углы у него не прямые: диагонали $BD_1$ и $MN$ разные.' } },
        ],
        hints: {
          m: { en: 'Now the section is a parallelogram with slanted angles. A right angle appears when a side of the section is an edge of the cube: try the ends of $AA_1$.', ru: 'Сейчас сечение — параллелограмм с косыми углами. Прямой угол появится, когда сторона сечения — ребро куба: попробуйте концы $AA_1$.' },
        },
      },
      state: { show: ['cube', 'slideM'], params: { m: 0.3 }, camera: [7.5, -6, 4.5], controls: [] },
    },
    {
      title: { en: 'A regular hexagon', ru: 'Правильный шестиугольник' },
      text: {
        en: 'The plane is perpendicular to the diagonal $\\purple{AC_1}$. Drag its point along the diagonal so that the section becomes a <b>regular</b> hexagon — all sides equal.',
        ru: 'Плоскость перпендикулярна диагонали $\\purple{AC_1}$. Тяните её точку вдоль диагонали так, чтобы сечение стало <b>правильным</b> шестиугольником — со всеми сторонами равными.',
      },
      task: {
        kind: 'drag',
        target: { s: 0 },
        tol: 0.15,
        back: 3,
        right: {
          en: 'Through the middle of the diagonal the plane cuts six edges at their midpoints; every side is half a face diagonal, $\\frac{3\\sqrt2}{2}$.',
          ru: 'Через середину диагонали плоскость режет шесть рёбер в их серединах; каждая сторона — половина диагонали грани, $\\frac{3\\sqrt2}{2}$.',
        },
        mistakes: [
          { params: { s: 1.5 }, text: {
            en: 'Here the plane goes through three vertices $B_1$, $D_1$, $C$: the section is a triangle. A hexagon is between the two such triangles.',
            ru: 'Здесь плоскость проходит через три вершины $B_1$, $D_1$, $C$: сечение — треугольник. Шестиугольник — между двумя такими треугольниками.' } },
          { params: { s: -1.5 }, text: {
            en: 'Here the plane goes through three vertices $B$, $D$, $A_1$: the section is a triangle. A hexagon is between the two such triangles.',
            ru: 'Здесь плоскость проходит через три вершины $B$, $D$, $A_1$: сечение — треугольник. Шестиугольник — между двумя такими треугольниками.' } },
        ],
        hints: {
          s: s => (Math.abs(s) < 1.5
            ? { en: 'A hexagon, but long and short sides alternate. Where would the plane cut all six edges in the same way?', ru: 'Шестиугольник, но длинные и короткие стороны чередуются. Где плоскость разрежет все шесть рёбер одинаково?' }
            : { en: 'This is a triangle. Move the point towards the middle of the cube.', ru: 'Это треугольник. Двигайте точку к середине куба.' }),
        },
      },
      state: { show: ['cube', 'acrossT'], params: { s: 2.6 }, camera: [8, 3.2, 6.2], controls: [] },
    },
  ],
};
