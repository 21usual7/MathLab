// Congruent triangles: two triangles are equal when one can be laid exactly on the other. Three sticks make a
// rigid frame while four sticks wobble — that is the side-side-side test. Two sticks on a hinge are fixed by
// the angle between them (side-angle-side), a stick with two rays by its two angles (angle-side-angle).
// Two sides and an angle not between them can close in two ways: there is no such test.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';

const WHITE = '#ffffff';
const DEG = Math.PI / 180;
const VIEW = { cx: 0, cy: 1.5, unit: 60, fit: [10, 5] };
const r2 = v => fmt(Math.round(v * 100) / 100);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const polar = (P, r, t) => [P[0] + r * Math.cos(t), P[1] + r * Math.sin(t)];
const dist = (P, Q) => Math.hypot(Q[0] - P[0], Q[1] - P[1]);

// The points where the circles (P, r) and (Q, s) meet, the upper one first (none if they miss)
export function meet(P, r, Q, s) {
  const d = dist(P, Q);
  if (d > r + s + 1e-9 || d < Math.abs(r - s) - 1e-9) return [];
  const a = (r * r - s * s + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r * r - a * a));
  const u = [(Q[0] - P[0]) / d, (Q[1] - P[1]) / d], M = [P[0] + a * u[0], P[1] + a * u[1]];
  return [[M[0] - h * u[1], M[1] + h * u[0]], [M[0] + h * u[1], M[1] - h * u[0]]];
}

const stick = (p, P, Q, color) => { p.line(...P, ...Q, color, { width: 5 }); p.dot(...P, WHITE, 4); p.dot(...Q, WHITE, 4); };
const tri = (p, T, color, fill) => { p.fill(T, fill); p.polyline([...T, T[0]], color, 2.5); };

// The model triangle and where it should go: turned by 150° and moved
const T0 = [[-4.2, 0], [-1.2, 0], [-3.4, 2.2]];
const center = T => [(T[0][0] + T[1][0] + T[2][0]) / 3, (T[0][1] + T[1][1] + T[2][1]) / 3];
function place(T, m) {
  const c = center(T), th = 150 * DEG * m, sh = [5.6 * m, 0.6 * m];
  return T.map(([x, y]) => {
    const u = x - c[0], v = y - c[1];
    return [c[0] + sh[0] + u * Math.cos(th) - v * Math.sin(th), c[1] + sh[1] + u * Math.sin(th) + v * Math.cos(th)];
  });
}

