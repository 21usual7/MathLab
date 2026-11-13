// 2D view on a canvas. Equal units on both axes, so slopes and shapes are true.
// view.unit is pixels per unit for a view about 760 px high; a taller or lower view scales it (this.u),
// so a topic's window shows about the same part of the plane on a laptop and on a big monitor.
// Immediate mode: onDraw(plot) is called on every render and draws with the primitives below.
// Interaction: drag to pan, wheel / pinch to zoom, drag handles (points that topics make movable).
// `pointer` is where the mouse hovers (or where a finger tapped): objects may read the graph there.

import { THEME } from '../core/palette.js';
import { tween, lerp } from '../core/anim.js';
import { renderTex } from '../ui/tex.js';

// 1, 2 or 5 × 10^k, at least `raw`
function niceStep(raw) {
  const pow = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map(m => m * pow).find(s => s >= raw);
}
const label = v => String(Number(v.toPrecision(6)));

export class Plot2D {
  constructor(container, onDraw, view = {}) {
    this.onDraw = onDraw;
    this.view = { cx: 0, cy: 0, unit: 60, ...view };
    this.home = { ...this.view };
    this.axisNames = { x: 'x', y: 'y' };

    this.el = document.createElement('div');
    this.el.className = 'plot2d';
    this.canvas = document.createElement('canvas');
    this.overlay = document.createElement('div');
    this.overlay.className = 'plot-overlay';
    this.el.append(this.canvas, this.overlay);
    container.appendChild(this.el);

    this.ctx = this.canvas.getContext('2d');
    this.handles = [];
    this.pointer = null; // { px, py } in canvas pixels
    this.labels = new Map(); // key → { el, tex }
    this.frame = null;
    this.stopTween = null;
    this.ro = new ResizeObserver(() => this.request());
    this.ro.observe(this.el);
    this.bindEvents();
    this.request();
  }

  request() {
    if (!this.frame) this.frame = requestAnimationFrame(() => { this.frame = null; this.render(); });
  }

