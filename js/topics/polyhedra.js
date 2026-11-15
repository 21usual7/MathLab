// Polyhedra. A prism is a polygon pulled straight up, a pyramid is a polygon pulled to a point. Count vertices,
// edges and faces: V − E + F = 2 every time (Euler). A cube unfolds into a flat net of six squares — its surface
// area is the area of the net.

import { COLORS } from '../core/palette.js';
import { polyhedron, add } from '../core/geom.js';

const CAMERA = [7, -6, 4.5];
const EDGE = '#c9d1dc';
const NAMES = 'ABCDEFGHK';
const DEG = Math.PI / 180;

// A prism (k = 0) or a pyramid (k = 1) over a regular n-gon of radius r, height h, centred near the origin
export function solid(n, k, r = 1.8, h = 3) {
  const z = -h / 2, at = (i, zz) => [r * Math.cos(2 * Math.PI * i / n - Math.PI / 2 - Math.PI / n), r * Math.sin(2 * Math.PI * i / n - Math.PI / 2 - Math.PI / n), zz];
  const base = [...NAMES.slice(0, n)], V = {};
  base.forEach((b, i) => { V[b] = at(i, z); });
  const F = [base];
  if (k === 0) {
    base.forEach((b, i) => { V[b + '1'] = at(i, z + h); });
    F.push(base.map(b => b + '1'));
    base.forEach((b, i) => { const c = base[(i + 1) % n]; F.push([b, c, c + '1', b + '1']); });
  } else {
    V.S = [0, 0, z + h];
    base.forEach((b, i) => F.push([b, base[(i + 1) % n], 'S']));
  }
  return polyhedron(V, F);
}

// The faces of a cube with edge s unfolding into a net: part m of the way (0 — the cube, 1 — flat)
export function net(m, s = 2, shift = [-1, -2, -1]) {
  const th = m * 90 * DEG, c = Math.cos(th), sn = Math.sin(th);
  const sq = f => [[0, 0], [s, 0], [s, s], [0, s]].map(([a, b]) => add(f(a, b), shift));
  return [
    sq((x, y) => [x, y, 0]), // bottom
    sq((x, z) => [x, -z * sn, z * c]), // front, hinged on y = 0
    sq((x, z) => [x, s + z * sn, z * c]), // back, hinged on y = s
    sq((y, z) => [-z * sn, y, z * c]), // left
    sq((y, z) => [s + z * sn, y, z * c]), // right
    // the top rides on the back face and opens by the same angle again
    sq((x, d) => [x, s + s * sn - d * Math.cos(2 * th), s * c + d * Math.sin(2 * th)]),
  ];
}

const count = P => ({ v: Object.keys(P.V).length, e: P.edges.length, f: P.faces.length });

