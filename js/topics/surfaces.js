// Surfaces and slices: a function of two variables as a landscape; cutting it with planes gives
// ordinary graphs (shown next to it in 2D), and the slope of a slice is a partial derivative.

import { COLORS } from '../core/palette.js';
import { fmt, slope } from '../core/numeric.js';

const WHITE = '#ffffff';
const R = 3;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const along = (n, f) => Array.from({ length: n + 1 }, (_, i) => f(-R + 2 * R * i / n));

export default {
  view: '3d',
  view2d: { cx: 0, cy: 0.4, unit: 52 },
  view3d: { R, zmax: R, camera: [6, -7.5, 5] },
  controls: ['c'],

  setup(scene) {
    scene.add('z = (x^2 + y^2)/4', { id: 'bowl', color: 'blue', only: '3d' });
    scene.add('z = (x^2 - y^2)/3', { id: 'saddle', color: 'purple', only: '3d', visible: false });
    scene.add('z = 1.5 sin(x) cos(y)', { id: 'waves', color: 'teal', only: '3d', visible: false });
    scene.ensureParam('c', 1, { min: -R, max: R });
    scene.ensureParam('d', 0, { min: -R, max: R });
    scene.ensureParam('a', 1.5, { min: -R, max: R });

    // Height of the visible surface
    const Z = (sc, s, x, y) => {
      const item = sc.items.find(i => i.visible && i.info.kind === 'surface');
      if (!item) return NaN;
      s.x = x; s.y = y;
      return item.fn(s);
    };

    scene.custom.push(
      {
        id: 'sliceY',
        draw3d(p, sc, s) {
          p.plane('planeY', 'y', s.c, COLORS.yellow);
          p.tube('sliceY', along(160, x => [x, s.c, Z(sc, s, x, s.c)]), COLORS.yellow, 0.06);
        },
        draw2d(p, sc, s) {
          p.axisNames = { x: 'x', y: 'z' };
          p.curve(x => Z(sc, s, x, s.c), COLORS.yellow, 3);
          p.tex('sliceY', '\\yellow{z = f(x,\\ c)}', 2.2, Z(sc, s, 2.2, s.c), COLORS.yellow, { dx: -10, dy: -18, align: 'right' });
        },
        legend: s => `\\yellow{y = c = ${fmt(s.c)}}`,
      },
      {
        id: 'sliceX',
        draw3d(p, sc, s) {
          p.plane('planeX', 'x', s.d, COLORS.red);
          p.tube('sliceX', along(160, y => [s.d, y, Z(sc, s, s.d, y)]), COLORS.red, 0.06);
        },
        draw2d(p, sc, s) {
          p.axisNames = { x: 'y', y: 'z' };
          p.curve(y => Z(sc, s, s.d, y), COLORS.red, 3);
          p.tex('sliceX', '\\red{z = f(d,\\ y)}', 2.2, Z(sc, s, s.d, 2.2), COLORS.red, { dx: -10, dy: 18, align: 'right' });
        },
        legend: s => `\\red{x = d = ${fmt(s.d)}}`,
      },
      {
        // Partial derivative: the tangent to the slice y = c at x = a, on the surface and on the flat graph
        id: 'partial',
        draw3d(p, sc, s) {
          const z0 = Z(sc, s, s.a, s.c), k = slope(x => Z(sc, s, x, s.c), s.a);
          p.tube('partialLine', [[s.a - 1.2, s.c, z0 - 1.2 * k], [s.a, s.c, z0], [s.a + 1.2, s.c, z0 + 1.2 * k]], COLORS.green, 0.045);
          p.sphere('partialPoint', [s.a, s.c, z0], WHITE, 0.11);
        },
        draw2d(p, sc, s) {
          const z0 = Z(sc, s, s.a, s.c), k = slope(x => Z(sc, s, x, s.c), s.a);
          p.line(s.a, z0, s.a + 1, z0 + k, COLORS.green, { width: 2.5, extend: true });
          p.handle(s.a, z0, WHITE, x => { sc.play('a', false); sc.setParam('a', clamp(x, -R, R)); });
        },
        legend: (s, sc) => `\\green{\\frac{\\partial z}{\\partial x}(a,\\ c)} = ${fmt(slope(x => Z(sc, { ...s }, x, s.c), s.a))}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'Two inputs, one height', ru: 'Два входа — одна высота' },
      text: {
        en: 'So far a function took one number $x$ and returned one number. Now let it take two — $x$ and $y$, a point on the floor — and return a height $z = f(x, y)$. Lift every point of the floor to its height and you get a surface, a landscape. Here $\\blue{z = \\frac{x^2 + y^2}{4}}$: a bowl.',
        ru: 'До сих пор функция брала одно число $x$ и возвращала одно число. Пусть теперь она берёт два — $x$ и $y$, точку на полу — и возвращает высоту $z = f(x, y)$. Поднимите каждую точку пола на её высоту — получится поверхность, ландшафт. Здесь $\\blue{z = \\frac{x^2 + y^2}{4}}$ — чаша.',
      },
      try: { en: 'Drag to rotate, scroll to zoom.', ru: 'Тяните, чтобы вращать; колесо — масштаб.' },
      state: { view: '3d', show: ['bowl'], camera: [6, -7.5, 5], controls: [] },
    },
    {
      title: { en: 'Cut it with a plane', ru: 'Разрежем плоскостью' },
      text: {
        en: 'Freeze $y$ at some value $\\yellow{c}$ and let only $x$ change. In 3D this is a vertical plane cutting the surface; the cut is a curve, $\\yellow{z = f(x, c)}$. On the flat graph next to it, that is an ordinary function of one variable — a parabola. <b>A function of two variables is a whole family of ordinary functions.</b>',
        ru: 'Заморозим $y$ на значении $\\yellow{c}$ и будем менять только $x$. В 3D это вертикальная плоскость, разрезающая поверхность; в разрезе — кривая $\\yellow{z = f(x, c)}$. На плоском графике рядом это обычная функция одной переменной — парабола. <b>Функция двух переменных — это целое семейство обычных функций.</b>',
      },
      try: { en: 'Press ▶ next to $c$: the plane travels and the parabola rises and falls.', ru: 'Нажмите ▶ возле $c$: плоскость едет, а парабола поднимается и опускается.' },
      state: { view: 'split', show: ['bowl', 'sliceY'], params: { c: 1 }, camera: [6, -7.5, 5], controls: ['c'] },
    },
    {
      title: { en: 'A saddle', ru: 'Седло' },
      text: {
        en: 'A new landscape: $\\purple{z = \\frac{x^2 - y^2}{3}}$. Slice it along $x$ — every cut is a parabola opening <b>up</b>…',
        ru: 'Новый ландшафт: $\\purple{z = \\frac{x^2 - y^2}{3}}$. Режем вдоль $x$ — и каждый разрез оказывается параболой ветвями <b>вверх</b>…',
      },
      try: { en: 'Play $c$ and watch: always up.', ru: 'Запустите $c$: ветви всегда вверх.' },
      state: { view: 'split', show: ['saddle', 'sliceY'], params: { c: 0 }, camera: [7, -6.5, 4.5], controls: ['c'] },
    },
    {
      title: { en: '…and the other way', ru: '…а в другую сторону' },
      text: {
        en: '…but freeze $x$ at $\\red{d}$ and walk along $y$: the cuts open <b>down</b>. Up in one direction, down in the other. The origin is neither a peak nor a valley — it is a <i>saddle point</i>, something a function of one variable cannot have.',
        ru: '…но заморозьте $x$ на значении $\\red{d}$ и идите вдоль $y$: разрезы — параболы ветвями <b>вниз</b>. В одну сторону вверх, в другую вниз. Начало координат — не вершина и не впадина, а <i>седловая точка</i>: у функции одной переменной такого не бывает.',
      },
      try: { en: 'Play $d$.', ru: 'Запустите $d$.' },
      state: { view: 'split', show: ['saddle', 'sliceX'], params: { d: 0 }, camera: [7.5, 5.5, 4.5], controls: ['d'] },
    },
    {
      title: { en: 'The slope of a slice', ru: 'Наклон разреза' },
      text: {
        en: 'A slice is an ordinary function, so it has a derivative: the steepness of the surface in the $x$ direction. It is called the <i>partial derivative</i> $\\green{\\frac{\\partial z}{\\partial x}}$ — differentiate in $x$ and treat $y$ as a constant. For the saddle $\\frac{\\partial z}{\\partial x} = \\frac{2x}{3}$. It is the same tangent as in <a href="#topic/derivative">the derivative topic</a>, only now it lives on a surface.',
        ru: 'Разрез — обычная функция, значит у него есть производная: крутизна поверхности в направлении $x$. Она называется <i>частной производной</i> $\\green{\\frac{\\partial z}{\\partial x}}$ — дифференцируем по $x$, считая $y$ постоянной. У седла $\\frac{\\partial z}{\\partial x} = \\frac{2x}{3}$. Это та же касательная, что в <a href="#topic/derivative">теме о производной</a>, только теперь она живёт на поверхности.',
      },
      try: { en: 'Drag the white point on the flat graph, or move $c$.', ru: 'Тяните белую точку на плоском графике или двигайте $c$.' },
      state: { view: 'split', show: ['saddle', 'sliceY', 'partial'], params: { c: 1, a: 1.5 }, camera: [6, -7.5, 4.5], controls: ['a', 'c'] },
    },
    {
      title: { en: 'Waves', ru: 'Волны' },
      text: {
        en: '$\\teal{z = 1.5 \\sin x \\cos y}$. Every slice $y = \\yellow{c}$ is the same sine wave $1.5 \\cos c \\cdot \\sin x$, stretched by $\\cos c$. As the plane moves, the wave grows, flattens to zero and flips over. Two simple functions multiplied give a rich landscape.',
        ru: '$\\teal{z = 1.5 \\sin x \\cos y}$. Каждый разрез $y = \\yellow{c}$ — одна и та же синусоида $1.5 \\cos c \\cdot \\sin x$, растянутая в $\\cos c$ раз. Плоскость движется — волна растёт, сплющивается в ноль и переворачивается. Две простые функции, перемноженные, дают богатый ландшафт.',
      },
      state: { view: 'split', show: ['waves', 'sliceY'], params: { c: -3 }, play: ['c'], camera: [6.5, -7, 6], controls: ['c'] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'Open the scene in the Lab and build your own landscapes: $z = \\sin(xy)$, $z = 3e^{-(x^2 + y^2)/4}$, $z = \\frac{x^3 - 3xy^2}{5}$ (a «monkey saddle»). Add a curve $(\\cos t, \\sin t)$ — in 3D it lies on the floor under the surface.',
        ru: 'Откройте сцену в Lab и постройте свои ландшафты: $z = \\sin(xy)$, $z = 3e^{-(x^2 + y^2)/4}$, $z = \\frac{x^3 - 3xy^2}{5}$ («обезьянье седло»). Добавьте кривую $(\\cos t, \\sin t)$ — в 3D она ляжет на пол под поверхностью.',
      },
      state: { view: 'split', show: ['waves', 'sliceY', 'partial'], params: { a: 1, c: 0.6 }, camera: [6.5, -7, 6], controls: ['a', 'c'] },
    },
  ],
};
