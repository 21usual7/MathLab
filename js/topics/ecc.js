// Elliptic curves: adding points. y² = x³ + ax + b; a line through two points of the curve meets it once more,
// and that third point reflected in the x axis is the sum. With the point O at infinity as zero this is a real
// addition. Over ordinary numbers the coordinates of P, 2P, 3P, … grow into long fractions, so cryptography takes
// the same curve modulo a prime: a cloud of points with the same rules. Steps kG are easy, finding k back is not —
// the Diffie–Hellman exchange with points instead of powers.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { t, getLang } from '../core/i18n.js';
import { mod } from './mod.js';

const WINDOW = { cx: 0.5, cy: 0, unit: 64, fit: [8, 8] };
const TASKW = { cx: 1, cy: 0, unit: 48, fit: [9, 13] };
const WIDE = { cx: 1.5, cy: 0, unit: 34, fit: [15, 15] };
const MODW = { cx: 14, cy: 14, unit: 22, grid: true, fit: [31, 31] };
const WHITE = '#ffffff', LINE = 'rgba(255,255,255,0.45)';
const I = v => Math.round(v);
const r2 = v => fmt(Math.round(v * 100) / 100);
const pt = ([x, y]) => `(${x};\\ ${y})`;
const ptR = ([x, y]) => pt([r2(x), r2(y)]);

// ---------- The curve over ordinary numbers ----------

const cubic = (a, b) => x => x * x * x + a * x + b;

// Real roots of x³ + ax + b, from left to right (a touching double root is not needed: the curve is drawn through it)
export function roots(a, b) {
  const f = cubic(a, b), r = [];
  for (let x = -8; x < 8; x += 0.02) {
    let lo = x, hi = x + 0.02;
    if (f(lo) === 0) { r.push(lo); continue; }
    if (f(lo) * f(hi) > 0) continue;
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; }
    r.push((lo + hi) / 2);
  }
  return r;
}

// y² = x³ + ax + b: the unbounded piece from the largest root (x = r + s²), and the «egg» between the other two
function drawCurve(p, a, b, color, width = 3) {
  const f = cubic(a, b), r = roots(a, b);
  if (!r.length) return;
  const top = r[r.length - 1], S = Math.sqrt(Math.max(0.01, p.xr[1] + 1 - top));
  p.param(s => top + s * s, s => Math.sign(s) * Math.sqrt(Math.max(0, f(top + s * s))), -S, S, color, width);
  if (r.length === 3) {
    const m = (r[0] + r[1]) / 2, h = (r[1] - r[0]) / 2, x = th => m - h * Math.cos(th);
    p.param(x, th => Math.sign(Math.sin(th)) * Math.sqrt(Math.max(0, f(x(th)))), 0, 2 * Math.PI, color, width);
  }
}

// The curve of the topic: y² = x³ − x + 1, one piece starting at its root X0 ≈ −1.32.
// A point is given by one number s: x = X0 + s², y has the sign of s — a slider walks along the whole curve.
const A0 = -1;
export const X0 = roots(-1, 1)[0];
export const onCurve = s => { const x = X0 + s * s; return [x, s * Math.sqrt(x * x + X0 * x + X0 * X0 - 1)]; };
export const sOf = (x, sign = 1) => sign * Math.sqrt(x - X0);
const SMAX = 2.2;

// The place on the curve nearest to the pointer; near a whole x it snaps there (the points of the tasks)
function nearestS(x, y) {
  let best = 0, d = Infinity;
  for (let s = -SMAX; s <= SMAX; s += 0.004) {
    const [u, v] = onCurve(s), e = (u - x) ** 2 + (v - y) ** 2;
    if (e < d) { d = e; best = s; }
  }
  const xs = X0 + best * best, xi = Math.round(xs);
  if (Math.abs(xs - xi) < 0.1 && xi > X0) best = sOf(xi, Math.sign(best) || 1);
  return Math.max(-SMAX, Math.min(SMAX, best));
}

// The line through P and Q (the tangent if they coincide): slope, third point R and the sum P + Q = R reflected.
// null when the line is vertical: the third point is O, at infinity
export function chord(P, Q, a = A0) {
  const [x1, y1] = P, [x2, y2] = Q;
  let l;
  if (Math.abs(x1 - x2) < 1e-9) {
    if (Math.abs(y1 + y2) < 1e-9) return null;
    l = (3 * x1 * x1 + a) / (2 * y1);
  } else l = (y2 - y1) / (x2 - x1);
  if (!isFinite(l)) return null;
  const x3 = l * l - x1 - x2, y3 = y1 + l * (x3 - x1);
  return { l, R: [x3, y3], S: [x3, -y3] };
}

// The picture of P + Q: the line, the third point (white ring), the mirror step, the sum (yellow)
function drawSum(p, key, P, Q, { sum = true, tangent = false } = {}) {
  const c = chord(P, Q);
  if (!c) {
    p.vline(P[0], LINE, 1.8);
    if (sum) p.tex(`${key}:O`, '\\yellow{O}\\ (\\infty)', P[0], p.yr[1], COLORS.yellow, { dx: 10, dy: 20 });
  } else {
    p.line(...P, P[0] + 1, P[1] + c.l, LINE, { width: 1.8, extend: true });
    p.ring(...c.R, WHITE, 5.5);
    p.tex(`${key}:R`, 'R', ...c.R, 'rgba(255,255,255,0.8)', { dx: 10, dy: -12 });
    if (sum) {
      p.line(...c.R, ...c.S, 'rgba(244,211,94,0.6)', { width: 1.5, dash: [5, 5] });
      p.dot(...c.S, COLORS.yellow, 6.5);
      p.tex(`${key}:S`, tangent ? '2P' : 'P + Q', ...c.S, COLORS.yellow, { dx: 10, dy: 12 });
    }
  }
  return c;
}

const dragS = (sc, name) => (x, y) => { sc.play(name, false); sc.setParam(name, nearestS(x, y)); };

// ---------- Exact multiples P, 2P, 3P, … over the rationals (BigInt fractions) ----------

