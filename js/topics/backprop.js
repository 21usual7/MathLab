// Backpropagation: the chain rule on a graph. A computation is a graph of tiny machines; numbers run forward
// (white), and the blame for the error, ∂L/∂(node), runs backward (red): every node multiplies the blame of its
// children by its own local stretch, and the blames of several children add up. Two graphs: the line of
// regression for one point, and a small network 1 → 2 ReLU → 1 where x feeds two paths and a silent neuron
// stops the blame. Then why backward (2 runs instead of N + 1) and one step of learning.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';

const r2 = v => fmt(Math.round(v * 100) / 100 + 0);
const WIN = { cx: 0, cy: -0.1, unit: 115, grid: false, fit: [7.6, 4.6] };
const R = 0.34; // radius of a node

// A graph: nodes in the order of computation. op: in (a number from the scene), mul, add,
// lin (Σ wₖ·inₖ + c, the weights are written on the wires), relu, loss ((in − target)²)
export const LINE = [
  { id: 'w', name: 'w', x: -3, y: 0.9, op: 'in', src: s => s.w, ask: true },
  { id: 'x', name: 'x', x: -3, y: -0.6, op: 'in', src: s => s.x },
  { id: 'm', name: 'wx', x: -1, y: 0.15, op: 'mul', in: ['w', 'x'] },
  { id: 'b', name: 'b', x: -1, y: -1.4, op: 'in', src: s => s.b },
  { id: 'yh', name: 'ŷ', x: 1, y: -0.6, op: 'add', in: ['m', 'b'] },
  { id: 'L', name: 'L', x: 3, y: -0.6, op: 'loss', in: ['yh'], c: s => s.q },
];
export const NET = [
  { id: 'x', name: 'x', x: -3, y: 0, op: 'in', src: s => s.x, ask: true },
  { id: 'z1', name: 'z₁', x: -1.5, y: 1.1, op: 'lin', in: ['x'], w: [1], c: () => 0.5 },
  { id: 'z2', name: 'z₂', x: -1.5, y: -1.1, op: 'lin', in: ['x'], w: [2], c: () => -1.5 },
  { id: 'h1', name: 'h₁', x: 0, y: 1.1, op: 'relu', in: ['z1'] },
  { id: 'h2', name: 'h₂', x: 0, y: -1.1, op: 'relu', in: ['z2'] },
  { id: 'yh', name: 'ŷ', x: 1.5, y: 0, op: 'lin', in: ['h1', 'h2'], w: [1, -1], c: () => 0 },
  { id: 'L', name: 'L', x: 3, y: 0, op: 'loss', in: ['yh'], c: () => 2 },
];
const GLYPH = { mul: '×', add: '+', lin: 'Σ', relu: 'max(0, ·)', loss: '(· − t)²' };

// Forward and backward: values, blames ∂L/∂node, the local stretch of every wire (∂node/∂input),
// the depth of a node from the inputs and from L (when the forward and the backward pulse reach it)
export function run(G, s) {
  const val = {}, grad = {}, loc = {}, dep = {}, rdep = {};
  for (const n of G) {
    const a = (n.in || []).map(i => val[i]);
    dep[n.id] = n.in ? 1 + Math.max(...n.in.map(i => dep[i])) : 0;
    grad[n.id] = 0;
    if (n.op === 'in') { val[n.id] = n.src(s); continue; }
    if (n.op === 'mul') { val[n.id] = a[0] * a[1]; loc[n.id] = [a[1], a[0]]; }
    if (n.op === 'add') { val[n.id] = a[0] + a[1]; loc[n.id] = [1, 1]; }
    if (n.op === 'lin') { val[n.id] = a.reduce((m, v, k) => m + n.w[k] * v, n.c(s)); loc[n.id] = n.w; }
    if (n.op === 'relu') { val[n.id] = Math.max(0, a[0]); loc[n.id] = [a[0] > 0 ? 1 : 0]; }
    if (n.op === 'loss') { val[n.id] = (a[0] - n.c(s)) ** 2; loc[n.id] = [2 * (a[0] - n.c(s))]; }
  }
  const last = G[G.length - 1].id;
  grad[last] = 1;
  rdep[last] = 0;
  for (const n of [...G].reverse()) {
    if (!n.in) continue;
    n.in.forEach((i, k) => {
      grad[i] += grad[n.id] * loc[n.id][k];
      rdep[i] = Math.max(rdep[i] || 0, rdep[n.id] + 1);
    });
  }
  // The blame of a weight on a wire: ∂L/∂wₖ = ∂L/∂node · inₖ
  const wgrad = {};
  for (const n of G) if (n.op === 'lin') wgrad[n.id] = n.in.map(i => grad[n.id] * val[i]);
  return { val, grad, loc, dep, rdep, wgrad, D: dep[last], L: val[last] };
}

