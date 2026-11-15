// The mathematics of JPEG, without drawing (also used by the tests).
// A picture is cut into 8×8 blocks; each block is written as a sum of 64 cosine waves (the discrete cosine
// transform, DCT): wave (u, v) is cos((2x + 1)uπ/16) · cos((2y + 1)vπ/16). Smooth blocks need only a few slow
// waves, so the fast ones are divided by big numbers (quantization) and mostly become 0 — and zeros are cheap
// to store. Colour is kept as brightness Y and two colour differences Cb, Cr: the eye forgives colour much more.

const S = 8;
const alpha = u => (u ? Math.sqrt(2 / S) : Math.sqrt(1 / S));
// C[u][x]: the orthonormal 8-point DCT matrix
export const C = Array.from({ length: S }, (_, u) => Array.from({ length: S }, (_, x) => alpha(u) * Math.cos((2 * x + 1) * u * Math.PI / 16)));

// 64 values (row by row, index y·8 + x) → 64 coefficients (index v·8 + u); and back
export function dct(block) {
  const tmp = new Float64Array(64), out = new Float64Array(64);
  for (let y = 0; y < S; y++) for (let u = 0; u < S; u++) { let s = 0; for (let x = 0; x < S; x++) s += C[u][x] * block[y * S + x]; tmp[y * S + u] = s; }
  for (let u = 0; u < S; u++) for (let v = 0; v < S; v++) { let s = 0; for (let y = 0; y < S; y++) s += C[v][y] * tmp[y * S + u]; out[v * S + u] = s; }
  return out;
}
export function idct(coef) {
  const tmp = new Float64Array(64), out = new Float64Array(64);
  for (let u = 0; u < S; u++) for (let y = 0; y < S; y++) { let s = 0; for (let v = 0; v < S; v++) s += C[v][y] * coef[v * S + u]; tmp[y * S + u] = s; }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { let s = 0; for (let u = 0; u < S; u++) s += C[u][x] * tmp[y * S + u]; out[y * S + x] = s; }
  return out;
}
// The pure wave (u, v) as 64 values in −1…1
export const wave = (u, v) => Float64Array.from({ length: 64 }, (_, i) => Math.cos((2 * (i % S) + 1) * u * Math.PI / 16) * Math.cos((2 * Math.floor(i / S) + 1) * v * Math.PI / 16));

// The zigzag order: from slow waves to fast ones
export const ZIGZAG = (() => {
  const out = [];
  for (let s = 0; s < 2 * S - 1; s++) {
    const cells = [];
    for (let v = 0; v < S; v++) { const u = s - v; if (u >= 0 && u < S) cells.push(v * S + u); }
    out.push(...(s % 2 ? cells : cells.reverse()));
  }
  return out;
})();

// The quantization tables of the JPEG standard (Annex K), scaled by quality 1…100 as in the IJG library
const LUMA = [16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62,
  18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99];
const CHROMA = [17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99, 99, 99, 99,
  ...Array(32).fill(99)];
export function table(quality, chroma = false) {
  const q = Math.max(1, Math.min(100, quality)), scale = q < 50 ? 5000 / q : 200 - 2 * q;
  return (chroma ? CHROMA : LUMA).map(v => Math.max(1, Math.min(255, Math.floor((v * scale + 50) / 100))));
}

// Bits a JPEG coder would spend on one block of quantized numbers (Huffman codes approximated by their
// typical lengths): the first number is stored as a difference from the previous block, then each non-zero
// number with the run of zeros before it, then «end of block»
const cat = v => (v ? Math.floor(Math.log2(Math.abs(v))) + 1 : 0);
function blockBits(q, prevDC) {
  let bits = 3 + cat(q[0] - prevDC), run = 0, last = 0;
  for (let k = 1; k < 64; k++) if (q[ZIGZAG[k]]) last = k;
  for (let k = 1; k <= last; k++) {
    const v = q[ZIGZAG[k]];
    if (!v) { run++; continue; }
    bits += 11 * Math.floor(run / 16) + 4 + Math.min(4, run % 16) + cat(v);
    run = 0;
  }
  return bits + (last < 63 ? 4 : 0);
}

