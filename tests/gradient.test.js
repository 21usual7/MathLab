import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hill, grad, TOP, PASS } from '../js/topics/gradient.js';

test('gradient: the slopes, the top and the pass', () => {
  const h = 1e-6;
  for (const [x, y] of [[0.3, -0.7], [-0.4, 1.6], [2.4, -2]]) {
    const g = grad(x, y);
    assert.ok(Math.abs(g[0] - (hill(x + h, y) - hill(x - h, y)) / (2 * h)) < 1e-6);
    assert.ok(Math.abs(g[1] - (hill(x, y + h) - hill(x, y - h)) / (2 * h)) < 1e-6);
    // The steepness along u is ∇f·u: the most along ∇f, zero along the level line
    const L = Math.hypot(...g), along = a => (hill(x + h * Math.cos(a), y + h * Math.sin(a)) - hill(x, y)) / h;
    assert.ok(Math.abs(along(Math.atan2(g[1], g[0])) - L) < 1e-4);
    assert.ok(Math.abs(along(Math.atan2(g[1], g[0]) + Math.PI / 2)) < 1e-4);
  }
  // ∇f = 0 at the top and at the pass; the top is a maximum, the pass a saddle (the Hessian has det < 0)
  const hess = ([x, y]) => { const e = 1e-4, gx = grad(x + e, y), gy = grad(x, y + e), g = grad(x, y); return [(gx[0] - g[0]) / e, (gy[0] - g[0]) / e, (gx[1] - g[1]) / e, (gy[1] - g[1]) / e]; };
  for (const P of [TOP, PASS]) assert.ok(Math.hypot(...grad(...P)) < 1e-9);
  const [a, b, c, d] = hess(TOP), [p, q, r, s] = hess(PASS);
  assert.ok(a * d - b * c > 0 && a < 0);
  assert.ok(p * s - q * r < 0);
  assert.ok(hill(...TOP) > 3 && hill(...PASS) < hill(...TOP));
});

test('chain rule: the measured stretches tend to g′(x) and f′(g(x))', async () => {
  const { g, dg, f, df } = await import('../js/topics/chain.js');
  for (const x of [0.3, 0.9, 1.6]) {
    const h = 1e-6, k1 = (g(x + h) - g(x)) / h, k2 = (f(g(x + h)) - f(g(x))) / (g(x + h) - g(x));
    assert.ok(Math.abs(k1 - dg(x)) < 1e-4 && Math.abs(k2 - df(g(x))) < 1e-4);
    assert.ok(Math.abs((f(g(x + h)) - f(g(x - h))) / (2 * h) - dg(x) * df(g(x))) < 1e-6);
  }
});
