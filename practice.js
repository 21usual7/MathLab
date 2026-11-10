// Practice: endless generated problems, 3 levels per topic, answers checked by meaning
// (an equivalent expression or an exact/decimal number is accepted).

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];
const nz = (a, b) => { let v; do { v = ri(a, b); } while (v === 0); return v; };

// "+ 3" / "- 3" for writing "x + 3", "x - 3" from a signed number
const sgn = c => (c < 0 ? `- ${-c}` : `+ ${c}`);

// Signed sum of terms: [[3, 'x^2'], [-1, 'x'], [5, '']] → "3 x^2 - x + 5"
function sum(terms) {
  let s = '';
  for (const [c, body] of terms) {
    if (c === 0) continue;
    const a = Math.abs(c);
    const t = body ? (a === 1 ? body : `${a} ${body}`) : String(a);
    s += s ? (c < 0 ? ' - ' : ' + ') + t : (c < 0 ? '-' : '') + t;
  }
  return s || '0';
}

// m·x as text: "x", "-x", "3 x"
const lin = m => (m === 1 ? 'x' : m === -1 ? '-x' : `${m} x`);

const tex = s => texOf(parseExpr(s));

function numberProblem(q, exact, hint, solution, sandbox) {
  return {
    kind: 'number', q, value: evalNumber(exact), hint, sandbox,
    solution: solution + bi(`Answer: $${tex(exact)}$`, `Ответ: $${tex(exact)}$`),
  };
}

// ---------- Logarithms & exponents ----------

function genLogs(level) {
  const compute = bi('Compute.', 'Вычислите.');
  if (level === 1) {
    if (Math.random() < 0.7) {
      const b = pickOne([2, 3, 5, 10]);
      const k = ri(-2, b === 2 ? 6 : 3);
      const arg = k >= 0 ? String(b ** k) : `\\frac{1}{${b ** -k}}`;
      return numberProblem(compute + `$$\\log_{${b}} ${arg}$$`, String(k),
        bi(`To what power must ${b} be raised to get this number? $\\log_a a^k = k$.`,
           `В какую степень нужно возвести ${b}, чтобы получить это число? $\\log_a a^k = k$.`),
        `$$${b}^{${k}} = ${arg} \\;\\Rightarrow\\; \\log_{${b}} ${arg} = ${k}$$`);
    }
    const b = ri(2, 9), n = ri(2, 20);
    return numberProblem(compute + `$$${b}^{\\log_{${b}} ${n}}$$`, String(n),
      bi('Basic identity: $a^{\\log_a n} = n$.', 'Основное тождество: $a^{\\log_a n} = n$.'),
      `$$${b}^{\\log_{${b}} ${n}} = ${n}$$`);
  }

  if (level === 2) {
    const t = ri(1, 3);
    if (t === 1) {
      const [b, m, n] = pickOne([[6, 4, 9], [10, 4, 25], [10, 2, 500], [12, 3, 48], [15, 3, 75], [2, 4, 8], [3, 9, 27], [20, 8, 50]]);
      const k = Math.round(Math.log(m * n) / Math.log(b));
      return numberProblem(compute + `$$\\log_{${b}} ${m} + \\log_{${b}} ${n}$$`, String(k),
        bi('Sum of logs: $\\log_a m + \\log_a n = \\log_a (mn)$.', 'Сумма логарифмов: $\\log_a m + \\log_a n = \\log_a (mn)$.'),
        `$$\\log_{${b}} (${m} \\cdot ${n}) = \\log_{${b}} ${m * n} = ${k}$$`);
    }
    if (t === 2) {
      const [b, m, n] = pickOne([[3, 54, 2], [2, 96, 3], [5, 250, 2], [10, 500, 5], [2, 40, 5], [6, 72, 2]]);
      const k = Math.round(Math.log(m / n) / Math.log(b));
      return numberProblem(compute + `$$\\log_{${b}} ${m} - \\log_{${b}} ${n}$$`, String(k),
        bi('Difference of logs: $\\log_a m - \\log_a n = \\log_a \\frac{m}{n}$.', 'Разность логарифмов: $\\log_a m - \\log_a n = \\log_a \\frac{m}{n}$.'),
        `$$\\log_{${b}} \\frac{${m}}{${n}} = \\log_{${b}} ${m / n} = ${k}$$`);
    }
    // Both numbers are powers of one base c: log_{c^p} c^q = q/p
    const [c, p, qq] = pickOne([[2, 2, 3], [2, 3, 2], [3, 2, 3], [5, 2, 3], [3, 3, 2], [2, 4, 3], [2, 3, 4]]);
    const b = c ** p, n = c ** qq, ex = frac(qq, p);
    return numberProblem(compute + `$$\\log_{${b}} ${n}$$`, ex,
      bi('Write both numbers as powers of one base, e.g. $4 = 2^2$, $8 = 2^3$. Then $\\log_{a^p} a^q = \\frac{q}{p}$.',
         'Запишите оба числа как степени одного основания, например $4 = 2^2$, $8 = 2^3$. Тогда $\\log_{a^p} a^q = \\frac{q}{p}$.'),
      `$$${b} = ${c}^{${p}},\\quad ${n} = ${c}^{${qq}} \\;\\Rightarrow\\; \\log_{${b}} ${n} = \\frac{${qq}}{${p}}$$`);
  }

  const solve = bi('Solve for $x$.', 'Решите уравнение относительно $x$.');
  const t = ri(1, 4);
  if (t === 1) {
    const b = pickOne([2, 3, 5]);
    const k = ri(1, b === 2 ? 6 : b === 3 ? 4 : 3), c = nz(-3, 3);
    return numberProblem(solve + `$$${b}^{x ${sgn(c)}} = ${b ** k}$$`, String(k - c),
      bi('Write the right side as a power of the same base, then compare exponents.', 'Запишите правую часть как степень того же основания и приравняйте показатели.'),
      `$$${b ** k} = ${b}^{${k}} \\;\\Rightarrow\\; x ${sgn(c)} = ${k} \\;\\Rightarrow\\; x = ${k - c}$$`);
  }
  if (t === 2) {
    const b = pickOne([2, 3]), k = ri(1, 4), c = nz(-5, 5);
    return numberProblem(solve + `$$\\log_{${b}} (x ${sgn(c)}) = ${k}$$`, String(b ** k - c),
      bi('By definition: $\\log_a y = k \\iff y = a^k$.', 'По определению: $\\log_a y = k \\iff y = a^k$.'),
      `$$x ${sgn(c)} = ${b}^{${k}} = ${b ** k} \\;\\Rightarrow\\; x = ${b ** k - c}$$`);
  }
  if (t === 3) {
    const b = pickOne([2, 3]), k = ri(1, 5);
    return numberProblem(solve + `$$${b}^{2x - 1} = ${b ** k}$$`, frac(k + 1, 2),
      bi('Same base on both sides → compare exponents.', 'Одинаковые основания → приравняйте показатели.'),
      `$$2x - 1 = ${k} \\;\\Rightarrow\\; x = \\frac{${k + 1}}{2}$$`);
  }
  const k = pickOne([1, 2, 3, -1]);
  return numberProblem(solve + `$$\\ln x = ${k}$$`, `e^(${k})`,
    bi('$\\ln$ is the logarithm with base $e$: $\\ln x = k \\iff x = e^k$.', '$\\ln$ — логарифм по основанию $e$: $\\ln x = k \\iff x = e^k$.'),
    `$$x = e^{${k}}$$`);
}

