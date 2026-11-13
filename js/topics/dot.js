// The dot product: how much one arrow goes along another. The shadow of w on the line of v times the length
// of v; in coordinates vx·wx + vy·wy — the same number. Positive for a sharp angle, zero for a right one,
// negative for a blunt one; divided by the lengths it gives the cosine of the angle.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';

const WINDOW = { cx: 0.5, cy: 0.8, unit: 52 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const snap = v => clamp(Math.round(v * 2) / 2, -5, 5);
const r2 = v => fmt(Math.round(v * 100) / 100);
const pr = v => (v < 0 ? `(${r2(v)})` : r2(v));
const len = (x, y) => Math.hypot(x, y);
const DEG = Math.PI / 180;

// v, w, the line of v with unit ticks, the perpendicular from the tip of w and the shadow of w on that line
// (green when it goes along v, red when against)
function picture(p, sc, v, w, { dragV = true, dragW = true } = {}) {
  const L = len(...v);
  if (L > 1e-9) {
    const u = [v[0] / L, v[1] / L], k = (v[0] * w[0] + v[1] * w[1]) / L, F = [u[0] * k, u[1] * k];
    p.line(0, 0, ...v, 'rgba(255,255,255,0.22)', { width: 1, extend: true });
    for (let n = -8; n <= 8; n++) {
      if (!n) continue;
      const c = [u[0] * n, u[1] * n], d = [-u[1] * 0.12, u[0] * 0.12];
      p.line(c[0] - d[0], c[1] - d[1], c[0] + d[0], c[1] + d[1], 'rgba(255,255,255,0.45)', { width: 1.2 });
    }
    p.line(...w, ...F, 'rgba(255,255,255,0.5)', { width: 1.2, dash: [4, 4] });
    p.line(0, 0, ...F, k >= 0 ? COLORS.green : COLORS.red, { width: 6 });
  }
  p.arrow(0, 0, ...v, COLORS.blue, { width: 3 });
  p.arrow(0, 0, ...w, COLORS.yellow, { width: 3 });
  p.tex('v', '\\blue{\\vec v}', ...v, COLORS.blue, { dx: 10, dy: -12 });
  p.tex('w', '\\yellow{\\vec w}', ...w, COLORS.yellow, { dx: 10, dy: -12 });
  const set = (a, b) => (x, y) => { sc.setParam(a, snap(x)); sc.setParam(b, snap(y)); };
  if (dragV) p.handle(...v, COLORS.blue, set('vx', 'vy'));
  if (dragW) p.handle(...w, COLORS.yellow, set('wx', 'wy'));
}

const V = s => [s.vx, s.vy], W = s => [s.wx, s.wy];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
// w turned by the angle theta (degrees) from v, length 2.5
const turned = s => { const L = len(s.vx, s.vy), c = Math.cos(s.theta * DEG), si = Math.sin(s.theta * DEG); return [2.5 * (s.vx * c - s.vy * si) / L, 2.5 * (s.vx * si + s.vy * c) / L]; };

export default {
  view: '2d',
  view2d: WINDOW,
  lab: false,

  setup(scene) {
    scene.ensureParam('vx', 2, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('vy', 1, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('wx', 1, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('wy', 2, { min: -5, max: 5, step: 0.5 });
    scene.ensureParam('theta', 30, { min: 0, max: 360, step: 1 });
    scene.ensureParam('D', 0, { min: -12, max: 16, step: 1 }); // the student's answer in the second task

    scene.custom.push(
      {
        id: 'proj',
        draw2d(p, sc, s) { picture(p, sc, V(s), W(s)); },
        legend: s => {
          const L = len(s.vx, s.vy), d = dot(V(s), W(s));
          return `\\blue{\\vec v} \\cdot \\yellow{\\vec w} = |\\blue{\\vec v}| \\cdot ${t({ en: '\\text{shadow}', ru: '\\text{тень}' })} = ${r2(L)} \\cdot ${d >= 0 ? '\\green' : '\\red'}{${r2(L ? d / L : 0)}} = ${r2(d)}`;
        },
      },
      {
        id: 'coordsDot',
        draw2d(p, sc, s) { picture(p, sc, V(s), W(s)); },
        legend: s => `\\blue{\\vec v} \\cdot \\yellow{\\vec w} = ${pr(s.vx)} \\cdot ${pr(s.wx)} + ${pr(s.vy)} \\cdot ${pr(s.wy)} = ${r2(dot(V(s), W(s)))}`,
      },
      {
        // w goes round v; the sign of the product follows the angle
        id: 'turn',
        draw2d(p, sc, s) { picture(p, sc, V(s), turned(s), { dragW: false }); },
        legend: s => {
          const d = dot(V(s), turned(s)), a = s.theta % 360, phi = a > 180 ? 360 - a : a;
          const sign = Math.abs(d) < 1e-6 ? '= 0' : d > 0 ? '> 0' : '< 0';
          return `\\varphi = ${Math.round(phi)}^\\circ:\\quad \\blue{\\vec v} \\cdot \\yellow{\\vec w} = ${r2(d)} ${sign}`;
        },
      },
      {
        id: 'angle',
        draw2d(p, sc, s) { picture(p, sc, V(s), W(s)); },
        legend: s => {
          const d = dot(V(s), W(s)), a = len(s.vx, s.vy), b = len(s.wx, s.wy);
          if (!a || !b) return '';
          const c = clamp(d / (a * b), -1, 1);
          return `\\cos\\varphi = \\frac{\\vec v \\cdot \\vec w}{|\\vec v|\\,|\\vec w|} = \\frac{${r2(d)}}{${r2(a)} \\cdot ${r2(b)}} = ${r2(c)},\\quad \\varphi \\approx ${Math.round(Math.acos(c) / DEG)}^\\circ`;
        },
      },
      // ---- Tasks ----
      {
        id: 'perpT',
        draw2d(p, sc, s) { picture(p, sc, [2, 1], W(s), { dragV: false }); },
      },
      {
        id: 'computeT',
        draw2d(p, sc) { picture(p, sc, [3, -1], [2, 4], { dragV: false, dragW: false }); },
        legend: s => `\\begin{pmatrix} 3 \\\\ -1 \\end{pmatrix} \\cdot \\begin{pmatrix} 2 \\\\ 4 \\end{pmatrix} = \\ ?\\qquad D = ${r2(s.D)}`,
      },
      {
        id: 'shadowT',
        draw2d(p, sc, s) { picture(p, sc, [3, 4], W(s), { dragV: false }); },
      },
    );
  },

  steps: [
    {
      title: { en: 'How much one arrow goes along another', ru: 'Насколько одна стрелка идёт вдоль другой' },
      text: {
        en: 'Shine light straight down onto the line of $\\blue{\\vec v}$: the arrow $\\yellow{\\vec w}$ casts a <span class="c-green">shadow</span> on it. The shadow says how much $\\vec w$ goes along $\\vec v$. The <i>dot product</i> is this shadow times the length of $\\vec v$: $$\\blue{\\vec v} \\cdot \\yellow{\\vec w} = |\\blue{\\vec v}| \\cdot \\text{shadow}.$$ It is a number, not an arrow. The ticks on the line are unit steps.',
        ru: 'Посветим на прямую $\\blue{\\vec v}$ перпендикулярно ей: стрелка $\\yellow{\\vec w}$ отбрасывает на неё <span class="c-green">тень</span>. Тень говорит, насколько $\\vec w$ идёт вдоль $\\vec v$. <i>Скалярное произведение</i> — это тень, умноженная на длину $\\vec v$: $$\\blue{\\vec v} \\cdot \\yellow{\\vec w} = |\\blue{\\vec v}| \\cdot \\text{тень}.$$ Это число, а не стрелка. Засечки на прямой — единичные шаги.',
      },
      try: { en: 'Drag the ends of both arrows and watch the shadow.', ru: 'Тяните концы обеих стрелок и следите за тенью.' },
      state: { show: ['proj'], params: { vx: 2, vy: 1, wx: 1, wy: 2 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'In coordinates: multiply and add', ru: 'В координатах: перемножить и сложить' },
      text: {
        en: 'There is a short way to get the same number: multiply the $x$-coordinates, multiply the $y$-coordinates, add. $$\\vec v \\cdot \\vec w = v_x w_x + v_y w_y.$$ Why do shadows and this sum agree? For $\\vec\\imath$ and $\\vec\\jmath$ it is easy to check: $\\vec\\imath \\cdot \\vec\\imath = 1$, $\\vec\\imath \\cdot \\vec\\jmath = 0$. And the shadow of a sum is the sum of shadows — so the rest follows.',
        ru: 'То же число можно получить короче: перемножить координаты $x$, перемножить координаты $y$ и сложить. $$\\vec v \\cdot \\vec w = v_x w_x + v_y w_y.$$ Почему тени и эта сумма совпадают? Для $\\vec\\imath$ и $\\vec\\jmath$ проверить легко: $\\vec\\imath \\cdot \\vec\\imath = 1$, $\\vec\\imath \\cdot \\vec\\jmath = 0$. А тень суммы — это сумма теней, отсюда и остальное.',
      },
      try: { en: 'Drag the arrows: compare with the number on the previous step — the same.', ru: 'Тяните стрелки: число то же, что на предыдущем шаге.' },
      check: {
        q: { en: '$\\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix} \\cdot \\begin{pmatrix} 3 \\\\ -1 \\end{pmatrix} = ?$', ru: '$\\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix} \\cdot \\begin{pmatrix} 3 \\\\ -1 \\end{pmatrix} = ?$' },
        options: [{ text: '$1$', ok: true }, { text: '$\\begin{pmatrix} 3 \\\\ -2 \\end{pmatrix}$' }, { text: '$5$' }],
        explain: {
          en: '$1 \\cdot 3 + 2 \\cdot (-1) = 3 - 2 = 1$. The answer is a number: the products are added up, not kept in a column.',
          ru: '$1 \\cdot 3 + 2 \\cdot (-1) = 3 - 2 = 1$. Ответ — число: произведения складываются, а не остаются столбиком.',
        },
        reveal: scene => scene.animateParams({ vx: 1, vy: 2, wx: 3, wy: -1 }, 1200),
      },
      state: { show: ['coordsDot'], params: { vx: 2, vy: 1, wx: 1, wy: 2 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Plus, zero, minus', ru: 'Плюс, ноль, минус' },
      text: {
        en: 'Let $\\yellow{\\vec w}$ go round. While the angle is sharp, the shadow points along $\\vec v$: the product is <b>positive</b>. At a right angle the shadow shrinks to a point: <b>zero</b>. When the angle is blunt, the shadow points backwards, <span class="c-red">red</span>: the product is <b>negative</b>.',
        ru: 'Пусть $\\yellow{\\vec w}$ поворачивается. Пока угол острый, тень смотрит вдоль $\\vec v$: произведение <b>положительное</b>. При прямом угле тень сжимается в точку — <b>ноль</b>. Когда угол тупой, тень смотрит назад, <span class="c-red">красная</span>: произведение <b>отрицательное</b>.',
      },
      try: { en: 'Press ▶ next to $\\theta$.', ru: 'Нажмите ▶ возле $\\theta$.' },
      state: { show: ['turn'], params: { vx: 2, vy: 1, theta: 30 }, window: WINDOW, controls: ['theta'] },
    },
    {
      title: { en: 'Zero means perpendicular', ru: 'Ноль — значит перпендикулярны' },
      text: {
        en: 'This is the most used fact about the dot product: <b>$\\vec v \\cdot \\vec w = 0$ exactly when the arrows are perpendicular</b> (or one of them is zero). To check a right angle you do not need a protractor — multiply and add.',
        ru: 'Это самый ходовой факт о скалярном произведении: <b>$\\vec v \\cdot \\vec w = 0$ ровно тогда, когда стрелки перпендикулярны</b> (или одна из них нулевая). Чтобы проверить прямой угол, не нужен транспортир — перемножьте и сложите.',
      },
      try: { en: 'Make $\\vec w$ perpendicular to $\\vec v$ and watch the sum become $0$.', ru: 'Сделайте $\\vec w$ перпендикулярным $\\vec v$ и посмотрите, как сумма станет $0$.' },
      check: {
        q: { en: 'Are $\\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$ and $\\begin{pmatrix} -1 \\\\ 2 \\end{pmatrix}$ perpendicular?', ru: 'Перпендикулярны ли $\\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$ и $\\begin{pmatrix} -1 \\\\ 2 \\end{pmatrix}$?' },
        options: [{ text: { en: 'yes', ru: 'да' }, ok: true }, { text: { en: 'no', ru: 'нет' } }],
        explain: {
          en: '$2 \\cdot (-1) + 1 \\cdot 2 = 0$. A handy trick: swap the coordinates and change one sign — you get a perpendicular arrow.',
          ru: '$2 \\cdot (-1) + 1 \\cdot 2 = 0$. Полезный приём: переставьте координаты и смените один знак — получится перпендикулярная стрелка.',
        },
        reveal: scene => scene.animateParams({ vx: 2, vy: 1, wx: -1, wy: 2 }, 1200),
      },
      state: { show: ['coordsDot'], params: { vx: 2, vy: 1, wx: 0, wy: 2 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'The angle', ru: 'Угол' },
      text: {
        en: 'The shadow of $\\vec w$ is $|\\vec w| \\cos\\varphi$, where $\\varphi$ is the angle between the arrows. So $\\vec v \\cdot \\vec w = |\\vec v|\\,|\\vec w| \\cos\\varphi$, and the angle can be found from coordinates alone: $$\\cos\\varphi = \\frac{\\vec v \\cdot \\vec w}{|\\vec v|\\,|\\vec w|}.$$',
        ru: 'Тень $\\vec w$ равна $|\\vec w| \\cos\\varphi$, где $\\varphi$ — угол между стрелками. Значит, $\\vec v \\cdot \\vec w = |\\vec v|\\,|\\vec w| \\cos\\varphi$, и угол можно найти по одним координатам: $$\\cos\\varphi = \\frac{\\vec v \\cdot \\vec w}{|\\vec v|\\,|\\vec w|}.$$',
      },
      try: { en: 'Drag the arrows and read the angle.', ru: 'Тяните стрелки и читайте угол.' },
      check: {
        q: { en: 'The angle between $\\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$ and $\\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$?', ru: 'Угол между $\\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$ и $\\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$?' },
        options: [{ text: '$30^\\circ$' }, { text: '$45^\\circ$', ok: true }, { text: '$60^\\circ$' }],
        explain: {
          en: '$\\cos\\varphi = \\frac{1}{1 \\cdot \\sqrt2} = \\frac{\\sqrt2}{2}$, so $\\varphi = 45^\\circ$ — the diagonal of a square.',
          ru: '$\\cos\\varphi = \\frac{1}{1 \\cdot \\sqrt2} = \\frac{\\sqrt2}{2}$, значит $\\varphi = 45^\\circ$ — диагональ квадрата.',
        },
        reveal: scene => scene.animateParams({ vx: 1, vy: 0, wx: 1, wy: 1 }, 1200),
      },
      state: { show: ['angle'], params: { vx: 3, vy: 0, wx: 2, wy: 2 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'What is $\\vec v \\cdot \\vec v$? (Hint: the shadow of an arrow on itself is the arrow.) That is why $|\\vec v| = \\sqrt{\\vec v \\cdot \\vec v}$ — Pythagoras in disguise. Then compare with the <a href="#topic/det">determinant</a>: there the area of the parallelogram, here the shadow — one number tells how much two arrows go along each other, the other how much across.',
        ru: 'Чему равно $\\vec v \\cdot \\vec v$? (Подсказка: тень стрелки на саму себя — это она сама.) Поэтому $|\\vec v| = \\sqrt{\\vec v \\cdot \\vec v}$ — это теорема Пифагора в другой одежде. А теперь сравните с <a href="#topic/det">определителем</a>: там площадь параллелограмма, здесь тень — одно число говорит, насколько две стрелки идут вдоль друг друга, другое — насколько поперёк.',
      },
      state: { show: ['angle'], params: { vx: 2, vy: 1, wx: 1, wy: 2 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Make a right angle', ru: 'Сделайте прямой угол' },
      text: {
        en: '$\\blue{\\vec v} = \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$ is fixed. Drag $\\yellow{\\vec w}$ so that $\\vec v \\cdot \\vec w = 0$ (and $\\vec w \\ne \\vec 0$).',
        ru: '$\\blue{\\vec v} = \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$ закреплён. Перетащите $\\yellow{\\vec w}$ так, чтобы $\\vec v \\cdot \\vec w = 0$ (и $\\vec w \\ne \\vec 0$).',
      },
      task: {
        kind: 'drag',
        target: [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2].map(k => ({ wx: -k, wy: 2 * k })),
        back: 3,
        right: {
          en: 'The shadow vanished: $2 w_x + 1 \\cdot w_y = 0$. All the answers lie on one line through the origin, perpendicular to $\\vec v$ — the multiples of $\\begin{pmatrix} -1 \\\\ 2 \\end{pmatrix}$.',
          ru: 'Тень исчезла: $2 w_x + 1 \\cdot w_y = 0$. Все ответы лежат на одной прямой через начало координат, перпендикулярной $\\vec v$, — это кратные $\\begin{pmatrix} -1 \\\\ 2 \\end{pmatrix}$.',
        },
        mistakes: [-2, -1, 1, 2].map(k => ({ params: { wx: 2 * k, wy: k }, text: {
          en: 'Now $\\vec w$ lies on the line of $\\vec v$ — the shadow is the longest possible, not zero. Perpendicular is a quarter turn away.',
          ru: 'Сейчас $\\vec w$ лежит на прямой $\\vec v$ — тень самая длинная, а не нулевая. Перпендикуляр — на четверть оборота в сторону.' } })),
        hints: {
          wx: { en: 'There is still a shadow on the line of $\\vec v$. Put the tip of $\\vec w$ where the shadow shrinks to a point.', ru: 'На прямой $\\vec v$ ещё есть тень. Поставьте конец $\\vec w$ туда, где тень сжимается в точку.' },
          wy: { en: 'There is still a shadow on the line of $\\vec v$. Put the tip of $\\vec w$ where the shadow shrinks to a point.', ru: 'На прямой $\\vec v$ ещё есть тень. Поставьте конец $\\vec w$ туда, где тень сжимается в точку.' },
        },
      },
      state: { show: ['perpT'], params: { wx: 2, wy: 2 }, window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Compute it', ru: 'Посчитайте' },
      text: {
        en: 'Set $D$ to $\\begin{pmatrix} 3 \\\\ -1 \\end{pmatrix} \\cdot \\begin{pmatrix} 2 \\\\ 4 \\end{pmatrix}$. You can check on the picture: is the angle sharp or blunt?',
        ru: 'Поставьте $D$ равным $\\begin{pmatrix} 3 \\\\ -1 \\end{pmatrix} \\cdot \\begin{pmatrix} 2 \\\\ 4 \\end{pmatrix}$. Проверьте по картинке: угол острый или тупой?',
      },
      task: {
        kind: 'drag',
        target: { D: 2 },
        back: 1,
        right: {
          en: '$3 \\cdot 2 + (-1) \\cdot 4 = 6 - 4 = 2$. Positive but small: the angle is sharp, close to a right one — the shadow is short.',
          ru: '$3 \\cdot 2 + (-1) \\cdot 4 = 6 - 4 = 2$. Положительное, но маленькое: угол острый, близкий к прямому, — тень короткая.',
        },
        mistakes: [
          { params: { D: 10 }, text: {
            en: 'The sign of $-1$ was lost: $(-1) \\cdot 4 = -4$, so $6 - 4$.',
            ru: 'Потерялся знак у $-1$: $(-1) \\cdot 4 = -4$, значит $6 - 4$.' } },
          { params: { D: 14 }, text: {
            en: 'This is the determinant $3 \\cdot 4 - (-1) \\cdot 2$ — the area of the parallelogram. The dot product multiplies matching coordinates: $x$ with $x$, $y$ with $y$.',
            ru: 'Это определитель $3 \\cdot 4 - (-1) \\cdot 2$ — площадь параллелограмма. В скалярном произведении перемножают одноимённые координаты: $x$ с $x$, $y$ с $y$.' } },
        ],
        hints: { D: { en: '$x$ times $x$ plus $y$ times $y$.', ru: '$x$ на $x$ плюс $y$ на $y$.' } },
      },
      state: { show: ['computeT'], params: { D: 0 }, window: WINDOW, controls: ['D'] },
    },
    {
      title: { en: 'A shadow of length 2', ru: 'Тень длины 2' },
      text: {
        en: '$\\blue{\\vec v} = \\begin{pmatrix} 3 \\\\ 4 \\end{pmatrix}$ is fixed; the ticks on its line are unit steps. Drag $\\yellow{\\vec w}$ so that its shadow on $\\vec v$ goes forward exactly $2$ steps.',
        ru: '$\\blue{\\vec v} = \\begin{pmatrix} 3 \\\\ 4 \\end{pmatrix}$ закреплён; засечки на его прямой — единичные шаги. Перетащите $\\yellow{\\vec w}$ так, чтобы его тень на $\\vec v$ шла вперёд ровно на $2$ шага.',
      },
      task: {
        kind: 'drag',
        target: [[-2, 4], [0, 2.5], [2, 1], [4, -0.5]].map(([wx, wy]) => ({ wx, wy })),
        back: 0,
        right: {
          en: 'The shadow is $\\frac{\\vec v \\cdot \\vec w}{|\\vec v|} = \\frac{3 w_x + 4 w_y}{5} = 2$. Every point of a whole line works — the line perpendicular to $\\vec v$ through the second tick: moving along it does not change the shadow.',
          ru: 'Тень равна $\\frac{\\vec v \\cdot \\vec w}{|\\vec v|} = \\frac{3 w_x + 4 w_y}{5} = 2$. Подходит любая точка целой прямой — перпендикуляра к $\\vec v$ через вторую засечку: движение вдоль него тень не меняет.',
        },
        mistakes: [[2, -1], [-2, 2], [0, 0.5]].map(([wx, wy]) => ({ params: { wx, wy }, text: {
          en: 'Here $\\vec v \\cdot \\vec w = 2$, but the shadow is shorter: the product is the shadow <b>times</b> $|\\vec v| = 5$. Count the ticks.',
          ru: 'Здесь $\\vec v \\cdot \\vec w = 2$, но тень короче: произведение — это тень, <b>умноженная</b> на $|\\vec v| = 5$. Считайте засечки.' } })),
        hints: {
          wx: { en: 'Count the ticks under the green shadow: it should end at the second one.', ru: 'Посчитайте засечки под зелёной тенью: она должна кончаться на второй.' },
          wy: { en: 'Count the ticks under the green shadow: it should end at the second one.', ru: 'Посчитайте засечки под зелёной тенью: она должна кончаться на второй.' },
        },
      },
      state: { show: ['shadowT'], params: { wx: -1, wy: 1 }, window: { cx: 0.5, cy: 1.3, unit: 52 }, controls: [] },
    },
  ],
};
