// The film of backpropagation: a conveyor of machines with knobs computes the error; the blame for it runs
// back from the inspector, multiplied at every machine by how much that machine stretches changes; the knobs
// turn against their blame and the error shrinks. Does the brain do the same? Honestly — not like this, as
// far as we know: local rules (Hebb) and a global signal of surprise (dopamine). And why going back is fast.

import { beat, mix, clamp } from '../../ui/film.js';
import { C, bioNeuron } from './draw.js';

const L = (ru, en) => ({ ru, en });
const num = v => String(Math.round(v * 100) / 100).replace('-', '−').replace('.', ',');
const X = 2, T = 3, ETA = 0.05; // the input, the right answer, the step

// The conveyor for the knobs w, b: m = w·x, ŷ = m + b, L = (ŷ − 3)², and the blames backwards
export function run({ w, b }) {
  const m = w * X, y = m + b, e = y - T;
  return { m, y, e, L: e * e, gy: 2 * e, gb: 2 * e, gm: 2 * e, gw: 2 * e * X };
}
// Rounds of learning: every knob steps against its blame
export function rounds(st, n) {
  let { w, b } = st;
  const out = [{ w, b }];
  for (let k = 0; k < n; k++) { const r = run({ w, b }); w -= st.eta * r.gw; b -= st.eta * r.gb; out.push({ w, b }); }
  return out;
}

const BELT = 330, M1 = 300, M2 = 540, INS = 790;
// A machine on the belt with its knob on top
function machine(g, x, label, knob, value, blame = null) {
  g.box(x - 65, BELT - 60, 130, 80, '#151a22', C.muted, 10);
  g.text(label, x, BELT - 20, 26, C.white, 'center', 600);
  g.line(x, BELT - 60, x, BELT - 100, C.muted, 3);
  g.circle(x, BELT - 128, 28, '#11161e', C.yellow, 3);
  const a = -Math.PI / 2 + clamp(value / 3) * 2.4;
  g.line(x, BELT - 128, x + 20 * Math.cos(a), BELT - 128 + 20 * Math.sin(a), C.yellow, 4);
  g.text(`${knob} = ${num(value)}`, x, BELT - 178, 18, C.yellow, 'center', 600);
  if (blame != null) g.text(L(`вина ${num(blame)}`, `blame ${num(blame)}`), x, BELT - 208, 18, C.red, 'center', 700);
}
// A parcel with a number on the belt
const parcel = (g, x, v, color = C.blue) => { g.box(x - 28, BELT - 2 - 50, 56, 50, '#10202a', color, 6); g.text(num(v), x, BELT - 27, 18, color, 'center', 700); };
// A red message flying back below the belt
const message = (g, x, v) => { g.box(x - 44, BELT + 60, 88, 44, '#2a1214', C.red, 8); g.text(num(v), x, BELT + 82, 18, C.red, 'center', 700); };

function conveyor(g, st, { k = 1, back = 0, blames = false } = {}) {
  const r = run(st);
  g.line(40, BELT, 960, BELT, C.muted, 3);
  for (let x = 60; x < 960; x += 40) g.circle(x, BELT + 8, 6, null, '#3a4150', 2);
  machine(g, M1, '× w', 'w', st.w, blames && back >= 0.95 ? r.gw : null);
  machine(g, M2, '+ b', 'b', st.b, blames && back >= 0.55 ? r.gb : null);
  // The inspector compares with the right answer
  g.box(INS - 70, BELT - 60, 140, 80, '#1a1520', C.pink, 10);
  g.text(`(· − ${T})²`, INS, BELT - 20, 22, C.pink, 'center', 600);
  g.text(L(`нужно ${T}`, `should be ${T}`), INS, BELT - 90, 16, C.pink);
  // The parcel: x → m → ŷ → L
  const stops = [[90, X], [M1, X], [M1 + 120, r.m], [M2, r.m], [M2 + 120, r.y], [INS, r.y]];
  const q = clamp(k) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(q)), f = q - i;
  if (k < 1) parcel(g, mix(stops[i][0], stops[i + 1][0], f), f < 0.5 ? stops[i][1] : stops[i + 1][1]);
  else g.text(L(`ошибка ${num(r.L)}`, `error ${num(r.L)}`), 920, BELT - 20, 22, C.red, 'center', 700);
  if (back > 0) {
    // The blame: −2 leaves the inspector, passes the adder as it is (×1), the multiplier makes it ×2
    const legs = [[INS, M2, r.gy], [M2, M1, r.gm]], q2 = clamp(back) * 2, j = Math.min(1, Math.floor(q2)), f2 = q2 - j;
    if (back < 1) message(g, mix(legs[j][0], legs[j][1], f2), legs[j][2]);
    g.alpha(beat(back, 0.45, 0.55), () => g.text('×1', mix(INS, M2, 0.5), BELT + 130, 18, C.purple, 'center', 700));
    g.alpha(beat(back, 0.85, 0.95), () => g.text(`×x = ×${X}`, M1, BELT + 130, 18, C.purple, 'center', 700));
  }
}

