// The chain rule: machines inside machines. Gears first: ×2 and then ×3 is ×6. Then three rulers on one scale,
// tied by threads: a short piece of the first ruler is stretched g′(x) times by g and then f′(g(x)) times by f —
// two magnifiers in a row multiply. The proof by ratios of small changes, the slope of the graph as a summary,
// and a long chain as in a network: one zero link stops everything.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';

const r2 = v => fmt(Math.round(v * 100) / 100);
const PIC = { cx: 0.6, cy: 0, unit: 70, grid: false };
const GRAPH = { cx: 1.2, cy: 0, unit: 80, grid: true };

// The machines: u = g(x) = x², y = f(u) = sin u
export const g = x => x * x, dg = x => 2 * x;
export const f = u => Math.sin(u), df = u => Math.cos(u);
// The rulers share one scale: value v is at X(v); the rows of x, u and y
const X = v => -3 + 1.5 * v;
const ROW = [2.3, 0, -2.3];

// A gear with n teeth, radius r, turned by the angle a; a hand shows how far it turned
function gear(p, cx, cy, r, n, a, color) {
  const pts = [];
  for (let k = 0; k < 4 * n; k++) {
    const q = a + 2 * Math.PI * k / (4 * n), R = k % 4 < 2 ? r : r * (1 - 0.6 / n * 4);
    pts.push([cx + R * Math.cos(q), cy + R * Math.sin(q)]);
  }
  p.fill(pts, color + '55');
  p.polyline([...pts, pts[0]], color, 1.5);
  p.line(cx, cy, cx + 0.85 * r * Math.cos(a), cy + 0.85 * r * Math.sin(a), '#ffffff', { width: 2.5 });
  p.dot(cx, cy, '#ffffff', 3);
}

// One ruler: a line with ticks at whole numbers and a name at its left end
function ruler(p, row, lo, hi, name, color) {
  p.line(X(lo), row, X(hi), row, color, { width: 2 });
  for (let v = Math.ceil(lo); v <= hi; v++) {
    p.line(X(v), row - 0.1, X(v), row + 0.1, color, { width: 1.5 });
    p.text(String(v), X(v), row - 0.32, '#8b95a7', { size: 11 });
  }
  p.tex(`r${name}`, name, X(lo), row, color, { dx: -14, dy: 0, align: 'right' });
}