// ---------- Trigonometry ----------

const TRIG_VALUES = [[0, '0'], [1 / 2, '1/2'], [Math.SQRT2 / 2, 'sqrt(2)/2'], [Math.sqrt(3) / 2, 'sqrt(3)/2'],
  [1, '1'], [Math.sqrt(3) / 3, 'sqrt(3)/3'], [Math.sqrt(3), 'sqrt(3)']];

// Exact form of a "table" value: 0.866… → "sqrt(3)/2"; null if not in the table
function exactTrig(v) {
  for (const [t, s] of TRIG_VALUES) {
    if (Math.abs(Math.abs(v) - t) < 1e-9) return v < 0 && t !== 0 ? `-${s}` : s;
  }
  return null;
}

// p·π/q as text: "pi/6", "-2 pi/3", "pi", "0"
function anglePi(p, q) {
  const f = frac(p, q);
  if (f === '0') return '0';
  const [num, den] = f.split('/');
  const coef = num === '1' ? '' : num === '-1' ? '-' : `${num} `;
  return den ? `${coef}pi/${den}` : `${coef}pi`;
}

function genTrig(level) {
  if (level < 3) {
    let fn, p, q, v;
    do {
      fn = pickOne(['sin', 'cos', 'tan']);
      if (level === 1) [p, q] = pickOne([[0, 1], [1, 6], [1, 4], [1, 3], [1, 2]]);
      else { q = pickOne([6, 4, 3]); p = nz(-2 * q, 2 * q); }
      v = Math[fn](p * Math.PI / q);
    } while (Math.abs(v) > 1e6 || exactTrig(v) === null); // tan(π/2) does not exist
    const expr = `${fn}(${anglePi(p, q)})`, ex = exactTrig(v);
    return numberProblem(bi('Find the exact value.', 'Найдите точное значение.') + `$$${tex(expr)}$$`, ex,
      level === 1
        ? bi('Table: $\\sin\\frac{\\pi}{6} = \\frac{1}{2}$, $\\sin\\frac{\\pi}{4} = \\frac{\\sqrt{2}}{2}$, $\\sin\\frac{\\pi}{3} = \\frac{\\sqrt{3}}{2}$; cosine goes in reverse order; $\\tan = \\frac{\\sin}{\\cos}$.',
             'Таблица: $\\sin\\frac{\\pi}{6} = \\frac{1}{2}$, $\\sin\\frac{\\pi}{4} = \\frac{\\sqrt{2}}{2}$, $\\sin\\frac{\\pi}{3} = \\frac{\\sqrt{3}}{2}$; у косинуса — в обратном порядке; $\\tan = \\frac{\\sin}{\\cos}$.')
        : bi('Find the reference angle in the first quarter, then the sign from the quarter on the unit circle. Period: $2\\pi$ for sin and cos, $\\pi$ for tan.',
             'Найдите опорный угол в первой четверти, а знак — по четверти на единичной окружности. Период: $2\\pi$ у sin и cos, $\\pi$ у tan.'),
      `$$${tex(expr)} = ${tex(ex)}$$`,
      { f: `${fn}(x)`, a: p * Math.PI / q });
  }

  const fn = pickOne(['sin', 'cos', 'tan']);
  const s3 = Math.sqrt(3), s2 = Math.SQRT2;
  const v = pickOne(fn === 'tan' ? [1, -1, s3, -s3, s3 / 3, -s3 / 3, 0] : [0.5, -0.5, s2 / 2, -s2 / 2, s3 / 2, -s3 / 2, 0, 1, -1]);
  let t;
  if (fn === 'sin') t = v > 0 ? Math.asin(v) : Math.PI - Math.asin(v);
  else if (fn === 'cos') t = v === 1 ? 2 * Math.PI : Math.acos(v);
  else t = v > 0 ? Math.atan(v) : Math.PI + Math.atan(v);
  const [p, q = 1] = toFrac(t / Math.PI).split('/').map(Number);
  const ex = anglePi(p, q);
  return numberProblem(bi('Find the smallest positive solution.', 'Найдите наименьший положительный корень.') + `$$\\${fn} x = ${tex(exactTrig(v))}$$`, ex,
    bi('All solutions: $\\sin x = v$: $x = \\arcsin v$ or $\\pi - \\arcsin v$ (+ $2\\pi n$); $\\cos x = v$: $x = \\pm\\arccos v$ (+ $2\\pi n$); $\\tan x = v$: $x = \\arctan v$ (+ $\\pi n$). Pick the smallest positive.',
       'Все решения: $\\sin x = v$: $x = \\arcsin v$ или $\\pi - \\arcsin v$ (+ $2\\pi n$); $\\cos x = v$: $x = \\pm\\arccos v$ (+ $2\\pi n$); $\\tan x = v$: $x = \\arctan v$ (+ $\\pi n$). Выберите наименьший положительный.'),
    `$$x = ${tex(ex)}$$`,
    { f: `${fn}(x) - (${exactTrig(v)})`, a: t, show: 'points' });
}

