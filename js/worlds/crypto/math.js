// Small, exact teaching models. No network calls; these are not production cryptographic primitives.
export const mod = (x, n) => ((x % n) + n) % n;
export function inverse(a, n) {
  let [r, s, x, y] = [n, mod(a, n), 0, 1];
  while (s) { const q = Math.floor(r / s); [r, s, x, y] = [s, r - q * s, y, x - q * y]; }
  if (r !== 1) throw new RangeError('No modular inverse');
  return mod(x, n);
}
export function power(g, a, p) {
  let v = 1;
  for (; a > 0; a = Math.floor(a / 2), g = g * g % p) if (a % 2) v = v * g % p;
  return v;
}
export function bytes(text) {
  if (!/^[\x20-\x7e]*$/.test(text)) throw new RangeError('Use printable ASCII');
  return Uint8Array.from(text, c => c.charCodeAt(0));
}
export function xor(a, b) {
  if (a.length !== b.length) throw new RangeError('Lengths must match');
  return Uint8Array.from(a, (v, i) => v ^ b[i]);
}
export const hex = b => [...b].map(v => v.toString(16).padStart(2, '0')).join(' ');
export const printable = b => [...b].map(v => v >= 32 && v <= 126 ? String.fromCharCode(v) : '·').join('');
export function randomPad(n) { return globalThis.crypto.getRandomValues(new Uint8Array(n)); }
export function crib(c1, c2, guess, offset) {
  const g = bytes(guess);
  if (!Number.isInteger(offset) || offset < 0 || offset + g.length > Math.min(c1.length, c2.length)) throw new RangeError('Fragment outside intercept');
  return xor(xor(c1.slice(offset, offset + g.length), c2.slice(offset, offset + g.length)), g);
}
export function flipTo(cipher, offset, known, desired) {
  const a = bytes(known), b = bytes(desired), result = Uint8Array.from(cipher);
  if (a.length !== b.length || offset < 0 || offset + a.length > cipher.length) throw new RangeError('Invalid replacement');
  for (let i = 0; i < a.length; i++) result[offset + i] ^= a[i] ^ b[i];
  return result;
}
export async function hmac(key, message) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, message));
}
export const sameBytes = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
export function exchange({ a = 6, b = 15, e = 3, f = 7, attack = false } = {}) {
  const p = 23, g = 5, A = power(g, a, p), B = power(g, b, p);
  const toAlice = attack ? power(g, e, p) : B, toBob = attack ? power(g, f, p) : A;
  return { p, g, A, B, toAlice, toBob, alice: power(toAlice, a, p), bob: power(toBob, b, p),
    eveAlice: attack ? power(A, e, p) : null, eveBob: attack ? power(B, f, p) : null };
}

// y² = x³ − x + 1 (mod 29), G=(1,1), prime order 37: the curve of the existing ECC topic.
export const EC = { p: 29, n: 37, G: [1, 1] };
export function add(P, Q) {
  if (!P) return Q; if (!Q) return P;
  const p = EC.p, [x, y] = P, [u, v] = Q;
  if (x === u && mod(y + v, p) === 0) return null;
  const slope = x === u ? mod((3 * x * x - 1) * inverse(2 * y, p), p) : mod((v - y) * inverse(u - x, p), p);
  const r = mod(slope * slope - x - u, p);
  return [r, mod(slope * (x - r) - y, p)];
}
export function multiply(k, P = EC.G) {
  let Q = null;
  for (k = mod(k, EC.n); k; k = Math.floor(k / 2), P = add(P, P)) if (k % 2) Q = add(Q, P);
  return Q;
}
export function sign(z, d, k) {
  if (![d, k].every(v => Number.isInteger(v) && v > 0 && v < EC.n)) throw new RangeError('Invalid secret scalar');
  const r = mod(multiply(k)[0], EC.n), s = mod(inverse(k, EC.n) * (z + r * d), EC.n);
  if (!r || !s) throw new RangeError('Choose another k');
  return { r, s };
}
export function verify(z, { r, s }, Q) {
  if (![r, s].every(v => Number.isInteger(v) && v > 0 && v < EC.n) || !Q) return false;
  const w = inverse(s, EC.n), P = add(multiply(mod(z * w, EC.n)), multiply(mod(r * w, EC.n), Q));
  return !!P && mod(P[0], EC.n) === r;
}
export function recover(z1, sig1, z2, sig2) {
  if (sig1.r !== sig2.r) throw new RangeError('Different r');
  const k = mod((z1 - z2) * inverse(sig1.s - sig2.s, EC.n), EC.n);
  const d = mod((sig1.s * k - z1) * inverse(sig1.r, EC.n), EC.n);
  return { k, d };
}