export default {
  view: '3d',
  view3d: { R: 4, zmax: 4, camera: CAMERA, axes: false },
  lab: false,

  setup(scene) {
    scene.ensureParam('n', 4, { min: 3, max: 9, step: 1 });
    scene.ensureParam('k', 0, { min: 0, max: 1, step: 1 }); // 0 — prism, 1 — pyramid
    scene.ensureParam('m', 0, { min: 0, max: 1, step: 0.01 });

    scene.custom.push(
      {
        id: 'solid',
        draw3d(p, sc, s) { p.polyhedron('solid', solid(Math.round(s.n), Math.round(s.k)), EDGE); },
        legend: s => {
          const { v, e, f } = count(solid(Math.round(s.n), Math.round(s.k)));
          return `V - E + F = ${v} - ${e} + ${f} = ${v - e + f}`;
        },
      },
      {
        id: 'net',
        draw3d(p, sc, s) {
          const colors = [COLORS.blue, COLORS.yellow, COLORS.green, COLORS.red, COLORS.purple, COLORS.orange];
          net(s.m).forEach((f, i) => p.polygon(`net:${i}`, f, colors[i], { opacity: 0.35 }));
        },
        legend: () => `S = 6 \\cdot 2^2 = 24`,
      },
      {
        id: 'prismTask',
        draw3d(p, sc, s) { p.polyhedron('prismTask', solid(Math.round(s.n), 0), EDGE); },
        legend: s => `n = ${Math.round(s.n)}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'Prisms and pyramids', ru: 'Призмы и пирамиды' },
      text: {
        en: 'Take a polygon and pull it straight up: a <b>prism</b> — two equal bases and rectangles between them (a box, a pencil, a house without the roof). Pull it up to one point instead: a <b>pyramid</b> — a base and triangles meeting at the apex. Change the number of sides $n$ and the kind $k$ ($0$ — prism, $1$ — pyramid).',
        ru: 'Возьмём многоугольник и вытянем его прямо вверх: <b>призма</b> — два равных основания и прямоугольники между ними (коробка, карандаш, дом без крыши). А если стянуть его к одной точке — <b>пирамида</b>: основание и треугольники, сходящиеся в вершине. Меняйте число сторон $n$ и вид $k$ ($0$ — призма, $1$ — пирамида).',
      },
      state: { show: ['solid'], params: { n: 4, k: 0 }, camera: CAMERA, controls: ['n', 'k'] },
    },
    {
      title: { en: 'Euler: always 2', ru: 'Эйлер: всегда 2' },
      text: {
        en: 'Count the vertices $V$, the edges $E$ and the faces $F$. They change with $n$ — but $V - E + F$ is always $2$, for every prism, every pyramid, a cube, any convex polyhedron. This is Euler\'s formula: the first fact about a shape that does not care about lengths or angles.',
        ru: 'Посчитайте вершины $V$, рёбра $E$ и грани $F$. Они меняются вместе с $n$ — а $V - E + F$ всегда равно $2$: для любой призмы, любой пирамиды, куба, любого выпуклого многогранника. Это формула Эйлера — первый факт о фигуре, которому безразличны длины и углы.',
      },
      check: {
        q: { en: 'A prism over an $n$-gon has how many edges?', ru: 'Сколько рёбер у призмы с $n$-угольником в основании?' },
        options: [{ text: '$3n$', ok: true }, { text: '$2n$' }, { text: '$n + 2$' }],
        explain: {
          en: '$n$ in the lower base, $n$ in the upper, $n$ upright ones: $3n$. And $V = 2n$, $F = n + 2$: $2n - 3n + n + 2 = 2$.',
          ru: '$n$ в нижнем основании, $n$ в верхнем и $n$ боковых: $3n$. А $V = 2n$, $F = n + 2$: $2n - 3n + n + 2 = 2$.',
        },
      },
      state: { show: ['solid'], params: { n: 5, k: 0 }, camera: CAMERA, controls: ['n', 'k'] },
    },
    {
      title: { en: 'Unfold the cube', ru: 'Разверните куб' },
      text: {
        en: 'Cut a cardboard box along some edges and lay it flat: a <b>net</b> of six squares. The area of the surface is the area of the net — no need to imagine anything in space. For a cube with edge $2$: six squares of $4$, total $24$.',
        ru: 'Разрежем картонную коробку по нескольким рёбрам и разложим на столе: получится <b>развёртка</b> из шести квадратов. Площадь поверхности — это площадь развёртки, ничего не нужно представлять в пространстве. У куба с ребром $2$: шесть квадратов по $4$, всего $24$.',
      },
      try: { en: 'Press ▶ next to $m$, then fold it back.', ru: 'Нажмите ▶ возле $m$, потом сложите обратно.' },
      state: { show: ['net'], params: { m: 0 }, camera: [6, -7, 7], controls: ['m'] },
      enter(scene) { scene.setParam('m', 0); scene.animateParams({ m: 1 }, 3000); },
    },
    {
      title: { en: 'A prism with 18 edges', ru: 'Призма с 18 рёбрами' },
      text: {
        en: 'Choose the base of the prism so that it has exactly $18$ edges.',
        ru: 'Подберите основание призмы так, чтобы у неё было ровно $18$ рёбер.',
      },
      task: {
        kind: 'drag',
        target: { n: 6 },
        tol: 0.1,
        back: 1,
        right: {
          en: '$3n = 18$, so $n = 6$: a hexagonal prism, like an ordinary pencil. It has $12$ vertices and $8$ faces: $12 - 18 + 8 = 2$.',
          ru: '$3n = 18$, значит, $n = 6$: шестиугольная призма, как обычный карандаш. У неё $12$ вершин и $8$ граней: $12 - 18 + 8 = 2$.',
        },
        mistakes: [
          { params: { n: 9 }, text: { en: 'Not $2n$: besides the two bases there are $n$ upright edges.', ru: 'Не $2n$: кроме двух оснований есть ещё $n$ боковых рёбер.' } },
        ],
        hints: { n: { en: 'Count the edges of the current prism: bottom, top, sides.', ru: 'Посчитайте рёбра текущей призмы: низ, верх, бока.' } },
      },
      state: { show: ['prismTask'], params: { n: 3 }, camera: CAMERA, controls: ['n'] },
    },
  ],
};
