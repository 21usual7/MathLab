// Interactive sandboxes of the structure lessons. Each one: sandbox(host, onEvent) → { apply(op, arg), dispose }.
// Buttons carry data-op so a guided script (and the browser test) can drive exactly what a student clicks.
// Motion is CSS transitions on absolutely placed items; reduced motion makes waits zero and transitions none.
import { t } from '../../core/i18n.js';
import { L, el, button } from './ui.js';
import { arrayStart, arrayOp, hashStart, hashOp, hashCode, traverse, treeFacts, adjacency, matrixOf, heapPush, heapPop } from './structure-models.js';
import { treeScene } from './pattern-scenes.js';

const still = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, still() ? 0 : ms));
const place = (node, x, y) => { node.style.transform = `translate(${x}px, ${y}px)`; };
const NS = 'http://www.w3.org/2000/svg';
function svgAdd(parent, tag, attrs = {}, text) { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (text != null) n.textContent = text; parent.append(n); return n; }

// Common frame: title, stage, controls, a note on the last operation, a cost meter and a short log.
function shell(host, title, onEvent) {
  const root = el('section', 'sandbox'), stage = el('div', 'sb-stage'), controls = el('div', 'sb-controls'), note = el('p', 'sb-note'), meter = el('div', 'sb-meter'), log = el('ol', 'sb-log');
  note.setAttribute('role', 'status'); root.append(el('h3', '', title), controls, stage, note, meter, log); host.append(root);
  let total = 0, count = 0, busy = false;
  const api = {
    root, stage, controls,
    width: () => Math.max(280, stage.clientWidth || 600),
    op(label, op, fn, extra) { const b = button(label, () => api.run(op, extra?.())); b.dataset.op = op; controls.append(b); return b; },
    field(label, name, value, type = 'text') { const wrap = el('label', 'sb-field', label), input = el('input'); input.dataset.arg = name; input.value = value; input.type = type; input.autocomplete = 'off'; wrap.append(input); controls.append(wrap); return input; },
    async run(op, arg) {
      if (busy) return; busy = true; root.setAttribute('aria-busy', 'true');
      try {
        const r = await api.handle(op, arg);
        if (r) {
          if (r.error) { note.textContent = t(r.error); note.dataset.error = 'true'; }
          else { note.textContent = r.note ? t(r.note) : ''; delete note.dataset.error; }
          if (r.cost != null && !r.error) { total += r.cost; count++; }
          meter.innerHTML = `${t(L('Последняя операция', 'Last operation'))}: <b>${r.error ? '—' : r.cost ?? 0}</b> ${t(L('шаг.', 'steps'))} · ${t(L('всего', 'total'))} <b>${total}</b> ${t(L('за', 'over'))} ${count} ${t(L('опер.', 'ops'))}${r.extra ? ` · ${r.extra}` : ''}`;
          const li = el('li'); li.textContent = `${r.label || op}${r.error ? ' ✗' : ` · ${r.cost ?? 0}`}`; log.prepend(li); while (log.children.length > 6) log.lastChild.remove();
          (r.events || []).forEach(e => onEvent?.(e));
        }
      } finally { busy = false; root.removeAttribute('aria-busy'); }
    },
    reset() { total = 0; count = 0; meter.textContent = ''; note.textContent = ''; log.replaceChildren(); },
    handle: async () => null,
  };
  return api;
}

