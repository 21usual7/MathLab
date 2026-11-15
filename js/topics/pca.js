// Principal components: where a cloud is stretched. Shadows of the points on a line through the centre and the
// spread of the shadows; the proof that the line of the widest shadows is the line closest to the points
// (Pythagoras for every point); the spread over all directions is a wave with its top on an eigenvector of
// the covariance matrix; not the regression line; and in space a pancake squeezed into its own plane.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t } from '../core/i18n.js';
import { box, section } from '../core/geom.js';
import { ellipseCloud, pancake, centre, covariance, spreadAlong, eigenSym, bestLine } from './ml-math.js';

const r2 = v => fmt(Math.round(v * 100) / 100);
const deg = a => Math.round(((a * 180 / Math.PI) % 180 + 180) % 180);
const WIN = { cx: 0, cy: 0, unit: 108 };
const CLOUD = ellipseCloud(), M = centre(CLOUD), C = covariance(CLOUD);
const EIG = eigenSym(C).map(e => ({ ...e, vector: e.vector[0] < 0 ? e.vector.map(v => -v) : e.vector }));
const TH0 = Math.atan2(EIG[0].vector[1], EIG[0].vector[0]); // the direction of the widest spread
const TOTAL = C[0][0] + C[1][1];
const dir = th => [Math.cos(th), Math.sin(th)];
const along = th => spreadAlong(C, dir(th));
const SAMPLE = [3, 11, 20, 38, 47]; // the points that show their right triangles in the proof

// The line through the centre at angle θ, the shadows of the points on it and the band ±σ of the shadows
function shadows(p, sc, s, { tri = false, band = true, handle = true } = {}) {
  const u = dir(s.th), n = [-u[1], u[0]], sd = Math.sqrt(along(s.th));
  if (band) {
    p.fill([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [M[0] + u[0] * a * sd + n[0] * b * 0.07, M[1] + u[1] * a * sd + n[1] * b * 0.07]), COLORS.yellow + '55');
  }
  p.line(M[0], M[1], M[0] + u[0], M[1] + u[1], COLORS.yellow, { width: 2.5, extend: true });
  CLOUD.forEach(([x, y], i) => {
    const a = (x - M[0]) * u[0] + (y - M[1]) * u[1], S = [M[0] + a * u[0], M[1] + a * u[1]];
    const on = !tri || SAMPLE.includes(i);
    p.line(x, y, ...S, COLORS.purple + (on ? 'aa' : '30'), { width: on && tri ? 2 : 1 });
    if (tri && on) {
      p.line(M[0], M[1], x, y, COLORS.teal, { width: 2 });
      p.line(M[0], M[1], ...S, COLORS.yellow, { width: 3 });
    }
    p.dot(...S, COLORS.yellow, 2.5);
  });
  CLOUD.forEach(([x, y], i) => p.dot(x, y, tri && SAMPLE.includes(i) ? COLORS.teal : COLORS.blue, 4.5));
  p.dot(M[0], M[1], '#ffffff', 4);
  if (handle) p.handle(M[0] + 2.6 * u[0], M[1] + 2.6 * u[1], COLORS.yellow, (x, y) => sc.setParam('th', Math.atan2(y - M[1], x - M[0])));
}

// The spread of the shadows for every direction 0°…180°: a small chart in the corner
function wave(p, s) {
  const ctx = p.ctx, W = Math.min(250, p.w * 0.44), H = W * 0.56, x0 = p.w - W - 12, y0 = 12;
  const X = a => x0 + 14 + (W - 28) * a / Math.PI, Y = v => y0 + H - 24 - (H - 44) * v / TOTAL;
  ctx.fillStyle = 'rgba(13,17,23,0.88)'; ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.rect(x0, y0, W, H); ctx.fill(); ctx.stroke();
  for (const [f, c] of [[a => along(a), COLORS.yellow], [a => TOTAL - along(a), COLORS.purple]]) {
    ctx.beginPath();
    for (let k = 0; k <= 90; k++) { const a = Math.PI * k / 90; k ? ctx.lineTo(X(a), Y(f(a))) : ctx.moveTo(X(a), Y(f(a))); }
    p.stroke(c, 2);
  }
  const a = ((s.th % Math.PI) + Math.PI) % Math.PI;
  ctx.beginPath(); ctx.moveTo(X(a), y0 + 20); ctx.lineTo(X(a), y0 + H - 22); p.stroke('rgba(255,255,255,0.45)', 1);
  ctx.beginPath(); ctx.arc(X(a), Y(along(a)), 4, 0, 2 * Math.PI); ctx.fillStyle = COLORS.yellow; ctx.fill();
  ctx.font = '500 10px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#6f7a8c';
  [0, 90, 180].forEach(d => ctx.fillText(`${d}°`, X(d * Math.PI / 180), y0 + H - 8));
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.yellow; ctx.fillText(t({ en: 'along', ru: 'вдоль' }), x0 + 8, y0 + 14);
  ctx.fillStyle = COLORS.purple; ctx.fillText(t({ en: 'across', ru: 'поперёк' }), x0 + 52, y0 + 14);
}

