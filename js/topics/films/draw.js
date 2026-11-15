// Pictures shared by the films of machine learning: a nerve cell and an artificial neuron drawn on the same
// places (so one can turn into the other), a brain, people, cats and dogs, weather. All in the 1000 × 560 picture.

import { COLORS } from '../../core/palette.js';
import { mix, clamp } from '../../ui/film.js';

export const C = { ...COLORS, white: '#e6e9ef', dim: '#3a4150', muted: '#8b95a7', bg: '#050607', panel: '#11161e' };

// Where the parts of a neuron centred at (x, y) are: the ends of three dendrites (the inputs), the body, the axon
export const neuronParts = (x, y) => ({
  ends: [[x - 230, y - 120], [x - 250, y], [x - 230, y + 120]],
  body: [x, y],
  axon: [[x + 36, y], [x + 250, y]],
  tips: [[x + 300, y - 34], [x + 310, y], [x + 300, y + 34]],
});
const bend = ([x1, y1], [x2, y2], k = 0.25) => [[x1, y1], [mix(x1, x2, 0.45), mix(y1, y2, 0.45) + k * (y2 - y1 || 30)], [x2, y2]];

// A nerve cell. syn — strengths of the synapses 0..1 (the size of the knobs), pulses — signals running in along
// the dendrites (k 0 → 1 from the synapse to the body, per dendrite, or null), charge — how full the body is
// (0..1, the threshold is TH), spike — the impulse along the axon (0 → 1, or null)
export const TH = 0.7;
export function bioNeuron(g, x, y, { syn = [0.8, 0.8, 0.8], pulses = [], charge = 0, spike = null, color = C.purple, labels = 0 } = {}) {
  const n = neuronParts(x, y), { ctx } = g;
  // Dendrites: a main branch and two twigs each
  n.ends.forEach((e, i) => {
    const pts = bend(e, [x - 30, y + (i - 1) * 14], 0.12);
    g.curve(pts, color, 7);
    const m = pts[1];
    g.line(m[0], m[1], m[0] - 40, m[1] + (i - 1.2) * 34, color, 3);
    g.line(e[0] + 40, e[1], e[0] + 10, e[1] - 26, color, 2.5);
  });
  // The synapses: the end of a previous cell's axon touches the dendrite; a stronger one is bigger
  n.ends.forEach((e, i) => {
    g.line(e[0] - 70, e[1], e[0] - 14, e[1], C.muted, 3);
    g.circle(e[0] - 6, e[1], 6 + 12 * syn[i], C.yellow + 'cc', C.yellow, 2);
  });
  // Signals running in
  pulses.forEach((k, i) => {
    if (k == null || k < 0 || k > 1) return;
    const [px, py] = g.along(bend(n.ends[i], [x - 30, y + (i - 1) * 14], 0.12), k);
    g.circle(px, py, 5 + 6 * syn[i], C.yellow, null);
  });
  // The axon with its sheath and the endings
  g.line(n.axon[0][0], y, n.axon[1][0], y, color, 6);
  for (let k = 0; k < 4; k++) g.box(x + 60 + 46 * k, y - 9, 38, 18, '#2a2340', color, 9);
  n.tips.forEach(t => { g.line(n.axon[1][0], y, t[0], t[1], color, 3); g.circle(t[0], t[1], 6, color, null); });
  // The body fills up with charge; past the threshold it flashes
  const fire = charge >= TH;
  g.circle(x, y, 40, '#1d1830', color, 3);
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, 37, 0, 2 * Math.PI); ctx.clip();
  ctx.fillStyle = fire ? C.yellow + 'dd' : color + '99';
  ctx.fillRect(x - 40, y + 37 - 74 * clamp(charge / 1.2), 80, 80);
  ctx.restore();
  g.circle(x, y, 13, '#2e2747', null);
  if (spike != null && spike >= 0 && spike <= 1) {
    const sx = mix(n.axon[0][0], n.tips[1][0], spike);
    g.circle(sx, y, 16, C.yellow + '55', null); g.circle(sx, y, 8, C.yellow, null);
  }
  // Names of the parts
  g.alpha(labels, () => {
    g.text({ en: 'dendrites — receive', ru: 'дендриты — принимают' }, x - 250, y - 175, 17, color);
    g.text({ en: 'synapses: strong and weak', ru: 'синапсы: сильные и слабые' }, x - 300, y + 178, 17, C.yellow);
    g.text({ en: 'body — adds up', ru: 'тело — складывает' }, x, y + 75, 17, color);
    g.text({ en: 'axon — sends the impulse on', ru: 'аксон — передаёт импульс дальше' }, x + 175, y - 50, 17, color);
  });
  return n;
}