// ---------- Limits ----------

function genLimit(level) {
  const a = nz(-4, 4), b = nz(-4, 4), k = ri(2, 5), m = ri(2, 5);
  const remarkable = bi(
    'Remarkable limits as $t \\to 0$: $\\frac{\\sin t}{t} \\to 1$, $\\frac{e^t - 1}{t} \\to 1$, $\\frac{\\ln(1+t)}{t} \\to 1$, $\\frac{\\tan t}{t} \\to 1$, $1 - \\cos t \\approx \\frac{t^2}{2}$. Make the same expression appear in the denominator.',
    'Замечательные пределы при $t \\to 0$: $\\frac{\\sin t}{t} \\to 1$, $\\frac{e^t - 1}{t} \\to 1$, $\\frac{\\ln(1+t)}{t} \\to 1$, $\\frac{\\tan t}{t} \\to 1$, $1 - \\cos t \\approx \\frac{t^2}{2}$. Добейтесь, чтобы в знаменателе стояло то же выражение.');
  const ratio = (top, tt) => `$$\\frac{${top}}{${m}x} = \\frac{${k}}{${m}} \\cdot \\frac{${top}}{${tt}} \\to \\frac{${k}}{${m}} \\cdot 1 = ${tex(frac(k, m))}$$`;

  const pools = {
    1: [
      () => ({ at: a, expr: `(${sum([[1, 'x^2'], [-a * a, '']])})/(${sum([[1, 'x'], [-a, '']])})`, exact: String(2 * a),
        hint: bi('Substitution gives $\\frac{0}{0}$. Factor: $x^2 - a^2 = (x - a)(x + a)$, then cancel.', 'Подстановка даёт $\\frac{0}{0}$. Разложите: $x^2 - a^2 = (x - a)(x + a)$ и сократите.'),
        sol: `$$\\frac{(x ${sgn(-a)})(x ${sgn(a)})}{x ${sgn(-a)}} = x ${sgn(a)} \\to ${2 * a}$$` }),
      () => ({ at: a, expr: `(${sum([[1, 'x^2'], [b - a, 'x'], [-a * b, '']])})/(${sum([[1, 'x'], [-a, '']])})`, exact: String(a + b),
        hint: bi('Substitution gives $\\frac{0}{0}$, so $x = a$ is a root of the numerator: factor out $(x - a)$.', 'Подстановка даёт $\\frac{0}{0}$, значит $x = a$ — корень числителя: вынесите $(x - a)$.'),
        sol: `$$\\frac{(x ${sgn(-a)})(x ${sgn(b)})}{x ${sgn(-a)}} = x ${sgn(b)} \\to ${a + b}$$` }),
      () => { const c = nz(-5, 5); return { at: a, expr: sum([[1, 'x^2'], [b, 'x'], [c, '']]), exact: String(a * a + b * a + c),
        hint: bi('A polynomial is continuous: just substitute $x$.', 'Многочлен непрерывен: просто подставьте $x$.'),
        sol: `$$(${a})^2 ${sgn(b)} \\cdot (${a}) ${sgn(c)} = ${a * a + b * a + c}$$` }; },
    ],
    2: [
      () => ({ at: 0, expr: `sin(${k} x)/(${m} x)`, exact: frac(k, m), hint: remarkable, sol: ratio(`\\sin ${k}x`, `${k}x`) }),
      () => ({ at: 0, expr: `(e^(${k} x) - 1)/(${m} x)`, exact: frac(k, m), hint: remarkable, sol: ratio(`e^{${k}x} - 1`, `${k}x`) }),
      () => ({ at: 0, expr: `ln(1 + ${k} x)/(${m} x)`, exact: frac(k, m), hint: remarkable, sol: ratio(`\\ln(1 + ${k}x)`, `${k}x`) }),
      () => ({ at: 0, expr: `tan(${k} x)/(${m} x)`, exact: frac(k, m), hint: remarkable, sol: ratio(`\\tan ${k}x`, `${k}x`) }),
      () => ({ at: 0, expr: `(1 - cos(${k} x))/x^2`, exact: frac(k * k, 2), hint: remarkable,
        sol: `$$1 - \\cos ${k}x \\approx \\frac{(${k}x)^2}{2} \\;\\Rightarrow\\; \\frac{${k * k}x^2 / 2}{x^2} = ${tex(frac(k * k, 2))}$$` }),
    ],
    3: [
      () => { const p = nz(-6, 6), s = ri(1, 6);
        return { at: Infinity, expr: `(${sum([[p, 'x^2'], [ri(-5, 5), 'x'], [ri(-5, 5), '']])})/(${sum([[s, 'x^2'], [nz(-5, 5), '']])})`, exact: frac(p, s),
          hint: bi('Divide the numerator and the denominator by the highest power, $x^2$.', 'Разделите числитель и знаменатель на старшую степень, $x^2$.'),
          sol: bi(`After dividing by $x^2$ all terms except the leading ones go to $0$: the limit is $\\frac{${p}}{${s}}$.`,
                  `После деления на $x^2$ все слагаемые, кроме старших, стремятся к $0$: предел равен $\\frac{${p}}{${s}}$.`) }; },
      () => ({ at: Infinity, expr: `(1 + ${k}/x)^x`, exact: `e^${k}`,
        hint: bi('Second remarkable limit: $\\left(1 + \\frac{1}{t}\\right)^t \\to e$ as $t \\to \\infty$.', 'Второй замечательный предел: $\\left(1 + \\frac{1}{t}\\right)^t \\to e$ при $t \\to \\infty$.'),
        sol: `$$\\left(1 + \\frac{${k}}{x}\\right)^x = \\left[\\left(1 + \\frac{${k}}{x}\\right)^{x/${k}}\\right]^{${k}} \\to e^{${k}}$$` }),
      () => ({ at: Infinity, expr: `sqrt(x^2 + ${k} x) - x`, exact: frac(k, 2),
        hint: bi('$\\infty - \\infty$: multiply and divide by the conjugate $\\sqrt{x^2 + kx} + x$.', '$\\infty - \\infty$: умножьте и разделите на сопряжённое $\\sqrt{x^2 + kx} + x$.'),
        sol: `$$\\frac{(x^2 + ${k}x) - x^2}{\\sqrt{x^2 + ${k}x} + x} = \\frac{${k}x}{\\sqrt{x^2 + ${k}x} + x} \\to \\frac{${k}}{2}$$` }),
      () => ({ at: Infinity, expr: `x sin(${k}/x)`, exact: String(k),
        hint: bi(`Let $t = \\frac{${k}}{x} \\to 0$ and use $\\frac{\\sin t}{t} \\to 1$.`, `Положите $t = \\frac{${k}}{x} \\to 0$ и используйте $\\frac{\\sin t}{t} \\to 1$.`),
        sol: `$$x \\sin\\frac{${k}}{x} = ${k} \\cdot \\frac{\\sin(${k}/x)}{${k}/x} \\to ${k}$$` }),
    ],
  };

  const t = pickOne(pools[level])();
  const atTex = t.at === Infinity ? '\\infty' : t.at;
  return {
    ...numberProblem(bi('Find the limit.', 'Найдите предел.') + `$$\\lim_{x \\to ${atTex}} ${tex(t.expr)}$$`, t.exact, t.hint, t.sol,
      t.at === Infinity ? { f: t.expr } : { f: t.expr, a: t.at, show: 'limit' }),
    at: t.at, expr: t.expr, // for tests
  };
}