// Learning on the line: n steps of w ← w − η·∂L/∂w, b ← b − η·∂L/∂b
export const ETA = 0.05;
export function learn(s, n) {
  let { w, b } = s;
  const path = [{ w, b }];
  for (let k = 0; k < n; k++) {
    const g = run(LINE, { ...s, w, b }).grad;
    w -= ETA * g.w; b -= ETA * g.b;
    path.push({ w, b });
  }
  return path;
}

const at = (G, id) => G.find(n => n.id === id);
const PATHS = { line: [['w', 'm', 'yh', 'L']], net: [['x', 'z1', 'h1', 'yh', 'L'], ['x', 'z2', 'h2', 'yh', 'L']] };

// The graph with pulses: fw — how far the numbers have run forward, bw — how far the blame has run back,
// loc — the local stretches on the wires, hl — highlighted paths (1, 2 or both = 3), ask — a question mark
function drawGraph(p, s, G, paths) {
  const r = run(G, s), ctx = p.ctx;
  // Highlighted paths under everything
  paths.forEach((path, k) => {
    if (!(s.hl & (1 << k))) return;
    const c = [COLORS.teal, COLORS.orange][k];
    for (let i = 0; i + 1 < path.length; i++) { const a = at(G, path[i]), b = at(G, path[i + 1]); p.line(a.x, a.y + 0.05 * k, b.x, b.y + 0.05 * k, c + '99', { width: 9 }); }
  });
  for (const n of G) {
    if (!n.in) continue;
    n.in.forEach((i, k) => {
      const a = at(G, i), len = Math.hypot(n.x - a.x, n.y - a.y), ux = (n.x - a.x) / len, uy = (n.y - a.y) / len;
      const x1 = a.x + R * ux, y1 = a.y + R * uy, x2 = n.x - R * ux, y2 = n.y - R * uy;
      const dead = n.op === 'relu' && r.loc[n.id][k] === 0 && s.fw >= r.dep[n.id];
      p.arrow(x1, y1, x2, y2, dead ? '#3a4150' : '#5b6474', { width: 1.6 });
      const mx = (x1 + x2) / 2 - 0.2 * uy, my = (y1 + y2) / 2 + 0.2 * ux;
      // The weight on a wire is always seen; the local stretch only when asked for
      if (n.op === 'lin' && !s.loc) p.text(`×${r2(n.w[k])}`, mx, my, '#8b95a7', { size: 12 });
      if (s.loc && s.fw >= r.dep[n.id]) p.text(`×${r2(r.loc[n.id][k])}`, mx, my, dead ? '#5b6474' : COLORS.purple, { size: 13, weight: 600 });
      // Pulses: forward a yellow drop, backward a red one
      const f = s.fw - r.dep[n.id] + 1;
      if (f > 0 && f < 1) p.dot(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f, COLORS.yellow, 5);
      const g = s.bw - r.rdep[n.id];
      if (g > 0 && g < 1 && !dead) p.dot(x2 + (x1 - x2) * g, y2 + (y1 - y2) * g, COLORS.red, 5);
    });
  }
  for (const n of G) {
    const shown = s.fw >= r.dep[n.id], blamed = s.bw >= r.rdep[n.id] && !(n.ask && s.ask);
    const silent = n.op === 'relu' && shown && r.val[n.id] === 0;
    ctx.beginPath();
    ctx.arc(p.sx(n.x), p.sy(n.y), R * p.u, 0, 2 * Math.PI);
    ctx.fillStyle = silent ? '#161a22' : n.op === 'in' ? '#1d2633' : '#1a2230';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = n.op === 'in' ? COLORS.blue : silent ? '#3a4150' : '#8b95a7';
    ctx.stroke();
    p.text(n.name, n.x, n.y, silent ? '#5b6474' : '#e6e9ef', { size: 16, weight: 600 });
    if (GLYPH[n.op]) p.text(GLYPH[n.op], n.x, n.y + R + 0.48, '#6f7a8c', { size: 11 });
    if (shown) p.text(r2(r.val[n.id]), n.x, n.y + R + 0.2, '#e6e9ef', { size: 14, weight: 600 });
    if (blamed) p.text(r2(r.grad[n.id]), n.x, n.y - R - 0.2, r.grad[n.id] === 0 ? '#5b6474' : COLORS.red, { size: 14, weight: 700 });
    if (n.ask && s.ask) p.text(`? = ${r2(s.g)}`, n.x, n.y - R - 0.22, COLORS.yellow, { size: 14, weight: 700 });
  }
  return r;
}

const red = v => `\\red{${r2(v)}}`;

