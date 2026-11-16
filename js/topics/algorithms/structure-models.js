// Pure models of the data structures behind the structure lessons. Every operation returns the new state,
// its cost in elementary steps, the events it caused (for sandbox goals) and a description of what moved.
const L = (ru, en) => ({ ru, en });

// ---------- Dynamic array: contiguous cells, capacity doubles when full ----------
export const arrayStart = () => ({ items: [], cap: 4, next: 1 });
export function arrayOp(s, op, arg) {
  const items = [...s.items], out = { cost: 0, events: [], moves: [] }; let cap = s.cap, next = s.next;
  const grow = () => { if (items.length < cap) return; out.cost += items.length; out.resize = { from: cap, to: cap * 2, copied: items.length }; cap *= 2; out.events.push('resize'); };
  if (op === 'read') {
    if (!(arg >= 0 && arg < items.length)) return { ...out, state: s, error: L(`IndexError: индекса ${arg} нет, длина ${items.length}`, `IndexError: no index ${arg}, length ${items.length}`), events: ['index-error'] };
    out.cost = 1; out.read = arg; out.events.push('read');
    out.note = L(`Адрес = начало + ${arg} · размер ячейки. Одна арифметическая операция — и мы на месте, сколько бы элементов ни было.`, `Address = start + ${arg} · cell size. One arithmetic step lands on the cell, however many elements there are.`);
  } else if (op === 'append') {
    grow(); items.push(next++); out.cost += 1; out.place = items.length - 1; out.events.push('append');
    out.note = out.resize ? L(`Места не было: выделили массив вдвое больше (${cap}) и скопировали ${out.resize.copied} элементов. Дорого, но редко.`, `No room: allocated a twice larger array (${cap}) and copied ${out.resize.copied} elements. Expensive, but rare.`) : L('Свободная ячейка в конце есть — один шаг.', 'There is a free cell at the end — one step.');
  } else if (op === 'insert0') {
    grow(); out.moves = items.map((_, i) => i); out.cost += items.length + 1; items.unshift(next++); out.place = 0; out.events.push('shift');
    out.note = L(`Чтобы освободить ячейку 0, все ${items.length - 1} элементов сдвинулись на одну вправо.`, `To free cell 0, all ${items.length - 1} elements shifted one cell right.`);
  } else if (op === 'pop') {
    if (!items.length) return { ...out, state: s, error: L('IndexError: pop из пустого массива', 'IndexError: pop from an empty array'), events: ['empty-error'] };
    out.removed = items.length - 1; items.pop(); out.cost = 1; out.events.push('pop');
    out.note = L('Последний элемент убран — соседей трогать не нужно.', 'The last element is removed — no neighbours move.');
  } else if (op === 'pop0') {
    if (!items.length) return { ...out, state: s, error: L('IndexError: pop из пустого массива', 'IndexError: pop from an empty array'), events: ['empty-error'] };
    out.removed = 0; items.shift(); out.moves = items.map((_, i) => i + 1); out.cost = items.length + 1; out.events.push('shift');
    out.note = L(`Ячейка 0 освободилась, и ${items.length} элементов сдвинулись влево, чтобы массив остался без дыр.`, `Cell 0 is freed and ${items.length} elements shift left so the array has no holes.`);
  }
  return { ...out, state: { items, cap, next } };
}

// ---------- Hash table with separate chaining; h(key) = sum of character codes ----------
export const hashCode = key => [...key].reduce((s, c) => s + c.codePointAt(0), 0);
export const hashStart = (m = 4) => ({ m, buckets: Array.from({ length: m }, () => []), n: 0 });
export function hashOp(s, op, key, value) {
  const buckets = s.buckets.map(b => b.map(e => ({ ...e }))), b = hashCode(key) % s.m, chain = buckets[b], out = { cost: 0, events: [], bucket: b, code: hashCode(key) };
  let i = 0; while (i < chain.length && chain[i].k !== key) { i++; out.cost++; }
  const found = i < chain.length; if (found) out.cost++;
  let state = { m: s.m, buckets, n: s.n };
  if (op === 'get') { out.events.push(found ? 'hit' : 'miss'); out.value = found ? chain[i].v : undefined; out.at = found ? i : -1; }
  if (op === 'delete') { if (found) { chain.splice(i, 1); state.n--; out.events.push('delete'); } else out.events.push('miss'); }
  if (op === 'put') {
    if (found) { chain[i].v = value; out.events.push('update'); out.at = i; }
    else {
      if (chain.length) out.events.push('collision');
      chain.push({ k: key, v: value }); state.n++; out.at = chain.length - 1; out.events.push('insert');
      if (state.n > state.m) { state = rehash(state, state.m * 2); out.events.push('resize'); out.resize = state.m; out.cost += state.n; }
    }
  }
  return { ...out, state };
}
export function rehash(s, m) {
  const t = hashStart(m); s.buckets.flat().forEach(e => { t.buckets[hashCode(e.k) % m].push({ ...e }); t.n++; }); return t;
}
export const bucketsOf = (keys, m) => { const out = Array.from({ length: m }, () => []); keys.forEach(k => { const b = out[hashCode(k) % m]; if (!b.includes(k)) b.push(k); }); return out; };