// ---------- Derivatives ----------

const DERIV_HINTS = [
  bi('Differentiate term by term. Power rule: $(x^n)\' = n x^{n-1}$. Table: $(e^x)\' = e^x$, $(\\sin x)\' = \\cos x$, $(\\cos x)\' = -\\sin x$, $(\\ln x)\' = \\frac{1}{x}$, $(\\sqrt{x})\' = \\frac{1}{2\\sqrt{x}}$.',
     'Дифференцируйте по слагаемым. Степень: $(x^n)\' = n x^{n-1}$. Таблица: $(e^x)\' = e^x$, $(\\sin x)\' = \\cos x$, $(\\cos x)\' = -\\sin x$, $(\\ln x)\' = \\frac{1}{x}$, $(\\sqrt{x})\' = \\frac{1}{2\\sqrt{x}}$.'),
  bi('Product: $(uv)\' = u\'v + uv\'$. Quotient: $\\left(\\frac{u}{v}\\right)\' = \\frac{u\'v - uv\'}{v^2}$.',
     'Произведение: $(uv)\' = u\'v + uv\'$. Частное: $\\left(\\frac{u}{v}\\right)\' = \\frac{u\'v - uv\'}{v^2}$.'),
  bi('Chain rule: $\\big(f(g(x))\\big)\' = f\'(g(x)) \\cdot g\'(x)$. Differentiate the outer function, keep the inside, then multiply by the derivative of the inside.',
     'Сложная функция: $\\big(f(g(x))\\big)\' = f\'(g(x)) \\cdot g\'(x)$. Производная внешней функции от того же аргумента, умноженная на производную внутренней.'),
];

