// Topic player: the story on the left, the live scene on the right (on top on phones).
// Scrolling to a step moves the scene to that step's state: parameters, visible objects, view, camera.
// A step may ask a question first ("predict, then check"): the answer is shown on the scene by
// check.reveal(scene, stage) only after the student has made a guess. A hint opens on demand.

import { Scene } from '../core/scene.js';
import { Stage } from '../ui/stage.js';
import { paramControl } from '../ui/params.js';
import { renderTex, renderMath } from '../ui/tex.js';
import { t } from '../core/i18n.js';
import { fmt } from '../core/numeric.js';
import { SUBJECTS, TRACKS, topicMeta, loadTopic } from '../topics/index.js';
import { encodeLab } from './lab.js';
import { taskHTML, bindTask } from '../ui/task.js';

const PRACTICE = {
  title: { en: 'Try it yourself', ru: 'Попробуйте сами' },
  text: {
    en: 'Build it on the scene and press Check. A mistake is not a failure: the program says what exactly differs and where to look again.',
    ru: 'Постройте на сцене и нажмите Check. Ошибка — не провал: программа скажет, что именно не так и куда вернуться.',
  },
};

const chip = id => {
  const m = topicMeta(id);
  if (!m) return '';
  return m.status === 'ready'
    ? `<a class="chip" href="#topic/${id}">${t(m.title)}</a>`
    : `<span class="chip planned" title="Planned">${t(m.title)}</span>`;
};

