// The derivative: from the slope of a secant to the slope at one point, then the slope as a new function.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';

const WHITE = '#ffffff';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const X_EXT = 2 / Math.sqrt(3); // f'(x) = 0 for f = x³/4 − x

export default {
  view: '2d',
  view2d: { cx: 0, cy: 0, unit: 72 },
  controls: ['a', 'h'],

  setup(scene) {
    const f = scene.add('y = x^3/4 - x', { id: 'f', color: 'blue' });
    const df = scene.add('y = 3x^2/4 - 1', { id: 'df', color: 'yellow', visible: false });
    const g = scene.add('y = x^2', { id: 'g', color: 'blue', visible: false }); // for the last task
    scene.ensureParam('a', -2.2, { min: -3, max: 3 });
    scene.ensureParam('h', 1.5, { min: 0.001, max: 2, step: 0.001 });
    const F = (s, x) => { s.x = x; return f.fn(s); };
    const D = (s, x) => { s.x = x; return df.fn(s); };
    const G = (s, x) => { s.x = x; return g.fn(s); };
    const tangent = (p, s) => {
      const fa = F(s, s.a);
      p.line(s.a, fa, s.a + 1, fa + D(s, s.a), COLORS.green, { width: 2.5, extend: true });
    };

    scene.custom.push(
      {
        id: 'secant',
        draw2d(p, sc, s) {
          const a = s.a, b = s.a + s.h, fa = F(s, a), fb = F(s, b);
          p.line(a, fa, b, fb, COLORS.red, { width: 2.5, extend: true });
          // Run and rise
          p.line(a, fa, b, fa, COLORS.grey, { width: 1.5, dash: [5, 5] });
          p.line(b, fa, b, fb, COLORS.grey, { width: 1.5, dash: [5, 5] });
          p.dot(b, fb, COLORS.red, 5);
          if (s.h * p.u > 40) {
            p.tex('dx', '\\Delta x = h', (a + b) / 2, fa, COLORS.grey, { dy: fb > fa ? 16 : -16, dx: 0, align: 'center' });
            p.tex('dy', '\\Delta y', b, (fa + fb) / 2, COLORS.grey, { dx: 8, dy: 0 });
          }
        },
        legend: s => `\\red{\\frac{\\Delta y}{\\Delta x}} = \\frac{f(a + h) - f(a)}{h} = ${fmt((F(s, s.a + s.h) - F(s, s.a)) / s.h)}`,
      },
      {
        id: 'tangent',
        draw2d(p, sc, s) { tangent(p, s); },
        legend: s => `\\green{f'(a)} = ${fmt(D(s, s.a))}`,
      },
      {
        // The slope at a recorded as a height: the derivative is drawn as the point travels
        id: 'trace',
        draw2d(p, sc, s) {
          p.curve(x => D(s, x), COLORS.yellow, 3, -Infinity, s.a);
          p.line(s.a, F(s, s.a), s.a, D(s, s.a), COLORS.grey, { width: 1.2, dash: [3, 5] });
          p.dot(s.a, D(s, s.a), COLORS.yellow, 6);
        },
        legend: s => `\\yellow{\\left(a,\\ f'(a)\\right)} = \\left(${fmt(s.a)},\\ ${fmt(D(s, s.a))}\\right)`,
      },
      {
        // Hill top and valley bottom: f' = 0 exactly under them
        id: 'guides',
        draw2d(p, sc, s) {
          for (const x of [-X_EXT, X_EXT]) {
            p.line(x, F(s, x), x, 0, COLORS.grey, { width: 1.2, dash: [4, 5] });
            p.dot(x, F(s, x), COLORS.purple, 6);
            p.dot(x, 0, COLORS.yellow, 5);
          }
        },
      },
      {
        id: 'names',
        draw2d(p, sc, s) {
          if (f.visible) p.tex('fname', '\\blue{f}', 2.75, F(s, 2.75), COLORS.blue, { dx: -14, dy: -4, align: 'right' });
          if (df.visible || sc.get('trace').visible) p.tex('dfname', "\\yellow{f'}", 2.3, D(s, 2.3), COLORS.yellow, { dx: 12, dy: 0 });
        },
      },
      // The same tangent without its number: in a task the slope has to be read off the grid
      { id: 'tangentT', draw2d(p, sc, s) { tangent(p, s); } },
      {
        // Only f' is on the scene: the point is dragged along the x axis, f'(a) is marked above or below it
        id: 'axisPoint',
        draw2d(p, sc, s) {
          p.line(s.a, 0, s.a, D(s, s.a), COLORS.grey, { width: 1.2, dash: [3, 5] });
          p.dot(s.a, D(s, s.a), COLORS.yellow, 6);
          p.tex('a', 'a', s.a, 0, WHITE, { dx: 0, dy: D(s, s.a) > 0 ? 14 : -14, align: 'center' });
          p.handle(s.a, 0, WHITE, x => { sc.play('a', false); sc.setParam('a', clamp(x, -3, 3)); });
        },
      },
      {
        // The parabola of the last task with its tangent and the slope as a number
        id: 'gPoint',
        draw2d(p, sc, s) {
          const ga = G(s, s.a);
          p.line(s.a, ga, s.a + 1, ga + 2 * s.a, COLORS.green, { width: 2.5, extend: true });
          p.tex('gname', '\\blue{g}', 1.9, G(s, 1.9), COLORS.blue, { dx: 12, dy: 0 });
          p.handle(s.a, ga, WHITE, x => { sc.play('a', false); sc.setParam('a', clamp(x, -3, 3)); });
        },
        legend: s => `\\green{g'(a)} = ${fmt(2 * s.a)}`,
      },
      {
        // The point the student drags; drawn last, on top
        id: 'point',
        draw2d(p, sc, s) {
          const fa = F(s, s.a);
          p.line(s.a, 0, s.a, fa, 'rgba(255,255,255,0.25)', { width: 1, dash: [2, 4] });
          p.tex('a', 'a', s.a, 0, WHITE, { dx: 0, dy: fa > 0 ? 14 : -14, align: 'center' });
          p.handle(s.a, fa, WHITE, x => { sc.play('a', false); sc.setParam('a', clamp(x, -3, 3)); });
        },
      },
    );
  },

  steps: [
    {
      title: { en: 'How steep is it — right here?', ru: 'Насколько круто — прямо здесь?' },
      text: {
        en: 'This is the graph of $\\blue{f(x) = \\frac{x^3}{4} - x}$. Read it as a road: walking from left to right you climb, go down, then climb again, and the steepness keeps changing. How steep the road is <b>between</b> two places is easy to measure. But how steep is it <b>at one point</b>? That question is the whole idea of the derivative.',
        ru: 'Это график $\\blue{f(x) = \\frac{x^3}{4} - x}$. Представьте, что это дорога: идя слева направо, вы поднимаетесь, спускаетесь и снова поднимаетесь, а крутизна всё время меняется. Крутизну <b>между</b> двумя местами измерить легко. Но какова крутизна <b>в одной точке</b>? Этот вопрос — и есть вся идея производной.',
      },
      try: { en: 'Drag the white point along the curve.', ru: 'Перетащите белую точку вдоль кривой.' },
      state: { show: ['f', 'names', 'point'], params: { a: -2.2, h: 1.5 }, window: { cx: 0, cy: 0, unit: 72 }, controls: ['a'] },
    },
    {
      title: { en: 'Steepness between two points', ru: 'Крутизна между двумя точками' },
      text: {
        en: 'Take a second point a step $h$ to the right. The road rises by $\\Delta y$ while going $\\Delta x = h$ forward, so its average steepness is $\\red{\\frac{\\Delta y}{\\Delta x}}$ — the slope of the <span class="c-red">red line</span> through the two points, the <i>secant</i>.',
        ru: 'Возьмём вторую точку на шаг $h$ правее. Дорога поднимается на $\\Delta y$, пока мы проходим $\\Delta x = h$ вперёд, значит её средняя крутизна — $\\red{\\frac{\\Delta y}{\\Delta x}}$. Это наклон <span class="c-red">красной прямой</span> через две точки — <i>секущей</i>.',
      },
      try: { en: 'Change $h$ and watch the secant swing.', ru: 'Меняйте $h$ — секущая поворачивается.' },
      hint: {
        title: { en: 'What exactly is a slope?', ru: 'Что такое наклон?' },
        text: {
          en: 'The slope of a line is how much it rises for one step to the right. A slope of $2$: one step right, two up. A slope of $-\\frac12$: one step right, half a step down. Between two points it is «rise over run»: $\\frac{\\Delta y}{\\Delta x}$.',
          ru: 'Наклон прямой — на сколько она поднимается при шаге на единицу вправо. Наклон $2$: шаг вправо — два вверх. Наклон $-\\frac12$: шаг вправо — полшага вниз. Между двумя точками это «подъём делить на шаг»: $\\frac{\\Delta y}{\\Delta x}$.',
        },
      },
      state: { show: ['f', 'secant', 'names', 'point'], params: { a: -2, h: 1.5 }, window: { cx: 0, cy: 0, unit: 72 }, controls: ['a', 'h'] },
    },
    {
      title: { en: 'Let the gap shrink', ru: 'Сожмём шаг' },
      text: {
        en: 'Now let $h$ get smaller and smaller. The second point slides toward the first, and the secant stops swinging: it settles into one line, the <span class="c-green">tangent</span>. Its slope is the number the secant slopes approach: $$\\green{f\'(a)} = \\lim_{h \\to 0} \\frac{f(a+h) - f(a)}{h}.$$ That number is the derivative at $a$ — the steepness at a single point.',
        ru: 'Теперь будем уменьшать $h$. Вторая точка подъезжает к первой, и секущая перестаёт поворачиваться: она замирает в одном положении — это <span class="c-green">касательная</span>. Её наклон — число, к которому стремятся наклоны секущих: $$\\green{f\'(a)} = \\lim_{h \\to 0} \\frac{f(a+h) - f(a)}{h}.$$ Это число и есть производная в точке $a$ — крутизна в одной точке.',
      },
      state: { show: ['f', 'secant', 'tangent', 'names', 'point'], params: { h: 0.001 }, ms: 3500, window: { cx: 0, cy: 0, unit: 72 }, controls: ['a', 'h'] },
    },
    {
      title: { en: 'Zoom in', ru: 'Приблизим' },
      text: {
        en: 'Why does a single point have a steepness at all? Zoom in. The closer you look at a smooth curve, the straighter it gets: at this scale the blue curve and the green tangent are almost the same line. <b>Up close, every smooth function is almost linear</b> — and the derivative is the slope of that line.',
        ru: 'Почему у одной точки вообще есть крутизна? Приблизьте. Чем ближе смотришь на гладкую кривую, тем прямее она становится: в этом масштабе синяя кривая и зелёная касательная почти совпадают. <b>Вблизи любая гладкая функция почти линейна</b> — а производная и есть наклон этой прямой.',
      },
      try: { en: 'Scroll or pinch to zoom further; double-click to return.', ru: 'Колесо или два пальца — приблизить ещё; двойной клик — вернуть вид.' },
      state: {
        show: ['f', 'tangent', 'point'],
        window: sc => { const s = sc.scope(); s.x = s.a; return { cx: s.a, cy: sc.get('f').fn(s), unit: 3200 }; },
        windowMs: 2600,
        controls: [],
      },
    },
    {
      title: { en: 'The slope at every point', ru: 'Наклон в каждой точке' },
      text: {
        en: 'Let the point travel along the road. At each position, record the slope as a height: mark the point $\\yellow{(a,\\ f\'(a))}$. The <span class="c-yellow">yellow curve</span> grows point by point — the slopes themselves form a new function of $x$.',
        ru: 'Пусть точка едет по дороге. В каждом положении запишем наклон как высоту — отметим точку $\\yellow{(a,\\ f\'(a))}$. <span class="c-yellow">Жёлтая кривая</span> растёт точка за точкой: наклоны сами образуют новую функцию от $x$.',
      },
      try: { en: 'Press ▶ next to $a$ to replay, or drag the point.', ru: 'Нажмите ▶ возле $a$, чтобы повторить, или тяните точку.' },
      state: { show: ['f', 'tangent', 'trace', 'names', 'point'], window: { cx: 0, cy: 0, unit: 72 }, controls: ['a'] },
      enter(scene) {
        scene.setParam('a', -2.8);
        scene.animateParams({ a: 2.8 }, 6000);
      },
    },
    {
      title: { en: 'Reading one graph from the other', ru: 'Как читать один график по другому' },
      text: {
        en: 'That new function is the derivative: $\\yellow{f\'(x) = \\frac{3x^2}{4} - 1}$. Where $\\blue{f}$ climbs, $\\yellow{f\'} > 0$; where it falls, $\\yellow{f\'} < 0$. At the top of the hill and the bottom of the valley the tangent is flat, so $\\yellow{f\'} = 0$ — the yellow curve crosses the axis exactly under them. This is how derivatives find maxima and minima.',
        ru: 'Эта новая функция и есть производная: $\\yellow{f\'(x) = \\frac{3x^2}{4} - 1}$. Где $\\blue{f}$ растёт, там $\\yellow{f\'} > 0$; где убывает — $\\yellow{f\'} < 0$. На вершине холма и на дне впадины касательная горизонтальна, значит $\\yellow{f\'} = 0$ — жёлтая кривая пересекает ось точно под ними. Так производная находит максимумы и минимумы.',
      },
      check: {
        q: { en: 'Between the hill and the valley $\\blue{f}$ goes down. What is the sign of $\\yellow{f\'}$ there?', ru: 'Между холмом и впадиной $\\blue{f}$ спускается. Какой знак у $\\yellow{f\'}$ там?' },
        options: [{ text: '$f\' > 0$' }, { text: '$f\' < 0$', ok: true }, { text: '$f\' = 0$' }],
        explain: {
          en: 'Going down means every tangent there points down: negative slope. The yellow curve is under the axis exactly between the two guides.',
          ru: 'Спуск — значит каждая касательная там смотрит вниз: наклон отрицательный. Жёлтая кривая лежит под осью ровно между двумя пунктирами.',
        },
        reveal: scene => scene.animateParams({ a: 0 }, 1200),
      },
      state: { show: ['f', 'df', 'guides', 'tangent', 'names', 'point'], params: { a: X_EXT }, ms: 1500, window: { cx: 0, cy: 0, unit: 72 }, controls: ['a'] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'Everything is live: drag the point, change $h$, press ▶. Then open the scene in the Lab, put your own function in place of $f$ — $\\sin x$, $e^x$, $\\frac{1}{x}$ — and look at where it climbs and where it falls.',
        ru: 'Всё живое: тяните точку, меняйте $h$, нажимайте ▶. Потом откройте сцену в Lab, замените $f$ своей функцией — $\\sin x$, $e^x$, $\\frac{1}{x}$ — и посмотрите, где она растёт и где убывает.',
      },
      state: { show: ['f', 'df', 'secant', 'tangent', 'names', 'point'], params: { h: 0.8 }, window: { cx: 0, cy: 0, unit: 72 }, controls: ['a', 'h'] },
    },
    {
      title: { en: 'Find a slope of 2', ru: 'Найдите наклон 2' },
      text: {
        en: 'The tangent is back, but without its number. Put the point where the slope of the tangent is exactly $2$: one step to the right — two steps up. Use the grid. Then press Check.',
        ru: 'Касательная снова здесь, но без числа. Поставьте точку туда, где наклон касательной ровно $2$: шаг вправо — два вверх. Сверяйтесь с сеткой. Потом нажмите Check.',
      },
      task: {
        kind: 'drag',
        target: [{ a: 2 }, { a: -2 }],
        back: 1,
        right: {
          en: 'At $a = 2$ the tangent rises by two for each step right: $f\'(2) = \\frac{3 \\cdot 4}{4} - 1 = 2$. The same slope is at $a = -2$ — the curve is symmetric.',
          ru: 'При $a = 2$ касательная поднимается на два за каждый шаг вправо: $f\'(2) = \\frac{3 \\cdot 4}{4} - 1 = 2$. Такой же наклон и при $a = -2$ — кривая симметрична.',
        },
        mistakes: [
          { params: { a: Math.SQRT2 }, text: {
            en: 'Here the tangent goes two steps right for one step up — the slope is $\\frac12$, not $2$. A slope is the rise for <b>one</b> step to the right.',
            ru: 'Здесь касательная проходит два шага вправо на один вверх — наклон $\\frac12$, а не $2$. Наклон — это подъём на <b>один</b> шаг вправо.' } },
          { params: { a: -Math.SQRT2 }, text: {
            en: 'Here the tangent goes two steps right for one step up — the slope is $\\frac12$, not $2$. A slope is the rise for <b>one</b> step to the right.',
            ru: 'Здесь касательная проходит два шага вправо на один вверх — наклон $\\frac12$, а не $2$. Наклон — это подъём на <b>один</b> шаг вправо.' } },
        ],
        hints: {
          a: a => {
            const k = 3 * a * a / 4 - 1;
            if (k < 0) return { en: 'Here the road goes down: the slope is negative, and we need $+2$.', ru: 'Здесь дорога спускается: наклон отрицательный, а нужен $+2$.' };
            return k < 2
              ? { en: 'Here the tangent is flatter than needed: one step right gives less than two up. Look where the curve is steeper.', ru: 'Здесь касательная положе, чем нужно: на шаг вправо — меньше двух вверх. Ищите, где кривая круче.' }
              : { en: 'Here the tangent is steeper than needed: one step right gives more than two up.', ru: 'Здесь касательная круче, чем нужно: на шаг вправо — больше двух вверх.' };
          },
        },
      },
      state: { show: ['f', 'tangentT', 'names', 'point'], params: { a: 0.5 }, window: { cx: 0, cy: 0, unit: 72 }, controls: [] },
    },
    {
      title: { en: 'Only the derivative is left', ru: 'Осталась только производная' },
      text: {
        en: 'Now $\\blue{f}$ is hidden — only its derivative $\\yellow{f\'}$ is on the scene. Where does $\\blue{f}$ have the bottom of its valley? Move the point $a$ along the axis there.',
        ru: 'Теперь $\\blue{f}$ спрятана — на сцене только её производная $\\yellow{f\'}$. Где у $\\blue{f}$ дно впадины? Передвиньте точку $a$ по оси туда.',
      },
      task: {
        kind: 'drag',
        target: { a: X_EXT },
        back: 5,
        right: {
          en: 'At $a \\approx 1.15$ the yellow curve crosses the axis going up: before it $f\' < 0$ and $f$ goes down, after it $f\' > 0$ and $f$ climbs. Down, then up — the bottom of the valley.',
          ru: 'При $a \\approx 1{,}15$ жёлтая кривая пересекает ось снизу вверх: до неё $f\' < 0$ и $f$ спускается, после — $f\' > 0$ и $f$ поднимается. Спуск, потом подъём — дно впадины.',
        },
        mistakes: [
          { params: { a: -X_EXT }, text: {
            en: 'Here $f\' = 0$ too, but it is the top of the hill: to the left $f\' > 0$ (climbing), to the right $f\' < 0$ (going down). A valley is the other way round.',
            ru: 'Здесь тоже $f\' = 0$, но это вершина холма: слева $f\' > 0$ (подъём), справа $f\' < 0$ (спуск). У впадины наоборот.' } },
          { params: { a: 0 }, text: {
            en: 'This is the lowest point of the <b>yellow</b> curve: here $f$ goes down most steeply — but it still goes down. The bottom of $f$ is where $f\'$ becomes zero.',
            ru: 'Это самая низкая точка <b>жёлтой</b> кривой: здесь $f$ спускается круче всего — но всё ещё спускается. Дно $f$ там, где $f\'$ становится нулём.' } },
        ],
        hints: {
          a: a => (3 * a * a / 4 - 1 < 0
            ? { en: 'Here $f\' < 0$, so $f$ is still going down. The bottom is further right, where the going down ends.', ru: 'Здесь $f\' < 0$, значит $f$ ещё спускается. Дно дальше справа — там, где спуск заканчивается.' }
            : { en: 'Here $f\' > 0$: $f$ is climbing. Find the place where the going down turns into climbing.', ru: 'Здесь $f\' > 0$: $f$ поднимается. Найдите место, где спуск сменяется подъёмом.' }),
        },
      },
      state: { show: ['df', 'names', 'axisPoint'], params: { a: -2.5 }, window: { cx: 0, cy: 0, unit: 72 }, controls: [] },
    },
    {
      title: { en: 'Write the derivative', ru: 'Запишите производную' },
      text: {
        en: 'A new function: $\\blue{g(x) = x^2}$. Drag the point and watch the slope $\\green{g\'(a)}$ among the formulas: what is it at $a = 1$, at $a = 2$, at $a = -1$? Write the formula of $g\'(x)$.',
        ru: 'Новая функция: $\\blue{g(x) = x^2}$. Тяните точку и смотрите на наклон $\\green{g\'(a)}$ в формулах: чему он равен при $a = 1$, при $a = 2$, при $a = -1$? Запишите формулу $g\'(x)$.',
      },
      task: {
        kind: 'formula',
        answer: 'y = 2x',
        range: [-3, 3],
        back: 4,
        right: {
          en: 'The slope is always twice $a$: $g\'(x) = 2x$. It is negative on the left, where the parabola goes down, and zero at the bottom.',
          ru: 'Наклон всегда вдвое больше $a$: $g\'(x) = 2x$. Слева, где парабола спускается, он отрицательный, а на дне — ноль.',
        },
        mistakes: [
          { formula: 'y = x^2', text: {
            en: 'This is $g$ itself. The derivative is a different function: its value at $x$ is the <b>slope</b> at $x$, not the height.',
            ru: 'Это сама $g$. Производная — другая функция: её значение в $x$ — это <b>наклон</b> в точке $x$, а не высота.' } },
          { formula: 'y = x', text: {
            en: 'Check at $a = 1$: the slope $g\'(1)$ is $2$, and your formula gives $1$.',
            ru: 'Проверьте при $a = 1$: наклон $g\'(1)$ равен $2$, а ваша формула даёт $1$.' } },
          { formula: 'y = 2', text: {
            en: 'The slope is not the same everywhere: at $a = -1$ it is $-2$, at $a = 2$ it is $4$. It depends on $x$.',
            ru: 'Наклон не везде одинаковый: при $a = -1$ он равен $-2$, при $a = 2$ — $4$. Он зависит от $x$.' } },
        ],
      },
      state: { show: ['g', 'gPoint'], params: { a: 1 }, window: { cx: 0, cy: 2, unit: 60 }, controls: [] },
    },
  ],
};
