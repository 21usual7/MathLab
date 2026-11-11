// Numeric helpers: derivative, integral, roots, number formatting

// Central difference
export const slope = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);

// Simpson's rule; NaN if f is not finite somewhere on [a, b]
export function integrate(f, a, b, n = 2000) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  const v = s * h / 3;
  return isFinite(v) ? v : NaN;
}

// Zeros of f on [lo, hi]: sign changes refined by bisection; jumps through infinity are rejected
export function findRoots(f, lo, hi, n = 800) {
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

// Peaks and valleys of f on [lo, hi]: a sample higher (lower) than both neighbours, refined by golden-section
// search. A "peak" at a jump taller than maxJump (tan x at π/2) is a break, not an extremum.
export function extrema(f, lo, hi, n = 600, maxJump = Infinity) {
  const xs = [], ys = [], out = [];
  for (let i = 0; i <= n; i++) { const x = lo + (hi - lo) * i / n; xs.push(x); ys.push(f(x)); }
  const PHI = (Math.sqrt(5) - 1) / 2;
  for (let i = 1; i < n; i++) {
    const a = ys[i - 1], b = ys[i], c = ys[i + 1];
    if (!isFinite(a) || !isFinite(b) || !isFinite(c)) continue;
    if (Math.abs(b - a) > maxJump || Math.abs(c - b) > maxJump) continue;
    const isMax = b > a && b > c, isMin = b < a && b < c;
    if (!isMax && !isMin) continue;
    const g = isMax ? x => -f(x) : f;
    let l = xs[i - 1], r = xs[i + 1];
    let x1 = r - PHI * (r - l), x2 = l + PHI * (r - l), g1 = g(x1), g2 = g(x2);
    for (let k = 0; k < 60; k++) {
      if (g1 < g2) { r = x2; x2 = x1; g2 = g1; x1 = r - PHI * (r - l); g1 = g(x1); }
      else { l = x1; x1 = x2; g1 = g2; x2 = l + PHI * (r - l); g2 = g(x2); }
    }
    const x = (l + r) / 2, y = f(x);
    if (isFinite(y)) out.push({ x, y, type: isMax ? 'max' : 'min' });
  }
  return out;
}

// Rounds away float noise: 0.30000000000000004 → 0.3
export const clean = v => Math.round(v * 1e9) / 1e9;

// Short number for labels: 6 significant digits
export const fmt = v => (!isFinite(v) ? '—' : Math.abs(v) < 1e-10 ? '0' : String(Number(v.toPrecision(6))));
