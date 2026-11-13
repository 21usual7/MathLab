// Where e comes from. Compound interest: 100 % a year paid n times grows to (1 + 1/n)^n, a staircase that
// approaches a smooth curve and a ceiling of 2.718… Then the property that makes e special: the slope of
// e^x equals its height. Finally ln x, the logarithm with base e.

import { COLORS } from '../core/palette.js';
import { fmt, slope } from '../core/numeric.js';
import { explorer } from '../views/explore.js';
import { t } from '../core/i18n.js';

const WHITE = '#ffffff';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r2 = v => Math.round(v * 100) / 100;
const YEAR = { cx: 0.55, cy: 1.75, unit: 300 };
const money = n => (1 + 1 / n) ** n;

export default {
  view: '2d',
  view2d: YEAR,

  setup(scene) {
    scene.add('y = e^x {0 <= x <= 1}', { id: 'smooth', color: 'grey', dim: true, visible: false });
    scene.add('y = a^x', { id: 'ax', color: 'blue', visible: false });
    scene.add('f(x) = e^x', { id: 'E', color: 'blue', visible: false });
    scene.add("y = f'(x)", { id: 'dE', color: 'yellow', dash: true, visible: false });
    scene.add('y = x', { id: 'diag', color: 'grey', dim: true, visible: false });
    scene.add('y = ln(x)', { id: 'ln', color: 'green', visible: false });
    // For the tasks: the goal curves are not named under the scene — the formula is the answer
    scene.add('y = e^x', { id: 'Eg', color: 'grey', dim: true, visible: false, legend: false });
    scene.add('y = 3e^x', { id: 'goal3', color: 'blue', visible: false, legend: false });
    scene.ensureParam('n', 1, { min: 1, max: 365, step: 1 });
    scene.ensureParam('a', 2, { min: 1.5, max: 3.5, step: 0.001 });
    scene.ensureParam('p', 0.6, { min: -2, max: 1.5 });

    // Point on y = a^x and its tangent: slope / height is the same everywhere, and it is 1 only for a = e
    const tangentAt = (p, base, q, color) => {
      const h = base ** q, k = slope(x => base ** x, q);
      p.line(q, h, q + 1, h + k, 'rgba(255,255,255,0.75)', { width: 1.8, extend: true });
      p.line(q, 0, q, h, color + '88', { width: 1.2, dash: [3, 4] });
      p.dot(q, h, color, 6);
      return { h, k };
    };

    scene.custom.push(
      {
        // The bank: 1 at the start of the year, 100 % a year paid in n equal parts
        id: 'bank',
        draw2d(p, sc, s) {
          const n = Math.max(1, Math.round(s.n)), pts = [[0, 1]];
          let v = 1;
          for (let k = 1; k <= n; k++) {
            pts.push([k / n, v]);
            v *= 1 + 1 / n;
            pts.push([k / n, v]);
          }
          p.polyline(pts, COLORS.yellow, n > 60 ? 2 : 2.5);
          p.line(p.xr[0], 2, 1, 2, 'rgba(255,255,255,0.25)', { width: 1, dash: [4, 4] });
          p.line(p.xr[0], Math.E, p.xr[1], Math.E, 'rgba(255,255,255,0.45)', { width: 1.2, dash: [6, 5] });
          p.tex('eLine', 'e \\approx 2.71828', p.xr[1], Math.E, WHITE, { dx: -12, dy: -14, align: 'right' });
          p.dot(1, v, COLORS.yellow, 6);
          p.tex('year', t({ en: '\\text{1 year}', ru: '\\text{1 год}' }), 1, 0.8, WHITE, { dx: 0, dy: 0, align: 'center' });
          p.vline(1, 'rgba(255,255,255,0.2)', 1, [4, 4]);
        },
        legend: s => {
          const n = Math.max(1, Math.round(s.n));
          return `n = ${n}:\\ \\ \\yellow{\\left(1 + \\frac{1}{${n}}\\right)^{${n}} = ${money(n).toFixed(5)}}`;
        },
      },
      {
        id: 'tangentA',
        draw2d(p, sc, s) {
          const { h } = tangentAt(p, s.a, s.p, COLORS.blue);
          p.handle(s.p, h, COLORS.blue, x => { sc.play('p', false); sc.setParam('p', clamp(x, -2, 1.5)); });
        },
        legend: s => {
          const h = s.a ** s.p, k = slope(x => s.a ** x, s.p);
          const [height, sl] = t({ en: ['height', 'slope'], ru: ['высота', 'наклон'] });
          return `\\text{${sl}} = ${fmt(r2(k))},\\ \\ \\text{${height}} = ${fmt(r2(h))}:\\quad \\frac{\\text{${sl}}}{\\text{${height}}} = \\yellow{${(k / h).toFixed(3)}}`;
        },
      },
      {
        id: 'tangentE',
        draw2d(p, sc, s) {
          const { h } = tangentAt(p, Math.E, s.p, COLORS.blue);
          p.handle(s.p, h, COLORS.blue, x => { sc.play('p', false); sc.setParam('p', clamp(x, -2, 1.5)); });
        },
        legend: s => {
          const v = fmt(r2(Math.E ** s.p));
          const [height, sl] = t({ en: ['height', 'slope'], ru: ['высота', 'наклон'] });
          return `x = ${fmt(r2(s.p))}:\\quad \\text{${height}} = ${v} = \\text{${sl}}`;
        },
      },
      {
        // Payments four times a year, for two years: the staircase whose corners the student describes by a formula
        id: 'quarters',
        draw2d(p) {
          const pts = [[0, 1]];
          let v = 1;
          for (let k = 1; k <= 8; k++) {
            pts.push([k / 4, v]);
            v *= 1.25;
            pts.push([k / 4, v]);
          }
          p.polyline(pts, COLORS.yellow, 2.5);
          for (let k = 0; k <= 8; k++) p.dot(k / 4, 1.25 ** k, COLORS.yellow, 4.5);
          p.vline(1, 'rgba(255,255,255,0.2)', 1, [4, 4]);
          p.vline(2, 'rgba(255,255,255,0.2)', 1, [4, 4]);
        },
      },
      {
        // The tangent to e^x without numbers, and the height read off on the y axis
        id: 'tangentT',
        draw2d(p, sc, s) {
          const { h } = tangentAt(p, Math.E, s.p, COLORS.blue);
          p.line(p.xr[0], h, s.p, h, COLORS.blue + '66', { width: 1.2, dash: [3, 4] });
          p.handle(s.p, h, COLORS.blue, x => { sc.play('p', false); sc.setParam('p', clamp(x, -2, 1.5)); });
        },
      },
      {
        // The same check on the goal curve of the last task: slope and height agree there too
        id: 'tangent3',
        draw2d(p, sc, s) {
          const h = 3 * Math.E ** s.p;
          p.line(s.p, h, s.p + 1, 2 * h, 'rgba(255,255,255,0.75)', { width: 1.8, extend: true });
          p.handle(s.p, h, COLORS.blue, x => { sc.play('p', false); sc.setParam('p', clamp(x, -2, 1.5)); });
        },
        legend: s => {
          const v = fmt(r2(3 * Math.E ** s.p));
          const [height, sl] = t({ en: ['height', 'slope'], ru: ['высота', 'наклон'] });
          return `x = ${fmt(r2(s.p))}:\\quad \\text{${height}} = ${v} = \\text{${sl}}`;
        },
      },
      explorer(),
    );
  },

  steps: [
    {
      title: { en: 'A generous bank', ru: 'Щедрый банк' },
      text: {
        en: 'Put $1$ in a bank that pays $100\\,\\%$ a year. After a year you have $2$. Now ask the bank to pay twice: $50\\,\\%$ after half a year, and $50\\,\\%$ more at the end — on the bigger sum. $1 \\cdot 1.5 \\cdot 1.5 = 2.25$: more than $2$, because the interest earns interest too. Paid $n$ times, the year ends with $\\yellow{\\left(1 + \\frac1n\\right)^n}$.',
        ru: 'Положим $1$ рубль в банк под $100\\,\\%$ годовых. Через год будет $2$. Попросим банк начислять дважды: $50\\,\\%$ через полгода и ещё $50\\,\\%$ в конце — уже на большую сумму. $1 \\cdot 1.5 \\cdot 1.5 = 2.25$: больше $2$, потому что проценты тоже приносят проценты. При $n$ начислениях к концу года будет $\\yellow{\\left(1 + \\frac1n\\right)^n}$.',
      },
      try: { en: 'Move $n$: 1, 2, 4, 12 (monthly), 365 (daily).', ru: 'Двигайте $n$: 1, 2, 4, 12 (каждый месяц), 365 (каждый день).' },
      check: {
        q: { en: 'If the bank paid every second, would you end the year with as much money as you like?', ru: 'Если банк будет начислять каждую секунду, наберётся ли к концу года сколько угодно денег?' },
        options: [{ text: { en: 'yes, it grows without bound', ru: 'да, без ограничений' } }, { text: { en: 'no, it stops near 2.72', ru: 'нет, упрётся примерно в 2.72' }, ok: true }],
        explain: {
          en: 'More payments help less and less: monthly gives $2.613$, daily $2.7146$, every second $2.71828$. The ceiling is the limit $\\lim_{n \\to \\infty}\\left(1 + \\frac1n\\right)^n = e = 2.71828\\ldots$ — the same as in the topic about limits.',
          ru: 'Каждое новое учащение помогает всё меньше: раз в месяц — $2.613$, раз в день — $2.7146$, раз в секунду — $2.71828$. Потолок — это предел $\\lim_{n \\to \\infty}\\left(1 + \\frac1n\\right)^n = e = 2.71828\\ldots$, тот самый, что в теме о пределах.',
        },
        reveal: scene => scene.animateParams({ n: 365 }, 4000),
      },
      state: { show: ['bank'], params: { n: 2 }, window: YEAR, controls: ['n'] },
    },
    {
      title: { en: 'Growing all the time', ru: 'Расти непрерывно' },
      text: {
        en: 'With more and more payments the staircase turns into a smooth curve: the money grows <b>at every moment</b>, and the faster, the more there is. That curve is $e^x$ — the grey line under the steps. So $e$ is what $1$ becomes after one year of continuous growth at $100\\,\\%$.',
        ru: 'Чем чаще начисления, тем больше лесенка похожа на гладкую кривую: деньги растут <b>в каждый момент</b>, и тем быстрее, чем их больше. Эта кривая — $e^x$, серая линия под ступеньками. Значит, $e$ — во что превращается $1$ за год непрерывного роста на $100\\,\\%$.',
      },
      hint: {
        title: { en: 'Why does the staircase approach e^x?', ru: 'Почему лесенка подходит к eˣ?' },
        text: {
          en: 'After the part $x$ of the year there were $nx$ payments: $\\left(1 + \\frac1n\\right)^{nx} = \\left(\\left(1 + \\frac1n\\right)^n\\right)^x$. The inner bracket tends to $e$, so the whole tends to $e^x$.',
          ru: 'К моменту $x$ (доля года) было $nx$ начислений: $\\left(1 + \\frac1n\\right)^{nx} = \\left(\\left(1 + \\frac1n\\right)^n\\right)^x$. Скобка внутри стремится к $e$, значит, всё выражение — к $e^x$.',
        },
      },
      state: { show: ['bank', 'smooth'], params: { n: 8 }, window: YEAR, controls: ['n'] },
      enter(scene) {
        scene.setParam('n', 1);
        scene.animateParams({ n: 60 }, 5000);
      },
    },
    {
      title: { en: 'Slope against height', ru: 'Наклон против высоты' },
      text: {
        en: 'Here is why $e$ matters far beyond banks. Take $\\blue{y = a^x}$ and draw a tangent. For $a = 2$ the slope at every point is about $0.693$ of the height, wherever the point is. For $a = 3$ it is $1.099$ of the height. The ratio depends only on $a$.',
        ru: 'Вот почему $e$ важно далеко за пределами банков. Возьмём $\\blue{y = a^x}$ и проведём касательную. При $a = 2$ наклон в любой точке составляет примерно $0.693$ от высоты, где бы точка ни была. При $a = 3$ — $1.099$ от высоты. Отношение зависит только от $a$.',
      },
      try: { en: 'Drag the point: the ratio does not change. Then change $a$.', ru: 'Тяните точку — отношение не меняется. Потом меняйте $a$.' },
      check: {
        q: { en: 'Is there a base where the slope equals the height exactly?', ru: 'Есть ли основание, при котором наклон в точности равен высоте?' },
        options: [{ text: { en: 'yes, between 2 and 3', ru: 'да, между 2 и 3' }, ok: true }, { text: { en: 'no', ru: 'нет' } }],
        explain: {
          en: 'At $a = 2$ the ratio is less than $1$, at $a = 3$ more, and it changes smoothly — so somewhere between it is exactly $1$. That base is $e = 2.718\\ldots$, the same number the bank gave us.',
          ru: 'При $a = 2$ отношение меньше $1$, при $a = 3$ больше, и меняется оно плавно — значит, где-то между ними оно ровно $1$. Это основание — $e = 2.718\\ldots$, то самое число, что дал банк.',
        },
        reveal: scene => scene.animateParams({ a: Math.E }, 2500),
      },
      state: { show: ['ax', 'tangentA'], params: { a: 2, p: 0.6 }, window: { cx: 0, cy: 2, unit: 90 }, controls: ['a', 'p'] },
    },
    {
      title: { en: 'Its own derivative', ru: 'Сама себе производная' },
      text: {
        en: 'For $\\blue{f(x) = e^x}$ the slope at every point is the height: $\\yellow{f\'(x) = e^x}$. The dashed yellow derivative lies exactly on the blue curve. No other function (except $Ce^x$) does this — and this is why $e^x$ describes everything that grows or decays in proportion to itself: money, bacteria, radioactive atoms, a cooling cup of tea.',
        ru: 'У $\\blue{f(x) = e^x}$ наклон в каждой точке равен высоте: $\\yellow{f\'(x) = e^x}$. Жёлтая пунктирная производная лежит ровно на синей кривой. Больше ни одна функция (кроме $Ce^x$) так не умеет — поэтому $e^x$ описывает всё, что растёт или убывает пропорционально самому себе: деньги, бактерии, радиоактивные атомы, остывающий чай.',
      },
      try: { en: 'Drag the point along the curve.', ru: 'Тяните точку вдоль кривой.' },
      check: {
        q: { en: 'What is the slope of $e^x$ at $x = 1$?', ru: 'Чему равен наклон $e^x$ при $x = 1$?' },
        options: [{ text: '$1$' }, { text: '$e$', ok: true }, { text: '$0$' }],
        explain: {
          en: 'The slope is the height: $e^1 = e \\approx 2.718$.',
          ru: 'Наклон равен высоте: $e^1 = e \\approx 2.718$.',
        },
        reveal: scene => scene.animateParams({ p: 1 }, 1500),
      },
      state: { show: ['E', 'dE', 'tangentE'], params: { p: 0 }, window: { cx: 0, cy: 2, unit: 90 }, controls: ['p'] },
    },
    {
      title: { en: 'The natural logarithm', ru: 'Натуральный логарифм' },
      text: {
        en: 'The logarithm with base $e$ is called natural and written $\\green{\\ln x}$. As always, it is the mirror image of the exponent in $y = x$. It answers: «how long must $1$ grow continuously at $100\\,\\%$ to become $x$?» So $\\ln e = 1$ (one year), $\\ln 1 = 0$, and $\\ln 2 \\approx 0.693$ — the very ratio we saw for $2^x$.',
        ru: 'Логарифм по основанию $e$ называют натуральным и пишут $\\green{\\ln x}$. Как всегда, это отражение экспоненты в прямой $y = x$. Он отвечает на вопрос: «сколько времени $1$ должна непрерывно расти на $100\\,\\%$, чтобы стать $x$?» Поэтому $\\ln e = 1$ (один год), $\\ln 1 = 0$, а $\\ln 2 \\approx 0.693$ — то самое отношение, что мы видели у $2^x$.',
      },
      try: { en: 'Point at the green curve.', ru: 'Наведите указатель на зелёную кривую.' },
      check: {
        q: { en: 'Roughly how long does continuous growth at $100\\,\\%$ take to double the money?', ru: 'Примерно за сколько времени непрерывный рост на $100\\,\\%$ удваивает деньги?' },
        options: [{ text: { en: 'a year', ru: 'за год' } }, { text: { en: '0.69 of a year', ru: 'за 0.69 года' }, ok: true }, { text: { en: 'half a year', ru: 'за полгода' } }],
        explain: {
          en: 'We need $e^x = 2$, so $x = \\ln 2 \\approx 0.693$ — about 8 months and 10 days. Continuous growth doubles faster than once-a-year interest.',
          ru: 'Нужно $e^x = 2$, то есть $x = \\ln 2 \\approx 0.693$ — примерно 8 месяцев и 10 дней. Непрерывный рост удваивает быстрее, чем начисление раз в год.',
        },
      },
      state: { show: ['E', 'diag', 'ln'], window: { cx: 1, cy: 1, unit: 70 }, controls: [] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'In the Lab press <b>Tangent</b> and point at $y = e^x$, $y = 2^x$, $y = 3^x$: compare the slope with the height. Try $y = (1 + 1/n)^{n x}$ with a slider $n$, and $y = e^{-x}$ — decay, like a cooling cup of tea.',
        ru: 'В Lab нажмите <b>Tangent</b> и наводите указатель на $y = e^x$, $y = 2^x$, $y = 3^x$: сравнивайте наклон с высотой. Попробуйте $y = (1 + 1/n)^{n x}$ со слайдером $n$ и $y = e^{-x}$ — убывание, как у остывающего чая.',
      },
      state: { show: ['E', 'dE', 'tangentE'], params: { p: 1 }, window: { cx: 0, cy: 2, unit: 90 }, controls: ['p'] },
    },
    {
      title: { en: 'Four times a year', ru: 'Четыре раза в год' },
      text: {
        en: 'The bank pays $100\\,\\%$ a year in four parts: $25\\,\\%$ every quarter. The staircase shows the money over two years; the dots are the moments right after each payment. Write a formula $y = \\ldots$ of time $x$ (in years) whose graph goes through all the dots.',
        ru: 'Банк платит $100\\,\\%$ годовых четырьмя частями: по $25\\,\\%$ каждый квартал. Лесенка — деньги за два года; точки — моменты сразу после начисления. Напишите формулу $y = \\ldots$ от времени $x$ (в годах), график которой проходит через все точки.',
      },
      task: {
        kind: 'formula',
        answer: 'y = 1.25^(4x)',
        range: [0, 2],
        back: 1,
        right: {
          en: 'Every quarter the money is multiplied by $1 + \\frac14 = 1.25$, and in $x$ years there are $4x$ quarters: $y = 1.25^{4x} = \\left(1 + \\frac14\\right)^{4x}$. With $n$ payments it is $\\left(1 + \\frac1n\\right)^{nx}$, and as $n$ grows it turns into $e^x$.',
          ru: 'Каждый квартал деньги умножаются на $1 + \\frac14 = 1.25$, а за $x$ лет проходит $4x$ кварталов: $y = 1.25^{4x} = \\left(1 + \\frac14\\right)^{4x}$. При $n$ начислениях это $\\left(1 + \\frac1n\\right)^{nx}$, а с ростом $n$ — $e^x$.',
        },
        mistakes: [
          { formula: 'y = 1.25^x', text: {
            en: 'Here the money is multiplied by $1.25$ once a year, but the bank pays four times a year: in $x$ years there are $4x$ payments.',
            ru: 'Так деньги умножаются на $1.25$ раз в год, а банк платит четыре раза в год: за $x$ лет — $4x$ начислений.' } },
          { formula: 'y = 2^x', text: {
            en: 'This is one payment a year, $n = 1$. With four payments the interest itself earns interest, and the money grows faster.',
            ru: 'Это одно начисление в год, $n = 1$. При четырёх начислениях проценты сами приносят проценты, и деньги растут быстрее.' } },
          { formula: 'y = e^x', text: {
            en: '$e^x$ is the limit, continuous growth. With four payments the dots lie slightly lower: after a year $1.25^4 \\approx 2.44$, not $2.72$.',
            ru: '$e^x$ — это предел, непрерывный рост. При четырёх начислениях точки лежат чуть ниже: через год $1.25^4 \\approx 2.44$, а не $2.72$.' } },
          { formula: 'y = (1 + x/4)^4', text: {
            en: 'Here there are always exactly four payments, whatever $x$ is. But payments come every quarter: in $x$ years there are $4x$ of them, and the number of payments is the power.',
            ru: 'Здесь при любом $x$ ровно четыре начисления. А начисления идут каждый квартал: за $x$ лет их $4x$, и число начислений стоит в показателе.' } },
          { formula: 'y = 1 + x', text: {
            en: 'This is simple interest: $100\\,\\%$ of the first ruble every year. But the bank adds interest to the sum, and the next $25\\,\\%$ are counted from the bigger amount.',
            ru: 'Это простые проценты: каждый год $100\\,\\%$ от первого рубля. Но банк прибавляет проценты к сумме, и следующие $25\\,\\%$ считаются уже от большей суммы.' } },
        ],
      },
      state: { show: ['quarters'], window: { cx: 1, cy: 3, unit: 75 }, controls: [] },
    },
    {
      title: { en: 'Find a slope of 3', ru: 'Найдите наклон 3' },
      text: {
        en: 'On the graph of $\\blue{e^x}$ put the point where the slope of the tangent is $3$. There are no numbers this time — but you know a property of $e^x$ that makes this easy.',
        ru: 'На графике $\\blue{e^x}$ поставьте точку туда, где наклон касательной равен $3$. Чисел на этот раз нет — но вы знаете свойство $e^x$, которое делает задачу простой.',
      },
      task: {
        kind: 'drag',
        target: { p: Math.log(3) },
        tol: 0.06,
        back: 3,
        right: {
          en: 'The slope of $e^x$ is its height, so we need the height $3$: $e^x = 3$, $x = \\ln 3 \\approx 1.1$.',
          ru: 'Наклон $e^x$ равен высоте, значит нужна высота $3$: $e^x = 3$, $x = \\ln 3 \\approx 1.1$.',
        },
        hints: {
          p: p => (Math.E ** p < 3
            ? { en: 'The tangent here is flatter than $3$. Remember: for $e^x$ the slope is the height. How high is the point?', ru: 'Касательная здесь положе, чем $3$. Вспомните: у $e^x$ наклон равен высоте. На какой высоте точка?' }
            : { en: 'The tangent here is steeper than $3$. For $e^x$ the slope is the height — and the point is higher than $3$.', ru: 'Касательная здесь круче, чем $3$. У $e^x$ наклон равен высоте — а точка выше $3$.' }),
        },
      },
      state: { show: ['E', 'tangentT'], params: { p: 0 }, window: { cx: 0.5, cy: 2, unit: 90 }, controls: [] },
    },
    {
      title: { en: 'Another function that is its own derivative', ru: 'Ещё одна «сама себе производная»' },
      text: {
        en: 'The blue curve has the same property as $e^x$: at every point its slope equals its height — drag the point and check. It goes through $(0,\\ 3)$. Write its formula. (The grey curve is $e^x$.)',
        ru: 'У синей кривой то же свойство, что у $e^x$: в каждой точке наклон равен высоте — потяните точку и проверьте. Она проходит через $(0,\\ 3)$. Напишите её формулу. (Серая кривая — $e^x$.)',
      },
      task: {
        kind: 'formula',
        answer: 'y = 3e^x',
        range: [-2, 2],
        back: 3,
        right: {
          en: '$y = 3e^x$: every height is three times bigger, and so is every slope — they stay equal. These are the $Ce^x$ from step 4, the only functions that are their own derivative.',
          ru: '$y = 3e^x$: все высоты втрое больше, и все наклоны тоже — они по-прежнему равны. Это те самые $Ce^x$ из шага 4 — единственные функции, равные своей производной.',
        },
        mistakes: [
          { formula: 'y = e^x + 2', text: {
            en: 'It does go through $(0,\\ 3)$, but its slopes are those of $e^x$ — at $x = 0$ the slope is $1$, the height $3$. Lifting the graph changes heights, not slopes.',
            ru: 'Через $(0,\\ 3)$ она проходит, но наклоны у неё как у $e^x$: при $x = 0$ наклон $1$, а высота $3$. Подъём графика меняет высоты, но не наклоны.' } },
          { formula: 'y = e^x + 3', text: {
            en: 'At $x = 0$ this gives $1 + 3 = 4$, not $3$. And lifting the graph changes heights but not slopes, so they would no longer be equal.',
            ru: 'При $x = 0$ это $1 + 3 = 4$, а не $3$. К тому же подъём графика меняет высоты, но не наклоны, и они перестанут быть равны.' } },
          { formula: 'y = e^(3x)', text: {
            en: 'At $x = 0$ this is $1$, not $3$. And its slope is three times its height: it is $e^x$ squeezed, not stretched upward.',
            ru: 'При $x = 0$ это $1$, а не $3$. И наклон у неё втрое больше высоты: это $e^x$, сжатая к оси, а не растянутая вверх.' } },
        ],
      },
      state: { show: ['Eg', 'goal3', 'tangent3'], params: { p: 0 }, window: { cx: 0, cy: 3, unit: 60 }, controls: [] },
    },
  ],
};
