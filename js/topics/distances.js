// Distances in space. From a point to a plane: the perpendicular is shorter than any slanted line (the rope
// hangs straight down). Between two skew lines: slide a point along each and look for the shortest bridge —
// it is perpendicular to both lines. In a cube the edge AA₁ and the diagonal BD are bridged by AO.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { cube, lerp, dist, sub, add, mul, norm, avg } from '../core/geom.js';

const WHITE = '#ffffff';
const CAMERA = [7.5, -6, 4.5];
const CUBE = cube(3);
const V = CUBE.V;
const FLOOR = [[-3.5, -2.5, 0], [3.5, -2.5, 0], [3.5, 2.5, 0], [-3.5, 2.5, 0]];
const P = [0, 0, 2];
const r2 = v => fmt(Math.round(v * 100) / 100);
const O = avg([V.A, V.C]); // the centre of the bottom face

// The distance from Y to the vertical line through A (AA₁): only the horizontal part counts
export const toEdge = Y => Math.hypot(Y[0] - V.A[0], Y[1] - V.A[1]);

function corner(p, key, Vx, u, w) {
  const a = add(Vx, mul(norm(u), 0.3)), b = add(Vx, mul(norm(w), 0.3));
  p.segment(key + ':1', a, add(a, mul(norm(w), 0.3)), WHITE, { radius: 0.015 });
  p.segment(key + ':2', b, add(b, mul(norm(u), 0.3)), WHITE, { radius: 0.015 });
}

// The bridge XY between AA₁ (X at height u) and BD (Y at part v from B)
function bridge(p, sc, s, k, fixedX) {
  p.polyhedron(`${k}:cube`, CUBE, '#c9d1dc');
  p.segment(`${k}:AA1`, V.A, V.A1, COLORS.blue, { radius: 0.045 });
  p.segment(`${k}:BD`, V.B, V.D, COLORS.green, { radius: 0.045 });
  const Y = lerp(V.B, V.D, s.v), X = fixedX ? V.A : lerp(V.A, V.A1, s.u); // Y is on the floor: its foot on AA₁ is A
  p.segment(`${k}:XY`, X, Y, COLORS.red, { radius: 0.035 });
  if (!fixedX) p.handle(`${k}:X`, V.A, V.A1, s.u, COLORS.blue, u => sc.setParam('u', u), 'X');
  p.handle(`${k}:Y`, V.B, V.D, s.v, COLORS.green, v => sc.setParam('v', v), 'Y');
  if (!fixedX && s.u < 0.02 && Math.abs(s.v - 0.5) < 0.02) {
    corner(p, `${k}:c1`, O, sub(V.A, O), sub(V.B, O));
    corner(p, `${k}:c2`, V.A, sub(O, V.A), sub(V.A1, V.A));
  }
}