const spreadTex = s => `\\yellow{\\sigma^2_{\\parallel} = ${r2(along(s.th))}} \\quad + \\quad \\purple{\\sigma^2_{\\perp} = ${r2(TOTAL - along(s.th))}} \\quad = \\quad ${r2(TOTAL)}`;
const mat2 = A => `\\begin{pmatrix} ${A.map(r => r.map(r2).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;

// ---- In space ----
const CAKE = pancake(), MC = centre(CAKE), E3 = eigenSym(covariance(CAKE)), SUM3 = E3.reduce((m, e) => m + e.value, 0);
const K = 0.62; // the picture's scale: the pancake fits in the box
const BOX = box(4, 4);
const sc3 = P => P.map((v, i) => K * (v - MC[i]));
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export default {
  view: '2d',
  view2d: WIN,
  view3d: { R: 4, zmax: 4, camera: [6.5, -8.5, 5] },
  lab: false,

  setup(scene) {
    scene.ensureParam('th', 1.6, { min: -Math.PI, max: Math.PI, step: 0.005 }); // the angle of the line
    scene.ensureParam('u', 0, { min: 0, max: 1, step: 0.01 }); // in space: from the cloud to its shadow on the plane
    scene.ensureParam('q', 3, { min: 1, max: 3, step: 1 }); // how many components to keep

    scene.custom.push(
      {
        id: 'shadows',
        draw2d(p, sc, s) { shadows(p, sc, s); },
        legend: s => `\\text{${t({ en: 'angle', ru: 'угол' })} } ${deg(s.th)}°: \\quad \\yellow{\\sigma^2_{\\parallel} = ${r2(along(s.th))}}`,
      },
      {
        // The proof: one right triangle for every point
        id: 'pyth',
        draw2d(p, sc, s) { shadows(p, sc, s, { tri: true, band: false }); },
        legend: spreadTex,
      },
      {
        id: 'wave',
        draw2d(p, sc, s) { shadows(p, sc, s); wave(p, s); },
        legend: spreadTex,
      },
      {
        // The covariance matrix: it turns the unit circle into an ellipse whose axes are its eigenvectors
        id: 'cov',
        draw2d(p, sc, s) {
          const ring = Array.from({ length: 73 }, (_, k) => dir(k * Math.PI / 36));
          p.polyline(ring.map(([x, y]) => [M[0] + x, M[1] + y]), 'rgba(255,255,255,0.35)', 1.5);
          p.polyline(ring.map(([x, y]) => [M[0] + C[0][0] * x + C[0][1] * y, M[1] + C[1][0] * x + C[1][1] * y]), COLORS.teal, 2.5);
          CLOUD.forEach(([x, y]) => p.dot(x, y, COLORS.blue + '88', 3.5));
          // A direction u and where C sends it: only on the eigenvectors Cu stays on the line of u
          const u = dir(s.th), Cu = [C[0][0] * u[0] + C[0][1] * u[1], C[1][0] * u[0] + C[1][1] * u[1]];
          p.line(M[0], M[1], M[0] + u[0], M[1] + u[1], 'rgba(255,255,255,0.15)', { width: 1, extend: true });
          p.arrow(...M, M[0] + u[0], M[1] + u[1], COLORS.yellow, { width: 3 });
          p.arrow(...M, M[0] + Cu[0], M[1] + Cu[1], COLORS.teal, { width: 3 });
          p.tex('u', '\\vec u', M[0] + u[0], M[1] + u[1], COLORS.yellow, { dx: 8, dy: -12 });
          p.tex('Cu', 'C\\vec u', M[0] + Cu[0], M[1] + Cu[1], COLORS.teal, { dx: 8, dy: -12 });
          EIG.forEach((e, i) => p.line(...M, M[0] + e.vector[0] * e.value, M[1] + e.vector[1] * e.value, [COLORS.green, COLORS.red][i], { width: 1.5, dash: [5, 4] }));
          p.handle(M[0] + 2.2 * u[0], M[1] + 2.2 * u[1], COLORS.yellow, (x, y) => sc.setParam('th', Math.atan2(y - M[1], x - M[0])));
        },
        legend: s => `\\begin{gathered} C = ${mat2(C)} \\\\ \\vec u^{\\,T} C \\vec u = \\yellow{\\sigma^2_{\\parallel} = ${r2(along(s.th))}}, \\quad \\lambda_1 = \\green{${r2(EIG[0].value)}},\\ \\lambda_2 = \\red{${r2(EIG[1].value)}} \\end{gathered}`,
      },
      {
        // Regression (vertical misses) against the first component (perpendicular ones)
        id: 'vsreg',
        draw2d(p, sc, s) {
          const B = bestLine(CLOUD), u = EIG[0].vector;
          CLOUD.forEach(([x, y]) => {
            p.line(x, y, x, B.w * x + B.b, COLORS.orange + '66', { width: 1 });
            const a = (x - M[0]) * u[0] + (y - M[1]) * u[1];
            p.line(x, y, M[0] + a * u[0], M[1] + a * u[1], COLORS.purple + '66', { width: 1 });
          });
          p.line(0, B.b, 1, B.w + B.b, COLORS.orange, { width: 2.5, extend: true });
          p.line(...M, M[0] + u[0], M[1] + u[1], COLORS.yellow, { width: 2.5, extend: true });
          CLOUD.forEach(([x, y]) => p.dot(x, y, COLORS.blue, 4.5));
        },
        legend: () => `\\orange{\\text{${t({ en: 'regression', ru: 'регрессия' })}: } k = ${r2(bestLine(CLOUD).w)}} \\qquad \\yellow{\\text{${t({ en: 'component', ru: 'компонента' })}: } k = ${r2(EIG[0].vector[1] / EIG[0].vector[0])}}`,
      },
      {
        // A pancake in space: its own axes, its plane, and the points pressed onto it
        id: 'cake',
        draw3d(p, sc, s) {
          const keep = Math.round(s.q), ax = E3.map(e => e.vector);
          CAKE.forEach((P, i) => {
            const d = P.map((v, k) => v - MC[k]);
            const proj = ax.slice(0, keep).reduce((m, a) => m.map((v, k) => v + dot3(d, a) * a[k]), [0, 0, 0]);
            const Q = d.map((v, k) => K * (v + (proj[k] - v) * s.u));
            p.sphere(`c${i}`, Q, COLORS.blue, 0.055);
          });
          if (keep === 2) p.sheet('plane', section(BOX, { n: ax[2], d: 0 }), COLORS.yellow, { opacity: 0.14 });
          E3.forEach((e, i) => p.arrow(`e${i}`, [0, 0, 0], e.vector.map(v => v * K * 2 * Math.sqrt(e.value) + 1e-9), [COLORS.green, COLORS.red, COLORS.purple][i], { name: `PC${i + 1}` }));
        },
        legend: s => {
          const keep = Math.round(s.q), kept = E3.slice(0, keep).reduce((m, e) => m + e.value, 0) / SUM3;
          return `\\lambda = ${E3.map((e, i) => `\\textcolor{${[COLORS.green, COLORS.red, COLORS.purple][i]}}{${r2(e.value)}}`).join(',\\ ')} \\qquad \\text{${t({ en: 'kept', ru: 'сохранено' })}: } ${Math.round(kept * 1000) / 10}\\%`;
        },
      },
    );
  },

  steps: [
    {
      title: { en: 'A stretched cloud', ru: 'Вытянутое облако' },
      text: {
        en: 'Sixty points with two numbers each — say, the heights of fathers and of their sons, as deviations from the average. The cloud is stretched along a slanted line: the two numbers mostly rise together. Maybe one number per point is enough — its position along a good line? Put the line through the centre, drop every point onto it: the yellow dots are the shadows, the purple segments what is lost.',
        ru: 'Шестьдесят точек по два числа — скажем, рост отцов и их сыновей, в отклонениях от среднего. Облако вытянуто вдоль косой прямой: два числа в основном растут вместе. Может, на точку хватит одного числа — её места вдоль хорошей прямой? Проведём прямую через центр и опустим на неё каждую точку: жёлтые точки — тени, фиолетовые отрезки — то, что теряется.',
      },
      try: { en: 'Turn the line by its handle.', ru: 'Поворачивайте прямую за ручку.' },
      state: { view: '2d', show: ['shadows'], params: { th: 1.6 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'Keep the spread', ru: 'Сохранить разброс' },
      text: {
        en: 'Which line is good? The shadows should stay as different as the points were — keep their <b>spread</b> $\\sigma^2_{\\parallel}$, the mean square distance of the shadows from the centre (the yellow band is $\\pm\\sigma$). Across the cloud the shadows crowd together, along it they spread wide. The best line is the one with the widest shadows: the <i>first principal component</i>.',
        ru: 'Какая прямая хороша? Тени должны остаться такими же разными, какими были точки, — сохранить <b>разброс</b> $\\sigma^2_{\\parallel}$, средний квадрат расстояния теней от центра (жёлтая полоса — $\\pm\\sigma$). Поперёк облака тени сбиваются в кучу, вдоль — расходятся широко. Лучшая прямая — с самыми широкими тенями: это <i>первая главная компонента</i>.',
      },
      try: { en: 'Find the angle with the largest $\\sigma^2_{\\parallel}$.', ru: 'Найдите угол с самым большим $\\sigma^2_{\\parallel}$.' },
      state: { view: '2d', show: ['shadows'], params: { th: 1.6 }, window: WIN, controls: [] },
    },
    {
      proof: true,
      statement: {
        en: '<b>Theorem.</b> The line through the centre with the widest shadows is also the line <b>closest</b> to the points: it has the smallest mean square of the perpendiculars.',
        ru: '<b>Теорема.</b> Прямая через центр с самыми широкими тенями — это и прямая, <b>ближайшая</b> к точкам: у неё наименьший средний квадрат перпендикуляров.',
      },
      title: { en: 'A right triangle for every point', ru: 'Прямоугольный треугольник у каждой точки' },
      text: {
        en: 'Take a point. The segment from the centre to it (teal), its shadow (yellow) and the perpendicular (purple) are a right triangle. By Pythagoras: $$\\text{dist}^2 = \\text{shadow}^2 + \\text{perpendicular}^2.$$ Turn the line: the shadow and the perpendicular change, the teal hypotenuse does not.',
        ru: 'Возьмём точку. Отрезок от центра до неё (бирюзовый), её тень (жёлтый) и перпендикуляр (фиолетовый) — прямоугольный треугольник. По Пифагору: $$\\text{расст}^2 = \\text{тень}^2 + \\text{перпендикуляр}^2.$$ Поворачивайте прямую: тень и перпендикуляр меняются, бирюзовая гипотенуза — нет.',
      },
      state: { view: '2d', show: ['pyth'], params: { th: 1.2 }, window: WIN, controls: [] },
    },
    {
      proof: true,
      title: { en: 'The sum does not move', ru: 'Сумма стоит на месте' },
      text: {
        en: 'Add the equalities for all points and divide by $n$: $$\\sigma^2_{\\parallel} + \\sigma^2_{\\perp} = \\tfrac1n \\textstyle\\sum \\text{dist}^2 = \\text{const},$$ the total spread of the cloud, which does not depend on the line. So when the yellow part is the largest, the purple part is the smallest: the widest shadows and the shortest perpendiculars are the same line. $\\blacksquare$',
        ru: 'Сложим равенства по всем точкам и поделим на $n$: $$\\sigma^2_{\\parallel} + \\sigma^2_{\\perp} = \\tfrac1n \\textstyle\\sum \\text{расст}^2 = \\text{const},$$ — полный разброс облака, от прямой он не зависит. Поэтому когда жёлтая часть наибольшая, фиолетовая наименьшая: самые широкие тени и самые короткие перпендикуляры дают одну и ту же прямую. $\\blacksquare$',
      },
      try: { en: 'Turn the line: the two numbers in the legend trade, the sum stays.', ru: 'Поворачивайте прямую: два числа в подписи перетекают друг в друга, сумма стоит.' },
      state: { view: '2d', show: ['pyth'], params: { th: 1.2 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'The spread is a wave', ru: 'Разброс — это волна' },
      text: {
        en: 'The chart shows $\\sigma^2_{\\parallel}$ for every direction from $0°$ to $180°$: a smooth wave with one top and one bottom. The top is the first component; the bottom — the direction of the smallest spread, the <i>second component</i>.',
        ru: 'График показывает $\\sigma^2_{\\parallel}$ для каждого направления от $0°$ до $180°$: плавная волна с одной вершиной и одной впадиной. Вершина — первая компонента; впадина — направление наименьшего разброса, <i>вторая компонента</i>.',
      },
      try: { en: 'Turn the line and watch the white mark run along the wave.', ru: 'Поворачивайте прямую — белая метка бежит по волне.' },
      check: {
        q: { en: 'How many degrees apart are the top and the bottom?', ru: 'На сколько градусов отстоят вершина и впадина?' },
        options: [{ text: '$45°$' }, { text: '$90°$', ok: true }, { text: { en: 'It depends on the cloud', ru: 'Зависит от облака' } }],
        explain: {
          en: 'Always $90°$: the line of the smallest spread is perpendicular to the line of the largest. Next step — why: they are the two eigenvectors of one symmetric matrix.',
          ru: 'Всегда $90°$: прямая наименьшего разброса перпендикулярна прямой наибольшего. На следующем шаге — почему: это два собственных вектора одной симметричной матрицы.',
        },
        reveal: scene => scene.animateParams({ th: TH0 }, 1200),
      },
      state: { view: '2d', show: ['wave'], params: { th: 1.6 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'The covariance matrix and its eigenvectors', ru: 'Матрица ковариации и её собственные векторы' },
      text: {
        en: 'All the spreads are kept in one $2 \\times 2$ matrix $C$: on the diagonal the spreads of $x$ and of $y$, off it how much they rise together. The spread along a unit arrow $\\vec u$ is $\\vec u^{\\,T} C \\vec u$. As a map, $C$ turns the unit circle into the teal ellipse. Usually $C\\vec u$ leans away from $\\vec u$; only on the axes of the ellipse does it keep the line — the <b>eigenvectors</b>, and the stretch $\\lambda$ there is exactly the spread. The largest $\\lambda$ is the first component.',
        ru: 'Все разбросы хранит одна матрица $2 \\times 2$ — $C$: на диагонали разбросы $x$ и $y$, вне её — насколько они растут вместе. Разброс вдоль единичной стрелки $\\vec u$ равен $\\vec u^{\\,T} C \\vec u$. Как преобразование, $C$ превращает единичную окружность в бирюзовый эллипс. Обычно $C\\vec u$ отклоняется от $\\vec u$; только на осях эллипса он остаётся на прямой — это <b>собственные векторы</b>, и растяжение $\\lambda$ там ровно равно разбросу. Наибольшее $\\lambda$ — первая компонента.',
      },
      try: { en: 'Turn $\\vec u$ until $C\\vec u$ lies on its line. There are two such lines, at a right angle.', ru: 'Поворачивайте $\\vec u$, пока $C\\vec u$ не ляжет на его прямую. Таких прямых две, под прямым углом.' },
      state: { view: '2d', show: ['cov'], params: { th: 1.6 }, window: { cx: 0.3, cy: 0.3, unit: 130 }, controls: [] },
    },
    {
      title: { en: 'Not the regression line', ru: 'Не прямая регрессии' },
      text: {
        en: 'Both lines go through the centre of the cloud, but they answer different questions. Regression predicts $y$ from $x$ and minimises <b>vertical</b> misses (orange). The component treats both numbers alike and minimises <b>perpendicular</b> ones (purple).',
        ru: 'Обе прямые проходят через центр облака, но отвечают на разные вопросы. Регрессия предсказывает $y$ по $x$ и уменьшает <b>вертикальные</b> промахи (оранжевые). Компонента относится к обоим числам одинаково и уменьшает <b>перпендикулярные</b> (фиолетовые).',
      },
      check: {
        q: { en: 'Which line is flatter?', ru: 'Какая прямая положе?' },
        options: [{ text: { en: 'Regression', ru: 'Регрессия' }, ok: true }, { text: { en: 'The component', ru: 'Компонента' } }, { text: { en: 'They coincide', ru: 'Они совпадают' } }],
        explain: {
          en: 'Regression: $0.56$, the component: $0.66$. Predicting the son from the father, regression does not dare to follow the father all the way: very tall fathers have sons who are tall, but less so. This is where the word "regression" comes from — Galton\'s "regression to the mean".',
          ru: 'Регрессия: $0.56$, компонента: $0.66$. Предсказывая сына по отцу, регрессия не решается идти за отцом до конца: у очень высоких отцов сыновья высокие, но поменьше. Отсюда и само слово «регрессия» — «возврат к среднему» у Гальтона.',
        },
      },
      state: { view: '2d', show: ['vsreg'], window: WIN, controls: [] },
    },
    {
      title: { en: 'In space: a pancake', ru: 'В пространстве: блин' },
      text: {
        en: 'Now three numbers per point. The cloud is a pancake: long, wide and very thin. Its covariance matrix is $3 \\times 3$ with three perpendicular eigenvectors: PC1 along the pancake, PC2 across it, PC3 through its thickness. Keep two components — press every point onto the plane of PC1 and PC2: three numbers become two, and $99\\%$ of the spread stays. That is compression, and the first thing done to data with hundreds of numbers per point.',
        ru: 'Теперь у точки три числа. Облако — блин: длинный, широкий и очень тонкий. Его матрица ковариации — $3 \\times 3$, с тремя перпендикулярными собственными векторами: PC1 вдоль блина, PC2 поперёк, PC3 — сквозь толщину. Оставим две компоненты — прижмём каждую точку к плоскости PC1 и PC2: три числа станут двумя, а разброса сохранится $99\\%$. Это сжатие — и первое, что делают с данными, где у точки сотни чисел.',
      },
      try: { en: 'Move $u$ from $0$ to $1$ and turn the view. Then set $q = 1$: the pancake becomes a stick.', ru: 'Двигайте $u$ от $0$ до $1$ и поворачивайте вид. Потом поставьте $q = 1$: блин станет палкой.' },
      state: { view: '3d', show: ['cake'], params: { u: 0, q: 2 }, controls: ['u', 'q'] },
      enter(scene) { scene.setParam('u', 0); scene.animateParams({ u: 1 }, 4000); },
    },
    {
      title: { en: 'Find the first component', ru: 'Найдите первую компоненту' },
      text: {
        en: 'Turn the line to the direction of the largest spread of the shadows — to within a couple of degrees.',
        ru: 'Поверните прямую в направление наибольшего разброса теней — с точностью до пары градусов.',
      },
      task: {
        kind: 'drag',
        ok: s => Math.abs(Math.sin(s.th - TH0)) < 0.04,
        target: { th: TH0 },
        back: 4,
        right: {
          en: `About $${deg(TH0)}°$: $\\sigma^2_{\\parallel} = ${r2(EIG[0].value)}$, that is $${Math.round(EIG[0].value / TOTAL * 100)}\\%$ of the whole spread. One number per point keeps almost everything.`,
          ru: `Около $${deg(TH0)}°$: $\\sigma^2_{\\parallel} = ${r2(EIG[0].value)}$, это $${Math.round(EIG[0].value / TOTAL * 100)}\\%$ всего разброса. Одно число на точку сохраняет почти всё.`,
        },
        mistakes: [{ when: s => Math.abs(Math.cos(s.th - TH0)) < 0.06, text: { en: 'This is the narrowest direction — the second component. Turn by $90°$.', ru: 'Это самое узкое направление — вторая компонента. Поверните на $90°$.' } }],
        hint: s => ({ en: `$\\sigma^2_{\\parallel} = ${r2(along(s.th))}$. It can be larger.`, ru: `$\\sigma^2_{\\parallel} = ${r2(along(s.th))}$. Можно больше.` }),
      },
      state: { view: '2d', show: ['shadows'], params: { th: -0.9 }, window: WIN, controls: [] },
    },
    {
      title: { en: 'How many to keep', ru: 'Сколько оставить' },
      text: {
        en: 'Keep as few components of the pancake as possible, but at least $95\\%$ of the spread.',
        ru: 'Оставьте как можно меньше компонент блина, но не меньше $95\\%$ разброса.',
      },
      task: {
        kind: 'drag',
        target: { q: 2 },
        tol: 0.4,
        back: 7,
        right: {
          en: 'Two: $99.1\\%$. One keeps only $78\\%$ — the pancake is wide, not just long; the third adds the thickness, less than $1\\%$.',
          ru: 'Две: $99.1\\%$. Одна сохраняет только $78\\%$ — блин не только длинный, но и широкий; третья добавляет толщину, меньше $1\\%$.',
        },
        mistakes: [
          { params: { q: 1 }, text: { en: 'One component keeps $78\\%$: too little.', ru: 'Одна компонента сохраняет $78\\%$: мало.' } },
          { params: { q: 3 }, text: { en: '$100\\%$ — but that is no compression at all. Fewer.', ru: '$100\\%$ — но это вовсе не сжатие. Меньше.' } },
        ],
      },
      state: { view: '3d', show: ['cake'], params: { u: 1, q: 3 }, controls: ['q'] },
    },
  ],
};
