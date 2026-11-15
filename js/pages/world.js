// A world: on the left the panel — what this world is, the mode (free exploration or a challenge), its goal,
// live numbers and controls; on the right the world itself on the whole remaining area. The mode is kept in
// the address (#world/<id>/<n>, 0 = free). Solved challenges are remembered in this browser.

import { t } from '../core/i18n.js';
import { renderMath } from '../ui/tex.js';
import { worldMeta, loadWorld } from '../worlds/index.js';

const KEY = 'mathlab-worlds';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
export const solvedIn = id => load()[id] || [];

const L = {
  free: { en: 'Explore', ru: 'Свободно' },
  challenge: { en: 'Challenge', ru: 'Испытание' },
  goal: { en: 'Goal', ru: 'Цель' },
  solved: { en: 'Solved', ru: 'Решено' },
  next: { en: 'Next challenge →', ru: 'Следующее испытание →' },
  free2: { en: 'Back to free exploration', ru: 'К свободному исследованию' },
  worlds: { en: 'Worlds', ru: 'Миры' },
};

export async function mountWorld(root, id, startMode = 0) {
  const meta = worldMeta(id);
  const world = meta ? await loadWorld(id) : null;
  if (!world) {
    root.innerHTML = `<div class="empty"><h1>Not found</h1><a href="#worlds">← ${t(L.worlds)}</a></div>`;
    return () => {};
  }
  const modes = world.modes;
  const tabName = (m, i) => (i === 0 ? t(L.free) : `${t(L.challenge)} ${i}`);

  root.innerHTML = `
    <article class="topic world">
      <section class="panel">
        <div class="panel-top">
          <div class="crumbs"><a href="#worlds">${t(L.worlds)}</a><span>/</span><span>${t(meta.title)}</span></div>
          <div class="modes" role="tablist">
            ${modes.map((m, i) => `<button type="button" class="mode-tab" data-m="${i}" title="${t(m.title).replace(/"/g, '&quot;')}">${tabName(m, i)}</button>`).join('')}
          </div>
        </div>
        <div class="panel-body">
          <header class="topic-head">
            <p class="world-kicker">${t(meta.kicker)}</p>
            <h1>${t(meta.title)}</h1>
          </header>
          <section class="mode-info">
            <div class="step-num"></div>
            <h2></h2>
            <div class="step-text"></div>
            <div class="goal" hidden><span class="goal-label">${t(L.goal)}</span><div class="goal-text"></div></div>
            <div class="world-status" aria-live="polite" hidden></div>
          </section>
          <div class="live world-live">
            <div class="readout"></div>
            <div class="controls"></div>
          </div>
        </div>
      </section>
      <aside class="topic-stage world-stage">
        <div class="stage-host"></div>
        <div class="world-hud" hidden></div>
      </aside>
    </article>`;

  const $ = s => root.querySelector(s);
  const info = $('.mode-info'), status = $('.world-status'), readoutEl = $('.readout'), controls = $('.controls');
  const hud = $('.world-hud'), tabs = [...root.querySelectorAll('.mode-tab')];
  let current = -1;

  const markTabs = () => {
    const done = solvedIn(id);
    tabs.forEach((b, i) => {
      b.classList.toggle('active', i === current);
      b.classList.toggle('solved', done.includes(modes[i].id));
    });
  };

  const ui = {
    host: $('.stage-host'),
    controls,
    t,
    // Live numbers: [[name, value], …]; the name may hold $…$ TeX
    readout(rows) {
      const html = rows.map(([k, v]) => `<div class="ro-k">${k}</div><div class="ro-v">${v}</div>`).join('');
      if (readoutEl.dataset.html === html) return;
      readoutEl.dataset.html = html;
      readoutEl.innerHTML = html;
      if (html.includes('$')) renderMath(readoutEl);
    },
    // A short line about how the attempt goes; kind: '' | 'fail' | 'progress'
    status(html, kind = '') {
      if (status.classList.contains('right') && kind !== 'reset') return;
      status.hidden = !html;
      status.className = `world-status ${kind}`;
      status.innerHTML = html || '';
      renderMath(status);
    },
    // A tip over the world (how to interact)
    hud(html) { hud.hidden = !html; hud.innerHTML = html || ''; renderMath(hud); },
    // The challenge is solved: remember it and show what it was about
    solve(modeId, html = '') {
      const s = load();
      s[id] = [...new Set([...(s[id] || []), modeId])];
      save(s);
      const i = modes.findIndex(m => m.id === modeId);
      const after = t(modes[i].after) || '';
      status.hidden = false;
      status.className = 'world-status right';
      status.innerHTML = `<span class="verdict right">${t(L.solved)}.</span> ${html} ${after}
        <div class="kit-row">${i + 1 < modes.length ? `<button type="button" class="btn primary" data-go="${i + 1}">${t(L.next)}</button>` : ''}
        <button type="button" class="btn" data-go="0">${t(L.free2)}</button></div>`;
      renderMath(status);
      status.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(+b.dataset.go)));
      markTabs();
    },
  };

  const inst = world.mount(ui);

  function go(i) {
    i = Math.max(0, Math.min(modes.length - 1, i));
    current = i;
    const m = modes[i];
    info.querySelector('.step-num').textContent = i === 0 ? t(L.free) : `${t(L.challenge)} ${i} / ${modes.length - 1}`;
    info.querySelector('h2').textContent = t(m.title);
    info.querySelector('.step-text').innerHTML = t(m.text);
    const goal = info.querySelector('.goal');
    goal.hidden = !m.goal;
    goal.querySelector('.goal-text').innerHTML = t(m.goal) || '';
    renderMath(info);
    status.className = 'world-status';
    status.hidden = true;
    controls.innerHTML = '';
    readoutEl.innerHTML = '';
    readoutEl.dataset.html = '';
    ui.hud('');
    markTabs();
    history.replaceState(null, '', `#world/${id}/${i}`);
    inst.setMode(m.id);
    if (window.innerWidth > 900) $('.panel-body').scrollTop = 0;
  }

  tabs.forEach(b => b.addEventListener('click', () => go(+b.dataset.m)));
  go(startMode);

  return () => inst.dispose();
}
