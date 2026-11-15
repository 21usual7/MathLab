// Sine and cosine on a Ferris wheel of radius 1: the cabin at angle α is cos α to the right of the axle and
// sin α above it. The school triangle sits inside the wheel, sin² + cos² = 1 is Pythagoras, the radian is
// a thread wound on the rim, and the height of the cabin over time unrolls into the sine wave.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';

const WHITE = '#ffffff';
export const DEG = Math.PI / 180;
const CIRCLE = { cx: 0, cy: -0.1, unit: 220, fit: [3.4, 3.4] };
const WIDE = { cx: 1.6, cy: -0.1, unit: 110, fit: [9.8, 3.4] };
const OX = -2; // the axle of the wheel in the wide view, so the wave has room on the right
export const r2 = v => fmt(Math.round(v * 100) / 100 + 0); // + 0 turns −0 into 0

// The angle of a point seen from the axle at (ox, 0), in whole degrees from 0 to 359
export function angleAt(x, y, ox = 0) {
  return ((Math.round(Math.atan2(y, x - ox) / DEG) % 360) + 360) % 360;
}

// The wheel: rim, spokes turning with α, the stand, the cabin, and the triangle cos α, sin α inside
export function wheel(p, sc, s, ox = 0, { triangle = true, name = 'alpha' } = {}) {
  const a = s[name] * DEG, c = Math.cos(a), n = Math.sin(a), P = [ox + c, n];
  p.line(ox, 0, ox - 0.55, -1.3, 'rgba(255,255,255,0.35)', { width: 3 });
  p.line(ox, 0, ox + 0.55, -1.3, 'rgba(255,255,255,0.35)', { width: 3 });
  p.line(ox - 1.3, -1.3, ox + 1.3, -1.3, 'rgba(255,255,255,0.35)', { width: 1.5 });
  p.param(t => ox + Math.cos(t), Math.sin, 0, 2 * Math.PI, 'rgba(255,255,255,0.55)', 2);
  for (let k = 0; k < 8; k++) {
    const b = a + k * Math.PI / 4;
    p.line(ox, 0, ox + Math.cos(b), Math.sin(b), 'rgba(255,255,255,0.18)', { width: 1 });
  }
  p.param(t => ox + 0.25 * Math.cos(t), t => 0.25 * Math.sin(t), 0, a, COLORS.yellow, 2.5);
  p.tex('ua', '\\alpha', ox + 0.32 * Math.cos(a / 2), 0.32 * Math.sin(a / 2), COLORS.yellow, { dx: 4, dy: -4 });
  if (triangle) {
    p.line(ox, 0, ox + c, 0, COLORS.blue, { width: 4 });
    p.line(ox + c, 0, ...P, COLORS.red, { width: 4 });
    p.tex('uc', '\\cos\\alpha', ox + c / 2, 0, COLORS.blue, { dx: 0, dy: n >= 0 ? 16 : -10, align: 'center' });
    p.tex('us', '\\sin\\alpha', ox + c, n / 2, COLORS.red, { dx: c >= 0 ? -8 : 8, dy: 0, align: c >= 0 ? 'right' : 'left' });
  }
  p.line(ox, 0, ...P, WHITE, { width: 2 });
  p.fill([[P[0] - 0.13, n - 0.05], [P[0] + 0.13, n - 0.05], [P[0] + 0.11, n - 0.27], [P[0] - 0.11, n - 0.27]], COLORS.yellow + 'aa');
  p.handle(...P, COLORS.yellow, (x, y) => sc.setParam(name, angleAt(x, y, ox)));
}

