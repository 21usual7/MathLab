// The inscribed angle. A goal AB on a circle: from every point C of the arc the goal is seen at the same angle,
// half of the central angle AOB. The proof: an isosceles triangle OCB whose exterior angle is twice its base
// angle, then the general case is a sum or difference of two such. On a diameter the angle is right (Thales).

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';

const WHITE = '#ffffff';
const DEG = Math.PI / 180;
const R = 2.5;
const VIEW = { cx: 0, cy: 0, unit: 80, fit: [7, 7] };
const r0 = v => fmt(Math.round(v));
const on = d => [R * Math.cos(d * DEG), R * Math.sin(d * DEG)];
const deg = (x, y) => ((Math.round(Math.atan2(y, x) / DEG) % 360) + 360) % 360;
const dir = (P, Q) => Math.atan2(Q[1] - P[1], Q[0] - P[0]);

// The angle at V between the rays to P and Q, in degrees (0…180)
export function angle(V, P, Q) {
  let d = Math.abs(dir(V, P) - dir(V, Q)) / DEG;
  if (d > 180) d = 360 - d;
  return d;
}

// The arc of the smaller angle at V between the rays to P and Q
function arc(p, V, P, Q, r, color) {
  let t0 = dir(V, P), t1 = dir(V, Q), d = t1 - t0;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  p.param(t => V[0] + r * Math.cos(t), t => V[1] + r * Math.sin(t), Math.min(t0, t0 + d), Math.max(t0, t0 + d), color, 3);
}

function circle(p) {
  p.param(t => R * Math.cos(t), t => R * Math.sin(t), 0, 2 * Math.PI, 'rgba(255,255,255,0.6)', 2);
  p.dot(0, 0, WHITE, 4);
  p.tex('oO', 'O', 0, 0, WHITE, { dx: 6, dy: 14 });
}
const name = (p, k, P, l) => p.tex(k, l, P[0] * 1.12, P[1] * 1.12, WHITE, { dx: 0, dy: 0, align: 'center' });

