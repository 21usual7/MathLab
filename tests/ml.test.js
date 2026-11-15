import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cloud, mse, mseGrad, bestLine, descend, twoClouds, score, sigma, logloss, loglossGrad, correct,
  ring, initNet, copyNet, forward, netLoss, trainStep, trainFilm, wave, polyFit, meanErr,
  ellipseCloud, pancake, covariance, spreadAlong, eigenSym,
} from '../js/topics/ml-math.js';

const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

test('regression: the bowl, its bottom and the descent', () => {
  const P = cloud(), B = bestLine(P);
  // The best line goes through the centre of the cloud, and the bowl is flat there
  assert.ok(near(B.w * B.mx + B.b, B.my));
  assert.ok(mseGrad(P, B.w, B.b).every(g => near(g, 0, 1e-9)));
  assert.ok(near(B.w, 0.631, 1e-3) && near(B.b, 0.874, 1e-3) && near(mse(P, B.w, B.b), 0.225, 1e-3));
  // The gradient is the slope: compare with finite differences
  const [gw, gb] = mseGrad(P, -0.3, 2), h = 1e-6;
  assert.ok(near(gw, (mse(P, -0.3 + h, 2) - mse(P, -0.3 - h, 2)) / (2 * h), 1e-5));
  assert.ok(near(gb, (mse(P, -0.3, 2 + h) - mse(P, -0.3, 2 - h)) / (2 * h), 1e-5));
  // The texts: η = 0.1 and 0.25 get down, 0.35 flies out; ten steps are enough for η in 0.14 … 0.28
  const run = (eta, n, S = P) => descend((w, b) => mseGrad(S, w, b), [-1.2, -2.6], eta, n);
  assert.ok(mse(P, ...run(0.1, 40).at(-1)) < 0.226);
  assert.ok(mse(P, ...run(0.25, 40).at(-1)) < 0.226);
  assert.ok(run(0.35, 40).length < 41 || mse(P, ...run(0.35, 40).at(-1)) > 1e3);
  for (const eta of [0.14, 0.2, 0.28]) assert.ok(mse(P, ...run(eta, 10)[10]) < 0.25, `eta ${eta}`);
  for (const eta of [0.1, 0.32]) assert.ok(!(mse(P, ...run(eta, 10).at(-1)) < 0.25), `eta ${eta}`);
  // A shifted cloud: the same best line, but η = 0.1 flies out and 0.05 has not reached the bottom in 40 steps
  const S = cloud(3), BS = bestLine(S);
  assert.ok(near(BS.w, B.w));
  assert.ok(run(0.1, 40, S).length < 41 || mse(S, ...run(0.1, 40, S).at(-1)) > 1e3);
  assert.ok(mse(S, ...run(0.05, 40, S).at(-1)) > 0.25);
});

test('classification: separable spam, the confidence, the gradient', () => {
  const D = twoClouds(), f = m => (x, y) => sigma(score(m, x, y));
  assert.equal(D.length, 26);
  assert.equal(correct(D, f([0.62, 0.79, -0.11])), 26); // the answer of the first task
  // The second task: c = 0.64 gives p(Q) = 0.9
  const m = [0.62, 0.79, -0.11].map(v => v * 0.64);
  assert.ok(Math.abs(sigma(score(m, 2.4, 2.6)) - 0.9) < 0.015);
  // The log loss gradient is right, and descent from the bad start separates everything
  const m0 = [-1, 0.6, 1.5], g = loglossGrad(D, m0), h = 1e-6;
  g.forEach((gi, i) => {
    const a = m0.slice(), b = m0.slice();
    a[i] += h; b[i] -= h;
    assert.ok(near(gi, (logloss(D, a) - logloss(D, b)) / (2 * h), 1e-5));
  });
  const end = descend((a, b, c) => loglossGrad(D, [a, b, c]), m0, 1, 60).at(-1);
  assert.equal(correct(D, f(end)), 26);
  assert.ok(logloss(D, end) < logloss(D, m0) / 10);
});

test('network: backpropagation is the chain rule', () => {
  const R = ring(), net = initNet(3, 1), h = 1e-6;
  // One step with a tiny η moves every weight by −η·(its slope): compare with finite differences of the loss
  const eta = 1e-3, after = copyNet(net);
  trainStep(after, R, eta);
  const slope = (get, set) => {
    const a = copyNet(net), b = copyNet(net);
    set(a, get(a) + h); set(b, get(b) - h);
    return (netLoss(a, R) - netLoss(b, R)) / (2 * h);
  };
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) assert.ok(near((net.W[i][j] - after.W[i][j]) / eta, slope(n => n.W[i][j], (n, v) => { n.W[i][j] = v; }), 1e-4));
    assert.ok(near((net.b[i] - after.b[i]) / eta, slope(n => n.b[i], (n, v) => { n.b[i] = v; }), 1e-4));
    assert.ok(near((net.v[i] - after.v[i]) / eta, slope(n => n.v[i], (n, v) => { n.v[i] = v; }), 1e-4));
  }
  assert.ok(near((net.c - after.c) / eta, slope(n => n.c, (n, v) => { n.c = v; }), 1e-4));
});

