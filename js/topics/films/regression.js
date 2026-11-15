// The film of linear regression: a café writes down the temperature and the ice creams sold; the model is a
// line with two knobs; its misses become squares and the error is their mean area; turning one knob draws a
// valley of the error, and learning rolls a ball down it in steps against the slope. Then a child learning to
// throw a ball, and a forecast for a day that was never seen.

import { beat, mix, clamp, ease } from '../../ui/film.js';
import { C, person } from './draw.js';

const L = (ru, en) => ({ ru, en });
const num = v => String(Math.round(v * 10) / 10).replace('-', '−').replace('.', ',');

// Ten days: temperature (°C) and portions sold. The model: sales = w·(t − 20) + b
export const TEMP = [12, 14, 16, 18, 20, 22, 25, 27, 29, 31];
export const SOLD = [30, 46, 40, 58, 52, 70, 66, 88, 82, 98];
const U = TEMP.map(t => t - 20), MY = SOLD.reduce((a, b) => a + b) / 10;
export const loss = (w, b) => U.reduce((s, u, i) => s + (w * u + b - SOLD[i]) ** 2, 0) / 10;
const slope = w => 2 * U.reduce((s, u, i) => s + u * (w * u + MY - SOLD[i]), 0) / 10; // dL/dw at b = mean
export const BEST = { w: U.reduce((s, u, i) => s + u * (SOLD[i] - MY), 0) / U.reduce((s, u) => s + u * u, 0), b: MY };
// Descent on w (b is already at its best, the mean): the path of n steps
export function descent(w0, eta, n) { const out = [w0]; for (let k = 0; k < n; k++) { const w = out[k] - eta * slope(out[k]); out.push(Math.abs(w) > 40 ? out[k] : w); } return out; }

// The chart of the café
const CH = { x0: 80, x1: 540, y0: 470, y1: 70, t0: 10, t1: 33, s0: 0, s1: 120 };
const px = t => mix(CH.x0, CH.x1, (t - CH.t0) / (CH.t1 - CH.t0)), py = s => mix(CH.y0, CH.y1, (s - CH.s0) / (CH.s1 - CH.s0));
const unit = (py(0) - py(1)); // pixels per portion
function chart(g, { dots = 10, line = null, misses = 0, squares = 0, drop = 1 } = {}) {
  g.line(CH.x0, CH.y0, CH.x1 + 10, CH.y0, C.muted, 1.5); g.line(CH.x0, CH.y0, CH.x0, CH.y1 - 10, C.muted, 1.5);
  for (let t = 15; t <= 30; t += 5) { g.line(px(t), CH.y0, px(t), CH.y0 + 6, C.muted, 1.5); g.text(`${t}°`, px(t), CH.y0 + 20, 13, C.muted); }
  for (let s = 20; s <= 100; s += 40) { g.line(CH.x0 - 6, py(s), CH.x0, py(s), C.muted, 1.5); g.text(s, CH.x0 - 12, py(s), 13, C.muted, 'right'); }
  g.text(L('порций', 'portions'), CH.x0 + 6, CH.y1 - 18, 13, C.muted, 'left');
  g.text(L('температура', 'temperature'), CH.x1, CH.y0 + 42, 13, C.muted, 'right');
  g.ctx.save(); g.ctx.beginPath(); g.ctx.rect(CH.x0, CH.y1 - 20, CH.x1 - CH.x0 + 20, CH.y0 - CH.y1 + 20); g.ctx.clip();
  if (line) {
    const f = t => line.w * (t - 20) + line.b;
    TEMP.forEach((t, i) => {
      const y = SOLD[i], yh = f(t), r = yh - y;
      if (squares > 0) { const a = Math.abs(r) * unit * squares; g.box(px(t), Math.min(py(y), py(yh)), a, Math.abs(r) * unit, C.red + '30', C.red + '88', 0); }
      if (misses > 0) g.alpha(misses, () => g.line(px(t), py(y), px(t), py(yh), C.red, 2.5));
    });
    g.line(px(CH.t0), py(f(CH.t0)), px(CH.t1), py(f(CH.t1)), C.yellow, 4);
  }
  g.ctx.restore();
  TEMP.forEach((t, i) => { const k = clamp(drop * dots - i); if (i < dots && k > 0) g.alpha(k * 3, () => g.circle(px(t), mix(CH.y1 - 40, py(SOLD[i]), ease(k)), 7, C.blue, '#050607', 2)); });
}
// A knob: a dial turned to the value
function dial(g, x, y, value, lo, hi, name, color) {
  g.circle(x, y, 34, '#11161e', color, 3);
  const a = mix(-2.4, 2.4, clamp((value - lo) / (hi - lo))) - Math.PI / 2;
  g.line(x, y, x + 26 * Math.cos(a), y + 26 * Math.sin(a), color, 4);
  g.text(name, x, y + 52, 18, color, 'center', 700);
  g.text(num(value), x, y + 76, 16, C.white);
}
// The valley: the error over w (b at its best) and a ball on it
const VA = { x0: 620, x1: 950, y0: 450, y1: 110, w0: -2, w1: 9, L1: 900 };
const vx = w => mix(VA.x0, VA.x1, (w - VA.w0) / (VA.w1 - VA.w0)), vy = l => mix(VA.y0, VA.y1, Math.min(1.05, l / VA.L1));
function valley(g, upto = VA.w1, from = VA.w0) {
  g.line(VA.x0, VA.y0, VA.x1, VA.y0, C.muted, 1.5);
  g.text('w', VA.x1 + 12, VA.y0, 16, C.muted);
  g.text(L('ошибка', 'error'), VA.x0, VA.y1 - 20, 14, C.red, 'left');
  const pts = [];
  for (let w = from; w <= upto + 1e-9; w += 0.05) if (loss(w, MY) <= VA.L1) pts.push([vx(w), vy(loss(w, MY))]);
  if (pts.length > 1) g.curve(pts, C.red, 3);
}
const START = 7.5; // where the descent starts: far too steep
const ballAt = (g, w) => { g.circle(vx(w), vy(loss(w, MY)) - 12, 12, C.yellow, '#050607', 2); };

