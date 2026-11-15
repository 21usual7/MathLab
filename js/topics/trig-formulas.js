// Reduction and addition formulas, read off the Ferris wheel. −α is the mirror image across the axle line,
// π − α across the vertical, α + π/2 a quarter turn that swaps the legs. The addition formula: the chord
// between two cabins measured twice — by coordinates and after turning the wheel — gives cos(α − β).

import { COLORS } from '../core/palette.js';
import { DEG, r2, wheel, ghost, angleAt } from './unit-circle.js';

const WHITE = '#ffffff';
const CIRCLE = { cx: 0, cy: 0, unit: 220, fit: [3.2, 3.2] };
const sin = d => Math.sin(d * DEG), cos = d => Math.cos(d * DEG);

// Only the rim and the axes: the scenes with two cabins have no stand, so nothing hides the chord
function rim(p) {
  p.param(Math.cos, Math.sin, 0, 2 * Math.PI, 'rgba(255,255,255,0.55)', 2);
}
// A cabin you can drag, for the angle param name
function cabin(p, sc, s, name, color, label) {
  const P = [cos(s[name]), sin(s[name])];
  p.line(0, 0, ...P, color, { width: 2.5 });
  p.dot(...P, color, 7);
  p.tex('c' + name, label, ...P, color, { dx: P[0] >= 0 ? 10 : -10, dy: P[1] >= 0 ? -10 : 18, align: P[0] >= 0 ? 'left' : 'right' });
  p.handle(...P, color, (x, y) => sc.setParam(name, angleAt(x, y)));
}

const mirror = (id, at, label, legend) => ({
  id,
  draw2d: (p, sc, s) => ghost(p, at(s.alpha), COLORS.purple, id + 'g', label),
  legend: s => legend(s.alpha),
});
// A legend row without a picture: long formulas are split over two rows so they fit the panel
const row = (id, legend) => ({ id, draw2d() {}, legend });

