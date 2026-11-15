// The gradient: the steepest way up. A hill on a hiker's map with level lines; rain that runs down across the
// lines at right angles; a plank laid on the slope in any direction, its steepness is ∇f·u. The proof: near a
// point the slope is a flat board, so the steepness along u is f_x·u_x + f_y·u_y = |∇f|·cos θ — the most along
// ∇f, zero along a level line. Then descent is rain in steps, and a pass is a place where ∇f = 0 without a top.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';
import { paint } from './classify.js';

const r2 = v => fmt(Math.round(v * 100) / 100);
const WIN = { cx: 0, cy: 0, unit: 92 };

// Two hills: a big one in the north-east, a smaller one in the south-west, a pass between them
export const hill = (x, y) => 3 * Math.exp(-((x - 1.2) ** 2 + (y - 0.6) ** 2) / 3) + 2 * Math.exp(-((x + 1.6) ** 2 + (y + 1) ** 2) / 2);
export const grad = (x, y) => {
  const a = 3 * Math.exp(-((x - 1.2) ** 2 + (y - 0.6) ** 2) / 3), b = 2 * Math.exp(-((x + 1.6) ** 2 + (y + 1) ** 2) / 2);
  return [-a * 2 * (x - 1.2) / 3 - b * (x + 1.6), -a * 2 * (y - 0.6) / 3 - b * (y + 1)];
};
// The pass and the tops: where ∇f = 0 (Newton's method from a nearby point, the Hessian by differences)
export function still(x, y) {
  for (let k = 0; k < 40; k++) {
    const g = grad(x, y), h = 1e-5;
    const gx = grad(x + h, y), gy = grad(x, y + h);
    const a = (gx[0] - g[0]) / h, b = (gy[0] - g[0]) / h, c = (gx[1] - g[1]) / h, d = (gy[1] - g[1]) / h, D = a * d - b * c;
    x -= (d * g[0] - b * g[1]) / D;
    y -= (-c * g[0] + a * g[1]) / D;
  }
  return [x, y];
}
export const TOP = still(1.2, 0.6), PASS = still(-0.3, -0.25);

// Heights in 3D: the hill a little lowered into the box
const Z = h => 0.95 * h - 1.4;
const rgbOf = h => { // a hiker's map: green valleys, yellow-brown slopes, pale tops
  const stops = [[0, [40, 92, 60]], [1, [96, 132, 70]], [2, [170, 150, 90]], [3, [210, 205, 190]]];
  const k = Math.max(0, Math.min(2.999, h)), i = Math.floor(k), f = k - i;
  return stops[i][1].map((c, j) => c + (stops[i + 1][1][j] - c) * f);
};
function map(p) {
  paint(p, hill, h => [...rgbOf(h), 150], 6);
  p.contour(hill, '#1b1f16', 12);
}
const dirOf = a => [Math.cos(a), Math.sin(a)];
const steep = (x, y, a) => { const g = grad(x, y), u = dirOf(a); return g[0] * u[0] + g[1] * u[1]; };

// The plank: a segment of the tangent plane along u, lying on the slope; in 3D it is tilted like the ground
function plank3d(p, x, y, a, color = COLORS.yellow, key = 'plank') {
  const u = dirOf(a), m = steep(x, y, a), L = 0.9;
  p.tube(key, [[x - L * u[0], y - L * u[1], Z(hill(x, y) - L * m) + 0.08], [x + L * u[0], y + L * u[1], Z(hill(x, y) + L * m) + 0.08]], color, 0.07);
}

