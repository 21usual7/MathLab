// Lab: a free canvas. Any number of functions, surfaces, curves, points and parameters; 2D, 3D or both.
// The state can be shared as a link: #lab?s=<base64 of { items, params, mode }>

import { Scene } from '../core/scene.js';
import { Stage } from '../ui/stage.js';
import { ExprList } from '../ui/exprlist.js';
import { is3D } from '../views/draw.js';

const DEFAULT = {
  items: ['y = a sin(b x)', 'z = a sin(x) cos(b y)', 'a = 1.5', 'b = 1'],
  mode: 'split',
};

const EXAMPLES = [
  ['Functions', ['y = x^3 - 3x', 'y = e^(-x^2)', 'y = sin(x)/x', 'y = a x^2 + b x + c']],
  ['Surfaces', ['z = x^2 - y^2', 'z = 3 e^(-(x^2 + y^2)/4)', 'z = sin(x y)', 'z = cos(sqrt(x^2 + y^2) - p)']],
  ['Curves', ['(cos(t), sin(t))', '(cos(3t), sin(2t))', '(2cos(t), 2sin(t), sin(5t))', '(t cos(t)/2, t sin(t)/2)']],
];

export function encodeLab(state) {
  const json = JSON.stringify(state);
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeLab(s) {
  try {
    const json = decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
    const state = JSON.parse(json);
    return Array.isArray(state.items) ? state : null;
  } catch (e) {
    return null;
  }
}

export function mountLab(root, query) {
  const state = (query.get('s') && decodeLab(query.get('s'))) || DEFAULT;
  const scene = new Scene();
  for (const text of state.items) scene.add(String(text));
  for (const [name, r] of Object.entries(state.params || {})) {
    const p = scene.ensureParam(name);
    Object.assign(p, { min: r.min ?? p.min, max: r.max ?? p.max });
  }

  root.innerHTML = `
    <div class="lab">
      <aside class="lab-panel">
        <div class="panel-head">
          <h1>Lab</h1>
          <p>Type anything: functions, surfaces, curves, points. Any new letter becomes a parameter — drag it or press ▶.</p>
        </div>
        <div class="list-host"></div>
        <div class="examples">${EXAMPLES.map(([group, list]) => `
          <div class="ex-group"><span>${group}</span>${list.map(e => `<button type="button" data-ex="${e}">${e}</button>`).join('')}</div>`).join('')}
        </div>
      </aside>
      <section class="lab-stage">
        <div class="stage-bar">
          <div class="seg" role="tablist">
            <button data-mode="2d">2D</button><button data-mode="3d">3D</button><button data-mode="split">2D + 3D</button>
          </div>
          <div class="spacer"></div>
          <button class="ghost" data-act="reset">Reset view</button>
          <button class="ghost" data-act="share">Share link</button>
        </div>
        <div class="stage-host"></div>
      </section>
    </div>`;

  const $ = s => root.querySelector(s);
  const stage = new Stage($('.stage-host'), scene, {
    mode: state.mode || (scene.items.some(is3D) ? 'split' : '2d'),
    view2d: { unit: 48 },
    view3d: { R: 4, zmax: 4, camera: [8, -10, 7] },
  });

  const modeButtons = root.querySelectorAll('[data-mode]');
  const setMode = m => {
    stage.setMode(m);
    modeButtons.forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  };
  setMode(stage.mode);
  modeButtons.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

  const list = new ExprList($('.list-host'), scene, {
    // The first surface or 3D curve opens the 3D view next to the 2D one
    onStructure: () => { if (stage.mode === '2d' && scene.items.some(i => i.visible && is3D(i))) setMode('split'); },
  });

  root.querySelectorAll('[data-ex]').forEach(b => b.addEventListener('click', () => list.add(b.dataset.ex)));
  $('[data-act=reset]').addEventListener('click', () => stage.reset());
  $('[data-act=share]').addEventListener('click', async e => {
    const params = {};
    for (const [name, p] of scene.params) params[name] = { min: p.min, max: p.max };
    const url = `${location.origin}${location.pathname}#lab?s=${encodeLab({ items: scene.items.map(i => i.text), params, mode: stage.mode })}`;
    history.replaceState(null, '', url);
    try {
      await navigator.clipboard.writeText(url);
      e.target.textContent = 'Link copied';
    } catch (err) {
      e.target.textContent = 'Link is in the address bar';
    }
    setTimeout(() => { e.target.textContent = 'Share link'; }, 2000);
  });

  return () => {
    list.dispose();
    stage.dispose();
    scene.dispose();
  };
}
