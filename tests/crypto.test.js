import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mod, gcd, powmod, multiples, powers } from '../js/topics/mod.js';
import { shift } from '../js/topics/caesar.js';

test('remainders', () => {
  assert.equal(mod(14, 12), 2);
  assert.equal(mod(-3, 12), 9);
  assert.equal(gcd(12, 9), 3);
  // Big powers without overflow: Fermat, a^(p−1) ≡ 1
  assert.equal(powmod(5, 22, 23), 1);
  assert.equal(powmod(123456, 1000002, 1000003), 1);
  assert.equal(powmod(5, 15, 23), 19);
  // Jumps of 5 on a clock of 12 visit every mark; jumps of 4 only three
  assert.equal(multiples(5, 12).length - 1, 12);
  assert.deepEqual(multiples(4, 12), [0, 4, 8, 0]);
  // Powers of 3 modulo 7 visit 1 … 6; powers of 2 only 1, 2, 4
  assert.deepEqual(powers(3, 7), [1, 3, 2, 6, 4, 5, 1]);
  assert.deepEqual(powers(2, 7), [1, 2, 4, 1]);
});

test('RSA on a small clock', () => {
  // n = 33, e = 3, d = 7: every message comes back
  for (let m = 0; m < 33; m++) assert.equal(powmod(powmod(m, 3, 33), 7, 33), m);
});

test('Caesar shift', () => {
  // The alphabet follows the language of explanations: Russian by default (32 letters, Ё as Е)
  assert.equal(shift('ПРИВЕТ', 3), 'ТУЛЕИХ');
  assert.equal(shift('Я', 3), 'В');
  assert.equal(shift('ёж, да!', 1), 'ЖЗ, ЕБ!');
  assert.equal(shift(shift('ЗАМОК', 5), -5), 'ЗАМОК');
});

test('elliptic curve y² = x³ − x + 1', async () => {
  const { X0, onCurve, sOf, chord, exact, PTS, PM, MULT, ORDER, plusMod, chordMod } = await import('../js/topics/ecc.js');
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
  close(X0 ** 3 - X0 + 1, 0);
  // A point by one number s: on the curve, and back by sOf
  for (const s of [-2, -0.3, 0, 0.7, 2]) { const [x, y] = onCurve(s); close(y * y, x ** 3 - x + 1); }
  close(onCurve(sOf(3, -1))[1], -5);
  // (−1; 1) + (0; 1): the line y = 1, third point (1; 1), sum (1; −1); 2·(1; 1) = (−1; 1); P + (−P) = O
  const c = chord([-1, 1], [0, 1]);
  close(c.R[0], 1); close(c.S[1], -1);
  const d = chord([1, 1], [1, 1]);
  close(d.S[0], -1); close(d.S[1], 1);
  assert.equal(chord([1, 1], [1, -1]), null);
  // The tasks: (0; −1) + (1; 1) = (3; −5), 2·(1; −1) = (−1; −1)
  const t1 = chord([0, -1], [1, 1]).S, t2 = chord([1, -1], [1, -1]).S;
  close(t1[0], 3); close(t1[1], -5); close(t2[0], -1); close(t2[1], -1);
  // Exact multiples of (1; 1): 4P = (3; −5), 6P = (1/4; 7/8)
  assert.deepEqual(exact[4], [[3n, 1n], [-5n, 1n]]);
  assert.deepEqual(exact[6], [[1n, 4n], [7n, 8n]]);
  // Modulo 29: 36 points, all on the curve; G = (1; 1) has the prime order 37
  assert.equal(PTS.length, 36);
  PTS.forEach(([x, y]) => assert.equal((y * y - x ** 3 + x - 1 + 29 * 29 * 29) % PM, 0));
  assert.equal(ORDER, 37);
  assert.equal(MULT[37], null);
  assert.deepEqual(MULT[4], [3, 24]); // (3; −5) on the clock
  assert.deepEqual(MULT[6], [22, 19]); // (1/4; 7/8): 4·22 ≡ 1, 7·11 ≡ 19
  assert.deepEqual(MULT[13], [12, 8]);
  assert.deepEqual(MULT[24], [12, 21]);
  assert.deepEqual(chordMod([28, 1], [0, 1]).S, [1, 28]);
  // The exchange: k(mG) = m(kG)
  for (const [k, m] of [[6, 15], [3, 20], [36, 2]]) {
    let A = null, B = null, S1 = null, S2 = null;
    for (let i = 0; i < k; i++) A = plusMod(A, MULT[1]);
    for (let i = 0; i < m; i++) B = plusMod(B, MULT[1]);
    for (let i = 0; i < k; i++) S1 = plusMod(S1, B);
    for (let i = 0; i < m; i++) S2 = plusMod(S2, A);
    assert.deepEqual(S1, S2);
    assert.deepEqual(S1, MULT[(k * m) % 37]);
  }
});
