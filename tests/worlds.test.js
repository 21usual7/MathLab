import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trace, inside, circleStep, posAt } from '../js/worlds/billiard.js';
import { LANDS, descend, hills, lowest } from '../js/worlds/terrain.js';
import { cross, series } from '../js/worlds/epidemic.js';

test('billiards: reflections stay on the table', () => {
  for (const kind of ['rect', 'circle', 'ellipse', 'stadium']) {
    const p = trace(kind, [0.3, 0.2], 33, { bounces: 2000 });
    assert.equal(p.cushions, 2000);
    assert.ok(p.pts.every(P => inside(kind, P, -1e-6)), kind);
  }
  // Ellipse: a shot from one focus passes through the other after one bounce
  for (const a of [20, 77, 140, 200, 300]) {
    const p = trace('ellipse', [-3.2, 0], a, { bounces: 3, target: { c: [3.2, 0], r: 1e-3 } });
    assert.equal(p.end, 'target', `angle ${a}`);
    assert.equal(p.cushions, 1);
  }
  // Circle: the same step around the circle at every bounce
  const steps = circleStep(trace('circle', [-1.2, -0.4], 30, { bounces: 12 }));
  assert.ok(steps.every(s => Math.abs(s - steps[0]) < 1e-6));
  // The bank shot of the challenge has solutions: exactly two cushions past the partition
  const ok = [];
  for (let a = 0; a < 360; a += 0.1) {
    const p = trace('rect', [-3, -1.2], a, { bounces: 6, obstacles: [[[0, -0.6], [0, 2.2]]], target: { c: [3, 1.3], r: 0.24 } });
    if (p.end === 'target' && p.cushions === 2) ok.push(a);
  }
  assert.ok(ok.length > 5);
  // Stadium: a vertical shot between the flat sides is calm, a slanted one is chaotic
  const apart = (x, a) => {
    const A = trace('stadium', [x, 0.3], a, { bounces: 30 }), B = trace('stadium', [x, 0.3], a + 0.01, { bounces: 30 });
    const [P] = posAt(A, A.total), [Q] = posAt(B, A.total);
    return Math.hypot(P[0] - Q[0], P[1] - Q[1]);
  };
  assert.ok(apart(-1.2, 90) < 0.05);
  assert.ok(apart(-1.2, 37) > 0.5);
});

test('descent: the step window of the canyon', () => {
  // The world stops a try as soon as the height is below 0.01
  const f = LANDS.canyon.f, at = (eta, beta, n) => descend(f, [-3.5, 1.2], eta, beta, n).pts.slice(1).some(P => f(...P) < 0.01);
  assert.ok(at(0.9, 0, 14));
  assert.ok(at(1.0, 0, 14));
  assert.ok(!at(0.6, 0, 14)); // too short: crawls along the bottom
  assert.equal(descend(f, [-3.5, 1.2], 1.2, 0, 30).end, 'out'); // too long: thrown out of the map
  assert.ok(at(1.05, 0.55, 6)); // inertia
  // The fog hills: the lowest valley is a small basin
  const h = hills(31), low = lowest(h);
  let win = 0;
  for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) {
    const d = descend(h, [-3.8 + i * 0.4, -3.8 + j * 0.4], 0.25, 0, 400);
    if (d.end !== 'out' && h(...d.pts.at(-1)) <= low.z + 0.05) win++;
  }
  assert.ok(win > 20 && win < 100, `basin ${win}/400`);
});

test('epidemic: the threshold is near one half', () => {
  assert.ok(series(0.4, 0, 100).P < 0.05);
  assert.ok(series(0.6, 0, 100).P > 0.95);
  assert.ok(series(0.8, 0.4, 100).P < 0.1); // herd immunity
  assert.ok(series(0.8, 0.25, 100).P > 0.8);
  // A full vaccinated wall stops any wave
  const wall = new Uint8Array(64 * 64);
  for (let y = 0; y < 64; y++) wall[y * 64 + 30] = 1;
  assert.equal(cross(1, 0, Math.random, wall).cross, false);
});

test('JPEG: waves, quantization and the challenges', async () => {
  const J = await import('../js/worlds/jpeg-math.js');
  // The DCT is only another way to write the same 64 numbers
  const b = Float64Array.from({ length: 64 }, (_, i) => ((i * 37) % 255) - 128);
  const back = J.idct(J.dct(b));
  assert.ok(b.every((v, i) => Math.abs(v - back[i]) < 1e-9));
  // A single wave has a single coefficient
  const c = J.dct(J.wave(3, 1));
  assert.ok(c.every((v, i) => (i === 1 * 8 + 3 ? Math.abs(v) > 1 : Math.abs(v) < 1e-9)));
  // The zigzag visits every wave once, slow ones first
  assert.equal(new Set(J.ZIGZAG).size, 64);
  assert.deepEqual(J.ZIGZAG.slice(0, 3), [0, 1, 8]);
  // Lower quality — fewer bits, further from the original
  const img = J.sunset(), hi = J.jpeg(img, { qy: 90, gray: true }), lo = J.jpeg(img, { qy: 30, gray: true });
  assert.ok(lo.bits < hi.bits && lo.psnrY < hi.psnrY);
  // «Ten times smaller, unnoticed»: possible near quality 60–70, not at the extremes
  const ok = q => { const r = J.jpeg(img, { qy: q, gray: true }); return r.raw / r.bits >= 10 && r.psnrY >= 37; };
  assert.ok(ok(65));
  assert.ok(!ok(90) && !ok(30));
  // «Colour almost for free»: needs colour at half size; full-size colour is too expensive at any quality
  const col = (qc, sub) => { const r = J.jpeg(img, { qy: 75, qc, sub }); return r.bitsC <= 0.12 * r.bitsY && r.psnrRGB >= 34; };
  assert.ok(col(40, true));
  assert.ok(![5, 20, 40, 75].some(q => col(q, false)));
});

test('PageRank: the eigenvector, the surfer and the challenge', async () => {
  const P = await import('../js/worlds/pagerank-math.js');
  const { BASE } = await import('../js/worlds/pagerank.js');
  const r = P.rank(8, BASE);
  // A probability vector that the flow does not change: r = G r
  assert.ok(Math.abs(r.reduce((a, b) => a + b) - 1) < 1e-9);
  const r2 = P.step(r, 8, BASE);
  assert.ok(r.every((v, i) => Math.abs(v - r2[i]) < 1e-12));
  // The surfer's shares come close to it
  const visits = new Array(8).fill(0);
  let at = 0;
  for (let k = 0; k < 200000; k++) { at = P.surf(at, 8, BASE); visits[at]++; }
  assert.ok(visits.every((v, i) => Math.abs(v / 200000 - r[i]) < 0.01));
  // «Into the top three»: Wiki + News work, Cats + Recipes do not
  const place = (ins, outs = []) => P.places(P.rank(8, [...BASE, ...ins.map(i => [i, 7]), ...outs.map(j => [7, j])]))[7];
  assert.equal(place([]), 8);
  assert.ok(place([0, 1]) <= 3);
  assert.ok(place([0, 2], [0]) <= 3);
  assert.ok(place([5, 6]) > 3);
});
