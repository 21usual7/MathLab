// Landscapes for the descent world and the descent itself — plain math, no drawing (also used by the tests)

import { COLORS } from '../core/palette.js';

export const R = 4;

// A seeded random generator: the same world for the same seed
const rng = seed => () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};

// Hills: nine wells, three bumps and one narrow deep well (Gaussian), on a wide bowl that keeps the walker
// on the map. The deep well collects only a small part of all starts: that is what makes the fog hard.
export function hills(seed) {
  const r = rng(seed), bumps = [];
  for (let i = 0; i < 12; i++) {
    const well = i < 9;
    bumps.push({ x: -3.3 + 6.6 * r(), y: -3.3 + 6.6 * r(), a: (well ? -1 : 1) * (0.7 + 0.7 * r()), s: 0.5 + 0.4 * r() });
  }
  bumps.push({ x: -3 + 6 * r(), y: -3 + 6 * r(), a: -1.5, s: 0.32 });
  return (x, y) => bumps.reduce((z, b) => z + b.a * Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / (2 * b.s * b.s)), 0.035 * (x * x + y * y) - 0.4);
}

export const LANDS = {
  canyon: { f: (x, y) => (x * x + 9 * y * y) / 10, color: COLORS.blue, formula: 'z = \\frac{x^2 + 9y^2}{10}' },
  hills: { f: hills(31), color: COLORS.green, formula: '\\text{hills}' },
  banana: { f: (x, y) => ((1 - x / 2) ** 2 + 8 * (y / 2 - (x / 2) ** 2) ** 2) * 0.8 - 1.5, color: COLORS.yellow, formula: 'z = (1 - u)^2 + 8(v - u^2)^2' },
  eggs: { f: (x, y) => 1.2 * Math.sin(1.3 * x) * Math.cos(1.3 * y) + 0.08 * (x * x + y * y) - 0.5, color: COLORS.purple, formula: 'z = 1.2\\sin 1.3x \\cos 1.3y + 0.08(x^2 + y^2)' },
};

export const grad = (f, x, y, h = 1e-4) => [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)];

// Plain descent or with inertia: the list of points until it settles, leaves the map or runs out of steps
export function descend(f, P0, eta, beta = 0, steps = 200) {
  const pts = [[...P0]];
  let [x, y] = P0, vx = 0, vy = 0, end = 'steps';
  for (let k = 0; k < steps; k++) {
    const [gx, gy] = grad(f, x, y);
    vx = beta * vx - eta * gx;
    vy = beta * vy - eta * gy;
    x += vx; y += vy;
    pts.push([x, y]);
    if (Math.abs(x) > R || Math.abs(y) > R || !isFinite(x + y)) { end = 'out'; break; }
    if (Math.hypot(vx, vy) < 1e-4 && Math.hypot(gx, gy) < 1e-3) { end = 'settled'; break; }
  }
  return { pts, end };
}

// The lowest point of a landscape: a fine grid, then descent from the best node
export function lowest(f) {
  let best = [0, 0], z = Infinity;
  for (let i = 0; i <= 160; i++) for (let j = 0; j <= 160; j++) {
    const x = -R + 2 * R * i / 160, y = -R + 2 * R * j / 160, v = f(x, y);
    if (v < z) { z = v; best = [x, y]; }
  }
  const d = descend(f, best, 0.05, 0.5, 2000), P = d.pts[d.pts.length - 1];
  return { P, z: f(...P) };
}
