// Linear regression: a line through a cloud of points. The error of a line is the mean area of the squares
// on its misses; every line (w, b) is a point of a map, the error over the map is a bowl, and learning is
// rolling down the bowl along −∇L. Proof: the best line passes through the centre of the cloud.
// Then why data are centred: a shifted cloud stretches the bowl into a canyon.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';
import { cloud, mse, mseGrad, bestLine, descend, along } from './ml-math.js';

const r2 = v => fmt(Math.round(v * 100) / 100);
const r3 = v => fmt(Math.round(v * 1000) / 1000);
const START = [-1.2, -2.6]; // where the descent starts: a line that is wrong in both slope and height
const WIN = { cx: 0.3, cy: 1, unit: 62 };
const WIN_SHIFT = { cx: 2.2, cy: 0.4, unit: 46 };

// The map of lines in 3D: w along x (twice stretched), b along y, the error L up
const FLOOR = -3.8;
const X = w => 2 * w, Y = b => b, Z = L => 0.16 * L + FLOOR;
const data = s => cloud(s.sh);
const path = s => { const P = data(s); return descend((w, b) => mseGrad(P, w, b), START, s.eta, 40); };

// The data and the line; with `sq` the misses and their squares
function drawFit(p, P, w, b, { sq = false, ghost = null } = {}) {
  if (ghost) ghost.forEach(([gw, gb], i) => p.line(0, gb, 1, gw + gb, `rgba(244,211,94,${0.08 + 0.3 * i / ghost.length})`, { width: 1.2, extend: true }));
  if (sq) {
    for (const [x, y] of P) {
      const yh = w * x + b, r = Math.abs(yh - y);
      const sqr = [[x, y], [x, yh], [x + r, yh], [x + r, y]];
      p.fill(sqr, COLORS.red + '18');
      p.polyline([...sqr, sqr[0]], COLORS.red + '50', 1);
      p.line(x, y, x, yh, COLORS.red, { width: 2 });
    }
  }
  p.line(0, b, 1, w + b, COLORS.yellow, { width: 3, extend: true });
  for (const [x, y] of P) p.dot(x, y, COLORS.blue, 5);
}

// Hand-made axes of the map: w, b on the floor, L up
function mapAxes(p) {
  const g = [];
  for (let w = -2; w <= 2; w++) g.push([[X(w), -4, FLOOR], [X(w), 4, FLOOR]]);
  for (let b = -4; b <= 4; b++) g.push([[-4, Y(b), FLOOR], [4, Y(b), FLOOR]]);
  p.lines('floor', g, '#3a4352', 0.7);
  p.lines('axes', [[[-4.4, 0, FLOOR], [4.4, 0, FLOOR]], [[0, -4.4, FLOOR], [0, 4.4, FLOOR]], [[-4, 4, FLOOR], [-4, 4, 3.6]]], '#8b95a7', 0.9);
  p.point('lw', [4.7, 0, FLOOR], '#8b95a7', 'w', 0.001);
  p.point('lb', [0, 4.7, FLOOR], '#8b95a7', 'b', 0.001);
  p.point('lL', [-4, 4, 3.9], '#8b95a7', 'L', 0.001);
}
function bowl(p, P) {
  mapAxes(p);
  p.surface('bowl', (x, y) => Z(mse(P, x / 2, y)), COLORS.blue);
  const B = bestLine(P);
  p.point('best', [X(B.w), Y(B.b), Z(mse(P, B.w, B.b))], COLORS.green, null, 0.07);
}
const ball = (p, P, w, b) => p.sphere('ball', [X(w), Y(b), Z(mse(P, w, b)) + 0.12], COLORS.yellow, 0.16);

