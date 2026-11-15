import test from 'node:test';
import assert from 'node:assert/strict';
import { prefixTrace, pointerTrace, hashTrace, stackTrace, pairOK } from '../js/topics/algorithms/pattern-models.js';
import { LESSONS, BINARY_TASK } from '../js/topics/algorithms/pattern-lessons.js';
import { ALGORITHM_TOPICS, loadAlgorithmTopic } from '../js/topics/algorithms/catalog.js';

test('prefix accumulation and cancellation agree with direct sums, including negatives and singleton ranges', () => {
  for (let n = 1; n < 12; n++) {
    const a = Array.from({ length: n }, (_, i) => (i * 7 + n) % 13 - 6);
    for (let l = 0; l < n; l++) for (let r = l; r < n; r++) {
      const run = prefixTrace(a, l, r);
      assert.equal(run.result, a.slice(l, r + 1).reduce((s, v) => s + v, 0));
      for (const frame of run.frames) frame.memory.forEach((v, k) => assert.equal(v, a.slice(0, k).reduce((s, x) => s + x, 0)));
    }
  }
});
test('pair methods agree with an exhaustive oracle; their snapshots never mutate the input', () => {
  for (let n = 0; n <= 12; n++) {
    const a = Array.from({ length: n }, (_, i) => (i * 7 + n) % 17 - 8);
    for (let t = -18; t <= 18; t++) {
      const sorted = [...a].sort((x, y) => x - y), hash = hashTrace(a, t), pointers = pointerTrace(sorted, t);
      assert(pairOK([a, t], hash.result)); assert(pairOK([sorted, t], pointers.result));
      assert(pointers.frames.length <= 2 * n + 1);
      for (const f of hash.frames) assert(f.marks.every(i => i >= 0 && i < a.length));
    }
  }
  assert(!pairOK([[3], 6], [0, 0])); assert(!pairOK([[1, 2], 3], [0, 5]));
  assert(!pairOK([[1, 2], 3], null)); assert(pairOK([[1, 2], 3], [1, 0]));
});
test('the stack recognizes the bracket grammar for every short string', () => {
  const alphabet = ['(', ')', '[', ']'];
  const oracle = s => { let next = s; do { s = next; next = s.replaceAll('()', '').replaceAll('[]', '').replaceAll('{}', ''); } while (s !== next); return next === ''; };
  for (let n = 0; n <= 6; n++) for (let k = 0; k < 4 ** n; k++) {
    let v = k, s = ''; for (let j = 0; j < n; j++) { s += alphabet[v % 4]; v = Math.floor(v / 4); }
    assert.equal(stackTrace(s).result, oracle(s), s);
  }
});
test('controlled interventions expose each named bug on the same mathematical task', () => {
  assert.equal(prefixTrace([4, -2, 7, 1], 1, 2).result, 5);
  assert.equal(prefixTrace([4, -2, 7, 1], 1, 2, 'off-by-one').result, -2);
  assert(pairOK([[1, 3, 7, 9], 10], pointerTrace([1, 3, 7, 9], 10).result));
  assert.equal(pointerTrace([3, 7, 1, 9], 10).result, null);
  assert(!pairOK([[3, 2, 4], 6], hashTrace([3, 2, 4], 6, 'insert-first').result));
  assert.equal(stackTrace('([)]').result, false); assert.equal(stackTrace('([)]', 'count-only').result, true);
});
test('all five lessons load as Topics and every Python task has adversarial cases and a callable scaffold', async () => {
  assert.equal(ALGORITHM_TOPICS.length, 5);
  for (const meta of ALGORITHM_TOPICS) {
    const topic = await loadAlgorithmTopic(meta.id); assert(topic.steps.length >= 4); assert.equal(typeof topic.mountStage, 'function'); assert(!topic.modes);
  }
  for (const task of [...Object.values(LESSONS).map(l => l.task), BINARY_TASK]) {
    assert(task.starter.includes(`def ${task.functionName}(`)); assert(task.solution.includes(`def ${task.functionName}(`)); assert(task.cases.length >= 6);
  }
});
