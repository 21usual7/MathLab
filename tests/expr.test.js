import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, normalize, definedName, compile, tex } from '../js/core/expr.js';

const fns = new Set(['f', 'g']);
const kind = (s, f) => analyze(s, f).kind;

test('kinds', () => {
  assert.equal(kind('y = sin(a x)'), 'function');
  assert.equal(kind('z = x^2 - y^2'), 'surface');
  assert.equal(kind('(cos(t), sin(t))'), 'curve2');
  assert.equal(kind('(cos(t), sin(t), t/5)'), 'curve3');
  assert.equal(kind('(1, 2)'), 'point2');
  assert.equal(kind('a = 1.5'), 'param');
  assert.equal(kind('x = 2'), 'vline');
  assert.equal(kind('x = a'), 'vline');
  assert.equal(kind('x = y'), 'error');
  assert.equal(kind(''), 'empty');
  assert.equal(kind('y = sin x'), 'error');
});

test('implicit multiplication', () => {
  assert.equal(normalize('2xsin(x)'), '2x*sin(x)');
  assert.equal(normalize('a(x + 1)'), 'a*(x + 1)');
  assert.deepEqual(analyze('y = a x^2 + b x + c').params, ['a', 'b', 'c']);
});

test('user functions', () => {
  assert.equal(definedName('f(x) = x^2'), 'f');
  assert.equal(definedName('y = x'), null);
  assert.equal(definedName('sin(x) = 1'), null);
  const def = analyze('f(x) = x^2 + a', fns);
  assert.equal(def.kind, 'function');
  assert.equal(def.name, 'f');
  assert.deepEqual(def.params, ['a']);
  // Called, not multiplied, once f is known
  assert.equal(normalize('f(x - 1)', fns), 'f(x - 1)');
  assert.equal(normalize('f(x - 1)'), 'f*(x - 1)');
  const use = analyze('y = 2 f(x - h) + k', fns);
  assert.equal(use.kind, 'function');
  assert.deepEqual(use.params, ['h', 'k']);
  const fx = compile(use.node);
  assert.equal(fx({ x: 3, h: 1, k: 0.5, f: v => v * v }), 8.5);
  // Derivatives
  const d = analyze("y = f'(x) + f''(x)", fns);
  assert.equal(d.kind, 'function');
  assert.equal(d.tex, "y = f'(x) + f''(x)");
  assert.equal(analyze('y = f(x^2)', fns).tex, 'y = f\\left(x^{2}\\right)');
  assert.equal(kind("y = h'(x)", fns), 'error');
  assert.equal(kind('f(x) = f(x) + 1', fns), 'error');
  assert.equal(kind('f = 2', fns), 'error');
  assert.equal(kind('y = f', fns), 'error');
});

test('ranges', () => {
  const a = analyze('y = sqrt(x) {0 <= x <= 4}');
  assert.equal(a.kind, 'function');
  assert.equal(compile(a.domain.lo)({}), 0);
  assert.equal(compile(a.domain.hi)({}), 4);
  const b = analyze('(cos(t), sin(t)) {0 < t < T}');
  assert.equal(b.kind, 'curve2');
  assert.deepEqual(b.params, ['T']);
  const c = analyze('y = 1/x {x > 0}');
  assert.equal(c.domain.hi, null);
  assert.equal(compile(c.domain.lo)({}), 0);
  const d = analyze('y = x {x ≤ 2}');
  assert.equal(compile(d.domain.hi)({}), 2);
  assert.equal(kind('y = x {0 < y < 1}'), 'error');
  assert.equal(kind('z = x y {0 < x < 1}'), 'error');
});

test('tex', () => {
  const T = s => analyze(s).tex;
  assert.equal(T('y = x^3/4 - x'), 'y = \\frac{x^{3}}{4} - x');
  assert.equal(T('y = sin(2x)'), 'y = \\sin 2 x');
  assert.equal(T('y = 2^x'), 'y = 2^{x}');
  assert.equal(T('y = log(x, 2)'), 'y = \\log_{2} x');
  assert.equal(T('x = 2'), 'x = 2');
});
