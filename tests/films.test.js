import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { duration, chapterAt, chapterStart } from '../js/ui/film.js';
import { DAYS, fires, perceptron, ring, forward, correct } from '../js/topics/ml-math.js';

// A canvas that accepts every call: enough to run the painting code of every chapter
const ctx = new Proxy({}, { get: (o, k) => (k in o ? o[k] : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
const kit = { ctx, t: x => (typeof x === 'object' ? x.ru : x) };
for (const k of ['alpha', 'text', 'line', 'curve', 'arrow', 'circle', 'box']) kit[k] = k === 'alpha' ? (a, fn) => fn() : () => {};
kit.along = (pts, k) => pts[Math.min(pts.length - 1, Math.round(k * (pts.length - 1)))];

const FILMS = ['intro', 'regression', 'network', 'backprop'];

test('films: every chapter paints and captions at any moment, the clock is exact', async () => {
  for (const name of FILMS) {
    const film = (await import(`../js/topics/films/${name}.js`)).default, st = film.state();
    assert.ok(film.chapters.length >= 5, name);
    const total = duration(film.chapters);
    film.chapters.forEach((c, i) => {
      assert.equal(chapterAt(film.chapters, chapterStart(film.chapters, i) + 0.01).index, i);
      for (const p of [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1]) {
        c.paint(kit, p, st);
        const text = c.caption(p, st);
        assert.ok(text.ru && text.en, `${name}/${c.id} caption`);
      }
      if (c.ask) assert.equal(c.ask.options.filter(o => o.ok).length, 1, `${name}/${c.id} one right answer`);
      if (c.lens) c.lens.knobs.forEach(k => assert.ok(k.key in st && st[k.key] >= k.min && st[k.key] <= k.max, `${name}/${c.id} knob ${k.key}`));
    });
    assert.equal(chapterAt(film.chapters, total + 5).index, film.chapters.length - 1);
  }
});

test('films: the numbers the stories tell are true', async () => {
  // The diary: the rule is "no rain, and sun or a weekend"; the perceptron makes 4, 3, 2, 2, 1, 0 mistakes per pass
  DAYS.forEach(d => assert.equal(d[3], !d[2] && (d[0] || d[1]) ? 1 : 0));
  const h = perceptron(DAYS, 48);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(j => h.slice(8 * j, 8 * j + 8).filter(r => !r.ok).length), [4, 3, 2, 2, 1, 0]);
  assert.deepEqual(h[48].w, [1, 1, -1.5]);
  assert.ok(DAYS.every(d => fires(h[48].w, 0.5, d) === d[3]));
  // The walk: dry weekend 1 + 1 > 0.5 — go; with rain 1 + 1 − 2 = 0 — stay
  assert.equal(fires([1, 1, -2], 0.5, [1, 1, 0]), 1);
  assert.equal(fires([1, 1, -2], 0.5, [1, 1, 1]), 0);
  // Anya goes on a cloudy weekend, Boris stays home
  assert.equal(fires([1, 1, -2], 0.5, [0, 1, 0]), 1);
  assert.equal(fires([2, 0.2, -1], 1, [0, 1, 0]), 0);
  // The café: eight steps of η = 0.006 reach the bottom, η = 0.03 flies out
  const { descent, BEST, loss } = await import('../js/topics/films/regression.js');
  assert.ok(Math.abs(descent(7.5, 0.006, 8)[8] - BEST.w) < 0.2);
  assert.ok(Math.abs(descent(7.5, 0.03, 8)[8] - BEST.w) > 3);
  for (const dw of [-0.1, 0.1]) assert.ok(loss(BEST.w + dw, BEST.b) > loss(BEST.w, BEST.b));
  // The network: the hand-made triangle and the real training both get all 70 points
  const { training } = await import('../js/topics/films/network.js');
  const f = training(), D = ring();
  assert.equal(correct(D, (x, y) => forward(f[f.length - 1].net, x, y).out), 70);
  // The conveyor: blames −2 and −4, and every round of η = 0.05 halves the miss
  const { run, rounds } = await import('../js/topics/films/backprop.js');
  const r = run({ w: 0.5, b: 1 });
  assert.deepEqual([r.L, r.gb, r.gw], [1, -2, -4]);
  rounds({ w: 0.5, b: 1, eta: 0.05 }, 3).forEach((s, i) => assert.ok(Math.abs(run(s).e + 0.5 ** i) < 1e-12));
});
