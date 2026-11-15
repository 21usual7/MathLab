// The film of a neural network: one neuron is one line and cannot enclose a disc; the visual system of the
// brain builds simple features first and combines them later; three neurons together light everything but a
// triangle; all a network knows are the numbers on its wires; training moves them from a random start.

import { beat, mix, clamp } from '../../ui/film.js';
import { C, bioNeuron } from './draw.js';
import { ring, initNet, trainFilm, forward, correct } from '../ml-math.js';

const L = (ru, en) => ({ ru, en });
const DATA = ring();
const NEU = [C.red, C.green, C.purple];
// The plane: centre (300, 280), 55 px per unit
const P = { x: 300, y: 280, u: 55, r: 3.7 };
const sx = x => P.x + P.u * x, sy = y => P.y - P.u * y;

// The real training of the network topic (seed 1, three neurons), every 20 epochs
let TRAIN = null;
export const training = () => (TRAIN ??= trainFilm(initNet(3, 1), DATA, 0.05, 3000, 20));

function plane(g, { tint = null, lines = [], dots = 1 } = {}) {
  const { ctx } = g;
  g.box(sx(-P.r), sy(P.r), 2 * P.r * P.u, 2 * P.r * P.u, '#0b0f15', '#2a3140', 10);
  ctx.save(); ctx.beginPath(); ctx.rect(sx(-P.r), sy(P.r), 2 * P.r * P.u, 2 * P.r * P.u); ctx.clip();
  if (tint) {
    const n = 37, h = 2 * P.r / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = -P.r + (i + 0.5) * h, y = -P.r + (j + 0.5) * h, c = tint(x, y);
      if (c) { ctx.fillStyle = c; ctx.fillRect(sx(x - h / 2), sy(y + h / 2), h * P.u + 0.6, h * P.u + 0.6); }
    }
  }
  // A line w·P + b = 0 with an arrow to its active side
  lines.forEach(({ w, b, color, a = 1 }) => g.alpha(a, () => {
    const n = Math.hypot(w[0], w[1]) || 1, ux = w[0] / n, uy = w[1] / n, d = -b / n;
    const x0 = ux * d, y0 = uy * d;
    g.line(sx(x0 - 6 * uy), sy(y0 + 6 * ux), sx(x0 + 6 * uy), sy(y0 - 6 * ux), color, 3);
    g.arrow(sx(x0), sy(y0), sx(x0 + 0.6 * ux), sy(y0 + 0.6 * uy), color, 2.5, 9);
  }));
  ctx.restore();
  g.alpha(dots, () => DATA.forEach(([x, y, c]) => g.circle(sx(x), sy(y), 5, c ? C.blue : C.orange, '#050607', 1.5)));
}
// The hand-made triangle: line i has the normal at angle a + 120°·i and is d away from the centre; it fires outside
const handNet = (d, turn) => [0, 1, 2].map(i => { const a = Math.PI / 2 + turn + 2 * Math.PI * i / 3; return { w: [Math.cos(a), Math.sin(a)], b: -d }; });
const glow = (lines, x, y) => lines.map(l => Math.max(0, l.w[0] * x + l.w[1] * y + l.b));

