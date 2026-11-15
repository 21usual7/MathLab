import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import topic, { angleAt } from '../js/topics/unit-circle.js';

test('unit circle: dragging the cabin gives the angle, and the task answer is right', () => {
  assert.equal(angleAt(1, 0), 0);
  assert.equal(angleAt(0, 1), 90);
  assert.equal(angleAt(-1, -0.0001), 180);
  assert.equal(angleAt(0, -1), 270);
  assert.equal(angleAt(-2 + Math.cos(Math.PI / 6), 0.5, -2), 30); // the wide view: axle at x = −2
  // The task: sin 30° = 0.5; the traps 60° (cos = 0.5) and 150° (the same height on the left)
  const task = topic.steps.at(-1).task, s = a => Math.sin(a * Math.PI / 180);
  assert.ok(Math.abs(s(task.target.alpha) - 0.5) < 1e-12);
  assert.ok(Math.abs(Math.cos(60 * Math.PI / 180) - 0.5) < 1e-12 && Math.abs(s(150) - 0.5) < 1e-12);
});

test('trig equations: the roots solve the equation, two per turn, none beyond 1', async () => {
  const { roots } = await import('../js/topics/trig-equations.js');
  for (const a of [-1, -0.71, -0.3, 0, 0.5, 0.71, 1]) {
    const r = roots('sin', a, -2 * Math.PI, 4 * Math.PI), c = roots('cos', a, -Math.PI, Math.PI);
    r.forEach(x => assert.ok(Math.abs(Math.sin(x) - a) < 1e-9));
    c.forEach(x => assert.ok(Math.abs(Math.cos(x) - a) < 1e-9));
    assert.equal(roots('sin', a, 0, 2 * Math.PI - 1e-6).length, Math.abs(a) === 1 ? 1 : 2);
  }
  assert.deepEqual(roots('sin', 1.2, 0, 7), []);
  // The tasks: sin 45° ≈ 0.71 within the tolerance, arccos(−0.5) = 120°
  assert.ok(Math.abs(Math.sin(Math.PI / 4) - 0.71) < 0.015);
  assert.ok(Math.abs(Math.acos(-0.5) * 180 / Math.PI - 120) < 1e-9);
});

test('trig formulas: the chord gives cos(α − β), and the reduction answers hold', () => {
  const d = Math.PI / 180, c = x => Math.cos(x * d), s = x => Math.sin(x * d);
  for (const [a, b] of [[110, 35], [10, 300], [200, 80]]) {
    const chord = (c(a) - c(b)) ** 2 + (s(a) - s(b)) ** 2;
    assert.ok(Math.abs(chord - (2 - 2 * c(a - b))) < 1e-12);
  }
  assert.ok(Math.abs(c(270 - 25) + s(25)) < 1e-12); // cos(270° − α) = −sin α
  assert.ok(Math.abs(s(50) - c(40)) < 1e-12);
});