export default {
  view: 'split',
  view2d: WIN,
  view3d: { R: 4, zmax: 4, camera: [-7, -8.5, 6.5], axes: false },
  lab: false,

  setup(scene) {
    scene.ensureParam('hx', -0.4, { min: -3.5, max: 3.5, step: 0.05 }); // the hiker
    scene.ensureParam('hy', 1.6, { min: -3.5, max: 3.5, step: 0.05 });
    scene.ensureParam('a', 0.3, { min: -Math.PI, max: Math.PI, step: 0.01 }); // the direction of the plank
    scene.ensureParam('eta', 0.35, { min: 0.05, max: 1.2, step: 0.01 });

    const hiker = (p, sc, s) => p.handle(s.hx, s.hy, COLORS.red, (x, y) => { sc.setParam('hx', Math.round(x * 20) / 20); sc.setParam('hy', Math.round(y * 20) / 20); });
    const ground = p => {
      p.surface('hill', (x, y) => Z(hill(x, y)), COLORS.green, 72);
    };
    const man = (p, s) => p.sphere('man', [s.hx, s.hy, Z(hill(s.hx, s.hy)) + 0.15], COLORS.red, 0.14);

    scene.custom.push(
      {
        // The map and the hill
        id: 'map',
        draw2d(p, sc, s) { map(p); p.dot(...TOP, '#ffffff', 5); p.tex('top', t({ en: '\\text{top}', ru: '\\text{вершина}' }), ...TOP, '#ffffff', { dx: 8, dy: -12 }); hiker(p, sc, s); },
        draw3d(p, sc, s) { ground(p); man(p, s); },
        legend: s => `\\text{${t({ en: 'height at the hiker', ru: 'высота под туристом' })}: } ${r2(hill(s.hx, s.hy))}`,
      },
      {
        // Rain: drops run downhill; drag over the map to let it rain
        id: 'rain',
        drops: [],
        t: 0,
        draw2d(p, sc, s) {
          map(p);
          const now = performance.now(), dt = Math.min(0.04, (now - (this.t || now)) / 1000);
          this.t = now;
          // The first shower: scattered without a pattern
          const hash = k => { const v = Math.sin(k * 12.9898) * 43758.5453; return v - Math.floor(v); };
          if (!this.drops.length) for (let i = 1; i <= 60; i++) this.drops.push({ trail: [[-3.4 + 6.8 * hash(i), -2.8 + 5.6 * hash(i + 100)]], life: 0 });
          p.pen = pts => { const q = pts[pts.length - 1]; this.drops.push({ trail: [q.slice()], life: 0 }); if (this.drops.length > 160) this.drops.shift(); sc.changed(); };
          let moving = false;
          for (const d of this.drops) {
            const [x, y] = d.trail[d.trail.length - 1], g = grad(x, y), L = Math.hypot(...g);
            if (L > 0.02 && d.life < 12) {
              const v = 0.9 * dt / Math.max(0.35, Math.min(1, L)); // drops slow down a little on gentle ground
              d.trail.push([x - v * g[0], y - v * g[1]]);
              if (d.trail.length > 90) d.trail.shift();
              d.life += dt;
              moving = true;
            }
            p.polyline(d.trail, COLORS.blue + '99', 1.6);
            p.dot(...d.trail[d.trail.length - 1], COLORS.blue, 3);
          }
          if (moving) sc.changed();
        },
        legend: () => `\\text{${t({ en: 'drag over the map — it rains', ru: 'проведите по карте — пойдёт дождь' })}}`,
      },
      {
        // The plank on the slope at the hiker, turned to the angle a; its steepness is the slope in that direction
        id: 'plank',
        draw2d(p, sc, s) {
          map(p);
          const u = dirOf(s.a), m = steep(s.hx, s.hy, s.a);
          p.line(s.hx - 0.9 * u[0], s.hy - 0.9 * u[1], s.hx + 0.9 * u[0], s.hy + 0.9 * u[1], COLORS.yellow, { width: 6 });
          p.tex('m', `${m >= 0 ? '\\nearrow' : '\\searrow'}\\ ${r2(m)}`, s.hx + 0.9 * u[0], s.hy + 0.9 * u[1], COLORS.yellow, { dx: 10, dy: -12 });
          p.handle(s.hx + 0.9 * u[0], s.hy + 0.9 * u[1], COLORS.yellow, (x, y) => sc.setParam('a', Math.atan2(y - s.hy, x - s.hx)));
          hiker(p, sc, s);
        },
        draw3d(p, sc, s) { ground(p); man(p, s); plank3d(p, s.hx, s.hy, s.a); },
        legend: s => `\\text{${t({ en: 'steepness of the plank', ru: 'крутизна доски' })}: } \\yellow{${r2(steep(s.hx, s.hy, s.a))}}`,
      },
      {
        // Two planks, east and north, and the gradient made of their steepness
        id: 'two',
        draw2d(p, sc, s) {
          map(p);
          const g = grad(s.hx, s.hy);
          p.line(s.hx - 0.7, s.hy, s.hx + 0.7, s.hy, COLORS.green, { width: 6 });
          p.line(s.hx, s.hy - 0.7, s.hx, s.hy + 0.7, COLORS.red, { width: 6 });
          p.arrow(s.hx, s.hy, s.hx + g[0], s.hy, COLORS.green, { width: 2, dash: [5, 4] });
          p.arrow(s.hx + g[0], s.hy, s.hx + g[0], s.hy + g[1], COLORS.red, { width: 2, dash: [5, 4] });
          p.arrow(s.hx, s.hy, s.hx + g[0], s.hy + g[1], COLORS.yellow, { width: 3.5 });
          p.tex('g', '\\nabla f', s.hx + g[0], s.hy + g[1], COLORS.yellow, { dx: 10, dy: -12 });
          hiker(p, sc, s);
        },
        draw3d(p, sc, s) { ground(p); man(p, s); plank3d(p, s.hx, s.hy, 0, COLORS.green, 'pe'); plank3d(p, s.hx, s.hy, Math.PI / 2, COLORS.red, 'pn'); },
        legend: s => { const g = grad(s.hx, s.hy); return `\\nabla f = \\left(\\green{\\tfrac{\\partial f}{\\partial x}};\\ \\red{\\tfrac{\\partial f}{\\partial y}}\\right) = (\\green{${r2(g[0])}};\\ \\red{${r2(g[1])}})`; },
      },
      {
        // The proof: the tangent board at the hiker, and the steepness along u as a dot product
        id: 'board',
        draw2d(p, sc, s) {
          map(p);
          const g = grad(s.hx, s.hy), u = dirOf(s.a);
          // The steepness of a plank for every direction: a circle of diameter |∇f| through the hiker (a polar picture of cos θ)
          const pts = Array.from({ length: 121 }, (_, k) => { const b = Math.PI * 2 * k / 120, m = steep(s.hx, s.hy, b); return m > 0 ? [s.hx + m * Math.cos(b), s.hy + m * Math.sin(b)] : [s.hx, s.hy]; });
          p.polyline(pts, COLORS.yellow + '88', 1.5);
          p.arrow(s.hx, s.hy, s.hx + g[0], s.hy + g[1], COLORS.yellow, { width: 3 });
          const m = steep(s.hx, s.hy, s.a);
          p.line(s.hx, s.hy, s.hx + 1.4 * u[0], s.hy + 1.4 * u[1], COLORS.teal, { width: 2.5 });
          if (m > 0) p.line(s.hx + m * u[0], s.hy + m * u[1], s.hx + g[0], s.hy + g[1], 'rgba(255,255,255,0.5)', { width: 1, dash: [4, 4] });
          p.dot(s.hx + Math.max(0, m) * u[0], s.hy + Math.max(0, m) * u[1], COLORS.teal, 5);
          p.handle(s.hx + 1.4 * u[0], s.hy + 1.4 * u[1], COLORS.teal, (x, y) => sc.setParam('a', Math.atan2(y - s.hy, x - s.hx)));
          p.tex('th', `\\theta = ${Math.round(Math.abs(((Math.atan2(g[1], g[0]) - s.a) * 180 / Math.PI + 540) % 360 - 180))}°`, s.hx, s.hy, '#e6e9ef', { dx: -16, dy: 18, align: 'right' });
          hiker(p, sc, s);
        },
        draw3d(p, sc, s) {
          ground(p); man(p, s);
          // The tangent board: f(P) + f_x·dx + f_y·dy over a small square around the hiker
          const g = grad(s.hx, s.hy), h0 = hill(s.hx, s.hy), R = 1.1;
          const c = [[-R, -R], [R, -R], [R, R], [-R, R]].map(([dx, dy]) => [s.hx + dx, s.hy + dy, Z(h0 + g[0] * dx + g[1] * dy) + 0.04]);
          p.polygon('board', c, COLORS.yellow, { opacity: 0.3, outline: false });
          plank3d(p, s.hx, s.hy, s.a, COLORS.teal, 'pu');
        },
        legend: s => { const g = grad(s.hx, s.hy), u = dirOf(s.a); return `\\teal{m} = \\nabla f \\cdot \\vec u = ${r2(g[0])} \\cdot ${r2(u[0])} ${g[1] * u[1] < 0 ? '-' : '+'} ${r2(Math.abs(g[1]))} \\cdot ${r2(Math.abs(u[1]))} = \\teal{${r2(steep(s.hx, s.hy, s.a))}}`; },
      },
      {
        // Gradient descent: rain in steps of size η·|∇f|
        id: 'steps',
        draw2d(p, sc, s) {
          map(p);
          let q = [s.hx, s.hy];
          const path = [q];
          for (let k = 0; k < 25; k++) { const g = grad(...q); q = [q[0] - s.eta * g[0], q[1] - s.eta * g[1]]; path.push(q); }
          p.polyline(path, COLORS.red, 2);
          path.forEach(P => p.dot(...P, COLORS.red, 3.5));
          hiker(p, sc, s);
        },
        draw3d(p, sc, s) {
          ground(p);
          let q = [s.hx, s.hy];
          const pts = [[...q, Z(hill(...q)) + 0.1]];
          for (let k = 0; k < 25; k++) { const g = grad(...q); q = [q[0] - s.eta * g[0], q[1] - s.eta * g[1]]; pts.push([...q, Z(hill(...q)) + 0.1]); }
          p.tube('path', pts, COLORS.red, 0.04);
          pts.forEach((P, i) => p.sphere(`st${i}`, P, COLORS.red, 0.07));
        },
        legend: s => `\\vec x \\leftarrow \\vec x - \\eta\\, \\nabla f, \\qquad \\eta = ${r2(s.eta)}`,
      },
      {
        // The task: the hiker and the zero of the gradient
        id: 'find',
        draw2d(p, sc, s) {
          map(p);
          const g = grad(s.hx, s.hy);
          p.arrow(s.hx, s.hy, s.hx + g[0], s.hy + g[1], COLORS.yellow, { width: 3 });
          hiker(p, sc, s);
        },
        draw3d(p, sc, s) { ground(p); man(p, s); },
        legend: s => { const g = grad(s.hx, s.hy); return `|\\nabla f| = ${r2(Math.hypot(...g))}`; },
      },
    );
  },

  steps: [
    {
      title: { en: 'A hiker\'s map', ru: 'Карта туриста' },
      text: {
        en: 'A function of two variables is a landscape: above every point $(x;\\ y)$ of the ground there is a height $f(x, y)$. Hikers draw it as a <b>map</b>: lines of equal height (level lines), every next line one step higher. Where the lines crowd, the slope is steep; where they are sparse, it is gentle. On the right the same hill in 3D, with the hiker in red.',
        ru: 'Функция двух переменных — это местность: над каждой точкой $(x;\\ y)$ земли есть высота $f(x, y)$. Туристы рисуют её <b>картой</b>: линии одинаковой высоты (горизонтали), каждая следующая на ступеньку выше. Где линии густые — склон крутой, где редкие — пологий. Справа тот же холм в 3D, турист — красный.',
      },
      try: { en: 'Drag the hiker over the map: where is it steep, where flat?', ru: 'Водите туриста по карте: где круто, где ровно?' },
      state: { view: 'split', show: ['map'], params: { hx: -0.4, hy: 1.6 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'Rain', ru: 'Дождь' },
      text: {
        en: 'Let it rain. Every drop runs the fastest way down, and look at the trails: they cross every level line at a <b>right angle</b> and gather in the valleys. Water does not know any formulas — it just feels which way is down. The direction opposite to the drops, the steepest way <b>up</b>, is what mathematicians call the gradient $\\nabla f$.',
        ru: 'Пусть пойдёт дождь. Каждая капля бежит вниз самым быстрым путём — и посмотрите на следы: они пересекают каждую горизонталь под <b>прямым углом</b> и собираются в долинах. Вода не знает формул — она просто чувствует, где низ. Направление против капель, самый крутой путь <b>вверх</b>, математики называют градиентом $\\nabla f$.',
      },
      try: { en: 'Drag over the map with the mouse or a finger: new drops fall where you drag.', ru: 'Проведите по карте мышью или пальцем: новые капли падают там, где вы ведёте.' },
      state: { view: '2d', show: ['rain'], window: WIN, controls: [] },
      enter(scene) { const o = scene.get('rain'); o.drops = []; o.t = 0; },
    },
    {
      title: { en: 'A plank on the slope', ru: 'Доска на склоне' },
      text: {
        en: 'Put a plank on the ground next to the hiker. How steep it is depends on the direction: along the level line it lies flat (steepness $0$), across it — steepest. Its steepness is how much height you gain per step in that direction: the <i>directional derivative</i>. Turn the plank all the way round: the steepness goes up, through zero, down, and back.',
        ru: 'Положим доску на землю рядом с туристом. Насколько она крутая, зависит от направления: вдоль горизонтали лежит ровно (крутизна $0$), поперёк — круче всего. Её крутизна — сколько высоты набираешь за шаг в этом направлении: <i>производная по направлению</i>. Поверните доску полный круг: крутизна растёт, проходит через ноль, становится отрицательной и возвращается.',
      },
      try: { en: 'Turn the plank by its yellow end. Find the steepest direction and the flat one — how far apart are they?', ru: 'Поворачивайте доску за жёлтый конец. Найдите самое крутое направление и ровное — на сколько они расходятся?' },
      check: {
        q: { en: 'The plank lies along a level line. Its steepness?', ru: 'Доска лежит вдоль горизонтали. Её крутизна?' },
        options: [{ text: '$0$', ok: true }, { text: { en: 'The largest', ru: 'Наибольшая' } }, { text: { en: 'Depends on the hill', ru: 'Зависит от холма' } }],
        explain: {
          en: 'Along a level line the height does not change — that is what a level line is. So the steepest direction, at a right angle to the flat one, is across the lines: the drops knew it.',
          ru: 'Вдоль горизонтали высота не меняется — так горизонталь и определена. Значит, самое крутое направление, под прямым углом к ровному, — поперёк линий: капли это знали.',
        },
      },
      state: { view: 'split', show: ['plank'], params: { hx: -0.4, hy: 1.6, a: 0.3 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'The gradient: two planks', ru: 'Градиент: две доски' },
      text: {
        en: 'Two planks are enough to know them all: one east (along $x$), one north (along $y$). Their steepnesses are the partial derivatives $\\frac{\\partial f}{\\partial x}$ and $\\frac{\\partial f}{\\partial y}$ — the slopes of the slices from the topic about surfaces. Put them together as an arrow: $$\\nabla f = \\left(\\tfrac{\\partial f}{\\partial x};\\ \\tfrac{\\partial f}{\\partial y}\\right).$$ This arrow points straight uphill, across the level lines, and the steeper the hill, the longer it is.',
        ru: 'Двух досок хватает, чтобы знать все: одна на восток (вдоль $x$), одна на север (вдоль $y$). Их крутизна — частные производные $\\frac{\\partial f}{\\partial x}$ и $\\frac{\\partial f}{\\partial y}$, наклоны срезов из темы про поверхности. Сложим их в стрелку: $$\\nabla f = \\left(\\tfrac{\\partial f}{\\partial x};\\ \\tfrac{\\partial f}{\\partial y}\\right).$$ Эта стрелка смотрит прямо в гору, поперёк горизонталей, и чем круче склон, тем она длиннее.',
      },
      try: { en: 'Walk the hiker around: on the gentle top the arrow shrinks to nothing.', ru: 'Поводите туриста: на пологой вершине стрелка сжимается в точку.' },
      state: { view: 'split', show: ['two'], params: { hx: -0.4, hy: 1.6 }, window: WIN, controls: [] },
    },
    {
      proof: true,
      statement: {
        en: '<b>Theorem.</b> The steepness in the direction of a unit arrow $\\vec u$ is $\\nabla f \\cdot \\vec u$. So the steepest way up is along $\\nabla f$, its steepness is $|\\nabla f|$, and along a level line it is $0$.',
        ru: '<b>Теорема.</b> Крутизна в направлении единичной стрелки $\\vec u$ равна $\\nabla f \\cdot \\vec u$. Поэтому самый крутой подъём — вдоль $\\nabla f$, его крутизна $|\\nabla f|$, а вдоль горизонтали она равна $0$.',
      },
      title: { en: 'Up close the slope is a board', ru: 'Вблизи склон — доска' },
      text: {
        en: 'Look at the ground right around the hiker: up close a smooth hill is almost flat, a tilted board (yellow, in 3D). A board is simple: a step $dx$ east raises you by $\\frac{\\partial f}{\\partial x}dx$, a step $dy$ north by $\\frac{\\partial f}{\\partial y}dy$, and a slanted step by their sum. A step of length $1$ along $\\vec u = (u_x;\\ u_y)$ raises you by $$\\tfrac{\\partial f}{\\partial x} u_x + \\tfrac{\\partial f}{\\partial y} u_y = \\nabla f \\cdot \\vec u.$$',
        ru: 'Посмотрим на землю прямо вокруг туриста: вблизи гладкий холм почти плоский — наклонная доска (жёлтая, в 3D). С доской всё просто: шаг $dx$ на восток поднимает на $\\frac{\\partial f}{\\partial x}dx$, шаг $dy$ на север — на $\\frac{\\partial f}{\\partial y}dy$, а косой шаг — на их сумму. Шаг длины $1$ вдоль $\\vec u = (u_x;\\ u_y)$ поднимает на $$\\tfrac{\\partial f}{\\partial x} u_x + \\tfrac{\\partial f}{\\partial y} u_y = \\nabla f \\cdot \\vec u.$$',
      },
      state: { view: 'split', show: ['board'], params: { hx: -0.4, hy: 1.6, a: 1.2 }, window: WIN, controls: [] },
    },
    {
      proof: true,
      title: { en: 'The dot product does the rest', ru: 'Остальное делает скалярное произведение' },
      text: {
        en: 'By the dot product, $\\nabla f \\cdot \\vec u = |\\nabla f| \\cdot 1 \\cdot \\cos\\theta$, where $\\theta$ is the angle between the plank and the arrow. The cosine is largest, $1$, at $\\theta = 0$: the steepest way is along $\\nabla f$, steepness $|\\nabla f|$. At $\\theta = 90°$ the cosine is $0$: the flat direction, the level line — at a right angle to the gradient. On the map the steepness of every direction draws a circle through the hiker with the gradient as its diameter. $\\blacksquare$',
        ru: 'По скалярному произведению $\\nabla f \\cdot \\vec u = |\\nabla f| \\cdot 1 \\cdot \\cos\\theta$, где $\\theta$ — угол между доской и стрелкой. Косинус наибольший, $1$, при $\\theta = 0$: самый крутой путь — вдоль $\\nabla f$, крутизна $|\\nabla f|$. При $\\theta = 90°$ косинус $0$: ровное направление, горизонталь — под прямым углом к градиенту. На карте крутизна всех направлений рисует окружность через туриста с градиентом в качестве диаметра. $\\blacksquare$',
      },
      try: { en: 'Turn the teal plank: its steepness is the shadow of the gradient on it — the teal dot runs over the circle.', ru: 'Поворачивайте бирюзовую доску: её крутизна — тень градиента на неё, бирюзовая точка бежит по окружности.' },
      state: { view: 'split', show: ['board'], params: { hx: -0.4, hy: 1.6, a: 1.2 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'Descent: rain in steps', ru: 'Спуск: дождь шагами' },
      text: {
        en: 'A computer cannot flow like water, it steps: look at $-\\nabla f$, step a little that way, look again. That is gradient descent — exactly how a line learns to go through a cloud and how a network learns its folds. Too long a step, and it jumps over the valley; and the descent ends in the nearest valley, not necessarily the deepest one.',
        ru: 'Компьютер не умеет течь как вода, он шагает: посмотрел на $-\\nabla f$, шагнул чуть-чуть туда, посмотрел снова. Это градиентный спуск — ровно так прямая учится проходить сквозь облако, а сеть — находить свои сгибы. Слишком длинный шаг перепрыгивает долину; и спуск заканчивается в ближайшей долине, не обязательно в самой глубокой.',
      },
      try: { en: 'Drag the start and change $\\eta$.', ru: 'Двигайте старт и меняйте $\\eta$.' },
      state: { view: 'split', show: ['steps'], params: { hx: 2.6, hy: 2.2, eta: 0.35 }, window: WIN, controls: ['eta'] },
    },
    {
      title: { en: 'The steepest way up', ru: 'Самый крутой подъём' },
      text: {
        en: 'Turn the plank to the direction of the steepest climb from the hiker.',
        ru: 'Поверните доску в направлении самого крутого подъёма от туриста.',
      },
      task: {
        kind: 'drag',
        ok: s => { const g = grad(s.hx, s.hy), u = dirOf(s.a); return (g[0] * u[0] + g[1] * u[1]) / Math.hypot(...g) > Math.cos(4 * Math.PI / 180); },
        target: { a: Math.atan2(grad(-0.4, 1.6)[1], grad(-0.4, 1.6)[0]) },
        back: 5,
        right: {
          en: 'Along $\\nabla f$: across the level lines, uphill. The steepness here is $|\\nabla f|$.',
          ru: 'Вдоль $\\nabla f$: поперёк горизонталей, в гору. Крутизна здесь — $|\\nabla f|$.',
        },
        mistakes: [{ when: s => { const g = grad(s.hx, s.hy), u = dirOf(s.a); return (g[0] * u[0] + g[1] * u[1]) / Math.hypot(...g) < -Math.cos(6 * Math.PI / 180); },
          text: { en: 'This is the steepest way <b>down</b> — where the rain goes. Turn it round.', ru: 'Это самый крутой спуск — куда течёт дождь. Разверните.' } }],
        hint: s => { const g = grad(s.hx, s.hy), u = dirOf(s.a), c = (g[0] * u[0] + g[1] * u[1]) / Math.hypot(...g); return Math.abs(c) < 0.3 ? { en: 'The plank is almost along a level line: flat. Turn it across the lines.', ru: 'Доска почти вдоль горизонтали: ровно. Поверните поперёк линий.' } : { en: `Steepness ${r2(steep(s.hx, s.hy, s.a))}; it can be steeper.`, ru: `Крутизна ${r2(steep(s.hx, s.hy, s.a))}; можно круче.` }; },
      },
      state: { view: 'split', show: ['plank'], params: { hx: -0.4, hy: 1.6, a: -2.5 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'Find the pass', ru: 'Найдите перевал' },
      text: {
        en: 'Between the two hills there is a pass: the gradient there is zero, as at a top — but it is not a top. Lead the hiker to the pass.',
        ru: 'Между двумя холмами есть перевал: градиент там нулевой, как на вершине, — но это не вершина. Приведите туриста на перевал.',
      },
      task: {
        kind: 'drag',
        ok: s => Math.hypot(s.hx - PASS[0], s.hy - PASS[1]) < 0.18,
        target: { hx: Math.round(PASS[0] * 20) / 20, hy: Math.round(PASS[1] * 20) / 20 },
        back: 3,
        right: {
          en: 'At the pass $\\nabla f = 0$: going towards either top is uphill, going down to either side is downhill. So $\\nabla f = 0$ does not yet mean a top — it means only "flat here". Descent can get stuck on such places too.',
          ru: 'На перевале $\\nabla f = 0$: к любой вершине — подъём, вбок — спуск. Поэтому $\\nabla f = 0$ ещё не значит «вершина» — только «здесь ровно». На таких местах спуск тоже может застрять.',
        },
        mistakes: [
          { when: s => Math.hypot(s.hx - TOP[0], s.hy - TOP[1]) < 0.25, text: { en: 'The gradient is zero here — but it is the big top. The pass is lower, between the hills.', ru: 'Градиент здесь ноль — но это большая вершина. Перевал ниже, между холмами.' } },
        ],
        hint: s => ({ en: `$|\\nabla f| = ${r2(Math.hypot(...grad(s.hx, s.hy)))}$: not flat yet. Look between the two hills, where the level lines make an X.`, ru: `$|\\nabla f| = ${r2(Math.hypot(...grad(s.hx, s.hy)))}$: ещё не ровно. Ищите между холмами, где горизонтали складываются крестом.` }),
      },
      state: { view: 'split', show: ['find'], params: { hx: 2.4, hy: -2 }, window: WIN, controls: [] },
    },
  ],
};
