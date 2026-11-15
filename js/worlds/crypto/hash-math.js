// FIPS 180-4 SHA-256 with an inspectable trace, checked against Web Crypto in the tests.
// Each frame contains the actual eight working words after one round, not a decorative random pattern.
const K = new Uint32Array([
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
]);
const IV = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
const rotr = (v, n) => (v >>> n) | (v << (32 - n));
export const utf8 = value => new TextEncoder().encode(value);
export const hashHex = b => [...b].map(v => v.toString(16).padStart(2, '0')).join('');
export function sha256Trace(input) {
  const data = typeof input === 'string' ? utf8(input) : Uint8Array.from(input);
  if (data.length > 4096) throw new RangeError('Teaching trace is limited to 4096 bytes');
  const padded = new Uint8Array(Math.ceil((data.length + 9) / 64) * 64); padded.set(data); padded[data.length] = 0x80;
  const view = new DataView(padded.buffer); view.setUint32(padded.length - 4, data.length * 8);
  let H = [...IV]; const blocks = [];
  for (let offset = 0; offset < padded.length; offset += 64) {
    const W = new Uint32Array(64);
    for (let i = 0; i < 16; i++) W[i] = view.getUint32(offset + 4 * i);
    for (let i = 16; i < 64; i++) {
      const x = W[i-15], y = W[i-2];
      W[i] = (W[i-16] + (rotr(x,7)^rotr(x,18)^(x>>>3)) + W[i-7] + (rotr(y,17)^rotr(y,19)^(y>>>10))) >>> 0;
    }
    let [a,b,c,d,e,f,g,h] = H;
    const frames = [[...H]];
    for (let i = 0; i < 64; i++) {
      const choice = (e & f) ^ (~e & g), majority = (a & b) ^ (a & c) ^ (b & c);
      const T1 = (h + (rotr(e,6)^rotr(e,11)^rotr(e,25)) + choice + K[i] + W[i]) >>> 0;
      const T2 = ((rotr(a,2)^rotr(a,13)^rotr(a,22)) + majority) >>> 0;
      [a,b,c,d,e,f,g,h] = [(T1+T2)>>>0,a,b,c,(d+T1)>>>0,e,f,g]; frames.push([a,b,c,d,e,f,g,h]);
    }
    const before = [...H]; H = H.map((v, i) => (v + frames[64][i]) >>> 0);
    blocks.push({ frames, words: [...W], before, after: [...H] });
  }
  const digest = new Uint8Array(32), out = new DataView(digest.buffer); H.forEach((v, i) => out.setUint32(i*4,v));
  return { digest, blocks, inputLength: data.length, paddedLength: padded.length };
}
export function distance(a, b) {
  if (a.length !== b.length) throw new RangeError('Lengths must match');
  let count = 0;
  for (let i=0;i<a.length;i++) { let x=(a[i]^b[i])>>>0; while(x) { x &= x-1; count++; } }
  return count;
}
export function prefix(data, bits = 8) {
  if (!Number.isInteger(bits) || bits < 1 || bits > 16) throw new RangeError('Prefix must have 1–16 bits');
  return ((data[0] << 8) | (data[1] || 0)) >>> (16 - bits);
}
export function collisionProbability(k, bits) {
  const N = 2 ** bits;
  if (!Number.isInteger(k) || k < 0 || !Number.isInteger(bits) || bits < 1 || bits > 32) throw new RangeError('Invalid birthday model');
  if (k < 2) return 0;
  if (k > N) return 1;
  let logP = 0;
  for (let i = 1; i < k; i++) logP += Math.log1p(-i / N);
  return -Math.expm1(logP);
}
export function findPrefixCollision(bits = 8, limit = 1000) {
  const seen = new Map();
  for (let i = 0; i < limit; i++) {
    const text = `card-${i}`, digest = sha256Trace(text).digest, bucket = prefix(digest, bits);
    if (seen.has(bucket)) return { first: seen.get(bucket), second: { text, digest }, bucket, tries: i + 1 };
    seen.set(bucket, { text, digest });
  }
  return null;
}
export function crc32(input) {
  const data = typeof input === 'string' ? utf8(input) : input;
  let crc = 0xffffffff;
  for (const byte of data) { crc ^= byte; for(let bit=0;bit<8;bit++) crc=(crc>>>1)^((crc&1)?0xedb88320:0); }
  return (crc ^ 0xffffffff) >>> 0;
}
