// Reading a graph with the pointer. Near a curve y = f(x) the explorer puts a point on it with its
// coordinates and dashed guides to the axes — the graph read as "input → output". It also marks the
// curve's notable points: zeros, peaks and valleys, crossings with the other curves, the y-intercept.
// Hover a hollow point to read it. On phones a tap does the same.
// With `tangent` on, the tangent line at the point is drawn too, and its slope is shown.
// It is a custom scene object: scene.custom.push(explorer()).

import { findRoots, extrema, slope } from '../core/numeric.js';
import { THEME } from '../core/palette.js';

const SNAP = 18;   // px: how close the pointer must be to a curve
const NOTABLE = 11; // px: to a notable point
const MAX_POINTS = 40;

const NAMES = { zero: 'zero', max: 'max', min: 'min', cross: 'crossing', yint: 'y-intercept' };

// Digits that match the zoom: more when zoomed in
function show(v, unit, extra = 0) {
  if (!isFinite(v)) return '\\text{—}';
  const d = Math.max(1, Math.min(8, Math.round(Math.log10(unit)) + extra));
  const r = Number(v.toFixed(d));
  return String(Object.is(r, -0) ? 0 : r);
}

export function explorer({ ids = null, notable = true, guides = true, always = true, tangent = false } = {}) {
  let cacheKey = '', cache = [];

  // Notable points of one function on the visible part of its range
  function notablePoints(p, scene, s, item, others) {
    const key = [item.id, p.xr.join(), p.yr.join(), scene.items.map(i => i.text + i.visible).join('|'),
      [...scene.params.values()].map(q => q.value).join()].join('#');
    if (key === cacheKey) return cache;
    const f = x => { s.x = x; return item.fn(s); };
    const [lo, hi] = scene.range(item, s, -Infinity, Infinity);
    const a = Math.max(lo, p.xr[0]), b = Math.min(hi, p.xr[1]);
    const pts = [];
    if (a < b) {
      const jump = p.yr[1] - p.yr[0];
      findRoots(f, a, b, 600).forEach(x => pts.push({ x, y: 0, type: 'zero' }));
      extrema(f, a, b, 600, jump).forEach(e => pts.push(e));
      if (a <= 0 && b >= 0 && isFinite(f(0))) pts.push({ x: 0, y: f(0), type: 'yint' });
      for (const o of others) {
        const g = x => { s.x = x; return o.fn(s); };
        const [lo2, hi2] = scene.range(o, s, -Infinity, Infinity);
        const a2 = Math.max(a, lo2), b2 = Math.min(b, hi2);
        if (a2 < b2) findRoots(x => f(x) - g(x), a2, b2, 600).forEach(x => pts.push({ x, y: f(x), type: 'cross' }));
      }
    }
    cacheKey = key;
    cache = pts.length > MAX_POINTS ? [] : pts; // a forest of points (sin x zoomed out) helps nobody
    return cache;
  }

  return {
    id: 'explore',
    tangent, // can be switched later: explorer.tangent = true
    always, // stays through topic steps unless a topic wants to show it only in some of them
    visible: true,
    draw2d(p, scene, s) {
      if (!p.pointer) return;
      const { px, py } = p.pointer;
      const funcs = scene.items.filter(i => i.visible && i.fn && i.info.kind === 'function' && i.only !== '3d' && (!ids || ids.includes(i.id)));
      if (!funcs.length) return;

      // The curve nearest to the pointer
      let best = null;
      for (const item of funcs) {
        const [lo, hi] = scene.range(item, s, -Infinity, Infinity);
        for (let dx = -SNAP; dx <= SNAP; dx += 2) {
          const x = p.toX(px + dx);
          if (x < lo || x > hi) continue;
          s.x = x;
          const y = item.fn(s);
          if (!isFinite(y)) continue;
          const d = Math.hypot(dx, p.sy(y) - py);
          if (d < SNAP && (!best || d < best.d)) best = { item, d };
        }
      }
      if (!best) return;
      const item = best.item, color = item.color;

      // Notable points of that curve: hollow, and readable when the pointer is on one
      let target = null;
      if (notable) {
        const pts = notablePoints(p, scene, s, item, funcs.filter(o => o !== item));
        for (const q of pts) {
          p.ring(q.x, q.y, q.type === 'cross' ? THEME.text : color);
          const d = Math.hypot(p.sx(q.x) - px, p.sy(q.y) - py);
          if (d < NOTABLE && (!target || d < target.d)) target = { ...q, d };
        }
      }

      const [lo, hi] = scene.range(item, s, -Infinity, Infinity);
      let x, y, name = null;
      if (target) {
        x = target.x;
        y = target.y;
        name = NAMES[target.type];
      } else {
        x = Math.max(lo, Math.min(hi, p.toX(px)));
        s.x = x;
        y = item.fn(s);
      }
      if (!isFinite(y)) return;

      if (guides) {
        p.line(x, 0, x, y, color + '99', { width: 1.2, dash: [3, 4] });
        p.line(0, y, x, y, color + '99', { width: 1.2, dash: [3, 4] });
      }
      let k = NaN;
      if (this.tangent) {
        k = slope(v => { s.x = v; return item.fn(s); }, x);
        if (isFinite(k)) p.line(x, y, x + 1, y + k, 'rgba(255,255,255,0.75)', { width: 1.6, extend: true });
      }
      p.dot(x, y, color, 6);
      const extra = target ? 1 : 0;
      let coords = `\\left(${show(x, p.u, extra)},\\ ${show(y, p.u, extra)}\\right)`;
      if (isFinite(k)) coords += `\\quad \\text{slope } ${show(k, p.u, 1)}`;
      const right = p.sx(x) > p.w - 170;
      p.tex('explore', name ? `\\text{${name}}\\ ${coords}` : coords, x, y, color,
        { dx: right ? -12 : 12, dy: p.sy(y) < 40 ? 18 : -16, align: right ? 'right' : 'left' });
    },
  };
}
