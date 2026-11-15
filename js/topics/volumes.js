// Volumes. A stack of paper sheets keeps its volume when it is pushed sideways (Cavalieri): a prism or a
// cylinder is base times height, slanted or not. A cube splits into three equal pyramids with a common apex,
// so a pyramid is a third of its prism, and a cone a third of its cylinder. Archimedes: a ball and a cone
// together fill the cylinder around the ball.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { polyhedron, add, mul } from '../core/geom.js';

const CAMERA = [7, -6, 4.5];
const EDGE = '#c9d1dc';
const r2 = v => fmt(Math.round(v * 100) / 100);
const SHEETS = 14;

// The three pyramids that fill the cube [0, s]³ — apex P = (0, 0, s), bases on the three faces away from P
export function thirds(s = 2.4) {
  const P = [0, 0, s];
  return [
    { base: [[s, 0, 0], [s, s, 0], [s, s, s], [s, 0, s]], out: [1, 0, 0] },
    { base: [[0, s, 0], [s, s, 0], [s, s, s], [0, s, s]], out: [0, 1, 0] },
    { base: [[0, 0, 0], [s, 0, 0], [s, s, 0], [0, s, 0]], out: [0, 0, -1] },
  ].map(({ base, out }) => ({ P, base, out }));
}
const pyr = (P, base) => polyhedron({ A: base[0], B: base[1], C: base[2], D: base[3], S: P }, [['A', 'B', 'C', 'D'], ['A', 'B', 'S'], ['B', 'C', 'S'], ['C', 'D', 'S'], ['D', 'A', 'S']]);
const circle = (c, r, z, n = 64) => Array.from({ length: n + 1 }, (_, i) => [c[0] + r * Math.cos(2 * Math.PI * i / n), c[1] + r * Math.sin(2 * Math.PI * i / n), z]);