// A charge meter beside the body: the level and the threshold
export function meter(g, x, y, charge, th = TH, color = C.purple) {
  const h = 120;
  g.box(x, y - h, 22, h, '#11161e', '#3a4150', 6);
  const k = clamp(charge / 1.2);
  g.box(x + 3, y - 3 - (h - 6) * k, 16, (h - 6) * k, charge >= th ? C.yellow : color, null, 4);
  const ty = y - h * th / 1.2;
  g.line(x - 8, ty, x + 30, ty, C.white, 2, [5, 4]);
  g.text({ en: 'threshold', ru: 'порог' }, x + 36, ty, 14, C.white, 'left');
}

// An artificial neuron on the same places: inputs at the ends of the dendrites, wires as thick as the weights,
// a circle that adds up and compares with the threshold, the output where the axon was
export function artNeuron(g, x, y, { inputs = [], w = [1, 1, 1], th = 0.5, show = 1, out = null, outLabel = null, names = true, wl = null, thl = null } = {}) {
  const n = neuronParts(x, y);
  const s = inputs.reduce((m, v, i) => m + w[i] * (+v || 0), 0), fire = s > th;
  g.alpha(show, () => {
    n.ends.forEach((e, i) => {
      const c = w[i] > 0 ? C.teal : w[i] < 0 ? C.red : C.dim;
      const on = inputs[i] ? 1 : 0.35;
      const a = Math.atan2(e[1] - y, e[0] - x), bx = x + 44 * Math.cos(a), by = y + 44 * Math.sin(a);
      g.alpha(on, () => g.line(e[0] + 30, e[1], bx, by, c, 2 + 5 * Math.min(2, Math.abs(w[i]))));
      const mx = mix(e[0] + 30, bx, 0.5), my = mix(e[1], by, 0.5) - 16;
      g.text(wl ? wl[i] : String(w[i]).replace('-', '−'), mx, my, 18, c, 'center', 700);
      g.box(e[0] - 40, e[1] - 26, 70, 52, '#101a24', C.blue, 10);
      if (inputs[i] != null) g.text(inputs[i], e[0] - 5, e[1], 26, C.blue, 'center', 700);
    });
    g.circle(x, y, 44, fire ? '#2c2a14' : '#141b26', fire ? C.yellow : C.white, 3);
    g.text('Σ', x, y - 8, 30, C.white);
    g.text(`> ${thl || String(th).replace('-', '−')}`, x, y + 20, 15, C.muted);
    g.arrow(x + 44, y, n.axon[1][0] + 10, y, fire ? C.yellow : C.muted, 4, 14);
    if (out != null) g.text(out, n.axon[1][0] + 60, y, 30, fire ? C.yellow : C.muted, 'center', 700);
    if (outLabel) g.text(outLabel, n.axon[1][0] + 60, y + 40, 16, fire ? C.yellow : C.muted);
    if (names) {
      g.text({ en: 'inputs x', ru: 'входы x' }, n.ends[0][0] - 5, n.ends[0][1] - 52, 16, C.blue);
      g.text({ en: 'weights w', ru: 'веса w' }, mix(n.ends[0][0], x, 0.5) + 10, n.ends[0][1] + 6, 16, C.teal);
    }
  });
  return { sum: s, fire };
}