export default {
  view: '2d',
  view2d: PIC,
  lab: false,

  setup(scene) {
    scene.ensureParam('turn', 0, { min: 0, max: 1, step: 0.005 }); // turns of the first gear
    scene.ensureParam('x', 0.9, { min: 0.1, max: 2.1, step: 0.01 });
    scene.ensureParam('h', 0.3, { min: 0.02, max: 0.5, step: 0.01 }); // the length of the piece on the first ruler
    scene.ensureParam('z', 0, { min: 0, max: 1, step: 1 }); // the long chain: one link switched off

    scene.custom.push(
      {
        // Three gears in a row: 36 → 18 teeth (×2), 18 → 6 teeth (×3); the teeth are the same size, so they mesh
        id: 'gears',
        draw2d(p, sc, s) {
          const a = 2 * Math.PI * s.turn;
          gear(p, -2.4, 0, 1.8, 36, a, COLORS.green);
          gear(p, 0.3, 0, 0.9, 18, -2 * a + Math.PI / 18, COLORS.red);
          gear(p, 1.5, 0, 0.3, 6, 6 * a, COLORS.purple);
          p.text(`${r2(s.turn)}`, -2.4, -2.3, COLORS.green, { size: 16 });
          p.text(`${r2(2 * s.turn)}`, 0.3, -2.3, COLORS.red, { size: 16 });
          p.text(`${r2(6 * s.turn)}`, 1.5, -2.3, COLORS.purple, { size: 16 });
          p.text(t({ en: 'turns', ru: 'оборотов' }), 2.9, -2.3, '#8b95a7', { size: 13 });
          p.text('×2', -0.6, 1.9, '#e6e9ef', { size: 18, weight: 600 });
          p.text('×3', 1.0, 1.1, '#e6e9ef', { size: 18, weight: 600 });
        },
        legend: s => `\\green{${r2(s.turn)}} \\xrightarrow{\\times 2} \\red{${r2(2 * s.turn)}} \\xrightarrow{\\times 3} \\purple{${r2(6 * s.turn)}} \\qquad 2 \\cdot 3 = 6`,
      },
      {
        // Three rulers and the threads of the two machines; the piece [x, x + h] and its images
        id: 'rulers',
        draw2d(p, sc, s) {
          ruler(p, ROW[0], 0, 2.2, 'x', COLORS.green);
          ruler(p, ROW[1], 0, 4.84, 'u', COLORS.red);
          ruler(p, ROW[2], -1, 1, 'y', COLORS.purple);
          for (let k = 0; k <= 44; k++) {
            const x = k * 0.05;
            p.line(X(x), ROW[0], X(g(x)), ROW[1], COLORS.red + '30', { width: 1 });
            p.line(X(g(x)), ROW[1], X(f(g(x))), ROW[2], COLORS.purple + '30', { width: 1 });
          }
          // The piece and where the machines carry it
          const a = s.x, b = s.x + s.h, band = (row, v1, v2, c) => p.fill([[X(v1), row - 0.13], [X(v2), row - 0.13], [X(v2), row + 0.13], [X(v1), row + 0.13]], c);
          band(ROW[0], a, b, COLORS.yellow + 'cc');
          band(ROW[1], g(a), g(b), COLORS.yellow + 'cc');
          band(ROW[2], f(g(a)), f(g(b)), COLORS.yellow + 'cc');
          for (const v of [a, b]) {
            p.line(X(v), ROW[0], X(g(v)), ROW[1], COLORS.yellow, { width: 1.5 });
            p.line(X(g(v)), ROW[1], X(f(g(v))), ROW[2], COLORS.yellow, { width: 1.5 });
          }
          const k1 = (g(b) - g(a)) / s.h, k2 = (f(g(b)) - f(g(a))) / (g(b) - g(a));
          const right = Math.max(b, g(b), f(g(a)), f(g(b)));
          p.tex('k1', `\\times ${r2(k1)}`, X(right) + 0.5, (ROW[0] + ROW[1]) / 2, COLORS.red, { align: 'left' });
          p.tex('k2', `\\times ${r2(k2)}`, X(right) + 0.5, (ROW[1] + ROW[2]) / 2, COLORS.purple, { align: 'left' });
          p.handle(X(a), ROW[0], COLORS.yellow, xx => sc.setParam('x', Math.max(0.1, Math.min(2.1, Math.round((xx + 3) / 1.5 * 100) / 100))));
        },
        legend: s => {
          const a = s.x, b = s.x + s.h, k1 = (g(b) - g(a)) / s.h, k2 = (f(g(b)) - f(g(a))) / (g(b) - g(a));
          return `\\begin{gathered} \\tfrac{\\Delta y}{\\Delta x} = \\red{\\tfrac{\\Delta u}{\\Delta x}} \\cdot \\purple{\\tfrac{\\Delta y}{\\Delta u}} = \\red{${r2(k1)}} \\cdot \\purple{${r2(k2)}} = ${r2(k1 * k2)} \\\\ \\red{g'(x) = 2x = ${r2(dg(s.x))}},\\quad \\purple{f'(u) = \\cos u = ${r2(df(g(s.x)))}} \\end{gathered}`;
        },
      },
      {
        // The summary on a graph: y = sin(x²) and its tangent with the slope 2x·cos(x²)
        id: 'graph',
        draw2d(p, sc, s) {
          p.curve(x => f(g(x)), COLORS.purple, 3);
          const k = dg(s.x) * df(g(s.x)), y0 = f(g(s.x));
          p.line(s.x, y0, s.x + 1, y0 + k, COLORS.yellow, { width: 2, extend: true });
          p.handle(s.x, y0, COLORS.yellow, xx => sc.setParam('x', Math.max(0.1, Math.min(2.1, Math.round(xx * 100) / 100))));
        },
        legend: s => `\\purple{y = \\sin(x^2)}, \\qquad y' = \\red{2x} \\cdot \\purple{\\cos(x^2)} = ${r2(dg(s.x) * df(g(s.x)))}`,
      },
      {
        // A long chain of five machines: their magnifications multiply; a switched-off link makes it all zero
        id: 'long',
        draw2d(p, sc, s) {
          const ks = [1.6, 0.7, s.z ? 0 : 1.3, 2, 0.8];
          let w = 0.6, total = 1;
          ks.forEach((k, i) => {
            const y = 2.6 - 1.3 * i;
            p.fill([[-w / 2, y - 0.12], [w / 2, y - 0.12], [w / 2, y + 0.12], [-w / 2, y + 0.12]], COLORS.yellow + 'cc');
            p.line(-4.5, y, 4.5, y, '#8b95a7', { width: 1 });
            p.text(`×${fmt(k)}`, 3.6, y - 0.65, k ? '#e6e9ef' : COLORS.red, { size: 15, weight: 600 });
            p.line(-w / 2, y, -w * k / 2, y - 1.3, COLORS.yellow + '66', { width: 1 });
            p.line(w / 2, y, w * k / 2, y - 1.3, COLORS.yellow + '66', { width: 1 });
            w *= k; total *= k;
          });
          const y = 2.6 - 1.3 * 5;
          p.fill([[-w / 2, y - 0.12], [w / 2, y - 0.12], [w / 2, y + 0.12], [-w / 2, y + 0.12]], COLORS.yellow + 'cc');
          p.line(-4.5, y, 4.5, y, '#8b95a7', { width: 1 });
          p.text(`= ×${r2(total)}`, 3.6, y - 0.4, COLORS.yellow, { size: 15, weight: 600 });
        },
        legend: s => `1.6 \\cdot 0.7 \\cdot ${s.z ? '\\red{0}' : '1.3'} \\cdot 2 \\cdot 0.8 = ${r2(1.6 * 0.7 * (s.z ? 0 : 1.3) * 2 * 0.8)}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'Gears', ru: 'Шестерёнки' },
      text: {
        en: 'A big gear with $36$ teeth drives one with $18$: one turn of the big one is two turns of the middle one. The middle one drives a small one with $6$ teeth: three times as many turns again. How many turns does the last gear make for one turn of the first? Not $2 + 3$ — $2 \\cdot 3 = 6$. A machine after a machine <b>multiplies</b> their ratios.',
        ru: 'Большая шестерёнка с $36$ зубьями крутит среднюю с $18$: один оборот большой — два оборота средней. Средняя крутит маленькую с $6$ зубьями: оборотов ещё втрое больше. Сколько оборотов сделает последняя на один оборот первой? Не $2 + 3$, а $2 \\cdot 3 = 6$. Машина после машины <b>умножает</b> их передаточные числа.',
      },
      try: { en: 'Press ▶ at the number of turns.', ru: 'Нажмите ▶ у числа оборотов.' },
      state: { show: ['gears'], params: { turn: 0 }, window: { cx: -0.3, cy: 0, unit: 80, grid: false }, controls: ['turn'] },
      enter(scene) { scene.animateParams({ turn: 1 }, 6000); },
    },
    {
      title: { en: 'Rulers tied by threads', ru: 'Линейки, связанные нитями' },
      text: {
        en: 'Gears have the same ratio at any moment; most machines do not. Take $u = g(x) = x^2$ and then $y = f(u) = \\sin u$. Draw three rulers on one scale and tie every point $x$ to $u = x^2$ and $u$ to $\\sin u$ with threads. The threads fan out unevenly: near $0$ the first machine squeezes, further on it stretches. A short yellow piece of the first ruler becomes a piece on the second, then on the third.',
        ru: 'У шестерёнок передаточное число всегда одно и то же; у большинства машин — нет. Возьмём $u = g(x) = x^2$, а потом $y = f(u) = \\sin u$. Нарисуем три линейки в одном масштабе и привяжем нитями каждую точку $x$ к $u = x^2$, а $u$ — к $\\sin u$. Нити расходятся неравномерно: около $0$ первая машина сжимает, дальше — растягивает. Короткий жёлтый кусок первой линейки становится куском на второй, потом на третьей.',
      },
      try: { en: 'Drag the yellow piece along the first ruler: how much each machine stretches it changes.', ru: 'Тяните жёлтый кусок вдоль первой линейки: насколько каждая машина его растягивает, меняется.' },
      state: { show: ['rulers'], params: { x: 0.6, h: 0.3 }, window: PIC, controls: [] },
    },
    {
      title: { en: 'Two magnifiers', ru: 'Две лупы' },
      text: {
        en: 'Now make the piece short. Up close every smooth machine is a gear: it stretches a tiny piece by its derivative — $g$ by $g\'(x) = 2x$, $f$ by $f\'(u) = \\cos u$ (a minus means the piece is turned over). Two magnifiers in a row multiply: $$\\big(f(g(x))\\big)\' = \\red{g\'(x)} \\cdot \\purple{f\'(g(x))}.$$ The derivative of the outer machine is taken <b>where the inner one has brought us</b>, at $u = g(x)$.',
        ru: 'Теперь сделаем кусок коротким. Вблизи любая гладкая машина — шестерёнка: крошечный кусок она растягивает в своё производное число раз — $g$ в $g\'(x) = 2x$, $f$ в $f\'(u) = \\cos u$ (минус значит, что кусок переворачивается). Две лупы подряд перемножаются: $$\\big(f(g(x))\\big)\' = \\red{g\'(x)} \\cdot \\purple{f\'(g(x))}.$$ Производная внешней машины берётся <b>там, куда нас привела внутренняя</b>, в $u = g(x)$.',
      },
      try: { en: 'Move $h$ down to $0.02$: the measured stretches become $2x$ and $\\cos(x^2)$.', ru: 'Уменьшайте $h$ до $0.02$: измеренные растяжения становятся $2x$ и $\\cos(x^2)$.' },
      state: { show: ['rulers'], params: { x: 0.9, h: 0.3 }, window: PIC, controls: ['h'] },
      enter(scene) { scene.animateParams({ h: 0.02 }, 4000); },
    },
    {
      proof: true,
      statement: {
        en: '<b>Theorem.</b> If $g$ has a derivative at $x$ and $f$ at $u = g(x)$, then $f(g(x))$ has the derivative $f\'(g(x)) \\cdot g\'(x)$.',
        ru: '<b>Теорема.</b> Если у $g$ есть производная в точке $x$, а у $f$ — в точке $u = g(x)$, то у $f(g(x))$ производная равна $f\'(g(x)) \\cdot g\'(x)$.',
      },
      title: { en: 'Ratios of small changes', ru: 'Отношения малых изменений' },
      text: {
        en: 'Step from $x$ by $\\Delta x$. The first machine moves $u$ by $\\Delta u$, the second moves $y$ by $\\Delta y$. While $\\Delta u \\ne 0$, $$\\frac{\\Delta y}{\\Delta x} = \\frac{\\Delta y}{\\Delta u} \\cdot \\frac{\\Delta u}{\\Delta x}$$ — just multiply and divide by $\\Delta u$. As $\\Delta x \\to 0$, $\\Delta u \\to 0$ too (a machine with a derivative does not jump), so the first ratio tends to $f\'(u)$ and the second to $g\'(x)$. The limit of a product is the product of the limits. $\\blacksquare$ <br><small>(When $g\'(x) = 0$, $\\Delta u$ may be exactly $0$ for small steps; there both sides are $0$, and the careful proof handles it separately.)</small>',
        ru: 'Шагнём из $x$ на $\\Delta x$. Первая машина сдвинет $u$ на $\\Delta u$, вторая сдвинет $y$ на $\\Delta y$. Пока $\\Delta u \\ne 0$, $$\\frac{\\Delta y}{\\Delta x} = \\frac{\\Delta y}{\\Delta u} \\cdot \\frac{\\Delta u}{\\Delta x}$$ — просто умножили и поделили на $\\Delta u$. При $\\Delta x \\to 0$ и $\\Delta u \\to 0$ (у машины с производной нет скачков), поэтому первое отношение стремится к $f\'(u)$, второе — к $g\'(x)$. Предел произведения — произведение пределов. $\\blacksquare$ <br><small>(Когда $g\'(x) = 0$, $\\Delta u$ при малых шагах может быть ровно $0$; тогда обе части равны $0$, и аккуратное доказательство разбирает этот случай отдельно.)</small>',
      },
      state: { show: ['rulers'], params: { x: 1.3, h: 0.25 }, window: PIC, controls: ['h'] },
    },
    {
      title: { en: 'On the graph', ru: 'На графике' },
      text: {
        en: 'Now the summary as a picture: the graph of $y = \\sin(x^2)$ and its tangent. Its slope is $2x \\cdot \\cos(x^2)$: where $\\cos(x^2) = 0$ (at $x^2 = \\frac{\\pi}{2}$) the tangent is flat; further the waves get denser — because the first machine stretches more and more.',
        ru: 'Теперь итог картинкой: график $y = \\sin(x^2)$ и касательная. Её наклон $2x \\cdot \\cos(x^2)$: где $\\cos(x^2) = 0$ (при $x^2 = \\frac{\\pi}{2}$), касательная горизонтальна; дальше волны всё чаще — потому что первая машина растягивает всё сильнее.',
      },
      try: { en: 'Drag the point along the graph.', ru: 'Тяните точку по графику.' },
      state: { show: ['graph'], params: { x: 0.9 }, window: GRAPH, controls: [] },
    },
    {
      title: { en: 'A long chain', ru: 'Длинная цепочка' },
      text: {
        en: 'A neural network is a chain of many machines, and to learn it needs the derivative of the whole chain by each weight. By the chain rule that is a product of all the stretches along the way — this is backpropagation. Two things follow. If one link stretches by $0$ (a ReLU neuron that is silent), the product is $0$: nothing behind it learns. And a product of many numbers below $1$ quickly becomes tiny — deep networks have to be built so that it does not.',
        ru: 'Нейросеть — цепочка из многих машин, и чтобы учиться, ей нужна производная всей цепочки по каждому весу. По цепному правилу это произведение всех растяжений по дороге — это и есть обратное распространение. Отсюда два следствия. Если одно звено растягивает в $0$ раз (молчащий нейрон ReLU), произведение — $0$: всё, что за ним, не учится. А произведение многих чисел меньше $1$ быстро становится крошечным — глубокие сети приходится строить так, чтобы этого не было.',
      },
      try: { en: 'Switch the third link off with $z$.', ru: 'Выключите третье звено параметром $z$.' },
      state: { show: ['long'], params: { z: 0 }, window: { cx: 0, cy: -0.7, unit: 52, grid: false }, controls: ['z'] },
    },
    {
      title: { en: 'The derivative of sin(x²)', ru: 'Производная sin(x²)' },
      text: {
        en: 'Type the derivative of $y = \\sin(x^2)$.',
        ru: 'Наберите производную $y = \\sin(x^2)$.',
      },
      task: {
        kind: 'formula',
        answer: 'y = 2x cos(x^2)',
        range: [-2.5, 2.5],
        back: 2,
        right: {
          en: 'Outer machine: $\\sin$, its derivative $\\cos$ — taken at $x^2$; inner: $x^2$, derivative $2x$. Together $2x\\cos(x^2)$.',
          ru: 'Внешняя машина — $\\sin$, её производная $\\cos$, взятая в $x^2$; внутренняя — $x^2$, производная $2x$. Вместе $2x\\cos(x^2)$.',
        },
        mistakes: [
          { formula: 'y = cos(x^2)', text: { en: 'The outer derivative is right, but the inner machine also stretches: multiply by $(x^2)\' = 2x$.', ru: 'Внешняя производная верна, но внутренняя машина тоже растягивает: умножьте на $(x^2)\' = 2x$.' } },
          { formula: 'y = 2x cos(x)', text: { en: 'The cosine is taken at the wrong place: the outer machine works at $u = x^2$, so $\\cos(x^2)$.', ru: 'Косинус взят не там: внешняя машина работает в $u = x^2$, значит, $\\cos(x^2)$.' } },
          { formula: 'y = cos(2x)', text: { en: 'This is the derivative of neither: differentiate the outside at the inside, then multiply by the derivative of the inside.', ru: 'Это не производная ни одной части: продифференцируйте внешнюю в точке внутренней и умножьте на производную внутренней.' } },
          { formula: 'y = 2x sin(x^2)', text: { en: 'The derivative of $\\sin$ is $\\cos$, not $\\sin$.', ru: 'Производная $\\sin$ — это $\\cos$, а не $\\sin$.' } },
        ],
      },
      state: { show: ['graph'], params: { x: 0.9 }, window: GRAPH, controls: [] },
    },
  ],
};