// An explicit synthetic password population. Probability is from this model, never inferred from a typed password.
export const PASSWORDS = [
  { word: '123456', count: 28 }, { word: 'password', count: 22 }, { word: 'qwerty', count: 16 },
  { word: 'letmein', count: 10 }, { word: 'dragon', count: 8 }, { word: 'sunshine', count: 6 },
  { word: 'monkey', count: 4 }, { word: 'welcome', count: 3 }, { word: 'football', count: 2 }, { word: 'violet', count: 1 },
];
export function passwordChance(guesses, uniform = false) {
  const unique = new Set(guesses);
  return PASSWORDS.reduce((s, v) => s + (unique.has(v.word) ? (uniform ? 10 : v.count) : 0), 0) / 100;
}
export function attemptBudget({ seconds = 60, rate = 1000, cost = 1, online = false, limit = 3 } = {}) {
  const guesses = Math.max(0, Math.floor(seconds * rate / cost));
  return online ? Math.min(limit, guesses) : guesses;
}
export async function passwordDigest(password, salt, iterations = 20000) {
  const material = await crypto.subtle.importKey('raw', bytes(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, 256));
}

// An inspectable channel used only by the synthesis lab. Tiny DH is intentionally insecure.
// AES-CTR and HMAC run in Web Crypto; keys are separated by labels. This is not TLS or a production KDF.
const utf8 = text => new TextEncoder().encode(text);
function concat(...arrays) { const out = new Uint8Array(arrays.reduce((n, a) => n + a.length, 0)); let at = 0; for (const a of arrays) { out.set(a, at); at += a.length; } return out; }
async function sessionKeys(secret, context) {
  const derive = label => crypto.subtle.digest('SHA-256', utf8(`MathLab demo / ${label} / ${context} / ${secret}`));
  const [enc, mac] = await Promise.all([derive('encryption'), derive('authentication')]);
  return { aes: await crypto.subtle.importKey('raw', enc, 'AES-CTR', false, ['encrypt', 'decrypt']), mac: new Uint8Array(mac) };
}
const counterBytes = n => { const c = new Uint8Array(16); new DataView(c.buffer).setUint32(12, n); return c; };
const signedPacket = packet => concat(counterBytes(packet.seq), packet.counter, packet.cipher);
async function seal(keys, text, seq, counter) {
  const packet = { seq, counter: counterBytes(counter), cipher: new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CTR', counter: counterBytes(counter), length: 64 }, keys.aes, bytes(text))) };
  packet.tag = await hmac(keys.mac, signedPacket(packet)); return packet;
}
async function open(keys, packet, config, seen) {
  if (config.integrity && !sameBytes(packet.tag, await hmac(keys.mac, signedPacket(packet)))) return { accepted: false, reason: 'integrity' };
  if (config.sequence && seen.has(packet.seq)) return { accepted: false, reason: 'sequence' };
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-CTR', counter: packet.counter, length: 64 }, keys.aes, packet.cipher));
  seen.add(packet.seq); return { accepted: true, plain, text: printable(plain) };
}
export async function runChannel(config, attack) {
  const ex = exchange({ attack: attack === 'mitm' }), context = hex(randomPad(16));
  // Trusted public signing keys are fixed independently of the unauthenticated network.
  if (attack === 'mitm' && config.identity) {
    const sig = sign(ex.A, 11, 5);
    if (!verify(ex.toBob, sig, multiply(11))) return { safe: true, reason: 'identity', evidence: 'Invalid signature on substituted DH share' };
  }
  const alice = await sessionKeys(ex.alice, context), bob = await sessionKeys(ex.bob, context);
  const first = await seal(alice, 'PAY BOB 100', 1, 0), seen = new Set();
  if (attack === 'reuse') {
    // Each sample is one short block. Fresh counters use disjoint blocks (2^28 apart), not overlapping CTR ranges.
    const second = await seal(alice, 'PAY EVE 900', 2, config.fresh ? 0x10000000 : 0);
    const recovered = xor(xor(first.cipher, second.cipher), bytes('PAY BOB 100'));
    return { safe: !!config.fresh, reason: config.fresh ? 'fresh' : 'reuse', evidence: hex(xor(first.cipher, second.cipher)), recovered: printable(recovered), counter1: hex(first.counter), counter2: hex(second.counter) };
  }
  if (attack === 'listen') return { safe: true, reason: 'encrypted', evidence: hex(first.cipher) };
  if (attack === 'mitm') {
    const eAlice = await sessionKeys(ex.eveAlice, context), eBob = await sessionKeys(ex.eveBob, context);
    const stolen = await open(eAlice, first, { integrity: true, sequence: false }, new Set());
    const forwarded = await seal(eBob, stolen.text, 1, 0);
    const received = await open(bob, forwarded, config, seen);
    return { safe: false, reason: 'mitm', evidence: stolen.text, delivered: received.text };
  }
  if (attack === 'tamper') {
    const packet = { ...first, cipher: flipTo(first.cipher, 8, '1', '9') };
    const received = await open(bob, packet, config, seen);
    return { safe: !received.accepted, reason: received.accepted ? 'tamper' : received.reason, evidence: received.text || 'HMAC mismatch' };
  }
  if (attack === 'replay') {
    await open(bob, first, config, seen);
    // With no MAC Eve can relabel the replay as a fresh sequence number. The ciphertext counter stays unchanged.
    const packet = { ...first, seq: config.sequence && !config.integrity ? 2 : 1 };
    const received = await open(bob, packet, config, seen);
    return { safe: !received.accepted, reason: received.accepted ? 'replay' : received.reason, evidence: received.text || 'Duplicate sequence number', relabelled: packet.seq !== first.seq };
  }
  throw new RangeError('Unknown attack');
}
