// Animated SVG scenes for traces and the free widgets of lessons.
// A scene is created once per run, scene(host, run), and receives every shown frame via update(frame):
// elements are keyed by identity, so a step between two frames is a motion, not a redraw.
import { t } from '../../core/i18n.js';
import { tween, lerp } from '../../core/anim.js';
import { L, el, button } from './ui.js';

const NS = 'http://www.w3.org/2000/svg';
const still = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const ms = d => still() ? 0 : d;
const PALETTE = ['#58c4dd', '#83c167', '#f4d35e', '#ff9f5a', '#b69df8', '#fc6255', '#5cd0b3', '#e88bd0', '#c9d1dc'];
function svg(w, h, cls, label) {
  const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', `0 0 ${w} ${h}`); s.classList.add('scene', cls);
  s.setAttribute('role', 'img'); s.setAttribute('aria-label', t(label)); return s;
}
function add(parent, tag, attrs = {}, text) {
  const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text; parent.append(n); return n;
}
const at = (g, x, y, s = 1) => g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`);

// ---------- Towers of Hanoi: the lifted disk flies in an arc ----------
export function hanoiScene(host, run) {
  const n = run.frames[0]?.pegs.flat().length || 0, PX = [95, 270, 445], BASE = 190, H = 20, s = svg(540, 210, 'hanoi-scene', L('Ханойские башни: три стержня и диски', 'Towers of Hanoi: three pegs and disks'));
  PX.forEach((x, p) => { add(s, 'rect', { x: x - 3, y: 60, width: 6, height: BASE - 60, rx: 3, class: 'peg' }); add(s, 'text', { x, y: 206, class: 'peg-label', 'text-anchor': 'middle' }, 'ABC'[p]); });
  add(s, 'rect', { x: 10, y: BASE, width: 520, height: 5, rx: 2, class: 'peg' });
  const disks = {}, pos = {};
  for (let k = 1; k <= n; k++) {
    const g = add(s, 'g', { class: 'disk' }), w = 36 + k * 26;
    add(g, 'rect', { x: -w / 2, y: -H + 2, width: w, height: H - 3, rx: 7, fill: PALETTE[(k - 1) % PALETTE.length] });
    add(g, 'text', { y: -5, 'text-anchor': 'middle' }, k); disks[k] = g;
  }
  host.append(s); let stop = () => {};
  const target = frame => { const out = {}; frame.pegs.forEach((peg, p) => peg.forEach((k, j) => { out[k] = [PX[p], BASE - j * H]; })); return out; };
  return {
    update(frame) {
      stop(); const to = target(frame), from = { ...to, ...pos }, lift = frame.lift;
      Object.values(disks).forEach(g => g.classList.remove('bad')); if (frame.bad) disks[lift].classList.add('bad');
      stop = tween(ms(lift ? 650 : 250), k => {
        for (const d in disks) {
          const [x0, y0] = from[d], [x1, y1] = to[d]; let x = lerp(x0, x1, k), y = lerp(y0, y1, k);
          if (+d === lift && x0 !== x1) { const TOP = 45; if (k < 0.3) { x = x0; y = lerp(y0, TOP, k / 0.3); } else if (k < 0.7) { x = lerp(x0, x1, (k - 0.3) / 0.4); y = TOP; } else { x = x1; y = lerp(TOP, y1, (k - 0.7) / 0.3); } }
          at(disks[d], x, y); pos[d] = [x, y];
        }
      });
      Object.assign(pos, to);
    },
  };
}

// ---------- Trees (BST and heap): nodes keep identity, grow out of their parent and slide ----------
export function treeScene(host, run) {
  const depth = Math.max(1, ...run.frames.flatMap(f => (f.tree || []).map(n => n.d))), LV = Math.min(62, 300 / depth);
  const W = 540, HH = 66 + depth * LV, s = svg(W, HH, 'tree-scene', L('Дерево: узлы и связи', 'Tree: nodes and links'));
  const edges = add(s, 'g'), nodes = add(s, 'g'), items = {}, pos = {};
  const P = n => [30 + n.x * (W - 60), 28 + n.d * LV];
  host.append(s); let stop = () => {};
  return {
    update(frame) {
      stop(); const tree = frame.tree || [], hot = new Set(frame.hot || []), byId = Object.fromEntries(tree.map(n => [n.id, n]));
      for (const id in items) if (!byId[id]) { items[id].g.remove(); items[id].line.remove(); delete items[id]; delete pos[id]; }
      const from = {}, to = {};
      tree.forEach(n => {
        if (!items[n.id]) {
          const line = add(edges, 'line', { class: 'tree-edge' }), g = add(nodes, 'g', { class: 'tree-node' });
          add(g, 'circle', { r: 18 }); add(g, 'text', { y: 5, 'text-anchor': 'middle' }, n.key);
          if (n.i != null) items[n.id] = { g, line, idx: add(g, 'text', { y: 33, 'text-anchor': 'middle', class: 'tree-index' }) }; else items[n.id] = { g, line };
          from[n.id] = pos[n.parent] ? [...pos[n.parent], 0.2] : [...P(n), 0.2];
        } else from[n.id] = [...pos[n.id], 1];
        to[n.id] = P(n); const it = items[n.id];
        it.g.classList.toggle('hot', hot.has(n.id)); it.g.classList.toggle('fresh', frame.fresh === n.id); it.g.classList.toggle('bad', !!frame.bad && n.d === 0);
        it.line.classList.toggle('hot', hot.has(n.id) && hot.has(n.parent)); it.line.style.display = n.parent == null ? 'none' : '';
        if (it.idx) it.idx.textContent = `[${n.i}]`;
      });
      stop = tween(ms(450), k => {
        tree.forEach(n => { const [x0, y0, s0] = from[n.id], [x1, y1] = to[n.id]; pos[n.id] = [lerp(x0, x1, k), lerp(y0, y1, k)]; at(items[n.id].g, ...pos[n.id], lerp(s0, 1, k)); });
        tree.forEach(n => { const p = pos[n.parent]; if (p) { const [x, y] = pos[n.id], l = items[n.id].line; l.setAttribute('x1', p[0]); l.setAttribute('y1', p[1]); l.setAttribute('x2', x); l.setAttribute('y2', y); } });
      });
    },
  };
}

// ---------- Weighted graph (Dijkstra): a pulse runs along the edge being relaxed ----------
export function weightedScene(host, run, { edges, pos }) {
  const s = svg(540, 230, 'weighted-scene', L('Взвешенный граф: вершины, веса рёбер и расстояния', 'Weighted graph: vertices, edge weights and distances')), lines = {}, nodes = [];
  const key = (u, v) => u < v ? `${u}-${v}` : `${v}-${u}`;
  edges.forEach(([u, v, w]) => {
    const [x1, y1] = pos[u], [x2, y2] = pos[v]; lines[key(u, v)] = add(s, 'line', { x1, y1, x2, y2, class: 'w-edge' });
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; add(s, 'circle', { cx: mx, cy: my, r: 10, class: 'w-weight-bg' }); add(s, 'text', { x: mx, y: my + 4, 'text-anchor': 'middle', class: 'w-weight' }, w);
  });
  const pulse = add(s, 'circle', { r: 7, class: 'w-pulse' });
  pos.forEach(([x, y], v) => { const g = add(s, 'g', { class: 'w-node' }); at(g, x, y); add(g, 'circle', { r: 21 }); add(g, 'text', { y: -2, 'text-anchor': 'middle' }, String.fromCharCode(65 + v)); nodes.push({ g, d: add(g, 'text', { y: 13, 'text-anchor': 'middle', class: 'w-dist' }) }); });
  host.append(s); let stop = () => {};
  return {
    update(frame) {
      stop(); const done = new Set(frame.done);
      Object.values(lines).forEach(l => l.setAttribute('class', 'w-edge'));
      frame.parent.forEach((p, u) => { if (p >= 0) lines[key(p, u)].classList.add('tree'); });
      nodes.forEach(({ g, d }, v) => {
        g.setAttribute('class', `w-node ${frame.marks[0] === v ? 'current' : done.has(v) ? 'settled' : frame.dist[v] < Infinity ? 'open' : ''}`);
        d.textContent = frame.dist[v] === Infinity ? '∞' : frame.dist[v];
      });
      pulse.style.display = 'none';
      if (frame.edge) {
        const [v, u] = frame.edge, [x0, y0] = pos[v], [x1, y1] = pos[u]; lines[key(v, u)].classList.add(frame.improved ? 'hot' : 'tried');
        pulse.style.display = ''; pulse.setAttribute('class', `w-pulse${frame.improved ? '' : ' tried'}`);
        stop = tween(ms(550), k => { pulse.setAttribute('cx', lerp(x0, x1, k)); pulse.setAttribute('cy', lerp(y0, y1, k)); }, () => { if (frame.improved) nodes[u].g.classList.add('pop'); });
      }
    },
  };
}

// ---------- Board (N queens): attacked squares come from the sets, so a forgotten undo shows as ghosts ----------
export function boardScene(host, run) {
  const n = run.frames[0].n, C = 240 / n, s = svg(250, 250, 'board-scene', L('Доска: ферзи и клетки под боем', 'Board: queens and attacked squares')), cells = [], queens = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) cells.push(add(s, 'rect', { x: 5 + c * C, y: 5 + r * C, width: C, height: C, class: (r + c) % 2 ? 'sq dark' : 'sq' }));
  const mark = add(s, 'rect', { width: C - 4, height: C - 4, rx: 4, class: 'try' });
  for (let r = 0; r < n; r++) queens.push(add(s, 'text', { 'text-anchor': 'middle', class: 'queen', style: `font-size:${C * 0.62}px` }, '♛'));
  host.append(s); let stop = () => {}, prev = [];
  return {
    update(frame) {
      stop(); const cols = new Set(frame.cols), d1 = new Set(frame.d1), d2 = new Set(frame.d2), q = new Map(frame.queens);
      cells.forEach((cell, i) => { const r = Math.floor(i / n), c = i % n; cell.classList.toggle('attacked', cols.has(c) || d1.has(r - c) || d2.has(r + c)); cell.classList.toggle('ghost', (cols.has(c) || d1.has(r - c) || d2.has(r + c)) && ![...q].some(([qr, qc]) => qc === c || qr - qc === r - c || qr + qc === r + c)); });
      if (frame.trying) { const [r, c, ok] = frame.trying; mark.style.display = ''; mark.setAttribute('x', 7 + c * C); mark.setAttribute('y', 7 + r * C); mark.setAttribute('class', `try${ok ? '' : ' no'}${frame.undo ? ' undo' : ''}`); } else mark.style.display = 'none';
      s.classList.toggle('solved', !!frame.solved);
      const fresh = queens.map((_, r) => q.has(r) && prev[r] !== q.get(r));
      queens.forEach((g, r) => { g.style.display = q.has(r) ? '' : 'none'; g.style.opacity = 1; g.removeAttribute('transform'); if (q.has(r)) { g.setAttribute('x', 5 + (q.get(r) + 0.5) * C); g.setAttribute('y', 5 + (r + 0.78) * C); } });
      stop = tween(ms(350), k => queens.forEach((g, r) => { if (fresh[r]) { g.style.opacity = k; g.setAttribute('transform', `translate(0 ${(-(1 - k) * C * 0.6).toFixed(1)})`); } }));
      prev = queens.map((_, r) => q.get(r));
    },
  };
}

// ---------- Widget: why the double loop is n² — the triangle of pairs against one row ----------
export function growthWidget(host) {
  const root = el('section', 'pattern-widget growth'), range = el('input'), label = el('strong', 'growth-n'), stats = el('div', 'growth-stats');
  range.type = 'range'; range.min = 2; range.max = 40; range.value = 8; range.setAttribute('aria-label', 'n');
  const pic = svg(300, 340, 'growth-grid', L('Квадрат n × n: закрашены проверяемые пары и одна строка прохода с множеством', 'An n × n square: checked pairs are filled, plus the single row of the set pass'));
  const head = el('div', 'growth-head'); head.append(label, range, button(L('▶ Вырастить n до 40', '▶ Grow n to 40'), () => { const a = +range.value; stop(); stop = tween(ms(3200), k => { const v = Math.round(lerp(a >= 40 ? 2 : a, 40, k)); if (v !== +range.value) { range.value = v; draw(); } }); }));
  const legend = el('p', 'algorithm-muted', L('Голубой треугольник — пары i < j, которые сравнивает двойной цикл. Оранжевая строка — один проход с множеством. Двигайте n и смотрите, что растёт быстрее.', 'The blue triangle is the pairs i < j the double loop compares. The orange row is one pass with a set. Move n and watch which grows faster.'));
  const table = el('table', 'growth-table');
  table.innerHTML = `<tr><th>n</th><th>${t(L('пары n(n−1)/2', 'pairs n(n−1)/2'))}</th><th>${t(L('один проход', 'one pass'))}</th></tr>
    <tr><td>10³</td><td>5·10⁵ · 5 ${t(L('мс', 'ms'))}</td><td>10 ${t(L('мкс', 'μs'))}</td></tr>
    <tr><td>10⁶</td><td>5·10¹¹ · ≈ 1,4 ${t(L('ч', 'h'))}</td><td>10 ${t(L('мс', 'ms'))}</td></tr>
    <tr><td>10⁹</td><td>5·10¹⁷ · ≈ 160 ${t(L('лет', 'years'))}</td><td>10 ${t(L('с', 's'))}</td></tr>`;
  const caption = el('p', 'algorithm-muted', L('Время — при 10⁸ простых операций в секунду.', 'Times assume 10⁸ simple operations per second.'));
  const body = el('div', 'growth-body'), side = el('div'); side.append(stats, table, caption); body.append(pic, side);
  root.append(el('h3', '', L('Почему удвоение n учетверяет работу', 'Why doubling n quadruples the work')), head, body, legend); host.append(root);
  let stop = () => {};
  function draw() {
    const n = +range.value, c = 280 / n; pic.replaceChildren();
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) add(pic, 'rect', { x: 10 + j * c, y: 10 + i * c, width: c - 0.6, height: c - 0.6, class: j > i ? 'pair' : j === i ? 'self' : 'none' });
    for (let j = 0; j < n; j++) add(pic, 'rect', { x: 10 + j * c, y: 305, width: c - 0.6, height: Math.min(c, 22), class: 'pass' });
    label.textContent = `n = ${n}`;
    stats.innerHTML = `<p><span class="pair-dot"></span>${t(L('Двойной цикл', 'Double loop'))}: <b>${n * (n - 1) / 2}</b></p><p><span class="pass-dot"></span>${t(L('С множеством', 'With a set'))}: <b>${n}</b></p><p>${t(L('Во сколько раз больше', 'Times more'))}: <b>${((n - 1) / 2).toFixed(1)}</b> = (n − 1)/2</p>`;
  }
  range.addEventListener('input', () => { stop(); draw(); }); draw();
  return { dispose() { stop(); root.remove(); } };
}

// ---------- Widget: the call tree of naive recursion, and what memoisation cuts off ----------
export function callTreeWidget(host) {
  const root = el('section', 'pattern-widget calltree'), range = el('input'), memo = el('input'), stats = el('p', 'calltree-stats');
  range.type = 'range'; range.min = 2; range.max = 8; range.value = 6; range.setAttribute('aria-label', 'n'); memo.type = 'checkbox';
  const nLabel = el('strong'), memoLabel = el('label', 'calltree-memo'); memoLabel.append(memo, el('span', '', L('с запоминанием (таблица)', 'with memoisation (a table)')));
  const head = el('div', 'growth-head'), pic = el('div', 'calltree-pic'); head.append(nLabel, range, memoLabel, button(L('▶ Проиграть вызовы', '▶ Replay the calls'), () => draw(true)));
  root.append(el('h3', '', L('Дерево вызовов ways(n) = ways(n − 1) + ways(n − 2)', 'Call tree of ways(n) = ways(n − 1) + ways(n − 2)')), head, pic, stats,
    el('p', 'algorithm-muted', L('Один цвет — один аргумент. Без запоминания одинаковые поддеревья считаются заново; с ним повторный вызов (пунктир) берёт готовый ответ.', 'One colour, one argument. Without memoisation identical subtrees are recomputed; with it a repeated call (dashed) takes the stored answer.')));
  host.append(root); let stop = () => {};
  function build(n, useMemo) {
    const nodes = [], seen = new Set(); let leaf = 0;
    const go = (k, d, parent) => {
      const node = { k, d, parent, hit: useMemo && seen.has(k) }; nodes.push(node);
      if (node.hit || k < 2) node.x = leaf++; else { const a = go(k - 1, d + 1, node), b = go(k - 2, d + 1, node); node.x = (a.x + b.x) / 2; }
      seen.add(k); return node;
    };
    go(n, 0, null); return { nodes, leaves: leaf };
  }
  function draw(play = false) {
    stop(); const n = +range.value, { nodes, leaves } = build(n, memo.checked), depth = Math.max(...nodes.map(v => v.d)), W = 600, H = 40 + depth * 46;
    const s = svg(W, H, 'calltree-scene', L('Дерево рекурсивных вызовов', 'Recursive call tree')), sx = x => 20 + (leaves < 2 ? 0.5 : x / (leaves - 1)) * (W - 40), sy = d => 20 + d * 46;
    const parts = nodes.map(v => {
      const line = v.parent ? add(s, 'line', { x1: sx(v.parent.x), y1: sy(v.parent.d), x2: sx(v.x), y2: sy(v.d), class: 'ct-edge' }) : null;
      return { line, v };
    });
    parts.forEach(p => { const g = add(s, 'g', { class: `ct-node${p.v.hit ? ' hit' : ''}` }); at(g, sx(p.v.x), sy(p.v.d)); add(g, 'circle', { r: leaves > 20 ? 9 : 12, style: `--c:${PALETTE[p.v.k % PALETTE.length]}` }); add(g, 'text', { y: 4, 'text-anchor': 'middle' }, p.v.k); p.g = g; });
    pic.replaceChildren(s); nLabel.textContent = `n = ${n}`;
    const hits = nodes.filter(v => v.hit).length;
    stats.innerHTML = `${t(L('Вызовов', 'Calls'))}: <b>${nodes.length}</b>${memo.checked ? ` · ${t(L('из таблицы', 'from the table'))}: <b>${hits}</b>` : ''} · ${t(L('клеток в таблице', 'table cells'))}: <b>${n + 1}</b>`;
    if (play) { const total = ms(Math.min(5000, nodes.length * 110)); parts.forEach(p => { p.g.style.opacity = 0; if (p.line) p.line.style.opacity = 0; }); stop = tween(total, k => { const shown = k * nodes.length; parts.forEach((p, i) => { const o = Math.max(0, Math.min(1, shown - i)); p.g.style.opacity = o; if (p.line) p.line.style.opacity = o; }); }, null, x => x); }
  }
  range.addEventListener('input', () => draw()); memo.addEventListener('change', () => draw(true)); draw();
  return { dispose() { stop(); root.remove(); } };
}
