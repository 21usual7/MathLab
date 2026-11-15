import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Scene } from '../js/core/scene.js';
import derivative from '../js/topics/derivative.js';
import determinant from '../js/topics/det.js';

test('derivative: visual counterexamples agree with both-sided quotients', () => {
  const previous = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => 1;
  try {
    const scene = new Scene(); derivative.setup(scene);
    const corner = scene.get('corner'), cubic = scene.get('stationary');
    const value = (item, x) => item.fn({ ...scene.scope(), x });
    for (const gap of [1, 0.25, 0.01]) {
      const lines = [];
      const painter = { line: (...args) => lines.push(args), dot() {} };
      scene.get('cornerEvidence').draw2d(painter, scene, { gap });
      const slopes = lines.map(([x1, y1, x2, y2]) => (y2 - y1) / (x2 - x1));
      assert.deepEqual(slopes, [-1, 1]);
      for (const [i, x] of [-gap, gap].entries()) {
        assert.equal((value(corner, x) - value(corner, 0)) / x, slopes[i]);
        assert(value(corner, x) > value(corner, 0)); // minimum, no derivative
      }
      assert(value(cubic, -gap) < value(cubic, 0));
      assert(value(cubic, gap) > value(cubic, 0)); // zero slope, no extremum
      assert(Math.abs((value(cubic, gap) - value(cubic, 0)) / gap - gap ** 2) < 1e-12);
    }
    const prediction = derivative.steps.find(s => s.id === 'corner-prediction');
    assert(!prediction.state.show.includes('cornerEvidence'));
    const check = derivative.steps[5];
    assert(!check.state.show.includes('df'));
    // All revisit links still lead to conceptual explanations after inserting steps.
    for (const step of derivative.steps.filter(s => s.task)) assert(!derivative.steps[step.task.back].task);
  } finally { globalThis.requestAnimationFrame = previous; }
});

test('derivative transfer distinguishes position, increment and exact prediction', () => {
  const task = derivative.steps.find(s => s.id === 'local-transfer').task;
  const predicted = task.target.estimate;
  assert(Math.abs(predicted - (9 + 4 * 0.05)) <= task.tol);
  assert(Math.abs(predicted - 9.05) > task.tol);
  // Same present position and velocity allow different future positions.
  const positions = [-100, 0, 100].map(acc => 9 + 4 * 0.05 + acc * 0.05 ** 2);
  assert(new Set(positions).size === 3);
});

test('determinant accepts continuous families rather than a grid of examples', () => {
  const area = determinant.steps.find(s => s.task?.target?.some?.(g => g.jy === 3)).task;
  const flip = determinant.steps.find(s => s.task?.target?.some?.(g => g.jx === 1 && g.jy === -5)).task;
  for (const free of [-4.83, -0.241, 0.267, 4.91]) {
    assert(area.ok({ jx: free, jy: 3 }));
    assert(!area.ok({ jx: free, jy: -3 }));
    assert(flip.ok({ jx: 1, jy: free }));
    assert(!flip.ok({ jx: -1, jy: free }));
  }
});