function genDerivative(level) {
  const n = ri(3, 6), a = ri(2, 6), b = ri(1, 5), k = ri(2, 4);
  const pools = {
    1: [
      () => sum([[nz(-5, 5), `x^${n}`], [nz(-6, 6), 'x^2'], [nz(-9, 9), 'x'], [ri(-9, 9), '']]),
      () => `${a} sqrt(x) - ${b}/x`,
      () => sum([[nz(-4, 4), 'e^x'], [nz(-4, 4), 'sin(x)'], [nz(-4, 4), 'ln(x)']]),
      () => sum([[nz(-4, 4), 'cos(x)'], [nz(-5, 5), `x^${n}`]]) + ` + ${b}/x^2`,
    ],
    2: [
      () => `x^${ri(2, 4)} e^x`,
      () => `x^${ri(2, 3)} sin(x)`,
      () => `x^${ri(2, 3)} cos(x)`,
      () => 'x ln(x)',
      () => 'e^x sin(x)',
      () => 'sin(x)/x',
      () => `e^x/(x^2 + ${a})`,
      () => `(x^2 + ${a})/(x - ${b})`,
      () => 'ln(x)/x',
    ],
    3: [
      () => `sin(${a} x^2 + ${b})`,
      () => `e^(${pickOne([-1, 1]) * k} x^2)`,
      () => `ln(x^2 + ${a})`,
      () => `(${a} x + ${b})^${n}`,
      () => `sqrt(x^2 + ${a})`,
      () => `cos(x)^${k}`,
      () => 'e^(sin(x))',
      () => `x^2 e^(-${k} x)`,
      () => `sin(x)^2 cos(${k} x)`,
    ],
  };
  const f = parseExpr(pickOne(pools[level])());
  const d = derivativeOf(f);
  return {
    kind: 'expr', answer: d,
    q: bi('Find the derivative $f\'(x)$.', 'Найдите производную $f\'(x)$.') + `$$f(x) = ${texOf(f)}$$`,
    hint: DERIV_HINTS[level - 1],
    solution: `$$f'(x) = ${texOf(d)}$$`,
    sandbox: { f: f.toString({ implicit: 'show' }), show: 'deriv,tangent' },
  };
}

// ---------- Tangent line ----------

function genTangent(level) {
  let fs, a;
  if (level === 1) { fs = sum([[nz(-3, 3), 'x^2'], [ri(-5, 5), 'x'], [ri(-5, 5), '']]); a = ri(-2, 2); }
  else if (level === 2) { fs = sum([[nz(-2, 2), 'x^3'], [ri(-3, 3), 'x^2'], [ri(-4, 4), 'x'], [ri(-5, 5), '']]); a = ri(-2, 2); }
  else {
    const k = ri(2, 3);
    [fs, a] = pickOne([['e^x', 0], ['ln(x)', 1], ['sqrt(x)', 4], ['sin(x)', 0], [`e^(${k} x)`, 0], ['x ln(x)', 1], ['1/x', pickOne([1, 2, -1])], [`ln(${k} x - ${k - 1})`, 1]]);
  }
  const f = parseExpr(fs), d = derivativeOf(f);
  const fa = clean(fnOf(f)(a)), da = clean(fnOf(d)(a));
  const answer = math.simplify(parseExpr(`${da} * (x - (${a})) + (${fa})`));
  return {
    kind: 'expr', answer,
    q: bi(`Find the tangent line to the graph at $x_0 = ${a}$. Answer as $y = \\dots$ (or just the right side).`,
          `Найдите уравнение касательной к графику в точке $x_0 = ${a}$. Ответ в виде $y = \\dots$ (или только правую часть).`) + `$$f(x) = ${texOf(f)}$$`,
    hint: bi('Tangent: $y = f(x_0) + f\'(x_0)(x - x_0)$. First find $f(x_0)$ and $f\'(x_0)$.', 'Касательная: $y = f(x_0) + f\'(x_0)(x - x_0)$. Сначала найдите $f(x_0)$ и $f\'(x_0)$.'),
    solution: `$$f(${a}) = ${fa},\\quad f'(x) = ${texOf(d)},\\quad f'(${a}) = ${da}$$ $$y = ${texOf(answer)}$$`,
    sandbox: { f: fs, a, show: 'tangent' },
  };
}

// ---------- Antiderivatives ----------

const ANTI_HINTS = [
  bi('Table: $\\int x^n dx = \\frac{x^{n+1}}{n+1}$, $\\int e^{mx} dx = \\frac{e^{mx}}{m}$, $\\int \\cos mx\\, dx = \\frac{\\sin mx}{m}$, $\\int \\sin mx\\, dx = -\\frac{\\cos mx}{m}$, $\\int \\frac{dx}{x} = \\ln|x|$. Check yourself: the derivative of your answer must give the integrand back.',
     'Таблица: $\\int x^n dx = \\frac{x^{n+1}}{n+1}$, $\\int e^{mx} dx = \\frac{e^{mx}}{m}$, $\\int \\cos mx\\, dx = \\frac{\\sin mx}{m}$, $\\int \\sin mx\\, dx = -\\frac{\\cos mx}{m}$, $\\int \\frac{dx}{x} = \\ln|x|$. Проверка: производная ответа должна дать подынтегральную функцию.'),
  bi('Substitution: look for an inner function $u$ whose derivative also appears as a factor, e.g. $\\int 2x\\, e^{x^2} dx$ with $u = x^2$, $du = 2x\\, dx$.',
     'Замена: ищите внутреннюю функцию $u$, производная которой стоит множителем, например $\\int 2x\\, e^{x^2} dx$ с $u = x^2$, $du = 2x\\, dx$.'),
  bi('By parts: $\\int u\\, dv = uv - \\int v\\, du$. Take $u$ = the polynomial or $\\ln x$ (it gets simpler when differentiated).',
     'По частям: $\\int u\\, dv = uv - \\int v\\, du$. За $u$ берите многочлен или $\\ln x$ (он упрощается при дифференцировании).'),
];