// A second cabin at angle deg (no handle): its radius, dashed legs and a dot
export function ghost(p, deg, color, key, label, ox = 0) {
  const a = deg * DEG, P = [ox + Math.cos(a), Math.sin(a)];
  p.line(ox, 0, ...P, color, { width: 2 });
  p.line(ox + Math.cos(a), 0, ...P, color + 'aa', { width: 1.5, dash: [4, 4] });
  p.line(ox, 0, ox + Math.cos(a), 0, color + 'aa', { width: 1.5, dash: [4, 4] });
  p.dot(...P, color, 6);
  if (label) p.tex(key, label, ...P, color, { dx: Math.cos(a) >= 0 ? 10 : -10, dy: Math.sin(a) >= 0 ? -10 : 18, align: Math.cos(a) >= 0 ? 'left' : 'right' });
}

const values = s => `\\alpha = ${s.alpha}°,\\quad \\blue{\\cos\\alpha = ${r2(Math.cos(s.alpha * DEG))}},\\quad \\red{\\sin\\alpha = ${r2(Math.sin(s.alpha * DEG))}}`;

export default {
  view: '2d',
  view2d: CIRCLE,
  lab: false,

  setup(scene) {
    scene.ensureParam('alpha', 30, { min: 0, max: 359, step: 1 });

    scene.custom.push(
      { id: 'wheel', draw2d: (p, sc, s) => wheel(p, sc, s), legend: values },
      {
        // sin² + cos² = 1: the squares on the legs of the triangle inside the wheel
        id: 'squares',
        draw2d(p, sc, s) {
          const c = Math.cos(s.alpha * DEG), n = Math.sin(s.alpha * DEG);
          p.fill([[0, 0], [c, 0], [c, -c * Math.sign(n || 1)], [0, -c * Math.sign(n || 1)]], COLORS.blue + '33');
          p.fill([[c, 0], [c, n], [c + n * Math.sign(c || 1), n], [c + n * Math.sign(c || 1), 0]], COLORS.red + '33');
        },
        legend: s => {
          const c = Math.cos(s.alpha * DEG), n = Math.sin(s.alpha * DEG);
          return `\\blue{${r2(c)}^2} + \\red{${r2(n)}^2} = ${r2(c * c)} + ${r2(n * n)} = 1`;
        },
      },
      {
        // The radian: the arc the cabin has travelled, unwound as a thread onto the ground, measured in radii
        id: 'thread',
        draw2d(p, sc, s) {
          const a = s.alpha * DEG, y = -1.6;
          wheel(p, sc, s, OX, { triangle: false });
          p.param(t => OX + Math.cos(t), Math.sin, 0, a, COLORS.green, 5);
          p.line(0, y, a, y, COLORS.green, { width: 5 });
          for (let k = 0; k <= 6; k++) {
            p.line(k, y - 0.08, k, y + 0.08, WHITE, { width: 1.5 });
            p.tex('tk' + k, String(k), k, y, '#b9c1cd', { dx: 0, dy: 16, align: 'center' });
          }
          p.tex('tpi', '\\pi', Math.PI, y, COLORS.yellow, { dx: 0, dy: -12, align: 'center' });
          p.tex('t2pi', '2\\pi', 2 * Math.PI, y, COLORS.yellow, { dx: 0, dy: -12, align: 'center' });
        },
        legend: s => `\\alpha = ${s.alpha}° = \\green{${r2(s.alpha * DEG)}}\\ \\text{${t({ en: 'rad', ru: 'рад' })}}`,
      },
      {
        // The height of the cabin as the wheel turns, drawn against the angle in radians: the sine wave
        id: 'wave',
        draw2d(p, sc, s) {
          const a = s.alpha * DEG, n = Math.sin(a);
          wheel(p, sc, s, OX, { triangle: false });
          p.line(0, 0, 2 * Math.PI + 0.3, 0, 'rgba(255,255,255,0.4)', { width: 1 });
          p.curve(Math.sin, 'rgba(255,255,255,0.15)', 2, 0, 2 * Math.PI);
          p.curve(Math.sin, COLORS.red, 3, 0, a);
          p.line(OX + Math.cos(a), n, a, n, COLORS.red + '99', { width: 1.2, dash: [4, 4] });
          p.line(a, 0, a, n, COLORS.red, { width: 3 });
          p.dot(a, n, COLORS.red, 5);
          p.tex('wpi', '\\pi', Math.PI, 0, COLORS.yellow, { dx: 0, dy: 16, align: 'center' });
          p.tex('w2pi', '2\\pi', 2 * Math.PI, 0, COLORS.yellow, { dx: 0, dy: 16, align: 'center' });
        },
        legend: s => `\\red{\\sin(${r2(s.alpha * DEG)}) = ${r2(Math.sin(s.alpha * DEG))}}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'A Ferris wheel', ru: 'Колесо обозрения' },
      text: {
        en: 'A Ferris wheel of radius $1$. The cabin has turned by the angle $\\alpha$ from the rightmost point, counterclockwise. How far is it <span class="c-red">above the axle</span>? That number is called $\\red{\\sin\\alpha}$. How far is it <span class="c-blue">to the right</span>? That is $\\blue{\\cos\\alpha}$. Nothing more: the sine and cosine are the coordinates of the cabin.',
        ru: 'Колесо обозрения радиуса $1$. Кабинка повернулась на угол $\\alpha$ от самой правой точки — против часовой стрелки. Насколько она <span class="c-red">выше оси</span>? Это число и называют $\\red{\\sin\\alpha}$. Насколько <span class="c-blue">правее</span>? Это $\\blue{\\cos\\alpha}$. И всё: синус и косинус — это координаты кабинки.',
      },
      try: { en: 'Drag the cabin to the very top. What are the sine and cosine there?', ru: 'Тяните кабинку на самый верх. Чему там равны синус и косинус?' },
      check: {
        q: { en: 'The cabin is at the leftmost point, $\\alpha = 180°$. $\\sin 180° = ?$', ru: 'Кабинка в самой левой точке, $\\alpha = 180°$. $\\sin 180° = ?$' },
        options: [{ text: '$0$', ok: true }, { text: '$1$' }, { text: '$-1$' }],
        explain: {
          en: 'At the leftmost point the cabin is level with the axle: height $0$. It is the <b>cosine</b> that is $-1$ there — the cabin is one radius to the left.',
          ru: 'В самой левой точке кабинка на уровне оси: высота $0$. А $-1$ там равен <b>косинус</b> — кабинка на радиус левее оси.',
        },
        reveal: scene => scene.animateParams({ alpha: 180 }, 900),
      },
      state: { show: ['wheel'], params: { alpha: 30 }, window: CIRCLE, controls: ['alpha'] },
    },
    {
      title: { en: 'The school triangle inside', ru: 'Школьный треугольник внутри' },
      text: {
        en: 'At school the sine was «the opposite leg over the hypotenuse». Here it is the same: the radius is the hypotenuse, and it is $1$, so the sine is just the <span class="c-red">red leg</span> and the cosine the <span class="c-blue">blue one</span>. But the wheel goes further than a triangle: an angle of $150°$ or $300°$ has no right triangle, and the cabin still has a height. Below the axle the height is negative, to the left of it — the cosine.',
        ru: 'В школе синус был «противолежащий катет, делённый на гипотенузу». Здесь то же самое: гипотенуза — радиус, а он равен $1$, поэтому синус — это просто <span class="c-red">красный катет</span>, а косинус — <span class="c-blue">синий</span>. Но колесо идёт дальше треугольника: у угла $150°$ или $300°$ нет прямоугольного треугольника, а высота у кабинки всё равно есть. Ниже оси высота отрицательная, левее оси — косинус.',
      },
      check: {
        q: { en: '$\\sin 30° = 0.5$. What is $\\sin 150°$?', ru: '$\\sin 30° = 0.5$. Чему равен $\\sin 150°$?' },
        options: [{ text: '$0.5$', ok: true }, { text: '$-0.5$' }, { text: '$0.87$' }],
        explain: {
          en: '$150°$ is the mirror image of $30°$ across the vertical: the cabin is just as high, only on the left. So $\\sin 150° = \\sin 30° = 0.5$, and $\\cos 150° = -\\cos 30°$.',
          ru: '$150°$ — зеркальное отражение $30°$ относительно вертикали: кабинка так же высоко, только слева. Поэтому $\\sin 150° = \\sin 30° = 0.5$, а $\\cos 150° = -\\cos 30°$.',
        },
        reveal: scene => scene.animateParams({ alpha: 150 }, 900),
      },
      state: { show: ['wheel'], params: { alpha: 40 }, window: CIRCLE, controls: ['alpha'] },
    },
    {
      proof: true,
      statement: {
        en: '<b>The main identity.</b> For every angle: $\\sin^2\\alpha + \\cos^2\\alpha = 1$.',
        ru: '<b>Основное тождество.</b> Для любого угла: $\\sin^2\\alpha + \\cos^2\\alpha = 1$.',
      },
      title: { en: 'Pythagoras on the wheel', ru: 'Пифагор на колесе' },
      text: {
        en: 'The legs are $|\\cos\\alpha|$ and $|\\sin\\alpha|$, the hypotenuse is the radius $1$. The Pythagorean theorem: $\\cos^2\\alpha + \\sin^2\\alpha = 1^2$. Signs do not matter — a square is never negative. And at $0°$, $90°$, $180°$ the triangle is flat, but the equality still holds: $1^2 + 0^2 = 1$. Turn the wheel: the two squares change, their sum never does. $\\blacksquare$',
        ru: 'Катеты — $|\\cos\\alpha|$ и $|\\sin\\alpha|$, гипотенуза — радиус $1$. Теорема Пифагора: $\\cos^2\\alpha + \\sin^2\\alpha = 1^2$. Знаки не мешают — квадрат не бывает отрицательным. А при $0°$, $90°$, $180°$ треугольник сплющивается, но равенство всё равно верно: $1^2 + 0^2 = 1$. Крутите колесо: квадраты меняются, их сумма — никогда. $\\blacksquare$',
      },
      state: { show: ['squares', 'wheel'], params: { alpha: 35 }, window: CIRCLE, controls: ['alpha'] },
    },
    {
      title: { en: 'Radians: measure the angle by the rim', ru: 'Радианы: угол меряем ободом' },
      text: {
        en: 'Degrees are a convention: why $360$? A more natural measure is the <span class="c-green">length of the arc</span> the cabin has travelled on a wheel of radius $1$. Unwind it as a thread onto the ground and measure it in radii. One radius of arc is $1$ radian, about $57.3°$. Half a turn is $\\pi \\approx 3.14$, a full turn $2\\pi \\approx 6.28$. That is why $180° = \\pi$.',
        ru: 'Градусы — договорённость: почему именно $360$? Естественнее мерить угол <span class="c-green">длиной дуги</span>, которую кабинка проехала по колесу радиуса $1$. Размотаем её ниткой на землю и измерим в радиусах. Дуга длиной в один радиус — это $1$ радиан, примерно $57.3°$. Полоборота — $\\pi \\approx 3.14$, полный оборот — $2\\pi \\approx 6.28$. Поэтому $180° = \\pi$.',
      },
      try: { en: 'Find the angle whose thread is exactly $1$ long.', ru: 'Найдите угол, нитка которого длиной ровно $1$.' },
      check: {
        q: { en: '$90°$ in radians?', ru: '$90°$ в радианах?' },
        options: [{ text: '$\\frac{\\pi}{2}$', ok: true }, { text: '$\\pi$' }, { text: '$\\frac{\\pi}{4}$' }],
        explain: {
          en: 'A quarter of a turn: a quarter of $2\\pi$, that is $\\frac{\\pi}{2} \\approx 1.57$. $\\pi$ is half a turn, $180°$.',
          ru: 'Четверть оборота — четверть от $2\\pi$, то есть $\\frac{\\pi}{2} \\approx 1.57$. А $\\pi$ — это полоборота, $180°$.',
        },
        reveal: scene => scene.animateParams({ alpha: 90 }, 900),
      },
      state: { show: ['thread'], params: { alpha: 120 }, window: WIDE, controls: ['alpha'] },
    },
    {
      title: { en: 'The wheel turns: the sine wave', ru: 'Колесо крутится: синусоида' },
      text: {
        en: 'Let the wheel turn and record the height of the cabin against the angle in radians. Up to $1$ at $\\frac{\\pi}{2}$, back to $0$ at $\\pi$, down to $-1$, and at $2\\pi$ the cabin is where it started — so the curve repeats. That is the graph $y = \\sin x$: just the height of a cabin on a turning wheel.',
        ru: 'Пусть колесо крутится, а мы записываем высоту кабинки против угла в радианах. Вверх до $1$ при $\\frac{\\pi}{2}$, обратно к $0$ при $\\pi$, вниз до $-1$, а при $2\\pi$ кабинка там же, где начинала, — и кривая повторяется. Это и есть график $y = \\sin x$: просто высота кабинки на вращающемся колесе.',
      },
      try: { en: 'Press ▶ next to $\\alpha$.', ru: 'Нажмите ▶ возле $\\alpha$.' },
      check: {
        q: { en: 'After what angle does the sine wave repeat?', ru: 'Через какой угол синусоида повторяется?' },
        options: [{ text: '$2\\pi$', ok: true }, { text: '$\\pi$' }, { text: '$1$' }],
        explain: {
          en: 'After one full turn, $2\\pi$, the cabin is back in the same place, so the height is the same: $\\sin(x + 2\\pi) = \\sin x$. After $\\pi$ the height has the opposite sign.',
          ru: 'Через полный оборот, $2\\pi$, кабинка на том же месте, значит, и высота та же: $\\sin(x + 2\\pi) = \\sin x$. А через $\\pi$ высота меняет знак.',
        },
      },
      state: { show: ['wave'], params: { alpha: 0 }, window: WIDE, controls: ['alpha'] },
      enter(scene) {
        scene.setParam('alpha', 0);
        scene.animateParams({ alpha: 359 }, 6000);
      },
    },
    {
      title: { en: 'Half way up', ru: 'На половине высоты' },
      text: {
        en: 'Put the cabin on the right half of the wheel so that it is exactly half a radius above the axle: $\\sin\\alpha = 0.5$.',
        ru: 'Поставьте кабинку на правой половине колеса так, чтобы она была ровно на полрадиуса выше оси: $\\sin\\alpha = 0.5$.',
      },
      task: {
        kind: 'drag',
        target: { alpha: 30 },
        tol: 0.5,
        back: 0,
        right: {
          en: '$\\sin 30° = 0.5$: in the triangle with angle $30°$ the opposite leg is half the hypotenuse. The same height on the left half is $150°$.',
          ru: '$\\sin 30° = 0.5$: в треугольнике с углом $30°$ противолежащий катет — половина гипотенузы. Та же высота на левой половине — $150°$.',
        },
        mistakes: [
          { params: { alpha: 60 }, text: { en: 'Here the <b>cosine</b> is $0.5$: the cabin is half a radius to the right. The height should be $0.5$.', ru: 'Здесь $0.5$ равен <b>косинус</b>: кабинка на полрадиуса правее оси. А нужна высота $0.5$.' } },
          { params: { alpha: 150 }, text: { en: 'The height is right — $\\sin 150° = 0.5$! But this is the left half; find the same height on the right.', ru: 'Высота верная — $\\sin 150° = 0.5$! Но это левая половина; найдите такую же высоту справа.' } },
        ],
        hints: { alpha: { en: 'Watch the red leg: it must be half of the radius.', ru: 'Следите за красным катетом: он должен быть половиной радиуса.' } },
      },
      state: { show: ['wheel'], params: { alpha: 80 }, window: CIRCLE, controls: [] },
    },
  ],
};
