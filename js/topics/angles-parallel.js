// Parallel lines and the angle sum of a triangle. Rails crossed by a road: slide one rail onto the other and
// its angles land on the angles of the other, so corresponding angles are equal, and with vertical angles the
// alternate ones too. Then a line through the apex parallel to the base collects the three angles of a
// triangle into one straight angle: 180°. The exterior angle is the sum of the two far ones.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';

const WHITE = '#ffffff';
const DEG = Math.PI / 180;
const RAILS = { cx: 0, cy: 1, unit: 70, fit: [10, 5] };
const TRI = { cx: 0, cy: 1.6, unit: 60, fit: [10, 5] };
const A = [-3, 0], B = [3, 0];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r0 = v => fmt(Math.round(v));
const dir = (P, Q) => Math.atan2(Q[1] - P[1], Q[0] - P[0]);
const angleDeg = (V, P, Q) => { let d = (dir(V, Q) - dir(V, P)) / DEG; d = ((d % 360) + 360) % 360; return d > 180 ? 360 - d : d; };

// An arc at the vertex V counterclockwise from direction t0 to t1 (radians), with a label in the middle
function arc(p, V, t0, t1, r, color, key, label) {
  const T = 2 * Math.PI;
  t0 = ((t0 % T) + T) % T; t1 = ((t1 % T) + T) % T;
  if (t1 < t0) t1 += T;
  p.param(t => V[0] + r * Math.cos(t), t => V[1] + r * Math.sin(t), t0, t1, color, 3);
  if (label) {
    const m = (t0 + t1) / 2;
    p.tex(key, label, V[0] + (r + 0.32) * Math.cos(m), V[1] + (r + 0.32) * Math.sin(m), color, { dx: 0, dy: 0, align: 'center' });
  }
}

// The four angles at a crossing of a horizontal line with the road at angle φ: two of φ, two of 180° − φ
function crossing(p, V, phi, key, labels = true) {
  const a = phi * DEG;
  arc(p, V, 0, a, 0.42, COLORS.yellow, key + 'y1', labels && `${r0(phi)}°`);
  arc(p, V, a, Math.PI, 0.32, COLORS.blue, key + 'b1', labels && `${r0(180 - phi)}°`);
  arc(p, V, Math.PI, Math.PI + a, 0.42, COLORS.yellow, key + 'y2');
  arc(p, V, Math.PI + a, 2 * Math.PI, 0.32, COLORS.blue, key + 'b2');
}

// The apex C of the triangle on base AB, from the base angles
export function apex(a, b) {
  const ac = (B[0] - A[0]) * Math.sin(b * DEG) / Math.sin((a + b) * DEG); // the law of sines
  return [A[0] + ac * Math.cos(a * DEG), ac * Math.sin(a * DEG)];
}

function triangle(p, C) {
  p.fill([A, B, C], 'rgba(255,255,255,0.05)');
  p.polyline([A, B, C, A], WHITE, 2.5);
  p.tex('nA', 'A', ...A, WHITE, { dx: -14, dy: 14 });
  p.tex('nB', 'B', ...B, WHITE, { dx: 6, dy: 14 });
  p.tex('nC', 'C', ...C, WHITE, { dx: -4, dy: -14 });
}

