// Draws scene objects in both views, so one idea is seen from several sides:
// a function y = f(x) also lies on the floor of the 3D view, a surface z = f(x, y)
// also appears in 2D as its level curves (a map seen from above).

const T_RANGE = [0, 2 * Math.PI];

// Evaluators with a reused scope object (no allocation per point)
const fx = (item, scope) => x => { scope.x = x; return item.fn(scope); };
const fxy = (item, scope) => (x, y) => { scope.x = x; scope.y = y; return item.fn(scope); };
const ft = (fn, scope) => t => { scope.t = t; return fn(scope); };

const faint = c => c + '73'; // 45 % opacity for dim objects

export function drawScene2D(plot, scene) {
  const scope = scene.scope();
  for (const item of scene.items) {
    if (!item.visible || item.only === '3d') continue;
    const k = item.info.kind, color = item.dim ? faint(item.color) : item.color, width = item.dim ? 2 : 3;
    if (k === 'function') plot.curve(fx(item, scope), color, width, ...scene.range(item, scope, -Infinity, Infinity));
    else if (k === 'vline') plot.vline(item.fn(scope), color, width);
    else if (k === 'surface') plot.contour(fxy(item, scope), item.color);
    else if (k === 'curve2' || k === 'curve3') plot.param(ft(item.fns[0], scope), ft(item.fns[1], scope), ...scene.range(item, scope, ...T_RANGE), color, width);
    else if (k === 'point2' || k === 'point3') plot.dot(item.fns[0](scope), item.fns[1](scope), item.color, 6);
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
    }
  }
  for (const c of scene.custom) if (c.visible && c.draw3d) c.draw3d(plot, scene, scene.scope());
}

export const is3D = item => ['surface', 'curve3', 'point3'].includes(item.info.kind);