export default {
  view: '2d',
  view2d: CIRCLE,
  lab: false,

  setup(scene) {
    scene.ensureParam('alpha', 30, { min: 0, max: 359, step: 1 });
    scene.ensureParam('beta', 70, { min: 0, max: 359, step: 1 });

    scene.custom.push(
      { id: 'w', draw2d: (p, sc, s) => wheel(p, sc, s), legend: s => `\\alpha = ${s.alpha}°,\\quad \\blue{\\cos\\alpha = ${r2(cos(s.alpha))}},\\quad \\red{\\sin\\alpha = ${r2(sin(s.alpha))}}` },
      mirror('neg', a => -a, '-\\alpha', a => `\\purple{\\cos(-\\alpha) = ${r2(cos(-a))}},\\quad \\purple{\\sin(-\\alpha) = ${r2(sin(-a))}}`),
      mirror('supp', a => 180 - a, '180° - \\alpha', a => `\\purple{\\cos(180° - \\alpha) = ${r2(cos(180 - a))}},\\quad \\purple{\\sin(180° - \\alpha) = ${r2(sin(180 - a))}}`),
      mirror('quarter', a => a + 90, '\\alpha + 90°', a => `\\purple{\\cos(\\alpha + 90°) = ${r2(cos(a + 90))}},\\quad \\purple{\\sin(\\alpha + 90°) = ${r2(sin(a + 90))}}`),
      {
        // Two cabins and the chord between them; the dashed copy is the same pair turned until β is at 0
        id: 'chord',
        draw2d(p, sc, s) {
          const A = [cos(s.alpha), sin(s.alpha)], B = [cos(s.beta), sin(s.beta)], d = s.alpha - s.beta;
          rim(p);
          p.line(1, 0, cos(d), sin(d), WHITE + '66', { width: 2, dash: [5, 5] });
          p.dot(1, 0, COLORS.green + '88', 5);
          p.dot(cos(d), sin(d), COLORS.yellow + '88', 5);
          p.tex('cd', '\\alpha - \\beta', cos(d), sin(d), '#b9c1cd', { dx: cos(d) >= 0 ? 10 : -10, dy: sin(d) >= 0 ? -10 : 18, align: cos(d) >= 0 ? 'left' : 'right' });
          p.line(...A, ...B, WHITE, { width: 3 });
          cabin(p, sc, s, 'alpha', COLORS.yellow, '\\alpha');
          cabin(p, sc, s, 'beta', COLORS.green, '\\beta');
        },
        legend: s => `\\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta = ${r2(cos(s.alpha) * cos(s.beta) + sin(s.alpha) * sin(s.beta))}`,
      },
      row('chordv', s => `\\cos(\\alpha - \\beta) = \\cos ${s.alpha - s.beta}° = ${r2(cos(s.alpha - s.beta))}`),
      {
        // The sum: the same numbers for α + β and 2α
        id: 'sums',
        draw2d(p, sc, s) {
          rim(p);
          ghost(p, s.alpha + s.beta, COLORS.purple, 'sg', '\\alpha + \\beta');
          cabin(p, sc, s, 'alpha', COLORS.yellow, '\\alpha');
          cabin(p, sc, s, 'beta', COLORS.green, '\\beta');
        },
        legend: s => `\\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta = ${r2(sin(s.alpha) * cos(s.beta) + cos(s.alpha) * sin(s.beta))}`,
      },
      row('sumsv', s => `\\purple{\\sin(\\alpha + \\beta) = \\sin ${s.alpha + s.beta}° = ${r2(sin(s.alpha + s.beta))}}`),
      {
        // The task: a cabin β whose height equals the shift of α = 40°
        id: 'co',
        draw2d(p, sc, s) {
          rim(p);
          ghost(p, 40, COLORS.blue, 'co40', '40°');
          p.line(0, 0, cos(40), 0, COLORS.blue, { width: 4 });
          cabin(p, sc, s, 'beta', COLORS.green, '\\beta');
          p.line(cos(s.beta), 0, cos(s.beta), sin(s.beta), COLORS.red, { width: 4 });
        },
        legend: s => `\\blue{\\cos 40° = ${r2(cos(40))}},\\qquad \\red{\\sin ${s.beta}° = ${r2(sin(s.beta))}}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'A minus angle is a mirror', ru: 'Минус угол — это зеркало' },
      text: {
        en: 'A negative angle turns the wheel clockwise. The cabin at $-\\alpha$ is the mirror image of the cabin at $\\alpha$ in the horizontal line: just as far to the right, just as far <b>below</b>. So $$\\begin{gathered} \\sin(-\\alpha) = -\\sin\\alpha, \\\\ \\cos(-\\alpha) = \\cos\\alpha. \\end{gathered}$$ No need to memorise: look at the wheel.',
        ru: 'Отрицательный угол крутит колесо по часовой стрелке. Кабинка на угле $-\\alpha$ — зеркальное отражение кабинки на $\\alpha$ в горизонтальной прямой: так же правее, так же <b>ниже</b>. Поэтому $$\\begin{gathered} \\sin(-\\alpha) = -\\sin\\alpha, \\\\ \\cos(-\\alpha) = \\cos\\alpha. \\end{gathered}$$ Учить не нужно — смотрите на колесо.',
      },
      check: {
        q: { en: '$\\cos(-60°) = ?$', ru: '$\\cos(-60°) = ?$' },
        options: [{ text: '$0.5$', ok: true }, { text: '$-0.5$' }, { text: '$-0.87$' }],
        explain: {
          en: 'The mirror keeps the shift to the right: $\\cos(-60°) = \\cos 60° = 0.5$. Only the height changes sign.',
          ru: 'Зеркало сохраняет сдвиг вправо: $\\cos(-60°) = \\cos 60° = 0.5$. Знак меняет только высота.',
        },
        reveal: scene => scene.animateParams({ alpha: 60 }, 900),
      },
      state: { show: ['w', 'neg'], params: { alpha: 35 }, window: CIRCLE, controls: ['alpha'] },
    },
    {
      title: { en: '180° − α: the other mirror', ru: '180° − α: другое зеркало' },
      text: {
        en: 'The cabin at $180° - \\alpha$ is the mirror image in the vertical line: just as high, but on the left. $$\\begin{gathered} \\sin(180° - \\alpha) = \\sin\\alpha, \\\\ \\cos(180° - \\alpha) = -\\cos\\alpha. \\end{gathered}$$ That is why the sine alone cannot tell an angle from its neighbour across the top: $\\sin 30° = \\sin 150°$.',
        ru: 'Кабинка на $180° - \\alpha$ — отражение в вертикальной прямой: так же высоко, но слева. $$\\begin{gathered} \\sin(180° - \\alpha) = \\sin\\alpha, \\\\ \\cos(180° - \\alpha) = -\\cos\\alpha. \\end{gathered}$$ Поэтому по одному синусу не отличить угол от его соседа через верх колеса: $\\sin 30° = \\sin 150°$.',
      },
      check: {
        q: { en: '$\\cos 120° = ?$ (Hint: $120° = 180° - 60°$.)', ru: '$\\cos 120° = ?$ (Подсказка: $120° = 180° - 60°$.)' },
        options: [{ text: '$-0.5$', ok: true }, { text: '$0.5$' }, { text: '$0.87$' }],
        explain: {
          en: '$\\cos 120° = -\\cos 60° = -0.5$: the cabin is half a radius to the <b>left</b> of the axle.',
          ru: '$\\cos 120° = -\\cos 60° = -0.5$: кабинка на полрадиуса <b>левее</b> оси.',
        },
        reveal: scene => scene.animateParams({ alpha: 60 }, 900),
      },
      state: { show: ['w', 'supp'], params: { alpha: 30 }, window: CIRCLE, controls: ['alpha'] },
    },
    {
      title: { en: 'A quarter turn swaps the legs', ru: 'Четверть оборота меняет катеты местами' },
      text: {
        en: 'Turn the whole triangle by $90°$. The red leg (the height) lies down and points <b>left</b>; the blue one (the shift) stands up. So the new height is the old shift, and the new shift is minus the old height: $$\\begin{gathered} \\sin(\\alpha + 90°) = \\cos\\alpha, \\\\ \\cos(\\alpha + 90°) = -\\sin\\alpha. \\end{gathered}$$',
        ru: 'Повернём весь треугольник на $90°$. Красный катет (высота) ложится и смотрит <b>влево</b>, синий (сдвиг) встаёт. Значит, новая высота — это старый сдвиг, а новый сдвиг — минус старая высота: $$\\begin{gathered} \\sin(\\alpha + 90°) = \\cos\\alpha, \\\\ \\cos(\\alpha + 90°) = -\\sin\\alpha. \\end{gathered}$$',
      },
      check: {
        q: { en: '$\\sin(90° - \\alpha) = ?$ (Use the first mirror and the quarter turn.)', ru: '$\\sin(90° - \\alpha) = ?$ (Зеркало из первого шага и четверть оборота.)' },
        options: [{ text: '$\\cos\\alpha$', ok: true }, { text: '$-\\cos\\alpha$' }, { text: '$\\sin\\alpha$' }],
        explain: {
          en: '$\\sin(-\\alpha + 90°) = \\cos(-\\alpha) = \\cos\\alpha$. In a right triangle it is plain to see: the leg opposite one acute angle is adjacent to the other, and the two angles add up to $90°$.',
          ru: '$\\sin(-\\alpha + 90°) = \\cos(-\\alpha) = \\cos\\alpha$. В прямоугольном треугольнике это видно сразу: катет, противолежащий одному острому углу, прилежит к другому, а вместе углы дают $90°$.',
        },
      },
      state: { show: ['w', 'quarter'], params: { alpha: 25 }, window: CIRCLE, controls: ['alpha'] },
    },
    {
      title: { en: 'The rule instead of a table', ru: 'Правило вместо таблицы' },
      text: {
        en: 'Textbooks have a table of dozens of reduction formulas. Two questions replace it. <b>Does the function change?</b> With $90°$ or $270°$ — yes, sine to cosine and back (the legs swap); with $180°$ or $360°$ — no (a mirror keeps the legs). <b>Which sign?</b> Imagine a small $\\alpha$, say $10°$, find where the cabin lands and look whether the <i>original</i> function is positive there.',
        ru: 'В учебниках — таблица из десятков формул приведения. Её заменяют два вопроса. <b>Меняется ли функция?</b> С $90°$ или $270°$ — да, синус на косинус и обратно (катеты меняются местами); со $180°$ или $360°$ — нет (зеркало катеты не меняет). <b>Какой знак?</b> Представьте маленький $\\alpha$, например $10°$, найдите, куда попала кабинка, и посмотрите, положительна ли там <i>исходная</i> функция.',
      },
      check: {
        q: { en: '$\\cos(270° - \\alpha) = ?$', ru: '$\\cos(270° - \\alpha) = ?$' },
        options: [{ text: '$-\\sin\\alpha$', ok: true }, { text: '$\\sin\\alpha$' }, { text: '$-\\cos\\alpha$' }],
        explain: {
          en: '$270°$ changes the function: cosine → sine. At $\\alpha = 10°$ the cabin is at $260°$, lower left, where the cosine is negative. So $-\\sin\\alpha$.',
          ru: '$270°$ меняет функцию: косинус → синус. При $\\alpha = 10°$ кабинка на $260°$, слева внизу, где косинус отрицателен. Значит, $-\\sin\\alpha$.',
        },
      },
      state: { show: ['w', 'quarter'], params: { alpha: 10 }, window: CIRCLE, controls: ['alpha'] },
    },
    {
      proof: true,
      statement: {
        en: '<b>Subtraction formula.</b> $\\cos(\\alpha - \\beta) = \\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta$.',
        ru: '<b>Формула разности.</b> $\\cos(\\alpha - \\beta) = \\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta$.',
      },
      title: { en: 'One chord, measured twice', ru: 'Одна хорда, измеренная дважды' },
      text: {
        en: 'Two cabins, at $\\alpha$ and $\\beta$, and the white chord between them. By Pythagoras on coordinates: $$\\begin{gathered} |AB|^2 = (\\cos\\alpha - \\cos\\beta)^2 + (\\sin\\alpha - \\sin\\beta)^2 \\\\ = 2 - 2(\\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta), \\end{gathered}$$ because $\\cos^2 + \\sin^2 = 1$ twice. Now turn the wheel back by $\\beta$ (dashed): the chord does not change, its ends are now at $0$ and $\\alpha - \\beta$, and the same computation gives $2 - 2\\cos(\\alpha - \\beta)$. The two answers are equal. $\\blacksquare$',
        ru: 'Две кабинки, на $\\alpha$ и на $\\beta$, и белая хорда между ними. По Пифагору в координатах: $$\\begin{gathered} |AB|^2 = (\\cos\\alpha - \\cos\\beta)^2 + (\\sin\\alpha - \\sin\\beta)^2 \\\\ = 2 - 2(\\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta), \\end{gathered}$$ потому что дважды $\\cos^2 + \\sin^2 = 1$. Теперь повернём колесо назад на $\\beta$ (пунктир): хорда не изменилась, её концы теперь на $0$ и на $\\alpha - \\beta$, и тот же подсчёт даёт $2 - 2\\cos(\\alpha - \\beta)$. Ответы равны. $\\blacksquare$',
      },
      try: { en: 'Drag both cabins: the two numbers below always agree.', ru: 'Тяните обе кабинки: два числа внизу всегда совпадают.' },
      state: { show: ['chord', 'chordv'], params: { alpha: 110, beta: 35 }, window: CIRCLE, controls: ['alpha', 'beta'] },
    },
    {
      title: { en: 'Everything else follows', ru: 'Остальное — следствия' },
      text: {
        en: 'Put $-\\beta$ instead of $\\beta$: $\\cos(\\alpha + \\beta) = \\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta$. Use $\\sin x = \\cos(90° - x)$: $$\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta.$$ And with $\\beta = \\alpha$ — the double angle: $\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha$, $\\cos 2\\alpha = \\cos^2\\alpha - \\sin^2\\alpha$.',
        ru: 'Подставим $-\\beta$ вместо $\\beta$: $\\cos(\\alpha + \\beta) = \\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta$. Используем $\\sin x = \\cos(90° - x)$: $$\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta.$$ А при $\\beta = \\alpha$ — двойной угол: $\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha$, $\\cos 2\\alpha = \\cos^2\\alpha - \\sin^2\\alpha$.',
      },
      check: {
        q: { en: '$\\sin 30° = 0.5$, $\\cos 30° \\approx 0.87$. $\\sin 60° = ?$', ru: '$\\sin 30° = 0.5$, $\\cos 30° \\approx 0.87$. $\\sin 60° = ?$' },
        options: [{ text: '$2 \\cdot 0.5 \\cdot 0.87 \\approx 0.87$', ok: true }, { text: '$2 \\cdot 0.5 = 1$' }, { text: '$0.5^2 = 0.25$' }],
        explain: {
          en: '$\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha$. Doubling the angle does not double the sine — the cabin cannot rise higher than $1$.',
          ru: '$\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha$. Угол удвоился — а синус нет: кабинка не поднимется выше $1$.',
        },
        reveal: scene => scene.animateParams({ alpha: 30, beta: 30 }, 900),
      },
      state: { show: ['sums', 'sumsv'], params: { alpha: 30, beta: 50 }, window: CIRCLE, controls: ['alpha', 'beta'] },
    },
    {
      title: { en: 'Sine of one is cosine of the other', ru: 'Синус одного — косинус другого' },
      text: {
        en: 'Drag the green cabin to the upper right quarter so that its height equals the blue shift of $40°$: $\\sin\\beta = \\cos 40°$.',
        ru: 'Поставьте зелёную кабинку в правую верхнюю четверть так, чтобы её высота сравнялась с синим сдвигом угла $40°$: $\\sin\\beta = \\cos 40°$.',
      },
      task: {
        kind: 'drag',
        target: { beta: 50 },
        tol: 0.5,
        back: 2,
        right: {
          en: '$\\sin 50° = \\cos 40°$, because $50° = 90° - 40°$: the two acute angles of one right triangle. That is where the «co» in cosine comes from — the sine of the <b>co</b>mplementary angle.',
          ru: '$\\sin 50° = \\cos 40°$, потому что $50° = 90° - 40°$: два острых угла одного прямоугольного треугольника. Отсюда и «ко» в слове «косинус» — синус <b>до</b>полнительного угла.',
        },
        mistakes: [
          { params: { beta: 40 }, text: { en: 'Here the height is $\\sin 40°$, not $\\cos 40°$: it equals the shift only at $45°$.', ru: 'Здесь высота — $\\sin 40°$, а не $\\cos 40°$: высота и сдвиг равны только при $45°$.' } },
          { params: { beta: 130 }, text: { en: 'The height is right, but this is the upper <b>left</b> quarter.', ru: 'Высота верная, но это левая верхняя четверть.' } },
        ],
        hints: { beta: { en: 'The red leg should be as long as the blue one.', ru: 'Красный катет должен быть такой же длины, как синий.' } },
      },
      state: { show: ['co'], params: { beta: 10 }, window: CIRCLE, controls: [] },
    },
  ],
};
