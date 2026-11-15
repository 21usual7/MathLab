// Home: a live scene, the principles, and the map of topics by tracks

import { Scene } from '../core/scene.js';
import { Stage } from '../ui/stage.js';
import { renderTex } from '../ui/tex.js';
import { t } from '../core/i18n.js';
import { SUBJECTS, TRACKS, CATALOG, topicMeta } from '../topics/index.js';
import { WORLDS } from '../worlds/index.js';
import { solvedIn } from './world.js';

const TEXT = {
  lead: {
    en: 'An interactive place to finally understand the math that broke somewhere around grade 10. Every idea is a living scene: formulas, graphs and 3D views that move together — and that you can take apart yourself.',
    ru: 'Интерактивное место, где наконец становится понятной математика, которая «сломалась» где-то в 10 классе. Каждая идея — живая сцена: формулы, графики и 3D, которые движутся вместе, и которые можно разобрать самому.',
  },
  principles: [
    { title: { en: 'One idea, many views', ru: 'Одна идея — много взглядов' },
      text: { en: 'A formula, its graph and its 3D shape are the same thing seen from different sides — linked and colored alike.', ru: 'Формула, её график и её 3D-форма — одно и то же с разных сторон: они связаны и окрашены одинаково.' } },
    { title: { en: 'Everything is alive', ru: 'Всё живое' },
      text: { en: 'Any number can become a parameter. Drag it, press ▶, and watch what it really does.', ru: 'Любое число можно сделать параметром. Потяните его, нажмите ▶ и посмотрите, что оно на самом деле делает.' } },
    { title: { en: 'Back to the cause', ru: 'Назад к причине' },
      text: { en: 'Topics are connected. If something is unclear, step back to what it is built on.', ru: 'Темы связаны. Если что-то непонятно, можно шагнуть назад — к тому, на чём это построено.' } },
  ],
  worlds: {
    en: 'Not pages to read, but systems to play with. The mathematics is the mechanics: you shoot, descend, vaccinate — and the rule shows itself. Free exploration and challenges with a concrete goal.',
    ru: 'Не страницы для чтения, а системы, с которыми можно играть. Математика здесь — сама механика: вы бьёте, спускаетесь, прививаете — и закон проявляется сам. Свободное исследование и испытания с конкретной целью.',
  },
  map: {
    en: n => `Topics are connected: each one says what it builds on. ${n} are ready, the rest are on the way.`,
    ru: n => `Темы связаны: у каждой написано, на чём она построена. Готово: ${n}, остальные в пути.`,
  },
};

// Small drawings on the world cards: a path between the foci of an ellipse, level lines with a descent, cells of an outbreak
const ART = {
  billiard: `<svg viewBox="0 0 240 120" aria-hidden="true"><ellipse cx="120" cy="60" rx="104" ry="50" fill="none" stroke="#b69df8" stroke-width="2"/>
    <polyline points="37,60 70,15 203,60 150,108 37,60 96,11 203,60" fill="none" stroke="#f4d35e" stroke-width="1.6" opacity="0.85"/>
    <circle cx="37" cy="60" r="4" fill="#58c4dd"/><circle cx="203" cy="60" r="4" fill="#fc6255"/></svg>`,
  descent: `<svg viewBox="0 0 240 120" aria-hidden="true">${[14, 28, 42, 56, 70].map(r => `<ellipse cx="150" cy="64" rx="${r * 1.5}" ry="${r * 0.62}" fill="none" stroke="#58c4dd" stroke-opacity="${0.75 - r / 120}" stroke-width="1.4"/>`).join('')}
    <polyline points="40,22 70,60 92,38 112,70 128,52 140,66 150,64" fill="none" stroke="#f4d35e" stroke-width="2"/><circle cx="150" cy="64" r="4" fill="#f4d35e"/></svg>`,
  epidemic: `<svg viewBox="0 0 240 120" aria-hidden="true">${Array.from({ length: 96 }, (_, i) => {
    const x = i % 16, y = Math.floor(i / 16), d = Math.hypot(x - 5, (y - 2.5) * 1.3), h = (Math.sin(i * 12.9898) * 43758.5) % 1;
    const c = d < 2.2 ? '#ff9f5a' : d < 4.2 && Math.abs(h) < 0.7 ? '#fc6255' : Math.abs(h) < 0.12 ? '#58c4dd' : '#222a37';
    return `<rect x="${8 + x * 14}" y="${8 + y * 17}" width="11" height="14" rx="2" fill="${c}" opacity="${c === '#fc6255' ? 0.55 : 1}"/>`;
  }).join('')}</svg>`,
};

