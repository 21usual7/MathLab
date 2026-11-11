// A function: a machine that turns an input into an output, and its graph — all the input/output pairs
// drawn at once. Reading the graph forward (x → f(x)) and backward (f(x) = c → x), the vertical line test,
// and inputs the machine does not accept (domain).

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { explorer } from '../views/explore.js';
import { t } from '../core/i18n.js';

const WHITE = '#ffffff';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r2 = v => Math.round(v * 100) / 100;
const WINDOW = { cx: 0, cy: 2, unit: 55 };

// Solutions of x²/2 − 1 = c
const solve = c => (Math.abs(c + 1) < 0.03 ? [0] : c > -1 ? [-Math.sqrt(2 * (c + 1)), Math.sqrt(2 * (c + 1))] : []);

export default {
  view: '2d',
  view2d: WINDOW,
  controls: ['a'],

  setup(scene) {
    const f = scene.add('f(x) = x^2/2 - 1', { id: 'f', color: 'blue' });
    scene.add('(2cos(t), 2sin(t))', { id: 'circle', color: 'purple', visible: false });
    scene.add('x = v', { id: 'vl', color: 'red', dim: true, visible: false, legend: false });
    scene.add('y = sqrt(x)', { id: 'sqrt', color: 'teal', visible: false });
    scene.add('y = 1/x', { id: 'inv', color: 'orange', visible: false });
    scene.add('y = sqrt(x - 2)', { id: 'sqrt2', color: 'pink', visible: false });
    scene.ensureParam('a', 2.5, { min: -4, max: 4 });
    scene.ensureParam('n', 1, { min: 1, max: 16, step: 1 });
    scene.ensureParam('c', 1, { min: -3, max: 6 });
    scene.ensureParam('v', 1, { min: -3, max: 3 });
    const F = (s, x) => { s.x = x; return f.fn(s); };

    scene.custom.push(
      {
        // The machine: the input a on the x-axis goes up to the graph, and the output is read on the y-axis
        id: 'machine',
        draw2d(p, sc, s) {
          const a = r2(s.a), fa = F(s, a);
          p.arrow(a, 0, a, fa, COLORS.yellow + 'cc', { width: 2, dash: [5, 4] });
          p.arrow(a, fa, 0, fa, COLORS.green + 'cc', { width: 2, dash: [5, 4] });
          p.dot(a, fa, WHITE, 5);
          p.dot(0, fa, COLORS.green, 6);
          p.tex('in', '\\yellow{a}', a, 0, COLORS.yellow, { dx: 0, dy: fa > 0 ? 20 : -20, align: 'center' });
          p.tex('out', '\\green{f(a)}', 0, fa, COLORS.green, { dx: a > 0 ? -10 : 10, dy: 0, align: a > 0 ? 'right' : 'left' });
          p.handle(a, 0, COLORS.yellow, x => { sc.play('a', false); sc.setParam('a', clamp(x, -4, 4)); });
        },
        legend: s => {
          const a = r2(s.a), A = a < 0 ? `(${fmt(a)})` : fmt(a);
          return `f(\\yellow{${fmt(a)}}) = \\frac{${A}^2}{2} - 1 = \\green{${fmt(a * a / 2 - 1)}}`;
        },
      },
      {
        // A table of values drawn as points; more and more inputs until the points merge into a curve
        id: 'table',
        draw2d(p, sc, s) {
          const n = Math.max(1, Math.round(s.n));
          for (let k = -4 * n; k <= 4 * n; k++) p.dot(k / n, F(s, k / n), COLORS.blue, n > 3 ? 3.5 : 5.5);
        },
        legend: () => '\\begin{array}{c|ccccccc} x & -3 & -2 & -1 & 0 & 1 & 2 & 3 \\\\ \\hline f(x) & 3.5 & 1 & -0.5 & -1 & -0.5 & 1 & 3.5 \\end{array}',
      },
      {
        // Backward: which inputs give the output c? Where the line y = c meets the graph
        id: 'level',
        draw2d(p, sc, s) {
          p.line(p.xr[0], s.c, p.xr[1], s.c, COLORS.green, { width: 2, dash: [8, 6] });
          solve(s.c).forEach((x, i) => {
            p.line(x, s.c, x, 0, COLORS.yellow + 'aa', { width: 1.2, dash: [3, 4] });
            p.dot(x, s.c, WHITE, 5);
            p.dot(x, 0, COLORS.yellow, 6);
            p.tex(`sol${i}`, `\\yellow{${fmt(r2(x))}}`, x, 0, COLORS.yellow, { dx: 0, dy: s.c > 0 ? 20 : -20, align: 'center' });
          });
          p.tex('c', '\\green{c}', 0, s.c, COLORS.green, { dx: 14, dy: -12 });
          p.handle(0, s.c, COLORS.green, (x, y) => { sc.play('c', false); sc.setParam('c', clamp(y, -3, 6)); });
        },
        legend: s => {
          const xs = solve(s.c);
          const right = xs.length ? `x = ${xs.map(x => `\\yellow{${fmt(r2(x))}}`).join(',\\ ')}` : t({ en: '\\text{no such } x', ru: '\\text{таких } x \\text{ нет}' });
          return `f(x) = \\green{${fmt(r2(s.c))}} \\;\\Rightarrow\\; ${right}`;
        },
      },
      {
        // The vertical line test: one input, how many outputs?
        id: 'vtest',
        draw2d(p, sc, s) {
          const v = s.v;
          const fv = F(s, v);
          p.dot(v, fv, COLORS.blue, 6);
          if (Math.abs(v) <= 2) {
            const y = Math.sqrt(4 - v * v);
            p.dot(v, y, COLORS.purple, 6);
            p.dot(v, -y, COLORS.purple, 6);
          }
          p.handle(v, p.yr[0] + 40 / p.u, COLORS.red, x => { sc.play('v', false); sc.setParam('v', clamp(x, -3, 3)); });
        },
        legend: s => {
          const v = r2(s.v), n = Math.abs(v) < 2 ? 2 : Math.abs(v) === 2 ? 1 : 0;
          const [par, circ] = t({ en: ['parabola', 'circle'], ru: ['парабола', 'окружность'] });
          return `\\red{x = ${fmt(v)}}:\\ \\ \\blue{\\text{${par}: } 1},\\ \\ \\purple{\\text{${circ}: } ${n}}`;
        },
      },
      explorer(),
    );
  },

  steps: [
    {
      title: { en: 'A machine', ru: 'Машина' },
      text: {
        en: 'A function is a machine: put a number in, get a number out. This one is $\\blue{f(x) = \\frac{x^2}{2} - 1}$: square the input, halve it, subtract one. Put in $\\yellow{a}$, get $\\green{f(a)}$. The notation $f(a)$ only means «what the machine $f$ gives for the input $a$» — it is not $f$ times $a$.',
        ru: 'Функция — это машина: положили число, получили число. Эта машина — $\\blue{f(x) = \\frac{x^2}{2} - 1}$: возвести вход в квадрат, разделить пополам, вычесть единицу. Положили $\\yellow{a}$ — получили $\\green{f(a)}$. Запись $f(a)$ означает только «что выдаёт машина $f$ на входе $a$». Это не $f$, умноженное на $a$.',
      },
      try: { en: 'Drag the yellow input along the axis and watch the output on the vertical axis.', ru: 'Тяните жёлтый вход вдоль оси и следите за выходом на вертикальной оси.' },
      hint: {
        title: { en: 'Why is the input on one axis and the output on the other?', ru: 'Почему вход на одной оси, а выход на другой?' },
        text: {
          en: 'It is a convention that makes the picture work: inputs go left–right (the $x$-axis), outputs go up–down (the vertical axis). Then every input–output pair is one point: go right by the input, up by the output.',
          ru: 'Это договорённость, благодаря которой работает картинка: входы откладываем влево–вправо (ось $x$), выходы — вверх–вниз (вертикальная ось). Тогда каждая пара «вход–выход» — одна точка: вправо на вход, вверх на выход.',
        },
      },
      state: { show: ['f', 'machine'], params: { a: 2.5 }, window: WINDOW, controls: ['a'] },
    },
    {
      title: { en: 'Run it by hand', ru: 'Посчитаем вручную' },
      text: {
        en: 'The machine does nothing magical: it follows the formula. For $\\yellow{a} = 3$: $3^2 = 9$, half of it is $4.5$, minus one is $\\green{3.5}$. So $f(3) = 3.5$, and the point $(3,\\ 3.5)$ lies on the graph. The legend under the picture does this arithmetic for every input.',
        ru: 'Машина не делает ничего волшебного — она выполняет формулу. Для $\\yellow{a} = 3$: $3^2 = 9$, половина — $4.5$, минус один — $\\green{3.5}$. Значит, $f(3) = 3.5$, и точка $(3,\\ 3.5)$ лежит на графике. Подпись под картинкой делает эту арифметику для любого входа.',
      },
      check: {
        q: { en: 'What does the machine give for the input $2$?', ru: 'Что выдаст машина на входе $2$?' },
        options: [{ text: '$0$' }, { text: '$1$', ok: true }, { text: '$3$' }],
        explain: {
          en: '$2^2 = 4$, half is $2$, minus one is $1$. On the picture: go to $2$ on the $x$-axis, up to the curve — the height is $1$.',
          ru: '$2^2 = 4$, половина — $2$, минус один — $1$. На картинке: идём к $2$ на оси $x$, вверх до кривой — высота $1$.',
        },
        reveal: scene => scene.animateParams({ a: 2 }, 1200),
      },
      state: { show: ['f', 'machine'], params: { a: -1 }, window: WINDOW, controls: ['a'] },
    },
    {
      title: { en: 'The picture is all the answers at once', ru: 'Картинка — это все ответы сразу' },
      text: {
        en: 'Feed the machine $-3, -2, \\dots, 3$ and write the answers in a table. Each pair $(x,\\ f(x))$ is a point. Now feed it more and more inputs in between: the points crowd together and merge into a curve. <b>The graph is the set of all points $(x,\\ f(x))$</b> — every answer of the machine, drawn at once.',
        ru: 'Скормим машине $-3, -2, \\dots, 3$ и запишем ответы в таблицу. Каждая пара $(x,\\ f(x))$ — точка. Теперь добавим входы между ними, ещё и ещё: точки теснятся и сливаются в кривую. <b>График — это все точки $(x,\\ f(x))$</b>: все ответы машины, нарисованные разом.',
      },
      try: { en: 'Press ▶ next to $n$ (inputs per unit) to replay.', ru: 'Нажмите ▶ возле $n$ (входов на единицу), чтобы повторить.' },
      state: { show: ['table'], window: WINDOW, controls: ['n'] },
      enter(scene) {
        scene.setParam('n', 1);
        scene.animateParams({ n: 16 }, 6000);
      },
    },
    {
      title: { en: 'Reading backward', ru: 'Читаем назад' },
      text: {
        en: 'The graph also answers the opposite question: <b>which inputs give the output $\\green{c}$?</b> That is solving the equation $f(x) = \\green{c}$. Draw the horizontal line at height $\\green{c}$; where it meets the graph, read the inputs below. Two crossings — two solutions.',
        ru: 'График отвечает и на обратный вопрос: <b>какие входы дают выход $\\green{c}$?</b> Это и есть решение уравнения $f(x) = \\green{c}$. Проведите горизонталь на высоте $\\green{c}$; где она пересекает график, там внизу и читаются входы. Два пересечения — два решения.',
      },
      try: { en: 'Drag the green point on the vertical axis.', ru: 'Тяните зелёную точку на вертикальной оси.' },
      check: {
        q: { en: 'How many solutions does $\\frac{x^2}{2} - 1 = -2$ have?', ru: 'Сколько решений у уравнения $\\frac{x^2}{2} - 1 = -2$?' },
        options: [{ text: '0', ok: true }, { text: '1' }, { text: '2' }],
        explain: {
          en: 'The lowest output of this machine is $-1$ (at $x = 0$): a square is never negative. The line $y = -2$ passes under the whole graph and meets it nowhere.',
          ru: 'Наименьший выход этой машины — $-1$ (при $x = 0$): квадрат не бывает отрицательным. Прямая $y = -2$ проходит под всем графиком и нигде его не встречает.',
        },
        reveal: scene => scene.animateParams({ c: -2 }, 1500),
      },
      state: { show: ['f', 'level'], params: { c: 1 }, window: WINDOW, controls: ['c'] },
    },
    {
      title: { en: 'One input — one output', ru: 'Один вход — один выход' },
      text: {
        en: 'A machine must be predictable: the same input always gives the same <b>single</b> output. On the picture this means a vertical line meets the graph at most once. The <span class="c-blue">parabola</span> passes the test. The <span class="c-purple">circle</span> does not: for one $\\red{x}$ it has two heights, so a circle is a curve, but not the graph of a function $y = f(x)$.',
        ru: 'Машина должна быть предсказуемой: один и тот же вход всегда даёт один и тот же <b>единственный</b> выход. На картинке это значит: вертикальная прямая пересекает график не больше одного раза. <span class="c-blue">Парабола</span> этот тест проходит. <span class="c-purple">Окружность</span> — нет: у одного $\\red{x}$ две высоты. Окружность — кривая, но не график функции $y = f(x)$.',
      },
      try: { en: 'Drag the red line or press ▶ next to $v$.', ru: 'Тяните красную прямую или нажмите ▶ возле $v$.' },
      state: { show: ['f', 'circle', 'vl', 'vtest'], params: { v: 1 }, window: { cx: 0, cy: 0.5, unit: 62 }, controls: ['v'] },
    },
    {
      title: { en: 'Inputs the machine refuses', ru: 'Входы, которые машина не берёт' },
      text: {
        en: 'Some machines cannot take every number. $\\teal{\\sqrt{x}}$ has no real answer for negative $x$, so its graph starts at $0$. $\\orange{\\frac{1}{x}}$ cannot divide by zero, so its graph breaks at $x = 0$. The inputs a function accepts are its <i>domain</i>; on the picture it is the shadow of the graph on the $x$-axis.',
        ru: 'Не всякая машина принимает любое число. У $\\teal{\\sqrt{x}}$ нет действительного ответа для отрицательных $x$, поэтому график начинается в $0$. $\\orange{\\frac{1}{x}}$ не может делить на ноль, и график рвётся при $x = 0$. Входы, которые функция принимает, — её <i>область определения</i>. На картинке это тень графика на оси $x$.',
      },
      try: { en: 'Point at a curve (or tap it) to read its points.', ru: 'Наведите указатель на кривую (или коснитесь её), чтобы прочитать её точки.' },
      check: {
        q: { en: 'Which inputs does $\\sqrt{x - 2}$ accept?', ru: 'Какие входы принимает $\\sqrt{x - 2}$?' },
        options: [{ text: '$x \\ge 0$' }, { text: '$x \\ge 2$', ok: true }, { text: '$x \\ge -2$' }],
        explain: {
          en: 'The root needs $x - 2 \\ge 0$, so $x \\ge 2$. The <span style="color:#f48fb1">pink</span> graph is the root graph moved $2$ to the right — more on moving graphs in the next topic.',
          ru: 'Под корнем нужно $x - 2 \\ge 0$, то есть $x \\ge 2$. <span style="color:#f48fb1">Розовый</span> график — это график корня, сдвинутый на $2$ вправо. О сдвигах графиков — в следующей теме.',
        },
        reveal: scene => { scene.get('sqrt2').visible = true; },
      },
      state: { show: ['sqrt', 'inv'], window: { cx: 1.5, cy: 0.5, unit: 58 }, controls: [] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'Open the scene in the Lab. There you can write your own machine, for example $f(x) = x^3 - 3x$, and then use it: $y = f(x) + 1$, $y = f(2x)$. Point at any curve: the Lab shows the coordinates, the zeros, the peaks and valleys and where curves cross.',
        ru: 'Откройте сцену в Lab. Там можно написать свою машину, например $f(x) = x^3 - 3x$, и пользоваться ею: $y = f(x) + 1$, $y = f(2x)$. Наведите указатель на любую кривую — Lab покажет координаты, нули, вершины, впадины и точки пересечения кривых.',
      },
      state: { show: ['f', 'machine'], params: { a: 2.5 }, window: WINDOW, controls: ['a'] },
    },
  ],
};
