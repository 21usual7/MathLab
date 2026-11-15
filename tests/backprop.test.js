import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run, learn, LINE, NET } from '../js/topics/backprop.js';

const near = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);

test('backprop: the blames are the derivatives, and the numbers in the texts are right', () => {
  // Backward pass = numerical derivatives, for every input of both graphs
  const h = 1e-6;
  for (const [G, s, names] of [[LINE, { w: 0.7, b: -0.4, x: 1.3, q: 2 }, ['w', 'b', 'x']], [NET, { x: 1.1 }, ['x']], [NET, { x: 0.3 }, ['x']]]) {
    const r = run(G, s);
    for (const k of names) near(r.grad[k], (run(G, { ...s, [k]: s[k] + h }).L - run(G, { ...s, [k]: s[k] - h }).L) / (2 * h), 1e-5);
  }
  // The line: ∂L/∂w = −4, ∂L/∂b = −2, and the nudge measures −4
  let r = run(LINE, { w: 0.5, b: 1, x: 2, q: 3 });
  near(r.L, 1); near(r.grad.yh, -2); near(r.grad.w, -4); near(r.grad.b, -2); near(r.grad.x, -1);
  near((run(LINE, { w: 0.51, b: 1, x: 2, q: 3 }).L - 1) / 0.01, -4, 0.05);
  // The network: two paths −2 and +4 give 2; the second neuron is silent below x = 0.75, the first below −0.5
  r = run(NET, { x: 1 });
  near(r.grad.yh, -2); near(r.grad.x, 2); near(r.grad.z1 * 1, -2); near(r.grad.z2 * 2, 4);
  assert.equal(run(NET, { x: 0.7 }).loc.h2[0], 0); assert.equal(run(NET, { x: 0.8 }).loc.h2[0], 1);
  r = run(NET, { x: 0.6 });
  near(r.wgrad.z2[0], 0); near(r.wgrad.yh[1], 0);
  assert.equal(run(NET, { x: -0.6 }).loc.h1[0], 0);
  // The tasks: −12 for w on the new point, 2.5 for x at 1.25
  near(run(LINE, { w: 1, b: -1, x: 3, q: 4 }).grad.w, -12);
  near(run(LINE, { w: 1, b: -1, x: 3, q: 4 }).grad.yh, -4);
  r = run(NET, { x: 1.25 });
  near(r.grad.yh, -2.5); near(r.grad.x, 2.5);
  // Learning with η = 0.05 halves the miss at every step
  const path = learn({ w: 0.5, b: 1, x: 2, q: 3 }, 8);
  path.forEach((p, i) => near(run(LINE, { ...p, x: 2, q: 3 }).val.yh - 3, -(0.5 ** i)));
});