export default {
  view: '2d',
  view2d: VIEW,
  lab: false,

  setup(scene) {
    scene.ensureParam('a', 200, { min: 0, max: 359, step: 1 }); // where A, B and C are on the circle, in degrees
    scene.ensureParam('b', 320, { min: 0, max: 359, step: 1 });
    scene.ensureParam('c', 100, { min: 0, max: 359, step: 1 });

    const drag = (sc, k) => (x, y) => sc.setParam(k, deg(x, y));

    scene.custom.push(
      {
        // The goal AB, the player C on the circle, and the angle at which C sees the goal
        id: 'goal',
        draw2d(p, sc, s) {
          const A = on(s.a), B = on(s.b), C = on(s.c);
          circle(p);
          p.line(...A, ...B, COLORS.green, { width: 5 });
          p.line(...C, ...A, COLORS.yellow, { width: 2 });
          p.line(...C, ...B, COLORS.yellow, { width: 2 });
          arc(p, C, A, B, 0.5, COLORS.yellow);
          name(p, 'nA', A, 'A'); name(p, 'nB', B, 'B'); name(p, 'nC', C, 'C');
          p.handle(...C, COLORS.yellow, drag(sc, 'c'));
          p.handle(...A, COLORS.green, drag(sc, 'a'));
          p.handle(...B, COLORS.green, drag(sc, 'b'));
        },
        legend: s => `\\yellow{\\angle ACB = ${r0(angle(on(s.c), on(s.a), on(s.b)))}°}`,
      },
      {
        // The central angle AOB
        id: 'central',
        draw2d(p, sc, s) {
          const A = on(s.a), B = on(s.b);
          p.line(0, 0, ...A, COLORS.purple, { width: 2.5 });
          p.line(0, 0, ...B, COLORS.purple, { width: 2.5 });
          arc(p, [0, 0], A, B, 0.45, COLORS.purple);
        },
        legend: s => `\\purple{\\angle AOB = ${r0(angle([0, 0], on(s.a), on(s.b)))}°} = 2 \\cdot \\yellow{${r0(angle(on(s.c), on(s.a), on(s.b)))}°}`,
      },
      {
        // The proof: C opposite A through O, so CA passes through the centre; triangle OCB is isosceles
        id: 'proof',
        draw2d(p, sc, s) {
          const C = on(s.c), A = on(s.c + 180), B = on(s.b);
          circle(p);
          p.fill([[0, 0], C, B], COLORS.blue + '22');
          p.line(...C, ...A, COLORS.yellow, { width: 2 });
          p.line(...C, ...B, COLORS.yellow, { width: 2 });
          p.line(0, 0, ...B, COLORS.blue, { width: 2.5 });
          arc(p, C, A, B, 0.55, COLORS.yellow);
          arc(p, B, C, [0, 0], 0.55, COLORS.yellow);
          arc(p, [0, 0], A, B, 0.4, COLORS.purple);
          name(p, 'pA', A, 'A'); name(p, 'pB', B, 'B'); name(p, 'pC', C, 'C');
          p.handle(...B, COLORS.green, drag(sc, 'b'));
          p.handle(...C, COLORS.yellow, drag(sc, 'c'));
        },
        legend: s => {
          const C = on(s.c), A = on(s.c + 180), B = on(s.b), x = angle(C, A, B);
          return `\\yellow{x = ${r0(x)}°},\\quad \\purple{\\angle AOB = x + x = ${r0(2 * x)}°}`;
        },
      },
      {
        // Thales: A and B ends of a diameter
        id: 'thales',
        draw2d(p, sc, s) {
          const A = on(180), B = on(0), C = on(s.c);
          circle(p);
          p.line(...A, ...B, COLORS.green, { width: 4 });
          p.fill([A, B, C], COLORS.yellow + '22');
          p.polyline([A, C, B], COLORS.yellow, 2.5);
          const u = [(A[0] - C[0]) / Math.hypot(A[0] - C[0], A[1] - C[1]) * 0.35, (A[1] - C[1]) / Math.hypot(A[0] - C[0], A[1] - C[1]) * 0.35];
          const v = [(B[0] - C[0]) / Math.hypot(B[0] - C[0], B[1] - C[1]) * 0.35, (B[1] - C[1]) / Math.hypot(B[0] - C[0], B[1] - C[1]) * 0.35];
          p.polyline([[C[0] + u[0], C[1] + u[1]], [C[0] + u[0] + v[0], C[1] + u[1] + v[1]], [C[0] + v[0], C[1] + v[1]]], WHITE, 1.5);
          name(p, 'tA', A, 'A'); name(p, 'tB', B, 'B'); name(p, 'tC', C, 'C');
          p.handle(...C, COLORS.yellow, drag(sc, 'c'));
        },
        legend: s => `\\angle ACB = ${r0(angle(on(s.c), on(180), on(0)))}°`,
      },
      {
        // The task: the player is fixed, the goalpost B moves until the goal is seen at 30°
        id: 'task',
        draw2d(p, sc, s) {
          const A = on(200), B = on(s.b), C = on(90);
          circle(p);
          p.line(...A, ...B, COLORS.green, { width: 5 });
          p.line(...C, ...A, COLORS.yellow, { width: 2 });
          p.line(...C, ...B, COLORS.yellow, { width: 2 });
          name(p, 'kA', A, 'A'); name(p, 'kB', B, 'B'); name(p, 'kC', C, 'C');
          p.handle(...B, COLORS.green, drag(sc, 'b'));
        },
      },
    );
  },

  steps: [
    {
      title: { en: 'A goal seen from the circle', ru: 'Ворота, видимые с окружности' },
      text: {
        en: 'A goal $AB$ and a player $C$ who may run only along the circle. At what angle does he see the goal? Drag $C$ along the arc: the angle does not change at all. An angle with its vertex on the circle and its sides through two points of it is called <b>inscribed</b> — and all inscribed angles on the same arc are equal.',
        ru: 'Ворота $AB$ и игрок $C$, который может бегать только по окружности. Под каким углом он видит ворота? Тяните $C$ по дуге: угол не меняется вовсе. Угол с вершиной на окружности, стороны которого проходят через две её точки, называют <b>вписанным</b> — и все вписанные углы, опирающиеся на одну дугу, равны.',
      },
      try: { en: 'Move $C$, then move the goalposts.', ru: 'Двигайте $C$, потом штанги ворот.' },
      state: { show: ['goal'], params: { a: 200, b: 320, c: 100 }, window: VIEW, controls: [] },
    },
    {
      title: { en: 'Half of the central angle', ru: 'Половина центрального' },
      text: {
        en: 'From the centre $O$ the goal is seen at the <span class="c-purple">central angle</span> $AOB$. Compare: the inscribed angle is always exactly <b>half</b> of it. That is why it does not depend on $C$ — the central angle does not know where $C$ is.',
        ru: 'Из центра $O$ ворота видны под <span class="c-purple">центральным углом</span> $AOB$. Сравните: вписанный угол всегда ровно <b>половина</b> центрального. Поэтому он и не зависит от $C$ — центральный угол ничего не знает о том, где $C$.',
      },
      check: {
        q: { en: 'The central angle is $140°$. The inscribed one on the same arc?', ru: 'Центральный угол $140°$. Вписанный на ту же дугу?' },
        options: [{ text: '$70°$', ok: true }, { text: '$140°$' }, { text: '$280°$' }],
        explain: { en: 'Half: $70°$. Wherever $C$ is on the big arc.', ru: 'Половина: $70°$. Где бы ни был $C$ на большой дуге.' },
      },
      state: { show: ['goal', 'central'], params: { a: 200, b: 320, c: 100 }, window: VIEW, controls: [] },
    },
    {
      proof: true,
      statement: {
        en: '<b>Theorem.</b> An inscribed angle is half of the central angle on the same arc.',
        ru: '<b>Теорема.</b> Вписанный угол равен половине центрального угла, опирающегося на ту же дугу.',
      },
      title: { en: 'One isosceles triangle', ru: 'Один равнобедренный треугольник' },
      text: {
        en: 'First let the side $CA$ pass through the centre. $OC = OB$ — both are radii — so the <span class="c-blue">triangle $OCB$</span> is isosceles, and its angles at $C$ and $B$ are equal: call them $x$. The angle $AOB$ is the exterior angle of this triangle, so it is the sum of the two far angles: $x + x = 2x$. In general draw the diameter through $C$: the inscribed angle splits into two such cases (sum or difference), and so does the central one. $\\blacksquare$',
        ru: 'Сначала пусть сторона $CA$ проходит через центр. $OC = OB$ — оба радиусы, — поэтому <span class="c-blue">треугольник $OCB$</span> равнобедренный, и углы при $C$ и $B$ у него равны: назовём их $x$. Угол $AOB$ — внешний угол этого треугольника, значит, он равен сумме двух не смежных с ним: $x + x = 2x$. В общем случае проведём диаметр через $C$: вписанный угол разбивается на два таких случая (сумма или разность), и центральный тоже. $\\blacksquare$',
      },
      state: { show: ['proof'], params: { b: 330, c: 110 }, window: VIEW, controls: [] },
    },
    {
      title: { en: 'On a diameter: a right angle', ru: 'На диаметр — прямой угол' },
      text: {
        en: 'When $AB$ is a diameter, the central angle is a straight one, $180°$, so every inscribed angle on it is $90°$. That is how a carpenter checks a semicircular hole: the corner of a set square fits into it at every point. And how to find the centre of a round plate: two right angles give two diameters.',
        ru: 'Когда $AB$ — диаметр, центральный угол развёрнутый, $180°$, поэтому любой вписанный угол, опирающийся на него, равен $90°$. Так столяр проверяет полукруглый вырез: угол наугольника входит в него в любой точке. И так находят центр круглой тарелки: два прямых угла дают два диаметра.',
      },
      try: { en: 'Drag $C$ around: the corner is always right.', ru: 'Тяните $C$: угол всегда прямой.' },
      state: { show: ['thales'], params: { c: 60 }, window: VIEW, controls: [] },
    },
    {
      title: { en: 'A goal at 30°', ru: 'Ворота под углом 30°' },
      text: {
        en: 'The player stands at $C$. Move the post $B$ along the circle so that he sees the goal $AB$ at exactly $30°$.',
        ru: 'Игрок стоит в $C$. Передвиньте штангу $B$ по окружности так, чтобы он видел ворота $AB$ ровно под углом $30°$.',
      },
      task: {
        kind: 'drag',
        target: { b: 260 },
        ok: s => Math.abs(angle(on(90), on(200), on(s.b)) - 30) < 0.6,
        back: 1,
        right: {
          en: 'The central angle $AOB$ is $60°$: $B$ is $60°$ away from $A$ along the arc — the inscribed $30°$ is half of it.',
          ru: 'Центральный угол $AOB$ равен $60°$: $B$ в $60°$ от $A$ по дуге, — а вписанный $30°$ — его половина.',
        },
        mistakes: [
          { when: s => Math.abs(s.b - 230) <= 1 || Math.abs(s.b - 170) <= 1, text: { en: 'Here the <b>central</b> angle is $30°$, and $C$ sees only $15°$. The central one must be twice the inscribed.', ru: 'Здесь $30°$ — <b>центральный</b> угол, а из $C$ видно только $15°$. Центральный должен быть вдвое больше вписанного.' } },
        ],
        hint: s => {
          const v = angle(on(90), on(200), on(s.b));
          return v < 30 ? { en: `Now $${Math.round(v)}°$: widen the goal.`, ru: `Сейчас $${Math.round(v)}°$: раздвиньте ворота.` } : { en: `Now $${Math.round(v)}°$: narrow the goal.`, ru: `Сейчас $${Math.round(v)}°$: сузьте ворота.` };
        },
      },
      state: { show: ['task'], params: { b: 330 }, window: VIEW, controls: [] },
    },
  ],
};
