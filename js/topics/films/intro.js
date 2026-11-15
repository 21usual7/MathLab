// The film of the introduction: why a computer learns from examples and not from rules, the nerve cell and
// the artificial neuron made from it, weights as the strength of synapses, learning from mistakes on a diary
// of walks, and what a network has in common with a brain — and what not.

import { beat, mix, clamp } from '../../ui/film.js';
import { C, TH, bioNeuron, meter, artNeuron, brain, person, bubble, cat, dog, ICONS } from './draw.js';
import { DAYS, perceptron } from '../ml-math.js';

const L = (ru, en) => ({ ru, en });
const num = v => String(Math.round(v * 100) / 100).replace('-', '−');
// Draw fn around (0, 0) at (x, y), scaled by s
const at = (g, x, y, s, fn) => { g.ctx.save(); g.ctx.translate(x, y); g.ctx.scale(s, s); fn(); g.ctx.restore(); };

// The nerve cell: two waves of signals. The first comes through the weak synapse only, the second through
// the two others. A wave fires the cell when the sum of its synapses passes the threshold.
const WAVES = [{ at: 0.32, syn: [1] }, { at: 0.56, syn: [0, 2] }];
function cell(p, st) {
  const syn = [st.syn1, st.syn2, st.syn3], pulses = [null, null, null];
  let charge = 0, spike = null;
  for (const w of WAVES) {
    const peak = w.syn.reduce((s, i) => s + syn[i], 0);
    w.syn.forEach(i => { const k = (p - w.at) / 0.12; if (k >= 0 && k <= 1) pulses[i] = k; });
    const rise = beat(p, w.at + 0.08, w.at + 0.13), fall = 1 - beat(p, w.at + 0.13, w.at + 0.3);
    charge += peak * rise * fall;
    if (peak >= TH) { const k = (p - w.at - 0.13) / 0.16; if (k >= 0 && k <= 1) spike = k; }
  }
  return { syn, pulses, charge, spike, fired: WAVES.map(w => w.syn.reduce((s, i) => s + syn[i], 0) >= TH) };
}

// Learning on the diary: 48 examples (six passes), slow at first
const HISTORY = perceptron(DAYS, 48);
const seen = p => Math.floor(48 * clamp((p - 0.06) / 0.84) ** 1.5);