export async function mountTopic(root, id) {
  const meta = topicMeta(id);
  const topic = meta && meta.status === 'ready' ? await loadTopic(id) : null;
  if (!topic) {
    root.innerHTML = `<div class="empty"><h1>${meta ? t(meta.title) : 'Not found'}</h1><p>${meta ? 'This topic is planned.' : ''}</p><a href="#">← Back to the map</a></div>`;
    return () => {};
  }

  const scene = new Scene();
  topic.setup(scene);
  const track = TRACKS.find(tr => tr.id === meta.track);

  root.innerHTML = `
    <article class="topic">
      <div class="topic-text">
        <header class="topic-head">
          <div class="crumbs"><a href="#">Map</a><span>/</span><span>${t(SUBJECTS.find(x => x.id === track.subject).title)}</span><span>/</span><span>${t(track.title)}</span></div>
          <h1>${t(meta.title)}</h1>
          <p class="lead">${t(meta.summary)}</p>
          ${meta.prereqs && meta.prereqs.length ? `<div class="prereqs"><span class="label">Builds on</span>${meta.prereqs.map(chip).join('')}</div>` : ''}
        </header>
        <div class="steps">
          ${topic.steps.map((s, i) => `
            ${s.task && !(topic.steps[i - 1] || {}).task ? `<div class="practice-head"><h2>${t(PRACTICE.title)}</h2><p>${t(PRACTICE.text)}</p></div>` : ''}
            <section class="step${s.task ? ' task-step' : ''}" data-i="${i}">
              <div class="step-num">${s.task ? `Task ${topic.steps.slice(0, i + 1).filter(x => x.task).length}` : String(i + 1).padStart(2, '0')}</div>
              <h2>${t(s.title)}</h2>
              <div class="step-text">${t(s.text)}</div>
              ${s.try ? `<p class="try"><span class="try-label">Try</span>${t(s.try)}</p>` : ''}
              ${s.task ? taskHTML(s.task) : ''}
              ${s.check ? `
                <div class="check">
                  <span class="check-label">Predict, then check</span>
                  <div class="check-q">${t(s.check.q)}</div>
                  <div class="check-options">${s.check.options.map((o, k) => `<button type="button" data-k="${k}">${t(o.text)}</button>`).join('')}</div>
                  <div class="check-explain"></div>
                </div>` : ''}
              ${s.hint ? `<details class="hint"><summary>${t(s.hint.title) || 'Stuck? Open a hint'}</summary><div class="hint-body">${t(s.hint.text || s.hint)}</div></details>` : ''}
            </section>`).join('')}
          <section class="step end">
            <h2>Where next</h2>
            <div class="next-list">${(meta.next || []).map(chip).join('')}</div>
            <p><a href="#">← Back to the map</a></p>
          </section>
        </div>
      </div>
      <aside class="topic-stage">
        <div class="stage-host"></div>
        <div class="stage-under">
          <div class="legend"></div>
          <div class="controls"></div>
          <div class="stage-nav">
            <button class="ghost" data-nav="-1" aria-label="Previous step">←</button>
            <span class="counter"></span>
            <button class="ghost" data-nav="1" aria-label="Next step">→</button>
            <span class="spacer"></span>
            ${topic.lab === false ? '' : '<button class="ghost" data-act="lab">Open in Lab</button>'}
          </div>
        </div>
      </aside>
    </article>`;
  renderMath(root.querySelector('.topic-text'));

  const $ = s => root.querySelector(s);
  const stage = new Stage($('.stage-host'), scene, { mode: topic.view, view2d: topic.view2d, view3d: topic.view3d });
  const steps = [...root.querySelectorAll('.step[data-i]')];
  const legendEl = $('.legend'), controlsEl = $('.controls');

  // ---- Legend: formulas of what is on the stage, in the colors of the objects, with live numbers ----
  let legendKey = '';
  const updateLegend = () => {
    const scope = scene.scope();
    const entries = [
      ...scene.items.filter(i => i.visible && i.legend && i.info.tex && i.info.kind !== 'param').map(i => `\\textcolor{${i.color}}{${i.info.tex}}`),
      ...scene.custom.filter(c => c.visible && c.legend).map(c => c.legend({ ...scope }, scene)),
    ];
    const key = entries.join('|');
    if (key === legendKey) return;
    legendKey = key;
    legendEl.innerHTML = entries.map(() => '<div class="legend-row"></div>').join('');
    [...legendEl.children].forEach((el, i) => renderTex(el, `\\displaystyle ${entries[i]}`));
  };

  // ---- Parameter controls of the current step ----
  let controls = [];
  const setControls = names => {
    controlsEl.innerHTML = '';
    controls = names.filter(n => scene.params.has(n)).map(n => paramControl(scene, n));
    controls.forEach(c => controlsEl.appendChild(c.el));
  };

  const off = scene.on(() => {
    updateLegend();
    controls.forEach(c => c.update());
  });

  // ---- Steps ----
  let active = -1;
  const apply = i => {
    if (i === active) return;
    active = i;
    steps.forEach((el, k) => el.classList.toggle('active', k === i));
    $('.counter').textContent = `${i + 1} / ${steps.length}`;
    const step = topic.steps[i], st = step.state || {};

    for (const p of scene.params.values()) p.playing = false;
    if (st.view) stage.setMode(st.view);
    if (st.show) scene.showOnly(st.show);
    if (st.params) scene.animateParams(st.params, st.ms || 1000);
    if (st.window && stage.p2) stage.p2.setView(typeof st.window === 'function' ? st.window(scene) : st.window, st.windowMs || 1200);
    if (st.camera && stage.p3) stage.p3.setCamera(st.camera);
    if (stage.p3) stage.p3.autoRotate(!!st.rotate);
    (st.play || []).forEach(name => scene.play(name, true));
    setControls(st.controls || topic.controls || []);
    if (step.enter) step.enter(scene, stage);
    if (answered.has(i) && step.check.reveal) step.check.reveal(scene, stage);
    if (tasks[i]) tasks[i].enter();
    // In a task the Lab would show the formula of the goal graph — the answer
    const labBtn = $('[data-act=lab]');
    if (labBtn) labBtn.hidden = !!step.task;
    scene.changed();
  };

  // ---- Tasks: built on the scene, checked, mistakes explained ----
  const goto = k => steps[k].scrollIntoView({ behavior: 'smooth', block: matchMedia('(max-width: 900px)').matches ? 'end' : 'center' });
  const tasks = steps.map((el, i) => topic.steps[i].task
    ? bindTask(el, topic.steps[i].task, i, { scene, goto, stepLabel: k => `${k + 1}. ${t(topic.steps[k].title)}` })
    : null);

  // ---- Questions: one guess, then the explanation and the answer on the scene ----
  const answered = new Set();
  steps.forEach((el, i) => {
    const check = topic.steps[i].check;
    if (!check) return;
    const box = el.querySelector('.check'), explain = box.querySelector('.check-explain');
    box.querySelectorAll('button[data-k]').forEach(b => b.addEventListener('click', () => {
      if (answered.has(i)) return;
      answered.add(i);
      const k = +b.dataset.k, ok = !!check.options[k].ok;
      box.querySelectorAll('button[data-k]').forEach(o => {
        o.disabled = true;
        if (check.options[+o.dataset.k].ok) o.classList.add('right');
      });
      if (!ok) b.classList.add('wrong');
      box.classList.add('answered');
      explain.innerHTML = `<span class="verdict ${ok ? 'right' : 'wrong'}">${ok ? 'Right.' : 'Not quite.'}</span> ${t(check.explain)}`;
      renderMath(explain);
      if (i === active && check.reveal) { check.reveal(scene, stage); scene.changed(); }
    }));
  });

  // The active step is the last one whose top passed the reading line
  const pick = () => {
    const line = window.innerHeight * (matchMedia('(max-width: 900px)').matches ? 0.78 : 0.5);
    let i = 0;
    steps.forEach((el, k) => { if (el.getBoundingClientRect().top < line) i = k; });
    apply(i);
  };
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; pick(); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  root.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => {
    const next = Math.max(0, Math.min(steps.length - 1, active + +b.dataset.nav));
    steps[next].scrollIntoView({ behavior: 'smooth', block: matchMedia('(max-width: 900px)').matches ? 'end' : 'center' });
  }));

  // The current scene, editable, in the Lab
  if (topic.lab !== false) $('[data-act=lab]').addEventListener('click', () => {
    const used = new Set();
    // The user's functions (f(x) = …) go along even when hidden: the visible lines may use them
    const items = scene.items.filter(i => (i.visible || i.info.name) && i.info.kind !== 'error').map(i => {
      (i.info.params || []).forEach(p => used.add(p));
      return i.text;
    });
    used.forEach(name => items.push(`${name} = ${fmt(scene.params.get(name).value)}`));
    location.hash = `#lab?s=${encodeLab({ items, mode: stage.mode })}`;
  });

  pick();

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    off();
    stage.dispose();
    scene.dispose();
  };
}
