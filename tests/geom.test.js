import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cube, pyramid, tetrahedron, plane3, section, facesOf, frontFaces, lerp, dist, dot, sub } from '../js/core/geom.js';

const C = cube(2); // vertices at ±1

test('polyhedra', () => {
  assert.equal(C.faces.length, 6);
  assert.equal(C.edges.length, 12);
  assert.ok(C.edges.every(e => e.faces.length === 2));
  // Outward normals: the top face points up
  assert.deepEqual(C.faces[1].n.map(Math.round), [0, 0, 1]);
  assert.equal(pyramid().edges.length, 8);
  const T = tetrahedron();
  assert.equal(T.edges.length, 6);
  // All edges of a regular tetrahedron are equal
  const L = T.edges.map(e => dist(T.V[e.a], T.V[e.b]));
  assert.ok(L.every(l => Math.abs(l - L[0]) < 1e-9));
});

test('sections of a cube', () => {
  const sec = (a, b, c) => section(C, plane3(a, b, c));
  // Through three neighbours of A: a triangle
  assert.equal(sec(C.V.A1, C.V.B, C.V.D).length, 3);
  // Diagonal section ACC₁A₁: a rectangle 2√2 × 2
  const r = sec(C.V.A, C.V.C, C.V.C1);
  assert.equal(r.length, 4);
  // Middle plane x + y + z = 0 through the centre: a regular hexagon
  const h = sec([1, -1, 0], [0, 1, -1], [-1, 0, 1]);
  assert.equal(h.length, 6);
  const sides = h.map((p, i) => dist(p, h[(i + 1) % 6]));
  assert.ok(sides.every(s => Math.abs(s - sides[0]) < 1e-9));
  // A plane outside the cube or touching only a vertex
  assert.equal(sec([5, 0, 0], [5, 1, 0], [5, 0, 1]).length, 0);
  // Ordered around: consecutive corners share a face
  for (let i = 0; i < h.length; i++) {
    const f1 = facesOf(C, h[i]), f2 = facesOf(C, h[(i + 1) % h.length]);
    assert.ok(f1.some(f => f2.includes(f)));
  }
  // Through the middle of AA₁, B₁ and D₁ only the corner A₁ is cut off: a triangle
  const P = lerp(C.V.A, C.V.A1, 0.5);
  assert.equal(sec(P, C.V.B1, C.V.D1).length, 3);
  // Through the middle of AA₁, B and D₁: the plane cuts four faces through A, B and D₁ — a quadrilateral (a rhombus)
  const q = sec(P, C.V.B, C.V.D1);
  assert.equal(q.length, 4);
  const qs = q.map((p, i) => dist(p, q[(i + 1) % 4]));
  assert.ok(qs.every(s => Math.abs(s - qs[0]) < 1e-9));
});

test('visibility', () => {
  // Seen from far above only the top face is in front
  const f = frontFaces(C, [0, 0, 50]);
  assert.deepEqual(f, [false, true, false, false, false, false]);
  assert.equal(plane3([0, 0, 0], [1, 1, 1], [2, 2, 2]), null);
});

test('linear algebra in space', async () => {
  const { apply, det3, box, clipLine, meet2, meet3 } = await import('../js/core/geom.js');
  // Columns: M·(1; 1; 1) is the sum of the columns
  assert.deepEqual(apply([1, 0, 1], [1, 1, 0], [0, 0, 2], [1, 1, 1]), [2, 1, 3]);
  // det is the signed volume: a stretch multiplies, a swap of columns flips the sign, a flat box has 0
  assert.equal(det3([2, 0, 0], [0, 3, 0], [0, 0, 0.5]), 3);
  assert.equal(det3([0, 1, 0], [1, 0, 0], [0, 0, 1]), -1);
  assert.equal(det3([1, 0, 0.5], [0, 1, 0.5], [1, 1, 1]), 0);
  // A plane through the middle of the box cuts it in a square; a slanted one in a hexagon
  assert.equal(section(box(4, 4), { n: [0, 0, 1], d: 1 }).length, 4);
  assert.equal(section(box(4, 4), { n: [1, 1, 1], d: 0 }).length, 6);
  // A line clipped by the box
  assert.deepEqual(clipLine([0, 0, 0], [1, 1, 0], 4, 4), [[-4, -4, 0], [4, 4, 0]]);
  assert.equal(clipLine([0, 0, 9], [1, 0, 0], 4, 4), null);
  // Two planes meet along a line, three in a point; parallel normals give nothing
  const m = meet2([1, 1, 1], 3, [1, -1, 1], 1);
  assert.deepEqual(m.p, [1, 1, 1]);
  assert.equal(dot(m.u, [1, 1, 1]), 0);
  assert.deepEqual(meet3([1, 1, 1], 3, [1, -1, 1], 1, [2, 1, -1], 2).map(v => Math.round(v * 1e9) / 1e9), [1, 1, 1]);
  assert.equal(meet3([1, 1, 1], 3, [1, -1, 1], 1, [2, 0, 2], 2), null);
});
