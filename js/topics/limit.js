// What a limit is. A graph with a hole (0/0), values approaching from both sides, sin x / x that algebra
// cannot simplify, the ε–δ corridor drawn as two bands, limits that do not exist (a jump, endless
// oscillation) and a limit at infinity that turns out to be the number e.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { explorer } from '../views/explore.js';

const WHITE = '#ffffff';
const HOLE = { cx: 1, cy: 2, unit: 70 };
const SINC = { cx: 0, cy: 0.4, unit: 80 };
const g = x => (x * x - 1) / (x - 1);
const sinc = x => Math.sin(x) / x;
const sig = v => fmt(Number(v.toPrecision(5)));

// Widest δ with |sin x / x − 1| < ε for 0 < |x| < δ (1 − sin x / x grows on (0, π))
function deltaFor(eps) {
  let lo = 0, hi = Math.PI;
  for (let k = 0; k < 50; k++) {
    const m = (lo + hi) / 2;
    if (1 - sinc(m) < eps) lo = m; else hi = m;
  }
  return lo;
}

export default {
  view: '2d',
  view2d: HOLE,

  setup(scene) {
    scene.add('y = (x^2 - 1)/(x - 1)', { id: 'g', color: 'blue' });
    scene.add('y = sin(x)/x', { id: 'sinc', color: 'teal', visible: false });
    scene.add('y = x', { id: 'diag', color: 'grey', dim: true, visible: false });
    scene.add('y = sign(x)', { id: 'sign', color: 'purple', visible: false });
    scene.add('y = sin(1/x)', { id: 'osc', color: 'orange', visible: false });
    scene.add('y = (1 + 1/x)^x {x > 0}', { id: 'comp', color: 'green', visible: false });
    scene.ensureParam('n', 0, { min: 0, max: 3 });
    scene.ensureParam('epsilon', 0.3, { min: 0.02, max: 0.6, step: 0.005 });
    scene.ensureParam('X', 1, { min: 1, max: 1000, step: 1 });

    const hole = (id, x, y, color) => ({ id, draw2d(p) { p.ring(x, y, color, 5.5); } });

    scene.custom.push(
      hole('holeG', 1, 2, COLORS.blue),
      {
        // Two inputs closing in on 1 from the left and from the right: d = 10^(−n)
        id: 'approach',
        draw2d(p, sc, s) {
          const d = 10 ** -s.n;
          [[1 - d, COLORS.yellow], [1 + d, COLORS.green]].forEach(([x, c]) => {
            p.line(x, 0, x, g(x), c + '88', { width: 1.2, dash: [3, 4] });
            p.dot(x, g(x), c, 6);
            p.dot(x, 0, c, 4);
          });
        },
        legend: s => {
          const d = 10 ** -s.n;
          return `g(\\yellow{${sig(1 - d)}}) = \\yellow{${sig(g(1 - d))}} \\qquad g(\\green{${sig(1 + d)}}) = \\green{${sig(g(1 + d))}}`;
        },
      },
      hole('holeS', 0, 1, COLORS.teal),
      {
        // The ε-corridor around the limit 1 and the δ-window around 0 that keeps the graph inside it
        id: 'corridor',
        draw2d(p, sc, s) {
          const e = s.epsilon, d = deltaFor(e);
          p.rect(-Infinity, 1 - e, Infinity, 1 + e, COLORS.yellow + '1f');
          p.line(p.xr[0], 1 + e, p.xr[1], 1 + e, COLORS.yellow + '99', { width: 1, dash: [5, 4] });
          p.line(p.xr[0], 1 - e, p.xr[1], 1 - e, COLORS.yellow + '99', { width: 1, dash: [5, 4] });
          p.rect(-d, -Infinity, d, Infinity, COLORS.green + '1a');
          p.vline(-d, COLORS.green + '99', 1, [5, 4]);
          p.vline(d, COLORS.green + '99', 1, [5, 4]);
          p.curve(sinc, COLORS.green, 5, -d, d);
          p.ring(0, 1, COLORS.green, 5.5);
          p.tex('eps', '\\yellow{1 + \\varepsilon}', p.xr[0], 1 + e, COLORS.yellow, { dx: 10, dy: -12 });
          p.tex('delta', '\\green{\\delta}', d, p.yr[0], COLORS.green, { dx: 8, dy: -16 });
        },
        legend: s => `\\yellow{\\varepsilon = ${fmt(Math.round(s.epsilon * 1000) / 1000)}} \\;\\Rightarrow\\; \\green{\\delta = ${fmt(Math.round(deltaFor(s.epsilon) * 1000) / 1000)}}`,
      },
      {
        // sign x: two different answers from the two sides, and its actual value at 0
        id: 'signMarks',
        draw2d(p) {
          p.ring(0, -1, COLORS.purple, 5.5);
          p.ring(0, 1, COLORS.purple, 5.5);
          p.dot(0, 0, COLORS.purple, 5.5);
          p.arrow(-1.6, -1.35, -0.25, -1.35, COLORS.yellow, { width: 1.8 });
          p.arrow(1.6, 1.35, 0.25, 1.35, COLORS.green, { width: 1.8 });
        },
        legend: () => '\\yellow{\\lim_{x \\to 0^-} \\operatorname{sign} x = -1} \\qquad \\green{\\lim_{x \\to 0^+} \\operatorname{sign} x = 1}',
      },
      {
        // Inputs 1 / (π/2 + kπ) run to 0, the outputs keep jumping between 1 and −1
        id: 'oscPts',
        draw2d(p) {
          for (let k = 0; k < 40; k++) {
            const x = 1 / (Math.PI / 2 + k * Math.PI);
            p.dot(x, k % 2 ? -1 : 1, k % 2 ? COLORS.green : COLORS.yellow, k < 6 ? 6 : 4);
          }
        },
        legend: () => 'x = \\frac{1}{\\frac{\\pi}{2} + k\\pi} \\to 0: \\quad \\sin\\frac{1}{x} = \\yellow{1},\\ \\green{-1},\\ \\yellow{1},\\ \\green{-1},\\ \\dots',
      },
      {
        // The limit at infinity: the line y = e and the value at X
        id: 'eline',
        draw2d(p, sc, s) {
          p.line(p.xr[0], Math.E, p.xr[1], Math.E, 'rgba(255,255,255,0.45)', { width: 1.2, dash: [6, 5] });
          p.tex('e', 'e \\approx 2.71828', p.xr[1], Math.E, WHITE, { dx: -12, dy: -14, align: 'right' });
          const X = s.X, v = (1 + 1 / X) ** X;
          if (X <= p.xr[1]) p.dot(X, v, COLORS.green, 6);
        },
        legend: s => {
          const X = Math.round(s.X);
          return `x = ${X}:\\ \\ \\left(1 + \\frac{1}{${X}}\\right)^{${X}} = \\green{${((1 + 1 / X) ** X).toFixed(5)}}`;
        },
      },
      explorer(),
    );
  },

  steps: [
    {
      title: { en: 'A graph with a hole', ru: 'График с дыркой' },
      text: {
        en: 'Meet $\\blue{g(x) = \\frac{x^2 - 1}{x - 1}}$. Try $x = 1$: $\\frac{0}{0}$ — no answer, the machine refuses. Everywhere else you may cancel: $\\frac{(x - 1)(x + 1)}{x - 1} = x + 1$. So the graph is the line $y = x + 1$ with one point missing: a hole at $(1,\\ 2)$.',
        ru: 'Знакомьтесь: $\\blue{g(x) = \\frac{x^2 - 1}{x - 1}}$. Подставим $x = 1$: $\\frac{0}{0}$ — ответа нет, машина отказывается. Во всех остальных точках можно сократить: $\\frac{(x - 1)(x + 1)}{x - 1} = x + 1$. Значит, график — прямая $y = x + 1$, из которой выколота одна точка: дырка в $(1,\\ 2)$.',
      },
      try: { en: 'Point at the line near the hole and read the heights.', ru: 'Наведите указатель на прямую возле дырки и посмотрите на высоты.' },
      hint: {
        title: { en: 'Why is 0/0 not just 0 or 1?', ru: 'Почему 0/0 — это не 0 и не 1?' },
        text: {
          en: '$\\frac{6}{2} = 3$ because $3 \\cdot 2 = 6$. For $\\frac{0}{0}$ we would need a number that gives $0$ when multiplied by $0$ — and every number does. Too many answers is as bad as none, so $\\frac{0}{0}$ is left undefined. The limit is how we still find the one answer that «fits».',
          ru: '$\\frac{6}{2} = 3$, потому что $3 \\cdot 2 = 6$. Для $\\frac{0}{0}$ нужно число, которое при умножении на $0$ даёт $0$, — а таких чисел сколько угодно. Слишком много ответов так же плохо, как ни одного, поэтому $\\frac{0}{0}$ не определено. Предел — способ всё-таки найти тот единственный ответ, который «подходит».',
        },
      },
      state: { show: ['g', 'holeG'], window: HOLE, controls: [] },
    },
    {
      title: { en: 'Closer and closer', ru: 'Всё ближе и ближе' },
      text: {
        en: 'We cannot put in $1$ itself, but we can come as close as we like: $0.9,\\ 0.99,\\ 0.999$ from the left, $1.1,\\ 1.01,\\ 1.001$ from the right. The outputs close in on one number from both sides — on $2$. That is written $$\\lim_{x \\to 1} g(x) = 2$$ and read «the limit of $g$ as $x$ tends to $1$ is $2$».',
        ru: 'Подставить саму $1$ нельзя, но можно подойти сколь угодно близко: $0.9,\\ 0.99,\\ 0.999$ слева и $1.1,\\ 1.01,\\ 1.001$ справа. Выходы с обеих сторон подбираются к одному числу — к $2$. Это записывают так: $$\\lim_{x \\to 1} g(x) = 2$$ и читают «предел $g$ при $x$, стремящемся к $1$, равен $2$».',
      },
      try: { en: 'Press ▶ next to $n$: the inputs are $1 \\pm 10^{-n}$.', ru: 'Нажмите ▶ возле $n$: входы — $1 \\pm 10^{-n}$.' },
      check: {
        q: { en: 'So what is $g(1)$?', ru: 'Так чему равно $g(1)$?' },
        options: [{ text: '$2$' }, { text: '$0$' }, { text: { en: 'it does not exist', ru: 'его нет' }, ok: true }],
        explain: {
          en: '$g(1)$ is still $\\frac00$ — the hole is still there. The limit is $2$, but the limit is about the <b>neighbours</b> of $1$, never about the point itself. A function may have a limit at a point where it does not exist, or where its value is something else.',
          ru: '$g(1)$ по-прежнему $\\frac00$ — дырка никуда не делась. Предел равен $2$, но предел говорит о <b>соседях</b> точки $1$, а не о ней самой. У функции может быть предел там, где её нет, или где её значение совсем другое.',
        },
      },
      state: { show: ['g', 'holeG', 'approach'], window: { cx: 1, cy: 2, unit: 160 }, controls: ['n'] },
      enter(scene) {
        scene.setParam('n', 0);
        scene.animateParams({ n: 3 }, 5000);
      },
    },
    {
      title: { en: 'When algebra does not help', ru: 'Когда алгебра не помогает' },
      text: {
        en: '$\\teal{\\frac{\\sin x}{x}}$ at $x = 0$ is again $\\frac00$, but nothing cancels here. The graph still knows the answer: it runs straight into the hole at height $1$. Near zero $\\sin x$ is almost the same as $x$ — the grey line — so their ratio is almost $1$.',
        ru: '$\\teal{\\frac{\\sin x}{x}}$ при $x = 0$ — снова $\\frac00$, но сократить здесь нечего. А график ответ всё равно знает: он упирается прямо в дырку на высоте $1$. Около нуля $\\sin x$ почти совпадает с $x$ (серая прямая), поэтому их отношение почти $1$.',
      },
      check: {
        q: { en: '$\\lim_{x \\to 0} \\frac{\\sin x}{x} = ?$', ru: '$\\lim_{x \\to 0} \\frac{\\sin x}{x} = ?$' },
        options: [{ text: '$0$' }, { text: '$1$', ok: true }, { text: { en: 'no limit', ru: 'предела нет' } }],
        explain: {
          en: 'Zoom in: at $x = 0.01$ the value is $0.99998$. The closer to $0$, the closer to $1$. This limit is behind the derivative of $\\sin x$ — and behind the fact that a small arc is almost a straight segment.',
          ru: 'Приблизим: при $x = 0.01$ значение $0.99998$. Чем ближе к $0$, тем ближе к $1$. На этом пределе держится производная $\\sin x$ — и то, что маленькая дуга почти не отличается от отрезка.',
        },
        reveal: (scene, stage) => { if (stage.p2) stage.p2.setView({ cx: 0, cy: 1, unit: 900 }, 2200); },
      },
      state: { show: ['sinc', 'diag', 'holeS'], window: SINC, controls: [] },
    },
    {
      title: { en: 'As close as you like: a corridor', ru: '«Сколь угодно близко»: коридор' },
      text: {
        en: '«Close» needs to be made exact. Draw a <span class="c-yellow">corridor</span> of half-width $\\varepsilon$ around the limit $1$. The limit is $1$ if for <b>any</b> corridor, however narrow, there is a <span class="c-green">window</span> $0 < |x| < \\delta$ around $0$ where the whole graph stays inside the corridor. Narrow the corridor — the window shrinks, but it always exists. That is the precise definition of a limit, the famous «ε–δ».',
        ru: '«Близко» нужно сделать точным. Нарисуем <span class="c-yellow">коридор</span> полуширины $\\varepsilon$ вокруг предела $1$. Предел равен $1$, если для <b>любого</b> коридора, как угодно узкого, найдётся <span class="c-green">окно</span> $0 < |x| < \\delta$ вокруг $0$, где весь график лежит внутри коридора. Сужаем коридор — окно уменьшается, но оно есть всегда. Это и есть точное определение предела, знаменитое «эпсилон–дельта».',
      },
      try: { en: 'Make $\\varepsilon$ smaller and watch $\\delta$.', ru: 'Уменьшайте $\\varepsilon$ и следите за $\\delta$.' },
      hint: {
        title: { en: 'Why so complicated?', ru: 'Зачем так сложно?' },
        text: {
          en: '«Gets closer» is not enough: $\\frac{1}{x}$ also gets closer to $-5$ as $x$ grows, only it never gets <i>close</i>. The corridor is a challenge game: you name any accuracy $\\varepsilon$, I answer with a $\\delta$ that guarantees it. If I can always answer, the limit is $1$.',
          ru: '«Приближается» — мало: $\\frac{1}{x}$ при росте $x$ тоже «приближается» к $-5$, только никогда не становится к нему <i>близко</i>. Коридор — это игра-вызов: вы называете любую точность $\\varepsilon$, я отвечаю окном $\\delta$, которое её гарантирует. Если я всегда могу ответить — предел равен $1$.',
        },
      },
      state: { show: ['sinc', 'corridor'], params: { epsilon: 0.3 }, window: SINC, controls: ['epsilon'] },
    },
    {
      title: { en: 'When there is no limit: a jump', ru: 'Когда предела нет: скачок' },
      text: {
        en: '$\\purple{\\operatorname{sign} x}$ is $-1$ for negative $x$, $1$ for positive, and $0$ at zero. Come to $0$ from the <span class="c-yellow">left</span> — you get $-1$; from the <span class="c-green">right</span> — $1$. Two different answers, so there is no limit at $0$: no corridor narrower than $1$ can hold both sides.',
        ru: '$\\purple{\\operatorname{sign} x}$ равна $-1$ для отрицательных $x$, $1$ для положительных и $0$ в нуле. Подходим к $0$ <span class="c-yellow">слева</span> — получаем $-1$, <span class="c-green">справа</span> — $1$. Два разных ответа, значит, предела в нуле нет: никакой коридор уже $1$ не вместит обе стороны.',
      },
      check: {
        q: { en: 'Does it help that $\\operatorname{sign} 0 = 0$ is defined?', ru: 'Помогает ли то, что $\\operatorname{sign} 0 = 0$ определено?' },
        options: [{ text: { en: 'yes, the limit is 0', ru: 'да, предел равен 0' } }, { text: { en: 'no', ru: 'нет' }, ok: true }],
        explain: {
          en: 'The value at the point itself plays no role in the limit — only the neighbours do, and they disagree.',
          ru: 'Значение в самой точке на предел не влияет — важны только соседи, а они не договорились.',
        },
      },
      state: { show: ['sign', 'signMarks'], window: { cx: 0, cy: 0, unit: 90 }, controls: [] },
    },
    {
      title: { en: 'When there is no limit: endless waves', ru: 'Когда предела нет: бесконечные волны' },
      text: {
        en: '$\\orange{\\sin \\frac{1}{x}}$ near $0$ swings between $-1$ and $1$ faster and faster; next to zero the waves merge into a solid band. Follow the inputs $x = \\frac{1}{\\pi/2 + k\\pi}$: they run to $0$, but the outputs keep jumping, $\\yellow{1},\\ \\green{-1},\\ \\yellow{1},\\ \\green{-1}, \\dots$ Every window around $0$ holds both $1$ and $-1$, so no narrow corridor fits: there is no limit.',
        ru: '$\\orange{\\sin \\frac{1}{x}}$ около $0$ качается между $-1$ и $1$ всё быстрее; рядом с нулём волны сливаются в сплошную полосу. Проследим за входами $x = \\frac{1}{\\pi/2 + k\\pi}$: они бегут к $0$, а выходы всё прыгают: $\\yellow{1},\\ \\green{-1},\\ \\yellow{1},\\ \\green{-1}, \\dots$ В любом окне вокруг $0$ есть и $1$, и $-1$, поэтому узкий коридор не подходит: предела нет.',
      },
      check: {
        q: { en: 'And $x \\sin \\frac{1}{x}$ — the same waves, squeezed by $x$. Does it have a limit at $0$?', ru: 'А $x \\sin \\frac{1}{x}$ — те же волны, зажатые множителем $x$. Есть ли у неё предел в $0$?' },
        options: [{ text: { en: 'yes, 0', ru: 'да, 0' }, ok: true }, { text: { en: 'no', ru: 'нет' } }],
        explain: {
          en: 'Yes: the swings are at most $|x|$ high, and $|x| \\to 0$. The waves stay, but they are trapped between $y = x$ and $y = -x$ and pressed into $0$. Try it in the Lab.',
          ru: 'Да: размах колебаний не больше $|x|$, а $|x| \\to 0$. Волны остаются, но они зажаты между $y = x$ и $y = -x$ и вдавлены в $0$. Проверьте в Lab.',
        },
      },
      state: { show: ['osc', 'oscPts'], window: { cx: 0.15, cy: 0, unit: 260 }, controls: [] },
    },
    {
      title: { en: 'At infinity', ru: 'На бесконечности' },
      text: {
        en: 'A limit can also be taken as $x$ grows without bound. Take $\\green{\\left(1 + \\frac1x\\right)^x}$: the base gets closer to $1$, the power gets bigger — who wins? Neither. The values settle on one number, $2.71828\\ldots$ This is the number $e$: $$\\lim_{x \\to \\infty}\\left(1 + \\frac{1}{x}\\right)^x = e.$$',
        ru: 'Предел можно брать и когда $x$ неограниченно растёт. Возьмём $\\green{\\left(1 + \\frac1x\\right)^x}$: основание всё ближе к $1$, показатель всё больше — кто победит? Никто. Значения устанавливаются на одном числе, $2.71828\\ldots$ Это число $e$: $$\\lim_{x \\to \\infty}\\left(1 + \\frac{1}{x}\\right)^x = e.$$',
      },
      try: { en: 'Press ▶ next to $X$ and watch the digits settle.', ru: 'Нажмите ▶ возле $X$ и смотрите, как устанавливаются цифры.' },
      check: {
        q: { en: 'What does $1^\\infty$ give here?', ru: 'Что даёт здесь «$1^\\infty$»?' },
        options: [{ text: '$1$' }, { text: '$\\infty$' }, { text: '$e$', ok: true }],
        explain: {
          en: 'Neither $1$ nor $\\infty$: the base is not exactly $1$, and the tiny excess $\\frac1x$ is raised to a huge power. The two effects balance exactly at $e$. Where this number comes from and why it matters is the next topic.',
          ru: 'Ни $1$, ни $\\infty$: основание не ровно $1$, а крошечный излишек $\\frac1x$ возводится в огромную степень. Два эффекта уравновешиваются ровно на $e$. Откуда это число и почему оно важно — следующая тема.',
        },
        reveal: scene => scene.animateParams({ X: 1000 }, 3000),
      },
      state: { show: ['comp', 'eline'], params: { X: 1 }, window: { cx: 9, cy: 1.8, unit: 42 }, controls: ['X'] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'In the Lab try $y = \\frac{x^2 - 4}{x - 2}$ (where is the hole?), $y = \\frac{1 - \\cos x}{x^2}$ (what is its limit at $0$?), $y = x \\sin \\frac1x$ (the waves are squeezed — is there a limit now?). And look back at <a href="#topic/derivative">the derivative</a>: $f\'(a)$ is exactly a limit of $\\frac{\\Delta y}{\\Delta x}$, with the hole at $h = 0$.',
        ru: 'В Lab попробуйте $y = \\frac{x^2 - 4}{x - 2}$ (где дырка?), $y = \\frac{1 - \\cos x}{x^2}$ (какой у неё предел в $0$?), $y = x \\sin \\frac1x$ (волны зажаты — есть ли теперь предел?). И загляните в <a href="#topic/derivative">тему о производной</a>: $f\'(a)$ — это ровно предел $\\frac{\\Delta y}{\\Delta x}$ с дыркой при $h = 0$.',
      },
      state: { show: ['sinc', 'corridor'], params: { epsilon: 0.1 }, window: SINC, controls: ['epsilon'] },
    },
  ],
};
