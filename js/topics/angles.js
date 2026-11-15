// Angles in space. The angle between a slanted rope and the floor is the angle between the rope and its own
// shadow. The angle between two planes is read off an open book: two lines, one on each page, both at right
// angles to the spine. In a cube the main diagonal rises over the floor at about 35°.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { cube, add, sub, mul, norm, cross } from '../core/geom.js';

const WHITE = '#ffffff';
const DEG = Math.PI / 180;
const CAMERA = [7, -6, 4];
const H = 2; // the height of the pole
const CUBE = cube(3);
const V = CUBE.V;
const FLOOR = [[-1, -3, 0], [4.5, -3, 0], [4.5, 3, 0], [-1, 3, 0]];
const r1 = v => fmt(Math.round(v * 10) / 10);
const r2 = v => fmt(Math.round(v * 100) / 100);
const reach = w => 0.5 + 3.4 * w; // the foot A of the rope, from the slider part w

// An arc at V from the direction u towards w (in their plane), radius r
function arc(p, key, Vx, u, w, r, color) {
  const a = norm(u), n = norm(cross(cross(u, w), u)), end = Math.acos(Math.max(-1, Math.min(1, (u[0] * w[0] + u[1] * w[1] + u[2] * w[2]) / (Math.hypot(...u) * Math.hypot(...w)))));
  const pts = Array.from({ length: 25 }, (_, i) => {
    const t = end * i / 24;
    return add(Vx, add(mul(a, r * Math.cos(t)), mul(n, r * Math.sin(t))));
  });
  p.tube(key, pts, color, 0.025);
}

function rope(p, sc, s, k) {
  const A = [reach(s.w), 0, 0], P = [0, 0, H], O = [0, 0, 0];
  p.polygon(`${k}:floor`, FLOOR, COLORS.blue, { opacity: 0.06, outline: false });
  p.segment(`${k}:OP`, O, P, COLORS.yellow, { radius: 0.06 });
  p.segment(`${k}:PA`, P, A, COLORS.red, { radius: 0.04 });
  p.segment(`${k}:OA`, O, A, COLORS.purple, { radius: 0.04 });
  p.point(`${k}:O`, O, WHITE, 'O');
  p.handle(`${k}:A`, [0.5, 0, 0], [3.9, 0, 0], s.w, WHITE, v => sc.setParam('w', v), 'A');
  arc(p, `${k}:arc`, A, sub(O, A), sub(P, A), 0.6, COLORS.green);
}