export default {
  id: 'intro', // the voice lives in audio/films/intro/
  title: L('Введение в машинное обучение', 'An introduction to machine learning'),
  cover: L('Как машина учится\nна примерах — и при чём тут мозг', 'How a machine learns\nfrom examples — and what the brain has to do with it'),
  note: L('Искусственный нейрон — сильное упрощение настоящего. Числа о мозге — порядок величины.', 'An artificial neuron is a strong simplification of a real one. The numbers about the brain are orders of magnitude.'),
  state: () => ({ syn1: 0.9, syn2: 0.3, syn3: 0.6, w1: 1, w2: 1, w3: -2, th: 0.5 }),
  chapters: [
    {
      id: 'rules', duration: 14, title: L('Правила не справляются', 'Rules give up'),
      caption: p => p < 0.28 ? L('Как научить компьютер отличать кошку от собаки? Первая мысль — написать правило.', 'How do you teach a computer to tell a cat from a dog? The first idea is to write a rule.')
        : p < 0.62 ? L('Но у хаски тоже острые уши, а у вислоухой кошки — нет. Каждое исключение — новое правило.', 'But a husky has pointed ears too, and a fold cat does not. Every exception is a new rule.')
          : L('Правила растут быстрее, чем мы их пишем. Мир слишком разнообразен, чтобы описать его вручную.', 'The rules grow faster than we can write them. The world is too varied to describe by hand.'),
      paint(g, p) {
        g.alpha(beat(p, 0, 0.08), () => g.text(L('Кошка или собака?', 'Cat or dog?'), 500, 46, 32, C.white, 'center', 400, true));
        g.box(40, 90, 480, 430, '#0c1016', '#2a3140', 14);
        g.text(L('программа', 'program'), 70, 116, 14, C.muted, 'left');
        const rules = [
          [0.1, L('если уши острые → кошка', 'if the ears are pointed → cat'), C.green],
          [0.1, L('иначе → собака', 'else → dog'), C.green],
          [0.42, L('…но если морда серо-белая → собака', '…but if the face is grey and white → dog'), C.yellow],
          [0.62, L('…но если уши сложены и есть усы → кошка', '…but if the ears are folded and there are whiskers → cat'), C.yellow],
          [0.7, L('…но у собак тоже есть усы, поэтому…', '…but dogs have whiskers too, so…'), C.orange],
          [0.75, L('…кроме случаев, когда…', '…except when…'), C.red],
          [0.79, L('…и ещё если…', '…and also if…'), C.red],
          [0.82, L('…кроме…', '…except…'), C.red],
        ];
        rules.forEach(([t0, text, c], i) => g.alpha(beat(p, t0, t0 + 0.04), () => g.text(text, 66, 152 + 44 * i, 17, c, 'left')));
        const animal = (t0, x, y, draw, verdict, ok) => g.alpha(beat(p, t0, t0 + 0.05), () => {
          draw(x, y);
          g.text(verdict, x, y + 78, 18, ok ? C.green : C.red, 'center', 600);
        });
        animal(0.12, 640, 200, (x, y) => cat(g, x, y, 46), L('кошка ✓', 'cat ✓'), true);
        animal(0.14, 850, 200, (x, y) => dog(g, x, y, 46), L('собака ✓', 'dog ✓'), true);
        animal(0.3, 640, 410, (x, y) => dog(g, x, y, 46, { ears: 'up' }), p < 0.42 ? L('кошка? ✗ это хаски', 'cat? ✗ a husky') : L('собака ✓', 'dog ✓'), p >= 0.42);
        animal(0.52, 850, 410, (x, y) => cat(g, x, y, 46, { ears: 'down', color: '#b9b3a8' }), p < 0.62 ? L('собака? ✗ это кошка', 'dog? ✗ a cat') : L('кошка… ?', 'cat… ?'), p >= 0.62 && p < 0.7);
        g.alpha(beat(p, 0.86, 0.92), () => {
          g.ctx.save(); g.ctx.translate(300, 330); g.ctx.rotate(-0.12);
          g.box(-210, -40, 420, 80, '#2a0f0fdd', C.red, 10);
          g.text(L('правил не хватает', 'not enough rules'), 0, 0, 34, C.red, 'center', 700);
          g.ctx.restore();
        });
      },
    },
    {
      id: 'examples', duration: 12, title: L('Учиться на примерах', 'Learning from examples'),
      caption: p => p < 0.55 ? L('Детям не объясняют правил про уши и усы. Им показывают примеры: «смотри, собака», «а это кошка».', 'Nobody explains rules about ears and whiskers to a child. They are shown examples: "look, a dog", "and this is a cat".')
        : L('После нескольких примеров ребёнок узнаёт собаку, которую никогда не видел. Машинное обучение — то же самое: программа сама находит правило по примерам с ответами.', 'After a few examples a child recognises a dog it has never seen. Machine learning is the same: the program finds the rule by itself from examples with answers.'),
      paint(g, p) {
        person(g, 270, 420, 230, C.purple, { arm: -0.5 + 0.15 * Math.sin(p * 30) });
        person(g, 150, 440, 150, C.teal, { hair: '#8a5a2b' });
        g.alpha(beat(p, 0.05, 0.1) * (1 - beat(p, 0.55, 0.6)), () => bubble(g, 300, 120, L('Смотри — собака!', 'Look, a dog!'), C.purple));
        const cards = [['d', 'down'], ['c', 'up'], ['d', 'down', '#e0b070'], ['c', 'up', '#9a9a9a'], ['c', 'down', '#d9c7a8'], ['d', 'up'], ['c', 'up', '#3d3d3d'], ['d', 'down', '#5c3a1e'], ['c', 'up', '#e8e2d0'], ['d', 'down', '#d8a060'], ['c', 'down', C.orange]];
        for (let i = 0; i < 12; i++) {
          const x = 455 + (i % 4) * 128, y = 90 + Math.floor(i / 4) * 150, t0 = 0.06 + i * 0.04;
          if (i === 11) {
            g.alpha(beat(p, 0.6, 0.66), () => {
              g.box(x, y, 112, 130, '#10161f', C.yellow, 12);
              dog(g, x + 56, y + 58, 34, { ears: 'up' });
              g.text(p < 0.8 ? '?' : L('собака', 'dog'), x + 56, y + 112, 16, p < 0.8 ? C.yellow : C.green, 'center', 700);
            });
            continue;
          }
          const [kind, ears, color] = cards[i];
          g.alpha(beat(p, t0, t0 + 0.05), () => {
            g.box(x, y, 112, 130, '#10161f', '#2a3140', 12);
            (kind === 'c' ? cat : dog)(g, x + 56, y + 58, 34, color ? { ears, color } : { ears });
            g.text(kind === 'c' ? L('кошка', 'cat') : L('собака', 'dog'), x + 56, y + 112, 15, kind === 'c' ? C.orange : '#c8955c', 'center', 600);
          });
        }
        g.alpha(beat(p, 0.78, 0.84), () => bubble(g, 150, 245, L('Собака!', 'A dog!'), C.teal));
      },
    },
    {
      id: 'brain', duration: 14, title: L('Мозг: сеть из клеток', 'The brain: a network of cells'),
      caption: p => p < 0.5 ? L('Учится мозг. В нём около 86 миллиардов нервных клеток — нейронов, и у каждого тысячи связей с другими.', 'The brain learns. It has about 86 billion nerve cells — neurons, and each has thousands of connections to others.')
        : L('Ни одна клетка не знает, что такое «собака». Знание — в том, какие связи сильные, а какие слабые. Приблизим одну клетку.', 'No single cell knows what a "dog" is. The knowledge is in which connections are strong and which are weak. Let us zoom in on one cell.'),
      paint(g, p) {
        const tm = p * 14, k = beat(p, 0.45, 0.6);
        const lit = i => Math.max(0, Math.sin(tm * (1.3 + (i % 7) * 0.37) + i * 1.7)) ** 12;
        brain(g, mix(500, 250, k), mix(290, 300, k), mix(1.55, 1.05, k), { lit });
        g.alpha(beat(p, 0.15, 0.22), () => g.text(L('≈ 86 000 000 000 нейронов', '≈ 86 000 000 000 neurons'), mix(500, 250, k), 60, 26, C.yellow, 'center', 600));
        g.alpha(beat(p, 0.3, 0.37), () => g.text(L('у каждого — тысячи связей', 'each with thousands of connections'), mix(500, 250, k), 100, 19, C.white));
        g.alpha(k, () => {
          g.line(330, 260, 600, 160, C.muted, 1.5, [6, 5]); g.line(330, 300, 600, 420, C.muted, 1.5, [6, 5]);
          g.circle(760, 290, 200, '#0b0f15', C.muted, 2);
          g.ctx.save(); g.ctx.beginPath(); g.ctx.arc(760, 290, 198, 0, 2 * Math.PI); g.ctx.clip();
          const cells = [[650, 200], [700, 380], [790, 250], [860, 380], [880, 170], [760, 470], [620, 300]];
          const links = [[0, 2], [6, 2], [1, 2], [2, 3], [2, 4], [1, 5], [6, 1], [3, 5], [0, 4]];
          links.forEach(([a, b], i) => {
            const [x1, y1] = cells[a], [x2, y2] = cells[b];
            g.line(x1, y1, x2, y2, C.purple + '88', 2 + 4 * ((i * 37) % 10) / 10);
            const q = (tm * 0.7 + i * 0.29) % 1;
            g.circle(mix(x1, x2, q), mix(y1, y2, q), 4, C.yellow, null);
          });
          cells.forEach(([x, y], i) => g.circle(x, y, 13, lit(i * 13) > 0.3 ? C.yellow : '#2e2747', C.purple, 2));
          g.ctx.restore();
          g.text(L('толщина связи — её сила', 'thickness of a link is its strength'), 760, 520, 16, C.muted);
        });
      },
    },
    {
      id: 'cell', duration: 16, title: L('Как срабатывает нейрон', 'How a neuron fires'),
      caption: (p, st) => {
        const c = cell(p, st);
        return p < 0.3 ? L('Нейрон принимает сигналы от других клеток через синапсы. Синапсы бывают сильные и слабые — это главное.', 'A neuron receives signals from other cells through synapses. Synapses are strong or weak — that is the key.')
          : p < 0.53 ? (c.fired[0] ? L('Пришёл сигнал через один синапс — и его хватило: заряд перешёл порог, клетка выстрелила.', 'A signal came through one synapse — and it was enough: the charge passed the threshold and the cell fired.') : L('Пришёл сигнал через слабый синапс. Заряд немного поднялся — но до порога не дошёл и угас.', 'A signal came through the weak synapse. The charge rose a little — but did not reach the threshold and faded.'))
            : c.fired[1] ? L('Теперь сигналы пришли через два сильных синапса сразу. Вместе они перевалили порог — и по аксону побежал импульс к следующим клеткам.', 'Now signals came through two strong synapses at once. Together they passed the threshold — and an impulse ran along the axon to the next cells.')
              : L('Два синапса вместе тоже не дотянули до порога: импульса нет. Сила синапсов решает, сработает ли клетка.', 'Two synapses together did not reach the threshold either: no impulse. The strength of the synapses decides whether the cell fires.');
      },
      lens: {
        text: L('Меняйте силу трёх синапсов. Первая волна приходит через средний, вторая — через верхний и нижний. Когда клетка выстрелит?', 'Change the strength of the three synapses. The first wave comes through the middle one, the second through the upper and lower ones. When does the cell fire?'),
        knobs: [
          { key: 'syn1', label: L('верхний синапс', 'upper synapse'), min: 0, max: 1, step: 0.05 },
          { key: 'syn2', label: L('средний синапс', 'middle synapse'), min: 0, max: 1, step: 0.05 },
          { key: 'syn3', label: L('нижний синапс', 'lower synapse'), min: 0, max: 1, step: 0.05 },
        ],
      },
      paint(g, p, st) {
        const c = cell(p, st);
        bioNeuron(g, 560, 270, { syn: c.syn, pulses: c.pulses, charge: c.charge, spike: c.spike, labels: 1 - beat(p, 0.3, 0.36) });
        g.alpha(beat(p, 0.28, 0.34), () => meter(g, 650, 480, c.charge));
      },
    },
    {
      id: 'artificial', duration: 16, title: L('Нейрон из чисел', 'A neuron made of numbers'),
      caption: p => p < 0.5 ? L('Теперь заменим клетку числами. Сигналы на входах — числа x. Сила синапсов — числа w, веса.', 'Now replace the cell by numbers. The signals at the inputs are numbers x. The strengths of the synapses are numbers w, the weights.')
        : L('Тело складывает входы, умноженные на веса, и сравнивает с порогом: больше — на выходе 1, меньше — 0. Это и есть искусственный нейрон — сложение и сравнение.', 'The body adds up the inputs times the weights and compares with a threshold: more — the output is 1, less — 0. That is an artificial neuron — adding and comparing.'),
      paint(g, p) {
        g.alpha(1 - beat(p, 0.12, 0.42), () => bioNeuron(g, 560, 270, { syn: [0.9, 0.3, 0.6] }));
        artNeuron(g, 560, 270, { inputs: ['x₁', 'x₂', 'x₃'], w: [1, 0.4, 0.7], wl: ['w₁', 'w₂', 'w₃'], thl: 'θ', show: beat(p, 0.25, 0.5), out: '0 / 1' });
        g.alpha(beat(p, 0.5, 0.58), () => {
          const rows = [[L('дендриты, синапсы', 'dendrites, synapses'), L('входы x и веса w', 'inputs x and weights w')], [L('тело клетки', 'cell body'), L('сумма и порог θ', 'sum and threshold θ')], [L('импульс по аксону', 'impulse along the axon'), L('выход 1 или 0', 'output 1 or 0')]];
          rows.forEach(([a, b], i) => { g.text(a, 300, 445 + 30 * i, 17, C.purple, 'right'); g.text('→', 330, 445 + 30 * i, 17, C.muted); g.text(b, 360, 445 + 30 * i, 17, C.teal, 'left'); });
        });
        g.alpha(beat(p, 0.72, 0.8), () => g.text(L('выход = 1, если w₁x₁ + w₂x₂ + w₃x₃ > θ', 'output = 1 if w₁x₁ + w₂x₂ + w₃x₃ > θ'), 500, 48, 26, C.yellow, 'center', 400, true));
      },
    },
    {
      id: 'decide', duration: 16, title: L('Пойти гулять?', 'Go for a walk?'),
      caption: (p, st) => {
        const w = [st.w1, st.w2, st.w3], a = w[0] + w[1], b = w[0] + w[1] + w[2];
        return p < 0.5 ? L(`Нейрон решает, идти ли гулять. Солнце (x₁ = 1), выходной (x₂ = 1), дождя нет (x₃ = 0). Сумма ${num(a)} ${a > st.th ? '>' : '≤'} ${num(st.th)} — ${a > st.th ? 'идём!' : 'дома.'}`, `A neuron decides whether to go for a walk. Sun (x₁ = 1), a weekend (x₂ = 1), no rain (x₃ = 0). The sum ${num(a)} ${a > st.th ? '>' : '≤'} ${num(st.th)} — ${a > st.th ? 'let us go!' : 'stay home.'}`)
          : L(`Пошёл дождь: x₃ = 1. Его вес ${num(w[2])}${w[2] < 0 ? ' отрицательный — он тянет решение вниз' : ''}. Сумма ${num(b)} ${b > st.th ? '>' : '≤'} ${num(st.th)} — ${b > st.th ? 'всё равно идём.' : 'остаёмся дома.'}`, `It starts to rain: x₃ = 1. Its weight is ${num(w[2])}${w[2] < 0 ? ', negative — it pulls the decision down' : ''}. The sum ${num(b)} ${b > st.th ? '>' : '≤'} ${num(st.th)} — ${b > st.th ? 'we go anyway.' : 'we stay home.'}`);
      },
      ask: {
        at: 0.45,
        q: L('Сейчас пойдёт дождь (x₃ = 1, вес −2). Что решит нейрон?', 'Now it starts to rain (x₃ = 1, weight −2). What will the neuron decide?'),
        options: [{ text: L('Останется дома', 'Stay home'), ok: true }, { text: L('Пойдёт гулять', 'Go for a walk') }, { text: L('Не сможет решить', 'Cannot decide') }],
        explain: L('1 + 1 − 2 = 0, а это не больше порога 0,5. Отрицательный вес — это «против».', '1 + 1 − 2 = 0, which is not more than the threshold 0.5. A negative weight means "against".'),
      },
      lens: {
        text: L('Это ваш нейрон: меняйте веса и порог и смотрите, что он решит в сухой и в дождливый выходной.', 'This is your neuron: change the weights and the threshold and see what it decides on a dry and on a rainy weekend.'),
        knobs: [
          { key: 'w1', label: L('вес солнца w₁', 'sun weight w₁'), min: -3, max: 3, step: 0.5 },
          { key: 'w2', label: L('вес выходного w₂', 'weekend weight w₂'), min: -3, max: 3, step: 0.5 },
          { key: 'w3', label: L('вес дождя w₃', 'rain weight w₃'), min: -3, max: 3, step: 0.5 },
          { key: 'th', label: L('порог θ', 'threshold θ'), min: -2, max: 4, step: 0.5 },
        ],
      },
      paint(g, p, st) {
        const x = [1, 1, p < 0.5 ? 0 : 1], w = [st.w1, st.w2, st.w3];
        const r = artNeuron(g, 560, 270, { inputs: x, w, th: st.th, names: false, out: '' });
        ICONS.forEach((icon, i) => icon(g, 220, 150 + 120 * i, 26, x[i]));
        [L('солнце', 'sun'), L('выходной', 'weekend'), L('дождь', 'rain')].forEach((s, i) => g.text(s, 220, 200 + 120 * i, 15, C.muted));
        g.text(`${w.map((v, i) => `${num(v)}·${x[i]}`).join(' + ').replace(/\+ −/g, '− ')} = ${num(r.sum)}`, 560, 175, 20, C.white);
        if (r.fire) person(g, 880, 300, 120, C.yellow, { arm: -0.3 }); else {
          g.box(840, 240, 80, 70, '#1a1f28', C.muted, 4);
          g.ctx.fillStyle = C.muted; g.ctx.beginPath(); g.ctx.moveTo(828, 244); g.ctx.lineTo(880, 200); g.ctx.lineTo(932, 244); g.ctx.fill();
        }
        g.text(r.fire ? L('идём гулять', 'off for a walk') : L('сидим дома', 'staying home'), 880, 360, 18, r.fire ? C.yellow : C.muted, 'center', 600);
        const dry = st.w1 + st.w2 > st.th, wet = st.w1 + st.w2 + st.w3 > st.th, word = f => (f ? L('идём', 'go') : L('дома', 'home'));
        g.alpha(beat(p, 0.6, 0.7), () => g.text(`${g.t(L('сухой выходной', 'dry weekend'))}: ${g.t(word(dry))}   ·   ${g.t(L('с дождём', 'with rain'))}: ${g.t(word(wet))}`, 560, 470, 18, C.muted));
        if (p >= 0.5 && x[2]) for (let k = 0; k < 24; k++) { const xx = (k * 83 + p * 900) % 1000, yy = (k * 47 + p * 3000) % 560; g.line(xx, yy, xx - 6, yy + 16, C.blue + '55', 2); }
      },
    },
    {
      id: 'weights', duration: 14, title: L('Знания — в весах', 'Knowledge lives in weights'),
      caption: p => p < 0.55 ? L('Два нейрона, один и тот же пасмурный выходной. У Ани вес выходного большой — она идёт. Борис гуляет только в солнце — он дома.', 'Two neurons, the same cloudy weekend. Anya has a big weekend weight — she goes. Boris walks only in the sun — he stays home.')
        : L('Входы одинаковые, решения разные: всё, что нейрон «знает», записано в его весах. В мозге так же — знания хранятся в силе синапсов.', 'The same inputs, different decisions: everything a neuron "knows" is written in its weights. The brain is the same — knowledge is stored in the strength of synapses.'),
      ask: {
        at: 0.9,
        q: L('Аня решила, что дождь ей не мешает. Что изменится в её нейроне?', 'Anya decided that rain does not bother her. What changes in her neuron?'),
        options: [{ text: L('Вес дождя станет около 0', 'The rain weight becomes about 0'), ok: true }, { text: L('Пропадёт вход «солнце»', 'The sun input disappears') }, { text: L('Порог станет огромным', 'The threshold becomes huge') }],
        explain: L('Вход с весом 0 ни на что не влияет: дождь есть, но нейрону всё равно. Входы остаются, меняются только веса.', 'An input with weight 0 has no effect: there is rain, but the neuron does not care. The inputs stay, only the weights change.'),
      },
      paint(g, p) {
        const x = [0, 1, 0];
        const two = [[260, L('Аня', 'Anya'), [1, 1, -2], 0.5, C.teal], [740, L('Борис', 'Boris'), [2, 0.2, -1], 1, C.orange]];
        two.forEach(([cx, name, w, th, color], j) => g.alpha(beat(p, 0.05 + 0.15 * j, 0.15 + 0.15 * j), () => {
          at(g, cx, 270, 0.62, () => {
            const r = artNeuron(g, 0, 0, { inputs: x, w, th, names: false, out: '' });
            g.text(r.fire ? L('идёт', 'goes') : L('дома', 'home'), 370, 0, 36, r.fire ? C.yellow : C.muted, 'center', 700);
          });
          person(g, cx - 40, 130, 70, color);
          g.text(name, cx + 20, 80, 22, color, 'left', 600);
        }));
        g.alpha(beat(p, 0.1, 0.16), () => ICONS.forEach((icon, i) => icon(g, 440 + 60 * i, 60, 16, x[i])));
        g.alpha(beat(p, 0.6, 0.68), () => g.text(L('одни и те же входы · разные веса · разные решения', 'the same inputs · different weights · different decisions'), 500, 500, 21, C.white));
      },
    },
    {
      id: 'learn', duration: 22, title: L('Учиться — исправлять ошибки', 'Learning is fixing mistakes'),
      caption: p => {
        const k = seen(p);
        return k < 3 ? L('Откуда берутся веса? Их подбирают по примерам. Возьмём дневник Ани: восемь дней — погода и пошла ли она гулять. Сначала все веса нули.', 'Where do weights come from? They are found from examples. Take Anya\'s diary: eight days — the weather and whether she went out. At first all weights are zero.')
          : k < 12 ? L('Нейрон угадывает день. Угадал — ничего не меняем. Ошибся — веса тех входов, что были включены, сдвигаются к правильному ответу: сказал «дома», а она гуляла — веса растут; сказал «гулять», а она дома — уменьшаются.', 'The neuron guesses a day. Right — nothing changes. Wrong — the weights of the inputs that were on move towards the right answer: it said "home" but she went out — they grow; it said "walk" but she stayed — they shrink.')
            : k < 40 ? L('Проход за проходом ошибок всё меньше. Похоже ведёт себя мозг: связи, которые помогают, укрепляются, остальные слабеют («клетки, срабатывающие вместе, связываются крепче»).', 'Pass by pass there are fewer mistakes. The brain behaves similarly: connections that help get stronger, the others weaken ("cells that fire together wire together").')
              : L(`Шестой проход — ни одной ошибки. Нейрон сам нашёл веса ${HISTORY[48].w.map(num).join(', ')}: дождь сильно против, солнце и выходной — за. Правило никто не писал.`, `The sixth pass — not a single mistake. The neuron found the weights ${HISTORY[48].w.map(num).join(', ')} by itself: rain strongly against, sun and weekend in favour. Nobody wrote the rule.`);
      },
      paint(g, p) {
        const k = seen(p), cur = HISTORY[Math.min(k, 47)], day = DAYS[cur.day], w = cur.w;
        // The day being guessed
        g.box(110, 40, 380, 92, '#0c1016', '#2a3140', 12);
        ICONS.forEach((icon, i) => icon(g, 160 + 70 * i, 80, 18, day[i]));
        g.text(L(`день ${cur.day + 1}: ${day[3] ? 'гуляла' : 'дома'}`, `day ${cur.day + 1}: ${day[3] ? 'went out' : 'stayed home'}`), 400, 86, 18, day[3] ? C.yellow : C.muted, 'center', 600);
        at(g, 290, 290, 0.6, () => artNeuron(g, 0, 0, { inputs: day.slice(0, 3), w, th: 0.5, names: false, out: cur.guess ? L('гулять', 'walk') : L('дома', 'home') }));
        const next = HISTORY[Math.min(k, 47) + 1].w;
        g.text(cur.ok ? L('угадал ✓', 'right ✓') : L('ошибся ✗ → поправка', 'wrong ✗ → a correction'), 290, 420, 22, cur.ok ? C.green : C.red, 'center', 700);
        if (!cur.ok) g.text(next.map((v, i) => (v !== w[i] ? `w${'₁₂₃'[i]}: ${num(w[i])} → ${num(v)}` : '')).filter(Boolean).join('   '), 290, 455, 17, C.white);
        // Mistakes per pass through the diary
        g.text(L('ошибок за проход по дневнику', 'mistakes per pass through the diary'), 760, 70, 18, C.white);
        for (let j = 0; j < 6; j++) {
          const done = HISTORY.slice(8 * j, Math.min(8 * j + 8, k)), m = done.filter(r => !r.ok).length, y = 115 + 56 * j;
          g.text(L(`проход ${j + 1}`, `pass ${j + 1}`), 610, y + 16, 16, C.muted, 'right');
          for (let d = 0; d < 8; d++) {
            const r = done[d];
            g.box(630 + 38 * d, y, 30, 32, r ? (r.ok ? '#16301f' : '#3a1414') : '#11161e', r ? (r.ok ? C.green : C.red) : '#2a3140', 6);
            if (r) g.text(r.ok ? '✓' : '✗', 645 + 38 * d, y + 16, 15, r.ok ? C.green : C.red, 'center', 700);
          }
          if (done.length === 8) g.text(m, 952, y + 16, 20, m ? C.red : C.green, 'center', 700);
        }
      },
    },
    {
      id: 'compare', duration: 18, title: L('Мозг и сеть', 'Brain and network'),
      caption: p => p < 0.6 ? L('Искусственный нейрон придуман по мотивам настоящего, но это сильное упрощение. Сравним.', 'The artificial neuron was inspired by the real one, but it is a strong simplification. Let us compare.')
        : L('Общее — главное: решение рождается из множества простых элементов, а знания живут в силе связей. Учатся они по-разному, и как именно учится мозг, ещё исследуют.', 'What they share is the main thing: a decision is born from many simple parts, and knowledge lives in the strength of the links. They learn differently, and how exactly the brain learns is still being studied.'),
      paint(g, p) {
        brain(g, 450, 72, 0.32, {});
        g.text(L('Мозг', 'Brain'), 450, 140, 22, C.pink, 'center', 600);
        g.box(745, 30, 70, 70, '#0f1a1a', C.teal, 8);
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) g.circle(760 + 20 * i, 45 + 20 * j, 5, C.teal, null);
        g.text(L('Нейросеть', 'Network'), 780, 140, 22, C.teal, 'center', 600);
        const rows = [
          [L('элементы', 'parts'), L('86 млрд нейронов', '86 billion neurons'), L('большие сети: сотни млрд весов', 'big nets: hundreds of billions of weights')],
          [L('сигнал', 'signal'), L('импульсы «всё или ничего»', '"all or nothing" impulses'), L('числа', 'numbers')],
          [L('энергия', 'power'), L('≈ 20 Вт — как лампочка', '≈ 20 W — like a light bulb'), L('обучение: тысячи видеокарт', 'training: thousands of GPUs')],
          [L('примеры', 'examples'), L('ребёнку хватает нескольких', 'a child needs a few'), L('нужны тысячи и миллионы', 'needs thousands and millions')],
          [L('когда учится', 'learns when'), L('всю жизнь, понемногу', 'all life long, bit by bit'), L('обычно один раз, потом веса заморожены', 'usually once, then the weights are frozen')],
        ];
        rows.forEach(([a, b, c], i) => g.alpha(beat(p, 0.06 + 0.1 * i, 0.12 + 0.1 * i), () => {
          const y = 200 + 66 * i;
          g.line(60, y - 33, 960, y - 33, '#1c222c', 1);
          g.text(a, 80, y, 16, C.muted, 'left');
          g.text(b, 450, y, 18, C.white);
          g.text(c, 780, y, 18, C.white);
        }));
      },
    },
    {
      id: 'map', duration: 12, title: L('Что дальше', 'What comes next'),
      caption: () => L('Любое машинное обучение — три части: модель с весами, мера ошибки и способ подкручивать веса, чтобы ошибка падала. Дальше в разделе — как это работает на прямой, на классах, в целой сети.', 'All of machine learning is three parts: a model with weights, a measure of the error and a way to turn the weights so that the error goes down. Next in the section — how it works for a line, for classes, in a whole network.'),
      paint(g, p) {
        const parts = [[200, L('модель', 'model'), L('функция с весами', 'a function with weights'), C.teal], [500, L('ошибка', 'error'), L('насколько промахнулась', 'how far it missed'), C.red], [800, L('подстройка', 'adjusting'), L('веса — против ошибки', 'weights — against the error'), C.yellow]];
        parts.forEach(([x, a, b, c], i) => g.alpha(beat(p, 0.05 + 0.1 * i, 0.12 + 0.1 * i), () => {
          g.box(x - 120, 120, 240, 110, '#0f141c', c, 14);
          g.text(a, x, 155, 24, c, 'center', 600);
          g.text(b, x, 195, 16, C.white);
          if (i < 2) g.arrow(x + 125, 175, x + 175, 175, C.muted, 2);
        }));
        g.alpha(beat(p, 0.35, 0.42), () => { g.curve([[800, 232], [800, 280], [200, 280], [200, 232]], C.muted, 2); g.arrow(200, 262, 200, 236, C.muted, 2); g.text(L('и снова, тысячи раз', 'and again, thousands of times'), 500, 300, 15, C.muted); });
        const topics = [L('Регрессия', 'Regression'), L('Классификация', 'Classification'), L('Нейросеть', 'Neural network'), L('Обратное распространение', 'Backpropagation'), L('Переобучение', 'Overfitting')];
        topics.forEach((s, i) => g.alpha(beat(p, 0.5 + 0.07 * i, 0.56 + 0.07 * i), () => {
          const x = 110 + 195 * i;
          g.box(x - 94, 380, 188, 60, '#101a24', C.blue, 30);
          g.text(s, x, 410, 14, C.blue, 'center', 600);
        }));
      },
    },
  ],
};