// ---------- Array ----------
export function arraySandbox(host, onEvent) {
  const sb = shell(host, L('Песочница: динамический массив', 'Sandbox: a dynamic array'), onEvent);
  let s = arrayStart(), appends = 0, appendCost = 0;
  const slots = el('div', 'sb-row'), vals = {}, MAX = 32; sb.stage.classList.add('sb-array'); sb.stage.append(slots);
  const idx = sb.field(L('индекс i', 'index i'), 'i', 0, 'number');
  sb.op(L('прочитать a[i]', 'read a[i]'), 'read', null, () => +idx.value);
  sb.op('append(x)', 'append'); sb.op('insert(0, x)', 'insert0'); sb.op('pop()', 'pop'); sb.op('pop(0)', 'pop0');
  sb.op(L('↺ сброс', '↺ reset'), 'reset');
  const cell = () => Math.min(54, Math.floor((sb.width() - 16) / Math.min(s.cap, 16)) - 4);
  const pos = i => { const c = cell() + 4, per = Math.min(s.cap, 16); return [8 + (i % per) * c, 22 + Math.floor(i / per) * (c + 26)]; };
  function drawSlots(cap = s.cap) {
    slots.replaceChildren(); const c = cell();
    for (let i = 0; i < cap; i++) { const d = el('div', 'sb-slot'); d.style.width = d.style.height = `${c}px`; const [x, y] = pos(i); place(d, x, y); d.append(el('small', '', String(i))); slots.append(d); }
    sb.stage.style.height = `${pos(cap - 1)[1] + c + 34}px`;
    const addr = el('div', 'sb-addr'); addr.textContent = t(L('ячейки идут подряд: адрес a[i] = начало + i · 8 байт', 'cells are contiguous: address of a[i] = start + i · 8 bytes')); slots.append(addr);
  }
  function value(v, i, from) { let d = vals[v]; const c = cell(); if (!d) { d = el('div', 'sb-val', String(v)); vals[v] = d; sb.stage.append(d); if (from) { place(d, ...from); d.style.opacity = 0; d.getBoundingClientRect(); } } d.style.width = d.style.height = `${c}px`; d.style.lineHeight = `${c}px`; d.style.opacity = 1; place(d, ...pos(i)); }
  const layout = () => s.items.forEach((v, i) => value(v, i));
  drawSlots();
  sb.handle = async (op, arg) => {
    if (op === 'reset') { s = arrayStart(); appends = appendCost = 0; Object.values(vals).forEach(d => d.remove()); for (const k in vals) delete vals[k]; drawSlots(); sb.reset(); return null; }
    if ((op === 'append' || op === 'insert0') && s.items.length >= MAX) return { error: L(`Песочница ограничена ${MAX} элементами — сделайте pop или сброс.`, `The sandbox holds ${MAX} elements — pop or reset.`) };
    const r = arrayOp(s, op, arg), events = [...r.events];
    if (r.error) return { ...r, label: op };
    if (r.read != null) { const d = vals[s.items[r.read]]; d.classList.add('hot'); await wait(700); d.classList.remove('hot'); }
    if (r.resize) {
      const old = s.items; slots.classList.add('fade'); await wait(250);
      s = { ...s, cap: r.resize.to }; slots.classList.remove('fade'); drawSlots(); slots.classList.add('fresh');
      for (let i = 0; i < old.length; i++) { vals[old[i]].classList.add('copy'); place(vals[old[i]], ...pos(i)); await wait(70); }
      await wait(300); old.forEach(v => vals[v].classList.remove('copy')); slots.classList.remove('fresh');
    }
    if (op === 'pop' || op === 'pop0') { const v = s.items[r.removed], d = vals[v]; d.style.opacity = 0; d.style.transform += ' translateY(-30px)'; delete vals[v]; setTimeout(() => d.remove(), 400); }
    s = r.state;
    if (op === 'insert0') { s.items.slice(1).forEach((v, i) => value(v, i + 1)); await wait(r.moves.length ? 450 : 0); value(s.items[0], 0, [pos(0)[0], -40]); }
    else if (op === 'append') { const i = s.items.length - 1; value(s.items[i], i, [pos(i)[0], -40]); }
    else layout();
    await wait(380);
    if (op === 'append') { appends++; appendCost += r.cost; if (appends >= 12 && appendCost / appends < 3) events.push('amortized'); }
    return { ...r, events, label: op === 'read' ? `a[${arg}]` : op, extra: appends ? `append ${t(L('в среднем', 'on average'))} <b>${(appendCost / appends).toFixed(2)}</b>` : '' };
  };
  return { apply: (op, arg) => sb.run(op, arg), dispose: () => sb.root.remove() };
}

