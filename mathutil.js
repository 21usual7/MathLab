// Math helpers shared by the sandbox and practice.
// No DOM here, so everything can be tested in Node with math.js loaded.

const ALLOWED_SYMBOLS = new Set(['x', 'e', 'pi', 'E', 'PI']);

// User input → math.js node. Accepts ln, tg/ctg, arcsin..., unicode minus, π, "y = ..."
function parseExpr(text, allowX = true) {
  const s = String(text).trim()
    .replace(/^y\s*=/, '')
    .replace(/[−–]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/π/g, 'pi')
    .replace(/√\s*\(/g, 'sqrt(')
    .replace(/\bln\s*\(/g, 'log(')
    .replace(/\btg\b/g, 'tan')
    .replace(/\bctg\b/g, 'cot')
    .replace(/\barc(sin|cos|tan)\b/g, 'a$1')
    // "x(x + 1)", "e^x(…)" mean multiplication, not a call of a function named x
    .replace(/\b(x|e|pi)\s*\(/g, '$1*(');
  if (!s) throw new Error('Empty input');
  const node = math.parse(s);

  // Only known functions and the variables x, e, pi: catch typos like "xsin(x)" early
  node.traverse((n, path, parent) => {
    if (n.isFunctionNode && typeof math[n.fn.name] !== 'function') {
      throw new Error(`Unknown function "${n.fn.name}"`);
    }
    if (!n.isSymbolNode || (parent && parent.isFunctionNode && path === 'fn')) return;
    if (!ALLOWED_SYMBOLS.has(n.name) || (n.name === 'x' && !allowX)) {
      throw new Error(`Unknown symbol "${n.name}"`);
    }
  });
  return node;
}

// Node → TeX: ln instead of log, no "~" spaces for implicit multiplication
function texOf(node) {
  return node.toTex({
    parenthesis: 'auto',
    implicit: 'hide',
    handler: (n, options) => {
      if (n.isFunctionNode && n.fn.name === 'log' && n.args.length === 1) {
        return '\\ln\\left(' + n.args[0].toTex(options) + '\\right)';
      }
    },
  }).replace(/~/g, '');
}

// Node → plain JS function of x. Complex values and errors become NaN.
function fnOf(node) {
  const code = node.compile();
  return x => {
    try {
      const v = code.evaluate({ x });
      return typeof v === 'number' ? v : NaN;
    } catch (e) {
      return NaN;
    }
  };
}

// Symbolic derivative, simplified; null if math.js cannot differentiate it
function derivativeOf(node) {
  try {
    return math.simplify(math.derivative(node, 'x'));
  } catch (e) {
    return null;
  }
}

// Same function? Compare at many points where both are defined.
// Points are shifted off "nice" values like 0 and 1 on purpose.
function sameFunction(f, g, lo = -3, hi = 3) {
  let valid = 0;
  for (let i = 0; i < 60; i++) {
    const x = lo + (hi - lo) * (i + 0.5) / 60 + 0.0123;
    const a = f(x), b = g(x);
    if (!isFinite(a) || !isFinite(b)) continue;
    if (Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(b))) return false;
    valid++;
  }
  return valid >= 10;
}

// Numeric answer: exact forms (1/3, sqrt(3)/2, pi/6) or about 3 decimals are accepted
function sameNumber(u, c) {
  return isFinite(u) && Math.abs(u - c) <= 1e-3 * Math.max(1, Math.abs(c));
}

function evalNumber(text) {
  const v = parseExpr(text, false).evaluate();
  return typeof v === 'number' ? v : NaN;
}

// Simpson's rule; NaN if the function is not finite somewhere on [a, b]
function integrate(f, a, b, n = 2000) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  const v = s * h / 3;
  return isFinite(v) ? v : NaN;
}

// Zeros of f on [lo, hi]: sign changes refined by bisection.
// Jumps through infinity (like 1/x at 0) are rejected because |f| stays large there.
function findRoots(f, lo, hi, n = 800) {
  const roots = [];
  let x0 = lo, y0 = f(lo);
  for (let i = 1; i <= n; i++) {
    const x1 = lo + (hi - lo) * i / n, y1 = f(x1);
    if (y0 === 0) roots.push(x0);
    else if (isFinite(y0) && isFinite(y1) && y0 * y1 < 0) {
      let a = x0, b = x1, fa = y0;
      for (let k = 0; k < 60; k++) {
        const m = (a + b) / 2, fm = f(m);
        if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
      }
      const r = (a + b) / 2;
      if (Math.abs(f(r)) < 1e-6) roots.push(r);
    }
    x0 = x1; y0 = y1;
  }
  return roots.filter((r, i) => i === 0 || Math.abs(r - roots[i - 1]) > 1e-6);
}

// Rounds away float noise: 0.30000000000000004 → 0.3
function clean(v) {
  return Math.round(v * 1e9) / 1e9;
}

function gcd(a, b) {
  return b ? gcd(b, a % b) : Math.abs(a);
}

// p/q as a reduced string: "3/2", "-1/4", "2"
function frac(p, q) {
  const g = gcd(p, q) || 1;
  p /= g; q /= g;
  if (q < 0) { p = -p; q = -q; }
  return q === 1 ? String(p) : `${p}/${q}`;
}

// Decimal → small fraction string if there is one (denominator ≤ 100), else null
function toFrac(v) {
  for (let q = 1; q <= 100; q++) {
    const p = Math.round(v * q);
    if (Math.abs(p / q - v) < 1e-9) return frac(p, q);
  }
  return null;
}