  render() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.el.clientWidth, h = this.el.clientHeight;
    if (!w || !h) return;
    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
    }
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
    this.k = Math.max(0.7, Math.min(1.6, h / 760));
    this.u = this.view.unit * this.k;
    // view.fit = [width, height]: a picture (a clock face) that must be seen whole shrinks in a narrow view
    if (this.view.fit) this.u = Math.min(this.u, w / this.view.fit[0], h / this.view.fit[1]);
    const u = this.u;
    this.xr = [this.view.cx - w / 2 / u, this.view.cx + w / 2 / u];
    this.yr = [this.view.cy - h / 2 / u, this.view.cy + h / 2 / u];

    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.handles = [];
    this.pen = null; // an object may ask for a pen this frame: then dragging draws a line instead of moving the view
    for (const l of this.labels.values()) l.used = false;

    // A picture that is not a graph (a clock face of remainders) asks for no grid: view.grid = false
    if (this.view.grid !== false) this.drawGrid();
    // Objects may rename the axes for this frame (a slice of a surface is drawn over x or y, height is z)
    this.axisNames = { x: 'x', y: 'y' };
    this.onDraw(this);
    this.canvas.classList.toggle('pen', !!this.pen);
    if (this.view.grid !== false) this.drawAxisNames();

    for (const l of this.labels.values()) l.el.style.display = l.used ? '' : 'none';
  }

  drawAxisNames() {
    const ctx = this.ctx, ox = this.sx(0), oy = this.sy(0);
    ctx.font = 'italic 500 15px Fraunces, Georgia, serif';
    ctx.fillStyle = THEME.text;
    ctx.textAlign = 'right';
    if (oy >= 0 && oy <= this.h) ctx.fillText(this.axisNames.x, this.w - 8, oy - 8);
    ctx.textAlign = 'left';
    if (ox >= 0 && ox <= this.w) ctx.fillText(this.axisNames.y, ox + 8, 18);
  }

  sx(x) { return (x - this.xr[0]) * this.u; }
  sy(y) { return this.h - (y - this.yr[0]) * this.u; }
  toX(px) { return this.xr[0] + px / this.u; }
  toY(py) { return this.yr[0] + (this.h - py) / this.u; }

  drawGrid() {
    const ctx = this.ctx, { w, h } = this;
    const step = niceStep(90 / this.u), minor = step / 5;

    const lines = (s, style) => {
      ctx.strokeStyle = style;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = Math.ceil(this.xr[0] / s) * s; x <= this.xr[1]; x += s) { const px = Math.round(this.sx(x)) + 0.5; ctx.moveTo(px, 0); ctx.lineTo(px, h); }
      for (let y = Math.ceil(this.yr[0] / s) * s; y <= this.yr[1]; y += s) { const py = Math.round(this.sy(y)) + 0.5; ctx.moveTo(0, py); ctx.lineTo(w, py); }
      ctx.stroke();
    };
    lines(minor, THEME.grid);
    lines(step, THEME.gridMajor);

    // Axes
    const ox = this.sx(0), oy = this.sy(0);
    ctx.strokeStyle = THEME.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ox >= 0 && ox <= w) { ctx.moveTo(ox, 0); ctx.lineTo(ox, h); }
    if (oy >= 0 && oy <= h) { ctx.moveTo(0, oy); ctx.lineTo(w, oy); }
    ctx.stroke();

    // Numbers (stick to the edge when an axis is off-screen)
    ctx.fillStyle = THEME.label;
    ctx.font = '500 11px Inter, system-ui, sans-serif';
    const ly = Math.max(14, Math.min(h - 6, oy + 16));
    const lx = Math.max(6, Math.min(w - 6, ox - 6));
    ctx.textAlign = 'center';
    for (let x = Math.ceil(this.xr[0] / step) * step; x <= this.xr[1]; x += step) {
      if (Math.abs(x) > step / 2) ctx.fillText(label(x), this.sx(x), ly);
    }
    ctx.textAlign = ox - 6 < 30 ? 'left' : 'right';
    for (let y = Math.ceil(this.yr[0] / step) * step; y <= this.yr[1]; y += step) {
      if (Math.abs(y) > step / 2) ctx.fillText(label(y), ox - 6 < 30 ? Math.max(lx, 6) : lx, this.sy(y) + 4);
    }
  }

  // ---------- Primitives ----------

  stroke(color, width = 3, dash = []) {
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // y = f(x). A jump is a break, not a steep line: tan x at π/2, but also sign x or floor x, whose steps
  // are small. A big gap between two pixels is halved again and again: a steep but continuous curve
  // closes the gap, a jump keeps it. A curve that leaves the gap while halving oscillates, it is not a jump.
  curve(f, color, width = 3, from = -Infinity, to = Infinity, dash = []) {
    const ctx = this.ctx, h = this.h;
    const clamp = py => Math.max(-h, Math.min(2 * h, py));
    const p0 = Math.max(0, Math.floor(this.sx(from))), p1 = Math.min(this.w, Math.ceil(this.sx(to)));
    const jump = (xa, ya, xb, yb) => {
      for (let k = 0; k < 14; k++) {
        const xm = (xa + xb) / 2, ym = this.sy(f(this.toX(xm)));
        if (!isFinite(ym)) return true;
        // Outside the gap: the curve swings faster than the pixels (sin 1/x near 0) — draw it solid
        if (ym < Math.min(ya, yb) - 2 || ym > Math.max(ya, yb) + 2) return false;
        if (Math.abs(ym - ya) > Math.abs(yb - ym)) { xb = xm; yb = ym; } else { xa = xm; ya = ym; }
      }
      return Math.abs(yb - ya) > 8;
    };
    ctx.beginPath();
    let prev = null;
    for (let px = p0; px <= p1; px += 1) {
      const y = f(this.toX(px));
      if (!isFinite(y)) { prev = null; continue; }
      const py = this.sy(y);
      const gap = prev === null ? 0 : Math.abs(py - prev);
      if (prev === null || gap > h || (gap > 12 && jump(px - 1, prev, px, py))) ctx.moveTo(px, clamp(py));
      else ctx.lineTo(px, clamp(py));
      prev = py;
    }
    this.stroke(color, width, dash);
  }

  // Broken line through [[x, y], ...]
  polyline(pts, color, width = 2.5) {
    this.ctx.beginPath();
    let pen = false;
    for (const [x, y] of pts) {
      if (!isFinite(x) || !isFinite(y)) { pen = false; continue; }
      if (pen) this.ctx.lineTo(this.sx(x), this.sy(y));
      else this.ctx.moveTo(this.sx(x), this.sy(y));
      pen = true;
    }
    this.stroke(color, width);
  }

  // Filled rectangle [x0, x1] × [y0, y1] (±Infinity reaches the edge of the view)
  rect(x0, y0, x1, y1, color) {
    const c = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const a = c(this.sx(x0), -1, this.w + 1), b = c(this.sx(x1), -1, this.w + 1);
    const top = c(this.sy(y1), -1, this.h + 1), bottom = c(this.sy(y0), -1, this.h + 1);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.min(a, b), Math.min(top, bottom), Math.abs(b - a), Math.abs(bottom - top));
  }

  // (fx(t), fy(t)) for t in [t0, t1]; long ranges get more samples
  // A filled polygon [[x, y], ...] (a square carried by a matrix, a parallelogram)
  fill(pts, color) {
    if (!pts.every(([x, y]) => isFinite(x) && isFinite(y))) return;
    this.ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? this.ctx.lineTo(this.sx(x), this.sy(y)) : this.ctx.moveTo(this.sx(x), this.sy(y))));
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  param(fx, fy, t0, t1, color, width = 3, n = Math.min(6000, Math.max(800, Math.round(130 * (t1 - t0))))) {
    const ctx = this.ctx;
    ctx.beginPath();
    let pen = false, prev = null;
    for (let i = 0; i <= n; i++) {
      const t = t0 + (t1 - t0) * i / n, x = fx(t), y = fy(t);
      if (!isFinite(x) || !isFinite(y)) { pen = false; continue; }
      const px = this.sx(x), py = this.sy(y);
      if (pen && prev && Math.hypot(px - prev[0], py - prev[1]) < this.h) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
      pen = true;
      prev = [px, py];
    }
    this.stroke(color, width);
  }

  // Segment; with extend: the whole line through the two points, cut to a band around the view
  line(x1, y1, x2, y2, color, { width = 2, dash = [], extend = false } = {}) {
    let xa = x1, xb = x2;
    const k = (y2 - y1) / (x2 - x1);
    if (extend && isFinite(k)) {
      const span = this.yr[1] - this.yr[0];
      xa = this.xr[0]; xb = this.xr[1];
      if (k !== 0) {
        const xl = x1 + (this.yr[0] - span - y1) / k, xh = x1 + (this.yr[1] + span - y1) / k;
        xa = Math.max(xa, Math.min(xl, xh));
        xb = Math.min(xb, Math.max(xl, xh));
      }
    }
    // A vertical line has no slope: extended, it runs from the bottom of the view to the top
    const ya = isFinite(k) ? y1 + k * (xa - x1) : extend ? this.yr[0] : y1, yb = isFinite(k) ? y1 + k * (xb - x1) : extend ? this.yr[1] : y2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.sx(xa), this.sy(ya));
    this.ctx.lineTo(this.sx(xb), this.sy(yb));
    this.stroke(color, width, dash);
  }

  // Arrow from (x1, y1) to (x2, y2): where a point moves; the head is drawn only if the arrow is long enough
  arrow(x1, y1, x2, y2, color, { width = 2, dash = [] } = {}) {
    if (![x1, y1, x2, y2].every(isFinite)) return;
    const ax = this.sx(x1), ay = this.sy(y1), bx = this.sx(x2), by = this.sy(y2);
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 4) return;
    const ux = (bx - ax) / len, uy = (by - ay) / len, head = Math.min(10, len / 2);
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx - ux * head * 0.6, by - uy * head * 0.6);
    this.stroke(color, width, dash);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - ux * head - uy * head * 0.5, by - uy * head + ux * head * 0.5);
    ctx.lineTo(bx - ux * head + uy * head * 0.5, by - uy * head - ux * head * 0.5);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Vertical line x = c across the whole view
  vline(c, color, width = 3, dash = []) {
    if (!isFinite(c)) return;
    const px = this.sx(c);
    this.ctx.beginPath();
    this.ctx.moveTo(px, 0);
    this.ctx.lineTo(px, this.h);
    this.stroke(color, width, dash);
  }

  // Hollow point: a notable point that can be inspected (root, extremum, intersection)
  ring(x, y, color, r = 4.5) {
    if (!isFinite(x) || !isFinite(y)) return;
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(this.sx(x), this.sy(y), r, 0, Math.PI * 2);
    ctx.fillStyle = THEME.bg;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  dot(x, y, color, r = 5) {
    if (!isFinite(x) || !isFinite(y)) return;
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(this.sx(x), this.sy(y), r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = THEME.bg;
    ctx.stroke();
  }

  // Shaded area between y = f(x) and the x-axis on [a, b]
  area(f, a, b, color) {
    const lo = Math.max(Math.min(a, b), this.xr[0]), hi = Math.min(Math.max(a, b), this.xr[1]);
    if (lo >= hi) return;
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(this.sx(lo), this.sy(0));
    for (let px = this.sx(lo); px <= this.sx(hi); px += 1) {
      const y = f(this.toX(px));
      if (isFinite(y)) ctx.lineTo(px, Math.max(-this.h, Math.min(2 * this.h, this.sy(y))));
    }
    ctx.lineTo(this.sx(hi), this.sy(0));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Level curves of z = f(x, y): how a surface looks from above (marching squares)
  contour(f, color, count = 10) {
    const nx = 96, ny = Math.max(8, Math.round(nx * this.h / this.w));
    const xs = i => this.xr[0] + (this.xr[1] - this.xr[0]) * i / nx;
    const ys = j => this.yr[0] + (this.yr[1] - this.yr[0]) * j / ny;
    const v = [];
    let min = Infinity, max = -Infinity;
    for (let j = 0; j <= ny; j++) {
      const row = [];
      for (let i = 0; i <= nx; i++) {
        const z = f(xs(i), ys(j));
        row.push(z);
        if (isFinite(z)) { min = Math.min(min, z); max = Math.max(max, z); }
      }
      v.push(row);
    }
    if (!(max > min)) return;
    const step = niceStep((max - min) / count);
    const ctx = this.ctx;
    for (let L = Math.ceil(min / step) * step; L <= max; L += step) {
      ctx.beginPath();
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const a = v[j][i], b = v[j][i + 1], c = v[j + 1][i + 1], d = v[j + 1][i];
          if (!isFinite(a) || !isFinite(b) || !isFinite(c) || !isFinite(d)) continue;
          const pts = [];
          const edge = (z1, z2, x1, y1, x2, y2) => {
            if ((z1 < L) !== (z2 < L)) { const k = (L - z1) / (z2 - z1); pts.push([lerp(x1, x2, k), lerp(y1, y2, k)]); }
          };
          edge(a, b, i, j, i + 1, j);
          edge(b, c, i + 1, j, i + 1, j + 1);
          edge(c, d, i + 1, j + 1, i, j + 1);
          edge(d, a, i, j + 1, i, j);
          for (let k = 0; k + 1 < pts.length; k += 2) {
            ctx.moveTo(this.sx(xs(pts[k][0])), this.sy(ys(pts[k][1])));
            ctx.lineTo(this.sx(xs(pts[k + 1][0])), this.sy(ys(pts[k + 1][1])));
          }
        }
      }
      ctx.globalAlpha = Math.abs(L) < step / 2 ? 0.55 : 0.28;
      this.stroke(color, Math.abs(L) < step / 2 ? 1.5 : 1);
      ctx.globalAlpha = 1;
    }
  }

  // Plain text on the canvas, centred at (x, y): letters of an alphabet, many at once (cheaper than KaTeX labels)
  text(str, x, y, color, { size = 15, weight = 500 } = {}) {
    if (!isFinite(x) || !isFinite(y)) return;
    const ctx = this.ctx;
    ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, this.sx(x), this.sy(y));
    ctx.textBaseline = 'alphabetic';
  }

  // Formula label (KaTeX) near a point, in HTML over the canvas
  tex(key, tex, x, y, color, { dx = 10, dy = -10, align = 'left' } = {}) {
    if (!isFinite(x) || !isFinite(y)) return;
    let l = this.labels.get(key);
    if (!l) {
      l = { el: document.createElement('div'), tex: null };
      l.el.className = 'plot-label';
      this.overlay.appendChild(l.el);
      this.labels.set(key, l);
    }
    if (l.tex !== tex) { renderTex(l.el, tex); l.tex = tex; }
    l.used = true;
    l.el.style.color = color;
    l.el.style.transform = `translate(${this.sx(x) + dx}px, ${this.sy(y) + dy}px) translate(${align === 'right' ? '-100%' : align === 'center' ? '-50%' : '0'}, -50%)`;
  }

  // A point the user can drag; onDrag(x, y) receives math coordinates
  handle(x, y, color, onDrag) {
    if (!isFinite(x) || !isFinite(y)) return;
    const ctx = this.ctx, px = this.sx(x), py = this.sy(y);
    ctx.beginPath();
    ctx.arc(px, py, 11, 0, Math.PI * 2);
    ctx.fillStyle = color + '33';
    ctx.fill();
    this.dot(x, y, color, 6);
    this.handles.push({ px, py, onDrag });
  }

  // ---------- View ----------

  setView(v, ms = 900) {
    if (this.stopTween) this.stopTween();
    const from = { ...this.view }, to = { ...this.view, ...v };
    if ('grid' in v) this.view.grid = v.grid; // the grid and the fitted size change at once
    if ('fit' in v) this.view.fit = v.fit;
    // Zoom is interpolated in log space so it feels uniform
    this.stopTween = tween(ms, k => {
      this.view.cx = lerp(from.cx, to.cx, k);
      this.view.cy = lerp(from.cy, to.cy, k);
      this.view.unit = Math.exp(lerp(Math.log(from.unit), Math.log(to.unit), k));
      this.request();
    });
  }

  zoomAt(factor, px, py) {
    const x0 = this.toX(px), y0 = this.toY(py);
    // The student zooms: the fitted size becomes the starting point, and the fit no longer holds the zoom back
    if (this.view.fit) { this.view.unit = this.u / this.k; this.view.fit = null; }
    this.view.unit = Math.min(1e5, Math.max(1, this.view.unit * factor));
    this.u = this.view.unit * this.k;
    this.view.cx = x0 - (px - this.w / 2) / this.u;
    this.view.cy = y0 + (py - this.h / 2) / this.u;
    this.request();
  }

  reset() { this.setView(this.home); }

  bindEvents() {
    const c = this.canvas;
    const pointers = new Map();
    let drag = null, pinch = null;
    const pos = e => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const nearHandle = (px, py) => this.handles.find(hd => Math.hypot(hd.px - px, hd.py - py) < 16);

    let tap = null;
    c.addEventListener('pointerdown', e => {
      c.setPointerCapture(e.pointerId);
      const [px, py] = pos(e);
      pointers.set(e.pointerId, [px, py]);
      tap = pointers.size === 1 ? { px, py, time: e.timeStamp } : null;
      if (this.stopTween) this.stopTween();
      if (pointers.size === 2) {
        const [p, q] = [...pointers.values()];
        pinch = { d: Math.hypot(p[0] - q[0], p[1] - q[1]) };
        drag = null;
        return;
      }
      const hd = nearHandle(px, py);
      drag = hd ? { handle: hd }
        : this.pen ? { pen: this.pen, pts: [[this.toX(px), this.toY(py)]] }
          : { px, py, cx: this.view.cx, cy: this.view.cy };
      if (drag.pen) drag.pen(drag.pts);
      c.classList.add('dragging');
    });
    c.addEventListener('pointermove', e => {
      const [px, py] = pos(e);
      if (!pointers.has(e.pointerId)) {
        c.classList.toggle('over-handle', !!nearHandle(px, py));
        if (e.pointerType === 'mouse') { this.pointer = { px, py }; this.request(); }
        return;
      }
      if (tap && Math.hypot(px - tap.px, py - tap.py) > 6) tap = null;
      // While the view is panned the readout under the pointer would jump around: hide it
      if (!tap && drag && !drag.handle && this.pointer) { this.pointer = null; this.request(); }
      pointers.set(e.pointerId, [px, py]);
      if (pinch && pointers.size === 2) {
        const [p, q] = [...pointers.values()];
        const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        this.zoomAt(d / pinch.d, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
        pinch.d = d;
      } else if (drag && drag.handle) {
        drag.handle.onDrag(this.toX(px), this.toY(py));
      } else if (drag && drag.pen) {
        drag.pts.push([this.toX(px), this.toY(py)]);
        drag.pen(drag.pts);
      } else if (drag) {
        this.view.cx = drag.cx - (px - drag.px) / this.u;
        this.view.cy = drag.cy + (py - drag.py) / this.u;
        this.request();
      }
    });
    const up = e => {
      // A tap (no movement) reads the graph at that place; on a phone this replaces hovering
      if (e.type === 'pointerup' && tap && e.timeStamp - tap.time < 500 && !(drag && (drag.handle || drag.pen))) {
        this.pointer = { px: tap.px, py: tap.py };
        this.request();
      }
      tap = null;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (!pointers.size) { drag = null; c.classList.remove('dragging'); }
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('pointerleave', e => {
      if (e.pointerType === 'mouse' && !pointers.size) { this.pointer = null; this.request(); }
    });
    c.addEventListener('wheel', e => {
      e.preventDefault();
      const [px, py] = pos(e);
      this.zoomAt(Math.exp(-e.deltaY * 0.0015), px, py);
    }, { passive: false });
    c.addEventListener('dblclick', () => this.reset());
  }

  dispose() {
    if (this.frame) cancelAnimationFrame(this.frame);
    if (this.stopTween) this.stopTween();
    this.ro.disconnect();
    this.el.remove();
  }
}
