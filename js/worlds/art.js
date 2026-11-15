// Small drawings on the cards of the worlds (inline SVG: no requests, sharp at any size)

export const ART = {
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