export default {
  title: L('Как модель учится: промахи и спуск', 'How a model learns: misses and descent'),
  cover: L('Кафе, мороженое и шар,\nкоторый катится к ответу', 'A café, ice cream and a ball\nthat rolls to the answer'),
  note: L('Данные выдуманы, но так устроена любая линейная регрессия.', 'The data are made up, but every linear regression works this way.'),
  state: () => ({ w: 0, b: 40, eta: 0.006 }),
  chapters: [
    {
      id: 'data', duration: 9, title: L('Дневник кафе', 'The café\'s notebook'),
      caption: () => L('Кафе продаёт мороженое. Каждый день хозяйка записывает температуру и сколько порций продала. Десять дней — десять точек.', 'A café sells ice cream. Every day the owner writes down the temperature and how many portions she sold. Ten days — ten points.'),
      paint(g, p) {
        chart(g, { dots: 10, drop: beat(p, 0.1, 0.85) });
        g.alpha(beat(p, 0, 0.1), () => {
          g.ctx.fillStyle = '#e8c79d'; g.ctx.beginPath(); g.ctx.moveTo(740, 380); g.ctx.lineTo(700, 250); g.ctx.lineTo(780, 250); g.ctx.fill();
          g.circle(740, 232, 42, C.pink, null); g.circle(712, 210, 22, '#f8f0e0', null); g.circle(768, 214, 20, C.teal, null);
        });
        g.alpha(beat(p, 0.5, 0.6), () => g.text(L('жарче → больше продаж', 'hotter → more sales'), 740, 450, 20, C.white));
      },
    },
    {
      id: 'line', duration: 10, title: L('Модель — прямая с двумя ручками', 'A model — a line with two knobs'),
      caption: () => L('Модель — прямая: продажи = w·(t − 20) + b. Ручка w — наклон: сколько лишних порций даёт каждый градус. Ручка b — продажи в день с 20°. Пока ручки стоят наугад.', 'The model is a line: sales = w·(t − 20) + b. The knob w is the slope: how many extra portions each degree brings. The knob b is the sales on a 20° day. For now the knobs are set at random.'),
      lens: { text: L('Крутите ручки сами: найдите прямую, которая проходит как можно ближе ко всем точкам.', 'Turn the knobs yourself: find the line that passes as close to all the points as you can.'), knobs: [{ key: 'w', label: L('наклон w', 'slope w'), min: -2, max: 8, step: 0.1 }, { key: 'b', label: L('высота b', 'height b'), min: 0, max: 120, step: 1 }] },
      paint(g, p, st) {
        chart(g, { line: beat(p, 0.1, 0.25) ? st : null });
        g.alpha(beat(p, 0.2, 0.35), () => { dial(g, 690, 180, st.w, -2, 8, 'w', C.yellow); dial(g, 860, 180, st.b, 0, 120, 'b', C.yellow); });
        g.alpha(beat(p, 0.45, 0.55), () => g.text(L('продажи = w·(t − 20) + b', 'sales = w·(t − 20) + b'), 775, 350, 22, C.yellow, 'center', 400, true));
      },
    },
    {
      id: 'miss', duration: 12, title: L('Промахи и квадраты', 'Misses and squares'),
      caption: (p, st) => p < 0.4 ? L('Красные отрезки — промахи: насколько прямая ошиблась в каждый день. Одни вверх, другие вниз.', 'The red segments are the misses: how far the line was off on each day. Some up, some down.')
        : L(`На каждом промахе построим квадрат. Ошибка модели — средняя площадь квадратов: ${num(loss(st.w, st.b))}. Квадрат не замечает знака и сильно наказывает большие промахи.`, `Build a square on every miss. The error of the model is the mean area of the squares: ${num(loss(st.w, st.b))}. A square ignores the sign and punishes big misses hard.`),
      lens: { text: L('Поверните ручки — квадраты растут и сжимаются вместе с ошибкой.', 'Turn the knobs — the squares grow and shrink with the error.'), knobs: [{ key: 'w', label: L('наклон w', 'slope w'), min: -2, max: 8, step: 0.1 }, { key: 'b', label: L('высота b', 'height b'), min: 0, max: 120, step: 1 }] },
      paint(g, p, st) {
        chart(g, { line: st, misses: beat(p, 0.05, 0.25), squares: beat(p, 0.4, 0.6) });
        g.alpha(beat(p, 0.6, 0.7), () => {
          g.text(L('ошибка', 'error'), 780, 200, 22, C.red);
          g.text(num(loss(st.w, st.b)), 780, 250, 54, C.red, 'center', 700);
          g.text(L('средняя площадь квадратов', 'mean area of the squares'), 780, 300, 15, C.muted);
        });
      },
    },
    {
      id: 'valley', duration: 13, title: L('Долина ошибки', 'The valley of the error'),
      caption: p => p < 0.6 ? L('Поставим b на среднее продаж и будем крутить только w. Для каждого w — своя ошибка. Отметим их справа: получается долина.', 'Put b at the mean of the sales and turn only w. Every w has its own error. Mark them on the right: a valley appears.')
        : L(`Лучшая прямая — на дне долины, при w ≈ ${num(BEST.w)}. Но компьютер не видит долину целиком: чтобы нарисовать её, пришлось бы перебрать все w. А у настоящих моделей ручек миллионы.`, `The best line is at the bottom of the valley, at w ≈ ${num(BEST.w)}. But a computer does not see the whole valley: to draw it, it would have to try every w. And real models have millions of knobs.`),
      paint(g, p) {
        const w = mix(VA.w0, VA.w1, beat(p, 0.08, 0.6));
        chart(g, { line: { w, b: MY }, misses: 1 });
        valley(g, w);
        ballAt(g, w);
        g.alpha(beat(p, 0.65, 0.75), () => { g.line(vx(BEST.w), VA.y0, vx(BEST.w), vy(loss(BEST.w, MY)) + 8, C.green, 2, [5, 4]); g.text(L('дно', 'bottom'), vx(BEST.w), VA.y0 + 20, 15, C.green); });
      },
    },
    {
      id: 'roll', duration: 15, title: L('Шар катится вниз', 'The ball rolls down'),
      caption: (p, st) => {
        const path = descent(START, st.eta, 8), end = path[8];
        return p < 0.3 ? L('Компьютер чувствует только наклон под шаром — как турист в тумане. Правило простое: шагни против наклона. Чем круче, тем длиннее шаг: w ← w − η·наклон.', 'The computer feels only the slope under the ball — like a hiker in fog. The rule is simple: step against the slope. The steeper, the longer the step: w ← w − η·slope.')
          : Math.abs(end - BEST.w) < 0.2 ? L(`Шаг за шагом шар скатывается на дно, а прямая слева ложится на точки. Это и есть обучение — градиентный спуск. η = ${String(st.eta).replace('.', ',')} — длина шага.`, `Step by step the ball rolls to the bottom, and the line on the left settles on the points. That is learning — gradient descent. η = ${st.eta} is the step length.`)
            : Math.abs(end - BEST.w) > 3 ? L('Шаг слишком длинный: шар перепрыгивает долину и улетает всё дальше. Скорость обучения нельзя ставить слишком большой.', 'The step is too long: the ball jumps across the valley and flies further and further. The learning rate must not be too big.')
              : L('Шаг маленький: шар ещё в пути. Ещё немного шагов — и он на дне.', 'The step is small: the ball is still on its way. A few more steps and it is at the bottom.');
      },
      ask: {
        at: 0.22,
        q: L('Под шаром склон поднимается вправо (наклон больше нуля). Куда шагнуть, чтобы ошибка упала?', 'Under the ball the slope rises to the right (it is positive). Where to step so that the error falls?'),
        options: [{ text: L('Влево — уменьшить w', 'Left — make w smaller'), ok: true }, { text: L('Вправо — увеличить w', 'Right — make w bigger') }, { text: L('Остаться на месте', 'Stay') }],
        explain: L('Против наклона: справа выше, значит вниз — влево. Поэтому в формуле минус: w − η·наклон.', 'Against the slope: the right side is higher, so down is to the left. That is why there is a minus in the formula: w − η·slope.'),
      },
      lens: { text: L('Длина шага η. Попробуйте маленькую, среднюю и такую, при которой шар вылетает.', 'The step length η. Try a small one, a medium one and one where the ball flies out.'), knobs: [{ key: 'eta', label: L('шаг η', 'step η'), min: 0.001, max: 0.03, step: 0.001 }] },
      paint(g, p, st) {
        const path = descent(START, st.eta, 8), q = clamp((p - 0.25) / 0.7) * 8, k = Math.floor(q), f = beat(q - k, 0.2, 0.9);
        const w = k >= 8 ? path[8] : mix(path[k], path[k + 1], f), hop = k < 8 ? Math.sin(Math.PI * f) * 30 : 0;
        chart(g, { line: { w, b: MY }, misses: 1 });
        path.slice(0, k + 1).forEach(v => g.line(px(CH.t0), py(v * (CH.t0 - 20) + MY), px(CH.t1), py(v * (CH.t1 - 20) + MY), C.yellow + '22', 2));
        valley(g);
        path.slice(0, k + 1).forEach(v => g.circle(vx(v), vy(loss(v, MY)), 4, C.yellow + '88', null));
        g.circle(vx(w), vy(loss(w, MY)) - 12 - hop, 12, C.yellow, '#050607', 2);
        // The slope under the ball: a short tangent and the arrow of the next step
        const s = slope(w), dx = 0.9;
        g.line(vx(w - dx), vy(loss(w, MY) - s * dx), vx(w + dx), vy(loss(w, MY) + s * dx), C.white, 2);
        if (k < 8) g.arrow(vx(w), VA.y0 + 30, vx(w - Math.sign(s) * 1.2), VA.y0 + 30, C.teal, 3);
        g.text(L(`шаг ${Math.min(8, k)}`, `step ${Math.min(8, k)}`), 785, 80, 18, C.white);
      },
    },
    {
      id: 'throw', duration: 12, title: L('Как учится рука', 'How a hand learns'),
      caption: p => p < 0.66 ? L('Похоже учатся движения. Ребёнок бросает мяч в корзину: недобросил — следующий бросок сильнее, перебросил — слабее. Поправка — в сторону ошибки и тем больше, чем больше промах.', 'Movements are learned in a similar way. A child throws a ball at a basket: too short — the next throw is stronger, too long — weaker. The correction goes against the miss and is bigger for a bigger miss.')
        : L('Мозг сравнивает, куда попал, с тем, куда хотел, и подправляет следующую попытку. Модель делает то же самое — только с числами и на тысячах примеров.', 'The brain compares where it hit with where it aimed and adjusts the next try. The model does the same — only with numbers and on thousands of examples.'),
      paint(g, p) {
        person(g, 170, 400, 160, C.teal, { hair: '#8a5a2b', arm: -1.2 });
        // The basket
        g.line(820, 470, 820, 210, C.muted, 5); g.line(820, 230, 760, 230, C.orange, 5); g.box(762, 228, 56, 30, null, C.orange, 4);
        const throws = [[0.02, 0.6, L('недолёт', 'too short'), C.red], [0.24, 1.25, L('перелёт', 'too long'), C.red], [0.46, 1, L('попал!', 'in!'), C.green]];
        throws.forEach(([t0, power, label, color], i) => {
          const k = clamp((p - t0) / 0.18), x0 = 200, y0 = 260, x1 = mix(x0, 790, power), pts = [];
          for (let q = 0; q <= k; q += 0.02) pts.push([mix(x0, x1, q), y0 - 260 * power * q * (1 - q) * 1.2 + (230 - y0 + (power > 1 ? 120 : power < 1 ? 210 : 0)) * q * q]);
          if (pts.length > 1) g.alpha(p > t0 + 0.2 && i < 2 ? 0.35 : 1, () => { g.curve(pts, color + 'aa', 2); const e = pts[pts.length - 1]; g.circle(e[0], e[1], 12, C.orange, null); });
          g.alpha(beat(p, t0 + 0.16, t0 + 0.2), () => g.text(label, mix(x0, x1, 1), 300 + 40 * i, 18, color, 'center', 600));
        });
        g.alpha(beat(p, 0.7, 0.78), () => g.text(L('ошибка → поправка → снова', 'error → correction → again'), 500, 520, 22, C.white));
      },
    },
    {
      id: 'predict', duration: 9, title: L('Прогноз', 'A forecast'),
      caption: () => L(`Модель выучила связь. Завтра обещают 28° — по прямой это около ${Math.round(BEST.w * 8 + MY)} порций. Такого дня в дневнике не было, а ответ есть.`, `The model has learned the link. Tomorrow will be 28° — by the line that is about ${Math.round(BEST.w * 8 + MY)} portions. There was no such day in the notebook, and still there is an answer.`),
      paint(g, p) {
        chart(g, { line: BEST });
        const k = beat(p, 0.2, 0.5), y = BEST.w * 8 + MY;
        g.line(px(28), CH.y0, px(28), mix(CH.y0, py(y), k), C.green, 2.5, [6, 5]);
        g.alpha(beat(p, 0.5, 0.6), () => { g.line(px(28), py(y), CH.x0, py(y), C.green, 2.5, [6, 5]); g.circle(px(28), py(y), 9, C.green, null); });
        g.alpha(beat(p, 0.55, 0.65), () => { g.text(L('завтра 28°', 'tomorrow 28°'), 780, 220, 24, C.green); g.text(`≈ ${Math.round(y)}`, 780, 280, 54, C.green, 'center', 700); g.text(L('порций', 'portions'), 780, 330, 18, C.muted); });
      },
    },
  ],
};
