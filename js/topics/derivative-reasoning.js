// Counterexamples and transfer: keep the original topic's reference indices stable.
import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';

export const localEstimate = (value, slope, change) => value + slope * change;
const L = (ru, en) => ({ ru, en });
const WINDOW = { cx: 0, cy: 0.8, unit: 105 };

export function setupReasoning(scene) {
  scene.add('y = abs(x)', { id: 'corner', color: 'blue', visible: false });
  scene.add('y = x^3', { id: 'stationary', color: 'blue', visible: false });
  scene.ensureParam('gap', 0.8, { min: 0.01, max: 1, step: 0.01 });
  scene.ensureParam('estimate', 9, { min: 8.8, max: 9.5, step: 0.01 });
  scene.custom.push({
    id: 'cornerEvidence',
    draw2d(p, sc, s) {
      for (const side of [-1, 1]) {
        const x = side * s.gap, y = s.gap, color = side < 0 ? COLORS.red : COLORS.green;
        p.line(0, 0, x, y, color, { width: 3, extend: true });
        p.dot(x, y, color, 6);
      }
      p.dot(0, 0, COLORS.yellow, 5);
    },
    legend: s => `h=${fmt(s.gap)}\\quad \\red{\\frac{|-h|-0}{-h}=-1}\\quad \\green{\\frac{|h|-0}{h}=1}`,
  }, {
    id: 'positionPrediction',
    draw2d(p, sc, s) {
      p.line(8.8, 0, 9.5, 0, COLORS.grey, { width: 2 });
      p.dot(9, 0, COLORS.blue, 6);
      p.tex('initial-position', 's(2)=9\\ \\mathrm{m}', 9, 0, COLORS.blue, { dy: -28, align: 'center' });
      p.dot(s.estimate, 0, COLORS.yellow, 6);
      p.tex('predicted-position', `\\mathrm{estimate}=${fmt(s.estimate)}\\ \\mathrm{m}`, s.estimate, 0, COLORS.yellow, { dy: 28, align: 'center' });
    },
  }, {
    id: 'stationaryEvidence',
    draw2d(p) {
      p.line(-1.5, 0, 1.5, 0, COLORS.green, { width: 2.5 });
      p.dot(0, 0, COLORS.yellow, 6);
      for (const x of [-0.7, 0.7]) p.dot(x, x ** 3, COLORS.blue, 5);
    },
    legend: () => `f'(x)=3x^2\\quad f'(0)=0\\quad f(-0.7)<f(0)<f(0.7)`,
  });
}