// A brain from the side with neurons inside; lit — which of them flash now (by index)
export const BRAIN_DOTS = Array.from({ length: 90 }, (_, i) => {
  const a = i * 2.39996, r = Math.sqrt((i + 0.5) / 90);
  return [Math.cos(a) * r, Math.sin(a) * r * 0.72];
});
export function brain(g, x, y, s, { lit = () => 0, color = C.pink } = {}) {
  const { ctx } = g;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-150, 30);
  ctx.bezierCurveTo(-175, -60, -110, -125, -20, -118);
  ctx.bezierCurveTo(40, -140, 140, -110, 160, -40);
  ctx.bezierCurveTo(185, 20, 150, 75, 90, 78);
  ctx.bezierCurveTo(70, 100, 20, 96, 0, 82);
  ctx.bezierCurveTo(-40, 104, -120, 96, -150, 30);
  ctx.fillStyle = '#1e1420'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 4 / s; ctx.stroke();
  // A few folds
  ctx.strokeStyle = color + '66'; ctx.lineWidth = 2.5 / s;
  for (const p of [[-110, -50, -60, -70, -20, -40], [-30, -100, 0, -60, 40, -80], [60, -100, 80, -50, 130, -60], [-120, 30, -70, 10, -30, 40], [20, 20, 60, -10, 120, 20], [-60, -20, -20, -10, 10, -30]]) {
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo(p[2], p[3], p[4], p[5]); ctx.stroke();
  }
  // The brain stem
  ctx.fillStyle = '#1e1420'; ctx.beginPath(); ctx.roundRect(40, 70, 34, 70, 14); ctx.fill(); ctx.stroke();
  BRAIN_DOTS.forEach(([u, v], i) => {
    const k = lit(i);
    ctx.fillStyle = k > 0.05 ? `rgba(244,211,94,${0.35 + 0.65 * k})` : color + '55';
    ctx.beginPath(); ctx.arc(u * 140, v * 140 - 20, 3 + 4 * k, 0, 2 * Math.PI); ctx.fill();
  });
  ctx.restore();
}

// A person: a head and a body; small — a child
export function person(g, x, y, h, color, { hair = '#352d34', arm = 0 } = {}) {
  const s = h / 200, { ctx } = g;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-38, -120, 76, 110, 26); ctx.fill();
  ctx.fillRect(-30, -20, 22, 80); ctx.fillRect(8, -20, 22, 80);
  ctx.strokeStyle = color; ctx.lineWidth = 16; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(32, -100); ctx.lineTo(32 + 60 * Math.cos(arm), -100 + 60 * Math.sin(arm)); ctx.stroke();
  ctx.fillStyle = '#eac09e'; ctx.beginPath(); ctx.ellipse(0, -160, 32, 38, 0, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = hair; ctx.beginPath(); ctx.ellipse(0, -186, 34, 20, 0, Math.PI, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#352d34'; for (const xx of [-11, 11]) { ctx.beginPath(); ctx.arc(xx, -160, 3.5, 0, 2 * Math.PI); ctx.fill(); }
  ctx.restore();
}

// A speech bubble
export function bubble(g, x, y, text, color = C.white, size = 20) {
  const { ctx } = g;
  ctx.font = `500 ${size}px Inter, system-ui, sans-serif`;
  const w = ctx.measureText(typeof text === 'object' ? g.t(text) : text).width + 30;
  g.box(x - w / 2, y - 24, w, 48, '#151a22', color, 16);
  ctx.fillStyle = '#151a22'; ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x - 12, y + 23); ctx.lineTo(x - 22, y + 42); ctx.lineTo(x + 4, y + 23); ctx.fill(); ctx.stroke();
  g.text(text, x, y, size, color);
}