// ---------- Hash table ----------
export function hashSandbox(host, onEvent) {
  const sb = shell(host, L('Песочница: хеш-таблица с цепочками', 'Sandbox: a hash table with chaining'), onEvent);
  let s = hashStart(4); const pills = {}; sb.stage.classList.add('sb-hash');
  const calc = el('p', 'sb-calc'); sb.root.insertBefore(calc, sb.stage);
  const key = sb.field(L('ключ', 'key'), 'key', 'кот'), val = sb.field(L('значение', 'value'), 'value', '1', 'number');
  sb.op('put(key, value)', 'put', null, () => [key.value.trim(), +val.value]); sb.op('get(key)', 'get', null, () => [key.value.trim()]); sb.op('delete(key)', 'delete', null, () => [key.value.trim()]);
  sb.op(L('↺ сброс', '↺ reset'), 'reset');
  const chips = el('div', 'sb-chips'); ['кот', 'ток', 'кит', 'мир', 'рим', 'дом', 'мод', 'лес', 'сон', 'нос'].forEach(k => { const c = button(k, () => { key.value = k; }); c.classList.add('chip-btn'); chips.append(c); }); sb.controls.append(chips);
  const pw = () => Math.min(92, Math.floor((sb.width() - 58) / 4) - 6), row = 46;
  const pos = (b, i) => [52 + i * (pw() + 8), 8 + b * row];
  function drawRows() {
    sb.stage.querySelectorAll('.sb-bucket').forEach(n => n.remove());
    for (let b = 0; b < s.m; b++) { const d = el('div', 'sb-bucket', String(b)); place(d, 4, 8 + b * row); sb.stage.append(d); }
    sb.stage.style.height = `${s.m * row + 16}px`;
  }
  function layout(fromTop) {
    const live = new Set();
    s.buckets.forEach((chain, b) => chain.forEach((e, i) => {
      live.add(e.k); let p = pills[e.k];
      if (!p) { p = pills[e.k] = el('div', 'sb-pill'); sb.stage.append(p); if (fromTop) { place(p, sb.width() / 2, -40); p.style.opacity = 0; p.getBoundingClientRect(); } }
      p.textContent = `${e.k}: ${e.v}`; p.style.width = `${pw()}px`; p.style.opacity = 1; place(p, ...pos(b, i)); p.classList.toggle('chained', i > 0);
    }));
    for (const k in pills) if (!live.has(k)) { const p = pills[k]; p.style.opacity = 0; setTimeout(() => p.remove(), 400); delete pills[k]; }
  }
  drawRows();
  sb.handle = async (op, args) => {
    if (op === 'reset') { s = hashStart(4); Object.values(pills).forEach(p => p.remove()); for (const k in pills) delete pills[k]; drawRows(); calc.textContent = ''; sb.reset(); return null; }
    const [k, v] = args; if (!k) return { error: L('Введите ключ.', 'Enter a key.') };
    const r = hashOp(s, op, k, v), codes = [...k].map(c => c.codePointAt(0));
    calc.innerHTML = `h(«${k}») = ${codes.join(' + ')} = <b>${r.code}</b> · ${r.code} mod ${s.m} = <b>${r.bucket}</b>`;
    const bucketEl = sb.stage.querySelectorAll('.sb-bucket')[r.bucket]; bucketEl.classList.add('hot');
    for (const e of s.buckets[r.bucket]) { const p = pills[e.k]; p.classList.add('scan'); await wait(320); p.classList.remove('scan'); if (e.k === k) break; }
    bucketEl.classList.remove('hot');
    const resized = r.resize; s = r.state;
    if (resized) calc.innerHTML += ` → ${t(L('после рехеширования', 'after rehashing'))}: ${r.code} mod ${resized} = <b>${r.code % resized}</b>`;
    drawRows(); layout(op === 'put');
    if (r.value !== undefined && pills[k]) { pills[k].classList.add('found'); setTimeout(() => pills[k]?.classList.remove('found'), 900); }
    await wait(450);
    const note = op === 'get' ? (r.events.includes('hit') ? L(`Нашли за ${r.cost} сравн.: смотрели только корзину ${r.bucket}, а не всю таблицу.`, `Found in ${r.cost} comparisons: only bucket ${r.bucket} was searched, not the whole table.`) : L(`Ключа нет: проверили лишь корзину ${r.bucket} (${r.cost} сравн.) — остальные заведомо не содержат его.`, `No such key: only bucket ${r.bucket} was checked (${r.cost} comparisons) — the others cannot contain it.`))
      : op === 'delete' ? L('Удаление — тот же поиск в одной корзине, затем элемент вынимается из цепочки.', 'Deleting is the same search in one bucket, then the item leaves the chain.')
      : resized ? L(`Элементов стало больше, чем корзин (α > 1): корзин теперь ${resized}, и каждый ключ пересчитал свой номер — mod изменился.`, `There are now more items than buckets (α > 1): there are ${resized} buckets and every key recomputed its index — the modulus changed.`)
      : r.events.includes('collision') ? L(`Коллизия: корзина ${r.bucket} уже занята, ключ встаёт в цепочку за соседями.`, `Collision: bucket ${r.bucket} is taken, so the key joins the chain behind its neighbours.`)
      : r.events.includes('update') ? L('Ключ уже был — значение заменено, новый элемент не появился.', 'The key existed — its value was replaced, no new item appeared.') : L('Корзина была пуста — ключ лёг первым.', 'The bucket was empty — the key went in first.');
    return { ...r, note, label: `${op}(«${k}»)`, extra: `n = ${s.n}, m = ${s.m}, α = n/m = <b>${(s.n / s.m).toFixed(2)}</b>` };
  };
  return { apply: (op, arg) => sb.run(op, arg), dispose: () => sb.root.remove() };
}