const lineTex = (w, b) => `\\yellow{\\hat y = ${r2(w)}\\,x ${b < 0 ? '-' : '+'} ${r2(Math.abs(b))}}`;
const lossTex = (P, w, b) => `L = \\tfrac{1}{${P.length}}\\textstyle\\sum (\\hat y - y)^2 = \\red{${r3(mse(P, w, b))}}`;
const snap = v => Math.round(v * 100) / 100;
const rows = (...a) => `\\begin{gathered} ${a.join(' \\\\ ')} \\end{gathered}`;

export default {
  view: '2d',
  view2d: WIN,
  view3d: { R: 4, zmax: 4, camera: [7.5, -8.5, 5.5], axes: false },
  lab: false,

  setup(scene) {
    scene.ensureParam('w', -0.3, { min: -2, max: 2, step: 0.01 });
    scene.ensureParam('b', 2, { min: -4, max: 4, step: 0.01 });
    scene.ensureParam('eta', 0.1, { min: 0.01, max: 0.45, step: 0.01 });
    scene.ensureParam('k', 0, { min: 0, max: 40, step: 0.01 });
    scene.ensureParam('sh', 0, { min: 0, max: 4, step: 0.1 }); // the cloud shifted along x
    scene.ensureParam('pf', 0, { min: 0, max: 1, step: 1 }); // the proof: 1 — b follows the best b for the slope

    // The line by two handles: its height at x = 0 (b) and a point at x = 2.5 (the slope)
    const handles = (p, sc, s) => {
      p.handle(0, s.b, COLORS.yellow, (x, y) => sc.setParam('b', Math.max(-4, Math.min(4, snap(y)))));
      p.handle(2.5, 2.5 * s.w + s.b, COLORS.yellow, (x, y) => sc.setParam('w', Math.max(-2, Math.min(2, snap((y - s.b) / 2.5)))));
    };

    scene.custom.push(
      {
        id: 'fit',
        draw2d(p, sc, s) { drawFit(p, data(s), s.w, s.b); handles(p, sc, s); },
        legend: s => lineTex(s.w, s.b),
      },
      {
        // The misses as squares; the error is their mean area
        id: 'squares',
        draw2d(p, sc, s) { drawFit(p, data(s), s.w, s.b, { sq: true }); handles(p, sc, s); },
        draw3d(p, sc, s) { const P = data(s); bowl(p, P); ball(p, P, s.w, s.b); },
        legend: s => rows(lineTex(s.w, s.b), lossTex(data(s), s.w, s.b)),
      },
      {
        // Downhill: the arrow −∇L on the bowl, and in the plane the line after one step
        id: 'grad',
        draw2d(p, sc, s) {
          const P = data(s), [gw, gb] = mseGrad(P, s.w, s.b), e = 0.1;
          p.line(0, s.b - e * gb, 1, s.w - e * gw + s.b - e * gb, COLORS.yellow + '88', { width: 2, dash: [8, 6], extend: true });
          drawFit(p, P, s.w, s.b, { sq: true });
          handles(p, sc, s);
        },
        draw3d(p, sc, s) {
          const P = data(s), [gw, gb] = mseGrad(P, s.w, s.b);
          bowl(p, P); ball(p, P, s.w, s.b);
          const L = Math.hypot(2 * gw, gb);
          if (L < 1e-3) return;
          const k = 1.3 / L, w1 = s.w - k * gw, b1 = s.b - k * gb; // 1.3 units on the floor, downhill
          p.arrow('down', [X(s.w), Y(s.b), Z(mse(P, s.w, s.b)) + 0.12], [X(w1), Y(b1), Z(mse(P, w1, b1)) + 0.12], COLORS.red, { radius: 0.05 });
        },
        legend: s => {
          const [gw, gb] = mseGrad(data(s), s.w, s.b);
          return rows(`\\nabla L = \\left(\\tfrac{\\partial L}{\\partial w};\\ \\tfrac{\\partial L}{\\partial b}\\right) = (${r2(gw)};\\ ${r2(gb)})`, lossTex(data(s), s.w, s.b));
        },
      },
      {
        // Gradient descent: the path on the bowl and the line at step k, with the lines it has been
        id: 'descent',
        draw2d(p, sc, s) {
          const P = data(s), pa = path(s), [w, b] = along(pa, s.k);
          drawFit(p, P, w, b, { sq: true, ghost: pa.slice(0, Math.floor(s.k) + 1) });
        },
        draw3d(p, sc, s) {
          const P = data(s), pa = path(s), n = Math.min(pa.length - 1, Math.floor(s.k));
          bowl(p, P);
          const pts = pa.slice(0, n + 1).concat([along(pa, s.k)]).map(([w, b]) => [X(w), Y(b), Z(mse(P, w, b)) + 0.06]);
          p.tube('path', pts, COLORS.orange, 0.035);
          for (let i = 0; i <= Math.min(n, 40); i++) { const [w, b] = pa[i]; p.sphere(`st${i}`, [X(w), Y(b), Z(mse(P, w, b)) + 0.06], COLORS.orange, 0.06); }
          const [w, b] = along(pa, s.k);
          ball(p, P, w, b);
        },
        legend: s => {
          const P = data(s), pa = path(s), [w, b] = along(pa, s.k), lost = pa.length - 1 < Math.floor(s.k);
          return rows(`\\text{${t({ en: 'step', ru: 'шаг' })} } ${Math.min(pa.length - 1, Math.floor(s.k))}: \\quad ${lost ? '\\red{L \\to \\infty}' : lineTex(w, b)}`, lost ? '' : `L = \\red{${r3(mse(P, w, b))}}`);
        },
      },
      {
        // The proof: for a fixed w the best b puts the line through the centre of the cloud
        id: 'centre',
        draw2d(p, sc, s) {
          const P = data(s), B = bestLine(P);
          for (const [x, y] of P) p.line(x, y, x, s.w * x + s.b, (s.w * x + s.b > y ? COLORS.green : COLORS.red), { width: 2.5 });
          p.line(0, s.b, 1, s.w + s.b, COLORS.yellow, { width: 3, extend: true });
          for (const [x, y] of P) p.dot(x, y, COLORS.blue, 5);
          p.line(B.mx, -10, B.mx, 10, COLORS.purple + '55', { width: 1, dash: [5, 5] });
          p.line(-10, B.my, 10, B.my, COLORS.purple + '55', { width: 1, dash: [5, 5] });
          p.dot(B.mx, B.my, COLORS.purple, 7);
          p.tex('c', '(\\bar x;\\ \\bar y)', B.mx, B.my, COLORS.purple, { dx: 12, dy: -16 });
          p.handle(2.5, 2.5 * s.w + s.b, COLORS.yellow, (x, y) => {
            const w = Math.max(-2, Math.min(2, snap((y - s.b) / 2.5)));
            sc.setParam('w', w);
            if (s.pf) sc.setParam('b', B.my - w * B.mx); // the best b for this w
          });
        },
        draw3d(p, sc, s) {
          const P = data(s), B = bestLine(P);
          bowl(p, P);
          // The slice of the bowl at this w: a parabola in b; and the floor of the valley, b = ȳ − w·x̄
          p.plane('slice', 'x', X(s.w), COLORS.purple, 0.1);
          p.tube('parab', Array.from({ length: 81 }, (_, i) => { const b = -4 + i / 10; return [X(s.w), Y(b), Z(mse(P, s.w, b)) + 0.03]; }), COLORS.purple, 0.03);
          if (s.pf) p.tube('valley', Array.from({ length: 81 }, (_, i) => { const w = -2 + i / 20; const b = B.my - w * B.mx; return [X(w), Y(b), Z(mse(P, w, b)) + 0.05]; }), COLORS.green, 0.03);
          ball(p, P, s.w, s.b);
        },
        legend: s => {
          const P = data(s), sum = P.reduce((m, [x, y]) => m + s.w * x + s.b - y, 0);
          return `\\textstyle\\sum (\\hat y - y) = ${r2(sum)} \\qquad \\tfrac{\\partial L}{\\partial b} = ${r2(mseGrad(P, s.w, s.b)[1])}`;
        },
      },
    );
  },

  steps: [
    {
      title: { en: 'A cloud and a line', ru: 'Облако и прямая' },
      text: {
        en: 'Twelve points: say, how many hours students prepared ($x$) and how their test went ($y$). We want a rule that predicts $y$ from $x$, the simplest one: a line $\\hat y = wx + b$. The machine has to <i>learn</i> two numbers — the slope $w$ and the height $b$. Learning here means: choose them so the line goes through the cloud as well as possible.',
        ru: 'Двенадцать точек: скажем, сколько часов студенты готовились ($x$) и как написали тест ($y$). Нужно правило, которое по $x$ предсказывает $y$, — самое простое: прямая $\\hat y = wx + b$. Машине надо <i>выучить</i> два числа — наклон $w$ и высоту $b$. Учиться здесь значит: подобрать их так, чтобы прямая прошла сквозь облако как можно лучше.',
      },
      try: { en: 'Drag the two yellow handles and put the line through the cloud by eye.', ru: 'Тяните две жёлтые ручки и проведите прямую сквозь облако на глаз.' },
      state: { view: '2d', show: ['fit'], params: { w: -0.3, b: 2, sh: 0 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'The error is an area', ru: 'Ошибка — это площадь' },
      text: {
        en: 'What does "as well as possible" mean? For each point the line misses by $\\hat y - y$ (red). Put a square on every miss; the error of the line is the mean area of the squares: $$L(w, b) = \\frac{1}{n} \\sum (\\hat y_i - y_i)^2.$$ Why squares, not just lengths: a big miss costs much more than several small ones, and the squares change smoothly — we will need their slopes.',
        ru: 'Что значит «как можно лучше»? Для каждой точки прямая промахивается на $\\hat y - y$ (красное). Поставим на каждый промах квадрат; ошибка прямой — средняя площадь квадратов: $$L(w, b) = \\frac{1}{n} \\sum (\\hat y_i - y_i)^2.$$ Почему квадраты, а не просто длины: большой промах стоит намного дороже нескольких маленьких, и квадраты меняются плавно — нам понадобятся их наклоны.',
      },
      try: { en: 'Move the line and make the red area as small as you can. Below $0.3$ is very good.', ru: 'Двигайте прямую и сделайте красную площадь как можно меньше. Меньше $0.3$ — очень хорошо.' },
      check: {
        q: { en: 'One point is missed by $1$, another by $2$. How many times more does the second add to $L$?', ru: 'Одна точка промахнулась на $1$, другая на $2$. Во сколько раз вторая добавляет к $L$ больше?' },
        options: [{ text: '$2$' }, { text: '$4$', ok: true }, { text: '$\\sqrt 2$' }],
        explain: {
          en: 'Its square has side $2$ and area $4$. Twice as far — four times as costly: one wild point pulls the line hard.',
          ru: 'Её квадрат со стороной $2$ и площадью $4$. Вдвое дальше — вчетверо дороже: одна дикая точка сильно тянет прямую.',
        },
      },
      state: { view: '2d', show: ['squares'], params: { w: -0.3, b: 2, sh: 0 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'Every line is a point of a map', ru: 'Каждая прямая — точка на карте' },
      text: {
        en: 'A line is two numbers $(w;\\ b)$ — a point on a flat map. Above every point of the map raise its error $L$: you get a landscape. For a line it is a <b>bowl</b>: $L$ is a sum of squares of expressions linear in $w$ and $b$, a paraboloid. The yellow ball is your line; the green dot at the bottom is the best line. Learning is finding the bottom.',
        ru: 'Прямая — это два числа $(w;\\ b)$, точка на плоской карте. Над каждой точкой карты поднимем её ошибку $L$ — получится рельеф. Для прямой это <b>чаша</b>: $L$ — сумма квадратов выражений, линейных по $w$ и $b$, параболоид. Жёлтый шар — ваша прямая; зелёная точка на дне — лучшая прямая. Учиться — значит найти дно.',
      },
      try: { en: 'Drag the yellow handles on the line and watch the ball move over the bowl.', ru: 'Тяните жёлтые ручки на прямой и смотрите, как шар катается по чаше.' },
      check: {
        q: { en: 'How many lowest points does this bowl have?', ru: 'Сколько самых низких точек у этой чаши?' },
        options: [{ text: { en: 'One', ru: 'Одна' }, ok: true }, { text: { en: 'Several valleys', ru: 'Несколько долин' } }, { text: { en: 'It depends on the start', ru: 'Зависит от старта' } }],
        explain: {
          en: 'A paraboloid has one bottom, so any way down leads to the same best line. For a neural network the landscape will have many valleys — that is where learning gets hard.',
          ru: 'У параболоида одно дно, поэтому любой путь вниз приводит к одной и той же лучшей прямой. У нейросети рельеф будет со множеством долин — там учиться труднее.',
        },
      },
      state: { view: 'split', show: ['squares'], params: { w: -0.3, b: 2, sh: 0 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'The gradient: which way is down', ru: 'Градиент: куда вниз' },
      text: {
        en: 'The machine does not see the bowl — it only feels the slope under the ball. The slope along $b$ is $\\frac{\\partial L}{\\partial b} = \\frac{2}{n}\\sum(\\hat y_i - y_i)$: if the line is on average <b>above</b> the points, it is positive, and $b$ should go down. Along $w$ it is the same misses weighted by $x$. Together they are the gradient $\\nabla L$; the red arrow $-\\nabla L$ points straight downhill. The dashed line is where one small step takes the line.',
        ru: 'Машина не видит чашу — она чувствует только наклон под шаром. Наклон вдоль $b$: $\\frac{\\partial L}{\\partial b} = \\frac{2}{n}\\sum(\\hat y_i - y_i)$: если прямая в среднем <b>выше</b> точек, он положительный, и $b$ надо уменьшать. Вдоль $w$ — те же промахи, но с весом $x$. Вместе это градиент $\\nabla L$; красная стрелка $-\\nabla L$ смотрит прямо под гору. Пунктир — куда прямую переведёт один маленький шаг.',
      },
      try: { en: 'Lift the line high above the cloud: the arrow points to smaller $b$. Tilt it too steeply: the arrow turns towards smaller $w$.', ru: 'Поднимите прямую высоко над облаком: стрелка смотрит в сторону меньших $b$. Наклоните слишком круто — стрелка поворачивает к меньшим $w$.' },
      state: { view: 'split', show: ['grad'], params: { w: 1.5, b: 2.5, sh: 0 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'Descent: step by step', ru: 'Спуск: шаг за шагом' },
      text: {
        en: 'Gradient descent is one rule repeated: $$(w;\\ b) \\leftarrow (w;\\ b) - \\eta\\, \\nabla L.$$ Step against the slope, a step of size $\\eta$ (the <i>learning rate</i>) times the slope, look again. Far from the bottom the bowl is steep and the steps are long; near the bottom it is flat and they shrink by themselves. Faint lines on the left are where the line has been.',
        ru: 'Градиентный спуск — одно правило, повторённое много раз: $$(w;\\ b) \\leftarrow (w;\\ b) - \\eta\\, \\nabla L.$$ Шаг против наклона длиной $\\eta$ (<i>скорость обучения</i>), умноженной на наклон, — и снова осмотреться. Далеко от дна чаша крутая и шаги длинные; у дна она пологая, и шаги укорачиваются сами. Бледные прямые слева — где прямая уже побывала.',
      },
      try: { en: 'Press ▶ next to $k$ (the step number), or drag it.', ru: 'Нажмите ▶ возле $k$ (номер шага) или тяните его.' },
      state: { view: 'split', show: ['descent'], params: { eta: 0.1, sh: 0 }, window: WIN, controls: ['k', 'eta'] },
      enter(scene) { scene.setParam('k', 0); scene.animateParams({ k: 25 }, 6000); },
    },
    {
      title: { en: 'The size of a step', ru: 'Размер шага' },
      text: {
        en: 'With $\\eta = 0.1$ the ball rolls down calmly. With $\\eta = 0.25$ it jumps across the valley and back, but still gets down. What if the step is even bigger?',
        ru: 'При $\\eta = 0.1$ шар спокойно скатывается. При $\\eta = 0.25$ он перепрыгивает долину туда и обратно, но всё же спускается. А если шаг ещё больше?',
      },
      check: {
        q: { en: 'What happens with $\\eta = 0.35$?', ru: 'Что будет при $\\eta = 0.35$?' },
        options: [
          { text: { en: 'It gets down even faster', ru: 'Спустится ещё быстрее' } },
          { text: { en: 'Each jump lands higher: it flies out of the bowl', ru: 'Каждый прыжок выше прежнего: вылетит из чаши' }, ok: true },
          { text: { en: 'It stops halfway', ru: 'Остановится на полпути' } },
        ],
        explain: {
          en: 'The step is proportional to the slope. Overshoot to a steeper place, and the next step is longer still — the jumps grow and $L$ runs to infinity. For this bowl the limit is $\\eta \\approx 0.32$; in real learning $\\eta$ is chosen by trying.',
          ru: 'Шаг пропорционален наклону. Перелетели на место покруче — следующий шаг ещё длиннее: прыжки растут, и $L$ уходит в бесконечность. Для этой чаши граница $\\eta \\approx 0.32$; в настоящем обучении $\\eta$ подбирают пробами.',
        },
        reveal: scene => { scene.setParam('eta', 0.35); scene.setParam('k', 0); scene.animateParams({ k: 12 }, 5000); },
      },
      state: { view: 'split', show: ['descent'], params: { eta: 0.25, sh: 0 }, window: WIN, controls: ['k', 'eta'] },
      enter(scene) { scene.setParam('k', 0); scene.animateParams({ k: 20 }, 5000); },
    },
    {
      proof: true,
      statement: {
        en: '<b>Theorem.</b> The best line passes through the centre of the cloud $(\\bar x;\\ \\bar y)$ — the point of mean $x$ and mean $y$.',
        ru: '<b>Теорема.</b> Лучшая прямая проходит через центр облака $(\\bar x;\\ \\bar y)$ — точку со средним $x$ и средним $y$.',
      },
      title: { en: 'At the bottom the slope is zero', ru: 'На дне наклон нулевой' },
      text: {
        en: 'Fix the slope $w$ and move only $b$: the bowl cut by the purple wall is a parabola. At the lowest point of the bowl it is also at its own lowest point, so there $\\frac{\\partial L}{\\partial b} = \\frac{2}{n}\\sum(\\hat y_i - y_i) = 0$: the misses up (green) and down (red) cancel out. The best line is not above or below the cloud on average.',
        ru: 'Зафиксируем наклон $w$ и будем двигать только $b$: чаша, разрезанная фиолетовой стенкой, — парабола. В самой низкой точке чаши она тоже в своей низшей точке, значит, там $\\frac{\\partial L}{\\partial b} = \\frac{2}{n}\\sum(\\hat y_i - y_i) = 0$: промахи вверх (зелёные) и вниз (красные) взаимно гасятся. Лучшая прямая в среднем не выше и не ниже облака.',
      },
      state: { view: 'split', show: ['centre'], params: { sh: 0 }, window: WIN, controls: [] },
      enter(scene) { scene.setParam('pf', 0); scene.setParam('w', 0.63); scene.setParam('b', 2.4); scene.animateParams({ b: 0.874 }, 3000); },
    },
    {
      proof: true,
      title: { en: 'The centre is on the line', ru: 'Центр — на прямой' },
      text: {
        en: 'Divide the sum by $n$: $$\\frac1n \\sum (w x_i + b - y_i) = w\\bar x + b - \\bar y = 0,$$ that is $\\bar y = w \\bar x + b$ — the point $(\\bar x;\\ \\bar y)$ lies on the line. This holds for the best $b$ at <b>any</b> $w$, and so for the best line too. Drag the slope: the best line for every $w$ turns around the purple centre, and on the bowl the ball runs along the green floor of the valley. $\\blacksquare$',
        ru: 'Поделим сумму на $n$: $$\\frac1n \\sum (w x_i + b - y_i) = w\\bar x + b - \\bar y = 0,$$ то есть $\\bar y = w \\bar x + b$ — точка $(\\bar x;\\ \\bar y)$ лежит на прямой. Это верно для лучшего $b$ при <b>любом</b> $w$, а значит, и для лучшей прямой. Тяните наклон: лучшая прямая при каждом $w$ поворачивается вокруг фиолетового центра, а на чаше шар бежит по зелёному дну долины. $\\blacksquare$',
      },
      try: { en: 'Drag the yellow handle. The sum of the misses stays $0$.', ru: 'Тяните жёлтую ручку. Сумма промахов остаётся $0$.' },
      state: { view: 'split', show: ['centre'], params: { w: 0.2, b: 0.877, sh: 0 }, window: WIN, controls: [] },
      enter(scene) { scene.setParam('pf', 1); },
    },
    {
      title: { en: 'Why data are centred first', ru: 'Почему данные сначала центрируют' },
      text: {
        en: 'Shift the cloud to the right with $s$. The best line is the same in shape, but the bowl turns into a long narrow canyon: changing $w$ now also moves the line up and down far away, so $w$ and $b$ fight each other. The same $\\eta$ that worked now flies out, and a smaller one crawls along the canyon for ages. That is why, before learning, data are shifted so that their mean is $0$ (and scaled): the bowl becomes round, and the descent goes straight down.',
        ru: 'Сдвиньте облако вправо параметром $s$. Лучшая прямая по форме та же, но чаша превращается в длинный узкий каньон: изменение $w$ теперь заодно двигает прямую вверх-вниз далеко от нуля, и $w$ с $b$ мешают друг другу. Та же $\\eta$, что работала, теперь вылетает, а меньшая ползёт по каньону целую вечность. Поэтому перед обучением данные сдвигают так, чтобы среднее было $0$ (и масштабируют): чаша становится круглой, и спуск идёт прямо вниз.',
      },
      try: { en: 'Move $s$ from $0$ to $3$: with $\\eta = 0.1$ the ball flies out. Lower $\\eta$ to $0.05$: now it crawls, and after $40$ steps it is still not at the bottom.', ru: 'Двигайте $s$ от $0$ до $3$: при $\\eta = 0.1$ шар вылетает. Уменьшите $\\eta$ до $0.05$: теперь он ползёт и за $40$ шагов так и не доходит до дна.' },
      state: { view: 'split', show: ['descent'], params: { eta: 0.1, sh: 0, k: 40 }, window: WIN_SHIFT, controls: ['sh', 'eta', 'k'] },
    },
    {
      title: { en: 'Fit the line', ru: 'Подберите прямую' },
      text: {
        en: 'Put the line through the cloud by hand so that the error is $L \\le 0.25$ (the best possible is $0.225$).',
        ru: 'Проведите прямую руками так, чтобы ошибка была $L \\le 0.25$ (лучше всего можно $0.225$).',
      },
      task: {
        kind: 'drag',
        ok: s => mse(cloud(0), s.w, s.b) <= 0.25,
        target: { w: 0.63, b: 0.87 },
        back: 1,
        right: {
          en: 'The best line is $\\hat y \\approx 0.63x + 0.87$, and it goes through the centre of the cloud. The machine finds it by descent — or straight away by the formula $w = \\frac{\\overline{xy} - \\bar x \\bar y}{\\overline{x^2} - \\bar x^2}$, $b = \\bar y - w\\bar x$.',
          ru: 'Лучшая прямая $\\hat y \\approx 0.63x + 0.87$, и она проходит через центр облака. Машина находит её спуском — или сразу по формуле $w = \\frac{\\overline{xy} - \\bar x \\bar y}{\\overline{x^2} - \\bar x^2}$, $b = \\bar y - w\\bar x$.',
        },
        hint: s => {
          const P = cloud(0), [gw, gb] = mseGrad(P, s.w, s.b), L = r2(mse(P, s.w, s.b));
          return Math.abs(gb) > Math.abs(gw)
            ? (gb > 0 ? { en: `$L = ${L}$. On average the line is above the points: lower it.`, ru: `$L = ${L}$. В среднем прямая выше точек: опустите её.` }
              : { en: `$L = ${L}$. On average the line is below the points: lift it.`, ru: `$L = ${L}$. В среднем прямая ниже точек: поднимите её.` })
            : (gw > 0 ? { en: `$L = ${L}$. The line is too steep: on the right it misses up, on the left down.`, ru: `$L = ${L}$. Прямая слишком крутая: справа промахи вверх, слева вниз.` }
              : { en: `$L = ${L}$. The line is too flat: tilt it up.`, ru: `$L = ${L}$. Прямая слишком пологая: наклоните её круче.` });
        },
      },
      state: { view: 'split', show: ['squares'], params: { w: -0.5, b: 2.2, sh: 0 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'Choose the learning rate', ru: 'Подберите скорость обучения' },
      text: {
        en: 'Set $\\eta$ so that after $10$ steps of descent the error is already below $0.25$.',
        ru: 'Подберите $\\eta$ так, чтобы после $10$ шагов спуска ошибка была уже меньше $0.25$.',
      },
      task: {
        kind: 'drag',
        ok: s => { const pa = descend((w, b) => mseGrad(cloud(0), w, b), START, s.eta, 10); return pa.length === 11 && mse(cloud(0), ...pa[10]) < 0.25; },
        target: { eta: 0.2 },
        back: 5,
        right: {
          en: 'Around $\\eta = 0.14$–$0.28$ ten steps are enough. Smaller — the ball is still on its way; bigger — it jumps across the valley too wildly or flies out.',
          ru: 'Примерно при $\\eta = 0.14$–$0.28$ десяти шагов хватает. Меньше — шар ещё в пути; больше — слишком сильно скачет через долину или вылетает.',
        },
        mistakes: [
          { when: s => s.eta > 0.325, text: { en: 'The ball flies out of the bowl: the step is too big.', ru: 'Шар вылетает из чаши: шаг слишком большой.' } },
        ],
        hint: s => {
          const pa = descend((w, b) => mseGrad(cloud(0), w, b), START, s.eta, 10), L = r2(mse(cloud(0), ...pa[pa.length - 1]));
          return s.eta < 0.2 ? { en: `After 10 steps $L = ${L}$: the steps are too short, it is still on its way down.`, ru: `После 10 шагов $L = ${L}$: шаги слишком короткие, шар ещё спускается.` }
            : { en: `After 10 steps $L = ${L}$: it is jumping across the valley. A bit smaller.`, ru: `После 10 шагов $L = ${L}$: шар скачет через долину. Чуть меньше.` };
        },
      },
      state: { view: 'split', show: ['descent'], params: { eta: 0.03, sh: 0, k: 10 }, window: WIN, controls: ['eta'] },
    },
  ],
};