// Faces of a cat and a dog. ears: 'up' (pointed) or 'down' (folded or floppy)
export function cat(g, x, y, r, { ears = 'up', color = C.orange } = {}) {
  const { ctx } = g;
  ctx.fillStyle = color;
  if (ears === 'up') for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sx * r * 0.85, y - r * 0.3); ctx.lineTo(x + sx * r * 0.7, y - r * 1.25); ctx.lineTo(x + sx * r * 0.2, y - r * 0.85); ctx.fill(); }
  else for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sx * r * 0.55, y - r * 0.8, r * 0.3, r * 0.16, sx * 0.5, 0, 2 * Math.PI); ctx.fill(); }
  g.circle(x, y, r, color, null);
  for (const sx of [-1, 1]) { g.circle(x + sx * r * 0.35, y - r * 0.12, r * 0.13, '#1c2a14', null); g.circle(x + sx * r * 0.35, y - r * 0.12, r * 0.05, '#000', null); }
  ctx.fillStyle = C.pink; ctx.beginPath(); ctx.moveTo(x - r * 0.1, y + r * 0.18); ctx.lineTo(x + r * 0.1, y + r * 0.18); ctx.lineTo(x, y + r * 0.3); ctx.fill();
  for (const sx of [-1, 1]) for (const dy of [0.25, 0.4]) g.line(x + sx * r * 0.25, y + r * dy, x + sx * r * 1.15, y + r * (dy * 1.6 - 0.2), '#fff8', 1.5);
}
export function dog(g, x, y, r, { ears = 'down', color = '#c8955c' } = {}) {
  const { ctx } = g;
  ctx.fillStyle = ears === 'up' ? '#9aa3b0' : '#7a5232';
  if (ears === 'up') for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sx * r * 0.85, y - r * 0.4); ctx.lineTo(x + sx * r * 0.65, y - r * 1.3); ctx.lineTo(x + sx * r * 0.15, y - r * 0.9); ctx.fill(); }
  else for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sx * r * 0.95, y - r * 0.05, r * 0.28, r * 0.62, -sx * 0.25, 0, 2 * Math.PI); ctx.fill(); }
  g.circle(x, y, r, ears === 'up' ? '#c9d0d8' : color, null);
  ctx.fillStyle = ears === 'up' ? '#f2f2f2' : '#e8c79d'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.35, r * 0.45, r * 0.38, 0, 0, 2 * Math.PI); ctx.fill();
  for (const sx of [-1, 1]) g.circle(x + sx * r * 0.33, y - r * 0.15, r * 0.1, '#1a1a1a', null);
  ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.2, r * 0.16, r * 0.11, 0, 0, 2 * Math.PI); ctx.fill();
  g.line(x, y + r * 0.3, x, y + r * 0.5, '#1a1a1a', 2);
}

// Weather and days
export function sun(g, x, y, r, on = 1) {
  const c = on ? C.yellow : C.dim;
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.line(x + 1.3 * r * Math.cos(a), y + 1.3 * r * Math.sin(a), x + 1.75 * r * Math.cos(a), y + 1.75 * r * Math.sin(a), c, 3); }
  g.circle(x, y, r, c, null);
}
export function rain(g, x, y, r, on = 1) {
  const c = on ? C.blue : C.dim;
  g.circle(x - r * 0.5, y, r * 0.6, c, null); g.circle(x + r * 0.2, y - r * 0.3, r * 0.75, c, null); g.circle(x + r * 0.8, y + r * 0.05, r * 0.5, c, null);
  g.box(x - r * 1.0, y, r * 2.2, r * 0.55, c, null, r * 0.27);
  if (on) for (let k = 0; k < 3; k++) g.line(x - r * 0.6 + k * r * 0.6, y + r * 0.8, x - r * 0.8 + k * r * 0.6, y + r * 1.3, C.blue, 3);
}
export function calendar(g, x, y, r, on = 1) {
  const c = on ? C.green : C.dim;
  g.box(x - r, y - r * 0.8, 2 * r, 1.8 * r, '#101a14', c, 6);
  g.box(x - r, y - r * 0.8, 2 * r, r * 0.5, c, null, 6);
  g.text(on ? { en: 'Sat', ru: 'Сб' } : { en: 'Tue', ru: 'Вт' }, x, y + r * 0.35, r * 0.8, c, 'center', 700);
}
export const ICONS = [sun, calendar, rain];