export default {
  view: '2d',
  view2d: WIN,
  lab: false,

  setup(scene) {
    scene.ensureParam('w', 0.5, { min: -2, max: 2, step: 0.05 });
    scene.ensureParam('b', 1, { min: -2, max: 2, step: 0.05 });
    scene.ensureParam('x', 2, { min: -1, max: 2.5, step: 0.05 });
    scene.ensureParam('q', 3, { min: -5, max: 5, step: 0.5 }); // the right answer for the point
    scene.ensureParam('fw', 0, { min: 0, max: 4, step: 0.01 }); // how far the numbers have run forward
    scene.ensureParam('bw', -1, { min: -1, max: 4, step: 0.01 }); // how far the blame has run back (−1: not started)
    scene.ensureParam('loc', 0, { min: 0, max: 1, step: 1 });
    scene.ensureParam('hl', 0, { min: 0, max: 3, step: 1 });
    scene.ensureParam('dw', 0.5, { min: 0.01, max: 0.5, step: 0.01 }); // the nudge of w
    scene.ensureParam('N', 24, { min: 4, max: 64, step: 1 }); // knobs of a network
    scene.ensureParam('k', 0, { min: 0, max: 1, step: 0.005 }); // the time of the race
    scene.ensureParam('n', 0, { min: 0, max: 8, step: 1 }); // steps of learning
    scene.ensureParam('ask', 0, { min: 0, max: 1, step: 1 });
    scene.ensureParam('g', 0, { min: -15, max: 15, step: 0.5 }); // the student's answer

    scene.custom.push(
      {
        id: 'line',
        draw2d(p, sc, s) { drawGraph(p, s, LINE, PATHS.line); },
        legend: s => {
          const r = run(LINE, s);
          return `\\begin{gathered} \\hat y = w \\cdot x + b = ${r2(r.val.yh)}, \\quad L = (\\hat y - ${r2(s.q)})^2 = ${r2(r.L)} \\\\ ${s.bw >= 3 && !s.ask ? `\\tfrac{\\partial L}{\\partial w} = ${red(r.grad.w)}, \\quad \\tfrac{\\partial L}{\\partial b} = ${red(r.grad.b)}` : `\\text{${t({ en: 'white — values, red — blame', ru: 'белые — значения, красные — вина' })}}\\ \\red{\\tfrac{\\partial L}{\\partial (\\cdot)}}`} \\end{gathered}`;
        },
      },
      {
        // The nudge: turn w a little and measure how much L moves
        id: 'nudge',
        draw2d(p, sc, s) {
          drawGraph(p, s, LINE, PATHS.line);
          const L0 = run(LINE, s).L, L1 = run(LINE, { ...s, w: s.w + s.dw }).L;
          const w = at(LINE, 'w');
          p.text(`w + ${r2(s.dw)}`, w.x, w.y + R + 0.75, COLORS.yellow, { size: 13, weight: 600 });
          p.text(`L → ${r2(L1)}`, 3, -0.6 + R + 0.75, COLORS.yellow, { size: 13, weight: 600 });
          p.text(`ΔL / Δw = ${r2((L1 - L0) / s.dw)}`, 0, 1.75, COLORS.yellow, { size: 16, weight: 700 });
        },
        legend: s => {
          const L0 = run(LINE, s).L, L1 = run(LINE, { ...s, w: s.w + s.dw }).L;
          return `\\frac{\\Delta L}{\\Delta w} = \\frac{${r2(L1)} - ${r2(L0)}}{${r2(s.dw)}} = \\yellow{${r2((L1 - L0) / s.dw)}}`;
        },
      },
      {
        id: 'net',
        draw2d(p, sc, s) { drawGraph(p, s, NET, PATHS.net); },
        legend: s => {
          const r = run(NET, s), [k1, k2] = [r.grad.yh * 1 * r.loc.h1[0] * 1, r.grad.yh * -1 * r.loc.h2[0] * 2];
          if (s.hl === 3) return `\\begin{gathered} \\tfrac{\\partial L}{\\partial x} = \\textcolor{${COLORS.teal}}{${r2(r.grad.yh)} \\cdot 1 \\cdot ${r.loc.h1[0]} \\cdot 1} + \\textcolor{${COLORS.orange}}{${r2(r.grad.yh)} \\cdot (-1) \\cdot ${r.loc.h2[0]} \\cdot 2} \\\\ = \\textcolor{${COLORS.teal}}{${r2(k1)}} + \\textcolor{${COLORS.orange}}{${r2(k2)}} = ${red(r.grad.x)} \\end{gathered}`;
          return `\\begin{gathered} z_1 = x + 0.5,\\ z_2 = 2x - 1.5,\\ h = \\max(0, z),\\ \\hat y = h_1 - h_2,\\ L = (\\hat y - 2)^2 \\\\ ${s.bw >= 4 && !s.ask ? `\\tfrac{\\partial L}{\\partial w_1} = ${red(r.wgrad.z1[0])},\\ \\tfrac{\\partial L}{\\partial w_2} = ${red(r.wgrad.z2[0])},\\ \\tfrac{\\partial L}{\\partial v_1} = ${red(r.wgrad.yh[0])},\\ \\tfrac{\\partial L}{\\partial v_2} = ${red(r.wgrad.yh[1])}` : `L = ${r2(r.L)}`} \\end{gathered}`;
        },
      },
      {
        // The race: N knobs. One by one: a run for the start and one more for every nudged knob.
        // Backward: one run forward and one back, and all N blames are known
        id: 'cost',
        draw2d(p, sc, s) {
          const N = s.N, tau = s.k * (N + 1), cols = 16;
          const lane = (y0, lit, title, runs, total) => {
            p.text(title, 0, y0 + 0.55, '#e6e9ef', { size: 15, weight: 600 });
            for (let i = 0; i < N; i++) {
              const x = -3.4 + 0.45 * (i % cols), y = y0 - 0.45 * Math.floor(i / cols);
              p.dot(x, y, lit(i) ? COLORS.yellow : '#2a3140', 7);
            }
            const done = runs >= total;
            p.text(`${t({ en: 'runs', ru: 'прогонов' })}: ${Math.min(total, Math.ceil(runs - 1e-9))}${done ? ' ✓' : ''}`, 0, y0 - 0.45 * Math.ceil(N / cols) - 0.05, done ? COLORS.green : '#8b95a7', { size: 14, weight: 600 });
          };
          lane(1.7, i => tau - 1 > i, t({ en: 'Nudge the knobs one by one', ru: 'Крутить ручки по одной' }), tau, N + 1);
          lane(-0.9, i => tau >= 2 || (tau > 1 && (N - i) / N <= tau - 1), t({ en: 'Forward once, back once', ru: 'Один раз вперёд, один назад' }), tau, 2);
        },
        legend: s => `\\begin{gathered} N = ${s.N}: \\quad N + 1 = ${s.N + 1} \\ \\text{${t({ en: 'runs', ru: 'прогонов' })}} \\quad \\text{${t({ en: 'against', ru: 'против' })}} \\quad 2 \\end{gathered}`,
      },
      {
        // Learning: the graph after n steps, and the misses as shrinking squares
        id: 'learn',
        draw2d(p, sc, s) {
          const path = learn(s, s.n), cur = { ...s, ...path[path.length - 1] };
          drawGraph(p, cur, LINE, PATHS.line);
          path.forEach((q, i) => {
            const e = run(LINE, { ...s, ...q }).val.yh - s.q, a = 0.9 * Math.abs(e), x0 = -3.2 + 0.75 * i, y0 = -2.6;
            p.fill([[x0, y0], [x0 + a, y0], [x0 + a, y0 + a], [x0, y0 + a]], COLORS.red + (i === path.length - 1 ? 'cc' : '55'));
          });
        },
        legend: s => {
          const path = learn(s, s.n), q = path[path.length - 1], r = run(LINE, { ...s, ...q });
          return `w \\leftarrow w - ${ETA}\\,\\tfrac{\\partial L}{\\partial w},\\ b \\leftarrow b - ${ETA}\\,\\tfrac{\\partial L}{\\partial b}: \\quad w = ${r2(q.w)},\\ b = ${r2(q.b)},\\ L = ${fmt(Math.round(r.L * 10000) / 10000)}`;
        },
      },
    );
  },

  steps: [
    {
      title: { en: 'A graph of tiny machines', ru: 'Граф из маленьких машин' },
      text: {
        en: 'Take the regression line and one point: at $x = 2$ the right answer is $3$. The line guesses $\\hat y = wx + b$, and the error is $L = (\\hat y - 3)^2$. Write the computation as a graph: every circle is a tiny machine that does one thing — multiplies, adds, squares. The blue circles are what we feed in; $w$ and $b$ are the knobs that learning will turn. Numbers run forward along the arrows.',
        ru: 'Возьмём прямую из регрессии и одну точку: при $x = 2$ правильный ответ $3$. Прямая угадывает $\\hat y = wx + b$, ошибка $L = (\\hat y - 3)^2$. Запишем вычисление графом: каждый кружок — маленькая машина, которая делает одно действие: умножает, складывает, возводит в квадрат. Синие кружки — то, что мы подаём на вход; $w$ и $b$ — ручки, которые будет крутить обучение. Числа бегут вперёд по стрелкам.',
      },
      try: { en: 'Turn $w$ and watch every number after it change.', ru: 'Крутите $w$ и смотрите, как меняются все числа после неё.' },
      state: { show: ['line'], params: { w: 0.5, b: 1, x: 2, q: 3, fw: 0, bw: -1, loc: 0, hl: 0, ask: 0 }, window: WIN, controls: ['w'] },
      enter(scene) { scene.animateParams({ fw: 3 }, 3500); },
    },
    {
      title: { en: 'Who is to blame?', ru: 'Кто виноват?' },
      text: {
        en: 'The error is $1$. To learn, the network must know for every knob: if I turn it a little, how much does $L$ change? That is $\\frac{\\partial L}{\\partial w}$ — the <b>blame</b> of $w$. It can be measured head-on: nudge $w$ by $\\Delta w$, run everything again and divide. With a small nudge the ratio settles at $-4$: turning $w$ up by $0.01$ lowers $L$ by about $0.04$.',
        ru: 'Ошибка равна $1$. Чтобы учиться, сеть должна знать для каждой ручки: если чуть повернуть её, насколько изменится $L$? Это $\\frac{\\partial L}{\\partial w}$ — <b>вина</b> ручки $w$. Её можно измерить в лоб: сдвинуть $w$ на $\\Delta w$, пересчитать всё заново и поделить. При малом сдвиге отношение устанавливается около $-4$: повернём $w$ вверх на $0.01$ — $L$ упадёт примерно на $0.04$.',
      },
      try: { en: 'Press ▶ at $dw$ or move it towards $0.01$.', ru: 'Нажмите ▶ у $dw$ или двигайте его к $0.01$.' },
      check: {
        q: { en: 'A network has a million knobs. How many full runs does the head-on way need to find all the blames?', ru: 'В сети миллион ручек. Сколько полных прогонов нужно способу «в лоб», чтобы найти вину каждой?' },
        options: [{ text: { en: 'About a million', ru: 'Около миллиона' }, ok: true }, { text: '$2$' }, { text: '$1$' }],
        explain: {
          en: 'One run for the start and one more for every nudged knob: a million and one. Too slow — training needs this at every step. Next: how to get all of them at once.',
          ru: 'Один прогон для начала и ещё по одному на каждую сдвинутую ручку: миллион и один. Слишком медленно — обучению это нужно на каждом шаге. Дальше — как получить всё сразу.',
        },
      },
      state: { show: ['nudge'], params: { w: 0.5, b: 1, x: 2, q: 3, fw: 3, bw: -1, loc: 0, hl: 0, dw: 0.5, ask: 0 }, window: WIN, controls: ['dw'] },
      enter(scene) { scene.animateParams({ dw: 0.01 }, 4000); },
    },
    {
      title: { en: 'Every machine knows only itself', ru: 'Каждая машина знает только себя' },
      text: {
        en: 'No machine knows the whole graph, but each knows how much it stretches a small change of each input — its <b>local</b> derivative, purple on the wires. The multiplier $w \\cdot x$: a nudge of $w$ comes out $x$ times bigger, so $\\times x = \\times 2$. The adder passes a nudge as it is: $\\times 1$. The square $(\\hat y - 3)^2$ stretches by $2(\\hat y - 3) = -2$. These are the derivatives of one simple function each — no chain yet.',
        ru: 'Никакая машина не знает весь граф, но каждая знает, во сколько раз растягивает малое изменение каждого своего входа, — свою <b>местную</b> производную, фиолетовую на проводе. Умножитель $w \\cdot x$: сдвиг $w$ выходит в $x$ раз больше, то есть $\\times x = \\times 2$. Сумматор передаёт сдвиг как есть: $\\times 1$. Квадрат $(\\hat y - 3)^2$ растягивает в $2(\\hat y - 3) = -2$ раза. Это производные одной простой функции каждая — цепочки пока нет.',
      },
      check: {
        q: { en: 'The local stretch of the multiplier $w \\cdot x$ along the wire from $x$?', ru: 'Местное растяжение умножителя $w \\cdot x$ по проводу от $x$?' },
        options: [{ text: '$w = 0.5$', ok: true }, { text: '$x = 2$' }, { text: '$1$' }],
        explain: {
          en: 'For $x$ the other input is the number in front: $\\frac{\\partial (wx)}{\\partial x} = w$. Each input of a multiplier is stretched by the other one.',
          ru: 'Для $x$ число перед ним — другой вход: $\\frac{\\partial (wx)}{\\partial x} = w$. Каждый вход умножителя растягивается другим входом.',
        },
      },
      state: { show: ['line'], params: { w: 0.5, b: 1, x: 2, q: 3, fw: 3, bw: -1, loc: 1, hl: 0, ask: 0 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'The blame runs backward', ru: 'Вина бежит назад' },
      text: {
        en: 'Now start from the end. The blame of $L$ for itself is $1$. Go back wire by wire and multiply by the local stretch: $\\hat y$ gets $1 \\cdot (-2) = -2$, the product $wx$ and $b$ get $-2 \\cdot 1 = -2$, and $w$ gets $-2 \\cdot 2 = -4$ — the same $-4$ that we measured with a nudge. One run back, and every knob has its number. This is <b>backpropagation</b>: the chain rule, worked from the end.',
        ru: 'Теперь начнём с конца. Вина $L$ перед самой собой равна $1$. Идём назад провод за проводом и умножаем на местное растяжение: $\\hat y$ получает $1 \\cdot (-2) = -2$, произведение $wx$ и $b$ — $-2 \\cdot 1 = -2$, а $w$ — $-2 \\cdot 2 = -4$, то же $-4$, что мы намерили сдвигом. Один прогон назад — и у каждой ручки своё число. Это и есть <b>обратное распространение</b>: цепное правило, которое считают с конца.',
      },
      try: { en: 'Change $w$: the numbers forward and the blames back are recomputed at once.', ru: 'Меняйте $w$: числа вперёд и вина назад пересчитываются сразу.' },
      state: { show: ['line'], params: { w: 0.5, b: 1, x: 2, q: 3, fw: 3, bw: 0, loc: 1, hl: 0, ask: 0 }, window: WIN, controls: ['w'] },
      enter(scene) { scene.animateParams({ bw: 3 }, 3500); },
    },
    {
      proof: true,
      statement: {
        en: '<b>Theorem.</b> The blame of a node is the sum over its wires forward: $\\frac{\\partial L}{\\partial v} = \\sum_c \\frac{\\partial L}{\\partial c} \\cdot \\frac{\\partial c}{\\partial v}$ — the blame of the next node times the local stretch. So going from the end, every blame is computed from blames that are already known.',
        ru: '<b>Теорема.</b> Вина узла — это сумма по его проводам вперёд: $\\frac{\\partial L}{\\partial v} = \\sum_c \\frac{\\partial L}{\\partial c} \\cdot \\frac{\\partial c}{\\partial v}$ — вина следующего узла, умноженная на местное растяжение. Поэтому, если идти с конца, каждая вина считается из уже известных.',
      },
      title: { en: 'Along a path the stretches multiply', ru: 'Вдоль пути растяжения перемножаются' },
      text: {
        en: 'When a node has one wire forward, the graph is a chain of machines, $L = f(g(h(w)))$, and the chain rule says: the stretches multiply. Along the path $w \\to wx \\to \\hat y \\to L$: $$\\frac{\\partial L}{\\partial w} = (-2) \\cdot 1 \\cdot 2 = -4.$$ Going backward we multiply them one at a time: the blame $-2$ of $\\hat y$ already contains the whole end of the path.',
        ru: 'Когда у узла один провод вперёд, граф — цепочка машин, $L = f(g(h(w)))$, и цепное правило говорит: растяжения перемножаются. Вдоль пути $w \\to wx \\to \\hat y \\to L$: $$\\frac{\\partial L}{\\partial w} = (-2) \\cdot 1 \\cdot 2 = -4.$$ Идя назад, мы умножаем их по одному: вина $-2$ узла $\\hat y$ уже содержит в себе весь конец пути.',
      },
      state: { show: ['line'], params: { w: 0.5, b: 1, x: 2, q: 3, fw: 3, bw: 3, loc: 1, hl: 1, ask: 0 }, window: WIN, controls: [] },
    },
    {
      proof: true,
      title: { en: 'Where the paths split, the blames add', ru: 'Где пути расходятся, вина складывается' },
      text: {
        en: 'In a network one number feeds several neurons. Here $x$ goes to $z_1$ and $z_2$. Nudge $x$ by $\\Delta x$: $z_1$ moves by $1 \\cdot \\Delta x$, $z_2$ by $2 \\Delta x$. Up close $L$ as a function of $(z_1, z_2)$ is a board (the gradient topic), and on a board the rises of two steps <b>add</b>: $\\Delta L \\approx \\frac{\\partial L}{\\partial z_1} \\Delta z_1 + \\frac{\\partial L}{\\partial z_2} \\Delta z_2$. Divide by $\\Delta x$: the blame of $x$ is the sum over the two paths, $-2 + 4 = 2$. The paths pull in opposite directions, and the sum decides. $\\blacksquare$',
        ru: 'В сети одно число подаётся сразу нескольким нейронам. Здесь $x$ идёт в $z_1$ и в $z_2$. Сдвинем $x$ на $\\Delta x$: $z_1$ сдвинется на $1 \\cdot \\Delta x$, $z_2$ — на $2 \\Delta x$. Вблизи $L$ как функция от $(z_1, z_2)$ — доска (тема про градиент), а на доске подъёмы двух шагов <b>складываются</b>: $\\Delta L \\approx \\frac{\\partial L}{\\partial z_1} \\Delta z_1 + \\frac{\\partial L}{\\partial z_2} \\Delta z_2$. Делим на $\\Delta x$: вина $x$ — сумма по двум путям, $-2 + 4 = 2$. Пути тянут в разные стороны, и решает сумма. $\\blacksquare$',
      },
      state: { show: ['net'], params: { x: 1, fw: 4, bw: 4, loc: 1, hl: 3, ask: 0 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'A silent neuron', ru: 'Молчащий нейрон' },
      text: {
        en: 'ReLU, $\\max(0, z)$, has the local stretch $1$ while $z > 0$ and $0$ when the neuron is silent. Move $x$ to the left: below $x = 0.75$ the second neuron goes dark, its wire stretches by $0$, and the blame stops there — $w_2$ and $v_2$ get $0$ and will not change at this step. That is the zero link of the long chain, seen on a real network.',
        ru: 'У ReLU, $\\max(0, z)$, местное растяжение $1$, пока $z > 0$, и $0$, когда нейрон молчит. Сдвиньте $x$ влево: при $x < 0.75$ второй нейрон гаснет, его провод растягивает в $0$ раз, и вина на нём останавливается — $w_2$ и $v_2$ получают $0$ и на этом шаге не изменятся. Это нулевое звено длинной цепочки, только на настоящей сети.',
      },
      try: { en: 'Drag $x$ between $-1$ and $2.5$. When does the first neuron go silent too?', ru: 'Двигайте $x$ от $-1$ до $2.5$. Когда замолкает и первый нейрон?' },
      check: {
        q: { en: 'The second neuron is silent for every point of the data. What happens to its weights during training?', ru: 'Второй нейрон молчит на всех точках данных. Что будет с его весами при обучении?' },
        options: [{ text: { en: 'They never change', ru: 'Они не меняются никогда' }, ok: true }, { text: { en: 'They shrink to zero', ru: 'Они уменьшаются до нуля' } }, { text: { en: 'They change the most', ru: 'Они меняются сильнее всех' } }],
        explain: {
          en: 'The blame of its weights is always $0$, so descent never moves them: the neuron is "dead". This is why networks are started from random weights and sometimes use a leaky ReLU with a small slope instead of $0$.',
          ru: 'Вина его весов всегда $0$, и спуск их не двигает: нейрон «мёртв». Поэтому сети начинают со случайных весов, а иногда берут «протекающий» ReLU с маленьким наклоном вместо $0$.',
        },
      },
      state: { show: ['net'], params: { x: 1, fw: 4, bw: 4, loc: 1, hl: 0, ask: 0 }, window: WIN, controls: ['x'] },
    },
    {
      title: { en: 'Why backward', ru: 'Почему назад' },
      text: {
        en: 'Compare the two ways on a network with $N$ knobs. Head-on: one run, then a nudge and a run for every knob — $N + 1$ runs. Backward: one run forward, one back, and all $N$ blames are ready — $2$ runs, however many knobs there are (a run back costs about as much as a run forward). Big language models have hundreds of billions of knobs; without backpropagation one step of learning would take years.',
        ru: 'Сравним два способа на сети с $N$ ручками. В лоб: один прогон, потом сдвиг и прогон на каждую ручку — $N + 1$ прогонов. Назад: один прогон вперёд, один назад — и все $N$ вин готовы: $2$ прогона, сколько бы ни было ручек (прогон назад стоит примерно как прогон вперёд). У больших языковых моделей сотни миллиардов ручек; без обратного распространения один шаг обучения занимал бы годы.',
      },
      try: { en: 'Press ▶ at $k$, then make $N$ bigger and run again.', ru: 'Нажмите ▶ у $k$, потом увеличьте $N$ и запустите снова.' },
      state: { show: ['cost'], params: { N: 24, k: 0 }, window: { cx: 0, cy: 0.1, unit: 100, grid: false, fit: [7.6, 6] }, controls: ['k', 'N'] },
      enter(scene) { scene.animateParams({ k: 1 }, 6000); },
    },
    {
      title: { en: 'One step of learning', ru: 'Один шаг обучения' },
      text: {
        en: 'Now learning is just descent from the gradient topic: every knob steps against its blame, $w \\leftarrow w - \\eta \\frac{\\partial L}{\\partial w}$. With $\\eta = 0.05$ here every step halves the miss, and the red squares of the error shrink four times. A network does the same with millions of knobs and thousands of points — forward, back, step, again.',
        ru: 'Теперь обучение — это просто спуск из темы про градиент: каждая ручка шагает против своей вины, $w \\leftarrow w - \\eta \\frac{\\partial L}{\\partial w}$. Здесь при $\\eta = 0.05$ каждый шаг вдвое уменьшает промах, а красные квадраты ошибки — вчетверо. Сеть делает то же с миллионами ручек и тысячами точек: вперёд, назад, шаг, снова.',
      },
      try: { en: 'Press ▶ at $n$.', ru: 'Нажмите ▶ у $n$.' },
      state: { show: ['learn'], params: { w: 0.5, b: 1, x: 2, q: 3, fw: 3, bw: 3, loc: 1, hl: 0, n: 0, ask: 0 }, window: { cx: 0, cy: -0.55, unit: 110, grid: false, fit: [7.6, 5] }, controls: ['n'] },
    },
    {
      title: { en: 'The blame of a knob', ru: 'Вина ручки' },
      text: {
        en: 'A new point: $x = 3$, the right answer $4$, the knobs $w = 1$, $b = -1$. The numbers forward and the blame of $\\hat y$ are known. Set $g$ to the blame of $w$, $\\frac{\\partial L}{\\partial w}$.',
        ru: 'Новая точка: $x = 3$, правильный ответ $4$, ручки $w = 1$, $b = -1$. Числа вперёд и вина $\\hat y$ уже известны. Поставьте $g$ равным вине ручки $w$, $\\frac{\\partial L}{\\partial w}$.',
      },
      task: {
        kind: 'drag',
        ok: s => Math.abs(s.g + 12) < 0.26,
        target: { g: -12 },
        back: 3,
        right: {
          en: 'Back from $\\hat y$: $-4$, through the adder $\\times 1$, through the multiplier $\\times x = \\times 3$: $-12$. Turning $w$ up lowers the error fast.',
          ru: 'Назад от $\\hat y$: $-4$, через сумматор $\\times 1$, через умножитель $\\times x = \\times 3$: $-12$. Повернуть $w$ вверх — ошибка быстро падает.',
        },
        mistakes: [
          { when: s => Math.abs(s.g + 4) < 0.26, text: { en: 'This is the blame of $\\hat y$ (and of $b$). On the way to $w$ there is one more machine — the multiplier, which stretches by $x$.', ru: 'Это вина $\\hat y$ (и $b$). По дороге к $w$ есть ещё машина — умножитель, он растягивает в $x$ раз.' } },
          { when: s => Math.abs(s.g - 12) < 0.26, text: { en: 'The size is right, the sign is not: $\\hat y = 2$ is below $4$, so making $w$ bigger <b>lowers</b> the error.', ru: 'Величина верна, знак — нет: $\\hat y = 2$ ниже $4$, поэтому увеличение $w$ <b>уменьшает</b> ошибку.' } },
          { when: s => Math.abs(s.g + 6) < 0.26, text: { en: 'You multiplied the miss $-2$ by $x$ — but the square stretches by $2 \\cdot (-2)$, so start from $-4$.', ru: 'Вы умножили промах $-2$ на $x$ — но квадрат растягивает в $2 \\cdot (-2)$ раза, начните с $-4$.' } },
        ],
        hint: () => ({ en: 'Go from $\\hat y$ to $w$ wire by wire and multiply by the purple numbers.', ru: 'Идите от $\\hat y$ к $w$ провод за проводом и умножайте на фиолетовые числа.' }),
      },
      state: { show: ['line'], params: { w: 1, b: -1, x: 3, q: 4, fw: 3, bw: 1, loc: 1, hl: 0, ask: 1, g: 0 }, window: WIN, controls: ['g'] },
    },
    {
      title: { en: 'Two paths', ru: 'Два пути' },
      text: {
        en: 'The network at $x = 1.25$. The blame of $\\hat y$ is known. Set $g$ to the blame of the input, $\\frac{\\partial L}{\\partial x}$.',
        ru: 'Сеть при $x = 1.25$. Вина $\\hat y$ известна. Поставьте $g$ равным вине входа, $\\frac{\\partial L}{\\partial x}$.',
      },
      task: {
        kind: 'drag',
        ok: s => Math.abs(s.g - 2.5) < 0.26,
        target: { g: 2.5 },
        back: 5,
        right: {
          en: 'The upper path: $-2.5 \\cdot 1 \\cdot 1 \\cdot 1 = -2.5$; the lower: $-2.5 \\cdot (-1) \\cdot 1 \\cdot 2 = 5$. Together $2.5$.',
          ru: 'Верхний путь: $-2.5 \\cdot 1 \\cdot 1 \\cdot 1 = -2.5$; нижний: $-2.5 \\cdot (-1) \\cdot 1 \\cdot 2 = 5$. Вместе $2.5$.',
        },
        mistakes: [
          { when: s => Math.abs(s.g + 2.5) < 0.26, text: { en: 'That is only the upper path. $x$ also feeds the lower neuron — add its path.', ru: 'Это только верхний путь. $x$ подаётся и в нижний нейрон — добавьте его путь.' } },
          { when: s => Math.abs(s.g - 5) < 0.26, text: { en: 'That is only the lower path. Add the upper one.', ru: 'Это только нижний путь. Добавьте верхний.' } },
          { when: s => Math.abs(s.g + 7.5) < 0.26 || Math.abs(s.g - 7.5) < 0.26, text: { en: 'The paths are added with their signs: $-2.5 + 5$.', ru: 'Пути складываются со своими знаками: $-2.5 + 5$.' } },
        ],
        hint: () => ({ en: 'Two paths lead from $x$ to $\\hat y$. Multiply the purple numbers along each and add the two.', ru: 'Из $x$ в $\\hat y$ ведут два пути. Перемножьте фиолетовые числа вдоль каждого и сложите.' }),
      },
      state: { show: ['net'], params: { x: 1.25, fw: 4, bw: 1, loc: 1, hl: 0, ask: 1, g: 0 }, window: WIN, controls: ['g'] },
    },
  ],
};
