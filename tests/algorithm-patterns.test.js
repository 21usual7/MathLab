import test from 'node:test';
import assert from 'node:assert/strict';
import { prefixTrace, pointerTrace, hashTrace, stackTrace, dupTrace, windowTrace, mergeTrace, bfsTrace, stairsTrace, hanoiTrace, bstTrace, bstPath, heapTrace, heapPushAll, dijkstraTrace, queensTrace, pairOK } from '../js/topics/algorithms/pattern-models.js';
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
test('all twenty lessons load as Topics and every Python task has adversarial cases and a callable scaffold', async () => {
  assert.equal(ALGORITHM_TOPICS.length, 20);
  for (const l of Object.values(LESSONS)) assert(l.signals.length && l.pitfalls.length && l.cost);
  for (const meta of ALGORITHM_TOPICS) {
    const topic = await loadAlgorithmTopic(meta.id); assert(topic.steps.length >= 4); assert.equal(typeof topic.mountStage, 'function'); assert(!topic.modes);
  }
  for (const task of [...Object.values(LESSONS).map(l => l.task), BINARY_TASK]) {
    assert(task.starter.includes(`def ${task.functionName}(`)); assert(task.solution.includes(`def ${task.functionName}(`)); assert(task.cases.length >= 6);
  }
});
test('new lesson models agree with independent oracles', () => {
  const seq = (n, m) => Array.from({ length: n }, (_, i) => (i * 7 + n * 3) % m - Math.floor(m / 2));
  for (let n = 0; n <= 9; n++) {
    const a = seq(n, 7), d = dupTrace(a);
    assert.equal(d.result, new Set(a).size < a.length);
    if (!d.result) assert.equal(d.comparisons, n * (n - 1) / 2 + 0);
    for (let k = 1; k <= n; k++) {
      const brute = Math.max(...a.slice(0, n - k + 1).map((_, i) => a.slice(i, i + k).reduce((s, v) => s + v, 0)));
      assert.equal(windowTrace(a, k).result, brute);
    }
    for (let m = 0; m <= 6; m++) {
      const x = [...a].sort((p, q) => p - q), y = seq(m, 9).sort((p, q) => p - q);
      assert.deepEqual(mergeTrace(x, y).result, [...x, ...y].sort((p, q) => p - q));
    }
  }
  // BFS against Floyd–Warshall on small pseudo-random undirected graphs
  for (let n = 1; n <= 7; n++) for (let seed = 0; seed < 20; seed++) {
    const g = Array.from({ length: n }, () => []), D = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 0 : Infinity));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if ((i * 31 + j * 17 + seed * 7) % 5 < 2) { g[i].push(j); g[j].push(i); D[i][j] = D[j][i] = 1; }
    for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) D[i][j] = Math.min(D[i][j], D[i][k] + D[k][j]);
    assert.deepEqual(bfsTrace(g, 0).result, D[0].map(v => v === Infinity ? -1 : v));
  }
  const fib = [1, 1]; for (let i = 2; i <= 30; i++) fib.push(fib[i - 1] + fib[i - 2]);
  for (let n = 0; n <= 30; n++) assert.equal(stairsTrace(n).result, fib[n]);
});
test('each new intervention breaks exactly the named cause', () => {
  assert.equal(dupTrace([5, 1, 4, 2, 8], 'self').result, true);
  assert.equal(windowTrace([2, -1, 3, 5, -4, 1], 3, 'no-subtract').result, 9);
  assert.deepEqual(mergeTrace([1, 4, 9], [2, 3, 10, 12], 'no-tail').result, [1, 2, 3, 4, 9]);
  assert.deepEqual(bfsTrace(LESSONS.bfs.graph.edges, 0, 'stack').result, [0, 1, 1, 3, 2, 4]);
  assert.equal(stairsTrace(6, 'base-zero').result, 8); assert.equal(stairsTrace(6).result, 13);
  for (const l of Object.values(LESSONS)) for (const b of [].concat(l.experiment.bug || [])) assert(l.code[b.line] !== b.text);
});
test('recursion, tree, heap, weighted-graph and backtracking models agree with oracles', () => {
  const hanoiCase = n => ({ args: [n] }), hanoiOK = LESSONS.recursion.task.check;
  for (let n = 0; n <= 8; n++) { const r = hanoiTrace(n); assert(r.legal); assert(hanoiOK(hanoiCase(n), r.result), `hanoi ${n}`); }
  for (let n = 2; n <= 5; n++) assert.equal(hanoiTrace(n, 'move-first').legal, false);
  assert(!hanoiOK(hanoiCase(2), [[0, 2], [0, 1], [2, 1]])); assert(!hanoiOK(hanoiCase(1), [[0, 1]]));
  const rnd = (n, seed) => Array.from({ length: n }, (_, i) => (i * 37 + seed * 11) % 23 - 5);
  for (let n = 0; n <= 9; n++) for (let seed = 0; seed < 6; seed++) {
    const a = rnd(n, seed), keys = [...new Set(a)];
    for (const t of [...keys, 100]) {
      const run = bstTrace(keys, t), path = run.result; assert.deepEqual(path, bstPath(keys, t));
      assert.deepEqual(run.frames.at(-1).tree.map(x => x.key), [...keys].sort((p, q) => p - q), 'in-order is sorted');
      if (keys.includes(t)) assert.equal(path.at(-1), t); else assert(!path.includes(t));
    }
    const h = heapPushAll(a); assert.deepEqual([...h].sort((p, q) => p - q), [...a].sort((p, q) => p - q));
    h.forEach((x, i) => assert(i === 0 || h[(i - 1) >> 1] <= x)); assert.deepEqual(heapTrace(a).result, h);
  }
  assert.equal(bstTrace([20, 30, 40, 50, 60, 70, 80], 65).height, 7); assert.equal(bstTrace([50, 30, 70, 20, 40, 60, 80], 65).height, 3);
  assert(heapTrace([5, 3, 8, 1, 9, 2], 'no-sift').frames.at(-1).bad);
  for (let n = 1; n <= 7; n++) for (let seed = 0; seed < 15; seed++) {
    const edges = [], D = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 0 : Infinity));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if ((i * 13 + j * 7 + seed) % 3) { const w = (i * 5 + j * 3 + seed) % 9; edges.push([i, j, w]); D[i][j] = D[j][i] = Math.min(D[i][j], w); }
    for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) D[i][j] = Math.min(D[i][j], D[i][k] + D[k][j]);
    assert.deepEqual(dijkstraTrace(n, edges, 0).result, D[0].map(v => v === Infinity ? -1 : v));
  }
  assert.notDeepEqual(dijkstraTrace(6, [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1], [2, 3, 5], [3, 4, 3], [2, 4, 8], [4, 5, 1], [3, 5, 6]], 0, 'first-fix').result, [0, 3, 1, 4, 7, 8]);
  const safe = q => q.every((c, r) => q.every((d, s) => r === s || (c !== d && Math.abs(c - d) !== Math.abs(r - s))));
  for (let n = 1; n <= 8; n++) { const q = queensTrace(n).result; if ([2, 3].includes(n)) assert.equal(q, null); else assert(q && safe(q), `queens ${n}`); }
  assert.equal(queensTrace(4, 'no-undo').result, null);
});