const gcdB = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const Q = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const g = gcdB(n, d) || 1n; return [n / g, d / g]; };
const qadd = (x, y) => Q(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
const qsub = (x, y) => Q(x[0] * y[1] - y[0] * x[1], x[1] * y[1]);
const qmul = (x, y) => Q(x[0] * y[0], x[1] * y[1]);
const qdiv = (x, y) => Q(x[0] * y[1], x[1] * y[0]);
const qeq = (x, y) => x[0] === y[0] && x[1] === y[1];
const qnum = ([n, d]) => Number(n) / Number(d);

function qplus(P, R) {
  if (!P) return R;
  const [x1, y1] = P, [x2, y2] = R;
  if (qeq(x1, x2) && qeq(qadd(y1, y2), Q(0n))) return null;
  const l = qeq(x1, x2) ? qdiv(qadd(qmul(Q(3n), qmul(x1, x1)), Q(BigInt(A0))), qmul(Q(2n), y1)) : qdiv(qsub(y2, y1), qsub(x2, x1));
  const x3 = qsub(qsub(qmul(l, l), x1), x2);
  return [x3, qsub(qmul(l, qsub(x1, x3)), y1)];
}

// [P, 2P, …, nP] for P = (1; 1)
export const exact = (() => {
  const G = [Q(1n), Q(1n)], out = [null];
  let R = null;
  for (let n = 1; n <= 37; n++) { R = qplus(R, G); out.push(R); }
  return out;
})();

const frac = ([n, d]) => (d === 1n ? String(n) : `${n < 0n ? '-' : ''}\\tfrac{${n < 0n ? -n : n}}{${d}}`);
const digits = ru => ru
  ? n => `${n}\\ \\text{${n % 10 === 1 && n % 100 !== 11 ? 'цифра' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'цифры' : 'цифр'}}`
  : n => `${n}\\ \\text{digits}`;

// ---------- The same curve modulo 29 ----------

export const PM = 29;
const inv = a => { a = mod(a, PM); for (let i = 1; i < PM; i++) if ((a * i) % PM === 1) return i; return NaN; };

// All points (x; y) with y² ≡ x³ − x + 1: 36 of them, plus O
export const PTS = [];
for (let x = 0; x < PM; x++) for (let y = 0; y < PM; y++) if (mod(y * y - x * x * x - A0 * x - 1, PM) === 0) PTS.push([x, y]);
const idx = (x, y) => PTS.findIndex(([u, v]) => u === x && v === y);

// Line through P and Q modulo 29 (the tangent if P = Q): slope, third point, sum. null — the sum is O
export function chordMod(P, R) {
  const [x1, y1] = P, [x2, y2] = R;
  if (x1 === x2 && mod(y1 + y2, PM) === 0) return null;
  const l = x1 === x2 ? mod((3 * x1 * x1 + A0) * inv(2 * y1), PM) : mod((y2 - y1) * inv(x2 - x1), PM);
  const x3 = mod(l * l - x1 - x2, PM), y3 = mod(y1 + l * (x3 - x1), PM);
  return { l, R: [x3, y3], S: [x3, mod(-y3, PM)] };
}
export const plusMod = (P, R) => (!P ? R : !R ? P : (c => c && c.S)(chordMod(P, R)));

// G, 2G, …, 37G = O for G = (1; 1): the order 37 is prime, so every point is a multiple of G
export const G = [1, 1], ORDER = PTS.length + 1;
export const MULT = (() => { const out = [null]; let R = null; for (let n = 1; n <= ORDER; n++) { R = plusMod(R, G); out.push(R); } return out; })();
const mulG = k => MULT[mod(k, ORDER)];

const LO = -0.5, HI = PM - 0.5;

// The square of remainders: the mirror y = 14.5, all points of the curve (dim) and the lit ones
function cloud(p, lit = []) {
  p.polyline([[LO, LO], [HI, LO], [HI, HI], [LO, HI], [LO, LO]], 'rgba(255,255,255,0.14)', 1.2);
  p.line(LO, PM / 2, HI, PM / 2, 'rgba(255,255,255,0.18)', { width: 1, dash: [6, 6] });
  PTS.forEach(([x, y]) => p.dot(x, y, 'rgba(255,255,255,0.42)', 3.8));
  lit.forEach(([P, c, r = 6.5]) => P && p.dot(...P, c, r));
}

// A line modulo 29: leaving the square at one side it comes back at the other, like the hand of a clock.
// Drawn as parallel pieces y = y₁ + m(x − x₁) + kp with the slope m closest to 0 among l, l − p
function wrapLine(p, P, l, color) {
  const [x1, y1] = P;
  if (l === null) { p.line(x1, LO, x1, HI, color, { width: 1.6 }); return; }
  const m = l > PM / 2 ? l - PM : l, y = (x, k) => y1 + m * (x - x1) + k * PM;
  for (let k = -Math.abs(m) - 2; k <= Math.abs(m) + 2; k++) {
    let lo = LO, hi = HI;
    if (m !== 0) {
      const xa = x1 + (LO - y1 - k * PM) / m, xb = x1 + (HI - y1 - k * PM) / m;
      lo = Math.max(LO, Math.min(xa, xb)); hi = Math.min(HI, Math.max(xa, xb));
    } else if (k !== 0) continue;
    if (lo < hi) p.line(lo, y(lo, k), hi, y(hi, k), color, { width: 1.6 });
  }
  // The 29 whole points of the line
  for (let x = 0; x < PM; x++) p.dot(x, mod(y1 + m * (x - x1), PM), color, 2.2);
}

const nearestIdx = (x, y) => PTS.reduce((b, P, i) => (Math.hypot(P[0] - x, P[1] - y) < Math.hypot(PTS[b][0] - x, PTS[b][1] - y) ? i : b), 0);
const dragIdx = (sc, name) => (x, y) => sc.setParam(name, nearestIdx(x, y));

// y² = x³ + ax + b with the numbers in place
function equation(a, b) {
  const term = (v, s) => (Math.abs(v) < 1e-9 ? '' : `${v < 0 ? ' - ' : ' + '}${Math.abs(Math.abs(v) - 1) < 1e-9 && s ? '' : fmt(Math.abs(v))}${s}`);
  return `y^2 = x^3${term(a, 'x')}${term(b, '')}`;
}

// Start points of the real steps (s values)
const S = {
  m11: sOf(-1, 1), m1m1: sOf(-1, -1), o1: sOf(0, 1), om1: sOf(0, -1), p11: sOf(1, 1), p1m1: sOf(1, -1),
  p3p5: sOf(3, 1), p3m5: sOf(3, -1),
};

export default {
  view: '2d',
  view2d: WINDOW,
  lab: false,

  setup(scene) {
    scene.ensureParam('a', -1, { min: -3, max: 3, step: 0.1 }); // coefficients of the curve
    scene.ensureParam('b', 1, { min: -3, max: 3, step: 0.1 });
    scene.ensureParam('P', S.m11, { min: -SMAX, max: SMAX, step: 0.01 }); // points on the real curve
    scene.ensureParam('Q', S.o1, { min: -SMAX, max: SMAX, step: 0.01 });
    scene.ensureParam('X', 0, { min: -SMAX, max: SMAX, step: 0.01 }); // the student's point
    scene.ensureParam('n', 4, { min: 1, max: 37, step: 1 });
    scene.ensureParam('i', idx(28, 1), { min: 0, max: PTS.length - 1, step: 1 }); // points modulo 29
    scene.ensureParam('j', idx(0, 1), { min: 0, max: PTS.length - 1, step: 1 });
    scene.ensureParam('k', 6, { min: 1, max: 36, step: 1 }); // Alice's secret
    scene.ensureParam('m', 15, { min: 1, max: 36, step: 1 }); // Bob's secret
    scene.ensureParam('x', 1, { min: 1, max: 36, step: 1 }); // Eve's guess

    const PQ = (p, sc, s, key) => {
      const P = onCurve(s.P), R = onCurve(s.Q);
      p.handle(...P, COLORS.blue, dragS(sc, 'P'));
      p.handle(...R, COLORS.red, dragS(sc, 'Q'));
      p.tex(`${key}:P`, 'P', ...P, COLORS.blue, { dx: -22, dy: -14 });
      p.tex(`${key}:Q`, 'Q', ...R, COLORS.red, { dx: -22, dy: -14 });
      return [P, R];
    };
    const curve = p => drawCurve(p, -1, 1, COLORS.purple);

    scene.custom.push(
      {
        // y² = x³ + ax + b for any a, b: one piece or a piece and an egg; symmetric in the x axis
        id: 'shape',
        draw2d(p, sc, s) { drawCurve(p, s.a, s.b, COLORS.purple); },
        legend: s => {
          const d = 4 * s.a ** 3 + 27 * s.b ** 2;
          return `\\purple{${equation(s.a, s.b)}}` + (Math.abs(d) < 0.05 ? t({ en: '\\quad \\text{(a sharp point: not allowed)}', ru: '\\quad \\text{(острый угол: такую не берут)}' }) : '');
        },
      },
      {
        // A line through P and Q meets the curve once more, at R
        id: 'line3',
        draw2d(p, sc, s) { curve(p); const [P, R] = PQ(p, sc, s, 'line3'); drawSum(p, 'line3', P, R, { sum: false }); },
        legend: s => {
          const P = onCurve(s.P), R = onCurve(s.Q), c = chord(P, R);
          return `\\blue{P} = ${ptR(P)},\\ \\ \\red{Q} = ${ptR(R)},\\ \\ R = ${c ? ptR(c.R) : 'O'}`;
        },
      },
      {
        // P + Q: the third point reflected
        id: 'add',
        draw2d(p, sc, s) { curve(p); const [P, R] = PQ(p, sc, s, 'add'); drawSum(p, 'add', P, R); },
        legend: s => {
          const c = chord(onCurve(s.P), onCurve(s.Q));
          return `\\blue{P} + \\red{Q} = ${c ? `\\yellow{${ptR(c.S)}}` : '\\yellow{O}'}`;
        },
      },
      {
        // P + P: the tangent at P
        id: 'double',
        draw2d(p, sc, s) {
          curve(p);
          const P = onCurve(s.P);
          drawSum(p, 'double', P, P, { tangent: true });
          p.handle(...P, COLORS.blue, dragS(sc, 'P'));
          p.tex('double:P', 'P', ...P, COLORS.blue, { dx: -22, dy: -14 });
        },
        legend: s => {
          const P = onCurve(s.P), c = chord(P, P);
          if (!c) return `\\blue{P} = ${ptR(P)}:\\ \\ 2P = \\yellow{O}`;
          return `\\lambda = \\frac{3x^2 - 1}{2y} = ${r2(c.l)},\\quad 2\\blue{P} = \\yellow{${ptR(c.S)}}`;
        },
      },
      {
        // P, 2P, …, nP over the rationals: the points jump around, the fractions grow
        id: 'multiples',
        draw2d(p, sc, s) {
          drawCurve(p, -1, 1, COLORS.purple, 2.5);
          const n = I(s.n), pts = exact.slice(1, n + 1).map(P => P && [qnum(P[0]), qnum(P[1])]);
          for (let k = 0; k + 1 < pts.length; k++) if (pts[k] && pts[k + 1]) p.arrow(...pts[k], ...pts[k + 1], COLORS.purple + 'aa', { width: 1.6 });
          pts.forEach(P => P && p.dot(...P, COLORS.purple, 4.5));
          const last = pts[n - 1];
          if (last) { p.dot(...last, COLORS.yellow, 7); p.tex('mult:n', `${n}P`, ...last, COLORS.yellow, { dx: 10, dy: -12 }); }
        },
        legend: s => {
          const n = I(s.n), P = exact[n];
          if (!P) return `${n}P = O`;
          const tex = `${n}P = \\left(${frac(P[0])};\\ ${frac(P[1])}\\right)`;
          if (tex.length < 70) return `\\yellow{${tex}}`;
          const dd = String(P[0][1]).length;
          return `${n}P:\\ ${t({ en: '\\text{denominator of } x', ru: '\\text{знаменатель } x' })}\\text{ — }${digits(getLang() === 'ru')(dd)}`;
        },
      },
      {
        // The curve modulo 29: a cloud of 36 points, in mirror pairs y ↔ 29 − y
        id: 'modcurve',
        draw2d(p) { cloud(p, [[[1, 1], COLORS.blue], [[1, 28], COLORS.teal]]); },
        legend: () => `y^2 \\equiv x^3 - x + 1 \\pmod{${PM}}:\\ \\ ${PTS.length}\\ ${t({ en: '\\text{points and } O', ru: '\\text{точек и } O' })}`,
      },
      {
        // The same addition modulo 29: a wrapped line through three points, the mirror y → 29 − y
        id: 'modadd',
        draw2d(p, sc, s) {
          const P = PTS[I(s.i)], R = PTS[I(s.j)], c = chordMod(P, R);
          wrapLine(p, P, c ? c.l : null, 'rgba(255,255,255,0.3)');
          cloud(p);
          if (c) {
            p.line(...c.R, ...c.S, 'rgba(244,211,94,0.6)', { width: 1.5, dash: [5, 5] });
            p.ring(...c.R, WHITE, 6);
            p.tex('modadd:R', 'R', ...c.R, 'rgba(255,255,255,0.8)', { dx: 10, dy: -12 });
            p.dot(...c.S, COLORS.yellow, 7);
            p.tex('modadd:S', 'P + Q', ...c.S, COLORS.yellow, { dx: 10, dy: 12 });
          }
          p.handle(...P, COLORS.blue, dragIdx(sc, 'i'));
          p.handle(...R, COLORS.red, dragIdx(sc, 'j'));
          p.tex('modadd:P', 'P', ...P, COLORS.blue, { dx: -22, dy: -14 });
          p.tex('modadd:Q', 'Q', ...R, COLORS.red, { dx: -22, dy: -14 });
        },
        legend: s => {
          const P = PTS[I(s.i)], R = PTS[I(s.j)], c = chordMod(P, R);
          return `\\blue{${pt(P)}} + \\red{${pt(R)}} = ${c ? `\\yellow{${pt(c.S)}}` : '\\yellow{O}'}` + (c ? `\\qquad \\lambda \\equiv ${c.l}` : '');
        },
      },
      {
        // G, 2G, …, nG modulo 29: jumps with no pattern, back to O after 37 steps
        id: 'modmult',
        draw2d(p, sc, s) {
          const n = I(s.n), seq = MULT.slice(1, n + 1);
          cloud(p);
          for (let k = 0; k + 1 < seq.length; k++) if (seq[k] && seq[k + 1]) p.arrow(...seq[k], ...seq[k + 1], COLORS.purple + '99', { width: 1.5 });
          seq.forEach(P => P && p.dot(...P, COLORS.purple, 5));
          p.dot(...G, COLORS.blue, 6.5);
          p.tex('modmult:G', 'G', ...G, COLORS.blue, { dx: -22, dy: -14 });
          const last = MULT[n];
          if (last) { p.dot(...last, COLORS.yellow, 7.5); p.tex('modmult:n', `${n}G`, ...last, COLORS.yellow, { dx: 10, dy: -12 }); }
        },
        legend: s => { const n = I(s.n); return `${n}G = \\yellow{${MULT[n] ? pt(MULT[n]) : 'O'}}`; },
      },
      {
        // The exchange: A = kG, B = mG, S = kB = mA = kmG
        id: 'ecdh',
        draw2d(p, sc, s) {
          const k = I(s.k), m = I(s.m), A = mulG(k), B = mulG(m), Sh = mulG(k * m);
          cloud(p, [[G, COLORS.green], [A, COLORS.red, 7], [B, COLORS.blue, 7], [Sh, COLORS.yellow, 8]]);
          [[G, 'G', COLORS.green], [A, 'A', COLORS.red], [B, 'B', COLORS.blue], [Sh, 'S', COLORS.yellow]].forEach(([P, name, c]) => P && p.tex(`ecdh:${name}`, name, ...P, c, { dx: 10, dy: -12 }));
        },
        legend: s => {
          const k = I(s.k), m = I(s.m), f = P => (P ? pt(P) : 'O');
          return `\\red{A} = ${k}G = \\red{${f(mulG(k))}},\\ \\ \\blue{B} = ${m}G = \\blue{${f(mulG(m))}},\\ \\ \\yellow{S} = ${k}\\blue{B} = ${m}\\red{A} = \\yellow{${f(mulG(k * m))}}`;
        },
      },
      // ---- Tasks ----
      {
        id: 'taskSum',
        draw2d(p, sc, s) {
          curve(p);
          const P = [0, -1], R = [1, 1];
          p.line(...P, ...R, LINE, { width: 1.8, extend: true });
          p.dot(...P, COLORS.blue, 6); p.tex('taskSum:P', 'P', ...P, COLORS.blue, { dx: -22, dy: -14 });
          p.dot(...R, COLORS.red, 6); p.tex('taskSum:Q', 'Q', ...R, COLORS.red, { dx: -22, dy: -14 });
          p.handle(...onCurve(s.X), COLORS.yellow, dragS(sc, 'X'));
        },
        legend: s => `\\blue{(0;\\ -1)} + \\red{(1;\\ 1)} = \\ ?\\qquad \\yellow{${ptR(onCurve(s.X))}}`,
      },
      {
        id: 'taskDouble',
        draw2d(p, sc, s) {
          curve(p);
          p.dot(1, -1, COLORS.blue, 6); p.tex('taskDouble:P', 'P', 1, -1, COLORS.blue, { dx: -22, dy: 14 });
          p.handle(...onCurve(s.X), COLORS.yellow, dragS(sc, 'X'));
        },
        legend: s => `2 \\cdot \\blue{(1;\\ -1)} = \\ ?\\qquad \\yellow{${ptR(onCurve(s.X))}}`,
      },
      {
        id: 'taskEve',
        draw2d(p, sc, s) {
          const Px = MULT[I(s.x)];
          cloud(p, [[G, COLORS.green], [[12, 8], COLORS.red, 8], [Px, COLORS.yellow, 7]]);
          p.tex('taskEve:A', 'A', 12, 8, COLORS.red, { dx: 10, dy: -12 });
          p.tex('taskEve:G', 'G', ...G, COLORS.green, { dx: -22, dy: -14 });
        },
        legend: s => { const x = I(s.x); return `${x}G = \\yellow{${MULT[x] ? pt(MULT[x]) : 'O'}}\\qquad ${t({ en: '\\text{goal}', ru: '\\text{цель}' })}:\\ \\red{A = (12;\\ 8)}`; },
      },
    );
  },

  steps: [
    {
      title: { en: 'The curve', ru: 'Кривая' },
      text: {
        en: 'An elliptic curve is all the points where $y^2 = x^3 + ax + b$. On the right a cube of $x$, on the left a square of $y$ — so together with a point $(x;\\ y)$ the curve always holds $(x;\\ -y)$: it is symmetric in the $x$ axis. Do not trust the name: these curves are not ellipses (the name came from the length of an ellipse\'s arc). Move $a$ and $b$: the curve is one piece or a piece and an «egg». Only when $4a^3 + 27b^2 = 0$ a sharp point or a self-crossing appears — such curves are not used. From now on the whole topic lives on one curve: $y^2 = x^3 - x + 1$.',
        ru: 'Эллиптическая кривая — это все точки, где $y^2 = x^3 + ax + b$. Справа куб от $x$, слева квадрат от $y$ — поэтому вместе с точкой $(x;\\ y)$ на кривой всегда есть и $(x;\\ -y)$: кривая симметрична относительно оси $x$. Названию не верьте: к эллипсам эти кривые отношения не имеют (имя досталось от длины дуги эллипса). Подвигайте $a$ и $b$: кривая бывает одним куском или куском и «яйцом». Только при $4a^3 + 27b^2 = 0$ появляется острый угол или самопересечение — такие кривые не берут. Дальше вся тема живёт на одной кривой: $y^2 = x^3 - x + 1$.',
      },
      try: { en: 'Move $a$ and $b$: when does the egg appear?', ru: 'Двигайте $a$ и $b$: когда появляется «яйцо»?' },
      check: {
        q: { en: 'The point $(1;\\ 1)$ lies on $y^2 = x^3 - x + 1$. Which other point is surely there?', ru: 'Точка $(1;\\ 1)$ лежит на $y^2 = x^3 - x + 1$. Какая ещё точка там есть наверняка?' },
        options: [{ text: '$(1;\\ -1)$', ok: true }, { text: '$(-1;\\ 1)$' }, { text: '$(-1;\\ -1)$' }],
        explain: {
          en: '$(-1)^2 = 1^2$: changing the sign of $y$ changes nothing. ($(-1;\\ 1)$ is on the curve too — but that has to be checked: $-1 + 1 + 1 = 1$.)',
          ru: '$(-1)^2 = 1^2$: смена знака $y$ ничего не меняет. ($(-1;\\ 1)$ тоже на кривой — но это надо проверять: $-1 + 1 + 1 = 1$.)',
        },
      },
      state: { show: ['shape'], params: { a: -1, b: 1 }, window: WINDOW, controls: ['a', 'b'] },
    },
    {
      title: { en: 'A line and three points', ru: 'Прямая и три точки' },
      text: {
        en: 'Draw a line through two points of the curve, $\\blue{P}$ and $\\red{Q}$. It almost always meets the curve in exactly one more, third point $R$. Why exactly one? Put the line $y = \\lambda x + c$ into the equation: you get a cubic equation in $x$. It has three roots, and two of them we know — the $x$ of $P$ and of $Q$. So the third is real too, and easy to find: the roots add up to $\\lambda^2$, so $x_R = \\lambda^2 - x_P - x_Q$.',
        ru: 'Проведём прямую через две точки кривой, $\\blue{P}$ и $\\red{Q}$. Почти всегда она пересечёт кривую ещё ровно в одной, третьей точке $R$. Почему ровно в одной? Подставим прямую $y = \\lambda x + c$ в уравнение: получится кубическое уравнение на $x$. У него три корня, и два мы знаем — это $x$ точек $P$ и $Q$. Значит, третий тоже настоящий, и найти его легко: сумма корней равна $\\lambda^2$, так что $x_R = \\lambda^2 - x_P - x_Q$.',
      },
      try: { en: 'Drag $P$ and $Q$ along the curve, or press ▶.', ru: 'Тяните $P$ и $Q$ по кривой или нажмите ▶.' },
      check: {
        q: { en: 'The line $y = 1$ goes through $(-1;\\ 1)$ and $(0;\\ 1)$. Where is the third point?', ru: 'Прямая $y = 1$ проходит через $(-1;\\ 1)$ и $(0;\\ 1)$. Где третья точка?' },
        options: [{ text: '$(1;\\ 1)$', ok: true }, { text: '$(-1;\\ -1)$' }, { text: { en: 'there is none', ru: 'третьей нет' } }],
        explain: {
          en: '$x^3 - x + 1 = 1$, that is $x^3 - x = 0$: the roots are $-1$, $0$ and $1$. The third point is $(1;\\ 1)$.',
          ru: '$x^3 - x + 1 = 1$, то есть $x^3 - x = 0$: корни $-1$, $0$ и $1$. Третья точка — $(1;\\ 1)$.',
        },
        reveal: scene => scene.animateParams({ P: S.m11, Q: S.o1 }, 900),
      },
      state: { show: ['line3'], params: { P: -0.9, Q: 1.8 }, window: WINDOW, controls: ['P', 'Q'] },
    },
    {
      title: { en: 'Adding: reflect the third point', ru: 'Сложение: отразить третью точку' },
      text: {
        en: 'Now the main definition. The <b>sum</b> $\\blue{P} + \\red{Q}$ is the third point $R$ reflected in the $x$ axis (yellow). A strange rule? But with it the addition behaves like a real one: $P + Q = Q + P$ (the line is the same), and brackets can be moved, $(P + Q) + T = P + (Q + T)$ — that one is a real theorem. Why reflect? For a zero. The vertical line through $P$ and its mirror $-P$ has no third point — say it goes to a point $O$ infinitely far away, shared by all vertical lines. Then $P + (-P) = O$, and $P + O$: the line through $P$ and $O$ is vertical, its third point is $-P$, reflected — $P$. Just like $5 + 0 = 5$.',
        ru: 'Теперь главное определение. <b>Сумма</b> $\\blue{P} + \\red{Q}$ — это третья точка $R$, отражённая относительно оси $x$ (жёлтая). Странное правило? Зато с ним сложение ведёт себя как настоящее: $P + Q = Q + P$ (прямая та же), и скобки можно переставлять: $(P + Q) + T = P + (Q + T)$ — это уже настоящая теорема. А зачем отражать? Ради нуля. У вертикальной прямой через $P$ и её отражение $-P$ третьей точки нет — договоримся, что она уходит в бесконечно далёкую точку $O$, общую для всех вертикалей. Тогда $P + (-P) = O$, а $P + O$: прямая через $P$ и $O$ — вертикаль, её третья точка $-P$, отражаем — получаем $P$. Ровно как $5 + 0 = 5$.',
      },
      try: { en: 'Drag $P$ and $Q$: the yellow point is their sum.', ru: 'Тяните $P$ и $Q$: жёлтая точка — их сумма.' },
      check: {
        q: { en: 'What is $P + Q$ if $Q$ is the mirror image of $P$?', ru: 'Чему равно $P + Q$, если $Q$ — отражение $P$?' },
        options: [
          { text: { en: 'the line is vertical: $P + Q = O$', ru: 'прямая вертикальна: $P + Q = O$' }, ok: true },
          { text: '$(0;\\ 0)$' },
          { text: { en: '$P$ itself', ru: 'сама $P$' } },
        ],
        explain: {
          en: 'There is no third point on a vertical line — it is $O$, the zero of the addition: $Q$ is $-P$.',
          ru: 'Третьей точки на вертикали нет — это $O$, ноль сложения: $Q$ и есть $-P$.',
        },
        reveal: (scene, stage) => scene.animateParams({ Q: -scene.params.get('P').value }, 900),
      },
      state: { show: ['add'], params: { P: S.m11, Q: S.o1 }, window: WINDOW, controls: ['P', 'Q'] },
    },
    {
      title: { en: 'P + P: the tangent', ru: 'P + P: касательная' },
      text: {
        en: 'How to add a point to itself? Let $Q$ slide towards $P$: the line through them turns and in the limit becomes the <b>tangent</b> at $P$ — as the secant became the tangent in the derivative topic. Its slope comes from the derivative: from $y^2 = x^3 - x + 1$ we get $2y\\,y\' = 3x^2 - 1$, so $\\lambda = \\frac{3x^2 - 1}{2y}$. The tangent meets the curve at one more point — reflect it, and that is $2P$.',
        ru: 'Как сложить точку саму с собой? Пусть $Q$ подъезжает к $P$: прямая через них поворачивается и в пределе становится <b>касательной</b> в $P$ — как секущая превращалась в касательную в теме о производной. Её наклон даёт производная: из $y^2 = x^3 - x + 1$ получаем $2y\\,y\' = 3x^2 - 1$, то есть $\\lambda = \\frac{3x^2 - 1}{2y}$. Касательная пересекает кривую ещё в одной точке — отражаем её и получаем $2P$.',
      },
      try: { en: 'Drag $P$. What happens at the left tip, where $y = 0$?', ru: 'Тяните $P$. Что происходит на левом кончике, где $y = 0$?' },
      check: {
        q: { en: 'The tangent at $P = (1;\\ 1)$ is the line $y = x$. What is $2P$?', ru: 'Касательная в $P = (1;\\ 1)$ — прямая $y = x$. Чему равно $2P$?' },
        options: [{ text: '$(-1;\\ 1)$', ok: true }, { text: '$(-1;\\ -1)$' }, { text: '$(2;\\ 2)$' }],
        explain: {
          en: '$x^3 - x + 1 = x^2$ gives $(x - 1)^2(x + 1) = 0$: the double root $1$ is the touching, the third root is $-1$. The third point is $(-1;\\ -1)$; reflected, $2P = (-1;\\ 1)$. And not $(2;\\ 2)$: points are not added coordinate by coordinate.',
          ru: '$x^3 - x + 1 = x^2$ даёт $(x - 1)^2(x + 1) = 0$: двойной корень $1$ — это касание, третий корень $-1$. Третья точка — $(-1;\\ -1)$, отражаем: $2P = (-1;\\ 1)$. И не $(2;\\ 2)$: точки не складываются по координатам.',
        },
        reveal: scene => scene.animateParams({ P: S.p11 }, 900),
      },
      state: { show: ['double'], params: { P: 1.9 }, window: WINDOW, controls: ['P'] },
    },
    {
      title: { en: 'Steps: P, 2P, 3P, …', ru: 'Шаги: P, 2P, 3P, …' },
      text: {
        en: 'Adding $P$ again and again gives $2P$, $3P$, $4P$, … The points jump around the curve with no visible order. And look at the coordinates: $P = (1;\\ 1)$, $2P = (-1;\\ 1)$, $4P = (3;\\ -5)$, but already $6P = (\\frac14;\\ \\frac78)$ — from there the fractions grow, and $30P$ has dozens of digits in its denominators. For a computer that is bad: the numbers swell, and decimal approximations pile up errors. The way out is the same as in Diffie–Hellman: count on a clock.',
        ru: 'Прибавляя $P$ снова и снова, получаем $2P$, $3P$, $4P$, … Точки скачут по кривой без видимого порядка. И посмотрите на координаты: $P = (1;\\ 1)$, $2P = (-1;\\ 1)$, $4P = (3;\\ -5)$, а уже $6P = (\\frac14;\\ \\frac78)$ — дальше дроби растут, и у $30P$ в знаменателях десятки цифр. Для компьютера это плохо: числа пухнут, а десятичные приближения копят ошибки. Выход тот же, что в Диффи — Хеллмане: считать на часах.',
      },
      try: { en: 'Move $n$ and watch the fractions.', ru: 'Двигайте $n$ и следите за дробями.' },
      check: {
        q: { en: 'Why is the curve not used «as is», with ordinary numbers?', ru: 'Почему кривую не используют «как есть», с обычными числами?' },
        options: [
          { text: { en: 'the fractions grow: numbers swell and lose precision', ru: 'дроби растут: числа пухнут и теряют точность' }, ok: true },
          { text: { en: 'there are too few points', ru: 'на ней слишком мало точек' } },
          { text: { en: 'the addition does not work there', ru: 'сложение там не работает' } },
        ],
        explain: {
          en: 'The addition works perfectly — the trouble is the size of the numbers. On a clock every coordinate stays below $p$.',
          ru: 'Сложение работает прекрасно — беда в размере чисел. На часах любая координата остаётся меньше $p$.',
        },
      },
      state: { show: ['multiples'], params: { n: 4 }, window: WIDE, controls: ['n'] },
    },
    {
      title: { en: 'The same curve on a clock', ru: 'Та же кривая на часах' },
      text: {
        en: 'Take the same equation, but modulo the prime $p = 29$: look for whole $x$, $y$ from $0$ to $28$ with $y^2 \\equiv x^3 - x + 1 \\pmod{29}$. There are $36$ such points — a cloud with no shape. But the symmetry stayed: $-y$ on the clock is $29 - y$, so the points come in pairs, mirrored in the middle line $y = 14.5$. Division works too: on a clock of a prime every non-zero number has an inverse, so $\\frac14$ becomes the whole number $22$ (indeed $4 \\cdot 22 = 88 \\equiv 1$).',
        ru: 'Возьмём то же уравнение, но по модулю простого $p = 29$: ищем целые $x$, $y$ от $0$ до $28$, при которых $y^2 \\equiv x^3 - x + 1 \\pmod{29}$. Таких точек $36$ — облако без всякой формы. Но симметрия осталась: $-y$ на часах — это $29 - y$, поэтому точки идут парами, зеркальными относительно средней линии $y = 14.5$. Деление тоже работает: на часах из простого числа у каждого ненулевого числа есть обратное, поэтому $\\frac14$ превращается в целое $22$ (ведь $4 \\cdot 22 = 88 \\equiv 1$).',
      },
      check: {
        q: { en: 'The point $(1;\\ 1)$ is on the curve modulo $29$. Where is its pair?', ru: 'Точка $(1;\\ 1)$ лежит на кривой по модулю $29$. Где её пара?' },
        options: [{ text: '$(1;\\ 28)$', ok: true }, { text: '$(28;\\ 1)$' }, { text: '$(28;\\ 28)$' }],
        explain: {
          en: '$-1 \\equiv 28$: the same $x$, and $y$ turns into $29 - y$. ($(28;\\ 1)$ is on the curve too — it is $(-1;\\ 1)$ — but it is another point.)',
          ru: '$-1 \\equiv 28$: та же $x$, а $y$ превращается в $29 - y$. ($(28;\\ 1)$ тоже на кривой — это $(-1;\\ 1)$, — но это другая точка.)',
        },
      },
      state: { show: ['modcurve'], window: MODW, controls: [] },
    },
    {
      title: { en: 'Adding on a clock', ru: 'Сложение на часах' },
      text: {
        en: 'And the addition is the same — the same formulas: slope $\\lambda = \\frac{y_Q - y_P}{x_Q - x_P}$ (dividing is multiplying by the inverse), $x_R = \\lambda^2 - x_P - x_Q$, all modulo $29$. What happened to the line? Leaving the square at one side it comes back at the other, like the hand of a clock — and again it goes through exactly three points of the curve. The reflection is $y \\to 29 - y$. Now $\\blue{P} = (28;\\ 1)$, that is $(-1;\\ 1)$, and $\\red{Q} = (0;\\ 1)$ — as on the real curve, and the answer is the same: $(1;\\ -1) = (1;\\ 28)$.',
        ru: 'И сложение то же самое — те же формулы: наклон $\\lambda = \\frac{y_Q - y_P}{x_Q - x_P}$ (делить — значит умножать на обратное), $x_R = \\lambda^2 - x_P - x_Q$, всё по модулю $29$. Что стало с прямой? Уходя за край квадрата, она возвращается с другой стороны, как стрелка часов, — и снова проходит ровно через три точки кривой. Отражение — $y \\to 29 - y$. Сейчас $\\blue{P} = (28;\\ 1)$, то есть $(-1;\\ 1)$, и $\\red{Q} = (0;\\ 1)$ — как на настоящей кривой, и ответ тот же: $(1;\\ -1) = (1;\\ 28)$.',
      },
      try: { en: 'Drag $P$ and $Q$ over the points of the curve.', ru: 'Тяните $P$ и $Q$ по точкам кривой.' },
      state: { show: ['modadd'], params: { i: idx(28, 1), j: idx(0, 1) }, window: MODW, controls: [] },
    },
    {
      title: { en: 'Easy forward, hard back', ru: 'Вперёд легко, назад трудно' },
      text: {
        en: 'The steps $G$, $2G$, $3G$, … modulo $29$ (here $G = (1;\\ 1)$) jump over the square like the powers in Diffie–Hellman, and after $37$ steps they come back to $O$. Computing $kG$ is easy even for a huge $k$: doubling ($G \\to 2G \\to 4G \\to 8G \\to \\dots$) and adding, one gets to $k$ in a few hundred steps. Going back — finding $k$ from the point $kG$ — nothing better than trying is known. This is the <i>discrete logarithm on a curve</i>, and it is even harder than for powers: there are clever shortcuts there, and for good curves there are none.',
        ru: 'Шаги $G$, $2G$, $3G$, … по модулю $29$ (здесь $G = (1;\\ 1)$) скачут по квадрату, как степени в Диффи — Хеллмане, и через $37$ шагов возвращаются в $O$. Посчитать $kG$ легко даже для огромного $k$: удваивая ($G \\to 2G \\to 4G \\to 8G \\to \\dots$) и прибавляя, до $k$ доходят за пару сотен шагов. А обратно — по точке $kG$ найти $k$ — ничего лучше перебора не известно. Это <i>дискретный логарифм на кривой</i>, и он даже труднее, чем для степеней: там есть хитрые обходные пути, а для хороших кривых — нет.',
      },
      try: { en: 'Move $n$ or press ▶.', ru: 'Двигайте $n$ или нажмите ▶.' },
      check: {
        q: { en: 'What is $37G$?', ru: 'Чему равно $37G$?' },
        options: [{ text: '$O$', ok: true }, { text: '$G$' }, { text: '$(0;\\ 0)$' }],
        explain: {
          en: 'Together with $O$ the curve has $37$ points; the steps visit all of them and come back to zero. So $38G = G$.',
          ru: 'Вместе с $O$ на кривой $37$ точек; шаги обходят их все и возвращаются в ноль. Поэтому $38G = G$.',
        },
        reveal: scene => scene.animateParams({ n: 37 }, 1200),
      },
      state: { show: ['modmult'], params: { n: 5 }, window: MODW, controls: ['n'] },
    },
    {
      title: { en: 'Exchanging keys on a curve', ru: 'Обмен ключами на кривой' },
      text: {
        en: 'Now Diffie–Hellman word for word, only powers are replaced by steps. Everybody knows the curve, $p$ and the point $G$. Alice picks a secret $k$ and sends the point $\\red{A} = kG$; Bob picks $m$ and sends $\\blue{B} = mG$. Alice computes $k\\blue{B} = kmG$, Bob computes $m\\red{A} = mkG$: the same point <span class="c-yellow">$S$</span>. Eve sees $A$ and $B$, but without $k$ or $m$ she gets no further. Why curves, if there are powers? Because the way back is harder, numbers of $256$ bits are enough instead of $3072$: keys are $12$ times shorter. Most HTTPS connections, messengers and Bitcoin signatures work this way.',
        ru: 'Теперь Диффи — Хеллман слово в слово, только степени заменены шагами. Все знают кривую, $p$ и точку $G$. Алиса выбирает секрет $k$ и отправляет точку $\\red{A} = kG$, Боб выбирает $m$ и отправляет $\\blue{B} = mG$. Алиса считает $k\\blue{B} = kmG$, Боб — $m\\red{A} = mkG$: это одна и та же точка <span class="c-yellow">$S$</span>. Ева видит $A$ и $B$, но без $k$ или $m$ дальше не продвинется. Зачем кривые, если есть степени? Обратный путь здесь труднее, поэтому хватает чисел в $256$ бит вместо $3072$: ключи в $12$ раз короче. Так устроено большинство HTTPS-соединений, мессенджеры и подписи в биткоине.',
      },
      try: { en: 'Change $k$ and $m$: both ways to $S$ agree.', ru: 'Меняйте $k$ и $m$: оба пути к $S$ сходятся.' },
      check: {
        q: { en: 'What can Eve get from $A$ and $B$ on her own?', ru: 'Что Ева может получить из $A$ и $B$ сама?' },
        options: [
          { text: { en: '$A + B = (k + m)G$ — but not $kmG$', ru: '$A + B = (k + m)G$ — но не $kmG$' }, ok: true },
          { text: '$S$' },
          { text: { en: '$k$ and $m$', ru: '$k$ и $m$' } },
        ],
        explain: {
          en: 'Points can be added, but not multiplied by each other: $A$ and $B$ give only $(k + m)G$. To get $kmG$ she needs $k$ from $A$ — the discrete logarithm.',
          ru: 'Точки можно складывать, но не умножать друг на друга: из $A$ и $B$ получается только $(k + m)G$. Чтобы получить $kmG$, нужно найти $k$ по $A$ — тот самый дискретный логарифм.',
        },
      },
      state: { show: ['ecdh'], params: { k: 6, m: 15 }, window: MODW, controls: ['k', 'm'] },
    },
    {
      title: { en: 'Add two points', ru: 'Сложите две точки' },
      text: {
        en: 'On $y^2 = x^3 - x + 1$ find $\\blue{P} + \\red{Q}$ for $P = (0;\\ -1)$ and $Q = (1;\\ 1)$. Put the yellow point where the sum is.',
        ru: 'На кривой $y^2 = x^3 - x + 1$ найдите $\\blue{P} + \\red{Q}$ для $P = (0;\\ -1)$ и $Q = (1;\\ 1)$. Поставьте жёлтую точку туда, где сумма.',
      },
      task: {
        kind: 'drag',
        target: { X: S.p3m5 },
        tol: 0.05,
        back: 2,
        right: {
          en: 'The line $y = 2x - 1$: $x^3 - x + 1 = (2x - 1)^2$ gives $x(x - 1)(x - 3) = 0$. The third point is $(3;\\ 5)$; reflected, $P + Q = (3;\\ -5)$.',
          ru: 'Прямая $y = 2x - 1$: $x^3 - x + 1 = (2x - 1)^2$ даёт $x(x - 1)(x - 3) = 0$. Третья точка — $(3;\\ 5)$, отражаем: $P + Q = (3;\\ -5)$.',
        },
        mistakes: [
          { params: { X: S.p3p5 }, text: { en: 'This is the third point $R$ of the line. The sum is $R$ reflected in the $x$ axis.', ru: 'Это третья точка прямой $R$. Сумма — это $R$, отражённая относительно оси $x$.' } },
        ],
        hints: {
          X: X => {
            const [x, y] = onCurve(X);
            return {
              en: `Your point is $${ptR([x, y])}$. The line has slope $\\frac{1 - (-1)}{1 - 0} = 2$; its third point has $x = 2^2 - 0 - 1$.`,
              ru: `Ваша точка — $${ptR([x, y])}$. Наклон прямой $\\frac{1 - (-1)}{1 - 0} = 2$; у третьей точки $x = 2^2 - 0 - 1$.`,
            };
          },
        },
      },
      state: { show: ['taskSum'], params: { X: 0 }, window: TASKW, controls: [] },
    },
    {
      title: { en: 'Double a point', ru: 'Удвойте точку' },
      text: {
        en: 'Find $2\\blue{P}$ for $P = (1;\\ -1)$. Now there is no line on the picture — imagine the tangent.',
        ru: 'Найдите $2\\blue{P}$ для $P = (1;\\ -1)$. Прямой на картинке нет — представьте касательную сами.',
      },
      task: {
        kind: 'drag',
        target: { X: S.m1m1 },
        tol: 0.05,
        back: 3,
        right: {
          en: 'The slope $\\lambda = \\frac{3 \\cdot 1 - 1}{2 \\cdot (-1)} = -1$, the tangent $y = -x$: $x^3 - x + 1 = x^2$, $(x - 1)^2(x + 1) = 0$. The third point is $(-1;\\ 1)$, so $2P = (-1;\\ -1)$ — the mirror image of $2 \\cdot (1;\\ 1)$, as it should be.',
          ru: 'Наклон $\\lambda = \\frac{3 \\cdot 1 - 1}{2 \\cdot (-1)} = -1$, касательная $y = -x$: $x^3 - x + 1 = x^2$, $(x - 1)^2(x + 1) = 0$. Третья точка — $(-1;\\ 1)$, значит $2P = (-1;\\ -1)$ — отражение $2 \\cdot (1;\\ 1)$, как и должно быть.',
        },
        mistakes: [
          { params: { X: S.m11 }, text: { en: 'This is where the tangent meets the curve again — the third point. Reflect it.', ru: 'Здесь касательная снова встречает кривую — это третья точка. Её нужно отразить.' } },
          { params: { X: S.p11 }, text: { en: 'This is $-P$, the mirror of $P$ itself: $P + (-P) = O$, not $2P$. Draw the tangent at $P$ first.', ru: 'Это $-P$, отражение самой $P$: $P + (-P) = O$, а не $2P$. Сначала проведите касательную в $P$.' } },
        ],
        hints: {
          X: { en: 'The slope of the tangent is $\\lambda = \\frac{3x^2 - 1}{2y}$ at $x = 1$, $y = -1$. Then the third point, then the mirror.', ru: 'Наклон касательной $\\lambda = \\frac{3x^2 - 1}{2y}$ при $x = 1$, $y = -1$. Потом третья точка, потом отражение.' },
        },
      },
      state: { show: ['taskDouble'], params: { X: 0 }, window: TASKW, controls: [] },
    },
    {
      title: { en: 'Be Eve', ru: 'Побудьте Евой' },
      text: {
        en: 'Eve caught Alice\'s point $\\red{A} = (12;\\ 8)$ on the curve modulo $29$. Find the secret $x$ with $xG = A$ — there is no other way than to try.',
        ru: 'Ева перехватила точку Алисы $\\red{A} = (12;\\ 8)$ на кривой по модулю $29$. Найдите секрет $x$, при котором $xG = A$, — других способов, кроме перебора, нет.',
      },
      task: {
        kind: 'drag',
        target: { x: 13 },
        back: 7,
        right: {
          en: '$13G = (12;\\ 8)$. The yellow point jumped with no pattern, and only trying helped. With $256$-bit numbers there are about $10^{77}$ points to try.',
          ru: '$13G = (12;\\ 8)$. Жёлтая точка скакала без всякого порядка, и помог только перебор. С числами в $256$ бит перебирать пришлось бы около $10^{77}$ точек.',
        },
        mistakes: [
          { params: { x: 24 }, text: { en: 'This is $(12;\\ 21)$ — the mirror image $-A$: $24 = 37 - 13$ steps. Same $x$, other $y$.', ru: 'Это $(12;\\ 21)$ — отражение $-A$: $24 = 37 - 13$ шагов. Та же $x$, но другая $y$.' } },
        ],
        hints: {
          x: x => {
            const P = MULT[I(x)];
            return { en: `$${I(x)}G = ${P ? pt(P) : 'O'}$, not $(12;\\ 8)$. Keep trying.`, ru: `$${I(x)}G = ${P ? pt(P) : 'O'}$, а не $(12;\\ 8)$. Пробуйте дальше.` };
          },
        },
      },
      state: { show: ['taskEve'], params: { x: 1 }, window: MODW, controls: ['x'] },
    },
  ],
};