export default {
  view: '3d',
  view3d: { R: 4, zmax: 4, camera: CAMERA, axes: false },
  lab: false,

  setup(scene) {
    scene.ensureParam('w', 0.4, { min: 0, max: 1 });
    scene.ensureParam('theta', 60, { min: 10, max: 180, step: 1 }); // how far the book is open, in degrees

    scene.custom.push(
      {
        id: 'rope',
        draw3d: (p, sc, s) => rope(p, sc, s, 'rope'),
        legend: s => `\\green{\\varphi} = \\arctan\\frac{${H}}{${r2(reach(s.w))}} = ${r1(Math.atan(H / reach(s.w)) / DEG)}°`,
      },
      {
        // An open book: the spine along y, one page on the floor, the other turned by the angle «open»
        id: 'book',
        draw3d(p, sc, s) {
          const a = s.theta * DEG, L = 2.6, e = [Math.cos(a), 0, Math.sin(a)];
          p.polygon('book:p1', [[0, -2, 0], [L, -2, 0], [L, 2, 0], [0, 2, 0]], COLORS.blue, { opacity: 0.22 });
          p.polygon('book:p2', [[0, -2, 0], add(mul(e, L), [0, -2, 0]), add(mul(e, L), [0, 2, 0]), [0, 2, 0]], COLORS.orange, { opacity: 0.22 });
          p.segment('book:spine', [0, -2.3, 0], [0, 2.3, 0], WHITE, { radius: 0.05 });
          p.segment('book:l1', [0, 0, 0], [L, 0, 0], COLORS.blue, { radius: 0.04 });
          p.segment('book:l2', [0, 0, 0], mul(e, L), COLORS.orange, { radius: 0.04 });
          arc(p, 'book:arc', [0, 0, 0], [1, 0, 0], e, 0.7, COLORS.green);
        },
        legend: s => `\\green{\\angle = ${s.theta}°}`,
      },
      {
        // The main diagonal DB₁ of the cube and its shadow DB on the floor
        id: 'diag',
        draw3d(p) {
          p.polyhedron('diag:cube', CUBE, '#c9d1dc');
          p.segment('diag:DB1', V.D, V.B1, COLORS.red, { radius: 0.045 });
          p.segment('diag:DB', V.D, V.B, COLORS.purple, { radius: 0.045 });
          p.segment('diag:BB1', V.B, V.B1, COLORS.yellow, { radius: 0.045 });
          arc(p, 'diag:arc', V.D, sub(V.B, V.D), sub(V.B1, V.D), 0.8, COLORS.green);
        },
        legend: () => `\\tan\\green{\\varphi} = \\frac{\\yellow{BB_1}}{\\purple{DB}} = \\frac{a}{a\\sqrt2} = \\frac{1}{\\sqrt2}`,
      },
      {
        id: 'ropeTask',
        draw3d: (p, sc, s) => rope(p, sc, s, 'task'),
        legend: s => `OP = ${H},\\quad \\purple{OA} = ${r2(reach(s.w))}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'A rope and its shadow', ru: 'Верёвка и её тень' },
      text: {
        en: 'A rope $PA$ runs from the top of a pole to the floor. At what angle does it meet the floor? A plane has many directions, so we choose one: the rope\'s own <span class="c-purple">shadow</span> under the noon sun, $OA$. <b>The angle between a line and a plane is the angle between the line and its projection.</b> It is the smallest of all angles the rope makes with lines of the floor.',
        ru: 'Верёвка $PA$ идёт с верхушки столба на пол. Под каким углом она встречает пол? У плоскости много направлений, поэтому выбираем одно: собственную <span class="c-purple">тень</span> верёвки под полуденным солнцем, $OA$. <b>Угол между прямой и плоскостью — угол между прямой и её проекцией.</b> Это наименьший из углов, которые верёвка образует с прямыми пола.',
      },
      try: { en: 'Drag $A$: the farther, the flatter.', ru: 'Тяните $A$: чем дальше, тем положе.' },
      state: { show: ['rope'], params: { w: 0.4 }, camera: CAMERA, controls: [] },
    },
    {
      title: { en: 'Between two planes: an open book', ru: 'Между плоскостями: открытая книга' },
      text: {
        en: 'Open a book. The angle between its two pages is measured by two lines, one on each page, <b>both at right angles to the spine</b> from the same point. Slanted lines would give a different, wrong number. A closed book is $0°$, a book lying open flat is $180°$. This is the dihedral angle — the slope of a roof, the tilt of a laptop lid.',
        ru: 'Откроем книгу. Угол между страницами измеряют двумя линиями, по одной на каждой странице, <b>обе перпендикулярны корешку</b> из одной точки. Косые линии дали бы другое, неверное число. Закрытая книга — $0°$, раскрытая плашмя — $180°$. Это двугранный угол — скат крыши, наклон крышки ноутбука.',
      },
      try: { en: 'Press ▶ next to the slider.', ru: 'Нажмите ▶ возле ползунка.' },
      state: { show: ['book'], params: { theta: 60 }, camera: [5, -6, 4], controls: ['theta'] },
    },
    {
      title: { en: 'The diagonal of a cube', ru: 'Диагональ куба' },
      text: {
        en: 'At what angle does the main diagonal $DB_1$ of a cube rise above the floor? Its shadow is the diagonal of the bottom face, $DB = a\\sqrt2$; the height is the edge $BB_1 = a$. In the right triangle $DBB_1$: $\\tan\\varphi = \\frac{1}{\\sqrt2}$.',
        ru: 'Под каким углом главная диагональ куба $DB_1$ поднимается над полом? Её тень — диагональ нижней грани, $DB = a\\sqrt2$, высота — ребро $BB_1 = a$. В прямоугольном треугольнике $DBB_1$: $\\tan\\varphi = \\frac{1}{\\sqrt2}$.',
      },
      check: {
        q: { en: 'So $\\varphi$ is about…', ru: 'Значит, $\\varphi$ примерно…' },
        options: [{ text: '$35°$', ok: true }, { text: '$45°$' }, { text: '$55°$' }],
        explain: {
          en: '$\\arctan 0.707 \\approx 35.3°$. Not $45°$: that is the angle of a face diagonal with an edge, where the legs are equal.',
          ru: '$\\arctan 0.707 \\approx 35.3°$. Не $45°$: это угол диагонали грани с ребром, где катеты равны.',
        },
      },
      state: { show: ['diag'], camera: [7.5, -6, 3.5], controls: [] },
    },
    {
      title: { en: 'A rope at 30°', ru: 'Верёвка под 30°' },
      text: {
        en: 'The pole is $2$ m high. Drag the end $A$ of the rope so that it meets the floor at exactly $30°$.',
        ru: 'Высота столба $2$ м. Передвиньте конец верёвки $A$ так, чтобы она встречала пол ровно под углом $30°$.',
      },
      task: {
        kind: 'drag',
        target: { w: (2 / Math.tan(30 * DEG) - 0.5) / 3.4 },
        tol: 0.004,
        back: 0,
        right: {
          en: '$\\tan 30° = \\frac{2}{OA}$, so $OA = \\frac{2}{\\tan 30°} = 2\\sqrt3 \\approx 3.46$. The rope is then $4$ m: the leg against $30°$ is half the hypotenuse.',
          ru: '$\\tan 30° = \\frac{2}{OA}$, значит, $OA = \\frac{2}{\\tan 30°} = 2\\sqrt3 \\approx 3.46$. Верёвка тогда $4$ м: катет против $30°$ — половина гипотенузы.',
        },
        mistakes: [
          { params: { w: (2 / Math.tan(60 * DEG) - 0.5) / 3.4 }, text: { en: 'This is $60°$: the angle at the <b>top</b> of the pole is $30°$ here, not the one at the floor.', ru: 'Это $60°$: здесь $30°$ — угол у <b>верхушки</b> столба, а не у пола.' } },
        ],
        hints: { w: { en: 'The angle at $A$ is opposite the pole: $\\tan\\varphi = \\frac{OP}{OA}$.', ru: 'Угол при $A$ лежит против столба: $\\tan\\varphi = \\frac{OP}{OA}$.' } },
      },
      state: { show: ['ropeTask'], params: { w: 0.2 }, camera: CAMERA, controls: [] },
    },
  ],
};
