// Parallel lines and planes in space. A ruler held level above a table never meets it: a line parallel to a
// line of the plane is parallel to the plane. Tilt it and it pierces the floor. Floor and a level shelf are
// parallel planes, and any third plane cuts them along parallel lines.

import { COLORS } from '../core/palette.js';
import { cube, lerp, add, sub, mul } from '../core/geom.js';
import { t } from '../core/i18n.js';

const CUBE = cube(3);
const V = CUBE.V;
const EDGE = '#c9d1dc';
const WHITE = '#ffffff';
const CAMERA = [7.5, -6, 4.5];
const FLOOR = [[-5, -5, -1.5], [5, -5, -1.5], [5, 5, -1.5], [-5, 5, -1.5]];
const line = (a, b, s, e) => [add(a, mul(sub(b, a), -s)), add(a, mul(sub(b, a), e))];
const up = (P, Q, u) => lerp(P, Q, u); // a point part u of the way up a vertical edge

// Where the line through M and N meets the floor z = −1.5, as the multiple of MN from M (null if level)
export function traceOf(M, N) {
  const dz = N[2] - M[2];
  return Math.abs(dz) < 1e-9 ? null : (-1.5 - M[2]) / dz;
}

export default {
  view: '3d',
  view3d: { R: 4, zmax: 4, camera: CAMERA, axes: false },
  lab: false,

  setup(scene) {
    scene.ensureParam('m', 0.6, { min: 0, max: 1 }); // M on AA₁
    scene.ensureParam('n', 0.6, { min: 0, max: 1 }); // N on BB₁ (or CC₁ in the task)
    scene.ensureParam('z', 0.5, { min: 0.05, max: 0.95 }); // the level shelf, as part of the height

    const floor = key => p => p.polygon(key, FLOOR, COLORS.blue, { opacity: 0.05, outline: false });

    scene.custom.push(
      { id: 'cube', draw3d(p) { p.polyhedron('cube', CUBE, EDGE); } },
      {
        // The ruler MN over the floor; level when M and N are at the same height
        id: 'ruler',
        draw3d(p, sc, s) {
          floor('ruler:floor')(p);
          const M = up(V.A, V.A1, s.m), N = up(V.B, V.B1, s.n), k = traceOf(M, N);
          const far = k !== null && Math.abs(k) < 6;
          const [a, b] = line(M, N, far && k < 0 ? -k + 0.4 : 1.2, far && k > 0 ? k + 0.4 : 2.2);
          p.segment('ruler:MN', a, b, COLORS.green, { radius: 0.035 });
          p.segment('ruler:AB', V.A, V.B, COLORS.yellow, { radius: 0.04 });
          if (far) p.point('ruler:T', add(M, mul(sub(N, M), k)), COLORS.red, 'T', 0.1);
          p.handle('ruler:M', V.A, V.A1, s.m, WHITE, v => sc.setParam('m', v), 'M');
          p.handle('ruler:N', V.B, V.B1, s.n, WHITE, v => sc.setParam('n', v), 'N');
        },
        legend: s => (Math.abs(s.m - s.n) < 0.01
          ? '\\green{MN} \\parallel \\yellow{AB} \\subset (ABC) \\ \\Rightarrow\\ \\green{MN} \\parallel (ABC)'
          : t({ en: '\\green{MN} \\text{ pierces the floor at } \\red{T}', ru: '\\green{MN} \\text{ протыкает пол в точке } \\red{T}' })),
      },
      {
        // A level shelf at height z and the slanted plane ACB₁: the two cuts are parallel
        id: 'shelf',
        draw3d(p, sc, s) {
          const h = -1.5 + 3 * s.z, sq = [[-1.5, -1.5, h], [1.5, -1.5, h], [1.5, 1.5, h], [-1.5, 1.5, h]];
          p.polygon('shelf:sq', sq, COLORS.blue, { opacity: 0.2, poly: CUBE });
          p.polygon('shelf:tri', [V.A, V.C, V.B1], COLORS.yellow, { opacity: 0.18, poly: CUBE, outline: false });
          p.segment('shelf:AC', V.A, V.C, COLORS.red, { radius: 0.045 });
          p.segment('shelf:cut', lerp(V.A, V.B1, s.z), lerp(V.C, V.B1, s.z), COLORS.red, { radius: 0.045 });
          p.point('shelf:B1', V.B1, COLORS.yellow);
        },
        legend: () => t({ en: '\\red{AC} \\parallel \\red{\\text{the cut on the shelf}}', ru: '\\red{AC} \\parallel \\red{\\text{след на полке}}' }),
      },
      {
        // The task: M at two thirds of AA₁, N dragged along CC₁
        id: 'task',
        draw3d(p, sc, s) {
          floor('task:floor')(p);
          const M = up(V.A, V.A1, 2 / 3), N = up(V.C, V.C1, s.n), k = traceOf(M, N);
          const far = k !== null && Math.abs(k) < 6;
          const [a, b] = line(M, N, far && k < 0 ? -k + 0.4 : 0.6, far && k > 0 ? k + 0.4 : 1.6);
          p.segment('task:MN', a, b, COLORS.green, { radius: 0.035 });
          p.point('task:M', M, COLORS.red, 'M');
          if (far) p.point('task:T', add(M, mul(sub(N, M), k)), COLORS.red, 'T', 0.1);
          p.handle('task:N', V.C, V.C1, s.n, WHITE, v => sc.setParam('n', v), 'N');
        },
      },
    );
  },

  steps: [
    {
      title: { en: 'A ruler above the table', ru: 'Линейка над столом' },
      text: {
        en: 'Hold a ruler $MN$ level above the floor of the cube: it is parallel to the edge $\\yellow{AB}$, which lies in the floor. Such a ruler never touches the floor, however far you extend it. That is the test: <b>a line parallel to some line of a plane is parallel to the plane</b>. Now raise only $N$ — the ruler tilts and at once pierces the floor at a point $T$.',
        ru: 'Держим линейку $MN$ ровно над полом куба: она параллельна ребру $\\yellow{AB}$, лежащему в полу. Такая линейка никогда не коснётся пола, как её ни продолжай. Это и есть признак: <b>прямая, параллельная какой-нибудь прямой плоскости, параллельна самой плоскости</b>. Теперь поднимите только $N$ — линейка наклоняется и тут же протыкает пол в точке $T$.',
      },
      try: { en: 'Drag $N$ above and below $M$: where does $T$ go?', ru: 'Тяните $N$ выше и ниже $M$: куда уходит $T$?' },
      state: { show: ['cube', 'ruler'], params: { m: 0.6, n: 0.6 }, camera: CAMERA, controls: [] },
    },
    {
      title: { en: 'Two lines parallel to one plane', ru: 'Две прямые, параллельные одной плоскости' },
      text: {
        en: 'In the plane two lines parallel to a third line are parallel to each other. In space this fails for planes: two rulers can both be level above the floor and still cross — or even be skew, at different heights and in different directions.',
        ru: 'На плоскости две прямые, параллельные третьей, параллельны друг другу. В пространстве с плоскостями так нельзя: две линейки могут обе висеть ровно над полом и всё равно пересекаться — или даже скрещиваться, на разной высоте и в разных направлениях.',
      },
      check: {
        q: { en: 'The edges $A_1B_1$ and $B_1C_1$ are both parallel to the floor $(ABC)$. Are they parallel to each other?', ru: 'Рёбра $A_1B_1$ и $B_1C_1$ оба параллельны полу $(ABC)$. Параллельны ли они друг другу?' },
        options: [{ text: { en: 'no, they meet at $B_1$', ru: 'нет, они пересекаются в $B_1$' }, ok: true }, { text: { en: 'yes', ru: 'да' } }],
        explain: {
          en: 'Both lie in the top face, which is parallel to the floor, and they meet at a right angle. Parallel to one plane says nothing about each other.',
          ru: 'Оба лежат в верхней грани, параллельной полу, и пересекаются под прямым углом. Параллельность одной плоскости ничего не говорит об их взаимном положении.',
        },
      },
      state: { show: ['cube', 'ruler'], params: { m: 1, n: 1 }, camera: CAMERA, controls: [] },
    },
    {
      proof: true,
      statement: {
        en: '<b>Theorem.</b> If two parallel planes are cut by a third plane, the lines of the cut are parallel.',
        ru: '<b>Теорема.</b> Если две параллельные плоскости пересечены третьей, то линии пересечения параллельны.',
      },
      title: { en: 'A shelf and a slanted plane', ru: 'Полка и наклонная плоскость' },
      text: {
        en: 'The floor and a <span class="c-blue">level shelf</span> are parallel planes. The yellow plane $ACB_1$ cuts both: along $AC$ and along the red line on the shelf. Both lines lie in the yellow plane. They cannot meet — a common point would lie on the floor and on the shelf, and parallel planes have none. Two lines in one plane that never meet are parallel. $\\blacksquare$',
        ru: 'Пол и <span class="c-blue">ровная полка</span> — параллельные плоскости. Жёлтая плоскость $ACB_1$ режет обе: по $AC$ и по красной линии на полке. Обе линии лежат в жёлтой плоскости. Встретиться они не могут — общая точка лежала бы и на полу, и на полке, а у параллельных плоскостей общих точек нет. Две прямые одной плоскости, которые не встречаются, параллельны. $\\blacksquare$',
      },
      try: { en: 'Move the shelf up and down with $z$.', ru: 'Двигайте полку вверх и вниз ползунком $z$.' },
      state: { show: ['cube', 'shelf'], params: { z: 0.5 }, camera: [7, -5.5, 3.5], controls: ['z'] },
    },
    {
      title: { en: 'Make MN parallel to the floor', ru: 'Сделайте MN параллельной полу' },
      text: {
        en: '$M$ is at two thirds of the edge $AA_1$. Move $N$ along $CC_1$ so that the line $MN$ is parallel to the floor $(ABC)$.',
        ru: '$M$ стоит на двух третях ребра $AA_1$. Передвиньте $N$ по $CC_1$ так, чтобы прямая $MN$ стала параллельна полу $(ABC)$.',
      },
      task: {
        kind: 'drag',
        target: { n: 2 / 3 },
        tol: 0.03,
        back: 0,
        right: {
          en: 'At the same height $MN \\parallel AC$, and $AC$ lies in the floor — so $MN \\parallel (ABC)$, and the point $T$ has gone to infinity.',
          ru: 'На одной высоте $MN \\parallel AC$, а $AC$ лежит в полу — значит, $MN \\parallel (ABC)$, и точка $T$ ушла в бесконечность.',
        },
        mistakes: [
          { params: { n: 1 / 3 }, text: { en: '$CN = \\frac13$ of the edge, $AM = \\frac23$: $N$ is lower than $M$, and the line meets the floor.', ru: '$CN = \\frac13$ ребра, а $AM = \\frac23$: $N$ ниже $M$, и прямая встречает пол.' } },
        ],
        hints: { n: { en: 'Watch the red point $T$: it must run away.', ru: 'Следите за красной точкой $T$: она должна убежать.' } },
      },
      state: { show: ['cube', 'task'], params: { n: 0.2 }, camera: CAMERA, controls: [] },
    },
  ],
};
