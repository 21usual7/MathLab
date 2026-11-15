// Draws scene objects in both views, so one idea is seen from several sides:
// a function y = f(x) also lies on the floor of the 3D view, a surface z = f(x, y)
// also appears in 2D as its level curves (a map seen from above).

const T_RANGE = [0, 2 * Math.PI];

// Evaluators with a reused scope object (no allocation per point)
const fx = (item, scope) => x => { scope.x = x; return item.fn(scope); };
const fxy = (item, scope) => (x, y) => { scope.x = x; scope.y = y; return item.fn(scope); };
const ft = (fn, scope) => t => { scope.t = t; return fn(scope); };

const faint = c => c + '73'; // 45 % opacity for dim objects

// A matrix item: its entries by rows, and the vectors of the scene it moves (their images are drawn too)
const entries = (item, scope) => item.fns.map(f => f(scope));
const apply = (m, v) => (m.length === 4 ? [m[0] * v[0] + m[1] * v[1], m[2] * v[0] + m[3] * v[1]]
  : [0, 3, 6].map(r => m[r] * v[0] + m[r + 1] * v[1] + m[r + 2] * (v[2] || 0)));
const COLS = ['#83c167', '#fc6255', '#58c4dd']; // î′, ĵ′, k̂′: green, red, blue, as in the topics
const vectorsOf = (scene, scope) => scene.items.filter(i => i.visible && i.info.kind.startsWith('vector')).map(i => ({ item: i, v: i.fns.map(f => f(scope)) }));

export function drawScene2D(plot, scene) {
  const scope = scene.scope();
  for (const item of scene.items) {
    if (!item.visible || item.only === '3d') continue;
    const k = item.info.kind, color = item.dim ? faint(item.color) : item.color, width = item.dim ? 2 : 3;
    if (k === 'function') plot.curve(fx(item, scope), color, width, ...scene.range(item, scope, -Infinity, Infinity), item.dash ? [9, 7] : []);
    else if (k === 'vline') plot.vline(item.fn(scope), color, width);
    else if (k === 'surface') plot.contour(fxy(item, scope), item.color);
    else if (k === 'curve2' || k === 'curve3') plot.param(ft(item.fns[0], scope), ft(item.fns[1], scope), ...scene.range(item, scope, ...T_RANGE), color, width);
    else if (k === 'point2' || k === 'point3') {
      const x = item.fns[0](scope), y = item.fns[1](scope);
      plot.dot(x, y, item.color, 6);
      if (item.info.label) plot.tex(`${item.id}-label`, item.info.label, x, y, item.color, { dx: 9, dy: -13 });
    } else if (k === 'vector2' || k === 'vector3') {
      const x = item.fns[0](scope), y = item.fns[1](scope);
      plot.arrow(0, 0, x, y, color, { width });
      if (item.info.label) plot.tex(`${item.id}-label`, `\\vec ${item.info.label}`, x, y, item.color, { dx: 9, dy: -13 });
    } else if (k === 'matrix2' || k === 'matrix3') {
      // The plane under the matrix (a 3×3 one is seen from above): the moved grid, the unit square, the columns
      const m = entries(item, scope), at = (x, y) => apply(m, [x, y, 0]).slice(0, 2);
      if (!m.every(isFinite)) continue;
      for (let n = -12; n <= 12; n++) {
        plot.line(...at(n, 0), ...at(n, 1), item.color + (n ? '38' : '80'), { width: n ? 1 : 1.6, extend: true });
        plot.line(...at(0, n), ...at(1, n), item.color + (n ? '38' : '80'), { width: n ? 1 : 1.6, extend: true });
      }
      const sq = [at(0, 0), at(1, 0), at(1, 1), at(0, 1)];
      plot.fill(sq, item.color + '30');
      [at(1, 0), at(0, 1)].forEach((c, i) => plot.arrow(0, 0, ...c, COLS[i], { width: 3 }));
      for (const { item: vi, v } of vectorsOf(scene, scope)) {
        const w = at(v[0], v[1]);
        plot.arrow(0, 0, ...w, vi.color, { width: 2.5, dash: [7, 5] });
        plot.tex(`${item.id}-${vi.id}`, `${item.info.label || 'M'}${vi.info.label ? `\\vec ${vi.info.label}` : '\\vec v'}`, ...w, vi.color, { dx: 9, dy: -13 });
      }
    }
  }
  for (const c of scene.custom) if (c.visible && c.draw2d) c.draw2d(plot, scene, scene.scope());
}

