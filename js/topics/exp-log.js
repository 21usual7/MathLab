// Exponent and logarithm. 2^x as repeated doubling (a step right multiplies, not adds), any base a^x
// through (0, 1), the logarithm as the question "which power?" — the mirror image in y = x — and
// how an exponent eventually beats any power of x.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { explorer } from '../views/explore.js';
import { t } from '../core/i18n.js';

const WHITE = '#ffffff';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r2 = v => Math.round(v * 100) / 100;
const DOUBLING = { cx: 0.5, cy: 4.5, unit: 46 };

export default {
  view: '2d',
  view2d: DOUBLING,

  setup(scene) {
    scene.add('y = 2^x', { id: 'exp', color: 'blue' });
    scene.add('y = a^x', { id: 'expa', color: 'blue', visible: false });
    scene.add('y = x', { id: 'diag', color: 'grey', dim: true, visible: false });
    scene.add('y = log(x, 2)', { id: 'log', color: 'yellow', visible: false });
    scene.add('y = x^2', { id: 'sq', color: 'purple', visible: false });
    scene.ensureParam('a', 2, { min: 0.2, max: 3 });
    scene.ensureParam('p', 1.5, { min: -2.5, max: 2.5 });

    scene.custom.push(
      {
        // Integer points of 2^x with "×2" between neighbours; m is how far left/right we look
        id: 'doubling',
        draw2d(p, sc, s) {
          for (let n = -3; n <= 3; n++) {
            const x0 = n, x1 = n + 1, y0 = 2 ** x0, y1 = 2 ** x1;
            if (x1 <= 3) {
              p.line(x0, y0, x1, y0, 'rgba(255,255,255,0.3)', { width: 1.2, dash: [3, 4] });
              p.arrow(x1, y0, x1, y1, COLORS.green, { width: 1.8 });
              if (x0 >= 0) p.tex(`x2_${n}`, '\\green{\\times 2}', x1, (y0 + y1) / 2, COLORS.green, { dx: 8, dy: 0 });
            }
            p.dot(x0, y0, WHITE, 5);
          }
          p.dot(3, 8, WHITE, 5);
        },
        legend: () => '\\begin{array}{c|ccccccc} x & -2 & -1 & 0 & 1 & 2 & 3 \\\\ \\hline 2^x & \\frac14 & \\frac12 & 1 & 2 & 4 & 8 \\end{array}',
      },
      {
        // All a^x pass through (0, 1): a⁰ = 1 for every a
        id: 'one',
        draw2d(p) {
          p.dot(0, 1, WHITE, 6);
          p.tex('one', '(0,\\ 1)', 0, 1, WHITE, { dx: 10, dy: -14 });
        },
        legend: s => `a = ${fmt(r2(s.a))}:\\ \\ ${s.a > 1.005 ? t({ en: '\\text{grows}', ru: '\\text{растёт}' }) : s.a < 0.995 ? t({ en: '\\text{decays}', ru: '\\text{убывает}' }) : t({ en: '\\text{flat: } 1^x = 1', ru: '\\text{прямая: } 1^x = 1' })}`,
      },
      {
        // The mirror: (p, 2^p) on the exponent ↔ (2^p, p) on the logarithm
        id: 'mirror',
        draw2d(p, sc, s) {
          const q = s.p, v = 2 ** q;
          p.line(q, v, v, q, 'rgba(255,255,255,0.35)', { width: 1.2, dash: [4, 4] });
          p.dot(v, q, COLORS.yellow, 6);
          p.tex('Pm', `(\\blue{${fmt(r2(v))}},\\ \\yellow{${fmt(r2(q))}})`, v, q, COLORS.yellow, { dx: 10, dy: 16 });
          p.tex('P', `(\\yellow{${fmt(r2(q))}},\\ \\blue{${fmt(r2(v))}})`, q, v, COLORS.blue, { dx: -10, dy: -14, align: 'right' });
          p.handle(q, v, COLORS.blue, x => { sc.play('p', false); sc.setParam('p', clamp(Math.round(x * 20) / 20, -2.5, 2.5)); });
        },
        legend: s => {
          const q = r2(s.p), v = fmt(r2(2 ** q));
          return `2^{\\yellow{${fmt(q)}}} = \\blue{${v}} \\;\\Longleftrightarrow\\; \\log_2 \\blue{${v}} = \\yellow{${fmt(q)}}`;
        },
      },
      {
        // ×2 on the input is +1 on the output of log₂
        id: 'plusone',
        draw2d(p) {
          [1, 2, 4, 8].forEach((x, i) => {
            p.dot(x, i, WHITE, 5);
            if (i < 3) {
              p.line(x, i, 2 * x, i, 'rgba(255,255,255,0.3)', { width: 1.2, dash: [3, 4] });
              p.arrow(2 * x, i, 2 * x, i + 1, COLORS.green, { width: 1.8 });
              p.tex(`p1_${i}`, '\\green{+1}', 2 * x, i + 0.5, COLORS.green, { dx: 8, dy: 0 });
            }
          });
        },
        legend: () => '\\begin{array}{c|cccc} x & 1 & 2 & 4 & 8 \\\\ \\hline \\log_2 x & 0 & 1 & 2 & 3 \\end{array}',
      },
      explorer(),
    );
  },

  steps: [
    {
      title: { en: 'Doubling', ru: 'Удвоение' },
      text: {
        en: '$\\blue{y = 2^x}$ starts at $2^0 = 1$, and every step to the right <b>multiplies</b> the height by $2$: $1, 2, 4, 8, \\dots$ Not $+2$ — $\\times 2$. That is the whole difference between an exponent and a straight line: a line adds the same amount per step, an exponent multiplies by the same amount. So it starts slowly and then shoots up.',
        ru: '$\\blue{y = 2^x}$ начинается с $2^0 = 1$, и каждый шаг вправо <b>умножает</b> высоту на $2$: $1, 2, 4, 8, \\dots$ Не $+2$, а $\\times 2$. В этом вся разница между экспонентой и прямой: прямая за каждый шаг прибавляет одно и то же, экспонента — умножает на одно и то же. Поэтому она сначала растёт медленно, а потом взлетает.',
      },
      hint: {
        title: { en: 'Why is 2⁰ = 1?', ru: 'Почему 2⁰ = 1?' },
        text: {
          en: 'Go backward: $2^3 = 8$, $2^2 = 4$, $2^1 = 2$ — each step left <b>divides</b> by $2$. One more step: $2^0 = 2 / 2 = 1$. It is not a rule to memorise, it is the only value that keeps the pattern.',
          ru: 'Идите назад: $2^3 = 8$, $2^2 = 4$, $2^1 = 2$ — каждый шаг влево <b>делит</b> на $2$. Ещё шаг: $2^0 = 2 / 2 = 1$. Это не правило для заучивания, а единственное значение, которое сохраняет закономерность.',
        },
      },
      state: { show: ['exp', 'doubling'], window: DOUBLING, controls: [] },
    },
    {
      title: { en: 'Left of zero', ru: 'Левее нуля' },
      text: {
        en: 'Keep walking left and keep halving: $1,\\ \\frac12,\\ \\frac14,\\ \\frac18, \\dots$ The graph gets closer and closer to the $x$-axis, but never touches it: halving a positive number never gives zero, and never a negative number.',
        ru: 'Продолжим идти влево и делить пополам: $1,\\ \\frac12,\\ \\frac14,\\ \\frac18, \\dots$ График всё ближе прижимается к оси $x$, но никогда её не касается: деление положительного числа пополам никогда не даст ноль, и тем более отрицательное число.',
      },
      check: {
        q: { en: 'What is $2^{-1}$?', ru: 'Чему равно $2^{-1}$?' },
        options: [{ text: '$-2$' }, { text: '$0$' }, { text: '$\\frac12$', ok: true }],
        explain: {
          en: 'One step left of $2^0 = 1$ is half of it: $2^{-1} = \\frac12$. A negative exponent means «divide», not «negative».',
          ru: 'Один шаг влево от $2^0 = 1$ — это его половина: $2^{-1} = \\frac12$. Отрицательный показатель значит «делить», а не «отрицательное».',
        },
      },
      state: { show: ['exp', 'doubling'], window: { cx: -1, cy: 1, unit: 110 }, controls: [] },
    },
    {
      title: { en: 'Any base', ru: 'Любое основание' },
      text: {
        en: 'Replace $2$ by any positive $a$: $\\blue{y = a^x}$. For $a > 1$ it grows, faster for bigger $a$. For $a < 1$ each step multiplies by a number less than one, and the graph decays — the same curve mirrored. And $a = 1$ is boring: $1^x = 1$.',
        ru: 'Заменим $2$ любым положительным $a$: $\\blue{y = a^x}$. При $a > 1$ функция растёт, и тем быстрее, чем больше $a$. При $a < 1$ каждый шаг умножает на число меньше единицы, и график убывает — та же кривая в зеркале. А $a = 1$ скучно: $1^x = 1$.',
      },
      try: { en: 'Press ▶ next to $a$.', ru: 'Нажмите ▶ возле $a$.' },
      check: {
        q: { en: 'At which point do all the curves $y = a^x$ meet?', ru: 'В какой точке встречаются все кривые $y = a^x$?' },
        options: [{ text: '$(0,\\ 1)$', ok: true }, { text: '$(1,\\ 0)$' }, { text: '$(0,\\ 0)$' }],
        explain: {
          en: 'For every base $a^0 = 1$: zero steps — nothing multiplied yet. So every exponent passes through $(0,\\ 1)$.',
          ru: 'Для любого основания $a^0 = 1$: ноль шагов — ещё ничего не умножили. Поэтому любая экспонента проходит через $(0,\\ 1)$.',
        },
        reveal: scene => scene.play('a', true),
      },
      state: { show: ['expa', 'one'], params: { a: 2 }, window: { cx: 0, cy: 2.5, unit: 60 }, controls: ['a'] },
    },
    {
      title: { en: 'The question backward: a logarithm', ru: 'Обратный вопрос: логарифм' },
      text: {
        en: '$2^{\\yellow{3}} = \\blue{8}$ answers «what do I get after 3 doublings?». The opposite question — «how many doublings make 8?» — is the logarithm: $\\log_2 \\blue{8} = \\yellow{3}$. Swapping input and output means swapping $x$ and $y$: every point $(\\yellow{p},\\ \\blue{2^p})$ jumps across the diagonal $y = x$ to $(\\blue{2^p},\\ \\yellow{p})$. The <span class="c-yellow">yellow curve</span> is $y = \\log_2 x$ — the exponent in a mirror.',
        ru: '$2^{\\yellow{3}} = \\blue{8}$ отвечает на вопрос «что получится после 3 удвоений?». Обратный вопрос — «сколько удвоений дают 8?» — это логарифм: $\\log_2 \\blue{8} = \\yellow{3}$. Поменять местами вход и выход — значит поменять $x$ и $y$: каждая точка $(\\yellow{p},\\ \\blue{2^p})$ перепрыгивает через диагональ $y = x$ в точку $(\\blue{2^p},\\ \\yellow{p})$. <span class="c-yellow">Жёлтая кривая</span> $y = \\log_2 x$ — это экспонента в зеркале.',
      },
      try: { en: 'Drag the blue point along the exponent.', ru: 'Тяните синюю точку вдоль экспоненты.' },
      state: { show: ['exp', 'diag', 'log', 'mirror'], params: { p: 1.5 }, window: { cx: 1.5, cy: 1.2, unit: 62 }, controls: ['p'] },
    },
    {
      title: { en: 'Multiplying becomes adding', ru: 'Умножение превращается в сложение' },
      text: {
        en: 'Read the logarithm the other way round: doubling $x$ adds exactly $1$ to $\\log_2 x$. From $1$ to $2$, from $2$ to $4$, from $4$ to $8$ — the graph climbs one unit each time, though the steps get longer and longer. This is why the logarithm grows so slowly, and why $\\log(ab) = \\log a + \\log b$.',
        ru: 'Прочитаем логарифм с другой стороны: удвоение $x$ прибавляет к $\\log_2 x$ ровно $1$. От $1$ до $2$, от $2$ до $4$, от $4$ до $8$ — график каждый раз поднимается на единицу, хотя шаги становятся всё длиннее. Поэтому логарифм растёт так медленно, и поэтому $\\log(ab) = \\log a + \\log b$.',
      },
      check: {
        q: { en: '$\\log_2 32 = ?$', ru: '$\\log_2 32 = ?$' },
        options: [{ text: '$4$' }, { text: '$5$', ok: true }, { text: '$16$' }],
        explain: {
          en: '$32 = 2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2$: five doublings starting from $1$. So $\\log_2 32 = 5$.',
          ru: '$32 = 2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2$: пять удвоений, начиная с $1$. Значит, $\\log_2 32 = 5$.',
        },
      },
      state: { show: ['log', 'plusone'], window: { cx: 5, cy: 1.5, unit: 62 }, controls: [] },
    },
    {
      title: { en: 'Who grows faster?', ru: 'Кто растёт быстрее?' },
      text: {
        en: '$\\purple{x^2}$ against $\\blue{2^x}$. They cross three times: at $x = 2$, at $x = 4$, and once more on the left, near $x \\approx -0.77$. After $x = 4$ the exponent leaves the parabola behind for good: a power adds a bit more each step, an exponent doubles. This is the same for $x^3$ or $x^{10}$ — only later.',
        ru: '$\\purple{x^2}$ против $\\blue{2^x}$. Они пересекаются трижды: при $x = 2$, при $x = 4$ и ещё раз слева, около $x \\approx -0.77$. После $x = 4$ экспонента навсегда уходит от параболы: степень прибавляет каждый шаг чуть больше, а экспонента удваивает. С $x^3$ или $x^{10}$ будет так же — только позже.',
      },
      try: { en: 'Point at the curves to find where they cross.', ru: 'Наведите указатель на кривые, чтобы найти точки пересечения.' },
      check: {
        q: { en: 'Which is bigger at $x = 10$?', ru: 'Что больше при $x = 10$?' },
        options: [{ text: '$2^{10}$', ok: true }, { text: '$10^2$' }, { text: { en: 'equal', ru: 'поровну' } }],
        explain: {
          en: '$2^{10} = 1024$, while $10^2 = 100$ — ten times less. Ten doublings are a lot.',
          ru: '$2^{10} = 1024$, а $10^2 = 100$ — в десять раз меньше. Десять удвоений — это много.',
        },
        reveal: (scene, stage) => { if (stage.p2) stage.p2.setView({ cx: 5, cy: 30, unit: 9 }, 1800); },
      },
      state: { show: ['exp', 'sq'], window: { cx: 2.5, cy: 7, unit: 40 }, controls: [] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'In the Lab compare $y = 2^x$ with $y = x^3$, find their crossings, and try $y = \\log(x, 10)$. One base is special and appears everywhere in nature and in calculus: $e \\approx 2.718$. Where it comes from is the next story.',
        ru: 'В Lab сравните $y = 2^x$ и $y = x^3$, найдите точки пересечения, попробуйте $y = \\log(x, 10)$. Одно основание особенное — оно встречается всюду в природе и в анализе: $e \\approx 2.718$. Откуда оно берётся — следующая история.',
      },
      state: { show: ['exp', 'diag', 'log', 'mirror'], params: { p: 2 }, window: { cx: 1.5, cy: 1.2, unit: 62 }, controls: ['p'] },
    },
  ],
};