// A small diagram of the network: 2 inputs → 3 neurons → 1 output; widths from the weights
function diagram(g, x0, y0, net, { pulse = -1, highlight = -1 } = {}) {
  const inp = [[x0, y0 - 60], [x0, y0 + 60]], hid = [0, 1, 2].map(i => [x0 + 150, y0 - 110 + 110 * i]), out = [x0 + 300, y0];
  hid.forEach((h, i) => {
    inp.forEach((p, k) => { const w = net.W[i][k]; g.line(p[0], p[1], h[0], h[1], (w > 0 ? C.teal : C.red) + (highlight === i ? 'ff' : 'aa'), 1 + 3 * Math.min(2.5, Math.abs(w)) + (highlight === i ? 2 : 0)); });
    const v = net.v ? net.v[i] : -1;
    g.line(h[0], h[1], out[0], out[1], (v > 0 ? C.teal : C.red) + 'aa', 1 + 2 * Math.min(3, Math.abs(v)));
  });
  if (pulse >= 0) {
    const k = pulse % 1;
    inp.forEach(p => hid.forEach(h => g.circle(mix(p[0], h[0], clamp(2 * k)), mix(p[1], h[1], clamp(2 * k)), 4, C.yellow, null)));
    if (k > 0.5) hid.forEach(h => g.circle(mix(h[0], out[0], 2 * k - 1), mix(h[1], out[1], 2 * k - 1), 4, C.yellow, null));
  }
  inp.forEach((p, k) => { g.circle(p[0], p[1], 20, '#101a24', C.blue, 2); g.text(k ? 'y' : 'x', p[0], p[1], 18, C.blue, 'center', 600); });
  hid.forEach((h, i) => { g.circle(h[0], h[1], 22, '#141b26', NEU[i], 3); g.text(`h${'₁₂₃'[i]}`, h[0], h[1], 16, NEU[i], 'center', 600); });
  g.circle(out[0], out[1], 24, '#141b26', C.white, 3); g.text('p', out[0], out[1], 18, C.white, 'center', 600);
}

