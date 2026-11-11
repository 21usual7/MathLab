// Solid geometry without drawing: vectors, convex polyhedra with named vertices (as in a school book:
// ABCDA₁B₁C₁D₁), planes and sections. Points are arrays [x, y, z]; z is up.

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = a => Math.hypot(a[0], a[1], a[2]);
export const norm = a => mul(a, 1 / len(a));
export const lerp = (a, b, t) => add(a, mul(sub(b, a), t));
export const dist = (a, b) => len(sub(a, b));
export const avg = pts => mul(pts.reduce(add, [0, 0, 0]), 1 / pts.length);

const EPS = 1e-9;

// A convex polyhedron from named vertices and faces (each face: vertex names in order around it).
// Adds what drawing and constructions need: outward normals and centres of faces, edges with their faces.
export function polyhedron(V, F) {
  const center = avg(Object.values(V));
  const faces = F.map(names => {
    const pts = names.map(n => V[n]);
    const c = avg(pts);
    let n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
    if (dot(n, sub(c, center)) < 0) n = mul(n, -1);
    return { names, pts, c, n };
  });
  const map = new Map();
  faces.forEach((f, i) => f.names.forEach((a, k) => {
    const b = f.names[(k + 1) % f.names.length];
    const key = [a, b].sort().join('|');
    if (!map.has(key)) map.set(key, { a, b, faces: [] });
    map.get(key).faces.push(i);
  }));
  return { V, faces, edges: [...map.values()], center };
}

// Cube ABCDA₁B₁C₁D₁ with edge s centred at the origin: ABCD at the bottom (A front left, counter-clockwise
// seen from above), A₁ above A and so on.
export function cube(s = 3) {
  const h = s / 2;
  const V = {
    A: [-h, -h, -h], B: [h, -h, -h], C: [h, h, -h], D: [-h, h, -h],
    A1: [-h, -h, h], B1: [h, -h, h], C1: [h, h, h], D1: [-h, h, h],
  };
  return polyhedron(V, [
    ['A', 'B', 'C', 'D'], ['A1', 'B1', 'C1', 'D1'],
    ['A', 'B', 'B1', 'A1'], ['B', 'C', 'C1', 'B1'], ['C', 'D', 'D1', 'C1'], ['D', 'A', 'A1', 'D1'],
  ]);
}

// Regular quadrilateral pyramid SABCD: square base with side s, height H
export function pyramid(s = 3, H = 3) {
  const h = s / 2, z = -H / 2;
  const V = { A: [-h, -h, z], B: [h, -h, z], C: [h, h, z], D: [-h, h, z], S: [0, 0, z + H] };
  return polyhedron(V, [['A', 'B', 'C', 'D'], ['A', 'B', 'S'], ['B', 'C', 'S'], ['C', 'D', 'S'], ['D', 'A', 'S']]);
}

// Regular tetrahedron DABC with edge s, base ABC at the bottom
export function tetrahedron(s = 3.4) {
  const r = s / Math.sqrt(3), H = s * Math.sqrt(2 / 3), z = -H / 3;
  const at = k => [r * Math.cos(-Math.PI / 2 - Math.PI / 6 + k * 2 * Math.PI / 3), r * Math.sin(-Math.PI / 2 - Math.PI / 6 + k * 2 * Math.PI / 3), z];
  const V = { A: at(0), B: at(1), C: at(2), D: [0, 0, z + H] };
  return polyhedron(V, [['A', 'B', 'C'], ['A', 'B', 'D'], ['B', 'C', 'D'], ['C', 'A', 'D']]);
}

// Plane through three points: { n (unit normal), d } with dot(n, X) = d; null if they are on one line
export function plane3(p, q, r) {
  const c = cross(sub(q, p), sub(r, p));
  if (len(c) < EPS) return null;
  const n = norm(c);
  return { n, d: dot(n, p) };
}

export const side = (pl, p) => dot(pl.n, p) - pl.d;

// Section of a convex polyhedron by a plane: the polygon's corners in order around it ([] if the plane
// misses the solid or only touches it)
export function section(poly, pl) {
  if (!pl) return [];
  const pts = [];
  const push = p => { if (!pts.some(q => dist(p, q) < 1e-7)) pts.push(p); };
  for (const e of poly.edges) {
    const A = poly.V[e.a], B = poly.V[e.b], da = side(pl, A), db = side(pl, B);
    if (Math.abs(da) < EPS) push(A);
    if (Math.abs(db) < EPS) push(B);
    if (da * db < 0 && Math.abs(da) > EPS && Math.abs(db) > EPS) push(lerp(A, B, da / (da - db)));
  }
  if (pts.length < 3) return [];
  const c = avg(pts), u = norm(sub(pts[0], c)), w = cross(pl.n, u);
  return pts.sort((p, q) => Math.atan2(dot(sub(p, c), w), dot(sub(p, c), u)) - Math.atan2(dot(sub(q, c), w), dot(sub(q, c), u)));
}

// Faces a point lies on (indices)
export const facesOf = (poly, p) => poly.faces.map((f, i) => (Math.abs(dot(f.n, sub(p, f.c))) < 1e-6 ? i : -1)).filter(i => i >= 0);

// Faces turned towards the eye
export const frontFaces = (poly, eye) => poly.faces.map(f => dot(f.n, sub(eye, f.c)) > 0);

// Names of polygons by the number of sides
export const POLYGON = {
  en: ['', '', '', 'triangle', 'quadrilateral', 'pentagon', 'hexagon'],
  ru: ['', '', '', 'треугольник', 'четырёхугольник', 'пятиугольник', 'шестиугольник'],
};