export default {
  view: '3d',
  view3d: { R: 4, zmax: 4, camera: CAMERA, axes: false },
  lab: false,

  setup(scene) {
    scene.ensureParam('shear', 0, { min: 0, max: 2, step: 0.01 });
    scene.ensureParam('m', 0, { min: 0, max: 1, step: 0.01 });
    scene.ensureParam('h', 0.3, { min: 0, max: 1 }); // the apex of the pyramid in the task, as part of its rod

    scene.custom.push(
      {
        // A stack of sheets 2 × 2, pushed sideways
        id: 'stack',
        draw3d(p, sc, s) {
          for (let i = 0; i <= SHEETS; i++) {
            const z = -1.5 + 3 * i / SHEETS, dx = s.shear * i / SHEETS - 1;
            p.polygon(`stack:${i}`, [[dx, -1, z], [dx + 2, -1, z], [dx + 2, 1, z], [dx, 1, z]], COLORS.yellow, { opacity: 0.12, outline: i === 0 || i === SHEETS });
          }
          [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([x, y], i) => p.segment(`stack:e${i}`, [x, y, -1.5], [x + s.shear, y, 1.5], COLORS.yellow, { radius: 0.02 }));
        },
        legend: () => 'V = S \\cdot h = 4 \\cdot 3 = 12',
      },
      {
        // The cube cut into three pyramids that move apart
        id: 'thirds',
        draw3d(p, sc, s) {
          const colors = [COLORS.blue, COLORS.green, COLORS.orange];
          thirds().forEach(({ P, base, out }, i) => {
            const d = mul(out, 1.1 * s.m), shift = q => add(add(q, d), [-1.2, -1.2, -1.2]);
            p.polyhedron(`thirds:${i}`, pyr(shift(P), base.map(shift)), colors[i], { fill: 0.22, labels: false });
          });
        },
        legend: () => '3\\,V_{\\triangle} = V_{\\square} \\ \\Rightarrow\\ V_{\\triangle} = \\tfrac13\\,S\\,h',
      },
      {
        // A ball of radius 1.3 in its cylinder, and the cone with the same base and height
        id: 'archimedes',
        draw3d(p) {
          const r = 1.3, L = [-1.8, 0], Rr = [1.8, 0];
          [L, Rr].forEach((c, k) => {
            p.tube(`arch:b${k}`, circle(c, r, -r), EDGE, 0.02);
            p.tube(`arch:t${k}`, circle(c, r, r), EDGE, 0.02);
            [0, Math.PI].forEach((a, j) => p.segment(`arch:s${k}${j}`, [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), -r], [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), r], EDGE, { radius: 0.02 }));
          });
          p.sphere('arch:ball', [L[0], L[1], 0], COLORS.blue, r);
          [0, Math.PI / 2, Math.PI, 1.5 * Math.PI].forEach((a, j) => p.segment(`arch:c${j}`, [Rr[0] + r * Math.cos(a), Rr[1] + r * Math.sin(a), -r], [Rr[0], Rr[1], r], COLORS.orange, { radius: 0.03 }));
          p.tube('arch:cb', circle(Rr, r, -r), COLORS.orange, 0.03);
        },
        legend: () => '\\blue{\\tfrac43\\pi r^3} + \\orange{\\tfrac23\\pi r^3} = 2\\pi r^3 = \\pi r^2 \\cdot 2r',
      },
      {
        // The task: a pyramid on a 3 × 3 base, its apex dragged up a rod
        id: 'apex',
        draw3d(p, sc, s) {
          const H = 0.3 + 5.2 * s.h, z = -1.5;
          const base = [[-1.5, -1.5, z], [1.5, -1.5, z], [1.5, 1.5, z], [-1.5, 1.5, z]];
          p.polyhedron('apex:p', pyr([0, 0, z + H], base), EDGE, { labels: false });
          p.handle('apex:S', [0, 0, z + 0.3], [0, 0, z + 5.5], s.h, COLORS.yellow, v => sc.setParam('h', v), 'S');
        },
        legend: s => `H = ${r2(0.3 + 5.2 * s.h)}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'A stack of paper', ru: 'Стопка бумаги' },
      text: {
        en: 'A stack of sheets $2 \\times 2$, $3$ high. Push it sideways: it leans, but every sheet is still the same sheet, so the volume does not change. The volume of a stack is the area of a sheet times the height: $V = S \\cdot h$. This is true for every prism and every cylinder (a stack of coins), upright or slanted — only the height counts, not the slanted side.',
        ru: 'Стопка листов $2 \\times 2$ высотой $3$. Сдвинем её вбок: она наклоняется, но каждый лист остаётся тем же листом, поэтому объём не меняется. Объём стопки — площадь листа, умноженная на высоту: $V = S \\cdot h$. Так для любой призмы и любого цилиндра (стопка монет), прямых и наклонных: важна только высота, а не наклонная сторона.',
      },
      try: { en: 'Press ▶ next to the slider.', ru: 'Нажмите ▶ возле ползунка.' },
      state: { show: ['stack'], params: { shear: 0 }, camera: CAMERA, controls: ['shear'] },
    },
    {
      proof: true,
      statement: { en: '<b>Volume of a pyramid.</b> $V = \\frac13\\,S h$.', ru: '<b>Объём пирамиды.</b> $V = \\frac13\\,S h$.' },
      title: { en: 'Three pyramids in a cube', ru: 'Три пирамиды в кубе' },
      text: {
        en: 'Take one corner of a cube as a common apex and join it to the three faces that do not touch that corner. The cube falls apart into three pyramids. Each has a face of the cube as its base and the edge as its height, and the three are equal — move them apart and compare. So each is a third: $V = \\frac13 S h$. With the stack argument this extends to any pyramid with the same base and height, and to a cone: a third of its cylinder. $\\blacksquare$',
        ru: 'Возьмём один угол куба общей вершиной и соединим его с тремя гранями, которые этого угла не касаются. Куб распадается на три пирамиды. У каждой основание — грань куба, а высота — ребро, и все три равны — раздвиньте их и сравните. Значит, каждая — треть: $V = \\frac13 S h$. Вместе с рассуждением о стопке это переносится на любую пирамиду с тем же основанием и высотой, и на конус: треть своего цилиндра. $\\blacksquare$',
      },
      try: { en: 'Press ▶ next to $m$.', ru: 'Нажмите ▶ возле $m$.' },
      state: { show: ['thirds'], params: { m: 0 }, camera: [7, -5, 5], controls: ['m'] },
      enter(scene) { scene.setParam('m', 0); scene.animateParams({ m: 1 }, 2500); },
    },
    {
      title: { en: 'Archimedes\' ball', ru: 'Шар Архимеда' },
      text: {
        en: 'Put a ball of radius $r$ into a cylinder that just holds it: height $2r$, volume $\\pi r^2 \\cdot 2r = 2\\pi r^3$. The cone with the same base and height is a third: $\\frac23\\pi r^3$. Archimedes found that the ball takes exactly what the cone leaves: $\\frac43\\pi r^3$. Ball plus cone fill the cylinder — he asked for this picture on his tombstone.',
        ru: 'Положим шар радиуса $r$ в цилиндр, в который он входит впритык: высота $2r$, объём $\\pi r^2 \\cdot 2r = 2\\pi r^3$. Конус с тем же основанием и высотой — треть: $\\frac23\\pi r^3$. Архимед нашёл, что шар занимает ровно то, что оставляет конус: $\\frac43\\pi r^3$. Шар и конус вместе заполняют цилиндр — эту картинку он завещал выбить на своём надгробии.',
      },
      check: {
        q: { en: 'A ball of radius $3$. Its volume?', ru: 'Шар радиуса $3$. Его объём?' },
        options: [{ text: '$36\\pi$', ok: true }, { text: '$12\\pi$' }, { text: '$27\\pi$' }],
        explain: {
          en: '$\\frac43 \\pi \\cdot 27 = 36\\pi \\approx 113$. $12\\pi$ is $\\frac43\\pi \\cdot 9$ — the radius squared instead of cubed.',
          ru: '$\\frac43 \\pi \\cdot 27 = 36\\pi \\approx 113$. $12\\pi$ — это $\\frac43\\pi \\cdot 9$: радиус в квадрате вместо куба.',
        },
      },
      state: { show: ['archimedes'], camera: [3, -8, 3], controls: [] },
    },
    {
      title: { en: 'A pyramid of volume 9', ru: 'Пирамида объёма 9' },
      text: {
        en: 'The base is a square $3 \\times 3$. Raise the apex $S$ so that the volume of the pyramid is exactly $9$.',
        ru: 'Основание — квадрат $3 \\times 3$. Поднимите вершину $S$ так, чтобы объём пирамиды был ровно $9$.',
      },
      task: {
        kind: 'drag',
        target: { h: (3 - 0.3) / 5.2 },
        tol: 0.006,
        back: 1,
        right: {
          en: '$\\frac13 \\cdot 9 \\cdot H = 9$, so $H = 3$ — the same as the side of the base. Such a pyramid is a third of the cube $3 \\times 3 \\times 3$.',
          ru: '$\\frac13 \\cdot 9 \\cdot H = 9$, значит, $H = 3$ — столько же, сколько сторона основания. Такая пирамида — треть куба $3 \\times 3 \\times 3$.',
        },
        mistakes: [
          { params: { h: (1 - 0.3) / 5.2 }, text: { en: '$9 \\cdot 1 = 9$ is the prism. The pyramid is a third of it — it needs three times the height.', ru: '$9 \\cdot 1 = 9$ — это призма. Пирамида — её треть, ей нужна втрое большая высота.' } },
        ],
        hints: { h: { en: '$V = \\frac13 \\cdot 9 \\cdot H = 3H$.', ru: '$V = \\frac13 \\cdot 9 \\cdot H = 3H$.' } },
      },
      state: { show: ['apex'], params: { h: 0.05 }, camera: [8, -6, 3.5], controls: [] },
    },
  ],
};