export const reasoningSteps = [{
  id: 'corner-prediction',
  title: L('Всегда ли приближение даёт один наклон?', 'Does zooming always give one slope?'),
  text: L('Заменим гладкую дорогу на $q(x)=|x|$. Точку $a=0$ держим неподвижно. Прежде чем измерять, предположите: получим ли один наклон, если подходить к ней с разных сторон?', 'Replace the smooth road with $q(x)=|x|$. Hold $a=0$ fixed. Before measuring, predict whether approaching from either side gives one slope.'),
  check: {
    q: L('Какой будет производная в нуле?', 'What will the derivative at zero be?'),
    options: [
      { text: L('Ноль: внизу всегда горизонтальная касательная', 'Zero: a bottom always has a horizontal tangent') },
      { text: L('Единого наклона нет', 'There is no single slope'), ok: true },
      { text: L('Один: справа наклон равен одному', 'One: the slope on the right is one') },
    ],
    explain: L('Справа отношение равно $h/h=1$, слева — $h/(-h)=-1$. Уменьшение расстояния не сближает эти числа. Производной в нуле нет, хотя минимум есть. Дальше проверьте это, меняя только расстояние.', 'On the right the quotient is $h/h=1$; on the left it is $h/(-h)=-1$. Shrinking the distance never brings them together. There is a minimum but no derivative at zero. Next, test this by changing only the distance.'),
    reveal(scene) { scene.get('cornerEvidence').visible = true; scene.animateParams({ gap: 0.15 }, 1600); },
  },
  state: { show: ['corner'], params: { gap: 0.8 }, controls: [], window: WINDOW },
}, {
  id: 'corner-experiment',
  title: L('Под микроскопом: меняем только расстояние', 'Under the microscope: change only the distance'),
  text: L('Функция и точка зафиксированы. Ползунок $gap$ меняет только расстояние до двух пробных точек. Следите отдельно за левой и правой секущими. Чтобы существовала производная, их наклоны должны стремиться к <b>одному и тому же конечному числу</b>. Проверка на нескольких масштабах — наблюдение; равенства $h/(-h)=-1$ и $h/h=1$ объясняют результат для любого $h>0$.', 'The function and the base point stay fixed. The $gap$ slider changes only the distance to the two sample points. Follow each secant separately. A derivative requires their slopes to approach <b>the same finite number</b>. Several zoom levels are observations; the identities $h/(-h)=-1$ and $h/h=1$ explain every $h>0$.'),
  try: L('Уменьшите gap от 1 до 0.01. Что сближается: точки или наклоны?', 'Shrink gap from 1 to 0.01. What converges: the points or the slopes?'),
  state: { show: ['corner', 'cornerEvidence'], params: { gap: 1 }, ms: 0, controls: ['gap'], window: WINDOW },
}, {
  id: 'stationary-counterexample',
  title: L('А нулевой наклон гарантирует экстремум?', 'Does zero slope guarantee an extremum?'),
  text: L('Теперь новая функция $r(x)=x^3$. Рассмотрите поведение по обе стороны нуля. Достаточно ли горизонтальной касательной, чтобы объявить эту точку вершиной или дном?', 'Now consider a new function $r(x)=x^3$. Examine both sides of zero. Is a horizontal tangent enough to call this point a top or a bottom?'),
  check: {
    q: L('Что происходит при x = 0?', 'What happens at x = 0?'),
    options: [
      { text: L('Минимум, потому что производная равна нулю', 'A minimum, because the derivative is zero') },
      { text: L('Максимум, потому что касательная горизонтальна', 'A maximum, because the tangent is horizontal') },
      { text: L('Ни то ни другое: функция продолжает возрастать', 'Neither: the function keeps increasing'), ok: true },
    ],
    explain: L('$r\'(0)=0$, но слева значения отрицательны, справа положительны: рядом есть и меньшие, и большие значения. Это контрпример к правилу «производная ноль ⇒ экстремум». Для поиска экстремума исследуйте поведение по обе стороны; обратите внимание, меняется ли знак производной.', '$r\'(0)=0$, but nearby values are negative on the left and positive on the right: both smaller and larger values occur. This refutes “zero derivative implies an extremum”. Inspect both sides when looking for extrema; check whether the derivative changes sign.'),
    reveal(scene) { scene.get('stationaryEvidence').visible = true; },
  },
  hint: {
    title: L('Какое утверждение всё-таки верно?', 'Which statement does hold?'),
    text: L('Если во внутренней точке минимума производная существует, она равна нулю. Почему? Вблизи минимума числитель $f(a+h)-f(a)$ неотрицателен. Справа делим на $h>0$ и получаем неотрицательные наклоны; слева на $h<0$ — неположительные. Их общий предел обязан быть нулём. Для максимума знаки меняются местами. У $|x|$ общего предела нет, а у $x^3$ нет экстремума: ни один пример этому утверждению не противоречит.', 'If a derivative exists at an interior local minimum, it is zero. Why? Nearby, the numerator $f(a+h)-f(a)$ is nonnegative. Dividing by $h>0$ gives nonnegative slopes; dividing by $h<0$ gives nonpositive slopes. Their common limit must be zero. At a maximum the signs reverse. The common limit is absent for $|x|$, and the extremum is absent for $x^3$: neither example contradicts this statement.'),
  },
  state: { show: ['stationary'], controls: [], window: WINDOW },
}];

export const transferStep = {
  id: 'local-transfer',
  title: L('Перенос: предсказать положение по скорости', 'Transfer: predict position from velocity'),
  text: L('Датчик сообщает: в момент $t=2$ положение равно $s(2)=9$ м, мгновенная скорость $s\'(2)=4$ м/с. Формулы движения нет. Оцените положение через $0.05$ с, считая скорость на этом коротком промежутке постоянной. Ползунком estimate задайте <b>положение</b> в метрах. Это локальное приближение: точного положения этих данных недостаточно.', 'A sensor reports position $s(2)=9$ m and instantaneous velocity $s\'(2)=4$ m/s. The motion formula is unavailable. Estimate the position $0.05$ s later by treating velocity as constant over this short interval. Set the <b>position</b> in metres using estimate. This is a local approximation: the exact position cannot be determined from these data.'),
  task: {
    kind: 'drag', target: { estimate: localEstimate(9, 4, 0.05) }, tol: 0.005, back: 3,
    right: L('$9+4\\cdot0.05=9.2$ м: наклон превращает маленькое изменение времени в изменение положения. Приращение равно $0.2$ м; положение — $9.2$ м. Если скорость меняется, точный ответ может отличаться.', '$9+4\\cdot0.05=9.2$ m: the slope converts a small time change into a position change. The increment is $0.2$ m; the position is $9.2$ m. Changing velocity can make the exact answer differ.'),
    mistakes: [{ params: { estimate: 9.05 }, text: L('Вы прибавили время к положению. Сначала умножьте изменение времени на скорость: секунды сократятся, получатся метры.', 'You added time to position. First multiply the time change by velocity: seconds cancel, leaving metres.') }],
    hints: { estimate: L('Разделите рассуждение: изменение положения ≈ скорость × время; затем прибавьте начальное положение. Проверьте единицы.', 'Split the reasoning: position change ≈ velocity × time; then add the starting position. Check the units.') },
  },
  state: { show: ['positionPrediction'], params: { estimate: 9 }, ms: 0, controls: ['estimate'], window: { cx: 9.15, cy: 0, unit: 600 }, windowMs: 1 },
};
