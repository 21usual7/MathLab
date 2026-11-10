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
    scene.ensureParam('a', -2.2, { min: -3, max: 3 });
    scene.ensureParam('h', 1.5, { min: 0.001, max: 2, step: 0.001 });
    const F = (s, x) => { s.x = x; return f.fn(s); };
    const D = (s, x) => { s.x = x; return df.fn(s); };

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
          if (s.h * p.view.unit > 40) {
            p.tex('dx', '\\Delta x = h', (a + b) / 2, fa, COLORS.grey, { dy: fb > fa ? 16 : -16, dx: 0, align: 'center' });
            p.tex('dy', '\\Delta y', b, (fa + fb) / 2, COLORS.grey, { dx: 8, dy: 0 });
          }
        },
        legend: s => `\\red{\\frac{\\Delta y}{\\Delta x}} = \\frac{f(a + h) - f(a)}{h} = ${fmt((F(s, s.a + s.h) - F(s, s.a)) / s.h)}`,
      },
      {
        id: 'tangent',
        draw2d(p, sc, s) {
          const fa = F(s, s.a);
          p.line(s.a, fa, s.a + 1, fa + D(s, s.a), COLORS.green, { width: 2.5, extend: true });
        },
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
  ],
};
