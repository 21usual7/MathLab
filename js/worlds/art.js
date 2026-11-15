import { actor, envelope } from './crypto/ui.js';
import { CRYPTO_WORLDS } from './crypto/catalog.js';

// Small drawings on the cards of the worlds (inline SVG: no requests, sharp at any size)

export const ART = {
  'binary-search': `<svg viewBox="0 0 240 120" aria-hidden="true"><path d="M24 25H216M72 48H216M72 71H144" fill="none" stroke="#58c4dd" stroke-width="3"/>${[1, 3, 3, 6, 8, 12].map((v, i) => `<rect x="${22 + 33 * i}" y="86" width="29" height="24" rx="4" fill="${i === 3 ? '#574923' : '#172d3d'}"/><text x="${36 + 33 * i}" y="103" text-anchor="middle" font-size="13" fill="#f4d35e">${v}</text>`).join('')}<path d="M135 15V77" stroke="#f4d35e" stroke-width="2" stroke-dasharray="4 4"/></svg>`,
  billiard: `<svg viewBox="0 0 240 120" aria-hidden="true"><ellipse cx="120" cy="60" rx="104" ry="50" fill="none" stroke="#b69df8" stroke-width="2"/>
    <polyline points="37,60 70,15 203,60 150,108 37,60 96,11 203,60" fill="none" stroke="#f4d35e" stroke-width="1.6" opacity="0.85"/>
    <circle cx="37" cy="60" r="4" fill="#58c4dd"/><circle cx="203" cy="60" r="4" fill="#fc6255"/></svg>`,
  descent: `<svg viewBox="0 0 240 120" aria-hidden="true">${[14, 28, 42, 56, 70].map(r => `<ellipse cx="150" cy="64" rx="${r * 1.5}" ry="${r * 0.62}" fill="none" stroke="#58c4dd" stroke-opacity="${0.75 - r / 120}" stroke-width="1.4"/>`).join('')}
    <polyline points="40,22 70,60 92,38 112,70 128,52 140,66 150,64" fill="none" stroke="#f4d35e" stroke-width="2"/><circle cx="150" cy="64" r="4" fill="#f4d35e"/></svg>`,
  // An 8×8 block and the waves it is made of
  jpeg: `<svg viewBox="0 0 240 120" aria-hidden="true">${Array.from({ length: 64 }, (_, i) => {
    const x = i % 8, y = Math.floor(i / 8), v = Math.round(128 + 90 * Math.cos((2 * x + 1) * Math.PI / 16) * Math.cos((2 * y + 1) * 2 * Math.PI / 16));
    return `<rect x="${20 + x * 11}" y="${16 + y * 11}" width="11" height="11" fill="rgb(${v},${v},${v})"/>`;
  }).join('')}<text x="122" y="66" fill="#8b95a7" font-size="22" font-family="Fraunces, serif">=</text>
    ${[0, 1, 2].map(k => `<g transform="translate(${146 + k * 30} 40)">${Array.from({ length: 16 }, (_, i) => {
      const x = i % 4, y = Math.floor(i / 4), v = Math.round(128 + 110 * Math.cos((2 * x + 1) * k * Math.PI / 8) * Math.cos((2 * y + 1) * (k === 2 ? 1 : 0) * Math.PI / 8));
      return `<rect x="${x * 6}" y="${y * 6}" width="6" height="6" fill="rgb(${v},${Math.round(v * 0.95)},${Math.min(255, v + 20)})"/>`;
    }).join('')}</g>`).join('<text fill="#8b95a7" font-size="14"> </text>')}
    <text x="166" y="88" fill="#8b95a7" font-size="13" font-family="Inter, sans-serif">+  +  …</text></svg>`,
  // A little web: circles sized by rank and arrows between them
  pagerank: `<svg viewBox="0 0 240 120" aria-hidden="true"><defs><marker id="pr-a" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L6 3L0 6z" fill="#8b95a7"/></marker></defs>
    ${[[60, 40, 150, 32], [150, 32, 196, 80], [196, 80, 104, 92], [104, 92, 60, 40], [44, 92, 104, 92], [150, 32, 104, 92]].map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${a + (c - a) * 0.78}" y2="${b + (d - b) * 0.78}" stroke="#8b95a7" stroke-width="1.4" marker-end="url(#pr-a)"/>`).join('')}
    ${[[60, 40, 12], [150, 32, 18], [196, 80, 10], [104, 92, 15], [44, 92, 6]].map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${i === 4 ? '#5cd0b3' : '#58c4dd'}"/>`).join('')}
    <circle cx="128" cy="62" r="4" fill="#f4d35e"/></svg>`,
  epidemic: `<svg viewBox="0 0 240 120" aria-hidden="true">${Array.from({ length: 96 }, (_, i) => {
    const x = i % 16, y = Math.floor(i / 16), d = Math.hypot(x - 5, (y - 2.5) * 1.3), h = (Math.sin(i * 12.9898) * 43758.5) % 1;
    const c = d < 2.2 ? '#ff9f5a' : d < 4.2 && Math.abs(h) < 0.7 ? '#fc6255' : Math.abs(h) < 0.12 ? '#58c4dd' : '#222a37';
    return `<rect x="${8 + x * 14}" y="${8 + y * 17}" width="11" height="14" rx="2" fill="${c}" opacity="${c === '#fc6255' ? 0.55 : 1}"/>`;
  }).join('')}</svg>`,
};

for (const [i, world] of CRYPTO_WORLDS.entries()) {
  ART[world.id] = `<svg viewBox="0 0 240 120" aria-hidden="true"><path d="M60 42H180M120 42V85" fill="none" stroke="#5f7389" stroke-dasharray="3 4"/>${actor('alice', 30, 43, .38)}${actor('bob', 210, 43, .38)}${actor('eve', 120, 87, .23)}<g transform="translate(100 42) scale(.6)">${envelope}</g><text x="157" y="90" fill="${i % 2 ? '#b69df8' : '#f4d35e'}" font-size="18" font-family="monospace">${({ 'crypto-xor': '⊕', 'crypto-tamper': 'Δ', 'crypto-mitm': 'A↔B', 'crypto-hashes': 'H(x)', 'crypto-signatures': '(r,s)', 'crypto-passwords': 'p(x)', 'crypto-channel': '✓' })[world.id]}</text></svg>`;
}

ART['crypto-hashes'] = `<svg viewBox="0 0 240 120" aria-hidden="true"><path d="M34 35H77M34 80H77" stroke="#58c4dd" stroke-width="2"/><rect x="77" y="20" width="66" height="78" rx="10" fill="#172d3d" stroke="#58c4dd"/><text x="110" y="66" text-anchor="middle" fill="#f4d35e" font-size="24" font-family="serif">H</text>${Array.from({length:32},(_,i)=>`<rect x="${160+(i%8)*8}" y="${35+Math.floor(i/8)*12}" width="5" height="8" rx="1" fill="${i%3?'#58c4dd':'#ff9f5a'}"/>`).join('')}<text x="12" y="40" fill="#b9c1cd" font-size="12">M</text><text x="12" y="84" fill="#ff9f5a" font-size="12">M′</text></svg>`;
