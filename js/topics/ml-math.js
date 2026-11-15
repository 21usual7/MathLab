// The math of the machine learning topics, without the drawing (checked by tests/ml.test.js).
// Data sets are made from a fixed seed: every student sees the same cloud, and the numbers in the texts hold.
//   regression — a cloud of points, the mean squared error of a line, its gradient, gradient descent
//   logistic   — two classes, a line with a probability on each side, the log loss and its descent
//   network    — 2 inputs → H ReLU neurons → 1 output with a sigmoid, trained by backpropagation
//   polynomial — least squares with a penalty λ (overfitting); PCA — the covariance matrix and its axes

// ---- Random numbers from a seed ----
export function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const gauss = r => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
export const sigma = s => 1 / (1 + Math.exp(-s));
const mean = a => a.reduce((m, v) => m + v, 0) / a.length;

// ---- Linear regression ----

// Twelve points around y = 0.6x + 1; shift moves the whole cloud along x (the stretched bowl)
export function cloud(shift = 0) {
  const r = rng(7);
  return Array.from({ length: 12 }, (_, i) => {
    const x = -3 + 6 * (i + 0.2 + 0.6 * r()) / 12;
    return [x + shift, 0.6 * x + 1 + 0.55 * gauss(r)];
  });
}
export const mse = (pts, w, b) => mean(pts.map(([x, y]) => (w * x + b - y) ** 2));
// ∂L/∂w = 2·mean(r·x), ∂L/∂b = 2·mean(r), r = wx + b − y: the residuals pull the line
export const mseGrad = (pts, w, b) => [2 * mean(pts.map(([x, y]) => (w * x + b - y) * x)), 2 * mean(pts.map(([x, y]) => w * x + b - y))];
// The best line: through the centre of the cloud, slope cov(x, y) / var(x)
export function bestLine(pts) {
  const mx = mean(pts.map(p => p[0])), my = mean(pts.map(p => p[1]));
  const w = mean(pts.map(([x, y]) => (x - mx) * (y - my))) / mean(pts.map(([x]) => (x - mx) ** 2));
  return { w, b: my - w * mx, mx, my };
}
// Gradient descent from (w, b): the path [[w, b], ...] of n steps (stops when it runs away)
export function descend(grad, start, eta, n) {
  const path = [start.slice()];
  let p = start.slice();
  for (let k = 0; k < n; k++) {
    const g = grad(...p);
    p = p.map((v, i) => v - eta * g[i]);
    if (!p.every(v => isFinite(v) && Math.abs(v) < 1e6)) break;
    path.push(p);
  }
  return path;
}
// A point of a path at a fractional step k: steps are drawn as smooth moves
export function along(path, k) {
  const i = Math.max(0, Math.min(path.length - 1, Math.floor(k))), j = Math.min(path.length - 1, i + 1), f = Math.max(0, Math.min(1, k - i));
  return path[i].map((v, n) => v + (path[j][n] - v) * f);
}

// ---- Logistic regression: two classes in the plane ----

// Spam (1) and not spam (0): two clouds that a line can separate
export function twoClouds() {
  const r = rng(40), pts = [];
  for (let i = 0; i < 26; i++) {
    const c = i % 2;
    const [cx, cy] = c ? [1.3, 1.1] : [-1.3, -0.9];
    pts.push([cx + 0.95 * gauss(r), cy + 0.95 * gauss(r), c]);
  }
  return pts;
}
// Score s = w1·x + w2·y + b; the probability of class 1 is σ(s)
export const score = ([w1, w2, b], x, y) => w1 * x + w2 * y + b;
// Log loss: the mean surprise −ln p(of the true class); confident mistakes cost the most
export const logloss = (pts, m) => mean(pts.map(([x, y, c]) => {
  const p = sigma(score(m, x, y));
  return -Math.log(Math.max(1e-12, c ? p : 1 - p));
}));
// Its gradient is as simple as for squares: (p − c) times the input
export const loglossGrad = (pts, m) => {
  const g = [0, 0, 0];
  for (const [x, y, c] of pts) {
    const e = sigma(score(m, x, y)) - c;
    g[0] += e * x; g[1] += e * y; g[2] += e;
  }
  return g.map(v => v / pts.length);
};
export const correct = (pts, f) => pts.filter(([x, y, c]) => (f(x, y) > 0.5) === !!c).length;

