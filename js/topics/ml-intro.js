// An introduction to machine learning. First a film (films/intro.js): rules against examples, the nerve cell
// and the artificial neuron, weights as the strength of synapses, learning from mistakes, brain and network.
// Then the same neuron on the live scene: decide yourself, watch it learn from the diary, find weights by hand.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';
import { DAYS, fires, perceptron } from './ml-math.js';

const r2 = v => fmt(Math.round(v * 100) / 100 + 0);
const WIN = { cx: 0.5, cy: 0, unit: 80, grid: false, fit: [11, 6.6] };
const NAMES = [{ en: 'sun', ru: 'солнце' }, { en: 'weekend', ru: 'выходной' }, { en: 'rain', ru: 'дождь' }];
const ICON = [COLORS.yellow, COLORS.green, COLORS.blue];
const HISTORY = perceptron(DAYS, 48);
const OUT = { en: 'out', ru: 'гул.' }, HOME = { en: 'home', ru: 'дома' };

// The neuron: three inputs on the left, wires as thick as the weights (teal for, red against),
// the adder with its threshold, the decision on the right. ox, oy — where its body is, k — its size
function neuron(p, x, w, T, { ox = 0, oy = 0, k = 1 } = {}) {
  const sum = w.reduce((m, v, i) => m + v * x[i], 0), fire = sum > T;
  x.forEach((v, i) => {
    const ix = ox - 3 * k, iy = oy + (1.6 - 1.6 * i) * k;
    const c = w[i] > 0 ? COLORS.teal : w[i] < 0 ? COLORS.red : '#3a4150';
    p.line(ix + 0.4 * k, iy, ox - 0.5 * k, oy + (0.25 - 0.25 * i) * k, v ? c : c + '55', { width: 1.5 + 3 * Math.min(2, Math.abs(w[i])) });
    p.text(r2(w[i]), ox - 1.6 * k, oy + (1.05 - 1.05 * i) * k + 0.22 * k, c, { size: 14, weight: 700 });
    p.dot(ix, iy, v ? ICON[i] : '#2a3140', 15 * k);
    p.text(String(v), ix, iy, '#0d1117', { size: 15, weight: 700 });
    p.text(t(NAMES[i]), ix, iy - 0.42 * k, '#8b95a7', { size: 12 });
  });
  p.dot(ox, oy, fire ? COLORS.yellow : '#1a2230', 30 * k);
  p.text('Σ', ox, oy + 0.08 * k, fire ? '#0d1117' : '#e6e9ef', { size: 20, weight: 700 });
  p.text(`${r2(sum)} ${fire ? '>' : '≤'} ${r2(T)}`, ox, oy - 0.6 * k, '#e6e9ef', { size: 13 });
  p.arrow(ox + 0.45 * k, oy, ox + 1.6 * k, oy, fire ? COLORS.yellow : '#5b6474', { width: 3 });
  p.text(fire ? t({ en: 'walk', ru: 'гулять' }) : t({ en: 'home', ru: 'дома' }), ox + 2.2 * k, oy, fire ? COLORS.yellow : '#8b95a7', { size: 16, weight: 700 });
  return { sum, fire };
}

// The diary: eight days, what really happened and what the neuron with the weights w says
function diary(p, w, T, { x0 = 1.4, y0 = 2.6, mark = -1 } = {}) {
  p.text(t({ en: 'diary', ru: 'дневник' }), x0 + 1.4, y0 + 0.5, '#e6e9ef', { size: 14, weight: 600 });
  p.text(t({ en: 'real', ru: 'было' }), x0 + 1.85, y0 + 0.12, '#8b95a7', { size: 11 });
  p.text(t({ en: 'neuron', ru: 'нейрон' }), x0 + 3.2, y0 + 0.12, '#8b95a7', { size: 11 });
  let wrong = 0;
  DAYS.forEach((d, i) => {
    const y = y0 - 0.32 - 0.6 * i, g = fires(w, T, d), ok = g === d[3];
    if (!ok) wrong++;
    if (i === mark) p.fill([[x0 - 0.35, y - 0.27], [x0 + 4, y - 0.27], [x0 + 4, y + 0.27], [x0 - 0.35, y + 0.27]], 'rgba(244,211,94,0.15)');
    d.slice(0, 3).forEach((v, j) => p.dot(x0 + 0.42 * j, y, v ? ICON[j] : '#2a3140', 8));
    p.text(t(d[3] ? OUT : HOME), x0 + 1.85, y, d[3] ? COLORS.yellow : '#8b95a7', { size: 13, weight: 600 });
    p.text(`${t(g ? OUT : HOME)} ${ok ? '✓' : '✗'}`, x0 + 3.2, y, ok ? COLORS.green : COLORS.red, { size: 13, weight: 700 });
  });
  return wrong;
}