// One channel (w × h, both multiples of 8): keep the first `keep` waves of every block (zigzag), quantize with
// the table of `quality`. Returns the restored channel, the bits, and the quantized numbers of every block.
export function compress(plane, w, h, { keep = 64, quality = 75, chroma = false, center = 128 } = {}) {
  const Q = table(quality, chroma), out = new Float32Array(w * h), blocks = [];
  let bits = 0, prevDC = 0;
  const blk = new Float64Array(64);
  for (let by = 0; by < h; by += S) for (let bx = 0; bx < w; bx += S) {
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) blk[y * S + x] = plane[(by + y) * w + bx + x] - center;
    const c = dct(blk), q = new Int16Array(64), back = new Float64Array(64);
    for (let k = 0; k < 64; k++) {
      const i = ZIGZAG[k];
      q[i] = k < keep ? Math.round(c[i] / Q[i]) : 0;
      back[i] = q[i] * Q[i];
    }
    bits += blockBits(q, prevDC);
    prevDC = q[0];
    blocks.push(q);
    const r = idct(back);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) out[(by + y) * w + bx + x] = Math.max(0, Math.min(255, r[y * S + x] + center));
  }
  return { out, bits, blocks };
}

// Colour ↔ brightness and colour differences (JFIF)
export function toYCC(r, g, b) {
  const n = r.length, Y = new Float32Array(n), Cb = new Float32Array(n), Cr = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    Y[i] = 0.299 * r[i] + 0.587 * g[i] + 0.114 * b[i];
    Cb[i] = 128 - 0.168736 * r[i] - 0.331264 * g[i] + 0.5 * b[i];
    Cr[i] = 128 + 0.5 * r[i] - 0.418688 * g[i] - 0.081312 * b[i];
  }
  return [Y, Cb, Cr];
}
export function toRGB(Y, Cb, Cr) {
  const n = Y.length, r = new Float32Array(n), g = new Float32Array(n), b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const cb = Cb[i] - 128, cr = Cr[i] - 128;
    r[i] = Y[i] + 1.402 * cr;
    g[i] = Y[i] - 0.344136 * cb - 0.714136 * cr;
    b[i] = Y[i] + 1.772 * cb;
  }
  return [r, g, b];
}

// Colour at half resolution (4:2:0): every 2×2 square of pixels shares one colour — the eye hardly notices
export function half(plane, w, h) {
  const out = new Float32Array((w / 2) * (h / 2));
  for (let y = 0; y < h / 2; y++) for (let x = 0; x < w / 2; x++) {
    const i = 2 * y * w + 2 * x;
    out[y * (w / 2) + x] = (plane[i] + plane[i + 1] + plane[i + w] + plane[i + w + 1]) / 4;
  }
  return out;
}
export function double(plane, w, h) { // w, h: the full size
  const out = new Float32Array(w * h), hw = w / 2, hh = h / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const fx = Math.min(hw - 1, Math.max(0, (x - 0.5) / 2)), fy = Math.min(hh - 1, Math.max(0, (y - 0.5) / 2));
    const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(hw - 1, x0 + 1), y1 = Math.min(hh - 1, y0 + 1), ax = fx - x0, ay = fy - y0;
    out[y * w + x] = (plane[y0 * hw + x0] * (1 - ax) + plane[y0 * hw + x1] * ax) * (1 - ay) + (plane[y1 * hw + x0] * (1 - ax) + plane[y1 * hw + x1] * ax) * ay;
  }
  return out;
}

// The whole photo: brightness with quality qy, colour with quality qc, colour at half resolution if `sub`.
// Returns the restored r, g, b, the bits of each part and the closeness.
export function jpeg(img, { qy = 75, qc = 75, keep = 64, sub = false, gray = false } = {}) {
  const { w, h } = img, [Y, Cb, Cr] = toYCC(img.r, img.g, img.b);
  const y = compress(Y, w, h, { quality: qy, keep });
  if (gray) return { r: y.out, g: y.out, b: y.out, Y, y, bitsY: y.bits, bitsC: 0, bits: y.bits, raw: w * h * 8, psnrY: psnr(Y, y.out) };
  let cb, cr, bitsC;
  if (sub) {
    const a = compress(half(Cb, w, h), w / 2, h / 2, { quality: qc, keep, chroma: true }), b = compress(half(Cr, w, h), w / 2, h / 2, { quality: qc, keep, chroma: true });
    cb = double(a.out, w, h); cr = double(b.out, w, h); bitsC = a.bits + b.bits;
  } else {
    const a = compress(Cb, w, h, { quality: qc, keep, chroma: true }), b = compress(Cr, w, h, { quality: qc, keep, chroma: true });
    cb = a.out; cr = b.out; bitsC = a.bits + b.bits;
  }
  const [r, g, b] = toRGB(y.out, cb, cr);
  const prgb = (psnr(img.r, r) + psnr(img.g, g) + psnr(img.b, b)) / 3;
  return { r, g, b, Y, y, bitsY: y.bits, bitsC, bits: y.bits + bitsC, raw: w * h * 24, psnrY: psnr(Y, y.out), psnrRGB: prgb };
}