export default {
  view: '2d',
  view2d: RAILS,
  lab: false,

  setup(scene) {
    scene.ensureParam('phi', 55, { min: 20, max: 160, step: 1 }); // the road against the rails
    scene.ensureParam('h', 2, { min: 0, max: 2, step: 0.01 }); // the height of the upper rail
    scene.ensureParam('cx', 0.8, { min: -4, max: 4, step: 0.1 });
    scene.ensureParam('cy', 2.6, { min: 0.5, max: 4, step: 0.1 });
    scene.ensureParam('b', 30, { min: 5, max: 130, step: 1 }); // the base angle at B in the task

    scene.custom.push(
      {
        // Two rails and a road; the upper rail slides down onto the lower one
        id: 'rails',
        draw2d(p, sc, s) {
          const a = s.phi * DEG, P2 = [s.h / Math.tan(a), s.h];
          p.line(-6, 0, 6, 0, WHITE, { width: 2.5 });
          p.line(-6, s.h, 6, s.h, WHITE, { width: 2.5 });
          p.line(-3 * Math.cos(a), -3 * Math.sin(a), 6 * Math.cos(a), 6 * Math.sin(a), '#b9c1cd', { width: 2 });
          crossing(p, [0, 0], s.phi, 'lo', s.h > 0.5);
          crossing(p, P2, s.phi, 'hi');
          const E = [4.5 * Math.cos(a), 4.5 * Math.sin(a)];
          p.handle(...E, WHITE, (x, y) => sc.setParam('phi', clamp(Math.round(Math.atan2(y, x) / DEG), 20, 160)));
        },
        legend: s => `\\yellow{${r0(s.phi)}°} + \\blue{${r0(180 - s.phi)}°} = 180°`,
      },
      {
        // The triangle and the line through C parallel to AB, with copies of the angles A and B at C
        id: 'sum',
        draw2d(p, sc, s) {
          const C = [s.cx, s.cy];
          p.line(-6, C[1], 6, C[1], COLORS.purple + 'aa', { width: 1.5, dash: [6, 5] });
          triangle(p, C);
          arc(p, A, 0, dir(A, C), 0.55, COLORS.yellow);
          arc(p, B, dir(B, C), Math.PI, 0.55, COLORS.green);
          arc(p, C, dir(C, A), dir(C, B), 0.45, COLORS.red);
          arc(p, C, Math.PI, dir(C, A), 0.6, COLORS.yellow); // the copies: alternate angles below the parallel line
          arc(p, C, dir(C, B), 2 * Math.PI, 0.6, COLORS.green);
          p.handle(...C, WHITE, (x, y) => { sc.setParam('cx', clamp(Math.round(x * 10) / 10, -4, 4)); sc.setParam('cy', clamp(Math.round(y * 10) / 10, 0.5, 4)); });
        },
        legend: s => {
          const C = [s.cx, s.cy], a = angleDeg(A, B, C), b = angleDeg(B, A, C);
          return `\\yellow{${r0(a)}°} + \\green{${r0(b)}°} + \\red{${r0(180 - a - b)}°} = 180°`;
        },
      },
      {
        // The exterior angle at B: AB goes on past B
        id: 'ext',
        draw2d(p, sc, s) {
          const C = [s.cx, s.cy];
          p.line(...B, 6, 0, WHITE + '88', { width: 2, dash: [6, 5] });
          triangle(p, C);
          arc(p, A, 0, dir(A, C), 0.55, COLORS.yellow);
          arc(p, C, dir(C, A), dir(C, B), 0.45, COLORS.red);
          arc(p, B, 0, dir(B, C), 0.55, COLORS.purple);
          p.handle(...C, WHITE, (x, y) => { sc.setParam('cx', clamp(Math.round(x * 10) / 10, -4, 4)); sc.setParam('cy', clamp(Math.round(y * 10) / 10, 0.5, 4)); });
        },
        legend: s => {
          const C = [s.cx, s.cy], a = angleDeg(A, B, C), c = angleDeg(C, A, B);
          return `\\purple{${r0(180 - angleDeg(B, A, C))}°} = \\yellow{${r0(a)}°} + \\red{${r0(c)}°}`;
        },
      },
      {
        // The task: A = 40° fixed, the side at B is turned until the angle at C is right
        id: 'task',
        draw2d(p, sc, s) {
          const C = apex(40, s.b), d = Math.PI - s.b * DEG;
          triangle(p, C);
          arc(p, A, 0, 40 * DEG, 0.55, COLORS.yellow, 'tA', '40°');
          arc(p, B, d, Math.PI, 0.55, COLORS.green, 'tB', `${s.b}°`);
          const H = [B[0] + 2.2 * Math.cos(d), 2.2 * Math.sin(d)];
          p.handle(...H, COLORS.green, (x, y) => sc.setParam('b', clamp(Math.round(180 - Math.atan2(y, x - B[0]) / DEG), 5, 130)));
        },
        legend: s => `\\angle C = 180° - \\yellow{40°} - \\green{${s.b}°} = \\red{${180 - 40 - s.b}°}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'Rails and a road', ru: 'Рельсы и дорога' },
      text: {
        en: 'Two parallel rails and a road crossing them. At each crossing there are four angles, but only two sizes: the <span class="c-yellow">yellow</span> ones and the <span class="c-blue">blue</span> ones, together a straight angle, $180°$. Now slide the upper rail down: it lands exactly on the lower one, and its angles land on the lower angles. So the angles in the same position at the two crossings — <b>corresponding</b> angles — are equal.',
        ru: 'Два параллельных рельса и дорога поперёк. На каждом перекрёстке четыре угла, но размеров всего два: <span class="c-yellow">жёлтые</span> и <span class="c-blue">синие</span>, вместе — развёрнутый угол, $180°$. Теперь сдвиньте верхний рельс вниз: он ложится точно на нижний, и его углы ложатся на нижние углы. Значит, углы в одинаковом положении на двух перекрёстках — <b>соответственные</b> — равны.',
      },
      try: { en: 'Press ▶ next to $h$, then turn the road by its white handle.', ru: 'Нажмите ▶ возле $h$, потом поверните дорогу за белую ручку.' },
      state: { show: ['rails'], params: { phi: 55, h: 2 }, window: RAILS, controls: ['h'] },
    },
    {
      title: { en: 'Alternate and same-side angles', ru: 'Накрест лежащие и односторонние' },
      text: {
        en: 'Between the rails, on opposite sides of the road, lie the <b>alternate</b> angles: they are the same colour, so they are equal. On the same side of the road between the rails lie the <b>same-side</b> angles: one yellow, one blue, so together $180°$. And back: if alternate angles are equal, the lines are parallel — this is how parallel lines are recognised.',
        ru: 'Между рельсами по разные стороны дороги — <b>накрест лежащие</b> углы: они одного цвета, значит, равны. По одну сторону дороги между рельсами — <b>односторонние</b>: один жёлтый, другой синий, вместе $180°$. И обратно: если накрест лежащие углы равны, прямые параллельны — так параллельность и узнают.',
      },
      check: {
        q: { en: 'One same-side angle is $70°$. The other?', ru: 'Один односторонний угол $70°$. Другой?' },
        options: [{ text: '$110°$', ok: true }, { text: '$70°$' }, { text: '$20°$' }],
        explain: {
          en: 'Same-side angles are one yellow and one blue: $180° - 70° = 110°$. $70°$ would be the alternate angle, and $20°$ is the complement to $90°$, which has nothing to do with it.',
          ru: 'Односторонние — один жёлтый и один синий: $180° - 70° = 110°$. $70°$ — это был бы накрест лежащий, а $20°$ — дополнение до $90°$, тут ни при чём.',
        },
        reveal: scene => scene.animateParams({ phi: 70 }, 900),
      },
      state: { show: ['rails'], params: { phi: 60, h: 2 }, window: RAILS, controls: ['phi'] },
    },
    {
      proof: true,
      statement: {
        en: '<b>Theorem.</b> The angles of any triangle add up to $180°$.',
        ru: '<b>Теорема.</b> Сумма углов любого треугольника равна $180°$.',
      },
      title: { en: 'Three angles on one line', ru: 'Три угла на одной прямой' },
      text: {
        en: 'Draw through $C$ the line parallel to $AB$ (dashed). $AC$ is a road across the two rails, so the <span class="c-yellow">angle $A$</span> reappears at $C$ as an alternate angle; the same for the <span class="c-green">angle $B$</span> along $BC$. At $C$ the yellow, the red and the green angle fill the straight line exactly: $\\angle A + \\angle B + \\angle C = 180°$. $\\blacksquare$',
        ru: 'Проведём через $C$ прямую, параллельную $AB$ (пунктир). $AC$ — дорога поперёк двух рельсов, поэтому <span class="c-yellow">угол $A$</span> повторяется у $C$ как накрест лежащий; так же <span class="c-green">угол $B$</span> вдоль $BC$. У точки $C$ жёлтый, красный и зелёный углы ровно заполняют прямую: $\\angle A + \\angle B + \\angle C = 180°$. $\\blacksquare$',
      },
      try: { en: 'Drag $C$ anywhere: the three angles still make a straight line.', ru: 'Тяните $C$ куда угодно: три угла всё равно складываются в прямую.' },
      state: { show: ['sum'], params: { cx: 0.8, cy: 2.6 }, window: TRI, controls: [] },
    },
    {
      title: { en: 'The exterior angle', ru: 'Внешний угол' },
      text: {
        en: 'Continue $AB$ past $B$. The <span class="c-purple">exterior angle</span> at $B$ and the inner angle at $B$ together make $180°$ — and so do $\\angle B$ with $\\angle A + \\angle C$. So the exterior angle equals the sum of the two angles that are <b>not</b> next to it.',
        ru: 'Продолжим $AB$ за точку $B$. <span class="c-purple">Внешний угол</span> при $B$ вместе с внутренним углом $B$ дают $180°$ — и $\\angle B$ вместе с $\\angle A + \\angle C$ тоже. Значит, внешний угол равен сумме двух углов, <b>не</b> смежных с ним.',
      },
      check: {
        q: { en: '$\\angle A = 35°$, $\\angle C = 75°$. The exterior angle at $B$?', ru: '$\\angle A = 35°$, $\\angle C = 75°$. Внешний угол при $B$?' },
        options: [{ text: '$110°$', ok: true }, { text: '$70°$' }, { text: '$145°$' }],
        explain: {
          en: '$35° + 75° = 110°$. And $70°$ is the inner angle $B$ itself.',
          ru: '$35° + 75° = 110°$. А $70°$ — это сам внутренний угол $B$.',
        },
      },
      state: { show: ['ext'], params: { cx: -0.5, cy: 2.5 }, window: TRI, controls: [] },
    },
    {
      title: { en: 'Make a right angle at C', ru: 'Сделайте прямой угол при C' },
      text: {
        en: 'The angle at $A$ is $40°$. Turn the side at $B$ so that the angle at $C$ becomes exactly $90°$.',
        ru: 'Угол при $A$ равен $40°$. Поверните сторону при $B$ так, чтобы угол при $C$ стал ровно $90°$.',
      },
      task: {
        kind: 'drag',
        target: { b: 50 },
        tol: 0.5,
        back: 2,
        right: {
          en: '$40° + 50° + 90° = 180°$. In a right triangle the two acute angles always add up to $90°$.',
          ru: '$40° + 50° + 90° = 180°$. В прямоугольном треугольнике два острых угла всегда дают вместе $90°$.',
        },
        mistakes: [
          { params: { b: 40 }, text: { en: 'Equal base angles make the triangle isosceles, not right: $C = 100°$.', ru: 'Равные углы при основании делают треугольник равнобедренным, а не прямоугольным: $C = 100°$.' } },
          { params: { b: 90 }, text: { en: 'Now the right angle is at $B$, and $C = 50°$.', ru: 'Теперь прямой угол при $B$, а $C = 50°$.' } },
        ],
        hints: { b: { en: '$\\angle B = 180° - 40° - 90°$.', ru: '$\\angle B = 180° - 40° - 90°$.' } },
      },
      state: { show: ['task'], params: { b: 30 }, window: { cx: 0, cy: 1.8, unit: 60, fit: [9, 5] }, controls: [] },
    },
  ],
};
