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