function genAntiderivative(level) {
  const k = nz(-3, 3), m = nz(-3, 3), a = ri(1, 5), b = ri(1, 5), n = ri(2, 4);
  const pools = {
    1: [
      () => { const p = ri(2, 4), c1 = (p + 1) * nz(-3, 3), c2 = 2 * nz(-4, 4), c3 = nz(-6, 6);
        return [sum([[c1, `x^${p}`], [c2, 'x'], [c3, '']]), sum([[c1 / (p + 1), `x^${p + 1}`], [c2 / 2, 'x^2'], [c3, 'x']])]; },
      () => [sum([[k * m, `e^(${lin(m)})`]]), sum([[k, `e^(${lin(m)})`]])],
      () => [sum([[k * m, `cos(${lin(m)})`]]), sum([[k, `sin(${lin(m)})`]])],
      () => [sum([[k * m, `sin(${lin(m)})`]]), sum([[-k, `cos(${lin(m)})`]])],
      () => [`${a + 1}/x`, `${a + 1} ln(x)`],
    ],
    2: [
      () => [sum([[2 * k, 'x e^(x^2)']]), sum([[k, 'e^(x^2)']])],
      () => [sum([[2 * k, 'x cos(x^2)']]), sum([[k, 'sin(x^2)']])],
      () => [`${2 * a} x/(x^2 + ${b})`, `${a} ln(x^2 + ${b})`],
      () => ['cos(x) e^(sin(x))', 'e^(sin(x))'],
      () => [`(${a} x + ${b})^${n}`, `(${a} x + ${b})^${n + 1}/${a * (n + 1)}`],
    ],
    3: [
      () => ['x e^x', '(x - 1) e^x'],
      () => ['x cos(x)', 'x sin(x) + cos(x)'],
      () => ['x sin(x)', 'sin(x) - x cos(x)'],
      () => ['ln(x)', 'x ln(x) - x'],
      () => ['x ln(x)', 'x^2 ln(x)/2 - x^2/4'],
      () => ['x^2 e^x', '(x^2 - 2 x + 2) e^x'],
      () => ['e^x sin(x)', 'e^x (sin(x) - cos(x))/2'],
      () => ['x e^(-x)', '-(x + 1) e^(-x)'],
    ],
  };
  const [fs, Fs] = pickOne(pools[level])();
  const f = parseExpr(fs), F = parseExpr(Fs);
  return {
    kind: 'antider', integrand: f, F, // F is kept for tests
    q: bi('Find an antiderivative (the constant $C$ can be omitted).', 'Найдите первообразную (константу $C$ можно не писать).') + `$$\\int ${texOf(f)}\\,dx$$`,
    hint: ANTI_HINTS[level - 1],
    solution: `$$\\int ${texOf(f)}\\,dx = ${texOf(F)} + C$$`,
    sandbox: { f: fs },
  };
}

// ---------- Definite integrals ----------