// ---- A neural network 2 → H → 1: h = ReLU(Wx + b), out = σ(v·h + c) ----

// Blue disc inside (1), orange ring around it (0)
export function ring() {
  const r = rng(5), pts = [];
  for (let i = 0; i < 70; i++) {
    const inner = i % 7 < 3, a = 2 * Math.PI * r();
    const d = inner ? 1.05 * Math.sqrt(r()) : 2.4 + 1.0 * r(); // a triangle of folds fits between them
    pts.push([d * Math.cos(a), d * Math.sin(a), inner ? 1 : 0]);
  }
  return pts;
}
// Random start: lines in all directions near the middle
export function initNet(H, seed) {
  const r = rng(seed);
  return {
    W: Array.from({ length: H }, () => [gauss(r), gauss(r)]),
    b: Array.from({ length: H }, () => 0.5 * gauss(r)),
    v: Array.from({ length: H }, () => 0.5 * gauss(r)),
    c: 0,
  };
}
export const copyNet = n => ({ W: n.W.map(w => w.slice()), b: n.b.slice(), v: n.v.slice(), c: n.c });
// Before the fold (z), after it (h) and the output
export function forward(net, x, y) {
  const z = net.W.map((w, i) => w[0] * x + w[1] * y + net.b[i]);
  const h = z.map(v => Math.max(0, v));
  const s = h.reduce((m, v, i) => m + v * net.v[i], net.c);
  return { z, h, s, out: sigma(s) };
}
export const netLoss = (net, pts) => mean(pts.map(([x, y, c]) => {
  const p = forward(net, x, y).out;
  return -Math.log(Math.max(1e-12, c ? p : 1 - p));
}));
// One step of gradient descent over all points. Backpropagation: the error of the output (p − c)
// goes back through v to every neuron, and only through the neurons that are not folded flat (z > 0)
export function trainStep(net, pts, eta) {
  const H = net.v.length, gW = net.W.map(() => [0, 0]), gb = Array(H).fill(0), gv = Array(H).fill(0);
  let gc = 0;
  for (const [x, y, c] of pts) {
    const { z, h, out } = forward(net, x, y), e = out - c;
    gc += e;
    for (let i = 0; i < H; i++) {
      gv[i] += e * h[i];
      if (z[i] <= 0) continue;
      const back = e * net.v[i];
      gW[i][0] += back * x; gW[i][1] += back * y; gb[i] += back;
    }
  }
  const k = eta / pts.length;
  for (let i = 0; i < H; i++) {
    net.W[i][0] -= k * gW[i][0]; net.W[i][1] -= k * gW[i][1]; net.b[i] -= k * gb[i]; net.v[i] -= k * gv[i];
  }
  net.c -= k * gc;
}
// Training as a film: snapshots of the network after 0, every, 2·every … epochs, with the loss
export function trainFilm(net, pts, eta, epochs, every) {
  const n = copyNet(net), film = [{ net: copyNet(n), loss: netLoss(n, pts) }];
  for (let e = 1; e <= epochs; e++) {
    trainStep(n, pts, eta);
    if (e % every === 0) film.push({ net: copyNet(n), loss: netLoss(n, pts) });
  }
  return film;
}

// ---- Polynomials: least squares with a penalty λ·Σaₖ² (ridge) ----

