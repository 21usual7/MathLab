// The mathematics of PageRank, without drawing (also used by the tests).
// A random surfer clicks a random link of the current page with probability d, and with probability 1 − d
// jumps to a random page. The share of time spent on each page is its rank r: a probability vector with
// r = G·r, the eigenvector of the «Google matrix» G for the eigenvalue 1. Power iteration finds it: start with
// equal shares and let them flow along the links again and again.

// edges: [[from, to], …]; a page without links («dangling») sends its share to everybody equally
export function step(r, n, edges, d = 0.85) {
  const out = new Array(n).fill(0);
  edges.forEach(([a]) => out[a]++);
  let dangling = 0;
  for (let i = 0; i < n; i++) if (!out[i]) dangling += r[i];
  const next = new Array(n).fill((1 - d) / n + d * dangling / n);
  edges.forEach(([a, b]) => { next[b] += d * r[a] / out[a]; });
  return next;
}

export function rank(n, edges, d = 0.85, iterations = 200) {
  let r = new Array(n).fill(1 / n);
  for (let k = 0; k < iterations; k++) r = step(r, n, edges, d);
  return r;
}

// One click of the surfer: where the surfer goes from page `at`
export function surf(at, n, edges, d = 0.85, rand = Math.random) {
  const links = edges.filter(([a]) => a === at).map(([, b]) => b);
  if (!links.length || rand() >= d) return Math.floor(rand() * n);
  return links[Math.floor(rand() * links.length)];
}

// Places by rank: place[i] = 1 for the top page
export function places(r) {
  const order = r.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
  const out = new Array(r.length);
  order.forEach((i, k) => { out[i] = k + 1; });
  return out;
}