test('network: the ring, the triangle of folds, training', () => {
  const R = ring(), acc = n => correct(R, (x, y) => forward(n, x, y).out);
  assert.equal(R.length, 70);
  // The hand-made network of the topic: three folds at distance d, the output blue where none fires
  const hand = (t0, d) => ({ W: [0, 1, 2].map(i => [Math.cos(t0 + 2.094 * i), Math.sin(t0 + 2.094 * i)]), b: [-d, -d, -d], v: [-6, -6, -6], c: 1.5 });
  for (let t0 = 0; t0 < 2.1; t0 += 0.1) assert.equal(acc(hand(t0, 1.1)), 70);
  assert.ok(acc(hand(1.57, 1.6)) < 70); // too far out: the corners reach the ring
  // Inside the triangle every point goes to the corner (0; 0; 0)
  R.filter(p => p[2]).forEach(([x, y]) => assert.deepEqual(forward(hand(1.57, 1.1), x, y).h, [0, 0, 0]));
  // Training: seed 1 gets everything, seed 10 is stuck in a valley; 3 … 8 neurons all separate the ring
  assert.equal(acc(trainFilm(initNet(3, 1), R, 0.05, 3000, 20).at(-1).net), 70);
  assert.ok(acc(trainFilm(initNet(3, 10), R, 0.05, 3000, 20).at(-1).net) <= 66);
  for (let H = 3; H <= 8; H++) assert.equal(acc(trainFilm(initNet(H, 1), R, 0.05, 3000, 3000).at(-1).net), 70, `H = ${H}`);
});

test('overfitting: the U of the error on new points', () => {
  const tr = wave(3, 10), te = wave(103, 30);
  const errs = Array.from({ length: 10 }, (_, d) => { const f = polyFit(tr, d); return [meanErr(tr, f), meanErr(te, f)]; });
  // The training error never grows with the degree and is zero at degree 9: through ten points
  errs.slice(1).forEach(([e], d) => assert.ok(e <= errs[d][0] + 1e-9));
  assert.ok(errs[9][0] < 1e-6);
  const f9 = polyFit(tr, 9);
  tr.forEach(([x, y]) => assert.ok(near(f9(x), y, 1e-3)));
  // The error on new points has its bottom at degree 4 and explodes at 9
  const best = errs.reduce((b, e, d) => (e[1] < errs[b][1] ? d : b), 0);
  assert.equal(best, 4);
  assert.ok(errs[9][1] > 10);
  // The penalty: λ = 10^−3 beats every degree, the task window is 10^−3.6 … 10^−1.6; forty points calm degree 9
  assert.ok(meanErr(te, polyFit(tr, 9, 1e-3)) < errs[4][1]);
  for (const l of [-3.6, -3, -2, -1.6]) assert.ok(meanErr(te, polyFit(tr, 9, 10 ** l)) < 0.2, `lam ${l}`);
  for (const l of [-5, -1]) assert.ok(!(meanErr(te, polyFit(tr, 9, 10 ** l)) < 0.2), `lam ${l}`);
  assert.ok(meanErr(te, polyFit(wave(3, 40), 9)) < 0.25);
});

test('pca: eigenvectors of the covariance are the widest and the narrowest shadows', () => {
  const E = ellipseCloud(), C = covariance(E), [e1, e2] = eigenSym(C), total = C[0][0] + C[1][1];
  [e1, e2].forEach(({ value, vector: v }) => {
    const Cv = [C[0][0] * v[0] + C[0][1] * v[1], C[1][0] * v[0] + C[1][1] * v[1]];
    assert.ok(near(Cv[0], value * v[0]) && near(Cv[1], value * v[1]));
    assert.ok(near(spreadAlong(C, v), value));
  });
  assert.ok(near(e1.value + e2.value, total));
  // Over all directions: along + across = total, the top is e1, the bottom is perpendicular to it
  let top = 0, bottom = 0;
  for (let k = 0; k < 1800; k++) {
    const a = Math.PI * k / 1800, u = [Math.cos(a), Math.sin(a)], s = spreadAlong(C, u), n = spreadAlong(C, [-u[1], u[0]]);
    assert.ok(near(s + n, total));
    if (s > spreadAlong(C, [Math.cos(top), Math.sin(top)])) top = a;
    if (s < spreadAlong(C, [Math.cos(bottom), Math.sin(bottom)])) bottom = a;
  }
  assert.ok(Math.abs(Math.sin(top - Math.atan2(e1.vector[1], e1.vector[0]))) < 2e-3);
  assert.ok(Math.abs(Math.cos(top - bottom)) < 2e-3);
  // The regression line is flatter than the component (regression to the mean)
  assert.ok(bestLine(E).w < e1.vector[1] / e1.vector[0]);
  // The pancake: two components keep 99 %, one only 78 %
  const p = eigenSym(covariance(pancake())).map(e => e.value), sum = p[0] + p[1] + p[2];
  assert.ok(Math.abs(p[0] / sum - 0.778) < 0.005 && (p[0] + p[1]) / sum > 0.99);
});
