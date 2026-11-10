// Scene: what is on the stage. Shared by the Lab and the topics.
//   items  — objects typed as text (functions, surfaces, curves, points, parameters)
//   custom — objects drawn by code (a secant, a slicing plane...), used by topics
//   params — named numbers with a range; can be animated or played ▶
// Views subscribe with on() and redraw at most once per frame.

import { analyze, compile, numTex, symTex } from './expr.js';
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

  // Current parameter values as a math.js scope
  scope() {
    const s = {};
    for (const [name, p] of this.params) s[name] = p.value;
    return s;
  }

  // ---- Items ----

  add(text, opts = {}) {
    const item = {
      id: opts.id || `e${++uid}`,
      visible: opts.visible ?? true,
      label: opts.label || null,
      only: opts.only || null, // '2d' or '3d': drawn in that view only
    };
    this.items.push(item);
    this.setText(item, text);
    // Parameters do not take colors from the cycle
    item.color = color(opts.color || (item.info.kind === 'param' ? 'grey' : CYCLE[this.colorIndex++ % CYCLE.length]));
    return item;
  }

  setText(item, text) {
    item.text = text;
    item.info = analyze(text);
    const info = item.info;
    item.fn = info.node ? compile(info.node) : null;
    item.fns = info.nodes ? info.nodes.map(compile) : null;
    (info.params || []).forEach(name => this.ensureParam(name));
    if (info.kind === 'param') {
      const p = this.ensureParam(info.name, info.value);
      p.value = info.value;
      // Keep the slider range around the typed value
      if (info.value < p.min) p.min = Math.floor(info.value);
      if (info.value > p.max) p.max = Math.ceil(info.value);
    }
    this.changed();
  }

  remove(item) {
    this.items = this.items.filter(i => i !== item);
    this.changed();
  }

  get(id) {
    return this.items.find(i => i.id === id) || this.custom.find(c => c.id === id);
  }

  // Only these ids are visible (items and custom objects); used by topic steps
  showOnly(ids) {
    const set = new Set(ids);
    [...this.items, ...this.custom].forEach(o => { o.visible = set.has(o.id); });
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
