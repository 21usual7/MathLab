import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bytes, xor, crib, flipTo, randomPad, sameBytes, hmac, exchange, inverse,
  multiply, sign, verify, recover, PASSWORDS, passwordChance, attemptBudget, passwordDigest, runChannel,
} from '../js/worlds/crypto/math.js';
import { CRYPTO_WORLDS, loadCryptoWorld } from '../js/worlds/crypto/catalog.js';

test('XOR: cancellation, known-plaintext recovery and an independent pad leave exactly the stated terms', () => {
  const a = bytes('MEET AT NINE'), b = bytes('SEND AT NOON');
  const k = Uint8Array.from(a, (_, i) => (i * 37 + 19) % 256), other = Uint8Array.from(k, x => x ^ 0xa5);
  const c1 = xor(a, k), c2 = xor(b, k);
  assert.deepEqual(xor(c1, c2), xor(a, b));
  assert.equal(new TextDecoder().decode(crib(c1, c2, 'MEET', 0)), 'SEND');
  assert.deepEqual(crib(c1, c2, 'AT', 5), b.slice(5, 7));
  assert.deepEqual(xor(c1, xor(b, other)), xor(xor(a, b), xor(k, other)));
  // A ciphertext alone admits every possible byte message, with its corresponding pad.
  for (let m = 0; m < 256; m++) assert.equal((42 ^ m) ^ m, 42);
  assert.throws(() => bytes('Привет'), RangeError);
  assert.throws(() => crib(c1, c2, 'MEET', 10), RangeError);
  assert.throws(() => crib(c1, c2, 'M', NaN), RangeError);
  assert.throws(() => xor(a, a.slice(1)), RangeError);
  assert.equal(randomPad(12).length, 12);
});

test('A known byte can be altered without learning the pad, but its old HMAC fails', async () => {
  const a = bytes('PAY BOB 100'), k = randomPad(a.length), c = xor(a, k), macKey = randomPad(32);
  const changed = flipTo(c, 8, '1', '9');
  assert.equal(new TextDecoder().decode(xor(changed, k)), 'PAY BOB 900');
  const tag = await hmac(macKey, c);
  assert(sameBytes(tag, await hmac(macKey, c)));
  assert(!sameBytes(tag, await hmac(macKey, changed)));
});

test('DH: the honest keys agree; Eve can derive both substituted keys using only public shares and her own secrets', () => {
  for (let a = 2; a < 21; a++) for (let b = 2; b < 21; b++) {
    const honest = exchange({ a, b }); assert.equal(honest.alice, honest.bob);
    const intercepted = exchange({ a, b, attack: true });
    assert.equal(intercepted.alice, intercepted.eveAlice);
    assert.equal(intercepted.bob, intercepted.eveBob);
  }
  const s = exchange({ attack: true }); assert.notEqual(s.alice, s.bob);
});

test('ECDSA: signatures verify, reused k exposes d, and the stolen d signs a new document', () => {
  assert.equal(multiply(37), null);
  for (let d = 1; d < 37; d++) for (let k = 1; k < 37; k++) {
    let a, b;
    try { a = sign(9, d, k); b = sign(22, d, k); } catch (e) { assert(e instanceof RangeError); continue; }
    const Q = multiply(d);
    assert(verify(9, a, Q)); assert(verify(22, b, Q));
    assert.deepEqual(recover(9, a, 22, b), { k, d });
  }
  const a = sign(9, 11, 5), b = sign(22, 11, 5), stolen = recover(9, a, 22, b);
  assert(verify(17, sign(17, stolen.d, 9), multiply(11)));
  assert(!verify(10, a, multiply(11)));
  // A tiny group admits collisions: authentication is probabilistic, not injectivity in z.
  assert(verify(10, sign(9, 1, 12), multiply(1)));
  assert.notEqual(sign(22, 11, 9).r, a.r);
  assert(!verify(9, { r: 0, s: 1 }, multiply(11)));
  assert.throws(() => inverse(0, 37), RangeError);
});

test('Password model: explicit frequencies sum to 100; no set of three guesses beats the stated solution', async () => {
  assert.equal(PASSWORDS.reduce((s, p) => s + p.count, 0), 100);
  const best = ['123456', 'password', 'qwerty'];
  assert.equal(passwordChance(best), .66);
  assert.equal(passwordChance([...best, '123456']), .66);
  assert.equal(passwordChance(best, true), .3);
  for (const a of PASSWORDS) for (const b of PASSWORDS) for (const c of PASSWORDS) assert(passwordChance([a.word, b.word, c.word]) <= .66);
  assert.equal(attemptBudget({ online: true }), 3);
  assert.equal(attemptBudget({ online: false, cost: 20 }), 3000);
  const a = await passwordDigest('violet', bytes('alice salt'), 1000), b = await passwordDigest('violet', bytes('bob salt'), 1000);
  assert(!sameBytes(a, b)); assert(sameBytes(a, await passwordDigest('violet', bytes('alice salt'), 1000)));
});

test('Channel: all 16 configurations are checked against actual encryption, MAC and exchange operations', async () => {
  for (let mask = 0; mask < 16; mask++) {
    const config = Object.fromEntries(['fresh', 'identity', 'integrity', 'sequence'].map((k, i) => [k, !!(mask & (1 << i))]));
    for (const attack of ['listen', 'reuse', 'mitm', 'tamper', 'replay']) {
      const r = await runChannel(config, attack);
      const expected = attack === 'listen' || (attack === 'reuse' && config.fresh) || (attack === 'mitm' && config.identity) || (attack === 'tamper' && config.integrity) || (attack === 'replay' && config.integrity && config.sequence);
      assert.equal(r.safe, expected, `${mask}: ${attack}`);
      if (attack === 'reuse' && !config.fresh) assert.equal(r.recovered, 'PAY EVE 900');
      if (attack === 'tamper' && !config.integrity) assert.equal(r.evidence, 'PAY BOB 900');
      if (attack === 'mitm' && !config.identity) { assert.equal(r.evidence, 'PAY BOB 100'); assert.equal(r.delivered, 'PAY BOB 100'); }
    }
  }
});

test('Every crypto catalog entry loads a world with uniquely identified modes and a real challenge', async () => {
  assert.equal(CRYPTO_WORLDS.length, 7);
  for (const meta of CRYPTO_WORLDS) {
    const world = await loadCryptoWorld(meta.id);
    assert.equal(typeof world.mount, 'function'); assert(world.modes[1].goal);
    assert.equal(new Set(world.modes.map(m => m.id)).size, world.modes.length);
    assert.equal(world.modes[0].id, 'free');
  }
  assert.equal(await loadCryptoWorld('missing'), null);
});
