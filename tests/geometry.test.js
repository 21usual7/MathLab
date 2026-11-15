import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apex } from '../js/topics/angles-parallel.js';
import { meet } from '../js/topics/congruent.js';
import { third } from '../js/topics/law-of-cosines.js';
import { angle } from '../js/topics/inscribed.js';
import { between } from '../js/topics/perpendicular.js';
import { toEdge } from '../js/topics/distances.js';
import { solid, net } from '../js/topics/polyhedra.js';
import { thirds } from '../js/topics/volumes.js';
import { traceOf } from '../js/topics/parallel.js';

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);
const D = Math.PI / 180;

test('plane geometry: the task answers', () => {
  // A = 40°, B = 50° on base AB = 6: the angle at C is right
  const C = apex(40, 50), A = [-3, 0], B = [3, 0];
  near((A[0] - C[0]) * (B[0] - C[0]) + (A[1] - C[1]) * (B[1] - C[1]), 0);
  near(apex(40, 130)[1] > 0 ? 1 : 0, 1); // an obtuse base angle still gives an apex above
  // Two sticks 2 and 3 meet; side-side-angle closes in two places
  meet([0, 0], 2, [4, 0], 3).forEach(P => { near(Math.hypot(...P), 2); near(Math.hypot(P[0] - 4, P[1]), 3); });
  // SAS task: 4, 3 and 60° → √13; law of cosines task: 3, 5 and 120° → 7
  near(third(4, 3, 60), Math.sqrt(13)); near(third(3, 5, 120), 7); near(third(3, 4, 90), 5);
  // Inscribed angle: the player at 90°, posts at 200° and 260° see 30°, central 60°
  const on = d => [2.5 * Math.cos(d * D), 2.5 * Math.sin(d * D)];
  near(angle(on(90), on(200), on(260)), 30, 1e-6); near(angle([0, 0], on(200), on(260)), 60, 1e-6);
  near(angle(on(140), on(180), on(0)), 90, 1e-6); // Thales
  // Similar triangles: H / 6 = 1 / 0.8
  near(6 / 0.8, 7.5);
});

test('solid geometry: the task answers', () => {
  // Three perpendiculars: l at 135° is perpendicular to OA = (2, 2) and to PA = (2, 2, −3)
  const l = [Math.cos(135 * D), Math.sin(135 * D), 0];
  near(between(l, [2, 2, 0]), 90, 1e-9); near(between(l, [2, 2, -3]), 90, 1e-9);
  // MN level at the same height: no trace; lower N: a trace
  assert.equal(traceOf([0, 0, 0.5], [3, 3, 0.5]), null); assert.ok(traceOf([0, 0, 0.5], [3, 3, -0.5]) !== null);
  // The closest point of BD to AA₁ is the middle: 3/√2
  near(toEdge([0, 0, -1.5]), 3 / Math.sqrt(2)); assert.ok(toEdge([1.5, -1.5, -1.5]) > 3 / Math.sqrt(2));
  // Euler for every prism and pyramid; a prism has 3n edges
  for (let n = 3; n <= 9; n++) for (const k of [0, 1]) {
    const P = solid(n, k);
    assert.equal(Object.keys(P.V).length - P.edges.length + P.faces.length, 2);
    if (k === 0) assert.equal(P.edges.length, 3 * n);
  }
  // The net lies flat at the end, and the folded net is the cube
  net(1).flat().forEach(p => near(p[2], -1)); net(0).flat().forEach(p => assert.ok(p[2] >= -1 - 1e-9 && p[2] <= 1 + 1e-9));
  // The three pyramids: each a third of the cube
  const s = 2.4;
  thirds(s).forEach(({ P, base }) => {
    const n = [base[1], base[2]].map(q => [q[0] - base[0][0], q[1] - base[0][1], q[2] - base[0][2]]);
    const N = [n[0][1] * n[1][2] - n[0][2] * n[1][1], n[0][2] * n[1][0] - n[0][0] * n[1][2], n[0][0] * n[1][1] - n[0][1] * n[1][0]];
    const h = Math.abs(N[0] * (P[0] - base[0][0]) + N[1] * (P[1] - base[0][1]) + N[2] * (P[2] - base[0][2])) / Math.hypot(...N);
    near(s * s * h / 3, s ** 3 / 3);
  });
});