// ---------- Stack and queue side by side ----------
export function stackQueueSandbox(host, onEvent) {
  const sb = shell(host, L('Песочница: стек и очередь', 'Sandbox: a stack and a queue'), onEvent);
  const stack = [], queue = [], items = {}; let next = 1, deque = true;
  sb.stage.classList.add('sb-sq');
  const sCol = el('div', 'sb-sq-stack'), qLane = el('div', 'sb-sq-queue'); sCol.append(el('span', 'sb-sq-label', L('стек · вершина сверху', 'stack · top is up'))); qLane.append(el('span', 'sb-sq-label', L('очередь · выход слева ← вход справа', 'queue · out on the left ← in on the right')));
  sb.stage.append(sCol, qLane);
  sb.op('stack.push(x)', 'push'); sb.op('stack.pop()', 'pop'); sb.op('queue.append(x)', 'enqueue'); sb.op('queue.popleft()', 'dequeue');
  const mode = el('label', 'sb-toggle'), box = el('input'); box.type = 'checkbox'; box.checked = false; box.dataset.arg = 'list'; mode.append(box, el('span', '', L('очередь на обычном list (pop(0))', 'queue on a plain list (pop(0))'))); sb.controls.append(mode);
  box.addEventListener('change', () => { deque = !box.checked; onEvent?.('mode'); });
  const H = 34, W = () => Math.min(52, Math.floor((sb.width() - 150) / 8));
  const sPos = i => [16, 230 - (i + 1) * (H + 4)], qPos = i => [140 + i * (W() + 6), 120];
  function draw(list, p, cls) { list.forEach((v, i) => { const d = items[v]; d.className = `sb-val ${cls}`; d.style.width = cls === 'q' ? `${W()}px` : '90px'; d.style.height = `${H}px`; d.style.lineHeight = `${H}px`; place(d, ...p(i)); }); }
  function spawn(v, x, y) { const d = el('div', 'sb-val', String(v)); items[v] = d; place(d, x, y); d.style.opacity = 0; sb.stage.append(d); d.getBoundingClientRect(); d.style.opacity = 1; return d; }
  function drop(v, dx, dy) { const d = items[v]; d.style.opacity = 0; d.style.transform += ` translate(${dx}px, ${dy}px)`; setTimeout(() => d.remove(), 400); delete items[v]; }
  sb.handle = async op => {
    if (op === 'push') { if (stack.length >= 6) return { error: L('Стек песочницы вмещает 6 — сделайте pop.', 'The sandbox stack holds 6 — pop first.') }; const v = next++; spawn(v, 16, -40); stack.push(v); draw(stack, sPos, 's'); await wait(400); return { cost: 1, label: `push(${v})`, note: L('Новый элемент кладётся на вершину — сверху на остальные.', 'A new item goes on top of the others.'), events: ['push'] }; }
    if (op === 'pop') {
      if (!stack.length) return { error: L('IndexError: pop из пустого стека — снимать нечего.', 'IndexError: pop from an empty stack — nothing to take.'), events: ['underflow'] };
      const v = stack.pop(); drop(v, 0, -60); await wait(400);
      return { cost: 1, label: `pop() → ${v}`, note: L(`Вышел ${v} — последний положенный. Last In, First Out.`, `${v} came out — the last one in. Last In, First Out.`), events: stack.length >= 1 ? ['pop', 'lifo'] : ['pop'] };
    }
    if (op === 'enqueue') { if (queue.length >= 8) return { error: L('Очередь песочницы вмещает 8 — сделайте popleft.', 'The sandbox queue holds 8 — popleft first.') }; const v = next++; spawn(v, sb.width(), 120); queue.push(v); draw(queue, qPos, 'q'); await wait(400); return { cost: 1, label: `append(${v})`, note: L('Новый встаёт в конец очереди, справа.', 'A newcomer joins the back of the queue, on the right.'), events: ['enqueue'] }; }
    if (op === 'dequeue') {
      if (!queue.length) return { error: L('IndexError: очередь пуста.', 'IndexError: the queue is empty.'), events: ['underflow'] };
      const v = queue.shift(); drop(v, -60, 0); await wait(deque ? 150 : 250); draw(queue, qPos, 'q'); await wait(400);
      const cost = deque ? 1 : queue.length + 1;
      return { cost, label: `${deque ? 'popleft' : 'pop(0)'} → ${v}`, note: deque ? L(`Вышел ${v} — первый пришедший. First In, First Out. deque снимает с начала за O(1).`, `${v} left — the first to arrive. First In, First Out. A deque removes from the front in O(1).`) : L(`list.pop(0): чтобы не было дыры, ${queue.length} элементов сдвинулись влево — O(n) на каждый выход.`, `list.pop(0): to avoid a hole, ${queue.length} elements shifted left — O(n) per removal.`), events: deque ? ['dequeue', 'fifo'] : ['dequeue', 'fifo', 'list-cost'] };
    }
    return null;
  };
  return { apply: (op, arg) => sb.run(op, arg), dispose: () => sb.root.remove() };
}

