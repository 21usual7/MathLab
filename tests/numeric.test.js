import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findRoots, extrema, integrate, slope } from '../js/core/numeric.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test('roots', () => {
  const r = findRoots(x => x * x - 2, -3, 3);
  assert.equal(r.length, 2);
  near(r[0], -Math.SQRT2); near(r[1], Math.SQRT2);
  // 1/x changes sign at 0 through infinity: not a root
  assert.equal(findRoots(x => 1 / x, -1, 1.3).length, 0);
});

test('extrema', () => {
  const e = extrema(x => x ** 3 / 4 - x, -3, 3);
  assert.equal(e.length, 2);
  near(e[0].x, -2 / Math.sqrt(3), 1e-5); assert.equal(e[0].type, 'max');
  near(e[1].x, 2 / Math.sqrt(3), 1e-5); assert.equal(e[1].type, 'min');
  near(extrema(Math.abs, -1, 1.1)[0].x, 0, 1e-5);
  // Jumps of tan x are not peaks; floor has no extrema
  assert.equal(extrema(Math.tan, 0.5, 2.5, 600, 20).length, 0);
  assert.equal(extrema(Math.floor, -3, 3).length, 0);
});

test('integral and slope', () => {
  near(integrate(Math.sin, 0, Math.PI), 2);
  near(slope(x => x * x, 3), 6, 1e-6);
});
