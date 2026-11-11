// Scene: what is on the stage. Shared by the Lab and the topics.
//   items  — objects typed as text (functions, surfaces, curves, points, parameters, vertical lines).
//            A function written as f(x) = … can be used by the others: y = f(x - 1), y = f'(x).
//   custom — objects drawn by code (a secant, a slicing plane...), used by topics
//   params — named numbers with a range; can be animated or played ▶
// Views subscribe with on() and redraw at most once per frame.

import { analyze, compile, definedName, numTex, symTex } from './expr.js';
import { CYCLE, color } from './palette.js';
import { tween, lerp } from './anim.js';
import { fmt } from './numeric.js';

let uid = 0;

export class Scene {
  constructor() {
    this.items = [];
    this.custom = [];
    this.params = new Map();
    this.listeners = new Set();
    this.pending = false;
    this.colorIndex = 0;
    this.stopTween = null;
    this.playFrame = null;
    this.lastTime = 0;
    this.defs = new Set(); // names of the user's functions
  }

  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // Coalesce many changes into one redraw per frame
  changed() {
    if (this.pending) return;
    this.pending = true;
    requestAnimationFrame(() => {
      this.pending = false;
      this.listeners.forEach(f => f());
    });
  }

  // Current parameter values and the user's functions (f, f' and f'') as a math.js scope
  scope() {
    const s = {};
    for (const [name, p] of this.params) s[name] = p.value;
    const defs = this.items.filter(i => i.info.name && i.fn);
    if (!defs.length) return s;
    let depth = 0; // f(x) = g(x), g(x) = f(x) must not hang
    const own = [];
    for (const d of defs) {
      // Every function has its own scope object, so evaluating it never changes the caller's x
      const local = {};
      own.push(local);
      const f = v => {
        if (depth > 24) return NaN;
        depth++;
        const prev = local.x;
        local.x = v;
        const r = d.fn(local);
        local.x = prev;
        depth--;
        return r;
      };
      const h1 = 1e-5, h2 = 1e-3;
      s[d.info.name] = f;
      s[`${d.info.name}_d1`] = v => (f(v + h1) - f(v - h1)) / (2 * h1);
      s[`${d.info.name}_d2`] = v => (f(v + h2) - 2 * f(v) + f(v - h2)) / (h2 * h2);
    }
    own.forEach(local => Object.assign(local, s));
    return s;
  }

  // ---- Items ----

  add(text, opts = {}) {
    const item = {
      id: opts.id || `e${++uid}`,
      visible: opts.visible ?? true,
      label: opts.label || null,
      only: opts.only || null, // '2d' or '3d': drawn in that view only
      dim: opts.dim || false, // drawn thin and faint: the "before" picture next to the "after"
      legend: opts.legend ?? true, // listed under the stage of a topic
      dash: opts.dash || false, // dashed: a curve drawn on top of another one that it equals
    };
    this.items.push(item);
    this.setText(item, text);
    // Parameters do not take colors from the cycle
    item.color = color(opts.color || (item.info.kind === 'param' ? 'grey' : CYCLE[this.colorIndex++ % CYCLE.length]));
    return item;
  }

  setText(item, text) {
    item.text = text;
    // A new or removed f(x) = … changes how every other line reads ("f(x)" is a call, not f·x)
    if (this.updateDefs()) this.items.forEach(i => { if (i !== item) this.analyzeItem(i); });
    this.analyzeItem(item);
    this.changed();
  }

  updateDefs() {
    const next = new Set(this.items.map(i => definedName(i.text)).filter(Boolean));
    const same = next.size === this.defs.size && [...next].every(n => this.defs.has(n));
    this.defs = next;
    return !same;
  }

  analyzeItem(item) {
    item.info = analyze(item.text, this.defs);
    const info = item.info;
    item.fn = info.node ? compile(info.node) : null;
    item.fns = info.nodes ? info.nodes.map(compile) : null;
    item.lo = info.domain && info.domain.lo ? compile(info.domain.lo) : null;
    item.hi = info.domain && info.domain.hi ? compile(info.domain.hi) : null;
    (info.params || []).forEach(name => this.ensureParam(name));
    if (info.kind === 'param') {
      const p = this.ensureParam(info.name, info.value);
      p.value = info.value;
      // Keep the slider range around the typed value
      if (info.value < p.min) p.min = Math.floor(info.value);
      if (info.value > p.max) p.max = Math.ceil(info.value);
    }
  }

  remove(item) {
    this.items = this.items.filter(i => i !== item);
    if (this.updateDefs()) this.items.forEach(i => this.analyzeItem(i));
    this.changed();
  }

  // Range of x for a function, of t for a curve: [lo, hi] (the ends can be parameters)
  range(item, scope, lo, hi) {
    const a = item.lo ? item.lo(scope) : lo, b = item.hi ? item.hi(scope) : hi;
    return [isFinite(a) ? a : lo, isFinite(b) ? b : hi];
  }

  get(id) {
    return this.items.find(i => i.id === id) || this.custom.find(c => c.id === id);
  }

  // Only these ids are visible (items and custom objects); used by topic steps.
  // Objects marked `always` (like the explorer that reads the graph under the pointer) stay.
  showOnly(ids) {
    const set = new Set(ids);
    [...this.items, ...this.custom].forEach(o => { if (!o.always) o.visible = set.has(o.id); });
    this.changed();
  }

  // ---- Parameters ----

  ensureParam(name, value = 1, range = {}) {
    if (!this.params.has(name)) {
      this.params.set(name, { name, value, min: range.min ?? -5, max: range.max ?? 5, step: range.step ?? 0.01, playing: false, dir: 1 });
    }
    return this.params.get(name);
  }

  setParam(name, value) {
    const p = this.params.get(name);
    if (!p) return;
    p.value = value;
    // A parameter typed as "a = 1" shows its current value
    for (const item of this.items) {
      if (item.info.kind === 'param' && item.info.name === name) {
        item.text = `${name} = ${fmt(value)}`;
        item.info.value = value;
        item.info.tex = `${symTex(name)} = ${numTex(value)}`;
      }
    }
    this.changed();
  }

  // Smoothly move parameters to new values
  animateParams(values, ms = 900) {
    if (this.stopTween) this.stopTween();
    const from = {};
    for (const name of Object.keys(values)) {
      const p = this.params.get(name);
      if (p) { p.playing = false; from[name] = p.value; }
    }
    this.stopTween = tween(ms, k => {
      for (const name of Object.keys(from)) this.setParam(name, lerp(from[name], values[name], k));
    });
  }

  // ▶: the value sweeps between min and max and back, about 4 s per sweep
  play(name, on = true) {
    const p = this.params.get(name);
    if (!p) return;
    p.playing = on;
    if (on && !this.playFrame) {
      this.lastTime = performance.now();
      const step = now => {
        const dt = Math.min(0.05, (now - this.lastTime) / 1000);
        this.lastTime = now;
        let any = false;
        for (const q of this.params.values()) {
          if (!q.playing) continue;
          any = true;
          let v = q.value + q.dir * (q.max - q.min) * dt / 4;
          if (v > q.max) { v = q.max; q.dir = -1; }
          if (v < q.min) { v = q.min; q.dir = 1; }
          this.setParam(q.name, v);
        }
        this.playFrame = any ? requestAnimationFrame(step) : null;
      };
      this.playFrame = requestAnimationFrame(step);
    }
    this.changed();
  }

  dispose() {
    if (this.stopTween) this.stopTween();
    if (this.playFrame) cancelAnimationFrame(this.playFrame);
    this.playFrame = null;
    this.listeners.clear();
  }
}