// ---------- Stack and queue (a queue on a Python list pays for pop(0)) ----------
export function queueOps(ops) {
  const q = [], out = [];
  for (const [op, x] of ops) { if (op === 'push') q.push(x); else out.push(q.length ? q.shift() : null); }
  return out;
}

// ---------- Rooted trees: children lists, root 0 ----------
export function treeHeight(children, v = 0) { return children[v].length ? 1 + Math.max(...children[v].map(c => treeHeight(children, c))) : 0; }
// Binary tree as {id: [left, right]} with null for a missing child.
export function traverse(tree, root, order) {
  const out = [];
  if (order === 'level') { const q = [root]; while (q.length) { const v = q.shift(); out.push(v); tree[v].forEach(c => c != null && q.push(c)); } return out; }
  const go = v => { if (v == null) return; const [l, r] = tree[v]; if (order === 'pre') out.push(v); go(l); if (order === 'in') out.push(v); go(r); if (order === 'post') out.push(v); };
  go(root); return out;
}
export function treeFacts(tree, root) {
  const parent = {}, depth = { [root]: 0 }, order = traverse(tree, root, 'level');
  order.forEach(v => tree[v].forEach(c => { if (c != null) { parent[c] = v; depth[c] = depth[v] + 1; } }));
  const height = v => { const kids = tree[v].filter(c => c != null); return kids.length ? 1 + Math.max(...kids.map(height)) : 0; };
  return { parent, depth, height, order };
}

// ---------- Graphs: adjacency list and matrix of the same edge set ----------
export function adjacency(n, edges, directed = false) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach(([u, v]) => { if (!adj[u].includes(v)) adj[u].push(v); if (!directed && !adj[v].includes(u)) adj[v].push(u); });
  return adj.map(a => a.sort((p, q) => p - q));
}
export const matrixOf = (n, edges, directed = false) => { const m = Array.from({ length: n }, () => Array(n).fill(0)); edges.forEach(([u, v]) => { m[u][v] = 1; if (!directed) m[v][u] = 1; }); return m; };

// ---------- Binary min-heap: snapshots after every swap, so the sandbox can animate them ----------
export function heapPush(h, x) {
  const a = [...h, x], states = [[...a]]; let i = a.length - 1, swaps = 0;
  while (i > 0 && a[(i - 1) >> 1] > a[i]) { const p = (i - 1) >> 1; [a[i], a[p]] = [a[p], a[i]]; i = p; swaps++; states.push([...a]); }
  return { heap: a, states, swaps };
}
// Classic sift-down: swap with the smaller child (the left one on a tie) while that child is smaller.
export function heapPop(h) {
  if (!h.length) return { min: null, heap: [], states: [[]], swaps: 0 };
  const a = [...h], min = a[0], last = a.pop(), states = [];
  if (!a.length) return { min, heap: a, states: [[]], swaps: 0 };
  a[0] = last; states.push([...a]); let i = 0, swaps = 0;
  for (;;) {
    const l = 2 * i + 1, r = l + 1; let c = l;
    if (l >= a.length) break; if (r < a.length && a[r] < a[l]) c = r;
    if (a[c] >= a[i]) break; [a[i], a[c]] = [a[c], a[i]]; i = c; swaps++; states.push([...a]);
  }
  return { min, heap: a, states, swaps };
}