export default {
  title: L('Нейрон, веса и сеть', 'A neuron, weights and a network'),
  cover: L('Почему одного нейрона мало,\nчто знает сеть и как она учится', 'Why one neuron is not enough,\nwhat a network knows and how it learns'),
  note: L('Обучение в ролике — настоящее: та же сеть и те же точки, что в теме.', 'The training in the film is real: the same network and the same points as in the topic.'),
  state: () => ({ d: 1.15, turn: 0 }),
  chapters: [
    {
      id: 'one', duration: 12, title: L('Один нейрон — одна прямая', 'One neuron — one line'),
      caption: p => p < 0.45 ? L('Задача: отличить синие точки от оранжевых. Один нейрон проводит прямую: по одну сторону он «молчит», по другую — «светится».', 'The task: tell the blue points from the orange ones. One neuron draws a line: on one side it is silent, on the other it lights up.')
        : L('Как ни поворачивай прямую — синий круг внутри кольца ею не отделить: с любой стороны окажутся и синие, и оранжевые.', 'However the line is turned, it cannot cut the blue disc out of the ring: each side gets both blue and orange points.'),
      ask: {
        at: 0.9,
        q: L('Сколько прямых нужно, чтобы со всех сторон окружить синий круг?', 'How many lines are needed to enclose the blue disc from all sides?'),
        options: [{ text: L('Хотя бы три', 'At least three'), ok: true }, { text: L('Две', 'Two') }, { text: L('Одна, если её повернуть', 'One, if turned right') }],
        explain: L('Две прямые не замыкают область — она уходит в бесконечность. Треугольник из трёх прямых — самая простая замкнутая фигура. Значит, нужны три нейрона.', 'Two lines do not close a region — it runs off to infinity. A triangle of three lines is the simplest closed figure. So three neurons are needed.'),
      },
      paint(g, p) {
        const a = 0.3 + 2.4 * beat(p, 0.1, 0.85), d = 0.4 * Math.sin(6 * p), l = { w: [Math.cos(a), Math.sin(a)], b: -d };
        plane(g, { tint: (x, y) => (l.w[0] * x + l.w[1] * y + l.b > 0 ? 'rgba(244,211,94,0.14)' : null), lines: [{ ...l, color: C.yellow }] });
        g.alpha(beat(p, 0.45, 0.55), () => { g.text(L('синие и оранжевые', 'blue and orange'), 780, 230, 20, C.white); g.text(L('по обе стороны', 'on both sides'), 780, 262, 20, C.white); g.text('✗', 780, 320, 46, C.red, 'center', 700); });
      },
    },
    {
      id: 'eye', duration: 15, title: L('Как видит мозг', 'How the brain sees'),
      caption: p => p < 0.5 ? L('В зрительной коре есть нейроны, которые отзываются на линию под своим углом: один — на вертикальную, другой — на наклонную (Хьюбел и Визел, 1960-е).', 'The visual cortex has neurons that respond to a line at their own angle: one to a vertical line, another to a slanted one (Hubel and Wiesel, 1960s).')
        : L('Следующие слои складывают линии в углы и формы, ещё дальше — в лица. Нейросеть устроена похоже: первый слой видит простое, следующие — сочетания.', 'The next layers combine lines into corners and shapes, further on into faces. A neural network is built in a similar way: the first layer sees simple things, the next ones combinations.'),
      paint(g, p) {
        // The eye
        g.alpha(beat(p, 0, 0.08), () => { g.ctx.save(); g.ctx.beginPath(); g.ctx.ellipse(110, 280, 60, 36, 0, 0, 2 * Math.PI); g.ctx.fillStyle = '#e6e9ef'; g.ctx.fill(); g.ctx.restore(); g.circle(110, 280, 24, C.blue, null); g.circle(110, 280, 11, '#050607', null); });
        const cols = [[330, L('линии', 'lines'), 0.08], [580, L('углы, формы', 'corners, shapes'), 0.42], [830, L('лицо', 'a face'), 0.62]];
        cols.forEach(([x, name, t0], c) => g.alpha(beat(p, t0, t0 + 0.08), () => {
          g.text(name, x, 70, 20, C.white, 'center', 600);
          const n = c === 2 ? 1 : 4;
          for (let i = 0; i < n; i++) {
            const y = c === 2 ? 280 : 140 + 95 * i, on = Math.sin(p * 30 + i * 2 + c) > 0.2;
            g.circle(x - 60, y, 16, on ? C.yellow : '#2e2747', C.purple, 2);
            g.box(x - 30, y - 34, 110, 68, '#0f141c', '#2a3140', 8);
            if (c === 0) { const a = i * Math.PI / 4; g.line(x + 25 - 24 * Math.cos(a), y - 24 * Math.sin(a), x + 25 + 24 * Math.cos(a), y + 24 * Math.sin(a), C.white, 3); }
            if (c === 1) { const s = [[[-25, 20], [0, -20], [25, 20]], [[-25, -20], [-25, 20], [25, 20]], [[-25, 0], [0, -22], [25, 0], [0, 22], [-25, 0]], [[-25, -15], [25, -15], [25, 15], [-25, 15], [-25, -15]]][i]; g.curve(s.map(([a, b]) => [x + 25 + a, y + b]), C.white, 3); }
            if (c === 2) { g.circle(x + 25, y, 28, null, C.white, 3); g.circle(x + 15, y - 8, 3, C.white, null); g.circle(x + 35, y - 8, 3, C.white, null); g.curve([[x + 12, y + 10], [x + 25, y + 16], [x + 38, y + 10]], C.white, 2); }
          }
          // Links from the previous column
          const prev = c === 0 ? [[170, 280]] : c === 1 ? [0, 1, 2, 3].map(i => [cols[0][0] + 80, 140 + 95 * i]) : [0, 1, 2, 3].map(i => [cols[1][0] + 80, 140 + 95 * i]);
          const here = c === 2 ? [[x - 76, 280]] : [0, 1, 2, 3].map(i => [x - 76, 140 + 95 * i]);
          prev.forEach(a => here.forEach(b => g.line(a[0], a[1], b[0], b[1], C.purple + '44', 1.5)));
        }));
      },
    },
    {
      id: 'team', duration: 16, title: L('Три нейрона вместе', 'Three neurons together'),
      caption: p => p < 0.55 ? L('Возьмём три нейрона. Каждый — своя прямая и своя лампа: за прямой светит, тем ярче, чем дальше. Внутрь треугольника не достаёт ни одна.', 'Take three neurons. Each is its own line and its own lamp: past the line it shines, the brighter the further. None of them reaches into the triangle.')
        : L('Выходной нейрон смотрит на общий свет: темно — значит синий, светло — оранжевый. Вместе три прямые сделали то, чего не могла одна: окружили круг.', 'The output neuron looks at the total light: dark means blue, light means orange. Together the three lines did what one could not: they enclosed the disc.'),
      lens: {
        text: L('Двигайте прямые: расстояние от центра и поворот треугольника. Когда все синие в темноте, а все оранжевые на свету?', 'Move the lines: their distance from the centre and the turn of the triangle. When are all blue points in the dark and all orange ones in the light?'),
        knobs: [{ key: 'd', label: L('расстояние d', 'distance d'), min: 0.3, max: 2.6, step: 0.05 }, { key: 'turn', label: L('поворот', 'turn'), min: 0, max: 2.1, step: 0.05 }],
      },
      paint(g, p, st) {
        const lines = handNet(st.d, st.turn), shown = [0, 1, 2].map(i => beat(p, 0.08 + 0.13 * i, 0.16 + 0.13 * i)), out = beat(p, 0.55, 0.65);
        plane(g, {
          tint: (x, y) => {
            const h = glow(lines, x, y).map((v, i) => v * shown[i]), s = h[0] + h[1] + h[2];
            if (out > 0.5) return s < 0.25 ? 'rgba(88,196,221,0.22)' : 'rgba(255,159,90,0.2)';
            const rgb = [[252, 98, 85], [131, 193, 103], [182, 157, 248]], c = [0, 0, 0];
            h.forEach((v, i) => { const k = Math.min(1, 0.5 * v); for (let j = 0; j < 3; j++) c[j] += rgb[i][j] * k; });
            return s > 0.02 ? `rgba(${Math.min(255, c[0])},${Math.min(255, c[1])},${Math.min(255, c[2])},0.4)` : null;
          },
          lines: lines.map((l, i) => ({ ...l, color: NEU[i], a: shown[i] })),
        });
        g.alpha(beat(p, 0.3, 0.4), () => diagram(g, 640, 280, { W: lines.map(l => l.w), v: [-1, -1, -1] }));
        g.alpha(out, () => {
          const ok = correct(DATA, (x, y) => (glow(lines, x, y).reduce((a, b) => a + b) < 0.25 ? 1 : 0));
          g.text(`${ok} / ${DATA.length}`, 790, 470, 30, ok === DATA.length ? C.green : C.yellow, 'center', 700);
          g.text(L('верно', 'right'), 790, 505, 16, C.muted);
        });
      },
    },
    {
      id: 'weights', duration: 14, title: L('Всё знание — в числах на проводах', 'All the knowledge is in the numbers on the wires'),
      caption: p => p < 0.5 ? L('Положение каждой прямой задают числа на проводах — веса. Повернём один вес первого нейрона: его прямая поворачивается.', 'The position of each line is set by the numbers on the wires — the weights. Turn one weight of the first neuron: its line turns.')
        : L('У этой сети всего 13 чисел: по три у каждого из трёх нейронов (два веса и сдвиг) и четыре у выходного. Это всё, что она «знает». У больших языковых моделей таких чисел сотни миллиардов.', 'This network has just 13 numbers: three for each of the three neurons (two weights and a shift) and four for the output one. That is everything it "knows". Big language models have hundreds of billions of them.'),
      paint(g, p) {
        const base = handNet(1.15, 0), wob = 0.6 * Math.sin(2 * Math.PI * 2 * beat(p, 0.1, 0.5)), a = Math.PI / 2 + wob;
        const lines = base.map((l, i) => (i ? l : { w: [Math.cos(a), Math.sin(a)], b: -1.15 }));
        plane(g, { lines: lines.map((l, i) => ({ ...l, color: NEU[i] })) });
        diagram(g, 640, 280, { W: lines.map(l => l.w), v: [-1, -1, -1] }, { highlight: 0, pulse: p > 0.55 ? p * 6 : -1 });
        g.text(`w = (${lines[0].w.map(v => (Math.round(v * 100) / 100).toFixed(2).replace('-', '−')).join('; ')})`, 760, 80, 20, NEU[0], 'center', 600);
        g.alpha(beat(p, 0.55, 0.65), () => { g.text('13', 790, 470, 40, C.yellow, 'center', 700); g.text(L('чисел — вся сеть', 'numbers — the whole network'), 790, 510, 16, C.muted); });
      },
    },
    {
      id: 'train', duration: 18, title: L('Обучение со случайного старта', 'Training from a random start'),
      caption: p => {
        const f = training(), k = Math.min(f.length - 1, Math.floor(beat(p, 0.08, 0.9) * (f.length - 1))), ok = correct(DATA, (x, y) => forward(f[k].net, x, y).out);
        return p < 0.15 ? L('Никто не ставит прямые руками. Сначала все 13 чисел случайные — прямые разбросаны как попало.', 'Nobody places the lines by hand. At first all 13 numbers are random — the lines are scattered anyhow.')
          : ok < DATA.length ? L(`Каждый шаг немного сдвигает все числа против ошибки — как шар в долине, только ручек 13. Прямые ползут на места. Угадано ${ok} из ${DATA.length}.`, `Each step moves all the numbers a little against the error — like the ball in the valley, but with 13 knobs. The lines crawl into place. ${ok} of ${DATA.length} right.`)
            : L('Все 70 точек угаданы. Сеть сама нашла свои прямые — не обязательно наши. Как она узнаёт, какое число сдвигать и насколько, — тема «Обратное распространение».', 'All 70 points are right. The network found its own lines — not necessarily ours. How it knows which number to move and how far is the topic "Backpropagation".');
      },
      paint(g, p) {
        const f = training(), k = Math.min(f.length - 1, Math.floor(beat(p, 0.08, 0.9) * (f.length - 1))), net = f[k].net;
        plane(g, {
          tint: (x, y) => { const q = forward(net, x, y).out; return q > 0.5 ? `rgba(88,196,221,${0.4 * (q - 0.5)})` : `rgba(255,159,90,${0.4 * (0.5 - q)})`; },
          lines: net.W.map((w, i) => ({ w, b: net.b[i], color: NEU[i] })),
        });
        diagram(g, 640, 280, net, { pulse: p * 12 });
        const ok = correct(DATA, (x, y) => forward(net, x, y).out);
        g.text(`${ok} / ${DATA.length}`, 790, 470, 30, ok === DATA.length ? C.green : C.yellow, 'center', 700);
        g.text(L(`эпоха ${k * 20}`, `epoch ${k * 20}`), 790, 505, 16, C.muted);
      },
    },
    {
      id: 'brain', duration: 12, title: L('Мозг и сеть', 'Brain and network'),
      caption: p => p < 0.5 ? L('Настоящий нейрон слушает тысячи соседей, а наш — два числа. В мозге сигналы идут и вперёд, и назад, и по кругу; в этой сети — только вперёд.', 'A real neuron listens to thousands of neighbours, ours to two numbers. In the brain signals go forward, back and round in loops; in this network only forward.')
        : L('Но главная идея общая: много простых элементов, каждый проводит свою простую границу, а вместе они различают сложное — круг, форму, лицо.', 'But the main idea is shared: many simple parts, each drawing its own simple boundary, and together they tell complex things apart — a disc, a shape, a face.'),
      paint(g, p) {
        g.ctx.save(); g.ctx.translate(250, 280); g.ctx.scale(0.75, 0.75);
        bioNeuron(g, 0, 0, { syn: [0.8, 0.5, 0.9], charge: 0.5 + 0.5 * Math.sin(p * 12), pulses: [((p * 3) % 1), ((p * 3 + 0.4) % 1), ((p * 3 + 0.7) % 1)] });
        for (let i = 0; i < 14; i++) { const a = 2.2 + i * 0.13; g.line(-40, 0, -40 + 230 * Math.cos(a), 230 * Math.sin(a) * 0.9, C.purple + '55', 2); }
        g.ctx.restore();
        g.text(L('тысячи входов', 'thousands of inputs'), 230, 470, 18, C.purple);
        g.alpha(beat(p, 0.2, 0.3), () => {
          g.circle(720, 280, 40, '#141b26', C.white, 3); g.text('Σ', 720, 280, 26, C.white);
          [[560, 220, 'x'], [560, 340, 'y']].forEach(([x, y, n]) => { g.line(x + 20, y, 682, 280 + (y - 280) * 0.3, C.teal, 3); g.circle(x, y, 20, '#101a24', C.blue, 2); g.text(n, x, y, 18, C.blue); });
          g.arrow(760, 280, 860, 280, C.muted, 3);
          g.text(L('два числа', 'two numbers'), 700, 470, 18, C.teal);
        });
      },
    },
  ],
};