export default {
  view: '2d',
  view2d: VIEW,
  lab: false,

  setup(scene) {
    scene.ensureParam('m', 0, { min: 0, max: 1, step: 0.01 }); // how far the copy has travelled
    scene.ensureParam('w', 70, { min: 35, max: 125, step: 1 }); // the wobble of the four-stick frame
    scene.ensureParam('g', 60, { min: 15, max: 165, step: 1 }); // the hinge angle

    scene.custom.push(
      {
        // The cardboard copy laid on the place of the other triangle
        id: 'lay',
        draw2d(p, sc, s) {
          tri(p, place(T0, 1), COLORS.green, COLORS.green + '22');
          tri(p, place(T0, s.m), COLORS.yellow, COLORS.yellow + '44');
        },
        legend: () => `AB = ${r2(dist(T0[0], T0[1]))},\\quad BC = ${r2(dist(T0[1], T0[2]))},\\quad CA = ${r2(dist(T0[2], T0[0]))}`,
      },
      {
        // Four sticks wobble, three do not
        id: 'frames',
        draw2d(p, sc, s) {
          const A = [-4.5, 0], B = [-1.5, 0], D = polar(A, 2, s.w * DEG), C = meet(B, 2, D, 3).sort((P, Q) => Q[1] - P[1])[0]; // the frame that does not cross itself
          if (C) { stick(p, A, B, COLORS.blue); stick(p, B, C, COLORS.blue); stick(p, C, D, COLORS.blue); stick(p, D, A, COLORS.blue); }
          const P = [1, 0], Q = [4.5, 0], R = meet(P, 2.6, Q, 2.4)[0];
          stick(p, P, Q, COLORS.green); stick(p, Q, R, COLORS.green); stick(p, R, P, COLORS.green);
          p.handle(...D, COLORS.blue, (x, y) => sc.setParam('w', clamp(Math.round(Math.atan2(y - A[1], x - A[0]) / DEG), 35, 125)));
        },
      },
      {
        // Two sticks on a hinge: the angle between them decides the third side
        id: 'hinge',
        draw2d(p, sc, s) {
          const C = [-1.5, 0], A = [2.5, 0], B = polar(C, 3, s.g * DEG);
          p.line(...A, ...B, COLORS.red, { width: 2.5, dash: [6, 5] });
          stick(p, C, A, COLORS.blue); stick(p, C, B, COLORS.green);
          p.param(t => C[0] + 0.5 * Math.cos(t), t => 0.5 * Math.sin(t), 0, s.g * DEG, COLORS.yellow, 3);
          p.tex('hg', `${s.g}°`, ...polar(C, 0.85, s.g * DEG / 2), COLORS.yellow, { dx: 0, dy: 0, align: 'center' });
          p.handle(...B, COLORS.green, (x, y) => sc.setParam('g', clamp(Math.round(Math.atan2(y - C[1], x - C[0]) / DEG), 15, 165)));
        },
        legend: s => `\\blue{4},\\ \\green{3},\\ \\yellow{${s.g}°} \\ \\Rightarrow\\ \\red{AB = ${r2(dist([2.5, 0], polar([-1.5, 0], 3, s.g * DEG)))}}`,
      },
      {
        // A side and the two angles at its ends: the two rays meet in one point
        id: 'asa',
        draw2d(p, sc, s) {
          const A = [-2.5, 0], B = [2.5, 0], a = s.g * DEG, b = 45 * DEG;
          p.line(...A, ...polar(A, 9, a), COLORS.yellow, { width: 2, extend: false });
          p.line(...B, ...polar(B, 9, Math.PI - b), COLORS.green, { width: 2 });
          stick(p, A, B, COLORS.blue);
          const ac = 5 * Math.sin(b) / Math.sin(a + b);
          if (s.g + 45 < 180) { const C = polar(A, ac, a); p.dot(...C, COLORS.red, 7); p.polyline([A, C, B], WHITE, 2); }
          p.handle(...polar(A, 2, a), COLORS.yellow, (x, y) => sc.setParam('g', clamp(Math.round(Math.atan2(y, x - A[0]) / DEG), 15, 165)));
        },
        legend: s => (s.g + 45 < 180 ? `\\yellow{${s.g}°} + \\green{45°} < 180° \\Rightarrow \\text{${t({ en: 'one point', ru: 'одна точка' })}}` : `\\yellow{${s.g}°} + \\green{45°} \\ge 180°`),
      },
      {
        // Two sides and an angle not between them: the circle cuts the ray twice
        id: 'ssa',
        draw2d(p, sc, s) {
          const A = [-4, 0], C = polar(A, 4, 40 * DEG), ray = x => [A[0] + x, 0];
          p.line(...A, 5.5, 0, COLORS.yellow, { width: 2 });
          p.param(t => C[0] + 3 * Math.cos(t), t => C[1] + 3 * Math.sin(t), 0, 2 * Math.PI, COLORS.green + '55', 1.5);
          stick(p, A, C, COLORS.blue);
          // B on the ray at distance 3 from C: |A + t − C| = 3
          const dx = C[0] - A[0], dy = C[1], disc = 9 - dy * dy;
          [dx - Math.sqrt(disc), dx + Math.sqrt(disc)].forEach((x, i) => {
            const B = ray(x);
            p.fill([A, B, C], (i ? COLORS.purple : COLORS.red) + '22');
            p.line(...C, ...B, i ? COLORS.purple : COLORS.red, { width: 4 });
            p.dot(...B, i ? COLORS.purple : COLORS.red, 6);
          });
          p.param(t => A[0] + 0.6 * Math.cos(t), t => 0.6 * Math.sin(t), 0, 40 * DEG, COLORS.yellow, 3);
          p.tex('sa', '40°', ...polar(A, 0.95, 20 * DEG), COLORS.yellow, { dx: 0, dy: 0, align: 'center' });
        },
      },
      {
        // The task: the hinge must give the same third side as the model with 4, 3 and 60°
        id: 'copy',
        draw2d(p, sc, s) {
          const C = [-6.4, 0], A = polar(C, 4, 0), B = polar(C, 3, 60 * DEG);
          tri(p, [C, A, B], WHITE + 'aa', 'rgba(255,255,255,0.06)');
          p.tex('mm', `\\text{${t({ en: 'model', ru: 'образец' })}}`, C[0] + 2, -0.1, '#b9c1cd', { dx: 0, dy: 18, align: 'center' });
          p.tex('ml', `${r2(Math.sqrt(13))}`, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2, COLORS.red, { dx: 8, dy: -6 });
          const H = [0, 0], E = [4, 0], F = polar(H, 3, s.g * DEG);
          p.line(...E, ...F, COLORS.red, { width: 2.5, dash: [6, 5] });
          stick(p, H, E, COLORS.blue); stick(p, H, F, COLORS.green);
          p.handle(...F, COLORS.green, (x, y) => sc.setParam('g', clamp(Math.round(Math.atan2(y, x) / DEG), 15, 165)));
        },
        legend: s => `\\red{${r2(dist([4, 0], polar([0, 0], 3, s.g * DEG)))}},\\quad \\text{${t({ en: 'model:', ru: 'у образца:' })}}\\ ${r2(Math.sqrt(13))}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'Equal means: lies exactly on top', ru: 'Равные — значит, совпадают при наложении' },
      text: {
        en: 'Cut a triangle out of cardboard and carry it to the other one: turn it, slide it, and it covers the other exactly. Such triangles are called <b>equal</b> (congruent): all their sides and all their angles match. Checking all six numbers is tedious — the tests below need only three.',
        ru: 'Вырежем треугольник из картона и перенесём на место другого: повернём, сдвинем — и он закрывает его в точности. Такие треугольники называют <b>равными</b>: у них совпадают все стороны и все углы. Проверять все шесть чисел долго — признаки ниже обходятся тремя.',
      },
      try: { en: 'Press ▶ next to $m$.', ru: 'Нажмите ▶ возле $m$.' },
      state: { show: ['lay'], params: { m: 0 }, window: VIEW, controls: ['m'] },
      enter(scene) { scene.setParam('m', 0); scene.animateParams({ m: 1 }, 2500); },
    },
    {
      title: { en: 'Three sticks are rigid', ru: 'Три палочки — жёсткие' },
      text: {
        en: 'Join four sticks with nails: the frame wobbles — pull the blue corner. Join three: it does not move at all. Three sides leave the triangle no freedom, so <b>two triangles with the same three sides are equal</b> (the third test, SSS). That is why bridges, cranes and roof trusses are made of triangles.',
        ru: 'Скрепим гвоздями четыре палочки: рамка шатается — потяните синий угол. Скрепим три — она не двигается вовсе. Три стороны не оставляют треугольнику свободы, поэтому <b>треугольники с равными тремя сторонами равны</b> (третий признак). Поэтому мосты, краны и стропила крыш собирают из треугольников.',
      },
      try: { en: 'Press ▶ next to $w$ and watch the frame skew.', ru: 'Нажмите ▶ возле $w$ и смотрите, как рамка перекашивается.' },
      state: { show: ['frames'], params: { w: 80 }, window: VIEW, controls: ['w'] },
    },
    {
      title: { en: 'Two sides and the angle between', ru: 'Две стороны и угол между ними' },
      text: {
        en: 'Two sticks, $4$ and $3$, on a hinge. While the hinge turns, the distance between their free ends changes — but fix the angle and that distance is fixed too. So <b>two sides and the angle between them</b> decide the triangle (the first test, SAS).',
        ru: 'Две палочки, $4$ и $3$, на шарнире. Пока шарнир поворачивается, расстояние между свободными концами меняется — но закрепите угол, и оно тоже закреплено. Значит, <b>две стороны и угол между ними</b> определяют треугольник (первый признак).',
      },
      state: { show: ['hinge'], params: { g: 60 }, window: VIEW, controls: ['g'] },
    },
    {
      title: { en: 'A side and two angles', ru: 'Сторона и два угла' },
      text: {
        en: 'Fix a side and the two angles at its ends: two rays start from the ends and meet in exactly one point. So <b>a side and the two angles next to it</b> decide the triangle (the second test, ASA). If the angles add up to $180°$ or more, the rays never meet — there is no triangle.',
        ru: 'Закрепим сторону и два угла на её концах: из концов выходят два луча, и они встречаются ровно в одной точке. Значит, <b>сторона и два прилежащих к ней угла</b> определяют треугольник (второй признак). Если углы вместе дают $180°$ или больше, лучи не встретятся — треугольника нет.',
      },
      check: {
        q: { en: 'And two sides with an angle <b>not</b> between them?', ru: 'А две стороны и угол <b>не</b> между ними?' },
        options: [{ text: { en: 'not enough', ru: 'не хватает' }, ok: true }, { text: { en: 'enough too', ru: 'тоже достаточно' } }],
        explain: {
          en: 'Look at the next picture: side $4$, angle $40°$, and side $3$ swinging from the far end. It reaches the ray in <b>two</b> places — two different triangles with the same three numbers.',
          ru: 'Посмотрите на следующую картинку: сторона $4$, угол $40°$ и сторона $3$, качающаяся от дальнего конца. Она достаёт до луча в <b>двух</b> местах — два разных треугольника с одинаковыми тремя числами.',
        },
      },
      state: { show: ['asa'], params: { g: 60 }, window: VIEW, controls: ['g'] },
    },
    {
      title: { en: 'The trap: the angle not between', ru: 'Ловушка: угол не между сторонами' },
      text: {
        en: 'Side $4$, angle $40°$ at its end, and a side $3$ from the other end. The green circle shows where the stick of length $3$ can reach: it cuts the ray twice, at the <span class="c-red">red</span> and the <span class="c-purple">purple</span> point. Both triangles have sides $4$ and $3$ and the angle $40°$ — and they are not equal.',
        ru: 'Сторона $4$, угол $40°$ на её конце и сторона $3$ от другого конца. Зелёная окружность — куда может достать палочка длиной $3$: она пересекает луч дважды, в <span class="c-red">красной</span> и <span class="c-purple">фиолетовой</span> точках. У обоих треугольников стороны $4$ и $3$ и угол $40°$ — а они не равны.',
      },
      state: { show: ['ssa'], window: VIEW, controls: [] },
    },
    {
      title: { en: 'Copy the triangle', ru: 'Скопируйте треугольник' },
      text: {
        en: 'The model has sides $4$ and $3$ with $60°$ between them. Turn the hinge so that your triangle is equal to the model.',
        ru: 'У образца стороны $4$ и $3$ и угол $60°$ между ними. Поверните шарнир так, чтобы ваш треугольник был равен образцу.',
      },
      task: {
        kind: 'drag',
        target: { g: 60 },
        tol: 0.5,
        back: 2,
        right: {
          en: 'Same two sides, same angle between them — by the first test the triangles are equal, and the third side is the same $\\sqrt{13} \\approx 3.61$.',
          ru: 'Те же две стороны и тот же угол между ними — по первому признаку треугольники равны, и третья сторона та же: $\\sqrt{13} \\approx 3.61$.',
        },
        mistakes: [
          { params: { g: 120 }, text: { en: 'This is the outer angle: the third side is now $\\sqrt{37} \\approx 6.08$.', ru: 'Это внешний угол: третья сторона теперь $\\sqrt{37} \\approx 6.08$.' } },
        ],
        hints: { g: { en: 'Make the red dashed side as long as the model\'s.', ru: 'Сделайте красную пунктирную сторону такой же, как у образца.' } },
      },
      state: { show: ['copy'], params: { g: 100 }, window: { cx: -1.2, cy: 1.5, unit: 60, fit: [13, 5] }, controls: [] },
    },
  ],
};
