import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { same, diagnose, explainDiff } from '../js/core/check.js';

const root = x => Math.sqrt(x);

test('same', () => {
  assert.ok(same(x => 2 * (x + 1), x => 2 * x + 2));
  assert.ok(!same(x => x * x, x => x * x + 1e-3));
  // Defined at different places: not the same
  assert.ok(!same(x => Math.sqrt(x - 3), x => Math.sqrt(x) - 3));
  assert.ok(same(Math.sin, x => Math.sin(x + 2 * Math.PI)));
});

test('diagnose', () => {
  const a = x => Math.sqrt(x - 3);
  assert.deepEqual(diagnose(a, a), { type: 'same' });
  assert.deepEqual(diagnose(x => Math.sqrt(x + 3), a), { type: 'hshift', d: -6 });
  assert.deepEqual(diagnose(x => (x - 1) ** 2 + 4, x => (x - 1) ** 2 + 2), { type: 'vshift', d: 2 });
  assert.deepEqual(diagnose(x => (x + 2) ** 2, x => (x - 2) ** 2), { type: 'hshift', d: -4 });
  assert.deepEqual(diagnose(x => -((x - 1) ** 2), x => (x - 1) ** 2), { type: 'vscale', k: -1 });
  assert.deepEqual(diagnose(x => 2 * Math.sin(x), Math.sin), { type: 'vscale', k: 2 });
  assert.deepEqual(diagnose(x => Math.sin(x / 2), x => Math.sin(2 * x)), { type: 'hscale', b: 0.25 });
  // A factor that is not a round number is found too: 2eˣ against 3eˣ
  assert.ok(Math.abs(diagnose(x => 2 * Math.exp(x), x => 3 * Math.exp(x), [-2, 2]).k - 2 / 3) < 1e-9);
  assert.deepEqual(diagnose(x => Math.sqrt(-x), root), { type: 'hscale', b: -1 });
  assert.equal(diagnose(x => Math.sqrt(x) - 3, a).type, 'other');
  assert.ok(explainDiff({ type: 'hshift', d: 2 }).ru.includes('правее'));
});
