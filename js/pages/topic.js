// Topic player, one step at a time like slides: on the left a panel with the step — text, the live formulas,
// the sliders it talks about, a question or a task — and Back / Next; on the right the live scene
// (on phones: the scene on top, the panel under it). Each step sets the scene's state: parameters,
// visible objects, view, camera. The step is kept in the address (#topic/<id>/<n>), so a reload or a
// shared link opens the same step.
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

export async function mountTopic(root, id, startStep = 0) {
  const meta = topicMeta(id);
  const topic = meta && meta.status === 'ready' ? await loadTopic(id) : null;
  if (!topic) {
    root.innerHTML = `<div class="empty"><h1>${meta ? t(meta.title) : 'Not found'}</h1><p>${meta ? 'This topic is planned.' : ''}</p><a href="#">← Back to the map</a></div>`;
    return () => {};
  }

  const scene = new Scene();
  topic.setup(scene);
  const track = TRACKS.find(tr => tr.id === meta.track);
  const subject = SUBJECTS.find(x => x.id === track.subject);
  const N = topic.steps.length;
  const taskNo = i => topic.steps.slice(0, i + 1).filter(x => x.task).length;

  root.innerHTML = `
    <article class="topic">
      <section class="panel">
        <div class="panel-top">
          <div class="crumbs"><a href="#${subject.id}">${t(subject.title)}</a><span>/</span><span>${t(track.title)}</span></div>
          <div class="dots" role="tablist">
            ${topic.steps.map((s, i) => `<button type="button" class="dot${s.task ? ' is-task' : ''}" data-go="${i}" title="${i + 1}. ${t(s.title).replace(/"/g, '&quot;')}" aria-label="Step ${i + 1}"></button>`).join('')}
            <span class="counter"></span>
          </div>
        </div>

        <div class="panel-body">
          <header class="topic-head">
            <h1>${t(meta.title)}</h1>
            <p class="lead">${t(meta.summary)}</p>
            ${meta.prereqs && meta.prereqs.length ? `<div class="prereqs"><span class="label">Builds on</span>${meta.prereqs.map(chip).join('')}</div>` : ''}
          </header>
          ${topic.steps.map((s, i) => `
            <section class="step${s.task ? ' task-step' : ''}" data-i="${i}" hidden>
              ${s.task && taskNo(i) === 1 ? `<div class="practice-head"><h2>${t(PRACTICE.title)}</h2><p>${t(PRACTICE.text)}</p></div>` : ''}
              <div class="step-num">${s.task ? `Task ${taskNo(i)}` : String(i + 1).padStart(2, '0')}</div>
              <h2>${t(s.title)}</h2>
              <div class="step-text">${t(s.text)}</div>
              <div class="live-slot"></div>
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
          <section class="step end" data-i="${N}" hidden>
            <div class="step-num">✓</div>
            <h2>${t({ en: 'Where next', ru: 'Куда дальше' })}</h2>
            <div class="next-list">${(meta.next || []).map(chip).join('')}</div>
            <p><a href="#${subject.id}">← ${t({ en: 'Back to the map', ru: 'Назад к карте' })}</a></p>
          </section>
          <div class="live">
            <div class="legend"></div>
            <div class="controls"></div>
          </div>
        </div>

        <nav class="panel-nav">
          <button type="button" class="btn" data-nav="-1">← Back</button>
          <button type="button" class="btn primary" data-nav="1">Next →</button>
        </nav>
      </section>

      <aside class="topic-stage">
        <div class="stage-host"></div>
        ${topic.lab === false ? '' : '<button class="ghost stage-lab" data-act="lab">Open in Lab</button>'}
      </aside>
    </article>`;
  renderMath(root.querySelector('.panel-body'));

  const $ = s => root.querySelector(s);
  const stage = new Stage($('.stage-host'), scene, { mode: topic.view, view2d: topic.view2d, view3d: topic.view3d });
  const sections = [...root.querySelectorAll('.step[data-i]')]; // N steps + the end
  const live = $('.live'), legendEl = $('.legend'), controlsEl = $('.controls');
  const body = $('.panel-body');

  // ---- Legend: formulas of what is on the stage, in the colors of the objects, with live numbers ----
  let legendKey = '';
  const updateLegend = () => {
    const scope = scene.scope();
    const entries = [
      ...scene.items.filter(i => i.visible && i.legend && i.info.tex && i.info.kind !== 'param').map(i => `\\textcolor{${i.color}}{${i.info.tex}}`),
      ...scene.custom.filter(c => c.visible && c.legend).map(c => c.legend({ ...scope }, scene)).filter(Boolean),
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
  const answered = new Set();
  let tasks = [];

  const show = i => {
    i = Math.max(0, Math.min(N, i));
    if (i === active) return;
    const back = i < active;
    active = i;
    sections.forEach((el, k) => { el.hidden = k !== i; });
    $('.topic-head').hidden = i !== 0;
    root.querySelectorAll('.dot').forEach((d, k) => {
      d.classList.toggle('current', k === i);
      d.classList.toggle('done', k < i);
      d.classList.toggle('solved', !!(tasks[k] && tasks[k].solved));
    });
    $('.counter').textContent = i < N ? `${i + 1} / ${N}` : `${N} / ${N}`;
    $('[data-nav="-1"]').disabled = i === 0;
    const next = $('[data-nav="1"]');
    next.hidden = i === N;
    next.textContent = i === N - 1 ? `${t({ en: 'Finish', ru: 'Готово' })} ✓` : `${t({ en: 'Next', ru: 'Далее' })} →`;
    $('[data-nav="-1"]').textContent = `← ${t({ en: 'Back', ru: 'Назад' })}`;
    sections[i].classList.remove('enter', 'enter-back');
    void sections[i].offsetWidth; // restart the entry animation
    sections[i].classList.add(back ? 'enter-back' : 'enter');
    body.scrollTop = 0;
    // On a phone the page itself scrolls: come back to the start of the new step (the scene stays on top)
    if (active !== -1 && matchMedia('(max-width: 900px)').matches && window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', `#topic/${id}${i ? `/${i + 1}` : ''}`);

    if (i === N) { live.hidden = true; return; } // "Where next" keeps the last scene
    live.hidden = false;
    sections[i].querySelector('.live-slot').appendChild(live);

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
    legendKey = '';
    scene.changed();
  };

  // ---- Tasks: built on the scene, checked, mistakes explained ----
  tasks = topic.steps.map((s, i) => s.task
    ? bindTask(sections[i], s.task, i, { scene, goto: show, stepLabel: k => `${k + 1}. ${t(topic.steps[k].title)}` })
    : null);
  // A solved task is marked on its dot
  root.addEventListener('click', e => {
    if (e.target.closest('.task')) setTimeout(() => root.querySelectorAll('.dot').forEach((d, k) => d.classList.toggle('solved', !!(tasks[k] && tasks[k].solved))), 0);
  });

  // ---- Questions: one guess, then the explanation and the answer on the scene ----
  sections.forEach((el, i) => {
    const check = i < N && topic.steps[i].check;
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

  // ---- Navigation: buttons, dots, keyboard ----
  root.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => show(active + +b.dataset.nav)));
  root.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => show(+b.dataset.go)));
  const onKey = e => {
    if (e.target.closest('input, textarea, [contenteditable]') || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); show(active + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(active - 1); }
  };
  window.addEventListener('keydown', onKey);

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

  show(Math.max(0, Math.min(N - 1, startStep)));

  return () => {
    window.removeEventListener('keydown', onKey);
    off();
    stage.dispose();
    scene.dispose();
  };
}