// How close the copy is: peak signal-to-noise ratio in decibels (30 — noticeable up close, 40 — practically equal)
export function psnr(a, b) {
  let e = 0;
  for (let i = 0; i < a.length; i++) e += (a[i] - b[i]) ** 2;
  e /= a.length;
  return e ? 10 * Math.log10(255 * 255 / e) : Infinity;
}

// Smooth value noise in 0…1 (a few octaves): the texture of grass and ripples
function noise(seed) {
  const hash = (x, y) => { let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 982451653); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const sm = t => t * t * (3 - 2 * t);
  const one = (x, y) => {
    const X = Math.floor(x), Y = Math.floor(y), fx = sm(x - X), fy = sm(y - Y);
    const a = hash(X, Y), b = hash(X + 1, Y), c = hash(X, Y + 1), d = hash(X + 1, Y + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  return (x, y) => (one(x, y) * 0.5 + one(2 * x, 2 * y) * 0.3 + one(4 * x, 4 * y) * 0.2);
}

// A built-in picture without any download: a sunset over grassy hills and a lake, with a sharp-edged house,
// and a little film grain — so that it compresses like a real photo, not like a drawing
export function sunset(w = 256, h = 192) {
  const grass = noise(1), ripple = noise(2), grain = noise(3), cloud = noise(4);
  const r = new Float32Array(w * h), g = new Float32Array(w * h), b = new Float32Array(w * h);
  const sun = [0.68 * w, 0.36 * h], R = 0.08 * w, horizon = 0.62 * h;
  const ridge = x => horizon - h * (0.1 + 0.05 * Math.sin(x / w * 7.3) + 0.03 * Math.sin(x / w * 19 + 1));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, t = y / horizon;
    let c = [255 - 60 * t, 120 + 60 * (1 - t) * (1 - t), 90 + 110 * t]; // sky: warm at the bottom, violet up high
    const cl = Math.max(0, cloud(x / 26, y / 9) - 0.55) * 2.2; // thin clouds
    c = c.map((v, k) => v + cl * ([255, 190, 200][k] - v));
    const d = Math.hypot(x - sun[0], y - sun[1]);
    const glow = Math.exp(-((d / (3 * R)) ** 2)) * 0.6;
    c = c.map((v, k) => v + glow * ([255, 220, 150][k] - v));
    if (d < R) c = [255, 236, 170];
    if (y > ridge(x)) { // hills with grass
      const k = (y - ridge(x)) / h, gr = grass(x / 3, y / 3) - 0.5;
      c = [70 - 40 * k + 50 * gr, 60 - 20 * k + 70 * gr, 80 - 30 * k + 30 * gr];
    }
    if (y > horizon) { // the lake: the sky upside down, darker, with ripples
      const yy = 2 * horizon - y + 3 * Math.sin(y * 0.9 + x * 0.05);
      const dd = Math.hypot(x - sun[0], yy - sun[1]);
      const k = 0.55 + 0.1 * Math.sin(y * 1.3);
      const sh = Math.exp(-((dd / (2.2 * R)) ** 2)), rp = ripple(x / 10, y / 1.6) - 0.5;
      c = [70 + 120 * k * sh + 60 * rp * (0.4 + sh), 60 + 80 * k * sh + 40 * rp * (0.4 + sh), 70 + 30 * rp];
    }
    // A house with a lit window: sharp straight edges, the hardest thing for waves
    const hx = 0.2 * w, hy = horizon - 0.02 * h;
    if (x > hx && x < hx + 0.12 * w && y > hy - 0.1 * h && y < hy) c = [24, 20, 28];
    if (y < hy - 0.1 * h && y > hy - 0.17 * h && Math.abs(x - hx - 0.06 * w) < (y - (hy - 0.17 * h)) * 0.95) c = [24, 20, 28];
    if (x > hx + 0.04 * w && x < hx + 0.07 * w && y > hy - 0.07 * h && y < hy - 0.035 * h) c = [255, 200, 90];
    const n = 14 * (grain(x * 1.7, y * 1.7) - 0.5);
    r[i] = Math.max(0, Math.min(255, c[0] + n)); g[i] = Math.max(0, Math.min(255, c[1] + n)); b[i] = Math.max(0, Math.min(255, c[2] + n));
  }
  return { w, h, r, g, b };
}