export function drawScene3D(plot, scene) {
  const scope = scene.scope(), R = plot.R;
  const along = (n, from, to, f) => Array.from({ length: n + 1 }, (_, i) => f(from + (to - from) * i / n));
  for (const item of scene.items) {
    if (!item.visible || item.only === '2d') continue;
    const k = item.info.kind, id = item.id;
    if (k === 'surface') plot.surface(id, fxy(item, scope), item.color);
    else if (k === 'function') {
      const f = fx(item, scope), [a, b] = scene.range(item, scope, -R, R);
      const lo = Math.max(a, -R), hi = Math.min(b, R);
      if (lo < hi) plot.tube(id, along(240, lo, hi, x => [x, f(x), 0]), item.color);
    } else if (k === 'vline') {
      const c = item.fn(scope);
      plot.tube(id, [[c, -R, 0], [c, R, 0]], item.color);
    } else if (k === 'curve2' || k === 'curve3') {
      const [a, b, c] = item.fns.map(fn => ft(fn, scope));
      plot.tube(id, along(400, ...scene.range(item, scope, ...T_RANGE), t => [a(t), b(t), c ? c(t) : 0]), item.color);
    } else if (k === 'point2' || k === 'point3') {
      plot.sphere(id, [item.fns[0](scope), item.fns[1](scope), item.fns[2] ? item.fns[2](scope) : 0], item.color, 0.12);
    } else if (k === 'vector2' || k === 'vector3') {
      plot.arrow(id, [0, 0, 0], item.fns.map(f => f(scope)).concat(0).slice(0, 3), item.color, { name: item.info.label });
    } else if (k === 'matrix2' || k === 'matrix3') {
      // Space under the matrix: the moved grid, the unit cube (a square on the floor for 2×2), the columns
      const m = entries(item, scope), three = k === 'matrix3';
      if (!m.every(isFinite)) continue;
      const at = (x, y, z) => { const w = apply(m, [x, y, z]); return three ? w : [w[0], w[1], 0]; };
      const segs = [], n = three ? 2 : 4;
      for (let a = -n; a <= n; a++) {
        for (let b = (three ? -n : 0); b <= (three ? n : 0); b++) {
          segs.push([at(-n, a, b), at(n, a, b)], [at(a, -n, b), at(a, n, b)]);
          if (three) segs.push([at(a, b, -n), at(a, b, n)]);
        }
      }
      plot.lines(`${id}-grid`, segs, item.color, 0.22);
      const C = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]].flatMap(([x, y]) => (three ? [[x, y, 0], [x, y, 1]] : [[x, y, 0]]));
      const box = three ? [[0, 2], [2, 4], [4, 6], [6, 0], [1, 3], [3, 5], [5, 7], [7, 1], [0, 1], [2, 3], [4, 5], [6, 7]] : [[0, 1], [1, 2], [2, 3], [3, 0]];
      plot.lines(`${id}-box`, box.map(([a, b]) => [at(...C[a]), at(...C[b])]), item.color, 0.9);
      (three ? [[1, 0, 0], [0, 1, 0], [0, 0, 1]] : [[1, 0, 0], [0, 1, 0]]).forEach((e, i) => plot.arrow(`${id}-c${i}`, [0, 0, 0], at(...e), COLS[i]));
      for (const { item: vi, v } of vectorsOf(scene, scope)) plot.arrow(`${id}-${vi.id}`, [0, 0, 0], at(v[0], v[1], v[2] || 0), vi.color, { radius: 0.025, name: `${item.info.label || 'M'}${vi.info.label || 'v'}` });
    }
  }
  for (const c of scene.custom) if (c.visible && c.draw3d) c.draw3d(plot, scene, scene.scope());
}

export const is3D = item => ['surface', 'curve3', 'point3', 'vector3', 'matrix3'].includes(item.info.kind);