// One topic on the map: a link when it is ready, a dashed card when it is planned
function node(m) {
  const needs = (m.prereqs || []).map(id => t(topicMeta(id).title)).join(', ');
  const inner = `<span class="node-title">${t(m.title)}</span>
    ${m.status === 'ready' ? `<span class="node-meta">${m.minutes} min</span>` : '<span class="node-meta">planned</span>'}
    ${needs ? `<span class="node-needs">← ${needs}</span>` : ''}`;
  return m.status === 'ready' ? `<a class="node ready" href="#topic/${m.id}">${inner}</a>` : `<div class="node planned">${inner}</div>`;
}

export function mountHome(root) {
  root.innerHTML = `
    <div class="home">
      <section class="hero">
        <div class="hero-text">
          <p class="eyebrow">Interactive mathematics</p>
          <h1>See the idea.<br><em>Then</em> the formula.</h1>
          <p class="lead">${t(TEXT.lead)}</p>
          <div class="cta">
            <a class="btn primary" href="#topic/graph">Start from the beginning</a>
            <a class="btn" href="#worlds">Enter a world</a>
            <a class="btn" href="#lab">Open the Lab</a>
          </div>
        </div>
        <div class="hero-visual">
          <div class="stage-host"></div>
          <div class="hero-formula"></div>
        </div>
      </section>

      <section class="principles">
        ${TEXT.principles.map((p, i) => `
          <div class="principle"><span class="num">0${i + 1}</span><h3>${t(p.title)}</h3><p>${t(p.text)}</p></div>`).join('')}
      </section>

      <section class="worlds" id="worlds">
        <div class="section-head"><h2>Worlds</h2><p>${t(TEXT.worlds)}</p></div>
        <div class="world-cards">
          ${WORLDS.map(w => `
            <a class="world-card" href="#world/${w.id}">
              <span class="world-art">${ART[w.id] || ''}</span>
              <span class="world-kicker">${t(w.kicker)}</span>
              <span class="world-title">${t(w.title)}</span>
              <span class="world-summary">${t(w.summary)}</span>
              <span class="node-meta">${w.minutes} min${solvedIn(w.id).length ? ` · ✓ ${solvedIn(w.id).length}` : ''}</span>
            </a>`).join('')}
        </div>
      </section>

      <section class="map" id="map">
        <div class="section-head"><h2>Map</h2><p>${t(TEXT.map)(CATALOG.filter(m => m.status === 'ready').length)}</p></div>
        ${SUBJECTS.map(sub => {
          const tracks = TRACKS.filter(tr => tr.subject === sub.id);
          const ready = CATALOG.filter(m => tracks.some(tr => tr.id === m.track) && m.status === 'ready').length;
          return `
          <div class="subject" id="${sub.id}">
            <div class="subject-head"><h3>${t(sub.title)}</h3><span>${ready} ready</span></div>
            <div class="tracks" style="--cols: ${tracks.length}">
              ${tracks.map(tr => `
                <div class="track">
                  <h3>${t(tr.title)}</h3>
                  ${CATALOG.filter(m => m.track === tr.id).map(node).join('')}
                </div>`).join('')}
            </div>
          </div>`;
        }).join('')}
      </section>

      <footer class="foot">MathLab · <a href="#lab">Lab</a> · <a href="https://github.com/21usual7/MathLab">GitHub</a></footer>
    </div>`;

  // A breathing ripple: z = 2 cos(1.4 r − p) · e^(−r²/10)
  const scene = new Scene();
  scene.ensureParam('p', 0, { min: 0, max: 2 * Math.PI });
  scene.add('z = 2 cos(1.4 sqrt(x^2 + y^2) - p) e^(-(x^2 + y^2)/10)', { color: 'blue' });
  scene.add('(3.6 cos(t), 3.6 sin(t), 0)', { color: 'yellow' });
  scene.play('p', true);
  const stage = new Stage(root.querySelector('.hero-visual .stage-host'), scene, {
    mode: '3d',
    view3d: { R: 4, zmax: 3, camera: [7.5, -8.5, 5.5] },
  });
  stage.p3.autoRotate(true);
  renderTex(root.querySelector('.hero-formula'), '\\blue{z = 2\\cos\\!\\left(1.4\\sqrt{x^2 + y^2} - p\\right) e^{-\\frac{x^2 + y^2}{10}}}');

  return () => {
    stage.dispose();
    scene.dispose();
  };
}
