// Solving any triangle. Pythagoras fails once the angle is not right: two sticks on a hinge give
// c² = a² + b² − 2ab·cos γ, proved by one height and the Ferris-wheel coordinates (a cos γ, a sin γ), which
// work for obtuse angles too. The law of sines: a side over the sine of the opposite angle is the diameter
// of the circumscribed circle — an inscribed angle in disguise.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';

const WHITE = '#ffffff';
const DEG = Math.PI / 180;
const VIEW = { cx: 1.5, cy: 1.5, unit: 60, fit: [10, 5.5] };
const r2 = v => fmt(Math.round(v * 100) / 100 + 0);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (P, Q) => Math.hypot(Q[0] - P[0], Q[1] - P[1]);
const dir = (P, Q) => Math.atan2(Q[1] - P[1], Q[0] - P[0]);
const R = 2;

// The third side from two sides and the angle between them
export const third = (a, b, g) => Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(g * DEG));

// The angle at V of the triangle VPQ, in degrees
function angle(V, P, Q) {
  let d = Math.abs(dir(V, P) - dir(V, Q)) / DEG;
  return d > 180 ? 360 - d : d;
}

function hinge(p, sc, s, a, b) {
  const C = [0, 0], A = [b, 0], B = [a * Math.cos(s.gamma * DEG), a * Math.sin(s.gamma * DEG)];
  p.fill([C, A, B], 'rgba(255,255,255,0.05)');
  p.line(...C, ...A, COLORS.green, { width: 4 });
  p.line(...C, ...B, COLORS.blue, { width: 4 });
  p.line(...A, ...B, COLORS.red, { width: 3 });
  p.param(t => 0.5 * Math.cos(t), t => 0.5 * Math.sin(t), 0, s.gamma * DEG, COLORS.yellow, 3);
  p.tex('hg', '\\gamma', 0.8 * Math.cos(s.gamma * DEG / 2), 0.8 * Math.sin(s.gamma * DEG / 2), COLORS.yellow, { dx: 0, dy: 0, align: 'center' });
  p.tex('ha', 'a', B[0] / 2, B[1] / 2, COLORS.blue, { dx: -12, dy: 0, align: 'right' });
  p.tex('hb', 'b', b / 2, 0, COLORS.green, { dx: 0, dy: 16, align: 'center' });
  p.tex('hc', 'c', (A[0] + B[0]) / 2, (A[1] + B[1]) / 2, COLORS.red, { dx: 10, dy: -8 });
  p.handle(...B, COLORS.blue, (x, y) => sc.setParam('gamma', clamp(Math.round(Math.atan2(y, x) / DEG), 10, 170)));
  return { A, B };
}