function genDefinite(level) {
  let fs, Fs, lo, hi, exact, q = null;
  if (level === 1) {
    const c2 = nz(-3, 3), c1 = ri(-4, 4), c0 = ri(-5, 5);
    fs = sum([[c2, 'x^2'], [c1, 'x'], [c0, '']]);
    Fs = math.simplify(parseExpr(`${c2} x^3 / 3 + ${c1} x^2 / 2 + ${c0} x`)).toString();
    const l = ri(-2, 1); lo = String(l); hi = String(l + ri(1, 3));
    exact = toFrac(integrate(fnOf(parseExpr(fs)), l, +hi));
  } else if (level === 2) {
    const k = ri(2, 4);
    [fs, Fs, lo, hi, exact] = pickOne([
      ['sin(x)', '-cos(x)', '0', 'pi', '2'],
      ['cos(x)', 'sin(x)', '0', 'pi/2', '1'],
      ['1/x', 'ln(x)', '1', 'e', '1'],
      ['e^x', 'e^x', '0', '1', 'e - 1'],
      ['e^x', 'e^x', '0', 'ln(2)', '1'],
      ['1/sqrt(x)', '2 sqrt(x)', '1', '4', '2'],
      ['1/(1 + x^2)', 'atan(x)', '0', '1', 'pi/4'],
      [`sin(${k} x)`, `-cos(${k} x)/${k}`, '0', `pi/${k}`, frac(2, k)],
    ]);
  } else {
    const k = ri(1, 4);
    if (Math.random() < 0.35) {
      // Area between y = x^2 and y = kx: ∫_0^k (kx - x^2) dx = k^3/6
      fs = sum([[k, 'x'], [-1, 'x^2']]); Fs = `${k} x^2/2 - x^3/3`; lo = '0'; hi = String(k); exact = frac(k ** 3, 6);
      q = bi(`Find the area between the curves $y = x^2$ and $y = ${lin(k)}$.`, `Найдите площадь между кривыми $y = x^2$ и $y = ${lin(k)}$.`);
    } else {
      [fs, Fs, lo, hi, exact] = pickOne([
        ['x e^x', '(x - 1) e^x', '0', '1', '1'],
        ['ln(x)', 'x ln(x) - x', '1', 'e', '1'],
        ['x sin(x)', 'sin(x) - x cos(x)', '0', 'pi', 'pi'],
        ['x cos(x)', 'x sin(x) + cos(x)', '0', 'pi/2', 'pi/2 - 1'],
        ['2 x e^(x^2)', 'e^(x^2)', '0', '1', 'e - 1'],
      ]);
    }
  }
  const loT = tex(lo), hiT = tex(hi);
  return numberProblem(
    (q || bi('Compute the integral.', 'Вычислите интеграл.')) + `$$\\int_{${loT}}^{${hiT}} ${tex(fs)}\\,dx$$`,
    exact,
    [bi('Newton–Leibniz: $\\int_a^b f\\,dx = F(b) - F(a)$, where $F$ is an antiderivative of $f$.', 'Ньютон–Лейбниц: $\\int_a^b f\\,dx = F(b) - F(a)$, где $F$ — первообразная $f$.'),
     bi('Find $F$ from the table, then $F(b) - F(a)$. Remember $\\ln e = 1$, $\\cos \\pi = -1$, $\\arctan 1 = \\frac{\\pi}{4}$.', 'Найдите $F$ по таблице, затем $F(b) - F(a)$. Помните: $\\ln e = 1$, $\\cos \\pi = -1$, $\\arctan 1 = \\frac{\\pi}{4}$.'),
     bi('By parts: $\\int u\\, dv = uv - \\int v\\, du$. Area between curves: $\\int (\\text{top} - \\text{bottom})\\, dx$ between the intersection points.', 'По частям: $\\int u\\, dv = uv - \\int v\\, du$. Площадь между кривыми: $\\int (\\text{верхняя} - \\text{нижняя})\\, dx$ между точками пересечения.'),
    ][level - 1],
    `$$F(x) = ${tex(Fs)},\\quad F(${hiT}) - F(${loT}) = ${tex(exact)}$$`,
    { f: fs, a: evalNumber(lo), b: evalNumber(hi), show: 'area' }
  );
}

const TOPICS = [
  { id: 'logs', title: { en: 'Logarithms & exponents', ru: 'Логарифмы и степени' }, gen: genLogs,
    levels: [['Definition', 'Определение'], ['Rules', 'Свойства'], ['Equations', 'Уравнения']] },
  { id: 'trig', title: { en: 'Trigonometry', ru: 'Тригонометрия' }, gen: genTrig,
    levels: [['Basic angles', 'Основные углы'], ['Any angle', 'Любой угол'], ['Equations', 'Уравнения']] },
  { id: 'limit', title: { en: 'Limits', ru: 'Пределы' }, gen: genLimit,
    levels: [['Substitution & factoring', 'Подстановка и разложение'], ['Remarkable limits', 'Замечательные пределы'], ['At infinity', 'На бесконечности']] },
  { id: 'derivative', title: { en: 'Derivatives', ru: 'Производные' }, gen: genDerivative,
    levels: [['Basic rules', 'Таблица и сумма'], ['Product & quotient', 'Произведение и частное'], ['Chain rule', 'Сложная функция']] },
  { id: 'tangent', title: { en: 'Tangent line', ru: 'Касательная' }, gen: genTangent,
    levels: [['Parabola', 'Парабола'], ['Cubic', 'Кубическая'], ['Other functions', 'Другие функции']] },
  { id: 'antiderivative', title: { en: 'Antiderivatives', ru: 'Первообразные' }, gen: genAntiderivative,
    levels: [['Table', 'Таблица'], ['Substitution', 'Замена'], ['By parts', 'По частям']] },
  { id: 'definite', title: { en: 'Definite integrals', ru: 'Определённые интегралы' }, gen: genDefinite,
    levels: [['Polynomials', 'Многочлены'], ['Table integrals', 'Табличные'], ['By parts & area', 'По частям и площадь']] },
];

// Throws with a readable message if the answer cannot be read
function checkAnswer(problem, text) {
  if (problem.kind === 'number') return sameNumber(evalNumber(text), problem.value);
  const u = parseExpr(text);
  if (problem.kind === 'expr') return sameFunction(fnOf(u), fnOf(problem.answer));
  // Antiderivative: its derivative must give the integrand back (any constant C is fine)
  const du = derivativeOf(u);
  if (!du) throw new Error('cannot differentiate this form');
  return sameFunction(fnOf(du), fnOf(problem.integrand));
}

function sandboxLink(s) {
  const p = new URLSearchParams();
  p.set('f', s.f);
  if (s.a !== undefined) p.set('a', clean(s.a));
  if (s.b !== undefined) p.set('b', clean(s.b));
  if (s.show) p.set('show', s.show);
  return '#sandbox?' + p.toString();
}

// ---------- Practice screen ----------

