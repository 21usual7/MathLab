// A world: on the left the panel — what this world is, the mode (free exploration or a challenge), its goal,
// a «Why is it so?» tab: a proof as a run of slides on the same stage (mode.kind = 'proof', mode.slides; the world's
// slide(k) sets the stage for slide k),
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
  why: { en: 'Why it works', ru: 'Почему так' },
  proof: { en: 'Proof', ru: 'Доказательство' },
  back: { en: 'Back', ru: 'Назад' },
  nextSlide: { en: 'Next', ru: 'Далее' },
};

export async function mountWorld(root, id, startMode = 0, { signal } = {}) {
  const meta = worldMeta(id);
  const world = meta && meta.status !== 'planned' ? await loadWorld(id) : null;
  // Imports cannot be aborted; discard stale results before touching the DOM or allocating a scene.
  if (signal?.aborted) return () => {};
  if (!world) {
    root.innerHTML = meta
      ? `<div class="empty"><h1>${t(meta.title)}</h1><p>${t({ en: 'This world is on the way.', ru: 'Этот мир в работе.' })}</p><a href="#worlds/${meta.collection}">← ${t(L.worlds)}</a></div>`
      : `<div class="empty"><h1>Not found</h1><a href="#worlds">← ${t(L.worlds)}</a></div>`;
    return () => {};
  }
  const modes = world.modes;
  // Tabs: free exploration, challenges (numbered), proofs («Why it works»)
  const isProof = m => m.kind === 'proof';
  const challengeNo = i => modes.slice(1, i + 1).filter(m => !isProof(m)).length;
  const challenges = modes.slice(1).filter(m => !isProof(m)).length;
  const tabName = (m, i) => (i === 0 ? t(L.free) : isProof(m) ? `${t(L.why)}` : `${t(L.challenge)} ${challengeNo(i)}`);

  root.innerHTML = `
    <article class="topic world">
      <section class="panel">
        <div class="panel-top">
          <div class="crumbs"><a href="#worlds/${meta.collection}">${t(L.worlds)}</a><span>/</span><span>${t(meta.title)}</span></div>
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
            <div class="proof-head" hidden><span class="proof-label"></span><div class="proof-statement"></div></div>
            <div class="step-num"></div>
            <h2></h2>
            <div class="step-text"></div>
            <div class="goal" hidden><span class="goal-label">${t(L.goal)}</span><div class="goal-text"></div></div>
            <div class="proof-nav" hidden><button type="button" class="btn" data-slide="-1"></button><button type="button" class="btn primary" data-slide="1"></button></div>
            <div class="world-status" aria-live="polite" hidden></div>
            <p class="world-howto"></p>
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
  const proofHead = $('.proof-head'), proofNav = $('.proof-nav'), hud = $('.world-hud'), howto = $('.world-howto'), tabs = [...root.querySelectorAll('.mode-tab')];
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
    hud(html) {
      hud.hidden = !html; hud.innerHTML = html || ''; renderMath(hud);
      howto.innerHTML = html || ''; // on a phone the tip is shown here, not over the world
    },
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
    info.querySelector('.step-num').textContent = i === 0 ? t(L.free) : isProof(m) ? t(L.why) : `${t(L.challenge)} ${challengeNo(i)} / ${challenges}`;
    const goal = info.querySelector('.goal');
    goal.hidden = !m.goal;
    goal.querySelector('.goal-text').innerHTML = t(m.goal) || '';
    proofHead.hidden = proofNav.hidden = !isProof(m);
    if (!isProof(m)) {
      info.querySelector('h2').textContent = t(m.title);
      info.querySelector('.step-text').innerHTML = t(m.text);
      renderMath(info);
    }
    status.className = 'world-status';
    status.hidden = true;
    controls.innerHTML = '';
    readoutEl.innerHTML = '';
    readoutEl.dataset.html = '';
    ui.hud('');
    markTabs();
    history.replaceState(null, '', `#world/${id}/${i}`);
    inst.setMode(m.id);
    ui.host.scrollTop = 0; // A scrollable workshop starts each experiment at its scene.
    if (isProof(m)) slide(0);
    if (window.innerWidth > 900) $('.panel-body').scrollTop = 0;
  }

  // A proof slide: one thought in the panel, the world draws its picture
  let k = 0;
  function slide(n) {
    const m = modes[current], S = m.slides;
    k = Math.max(0, Math.min(S.length - 1, n));
    proofHead.querySelector('.proof-label').textContent = `${t(L.proof)} · ${k + 1} / ${S.length}`;
    proofHead.querySelector('.proof-statement').innerHTML = k === 0 && m.statement ? t(m.statement) : '';
    proofHead.querySelector('.proof-statement').hidden = !(k === 0 && m.statement);
    info.querySelector('h2').textContent = t(S[k].title);
    info.querySelector('.step-text').innerHTML = t(S[k].text);
    const [prev, next] = proofNav.querySelectorAll('button');
    prev.textContent = `← ${t(L.back)}`;
    prev.disabled = k === 0;
    next.textContent = k === S.length - 1 ? (current + 1 < modes.length ? t(L.next) : t(L.free2)) : `${t(L.nextSlide)} →`;
    renderMath(info);
    if (inst.slide) inst.slide(k);
  }
  proofNav.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    const S = modes[current].slides;
    if (+b.dataset.slide > 0 && k === S.length - 1) return go(current + 1 < modes.length ? current + 1 : 0);
    slide(k + +b.dataset.slide);
  }));

  tabs.forEach(b => b.addEventListener('click', () => go(+b.dataset.m)));
  go(startMode);

  return () => inst.dispose();
}