export default {
  view: '2d',
  view2d: VIEW,
  lab: false,

  setup(scene) {
    scene.ensureParam('gamma', 60, { min: 10, max: 170, step: 1 });
    scene.ensureParam('pa', 220, { min: 0, max: 359, step: 1 }); // the vertices on the circumscribed circle
    scene.ensureParam('pb', 330, { min: 0, max: 359, step: 1 });
    scene.ensureParam('pc', 80, { min: 0, max: 359, step: 1 });

    scene.custom.push(
      {
        id: 'hinge',
        draw2d: (p, sc, s) => hinge(p, sc, s, 3, 4),
        legend: s => {
          const c = third(3, 4, s.gamma);
          return `\\red{c^2} = ${r2(c * c)},\\quad \\blue{a^2} + \\green{b^2} = 25`;
        },
      },
      {
        // The height from B onto the line CA, and the right triangle B H A
        id: 'height',
        draw2d(p, sc, s) {
          const a = 3, H = [a * Math.cos(s.gamma * DEG), 0], B = [H[0], a * Math.sin(s.gamma * DEG)];
          p.line(Math.min(0, H[0]) - 0.3, 0, 4.3, 0, WHITE + '55', { width: 1 });
          p.fill([H, [4, 0], B], COLORS.red + '22');
          p.line(...H, ...B, WHITE, { width: 1.5, dash: [5, 4] });
          p.line(0, -0.3, H[0], -0.3, COLORS.yellow, { width: 3 });
          p.tex('hH', 'H', ...H, WHITE, { dx: 0, dy: 16, align: 'center' });
          p.tex('hx', 'a\\cos\\gamma', H[0] / 2, -0.3, COLORS.yellow, { dx: 0, dy: 16, align: 'center' });
          p.tex('hy', 'a\\sin\\gamma', ...H, WHITE, { dx: 8, dy: -40 });
        },
        legend: s => `\\red{c^2} = ${r2(4 - 3 * Math.cos(s.gamma * DEG))}^2 + ${r2(3 * Math.sin(s.gamma * DEG))}^2 = ${r2(third(3, 4, s.gamma) ** 2)}`,
      },
      {
        // A triangle in its circumscribed circle: each side over the sine of the opposite angle
        id: 'sines',
        draw2d(p, sc, s) {
          const on = d => [R * Math.cos(d * DEG), R * Math.sin(d * DEG)];
          const A = on(s.pa), B = on(s.pb), C = on(s.pc);
          p.param(t => R * Math.cos(t), t => R * Math.sin(t), 0, 2 * Math.PI, 'rgba(255,255,255,0.5)', 2);
          p.dot(0, 0, WHITE, 4);
          p.line(...B, ...C, COLORS.blue, { width: 4 });
          p.line(...C, ...A, COLORS.green, { width: 4 });
          p.line(...A, ...B, COLORS.red, { width: 4 });
          [[A, 'A', 'pa'], [B, 'B', 'pb'], [C, 'C', 'pc']].forEach(([P, n, k]) => {
            p.tex('s' + n, n, P[0] * 1.13, P[1] * 1.13, WHITE, { dx: 0, dy: 0, align: 'center' });
            p.handle(...P, WHITE, (x, y) => sc.setParam(k, ((Math.round(Math.atan2(y, x) / DEG) % 360) + 360) % 360));
          });
        },
        legend: s => {
          const on = d => [R * Math.cos(d * DEG), R * Math.sin(d * DEG)];
          const A = on(s.pa), B = on(s.pb), C = on(s.pc), q = (P, Q, V) => r2(dist(P, Q) / Math.sin(angle(V, P, Q) * DEG));
          return `\\frac{\\blue a}{\\sin A} = ${q(B, C, A)},\\ \\ \\frac{\\green b}{\\sin B} = ${q(C, A, B)},\\ \\ \\frac{\\red c}{\\sin C} = ${q(A, B, C)}`;
        },
      },
      {
        id: 'task',
        draw2d: (p, sc, s) => hinge(p, sc, s, 3, 5),
        legend: s => `\\red{c} = ${r2(third(3, 5, s.gamma))}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'Pythagoras for any angle?', ru: 'Пифагор для любого угла?' },
      text: {
        en: 'Two sticks, $a = 3$ and $b = 4$, on a hinge. At $90°$ the third side is $5$ and $c^2 = a^2 + b^2 = 25$. Close the hinge — $c^2$ is <b>less</b> than $25$; open it — <b>more</b>. Pythagoras needs a correction that depends on the angle.',
        ru: 'Две палочки, $a = 3$ и $b = 4$, на шарнире. При $90°$ третья сторона равна $5$, и $c^2 = a^2 + b^2 = 25$. Закройте шарнир — $c^2$ <b>меньше</b> $25$, откройте — <b>больше</b>. Пифагору нужна поправка, зависящая от угла.',
      },
      try: { en: 'Drag the end of the blue stick.', ru: 'Тяните конец синей палочки.' },
      state: { show: ['hinge'], params: { gamma: 60 }, window: VIEW, controls: ['gamma'] },
    },
    {
      proof: true,
      statement: {
        en: '<b>Law of cosines.</b> $c^2 = a^2 + b^2 - 2ab\\cos\\gamma$.',
        ru: '<b>Теорема косинусов.</b> $c^2 = a^2 + b^2 - 2ab\\cos\\gamma$.',
      },
      title: { en: 'One height and the wheel', ru: 'Одна высота и колесо' },
      text: {
        en: 'Put $C$ at the origin and $CA$ along the axis. The end $B$ of the stick $a$ is at $(a\\cos\\gamma,\\ a\\sin\\gamma)$ — the cabin of a wheel of radius $a$; for an obtuse $\\gamma$ the cosine is negative and $H$ simply goes left. Drop the height $BH$: the <span class="c-red">right triangle $BHA$</span> has legs $b - a\\cos\\gamma$ and $a\\sin\\gamma$. By Pythagoras $$\\begin{gathered} c^2 = (b - a\\cos\\gamma)^2 + a^2\\sin^2\\gamma \\\\ = b^2 - 2ab\\cos\\gamma + a^2(\\cos^2\\gamma + \\sin^2\\gamma), \\end{gathered}$$ and the bracket is $1$. $\\blacksquare$',
        ru: 'Поставим $C$ в начало координат, а $CA$ — вдоль оси. Конец $B$ палочки $a$ — в точке $(a\\cos\\gamma,\\ a\\sin\\gamma)$: это кабинка колеса радиуса $a$; при тупом $\\gamma$ косинус отрицателен, и $H$ просто уходит влево. Опустим высоту $BH$: у <span class="c-red">прямоугольного треугольника $BHA$</span> катеты $b - a\\cos\\gamma$ и $a\\sin\\gamma$. По Пифагору $$\\begin{gathered} c^2 = (b - a\\cos\\gamma)^2 + a^2\\sin^2\\gamma \\\\ = b^2 - 2ab\\cos\\gamma + a^2(\\cos^2\\gamma + \\sin^2\\gamma), \\end{gathered}$$ а скобка равна $1$. $\\blacksquare$',
      },
      check: {
        q: { en: 'At $\\gamma = 90°$ the formula becomes…', ru: 'При $\\gamma = 90°$ формула превращается…' },
        options: [{ text: { en: 'the Pythagorean theorem', ru: 'в теорему Пифагора' }, ok: true }, { text: '$c = a + b$' }, { text: '$c^2 = a^2 + b^2 - 2ab$' }],
        explain: { en: '$\\cos 90° = 0$: the correction disappears, $c^2 = a^2 + b^2$.', ru: '$\\cos 90° = 0$: поправка исчезает, $c^2 = a^2 + b^2$.' },
        reveal: scene => scene.animateParams({ gamma: 90 }, 900),
      },
      state: { show: ['hinge', 'height'], params: { gamma: 120 }, window: { cx: 1, cy: 1.3, unit: 60, fit: [9, 5] }, controls: ['gamma'] },
    },
    {
      title: { en: 'The law of sines', ru: 'Теорема синусов' },
      text: {
        en: 'Any triangle fits into a circle — the circumscribed one, radius $R$. Each side is seen from the opposite vertex at an inscribed angle, and you can slide that vertex until the side over it is a diameter: the angle stays, and in the right triangle you get $a = 2R\\sin A$. So $$\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R.$$ The longest side is always opposite the largest angle.',
        ru: 'Любой треугольник вписывается в окружность — описанную, радиуса $R$. Каждая сторона видна из противоположной вершины под вписанным углом, и эту вершину можно сдвигать по дуге, пока другая сторона не станет диаметром: угол не меняется, а в прямоугольном треугольнике $a = 2R\\sin A$. Значит, $$\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R.$$ Самая длинная сторона всегда лежит против самого большого угла.',
      },
      try: { en: 'Drag the vertices: the three ratios stay equal to $2R = 4$.', ru: 'Тяните вершины: все три отношения остаются равными $2R = 4$.' },
      state: { show: ['sines'], params: { pa: 220, pb: 330, pc: 80 }, window: { cx: 0, cy: 0, unit: 80, fit: [6, 6] }, controls: [] },
    },
    {
      title: { en: 'Open the hinge to 7', ru: 'Раскройте шарнир до 7' },
      text: {
        en: 'Sticks $a = 3$ and $b = 5$. Open the hinge so that the third side is exactly $7$.',
        ru: 'Палочки $a = 3$ и $b = 5$. Раскройте шарнир так, чтобы третья сторона была ровно $7$.',
      },
      task: {
        kind: 'drag',
        target: { gamma: 120 },
        tol: 0.5,
        back: 1,
        right: {
          en: '$49 = 9 + 25 - 30\\cos\\gamma$, so $\\cos\\gamma = -\\frac12$ and $\\gamma = 120°$. A negative cosine — an obtuse angle, the side longer than Pythagoras would give.',
          ru: '$49 = 9 + 25 - 30\\cos\\gamma$, значит, $\\cos\\gamma = -\\frac12$ и $\\gamma = 120°$. Отрицательный косинус — тупой угол, сторона длиннее, чем дал бы Пифагор.',
        },
        mistakes: [
          { params: { gamma: 60 }, text: { en: 'At $60°$ the side is $\\sqrt{19} \\approx 4.36$: $\\cos 60° = +\\frac12$. The minus sign matters.', ru: 'При $60°$ сторона $\\sqrt{19} \\approx 4.36$: $\\cos 60° = +\\frac12$. Знак минус важен.' } },
          { params: { gamma: 90 }, text: { en: 'A right angle gives $\\sqrt{34} \\approx 5.83$ — too short for $7$.', ru: 'Прямой угол даёт $\\sqrt{34} \\approx 5.83$ — мало для $7$.' } },
        ],
        hints: { gamma: { en: 'Watch the red side in the legend.', ru: 'Следите за красной стороной в строке под ползунками.' } },
      },
      state: { show: ['task'], params: { gamma: 40 }, window: { cx: 1.5, cy: 1.5, unit: 60, fit: [10, 5.5] }, controls: [] },
    },
  ],
};
