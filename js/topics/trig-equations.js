// Trigonometric equations on the Ferris wheel. sin x = a: which cabins are at height a? A horizontal line cuts
// the wheel in two places, arcsin a and π − arcsin a, and every full turn brings them back: + 2πn. On the sine
// wave the same line cuts infinitely many points. cos x = a: a vertical line, ± arccos a. |a| > 1: no cabin.

import { COLORS } from '../core/palette.js';
import { t } from '../core/i18n.js';
import { DEG, r2, wheel, ghost } from './unit-circle.js';

const WHITE = '#ffffff';
const CIRCLE = { cx: 0, cy: 0, unit: 220, fit: [3.2, 3.2] };
const WAVE = { cx: 3.1, cy: 0, unit: 80, fit: [20, 3.2] };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const snap = v => clamp(Math.round(v * 100) / 100, -1.2, 1.2);
const deg = r => Math.round(r / DEG * 10) / 10;

// All solutions of sin x = a (or cos x = a) in [lo, hi], in radians
export function roots(fn, a, lo, hi) {
  if (Math.abs(a) > 1) return [];
  const base = fn === 'sin' ? [Math.asin(a), Math.PI - Math.asin(a)] : [Math.acos(a), -Math.acos(a)];
  const out = [];
  for (let n = Math.floor((lo - Math.PI) / (2 * Math.PI)); n <= Math.ceil((hi + Math.PI) / (2 * Math.PI)); n++) {
    for (const b of base) {
      const x = b + 2 * Math.PI * n;
      if (x >= lo - 1e-9 && x <= hi + 1e-9 && !out.some(y => Math.abs(y - x) < 1e-9)) out.push(x);
    }
  }
  return out.sort((x, y) => x - y);
}

const rim = p => p.param(Math.cos, Math.sin, 0, 2 * Math.PI, 'rgba(255,255,255,0.55)', 2);
const none = () => `\\text{${t({ en: 'no cabin is there: no solutions', ru: 'там нет ни одной кабинки: решений нет' })}}`;