export default {
  id: 'backprop', // the voice lives in audio/films/backprop/
  title: L('Кто виноват в ошибке?', 'Who is to blame for the error?'),
  cover: L('Как ошибка бежит назад\nи подкручивает каждую ручку', 'How the error runs back\nand turns every knob'),
  note: L('Мозг и обратное распространение — открытый вопрос науки; здесь сказано то, что известно точно.', 'The brain and backpropagation is an open question of science; here we say only what is known for sure.'),
  state: () => ({ w: 0.5, b: 1, eta: ETA }),
  chapters: [
    {
      id: 'belt', duration: 12, title: L('Конвейер машин', 'A conveyor of machines'),
      caption: (p, st) => p < 0.6 ? L(`Модель — конвейер маленьких машин. На вход приходит число ${X}. Первая машина умножает на w, вторая прибавляет b. У каждой — ручка.`, `A model is a conveyor of little machines. The number ${X} comes in. The first machine multiplies by w, the second adds b. Each has a knob.`)
        : L(`Контролёр сравнивает с правильным ответом ${T}: промах ${num(run(st).e)}, ошибка — его квадрат, ${num(run(st).L)}. Ручки стоят не так. Но какую крутить — и куда?`, `The inspector compares with the right answer ${T}: the miss is ${num(run(st).e)}, the error is its square, ${num(run(st).L)}. The knobs are wrong. But which one to turn — and which way?`),
      lens: { text: L('Поставьте ручки сами. Сможете сделать ошибку нулевой? Таких положений много.', 'Set the knobs yourself. Can you make the error zero? There are many such positions.'), knobs: [{ key: 'w', label: 'w', min: -1, max: 3, step: 0.05 }, { key: 'b', label: 'b', min: -2, max: 3, step: 0.05 }] },
      paint(g, p, st) { conveyor(g, st, { k: beat(p, 0.08, 0.6) }); },
    },
    {
      id: 'wiggle', duration: 10, title: L('Пробовать по одной ручке?', 'Try the knobs one at a time?'),
      caption: () => L('Можно покрутить каждую ручку чуть-чуть и прогнать конвейер заново: так узнаем, как она влияет на ошибку. Но на каждую ручку — новый прогон. У настоящих сетей ручек миллионы.', 'One could nudge each knob a little and run the conveyor again: that shows how it affects the error. But every knob costs a new run. Real networks have millions of knobs.'),
      paint(g, p, st) {
        const wig = Math.sin(p * 40) * 0.08 * (p < 0.5 ? 1 : 0), wig2 = Math.sin(p * 40) * 0.08 * (p >= 0.5 ? 1 : 0);
        conveyor(g, { ...st, w: st.w + wig, b: st.b + wig2 }, { k: 1 });
        g.text(L(`прогонов: ${1 + Math.floor(p * 6)}`, `runs: ${1 + Math.floor(p * 6)}`), 500, 480, 22, C.muted);
        g.text('?', p < 0.5 ? M1 : M2, BELT - 230, 40, C.yellow, 'center', 700);
      },
    },
    {
      id: 'back', duration: 16, title: L('Вина бежит назад', 'The blame runs back'),
      caption: (p, st) => {
        const r = run(st);
        return p < 0.35 ? L(`Умнее идти с конца. Контролёр знает: если бы выход был чуть больше, ошибка изменилась бы в ${num(r.gy)} раза. Это его «вина» — она уходит назад, к последней машине.`, `It is smarter to go from the end. The inspector knows: if the output were a bit bigger, the error would change ${num(r.gy)} times as much. That is its "blame" — it goes back to the last machine.`)
          : p < 0.7 ? L('Каждая машина знает только себя: насколько она растягивает малое изменение. Сумматор передаёт как есть (×1) — ручка b получает ту же вину.', 'Every machine knows only itself: how much it stretches a small change. The adder passes it as it is (×1) — the knob b gets the same blame.')
            : L(`Умножитель растягивает в x = ${X} раза: вина w — ${num(r.gw)}. Один проход назад — и у каждой ручки есть своё число. Это обратное распространение.`, `The multiplier stretches x = ${X} times: the blame of w is ${num(r.gw)}. One pass back — and every knob has its number. That is backpropagation.`);
      },
      paint(g, p, st) { conveyor(g, st, { k: 1, back: beat(p, 0.15, 0.85), blames: true }); },
    },
    {
      id: 'turn', duration: 14, title: L('Повернуть против вины', 'Turn against the blame'),
      say: [
        { at: 0, ru: 'Вина отрицательная: если увеличить ручку, ошибка уменьшится. Значит, каждую ручку чуть поворачиваем против вины, сильнее — где вина больше.' },
        { at: 0.3, ru: 'Вперёд, назад, поворот — и снова. Ошибка была единицей, стала четвертью, потом совсем маленькой: каждый круг промах уменьшается вдвое.' },
      ],
      caption: (p, st) => {
        const R = rounds(st, 3), r = run(R[Math.min(3, Math.floor(beat(p, 0.3, 0.95) * 3))]);
        return p < 0.3 ? L('Вина отрицательная: если увеличить ручку, ошибка уменьшится. Значит, каждую ручку чуть поворачиваем против вины, сильнее — где вина больше.', 'The blame is negative: making the knob bigger makes the error smaller. So every knob turns a little against its blame — more where the blame is bigger.')
          : L(`Вперёд, назад, поворот — и снова. Ошибка: ${num(r.L)}. Каждый круг промах уменьшается вдвое.`, `Forward, back, turn — and again. The error: ${num(r.L)}. Every round the miss halves.`);
      },
      ask: {
        at: 0.25,
        q: L('Вина ручки w равна −4, вина b равна −2. Что сделать?', 'The blame of w is −4, of b −2. What to do?'),
        options: [{ text: L('Увеличить обе, w — сильнее', 'Increase both, w more'), ok: true }, { text: L('Уменьшить обе', 'Decrease both') }, { text: L('Крутить только b', 'Turn only b') }],
        explain: L('Против вины: минус — значит увеличивать. Вина w вдвое больше, поэтому и шаг у w вдвое больше: w + 0,05·4, b + 0,05·2.', 'Against the blame: minus means increase. The blame of w is twice as big, so its step is twice as big: w + 0.05·4, b + 0.05·2.'),
      },
      lens: { text: L('Размер шага η: при большом ручки перекручиваются и ошибка скачет.', 'The step size η: with a big one the knobs overshoot and the error jumps.'), knobs: [{ key: 'eta', label: L('шаг η', 'step η'), min: 0.01, max: 0.25, step: 0.01 }] },
      paint(g, p, st) {
        const R = rounds(st, 3), q = beat(p, 0.3, 0.95) * 3, k = Math.min(2, Math.floor(q)), f = beat(q - k, 0.1, 0.6);
        const cur = q >= 3 ? R[3] : { w: mix(R[k].w, R[k + 1].w, f), b: mix(R[k].b, R[k + 1].b, f) };
        conveyor(g, cur, { k: 1 });
        R.slice(0, Math.min(3, Math.floor(q)) + 1).forEach((s, i) => {
          const e = Math.abs(run(s).e), a = 70 * e;
          g.box(120 + 130 * i, 520 - a, a, a, C.red + '55', C.red, 2);
          g.text(num(run(s).L), 120 + 130 * i + 35, 535, 14, C.red);
        });
      },
    },
    {
      id: 'brain', duration: 17, title: L('А мозг так умеет?', 'Can the brain do this?'),
      caption: p => p < 0.3 ? L('Учится ли так мозг? Честный ответ — скорее нет, во всяком случае не так. Никто не нашёл в мозге отдельного обратного канала, который нёс бы точную вину каждому синапсу.', 'Does the brain learn this way? The honest answer is — probably not, at least not like this. Nobody has found a separate backward channel in the brain carrying the exact blame to every synapse.')
        : p < 0.65 ? L('Зато известны местные правила: если две клетки срабатывают вместе, связь между ними крепнет (правило Хебба). Синапс меняется по тому, что видит рядом.', 'Local rules are known instead: if two cells fire together, the link between them grows stronger (Hebb\'s rule). A synapse changes by what it sees nearby.')
          : L('И есть общий сигнал «лучше или хуже, чем ожидал» — например, дофамин: он приходит сразу ко многим синапсам. Учёные изучают, может ли мозг так приближённо делать то же, что обратное распространение.', 'And there is a global signal of "better or worse than expected" — dopamine, for example: it reaches many synapses at once. Scientists study whether the brain could approximate what backpropagation does this way.'),
      paint(g, p) {
        const cells = [[180, 160], [180, 400], [420, 280], [660, 160], [660, 400], [860, 280]];
        const links = [[0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5]];
        links.forEach(([a, b], i) => {
          const [x1, y1] = cells[a], [x2, y2] = cells[b], hebb = i === 2 && p > 0.3 && p < 0.65;
          g.line(x1, y1, x2, y2, hebb ? C.yellow : C.purple + '88', hebb ? 3 + 6 * beat(p, 0.35, 0.55) : 3);
          const q = (p * 6 + i * 0.3) % 1;
          g.circle(mix(x1, x2, q), mix(y1, y2, q), 4, C.yellow, null);
        });
        cells.forEach(([x, y], i) => g.circle(x, y, 26, (p > 0.3 && p < 0.65 && (i === 2 || i === 3) && Math.sin(p * 50) > 0) ? C.yellow : '#2e2747', C.purple, 3));
        // The missing backward channel
        g.alpha(beat(p, 0.05, 0.12) * (1 - beat(p, 0.28, 0.32)), () => {
          g.arrow(860, 230, 440, 230, C.red, 3, 12); g.text('?', 650, 205, 40, C.red, 'center', 700);
          g.text(L('точная вина назад — не найдена', 'exact blame backwards — not found'), 520, 520, 20, C.red);
        });
        g.alpha(beat(p, 0.36, 0.42) * (1 - beat(p, 0.62, 0.66)), () => g.text(L('срабатывают вместе — связь крепнет', 'fire together — the link grows'), 540, 520, 20, C.yellow));
        // Dopamine: a cloud spreading from below to every link
        g.alpha(beat(p, 0.68, 0.75), () => {
          const r = 60 + 420 * beat(p, 0.7, 0.95);
          g.circle(520, 560, r, 'rgba(92,208,179,0.10)', 'rgba(92,208,179,0.5)', 2);
          g.text(L('дофамин: «лучше, чем ждал!»', 'dopamine: "better than expected!"'), 520, 520, 20, C.teal);
        });
      },
    },
    {
      id: 'race', duration: 12, title: L('Почему назад — быстро', 'Why going back is fast'),
      caption: p => p < 0.5 ? L('Сравним: крутить ручки по одной — один прогон на каждую ручку. Назад — один прогон вперёд и один назад, сколько бы ручек ни было.', 'Compare: nudging knobs one by one — a run for every knob. Backwards — one run forward and one back, however many knobs there are.')
        : L('Для сети с миллиардом ручек это разница между «один шаг обучения — годы» и «доля секунды». Поэтому большие нейросети вообще возможны.', 'For a network with a billion knobs this is the difference between "one step of learning takes years" and "a fraction of a second". That is why big neural networks are possible at all.'),
      paint(g, p) {
        const N = 48, tau = beat(p, 0.05, 0.9) * (N + 1);
        [[150, L('по одной ручке', 'one knob at a time'), i => tau - 1 > i, N + 1], [380, L('вперёд и назад', 'forward and back'), i => tau >= 2 || (tau > 1 && (N - i) / N <= tau - 1), 2]].forEach(([y, title, lit, total]) => {
          g.text(title, 500, y - 50, 20, C.white, 'center', 600);
          for (let i = 0; i < N; i++) g.circle(200 + 25 * (i % 24), y + 25 * Math.floor(i / 24), 8, lit(i) ? C.yellow : '#2a3140', null);
          const done = tau >= total;
          g.text(L(`прогонов: ${Math.min(total, Math.ceil(tau))}${done ? ' ✓' : ''}`, `runs: ${Math.min(total, Math.ceil(tau))}${done ? ' ✓' : ''}`), 500, y + 75, 18, done ? C.green : C.muted, 'center', 600);
        });
      },
    },
  ],
};