// ---------- Binary tree: select nodes, grow it, watch traversals ----------
export function treeSandbox(host, onEvent) {
  const sb = shell(host, L('Песочница: двоичное дерево', 'Sandbox: a binary tree'), onEvent);
  const tree = { A: ['B', 'C'], B: ['D', 'E'], C: [null, 'F'], D: [null, null], E: ['G', null], F: [null, null], G: [null, null] }; let nextId = 7, selected = 'A';
  const info = el('div', 'sb-info'), out = el('p', 'sb-trav'); sb.root.insertBefore(info, sb.stage.nextSibling); sb.root.insertBefore(out, info.nextSibling);
  sb.op(L('прямой обход (pre)', 'pre-order'), 'pre'); sb.op(L('симметричный (in)', 'in-order'), 'in'); sb.op(L('обратный (post)', 'post-order'), 'post'); sb.op(L('по уровням', 'level order'), 'level');
  sb.op(L('+ левый ребёнок', '+ left child'), 'add-left'); sb.op(L('+ правый ребёнок', '+ right child'), 'add-right');
  const svg = document.createElementNS(NS, 'svg'); svg.classList.add('sb-tree'); sb.stage.append(svg);
  function layout() {
    const order = traverse(tree, 'A', 'in'), facts = treeFacts(tree, 'A'), maxD = Math.max(...Object.values(facts.depth));
    const W = 560, H = 50 + maxD * 62; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.replaceChildren();
    const P = v => [30 + (order.indexOf(v) + 0.5) * (W - 60) / order.length, 26 + facts.depth[v] * 62];
    order.forEach(v => tree[v].forEach(c => { if (c != null) { const [x1, y1] = P(v), [x2, y2] = P(c); svgAdd(svg, 'line', { x1, y1, x2, y2, class: 'sb-edge' }); } }));
    order.forEach(v => {
      const [x, y] = P(v), leaf = tree[v].every(c => c == null), g = svgAdd(svg, 'g', { class: `sb-node${v === selected ? ' selected' : ''}${leaf ? ' leaf' : ''}`, transform: `translate(${x} ${y})`, tabindex: 0, role: 'button', 'data-node': v, 'aria-label': v });
      svgAdd(g, 'circle', { r: 18 }); svgAdd(g, 'text', { y: 5, 'text-anchor': 'middle' }, v);
      const pick = () => sb.run('select', v);
      g.addEventListener('click', pick); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
    const f = facts, kids = tree[selected].filter(c => c != null);
    info.innerHTML = `<b>${selected}</b> · ${t(L('родитель', 'parent'))}: ${f.parent[selected] ?? '—'} · ${t(L('дети', 'children'))}: ${kids.join(', ') || '—'} · ${t(L('глубина', 'depth'))}: ${f.depth[selected]} · ${t(L('высота поддерева', 'subtree height'))}: ${f.height(selected)} · ${kids.length ? t(L('внутренний узел', 'internal node')) : t(L('лист', 'leaf'))}<br>${t(L('Высота всего дерева', 'Height of the whole tree'))}: <b>${f.height('A')}</b> · ${t(L('узлов', 'nodes'))}: ${order.length}`;
  }
  layout();
  sb.handle = async (op, arg) => {
    if (op === 'select') {
      if (!tree[arg]) return null; selected = arg; layout(); const leaf = tree[arg].every(c => c == null);
      return { cost: 0, label: arg, note: arg === 'A' ? L('Корень — единственный узел без родителя. С него начинается любой путь вниз.', 'The root is the only node without a parent. Every downward path starts here.') : leaf ? L('Лист — узел без детей. Пути вниз здесь заканчиваются.', 'A leaf has no children. Downward paths end here.') : L('Внутренний узел: у него есть и родитель, и дети. Сам он — корень своего поддерева.', 'An internal node: it has a parent and children. It is the root of its own subtree.'), events: [arg === 'A' ? 'root' : leaf ? 'leaf' : 'inner'] };
    }
    if (op === 'add-left' || op === 'add-right') {
      const side = op === 'add-left' ? 0 : 1; if (tree[selected][side] != null) return { error: L('Это место уже занято — выберите другой узел или сторону.', 'That slot is taken — pick another node or side.') };
      if (nextId >= 15) return { error: L('Песочница ограничена 15 узлами.', 'The sandbox holds 15 nodes.') };
      const h0 = treeFacts(tree, 'A').height('A'), id = String.fromCharCode(65 + nextId++); tree[selected][side] = id; tree[id] = [null, null]; layout();
      const h1 = treeFacts(tree, 'A').height('A');
      return { cost: 1, label: `${selected}.${side ? 'right' : 'left'} = ${id}`, note: h1 > h0 ? L(`Новый лист на самой большой глубине — высота дерева выросла до ${h1}.`, `A new leaf at the deepest level — the tree height grew to ${h1}.`) : L('Новый лист. Высота не изменилась: есть путь не короче.', 'A new leaf. The height is unchanged: a path at least as long exists.'), events: h1 > h0 ? ['grow', 'taller'] : ['grow'] };
    }
    const order = traverse(tree, 'A', op), shown = [];
    for (const v of order) { const n = svg.querySelector(`[data-node="${v}"]`); n.classList.add('visit'); shown.push(v); out.textContent = `${op}: ${shown.join(' → ')}`; await wait(420); }
    await wait(300); svg.querySelectorAll('.visit').forEach(n => n.classList.remove('visit'));
    const why = { pre: L('Узел — потом левое поддерево — потом правое. Так копируют дерево или печатают оглавление.', 'Node, then left subtree, then right. Used to copy a tree or print a table of contents.'), in: L('Левое — узел — правое. В дереве поиска это даёт ключи по возрастанию.', 'Left, node, right. In a search tree this lists keys in increasing order.'), post: L('Сначала оба поддерева, потом узел. Так считают размер папки: сначала содержимое.', 'Both subtrees first, then the node. This is how folder sizes are computed: contents first.'), level: L('Слой за слоем, слева направо — с очередью. Это поиск в ширину на дереве.', 'Layer by layer, left to right — with a queue. This is breadth-first search on a tree.') }[op];
    return { cost: order.length, label: op, note: why, events: [`trav-${op}`] };
  };
  return { apply: (op, arg) => sb.run(op, arg), dispose: () => sb.root.remove() };
}

// ---------- Graph: click two vertices to toggle an edge; list and matrix update together ----------
export function graphSandbox(host, onEvent) {
  const sb = shell(host, L('Песочница: граф', 'Sandbox: a graph'), onEvent);
  const n = 6, names = 'ABCDEF', pos = Array.from({ length: n }, (_, i) => [210 + 150 * Math.cos(-Math.PI / 2 + i * 2 * Math.PI / n), 160 + 125 * Math.sin(-Math.PI / 2 + i * 2 * Math.PI / n)]);
  let edges = [[0, 1], [1, 2], [0, 3]], directed = false, pick = null;
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 420 340'); svg.classList.add('sb-graph');
  const views = el('div', 'sb-graph-views'), list = el('pre', 'algorithm-code sb-adj'), matrix = el('table', 'sb-matrix'); views.append(list, matrix);
  sb.stage.classList.add('sb-graph-stage'); sb.stage.append(svg, views);
  const dir = el('label', 'sb-toggle'), box = el('input'); box.type = 'checkbox'; box.dataset.arg = 'directed'; dir.append(box, el('span', '', L('ориентированный (стрелки)', 'directed (arrows)'))); sb.controls.append(dir);
  sb.controls.append(el('span', 'algorithm-muted', L('Нажмите на одну вершину, затем на другую — ребро появится или исчезнет.', 'Tap one vertex, then another — the edge appears or disappears.')));
  box.addEventListener('change', () => { directed = box.checked; draw(); onEvent?.(directed ? 'directed' : 'undirected'); });
  const key = (u, v) => directed ? `${u}>${v}` : `${Math.min(u, v)}-${Math.max(u, v)}`;
  function draw() {
    svg.replaceChildren(); const defs = svgAdd(svg, 'defs'), m = svgAdd(defs, 'marker', { id: 'sb-arrow', viewBox: '0 0 10 10', refX: 28, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }); svgAdd(m, 'path', { d: 'M0 0L10 5L0 10z', class: 'sb-arrowhead' });
    edges.forEach(([u, v]) => svgAdd(svg, 'line', { x1: pos[u][0], y1: pos[u][1], x2: pos[v][0], y2: pos[v][1], class: 'sb-edge', ...(directed ? { 'marker-end': 'url(#sb-arrow)' } : {}) }));
    const adj = adjacency(n, edges, directed), deg = adj.map(a => a.length);
    pos.forEach(([x, y], v) => {
      const g = svgAdd(svg, 'g', { class: `sb-node${pick === v ? ' selected' : ''}`, transform: `translate(${x} ${y})`, tabindex: 0, role: 'button', 'data-node': v, 'aria-label': names[v] });
      svgAdd(g, 'circle', { r: 20 }); svgAdd(g, 'text', { y: 5, 'text-anchor': 'middle' }, names[v]); svgAdd(g, 'text', { y: 36, 'text-anchor': 'middle', class: 'sb-deg' }, `deg ${deg[v]}`);
      const act = () => sb.run('tap', v); g.addEventListener('click', act); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    });
    list.textContent = adj.map((a, v) => `${names[v]}: [${a.map(u => names[u]).join(', ')}]`).join('\n');
    const mx = matrixOf(n, edges, directed);
    matrix.innerHTML = `<tr><th></th>${[...names].map(c => `<th>${c}</th>`).join('')}</tr>` + mx.map((r, i) => `<tr><th>${names[i]}</th>${r.map(x => `<td class="${x ? 'on' : ''}">${x}</td>`).join('')}</tr>`).join('');
    const sum = deg.reduce((a, b) => a + b, 0);
    sb.root.querySelector('.sb-graph-stats')?.remove();
    const stats = el('p', 'sb-graph-stats'); stats.innerHTML = `V = <b>${n}</b> · E = <b>${edges.length}</b> · ${directed ? t(L('сумма исходящих степеней', 'sum of out-degrees')) : t(L('сумма степеней', 'sum of degrees'))} = <b>${sum}</b>${directed ? '' : ` = 2E`} · ${t(L('память: список', 'memory: list'))} ${n} + ${directed ? edges.length : 2 * edges.length}, ${t(L('матрица', 'matrix'))} ${n * n}`;
    views.after(stats);
  }
  draw();
  sb.handle = async (op, v) => {
    if (op !== 'tap') return null;
    if (pick == null) { pick = v; draw(); return { cost: 0, label: `${names[v]} …`, note: L('Первая вершина выбрана — теперь вторая.', 'First vertex picked — now the second.'), events: [] }; }
    const u = pick; pick = null;
    if (u === v) { draw(); return { cost: 0, label: names[v], note: L('Выбор снят.', 'Selection cleared.'), events: [] }; }
    const k = key(u, v), had = edges.some(([a, b]) => key(a, b) === k);
    edges = had ? edges.filter(([a, b]) => key(a, b) !== k) : [...edges, [u, v]]; draw();
    const deg = adjacency(n, edges, directed).map(a => a.length);
    const events = [had ? 'edge-del' : 'edge-add']; if (deg.some(d => d >= 3)) events.push('deg3'); if (deg.some(d => d === 0)) events.push('isolated');
    return { cost: 1, label: `${had ? '−' : '+'} ${names[u]}${directed ? '→' : '–'}${names[v]}`, note: had ? L('Ребро удалено: исчезли запись в списке и единица в матрице.', 'Edge removed: its list entry and its matrix 1 are gone.') : directed ? L(`Ребро ${names[u]} → ${names[v]}: в список попал только ${names[u]}, в матрице — одна единица в строке ${names[u]}.`, `Edge ${names[u]} → ${names[v]}: only ${names[u]}’s list changed, one 1 in row ${names[u]}.`) : L(`Ребро ${names[u]} – ${names[v]}: каждая из двух вершин записала другую. Поэтому сумма степеней всегда 2E.`, `Edge ${names[u]} – ${names[v]}: each endpoint lists the other. That is why degrees sum to 2E.`), events };
  };
  return { apply: (op, arg) => sb.run(op, arg), dispose: () => sb.root.remove() };
}

// ---------- Heap: tree and array in sync; push and pop play every swap ----------
export function heapSandbox(host, onEvent) {
  const sb = shell(host, L('Песочница: двоичная куча (минимум наверху)', 'Sandbox: a binary heap (minimum on top)'), onEvent);
  let heap = [], ids = [], nextId = 0;
  const pic = el('div'), arr = el('div', 'sb-heap-array'); sb.stage.append(pic, arr);
  const scene = treeScene(pic, { frames: [{ tree: [{ d: 3 }] }] });
  const x = sb.field('x', 'x', 7, 'number');
  sb.op('push(x)', 'push', null, () => +x.value); sb.op(L('push(случайное)', 'push(random)'), 'push-rand'); sb.op('pop_min()', 'pop'); sb.op(L('посмотреть минимум', 'peek'), 'peek');
  const show = (a, idList, hot = []) => {
    scene.update({ tree: a.map((key, i) => { const d = Math.floor(Math.log2(i + 1)), w = 2 ** d; return { id: idList[i], key, d, i, x: (i - w + 1 + 0.5) / w, parent: i ? idList[(i - 1) >> 1] : null }; }), hot: hot.map(i => idList[i]) });
    arr.replaceChildren(...a.map((v, i) => { const c = el('div', `pattern-cell${hot.includes(i) ? ' marked' : ''}`); c.append(el('strong', '', String(v)), el('small', '', String(i))); return c; }));
    if (!a.length) arr.append(el('span', 'algorithm-muted', '∅'));
  };
  show(heap, ids);
  sb.handle = async (op, arg) => {
    if (op === 'peek') { if (!heap.length) return { error: L('Куча пуста.', 'The heap is empty.') }; show(heap, ids, [0]); await wait(500); show(heap, ids); return { cost: 1, label: `peek → ${heap[0]}`, note: L('Минимум всегда в heap[0] — смотреть на него ничего не стоит.', 'The minimum always sits at heap[0] — looking costs nothing.'), events: ['peek'] }; }
    if (op === 'push' || op === 'push-rand') {
      if (heap.length >= 15) return { error: L('Песочница ограничена 15 элементами.', 'The sandbox holds 15 items.') };
      const v = op === 'push' ? (Number.isFinite(arg) ? arg : 0) : Math.floor(Math.random() * 90) + 1, r = heapPush(heap, v);
      let cur = [...ids, nextId++], a = r.states[0], i = a.length - 1;
      show(a, cur, [i]); await wait(550);
      for (const st of r.states.slice(1)) { const p = (i - 1) >> 1; [cur[i], cur[p]] = [cur[p], cur[i]]; show(st, cur, [p, i]); i = p; await wait(550); }
      heap = r.heap; ids = cur; show(heap, ids);
      return { cost: r.swaps + 1, label: `push(${v})`, note: r.swaps ? L(`${v} всплыл на ${r.swaps} уровн. вверх: пока родитель больше — меняемся местами.`, `${v} rose ${r.swaps} level(s): while the parent is larger, swap.`) : L(`${v} остался внизу: родитель не больше — свойство кучи уже выполнено.`, `${v} stayed at the bottom: its parent is not larger — the heap property holds.`), events: r.swaps ? ['push', 'swap-up'] : ['push'] };
    }
    if (op === 'pop') {
      if (!heap.length) return { error: L('IndexError: куча пуста.', 'IndexError: the heap is empty.'), events: ['underflow'] };
      const r = heapPop(heap); let cur = [...ids];
      show(heap, cur, [0]); await wait(450);
      if (!r.heap.length) { heap = []; ids = []; show(heap, ids); return { cost: 1, label: `pop → ${r.min}`, note: L('Это был последний элемент.', 'That was the last item.'), events: ['pop'] }; }
      cur = [cur.at(-1), ...cur.slice(1, -1)]; let i = 0; show(r.states[0], cur, [0]); await wait(550);
      // A swap changes exactly two cells: the sinking item at i and the child j it traded with.
      let prev = r.states[0];
      for (const st of r.states.slice(1)) { const j = st.findIndex((v, k) => k !== i && v !== prev[k]); [cur[i], cur[j]] = [cur[j], cur[i]]; show(st, cur, [i, j]); i = j; prev = st; await wait(550); }
      heap = r.heap; ids = cur; show(heap, ids);
      return { cost: r.swaps + 1, label: `pop_min → ${r.min}`, note: L(`Отдали минимум ${r.min}. Последний элемент встал в корень и утонул на ${r.swaps} уровн., меняясь с меньшим ребёнком.`, `Returned the minimum ${r.min}. The last item took the root and sank ${r.swaps} level(s), swapping with the smaller child.`), events: r.swaps ? ['pop', 'swap-down'] : ['pop'] };
    }
    return null;
  };
  return { apply: (op, arg) => sb.run(op, arg), dispose: () => sb.root.remove() };
}
