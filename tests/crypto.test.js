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