export default {
  view: '2d',
  view2d: CIRCLE,
  lab: false,

  setup(scene) {
    scene.ensureParam('a', 0.5, { min: -1.2, max: 1.2, step: 0.01 });
    scene.ensureParam('alpha', 80, { min: 0, max: 359, step: 1 });

    scene.custom.push(
      {
        // sin x = a: the horizontal line at height a and the two cabins on it
        id: 'hline',
        draw2d(p, sc, s) {
          rim(p);
          p.line(-1.5, s.a, 1.5, s.a, COLORS.red, { width: 2, dash: [6, 5] });
          p.handle(1.45, s.a, COLORS.red, (_, y) => sc.setParam('a', snap(y)));
          p.tex('ha', `y = ${r2(s.a)}`, 1.45, s.a, COLORS.red, { dx: -10, dy: -12, align: 'right' });
          roots('sin', s.a, 0, 2 * Math.PI - 1e-9).forEach((x, i) => ghost(p, x / DEG, i ? COLORS.purple : COLORS.yellow, 'hr' + i, `${deg(x)}°`));
        },
        legend: s => {
          if (Math.abs(s.a) > 1) return none();
          const x = Math.asin(s.a);
          return `\\yellow{\\arcsin ${r2(s.a)} = ${deg(x)}°},\\qquad \\purple{180° - ${deg(x)}° = ${deg(Math.PI - x)}°}`;
        },
      },
      {
        // The same line across the sine wave: a pair of solutions on every turn
        id: 'hwave',
        draw2d(p, sc, s) {
          p.curve(Math.sin, COLORS.red, 2.5, -2 * Math.PI, 4 * Math.PI);
          p.line(-2 * Math.PI, s.a, 4 * Math.PI, s.a, WHITE + 'aa', { width: 1.5, dash: [6, 5] });
          p.handle(4 * Math.PI, s.a, WHITE, (_, y) => sc.setParam('a', snap(y)));
          const r = roots('sin', s.a, -2 * Math.PI, 4 * Math.PI), x0 = Math.asin(s.a);
          r.forEach(x => {
            const q = (x - x0) / (2 * Math.PI), first = Math.abs(q - Math.round(q)) < 1e-6; // arcsin a + 2πn
            p.line(x, 0, x, s.a, (first ? COLORS.yellow : COLORS.purple) + '99', { width: 1.2, dash: [3, 4] });
            p.dot(x, s.a, first ? COLORS.yellow : COLORS.purple, 5);
          });
          [[-2, '-2\\pi'], [-1, '-\\pi'], [1, '\\pi'], [2, '2\\pi'], [3, '3\\pi'], [4, '4\\pi']].forEach(([k, l]) =>
            p.tex('wp' + k, l, k * Math.PI, 0, '#b9c1cd', { dx: 0, dy: 16, align: 'center' }));
        },
        legend: s => (Math.abs(s.a) > 1 ? none()
          : `\\yellow{x = ${r2(Math.asin(s.a))} + 2\\pi n},\\qquad \\purple{x = \\pi - ${r2(Math.asin(s.a))} + 2\\pi n}`),
      },
      {
        // cos x = a: the vertical line at shift a and the two cabins on it, above and below
        id: 'vline',
        draw2d(p, sc, s) {
          rim(p);
          p.line(s.a, -1.5, s.a, 1.5, COLORS.blue, { width: 2, dash: [6, 5] });
          p.handle(s.a, -1.45, COLORS.blue, x => sc.setParam('a', snap(x)));
          p.tex('va', `x = ${r2(s.a)}`, s.a, -1.45, COLORS.blue, { dx: 10, dy: 0 });
          roots('cos', s.a, -Math.PI, Math.PI).forEach((x, i) => ghost(p, x / DEG, x >= 0 ? COLORS.yellow : COLORS.purple, 'vr' + i, `${deg(x)}°`));
        },
        legend: s => (Math.abs(s.a) > 1 ? none()
          : `\\yellow{\\arccos ${r2(s.a)} = ${deg(Math.acos(s.a))}°},\\qquad \\purple{-${deg(Math.acos(s.a))}°}`),
      },
      {
        // The second task: a draggable cabin, nothing else shown
        id: 'cab',
        draw2d: (p, sc, s) => wheel(p, sc, s),
        legend: s => `\\alpha = ${s.alpha}°,\\quad \\blue{\\cos\\alpha = ${r2(Math.cos(s.alpha * DEG))}}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'Which cabins are at height a?', ru: 'Какие кабинки на высоте a?' },
      text: {
        en: 'To solve $\\sin x = a$ is to find every turn of the wheel that puts the cabin at height $a$. Draw a horizontal line at that height: it cuts the wheel in <b>two</b> places, mirror images across the vertical. If one angle is $x_0$, the other is $180° - x_0$.',
        ru: 'Решить $\\sin x = a$ — значит найти все повороты колеса, при которых кабинка на высоте $a$. Проведём горизонтальную прямую на этой высоте: она пересекает колесо в <b>двух</b> местах, зеркальных относительно вертикали. Если один угол $x_0$, то другой — $180° - x_0$.',
      },
      try: { en: 'Drag the red line up and down.', ru: 'Тяните красную прямую вверх и вниз.' },
      check: {
        q: { en: 'How many cabins per turn are at height exactly $1$?', ru: 'Сколько кабинок за оборот на высоте ровно $1$?' },
        options: [{ text: '$1$', ok: true }, { text: '$2$' }, { text: '$0$' }],
        explain: {
          en: 'At the very top the line only touches the wheel: the two mirror cabins merge into one, $x = 90°$.',
          ru: 'На самом верху прямая только касается колеса: две зеркальные кабинки сливаются в одну, $x = 90°$.',
        },
        reveal: scene => scene.animateParams({ a: 1 }, 900),
      },
      state: { show: ['hline'], params: { a: 0.5 }, window: CIRCLE, controls: ['a'] },
    },
    {
      title: { en: 'arcsin: the right-hand cabin', ru: 'arcsin: правая кабинка' },
      text: {
        en: 'One of the two cabins is always on the right half, between $-90°$ and $90°$. Its angle has a name: $\\yellow{\\arcsin a}$ — «the angle whose sine is $a$». The calculator gives exactly this one. The other cabin you get from the mirror: $\\purple{180° - \\arcsin a}$.',
        ru: 'Одна из двух кабинок всегда на правой половине, между $-90°$ и $90°$. Её угол получил имя: $\\yellow{\\arcsin a}$ — «угол, синус которого равен $a$». Калькулятор выдаёт именно его. Вторую кабинку даёт зеркало: $\\purple{180° - \\arcsin a}$.',
      },
      check: {
        q: { en: '$\\arcsin(-0.5) = ?$', ru: '$\\arcsin(-0.5) = ?$' },
        options: [{ text: '$-30°$', ok: true }, { text: '$210°$' }, { text: '$150°$' }],
        explain: {
          en: 'Both $-30°$ and $210°$ have height $-0.5$, but arcsin is the cabin on the <b>right</b> half: $-30°$. $210° = 180° - (-30°)$ is the mirror one.',
          ru: 'На высоте $-0.5$ и $-30°$, и $210°$, но арксинус — кабинка на <b>правой</b> половине: $-30°$. А $210° = 180° - (-30°)$ — зеркальная.',
        },
        reveal: scene => scene.animateParams({ a: -0.5 }, 900),
      },
      state: { show: ['hline'], params: { a: 0.8 }, window: CIRCLE, controls: ['a'] },
    },
    {
      title: { en: 'Every turn again', ru: 'На каждом обороте снова' },
      text: {
        en: 'The wheel does not stop after one turn: each extra $2\\pi$ brings both cabins back to height $a$. On the sine wave this is plain — the line crosses it again and again. All the solutions: $$\\begin{gathered} x = \\yellow{\\arcsin a} + 2\\pi n, \\\\ x = \\purple{\\pi - \\arcsin a} + 2\\pi n, \\end{gathered}$$ where $n$ is any whole number of turns, also negative.',
        ru: 'Колесо не останавливается после одного оборота: каждый лишний $2\\pi$ возвращает обе кабинки на высоту $a$. На синусоиде это видно сразу — прямая пересекает её снова и снова. Все решения: $$\\begin{gathered} x = \\yellow{\\arcsin a} + 2\\pi n, \\\\ x = \\purple{\\pi - \\arcsin a} + 2\\pi n, \\end{gathered}$$ где $n$ — любое целое число оборотов, в том числе отрицательное.',
      },
      check: {
        q: { en: 'How many solutions does $\\sin x = 0.3$ have?', ru: 'Сколько решений у $\\sin x = 0.3$?' },
        options: [{ text: { en: 'infinitely many', ru: 'бесконечно много' }, ok: true }, { text: '$2$' }, { text: '$1$' }],
        explain: {
          en: 'Two on every turn, and the turns never end. That is why the answer is written with $n$, not as a list.',
          ru: 'По два на каждом обороте, а обороты не кончаются. Поэтому ответ записывают с $n$, а не списком.',
        },
      },
      state: { show: ['hwave'], params: { a: 0.3 }, window: WAVE, controls: ['a'] },
    },
    {
      title: { en: 'cos x = a: a vertical line', ru: 'cos x = a: вертикальная прямая' },
      text: {
        en: 'For the cosine ask «which cabins are $a$ to the right?» — a vertical line. Its two cabins are mirror images across the horizontal: one above at $\\yellow{\\arccos a}$ (between $0°$ and $180°$), one below at $\\purple{-\\arccos a}$. All solutions: $$x = \\pm\\arccos a + 2\\pi n.$$',
        ru: 'Для косинуса вопрос «какие кабинки правее оси на $a$?» — вертикальная прямая. Две её кабинки зеркальны относительно горизонтали: одна сверху на $\\yellow{\\arccos a}$ (от $0°$ до $180°$), другая снизу на $\\purple{-\\arccos a}$. Все решения: $$x = \\pm\\arccos a + 2\\pi n.$$',
      },
      try: { en: 'Drag the blue line beyond the wheel.', ru: 'Вытяните синюю прямую за колесо.' },
      check: {
        q: { en: '$\\cos x = 1.2$. Solutions?', ru: '$\\cos x = 1.2$. Решения?' },
        options: [{ text: { en: 'none', ru: 'нет' }, ok: true }, { text: '$x = \\pm\\arccos 1.2 + 2\\pi n$' }, { text: '$x = 0$' }],
        explain: {
          en: 'The wheel has radius $1$: no cabin is ever more than $1$ from the axle. $\\arccos 1.2$ does not exist.',
          ru: 'Радиус колеса $1$: ни одна кабинка не бывает дальше $1$ от оси. $\\arccos 1.2$ не существует.',
        },
        reveal: scene => scene.animateParams({ a: 1.2 }, 900),
      },
      state: { show: ['vline'], params: { a: 0.3 }, window: CIRCLE, controls: ['a'] },
    },
    {
      title: { en: 'Find the height', ru: 'Найдите высоту' },
      text: {
        en: 'Move the line so that the equation $\\sin x = a$ has the solutions $45°$ and $135°$ on the first turn.',
        ru: 'Поставьте прямую так, чтобы у уравнения $\\sin x = a$ на первом обороте были решения $45°$ и $135°$.',
      },
      task: {
        kind: 'drag',
        target: { a: 0.71 },
        tol: 0.015,
        back: 0,
        right: {
          en: '$a = \\sin 45° = \\frac{\\sqrt2}{2} \\approx 0.71$; the mirror gives $180° - 45° = 135°$.',
          ru: '$a = \\sin 45° = \\frac{\\sqrt2}{2} \\approx 0.71$, а зеркало даёт $180° - 45° = 135°$.',
        },
        mistakes: [
          { params: { a: 0.5 }, text: { en: 'These are $30°$ and $150°$: $\\sin 30° = 0.5$.', ru: 'Это $30°$ и $150°$: $\\sin 30° = 0.5$.' } },
          { params: { a: -0.71 }, text: { en: 'The height is right in size but below the axle: these are $225°$ and $315°$.', ru: 'Высота верная по величине, но ниже оси: это $225°$ и $315°$.' } },
        ],
        hints: { a: { en: 'Watch the angles written next to the cabins.', ru: 'Смотрите на углы, подписанные у кабинок.' } },
      },
      state: { show: ['hline'], params: { a: 0.2 }, window: CIRCLE, controls: [] },
    },
    {
      title: { en: 'A solution in the upper half', ru: 'Решение в верхней половине' },
      text: {
        en: 'Solve $\\cos x = -0.5$: drag the cabin to the solution that lies in the <b>upper</b> half of the wheel.',
        ru: 'Решите $\\cos x = -0.5$: поставьте кабинку на то решение, которое в <b>верхней</b> половине колеса.',
      },
      task: {
        kind: 'drag',
        target: { alpha: 120 },
        tol: 0.5,
        back: 3,
        right: {
          en: '$\\arccos(-0.5) = 120°$. The other one is $-120°$, that is $240°$, below. All: $x = \\pm 120° + 360° n$.',
          ru: '$\\arccos(-0.5) = 120°$. Второе — $-120°$, то есть $240°$, внизу. Все: $x = \\pm 120° + 360° n$.',
        },
        mistakes: [
          { params: { alpha: 60 }, text: { en: 'Here $\\cos x = +0.5$: the cabin is to the right of the axle. The minus means to the left.', ru: 'Здесь $\\cos x = +0.5$: кабинка правее оси. Минус значит — левее.' } },
          { params: { alpha: 240 }, text: { en: 'A solution — but in the lower half. Its mirror image is above.', ru: 'Решение, но в нижней половине. Его зеркальное отражение — сверху.' } },
        ],
        hints: { alpha: { en: 'The blue leg must point left and be half a radius long.', ru: 'Синий катет должен смотреть влево и быть длиной в полрадиуса.' } },
      },
      state: { show: ['cab'], params: { alpha: 20 }, window: CIRCLE, controls: [] },
    },
  ],
};
