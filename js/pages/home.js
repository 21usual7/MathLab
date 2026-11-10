// Home: a live scene, the principles, and the map of topics by tracks

import { Scene } from '../core/scene.js';
import { Stage } from '../ui/stage.js';
import { renderTex } from '../ui/tex.js';
import { t } from '../core/i18n.js';
import { TRACKS, CATALOG, topicMeta } from '../topics/index.js';

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
  map: {
    en: 'Topics are connected: each one says what it builds on. Two are ready, the rest are on the way.',
    ru: 'Темы связаны: у каждой написано, на чём она построена. Две готовы, остальные в пути.',
  },
};

export function mountHome(root) {
  root.innerHTML = `
    <div class="home">
      <section class="hero">
        <div class="hero-text">
          <p class="eyebrow">Interactive mathematics</p>
          <h1>See the idea.<br><em>Then</em> the formula.</h1>
          <p class="lead">${t(TEXT.lead)}</p>
          <div class="cta">
            <a class="btn primary" href="#topic/derivative">Start with the derivative</a>
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

      <section class="map" id="map">
        <div class="section-head"><h2>Map</h2><p>${t(TEXT.map)}</p></div>
        <div class="tracks">
          ${TRACKS.map(tr => `
            <div class="track">
              <h3>${t(tr.title)}</h3>
              ${CATALOG.filter(m => m.track === tr.id).map(m => {
                const needs = (m.prereqs || []).map(id => t(topicMeta(id).title)).join(', ');
                const inner = `<span class="node-title">${t(m.title)}</span>
                  ${m.status === 'ready' ? `<span class="node-meta">${m.minutes} min</span>` : '<span class="node-meta">planned</span>'}
                  ${needs ? `<span class="node-needs">← ${needs}</span>` : ''}`;
                return m.status === 'ready'
                  ? `<a class="node ready" href="#topic/${m.id}">${inner}</a>`
                  : `<div class="node planned">${inner}</div>`;
              }).join('')}
            </div>`).join('')}
        </div>
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
