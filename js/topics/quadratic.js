// The quadratic equation x² + bx + c = 0 and Vieta's theorem. The formula for the roots is proved by completing
// the square with areas (as al-Khwarizmi did): x² + bx is a square x × x and two strips b/2 × x, and the missing
// corner (b/2)² turns them into the square (x + b/2)². Then Vieta: the roots add up to −b and multiply to c.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';

const r2 = v => fmt(Math.round(v * 100) / 100);
const PARA = { cx: 0, cy: 1, unit: 42 };
const AREA = { cx: 2.6, cy: 2.6, unit: 60, fit: [7.5, 7.5] };
const roots = (b, c) => { const D = b * b - 4 * c; return D < 0 ? [] : D === 0 ? [-b / 2] : [(-b - Math.sqrt(D)) / 2, (-b + Math.sqrt(D)) / 2]; };
const poly = (b, c) => `x^2 ${b < 0 ? '-' : '+'} ${r2(Math.abs(b))}x ${c < 0 ? '-' : '+'} ${r2(Math.abs(c))}`;

export default {
  view: '2d',
  view2d: PARA,
  lab: false,

  setup(scene) {
    scene.ensureParam('b', -2, { min: -8, max: 8, step: 0.5 });
    scene.ensureParam('c', -3, { min: -8, max: 12, step: 0.5 });
    scene.ensureParam('X', 2.5, { min: 0.5, max: 4, step: 0.1 }); // the side of the square in the area picture
    scene.ensureParam('B', 3, { min: 0.5, max: 4, step: 0.1 }); // b in the area picture (positive: a length)
    scene.ensureParam('fill', 0, { min: 0, max: 1, step: 0.01 }); // how much of the corner is filled in

    // The parabola with its roots and the vertex
    const parabola = (p, s, { vertex = false } = {}) => {
      const { b, c } = s, v = -b / 2, h = c - b * b / 4;
      p.curve(x => x * x + b * x + c, COLORS.blue, 3);
      const rs = roots(b, c);
      rs.forEach((x, i) => { p.dot(x, 0, COLORS.yellow, 6); p.tex(`r${i}`, `x_${i + 1} = ${r2(x)}`, x, 0, COLORS.yellow, { dx: 0, dy: 18, align: 'center' }); });
      if (vertex) {
        p.line(v, p.yr[0], v, p.yr[1], 'rgba(255,255,255,0.3)', { width: 1.2, dash: [5, 5] });
        p.dot(v, h, COLORS.purple, 6);
        p.tex('vx', `x = -\\tfrac{b}{2} = ${r2(v)}`, v, h, COLORS.purple, { dx: 12, dy: 14 });
        if (rs.length === 2) {
          p.line(v, 0.15, rs[1], 0.15, COLORS.teal, { width: 2.5 });
          p.line(rs[0], 0.15, v, 0.15, COLORS.teal, { width: 2.5 });
          p.tex('dd', `\\tfrac{\\sqrt{D}}{2} = ${r2(Math.sqrt(b * b - 4 * c) / 2)}`, (v + rs[1]) / 2, 0.15, COLORS.teal, { dx: 0, dy: -14, align: 'center' });
        }
      }
    };

    scene.custom.push(
      {
        id: 'para',
        draw2d(p, sc, s) { parabola(p, s); },
        legend: s => {
          const rs = roots(s.b, s.c);
          return `\\blue{y = ${poly(s.b, s.c)}}\\qquad ${rs.length ? rs.map((x, i) => `\\yellow{x_${i + 1} = ${r2(x)}}`).join(',\\ ') : t({ en: '\\text{no roots}', ru: '\\text{корней нет}' })}`;
        },
      },
      {
        id: 'paraV',
        draw2d(p, sc, s) { parabola(p, s, { vertex: true }); },
        legend: s => `D = b^2 - 4c = ${r2(s.b * s.b - 4 * s.c)}`,
      },
      {
        // x² + Bx as areas: the square x × x and two strips B/2 × x; the corner (B/2)² fills in with `fill`
        id: 'area',
        draw2d(p, sc, s) {
          const x = s.X, h = s.B / 2, f = s.fill;
          p.fill([[0, 0], [x, 0], [x, x], [0, x]], COLORS.blue + '55');
          p.fill([[x, 0], [x + h, 0], [x + h, x], [x, x]], COLORS.green + '55');
          p.fill([[0, x], [x, x], [x, x + h], [0, x + h]], COLORS.green + '55');
          if (f > 0) p.fill([[x, x], [x + h * f, x], [x + h * f, x + h * f], [x, x + h * f]], COLORS.yellow + '77');
          const edge = { width: 2, dash: f > 0.98 ? [] : [5, 5] }, ec = f > 0.98 ? COLORS.yellow : 'rgba(244,211,94,0.6)';
          p.line(x + h, x, x + h, x + h, ec, edge);
          p.line(x + h, x + h, x, x + h, ec, edge);
          p.polyline([[0, 0], [x + h, 0], [x + h, x], [x, x], [x, x + h], [0, x + h], [0, 0]], '#ffffff', 2);
          p.line(x, 0, x, x, 'rgba(255,255,255,0.6)', { width: 1.2 });
          p.line(0, x, x, x, 'rgba(255,255,255,0.6)', { width: 1.2 });
          p.tex('ax2', 'x^2', x / 2, x / 2, COLORS.blue, { dx: 0, dy: 0, align: 'center' });
          p.tex('ah1', '\\tfrac b2 x', x + h / 2, x / 2, COLORS.green, { dx: 0, dy: 0, align: 'center' });
          p.tex('ah2', '\\tfrac b2 x', x / 2, x + h / 2, COLORS.green, { dx: 0, dy: 0, align: 'center' });
          p.tex('sx', 'x', x / 2, 0, '#b9c1cd', { dx: 0, dy: 16, align: 'center' });
          p.tex('sh', '\\tfrac b2', x + h / 2, 0, '#b9c1cd', { dx: 0, dy: 16, align: 'center' });
          if (f > 0.98) {
            p.tex('corner', '\\left(\\tfrac b2\\right)^2', x + h / 2, x + h / 2, COLORS.yellow, { dx: 0, dy: 0, align: 'center' });
            p.tex('big', '\\left(x + \\tfrac b2\\right)^2', (x + h) / 2, x + h, '#ffffff', { dx: 0, dy: -18, align: 'center' });
          }
        },
        legend: s => (s.fill > 0.98
          ? `x^2 + bx + \\yellow{\\left(\\tfrac b2\\right)^2} = \\left(x + \\tfrac b2\\right)^2`
          : `\\blue{x^2} + \\green{bx} = \\blue{x^2} + \\green{2 \\cdot \\tfrac b2 x}`),
      },
      {
        // The task: make the roots 2 and 5
        id: 'task25',
        draw2d(p, sc, s) {
          parabola(p, s);
          [2, 5].forEach(x => p.ring(x, 0, COLORS.orange, 8));
        },
        legend: s => `\\blue{y = ${poly(s.b, s.c)}}\\qquad ${t({ en: '\\text{goal: roots}', ru: '\\text{цель: корни}' })}\\ \\orange{2,\\ 5}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'Roots: where the parabola crosses the axis', ru: 'Корни — где парабола пересекает ось' },
      text: {
        en: 'Solving $x^2 + bx + c = 0$ means finding the $x$ where the parabola $y = x^2 + bx + c$ is at height $0$ — where it crosses the $x$ axis. Move $b$ and $c$: there can be two crossings, one (the parabola touches the axis) or none.',
        ru: 'Решить $x^2 + bx + c = 0$ — значит найти те $x$, где парабола $y = x^2 + bx + c$ на высоте $0$, то есть где она пересекает ось $x$. Двигайте $b$ и $c$: пересечений бывает два, одно (парабола касается оси) или ни одного.',
      },
      check: {
        q: { en: 'How many roots does $x^2 + 4 = 0$ have?', ru: 'Сколько корней у $x^2 + 4 = 0$?' },
        options: [{ text: { en: 'none', ru: 'ни одного' }, ok: true }, { text: '$2$: $\\pm 2$' }, { text: '$1$' }],
        explain: {
          en: '$x^2 \\ge 0$, so $x^2 + 4 \\ge 4$: the parabola never comes down to the axis. ($\\pm 2$ solve $x^2 - 4 = 0$.)',
          ru: '$x^2 \\ge 0$, поэтому $x^2 + 4 \\ge 4$: парабола никогда не опускается до оси. ($\\pm 2$ — корни $x^2 - 4 = 0$.)',
        },
        reveal: scene => scene.animateParams({ b: 0, c: 4 }, 800),
      },
      state: { show: ['para'], params: { b: -2, c: -3 }, window: PARA, controls: ['b', 'c'] },
    },
    {
      title: { en: 'Everything is symmetric about the vertex', ru: 'Всё симметрично относительно вершины' },
      text: {
        en: 'A parabola is symmetric: the roots stand at the same distance on both sides of the vertex. So to solve the equation it is enough to find two things: where the vertex is, and how far the roots are from it. The proof below finds both.',
        ru: 'Парабола симметрична: корни стоят на одинаковом расстоянии по обе стороны от вершины. Значит, чтобы решить уравнение, достаточно найти две вещи: где вершина и как далеко от неё корни. Доказательство ниже находит и то и другое.',
      },
      state: { show: ['paraV'], params: { b: -2, c: -3 }, window: PARA, controls: ['b', 'c'] },
    },
    {
      proof: true,
      statement: {
        en: '<b>The formula for the roots.</b> The equation $x^2 + bx + c = 0$ has roots exactly when $D = b^2 - 4c \\ge 0$, and they are $x = \\dfrac{-b \\pm \\sqrt{D}}{2}$.',
        ru: '<b>Формула корней.</b> Уравнение $x^2 + bx + c = 0$ имеет корни ровно тогда, когда $D = b^2 - 4c \\ge 0$, и они равны $x = \\dfrac{-b \\pm \\sqrt{D}}{2}$.',
      },
      title: { en: 'x² + bx as areas', ru: 'x² + bx как площади' },
      text: {
        en: 'Draw $x^2$ as a square with side $x$. Split $bx$ into two equal strips $\\frac b2 \\times x$ and attach them to two sides of the square. The figure looks like a big square with a corner missing.',
        ru: 'Нарисуем $x^2$ как квадрат со стороной $x$. Разделим $bx$ на две одинаковые полоски $\\frac b2 \\times x$ и приставим их к двум сторонам квадрата. Фигура похожа на большой квадрат без уголка.',
      },
      state: { show: ['area'], params: { X: 2.5, B: 3, fill: 0 }, window: AREA, controls: ['X', 'B'] },
    },
    {
      proof: true,
      title: { en: 'Complete the square', ru: 'Дополним до квадрата' },
      text: {
        en: 'The missing corner is a square $\\frac b2 \\times \\frac b2$. Add it — and we get a whole square with side $x + \\frac b2$. So $x^2 + bx = \\left(x + \\frac b2\\right)^2 - \\left(\\frac b2\\right)^2$, and the equation becomes $$\\left(x + \\tfrac b2\\right)^2 = \\tfrac{b^2}{4} - c = \\tfrac{D}{4}.$$ (For negative $b$ or $x$ the areas become signed, but opening the brackets checks the same identity.)',
        ru: 'Недостающий уголок — квадрат $\\frac b2 \\times \\frac b2$. Добавим его — и получим целый квадрат со стороной $x + \\frac b2$. Значит, $x^2 + bx = \\left(x + \\frac b2\\right)^2 - \\left(\\frac b2\\right)^2$, и уравнение превращается в $$\\left(x + \\tfrac b2\\right)^2 = \\tfrac{b^2}{4} - c = \\tfrac{D}{4}.$$ (При отрицательных $b$ или $x$ площади становятся «со знаком», но раскрытие скобок проверяет то же тождество.)',
      },
      state: { show: ['area'], params: { X: 2.5, B: 3, fill: 1 }, ms: 1600, window: AREA, controls: ['fill'] },
    },
    {
      proof: true,
      title: { en: 'Take the root', ru: 'Извлечём корень' },
      text: {
        en: 'A square is never negative. If $D < 0$, the left side $\\ge 0$ cannot equal $\\frac D4 < 0$ — no roots. If $D \\ge 0$: $x + \\frac b2 = \\pm\\frac{\\sqrt D}{2}$, so $$x = \\frac{-b \\pm \\sqrt{D}}{2}.$$ This is exactly what the picture showed: the vertex is at $x = -\\frac b2$ (purple), and the roots are $\\frac{\\sqrt D}{2}$ away from it on both sides (teal). $\\blacksquare$',
        ru: 'Квадрат не бывает отрицательным. Если $D < 0$, левая часть $\\ge 0$ не может равняться $\\frac D4 < 0$ — корней нет. Если $D \\ge 0$: $x + \\frac b2 = \\pm\\frac{\\sqrt D}{2}$, то есть $$x = \\frac{-b \\pm \\sqrt{D}}{2}.$$ Ровно это и показывала картинка: вершина в $x = -\\frac b2$ (фиолетовая), а корни на $\\frac{\\sqrt D}{2}$ от неё в обе стороны (бирюзовые). $\\blacksquare$',
      },
      state: { show: ['paraV'], params: { b: -2, c: -3 }, window: PARA, controls: ['b', 'c'] },
    },
    {
      proof: true,
      statement: {
        en: '<b>Vieta\'s theorem.</b> If $x_1$, $x_2$ are the roots of $x^2 + bx + c = 0$, then $x_1 + x_2 = -b$ and $x_1 x_2 = c$.',
        ru: '<b>Теорема Виета.</b> Если $x_1$, $x_2$ — корни $x^2 + bx + c = 0$, то $x_1 + x_2 = -b$ и $x_1 x_2 = c$.',
      },
      title: { en: 'Vieta: the roots in the coefficients', ru: 'Виет: корни внутри коэффициентов' },
      text: {
        en: 'From the previous step, $x^2 + bx + c = \\left(x + \\frac b2\\right)^2 - \\left(\\frac{\\sqrt D}{2}\\right)^2$ — a difference of squares, so it equals $(x - x_1)(x - x_2)$. Open the brackets: $x^2 - (x_1 + x_2)x + x_1 x_2$. Compare with $x^2 + bx + c$: $$x_1 + x_2 = -b, \\qquad x_1 x_2 = c. \\ \\blacksquare$$ Check it on the picture with your own $b$ and $c$.',
        ru: 'Из прошлого шага $x^2 + bx + c = \\left(x + \\frac b2\\right)^2 - \\left(\\frac{\\sqrt D}{2}\\right)^2$ — разность квадратов, то есть $(x - x_1)(x - x_2)$. Раскроем скобки: $x^2 - (x_1 + x_2)x + x_1 x_2$. Сравним с $x^2 + bx + c$: $$x_1 + x_2 = -b, \\qquad x_1 x_2 = c. \\ \\blacksquare$$ Проверьте на картинке со своими $b$ и $c$.',
      },
      state: { show: ['para'], params: { b: -5, c: 6 }, window: PARA, controls: ['b', 'c'] },
    },
    {
      title: { en: 'Where it lives in grades 10–11', ru: 'Где это в 10–11 классе' },
      text: {
        en: 'The vertex $x = -\\frac b2$ is where the slope is zero: the <b>derivative</b> $2x + b = 0$ gives the same point. Moving a parabola is <b>shifting graphs</b>: $\\left(x + \\frac b2\\right)^2 - \\frac D4$ is $x^2$ moved left by $\\frac b2$ and down by $\\frac D4$. Factoring $(x - x_1)(x - x_2)$ removes the «hole» $\\frac00$ in <b>limits</b>. And Vieta for a cubic — the roots add up to minus the coefficient — finds the third point of a line on an <b>elliptic curve</b>.',
        ru: 'Вершина $x = -\\frac b2$ — это место, где наклон нулевой: <b>производная</b> $2x + b = 0$ даёт ту же точку. Сдвиг параболы — это <b>сдвиги графиков</b>: $\\left(x + \\frac b2\\right)^2 - \\frac D4$ — это $x^2$, сдвинутый влево на $\\frac b2$ и вниз на $\\frac D4$. Разложение $(x - x_1)(x - x_2)$ убирает «дырку» $\\frac00$ в <b>пределах</b>. А Виет для кубического уравнения — сумма корней равна минус коэффициенту — находит третью точку прямой на <b>эллиптической кривой</b>.',
      },
      state: { show: ['paraV'], params: { b: 2, c: -3 }, window: PARA, controls: ['b', 'c'] },
    },
    {
      title: { en: 'Build an equation from its roots', ru: 'Соберите уравнение по корням' },
      text: {
        en: 'Choose $b$ and $c$ so that the roots are $2$ and $5$. Vieta is faster than trying.',
        ru: 'Подберите $b$ и $c$ так, чтобы корни были $2$ и $5$. Виет быстрее перебора.',
      },
      task: {
        kind: 'drag',
        target: { b: -7, c: 10 },
        back: 5,
        right: {
          en: '$x_1 + x_2 = 7 = -b$, so $b = -7$; $x_1 x_2 = 10 = c$. The equation is $x^2 - 7x + 10 = (x - 2)(x - 5) = 0$.',
          ru: '$x_1 + x_2 = 7 = -b$, значит $b = -7$; $x_1 x_2 = 10 = c$. Уравнение $x^2 - 7x + 10 = (x - 2)(x - 5) = 0$.',
        },
        mistakes: [
          { params: { b: 7, c: 10 }, text: { en: 'The roots came out $-2$ and $-5$: the sum of the roots is $-b$, with a minus.', ru: 'Корни получились $-2$ и $-5$: сумма корней — это $-b$, с минусом.' } },
        ],
        hints: {
          b: { en: 'The sum of the roots is $-b$.', ru: 'Сумма корней равна $-b$.' },
          c: { en: 'The product of the roots is $c$.', ru: 'Произведение корней равно $c$.' },
        },
      },
      state: { show: ['task25'], params: { b: 0, c: 0 }, window: { cx: 3.5, cy: 0, unit: 42 }, controls: ['b', 'c'] },
    },
  ],
};
