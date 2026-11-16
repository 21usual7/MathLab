import test from 'node:test';
import assert from 'node:assert/strict';
import { arrayStart, arrayOp, hashStart, hashOp, hashCode, bucketsOf, queueOps, treeHeight, traverse, treeFacts, adjacency, matrixOf, heapPush, heapPop } from '../js/topics/algorithms/structure-models.js';
import { STRUCTURES } from '../js/topics/algorithms/structure-lessons.js';
import { ALGORITHM_TOPICS, loadAlgorithmTopic } from '../js/topics/algorithms/catalog.js';
import { CATALOG } from '../js/topics/index.js';

test('topic ids are unique across the whole site', () => {
  const ids = CATALOG.map(m => m.id); assert.deepEqual(ids.filter((x, i) => ids.indexOf(x) !== i), []);
});
test('dynamic array: index is O(1), front edits shift n, appends amortise below 3 steps', () => {
  let s = arrayStart(), cost = 0;
  for (let k = 1; k <= 1000; k++) { const r = arrayOp(s, 'append'); cost += r.cost; s = r.state; assert(s.cap >= s.items.length); }
  assert(cost / 1000 < 3); assert.deepEqual(s.items, Array.from({ length: 1000 }, (_, i) => i + 1));
  assert.equal(arrayOp(s, 'read', 999).cost, 1); assert(arrayOp(s, 'read', 1000).error);
  const n = s.items.length, ins = arrayOp(s, 'insert0'); assert.equal(ins.state.items[0], 1001); assert(ins.cost >= n + 1);
  assert.equal(arrayOp(s, 'pop0').cost, n); assert.equal(arrayOp(s, 'pop').cost, 1); assert(arrayOp(arrayStart(), 'pop').error);
});
test('hash table: every stored key is found, rehashing keeps all, buckets follow h mod m', () => {
  let s = hashStart(4); const keys = ['кот', 'ток', 'мир', 'рим', 'дом', 'мод', 'лес', 'сон', 'нос', 'a', 'b', 'ab', 'ba', ''];
  keys.forEach((k, i) => { s = hashOp(s, 'put', k, i).state; assert(s.n <= s.m); });
  keys.forEach((k, i) => { const r = hashOp(s, 'get', k); assert.equal(r.value, i); assert.equal(r.bucket, hashCode(k) % s.m); });
  assert.deepEqual(hashOp(s, 'get', 'нет').events, ['miss']);
  assert(hashOp(hashOp(hashStart(4), 'put', 'кот', 1).state, 'put', 'ток', 2).events.includes('collision'));
  assert.equal(hashOp(hashOp(s, 'delete', 'кот').state, 'get', 'кот').value, undefined);
  assert.deepEqual(bucketsOf(['ab', 'ba', 'b'], 2), [['b'], ['ab', 'ba']]);
});
test('a queue from two stacks agrees with FIFO', () => {
  const twoStacks = ops => { const a = [], b = [], out = []; for (const [op, x] of ops) { if (op === 'push') a.push(x); else { if (!b.length) while (a.length) b.push(a.pop()); out.push(b.length ? b.pop() : null); } } return out; };
  for (let seed = 0; seed < 50; seed++) { const ops = Array.from({ length: 20 }, (_, i) => ((i * 7 + seed * 3) % 5 < 3 ? ['push', i] : ['pop'])); assert.deepEqual(queueOps(ops), twoStacks(ops)); }
});
test('trees: traversal orders, facts and heights', () => {
  const t = { A: ['B', 'C'], B: ['D', 'E'], C: [null, 'F'], D: [null, null], E: ['G', null], F: [null, null], G: [null, null] };
  assert.deepEqual(traverse(t, 'A', 'pre'), [...'ABDEGCF']); assert.deepEqual(traverse(t, 'A', 'in'), [...'DBGEACF']);
  assert.deepEqual(traverse(t, 'A', 'post'), [...'DGEBFCA']); assert.deepEqual(traverse(t, 'A', 'level'), [...'ABCDEFG']);
  const f = treeFacts(t, 'A'); assert.equal(f.height('A'), 3); assert.equal(f.depth.G, 3); assert.equal(f.parent.G, 'E');
  assert.equal(treeHeight([[]]), 0); assert.equal(treeHeight([[1], [2], [3], []]), 3);
});
test('graphs: list and matrix describe the same edges; degrees sum to 2E', () => {
  for (let n = 1; n <= 7; n++) for (let seed = 0; seed < 10; seed++) {
    const edges = []; for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) if ((u * 5 + v * 3 + seed) % 3 === 0) edges.push([u, v]);
    const adj = adjacency(n, edges), m = matrixOf(n, edges);
    assert.equal(adj.reduce((s, a) => s + a.length, 0), 2 * edges.length);
    adj.forEach((a, u) => m[u].forEach((x, v) => assert.equal(x, a.includes(v) ? 1 : 0)));
    const d = adjacency(n, edges, true); assert.equal(d.reduce((s, a) => s + a.length, 0), edges.length);
  }
});
test('heap: pushes then pops sort any input; the property holds after every snapshot', () => {
  const ok = h => h.every((x, i) => !i || h[(i - 1) >> 1] <= x);
  for (let seed = 0; seed < 40; seed++) {
    const a = Array.from({ length: seed % 13 }, (_, i) => (i * 37 + seed * 11) % 17); let h = [];
    for (const x of a) { const r = heapPush(h, x); assert(ok(r.heap)); assert.equal(r.states.length, r.swaps + 1); h = r.heap; }
    const out = []; while (h.length) { const r = heapPop(h); assert(ok(r.heap)); out.push(r.min); h = r.heap; }
    assert.deepEqual(out, [...a].sort((p, q) => p - q));
  }
  assert.deepEqual(heapPop([1, 4, 4, 9]).heap, [4, 9, 4]);
});
test('six structure lessons: ten steps, valid scripts, quizzes and Python tasks', async () => {
  const ids = ALGORITHM_TOPICS.filter(m => m.kind === 'structure').map(m => m.id);
  assert.deepEqual(ids.sort(), Object.keys(STRUCTURES).sort());
  for (const id of ids) {
    const l = STRUCTURES[id]; assert.equal(l.steps.length, 10, id);
    const topic = await loadAlgorithmTopic(id); assert.equal(topic.steps.length, 10);
    for (const s of l.steps) {
      if (s.kind === 'quiz') s.items.forEach(q => assert(q.correct >= 0 && q.correct < q.options.length));
      if (s.kind === 'sandbox') assert(s.goals.length >= 3);
      if (s.kind === 'guided') assert(s.script.length >= 6);
      if (s.kind === 'python') { const t = s.task; assert(t.starter.includes(`def ${t.functionName}(`)); assert(t.solution.includes(`def ${t.functionName}(`)); assert(t.cases.length >= 6); t.cases.forEach(c => assert(c.expected !== undefined)); }
    }
  }
});