// The truth is a smooth wave; ten points to learn from and thirty more to test on
export const truth = x => 1.6 * Math.sin(0.9 * x) + 0.25 * x;
export function wave(seed = 3, n = 10) {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const x = -3.4 + 6.8 * (i + 0.15 + 0.7 * r()) / n;
    return [x, truth(x) + 0.45 * gauss(r)];
  });
}
// Solve A·x = y (Gauss with the largest pivot)
export function solve(A, y) {
  const n = y.length, M = A.map((row, i) => [...row, y[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    if (Math.abs(M[c][c]) < 1e-14) return null;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}
// The polynomial of degree d closest to the points (x is scaled by 1/S so that the powers stay sane)
export function polyFit(pts, d, lambda = 0, S = 3.5) {
  const n = d + 1, A = Array.from({ length: n }, () => Array(n).fill(0)), y = Array(n).fill(0);
  for (const [x, v] of pts) {
    const u = x / S, pw = Array.from({ length: n }, (_, k) => u ** k);
    for (let i = 0; i < n; i++) { y[i] += pw[i] * v; for (let j = 0; j < n; j++) A[i][j] += pw[i] * pw[j]; }
  }
  for (let i = 1; i < n; i++) A[i][i] += lambda + 1e-10; // the free term is not penalised
  A[0][0] += 1e-10;
  const a = solve(A, y) || Array(n).fill(0);
  const f = x => { const u = x / S; let s = 0; for (let k = n - 1; k >= 0; k--) s = s * u + a[k]; return s; };
  f.coef = a;
  return f;
}
export const meanErr = (pts, f) => mean(pts.map(([x, y]) => (f(x) - y) ** 2));

// ---- PCA: where a cloud is stretched ----

// A stretched cloud in the plane (heights of fathers and sons, centred) and a flat one in space
export function ellipseCloud(n = 60, seed = 9) {
  const r = rng(seed), a = 0.6;
  return Array.from({ length: n }, () => {
    const u = 1.7 * gauss(r), v = 0.55 * gauss(r);
    return [u * Math.cos(a) - v * Math.sin(a), u * Math.sin(a) + v * Math.cos(a)];
  });
}
export function pancake(n = 90, seed = 4) {
  const r = rng(seed);
  // Long, wide and thin, tilted in space
  const ax = [[0.8, 0.5, 0.33], [-0.52, 0.85, 0], [-0.28, -0.17, 0.94]].map(v => { const L = Math.hypot(...v); return v.map(c => c / L); });
  return Array.from({ length: n }, () => {
    const k = [1.6 * gauss(r), 0.9 * gauss(r), 0.18 * gauss(r)];
    return [0, 1, 2].map(i => ax[0][i] * k[0] + ax[1][i] * k[1] + ax[2][i] * k[2]);
  });
}
export const centre = pts => pts[0].map((_, i) => mean(pts.map(p => p[i])));
// Covariance matrix: how much the coordinates spread and spread together
export function covariance(pts) {
  const m = centre(pts), d = m.length;
  return Array.from({ length: d }, (_, i) => Array.from({ length: d }, (_, j) => mean(pts.map(p => (p[i] - m[i]) * (p[j] - m[j])))));
}
// Spread of the shadows on the direction u (unit): uᵀCu
export const spreadAlong = (C, u) => u.reduce((s, ui, i) => s + ui * u.reduce((t, uj, j) => t + C[i][j] * uj, 0), 0);
// Eigenvectors of a symmetric matrix by Jacobi rotations: [{ value, vector }], largest first
export function eigenSym(C) {
  const n = C.length, A = C.map(r => r.slice()), V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
  for (let sweep = 0; sweep < 50; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] ** 2;
    if (off < 1e-20) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-15) continue;
        const th = 0.5 * Math.atan2(2 * A[p][q], A[q][q] - A[p][p]), c = Math.cos(th), s = Math.sin(th);
        for (let k = 0; k < n; k++) {
          const akp = A[k][p], akq = A[k][q];
          A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k], aqk = A[q][k];
          A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p], vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq;
        }
      }
    }
  }
  return A.map((_, i) => ({ value: A[i][i], vector: V.map(r => r[i]) })).sort((a, b) => b.value - a.value);
}