function showPractice(topic) {
  redraw = null;
  const state = loadState();
  const st = state[topic.id] || (state[topic.id] = { level: 1, solved: 0, streak: 0 });
  let problem, usedHint, usedSolution, done;

  app.innerHTML = `
    <a class="back" href="#">← Home <span class="ru">· На главную</span></a>
    <h2>${topic.title.en}</h2>
    <div class="ru" style="margin-top:-6px">${topic.title.ru}</div>
    <div class="levels">${topic.levels.map((l, i) => `<button data-level="${i + 1}">${i + 1} · ${l[0]} <span class="ru">· ${l[1]}</span></button>`).join('')}</div>
    <div class="stats"></div>
    <div class="widget problem">
      <div class="task"></div>
      <div class="answer-row">
        <input class="answer" placeholder="Your answer" autocomplete="off" autocapitalize="off" spellcheck="false">
        <button class="check primary">Check</button>
      </div>
      <div class="preview"></div>
      <div class="feedback"></div>
      <div class="actions">
        <button class="hint">Hint <span class="ru">· Подсказка</span></button>
        <button class="solution">Solution <span class="ru">· Решение</span></button>
        <button class="next">Next →</button>
        <a class="to-sandbox">Open in sandbox <span class="ru">· В песочницу</span></a>
      </div>
      <div class="extra"></div>
    </div>
    <details class="syntax">
      <summary>How to type answers <span class="ru">· Как вводить ответы</span></summary>
      ${bi('Like on a calculator: <code>3x^2 - 2x</code>, <code>sin(x)^2</code>, <code>e^(2x)</code>, <code>ln(x)</code>, <code>sqrt(x)</code>, <code>pi</code>. Numbers can be exact (<code>1/3</code>, <code>sqrt(3)/2</code>, <code>pi/6</code>, <code>e^2</code>) or decimal with 3 digits (<code>0.333</code>). Any equivalent form is accepted.',
           'Как на калькуляторе: <code>3x^2 - 2x</code>, <code>sin(x)^2</code>, <code>e^(2x)</code>, <code>ln(x)</code>, <code>sqrt(x)</code>, <code>pi</code>. Числа — точно (<code>1/3</code>, <code>sqrt(3)/2</code>, <code>pi/6</code>, <code>e^2</code>) или десятичной дробью с 3 знаками (<code>0.333</code>). Подходит любая равносильная форма.')}
    </details>`;

  const $ = s => app.querySelector(s);
  const input = $('.answer'), feedback = $('.feedback'), extra = $('.extra'), preview = $('.preview');

  function renderStats() {
    app.querySelectorAll('.levels button').forEach(b => b.classList.toggle('active', +b.dataset.level === st.level));
    $('.stats').innerHTML = `Solved: ${st.solved} · Streak: ${st.streak}/3 to next level <span class="ru">Решено: ${st.solved} · Серия: ${st.streak}/3 до следующего уровня</span>`;
  }

  function next() {
    problem = topic.gen(st.level);
    usedHint = usedSolution = done = false;
    $('.task').innerHTML = problem.q;
    input.value = '';
    preview.innerHTML = feedback.innerHTML = extra.innerHTML = '';
    feedback.className = 'feedback';
    const link = $('.to-sandbox');
    link.style.display = problem.sandbox ? '' : 'none';
    if (problem.sandbox) link.href = sandboxLink(problem.sandbox);
    renderMath($('.task'));
    renderStats();
    input.focus({ preventScroll: true });
  }

  function check() {
    if (done || !input.value.trim()) return;
    let ok;
    try {
      ok = checkAnswer(problem, input.value);
    } catch (e) {
      feedback.className = 'feedback bad';
      feedback.innerHTML = bi(`Cannot read the answer: ${e.message}. See "How to type answers" below.`, 'Не удалось разобрать ответ. См. «Как вводить ответы» ниже.');
      return;
    }
    if (ok) {
      done = true;
      let msg = bi('Correct!', 'Верно!');
      if (!usedSolution) st.solved++;
      if (!usedHint && !usedSolution) {
        st.streak++;
        if (st.streak >= 3 && st.level < 3) {
          st.level++;
          st.streak = 0;
          msg = bi(`Correct! Level up: now level ${st.level}.`, `Верно! Новый уровень: ${st.level}.`);
        }
      } else {
        st.streak = 0;
      }
      feedback.className = 'feedback ok';
      feedback.innerHTML = msg;
      extra.innerHTML = problem.solution;
    } else {
      st.streak = 0;
      feedback.className = 'feedback bad';
      feedback.innerHTML = bi('Not yet. Try again or take a hint.', 'Пока нет. Попробуйте ещё раз или возьмите подсказку.');
    }
    saveState(state);
    renderStats();
    renderMath(app.querySelector('.problem'));
  }

  // Live preview: shows how the input was understood
  input.addEventListener('input', () => {
    if (!input.value.trim()) { preview.innerHTML = ''; return; }
    try {
      katex.render(texOf(parseExpr(input.value)), preview, { throwOnError: false });
    } catch (e) {
      preview.textContent = '…';
    }
  });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  $('.check').addEventListener('click', check);
  $('.next').addEventListener('click', next);
  $('.hint').addEventListener('click', () => {
    usedHint = true;
    extra.innerHTML = problem.hint;
    renderMath(extra);
  });
  $('.solution').addEventListener('click', () => {
    usedSolution = true;
    extra.innerHTML = problem.solution;
    renderMath(extra);
  });
  app.querySelectorAll('.levels button').forEach(b => b.addEventListener('click', () => {
    st.level = +b.dataset.level;
    st.streak = 0;
    saveState(state);
    next();
  }));

  next();
}