export default {
  view: '3d',
  view3d: { R: 4, zmax: 4, camera: CAMERA, axes: false },
  lab: false,

  setup(scene) {
    scene.ensureParam('x', 0.75, { min: 0, max: 1 }); // the foot X of a slanted line on the floor
    scene.ensureParam('u', 0.6, { min: 0, max: 1 }); // X on AA₁
    scene.ensureParam('v', 0.2, { min: 0, max: 1 }); // Y on BD

    scene.custom.push(
      {
        // A point above the floor and lines from it to points of the floor
        id: 'drop',
        draw3d(p, sc, s) {
          const X = [-3 + 6 * s.x, 0, 0];
          p.polygon('drop:floor', FLOOR, COLORS.blue, { opacity: 0.06, outline: false });
          p.segment('drop:PO', P, [0, 0, 0], COLORS.yellow, { radius: 0.04 });
          p.segment('drop:PX', P, X, COLORS.red, { radius: 0.035 });
          p.segment('drop:OX', [0, 0, 0], X, COLORS.purple, { radius: 0.025 });
          p.point('drop:P', P, WHITE, 'P');
          p.point('drop:O', [0, 0, 0], COLORS.yellow, 'O');
          p.handle('drop:X', [-3, 0, 0], [3, 0, 0], s.x, WHITE, v => sc.setParam('x', v), 'X');
        },
        legend: s => {
          const x = -3 + 6 * s.x;
          return `\\red{PX} = \\sqrt{\\yellow{2}^2 + \\purple{${r2(Math.abs(x))}}^2} = ${r2(Math.hypot(2, x))} \\ \\ge\\ \\yellow{PO} = 2`;
        },
      },
      {
        id: 'skew',
        draw3d: (p, sc, s) => bridge(p, sc, s, 'skew', false),
        legend: s => `\\red{XY} = ${r2(dist(lerp(V.A, V.A1, s.u), lerp(V.B, V.D, s.v)))}`,
      },
      {
        id: 'task',
        draw3d: (p, sc, s) => bridge(p, sc, s, 'task', true),
        legend: s => `d(Y,\\ \\blue{AA_1}) = ${r2(toEdge(lerp(V.B, V.D, s.v)))}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'The shortest way down', ru: 'Самый короткий путь вниз' },
      text: {
        en: 'A lamp $P$ hangs $2$ m above the floor. Of all the cords from $P$ to the floor the shortest goes straight down, to $O$: any other cord $PX$ is the hypotenuse of the right triangle $POX$, and a hypotenuse is longer than a leg. So <b>the distance from a point to a plane is the length of the perpendicular</b>. The distance between parallel planes — floor and ceiling — is the same from every point.',
        ru: 'Лампа $P$ висит в $2$ м над полом. Из всех шнуров от $P$ до пола самый короткий идёт отвесно вниз, в $O$: любой другой шнур $PX$ — гипотенуза прямоугольного треугольника $POX$, а гипотенуза длиннее катета. Поэтому <b>расстояние от точки до плоскости — длина перпендикуляра</b>. Расстояние между параллельными плоскостями — полом и потолком — одно и то же от любой точки.',
      },
      try: { en: 'Drag $X$ along the floor.', ru: 'Тяните $X$ по полу.' },
      state: { show: ['drop'], params: { x: 0.75 }, camera: [6, -7, 4], controls: [] },
    },
    {
      title: { en: 'A bridge between skew lines', ru: 'Мост между скрещивающимися прямыми' },
      text: {
        en: 'The edge $\\blue{AA_1}$ and the diagonal $\\green{BD}$ of the floor are skew: they never meet and are not parallel. Lay a bridge $\\red{XY}$ from one to the other and slide its ends. The shortest bridge is $AO$, from the corner to the centre of the floor — and it is at right angles to <b>both</b> lines. That is the distance between skew lines: the length of their common perpendicular.',
        ru: 'Ребро $\\blue{AA_1}$ и диагональ пола $\\green{BD}$ скрещиваются: не пересекаются и не параллельны. Перекинем от одной к другой мост $\\red{XY}$ и будем двигать его концы. Самый короткий мост — $AO$, от угла к центру пола, — и он перпендикулярен <b>обеим</b> прямым. Это и есть расстояние между скрещивающимися прямыми: длина их общего перпендикуляра.',
      },
      try: { en: 'Drag $X$ to $A$ and $Y$ to the middle of $BD$: right-angle marks appear.', ru: 'Опустите $X$ в $A$, а $Y$ — в середину $BD$: появятся значки прямых углов.' },
      check: {
        q: { en: 'The edge of the cube is $3$. How long is $AO$?', ru: 'Ребро куба $3$. Чему равно $AO$?' },
        options: [{ text: '$\\frac{3}{\\sqrt2} \\approx 2.12$', ok: true }, { text: '$3$' }, { text: '$3\\sqrt2 \\approx 4.24$' }],
        explain: {
          en: '$AO$ is half the diagonal of the square: $\\frac{3\\sqrt2}{2} = \\frac{3}{\\sqrt2}$. $3\\sqrt2$ is the whole diagonal $AC$.',
          ru: '$AO$ — половина диагонали квадрата: $\\frac{3\\sqrt2}{2} = \\frac{3}{\\sqrt2}$. $3\\sqrt2$ — вся диагональ $AC$.',
        },
        reveal: scene => scene.animateParams({ u: 0, v: 0.5 }, 900),
      },
      state: { show: ['skew'], params: { u: 0.6, v: 0.2 }, camera: CAMERA, controls: [] },
    },
    {
      title: { en: 'The closest point of BD', ru: 'Ближайшая точка BD' },
      text: {
        en: 'Find on the diagonal $BD$ the point $Y$ that is closest to the edge $AA_1$.',
        ru: 'Найдите на диагонали $BD$ точку $Y$, ближайшую к ребру $AA_1$.',
      },
      task: {
        kind: 'drag',
        target: { v: 0.5 },
        tol: 0.02,
        back: 1,
        right: {
          en: 'The middle $O$ of $BD$: there $AO \\perp BD$ (the diagonals of a square are perpendicular), and $AO \\perp AA_1$. The distance is $\\frac{3}{\\sqrt2} \\approx 2.12$.',
          ru: 'Середина $O$ диагонали $BD$: там $AO \\perp BD$ (диагонали квадрата перпендикулярны), и $AO \\perp AA_1$. Расстояние $\\frac{3}{\\sqrt2} \\approx 2.12$.',
        },
        mistakes: [
          { params: { v: 0 }, text: { en: '$B$ is an end of the diagonal, $3$ away from the edge — farther than the middle.', ru: '$B$ — конец диагонали, до ребра $3$, дальше, чем от середины.' } },
          { params: { v: 1 }, text: { en: '$D$ is an end of the diagonal, $3$ away from the edge — farther than the middle.', ru: '$D$ — конец диагонали, до ребра $3$, дальше, чем от середины.' } },
        ],
        hints: { v: { en: 'Look for the smallest number below.', ru: 'Ищите наименьшее число в строке под сценой.' } },
      },
      state: { show: ['task'], params: { v: 0.15 }, camera: CAMERA, controls: [] },
    },
  ],
};
