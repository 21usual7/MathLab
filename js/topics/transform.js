// Shifting and stretching graphs. One function f and a marked point P on its graph; each change of the
// formula moves every point by the same rule, and P shows where. The counter-intuitive ones —
// f(x − h) moves right, f(2x) squeezes — are asked as predictions first.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { explorer } from '../views/explore.js';
import { t } from '../core/i18n.js';

const WHITE = '#ffffff';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r2 = v => Math.round(v * 100) / 100;
const ROOT = { cx: 1.5, cy: 1.2, unit: 52 };
const P = [4, 2]; // on y = √x

// Where P goes under the transformation that is on the stage
const MOVES = {
  up: s => [P[0], P[1] + s.k],
  shift: s => [P[0] + s.h, P[1]],
  stretch: s => [P[0], s.a * P[1]],
  mirror: () => [-P[0], P[1]],
};

export default {
  view: '2d',
  view2d: ROOT,

  setup(scene) {
    scene.add('f(x) = sqrt(x)', { id: 'f', color: 'blue' });
    scene.add('y = f(x)', { id: 'ghost', color: 'grey', dim: true, visible: false });
    scene.add('y = f(x) + k', { id: 'up', color: 'yellow', visible: false });
    scene.add('y = f(x - h)', { id: 'shift', color: 'green', visible: false });
    scene.add('y = a f(x)', { id: 'stretch', color: 'purple', visible: false });
    scene.add('y = f(-x)', { id: 'mirror', color: 'red', visible: false });
    scene.add('y = sin(x)', { id: 'sin', color: 'grey', dim: true, visible: false });
    scene.add('y = sin(b x)', { id: 'sinb', color: 'teal', visible: false });
    scene.add('y = x^2', { id: 'par', color: 'grey', dim: true, visible: false });
    scene.add('y = a (x - h)^2 + k', { id: 'vertex', color: 'blue', visible: false });
    // Tasks: a parabola to place, and graphs whose formulas are to be found (their formulas are not in the legend)
    scene.add('y = (x - h)^2 + k', { id: 'parT', color: 'blue', visible: false, legend: false });
    scene.add('y = sqrt(x - 3)', { id: 'goal1', color: 'blue', visible: false, legend: false });
    scene.add('y = -(x - 1)^2 + 2', { id: 'goal2', color: 'blue', visible: false, legend: false });
    scene.add('y = sin(2x)', { id: 'goal3', color: 'blue', visible: false, legend: false });
    scene.ensureParam('k', 0, { min: -3, max: 3 });
    scene.ensureParam('h', 0, { min: -4, max: 4 });
    scene.ensureParam('a', 1, { min: -3, max: 3 });
    scene.ensureParam('b', 1, { min: 0.25, max: 4 });

    scene.custom.push(
      {
        // The marked point P and its image P'
        id: 'marker',
        draw2d(p, sc) {
          const s = sc.scope();
          const move = Object.keys(MOVES).find(id => sc.get(id).visible);
          p.dot(...P, move ? COLORS.grey : COLORS.blue, 6);
          p.tex('P', 'P', ...P, move ? COLORS.grey : WHITE, { dx: -8, dy: -14, align: 'right' });
          if (!move) return;
          const Q = MOVES[move](s), color = sc.get(move).color;
          p.arrow(...P, ...Q, 'rgba(255,255,255,0.7)', { width: 1.6, dash: [5, 4] });
          p.dot(...Q, color, 6);
          const right = p.sx(Q[0]) > p.w - 130; // near the right edge the label goes to the left of the point
          p.tex('Q', `P' = \\left(${fmt(r2(Q[0]))},\\ ${fmt(r2(Q[1]))}\\right)`, ...Q, color,
            { dx: right ? -10 : 10, dy: Q[1] >= 0 ? -16 : 16, align: right ? 'right' : 'left' });
        },
      },
      {
        // One period of sin(bx), as a bracket under the wave
        id: 'period',
        draw2d(p, sc, s) {
          const T = 2 * Math.PI / s.b, y = -1.45;
          p.arrow(T / 2, y, 0, y, COLORS.teal, { width: 1.6 });
          p.arrow(T / 2, y, T, y, COLORS.teal, { width: 1.6 });
          p.tex('T', 'T', T / 2, y, COLORS.teal, { dx: 0, dy: 14, align: 'center' });
        },
        legend: s => `\\teal{T = \\frac{2\\pi}{b} = ${fmt(r2(2 * Math.PI / s.b))}}`,
      },
      {
        // The vertex of a(x − h)² + k, draggable, and the axis of symmetry through it
        id: 'top',
        draw2d(p, sc, s) {
          p.vline(s.h, 'rgba(255,255,255,0.22)', 1.2, [4, 5]);
          p.tex('vertex', `(\\green{h},\\ \\yellow{k})`, s.h, s.k, WHITE, { dx: 12, dy: s.a >= 0 ? 16 : -16 });
          p.handle(s.h, s.k, WHITE, (x, y) => {
            sc.play('h', false); sc.play('k', false);
            sc.setParam('h', clamp(Math.round(x * 4) / 4, -4, 4));
            sc.setParam('k', clamp(Math.round(y * 4) / 4, -3, 3));
          });
        },
        legend: s => `${t({ en: '\\text{vertex}', ru: '\\text{вершина}' })}\\ (\\green{h},\\ \\yellow{k}) = (${fmt(r2(s.h))},\\ ${fmt(r2(s.k))})`,
      },
      {
        // The vertex to drag in the tasks: no numbers next to it, the student has to know where it goes
        id: 'dragV',
        draw2d(p, sc, s) {
          p.handle(s.h, s.k, WHITE, (x, y) => {
            sc.setParam('h', clamp(Math.round(x * 4) / 4, -5, 5));
            sc.setParam('k', clamp(Math.round(y * 4) / 4, -4, 4));
          });
        },
      },
      explorer(),
    );
  },

  steps: [
    {
      title: { en: 'One function, many graphs', ru: 'Одна функция — много графиков' },
      text: {
        en: 'Here is $\\blue{f(x) = \\sqrt{x}}$ and a point $P = (4,\\ 2)$ on its graph: $\\sqrt{4} = 2$. Now we will change the formula a little — add a number here, multiply there — and watch what happens to the picture. Every change moves <b>all</b> points by the same rule, so it is enough to follow one: $P$.',
        ru: 'Вот $\\blue{f(x) = \\sqrt{x}}$ и точка $P = (4,\\ 2)$ на её графике: $\\sqrt{4} = 2$. Сейчас будем понемногу менять формулу — где-то прибавим число, где-то умножим — и смотреть, что происходит с картинкой. Каждое изменение двигает <b>все</b> точки по одному правилу, поэтому достаточно следить за одной — за $P$.',
      },
      state: { show: ['f', 'marker'], params: { k: 0, h: 0, a: 1 }, window: ROOT, controls: [] },
    },
    {
      title: { en: 'Up and down: f(x) + k', ru: 'Вверх и вниз: f(x) + k' },
      text: {
        en: 'Add $\\yellow{k}$ to every output: $\\yellow{y = f(x) + k}$. Each point keeps its $x$ and rises by $k$; the whole graph moves up (down when $k < 0$). No surprises here: the change is outside $f$, on the output, and the graph moves along the output axis.',
        ru: 'Прибавим $\\yellow{k}$ к каждому выходу: $\\yellow{y = f(x) + k}$. Каждая точка сохраняет свой $x$ и поднимается на $k$; весь график едет вверх (вниз, если $k < 0$). Здесь сюрпризов нет: изменение снаружи $f$, на выходе, и график движется вдоль оси выходов.',
      },
      try: { en: 'Press ▶ next to $k$.', ru: 'Нажмите ▶ возле $k$.' },
      state: { show: ['ghost', 'up', 'marker'], params: { k: 1.5 }, window: ROOT, controls: ['k'] },
    },
    {
      title: { en: 'Left and right: f(x − h)', ru: 'Влево и вправо: f(x − h)' },
      text: {
        en: 'Now change the input: $\\green{y = f(x - h)}$. The machine $f$ gets $x - h$ instead of $x$.',
        ru: 'Теперь изменим вход: $\\green{y = f(x - h)}$. Машина $f$ получает $x - h$ вместо $x$.',
      },
      check: {
        q: { en: 'Where does the graph of $y = f(x - 2)$ go?', ru: 'Куда сдвинется график $y = f(x - 2)$?' },
        options: [{ text: { en: '2 to the left', ru: 'на 2 влево' } }, { text: { en: '2 to the right', ru: 'на 2 вправо' }, ok: true }],
        explain: {
          en: 'To the right — against the minus sign. The new function shows the height $2$ when $x - 2 = 4$, that is at $x = 6$: everything happens $2$ units <b>later</b>. That is why $\\sqrt{x - 2}$ starts at $x = 2$.',
          ru: 'Вправо — вопреки знаку минус. Новая функция выдаёт высоту $2$, когда $x - 2 = 4$, то есть при $x = 6$: всё происходит на $2$ единицы <b>позже</b>. Поэтому $\\sqrt{x - 2}$ и начинается в $x = 2$.',
        },
        reveal: scene => scene.animateParams({ h: 2 }, 1600),
      },
      hint: {
        title: { en: 'Still feels backward?', ru: 'Всё равно кажется, что наоборот?' },
        text: {
          en: 'Ask «where is the new graph equal to $2$?» The machine $f$ gives $2$ only for the input $4$. The new function feeds $f$ with $x - 2$, so we need $x - 2 = 4$, which means $x = 6$. The point $(4,\\ 2)$ has moved to $(6,\\ 2)$ — right. The minus inside is a delay, not a direction.',
          ru: 'Спросите: «где новый график равен $2$?» Машина $f$ выдаёт $2$ только на входе $4$. Новая функция кормит $f$ числом $x - 2$, значит нужно $x - 2 = 4$, то есть $x = 6$. Точка $(4,\\ 2)$ переехала в $(6,\\ 2)$ — вправо. Минус внутри — это задержка, а не направление.',
        },
      },
      state: { show: ['ghost', 'shift', 'marker'], params: { h: 0, k: 0 }, window: ROOT, controls: ['h'] },
    },
    {
      title: { en: 'Stretch and flip: a · f(x)', ru: 'Растяжение и переворот: a · f(x)' },
      text: {
        en: 'Multiply the output by $\\purple{a}$: $\\purple{y = a f(x)}$. Every height becomes $a$ times bigger, so the graph stretches away from the $x$-axis ($a > 1$) or presses toward it ($0 < a < 1$). Points on the axis stay where they are: zero times anything is zero.',
        ru: 'Умножим выход на $\\purple{a}$: $\\purple{y = a f(x)}$. Каждая высота становится в $a$ раз больше, и график растягивается от оси $x$ ($a > 1$) или прижимается к ней ($0 < a < 1$). Точки на самой оси остаются на месте: ноль, умноженный на что угодно, — ноль.',
      },
      check: {
        q: { en: 'What happens when $a = -1$?', ru: 'Что будет при $a = -1$?' },
        options: [
          { text: { en: 'flips upside down', ru: 'перевернётся вверх ногами' }, ok: true },
          { text: { en: 'flips left to right', ru: 'отразится слева направо' } },
          { text: { en: 'nothing', ru: 'ничего' } },
        ],
        explain: {
          en: 'Every height changes its sign: $2$ becomes $-2$. The graph is mirrored in the $x$-axis — upside down. A left–right mirror needs a change of the <i>input</i>; that is the next step.',
          ru: 'Каждая высота меняет знак: $2$ становится $-2$. График отражается относительно оси $x$ — вверх ногами. Чтобы отразить слева направо, нужно менять <i>вход</i>; это следующий шаг.',
        },
        reveal: scene => scene.animateParams({ a: -1 }, 1600),
      },
      state: { show: ['ghost', 'stretch', 'marker'], params: { a: 2, h: 0 }, window: ROOT, controls: ['a'] },
    },
    {
      title: { en: 'A mirror: f(−x)', ru: 'Зеркало: f(−x)' },
      text: {
        en: '$\\red{y = f(-x)}$ feeds the machine the opposite number. What $f$ did at $4$, the new function does at $-4$: the graph is mirrored in the vertical axis. Now $\\sqrt{-x}$ accepts only $x \\le 0$ — and that is fine: for $x = -4$ the input of the root is $4$.',
        ru: '$\\red{y = f(-x)}$ кормит машину противоположным числом. Что $f$ делала в точке $4$, новая функция делает в точке $-4$: график отражается относительно вертикальной оси. Теперь $\\sqrt{-x}$ принимает только $x \\le 0$, и это нормально: при $x = -4$ под корнем $4$.',
      },
      state: { show: ['ghost', 'mirror', 'marker'], window: ROOT, controls: [] },
    },
    {
      title: { en: 'Squeeze: f(bx)', ru: 'Сжатие: f(bx)' },
      text: {
        en: 'Multiplying the input is easier to see on a wave. $\\sin x$ repeats every $2\\pi$; that length is its period $T$. Now take $\\teal{y = \\sin(bx)}$.',
        ru: 'Умножение входа лучше видно на волне. $\\sin x$ повторяется через каждые $2\\pi$ — это его период $T$. Возьмём $\\teal{y = \\sin(bx)}$.',
      },
      check: {
        q: { en: 'Are the waves of $\\sin(2x)$ wider or narrower than those of $\\sin x$?', ru: 'Волны $\\sin(2x)$ шире или уже, чем у $\\sin x$?' },
        options: [{ text: { en: 'wider', ru: 'шире' } }, { text: { en: 'narrower', ru: 'уже' }, ok: true }],
        explain: {
          en: 'Narrower: the input runs twice as fast, so the sine reaches each value at <b>half</b> the $x$. The period becomes $\\frac{2\\pi}{2} = \\pi$. Like $f(x - h)$, a change inside acts «against intuition»: $b = 2$ squeezes, $b = \\frac12$ stretches.',
          ru: 'Уже: вход бежит вдвое быстрее, и синус доходит до каждого значения при <b>вдвое меньшем</b> $x$. Период становится $\\frac{2\\pi}{2} = \\pi$. Как и с $f(x - h)$, изменение внутри действует «наоборот»: $b = 2$ сжимает, $b = \\frac12$ растягивает.',
        },
        reveal: scene => scene.animateParams({ b: 2 }, 1600),
      },
      state: { show: ['sin', 'sinb', 'period'], params: { b: 1 }, window: { cx: 2.5, cy: 0, unit: 58 }, controls: ['b'] },
    },
    {
      title: { en: 'All together: a(x − h)² + k', ru: 'Всё вместе: a(x − h)² + k' },
      text: {
        en: 'Now the formula from school makes sense. $\\blue{y = a(x - h)^2 + k}$ is the parabola $y = x^2$ moved $\\green{h}$ to the right, stretched $a$ times and lifted by $\\yellow{k}$. So its vertex is at $(\\green{h},\\ \\yellow{k})$ — no need to memorise it, you can see it.',
        ru: 'Теперь школьная формула становится понятной. $\\blue{y = a(x - h)^2 + k}$ — это парабола $y = x^2$, сдвинутая на $\\green{h}$ вправо, растянутая в $a$ раз и поднятая на $\\yellow{k}$. Поэтому её вершина — в точке $(\\green{h},\\ \\yellow{k})$. Запоминать не нужно: это видно.',
      },
      try: { en: 'Drag the vertex; play $a$.', ru: 'Тяните вершину; запустите $a$.' },
      check: {
        q: { en: 'Where is the vertex of $y = (x + 3)^2 - 1$?', ru: 'Где вершина параболы $y = (x + 3)^2 - 1$?' },
        options: [{ text: '$(3,\\ -1)$' }, { text: '$(-3,\\ -1)$', ok: true }, { text: '$(-3,\\ 1)$' }],
        explain: {
          en: '$x + 3 = x - (-3)$, so $h = -3$: three to the <b>left</b>. And $k = -1$: one down.',
          ru: '$x + 3 = x - (-3)$, значит $h = -3$ — на три <b>влево</b>. А $k = -1$ — на один вниз.',
        },
        reveal: scene => scene.animateParams({ a: 1, h: -3, k: -1 }, 1600),
      },
      state: { show: ['par', 'vertex', 'top'], params: { a: 1, h: 1, k: 2 }, window: { cx: 0, cy: 1.5, unit: 46 }, controls: ['a', 'h', 'k'] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'In the Lab write any function, say $f(x) = x^3 - 3x$, and then $y = a f(b(x - h)) + k$: four sliders, four moves. A rule to keep: <b>changes outside $f$ act on heights as written; changes inside act on $x$ the opposite way.</b>',
        ru: 'В Lab напишите любую функцию, например $f(x) = x^3 - 3x$, а затем $y = a f(b(x - h)) + k$: четыре слайдера, четыре движения. Правило на память: <b>изменения снаружи $f$ действуют на высоты как написано; изменения внутри действуют на $x$ наоборот.</b>',
      },
      state: { show: ['par', 'vertex', 'top'], params: { a: 0.5, h: 1, k: -1 }, window: { cx: 0, cy: 1.5, unit: 46 }, controls: ['a', 'h', 'k'] },
    },
    {
      title: { en: 'Put the parabola in place', ru: 'Поставьте параболу на место' },
      text: {
        en: 'Drag the vertex so that the blue parabola becomes the graph of $y = (x - 2)^2 + 1$. Then press Check.',
        ru: 'Перетащите вершину так, чтобы синяя парабола стала графиком $y = (x - 2)^2 + 1$. Потом нажмите Check.',
      },
      task: {
        kind: 'drag',
        target: { h: 2, k: 1 },
        back: 6,
        right: {
          en: 'The vertex is at $(2,\\ 1)$: the bracket $(x - 2)$ becomes zero at $x = 2$, and $+1$ lifts the graph by one.',
          ru: 'Вершина в $(2,\\ 1)$: скобка $(x - 2)$ обнуляется при $x = 2$, а $+1$ поднимает график на единицу.',
        },
        mistakes: [
          { params: { h: -2, k: 1 }, back: 2, text: {
            en: 'The vertex went left, to $x = -2$. But $(x - 2)^2$ is zero at $x = 2$ — that is where the vertex is. A minus inside is a delay, not a direction.',
            ru: 'Вершина уехала влево, в $x = -2$. Но $(x - 2)^2$ равно нулю при $x = 2$ — там и вершина. Минус внутри — задержка, а не направление.' } },
          { params: { h: 2, k: -1 }, back: 1, text: {
            en: 'The height is wrong: $+1$ outside lifts the graph up, it does not lower it.',
            ru: 'Не та высота: $+1$ снаружи поднимает график, а не опускает.' } },
          { params: { h: 1, k: 2 }, text: {
            en: 'The coordinates are swapped: the number inside the bracket moves along $x$, the number outside moves along $y$.',
            ru: 'Координаты перепутаны: число внутри скобки двигает по $x$, число снаружи — по $y$.' } },
          { params: { h: -2, k: -1 }, back: 2, text: {
            en: 'Both directions are reversed. Outside, signs work as written: $+1$ is up. Inside they work backwards: $x - 2$ is right.',
            ru: 'Оба направления наоборот. Снаружи знак работает как написан: $+1$ — вверх. Внутри наоборот: $x - 2$ — вправо.' } },
        ],
        hints: {
          h: { en: 'The left–right position is off: the vertex is where the bracket $(x - 2)$ is zero.', ru: 'Не то положение по горизонтали: вершина там, где скобка $(x - 2)$ равна нулю.' },
          k: { en: 'The height is off: the vertex is as high as the number added outside.', ru: 'Не та высота: вершина на высоте числа, прибавленного снаружи.' },
        },
      },
      state: { show: ['par', 'parT', 'dragV'], params: { h: 0, k: 0 }, window: { cx: 0, cy: 1.5, unit: 46 }, controls: [] },
    },
    {
      title: { en: 'One more', ru: 'Ещё одна' },
      text: {
        en: 'Now $y = (x + 3)^2 - 2$.',
        ru: 'Теперь $y = (x + 3)^2 - 2$.',
      },
      task: {
        kind: 'drag',
        target: { h: -3, k: -2 },
        back: 6,
        right: { en: '$x + 3 = 0$ at $x = -3$, and $-2$ lowers by two: the vertex is $(-3,\\ -2)$.', ru: '$x + 3 = 0$ при $x = -3$, а $-2$ опускает на два: вершина $(-3,\\ -2)$.' },
        mistakes: [
          { params: { h: 3, k: -2 }, back: 2, text: {
            en: 'Plus inside moves the graph <b>left</b>: $(x + 3)^2$ is zero at $x = -3$.',
            ru: 'Плюс внутри сдвигает график <b>влево</b>: $(x + 3)^2$ равно нулю при $x = -3$.' } },
          { params: { h: -3, k: 2 }, back: 1, text: { en: '$-2$ outside lowers the graph.', ru: '$-2$ снаружи опускает график.' } },
        ],
        hints: {
          h: { en: 'Find where $x + 3$ is zero.', ru: 'Найдите, где $x + 3$ равно нулю.' },
          k: { en: 'The height of the vertex is the number outside.', ru: 'Высота вершины — число снаружи.' },
        },
      },
      state: { show: ['par', 'parT', 'dragV'], params: { h: 0, k: 0 }, window: { cx: 0, cy: 1, unit: 46 }, controls: [] },
    },
    {
      title: { en: 'Read the formula off the graph', ru: 'Прочитайте формулу по графику' },
      text: {
        en: 'The grey curve is $\\sqrt{x}$. The blue one is the same root moved somewhere. Write its formula (you may use $f$: here $f(x) = \\sqrt{x}$).',
        ru: 'Серая кривая — $\\sqrt{x}$. Синяя — тот же корень, куда-то сдвинутый. Напишите её формулу (можно через $f$: здесь $f(x) = \\sqrt{x}$).',
      },
      task: {
        kind: 'formula',
        answer: 'y = sqrt(x - 3)',
        range: [-2, 10],
        back: 2,
        right: { en: 'The graph starts at $x = 3$ instead of $0$: moved $3$ to the right, so $\\sqrt{x - 3}$.', ru: 'График начинается в $x = 3$, а не в $0$: сдвиг на $3$ вправо, значит $\\sqrt{x - 3}$.' },
        mistakes: [
          { formula: 'y = sqrt(x) - 3', text: {
            en: 'You lowered the graph by $3$, but it is moved to the right: look where it starts — at $(3,\\ 0)$, not at $(0,\\ -3)$. A shift to the right goes inside the root.',
            ru: 'Вы опустили график на $3$, а он сдвинут вправо: посмотрите, где он начинается — в $(3,\\ 0)$, а не в $(0,\\ -3)$. Сдвиг вправо пишется внутри корня.' } },
          { formula: 'y = sqrt(x) + 3', text: {
            en: 'You lifted the graph by $3$, but the blue curve starts on the axis, at $(3,\\ 0)$: it moved right, not up.',
            ru: 'Вы подняли график на $3$, а синяя кривая начинается на оси, в $(3,\\ 0)$: она сдвинулась вправо, а не вверх.' } },
        ],
      },
      state: { show: ['ghost', 'goal1'], window: { cx: 3, cy: 1.2, unit: 50 }, controls: [] },
    },
    {
      title: { en: 'A parabola upside down', ru: 'Перевёрнутая парабола' },
      text: {
        en: 'The grey curve is $x^2$. Write the formula of the blue parabola.',
        ru: 'Серая кривая — $x^2$. Напишите формулу синей параболы.',
      },
      task: {
        kind: 'formula',
        answer: 'y = -(x - 1)^2 + 2',
        range: [-4, 6],
        back: 6,
        right: { en: 'Flipped by the minus, vertex at $(1,\\ 2)$: $-(x - 1)^2 + 2$.', ru: 'Перевёрнута минусом, вершина в $(1,\\ 2)$: $-(x - 1)^2 + 2$.' },
        mistakes: [
          { formula: 'y = (x - 1)^2 + 2', back: 3, text: {
            en: 'The vertex is right, but your branches go up, and the blue ones go down. Flip it with a minus in front of the bracket: $-(x - 1)^2 + 2$.',
            ru: 'Вершина верная, но ваши ветви смотрят вверх, а синие — вниз. Переверните минусом перед скобкой: $-(x - 1)^2 + 2$.' } },
          { formula: 'y = -(x - 1)^2 - 2', back: 1, text: {
            en: 'The flip is right, but the vertex is at height $2$, not $-2$.',
            ru: 'Переворот верный, но вершина на высоте $2$, а не $-2$.' } },
          { formula: 'y = -(x + 1)^2 + 2', back: 2, text: {
            en: 'The vertex is at $x = 1$: the bracket must be zero there, so $(x - 1)$.',
            ru: 'Вершина при $x = 1$: скобка должна обнуляться там, значит $(x - 1)$.' } },
        ],
      },
      state: { show: ['par', 'goal2'], window: { cx: 1, cy: 0.5, unit: 46 }, controls: [] },
    },
    {
      title: { en: 'A squeezed wave', ru: 'Сжатая волна' },
      text: {
        en: 'The grey wave is $\\sin x$. Write the formula of the blue one.',
        ru: 'Серая волна — $\\sin x$. Напишите формулу синей.',
      },
      task: {
        kind: 'formula',
        answer: 'y = sin(2x)',
        range: [-6, 6],
        back: 5,
        right: { en: 'Two blue waves fit into one grey: the period is halved, so $\\sin(2x)$.', ru: 'В одну серую волну помещаются две синие: период вдвое короче, значит $\\sin(2x)$.' },
        mistakes: [
          { formula: 'y = sin(x/2)', text: {
            en: 'Your wave is stretched, the blue one is squeezed. A factor inside acts backwards: $\\sin(2x)$ is the narrower one.',
            ru: 'Ваша волна растянута, а синяя сжата. Множитель внутри действует наоборот: уже — это $\\sin(2x)$.' } },
          { formula: 'y = 2sin(x)', text: {
            en: 'You made the wave taller, but the blue one has the same height $1$ — it is narrower. The factor goes inside: $\\sin(2x)$.',
            ru: 'Вы сделали волну выше, а у синей высота та же, $1$, — она уже. Множитель пишется внутри: $\\sin(2x)$.' } },
        ],
      },
      state: { show: ['sin', 'goal3'], window: { cx: 1.5, cy: 0, unit: 58 }, controls: [] },
    },
  ],
};