export default {
  view: '2d',
  view2d: WIN,
  lab: false,
  film: () => import('./films/intro.js').then(m => m.default),

  setup(scene) {
    for (const [n, v] of [['x1', 1], ['x2', 1], ['x3', 0]]) scene.ensureParam(n, v, { min: 0, max: 1, step: 1 });
    for (const [n, v] of [['w1', 1], ['w2', 1], ['w3', -2]]) scene.ensureParam(n, v, { min: -3, max: 3, step: 0.5 });
    scene.ensureParam('T', 0.5, { min: -2, max: 4, step: 0.5 }); // the threshold
    scene.ensureParam('k', 0, { min: 0, max: 48, step: 1 }); // examples of the diary seen

    scene.custom.push(
      {
        id: 'one',
        draw2d(p, sc, s) { neuron(p, [s.x1, s.x2, s.x3], [s.w1, s.w2, s.w3], s.T, { ox: 0.4 }); },
        legend: s => {
          const sum = s.w1 * s.x1 + s.w2 * s.x2 + s.w3 * s.x3;
          return `${r2(s.w1)} \\cdot ${s.x1} + ${r2(s.w2)} \\cdot ${s.x2} + (${r2(s.w3)}) \\cdot ${s.x3} = ${r2(sum)} \\ ${sum > s.T ? '>' : '\\le'} \\ ${r2(s.T)}`;
        },
      },
      {
        // Learning: the weights after k examples, the example being looked at, the whole diary under them
        id: 'learn',
        draw2d(p, sc, s) {
          const h = HISTORY[Math.round(s.k)], last = Math.round(s.k) > 0 ? HISTORY[Math.round(s.k) - 1] : null;
          neuron(p, DAYS[h.day].slice(0, 3), h.w, 0.5, { ox: -1.6, oy: 0.2, k: 0.85 });
          diary(p, h.w, 0.5, { mark: h.day });
          if (last) p.text(last.ok ? t({ en: `day ${last.day + 1}: right — nothing changes`, ru: `день ${last.day + 1}: угадал — веса те же` }) : t({ en: `day ${last.day + 1}: wrong — the weights moved`, ru: `день ${last.day + 1}: ошибся — веса сдвинулись` }), -1.6, -2.5, last.ok ? COLORS.green : COLORS.red, { size: 14, weight: 600 });
        },
        legend: s => {
          const h = HISTORY[Math.round(s.k)];
          return `\\text{${t({ en: 'examples seen', ru: 'примеров' })}: ${Math.round(s.k)}} \\qquad w = (${h.w.map(r2).join(';\\ ')})`;
        },
      },
      {
        id: 'mine',
        draw2d(p, sc, s) {
          const w = [s.w1, s.w2, s.w3];
          diary(p, w, s.T);
          neuron(p, [1, 1, 1], w, s.T, { ox: -1.6, oy: 0.2, k: 0.85 });
          p.text(t({ en: 'a rainy weekend with sun', ru: 'солнечный дождливый выходной' }), -1.6, -2.5, '#8b95a7', { size: 13 });
        },
        legend: s => `\\text{${t({ en: 'right', ru: 'угадано' })}: ${DAYS.filter(d => fires([s.w1, s.w2, s.w3], s.T, d) === d[3]).length} / 8}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'Your neuron', ru: 'Ваш нейрон' },
      text: {
        en: 'The neuron from the film. The inputs are $1$ or $0$: is there sun, is it a weekend, is it raining. Each is multiplied by its weight, the products are added, and if the sum is above the threshold $T$, the answer is "walk". Teal wires are "for", red ones "against", thicker means stronger.',
        ru: 'Нейрон из ролика. Входы — $1$ или $0$: есть ли солнце, выходной ли, идёт ли дождь. Каждый умножается на свой вес, произведения складываются, и если сумма больше порога $T$, ответ — «гулять». Бирюзовые провода — «за», красные — «против», чем толще, тем сильнее.',
      },
      try: { en: 'Switch the inputs $x_1, x_2, x_3$ and turn the weights.', ru: 'Переключайте входы $x_1, x_2, x_3$ и крутите веса.' },
      check: {
        q: { en: 'Which rain weight keeps the neuron at home in any rain, whatever the sun and the day?', ru: 'Какой вес дождя оставит нейрон дома в любой дождь, что бы ни было с солнцем и днём?' },
        options: [{ text: '$w_3 = -3$', ok: true }, { text: '$w_3 = 0$' }, { text: '$w_3 = 3$' }],
        explain: {
          en: 'At most the sun and the weekend give $1 + 1 = 2$; with $-3$ the sum is $-1$, below the threshold. Rain then "vetoes" the walk.',
          ru: 'Солнце и выходной дают самое большее $1 + 1 = 2$; с $-3$ сумма $-1$ — ниже порога. Дождь тогда «накладывает вето» на прогулку.',
        },
      },
      state: { show: ['one'], params: { x1: 1, x2: 1, x3: 0, w1: 1, w2: 1, w3: -2, T: 0.5 }, window: WIN, controls: ['x1', 'x2', 'x3', 'w1', 'w2', 'w3', 'T'] },
    },
    {
      title: { en: 'It learns from the diary', ru: 'Учится по дневнику' },
      text: {
        en: 'Start with all weights $0$ and show the neuron the eight days of the diary one by one. A right guess changes nothing. After a wrong one every input that was on moves its weight by $0.5$ towards the right answer. After six passes all eight days are right: the neuron found the rule "no rain, and sun or a weekend" by itself.',
        ru: 'Начнём со всех весов $0$ и будем показывать нейрону восемь дней дневника по очереди. Угадал — ничего не меняется. Ошибся — каждый включённый вход сдвигает свой вес на $0.5$ к правильному ответу. После шести проходов угаданы все восемь дней: нейрон сам нашёл правило «без дождя, и солнце или выходной».',
      },
      try: { en: 'Press ▶ at $k$ or move it step by step.', ru: 'Нажмите ▶ у $k$ или двигайте по шагу.' },
      state: { show: ['learn'], params: { k: 0 }, window: WIN, controls: ['k'] },
    },
    {
      title: { en: 'Find the weights yourself', ru: 'Подберите веса сами' },
      text: {
        en: 'Set the weights and the threshold so that the neuron is right on all eight days of the diary.',
        ru: 'Поставьте веса и порог так, чтобы нейрон угадал все восемь дней дневника.',
      },
      task: {
        kind: 'drag',
        ok: s => DAYS.every(d => fires([s.w1, s.w2, s.w3], s.T, d) === d[3]),
        target: { w1: 1, w2: 1, w3: -2, T: 0.5 },
        back: 1,
        right: {
          en: 'Rain must outweigh the sun and the weekend together, and either of them alone must pass the threshold. For example $1, 1, -2$ with $T = 0.5$.',
          ru: 'Дождь должен перевешивать солнце и выходной вместе, а любое из них по отдельности — проходить порог. Например, $1, 1, -2$ при $T = 0.5$.',
        },
        mistakes: [
          { when: s => s.w3 >= 0, text: { en: 'Rain does not hold the neuron back: its weight must be negative.', ru: 'Дождь не удерживает нейрон дома: его вес должен быть отрицательным.' } },
          { when: s => s.w1 + s.w2 + s.w3 > s.T, text: { en: 'On a rainy sunny weekend it still goes: rain must outweigh $w_1 + w_2$.', ru: 'В дождливый солнечный выходной он всё равно идёт: дождь должен перевешивать $w_1 + w_2$.' } },
        ],
        hint: s => {
          const i = DAYS.findIndex(d => fires([s.w1, s.w2, s.w3], s.T, d) !== d[3]), d = DAYS[i];
          return { en: `Look at day ${i + 1}: sun ${d[0]}, weekend ${d[1]}, rain ${d[2]} — she ${d[3] ? 'went out' : 'stayed home'}.`, ru: `Посмотрите на день ${i + 1}: солнце ${d[0]}, выходной ${d[1]}, дождь ${d[2]} — она ${d[3] ? 'гуляла' : 'была дома'}.` };
        },
      },
      state: { show: ['mine'], params: { w1: 0, w2: 0, w3: 0, T: 0.5 }, window: WIN, controls: ['w1', 'w2', 'w3', 'T'] },
    },
  ],
};
